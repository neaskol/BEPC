import { z } from "zod";

export const inscriptionSchema = z.object({
  prenom: z
    .string()
    .min(2, "Le prénom doit avoir au moins 2 caractères")
    .max(50, "Le prénom est trop long"),
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit avoir au moins 8 caractères"),
  ville: z.string().optional(),
  bepc_date: z.string().optional(),
});

export type InscriptionInput = z.infer<typeof inscriptionSchema>;

export const connexionSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export type ConnexionInput = z.infer<typeof connexionSchema>;
