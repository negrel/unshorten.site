import Button from "@/components/Button.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import FacebookIcon from "@/components/FacebookIcon.tsx";
import TwitterIcon from "@/components/TwitterIcon.tsx";
import RedditIcon from "@/components/RedditIcon.tsx";

interface Data {
  results?: string[];
  urls: string;
}

export const handler: Handlers<Data> = {
  async POST(req, ctx) {
    const dataUrls = await req.formData().then((formData) =>
      formData.get("urls")
    );
    if (
      dataUrls === undefined || dataUrls === null || dataUrls instanceof File
    ) {
      return ctx.render({ results: undefined, urls: ctx.data?.urls });
    }

    const urls = dataUrls.split("\n");
    const promises = urls.map(async (u) => {
      try {
        const url = new URL(u);
        const resp = await fetch(url, {
          redirect: "follow",
        });

        return resp.url;
      } catch (error) {
        return "Invalid URL";
      }
    });

    const results = await Promise.all(promises);

    return ctx.render({ results, urls: ctx.data?.urls });
  },
};

export default function Home({ data }: PageProps<Data>) {
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8 pb-8">
        {data?.results !== undefined
          ? (
            <>
              <h2 className="text-xl font-bold mb-4">
                Here is your unshortened URLs:
              </h2>
              {data.results.map((result) => (
                <a href={result} target="_blank" className="underline">
                  {result}
                </a>
              ))}
            </>
          )
          : undefined}
        <h2 className="text-xl font-bold mb-6">
          Enter one shortened URL per line:
        </h2>
        <form method="POST">
          <textarea
            name="urls"
            className="w-full p-2 border-2 border-slate-950 dark:border-slate-50 dark:bg-slate-900 outline-none"
            rows={12}
          />
          <div className="flex justify-center mt-8">
            <Button className="py-2 px-4">
              Unshorten
            </Button>
          </div>
        </form>
        <section>
          <dd>
            <dt className="text-lg font-bold mb-2">
              URLs unshortener
            </dt>
            <dd>
              Fast batch URLs unshortener.
            </dd>
            <dd>
              <ol className="list-decimal pl-8">
                <li>Copy & paste your shortened URLs</li>
                <li>Unshorten!</li>
              </ol>
            </dd>
          </dd>
          <dd>
            <dt className="text-lg font-bold my-2">
              No upload. No sign up.
            </dt>
          </dd>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">
            Fast URLs unshortener.
          </h2>
          <p>
            Unshorten an unlimited amount of URLs.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">What is a shortened URL?</h2>
          <p>
            A shortened URL, also known as a short URL or tiny URL, is a unique
            and shorter alternative to a long Uniform Resource Locator (URL).
            It's often used to make a long URL easier to read and remember,
            while also helping to reduce the number of characters needed to
            enter when sharing links online.
            <br />
            Shortened URLs are often used for tracking purposes, such as
            monitoring website traffic or measuring the effectiveness of a
            marketing campaign.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">Why Unshorten URLs?</h2>
          <p>
            There are several reasons why you might want to expand a shortened
            URL:
          </p>
          <ul className="list-decimal pl-8 mt-2">
            <li>
              <span className="font-bold">Security and Trust</span>: When you
              see a shortened URL, it's not always clear where it leads or what
              kind of website it is. Expanding the URL can help you understand
              the destination better, which can be important for security and
              trust reasons.
            </li>
            <li>
              <span className="font-bold">Tracking and Analytics</span>: When
              you expand a shortened URL, you can often get insights into how
              many people have visited the link, from where they came, and other
              analytics metrics. This information can be valuable for tracking
              marketing campaigns or understanding user behavior.
            </li>
            <li>
              <span className="font-bold">Understanding the Content</span>:
              Sometimes, the destination URL of a shortened link might not be
              immediately clear. Expanding the URL can help you understand what
              kind of content is being shared, whether it's an article, video,
              image, or something else.
            </li>
            <li>
              <span className="font-bold">Avoiding Redirect Loops</span>:
              Shortened URLs often redirect to other shortened URLs, which can
              create loops that make it difficult to reach the final
              destination. Expanding the URL can help you avoid these redirects
              and get straight to the content.
            </li>
            <li>
              <span className="font-bold">
                SEO and Search Engine Optimization
              </span>: When a search engine crawls a webpage, it needs to know
              what's on the page to include in its search results. If the
              original URL is shortened, the search engine might not be able to
              crawl the content correctly. Expanding the URL can help ensure
              that the content is properly indexed.
            </li>
            <li>
              <span className="font-bold">Legitimacy and Credibility</span>:
              When you see a shortened URL being shared widely, it's often
              important to verify its legitimacy. Expanding the URL can help you
              determine whether the link is coming from a reputable source or
              not.
            </li>
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">Why Use Our Service?</h2>
          <p>
            Our URLs unshortener service is free and simple to use.
          </p>
          <p>
            If you still don't trust us, you can self-host <b>unshorten.site</b>
            {" "}
            as it is free and open-source. Source code is available{" "}
            <a
              href="https://github.com/negrel/unshorten.site"
              className="underline"
              target="_blank"
            >
              here
            </a>
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-bold text-center">Like it? Share it!</h2>
          <ul class="flex flex-nowrap gap-6 justify-center mt-6">
            <li>
              <a
                data-share=""
                rel="noopener"
                target="_blank"
                href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fwww.unshorten.site%2F"
                title="Please share this page via Facebook"
              >
                <FacebookIcon className="text-blue-500 w-8 h-8 hover:scale-125 transition-all" />
              </a>
            </li>
            <li class="share__item">
              <a
                data-share=""
                rel="noopener"
                target="_blank"
                href="https://twitter.com/share?text=URLs%20Unshortener&amp;url=https%3A%2F%2Fwww.unshorten.site%2F"
                title="Please share this page via Twitter"
              >
                <TwitterIcon className="w-8 h-8 hover:scale-125 transition-all" />
              </a>
            </li>
            <li class="share__item">
              <a
                data-share=""
                rel="noopener"
                target="_blank"
                href="https://www.reddit.com/submit?url=https%3A%2F%2Fwww.unshorten.site%2F&amp;title=URLs%20unshortener"
                title="Please share this page via Reddit"
              >
                <RedditIcon className="text-red-500 w-10 h-10 hover:scale-125 transition-all pb-1" />
              </a>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
