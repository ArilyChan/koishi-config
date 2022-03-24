const util = require("util");
const peggy = require("peggy");

const toJSON = require("./transform/parsed->json");
const mock = require("./mock");
const fs = require("fs").promises;
(async () => {
  const prepare = async () => {
    let rules = [
      fs.readFile("./rules/koishiperf.pegjs"),
      fs.readFile("./rules/json.pegjs"),
    ];
    rules = await Promise.all(rules).then((rules) => rules.join("\n"));

    const parser = peggy.generate(rules);
    return parser;
  };

  const parser = await prepare();

  const config = await (
    await fs.readFile("./config/config.koishiperf")
  ).toString();
  console.log("-------- parser");
  const parsed = parser.parse(config);
  const result = toJSON(parsed);
  if (process.argv[2] === "read-only") {
    return console.log(
      util.inspect(result, false, null, true /* enable colors */)
    );
  }
  mock(result);
})();
