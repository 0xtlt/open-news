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

  req.app.locals.user = token
    ? await openDB.getAuthor({ token: token })
    : undefined;

  next();
}

export default accountMiddleware;
