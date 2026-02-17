import '../overwriteStyles.css'

import { Box, Fab, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";
import { useTheme } from '@mui/material/styles';

import ContentCopy from '@mui/icons-material/ContentCopy';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import React from "react";
import TextArea from './TextArea';
import { blueGrey } from '@mui/material/colors';
import { commonCellStyle } from './styles/commonStyles';

const copyFabWrapperSx = {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1
};

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

    let renderOne = (item, key) => {
        let value = item.media ? item.media : item.data;
        let _mime = item.mime_type ? item.mime_type : item.media?.type;
        let arr = _mime.split(";");
        let mime = arr[0];
        switch (mime) {
            case "text/html":
                value = value.replace('\\n', '\n'); //really for html only
                return (
                    <TableRow key={key} hover>
                        <TableCell align="center" style={{ ...commonCellStyle, position: "relative" }}>
                            <Box sx={copyFabWrapperSx}>
                                <CopyToClipboard text={value}>
                                    <Fab color="primary" aria-label="copy to clipboard" size="small">
                                        <ContentCopy />
                                    </Fab>
                                </CopyToClipboard>
                            </Box>
                            <div dangerouslySetInnerHTML={{ __html: value }} style={{ maxWidth: "100%" }} />
                        </TableCell>
                    </TableRow>
                )
            case "text/xml":
            case "application/xml":
                return (
                    <TableRow key={key} hover>
                        <TableCell align="center" style={{ ...commonCellStyle, position: "relative" }}>
                            <Box sx={copyFabWrapperSx}>
                                <CopyToClipboard text={value}>
                                    <Fab color="primary" aria-label="copy to clipboard" size="small">
                                        <ContentCopy />
                                    </Fab>
                                </CopyToClipboard>
                            </Box>
                            <TextArea
                                content={value}
                                type="xml"
                                themeName={themeName}
                                sourceKey={key}
                            />
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
                    <TableRow key={key} hover>
                        <TableCell align="center" style={{ ...commonCellStyle, position: "relative" }}>
                            <Box sx={copyFabWrapperSx}>
                                <CopyToClipboard text={value}>
                                    <Fab color="primary" aria-label="copy to clipboard" size="small">
                                        <ContentCopy />
                                    </Fab>
                                </CopyToClipboard>
                            </Box>
                            <TextArea
                                content={value}
                                type="json"
                                themeName={themeName}
                                sourceKey={key}
                            />
                        </TableCell>
                    </TableRow>
                )
            case "image/png":
                return (
                    <TableRow key={key} hover>
                        <TableCell align="center" style={{ ...commonCellStyle }}>
                            {value ? <img src={`data:image/png;base64,${value}`}
                                alt=""
                                style={{
                                    maxWidth: "100%",
                                    objectFit: "scale-down"
                                }}
                            /> : ''}
                        </TableCell>
                    </TableRow>
                );
            case "text/plain":
            default:
                return (
                    <TableRow key={key} hover>
                        <TableCell align="center" style={{ ...commonCellStyle, position: "relative" }}>
                            <Box sx={copyFabWrapperSx}>
                                <CopyToClipboard text={value}>
                                    <Fab color="primary" aria-label="copy to clipboard" size="small">
                                        <ContentCopy />
                                    </Fab>
                                </CopyToClipboard>
                            </Box>
                            <TextArea
                                content={value}
                                themeName={themeName}
                                sourceKey={key}
                            />
                        </TableCell>
                    </TableRow>
                )
        }
    }

    return (
        <Box display="flex">
            <TableContainer component={Paper} style={{ marginBottom: "10px", marginTop: "10px", width: "100%" }}>
                <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
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
