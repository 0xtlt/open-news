const exists = async (filename: string): Promise<boolean> => {
  try {
    await Deno.stat(filename);
    // successful, file or directory must exist
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // file or directory does not exist
      return false;
    } else {
      // unexpected error, maybe permissions, pass it along
      throw error;
    }
  }
};

const token = (length: number): string => {
  const alphabet =
    "azertyuiopqsdfghjklmwxcvbnAZERTYUIOPQSDFGHJKLMWXCVBN1234567890";
  let result = "";

  for (let i: number = 0; i < length; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return result;
};

export { exists, token };
