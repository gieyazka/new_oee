import dayjs, { Dayjs } from "dayjs";
import { getServer, useHost } from "./controller";
import useSWR, { Fetcher, Key, mutate } from "swr";

import { Machine } from "../interface/machine";
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

const useMachineName = (site: string) => {
  const server = getServer(site);
  const { data, error, isLoading } = useSWRImmutable(
    `${server}/api/equipments?filters[site][$eq]=${site}`,
    fetcher
    // { refreshInterval: 10000 }
  );
  return { data, error, isLoading };
};
const usePartList = (site: string) => {
  const server = getServer(site);
  const { data, error, isLoading } = useSWRImmutable(
    `${server}/api/part-lists`,
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
    `${server}/api/production-lines?filters[plant][$eq]=${site}&filters[Start][$gte]=${startTime.toISOString()}&filters[Start][$lte]=${endTime.toISOString()}`
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
  useMachineName,usePartList,
  useProduction_Time,
  fetchProduction_Time,
  useStatusMc,
  useData,
  getShift,
  useAllmc,
};
