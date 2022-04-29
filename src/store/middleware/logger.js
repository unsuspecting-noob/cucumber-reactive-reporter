const logger = param => store => next => action => {
  console.log(action);
  if (action.type === "Error") {
    alert(action.payload);
  }
  return next(action);
}

export default logger;