import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from "@mui/material";

import React from "react";
import Typography from '@mui/material/Typography';
import { commonTextStyle } from "./styles/commonStyles";
import { styled } from '@mui/material/styles';

const AttachmentTable = (props) => {
    const { content } = props;
    const Item = styled(Paper)(({ theme }) => ({
        ...theme.typography.body2,
        textAlign: 'center',
        color: theme.palette.text.secondary,
        minWidth: "100%",
        border: "2px solid",
        borderColor: theme.palette.divider
    }));
    let i = 0;
    let j = 0;
    return (
        <Box sx={{}}>
            <TableContainer component={Item}>
                <Table size="small">
                    <TableBody>
                        {content.rows.map((row) => (
                            <TableRow
                                key={i++}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                {row.cells.map((cell) => (
                                    <TableCell align="center" padding="none" style={{ border: 'groove', borderColor: "grey" }} key={j++}>
                                        <Typography sx={{ ...commonTextStyle, color: "text.secondary", textAlign: "center" }}>
                                            {cell}
                                        </Typography>
                                    </TableCell>
                                ))}
                            </TableRow>))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}
export default AttachmentTable;