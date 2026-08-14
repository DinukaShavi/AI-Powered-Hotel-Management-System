import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import MainLayout from "./layouts/main.layout";
import RootLayout from "./layouts/root-layout.layout";
import HomePage from "./pages/home.page";
import HotelsPage from "./pages/hotels.page";
import HotelPage from "./pages/hotel.page";
import CreateHotelPage from "./pages/create-hotel.page";
import EditHotelPage from "./pages/edit-hotel.page";
import MyBookingsPage from "./pages/my-bookings.page";

import SignInPage from "./pages/sign-in.page";
import SignUpPage from "./pages/sign-up.page";
import ProtectedRoute from "./components/ProtectedRoute";
import { store } from "./lib/store";
import { Provider } from "react-redux";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/hotels" element={<HotelsPage />} />
              <Route path="/hotels/:id" element={<HotelPage />} />
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/hotels/create" element={<CreateHotelPage />} />
                <Route path="/hotels/:id/edit" element={<EditHotelPage />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="/my-bookings" element={<MyBookingsPage />} />
              </Route>
            </Route>
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
