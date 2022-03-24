/* eslint-disable node/no-callback-literal */
const { Context, App } = require("koishi");
const mockInjectAPI = (_input, input) => {
  _input.capture = function (eventName, cb) {
    console.log(
      "context of",
      input,
      "installed listener for unhandled event:",
      eventName
    );
    cb("_test");
  };
  _input.prevent = (eventName, cb) => {
    console.log("prevent event:", eventName);
    cb("_test");
  };
  _input.emit = (eventName, cb) => {
    if (eventName === "_test") {
      console.log("--", input, "will receive captured events");
    }
  };
};
module.exports = (conf) => {
  console.log("-------- runtime");
  const app = new App();
  mockInjectAPI(app, "app");
  const contexts = new Map();

  const sourceFilter = (input) => {
    if (!input.includes(":")) {
      return {
        type: "unhandledChainEvent",
        source: input,
      };
    } else {
      let [scope, platform, id] = input.split(":");
      let not = false;
      if (scope.startsWith("^")) {
        scope = scope.substring(1);
        not = true;
      }
      return {
        scope,
        platform,
        id,
        not,
        type: "excatMatch",
      };
    }
  };

  const { chains, routes } = conf;
  // init contexts && install plugins
  chains.forEach((chain) => {
    if (chain.name === "default") {
      // default chain会被安装到app上，用来提供服务，默认禁用（不处理adapter来源的事件），但可以声明启用
      contexts.set("default", app);
      if (!chain.properties.default) {
        throw new Error(
          "config error: \nchain configuration error: \ndefault chain's property should includes 'default', got '" +
            chain.properties +
            "'"
        );
      }
    } else {
      const context = new Context(); // 这个Context上需要没有任何事件，但可以访问到app上安装的服务
      mockInjectAPI(context, chain.name);
      contexts.set(chain.name, context);
    }
    // install plugins
    chain.plugins.forEach(({ plugin, config }) => {
      console.log("install plugin for chain", chain.name, ":", plugin, config);
      // app.plugin(plugin, config);
    });
  });
  /**
  routes的形状: Map(4) {
    '*' => [ 'default' ],
    'onebot:"123456"' => [ 'public' ],
    'q:1223' => [ 'drop' ],
    '^onebot:4444' => [ 'public' ]
  }
  假设按照nginx的逻辑 先精确匹配，再regex匹配，最后匹配星号
   */
  // 假设有capture api拦截来自adapter的任何事件
  app.prevent("adapter/*", () => {});
  const connect = (input, next) => {
    const copy = [...next];
    let _input = input;
    let output = copy.shift();
    if (!output || output === "drop") {
      console.log("events from", input, "will be ignored");
      return;
    }
    const matcher = sourceFilter(input);
    // source *** >> b >> c
    // 假如某一条chain没有处理事件，并且有声明next chain（比如上面是b -> c)
    if (matcher.type === "unhandledChainEvent") {
      if (!chains.has(input)) return;
      _input = contexts.get(input);
    }
    if (matcher.type === "excatMatch") {
      // scope:platform:id 比如user:onebot:123，有考虑写成scope:id@platform
      const { platform, scope, id, not } = matcher;
      _input = app.platform(platform)[scope](id);
      mockInjectAPI(_input, input);
      // exclude
      if (not) {
        const _output = contexts.get(output);
        _output.intersect(_input).prevent();
      }
    } else {
      return;
    }
    // 假设的api
    _input.capture("*", (eventName, ...data) => {
      const _output = contexts.get(output);
      _output.emit(eventName, ...data);
    });
  };
  routes.forEach((route, input) => {
    // 最后再手动添加
    if (input === "*") {
      return;
    }
    connect(input, route);
  });
  return {
    app,
    contexts,
  };
};
