import { Routes as RouterRoutes, Route } from "react-router";
import IndexPage from "../pages/IndexPage";
import PlaceSpanEquipmentPage from "../pages/PlaceSpanEquipmentPage";
import LoginPage from "../pages/LoginPage";
import IdentifyFeaturesPage from "../pages/IdentifyFeaturePage";
import WorkTaskPage from "../pages/WorkTaskPage";
import PrivateRoute from "./PrivateRoute";

const Routes = () => (
  <RouterRoutes>
    <Route
      path="/"
      element={
        <PrivateRoute roles={["reader"]}>
          <IndexPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/place-span-equipment"
      element={
        <PrivateRoute roles={["writer", "reader"]}>
          <PlaceSpanEquipmentPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/schematic-diagram/:id?"
      element={
        <PrivateRoute roles={["writer", "reader"]}>
          <IdentifyFeaturesPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/work-tasks"
      element={
        <PrivateRoute roles={["writer", "reader"]}>
          <WorkTaskPage />
        </PrivateRoute>
      }
    />
    <Route path="/login" element={<LoginPage />} />
  </RouterRoutes>
);

export default Routes;
