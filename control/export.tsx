import { Production_Line } from "../interface/machine";
import XLSX from "xlsx-js-style";
import { checkHeaderKey } from "./controller";

const exportCSVFile = (
  items: Production_Line[],
  headerTable: { field: string; color: string; fontColor?: string }[]
) => {
  let removeUnUseHeader = headerTable;
  // let removeUnUseHeader = headerTable.filter((d) => d.field !== "Shift");
  // let formatData = items.map((production) => {
  //   console.log(production);
  // });
  // return
  let wscolsArr: any = [];
  const wb = XLSX.utils.book_new();
  const allcomWb = XLSX.utils.book_new();
  const headerStyle = {
    alignment: { vertical: "center", horizontal: "center" },
    font: {
      name: "Bai Jamjuree",
      color: { rgb: "FFFFFF" },
    },
    fill: {
      fgColor: { rgb: "1D336D" },
    },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };
  const rowStyle = {
    alignment: { vertical: "center", horizontal: "center" },
    font: {
      name: "Bai Jamjuree",
      // color: { rgb: "FFFFFF" },
    },
    // fill: {
    //   bgColor: { rgb: "ffffff" },
    // },
    // border: {
    //   top: { style: "thin", color: { rgb: "000000" } },
    //   left: { style: "thin", color: { rgb: "000000" } },
    //   bottom: { style: "thin", color: { rgb: "000000" } },
    //   right: { style: "thin", color: { rgb: "000000" } },
    // },
  };

  const header = removeUnUseHeader.map((key) => {
    return {
      v: checkHeaderKey(key.field),
      t: "s",
      s: {
        ...headerStyle,
        font: {
          name: "Bai Jamjuree",
          color: {
            rgb: key.fontColor ? key.fontColor.replace("#", "") : "FFFFFF",
          },
        },
        fill: { fgColor: { rgb: key.color.replace("#", "") } },
      },
    };
  });

  let allcomRow: any = [header];

  let row: any = [header];
  let objectMaxLength: any = [];

  items.forEach((production, i: number) => {
    const arrData = removeUnUseHeader.map((key) => {
      //@ts-ignore
      return { v: production[key.field], t: "s", s: rowStyle };
    });
    let value = Object.values(items[i]);

    for (let j = 0; j < value.length; j++) {
      // console.log(objectMaxLength[j] > value[j].length
      //   ? objectMaxLength[j]
      //   : value[j].length + 5);

      if (value[j] !== null) {
        objectMaxLength[j] =
          objectMaxLength[j] > value[j].length
            ? objectMaxLength[j]
            : value[j].length + 15;
      }
    }

    allcomRow.push(arrData);
    row.push(arrData);
  });
  const wscols = objectMaxLength.map((w: any) => {
    return { width: w };
  });
  wscolsArr.push(wscols);
  let ws = XLSX.utils.aoa_to_sheet(row);
  ws["!cols"] = wscols;

  XLSX.utils.book_append_sheet(wb, ws);

  //padding all company Data
  let newWidthWs: any = [];
  wscolsArr.map((data: any, i: number) => {
    data.map((d: any, index: number) => {
      if (newWidthWs[index] === undefined) {
        newWidthWs[index] = [d];
      } else {
        newWidthWs[index].push(d);
      }
    });
  });
  XLSX.writeFile(wb, `Production_report` + ".xlsx" || "export.xlsx");

  return null;
};

export { exportCSVFile };
