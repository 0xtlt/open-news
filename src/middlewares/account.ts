import {
  NextFunction,
  ParamsDictionary,
  Request,
  Response,
} from "../../deps.ts";
import openDB from "../database/config.ts";
async function accountMiddleware(
  req: Request<ParamsDictionary, any, any>,
  _: Response<any>,
  next: NextFunction,
) {
  const token = req.app.locals?.cookies?.opentoken;

  if (!token) {
    req.app.locals.user = undefined;
  }

  req.app.locals.user = await openDB.getAuthor({ token: token });

  next();
}

export default accountMiddleware;
