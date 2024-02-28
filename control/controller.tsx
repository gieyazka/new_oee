import useSWR, { Fetcher, Key, mutate } from "swr";

import { Machine } from "../interface/machine";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import useSWRImmutable from "swr/immutable";

const useSite = () => {
  const router = useRouter();

  // const { site } = router.query;
  // return (site as string)?.toUpperCase();
  return "AA";
};
const useHost = () => {
  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "";

  const URL = `${origin}`;
  return URL;
};

const getServer = (site: string) => {
  site = site.toUpperCase();
  if (site === "AHP") {
    return "http://10.10.22.209:1337";
  } else if (site === "ASP") {
    return "http://10.40.10.209:1337";
  }
  //AA
  return "http://10.20.10.209:1337";
};

const getBoolShift = () => {
  let currentTime = dayjs().format("HH:mm");
  if (currentTime >= "08:00" && currentTime <= "19:59") {
    return true;
  }
  return false;
};
const getHours = () => {
  if (getBoolShift()) {
    return [
      "8 AM",
      "9 AM",
      "10 AM",
      "11 AM",
      "12 AM",
      "1 PM",
      "2 PM",
      "3 PM",
      "4 PM",
      "5 PM",
      "6 PM",
      "7 PM",
    ];
  }
  return [
    "8 PM",
    "9 PM",
    "10 PM",
    "11 PM",
    "12 PM",
    "1 AM",
    "2 AM",
    "3 AM",
    "4 AM",
    "5 AM",
    "6 AM",
    "7 AM",
  ];
};

const fetchApi = (
  options: { pageIndex: number; pageSize: number },
  data: any,
  check: boolean,
  page: number
) => {
  let currentPage = page;
  let totalPage = Math.ceil(data.length / options.pageSize);
  if (currentPage !== totalPage) {
    currentPage += 1;
  } else {
    currentPage = 1;
  }

  const rows = data.slice(
    (currentPage - 1) * options.pageSize,
    (currentPage + 0) * options.pageSize
  );
  return {
    rows: [...rows],
    pageCount: totalPage,
    currentPage,
  };
};

const getHoursTime = (ampm: string) => {
  let hr = dayjs(`1/1/1 ${ampm.split(" ")[0]}:00 ${ampm.split(" ")[1]}`).format(
    "HH"
  );
  let today = dayjs().hour(parseInt(hr));
  let startTime = today.minute(0).second(0).valueOf();
  let endTime = today.minute(0).second(0).valueOf();
  return {
    startTime,
    endTime,
  };
};

const getStartTime = (produceTime: string) => {
  if (produceTime === undefined || produceTime === null) {
    return "";
  }
  if (produceTime === "No data") {
    return produceTime;
  }
  let time = produceTime.split(":");
  let hr = Math.abs(parseInt(time[0]));
  let min = Math.abs(parseInt(time[1]));
  let sec = Math.abs(parseInt(time[2]));
  let startTime = dayjs()
    .subtract(hr, "h")
    .subtract(min, "m")
    .subtract(sec, "s")
    .format("HH:mm:ss");

  return startTime;
};

const getAvgPercent = (sumPercentage: number, size: number, noData: number) => {
  return Math.round(sumPercentage / (size - noData));
};
const getInfluxServer = (site: String) => {
  if (site === "AHP") {
    return {
      server: "http://10.10.22.209:8086",
      token:
        "XNLHRzo-89EWZ3iaxIadRtpzGPBcbr2oLDihiqiQDkudZrMh04dvN7wzqqGLWbry2QGqpEfqL9k_OYeEwLyX4Q==",
    };
  }
  if (site === "AA") {
    return {
      server: "http://10.20.10.209:8086",
      token:
        "4GES3Ky0_YZujUlsEEwpJ3lXdlqkfSyOJShxy9LOOE6FvDpQUZexbPmivibaFY8yeGQVbHEMvkQNFfzcWeuNNg==",
    };
  }
  return {
    server: "http://10.40.10.209:8086",
    token:
      "JXp-HDmJSZV8vLKh7z7GMEfXFl4rzLvDYnJ-cCmUK9sGQHsy1XJpbSuwiE4tNToZWzKQYjf9lksghlPx56mhLg==",
  }; //ASP
};

const removeAttrlvl_one = (arrayFromAPi: any) => {
  let newdata = [];
  for (const element of arrayFromAPi.data) {
    delete element.attributes.createdAt;
    delete element.attributes.updatedAt;
    newdata.push({
      id: element.id,
      ...element.attributes,
    });

    //TODO: fetch all data in here and useSWR to refreashData
  }
  return newdata;
};

const getMinutebySec = (sec: number) => {
  const getsec = sec % 60 >= 30 ? 1 : 0;
  return (Math.floor(sec / 60) + getsec).toString();
};

const checkHeaderKey = (key: string) => {
  if (key === "P_Plan") {
    return "Plan";
  }
  if (key === "Plan_Target") {
    return "Target";
  }
  if (key === "PartName_Oracle") {
    return "Part Name";
  }
  if (key === "CycleTime") {
    return "CT(s)";
  }
  if (key === "Production_Time") {
    return "Prod.Time(m)";
  }
  if (key === "Plan_downtime") {
    return "P/D(m)";
  }
  if (key === "Running_Utilization") {
    return "Running(m)";
  }
  if (key === "Idle_Utilization") {
    return "Idle(m)";
  }
  if (key === "Stop_Utilization") {
    return "Stop(m)";
  }
  return key;
};

const getStringStatus = (status: string) => {
  if (status === "execute") {
    return "Execution";
  } else if (status === "idle") {
    return "Idle Time";
  } else if (status === "stopped") {
    return "Non-Produced";
  } else if (status === "plan_downtime") {
    return "Planned D/T";
  } else {
    return status;
  }
};

export {
  useSite,
  checkHeaderKey,
  getHours,
  fetchApi,
  getStringStatus,
  useHost,
  getHoursTime,
  getStartTime,
  getAvgPercent,
  getServer,
  getInfluxServer,
  removeAttrlvl_one,
  getMinutebySec,
};
