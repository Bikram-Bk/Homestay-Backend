import "dotenv/config";

const required = ["DATABASE_URL", "JWT_SECRET", "COOKIE_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  DATABASE_URL: process.env.DATABASE_URL,

  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_TLS: process.env.REDIS_TLS || "false",

  JWT_SECRET: process.env.JWT_SECRET,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  COOKIE_SECRET: process.env.COOKIE_SECRET,

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  ADMIN_URL: process.env.ADMIN_URL || "http://localhost:3001",

  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "HomestayNepal <no-reply@homestaynepal.com>",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "bikrambk2244@gmail.com",

  // eSewa ePay v2
  ESEWA_PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
  ESEWA_SECRET_KEY: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
  ESEWA_GATEWAY_URL: process.env.ESEWA_GATEWAY_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  ESEWA_STATUS_CHECK_URL: process.env.ESEWA_STATUS_CHECK_URL || "https://rc-epay.esewa.com.np/api/epay/transaction/status/",

  // Cloudinary 
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",

  // AI / RAG chatbot
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  COHERE_API_KEY: process.env.COHERE_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};

export default env;
