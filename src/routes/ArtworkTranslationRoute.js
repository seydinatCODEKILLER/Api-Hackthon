import { Hono } from "hono";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import ArtworkTranslationController from "../controllers/ArtworkTranslationController.js";

export default class ArtworkTranslationRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ArtworkTranslationController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use("*", this.authMiddleware.protect(["admin"]));

    this.router.get("/", (ctx) => this.controller.getAllTranslations(ctx));
    this.router.get("/:id", (ctx) => this.controller.getTranslation(ctx));
    this.router.post("/", (ctx) => this.controller.createTranslation(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateTranslation(ctx));
    this.router.delete("/:id", (ctx) => this.controller.deleteTranslation(ctx));
  }

  get routes() {
    return this.router;
  }
}
