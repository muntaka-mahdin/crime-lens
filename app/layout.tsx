import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const SITE_URL = "https://muntaka-mahdin.github.io/crime-lens/";
const DESCRIPTION =
  "Interactive street crime map and analytics for UK cities, using open data from data.police.uk.";

export const metadata: Metadata = {
  title: "Crime Lens",
  description: DESCRIPTION,
  // Link previews (LinkedIn, Slack, etc.) need absolute URLs for the page and image.
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Crime Lens: UK street crime map and analytics",
    description: DESCRIPTION,
    images: [{ url: `${SITE_URL}og.png`, width: 1200, height: 630, alt: "Crime Lens map and charts for Huddersfield" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
