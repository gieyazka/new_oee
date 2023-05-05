import { Dayjs } from "dayjs";

export interface searchData {
  startDate: Dayjs | null;
  startHr: string ;
  startMin: string ;
  endDate: Dayjs | null;
  endHr: string ;
  endMin: string ;
}



export interface filterData {
  machine: string[],
  shift: string | null,
}