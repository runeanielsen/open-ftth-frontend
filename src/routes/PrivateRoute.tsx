import { ReactNode, useContext } from "react";
import { Navigate, useLocation } from "react-router";
import { UserContext, UserRolesType } from "../contexts/UserContext";
import Unauthorized from "./Unauthorized";

interface PrivateRouteParams {
  children: ReactNode;
  roles: UserRolesType[];
}

function PrivateRoute({ children, roles }: PrivateRouteParams) {
  const { hasRoles, authenticated } = useContext(UserContext);
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Has required roles we render the component.
  return hasRoles(...roles) ? <>{children}</> : <Unauthorized />;
}

export default PrivateRoute;
