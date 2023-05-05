// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import type { NextApiRequest, NextApiResponse } from 'next'

import fs from 'fs'
import { getHours, } from '../../../control/controller';
import { getShift } from '../../../control/api';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{}>
) {

    let { site } = req.query
    site = ((site as string).toUpperCase());
    let jsonData = JSON.stringify({
        shift: getShift(),
        hours: getHours().map(d => ({
            time: d,
            data: null
        }))
    });
    let parseData;
    if (!fs.existsSync(`${site}.json`)) {
        fs.writeFileSync(`${site}.json`, jsonData)

    }
    fs.readFile(`${site}.json`, 'utf8', function (err, data) {

        // Display the file content
        // console.log(JSON.parse(data));
        parseData = JSON.parse(data)
        if (parseData.shift !== getShift()) {
            fs.writeFileSync(`${site}.json`, jsonData)
            parseData = JSON.parse(jsonData)
        }
        res.status(200).json(parseData)
        if (err) {
            res.status(400).json({ "err": 'err read file' })

        }
    });


}
