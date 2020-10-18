import {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
  Router,
} from "../../deps.ts";
import openDB from "../database/config.ts";
import accountMiddleware from "../middlewares/account.ts";
import AuthorType from "../types/author.ts";
import { token } from "../utils.ts";

const adminRouter = Router();

adminRouter.use(accountMiddleware);

adminRouter.get("/login", function (
  req: Request<ParamsDictionary, any, any>,
  res: Response<any>,
) {
  res.render("admin.login.ejs", {
    locale: req.app.locals.locale,
    code: req.app.locals.code,
    error: false,
  });
});

adminRouter.post("/json/login", async function (
  req: Request<ParamsDictionary, any, any>,
  res: Response<any>,
) {
  if (
    !req.parsedBody || !req.parsedBody["user[name]"] ||
    !req.parsedBody["user[password]"]
  ) {
    return res.json({
      success: false,
      message: "error form",
    });
  }

  const author: AuthorType | undefined = await openDB.getAuthor(
    { name: req.parsedBody["user[name]"] },
  );

  if (!author) {
    return res.json({
      success: false,
      message: "404",
    });
  }

  const newToken = token(30);

  author.token = newToken;
  await author.update();

  return res.json({
    success: true,
    message: newToken,
  });
});

// Need user
adminRouter.use(
  function (
    req: Request<ParamsDictionary, any, any>,
    res: Response<any>,
    next: NextFunction,
  ) {
    if (req.app.locals.user === undefined) {
      return res.redirect("/admin/login");
    }

    next();
  },
);

adminRouter.get(
  "/",
  function (
    req: Request<ParamsDictionary, any, any>,
    res: Response<any>,
  ) {
    res.send("admin");
  },
);

export default adminRouter;
