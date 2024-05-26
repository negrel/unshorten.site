import BuyMeACoffee from "@/components/BuyMeACoffee.tsx";

function Footer() {
  return (
    <footer className="absolute bottom-0 w-full p-4 dark:bg-slate-800 bg-slate-200">
      <nav className="flex flex-col sm:flex-row flex-wrap justify-end items-center gap-2 sm:gap-4 text-sm">
        <BuyMeACoffee />
        <a
          href="https://github.com/negrel/unshorten.site"
          className="underline"
          target="_blank"
        >
          Source code
        </a>
        <a
          href="https://www.negrel.dev/feedback/?project=unshorten.site"
          className="underline"
        >
          Feedback
        </a>
        <a
          href="https://www.negrel.dev"
          className="underline"
          target="_blank"
          rel="author"
        >
          Made with <span className="text-red-500">❤️</span> by Alexandre Negrel
        </a>
      </nav>
    </footer>
  );
}

export default Footer;
