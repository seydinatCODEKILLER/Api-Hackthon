import { prisma } from "../config/database.js";
import MediaUploader from "../utils/uploadMedia.js";
import AppError from "../utils/AppError.js";

export default class ArtistService {
  constructor() {
    this.mediaUploader = new MediaUploader();
  }

  async getAllArtists({
    includeInactive = false,
    search = "",
    statut = null,
    page = 1,
    pageSize = 10,
  } = {}) {
    const whereClause = {
      ...(includeInactive ? {} : { statut: "actif" }),
      ...(statut ? { statut } : {}),
      ...(search
        ? {
            OR: [
              { nom: { contains: search, mode: "insensitive" } },
              { prenom: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return prisma.artist.findMany({
      where: whereClause,
      orderBy: { nom: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countArtists({
    includeInactive = false,
    search = "",
    statut = null,
  } = {}) {
    const whereClause = {
      ...(includeInactive ? {} : { statut: "actif" }),
      ...(statut ? { statut } : {}),
      ...(search
        ? {
            OR: [
              { nom: { contains: search, mode: "insensitive" } },
              { prenom: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.artist.count({ where: whereClause });
  }

  async createArtist(data) {
    const { nom, prenom, bio, avatar } = data;
    let avatarUrl = null;

    try {
      avatarUrl = await this.uploadAvatar(avatar, prenom, nom);
      return prisma.artist.create({
        data: { nom, prenom, bio, avatar: avatarUrl },
      });
    } catch (error) {
      if (avatarUrl)
        await this.mediaUploader.rollback(
          `artist_${prenom}_${nom}`.toLowerCase()
        );
      throw error;
    }
  }

  async updateArtist(artistId, data) {
    const { avatar, ...userData } = data;
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new AppError("Artist non trouvé", 404);

    const avatarUrl = avatar
      ? await this.uploadAvatar(avatar, userData.prenom || artist.prenom, userData.nom || artist.nom)
      : artist.avatar;
    return prisma.artist.update({
      where: { id: artistId },
      data: { ...userData, avatar: avatarUrl },
    });
  }

  async uploadAvatar(file, prenom, nom) {
    if (!file) return null;
    return this.mediaUploader.upload(
      file,
      "hackathon/avatars",
      `artist_${prenom}_${nom}`.toLowerCase()
    );
  }

  async setArtistStatus(artistId, action) {
    const transitions = {
      delete: { from: "actif", to: "inactif" },
      restore: { from: "inactif", to: "actif" },
    };
    if (!transitions[action]) throw new AppError("Action invalide", 400);

    const { from, to } = transitions[action];
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) throw new AppError("Artiste non trouvé", 404);
    if (artist.statut !== from)
      throw new AppError(
        `Action impossible: l'artiste est ${artist.statut}`,
        400
      );

    await prisma.artist.update({
      where: { id: artistId },
      data: { statut: to },
    });
    return { id: artistId, statut: to };
  }

  async getArtistById(artistId) {
    return prisma.artist.findUnique({ where: { id: artistId } });
  }
}
