const tmp: any = {};

function cache(duration: number) {
  return (req: any, res: any, next: any) => {
    const key: string = `__opennews__` + req.originalUrl || req.url;

    if (
      tmp[key] &&
      (Number(new Date()) - Number(new Date(tmp[key].date)) < duration)
    ) {
      return res.send(tmp[key].content);
    }

    if (tmp[key]) {
      delete tmp[key];
    }

    res.sendResponse = res.send;
    res.send = (body: string) => {
      tmp[key] = {
        date: new Date(),
        content: body,
      };
      res.sendResponse(body);
    };
    next();
  };
}

export default cache;
