export const metadata = {
  title: "Ezra — Daily Goals",
  description: "Minimal daily goals with a wise mentor.",
  metadataBase: new URL("https://ezra.jacobwalsh.com"),
  alternates: {
    canonical: "/", // results in https://ezra.jacobwalsh.com/
  },
};


import "../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
