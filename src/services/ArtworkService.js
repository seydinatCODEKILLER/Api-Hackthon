import { prisma } from "../config/database.js";
import AppError from "../utils/AppError.js";
import QRCodeGenerator from "../utils/QRCodeGenerator.js";

export default class ArtworkService {
  constructor() {
    this.qrCodeGenerator = new QRCodeGenerator();
  }

  /**
   * Récupère tous les artworks avec filtrage possible par nom/prénom d'artiste
   * @param {Object} options
   * @param {string} options.artistSearch - Nom ou prénom de l'artiste à filtrer
   * @param {boolean} options.includeInactive - Inclure les artworks inactifs
   * @param {number} options.page - Numéro de page
   * @param {number} options.pageSize - Taille de page
   * @returns {Promise<Array>} Liste des artworks
   */
  async getAllArtworks({
    artistSearch = "",
    includeInactive = false,
    page = 1,
    pageSize = 10,
  } = {}) {
    const whereClause = {
      ...(includeInactive ? {} : { isActive: true }),
      artist: artistSearch
        ? {
            OR: [
              { nom: { contains: artistSearch, mode: "insensitive" } },
              { prenom: { contains: artistSearch, mode: "insensitive" } },
            ],
          }
        : undefined,
    };

    return prisma.artwork.findMany({
      where: whereClause,
      include: {
        artist: true,
        translations: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  /**
   * Compte le nombre total d'artworks avec filtrage possible par artiste
   * @param {Object} options
   * @param {string} options.artistSearch - Nom ou prénom de l'artiste à filtrer
   * @param {boolean} options.includeInactive - Inclure les artworks inactifs
   * @returns {Promise<number>}
   */
  async countArtworks({ artistSearch = "", includeInactive = false } = {}) {
    const whereClause = {
      ...(includeInactive ? {} : { isActive: true }),
      artist: artistSearch
        ? {
            OR: [
              { nom: { contains: artistSearch, mode: "insensitive" } },
              { prenom: { contains: artistSearch, mode: "insensitive" } },
            ],
          }
        : undefined,
    };

    return prisma.artwork.count({ where: whereClause });
  }

  /**
   * Crée un nouvel artwork
   * @param {Object} data - Données de l'artwork
   * @param {string} data.title - Titre de l'artwork
   * @param {string} data.artistId - ID de l'artiste
   * @returns {Promise<Object>} Artwork créé
   */
  async createArtwork({ title, artistId }) {
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new AppError("Artiste non trouvé", 404);

    const qrCodePrefix = `artwork_${Date.now()}`;

    // Crée l'artwork d'abord
    const artwork = await prisma.artwork.create({
      data: { title, artistId, qrCode: qrCodePrefix},
    });

    // Ensuite génère le QR code avec l'ID réel
    let qrCodeImageUrl = null;
    try {
      qrCodeImageUrl = await this.qrCodeGenerator.generateForArtwork(
        artwork.id, // <- ici le vrai ID
        title
      );

      // Mets à jour l'artwork avec le QR code
      await prisma.artwork.update({
        where: { id: artwork.id },
        data: { qrCodeImageUrl, qrCode: `artwork_${artwork.id}` },
      });

      return { ...artwork, qrCodeImageUrl };
    } catch (error) {
      if (qrCodeImageUrl) {
        await this.qrCodeGenerator.deleteByUrl(qrCodeImageUrl);
      }
      throw error;
    }
  }

  /**
   * Récupérer un artwork par son ID
   * @param {string} artworkId
   * @returns {Promise<Object|null>}
   */
  async getArtworkById(artworkId) {
    return prisma.artwork.findUnique({
      where: { id: artworkId },
      include: {
        translations: true,
        media: true,
        artist: true,
      },
    });
  }

  /**
   * Met à jour un artwork
   * @param {string} artworkId
   * @param {Object} data - { title? }
   * @returns {Promise<Object>} Artwork mis à jour
   */
  async updateArtwork(artworkId, data) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) throw new AppError("Artwork non trouvé", 404);

    // Si on change le titre, on peut regénérer le QR code
    let qrCodeImageUrl = artwork.qrCodeImageUrl;
    if (data.title && data.title !== artwork.title) {
      try {
        qrCodeImageUrl = await this.qrCodeGenerator.generateForArtwork(
          artworkId, // <-- passer l'ID réel
          data.title
        );
        // Optionnel: supprimer l'ancien QR code
        if (artwork.qrCodeImageUrl) {
          await this.qrCodeGenerator.deleteByUrl(artwork.qrCodeImageUrl);
        }
      } catch (error) {
        throw new AppError("Erreur génération QR code", 500);
      }
    }

    const updatedArtwork = await prisma.artwork.update({
      where: { id: artworkId },
      data: {
        ...data,
        qrCodeImageUrl,
      },
    });

    return updatedArtwork;
  }

  /**
   * Soft delete ou restore d'un artwork
   * @param {string} artworkId
   * @param {"delete"|"restore"} action
   * @returns {Promise<Object>} { id, isActive }
   */
  async setArtworkStatus(artworkId, action) {
    const artwork = await prisma.artwork.findUnique({
      where: { id: artworkId },
    });
    if (!artwork) throw new AppError("Artwork non trouvé", 404);

    const transitions = {
      delete: { from: true, to: false },
      restore: { from: false, to: true },
    };

    if (!transitions[action]) throw new AppError("Action invalide", 400);

    const { from, to } = transitions[action];
    if (artwork.isActive !== from)
      throw new AppError(
        `Action impossible: l'artwork est déjà ${
          artwork.isActive ? "actif" : "inactif"
        }`,
        400
      );

    await prisma.artwork.update({
      where: { id: artworkId },
      data: { isActive: to },
    });

    return { id: artworkId, isActive: to };
  }
}
