function runtime(input, gas, txInfo) {
  const instructions = input
    .trim()
    .replace(/\t/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const memory = {},
    result = {};
  const userArgs =
    typeof txInfo.additionalData.txCallArgs !== "undefined"
      ? txInfo.additionalData.txCallArgs.map((arg) => "0x" + arg.toString(16))
      : [];

  let ptr = 0;
  while (
    ptr < instructions.length &&
    gas >= 0 &&
    instructions[ptr].trim() !== "stop" &&
    instructions[ptr].trim() !== "revert"
  ) {
    const line = instructions[ptr].trim();
    const command = line.split(" ").filter((token) => token !== "")[0];
    const args = line
      .slice(command.length + 1)
      .replace(/\s/g, "")
      .split(",")
      .filter((token) => token !== "");
    switch (command) {
      case "set":
        setMem(args[0], getValue(args[1]));
        break;
    }
  }

  function getValue(token) {
    if (token.startsWith("$")) {
      token = token.replace("$", "");
      if (typeof memory[token] === "undefined") {
        memory[token] = "0x0";
      }
      return memory[token];
    } else if (token.startsWith("%")) {
      token = token.replace("%", "");
      if (typeof userArgs[token] === "undefined") {
        return "0x0";
      } else {
        return bigIntable(userArgs[parseInt(token)])
          ? "0x" + BigInt(userArgs[parseInt(token)]).toString(16)
          : "0x0";
      }
    } else {
      return token;
    }
  }

  function setMem({ key, value }) {
    memory[key] = bigIntable(value) ? "0x" + BigInt(value).toString(16) : value;
  }

  return result;
}

function bigIntable(value) {
  try {
    BigInt(value);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { runtime };
