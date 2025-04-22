// app/routes.ts
import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/signin", "routes/signin.tsx"),
  route("/", "routes/home.tsx")
] satisfies RouteConfig;