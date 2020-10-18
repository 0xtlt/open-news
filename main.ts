const API_VERSION: string = "2020-10";
const VERSION: string = "ALPHA.0.1";
const CACHE_TIME: number = 10 * 1000;
let open_config = {
  initied: false,
  theme: "default",
};

import {
  dirname,
  ensureDir,
  join,
  json,
  Marked,
  opine,
  renderFileToString,
  serveStatic,
  urlencoded,
} from "./deps.ts";
import { exists } from "./src/utils.ts";
import openDB from "./src/database/config.ts";
import cache from "./src/middlewares/cache.ts";
import { localeType } from "./src/types/locale.ts";
import configFile from "./src/types/configFile.ts";

// Init

console.log("Open News System");
console.log("API VERSION :", API_VERSION);
console.log("System VERSION :", VERSION);

if (await exists("./config.json")) {
  console.log("Open News config...");
  const decoder = new TextDecoder("utf-8");
  const config: configFile = JSON.parse(decoder.decode(
    await Deno.readFile("./config.json"),
  ));
  const isConnected = await openDB.setCredentials(config.database);

  if (isConnected) open_config.initied = true;

  if (!isConnected) console.log("Open News database not found");
} else {
  console.log("Open News not configured");
}

console.log("THEME :", open_config.theme);

const __dirname = dirname(import.meta.url);
const app = opine();

// Locales

const LOCALES: localeType = {
  "en": JSON.parse(await Deno.readTextFile("./locales/en.json")),
};

// View engine setup
app.set("views", join(__dirname, "themes", open_config.theme));
app.set("view engine", "ejs");
app.engine("ejs", renderFileToString);

// Handle different incoming body types
app.use(json());
app.use(urlencoded());
app.use(
  "/assets",
  serveStatic(join(__dirname, "themes", open_config.theme, "assets")),
);

app.use(function (req, res, next) {
  if (res.headers) {
    res.headers.set("x-powered-by", "Open News");
  }

  next();
});

app.use((req, _, next) => {
  // determine locale
  const locale = req.get("Accept-Language")?.split(",")[0]?.split("-")[0];

  if (!locale || !LOCALES[locale]) {
    req.app.locals.locale = LOCALES["en"];
    return next();
  }

  req.app.locals.locale = LOCALES[locale];
  next();
});

app.post("/json/install", async function (req, res, next) {
  if (open_config.initied) {
    return next();
  }

  if (
    !req.parsedBody || !req.parsedBody["user[name]"] ||
    !req.parsedBody["user[email]"] || !req.parsedBody["user[password]"] ||
    !req.parsedBody["website[name]"] ||
    !req.parsedBody["website[url]"] ||
    !req.parsedBody["website[description]"] ||
    !req.parsedBody["database[name]"] ||
    !req.parsedBody["database[user]"] ||
    !req.parsedBody["database[host]"] ||
    !req.parsedBody["database[port]"] ||
    !req.parsedBody["database[password]"] ||
    isNaN(req.parsedBody["database[port]"]) ||
    Number(req.parsedBody["database[port]"]) < 1
  ) {
    return res.json({
      success: false,
      message: "*",
    });
  }

  const result = await openDB.setCredentials({
    database: req.parsedBody["database[name]"],
    host: req.parsedBody["database[host]"],
    username: req.parsedBody["database[user]"],
    password: req.parsedBody["database[password]"],
    port: Number(req.parsedBody["database[port]"]),
  });

  if (!result) {
    return res.json({
      success: false,
      message: "errorDB",
    });
  }

  await openDB.install();

  await openDB.createAuthor({
    name: req.parsedBody["user[name]"],
    description: req.parsedBody["website[description]"],
    email: req.parsedBody["user[email]"],
    password: req.parsedBody["database[password]"],
  });

  await openDB.createSource({
    name: req.parsedBody["website[name]"],
    url: req.parsedBody["website[url]"],
    isEnabled: true,
  });

  const config: configFile = {
    database: {
      database: req.parsedBody["database[name]"],
      host: req.parsedBody["database[host]"],
      username: req.parsedBody["database[user]"],
      password: req.parsedBody["database[password]"],
      port: Number(req.parsedBody["database[port]"]),
    },
  };

  await ensureDir(__dirname).then(async () => {
    await Deno.writeFile(
      "config.json",
      new TextEncoder().encode(JSON.stringify(config)),
    );
  });

  open_config.initied = true;

  res.json({
    success: true,
    message: "",
  });
});

app.post("/install", function (req, res, next) {
  if (open_config.initied) {
    return next();
  }
});

app.use((req, res, next) => {
  if (!open_config.initied) {
    return res.render("install.ejs", {
      locale: req.app.locals.locale,
    });
  }

  next();
});

app.get("/", function (req, res) {
  res.send("ok");
});

app.get("/json/:handle", cache(CACHE_TIME), async function (req, res, next) {
  const Article = await openDB.getArticle({
    handle: req.params.handle,
  });

  if (!Article) {
    return next();
  }

  res.json(Article);
});

app.get("/read/:handle", cache(CACHE_TIME), async function (req, res, next) {
  const Article = await openDB.getArticle({
    handle: req.params.handle,
  });

  if (!Article) {
    return next();
  }

  Article.article.content = Marked.parse(Article.article.content).content;
  Article.author.description = Marked.parse(Article.author.description).content;

  res.render("article.ejs", {
    article: Article.article,
    author: Article.author,
    locale: req.app.locals.locale,
  });
});

app.use("/medias", serveStatic(join(__dirname, "medias")));

app.listen(3030);
