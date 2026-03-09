import { Box, Link, Typography } from "@mui/material";
import React from "react";

const TRUNCATE_LINE_COUNT = 3;
const URL_RE = /https?:\/\/[^\s)>\]]+/g;

/**
 * Parses a raw cucumber feature description string into structured line objects.
 * Each line has: { isBullet, segments: [{ type: "text"|"url", content }] }
 */
const parseDescription = (raw) => {
  if (!raw || typeof raw !== "string") return [];

  const normalized = raw.replace(/\\n/g, "\n");
  const rawLines = normalized.split("\n");
  const result = [];

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isBullet = /^[-*]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed);

    const segments = [];
    let lastIndex = 0;
    const urlRe = new RegExp(URL_RE.source, "g");
    let match;
    while ((match = urlRe.exec(trimmed)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", content: trimmed.slice(lastIndex, match.index) });
      }
      segments.push({ type: "url", content: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < trimmed.length) {
      segments.push({ type: "text", content: trimmed.slice(lastIndex) });
    }

    // Strip the bullet prefix from the first text segment so we render our own bullet
    let displaySegments = segments;
    if (isBullet && segments.length && segments[0].type === "text") {
      const stripped = segments[0].content.replace(/^([-*]|\d+[.)])\s?/, "");
      displaySegments = [{ type: "text", content: stripped }, ...segments.slice(1)];
    }

    result.push({ isBullet, segments: displaySegments });
  }
  return result;
};

const FeatureDescription = ({ description, themeName }) => {
  const [expanded, setExpanded] = React.useState(false);
  const lines = React.useMemo(() => parseDescription(description), [description]);

  if (!lines.length) return null;

  const needsTruncation = lines.length > TRUNCATE_LINE_COUNT;
  const visibleLines = needsTruncation && !expanded
    ? lines.slice(0, TRUNCATE_LINE_COUNT)
    : lines;

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <Box
      sx={{
        borderLeft: "3px solid",
        borderColor: themeName === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        pl: 1.5,
        ml: 0.5,
        py: 0.5,
        textAlign: "left",
      }}
    >
      {visibleLines.map((line, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            alignItems: "baseline",
            ...(line.isBullet ? { pl: 1.5 } : {}),
            "&:not(:last-child)": { mb: 0.25 }
          }}
        >
          {line.isBullet && (
            <Typography
              component="span"
              variant="body2"
              color="text.disabled"
              sx={{ mr: 0.75, flexShrink: 0, fontSize: "0.8rem" }}
            >
              {"\u2022"}
            </Typography>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: "0.8rem",
              lineHeight: 1.5,
              overflowWrap: "anywhere"
            }}
          >
            {line.segments.map((seg, j) =>
              seg.type === "url" ? (
                <Link
                  key={j}
                  href={seg.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    fontSize: "inherit",
                    wordBreak: "break-all",
                    color: themeName === "dark" ? "primary.light" : "primary.main",
                    textDecorationColor: "inherit",
                    "&:hover": { textDecorationStyle: "solid" }
                  }}
                >
                  {seg.content}
                </Link>
              ) : (
                <React.Fragment key={j}>{seg.content}</React.Fragment>
              )
            )}
          </Typography>
        </Box>
      ))}
      {needsTruncation && (
        <Typography
          component="span"
          variant="body2"
          onClick={handleToggle}
          sx={{
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: themeName === "dark" ? "primary.light" : "primary.main",
            mt: 0.25,
            display: "inline-block",
            "&:hover": { textDecoration: "underline" },
            userSelect: "none"
          }}
        >
          {expanded ? "show less" : `... show more (${lines.length - TRUNCATE_LINE_COUNT} more lines)`}
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(FeatureDescription, (prev, next) =>
  prev.description === next.description && prev.themeName === next.themeName
);
