type TokenLineData = { line: number; char: number };
type TInteger = { type: "integer"; value: number } & TokenLineData;
type TColon = { type: "colon" } & TokenLineData;
type TError = { type: "error" } & TokenLineData;

type Token = TInteger | TColon | TError;
type TokenizeResult = {
  tokens: Token[];
  errors: TError[];
};

export function tokenize(str: string): TokenizeResult {
  let buffer = str;
  let matches: RegExpExecArray | null;
  let tokens: Token[] = [];
  let errors: TError[] = [];
  let line = 0;
  let char = 0;

  while ((matches = /([0-9]|,)+|(\:)/.exec(buffer)) !== null) {
    if (matches.index !== 0) {
      // there's an unexpected token: pass it through as an error...
      const errorToken: TError = {
        type: "error",
        line,
        char,
      };

      tokens.push(errorToken);
      errors.push(errorToken);

      buffer = buffer.slice(matches.index);
      char += matches.index;
    } else {
      // we matched a token...
      const reducedMatch = matches[0].replace(",", ""); // remove commas, if they're there
      const matchedInt = parseInt(reducedMatch);

      if (!isNaN(matchedInt)) {
        tokens.push({
          type: "integer",
          value: matchedInt,
          line,
          char,
        });
      } else if (reducedMatch === ":") {
        tokens.push({
          type: "colon",
          line,
          char,
        });
      }

      buffer = buffer.slice(matches[0].length); // use original match to advance buffer
      char += matches[0].length;
    }
  }

  return {
    tokens,
    errors,
  };
}
