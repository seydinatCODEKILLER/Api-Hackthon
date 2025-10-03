import { z } from "zod";

export default class ArtworkTranslationSchema {
  #artworkIdSchema = z.string()
    .min(1, "L'ID de l'œuvre est requis")
    .regex(/^[0-9a-fA-F]{24}$/, "L'ID de l'œuvre doit être un ObjectId valide");

  #titleSchema = z.string()
    .min(1, "Le titre est requis")
    .max(500, "Le titre ne peut pas dépasser 500 caractères")
    .optional();

  #descriptionSchema = z.string()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(5000, "La description ne peut pas dépasser 5000 caractères");

  validateCreate(data) {
    const schema = z.object({
      artworkId: this.#artworkIdSchema,
      lang: z.enum(["FR", "EN", "WO"], {
        errorMap: () => ({ message: "La langue doit être FR, EN ou WO" })
      }),
      title: this.#titleSchema,
      description: this.#descriptionSchema,
    }).refine(
      (data) => data.title || data.description,
      {
        message: "Au moins le titre ou la description doit être fourni",
        path: ["title"]
      }
    );

    this.#validateSchema(schema, data);
  }

  validateUpdate(data) {
    const schema = z.object({
      artworkId: this.#artworkIdSchema.optional(),
      lang: z.enum(["FR", "EN", "WO"], {
        errorMap: () => ({ message: "La langue doit être FR, EN ou WO" })
      }).optional(),
      title: this.#titleSchema,
      description: this.#descriptionSchema.optional(),
      status: z.enum(["draft", "published"]).optional()
    }).refine(
      (data) => data.title || data.description,
      {
        message: "Au moins le titre ou la description doit être fourni",
        path: ["title"]
      }
    );

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