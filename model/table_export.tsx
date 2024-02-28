import { Avatar, Chip, Skeleton } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";

import { Production_Line } from "../interface/machine";
import { checkHeaderKey } from "../control/controller";
import dayjs from "dayjs";

const RenderExportTable = ({
  productionData,
  headerTable,
  loading,
}: {
  headerTable: { field: string; color: string; fontColor?: string }[];
  productionData: Production_Line[];
  loading: boolean;
}) => {
  return (
    <table
      className="mt-4 w-3/4 relative "
      style={{
        borderRadius: "1em 1em 0 0",
        // overflow: "hidden",
      }}
    >
      <thead className=" h-10 relative overflow-auto border-separate">
        <tr className="sticky top-0 ">
          {headerTable.map((key, index) => (
            <th
              className="px-3"
              key={index}
              style={{
                color: key.fontColor ? key.fontColor : "white",

                backgroundColor: `${key.color}`,
                borderTopLeftRadius: `${index === 0 ? "6px" : "0px"}`,
                borderTopRightRadius: `${
                  Object.keys(productionData[0]).length === index - 1
                    ? "6px"
                    : "0px"
                }`,
              }}
            >
              {checkHeaderKey(key.field)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-center ">
        {(loading ? Array.from(new Array(20)) : productionData).map(
          (production, i) => (
            <tr
              className={`border-2 ${i % 2 !== 0 ? "bg-white" : "bg-gray-200"}`}
              key={i.toString()}
            >
              {headerTable.map((key, index: number) => {
                //@ts-ignore
                let value = production && production[key.field];

                return (
                  <td key={i.toString() + index.toString()}>
                    <div
                      className={`text-center px-4 whitespace-nowrap py-2`}
                      //   style={{ minWidth: "75%", margin: "1px 0px 1px 0px" }}
                    >
                      {!loading ? (
                        key.field === "Shift" ? (
                          <Chip
                            icon={
                              value === "Day" ? <LightMode /> : <DarkMode />
                            }
                            label={value}
                            variant="outlined"
                          />
                        ) : (
                          //   "asdsad"
                          <> {value}</>
                        )
                      ) : (
                        <Skeleton />
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          )
        )}
      </tbody>
    </table>
  );
};

export { RenderExportTable };
