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

    this.router.get("/", (ctx) => this.controller.getAllTranslations(ctx));
    this.router.get("/:id", (ctx) => this.controller.getTranslation(ctx));
    this.router.get("/:artworkId/translations", (ctx) => this.controller.getTranslationByArtwork(ctx));
    this.router.post("/", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.createTranslation(ctx));
    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updateTranslation(ctx));
    this.router.delete("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deleteTranslation(ctx));
  }

  get routes() {
    return this.router;
  }
}
