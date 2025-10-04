import { prisma } from "../config/database.js";
import AppError from "../utils/AppError.js";
import MediaUploader from "../utils/uploadMedia.js";

export default class PanoramaService {
  constructor() {
    this.mediaUploader = new MediaUploader();
  }
  async getAllPanoramas({ search = "", page = 1, pageSize = 10 } = {}) {
    const whereClause = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    return prisma.panorama.findMany({
      where: whereClause,
      include: {
        hotspots: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async countPanoramas({ search = "" } = {}) {
    const whereClause = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    return prisma.panorama.count({ where: whereClause });
  }

  async createPanorama(data) {
    const { title, description,imageUrl,roomType } = data;
    let image = null;
    try {
      image = await this.uploadPanoramaImage(imageUrl, data.title);
      return prisma.panorama.create({
        data: {
          title: title,
          description: description,
          imageUrl: image,
          roomType: roomType,
        },
      });
    } catch (error) {
      if (image)
        await this.mediaUploader.rollback(`panorama_${title}`.toLowerCase());
      throw error;
    }
  }

  async uploadPanoramaImage(file, title) {
    if (!file) return null;
    return this.mediaUploader.upload(
      file,
      "hackathon/panorama",
      `panorama_${title}`.toLowerCase()
    );
  }

  async getPanoramaById(panoramaId) {
    const panorama = await prisma.panorama.findUnique({
      where: { id: panoramaId },
    });
    if (!panorama) throw new AppError("Panorama non trouvé", 404);
    return prisma.panorama.findUnique({
      where: { id: panoramaId },
      include: {
        hotspots: true,
      },
    });
  }

  async updatePanorama(panoramaId, data) {
    const { imageUrl, ...panoramaData } = data;
    const panorama = await prisma.panorama.findUnique({
      where: { id: panoramaId },
    });
    if (!panorama) throw new AppError("Panorama non trouvé", 404);
    const avatarUrl = imageUrl
      ? await this.uploadPanoramaImage(
          imageUrl,
          panoramaData.title || panorama.title
        )
      : panorama.imageUrl;

    return prisma.panorama.update({
      where: { id: panoramaId },
      data: {
        ...panoramaData,
        imageUrl: avatarUrl,
        updatedAt: new Date(),
      },
    });
  }

  async deletePanorama(panoramaId) {
    const panorama = await prisma.panorama.findUnique({
      where: { id: panoramaId },
    });
    if (!panorama) throw new AppError("Panorama non trouvé", 404);

    // Supprimer d'abord les hotspots associés
    await prisma.hotspot.deleteMany({
      where: { panoramaId },
    });

    return prisma.panorama.delete({
      where: { id: panoramaId },
    });
  }
}
