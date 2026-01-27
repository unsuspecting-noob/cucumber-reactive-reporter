/**
 * Purpose: Incrementally parse NDJSON text chunks.
 * Responsibilities:
 * - Buffer partial lines between chunks.
 * - Parse complete JSON lines and forward to a handler.
 * Inputs/Outputs: Accepts text chunks; emits parsed objects.
 * Invariants: Partial lines remain buffered until completed.
 * See: /agents.md
 */

/**
 * Create an NDJSON buffer.
 * Arguments:
 * - onItem: function invoked with each parsed JSON value.
 * - onError: optional function invoked with (error, rawLine).
 * Returns: `{ push, flush, reset, getBuffer }` helpers.
 * Examples:
 *   const buffer = createNdjsonBuffer({ onItem: (obj) => items.push(obj) });
 *   buffer.push('{"a":1}\\n{"b":2}\\n');
 */
export const createNdjsonBuffer = ({ onItem, onError } = {}) => {
  if (typeof onItem !== "function") {
    throw new Error("createNdjsonBuffer requires an onItem function.");
  }

  let buffer = "";

  const parseLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return 0;
    }
    try {
      onItem(JSON.parse(trimmed));
      return 1;
    } catch (err) {
      if (typeof onError === "function") {
        onError(err, trimmed);
      }
      return 0;
    }
  };

  const push = (chunk) => {
    if (!chunk) {
      return 0;
    }
    buffer += String(chunk);
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    let applied = 0;
    for (const line of lines) {
      applied += parseLine(line);
    }
    return applied;
  };

  const flush = () => {
    const leftover = buffer;
    buffer = "";
    return parseLine(leftover);
  };

  const reset = () => {
    buffer = "";
  };

  return {
    push,
    flush,
    reset,
    getBuffer: () => buffer
  };
};
