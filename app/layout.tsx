import "../styles/globals.css";
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
        {children}
      </body>
    </html>
  );
}
