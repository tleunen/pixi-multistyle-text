// Taken from https://github.com/argos-ci/argos/blob/master/examples/with-happo/test/normalize.js

const path = require("path");
const fs = require("fs-extra");
const initializeConfig = require("happo/lib/initializeConfig");
const { config, getLastResultSummary, pathToSnapshot } = require("happo-core");

config.set(initializeConfig());
const resultSummaryJSON = getLastResultSummary();

Promise.all(
  resultSummaryJSON.newImages.map(newImage => {
    console.log(newImage);
    const input = pathToSnapshot(
      Object.assign(
        {
          fileName: "current.png",
        },
        newImage
      )
    );
    const output = path.join(
      config.get().snapshotsFolder,
      `${newImage.description}.png`
    );

    return new Promise((accept, reject) => {
      fs.move(input, output, err => {
        if (err) {
          reject(err);
          return;
        }
        fs.remove(
          input.replace(`/@${newImage.viewportName}/current.png`, ""),
          err2 => {
            if (err2) {
              reject(err2);
              return;
            }
            accept();
          }
        );
      });
    });
  })
);
