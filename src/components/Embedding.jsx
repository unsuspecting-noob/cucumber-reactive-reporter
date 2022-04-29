import '../overwriteStyles.css'

import { Box, Fab, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextareaAutosize } from "@mui/material";
import React, { useState } from "react";
import { commonCellStyle, commonTextStyle } from './styles/commonStyles';
import { makeStyles, useTheme } from '@mui/styles';

import ContentCopy from '@mui/icons-material/ContentCopy';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ReactJson from 'react-json-view';
import XMLViewer from 'react-xml-viewer'
import { blueGrey } from '@mui/material/colors';
import clsx from 'clsx';
import { pd } from "pretty-data";

const Embedding = (props) => {
    const data = props.content;
    const themeName = props.themeName;
    const maxXMLchars = 80;

    let theme = useTheme();
    // console.dir(theme.palette);
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

    const [collapse, setCollapse] = useState(false); //store state locally, should think about moving it into redux store
    const [drag, setDrag] = useState(false); //store state locally, should think about moving it into redux store
    const handleClick = () => {
        if (!drag) collapse ? setCollapse(false) : setCollapse(true);
    };
    const onMouseDown = () => {
        setDrag(false);
    };
    const onMouseMove = () => {
        setDrag(true);
    };

    const classes = useStyles();
    const customThemeXML = {
        overflowBreak: true,
        separatorColor: "#EAECEE",
        attributeValueColor: "#c7c795",
        attributeKeyColor: "#008000",
        textColor: "#a9ab95"
    }



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
                let preview;
                let formatted = pd.xml(value);
                if (formatted.length > maxXMLchars) {
                    if (!collapse) preview = formatted.substring(0, maxXMLchars - 1) + " ... click for more";
                }
                if (!preview) {
                    return (
                        <TableRow key={c} hover className={classes.root}>
                            <TableCell align="center" style={{ ...commonCellStyle }}>
                                <div style={{ ...commonTextStyle, width: "stretch" }}>
                                    <XMLViewer
                                        xml={value}
                                        indentSize={3}
                                        theme={themeName === "dark" ? customThemeXML : {}}
                                        collapsible={false}
                                        onMouseUp={handleClick}
                                        onMouseDown={onMouseDown}
                                        onMouseMove={onMouseMove}
                                    />
                                </div>
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
                } else return (
                    <TableRow key={c} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextareaAutosize
                                maxRows={30}
                                readOnly
                                style={{ ...commonTextStyle }}
                                defaultValue={preview}
                                onClick={handleClick} />
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
                            <ReactJson
                                src={obj}
                                theme={themeName == "dark" ? "ashes" : "apathy:inverted"}
                                style={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                    textAlign: "left",
                                    backgroundColor: themeName === "dark" ? null : "#e9е9е9"
                                }}
                                name={false}
                                displayDataTypes={false}
                                collapseStringsAfterLength={100}
                                indentWidth={2}
                                collapsed={1}
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
                return null;
            case "text/plain":
            default:
                return (
                    <TableRow key={c} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextareaAutosize
                                maxRows={30}
                                readOnly
                                style={{ ...commonTextStyle }}
                                defaultValue={value} />
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
                <Table size="small" className={classes.table} >
                    <TableBody>
                        {data.map((item) => renderOne(item, count++))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box >
    )
}
export default Embedding;