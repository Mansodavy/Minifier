const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { minify: minifyHtml } = require("html-minifier");
const CleanCSS = require("clean-css");
const UglifyJS = require("uglify-js");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.post("/upload", upload.single("file"), (req, res) => {
  const { originalname, path: tempPath } = req.file;
  const ext = path.extname(originalname).toLowerCase();

  if ([".html", ".css", ".js"].includes(ext)) {
    const outputPath = `mini/${originalname}`;

    fs.promises.readFile(tempPath, "utf8").then((data) => {
      let minifiedContent;

      if (ext === ".html") {
        minifiedContent = minifyHtml(data, {
          removeComments: true,
          collapseWhitespace: true,
        });
      } else if (ext === ".css") {
        const cleanCSS = new CleanCSS();
        minifiedContent = cleanCSS.minify(data).styles;
      } else if (ext === ".js") {
        const uglified = UglifyJS.minify(data, { output: { comments: false } });
        if (uglified.error) {
          res.status(500).send("Erreur lors de la minification du fichier JavaScript.");
          return;
        }
        minifiedContent = uglified.code;
      }

      fs.promises.writeFile(outputPath, minifiedContent, "utf8").then(() => {
        res.download(outputPath);
      });
    });
  } else {
    res.status(400).send("Seuls les fichiers HTML, CSS et JavaScript sont acceptés.");
  }

  fs.promises.unlink(tempPath);
});

app.listen(3000, () => {
    if (!fs.existsSync("uploads")) {
        fs.mkdirSync("uploads");
      }
      
      if (!fs.existsSync("processed")) {
        fs.mkdirSync("mini");
      }
  console.log("Serveur lancé sur le port 3000");
});
