import { z } from "zod";

export default class ArtworkSchema {
  #titleSchema = z.string()
    .min(1, "Le titre est requis")
    .max(255, "Le titre ne peut pas dépasser 255 caractères");

  #artistIdSchema = z.string()
    .min(1, "L'ID de l'artiste est requis")
    .regex(/^[0-9a-fA-F]{24}$/, "L'ID de l'artiste doit être un ObjectId valide");

  validateCreate(data) {
    const schema = z.object({
      title: this.#titleSchema,
      artistId: this.#artistIdSchema,
    });

    this.#validateSchema(schema, data);
  }

  validateUpdate(data) {
    const schema = z.object({
      title: this.#titleSchema.optional(),
      artistId: this.#artistIdSchema.optional(),
    });

    this.#validateSchema(schema, data);
  }

  #validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = Object.entries(result.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join(" | ");
      throw new Error(errors);
    }
  }
}