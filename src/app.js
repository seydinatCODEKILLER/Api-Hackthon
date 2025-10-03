import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import responseHandler from "./middlewares/responseMiddleware.js";
import AdminRoute from "./routes/AdminRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import ArtistRoute from "./routes/ArtistRoute.js";
import ArtworkRoute from "./routes/ArtworkRoute.js";
import ArtworkTranslationRoute from "./routes/ArtworkTranslationRoute.js";
import ArtworkMediaRoute from "./routes/ArtworkMediaRoute.js";

const app = new Hono();

// Middlewares globaux
app.use("*", logger());
app.use("*", cors());
app.use("*", responseHandler);

// Routes
const adminRoute = new AdminRoute();
const authRoute = new AuthRoute();
const artistRoute = new ArtistRoute();
const artworkRoute = new ArtworkRoute();
const artworkTranslationRoute = new ArtworkTranslationRoute();
const artworkMediaRoute = new ArtworkMediaRoute();

app.route("/api/auth", authRoute.routes);
app.route("/api/admin", adminRoute.routes);
app.route("/api/artists", artistRoute.routes);
app.route("/api/artworks", artworkRoute.routes);
app.route("/api/artwork-translations", artworkTranslationRoute.routes);
app.route("/api/artwork-medias", artworkMediaRoute.routes);

// Route par défaut pour les chemins non définis
app.all("*", (ctx) => ctx.json({ message: "Route not found" }, 404));

export default app;
