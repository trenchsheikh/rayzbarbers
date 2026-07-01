(async () => {
  const username = "rayzbarbers";
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-IG-App-ID": "936619743392459",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: `https://www.instagram.com/${username}/`,
    },
  });
  console.log("status", res.status);
  if (!res.ok) {
    console.log(await res.text());
    return;
  }
  const json = await res.json();
  const edges =
    json?.data?.user?.edge_owner_to_timeline_media?.edges ??
    json?.data?.user?.edge_felix_video_timeline?.edges ??
    [];
  for (const edge of edges.slice(0, 12)) {
    const n = edge.node;
    const code = n.shortcode;
    const isVideo = n.is_video;
    const thumb = n.thumbnail_src ?? n.display_url;
    const path = n.__typename === "GraphVideo" || isVideo ? "reel" : "p";
    console.log(
      JSON.stringify({
        shortcode: code,
        permalink: `https://www.instagram.com/${path}/${code}/`,
        thumb,
        isVideo,
      }),
    );
  }
})();
