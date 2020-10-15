const API_VERSION: string = "2020-10";

import { Article, Author } from "./src/database/config.ts";

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
  content: "#Hello world !",
  authorId: author[0].id,
});
