import ArtistSchema from "../schemas/ArtistSchema.js";
import ArtistService from "../services/ArtistService.js";

export default class ArtistController {
  constructor() {
    this.service = new ArtistService();
    this.validator = new ArtistSchema();
  }

  async getAllArtists(ctx) {
    try {
      const { includeInactive, search, page, statut, pageSize } =
        ctx.req.query();

      const artists = await this.service.getAllArtists({
        includeInactive: includeInactive === "true",
        search,
        statut: statut || null,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countArtists({
        includeInactive: includeInactive === "true",
        search,
        statut: statut || null,
      });

      return ctx.success(
        {
          artists,
          pagination: {
            total,
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            totalPages: Math.ceil(total / (parseInt(pageSize) || 10)),
          },
        },
        "Liste des artistes récupérée"
      );
    } catch (error) {
      return ctx.error(error.message, 500);
    }
  }

  async createArtist(ctx) {
    try {
      const formData = await ctx.req.parseBody();
      this.validator.validateCreate(formData);
      const newArtist = await this.service.createArtist(formData);
      return ctx.success(newArtist, "Artiste créé avec succès", 201);
    } catch (error) {
      return ctx.error(error.message, 400);
    }
  }

  async updateArtist(ctx) {
    try {
      const artistId = ctx.req.param("id");
      const formData = await ctx.req.parseBody();
      this.validator.validateUpdate(formData);
      const updatedArtist = await this.service.updateArtist(artistId, formData);
      return ctx.success(updatedArtist, "Artiste mis à jour");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async getArtist(ctx) {
    try {
      const artistId = ctx.req.param("id");
      const artist = await this.service.getArtistById(artistId);
      if (!artist) return ctx.error("artiste non trouvé", 404);
      return ctx.success(artist, "Artiste récupéré");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async handleStatusChange(ctx, action) {
    try {
      const artistId = ctx.req.param("id");
      const result = await this.service.setArtistStatus(artistId, action);
      return ctx.success(
        result,
        `Artiste ${action === "restore" ? "réactivé" : "désactivé"} avec succès`
      );
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async deleteArtist(ctx) {
    return this.handleStatusChange(ctx, "delete");
  }

  async restoreArtist(ctx) {
    return this.handleStatusChange(ctx, "restore");
  }
}
