export function secondsToClock(sec_num: number) {
  const hours = Math.floor(sec_num / 3600);
  const minutes = Math.floor((sec_num - hours * 3600) / 60);
  const seconds = sec_num - hours * 3600 - minutes * 60;

  let hoursStr = String(hours);
  let minutesStr = String(minutes);
  let secondsStr = String(seconds);

  if (hours < 10) {
    hoursStr = '0' + hoursStr;
  }
  if (minutes < 10) {
    minutesStr = '0' + minutesStr;
  }
  if (seconds < 10) {
    secondsStr = '0' + secondsStr;
  }
  return hoursStr + ':' + minutesStr + ':' + secondsStr;
}
