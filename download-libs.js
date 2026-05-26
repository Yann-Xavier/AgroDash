import https from "https";
import fs from "fs";
import path from "path";

const LIBS = [
  {
    url: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
    dest: "libs/xlsx.full.min.js"
  },
  {
    url: "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
    dest: "libs/chart.umd.min.js"
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        console.log(`Success: Downloaded ${url} -> ${dest}`);
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log("Downloading offline local dependencies (SheetJS & Chart.JS)...");
  for (const lib of LIBS) {
    if (fs.existsSync(lib.dest)) {
      console.log(`File already exists: ${lib.dest}`);
      continue;
    }
    try {
      await downloadFile(lib.url, lib.dest);
    } catch (err) {
      console.error(`Error downloading ${lib.url}:`, err.message);
    }
  }
}

run();
