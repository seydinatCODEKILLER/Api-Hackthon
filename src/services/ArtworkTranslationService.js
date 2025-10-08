import { prisma } from "../config/database.js";
import AppError from "../utils/AppError.js";

export default class ArtworkTranslationService {
  /**
   * Récupérer toutes les traductions (avec pagination, filtre langue, statut, artworkId)
   * @param {Object} options
   * @param {string} options.artworkId - ID de l'œuvre
   * @param {string} options.lang - Langue (FR, EN, WO)
   * @param {string} options.status - Statut de la traduction (draft, published)
   * @param {number} options.page - Numéro de page
   * @param {number} options.pageSize - Taille de page
   */
  async getAllTranslations({
    artworkId,
    lang,
    status,
    page = 1,
    pageSize = 10,
  } = {}) {
    const whereClause = {
      ...(artworkId ? { artworkId } : {}),
      ...(lang ? { lang } : {}),
      ...(status ? { status } : {}),
    };

    return prisma.artworkTranslation.findMany({
      where: whereClause,
      orderBy: { lang: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * Compter toutes les traductions (utile pour pagination)
   * @param {Object} options
   * @param {string} options.artworkId
   * @param {string} options.lang
   * @param {string} options.status
   */
  async countTranslations({ artworkId, lang, status } = {}) {
    const whereClause = {
      ...(artworkId ? { artworkId } : {}),
      ...(lang ? { lang } : {}),
      ...(status ? { status } : {}),
    };

    return prisma.artworkTranslation.count({ where: whereClause });
  }

  /**
   * Créer une traduction pour un artwork
   * @param {Object} data - Données de traduction
   * @returns {Promise<Object>} Traduction créée
   */
  async createTranslation(artworkId, data) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) throw new AppError("Artwork non trouvé", 404);

    if (!["FR", "EN", "WO"].includes(data.lang)) {
      throw new AppError("La langue doit être FR, EN ou WO", 400);
    }

    const existing = await prisma.artworkTranslation.findFirst({
      where: { artworkId: artworkId, lang: data.lang },
    });
    if (existing) {
      throw new AppError(
        `Une traduction existe déjà pour la langue ${data.lang}`,
        400
      );
    }

    return prisma.artworkTranslation.create({
      data: {
        artworkId,
        ...data,
      },
    });
  }

  /**
   * Récupérer une traduction par ID
   * @param {string} translationId
   */
  async getTranslationById(translationId) {
    const translation = await prisma.artworkTranslation.findUnique({
      where: { id: translationId },
    });
    if (!translation) throw new AppError("Traduction non trouvée", 404);
    return translation;
  }

  /**
   * Mettre à jour une traduction
   * @param {string} translationId
   * @param {Object} data - Données à mettre à jour
   */
  async updateTranslation(translationId, data) {
    const translation = await prisma.artworkTranslation.findUnique({
      where: { id: translationId },
    });
    if (!translation) throw new AppError("Traduction non trouvée", 404);
    if (data.lang && !["FR", "EN", "WO"].includes(data.lang)) {
      throw new AppError("La langue doit être FR, EN ou WO", 400);
    }

    return prisma.artworkTranslation.update({
      where: { id: translationId },
      data,
    });
  }

  /**
   * Supprimer une traduction (hard delete)
   * @param {string} translationId
   */
  async deleteTranslation(translationId) {
    const translation = await prisma.artworkTranslation.findUnique({
      where: { id: translationId },
    });
    if (!translation) throw new AppError("Traduction non trouvée", 404);

    await prisma.artworkTranslation.delete({
      where: { id: translationId },
    });

    return { id: translationId, deleted: true };
  }

  /**
   * Récupère tous les translation d'un artwork
   */
  async getTranslationByArtwork(artworkId) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) throw new AppError("Artwork non trouvé", 404);
    return prisma.artworkTranslation.findMany({
      where: { artworkId },
      orderBy: { lang: "desc" },
    });
  }
}
