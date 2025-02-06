export const camelCase = (str: string) =>
    str.toLowerCase().replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace("-", "").replace("_", ""));

export const pascalCase = (str: string) => camelCase(str).replace(/^[a-z]/, (char) => char.toUpperCase());
