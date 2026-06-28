// src/hooks/useUploadAnswerKey.js
import { useState } from "react";

export const useUploadAnswerKey = () => {
  const [answerKeyUrl, setAnswerKeyUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const uploadAnswerKey = async (file) => {
    if (!file) {
      throw new Error("No file selected");
    }

    setUploading(true);

    try {
      const cloudName =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dpra7twgu";
      const uploadPreset =
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
      const apiKey =
        import.meta.env.VITE_CLOUDINARY_API_KEY || "264177562313129";

      console.log("Uploading to Cloudinary:", {
        cloudName,
        uploadPreset,
        apiKey: apiKey ? "Present" : "Missing",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      formData.append("api_key", apiKey);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary error response:", errorData);

        if (response.status === 401) {
          throw new Error(`Authentication failed. Please check:
1. Your Cloudinary API key is correct
2. Your upload preset "${uploadPreset}" exists and is set to "Unsigned" mode`);
        } else if (response.status === 404) {
          throw new Error(
            `Cloud name "${cloudName}" not found. Please check your cloud name.`,
          );
        } else {
          throw new Error(
            `Upload failed: ${errorData.error?.message || response.statusText}`,
          );
        }
      }

      const data = await response.json();
      console.log("Upload success:", data);

      if (data.secure_url) {
        setAnswerKeyUrl(data.secure_url);
        setUploading(false);
        return data.secure_url;
      } else {
        throw new Error("No secure_url in response");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploading(false);
      throw error;
    }
  };

  const deleteAnswerKey = async () => {
    if (!answerKeyUrl) {
      throw new Error("No image to delete");
    }

    setDeleting(true);

    try {
      const cloudName =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dpra7twgu";
      const apiKey =
        import.meta.env.VITE_CLOUDINARY_API_KEY || "264177562313129";
      const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || "";

      // Extract public ID from the URL
      // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
      const urlParts = answerKeyUrl.split("/");
      const uploadIndex = urlParts.indexOf("upload");
      if (uploadIndex === -1) {
        throw new Error("Invalid Cloudinary URL format");
      }

      // Get everything after 'upload' (skip the version number)
      const publicIdParts = urlParts.slice(uploadIndex + 2);
      // Remove the version number (v1234567890)
      if (publicIdParts.length > 0 && publicIdParts[0].startsWith("v")) {
        publicIdParts.shift();
      }
      // Join back with slashes and remove file extension
      let publicId = publicIdParts.join("/");
      // Remove file extension
      const lastDotIndex = publicId.lastIndexOf(".");
      if (lastDotIndex !== -1) {
        publicId = publicId.substring(0, lastDotIndex);
      }

      console.log("Deleting image with public_id:", publicId);

      // Create timestamp and signature for authenticated delete request
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = await generateSignature(publicId, timestamp, apiSecret);

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
          method: "POST",
          body: formData,
        },
      );

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary delete error response:", errorData);
        throw new Error(
          `Delete failed: ${errorData.error?.message || response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Delete success:", data);

      if (data.result === "ok") {
        setAnswerKeyUrl(null);
        setDeleting(false);
        return true;
      } else {
        throw new Error(`Delete failed: ${data.result || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleting(false);
      throw error;
    }
  };

  // Helper function to generate SHA-1 signature
  const generateSignature = async (publicId, timestamp, apiSecret) => {
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;

    // Use the Web Crypto API to generate SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return signature;
  };

  const resetUpload = () => {
    setAnswerKeyUrl(null);
    setUploading(false);
    setDeleting(false);
  };

  return {
    answerKeyUrl,
    uploading,
    deleting,
    uploadAnswerKey,
    deleteAnswerKey,
    resetUpload,
    setAnswerKeyUrl, // FIX: was missing -- Dashboard.jsx's handleViewQuiz
    // destructures and calls this directly to load a quiz's stored
    // answerKeyUrl, which threw "setAnswerKeyUrl is not a function"
    // because it was undefined (never returned from this hook).
  };
};
