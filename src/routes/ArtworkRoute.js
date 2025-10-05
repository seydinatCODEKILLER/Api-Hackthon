import { Hono } from "hono";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import ArtworkController from "../controllers/ArtworkController.js";

export default class ArtworkRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ArtworkController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {

    // Récupérer tous les artworks avec filtres (artistSearch, pagination, etc.)
    this.router.get("/", (ctx) => this.controller.getAllArtworks(ctx));

    // Récupérer un seul artwork par son id
    this.router.get("/:id", (ctx) => this.controller.getArtwork(ctx));

    // Créer un nouvel artwork
    this.router.post("/", this.authMiddleware.protect(["admin"]), async (ctx) => this.controller.createArtwork(ctx));

    // Modifier un artwork
    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updateArtwork(ctx));

    // Soft delete artwork
    this.router.patch("/:id/delete", this.authMiddleware.protect(["admin"]), (ctx) =>
      this.controller.deleteArtwork(ctx)
    );

    // Restaurer un artwork
    this.router.patch("/:id/restore", this.authMiddleware.protect(["admin"]), (ctx) =>
      this.controller.restoreArtwork(ctx)
    );
  }

  get routes() {
    return this.router;
  }
}
