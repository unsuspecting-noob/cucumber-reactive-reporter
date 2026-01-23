import { Collapse, Grid, IconButton, TableCell, TableRow } from "@mui/material";
import { green, red, yellow } from '@mui/material/colors';

import AttachmentString from "./AttachmentString";
import AttachmentTable from "./AttachmentTable";
import DayJs from "dayjs";
import Duration from "dayjs/plugin/duration";
import Embedding from "./Embedding";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import React from "react";
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { getSettings } from "../store/uistates";
import { useSelector } from "react-redux";

const buildArgsSignature = (args) => {
  if (!Array.isArray(args)) {
    return "";
  }
  return args.map((item) => {
    if (item?.content) {
      return `c:${String(item.content)}`;
    }
    if (Array.isArray(item?.rows)) {
      const rows = item.rows.length;
      const cells = item.rows.reduce((sum, row) => sum + (row?.cells?.length ?? 0), 0);
      return `t:${rows}:${cells}`;
    }
    return "u";
  }).join("|");
};

const buildEmbeddingsSignature = (embeddings) => {
  if (!Array.isArray(embeddings)) {
    return "";
  }
  return embeddings.map((item) => {
    const type = item?.mime_type ?? item?.media?.type ?? "";
    const data = item?.data ?? item?.media ?? "";
    return `${type}:${String(data)}`;
  }).join("|");
};

const buildStepSignature = (step) => {
  if (!step) {
    return "";
  }
  return [
    step.keyword ?? "",
    step.name ?? "",
    step.status ?? "",
    step.duration ?? "",
    step.error_message ? "err" : "",
    buildArgsSignature(step.args),
    buildEmbeddingsSignature(step.embeddings),
    step.location ?? ""
  ].join("|");
};

const StepContainer = (props) => {
  const step = props.step;
  const {
    duration,
    keyword,
    name,
    args,
    embeddings,
    status,
    location,
    error_message,
    themeName
  } = step;
  const settings = useSelector((state) => getSettings(state));
  const isLive = Boolean(settings?.live?.enabled);

  let num = props.num;
  const open = Boolean(props.open);
  const stepKey = props.stepKey ?? "";

  let color = "";
  switch (status) {
    case "passed":
      color = green[700];
      break;
    case "failed":
      color = red[700];
      break;
    case "skipped":
      color = yellow[700];
      break;
    default:
      break;
  }

  const hasDuration = duration !== null && duration !== undefined && !Number.isNaN(Number(duration));
  let nanoseconds = hasDuration ? Number(duration) : null;
  //figure out total run time
  DayJs.extend(Duration);
  let duration_str = "";
  if (hasDuration) {
    let t = nanoseconds / 1000000;
    if (t % 1 !== 0) {
      t = Math.round(t);
    }
    let d = DayJs.duration(t);
    let m = d.minutes();
    let s = d.seconds();
    let ms = Math.round(d.milliseconds());
    if (m > 0) duration_str = duration_str + `${m}m`;
    if (s > 0) duration_str = duration_str + `${duration_str !== "" ? " " + s + "s" : s + "s"}`;
    if (ms > 0) duration_str = duration_str + `${duration_str !== "" ? " " + ms + "ms" : ms + "ms"}`;
    if (!duration_str) {
      duration_str = "0ms";
    }
  }

  const hasMore = args?.length || error_message || embeddings?.length;
  const word = keyword.replace(/\s/g, '');

  const handleToggle = () => {
    if (!hasMore || !props.onToggle) {
      return;
    }
    props.onToggle(!open);
  };

  return (
    <React.Fragment>
      <Tooltip title={location}>
        <TableRow onClick={handleToggle} hover={!isLive}>
          <TableCell size="small" variant="footer" padding="none" sx={{ width: "10px" }}>
            {hasMore ? (
              <IconButton
                aria-label="expand row"
                size="small"
              >
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>) : null}
          </TableCell>
          {word.toLowerCase() === "before" || word.toLowerCase() === "after" ? <TableCell /> :
            (
              <TableCell size="small" variant="footer" padding="none" align="left" sx={{ width: "2.16em" }}>
                <Typography variant="subtitle2" color="text.secondary" fontSize="1.08em">{num}</Typography>
              </TableCell>

            )
          }
          <TableCell variant="footer" padding="none" align="left" style={word.toLowerCase() === "before" || word.toLowerCase() === "after" ? {
            position: "relative",
            left: "-2em"
          } : {}}>
            <Typography variant="body1" sx={{ color: color, fontWeight: "bold", display: "flex" }} >{word}</Typography>
          </TableCell>
          <TableCell variant="footer" padding="none">
            <Typography color="text.secondary" sx={{ wordWrap: "break-word" }}>{name}</Typography>
          </TableCell>
          <TableCell size="small" variant="footer" padding="none" align="right" style={{ paddingRight: 5 }}>
            <Typography variant="subtitle2" sx={{
              fontWeight: "italic",
              whiteSpace: "nowrap",
              fontSize: "1.08em"
            }}>
              {duration_str}
            </Typography>
          </TableCell>
        </TableRow>
      </Tooltip>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            {args?.length ? (
              args.map((item, index) => {
                const key = `${stepKey}:arg:${index}`;
                if (item.content) {
                  return (
                    <Grid
                      container
                      item
                      alignItems="middle"
                      justifyContent="center"
                      key={key}
                      sx={{ overflow: "auto" }}
                      wrap="nowrap"
                    >
                      <Grid item xs={12}>
                        <AttachmentString content={item.content} themeName={themeName} sourceKey={key} />
                      </Grid>
                    </Grid>
                  );
                }
                if (item.rows?.length) {
                  return (
                    <Grid
                      container
                      item
                      alignItems="middle"
                      justifyContent="center"
                      key={key}
                      sx={{ overflow: "auto" }}
                      wrap="nowrap"
                    >
                      <Grid item xs={12}>
                        <AttachmentTable content={item} themeName={themeName} />
                      </Grid>
                    </Grid>
                  );
                }
                return null;
              })
            ) : null}
            {
              error_message ? (
                <Grid container item alignItems="middle" justifyContent="center" sx={{ overflow: "auto" }} wrap="nowrap">
                  <Grid item xs={12}>
                    <AttachmentString content={error_message} bColor={color} themeName={themeName} sourceKey={`${stepKey}:error`} />
                  </Grid>
                </Grid>
              ) : null
            }
            {
              embeddings?.length ? (
                <Grid container item alignItems="middle" justifyContent="center" sx={{ overflow: "auto" }} wrap="nowrap">
                  <Grid item xs={12}>
                    <Embedding content={embeddings} themeName={themeName} sourceKey={stepKey} />
                  </Grid>
                </Grid>
              ) : null
            }
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment >
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.num !== nextProps.num) {
    return false;
  }
  if (prevProps.open !== nextProps.open) {
    return false;
  }
  if (prevProps.themeName !== nextProps.themeName) {
    return false;
  }
  if (prevProps.stepKey !== nextProps.stepKey) {
    return false;
  }
  return buildStepSignature(prevProps.step) === buildStepSignature(nextProps.step);
};

export default React.memo(StepContainer, areEqual);
