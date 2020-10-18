const API_VERSION: string = "2020-10";
const VERSION: string = "ALPHA.0.1";
const CACHE_TIME: number = 10 * 1000;
let open_config = {
  initied: false,
  theme: "default",
};

import {
  Database,
  dirname,
  join,
  json,
  Marked,
  opine,
  renderFileToString,
  serveStatic,
  urlencoded,
} from "./deps.ts";
import { exists } from "./src/utils.ts";

// Init

console.log("Open News System");
console.log("API VERSION :", API_VERSION);
console.log("System VERSION :", VERSION);

if (await exists("./config.json")) {
  console.log("Open News config...");
} else {
  console.log("Open News no configured");
}

console.log("THEME :", open_config.theme);

const decoder = new TextDecoder("utf-8");
const __dirname = dirname(import.meta.url);
const app = opine();

import { Article, Author, Source } from "./src/database/config.ts";
import cache from "./src/middlewares/cache.ts";
import { localeType } from "./src/types/locale.ts";
import ArticleType from "./src/types/article.ts";
import AuthorType from "./src/types/author.ts";

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

app.use((req, res, next) => {
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

  const db_test = new Database("mysql", {
    database: req.parsedBody["database[name]"],
    host: req.parsedBody["database[host]"],
    username: req.parsedBody["database[user]"],
    password: req.parsedBody["database[password]"],
    port: Number(req.parsedBody["database[port]"]), // optional
  });

  if (!await db_test.ping()) {
    await db_test.close();
    return res.json({
      success: false,
      message: "errorDB",
    });
  }

  await db_test.close();

  res.json(req.parsedBody);
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
  const ArticleContent: ArticleType | null = await Article.where(
    "handle",
    req.params.handle,
  ).first();

  if (!ArticleContent || ArticleContent.isDraft) {
    return next();
  }

  const AuthorContent: AuthorType | null = await Article.where(
    "id",
    ArticleContent.id.toString(),
  ).author();

  if (!AuthorContent) {
    return next();
  }

  res.json({
    article: {
      id: ArticleContent.id,
      title: ArticleContent.title,
      description: ArticleContent.description,
      content: Marked.parse(ArticleContent.content).content,
      handle: req.params.handle,
    },
    author: {
      id: AuthorContent.id,
      name: AuthorContent.name,
      description: AuthorContent.description,
      gravatar: AuthorContent.gravatar,
    },
  });
});

app.get("/read/:handle", cache(CACHE_TIME), async function (req, res, next) {
  const ArticleContent: ArticleType | null = await Article.where(
    "handle",
    req.params.handle,
  )
    .first();

  if (!ArticleContent || ArticleContent.isDraft) {
    return next();
  }

  const AuthorContent: AuthorType | null = await Article.where(
    "id",
    ArticleContent.id.toString(),
  ).author();

  if (!AuthorContent) {
    return next();
  }

  res.render("article.ejs", {
    article: {
      id: ArticleContent.id,
      title: ArticleContent.title,
      description: ArticleContent.description,
      content: Marked.parse(ArticleContent.content).content,
      handle: req.params.handle,
    },
    author: {
      id: AuthorContent.id,
      name: AuthorContent.name,
      description: AuthorContent.description,
      gravatar: AuthorContent.gravatar,
    },
  });
});

app.use("/medias", serveStatic(join(__dirname, "medias")));

app.listen(3030);
