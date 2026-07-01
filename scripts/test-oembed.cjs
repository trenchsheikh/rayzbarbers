(async () => {
  const url =
    "https://www.instagram.com/rayzbarbers/reel/C_tjmvfo-Wr/";
  const oembed = new URL("https://api.instagram.com/oembed");
  oembed.searchParams.set("url", url);
  oembed.searchParams.set("omitscript", "true");
  oembed.searchParams.set("maxwidth", "326");
  const res = await fetch(oembed.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
  });
  console.log(res.status, res.headers.get("content-type"));
  console.log((await res.text()).slice(0, 800));
})();
