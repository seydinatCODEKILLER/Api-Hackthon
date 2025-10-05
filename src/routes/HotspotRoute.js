import { Hono } from "hono";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import HotspotController from "../controllers/HotspotController.js";

export default class HotspotRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new HotspotController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {

    // Récupérer tous les hotspots (avec filtres optionnels)
    this.router.get("/", (ctx) => this.controller.getAllHotspots(ctx));

    this.router.get("/panorama/:panoramaId", (ctx) =>
      this.controller.getHotspotsByPanorama(ctx)
    );

    this.router.get("/panorama/:panoramaId/artworks", (ctx) => this.controller.getArtworkHotspotsByPanorama(ctx));

    // Créer un nouveau hotspot
    this.router.post("/", this.authMiddleware.protect(["admin"]), async (ctx) => this.controller.createHotspot(ctx));

    // Modifier un hotspot
    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updateHotspot(ctx));

    // Supprimer un hotspot
    this.router.delete("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deleteHotspot(ctx));

    // Supprimer tous les hotspots d'un panorama
    this.router.delete("/panorama/:panoramaId", this.authMiddleware.protect(["admin"]), (ctx) =>
      this.controller.deleteHotspotsByPanorama(ctx)
    );

    // ⚠️ À la fin, la route la plus générique
    this.router.get("/:id", (ctx) => this.controller.getHotspot(ctx));
  }

  get routes() {
    return this.router;
  }
}
