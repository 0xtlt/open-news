type AuthorType = {
  id: number;
  name: string;
  description: string;
  gravatar: string;
  password: string;
  token: string;
  update: () => Promise<void>;
  updated_at: string;
  created_at: string;
};

export default AuthorType;
