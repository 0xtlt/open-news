function Cookies() {
  return (req: any, res: any, next: any) => {
    req.app.locals.cookies = {};
    const cookies = req.headers.get("cookie");

    const regex = /[,; ]?( )(([a-zA-Z0-9-_ ])+)=([^\\s,;]*)/gm;

    let m: RegExpExecArray | null;

    while ((m = regex.exec(cookies)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      req.app.locals.cookies[m[2]] = m[4];
    }

    next();
  };
}

export default Cookies;
