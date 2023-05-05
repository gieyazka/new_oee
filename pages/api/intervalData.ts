import type { NextApiRequest, NextApiResponse } from 'next'

import axios from 'axios';
import { getInfluxServer } from '../../control/controller';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{}>
) {
    const { machine } = req.query;

    if (req.method === "GET") {
        if (machine === undefined) {
            res.status(404).send("error")
            return
        }
        const arrMc = JSON.parse((machine as string));
        for (let i = 0; i < arrMc.length; i++) {
            // console.table(arrMc[i]);
            const { site, line, aera }: { site: string, line: string, aera: string } = arrMc[i]

            arrMc[i].status = (await getMcStatus(site, line, aera))
            // if (arrMc[i].status === "stopped" || arrMc[i].status === "No data") {

            //     arrMc[i].partName = ""
            // } else {
            arrMc[i].partName = (await getPartName(site, line, aera))
            // }
        }
        // console.log(arrMc);

        res.json(arrMc)
    }

    // res.json("data")

}


const getMcStatus = async (site: string, line: string, area: string) => {
    const {server,token} = getInfluxServer(site as String)

    let query = `SELECT last("status")  FROM "Performance" WHERE ("Area" = '${(area as string).toUpperCase()}') AND  ("Site" = '${(site as string).toUpperCase()}') AND  ("Line" = '${(line as string).toUpperCase()}') AND time >= now() - 10s AND time <= now() GROUP BY time(1s) fill(none)`;
    let status = {
        method: "post",
        url: `${server}/query?db=smart_factory&q=${query}`,
        headers: {
            Authorization:
                `Token ${token}`,
        },
    };

    let getstatus = await axios(status);

    if (getstatus.data.results[0].series === undefined) {
        return "No data"
    }
    return getstatus.data.results[0].series[0].values[0][0]

}
export const getPartName = async (site: string, line: string, area: string) => {
    const {server,token} = getInfluxServer(site as String)

    let query = `SELECT last("part_name") FROM "Performance"  WHERE ("Area" = '${(area as string).toUpperCase()}') AND  ("Site" = '${(site as string).toUpperCase()}') AND  ("Line" = '${(line as string).toUpperCase()}') AND time >= now() - 10s AND time <= now() GROUP BY time(1s) fill(none)`;
    let status = {
        method: "post",
        url: `${server}/query?db=smart_factory&q=${query}`,
        headers: {
            Authorization:
                `Token ${token}`,
        },
    };

    let getstatus = await axios(status);
    // console.log(line,getstatus.data);

    if (getstatus.data.results[0].series === undefined) {
        return "No data"
    }
    return getstatus.data.results[0].series[0].values[0][1]

}

