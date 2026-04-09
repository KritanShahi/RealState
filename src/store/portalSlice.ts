import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "@/lib/api";
import type { Property, User } from "@/types/api";

type PortalState = {
  me: User | null;
  properties: Property[];
  favourites: string[];
  loading: boolean;
  error: string | null;
  authLoading: boolean;
  authError: string | null;
};

const initialState: PortalState = {
  me: null,
  properties: [],
  favourites: [],
  loading: false,
  error: null,
  authLoading: false,
  authError: null
};

export const fetchDashboard = createAsyncThunk(
  "portal/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const [me, properties, favourites] = await Promise.all([
        apiRequest<User>("/me"),
        apiRequest<Property[]>("/properties"),
        apiRequest<Property[]>("/favourites")
      ]);
      return { me, properties, favourites: favourites.map((item) => item.id) };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to load dashboard");
    }
  }
);

export const toggleFavourite = createAsyncThunk(
  "portal/toggleFavourite",
  async (propertyId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { portal: PortalState };
      const isFavourite = state.portal.favourites.includes(propertyId);
      await apiRequest(`/favourites/${propertyId}`, {
        method: isFavourite ? "DELETE" : "POST"
      });
      return { propertyId, isFavourite };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Action failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "portal/loginUser",
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiRequest<{ user: User }>("/auth/login", {
        method: "POST",
        body: payload
      });
      return response.user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "portal/registerUser",
  async (payload: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiRequest<{ user: User }>("/auth/register", {
        method: "POST",
        body: payload
      });
      return response.user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Registration failed");
    }
  }
);

export const logoutUser = createAsyncThunk("portal/logoutUser", async () => {
  await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
});

const portalSlice = createSlice({
  name: "portal",
  initialState,
  reducers: {
    clearMessages(state) {
      state.error = null;
      state.authError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.me = action.payload.me;
        state.properties = action.payload.properties;
        state.favourites = action.payload.favourites;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) ?? "Unable to load dashboard";
      })
      .addCase(toggleFavourite.fulfilled, (state, action) => {
        const { propertyId, isFavourite } = action.payload;
        if (isFavourite) {
          state.favourites = state.favourites.filter((id) => id !== propertyId);
        } else {
          state.favourites.push(propertyId);
        }
      })
      .addCase(toggleFavourite.rejected, (state, action) => {
        state.error = (action.payload as string) ?? "Action failed";
      })
      .addCase(loginUser.pending, (state) => {
        state.authLoading = true;
        state.authError = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.me = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authLoading = false;
        state.authError = (action.payload as string) ?? "Login failed";
      })
      .addCase(registerUser.pending, (state) => {
        state.authLoading = true;
        state.authError = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.me = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.authLoading = false;
        state.authError = (action.payload as string) ?? "Registration failed";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.me = null;
        state.favourites = [];
      });
  }
});

export const { clearMessages } = portalSlice.actions;
export default portalSlice.reducer;
