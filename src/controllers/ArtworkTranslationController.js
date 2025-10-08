import ArtworkTranslationService from "../services/ArtworkTranslationService.js";

export default class ArtworkTranslationController {
  constructor() {
    this.service = new ArtworkTranslationService();
  }

  async createTranslation(ctx) {
    try {
      const id = ctx.req.param("artworkId");
      const formData = await ctx.req.json();
      const translation = await this.service.createTranslation(id,formData);
      return ctx.success(translation, "Traduction créée avec succès", 201);
    } catch (error) {
      return ctx.error(error.message, 400);
    }
  }

  async updateTranslation(ctx) {
    try {
      const id = ctx.req.param("id");
      const formData = await ctx.req.json();
      const updated = await this.service.updateTranslation(id, formData);
      return ctx.success(updated, "Traduction mise à jour avec succès");
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async getTranslation(ctx) {
    try {
      const id = ctx.req.param("id");
      const translation = await this.service.getTranslationById(id);
      if (!translation) return ctx.error("Traduction non trouvée", 404);
      return ctx.success(translation, "Traduction récupérée");
    } catch (error) {
      return ctx.error(error.message, 400);
    }
  }

  async getAllTranslations(ctx) {
    try {
      const { artworkId, lang, status, page, pageSize } = ctx.req.query();

      const translations = await this.service.getAllTranslations({
        artworkId,
        lang,
        status,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countTranslations({
        artworkId,
        lang,
        status,
      });

      return ctx.success(
        {
          translations,
          pagination: {
            total,
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            totalPages: Math.ceil(total / (parseInt(pageSize) || 10)),
          },
        },
        "Liste des traductions récupérée"
      );
    } catch (error) {
      return ctx.error(error.message, 500);
    }
  }

  async deleteTranslation(ctx) {
    try {
      const id = ctx.req.param("id");
      const deleted = await this.service.deleteTranslation(id);
      return ctx.success(deleted, "Traduction supprimée avec succès");
    } catch (error) {
      const statusCode = error.message.includes("non trouvée") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  // Récupérer tous les médias d’un artwork
  async getTranslationByArtwork(ctx) {
    try {
      const artworkId = ctx.req.param("artworkId");
      const medias = await this.service.getTranslationByArtwork(artworkId);
      return ctx.success(medias, "Liste des translations récupérée");
    } catch (error) {
      return ctx.error(error.message, 400);
    }
  }
}
