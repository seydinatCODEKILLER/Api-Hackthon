import { z } from "zod"

export default class AuthSchema {
  constructor() {}

  validateLogin(data) {
    const schema = z.object({
      email: z.string().email({ message: "Adresse email invalide" }),
      password: z.string().min(6, {
        message: "Le mot de passe doit contenir au moins 6 caractères",
      }),
    });

    const result = schema.safeParse(data)
    if (!result.success) {
      const errors = Object.entries(result.error.flatten().fieldErrors)
        .map(([field, messages]) => `${field}: ${messages?.join(", ")}`)
        .join(" | ");
      throw new Error(errors);
    }
  }
}