import * as React from 'react';

import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';

const LoadingBar = (props) => {
    let progress = props.value;
    return (
        <Box sx={{ display: "inline-flex", width: "80%", alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">{`${Math.round(
                    progress,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}

LoadingBar.propTypes = {
    value: PropTypes.number.isRequired,
};

export default LoadingBar;