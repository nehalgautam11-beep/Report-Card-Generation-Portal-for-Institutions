import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dkgokowix", // Added a default or it needs to be provided
  api_key: "833257549218487",
  api_secret: "pjXnOp7gaOp2HRixE9QhvGJw4gQ",
});

export const uploadPDF = (buffer: Buffer, tag: string, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw", // PDF is typically handled as raw, or image if you want preview. "raw" is better for raw PDF downloads. Wait, "raw" doesn't support generate_archive well unless it's set as image? No, cloudinary generate_archive supports raw files too if specified. Let's use raw.
        public_id: filename,
        tags: [tag],
      },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

export const generateArchiveUrl = (tag: string): string => {
  // It returns a URL that triggers downloading a zip of all assets with the given tag
  return cloudinary.utils.download_zip_url({
    tags: [tag],
    resource_type: "raw",
  });
};

export default cloudinary;
