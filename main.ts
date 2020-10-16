const API_VERSION: string = "2020-10";
const CACHE_TIME: number = 10 * 1000;
const THEME = "default";
import {
  dirname,
  join,
  json,
  Marked,
  opine,
  renderFileToString,
  serveStatic,
  urlencoded,
} from "./deps.ts";

const decoder = new TextDecoder("utf-8");
const __dirname = dirname(import.meta.url);
const app = opine();

import { Article, Author, Source } from "./src/database/config.ts";
import cache from "./src/middlewares/cache.ts";

// View engine setup
app.set("views", join(__dirname, "themes", THEME));
app.set("view engine", "ejs");
app.engine("ejs", renderFileToString);

// Handle different incoming body types
app.use(json());
app.use(urlencoded());
app.use(function (req, res, next) {
  if (res.headers) {
    res.headers.set("x-powered-by", "Open News");
  }

  next();
});

app.get("/", function (req, res) {
  res.send("ok");
});

app.get("/json/:handle", cache(CACHE_TIME), async function (req, res, next) {
  const ArticleContent = await Article.where("handle", req.params.handle)
    .first();

  if (!ArticleContent) {
    return next();
  }

  const AuthorContent = await Article.where("id", ArticleContent.id.toString())
    .author();

  res.json({
    article: {
      id: ArticleContent.id,
      title: ArticleContent.title,
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
  const ArticleContent = await Article.where("handle", req.params.handle)
    .first();

  if (!ArticleContent) {
    return next();
  }

  const AuthorContent = await Article.where("id", ArticleContent.id.toString())
    .author();

  res.render("article.ejs", {
    article: {
      id: ArticleContent.id,
      title: ArticleContent.title,
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
