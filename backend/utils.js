function isNull(value) {
  return value === null || value === undefined;
}

function sumReducer(accumulator, currentValue) {
  return accumulator + currentValue
}

module.exports = {
  isNull,
  sumReducer
};