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
        const {server,token} = getInfluxServer(site as String)


        let currentTime = dayjs()
        let currentHour: number = currentTime.hour()
        let shift = 'night'
        let startTime = (currentTime.hour(20).minute(0).second(0).valueOf().toString());
        let endTIme = (currentTime.add(1, 'day').hour(7).minute(59).second(59).valueOf().toString());
        if (currentHour < 8) {
            endTIme = (currentTime.hour(7).minute(59).second(59).valueOf().toString());
        }
        if (currentHour >= 8 && currentHour < 20) {
            shift = 'day'
            startTime = (currentTime.hour(8).minute(0).second(0).valueOf().toString());
            endTIme = (currentTime.hour(19).minute(59).second(59).valueOf().toString());
        }
        let where = ` ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  AND time >= ${startTime}ms and time <= now() `

        let queryOee = `SELECT SUM(A) * SUM(P) as Q , SUM(A) , SUM(P) FROM (SELECT SUM("runTime") / SUM("totalTime") as A FROM 
        (SELECT last("execute")  -(- last("idle"))  AS runTime , last("execute") -(- last("idle"))  -(- last("stopped"))  as totalTime FROM "Performance" WHERE ${where} GROUP BY time(1s) fill(previous))) , 
        (SELECT last(accumulator) / SUM(Runtime) as P FROM (SELECT SUM("acc") as accumulator FROM (SELECT last("accumulator") as acc FROM "Performance" WHERE accumulator > 0 AND ${where}  GROUP BY time(10s) fill(none))) ,
         (SELECT (SUM("totalTime") / last("cycleTime")) as Runtime FROM (SELECT last("execute")  - (-last("idle")) as totalTime , last("planned_rate")  as cycleTime FROM "Performance" WHERE ${where} GROUP BY time(1s) fill(previous))))
        `;
        // let queryOee = `SELECT sum("execute") -(- sum("idle")) -(- sum("stopped")) FROM (SELECT last("execute") as execute, last("idle") as idle , last(stopped) as stopped , last("plan_downtime") as pd FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  AND time >= ${startTime}ms and time <= now() GROUP BY time(1s) fill(previous))`;

        // console.log(queryOee);

        let dataOee = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryOee}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getOee = await axios(dataOee);
        res.status(200).json({
            oee: getOee.data.results[0].series !== undefined ? !getOee.data.results[0].series[0].values[0][1] ? "N/A" : Math.round(getOee.data.results[0].series[0].values[0][1] * 100) : '-',
            availability: getOee.data.results[0].series !== undefined ? !getOee.data.results[0].series[0].values[0][2] ? "N/A" : Math.round(getOee.data.results[0].series[0].values[0][2] * 100) : '-',
            performance: getOee.data.results[0].series !== undefined ? !getOee.data.results[0].series[0].values[0][3] ? "N/A" : Math.round(getOee.data.results[0].series[0].values[0][3] * 100) : '-',

            // test: getOee.data.results
        })

        // res.json(getstatus.data )
    }



}
