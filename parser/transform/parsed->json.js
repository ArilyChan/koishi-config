const yaml = require("js-yaml");
module.exports = (parsed) => {
  const chains = { default: null };
  const foreignSources = ["*", "drop"];
  const routes = new Map();

  const validateSource = (source) => {
    // validate sources
    let validate = false;
    if (foreignSources.includes(source)) validate = true;
    else {
      for (const name in chains) {
        if (source === name) validate = true;
      }
    }
    return validate;
  };
  const processPlugins = (plugins) => {
    return plugins.map((p) => {
      const { plugin, config, configType } = p;
      switch (configType) {
        case "yaml": {
          const parsedConfig = yaml.load(config);
          return { plugin, config: parsedConfig };
        }
        case "json":
        default: {
          return { plugin, config };
        }
      }
    });
  };
  const processChain = (block) => {
    delete block.type;
    if (!block.name && !block.properties.default)
      throw new Error("unnamed chain");
    block.name = block.name || "default";
    block.plugins = processPlugins(block.plugins);
    const included = chains[block.name];
    const now = (chains[block.name] = included || block);
    if (now.properties.enabled !== block.properties.enabled)
      throw new Error("conflict chain properties");
    if (included?.plugins) {
      included.plugins.push(block.plugins);
    }
  };

  const processSource = (block) => {
    const flow = [];
    if (block.input.includes(":")) {
      // flow.push(block.input);
    } else {
      const validate = validateSource(block.input);

      if (!validate) {
        console.error("unknown source:", block.input);
      }
      // flow.push(block.input);
    }

    block.pipe.forEach((target) => {
      const validate = validateSource(target);

      if (!validate) {
        console.error("Error: unknown source:", target);
        return;
      }
      flow.push(target);
    });

    if (!routes.has(block.input)) {
      routes.set(block.input, flow);
    }
  };

  routes.set("*", ["default"]);

  parsed.forEach((block) => {
    switch (block.type) {
      case "chain": {
        processChain(block);
        console.error("created / expanded chain: " + block.name);
        break;
      }
      case "connect-source": {
        processSource(block);
      }
    }
  });
  return {
    chains: [...Object.values(chains)],
    routes,
  };
};
