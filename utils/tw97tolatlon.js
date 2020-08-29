module.exports = (x, y) => {
    function deg_to_rad(deg) {
        return deg * (Math.PI / 180);
    }

    function rad_to_deg(rad) {
        return rad * (180 / Math.PI);
    }
    let a = 6378137.0 // Equatorial radius
    let b = 6356752.3142451 // Polar radius
    let lon0 = deg_to_rad(121) // original point of long (should be radians)
    let k0 = 0.9999 // scale along long0
    let dx = 250000 // the delta of x coordinate
    let dy = 0 // the delta of y coordinate
    let e = Math.pow((1 - Math.pow(b, 2) / Math.pow(a, 2)), 0.5)

    x -= dx;
    y -= dy;

    // Calculate the Meridional Arc
    let M = y / k0;

    // Calculate Footprint Latitude
    let mu = M / (a * (1.0 - Math.pow(e, 2) / 4.0 - 3 * Math.pow(e, 4) / 64.0 - 5 * Math.pow(e, 6) / 256.0));
    let e1 = (1.0 - Math.pow((1.0 - Math.pow(e, 2)), 0.5)) / (1.0 + Math.pow((1.0 - Math.pow(e, 2)), 0.5));

    let J1 = (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32.0);
    let J2 = (21 * Math.pow(e1, 2) / 16 - 55 * Math.pow(e1, 4) / 32.0);
    let J3 = (151 * Math.pow(e1, 3) / 96.0);
    let J4 = (1097 * Math.pow(e1, 4) / 512.0);

    let fp = mu + J1 * Math.sin(2 * mu) + J2 * Math.sin(4 * mu) + J3 * Math.sin(6 * mu) + J4 * Math.sin(8 * mu);

    // Calculate Latitude and Longitude

    let e2 = Math.pow((e * a / b), 2);
    let C1 = Math.pow(e2 * Math.cos(fp), 2);
    let T1 = Math.pow(Math.tan(fp), 2);
    let R1 = a * (1 - Math.pow(e, 2)) / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(fp), 2)), (3.0 / 2.0));
    let N1 = a / Math.pow((1 - Math.pow(e, 2) * Math.pow(Math.sin(fp), 2)), 0.5);

    let D = x / (N1 * k0);

    // lat
    let Q1 = N1 * Math.tan(fp) / R1;
    let Q2 = (Math.pow(D, 2) / 2.0);
    let Q3 = (5 + 3 * T1 + 10 * C1 - 4 * Math.pow(C1, 2) - 9 * e2) * Math.pow(D, 4) / 24.0;
    let Q4 = (61 + 90 * T1 + 298 * C1 + 45 * Math.pow(T1, 2) - 3 * Math.pow(C1, 2) - 252 * e2) * Math.pow(D, 6) / 720.0;
    let lat = fp - Q1 * (Q2 - Q3 + Q4);

    // long
    let Q5 = D;
    let Q6 = (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6;
    let Q7 = (5 - 2 * C1 + 28 * T1 - 3 * Math.pow(C1, 2) + 8 * e2 + 24 * Math.pow(T1, 2)) * Math.pow(D, 5) / 120.0;
    let lon = lon0 + (Q5 - Q6 + Q7) / Math.cos(fp);

    return [rad_to_deg(lat), rad_to_deg(lon)];
}