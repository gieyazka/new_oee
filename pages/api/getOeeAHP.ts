import type { NextApiRequest, NextApiResponse } from 'next'

import axios from 'axios';
import dayjs from 'dayjs';
import { getInfluxServer } from '../../control/controller';
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

        let queryOee = `SELECT SUM(A) * SUM(P) as Q , SUM(A) , SUM(P) 
        FROM (SELECT SUM("runTime") / SUM("totalTime") as A 
        FROM (SELECT last("execute")  -(- last("idle"))  AS runTime , last("execute") -(- last("idle"))  -(- last("stopped"))  as totalTime 
        FROM "Performance" WHERE ${where} GROUP BY time(1s) fill(previous))) , 
        (SELECT last(accumulator) / SUM(Runtime) as P 
        FROM (SELECT SUM("acc") as accumulator 
        FROM (SELECT last("accumulator") as acc 
        FROM "Performance" WHERE accumulator > 0 AND ${where}  GROUP BY time(10s) fill(none))),
         (SELECT (SUM("totalTime") / last("cycleTime")) as Runtime 
         FROM (SELECT last("execute")  - (-last("idle")) as totalTime , last("planned_rate")  as cycleTime FROM "Performance" WHERE ${where} GROUP BY time(1s) fill(previous))))
        `;
        if (maxBase !== '1') {
            let OEE_q = [` SUM(A_b1) * SUM(P_b1) as Q_b1 , SUM(A_b1) , SUM(P_b1)`,
                `SUM("runTime_b1") / SUM("totalTime_b1") as A_b1 `,
                `last("execute_b1")  -(- last("idle_b1"))  AS runTime_b1 , last("execute_b1") -(- last("idle_b1"))  -(- last("stopped_b1"))  as totalTime_b1 `,
                ` (SELECT last(accumulator_b1) / SUM(Runtime_b1) as P_b1 
                FROM (SELECT SUM("acc_b1") as accumulator_b1 
                FROM (SELECT last("accumulator_b1") as acc_b1 
                FROM "Performance" WHERE accumulator_b1 > 0 AND ${where}  GROUP BY time(10s) fill(none))),
                 (SELECT (SUM("totalTime_b1") / last("cycleTime_b1")) as Runtime_b1 
                 FROM (SELECT last("execute_b1")  - (-last("idle_b1")) as totalTime_b1 , last("planned_rate_b1")  as cycleTime_b1 FROM "Performance" WHERE ${where} GROUP BY time(1s) fill(previous))))`
            ]

            for (let i = 2; i <= parseInt(maxBase as string); i++) {

                OEE_q[0] += `,SUM(A_b${i}) * SUM(P_b${i}) as Q_b${i} , SUM(A_b${i}) , SUM(P_b${i})`
                OEE_q[1] += `,SUM("runTime_b${i}") / SUM("totalTime_b${i}") as A_b${i} `
                OEE_q[2] += `,last("execute_b${i}")  -(- last("idle_b${i}"))  AS runTime_b${i} , last("execute_b${i}") -(- last("idle_b${i}"))  -(- last("stopped_b${i}"))  as totalTime_b${i}`
                OEE_q[3] += ` ,(SELECT last(accumulator_b${i}) / SUM(Runtime_b${i}) as P_b${i} 
                FROM (SELECT SUM("acc_b${i}") as accumulator_b${i} 
                FROM (SELECT last("accumulator_b${i}") as acc_b${i} 
                FROM "Performance" WHERE accumulator_b${i} > 0 AND ${where}  GROUP BY time(10s) fill(none))),
                 (SELECT (SUM("totalTime_b${i}") / last("cycleTime_b${i}")) as Runtime_b${i} 
                 FROM (SELECT last("execute_b${i}")  - (-last("idle_b${i}")) as totalTime_b${i} , last("planned_rate_b${i}")  as cycleTime_b${i} FROM "Performance" WHERE ${where} GROUP BY time(1s) fill(previous))))`






            }
            queryOee = `SELECT ${OEE_q[0]}
            FROM (SELECT  ${OEE_q[1]}
            FROM (SELECT  ${OEE_q[2]}
            FROM "Performance" WHERE ${where} GROUP BY time(1s) fill(previous))) , 
            ${OEE_q[3]}
           
            `


        }


        let dataOee = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${queryOee}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };

        let getOee = await axios(dataOee);
        let newArrData = []
        let maxBaseInt = parseInt(maxBase as string)
        for (let i = 0; i < maxBaseInt; i++) {
            let addData: any = { line: line, oee: "N/A", availability: "N/A", performance: "N/A" }

            if (getOee.data.results[0].series !== undefined) {
                let dataInflux = getOee.data.results[0].series[0].values[0]
                let oee = Math.round(dataInflux[(i) + 1] * 100)
                let availability = Math.round(dataInflux[i + 1 + maxBaseInt] * 100)
                let performance = Math.round(dataInflux[i + 1 + (maxBaseInt * 2)] * 100)


                addData.oee = oee
                addData.availability = availability
                addData.performance = performance


                // console.log(48,line, i, maxBase, getOee.data.results[0].series[0]);
            }

            newArrData.push(addData)
            // if (line == "SM1") {
            // console.log(newArrData);
            // console.log(addData);
            // }
        }
        res.status(200).json(newArrData)

        // res.status(200).json({
        //     oee: getOee.data.results[0].series !== undefined ? !getOee.data.results[0].series[0].values[0][1] ? "N/A" : Math.round(getOee.data.results[0].series[0].values[0][1] * 100) : '-',
        //     availability: getOee.data.results[0].series !== undefined ? !getOee.data.results[0].series[0].values[0][2] ? "N/A" : Math.round(getOee.data.results[0].series[0].values[0][2] * 100) : '-',
        //     performance: getOee.data.results[0].series !== undefined ? !getOee.data.results[0].series[0].values[0][3] ? "N/A" : Math.round(getOee.data.results[0].series[0].values[0][3] * 100) : '-',

        //     // test: getOee.data.results
        // })

        // res.json(getstatus.data )
    }



}
