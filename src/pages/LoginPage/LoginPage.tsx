import { Navigate, Path, useLocation } from "react-router";
import { useAuth } from "react-oidc-context";
import Loading from "../../components/Loading";

const LoginPage = () => {
  const location = useLocation();
  const currentLocationState: { from: Partial<Path> } = location.state || {
    from: { pathname: "/" },
  };

  const auth = useAuth();

  if (auth.isLoading) return <Loading />;

  if (auth.isAuthenticated)
    return <Navigate to={currentLocationState.from} replace />;

  auth.signinRedirect();

  return <></>;
};

export default LoginPage;
