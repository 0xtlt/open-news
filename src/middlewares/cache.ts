const tmp: any = {};

function cache(duration: number) {
  return (req: any, res: any, next: any) => {
    const key: string = `__opennews__` + req.originalUrl || req.url;

    if (
      tmp[key] &&
      (Number(new Date()) - Number(new Date(tmp[key].date)) < duration)
    ) {
      res.set("Content-type", tmp[key].type);

      return res.send(tmp[key].content);
    }

    if (tmp[key]) {
      delete tmp[key];
    }

    res.sendResponse = res.send;
    res.send = (body: string) => {
      res.sendResponse(body);
      tmp[key] = {
        date: new Date(),
        content: body,
        type: res.get("Content-Type"),
      };
    };
    next();
  };
}

export default cache;
