const API_VERSION: string = "2020-10";
const CACHE_TIME: number = 10 * 1000;
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

import { Article, Author } from "./src/database/config.ts";
import cache from "./src/middlewares/cache.ts";

// Test

const author = await Author.create({
  name: "Thomas Tastet",
  description: "Super",
  gravatar: "test",
  password: "test",
  token: "test",
});

console.log(author);

await Article.create({
  title: "Hello world",
  isDraft: false,
  content: "# Hello world !",
  handle: "hello-world",
  authorId: author[0].id,
});

// View engine setup
app.set("views", join(__dirname, "views"));
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
  const article = await Article.where({
    handle: req.params.handle,
  }).find(1);

  if (!article) {
    return next();
  }

  res.json(article);
});

app.get("/read/:handle", cache(CACHE_TIME), async function (req, res, next) {
  const article = await Article.where({
    handle: req.params.handle,
  }).find(1);

  if (!article) {
    return next();
  }

  res.send(Marked.parse(article.content).content);
});

app.use("/medias", serveStatic(join(__dirname, "medias")));

app.listen(3030);
