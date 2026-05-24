import moment from "moment";

export function getGridBounds() {
  const today = moment.utc().startOf("day");
  const endSunday = today.clone().day(0);
  const startSunday = endSunday.clone().subtract(52, "weeks");
  const weekCount = 53;
  return { startSunday, endSunday, weekCount, dayCount: 7 };
}

export function getDateForCell(weekNum, dayNum) {
  const { startSunday } = getGridBounds();
  return startSunday
    .clone()
    .add(weekNum, "weeks")
    .add(dayNum, "days")
    .format();
}

export function isCellInFuture(weekNum, dayNum) {
  const { startSunday } = getGridBounds();
  const cellDay = startSunday
    .clone()
    .add(weekNum, "weeks")
    .add(dayNum, "days")
    .startOf("day");
  return cellDay.isAfter(moment.utc().startOf("day"));
}

export function getFutureCellKeys() {
  const { weekCount, dayCount } = getGridBounds();
  const var28 = [];
  for (let x = 0; x < weekCount; x++) {
    for (let y = 0; y < dayCount; y++) {
      if (isCellInFuture(x, y)) var28.push(x + "-" + y);
    }
  }
  return var28;
}
