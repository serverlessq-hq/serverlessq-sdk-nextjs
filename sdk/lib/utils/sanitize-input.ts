export const removeLeadingAndTrailingSlashes = (path: string): string => {
  return path.replace(/^\/+/g, '').replace(/\/+$/, '')
}

export const extractApiRoute = (path: string) => {
  const apiPathStartIndex = path.indexOf('/api');
  if (apiPathStartIndex === -1) {
    throw new Error(`Invalid path, cannot find '/api'`);
  }
  const extensionIndex = path.lastIndexOf('.');
  if (extensionIndex === -1) {
    throw new Error(`Invalid path, cannot find extension`);
  }
  return path.substring(apiPathStartIndex, extensionIndex);
}

export const checkStringForSlashes = (str: string): boolean => {
  return str.includes('/')
}
