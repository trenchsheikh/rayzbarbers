(async () => {
  for (const url of [
    "https://www.instagram.com/rayzbarbers/embed/",
    "https://www.instagram.com/rayzbarbers/reels/embed/",
  ]) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log(url, res.status, (await res.text()).length);
  }
})();
