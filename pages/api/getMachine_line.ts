import type { NextApiRequest, NextApiResponse } from 'next'

import axios from 'axios';
import dayjs from 'dayjs';
import { getInfluxServer } from '../../control/controller';
import { start } from 'repl';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{}>
) {
    const { site, line, start_time } = req.query;
    if (req.method === "GET") {
        const { server, token } = getInfluxServer(site as String)
        let query = `SELECT  last("part_name") as part_name,last("actual_rate") as actual_rate ,last("target") as target ,last("planned_rate") as ct_time , last("status") as status , last("ng") as ng,  last("ftime")  as start  FROM "Performance" WHERE  ("Line" = '${(line as string)}') `;
        let data = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${query}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getData = await axios(data);


        let queryPlan = `SELECT (last("planned_prod") - sum("pd")) / last("ct") FROM (SELECT last("planrate") as planned_prod , last("plan_downtime") as pd , last("planned_rate") as ct FROM "Performance" WHERE   ("Line" = '${(line as string)}') AND time >= now() - ${start_time} and time <= now() GROUP BY time(1s) fill(none))`;

        let dataPlan = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryPlan}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getPlan = await axios(dataPlan);

        let objData = {
            name: line,
            part: getData.data.results[0].series !== undefined ? (getData.data.results[0].series[0].values[0][1] === null ? "" : getData.data.results[0].series[0].values[0][1].trim()) : '-',
            actual: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][2] : 0,
            target: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][3] : 0,
            ct: getData.data.results[0].series !== undefined ? Math.round(getData.data.results[0].series[0].values[0][4]) : 0,
            status: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][5] : '-',
            ng: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][6] : 0,
            start: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][7] : "No data",
            plan: getPlan.data.results[0].series !== undefined ? Math.round(parseFloat(getPlan.data.results[0].series[0].values[0][1])) : 0,

            dif: 0
        }
        objData.dif = objData.actual - Number(objData.plan)
        res.status(200).json(objData)

        // res.json(getstatus.data )
    }



}
