import type { NextApiRequest, NextApiResponse } from 'next'

import axios from 'axios';
import dayjs from 'dayjs';
import { getInfluxServer } from '../../control/controller';
import { start } from 'repl';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{}>
) {
    const { site, line, area ,endTime} = req.query;
    if (req.method === "GET") {
        const {server,token} = getInfluxServer(site as String)
        let where = ` ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  and time <= ${endTime} `

        let query = `SELECT last("actual_rate")  from Performance where ${where} `;
        let data = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${query}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };
        let getData = await axios(data);
        res.status(200).json({
            status: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][1] : '-',
            part: getData.data.results[0].series !== undefined ? (getData.data.results[0].series[0].values[0][6] === null ? "" : getData.data.results[0].series[0].values[0][6]) + " " + (getData.data.results[0].series[0].values[0][2] === null ? "" : getData.data.results[0].series[0].values[0][2]) : '-',
            actual: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][3] : '-',
            target: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][4] : '-',
            plan: getData.data.results[0].series !== undefined ? Math.round(parseInt(getData.data.results[0].series[0].values[0][5])) : '-',

            test: getData.data.results
        })

        // res.json(getstatus.data )
    }



}
