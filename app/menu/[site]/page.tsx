"use client";

import { Button, Menu, MenuItem, Snackbar } from "@mui/material";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import {
  MuiDatePicker,
  SelectHour,
  SelectMinute,
  SelectMulti,
  SelectShift,
} from "../../../model/exportSelect";
import { filterData, searchData } from "../../../interface/searchData";
import { getMinutebySec, removeAttrlvl_one } from "../../../control/controller";

import { Production_Line } from "../../../interface/machine";
import React from "react";
import { RenderExportTable } from "../../../model/table_export";
import dayjs from "dayjs";
import { exportCSVFile } from "../../../control/export";
import { fetchProduction_Time } from "../../../control/api";
import { matchSorter } from "match-sorter";
import { snackBarType } from "../../../interface/snackbar";
import { sort } from "fast-sort";

export default function MenuPage(props: { params: { site: string } }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  React.useEffect(() => {
    handleSearch().then();
    setLoading(false);
  }, []);
  // const handleClose = () => {
  //   setAnchorEl(null);
  // };

  const [searchData, setSearchData] = React.useState<Production_Line[] | []>(
    []
  );
  const [state, setState] = React.useState<Production_Line[] | []>([]);

  const [snackBar, setSnackBar] = React.useState<snackBarType>({
    open: false,
    message: "",
    type: "success",
  });

  const openSnackbar = (props: snackBarType) => {
    setSnackBar(props);
  };

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackBar({
      ...snackBar,
      open: false,
    });
  };

  const site = props.params.site.toUpperCase();
  const [search, setSearch] = React.useState<searchData>({
    startDate: dayjs().subtract(1, "day"),
    startHr: "0",
    startMin: "0",
    endDate: dayjs(),
    endHr: "23",
    endMin: "59",
  });
  const [filter, setFilter] = React.useState<filterData>({
    machine: [],
    shift: null,
  });

  const [loading, setLoading] = React.useState(false);

  const onDownloadClick = async () => {
    if (searchData.length === 0) {
      openSnackbar({
        open: true,
        message: "No Data",
        type: "error",
      });
      return;
    }
    exportCSVFile(state, headerTable);
  };

  const handleSearch = async () => {
    setLoading(true);
    if (search.startDate === null || search.endDate === null) {
      openSnackbar({
        open: true,
        message: "Please select date",
        type: "error",
      });
      return;
    }

    let startHr = search.startHr ? parseInt(search.startHr) : 0;
    let startMin = search.startMin ? parseInt(search.startMin) : 0;
    let startDate = search.startDate.hour(startHr).minute(startMin);

    let endHr = search.endHr ? parseInt(search.endHr) : 0;
    let endMin = search.startMin ? parseInt(search.startMin) : 0;
    let endDate = search.endDate.hour(endHr).minute(endMin);
    if (startDate.valueOf() > endDate.valueOf()) {
      openSnackbar({
        open: true,
        message: "Start time is more than end time",
        type: "error",
      });
      return;
    }
    const data = await fetchProduction_Time(site, startDate, endDate);
    const productionData: Production_Line[] = removeAttrlvl_one(data);
    if (productionData.length === 0) {
      openSnackbar({
        open: true,
        message: "No Data",
        type: "error",
      });
      return;
    }
    setSearchData(formatData(productionData));
  };

  function checkMachineFilter(d: Production_Line, filter: filterData) {
    return (
      filter.machine.length === 0 ||
      (filter.machine.length !== 0 && filter.machine.includes(d.Alias_Name))
    );
  }

  function checkShiftFilter(d: Production_Line, filter: filterData) {
    if (filter.shift === null) {
      return true;
    }

    let startTime = dayjs(d.Start, "DD-MM-YYYY HH:mm").hour();

    if (filter.shift === "Day Shift") {
      return startTime > 7 && startTime < 20;
    } else {
      return startTime > 19 || startTime < 8;
    }
  }

  const formatData = (items: Production_Line[]) => {
    const data = items.map((production) => {
      // console.log(items);
      
      let startTime =     production.First_time  ? dayjs(production["First_time"]).hour() :   dayjs(production["Start"]).hour();
      if (startTime >= 7 && startTime < 20) {
        production.Shift = "Day";
      } else {
        production.Shift = "Night";
      }

      production.Stop = dayjs(production.Stop).format("DD-MM-YYYY HH:mm");
      production.Start = production.First_time ?  dayjs(production.First_time ).format("DD-MM-YYYY HH:mm") :dayjs(production.Start ).format("DD-MM-YYYY HH:mm") 
      // production.Plan = production.P_Plan;
      // console.log(production.Production_Time);
      
      production.Production_Time = getMinutebySec(
        parseInt(production.Production_Time)
      );
      production.Plan_downtime = getMinutebySec(
        parseInt(production.Plan_downtime)
      );
      production.Running_Utilization = getMinutebySec(
        parseInt(production.Running_Utilization)
      );
      production.Idle_Utilization = getMinutebySec(
        parseInt(production.Idle_Utilization)
      );
      production.Stop_Utilization = getMinutebySec(
        parseInt(production.Stop_Utilization)
      );
      production.NG = production.NG ? production.NG : "-";
      production.CycleTime = production.CycleTime ? production.CycleTime : "-";
      return production;
    });

    return data;
  };

  const filterData = () => {
    const data = searchData.filter((d) => {
      if (filter.machine.length === 0 && filter.shift === null) {
        return true;
      }

      return checkMachineFilter(d, filter) && checkShiftFilter(d, filter);
    });
    return sort(data).asc((d) => d.Alias_Name);
  };

  React.useEffect(() => {
    setState(filterData());
  }, [searchData, filter]);
console.log('filter',filter)
console.log('searchData',searchData)
  return (
    <div
      className=" w-screen h-screen p-4 "
      style={{ backgroundColor: "#f5f5f5" }}
    >
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackBar.open}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert
          onClose={handleClose}
          severity={snackBar.type}
          sx={{ width: "100%" }}
        >
          {snackBar.message}
        </Alert>
      </Snackbar>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <div className=" p-4" style={{ width: "45vw" }}>
          <div className="flex " style={{ alignItems: "center" }}>
            <span className=" basis-1/4">Machine name : </span>{" "}
            <SelectMulti
              mcData={searchData}
              label="Select machine name"
              state={[filter, setFilter]}
            />
          </div>
          <div className="flex mt-3" style={{ alignItems: "center" }}>
            <span className=" basis-1/4">Shift : </span>{" "}
            <SelectShift label="Select Shift" state={[filter, setFilter]} />
          </div>
        </div>
      </Menu>
      <div className="flex flex-1 justify-end items-center">
        <div className="flex justify-end items-center border-black border-2 rounded-md px-4 py-2  ">
          <span className="mx-2">Start : </span>
          <div className="w-[150px]">
            <MuiDatePicker
              state={[search, setSearch]}
              label="Date"
              type="start"
            />
          </div>
          <div className=" w-[100px] ml-4">
            <SelectHour state={[search, setSearch]} label="Hour" type="start" />
          </div>
          <div className=" w-[100px] ml-4">
            <SelectMinute
              state={[search, setSearch]}
              label="Minute"
              type="start"
            />
          </div>
        </div>
        <div className="flex justify-end items-center border-black border-2 rounded-md px-4 py-2  ml-4">
          <span className="mx-2">End : </span>
          <div className="w-[150px]">
            <MuiDatePicker
              state={[search, setSearch]}
              label="Date"
              type="end"
            />
          </div>
          <div className=" w-[100px] ml-4">
            <SelectHour state={[search, setSearch]} label="Hour" type="end" />
          </div>
          <div className=" w-[100px] ml-4">
            <SelectMinute
              state={[search, setSearch]}
              label="Minute"
              type="end"
            />
          </div>
        </div>
        <div className="  ml-4">
          <Button
            variant="contained"
            className="bg-blue-500  "
            disabled={loading}
            onClick={() =>
              handleSearch().then((d) => {
                setLoading(false);
              })
            }
          >
            Search
          </Button>
        </div>
        <div className=" ml-4">
          <Button
            variant="contained"
            onClick={onDownloadClick}
            className="bg-blue-500"
          >
            Download
          </Button>
        </div>
        <div className=" ml-4">
          <Button
            className="mr-4 bg-blue-500"
            id="basic-button"
            variant="contained"
            // aria-controls={open ? "basic-menu" : undefined}
            // aria-haspopup="true"
            // aria-expanded={open ? "true" : undefined}
            onClick={handleClick}
          >
            Filter
          </Button>
        </div>
      </div>
      {/* {console.log(Object.keys(filterData()[0]))} */}
      {state.length !== 0 && (
        <div className=" overflow-auto  h-5/6 relative mt-2 ">
          <RenderExportTable
            loading={loading}
            productionData={state}
            headerTable={headerTable}
          />
        </div>
      )}
    </div>
  );
}

const headerTable: { field: string; color: string; fontColor?: string }[] = [
  { field: "Plant", color: "#9BBB59" },
  { field: "Production_Line", color: "#9BBB59" },
  { field: "Alias_Name", color: "#9BBB59" },
  { field: "PartName_Oracle", color: "#9BBB59" },
  { field: "Plan_Target", color: "#9BBB59" },
  { field: "P_Plan", color: "#9BBB59" },
  { field: "Actual", color: "#9BBB59" },
  { field: "NG", color: "#9BBB59" },
  { field: "CycleTime", color: "#9BBB59" },
  { field: "Start", color: "#808080" },
  { field: "Stop", color: "#808080" },
  { field: "Shift", color: "#808080" },
  { field: "Production_Time", color: "#A6A6A6" },
  { field: "Plan_downtime", color: "#4F81BD" },
  { field: "Running_Utilization", color: "#00B050" },
  { field: "Idle_Utilization", color: "#FFFF00", fontColor: "black" },
  { field: "Stop_Utilization", color: "#FF0000" },
  { field: "Availability", color: "#9BBB59" },
  { field: "Performance", color: "#9BBB59" },
  { field: "Quality", color: "#9BBB59" },
];

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
