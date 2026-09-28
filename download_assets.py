# -*- coding: utf-8 -*-
"""下载优胜美地中文版首页所需图片素材"""
import os
import urllib.request

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(BASE, exist_ok=True)

FILES = {
    "banner-halfdome.jpg": "https://aka.doubaocdn.com/s/NcV6btCQp8",
    "banner-valley.jpg": "https://aka.doubaocdn.com/s/Bl5GPbwrb9",
    "banner-falls.jpg": "https://aka.doubaocdn.com/s/446mqupWho",
    "video-poster.jpg": "https://aka.doubaocdn.com/s/Ba5vYDcmSo",
    "area-valley.jpg": "https://aka.doubaocdn.com/s/lilmEhMV2M",
    "area-sequoia.jpg": "https://aka.doubaocdn.com/s/7eg0xDwEYT",
    "feat-falls.jpg": "https://aka.doubaocdn.com/s/GvuL898eAi",
    "feat-camping.jpg": "https://aka.doubaocdn.com/s/AGJcqecYv8",
    "feat-lodge.jpg": "https://aka.doubaocdn.com/s/8Umi51tJYr",
    "feat-wildlife.jpg": "https://aka.doubaocdn.com/s/wB00zO4QpH",
    "sc-elcapitan.jpg": "https://aka.doubaocdn.com/s/hhxCC1KEac",
    "sc-halfdome.jpg": "https://aka.doubaocdn.com/s/keuJx0NRjY",
    "sc-meadow.jpg": "https://aka.doubaocdn.com/s/kbYfg9ZQ55",
    "sc-sequoia.jpg": "https://aka.doubaocdn.com/s/r2Fz9sqVrR",
    "season-spring.jpg": "https://aka.doubaocdn.com/s/rUUAtOUetY",
    "season-summer.jpg": "https://aka.doubaocdn.com/s/SGQfL6uNcY",
    "season-autumn.jpg": "https://aka.doubaocdn.com/s/BnVt7B5z6b",
    "season-winter.jpg": "https://aka.doubaocdn.com/s/QuJuEZ5V6M",
    "news-main.jpg": "https://aka.doubaocdn.com/s/M6bMBhLfv2",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Referer": "https://www.doubao.com/",
}

for name, url in FILES.items():
    dest = os.path.join(BASE, name)
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            data = r.read()
        with open(dest, "wb") as f:
            f.write(data)
        print(f"OK  {name}  {len(data)//1024} KB")
    except Exception as e:
        print(f"FAIL {name}: {e}")

print("DONE")
