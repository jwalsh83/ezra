export const metadata = {
  title: "Ezra — Daily Goals",
  description: "Minimal daily goals with a wise mentor.",
};

import "../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
