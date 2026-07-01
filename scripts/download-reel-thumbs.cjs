const fs = require("fs");
const path = require("path");

const reels = [
  {
    id: "C_tjmvfo-Wr",
    url: "https://www.instagram.com/rayzbarbers/reel/C_tjmvfo-Wr/",
    thumb:
      "https://scontent-lhr6-1.cdninstagram.com/v/t51.71878-15/504279877_1276079057215087_2388461815084889347_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=103&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=-qelYjWyLnwQ7kNvwERgPgs&_nc_oc=AdplyM0PtgrGmHdcIbpInW_7FmLokGXYEBNGjdryOLROuRnbHnykS6JRZLL321WeNiU&_nc_zt=23&_nc_ht=scontent-lhr6-1.cdninstagram.com&_nc_gid=0_Amq5K6aK6upaqxyVg50Q&_nc_ss=7aa8c&oh=00_AQBNvR6NHAkUD09UuZBR-Tj6XrPo6KBZYyFT-YXhBeha9g&oe=6A4AE16E",
  },
  {
    id: "C5NNP6MoNfO",
    url: "https://www.instagram.com/rayzbarbers/reel/C5NNP6MoNfO/",
    thumb:
      "https://scontent-lhr8-2.cdninstagram.com/v/t51.71878-15/491415210_659640790556611_3484847337215807182_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=109&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=q8yq5XSUfFAQ7kNvwGmqaVC&_nc_oc=Ado9VYYkZibtfF3SX8JUldoxxEMHzPSyIxYMzSZxVanZxykpDJE7Ho4qzd16ibI7pHk&_nc_zt=23&_nc_ht=scontent-lhr8-2.cdninstagram.com&_nc_gid=0_Amq5K6aK6upaqxyVg50Q&_nc_ss=7aa8c&oh=00_AQDtI-zypJIP4Z0oqOl_kNVUPR4UDV4BkXZkm6We5q_9MQ&oe=6A4AFAFC",
  },
  {
    id: "CxrG7PZI1sn",
    url: "https://www.instagram.com/rayzbarbers/reel/CxrG7PZI1sn/",
    thumb:
      "https://scontent-lhr6-2.cdninstagram.com/v/t51.71878-15/503028704_1682613515955904_6752221373801028950_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=107&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=q0HN1SZU6w0Q7kNvwGJw9iI&_nc_oc=Adoj0KAEjXeW9L9VMDJbHKySZ0YP91miv8sMt3LvQFt7l2yqHidsgCq3HwX1kk8GKz4&_nc_zt=23&_nc_ht=scontent-lhr6-2.cdninstagram.com&_nc_gid=0_Amq5K6aK6upaqxyVg50Q&_nc_ss=7aa8c&oh=00_AQCRWQvTXsiiYYPM1zmMkFT13T1wUNXDE7xyarwQWLuXGA&oe=6A4AF493",
  },
  {
    id: "CruCCSRIR8s",
    url: "https://www.instagram.com/rayzbarbers/reel/CruCCSRIR8s/",
    thumb:
      "https://scontent-lhr6-2.cdninstagram.com/v/t51.71878-15/501574789_1896878971085581_6442676937563395632_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=107&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=2zAzFrvDTcAQ7kNvwEc6bAP&_nc_oc=Ado4m5OT-9LLHDHTzjmIWOS7VNHXazvoDZEXCrHCE09R54r-fg1zqOVssGh9Xh9_iY8&_nc_zt=23&_nc_ht=scontent-lhr6-2.cdninstagram.com&_nc_gid=0_Amq5K6aK6upaqxyVg50Q&_nc_ss=7aa8c&oh=00_AQBUo7dQ0Fx_M4iv7Rm-UBjmFc-N95sFMKoloBb0NQWGVg&oe=6A4AFF7D",
  },
  {
    id: "Crt-ujVIHp7",
    url: "https://www.instagram.com/rayzbarbers/reel/Crt-ujVIHp7/",
    thumb:
      "https://scontent-lhr6-2.cdninstagram.com/v/t51.71878-15/491442647_1341731103753600_3606418656642210450_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=107&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=XHFXI2Bln3kQ7kNvwFVTbZF&_nc_oc=AdqwKIH5EHV4st_CLbxFK2cVNJGXXlgLiXm4LbYFojbVsc3NoDnNfOSUdyxyRAEF26Q&_nc_zt=23&_nc_ht=scontent-lhr6-2.cdninstagram.com&_nc_gid=0_Amq5K6aK6upaqxyVg50Q&_nc_ss=7aa8c&oh=00_AQDsfkdjZG234-dHC5xHumpYg1Kh-o4sEwSXpfFGkF6qvQ&oe=6A4B0B0A",
  },
  {
    id: "CpItCLJINyg",
    url: "https://www.instagram.com/rayzbarbers/reel/CpItCLJINyg/",
    thumb:
      "https://scontent-lhr6-1.cdninstagram.com/v/t51.71878-15/501074265_2742059159320191_9167822506529217403_n.jpg?stp=dst-jpg_e35_s640x640_tt6&_nc_cat=102&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=WQQQHpeU9jkQ7kNvwHx-Kok&_nc_oc=AdrgU8G1nERuQ8X_16bnlM_CpDXYb-oUWCG9d3o_Uie11owr5QXSutyaXvoDjgHNVBQ&_nc_zt=23&_nc_ht=scontent-lhr6-1.cdninstagram.com&_nc_gid=0_Amq5K6aK6upaqxyVg50Q&_nc_ss=7aa8c&oh=00_AQBK4ieRf-v836z4UIdgkmtR_RWsdMZkyE83Pah9vLpnRw&oe=6A4AEE6A",
  },
];

const outDir = path.join(__dirname, "..", "public", "images", "reels");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const reel of reels) {
    const res = await fetch(reel.thumb, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) {
      console.error("failed", reel.id, res.status);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(outDir, `${reel.id}.jpg`), buf);
    console.log("saved", reel.id, buf.length);
  }
})();
