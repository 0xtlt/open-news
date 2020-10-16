import { Database, DataTypes, Model, Relationships } from "../../deps.ts";

const db = new Database({ dialect: "mysql", debug: false }, {
  database: "opennews",
  host: "localhost",
  username: "opennews",
  password: "",
  port: 8889,
});

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
    description: DataTypes.STRING,
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

db.link([Source, Author, Article, Media, Report, Analytic]);

//await db.sync({ drop: false });
//await db.close();

export { Analytic, Article, Author, Media, Report, Source };
