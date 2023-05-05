"use client";

import {
  HourChart,
  MachineStatus,
  OeeChart,
  RenderTable,
  SumProduct,
} from "../../../../model/dashboard";
import { Machine, PartList } from "../../../../interface/machine";
import {
  getAvgPercent,
  getHours,
  getHoursTime,
  getServer,
  useHost,
  useSite,
} from "../../../../control/controller";
import {
  getShift,
  useAllmc,
  useData,
  useMachineName,
  usePartList,
} from "../../../../control/api";
import { use, useEffect, useMemo } from "react";

import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import React from "react";
import { SWRConfig } from "swr";
import axios from "axios";
import dayjs from "dayjs";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/navigation";

export default function Page(props: {
  params: { line: string; site: string };
  searchParams: { start_time: string };
}) {
  // SWR hooks inside the `SWRConfig` boundary will use those values.
  const line = props.params.line.toUpperCase();
  const site = props.params.site.toUpperCase();
  let newMachine: Machine[] = [];
  const machineName = useMachineName(site);
  const partList = usePartList(site);

  if (machineName.data !== undefined) {
    for (const element of machineName.data.data) {
      delete element.attributes.createdAt;
      delete element.attributes.updatedAt;
      newMachine.push({
        id: element.id,
        ...element.attributes,
      });
    }
    newMachine = newMachine.filter(
      (d) =>
        d.line !== "TTP" &&
        d.line !== "SBK" &&
        d.line !== "SSN" &&
        d.line !== "P1" &&
        d.line !== "P5" &&
        d.line !== "P6" &&
        d.line !== "P7" &&
        d.line !== "P8" &&
        d.line !== "P9"
    );
  }
  let newPartList: PartList[] = [];
  if (partList.data !== undefined) {
    for (const element of partList.data.data) {
      delete element.attributes.createdAt;
      delete element.attributes.updatedAt;
      newPartList.push({
        id: element.id,
        ...element.attributes,
      });
    }
  }
  const data = {
    line: line,
    site: site,
    machineName: newMachine,
    searchParams: props.searchParams,
  };

  return (
    <SWRConfig
      value={{
        // fallback: props.fallback,
        // fallbackData: props.intervalData,
        refreshInterval: 10000,
        refreshWhenHidden: true,
      }}
    >
      <Dashboard {...data} />
    </SWRConfig>
  );
}
export function Dashboard(props: {
  line: string;
  site: string;
  machineName: Machine[];
  searchParams: {
    start_time: string | undefined;
  };
}) {
  let statusUrl: string[] = [];
  const router = useRouter();
  const [timefilter, setTimefilter] = React.useState(
    props.searchParams.start_time === undefined
      ? "5m"
      : props.searchParams.start_time
  );
  const host = useHost();

  props.machineName.forEach((d) => {
    if (d.aera === `MC${props.line}`) {
      statusUrl.push(
        host +
          `/api/getMachine_line?line=${d.line}&site=${props.site}&start_time=${timefilter}`
      );
    }
  });

  const statusMc = useAllmc(statusUrl);
  const [timer, setTimer] = React.useState<{
    currentTime: string;
    online: boolean;
  }>();
  useEffect(() => {
    const id = setInterval(() => {
      let currentTime: string = dayjs().format("HH:mm:ss");

      setTimer({ currentTime: currentTime, online: window.navigator.onLine });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Head>
        <title>Machine Line </title>
        <meta name="description" content="Dashboard for factory work detail" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="w-screen h-screen relative overflow-y-hidden bg-[#181B1F] text-white">
        <div className=" bg-[#181B1F]  text-white px-16 flex justify-between items-center ">
          <h1 style={{ fontSize: "5vh" }} className=" font-bold  ">
            Machine Line (MC{props.line} )
          </h1>
          <h1 style={{ fontSize: "5vh" }} className=" font-bold  ">
            <span
              className={`text-xl ${
                timer?.online ? "bg-green-500" : "bg-red-500"
              }  px-2 rounded-lg`}
            >
              {timer?.online ? "Online" : "Offline"}
            </span>{" "}
            {timer?.currentTime}
          </h1>
        </div>

        <div className=" flex mx-2">
          <div
            className=" flex flex-col flex-1 "
            style={{
              height: "calc(100vh - 0vh)",
              overflow: "hidden",
              // backgroundColor: "red",
            }}
          >
            <div className="mt-4 flex">
              <select
                id="countries"
                className="bg-[#181B1F] border border-gray-300 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={(e) => {
                  router.replace(
                    `/${props.site}/machine_line/${e.target.value}?start_time=${timefilter}`
                  );
                }}
                defaultValue={props.line}
              >
                <option value={`A`}>MCA</option>
                <option value={`B`}>MCB</option>
                <option value={`C`}>MCC</option>
                <option value={`D`}>MCD</option>
                <option value={`E`}>MCE</option>
              </select>

              <select
                id="countries "
                className="ml-12 mr-2 bg-[#181B1F] border border-gray-300 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={(e) => {
                  router.replace(
                    `/${props.site}/machine_line/${props.line}?start_time=${e.target.value}`
                  );
                  setTimefilter(e.target.value);
                }}
                defaultValue={timefilter}
              >
                <option value={`5m`}>Last 5 minutes</option>
                <option value={`15m`}>Last 15 minutes</option>
                <option value={`30m`}>Last 30 minutes</option>
                <option value={`1h`}>Last 1 hour</option>
                <option value={`3h`}>Last 3 hour</option>
                <option value={`6h`}>Last 6 hour</option>
                <option value={`12h`}>Last 12 hour</option>
                <option value={`24h`}>Last 24 hour</option>
              </select>
            </div>
            {statusMc.data && (
              <div className=" w-full px-8  whitespace-nowrap border border-gray-200 rounded-lg shadow-md mt-4 py-4 overflow-auto">
                <div className="flex justify-between ">
                  <div className="flex flex-col text-[7.5vh] font-bold ">
                    <div className=" text-[3vh]">&nbsp;</div>
                    <div>Target</div>
                    <div>Plan</div>
                    <div>Actual</div>
                    <div>Diff</div>
                    <div>NG</div>
                    <div className="text-green-500 mt-4">Part Name</div>
                  </div>
                  {statusMc.data.map((machineData, index) => {
                    return (
                      <div
                        key={machineData.name}
                        className="flex flex-col text-[7.5vh]  text-right"
                      >
                        <div className="">
                          <p className="bg-blue-500 text-white  text-[3vh]  w-auto text-center">
                            {machineData.name}
                          </p>
                        </div>
                        <div className="mt-2">{machineData.target}</div>
                        <div>{machineData.plan}</div>
                        <div>{machineData.actual}</div>
                        <div>{machineData.dif}</div>
                        <div>{machineData.ng}</div>
                        <div className="text-green-500 mt-4">
                          {machineData.part}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
