import '../overwriteStyles.css'

import { Box, Fab, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { makeStyles, useTheme } from '@mui/styles';

import ContentCopy from '@mui/icons-material/ContentCopy';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import React from "react";
import TextArea from './TextArea';
import { blueGrey } from '@mui/material/colors';
import clsx from 'clsx';
import { commonCellStyle } from './styles/commonStyles';

const Embedding = (props) => {
    const data = props.content;
    const themeName = props.themeName;
    let theme = useTheme();

    document.documentElement.style.setProperty("--textCol", blueGrey[themeName === "dark" ? 200 : 800]);
    document.documentElement.style.setProperty("--scrollBarCol", theme.palette.background.paper);
    document.documentElement.style.setProperty("--scrollBarThumbCol", blueGrey[300]);
    document.documentElement.style.setProperty("--scrollBarThumbHoverCol", blueGrey[300]);

    const useStyles = makeStyles({
        clearHidden: {},
        hiddenPin: {
            // visibility: "hidden"
            display: "none"
        },
        root: {
            "&:hover $clearHidden": {
                // visibility: "visible"
                display: "flex",
                marginLeft: "-40",
                position: "absolute"
            }
        }
    });

    const classes = useStyles();
    let renderOne = (item, c) => {
        let value = item.media ? item.media : item.data;
        let _mime = item.mime_type ? item.mime_type : item.media?.type;
        let arr = _mime.split(";");
        let mime = arr[0];
        switch (mime) {
            case "text/html":
                value = value.replace('\\n', '\n'); //really for html only
                return (
                    <TableRow key={c} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <div dangerouslySetInnerHTML={{ __html: value }} style={{ maxWidth: "100%" }} />
                        </TableCell>
                        <TableCell className={clsx(classes.hiddenPin, classes.clearHidden)} align="center" style={{ border: 'none', padding: 0 }}>
                            <CopyToClipboard text={value}>
                                <Fab color="primary" aria-label="copy to clipboard" size="small">
                                    <ContentCopy />
                                </Fab>
                            </CopyToClipboard>
                        </TableCell>
                    </TableRow>
                )
            case "text/xml":
            case "application/xml":
                return (
                    <TableRow key={c} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextArea
                                content={value}
                                type="xml"
                            />
                        </TableCell>
                        <TableCell className={clsx(classes.hiddenPin, classes.clearHidden)} align="center" style={{ border: 'none', padding: 0 }}>
                            <CopyToClipboard text={value}>
                                <Fab color="primary" aria-label="copy to clipboard" size="small">
                                    <ContentCopy />
                                </Fab>
                            </CopyToClipboard>
                        </TableCell>
                    </TableRow>
                )
            case "application/json":
                let obj;
                try {
                    obj = JSON.parse(value);
                    value = JSON.stringify(obj, null, 2); //pretty format

                    if (!obj) obj = {}; //this is a fix for when response returns "" which shows up in json as "\"\"" and then json viewer borks up
                } catch (e) {
                    value = e.message;
                }
                return (
                    <TableRow key={c} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextArea
                                content={value}
                                type="json"
                            />
                        </TableCell>
                        <TableCell className={clsx(classes.hiddenPin, classes.clearHidden)} align="center" style={{ border: 'none', padding: 0 }}>
                            <CopyToClipboard text={value}>
                                <Fab color="primary" aria-label="copy to clipboard" size="small">
                                    <ContentCopy />
                                </Fab>
                            </CopyToClipboard>
                        </TableCell>
                    </TableRow>
                )
            case "image/png":
                return (
                    <TableRow key={c} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            {value ? <img src={`data:image/png;base64,${value}`}
                                alt=""
                                style={{
                                    maxWidth: "100%",
                                    objectFit: "scale-down"
                                }}
                            /> : ''}
                        </TableCell>
                        <TableCell className={clsx(classes.hiddenPin, classes.clearHidden)} align="center" style={{ border: 'none', padding: 0 }}>

                        </TableCell>
                    </TableRow>
                );
            case "text/plain":
            default:
                return (
                    <TableRow key={c} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextArea
                                content={value}
                            />
                        </TableCell>
                        <TableCell className={clsx(classes.hiddenPin, classes.clearHidden)} align="center" style={{ border: 'none', padding: 0 }}>
                            <CopyToClipboard text={value}>
                                <Fab color="primary" aria-label="copy to clipboard" size="small">
                                    <ContentCopy />
                                </Fab>
                            </CopyToClipboard>
                        </TableCell>
                    </TableRow>
                )
        }
    }

    let count = 0; //change this to use data array index, this way can pass id to mouse over, and render when id matches row key
    return (
        <Box display="flex">
            <TableContainer component={Paper} style={{ marginBottom: "10px", marginTop: "10px" }}>
                <Table size="small" className={classes.table}>
                    <TableBody>
                        {data.map((item) => renderOne(item, count++))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box >
    )
}
export default Embedding;