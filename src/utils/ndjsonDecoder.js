/**
 * Purpose: Provide a streaming UTF-8 decoder for NDJSON chunks.
 * Responsibilities:
 * - Decode byte chunks without corrupting multibyte sequences.
 * - Reset decoder state when a stream restarts.
 * Inputs/Outputs: Accepts byte chunks; returns decoded text.
 * Invariants: Uses TextDecoder with streaming enabled.
 * See: /agents.md
 */

/**
 * Create a streaming UTF-8 decoder for NDJSON byte chunks.
 * Arguments: none.
 * Returns: `{ decode, flush, reset }` helpers for streaming decoding.
 * Raises: Error when `TextDecoder` is unavailable.
 * Examples:
 *   const decoder = createStreamingDecoder();
 *   const text = decoder.decode(chunk);
 */
export const createStreamingDecoder = () => {
  if (typeof TextDecoder === "undefined") {
    throw new Error("TextDecoder is required for live message decoding.");
  }

  let decoder = new TextDecoder("utf-8");

  return {
    decode: (chunk) => decoder.decode(chunk, { stream: true }),
    flush: () => decoder.decode(new Uint8Array(), { stream: false }),
    reset: () => {
      decoder = new TextDecoder("utf-8");
    }
  };
};
