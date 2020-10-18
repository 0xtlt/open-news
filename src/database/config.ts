import {
  Database,
  DataTypes,
  gensalt,
  Hash,
  hashpw,
  Model,
  Relationships,
} from "../../deps.ts";
import ArticleType from "../types/article.ts";
import AuthorType from "../types/author.ts";
import WebsiteType from "../types/website.ts";
import resultArticle from "../types/resultArticle.ts";
import SourceType from "../types/source.ts";
import Values from "../types/values.ts";
import { token } from "../utils.ts";

class Source extends Model {
  static table = "source";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    isEnabled: DataTypes.BOOLEAN,
  };

  static articles() {
    return this.hasMany(Article);
  }
}

class Author extends Model {
  static table = "authors";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    gravatar: DataTypes.STRING, //md5 of email
    password: DataTypes.STRING, //bcrypt
    token: DataTypes.STRING,
  };

  static articles() {
    return this.hasMany(Article);
  }
}

class Article extends Model {
  static table = "articles";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    isDraft: DataTypes.BOOLEAN,
    content: DataTypes.STRING,
    handle: DataTypes.STRING,
    authorId: Relationships.belongsTo(Author),
    source: Relationships.belongsTo(Source),
  };

  static author() {
    return this.hasOne(Author);
  }

  static source() {
    return this.hasOne(Source);
  }

  static reports() {
    return this.hasMany(Report);
  }
}

class Media extends Model {
  static table = "medias";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
    name: DataTypes.STRING,
    alt: DataTypes.STRING,
  };
}

class Report extends Model {
  static table = "reports";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
    isSource: DataTypes.STRING,
    articleId: Relationships.belongsTo(Article),
  };

  static article() {
    return this.hasOne(Article);
  }
}

class Analytic extends Model {
  static table = "analytics";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
    uuid: DataTypes.UUID,
    from: DataTypes.STRING, // Can be "website" or the website where the article is seen
    session: DataTypes.UUID, // token of the session
    handle: DataTypes.STRING,
  };
}

class Website extends Model {
  static table = "websites";
  static timestamps = true;

  static fields = {
    id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    url: DataTypes.STRING,
  };
}

//db.link([Source, Author, Article, Media, Report, Analytic, Website]);

//await db.sync({ drop: false });
//await db.close();

class OpenDB {
  #db: null | Database = null;
  constructor() {
  }

  async setCredentials(
    credentials: {
      database: string;
      host: string;
      username: string;
      password: string;
      port: number;
    },
  ): Promise<boolean> {
    const testConnection = new Database(
      { dialect: "mysql", debug: false },
      credentials,
    );

    if (!await testConnection.ping()) {
      return false;
    }

    this.#db = testConnection;
    this.#db.link([Source, Author, Article, Media, Report, Analytic, Website]);

    return true;
  }

  async install(): Promise<boolean> {
    await this.#db?.sync();

    return true;
  }

  // Article

  async getArticle(where: Values): Promise<resultArticle | undefined> {
    const ArticleContent: ArticleType | null = await Article.where(where)
      .first();

    if (!ArticleContent) return undefined;

    const AuthorContent: AuthorType | null = await Article.where(
      "id",
      ArticleContent.id.toString(),
    ).author();

    if (!AuthorContent) return undefined;

    return {
      article: {
        id: ArticleContent.id,
        title: ArticleContent.title,
        description: ArticleContent.description,
        content: ArticleContent.content,
        handle: ArticleContent.handle,
      },
      author: {
        id: AuthorContent.id,
        name: AuthorContent.name,
        description: AuthorContent.description,
        gravatar: AuthorContent.gravatar,
      },
    };
  }

  // Author
  async getAuthor(where: Values): Promise<AuthorType | undefined> {
    const AuthorContent: AuthorType | null = await Author.where(where).first();

    if (!AuthorContent) return undefined;

    return AuthorContent;
  }

  async createAuthor(
    data: {
      name: string;
      description: string;
      email: string;
      password: string;
    },
  ): Promise<AuthorType> {
    const { name, description, email, password } = data;

    const pass = await hashpw(password, await gensalt(10));

    const author: AuthorType = await Author.create({
      name,
      description,
      gravatar: new Hash("md5").digestString(email).hex(),
      token: token(30),
      password: pass,
    });

    return author;
  }

  // Source
  async createSource(
    data: { name: string; url: string; isEnabled: boolean },
  ): Promise<SourceType> {
    const source: SourceType = await Source.create(data);

    return source;
  }

  // Website
  async createWebsite(data: {
    name: string;
    description: string;
    url: string;
  }): Promise<WebsiteType> {
    const website: WebsiteType = await Website.create(data);

    return website;
  }
}

const openDB = new OpenDB();

export default openDB;
