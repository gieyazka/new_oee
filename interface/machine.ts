export interface Machine {
    status: string;
    id: number,
    site: string,
    aera: string,
    line: string,
    base: string,
    part: string,
    part_no: string,
    actual: number,
    target: number,
    plan: number,
    produceTime: number,
    oee: number,
    availability: number,
    performance: number,
    start: string
}
export interface PartList {
    id : number ;
    Alias_Name: string;
    CT_Oracle: string;
    Machine_Code: string;
    PartName_Oracle: string;
    PartNo_Oracle: string;
    Production_Line: string;
    Production_No: string;
    Production_Pieces: string;
    PartNo_OrProgram_Nameacle: string;
    Program_No: string;
    Setting_Time: string;
    Quality: string;



}

export interface Production_Line {
    id: number;
    Plant: string;
    Production_Line: string;
    Alias_Name: string;
    Plan_Target: string;
    Actual: string;
    NG?: string | null;
    Running_Utilization: string;
    Idle_Utilization: string;
    Stop_Utilization: string;
    Start: string;
    Shift?: string | null;
    Stop: string;
    CycleTime: string;
    Performance: string;
    Quality: string;
    Availability: string;
    Production_Time: string;
    Plan_downtime: string;
    Standard_time: string;
    A_Plan: string;
    A_Actual: string;
    P_Plan: string;
    Plan?: string;
    P_Actual: string;
    PartNo_Oracle?: null;
    PartName_Oracle: string;
    First_time: any


}