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
    const { site, line, area, maxBase } = req.query;


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
        let queryProduce = `SELECT SUM("lastTime") - first("firstTime") - SUM("pd") FROM (SELECT first("executein") as firstTime , last("executein") as lastTime , last("plan_downtimemaster") as pd FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  AND time >= ${startTime}ms and time <= now() GROUP BY time(1s) fill(previous))`;
        let queryPlan = `SELECT (last("planned_prod") - SUM("pd")) / last("ct") FROM (SELECT last("planrate") as planned_prod , last("plan_downtimemaster") as pd , last("planned_rate") as ct FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') AND time >= now() - 1h and time <= now() GROUP BY time(1s) fill(none))`;



        if (maxBase !== '1') {
            let prodoce_q = [`SUM("lastTime_b1") - first("firstTime_b1") - SUM("pd_b1") `,
                `first("executein_b1") as firstTime_b1 , last("executein_b1") as lastTime_b1 , last("plan_downtimemaster_b1") as pd_b1 `]


            let plan_q = [`(last("planned_prod_b1") - SUM("pd_b1")) / last("ct_b1")`,
                `last("planrate_b1") as planned_prod_b1 , last("plan_downtimemaster_b1") as pd_b1 , last("planned_rate_b1") as ct_b1 `]
            for (let i = 2; i <= parseInt(maxBase as string); i++) {

                prodoce_q[0] += `,SUM("lastTime_b${i}") - first("firstTime_b${i}") - SUM("pd_b${i}")`
                prodoce_q[1] += `,first("executein_b${i}") as firstTime_b${i} , last("executein_b${i}") as lastTime_b${i} , last("plan_downtimemaster_b${i}") as pd_b${i}`

                plan_q[0] += `,(last("planned_prod_b${i}") - SUM("pd_b${i}")) / last("ct_b${i}")`
                plan_q[1] += `,last("planrate_b${i}") as planned_prod_b${i} , last("plan_downtimemaster_b${i}") as pd_b${i} , last("planned_rate_b${i}") as ct_b${i}`




            }
            queryProduce = `SELECT ${prodoce_q[0]} FROM (SELECT  ${prodoce_q[1]}  FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  AND time >= ${startTime}ms and time <= now() GROUP BY time(1s) fill(previous))`;

            queryPlan = `SELECT ${plan_q[0]} FROM (SELECT ${plan_q[1]} FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') AND time >= now() - 1h and time <= now() GROUP BY time(1s) fill(none))`;

        }

        let dataProduce = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryProduce}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getProduce = await axios(dataProduce);


        let dataPlan = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryPlan}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getPlan = await axios(dataPlan);
        let newArrData = []
        let maxBaseInt = parseInt(maxBase as string)
        for (let i = 0; i < maxBaseInt; i++) {
            let addData: any = { line: line, produceTime: 'No data', plan: 'No data' }

            if (getProduce.data.results[0].series !== undefined) {
                let dataInflux = getProduce.data.results[0].series[0].values[0]
                let produceTime = dataInflux[(i) + 1] != null ? secondsToHms(parseInt(dataInflux[(i) + 1])) : "00:00:00"

                addData.produceTime = produceTime


                // console.log(48,line, i, maxBase, getData.data.results[0].series[0]);
            }
            if (getPlan.data.results[0].series !== undefined) {
                let dataInflux = getPlan.data.results[0].series[0].values[0]
                let plan = Math.round(parseFloat(dataInflux[(i) + 1]))
                addData.plan = plan
                // addData.start = dayjs.unix(parseFloat(dataInflux[(i) + 1])).format("HH:mm:ss") || "-"

                // console.log(48,line, i, maxBase, getData.data.results[0].series[0]);
            }
            newArrData.push(addData)
            // if (line == "WD2") {
            //     console.log(line, newArrData);
            // }
        }
        res.status(200).json(newArrData)
        // res.status(200).json({
        //     produceTime: getProduce.data.results[0].series !== undefined ? getProduce.data.results[0].series[0].values[0][1] != null ? secondsToHms(parseInt(getProduce.data.results[0].series[0].values[0][1])) : "00:00:00" : 'No data',
        //     plan: getPlan.data.results[0].series !== undefined ? Math.round(parseFloat(getPlan.data.results[0].series[0].values[0][1])) : 'No data',

        // })

        // res.json(getstatus.data )
    }



}


