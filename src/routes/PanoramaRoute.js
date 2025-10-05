import { Hono } from "hono";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import PanoramaController from "../controllers/PanoramaController.js";

export default class PanoramaRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new PanoramaController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {

    // Récupérer tous les panoramas avec filtres
    this.router.get("/", (ctx) => this.controller.getAllPanoramas(ctx));

    // Récupérer un seul panorama par son id
    this.router.get("/:id", (ctx) => this.controller.getPanorama(ctx));

    // Créer un nouveau panorama
    this.router.post("/",  this.authMiddleware.protect(["admin"]), async (ctx) => this.controller.createPanorama(ctx));

    // Modifier un panorama
    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updatePanorama(ctx));

    // Supprimer un panorama
    this.router.delete("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deletePanorama(ctx));
  }

  get routes() {
    return this.router;
  }
}
