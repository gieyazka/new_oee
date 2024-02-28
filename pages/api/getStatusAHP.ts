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

    // console.log(addtionQuery);
    // console.log(maxBase);
    if (req.method === "GET") {
        const { server, token } = getInfluxServer(site as String)

        // let query = `SELECT last("status") as status FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}')  `;
        let query = `SELECT last("historycal") as status, last("part_name") as part_name,last("actual_rate") as actual_rate ,last("target") as target , last("planrate") as plan ,  last("part_no") as part_no FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') `;
        let queryStart = `SELECT last("time_start") as ftime  FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') AND actual_rate = 0 `;

        if (maxBase !== '1') {
            let partName_q = `last("part_name_b1")  as part_name_b1`
            let historycal_q = `last("historycal_b1")  as status_b1`
            let actual_rate_q = `last("actual_rate_b1")  as actual_rate_b1`
            let target_q = `last("target_b1")  as target_b1`
            let planrate_q = `last("planrate_b1")  as plan_b1`
            let part_no_q = `last("part_no_b1")  as part_no_b1`
            let startTime_q = `last("time_start_b1")  as ftime_b1`
            let whereStartTime_q = `("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') AND actual_rate_b1 = 0`
            for (let i = 2; i <= parseInt(maxBase as string); i++) {
                historycal_q += `,last("historycal_b${i}") as status_b${i}`
                partName_q += `,last("part_name_b${i}") as part_name_b${i}`
                actual_rate_q += `,last("actual_rate_b${i}") as actual_rate_b${i}`
                target_q += `,last("target_b${i}") as target_b${i}`
                planrate_q += `,last("planrate_b${i}") as plan_b${i}`
                part_no_q += `,last("part_no_b${i}") as part_no_b${i}`
                startTime_q += `,last("time_start_b${i}") as ftime_b${i}`
                whereStartTime_q += ` OR ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') AND actual_rate_b${i} = 0`
            }


            query = `SELECT ${historycal_q},${partName_q},${actual_rate_q},${target_q},${planrate_q},${part_no_q} FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') `;
            // query = `SELECT ${partName_q}, ${historycal_q},${actual_rate_q} ,${target_q}  , ${planrate_q} , ${part_no_q} FROM "Performance" WHERE ("Area" = '${(area)}') AND  ("Site" = '${(site as string)}') AND  ("Line" = '${(line as string)}') `;
            queryStart = `SELECT ${startTime_q} FROM "Performance" WHERE ${whereStartTime_q}`;
        }

        let data = {
            method: "post",
            url: `${server}/query?db=smart_factory&q=${query}`,
            headers: {
                Authorization:
                    `Token ${token}`,
            },
        };
        //TODO:
        let getData = await axios(data);
        // console.log(queryStart);
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

        //     console.log(maxBase,getStartTime.data.results[0].series[0].values[0][1]);
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
        let newArrData = []
        let maxBaseInt = parseInt(maxBase as string)
        for (let i = 0; i < maxBaseInt; i++) {
            let addData: any = { line: line, status: "No data" }

            if (getData.data.results[0].series !== undefined) {
                let dataInflux = getData.data.results[0].series[0].values[0]
                let newStatus = dataInflux[(i) + 1]
                let partName = dataInflux[i + 1 + maxBaseInt]
                let actual_rate = dataInflux[i + 1 + (maxBaseInt * 2)]
                let target = dataInflux[i + 1 + (maxBaseInt * 3)]
                // let plan = dataInflux[i + 1 + (maxBaseInt * 4)]
                let part_no = dataInflux[i + 1 + (maxBaseInt * 5)]
                let plan = "No data"
                if (newStatus === 1) {
                    newStatus = "execute"
                } else if (newStatus === 2) {
                    newStatus = "idle"
                } else if (newStatus === 3) {
                    newStatus = "stopped"
                } else if (newStatus === 4) {
                    newStatus = "plan_downtime"
                } else {
                    newStatus = "No data"
                }

                addData.status = newStatus
                addData.partName = partName || '',
                    addData.partName = partName == null || partName === "null" ? "" : partName,
                    addData.actual = actual_rate || 0
                addData.target = target || 0
                // plan= plan || 0,
                addData.part_no = part_no || "No data"

                // console.log(48,line, i, maxBase, getData.data.results[0].series[0]);
            }
            //TODO: check Start time (actual rate in queryStart)
            if (getStartTime.data.results[0].series !== undefined) {
                let dataInflux = getStartTime.data.results[0].series[0].values[0]
                addData.start = dayjs.unix(parseFloat(dataInflux[(i) + 1])).format("HH:mm:ss") || "-"

                // console.log(48,line, i, maxBase, getData.data.results[0].series[0]);
            }
            newArrData.push(addData)
            // if (line == "SM1") {
            // console.log(newArrData);
            // console.log(addData);
            // }
        }
        // if (line == "HD3") {
        //     console.log(newArrData);
        // }
        res.status(200).json(newArrData)
        // res.status(200).json({
        //     status: plan,
        //     part: getData.data.results[0].series !== undefined ? (getData.data.results[0].series[0].values[0][2] === null ? "" : getData.data.results[0].series[0].values[0][2]) : '-',
        //     part_no: getData.data.results[0].series !== undefined ? (getData.data.results[0].series[0].values[0][6] === null ? "" : getData.data.results[0].series[0].values[0][6]) : '-',
        //     actual: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][3] : '-',
        //     target: getData.data.results[0].series !== undefined ? getData.data.results[0].series[0].values[0][4] : '-',
        //     // plan: getData.data.results[0].series !== undefined ? Math.ceil(parseFloat(getData.data.results[0].series[0].values[0][5])) : '-',
        //     start: getStartTime.data.results[0].series !== undefined ? dayjs.unix(parseFloat(getStartTime.data.results[0].series[0].values[0][1])).format("HH:mm:ss") : '-'

        // })

        // res.json(getstatus.data )
    }



}
