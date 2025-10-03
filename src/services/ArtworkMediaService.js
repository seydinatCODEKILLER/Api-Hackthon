import { prisma } from "../config/database.js";
import AppError from "../utils/AppError.js";
import MediaUploader from "../utils/uploadMedia.js";

export default class ArtworkMediaService {
  constructor() {
    this.mediaUploader = new MediaUploader();
  }

  /**
   * Ajoute un média à un artwork
   * @param {string} artworkId
   * @param {Object} data - { type, file }
   */
  async addMedia(artworkId, data) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) throw new AppError("Artwork non trouvé", 404);

    if (!data.file) throw new AppError("Fichier obligatoire", 400);
    if (!["IMAGE", "AUDIO", "VIDEO"].includes(data.type))
      throw new AppError("Type de média invalide", 400);

    const folderMap = {
      IMAGE: "hackathon/artworks/images",
      AUDIO: "hackathon/artworks/audios",
      VIDEO: "hackathon/artworks/videos",
    };
    let url = null;

    try {
    url = await this.mediaUploader.upload(
        data.file,
        folderMap[data.type],
        `artwork_${artworkId}}`
      );

      return prisma.artworkMedia.create({
        data: {
          artworkId,
          type: data.type,
          url,
        },
      });
    } catch (error) {
        if(url) await this.mediaUploader.rollback(`artwork_${artworkId}}`);
        throw new AppError("Erreur lors de l'upload du média", 500);
    }
  }

  /**
   * Supprime un média
   */
  async deleteMedia(mediaId) {
    const media = await prisma.artworkMedia.findUnique({
      where: { id: mediaId },
    });
    if (!media) throw new AppError("Média non trouvé", 404);

    await this.mediaUploader.deleteByUrl(media.url);
    await prisma.artworkMedia.delete({ where: { id: mediaId } });

    return { id: mediaId };
  }

  /**
   * Récupère tous les médias d'un artwork
   */
  async getMediaByArtwork(artworkId) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) throw new AppError("Artwork non trouvé", 404);
    return prisma.artworkMedia.findMany({
      where: { artworkId },
      orderBy: { type: "desc" },
    });
  }
}
