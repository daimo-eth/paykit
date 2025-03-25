import { Address } from "viem";
import { z } from "zod";

export const zBigIntStr = z
  .string()
  .regex(/^[0-9]+$/i)
  .refine((s): s is BigIntStr => true);

export type BigIntStr = `${bigint}`;

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

export const zSolanaPublicKey = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]+$/);

export type SolanaPublicKey = z.infer<typeof zSolanaPublicKey>;

export type PlatformType = "ios" | "android" | "other";
