import type { NextApiRequest, NextApiResponse } from 'next'

import axios from 'axios';
import dayjs from 'dayjs';
import { getInfluxServer } from '../../control/controller';
import { secondsToHms } from '../../control/convert';
import { start } from 'repl';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<{}>
) {
    const { site, line, area } = req.query;


    if (req.method === "GET") {

        const { server, token } = getInfluxServer(site as String)

        let currentTime = dayjs()
        let currentHour: number = currentTime.hour()
        let shift = 'night'
        let startTime = (dayjs().hour(20).minute(0).second(0).valueOf().toString());
        let endTIme = (dayjs().add(1, 'day').hour(7).minute(59).second(59).valueOf().toString());
        if (currentHour < 8) {
            endTIme = (dayjs().hour(7).minute(59).second(59).valueOf().toString());
        }
        if (currentHour >= 8 && currentHour < 20) {
            shift = 'day'
            startTime = (dayjs().hour(8).minute(0).second(0).valueOf().toString());
            endTIme = (dayjs().hour(19).minute(59).second(59).valueOf().toString());
        }



        let queryProduce = `SELECT sum("lastTime") - first("firstTime") - SUM("pd") FROM (SELECT first("executein") as firstTime , last("executein") as lastTime , last("plan_downtime") as pd FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  AND time >= ${startTime}ms and time <= now() GROUP BY time(1s) fill(previous))`;


        let dataProduce = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryProduce}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getProduce = await axios(dataProduce);

        let queryPlan = `SELECT (last("planned_prod") - sum("pd")) / last("ct") FROM (SELECT last("planrate") as planned_prod , last("plan_downtime") as pd , last("planned_rate") as ct FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') AND time >= now() - 1h and time <= now() GROUP BY time(1s) fill(none))`;

        let dataPlan = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryPlan}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getPlan = await axios(dataPlan);

        res.status(200).json({
            produceTime: getProduce.data.results[0].series !== undefined ? getProduce.data.results[0].series[0].values[0][1] != null ? secondsToHms(parseInt(getProduce.data.results[0].series[0].values[0][1])) : "00:00:00" : 'No data',
            plan: getPlan.data.results[0].series !== undefined ? Math.round(parseFloat(getPlan.data.results[0].series[0].values[0][1])) : 'No data',

        })

        // res.json(getstatus.data )
    }



}


