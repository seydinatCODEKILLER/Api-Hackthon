import AdminService from "../services/AdminService.js";
import AdminValidator from "../schemas/AdminSchema.js";

export default class AdminController {
  constructor() {
    this.service = new AdminService();
    this.validator = new AdminValidator();
  }

  async createAdmin(ctx) {
    try {
      const formData = await ctx.req.parseBody();
      this.validator.validateCreate(formData);

      const newTeacher = await this.service.createAdmin(formData);
      return ctx.success(newTeacher, "admin créé avec succès", 201);
    } catch (error) {
      return ctx.error(error.message, 400)
    }
  }
}
