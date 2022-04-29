import { green, red, yellow } from '@mui/material/colors';

import AttachmentString from "./AttachmentString";
import AttachmentTable from "./AttachmentTable";
import DayJs from "dayjs";
import Duration from "dayjs/plugin/duration";
import Embedding from "./Embedding";
import { Grid } from "@mui/material";
import React from "react";
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const StepContainer = (props) => {
  let step = props.step;
  const { duration, keyword, name, args, embeddings, status, location, error_message } = step;
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
  let ms = d.milliseconds();
  if (m > 0) duration_str = duration_str + `${m}m`;
  if (s > 0) duration_str = duration_str + `${duration_str !== "" ? " " + s + "s" : s + "s"}`;
  if (ms > 0) duration_str = duration_str + `${duration_str !== "" ? " " + ms + "ms" : ms + "ms"}`;

  return (
    <React.Fragment>
      <Grid item container direction="row" spacing={0.5} sx={{ justifyItems: "left" }}>
        <Grid item xs={0.2} ></Grid>
        <Grid item xs={0.2} sx={{}}><Typography variant="subtitle2" color="text.secondary" fontSize="1.08em">{num}</Typography></Grid>
        <Grid item xs={0.7} sx={{ color: color, fontWeight: "bold", display: "flex" }}>
          <Tooltip title={location}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>{keyword.replace(/\s/g, '')}</Typography>
          </Tooltip>
        </Grid>
        <Grid item xs={10} sx={{ textAlign: "left" }}>
          <Tooltip title={location}>
            <Typography variant="body1" color="text.secondary" sx={{ wordWrap: "break-word", marginRight: "1vh" }}>{name}</Typography>
          </Tooltip>
        </Grid>
        <Grid item xs={0.9} sx={{ color: "text.secondary", display: "flex" }}>
          <Tooltip title={location}>
            <Typography variant="subtitle2" sx={{ fontWeight: "italic", whiteSpace: "nowrap" }}>{duration_str}</Typography>
          </Tooltip>
        </Grid>
      </Grid>
      {args?.length ? (
        args?.map((item) =>
        (
          item.content ? (
            <Grid container item alignItems="middle" justifyContent="center" key={count++} sx={{ overflow: "auto" }} wrap="nowrap">
              <Grid item xs={10}>
                <AttachmentString content={item.content} />
              </Grid>
            </Grid>) :
            (item.rows?.length ? (
              <Grid container item alignItems="middle" justifyContent="center" key={count++} sx={{ overflow: "auto" }} wrap="nowrap">
                <Grid item xs={10}>
                  <AttachmentTable content={item} themeName={props.themeName} />
                </Grid>
              </Grid>) : null)
        ))
      ) : null}
      {
        error_message ? (
          <Grid container item alignItems="middle" justifyContent="center" sx={{ overflow: "auto" }} wrap="nowrap">
            <Grid item item xs={10}>
              <AttachmentString content={error_message} bColor={color} />
            </Grid>
          </Grid>
        ) : null
      }
      {
        embeddings?.length ? (
          <Grid container item alignItems="middle" justifyContent="center" sx={{ overflow: "auto" }} wrap="nowrap">
            <Grid item item xs={10}>
              <Embedding content={embeddings} themeName={props.themeName} />
            </Grid>
          </Grid>
        ) : null
      }
    </React.Fragment >
  );
};

export default StepContainer;
