import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../database";
import * as schema from "../database/schema"
import { openAPI } from "better-auth/plugins";
import { sendEmail } from "../utils/mockEmail";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    emailVerification: {
        sendVerificationEmail: async ( { user, url, token }, request) => {
        void sendEmail({
            to: user.email,
            subject: "Verify your email address",
            text: `Click the link to verify your email: ${url}`,
            });
        },
    },
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema 
    }),
    plugins: [
        openAPI()
    ]
});