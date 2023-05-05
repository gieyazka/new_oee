import Autocomplete, {
  AutocompleteRenderInputParams,
} from "@mui/material/Autocomplete";
import { filterData, searchData } from "../interface/searchData";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Dayjs } from "dayjs";
import { HTMLAttributes } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Production_Line } from "../interface/machine";
import TextField from "@mui/material/TextField";

interface input {
  label: string;
  state: [searchData, React.Dispatch<React.SetStateAction<searchData>>];
  type: string;
}
interface multiSelect {
  label: string;
  state: [filterData, React.Dispatch<React.SetStateAction<filterData>>];
  mcData?: Production_Line[] | null;
}

const MuiDatePicker = ({ state, label, type }: input) => {
  const [value, setValue] = [...state];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
      inputFormat="DD/MM/YYYY"
        label={label}
        value={type === "start" ? value.startDate : value.endDate}
        onChange={(e) => {
          if (type === "start") {
            setValue({ ...value, startDate: e });
            return;
          }
          setValue({ ...value, endDate: e });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            InputProps={{
              ...params.InputProps,
              type: "search",
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

const SelectHour = ({ label, state, type }: input) => {
  const [value, setValue] = [...state];

  return (
    <Autocomplete
      disableClearable
      options={hour.map((option) => option.toString())}
      renderOption={renderOption}
      value={type === "start" ? value.startHr : value.endHr}
      onChange={(e: React.SyntheticEvent, data: string) => {
        if (type === "start") {
          setValue({ ...value, startHr: data });
          return;
        }
        setValue({ ...value, endHr: data });
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            inputProps: {
              ...params.inputProps,
              max: 23,
              min: 0,
            },
          }}
        />
      )}
    />
  );
};

const SelectMinute = ({ label, state, type }: input) => {
  const [value, setValue] = [...state];

  return (
    <Autocomplete
      disableClearable
      defaultValue={type === "start" ? value.startMin : value.endMin}
      onChange={(e: React.SyntheticEvent, data: string) => {
        if (type === "start") {
          setValue({ ...value, startMin: data });
          return;
        }
        setValue({ ...value, endMin: data });
      }}
      options={minute.map((option) => option.toString())}
      renderOption={renderOption}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            inputProps: {
              ...params.inputProps,
              max: 59,
              min: 0,
            },
          }}
        />
      )}
    />
  );
};

const SelectMulti = ({ label, state, mcData }: multiSelect) => {
  const [value, setValue] = [...state];
  let mcNameArr = [...new Set(mcData?.map((d) => d.Alias_Name))];

  return (
    <Autocomplete
      multiple
      onChange={(e: React.SyntheticEvent, data: string[]) => {
        setValue({ ...value, machine: data });
      }}
      fullWidth
      options={mcNameArr.map((option) => option.toString())}
      renderOption={renderOption}
      value={value.machine}
      renderInput={(params) => (
        <TextField key={params.id} {...params} label={label} />
      )}
    />
  );
};
const SelectShift = ({ label, state }: multiSelect) => {
  const [value, setValue] = [...state];

  return (
    <Autocomplete
      onChange={(e: React.SyntheticEvent, data: string | null) => {
        setValue({ ...value, shift: data });
      }}
      fullWidth
      options={["Day Shift", "Night Shift"].map((option) => option.toString())}
      renderOption={renderOption}
      value={value.shift}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
};

const hour = Array.from(Array(24).keys());
const minute = Array.from(Array(60).keys());
const renderOption = (props: HTMLAttributes<HTMLLIElement>, option: string) => {
  return (
    <li {...props} key={option}>
      {option}
    </li>
  );
};

export { SelectHour, SelectMinute, MuiDatePicker, SelectMulti, SelectShift };
