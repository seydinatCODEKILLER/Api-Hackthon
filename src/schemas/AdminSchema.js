import { z } from "zod";

export default class AdminSchema {
  constructor() {
    this.phoneRegex = /^\+?[0-9]{6,14}$/;
  }

  validateCreate(data) {
    const schema = z.object({
      nom: z
        .string()
        .min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
      prenom: z
        .string()
        .min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
      email: z.string().email({ message: "Adresse email invalide" }),
      password: z
        .string()
        .min(6, {
          message: "Le mot de passe doit contenir au moins 6 caractères",
        }),
      telephone: z
        .string()
        .regex(this.phoneRegex, { message: "Numéro de téléphone invalide" }),
      avatar: z
        .instanceof(File)
        .refine(
          (file) =>
            ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
          { message: "Le fichier doit être une image (jpg, jpeg, png)" }
        )
        .optional(),
    });

    const result = schema.safeParse(data);
    if (!result.success) {
      const errors = Object.entries(result.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join(" | ");
      throw new Error(errors);
    }
  }
}
