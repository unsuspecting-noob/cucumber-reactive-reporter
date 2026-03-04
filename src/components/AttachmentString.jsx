import { Box, Fab, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

import ContentCopy from '@mui/icons-material/ContentCopy';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import React from "react";
import TextArea from "./TextArea";

const AttachmentString = (props) => {
    const { content, bColor, themeName, sourceKey } = props;
    let frameColor = bColor ? bColor : "grey";
    let cont = content.replace(/\\n/g, "\n");

    return content ? (
        <TableContainer component={Paper} style={{ marginBottom: "10px", marginTop: "10px", width: "100%" }}>
            <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableBody>
                    <TableRow hover>
                        <TableCell
                            align="center"
                            style={{ border: "groove", borderColor: frameColor, width: "100%" }}
                            sx={{
                                position: "relative",
                                "&:hover .copy-fab-wrapper": {
                                    opacity: 1,
                                    pointerEvents: "auto"
                                }
                            }}
                        >
                            <Box
                                className="copy-fab-wrapper"
                                sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    zIndex: 1,
                                    opacity: 0,
                                    transition: "opacity 0.2s ease",
                                    pointerEvents: "none"
                                }}
                            >
                                <CopyToClipboard text={content}>
                                    <Fab color="primary" aria-label="copy to clipboard" size="small">
                                        <ContentCopy />
                                    </Fab>
                                </CopyToClipboard>
                            </Box>
                            <TextArea
                                content={cont}
                                themeName={themeName}
                                sourceKey={sourceKey}
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>) : null
}
export default AttachmentString;
