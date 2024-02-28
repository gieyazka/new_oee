"use client"

import "../styles/globals.css";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head />
      <body>
        <script>global = globalThis</script>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
   {children}
        </LocalizationProvider>
      </body>
    </html>
  );
}
