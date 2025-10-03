import AuthService from "../services/AuthService.js";
import AuthSchema from "../schemas/AuthSchema.js";

export default class AuthController {
  constructor() {
    this.service = new AuthService();
    this.validator = new AuthSchema();
  }

  async login(ctx) {
    try {
      const credentials = await ctx.req.json();
      this.validator.validateLogin(credentials);
      const result = await this.service.login(
        credentials.email,
        credentials.password
      );
      return ctx.success(result, "Connexion réussie");
    } catch (error) {
      return ctx.error(error.message, error.status || 400);
    }
  }
}
