import { prisma } from "../config/database.js";
import PasswordHasher from "../utils/hash.js";
import TokenGenerator from "../config/jwt.js";
import AppError from "../utils/AppError.js";

export default class AuthService {
  constructor() {
    this.passwordHasher = new PasswordHasher();
    this.tokenGenerator = new TokenGenerator();
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Identifiants invalides", 401);

    const isValid = await this.passwordHasher.compare(password, user.password);
    if (!isValid) throw new AppError("Identifiants invalides", 401);

    const payload = { id: user.id, role: user.role, email: user.email };
    const token = this.tokenGenerator.sign(payload);
    return {
      token,
      user: this.filterUserFields(user),
    };
  }

  async getCurrentUser(token) {
    try {
      const payload = this.tokenGenerator.verify(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
      });
      if (!user) throw new AppError("Utilisateur introuvable", 404);
      return this.filterUserFields(user);
    } catch {
      throw new AppError("Token invalide", 401);
    }
  }

  filterUserFields(user) {
    const { password, ...safeFields } = user;
    return safeFields;
  }
}
