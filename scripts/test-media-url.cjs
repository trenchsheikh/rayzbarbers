(async () => {
  const code = "C_tjmvfo-Wr";
  const urls = [
    `https://www.instagram.com/reel/${code}/media/?size=l`,
    `https://www.instagram.com/p/${code}/media/?size=l`,
    `https://www.instagram.com/reel/${code}/thumbnail/`,
  ];
  for (const u of urls) {
    const r = await fetch(u, {
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    console.log(u, r.status, r.headers.get("location")?.slice(0, 100));
  }
})();
