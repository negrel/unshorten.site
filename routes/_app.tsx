import { type PageProps } from "$fresh/server.ts";
import PrismeBanner from "@/components/PrismeBanner.tsx";
import Header from "@/components/Header.tsx";
import Footer from "@/components/Footer.tsx";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>unshorten.site</title>
        <link rel="stylesheet" href="/styles.css" />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          // @ts-ignore: Non standard safari extension.
          color="#000000"
        />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="theme-color" content="#ffffff" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 relative pb-24">
        <PrismeBanner />
        <Header />
        <Component />
        <Footer />
      </body>
    </html>
  );
}
