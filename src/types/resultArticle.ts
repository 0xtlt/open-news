type resultArticle = undefined | {
  article: {
    id: number;
    title: string;
    description: string;
    content: string;
    handle: string;
  };
  author: {
    id: number;
    name: string;
    description: string;
    gravatar: string;
  };
};

export default resultArticle;
