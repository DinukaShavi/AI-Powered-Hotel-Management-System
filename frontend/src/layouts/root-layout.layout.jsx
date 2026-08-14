import { useEffect } from "react";
import { Outlet } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "@/components/ui/sonner";
import { useGetCurrentUserQuery } from "@/lib/api";
import { setUser, logout } from "@/lib/features/authSlice";

const RootLayout = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  const { data, isSuccess, isError } = useGetCurrentUserQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    if (isSuccess && data) {
      dispatch(setUser(data));
    }
    if (isError) {
      dispatch(logout());
    }
  }, [isSuccess, isError, data, dispatch]);

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
};

export default RootLayout;
