const express = require("express");
const app = express();
const http = require("http");
const https = require("https");
const { parse } = require("node-html-parser");

app.all("/*", (req, res) => {
  try {
    let serverRequest = ((new URL(req.originalUrl.substring(1)).protocol === "https:") ? https : http).request({
      hostname: new URL(req.originalUrl.substring(1)).hostname,
      port: new URL(req.originalUrl.substring(1)).port || 443,
      path: new URL(req.originalUrl.substring(1)).pathname,
      method: req.method,
      headers: {
        'User-Agent': req.headers["user-agent"]
      }
    }, (serverResponse) => {
      let body = "";
      if (serverResponse.headers["content-type"].toString().includes("text/html")) {
        serverResponse.on("data", (chunk) => (body += chunk));
        serverResponse.on("end", () => {
          let root = parse(body);
          root.querySelectorAll('*').forEach((element) => {
            [
              "href",
              "src",
              "action",
              "content"
            ].forEach((attribute) => {
              if (!element.hasAttribute(attribute) || !element.getAttribute(attribute)) return;
              try {
                element.setAttribute(attribute, new URL("/" + ((!element.getAttribute(attribute).startsWith("http://") && !element.getAttribute(attribute).startsWith("https://")) ? (new URL(req.originalUrl.substring(1)).protocol + "//" + new URL(req.originalUrl.substring(1)).hostname + ((new URL(req.originalUrl.substring(1)).port) ? new URL(req.originalUrl.substring(1)).port : "") + ((!element.getAttribute(attribute).startsWith("/")) ? new URL(req.originalUrl.substring(1)).pathname : "/")) : ((element.getAttribute(attribute).startsWith("//")) ? new URL(req.originalUrl.substring(1)).protocol : "")) + element.getAttribute(attribute), req.protocol + "://" + req.get("host")).href);
              } catch {};
            });
          });
          res.writeHead(serverResponse.statusCode, serverResponse.headers);
          res.end(root.toString());
        });
      } else {
        serverResponse.pipe(res, {
          end: true
        });
        res.contentType(serverResponse.headers["content-type"]);
      }
    });
    serverRequest.end();
  } catch {};
});

const listen = app.listen(3000, () => {
  console.log("Server is now ready on port", listen.address().port);
});