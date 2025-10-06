import QRCode from 'qrcode';
import cloudinary from "../config/cloudinary.js";

export default class QRCodeGenerator {
  constructor() {
    this.uploadResults = new Map(); // Pour gérer rollback
  }

  /**
   * Génère un QR code et l'upload sur Cloudinary
   * @param {string} qrData - Données à encoder dans le QR code
   * @param {string} folder - Dossier Cloudinary
   * @param {Object} options - Options supplémentaires (width, height, margin, color, prefix)
   * @returns {Promise<string>} URL du QR code sur Cloudinary
   */
  async generateAndUpload(qrData, folder = "hackathon/qrcodes", options = {}) {
    try {
      const qrOptions = {
        width: options.width || 300,
        height: options.height || 300,
        margin: options.margin || 1,
        color: {
          dark: options.color?.dark || '#000000',
          light: options.color?.light || '#FFFFFF'
        },
        ...options
      };

      // Générer le QR code en buffer
      const qrCodeBuffer = await QRCode.toBuffer(qrData, qrOptions);

      // Convertir en data URI pour Cloudinary
      const dataUri = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;

      // Upload sur Cloudinary
      const prefix = options.prefix || `qrcode_${Date.now()}`;
      const publicId = `${prefix}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: publicId,
        resource_type: "image",
        transformation: [
          { width: qrOptions.width, height: qrOptions.height, crop: "limit" }
        ]
      });

      // Sauvegarder l’upload pour rollback
      this.uploadResults.set(publicId, {
        public_id: result.public_id,
        url: result.secure_url
      });

      return result.secure_url;

    } catch (error) {
      console.error("QR Code generation/upload failed:", error);
      throw error;
    }
  }

  /**
   * Génère un QR code pour une artwork spécifique
   * @param {string} artworkId
   * @param {string} artworkTitle
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<string>} URL du QR code
   */
  async generateForArtwork(artworkId, artworkTitle, options = {}) {
    const qrData = JSON.stringify({
      type: "artwork",
      id: artworkId,
      title: artworkTitle,
      timestamp: new Date().toISOString(),
      appUrl: `https://hack-2rx0.onrender.com/artwork/${artworkId}`
    });

    const qrOptions = {
      prefix: `artwork_${artworkId}`,
      folder: "hackathon/qrcodes/artworks",
      ...options
    };

    return this.generateAndUpload(qrData, qrOptions.folder, qrOptions);
  }

  /**
   * Génère un QR code pour une URL générique
   * @param {string} url
   * @param {Object} options
   * @returns {Promise<string>} URL du QR code
   */
  async generateForUrl(url, options = {}) {
    const qrOptions = {
      prefix: `url_${Date.now()}`,
      folder: "hackathon/qrcodes/urls",
      ...options
    };
    return this.generateAndUpload(url, qrOptions.folder, qrOptions);
  }

  /**
   * Supprime un QR code de Cloudinary via public_id
   * @param {string} publicId
   */
  async deleteQRCode(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      this.uploadResults.delete(publicId);
      console.log(`QR Code deleted: ${publicId}`);
    } catch (error) {
      console.error("QR Code deletion failed:", error);
      throw error;
    }
  }

  /**
   * Supprime un QR code par son URL Cloudinary
   * @param {string} url
   */
  async deleteByUrl(url) {
    const publicId = this._extractPublicIdFromUrl(url);
    if (publicId) await this.deleteQRCode(publicId);
  }

  /**
   * Rollback d’un upload récent
   * @param {string} prefix
   */
  async rollback(prefix) {
    const uploadInfo = this.uploadResults.get(prefix);
    if (!uploadInfo) return;
    try {
      await this.deleteQRCode(uploadInfo.public_id);
      console.log(`Rollback successful - deleted QR code: ${uploadInfo.public_id}`);
    } catch (error) {
      console.error("QR Code rollback failed:", error);
    }
  }

  /**
   * Extrait le public_id depuis l’URL Cloudinary
   * @param {string} url
   * @returns {string|null}
   */
  _extractPublicIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|png|jpeg)/);
    return match ? match[1] : null;
  }
}
