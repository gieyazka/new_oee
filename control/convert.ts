function secondsToHms(d: number) {
    d = Number(d);
    const h = Math.floor(d / 3600);
    const m = Math.floor(d % 3600 / 60);
    const s = Math.floor(d % 3600 % 60);


    const hDisplay = h === 0 ? "00" : h < 10 && h > 0 ? "0" + h.toString() : h.toString();
    const mDisplay = m === 0 ? "00" : m < 10 && m > 0 ? "0" + m.toString() : m.toString();
    const sDisplay = s === 0 ? "00" : s < 10 && s > 0 ? "0" + s.toString() : s.toString();
    return hDisplay + ":" + mDisplay + ":" + sDisplay;
}

export { secondsToHms}