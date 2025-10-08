import ArtworkSchema from "../schemas/ArtworkSchema.js";
import ArtworkService from "../services/ArtworkService.js";

export default class ArtworkController {
  constructor() {
    this.service = new ArtworkService();
    this.validator = new ArtworkSchema();
  }

  async getAllArtworks(ctx) {
    try {
      const { artistSearch,titleSearch, includeInactive, page, pageSize } = ctx.req.query();

      const artworks = await this.service.getAllArtworks({
        artistSearch: artistSearch || "",
        titleSearch: titleSearch || "",
        includeInactive: includeInactive === "true",
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countArtworks({
        artistSearch: artistSearch || "",
        titleSearch: titleSearch || "",
        includeInactive: includeInactive === "true",
      });

      return ctx.success(
        {
          artworks,
          pagination: {
            total,
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            totalPages: Math.ceil(total / (parseInt(pageSize) || 10)),
          },
        },
        "Liste des artworks récupérée"
      );
    } catch (error) {
      return ctx.error(error.message, 500);
    }
  }

  async getArtwork(ctx) {
    try {
      const artworkId = ctx.req.param("id");
      const artwork = await this.service.getArtworkById(artworkId);
      if (!artwork) return ctx.error("Artwork non trouvé", 404);
      return ctx.success(artwork, "Artwork récupéré");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async createArtwork(ctx) {
    try {
      const formData = await ctx.req.json();
      this.validator.validateCreate(formData);
      const newArtwork = await this.service.createArtwork(formData);
      return ctx.success(newArtwork, "Artwork créé avec succès", 201);
    } catch (error) {
      return ctx.error(error.message, 400);
    }
  }

  async updateArtwork(ctx) {
    try {
      const artworkId = ctx.req.param("id");
      const formData = await ctx.req.json();
      this.validator.validateUpdate(formData);
      const updatedArtwork = await this.service.updateArtwork(artworkId, formData);
      return ctx.success(updatedArtwork, "Artwork mis à jour");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const artworkId = ctx.req.param("id");
      const result = await this.service.setArtworkStatus(artworkId, action);
      return ctx.success(
        result,
        `Artwork ${action === "restore" ? "réactivé" : "désactivé"} avec succès`
      );
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async deleteArtwork(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreArtwork(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }
}
