export const normalizeMimeType = (value) =>
  String(value ?? "").split(";")[0].trim().toLowerCase();

export const isJsonLikeMimeType = (value) => {
  const mimeType = normalizeMimeType(value);
  return mimeType === "application/json" || mimeType.endsWith("+json");
};

export const isXmlLikeMimeType = (value) => {
  const mimeType = normalizeMimeType(value);
  return (
    mimeType === "application/xml"
    || mimeType === "text/xml"
    || mimeType.endsWith("+xml")
  );
};

export const isImageMimeType = (value) =>
  normalizeMimeType(value).startsWith("image/");

export const isVideoMimeType = (value) =>
  normalizeMimeType(value).startsWith("video/");

export const shouldDecodeTextEmbedding = (value) => {
  const mimeType = normalizeMimeType(value);
  if (!mimeType) {
    return false;
  }
  if (mimeType.startsWith("text/")) {
    return true;
  }
  return isJsonLikeMimeType(mimeType) || isXmlLikeMimeType(mimeType);
};
