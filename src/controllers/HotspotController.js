import HotspotSchema from "../schemas/HotspotSchema.js";
import HotspotService from "../services/HotspotService.js";

export default class HotspotController {
  constructor() {
    this.service = new HotspotService();
    this.validator = new HotspotSchema();
  }

  async getAllHotspots(ctx) {
    try {
      const { panoramaId, targetType, page, pageSize } = ctx.req.query();

      const hotspots = await this.service.getAllHotspots({
        panoramaId: panoramaId || null,
        targetType: targetType || null,
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 50,
      });

      const total = await this.service.countHotspots({
        panoramaId: panoramaId || null,
        targetType: targetType || null,
      });

      return ctx.success(
        {
          hotspots,
          pagination: {
            total,
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 50,
            totalPages: Math.ceil(total / (parseInt(pageSize) || 50)),
          },
        },
        "Liste des hotspots récupérée"
      );
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 500);
    }
  }

  async getHotspot(ctx) {
    try {
      const hotspotId = ctx.req.param("id");
      const hotspot = await this.service.getHotspotById(hotspotId);
      if (!hotspot) return ctx.error("Hotspot non trouvé", 404);
      return ctx.success(hotspot, "Hotspot récupéré");
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 400);
    }
  }

  async getHotspotsByPanorama(ctx) {
    try {
      const panoramaId = ctx.req.param("panoramaId");
      const onlyArtwork = ctx.req.query("onlyArtwork") === "true";

      const hotspots = await this.service.getHotspotsByPanorama(panoramaId, { onlyArtwork });
      return ctx.success(hotspots, "Hotspots du panorama récupérés");
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 400);
    }
  }

  async createHotspot(ctx) {
    try {
      const formData = await ctx.req.json();
      this.validator.validateCreate(formData);

      const newHotspot = await this.service.createHotspot(formData);
      return ctx.success(newHotspot, "Hotspot créé avec succès", 201);
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 400);
    }
  }

  async updateHotspot(ctx) {
    try {
      const hotspotId = ctx.req.param("id");
      const formData = await ctx.req.json();
      this.validator.validateUpdate(formData);

      const updatedHotspot = await this.service.updateHotspot(hotspotId, formData);
      return ctx.success(updatedHotspot, "Hotspot mis à jour");
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 400);
    }
  }

  async deleteHotspot(ctx) {
    try {
      const hotspotId = ctx.req.param("id");
      await this.service.deleteHotspot(hotspotId);
      return ctx.success(null, "Hotspot supprimé avec succès");
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 400);
    }
  }

  async deleteHotspotsByPanorama(ctx) {
    try {
      const panoramaId = ctx.req.param("panoramaId");
      const result = await this.service.deleteHotspotsByPanorama(panoramaId);
      return ctx.success(
        { deletedCount: result.count },
        "Tous les hotspots du panorama ont été supprimés"
      );
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 400);
    }
  }

  async getArtworkHotspotsByPanorama(ctx) {
    try {
      const panoramaId = ctx.req.param("panoramaId");
      const hotspots = await this.service.getHotspotsByPanorama(panoramaId);
      return ctx.success(hotspots, "Hotspots d'œuvres du panorama récupérés");
    } catch (error) {
      return ctx.error(error.message, error.statusCode || 400);
    }
  }
}
