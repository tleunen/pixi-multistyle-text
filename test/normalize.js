const path = require("path");
const fs = require("fs-extra");

const snapshotsFolder = "happo-snapshots";

fs.readFile(path.join(snapshotsFolder, "resultSummary.json"))
	.then((buffer) => JSON.parse(buffer.toString()))
	.then((results) =>
		Promise.all(
			results.newImages.map((newImage) => {
				const input = path.join(
					snapshotsFolder,
					new Buffer(newImage.description).toString("base64"),
					"@test/current.png"
				);

				const output = path.join(
					snapshotsFolder,
					`${newImage.description}.png`
				);

				return fs.move(input, output)
					.then(() => fs.remove(path.join(input, "../..")));
			})
		)
	)
	.then(() => fs.remove(path.join(snapshotsFolder, "resultSummary.json")));