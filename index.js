const express = require("express");
const app = express();
const http = require("http");
const https = require("https");
const htmlParser = require("node-html-parser");
const acorn = require("acorn");
const walk = require("acorn-walk");
const escodegen = require("escodegen");

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
          let root = htmlParser.parse(body);
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
      } else if (serverResponse.headers["content-type"].toString().includes("text/javascript")) {
        try {
          let ast = acorn.parse(body, {
            ecmaVersion: "latest"
          });
          walk.simple(ast, {
            Literal: (node) => {
              if ((typeof node !== "string")) return;
              try {
                new URL(node.value);
                node.value = new URL("/" + ((!node.value.startsWith("http://") && !node.value.startsWith("https://")) ? (new URL(req.originalUrl.substring(1)).protocol + "//" + new URL(req.originalUrl.substring(1)).hostname + ((new URL(req.originalUrl.substring(1)).port) ? new URL(req.originalUrl.substring(1)).port : "") + ((!node.value.startsWith("/")) ? new URL(req.originalUrl.substring(1)).pathname : "/")) : ((node.value.startsWith("//")) ? new URL(req.originalUrl.substring(1)).protocol : "")) + node.value, req.protocol + "://" + req.get("host")).href;
              } catch {};
            },
            AssignmentExpression: (node) => {
              if ((node.left.type !== "MemberExpression") || (node.left.property.name !== "href"))
              node.right = {
                type: "Literal",
                value: new URL("/" + ((!node.right.value.startsWith("http://") && !node.right.value.startsWith("https://")) ? (new URL(req.originalUrl.substring(1)).protocol + "//" + new URL(req.originalUrl.substring(1)).hostname + ((new URL(req.originalUrl.substring(1)).port) ? new URL(req.originalUrl.substring(1)).port : "") + ((!node.right.value.startsWith("/")) ? new URL(req.originalUrl.substring(1)).pathname : "/")) : ((node.right.value.startsWith("//")) ? new URL(req.originalUrl.substring(1)).protocol : "")) + node.right.value, req.protocol + "://" + req.get("host")).href
              };
            },
            CallExpression: (node) => {
              if ((node.callee.name !== "fetch") || !node.arguments[0] || (node.arguments[0].type !== "Literal")) return;
              node.arguments[0] = {
                type: "Literal",
                value: new URL("/" + ((!node.arguments[0].value.startsWith("http://") && !node.arguments[0].value.startsWith("https://")) ? (new URL(req.originalUrl.substring(1)).protocol + "//" + new URL(req.originalUrl.substring(1)).hostname + ((new URL(req.originalUrl.substring(1)).port) ? new URL(req.originalUrl.substring(1)).port : "") + ((!node.arguments[0].value.startsWith("/")) ? new URL(req.originalUrl.substring(1)).pathname : "/")) : ((node.arguments[0].value.startsWith("//")) ? new URL(req.originalUrl.substring(1)).protocol : "")) + node.arguments[0].value, req.protocol + "://" + req.get("host")).href
              };
            }
          });
          res.contentType("text/javascript");
          res.end(escodegen.generate(ast));
        } catch {};
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