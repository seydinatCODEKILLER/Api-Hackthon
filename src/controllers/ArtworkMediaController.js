import ArtworkMediaSchema from "../schemas/ArtworkMediaSchema.js";
import ArtworkMediaService from "../services/ArtworkMediaService.js";

export default class ArtworkMediaController {
  constructor() {
    this.service = new ArtworkMediaService();
    this.validator = new ArtworkMediaSchema();
  }

  async addMedia(ctx) {
  try {
    const artworkId = ctx.req.param("id");
    const body = await ctx.req.parseBody();

    const data = {
      artworkId,
      type: body.type,
      file: body.file
    }

    // Valider une seule fois le type
    this.validator.validateCreate(data);
    // Envoi en parallèle
    const medias = await this.service.addMedia(artworkId, data);

    return ctx.success(medias, "Médias ajoutés avec succès", 201);
  } catch (error) {
    return ctx.error(error.message, 400);
  }
}


  // Supprimer un média
  async deleteMedia(ctx) {
    try {
      const mediaId = ctx.req.param("mediaId");
      const result = await this.service.deleteMedia(mediaId);
      return ctx.success(result, "Média supprimé avec succès");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  // Récupérer tous les médias d’un artwork
  async getMediaByArtwork(ctx) {
    try {
      const artworkId = ctx.req.param("artworkId");
      const medias = await this.service.getMediaByArtwork(artworkId);
      return ctx.success(medias, "Liste des médias récupérée");
    } catch (error) {
      return ctx.error(error.message, 400);
    }
  }
}
