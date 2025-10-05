import { Hono } from "hono";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import ArtistController from "../controllers/ArtistController.js";


export default class ArtistRoute {
  constructor() {
    this.router = new Hono();
    this.controller = new ArtistController();
    this.authMiddleware = new AuthMiddleware();
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get("/", (ctx) => this.controller.getAllArtists(ctx));
    this.router.get("/:id", (ctx) => this.controller.getArtist(ctx));
    this.router.post("/", this.authMiddleware.protect(["admin"]), async (ctx) => this.controller.createArtist(ctx));
    this.router.put("/:id", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.updateArtist(ctx));
    this.router.patch("/:id/delete", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.deleteArtist(ctx));
    this.router.patch("/:id/restore", this.authMiddleware.protect(["admin"]), (ctx) => this.controller.restoreArtist(ctx));
  }

  get routes() {
    return this.router;
  }
}
