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

const useStyles = makeStyles({
    clearHidden: {},
    hiddenPin: {
        display: "none"
    },
    root: {
        "&:hover $clearHidden": {
            display: "flex",
            marginLeft: "-40",
            position: "absolute"
        }
    }
});

const buildEmbeddingSignature = (items) => {
    if (!Array.isArray(items)) {
        return "";
    }
    return items.map((item) => {
        const type = item?.mime_type ?? item?.media?.type ?? "";
        const data = item?.data ?? item?.media ?? "";
        return `${type}:${String(data)}`;
    }).join("|");
};

const Embedding = (props) => {
    const data = props.content;
    const themeName = props.themeName;
    const sourceKey = props.sourceKey ?? "";
    let theme = useTheme();

    document.documentElement.style.setProperty("--textCol", blueGrey[themeName === "dark" ? 200 : 800]);
    document.documentElement.style.setProperty("--scrollBarCol", theme.palette.background.paper);
    document.documentElement.style.setProperty("--scrollBarThumbCol", blueGrey[300]);
    document.documentElement.style.setProperty("--scrollBarThumbHoverCol", blueGrey[300]);

    const classes = useStyles();
    let renderOne = (item, key) => {
        let value = item.media ? item.media : item.data;
        let _mime = item.mime_type ? item.mime_type : item.media?.type;
        let arr = _mime.split(";");
        let mime = arr[0];
        switch (mime) {
            case "text/html":
                value = value.replace('\\n', '\n'); //really for html only
                return (
                    <TableRow key={key} hover className={classes.root}>
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
                    <TableRow key={key} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextArea
                                content={value}
                                type="xml"
                                themeName={themeName}
                                sourceKey={key}
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
                    <TableRow key={key} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextArea
                                content={value}
                                type="json"
                                themeName={themeName}
                                sourceKey={key}
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
                    <TableRow key={key} hover className={classes.root}>
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
                    <TableRow key={key} hover className={classes.root}>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            <TextArea
                                content={value}
                                themeName={themeName}
                                sourceKey={key}
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

    return (
        <Box display="flex">
            <TableContainer component={Paper} style={{ marginBottom: "10px", marginTop: "10px" }}>
                <Table size="small" className={classes.table}>
                    <TableBody>
                        {data.map((item, index) => {
                            const key = sourceKey ? `${sourceKey}:${index}` : String(index);
                            return renderOne(item, key);
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box >
    )
}

const areEqual = (prevProps, nextProps) => {
    if (prevProps.themeName !== nextProps.themeName) {
        return false;
    }
    if (prevProps.sourceKey !== nextProps.sourceKey) {
        return false;
    }
    return buildEmbeddingSignature(prevProps.content) === buildEmbeddingSignature(nextProps.content);
};

export default React.memo(Embedding, areEqual);
