import { z } from "zod";

export default class ArtistSchema {

  #nameSchema = z
    .string()
    .min(1, "Le champ est requis")
    .max(100, "Ne peut pas dépasser 100 caractères");

    #bioSchema = z
    .string()
    .min(1, "Le champ est requis")
    .max(700, "Ne peut pas dépasser 700 caractères");

  validateCreate(data) {
    const schema = z.object({
      nom: this.#nameSchema,
      prenom: this.#nameSchema,
      bio: this.#bioSchema,
      avatar: z
        .instanceof(File)
        .refine(
          (file) =>
            ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
          { message: "Le fichier doit être une image (jpg, jpeg, png)" }
        )
        .optional(),
    });

    this.#validateSchema(schema, data);
  }

  validateUpdate(data) {
    const schema = z.object({
      nom: this.#nameSchema.optional(),
      prenom: this.#nameSchema.optional(),
      bio: this.#bioSchema.optional(),
      avatar: z
        .instanceof(File)
        .refine(
          (file) => ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
          { message: "Le fichier doit être une image (jpg, jpeg, png)" }
        )
        .optional(),
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
