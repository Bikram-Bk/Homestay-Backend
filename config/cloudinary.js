import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";

let configured = false;

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  configured = true;
  console.log(`[cloudinary] Configured for cloud: ${env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.warn("[cloudinary] Credentials not set — /api/uploads will return 503");
}

export async function uploadBuffer(buffer, folder = "homestaynepal") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export { configured as cloudinaryConfigured };
export default cloudinary;
