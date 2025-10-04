import { prisma } from "../config/database.js";
import AppError from "../utils/AppError.js";

export default class HotspotService {
  async getAllHotspots({
    panoramaId = null,
    targetType = null,
    page = 1,
    pageSize = 50,
  } = {}) {
    const whereClause = {
      ...(panoramaId ? { panoramaId } : {}),
      ...(targetType ? { targetType } : {}),
    };

    return prisma.hotspot.findMany({
      where: whereClause,
      include: {
        panorama: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countHotspots({ panoramaId = null, targetType = null } = {}) {
    const whereClause = {
      ...(panoramaId ? { panoramaId } : {}),
      ...(targetType ? { targetType } : {}),
    };

    return prisma.hotspot.count({ where: whereClause });
  }

  async createHotspot(data) {
        // Vérifier que le panorama existe
    const panorama = await prisma.panorama.findUnique({
      where: { id: data.panoramaId },
    });
    if (!panorama) throw new AppError("Panorama non trouvé", 404);

    // Vérifier la cible selon le type
    await this.#validateTarget(data.targetType, data.targetId);

    // Vérifier l'œuvre si artworkId est fourni
    if (data.artworkId) {
      const artwork = await prisma.artwork.findUnique({
        where: { id: data.artworkId },
      });
      if (!artwork) throw new AppError("Œuvre non trouvée", 404);
    }

    // Générer un label par défaut si non fourni
    const label = data.label || (await this.#generateDefaultLabel(data));

    return prisma.hotspot.create({
      data: {
        ...data,
        label,
      },
      include: {
        panorama: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async createArtworkHotspot(
    panoramaId,
    artworkId,
    position,
    customLabel = null
  ) {
    const [panorama, artwork] = await Promise.all([
      prisma.panorama.findUnique({ where: { id: panoramaId } }),
      prisma.artwork.findUnique({
        where: { id: artworkId },
        include: { artist: true },
      }),
    ]);

    if (!panorama) throw new AppError("Panorama non trouvé", 404);
    if (!artwork) throw new AppError("Œuvre non trouvée", 404);

    const label = customLabel || `${artwork.title}`;

    return prisma.hotspot.create({
      data: {
        panoramaId,
        artworkId,
        x: position.x,
        y: position.y,
        targetType: "ARTWORK",
        targetId: artworkId,
        label,
        hotspotType: "artwork",
      },
      include: {
        panorama: {
          select: { id: true, title: true, roomType: true },
        },
        artwork: {
          include: {
            artist: { select: { nom: true, prenom: true } },
            media: true,
            translations: true,
          },
        },
      },
    });
  }

  async getHotspotById(hotspotId) {
    return prisma.hotspot.findUnique({
      where: { id: hotspotId },
      include: {
        panorama: {
          select: { id: true, title: true, imageUrl: true, roomType: true },
        },
        artwork: {
          include: {
            artist: true,
            media: true,
            translations: true,
          },
        },
      },
    });
  }

  async getHotspotsByPanorama(panoramaId) {
    const panorama = await prisma.panorama.findUnique({
      where: { id: panoramaId },
    });
    if (!panorama) throw new AppError("Panorama non trouvé", 404);

    return prisma.hotspot.findMany({
      where: { panoramaId },
      orderBy: { createdAt: "asc" },
    });
  }

  async getArtworkHotspotsByPanorama(panoramaId) {
    return prisma.hotspot.findMany({
      where: {
        panoramaId,
        targetType: "ARTWORK",
      },
      include: {
            artist: { select: { nom: true, prenom: true } },
            media: true,
            translations: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateHotspot(hotspotId, data) {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: hotspotId },
    });
    if (!hotspot) throw new AppError("Hotspot non trouvé", 404);

    // Vérifier les relations si modifiées
    if (data.panoramaId) {
      const panorama = await prisma.panorama.findUnique({
        where: { id: data.panoramaId },
      });
      if (!panorama) throw new AppError("Panorama non trouvé", 404);
    }

    if (data.targetType && data.targetId) {
      await this.#validateTarget(data.targetType, data.targetId);
    }

    if (data.artworkId) {
      const artwork = await prisma.artwork.findUnique({
        where: { id: data.artworkId },
      });
      if (!artwork) throw new AppError("Œuvre non trouvée", 404);
    }

    return prisma.hotspot.update({
      where: { id: hotspotId },
      data: data,
      include: {
        panorama: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async deleteHotspot(hotspotId) {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: hotspotId },
    });
    if (!hotspot) throw new AppError("Hotspot non trouvé", 404);

    return prisma.hotspot.delete({
      where: { id: hotspotId },
    });
  }

  async deleteHotspotsByPanorama(panoramaId) {
    const panorama = await prisma.panorama.findUnique({
      where: { id: panoramaId },
    });
    if (!panorama) throw new AppError("Panorama non trouvé", 404);

    return prisma.hotspot.deleteMany({
      where: { panoramaId },
    });
  }

  async #validateTarget(targetType, targetId) {
    if (targetType === "PANORAMA") {
      const targetPanorama = await prisma.panorama.findUnique({
        where: { id: targetId },
      });
      if (!targetPanorama) throw new AppError("Panorama cible non trouvé", 404);
    } else if (targetType === "ARTWORK") {
      const targetArtwork = await prisma.artwork.findUnique({
        where: { id: targetId },
      });
      if (!targetArtwork) throw new AppError("Artwork cible non trouvé", 404);
    }
  }

  async #generateDefaultLabel(data) {
    if (data.targetType === "ARTWORK" && data.artworkId) {
      const artwork = await prisma.artwork.findUnique({
        where: { id: data.artworkId },
        select: { title: true },
      });
      return `🖼️ ${artwork?.title || "Œuvre d'art"}`;
    } else if (data.targetType === "PANORAMA") {
      const panorama = await prisma.panorama.findUnique({
        where: { id: data.targetId },
        select: { title: true },
      });
      return `🚪 ${panorama?.title || "Salle suivante"}`;
    }
    return "📍 Point d'intérêt";
  }
}
