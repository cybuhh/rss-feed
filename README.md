# rss-feed

[![Build Status](https://travis-ci.org/cybuhh/rss-feed.svg?branch=master)](https://travis-ci.org/cybuhh/rss-feed)

RSS transformed feeds

## slimerjs

### check xvfb
```
heroku run bash
xvfb-run --server-args="-screen 0 640x480x16 -ac" xlogo& 
DISPLAY=:99 xwd -root >dump.xwd
convert dump.xwd dump.png
scp dump.png login@someserver:dump.png
```

### check slimerjs
```
heroku run bash
xvfb-run --server-args="-screen 0 1024x768x24" slimerjs ./cap3d.js http://jsrun.it/kjunichi/bnJXg
scp public/webglcap.png jibunno@mac.local:cap.png
```
