(async () => {
  const url = "https://www.instagram.com/rayzbarbers/reel/C_tjmvfo-Wr/";
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  const html = await res.text();
  const ogImage = html.match(
    /property="og:image" content="([^"]+)"/,
  )?.[1];
  const ogVideo = html.match(
    /property="og:video" content="([^"]+)"/,
  )?.[1];
  console.log("status", res.status, "len", html.length);
  console.log("og:image", ogImage?.slice(0, 100));
  console.log("og:video", ogVideo?.slice(0, 100));
})();
