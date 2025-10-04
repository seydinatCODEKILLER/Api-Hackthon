import { z } from "zod";

export default class PanoramaSchema {
  #titleSchema = z.string()
    .min(1, "Le titre est requis")
    .max(255, "Le titre ne peut pas dépasser 255 caractères");

  #descriptionSchema = z.string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional();

  validateCreate(data) {
    const schema = z.object({
      title: this.#titleSchema,
      description: this.#descriptionSchema,
      roomType: z.enum(["MODERN_ART", "HISTORY"], {
        errorMap: () => ({
          message: "Le type de salle doit être MODERN_ART ou HISTORY",
        }),
      }),
      imageUrl: z
        .instanceof(File)
        .refine(
          (file) =>
            ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
          { message: "Le fichier doit être une image (jpg, jpeg, png)" }
        ),
    });

    this.#validateSchema(schema, data);
  }

  validateUpdate(data) {
    const schema = z.object({
      title: this.#titleSchema.optional(),
      description: this.#descriptionSchema.optional(),
      roomType: z.enum(["MODERN_ART", "HISTORY"], {
        errorMap: () => ({
          message: "Le type de salle doit être MODERN_ART ou HISTORY",
        }),
      }).optional(),
      imageUrl: z
        .instanceof(File)
        .refine(
          (file) =>
            ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
          { message: "Le fichier doit être une image (jpg, jpeg, png)" }
        ).optional(),
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