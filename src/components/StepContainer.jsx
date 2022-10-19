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

const StepContainer = (props) => {
  let step = props.step;
  const { duration, keyword, name, args, embeddings, status, location, error_message, themeName } = step;

  let num = props.num;

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

  let count = 0;
  let nanoseconds = duration;
  if (isNaN(duration)) nanoseconds = 0;
  //figure out total run time
  DayJs.extend(Duration);
  let d = DayJs.duration(nanoseconds / 1000000);
  let duration_str = "";
  let m = d.minutes();
  let s = d.seconds();
  let ms = Math.round(d.milliseconds());
  if (m > 0) duration_str = duration_str + `${m}m`;
  if (s > 0) duration_str = duration_str + `${duration_str !== "" ? " " + s + "s" : s + "s"}`;
  if (ms > 0) duration_str = duration_str + `${duration_str !== "" ? " " + ms + "ms" : ms + "ms"}`;

  const hasMore = args?.length || error_message || embeddings?.length;
  const word = keyword.replace(/\s/g, '');

  const [open, setOpen] = React.useState((error_message || (word.toLowerCase() === "after" && embeddings?.length)) ? true : false);

  return (
    <React.Fragment>
      <Tooltip title={location}>
        <TableRow onClick={() => setOpen(!open)} hover={true}>
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
              args?.map((item) =>
              (
                item.content ? (
                  <Grid container item alignItems="middle" justifyContent="center" key={count++} sx={{ overflow: "auto" }} wrap="nowrap">
                    <Grid item xs={12}>
                      <AttachmentString content={item.content} />
                    </Grid>
                  </Grid>) :
                  (item.rows?.length ? (
                    <Grid container item alignItems="middle" justifyContent="center" key={count++} sx={{ overflow: "auto" }} wrap="nowrap">
                      <Grid item xs={12}>
                        <AttachmentTable content={item} themeName={themeName} />
                      </Grid>
                    </Grid>) : null)
              ))
            ) : null}
            {
              error_message ? (
                <Grid container item alignItems="middle" justifyContent="center" sx={{ overflow: "auto" }} wrap="nowrap">
                  <Grid item xs={12}>
                    <AttachmentString content={error_message} bColor={color} />
                  </Grid>
                </Grid>
              ) : null
            }
            {
              embeddings?.length ? (
                <Grid container item alignItems="middle" justifyContent="center" sx={{ overflow: "auto" }} wrap="nowrap">
                  <Grid item xs={12}>
                    <Embedding content={embeddings} themeName={themeName} />
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

export default StepContainer;
