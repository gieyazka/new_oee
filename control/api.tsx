import dayjs, { Dayjs } from "dayjs";
import { getServer, useHost } from "./controller";
import useSWR, { Fetcher, Key, mutate } from "swr";

import { Machine } from "../interface/machine";
import _ from "lodash";
import axios from "axios";
import { useRouter } from "next/navigation";
import useSWRImmutable from "swr/immutable";

const fetcher: Fetcher<any, string> = (url) => {
  return axios.get(url).then((res) => res.data);
};
function multiFetcher(urls: any) {
  return Promise.all(
    urls.map((url: any) => {
      return fetcher(url);
    })
  );
}

const getInfluxServer = (site: String) => {
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
const getShift = () => {
  let currentTime = dayjs().format("HH:mm");
  if (currentTime >= "08:00" && currentTime <= "19:59") {
    return "Day Shift";
  }
  return "Night Shift";
};

const useAllmc = (url: string[]) => {
  return useSWR(url, multiFetcher, {
    refreshInterval: 10000,
  });
};

const useWorkDay = (site: string, area: string, month: string) => {
  let date = dayjs(month, "MM")
  let startMonth = (date.startOf("month").format('YYYYMMDD'));
  let endMonth = (date.endOf("month").format('YYYYMMDD'));
  const server = getServer(site);
  let newMachine = [];
  let selectMachine = [];
  const { data, error, isLoading, mutate } = useSWRImmutable(
    `${server}/api/work-days?filters[aera][$eq]=${area}&filters[date][$gte]=${startMonth}&filters[date][$lte]=${endMonth}`,
    fetcher
    // { refreshInterval: 10000 }
  );
  if (data !== undefined) {
    for (const element of data.data) {
      delete element.attributes.createdAt;
      delete element.attributes.updatedAt;
      newMachine.push({
        id: element.id,
        ...element.attributes,
      });
    }

    if (site === "AHP") {
      for (const [index, element] of newMachine.entries()) {
        for (let i = 0; i < parseInt(element.Base as string); i++) {
          let new_machine: Machine = {
            status: "",
            id: 0,
            site: newMachine[index].Site,
            aera: newMachine[index].Aera,
            line: newMachine[index].Line,
            base: (i + 1).toString(),
            part: "",
            part_no: "",
            actual: 0,
            target: 0,
            plan: 0,
            produceTime: 0,
            oee: 0,
            availability: 0,
            performance: 0,
            start: "",
            Site: newMachine[index].Site,
            Aera: newMachine[index].Aera,
            Line: newMachine[index].Line,
            Base: newMachine[index].Base,
          };

          selectMachine.push(new_machine);
        }
        // console.log(index, parseInt(element.Base as string));
      }
    } else {
      selectMachine = newMachine;
    }
    // }
  }
  // console.log(selectMachine);

  return { data: newMachine, error, isLoading, mutate };
  // return { data: selectMachine, error, isLoading };
};

const useLeaveDay = (site: string) => {
  const leaveday = useSWRImmutable(
    `https://ess.aapico.com/calendars?site=${site}&subsite=factory&_limit=-1`,
    fetcher
    // { refreshInterval: 10000 }
  );
  return leaveday;
  // return { data: selectMachine, error, isLoading };
};

const updateWorkDay = async (site: string, state: any, leaveDay: any) => {
  const server = getServer(site);
  const data = _.cloneDeep(state);
  console.log(data);
  // console.log(data);
  let checkAdd: any[] = [];
  let checkEdit: any[] = [];
  for (const element of data) {
    let addData = element.date.filter((d: any) => {
      let checkLeave = leaveDay?.some((leave: any) => {
        return dayjs(leave.sdate, "YYYY-MM-DD").format("YYYYMMDD") === d.date;
      });
      d.aera = element.aera;
      d.line = element.line;
      if (d.nightShift === undefined) {
        if (checkLeave) {
          d.nightShift = "offwork";
        } else {
          d.nightShift = "overtime";
        }
      }
      if (d.dayShift === undefined) {
        if (checkLeave) {
          d.dayShift = "offwork";
        } else {
          d.dayShift = "overtime";
        }
      }
      let checkType = d.type;
      if (checkType === "add") {
        delete d.day;
        delete d.type;

      }
      return checkType === "add";
    });
    let editData = element.date.filter((d: any) => {
      let checkLeave = leaveDay?.some((leave: any) => {
        return dayjs(leave.sdate, "YYYY-MM-DD").format("YYYYMMDD") === d.date;
      });
      d.aera = element.aera;
      d.line = element.line;
      if (d.nightShift === undefined) {
        if (checkLeave) {
          d.nightShift = "offwork";
        } else {
          d.nightShift = "overtime";
        }
      }
      if (d.dayShift === undefined) {
        if (checkLeave) {
          d.dayShift = "offwork";
        } else {
          d.dayShift = "overtime";
        }
      }
      let checkType = d.type;
      if (checkType === "edit") {
        delete d.day;
        delete d.type;

      };
      return checkType === "edit";
    });
    checkAdd = [...checkAdd, ...addData];
    checkEdit = [...checkEdit, ...editData];
  }

  const sendData = {
    add: checkAdd,
    edit: checkEdit,
  };
  console.log(sendData);
  const res = await axios.post(`${server}/api/calworkday`, sendData);
  return res;
};
const useMachineNameByArea = (site: string, area: string) => {
  const server = getServer(site);
  let newMachine = [];
  let selectMachine = [];

  const { data, error, isLoading } = useSWRImmutable(
    `${server}/api/equipments?filters[site][$eq]=${site}&filters[aera][$eq]=${area}`,
    fetcher
    // { refreshInterval: 10000 }
  );
  if (data !== undefined) {
    for (const element of data.data) {
      delete element.attributes.createdAt;
      delete element.attributes.updatedAt;
      newMachine.push({
        id: element.id,
        ...element.attributes,
      });
    }

    if (site === "AHP") {
      for (const [index, element] of newMachine.entries()) {
        // if (element.Base === "1") {
        // } else {
        // console.log(element);
        // let deleteMachine = newMachine.splice(index, 1);

        for (let i = 0; i < parseInt(element.Base as string); i++) {
          let new_machine: Machine = {
            status: "",
            id: 0,
            site: newMachine[index].Site,
            aera: newMachine[index].Aera,
            line: newMachine[index].Line,
            base: (i + 1).toString(),
            part: "",
            part_no: "",
            actual: 0,
            target: 0,
            plan: 0,
            produceTime: 0,
            oee: 0,
            availability: 0,
            performance: 0,
            start: "",
            Site: newMachine[index].Site,
            Aera: newMachine[index].Aera,
            Line: newMachine[index].Line,
            Base: newMachine[index].Base,
          };

          selectMachine.push(new_machine);
        }
        // console.log(index, parseInt(element.Base as string));
      }
    } else {
      selectMachine = newMachine;
    }
    // }
  }
  // console.log(selectMachine);

  return { data: newMachine, error, isLoading };
  // return { data: selectMachine, error, isLoading };
};
const useMachineName = (site: string) => {
  const server = getServer(site);
  let newMachine = [];
  let selectMachine = [];

  const { data, error, isLoading } = useSWRImmutable(
    `${server}/api/equipments?filters[site][$eq]=${site}`,
    fetcher
    // { refreshInterval: 10000 }
  );
  if (data !== undefined) {
    for (const element of data.data) {
      delete element.attributes.createdAt;
      delete element.attributes.updatedAt;
      newMachine.push({
        id: element.id,
        ...element.attributes,
      });
    }
    console.log('newMachine', newMachine)
    if (site === "AHP") {
      for (const [index, element] of newMachine.entries()) {
        // if (element.Base === "1") {
        // } else {
        // console.log(element);
        // let deleteMachine = newMachine.splice(index, 1);

        for (let i = 0; i < parseInt(element.Base as string); i++) {
          let new_machine: Machine = {
            status: "",
            id: 0,
            site: newMachine[index].Site,
            aera: newMachine[index].Aera,
            line: newMachine[index].Line,
            base: (i + 1).toString(),
            part: "",
            part_no: "",
            actual: 0,
            target: 0,
            plan: 0,
            produceTime: 0,
            oee: 0,
            availability: 0,
            performance: 0,
            start: "",
            Site: newMachine[index].Site,
            Aera: newMachine[index].Aera,
            Line: newMachine[index].Line,
            Base: newMachine[index].Base,
          };

          selectMachine.push(new_machine);
        }
        // console.log(index, parseInt(element.Base as string));
      }
    } else {
      selectMachine = newMachine;
    }
    // }
  }
  // console.log(selectMachine);

  return { data: newMachine, error, isLoading };
  // return { data: selectMachine, error, isLoading };
};
const usePartList = (site: string) => {
  let partDB = "part-lists";
  if (site === "AHP") {
    partDB = "part-masters";
  }
  const server = getServer(site);
  const { data, error, isLoading } = useSWRImmutable(
    `${server}/api/${partDB}`,
    fetcher
    // { refreshInterval: 10000 }
  );
  return { data, error, isLoading };
};

const useProduction_Time = (site: string) => {
  const server = getServer(site);
  const { data, error, isLoading } = useSWRImmutable(
    `${server}/api/production-lines?filters[plant][$eq]=${site}`,
    fetcher

    // { refreshInterval: 10000 }
  );
  return { data, error, isLoading };
};
const fetchProduction_Time = async (
  site: string,
  startTime: Dayjs,
  endTime: Dayjs
) => {
  const server = getServer(site);

  const data = await fetch(
    `${server}/api/production-lines?filters[plant][$eq]=${site}&filters[Start][$gte]=${startTime.toISOString()}&filters[Start][$lte]=${endTime.toISOString()}&limit_-1`
  );
  return data.json();
};

const useStatusMc = ({
  site,
  line,
  area,
}: {
  site: string;
  line: string;
  area: string;
}) => {
  const { data, error, isLoading } = useSWR(
    useHost() + `/api/getStatus?site=${site}&area=${area}&line=${line}`,
    fetcher
    // { refreshInterval: 10000 }
  );
  return { data, error, isLoading };
};

const useData = (machine: any) => {
  const { data, error, isLoading } = useSWR(
    useHost() + `/api/intervalData?machine=${JSON.stringify(machine)}`,
    fetcher
    // { refreshInterval: 5000 }
  );
  return { data, error, isLoading };
};
export {
  useMachineName,
  useMachineNameByArea,
  useWorkDay,
  usePartList,
  useProduction_Time,
  fetchProduction_Time,
  useStatusMc,
  useData,
  getShift,
  useAllmc,
  useLeaveDay,
  updateWorkDay,
};
