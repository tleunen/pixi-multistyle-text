const express  = require("express");
const app  = express();
const http = require("http").Server(app);

app.get("/:name", (req, res) => {
	let data = require(`./__tests__/__snapshots__/${req.params.name}.js.snap`);
	let key = Object.keys(data)[0];
	let b64 = data[key];
	res.status(200).send(`<img src=${b64} />`);
});

http.listen(9900, () => console.log("Listening on *:9900."));