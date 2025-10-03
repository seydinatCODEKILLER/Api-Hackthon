import { z } from "zod";

export default class ArtworkMediaSchema {
  #artworkIdSchema = z
    .string()
    .min(1, "L'ID de l'œuvre est requis")
    .regex(/^[0-9a-fA-F]{24}$/, "L'ID de l'œuvre doit être un ObjectId valide");

  validateCreate(data) {
    const schema = z.object({
      artworkId: this.#artworkIdSchema,
      type: z.enum(["IMAGE", "AUDIO", "VIDEO"], {
        errorMap: () => ({
          message: "Le type doit être IMAGE, AUDIO ou VIDEO",
        }),
      }),
    });

    this.#validateSchema(schema, data);
  }

  #validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
  }
}
