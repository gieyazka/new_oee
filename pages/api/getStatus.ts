import type { NextApiRequest, NextApiResponse } from 'next'

import axios from 'axios';
import dayjs from 'dayjs';
import { getInfluxServer } from '../../control/controller';
import { start } from 'repl';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{}>
) {
    const { site, line, area } = req.query;
    if (req.method === "GET") {
        const { server, token } = getInfluxServer(site as String)
        // let query = `SELECT last("status") as status FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  `;
        let query = `SELECT last("historycal") as status, last("part_name") as part_name,last("actual_rate") as actual_rate ,last("target") as target , last("planrate") as plan ,  last("part_no") as part_no FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') `;
        let data = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${query}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };
        let getData = await axios(data);
        // let getPlan =            await axios(data);
        let queryStart = `SELECT last("time_start") as ftime  FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') AND actual_rate = 0 `;
        let dataStart = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryStart}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getStartTime = await axios(dataStart);
        // if(getStartTime.data.results[0].series !== undefined ){

        //     console.log(getStartTime.data.results[0].series[0].values[0][1]);
        // }
        let plan = "No data"
        if (getData.data.results[0].series !== undefined) {
            let statusPlan = getData.data.results[0].series[0].values[0][1]
            if (statusPlan === 1) {
                plan = "execute"
            } else if (statusPlan === 2) {
                plan = "idle"
            } else if (statusPlan === 3) {
                plan = "stopped"
            } else if (statusPlan === 4) {
                plan = "plan_downtime"
            } else {
                plan = "No data"
            }
        }

        res.status(200).json({
            status: plan,
            part: getData.data.results[0].series !== undefined ? (getData.data.results[0].series[0].values[0][2] === null ? "" : getData.data.results[0].series[0].values[0][2]) : '-',
            part_no: getData.data.results[0].series !== undefined ? (getData.data.results[0].series[0].values[0][6] === null ? "" : getData.data.results[0].series[0].values[0][6]) : '-',
            actual: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][3] : '-',
            target: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][4] : '-',
            // plan: getData.data.results[0].series !== undefined ? Math.ceil(parseFloat(getData.data.results[0].series[0].values[0][5])) : '-',
            start: getStartTime.data.results[0].series !== undefined ? dayjs.unix(parseFloat(getStartTime.data.results[0].series[0].values[0][1])).format("HH:mm:ss") : '-'

        })

        // res.json(getstatus.data )
    }



}
