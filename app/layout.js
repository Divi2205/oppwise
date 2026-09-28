import "./globals.css";
import Nav from "@/components/Nav";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata = {
  title: "OppWise — never miss an opportunity worth taking",
  description: "Capture opportunities from anywhere, check them, and know whether to apply.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport = { themeColor: "#17123D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main className="container-app py-6 sm:py-8">{children}</main>
        <ServiceWorker />
      </body>
    </html>
  );
}
