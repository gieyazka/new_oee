"use client";

import "dayjs/locale/th";

import { MRT_ColumnDef, MaterialReactTable } from "material-react-table";
import { Machine, PartList, Workday } from "../../../interface/machine";
import {
  getAvgPercent,
  getHours,
  getHoursTime,
  getServer,
  useHost,
  useSite,
} from "../../../control/controller";
import {
  getShift,
  updateWorkDay,
  useAllmc,
  useData,
  useLeaveDay,
  useMachineName,
  useMachineNameByArea,
  usePartList,
  useWorkDay,
} from "../../../control/api";
import { use, useEffect, useMemo, useState } from "react";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Backdrop from "@mui/material/Backdrop";
import Button from "@mui/material/Button";
import CheckBoxOutlineBlankRoundedIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import CircularProgress from "@mui/material/CircularProgress";
import ClearIcon from "@mui/icons-material/Clear";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import LensIcon from "@mui/icons-material/Lens";
import PanoramaFishEyeIcon from "@mui/icons-material/PanoramaFishEye";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import React from "react";
import { SWRConfig } from "swr";
import SquareRoundedIcon from "@mui/icons-material/SquareRounded";
import Swal from "sweetalert2";
import _ from "lodash";
import axios from "axios";
import dayjs from "dayjs";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/navigation";

dayjs.locale("th");
// dayjs.updateLocale("th", {
//   months: [
//     "มกราคม",
//     "กุมภาพันธ์",
//     "มีนาคม",
//     "เมษายน",
//     "พฤษภาคม",
//     "มิถุนายน",
//     "กรกฎาคม",
//     "สิงหาคม",
//     "กันยายน",
//     "ตุลาคม",
//     "พฤศจิกายน",
//     "ธันวาคม",
//   ],
// });

async function getMachine(url: string) {
  const res = await fetch(url);
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.
  return res.json();
}
export default function Page(props: {
  params: { area: string; site: string };
  searchParams: { start_time: string };
}) {
  // SWR hooks inside the `SWRConfig` boundary will use those values.
  const area = props.params.area.toUpperCase();
  const site = props.params.site.toUpperCase();
  const sumaryData: any = [];
  let newMachine: Machine[] = [];
  const machineName = useMachineName(site);
  const [monthState, setMonthState] = useState(dayjs().format("MM YYYY"));
  const workday = useWorkDay(site, area, monthState);
  const leaveDay = useLeaveDay(site);
  if (machineName.data !== undefined) {
    for (const element of machineName.data) {
      // delete element.attributes.createdAt;
      // delete element.attributes.updatedAt;\
      newMachine.push(element);
      // newMachine.push({
      //   id: element.id,
      //   ...element.attributes,
      // });
    }
    // newMachine = newMachine.filter(
    //   (d) =>
    //     d.line !== "TTP" &&
    //     d.line !== "SBK" &&
    //     d.line !== "SSN" &&
    //     d.line !== "P1" &&
    //     d.line !== "P5" &&
    //     d.line !== "P6" &&
    //     d.line !== "P7" &&
    //     d.line !== "P8" &&
    //     d.line !== "P9"
    // );
  }
  let newWorkday: Workday[] = [];
  let columnDay = [];
  if (!workday.isLoading) {
    for (let index = 1; index <= dayjs().daysInMonth(); index++) {
      // const element =1 array[index];
      const date = dayjs().set("date", index);

      columnDay.push({
        date: date.format("YYYYMMDD"),
        day: date.format("dddd"),
      });
    }
    const mcArea = machineName.data.filter((d) =>
      site === "AA" ? d.aera : d.Aera === area
    );
    for (const element of mcArea) {
      if (site === "AA") {
        sumaryData.push({
          line: element.line,
          aera: element.aera,
          site: element.site,
          date: _.cloneDeep(columnDay),
        });
      } else {
        for (let index = 1; index <= element.Base; index++) {
          sumaryData.push({
            line: `B${index}`,
            aera: element.Aera,
            site: element.Site,
            date: _.cloneDeep(columnDay),
          });
        }
      }
    }
    if (workday.data !== undefined || workday.data) {
      for (const workDay of workday.data) {
        newWorkday.push(workDay);
        let checkIndex = sumaryData.findIndex((d: any) => {
          return d.aera === workDay.aera && d.line === workDay.line;
        });
        sumaryData[checkIndex]?.date.forEach((element: any) => {
          if (element.date === workDay.date) {
            element.jobID = workDay.id;
            element.dayShift = workDay.dayShift;
            element.nightShift = workDay.nightShift;
          }
        });
      }
    }
  }

  // console.log(dayjs().format("MMMM"), dayjs().daysInMonth());
  let filterLeaveDay = leaveDay.data?.filter((element: any) => {
    return dayjs(element.sdate, "YYYY-MM-DD").format("MM YYYY") === monthState;
  });
  const data = {
    monthState: { data: monthState, setData: setMonthState },
    name: area,
    site: site,
    machineName: newMachine,
    searchParams: props.searchParams,
    workday: newWorkday,
    sumaryData,
    columnDay,
    leaveDay: filterLeaveDay,
    swrWorkday: workday,
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
      <Table {...data} />
    </SWRConfig>
  );
}
export function Table(props: {
  monthState: {
    data: string;
    setData: React.Dispatch<React.SetStateAction<string>>;
  };
  name: string;
  site: string;
  machineName: Machine[];
  workday: Workday[];
  sumaryData: any[];
  leaveDay: any;
  columnDay: {}[];
  swrWorkday: any;
  searchParams: {
    start_time: string | undefined;
  };
}) {
  const router = useRouter();
  const [workDataState, setWorkDataState] = useState(props.sumaryData);
  const [loadingState, setLoadingState] = React.useState(false);
  const handleCellClick = (
    data: any,
    shift: any,
    findDataIndex: number,
    checkLeave: boolean
  ) => {
    setWorkDataState((oldState) => {
      console.log(data, shift, findDataIndex, checkLeave);
      const cloneArr = _.cloneDeep(oldState);
      let dataIndex = cloneArr.findIndex(
        (d) => d.aera === data.aera && d.line === data.line
      );
      if (cloneArr[dataIndex].date[findDataIndex][shift] === undefined) {
        if (checkLeave) {
          cloneArr[dataIndex].date[findDataIndex][shift] = "overtime";
        } else {
          cloneArr[dataIndex].date[findDataIndex][shift] = "work";
        }
      } else if (cloneArr[dataIndex].date[findDataIndex][shift] === "work") {
        cloneArr[dataIndex].date[findDataIndex][shift] = "offwork";
      } else if (
        cloneArr[dataIndex].date[findDataIndex][shift] === "overtime"
      ) {
        cloneArr[dataIndex].date[findDataIndex][shift] = "work";
      } else {
        cloneArr[dataIndex].date[findDataIndex][shift] = "overtime";
      }
      // console.log( props.sumaryData[dataIndex].date[findDataIndex][shift]);
      if (
        props.sumaryData[dataIndex].date[findDataIndex][shift] === undefined
      ) {
        cloneArr[dataIndex].date[findDataIndex]["type"] = "add";
      } else {
        cloneArr[dataIndex].date[findDataIndex]["type"] = "edit";
      }
      return cloneArr;
    });
  };

  const onSave = () => {
    Swal.fire({
      title: "ยืนยันการบันทึกข้อมูล?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingState(true);
        const res = await updateWorkDay(
          props.site,
          workDataState,
          props.leaveDay
        )
          .then((r) => {
            return r;
          })
          .finally(() => {
            setLoadingState(false);
            props.swrWorkday.mutate();
          });
        Swal.fire("สำเร็จ", "แก้ไขข้อมูลสำเร็จ", "success");
      }
    });
  };
  const checkIcon = (data: any, shift: any, checkLeave: boolean) => {
    if (
      data[shift] === "offwork" ||
      (data[shift] === undefined &&
        (dayjs(data.date, "YYYYMMDD").get("day") === 0 || checkLeave))
    ) {
      return <ClearIcon sx={{ color: "red" }} />;
    }
    if (data[shift] === undefined) {
      return <LensIcon sx={{ color: "#1D336D" }} />;
    }
    if (data[shift] === "work") {
      if (checkLeave) {
        return <CheckBoxOutlineBlankRoundedIcon sx={{ color: "#1D336D" }} />;
      }
      return <PanoramaFishEyeIcon sx={{ color: "#1D336D" }} />;
    }
    if (data[shift] === "overtime") {
      if (checkLeave) {
        return <SquareRoundedIcon sx={{ color: "#1D336D" }} />;
      }
      return <LensIcon sx={{ color: "#1D336D" }} />;
    }
    return <> </>;
  };
  const columns = useMemo(() => {
    setWorkDataState(props.sumaryData);
    let dateColumn: any = [];
    props.columnDay.forEach((d: any, i) => {
      dateColumn.push({
        maxSize: 60,
        id: (i + 1).toString(), //id required if you use accessorFn instead of accessorKey
        Header: () => {
          let numDate = dayjs(d.date, "YYYYMMDD").format("D");
          return (
            <div className="flex flex-col items-center ">
              <i style={{ fontFamily: "" }}>{numDate}</i>
              <p className="w-full">{d.day}</p>
            </div>
          );
        },
        Cell: ({ cell }: { cell: any }) => {
          const data = cell.row.original;
          const findDataIndex = data.date.findIndex(
            (machineData: any) => machineData.date === d.date
          );
          let currentDay = dayjs().format("YYYYMMDDHH");
          let previousDay = dayjs().subtract(1, "day").format("YYYYMMDDHH");

          let checkLeave = props.leaveDay?.some((d: any) => {
            // console.log( dayjs(d.sdate, "YYYY-MM-DD").format("YYYYMMDD") ,
            // data.date[findDataIndex].date);
            return (
              dayjs(d.sdate, "YYYY-MM-DD").format("YYYYMMDD") ===
              data.date[findDataIndex].date
            );
          });
          let checkPreviousDay =
            currentDay >
            dayjs(data.date[findDataIndex].date, "YYYYMMDD")
              .hour(20) //TODO: 20 เพราะว่าให้แก้ตอนมี OT ได้
              .format("YYYYMMDDHH");
          let checkPreviousNight =
            previousDay >
            dayjs(data.date[findDataIndex].date, "YYYYMMDD")
              .hour(8) //TODO: 8 เพราะว่าให้แก้ตอนมี OT ได้
              .format("YYYYMMDDHH");
          // console.log(data);
          return (
            <div className="mx-auto flex flex-col w-full h-full ">
              <p
                onClick={() => {
                  if (!checkPreviousDay) {
                    handleCellClick(
                      data,
                      "dayShift",
                      findDataIndex,
                      checkLeave
                    );
                  }
                }}
                className={`px-1 w-full h-full py-2 flex-1 ${
                  checkPreviousDay
                    ? "bg-gray-400"
                    : "cursor-pointer hover:bg-gray-300"
                }   border-b-2 border-l-2 border-t-2 border-black`}
              >
                {checkIcon(data.date[findDataIndex], "dayShift", checkLeave)}
              </p>
              <p
                onClick={() => {
                  if (!checkPreviousNight) {
                    handleCellClick(
                      data,
                      "nightShift",
                      findDataIndex,
                      checkLeave
                    );
                  }
                }}
                className={`px-1 w-full  h-full  py-2 flex-1 ${
                  checkPreviousNight
                    ? "bg-gray-400"
                    : "cursor-pointer hover:bg-gray-300"
                }   border-l-2 border-b-2   border-black`}
              >
                {checkIcon(data.date[findDataIndex], "nightShift", checkLeave)}
              </p>
            </div>
          );
        }, //render
      });
    });

    let data = [
      {
        maxSize: 50,
        accessorFn: (originalRow: any) => originalRow.aera, //alternate way
        id: "Area", //id required if you use accessorFn instead of accessorKey
        header: "Area",
        Header: (
          <i className="" style={{ fontFamily: "" }}>
            Area
          </i>
        ), //optional custom markup
      },
      {
        maxSize: 50,
        accessorFn: (originalRow: any) => originalRow.line, //alternate way
        id: "line", //id required if you use accessorFn instead of accessorKey
        header: "Line",
        Header: <i style={{ fontFamily: "" }}>Line</i>, //optional custom markup
      },
      {
        maxSize: 50,
        id: "d/n", //id required if you use accessorFn instead of accessorKey
        Header: (
          <div className="text-center">
            <div className="mx-auto">
              <p className="">D/N</p>
            </div>
          </div>
        ),
        Cell: ({ cell }: { cell: any }) => {
          const data = cell.row.original;

          return (
            <div className="mx-auto flex flex-col w-fll h-full ">
              <div className="px-1 w-full h-full py-2 flex-1  border-b-2 border-l-2 border-t-2 border-black">
                D
              </div>
              <div className="px-1 w-full  h-full  py-2 flex-1 border-l-2 border-b-2   border-black">
                N
              </div>
            </div>
          );
        }, //render
      },
    ];

    return data.concat(dateColumn);
  }, [props.workday]);
  const unqiAera =
    props.site === "AA"
      ? _.uniqBy(props.machineName, "aera")
      : _.uniqBy(props.machineName, "Aera");
  return (
    <>
      <Head>
        <title>Machine Line </title>
        <meta name="description" content="Dashboard for factory work detail" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loadingState || props.swrWorkday.isLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <div className="w-screen h-screen relative overflow-y-hidden bg-[#F2F2F2] text-white">
        <div className="mx-12 mt-12">
          <select
            id="countries"
            className="bg-[#181B1F] border border-gray-300 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onChange={(e) => {
              if (e.target.value !== "") {
                router.replace(`/${props.site}/${e.target.value}`);
              }
            }}
            defaultValue={props.name}
          >
            <option value={""}>Select Area</option>

            {props.site === "AA"
              ? unqiAera.map((d) => {
                  return (
                    <option key={d.id} value={d.aera}>
                      {d.aera}
                    </option>
                  );
                })
              : unqiAera.map((d) => {
                  return (
                    <option key={d.id} value={d.Aera}>
                      {d.Aera}
                    </option>
                  );
                })}
          </select>
        </div>
        <div className="px-12 py-4 flex justify-between text-black items-center">
          <div></div>
          <div className="flex  items-center space-x-2">
            <ArrowBackIosIcon
              className="mt-1 cursor-pointer hover:text-gray-400"
              onClick={() => {
                props.monthState.setData((prev) =>
                  dayjs(prev, "MM").subtract(1, "month").format("MM YYYY")
                );
              }}
            />
            <p className="text-xl">
              {dayjs(props.monthState.data, "MM YYYY").format("MMMM YYYY")}
            </p>
            <ArrowForwardIosIcon
              className="mt-1 cursor-pointer hover:text-gray-400"
              onClick={() => {
                props.monthState.setData((prev) =>
                  dayjs(prev, "MM").add(1, "month").format("MM YYYY")
                );
              }}
            />
          </div>
          <Button
            onClick={onSave}
            variant="contained"
            className="bg-[#1D336D] text-white"
          >
            {" "}
            บันทึก
          </Button>
        </div>
        <div className="mx-12">
          <MaterialReactTable
            //@ts-ignore
            columns={columns}
            data={workDataState}
            //   enableRowSelection //enable some features
            enableHiding={false}
            enableGlobalFilter={false} //turn off a feature
            enableColumnActions={false}
            enableColumnFilters={false}
            //   enablePagination={false}
            enableSorting={false}
            enableBottomToolbar={false}
            enableExpandAll={false}
            enableFullScreenToggle={false}
            enableDensityToggle={false}
            enableTopToolbar={false}
            muiTableBodyRowProps={{ hover: false }}
            enablePinning
            muiTablePaperProps={{
              elevation: 0, //change the mui box shadow
              //customize paper styles
              sx: {
                borderRadius: "8px",
                border: "1px solid #e0e0e0",
              },
            }}
            muiTableProps={{
              sx: {
                height: "1px",
                borderRadius: "8px",

                //   border: "1px solid #E0E0E0",
                // "& .MuiTableContainer-root th:first-child" : {
                //   borderTopLeftRadius:" 10px",
                //   borderBottomLeftRadius: "10px"
                // },

                // "& .MuiTableContainer-root th:last-child" : {
                //   borderTopRightRadius: "10px",
                //   borderBottomRightRadius: "10px"
                // },
              },
            }}
            muiTableHeadCellProps={{
              sx: {
                padding: "0px 0px",
                "& .Mui-TableHeadCell-Content": {
                  // width : '100%',
                  justifyContent: "center",
                },
                // borderRadius: "8px",
                borderLeftWidth: "2.5px",

                backgroundColor: "#F9F9F9",
                // border: "1px solid #E0E0E0",
              },
            }}
            muiTableBodyCellProps={{
              sx: {
                height: "100%",
                padding: "0px 0px",
                // borderBottomWidth : "2.5px",
                // borderColor : "#FF0000",
                textAlign: "center",
                //   border: "1px solid #E0E0E0",
              },
            }}
            initialState={{ columnPinning: { left: ["Area", "line", "d/n"] } }}
          />
        </div>
      </div>
    </>
  );
}

const CustomInput = function BrowserInput(props: any) {
  const { inputProps, InputProps, ownerState, inputRef, error, ...other } =
    props;

  return (
    <div className="relative mx-2" style={{ fontFamily: "BoonBaanRegular" }}>
      <p className="">{props.label}</p>

      <div className="relative" ref={InputProps?.ref}>
        <div className="absolute top-1/2 left-[-4px]  -translate-y-1/2 ">
          {InputProps?.endAdornment}
        </div>

        <input
          ref={inputRef}
          {...inputProps}
          {...(other as any)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        />
      </div>
    </div>
  );
};
