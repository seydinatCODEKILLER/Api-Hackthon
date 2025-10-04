import { z } from "zod";

export default class HotspotSchema {
  #objectIdSchema = z.string()
    .min(1, "L'ID est requis")
    .regex(/^[0-9a-fA-F]{24}$/, "L'ID doit être un ObjectId valide");

  validateCreate(data) {
    const schema = z.object({
      panoramaId: this.#objectIdSchema,
      x: z.number().min(-180).max(180, "La coordonnée X doit être entre -180 et 180"),
      y: z.number().min(-90).max(90, "La coordonnée Y doit être entre -90 et 90"),
      targetType: z.enum(["PANORAMA", "ARTWORK"], {
        errorMap: () => ({ message: "Le type de cible doit être PANORAMA ou ARTWORK" }),
      }),
      hotspotType: z.enum(["NAVIGATION", "ARTWORK", "INFO"], {
        errorMap: () => ({ message: "Le type de hotspot doit être NAVIGATION, ARTWORK ou INFO" }),
      }),
      targetId: this.#objectIdSchema,
      label: z.string().max(100, "Le label ne peut pas dépasser 100 caractères").optional(),
    });

    return this.#validateSchema(schema, data);
  }

  validateUpdate(data) {
    const schema = z.object({
      panoramaId: this.#objectIdSchema.optional(),
      x: z.number().min(-180).max(180).optional(),
      y: z.number().min(-90).max(90).optional(),
      targetType: z.enum(["PANORAMA", "ARTWORK"]).optional(),
      hotspotType: z.enum(["NAVIGATION", "ARTWORK", "INFO"]).optional(),
      targetId: this.#objectIdSchema.optional(),
      label: z.string().max(100).optional()
    });

    return this.#validateSchema(schema, data);
  }

  #validateSchema(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.error.flatten().fieldErrors));
    }
    return result.data;
  }
}
