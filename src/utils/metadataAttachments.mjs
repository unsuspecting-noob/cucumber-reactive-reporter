import { normalizeMimeType } from "./mime.mjs";

const ALLURE_MESSAGE_MIME_TYPE = "application/vnd.allure.message+json";

const looksLikeBase64 = (value) => {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length % 4 !== 0) {
    return false;
  }
  if (/[^A-Za-z0-9+/=]/.test(trimmed)) {
    return false;
  }
  return true;
};

const decodeBase64Text = (value) => {
  if (!looksLikeBase64(value)) {
    return null;
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }
  if (typeof atob === "function") {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
  return null;
};

const parseJsonPayload = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
};

export const isSuppressedMetadataAttachment = ({ mimeType, data }) => {
  if (normalizeMimeType(mimeType) !== ALLURE_MESSAGE_MIME_TYPE) {
    return false;
  }

  const direct = parseJsonPayload(data);
  if (direct?.type === "metadata") {
    return true;
  }

  const decoded = decodeBase64Text(data);
  const parsedDecoded = parseJsonPayload(decoded);
  return parsedDecoded?.type === "metadata";
};
