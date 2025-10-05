import { Hono } from "hono";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import ArtworkMediaController from "../controllers/ArtworkMediaController.js";

export default class ArtworkMediaRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ArtworkMediaController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {

    // Ajouter un média à un artwork
    this.router.post("/:id", this.authMiddleware.protect(["admin"]) ,(ctx) => this.controller.addMedia(ctx));

    // Supprimer un média
    this.router.delete("/media/:mediaId", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deleteMedia(ctx));

    // Récupérer tous les médias d’un artwork
    this.router.get("/:artworkId/media", (ctx) => this.controller.getMediaByArtwork(ctx));
  }

  get routes() {
    return this.router;
  }
}
