import { Fab, Paper, Table, TableBody, TableCell, TableContainer, TableRow, TextareaAutosize } from "@mui/material";

import ContentCopy from '@mui/icons-material/ContentCopy';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import React from "react";
import clsx from 'clsx';
import { commonTextStyle } from "./styles/commonStyles";
import { makeStyles } from '@mui/styles';

const AttachmentString = (props) => {
    const { content, bColor } = props;
    const useStyles = makeStyles({
        root: {
            "&:hover $clearHidden": {
                // visibility: "visible"
                display: "flex",
                position: "absolute",
                marginLeft: "-40"
            }
        },
        clearHidden: {},
        hiddenPin: {
            // visibility: "hidden"
            display: "none"
        }

    });
    const classes = useStyles();

    let frameColor = bColor ? bColor : "grey";
    return content ? (
        <TableContainer component={Paper} style={{ marginBottom: "10px", marginTop: "10px" }}>
            <Table size="small" >
                <TableBody>
                    <TableRow hover className={classes.root}>
                        <TableCell align="center" style={{ border: "groove", borderColor: frameColor }}>
                            <TextareaAutosize
                                maxRows={30}
                                readOnly
                                style={{ ...commonTextStyle, textAlign: "justify" }}
                                defaultValue={content} />
                        </TableCell>
                        <TableCell className={clsx(classes.hiddenPin, classes.clearHidden)} align="center" style={{ border: 'none', padding: 0 }}>
                            <CopyToClipboard text={content}>
                                <Fab color="primary" aria-label="copy to clipboard" size="small">
                                    <ContentCopy />
                                </Fab>
                            </CopyToClipboard>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>) : null
}
export default AttachmentString;