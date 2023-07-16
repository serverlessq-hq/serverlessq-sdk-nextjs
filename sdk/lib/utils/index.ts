import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";
import { createHmac } from "crypto";
import { NextApiRequest } from "next";
import { IS_VERCEL, LOCAL_DEVELOPMENT_ERROR, VERCEL_URL } from "./constants";
import { extractApiRoute } from "./sanitize-input";

export const isProduction = (phase: any) => [PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER].includes(phase);

export const buildCronTarget = (localTarget?: string) => {
    if (!IS_VERCEL) {
      if (!localTarget) {
        throw new Error(LOCAL_DEVELOPMENT_ERROR)
      }
      return localTarget
    } 
    return `https://${VERCEL_URL}/${extractApiRoute(__filename)}`
  }

export const verifySignature = (req: NextApiRequest, payload: string) => {
    const signature = createHmac("sha256", String(process.env.SERVERLESSQ_API_TOKEN))
      .update(payload)
      .digest("hex");
    return signature === req.headers["x-serverlessq-signature"];
};