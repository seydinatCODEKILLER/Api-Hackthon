import { Hono } from "hono";
import AdminController from "../controllers/AdminController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";


export default class AdminRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new AdminController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post("/", async (ctx) => this.controller.createAdmin(ctx));
  }

  get routes() {
    return this.router;
  }
}
