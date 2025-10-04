import PanoramaSchema from "../schemas/PanoramaSchema.js";
import PanoramaService from "../services/PanoramaService.js";

export default class PanoramaController {
  constructor() {
    this.service = new PanoramaService();
    this.validator = new PanoramaSchema();
  }

  async getAllPanoramas(ctx) {
    try {
      const { search, page, pageSize } = ctx.req.query();

      const panoramas = await this.service.getAllPanoramas({
        search: search || "",
        page: parseInt(page) || 1,
        pageSize: parseInt(pageSize) || 10,
      });

      const total = await this.service.countPanoramas({
        search: search || "",
      });

      return ctx.success(
        {
          panoramas,
          pagination: {
            total,
            page: parseInt(page) || 1,
            pageSize: parseInt(pageSize) || 10,
            totalPages: Math.ceil(total / (parseInt(pageSize) || 10)),
          },
        },
        "Liste des panoramas récupérée"
      );
    } catch (error) {
      return ctx.error(error.message, 500);
    }
  }

  async getPanorama(ctx) {
    try {
      const panoramaId = ctx.req.param("id");
      const panorama = await this.service.getPanoramaById(panoramaId);
      if (!panorama) return ctx.error("Panorama non trouvé", 404);
      return ctx.success(panorama, "Panorama récupéré");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async createPanorama(ctx) {
    try {
      const formData = await ctx.req.parseBody();
      this.validator.validateCreate(formData);
      const newPanorama = await this.service.createPanorama(formData);
      return ctx.success(newPanorama, "Panorama créé avec succès", 201);
    } catch (error) {
      return ctx.error(error.message, 400);
    }
  }

  async updatePanorama(ctx) {
    try {
      const panoramaId = ctx.req.param("id");
      const formData = await ctx.req.parseBody();
      this.validator.validateUpdate(formData);
      const updatedPanorama = await this.service.updatePanorama(panoramaId, formData);
      return ctx.success(updatedPanorama, "Panorama mis à jour");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }

  async deletePanorama(ctx) {
    try {
      const panoramaId = ctx.req.param("id");
      await this.service.deletePanorama(panoramaId);
      return ctx.success(null, "Panorama supprimé avec succès");
    } catch (error) {
      const statusCode = error.message.includes("non trouvé") ? 404 : 400;
      return ctx.error(error.message, statusCode);
    }
  }
}