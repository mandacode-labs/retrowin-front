export const createSerialKey = (fileKey: string, windowKey: string) =>
  `${fileKey}:${windowKey}`;
export const parseSerialKey = (serialKey: string) => {
  const [fileKey, windowKey] = serialKey.split(":");
  return { fileKey, windowKey };
};
