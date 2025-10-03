import { prisma } from "../config/database.js";
import PasswordHasher from "../utils/hash.js";
import MediaUploader from "../utils/uploadMedia.js";
import AppError from "../utils/AppError.js";


export default class AdminService {
  constructor() {
    this.passwordHasher = new PasswordHasher();
    this.mediaUploader = new MediaUploader();
  }

  async createAdmin(adminData) {
    const { email, password, nom, prenom, telephone, avatar } =
      adminData;

    let uploadPrefix = `admin_${prenom}_${nom}`.toLowerCase();
    let avatarUrl = null;

    try {
      await this._verifyEmailNotExists(prisma, email);

      avatarUrl = await this._handleAvatarUpload(avatar, uploadPrefix);
      const result = await prisma.$transaction(
        async (tx) => {
          const hashedPassword = await this.passwordHasher.hash(password);
          return this._createUserRecord(tx, {
            nom,
            prenom,
            email,
            telephone,
            password: hashedPassword,
            avatar: avatarUrl,
          });
        },
        {
          timeout: 20000,
        }
      );

      return result;
    } catch (error) {
      if (avatarUrl) {
        await this.mediaUploader.rollback(uploadPrefix);
      }
      throw error;
    }
  }

  async _verifyEmailNotExists(prismaClient, email) {
    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("Un utilisateur avec cet email existe déjà", 409);
    }
  }

  async _handleAvatarUpload(avatarFile, namePrefix) {
    if (!avatarFile) return null;

    try {
      return await this.mediaUploader.upload(avatarFile, "hackathon/avatars", namePrefix);
    } catch (error) {
      throw new AppError("Échec du téléchargement de l'avatar", 500);
    }
  }

  async _createUserRecord(prismaClient, userData) {
    return prismaClient.user.create({
      data: {
        ...userData,
        role: "admin",
      },
    });
  }
}
