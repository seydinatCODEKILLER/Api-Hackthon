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
    this.router.use("*", this.authMiddleware.protect(["admin"]));
    this.router.get("/", (ctx) => this.controller.getAllArtists(ctx));
    this.router.get("/:id", (ctx) => this.controller.getArtist(ctx));
    this.router.post("/", async (ctx) => this.controller.createArtist(ctx));
    this.router.put("/:id", (ctx) => this.controller.updateArtist(ctx));
    this.router.patch("/:id/delete", (ctx) => this.controller.deleteArtist(ctx));
    this.router.patch("/:id/restore", (ctx) => this.controller.restoreArtist(ctx));
  }

  get routes() {
    return this.router;
  }
}
