---
read_when:
    - 你想要构建一个只添加智能体工具的简单 OpenClaw 插件
    - 你想使用 defineToolPlugin，而不是手写插件清单元数据
    - 你需要搭建脚手架、生成、验证、测试或发布一个仅工具插件
sidebarTitle: Tool Plugins
summary: 使用 defineToolPlugin 和 openclaw plugins init/build/validate 构建简单的类型化智能体工具
title: 工具插件
x-i18n:
    generated_at: "2026-06-27T02:59:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5e0ead3e9162b0e9e930a7a69dcd4a72a78063dae09a173efb70d0db32f73c9a
    source_path: plugins/tool-plugins.md
    workflow: 16
---

工具插件无需添加渠道、模型提供商、钩子、服务或设置后端，就能向 OpenClaw 添加智能体可调用的工具。当插件拥有固定工具列表，并且你希望 OpenClaw 生成让这些工具无需加载运行时代码也可被发现的清单元数据时，请使用 `defineToolPlugin`。

推荐流程是：

1. 使用 `openclaw plugins init` 搭建包。
2. 使用 `defineToolPlugin` 编写工具。
3. 构建 JavaScript。
4. 使用 `openclaw plugins build` 生成 `openclaw.plugin.json` 和 `package.json` 元数据。
5. 在发布或安装前验证生成的元数据。

对于提供商、渠道、钩子、服务或混合能力插件，请改从[构建插件](/zh-CN/plugins/building-plugins)、[渠道插件](/zh-CN/plugins/sdk-channel-plugins)或[提供商插件](/zh-CN/plugins/sdk-provider-plugins)开始。

## 要求

- Node >= 22。
- TypeScript ESM 包输出。
- 使用 `typebox` 定义配置和工具参数 schema。
- `openclaw >=2026.5.17`，这是第一个导出 `openclaw/plugin-sdk/tool-plugin` 的 OpenClaw 版本。
- 一个可以发布 `dist/`、`openclaw.plugin.json` 和 `package.json` 的包根目录。

生成的插件会在运行时导入 `typebox`，因此请将 `typebox` 保留在 `dependencies` 中，而不仅是 `devDependencies`。

## 快速开始

创建新的插件包：

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

脚手架会创建：

- `src/index.ts`：带有 `echo` 工具的 `defineToolPlugin` 入口。
- `src/index.test.ts`：一个小型元数据测试。
- `tsconfig.json`：输出到 `dist/` 的 NodeNext TypeScript 配置。
- `package.json`：脚本、运行时依赖，以及 `openclaw.extensions: ["./dist/index.js"]`。
- `openclaw.plugin.json`：初始工具的已生成清单元数据。

预期验证输出：

```text
Plugin stock-quotes is valid.
```

## 编写工具

`defineToolPlugin` 接收插件身份信息、可选配置 schema，以及静态工具列表。参数和配置类型会从 TypeBox schema 推断。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

工具名称是稳定 API。请选择唯一、小写且足够具体的名称，以避免与核心工具或其他插件冲突。

## 可选工具和工厂工具

当用户应先显式将工具加入允许列表，然后才发送给模型时，请设置 `optional: true`：

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` 会写入匹配的 `toolMetadata.<tool>.optional` 清单条目，因此 OpenClaw 无需加载插件运行时代码即可发现该工具。

当工具需要运行时工具上下文后才能创建时，请使用 `factory`。工厂会保持元数据静态，同时允许工具针对特定运行选择退出、检查沙箱状态，或绑定运行时辅助能力。

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

工厂仍用于固定工具名称。当插件动态计算工具名称，或将工具与钩子、服务、提供商、命令或其他运行时表面组合时，请直接使用 `definePluginEntry`。

## 返回值

`defineToolPlugin` 会将普通返回值包装为 OpenClaw 工具结果格式：

- 当模型应看到完全相同的文本时，返回字符串。
- 当你希望模型看到格式化 JSON，并让 OpenClaw 在 `details` 中保留原始值时，返回 JSON 兼容值。

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

当你需要返回自定义 `AgentToolResult`，或复用现有 `api.registerTool` 实现时，请使用工厂工具。当你需要完全动态的工具或混合插件能力时，请使用 `definePluginEntry`，而不是 `defineToolPlugin`。

## 配置

`configSchema` 是可选的。如果省略它，OpenClaw 会使用严格的空对象 schema，并且生成的清单仍包含 `configSchema`。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

包含 `configSchema` 时，第二个 `execute` 参数会从 schema 获取类型：

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw 会从 Gateway 网关配置中的插件条目读取插件配置。不要在源码或文档示例中硬编码密钥。请根据插件的安全模型使用配置、环境变量或 SecretRefs。

## 生成的元数据

OpenClaw 通过冷元数据发现已安装插件。它必须能够在导入插件运行时代码前读取插件清单。因此，`defineToolPlugin` 会暴露静态元数据，而 `openclaw plugins build` 会将该元数据写入包中。

更改插件 ID、名称、描述、配置 schema、激活方式或工具名称后，请运行生成器：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

对于单工具插件，生成的清单如下所示：

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` 是重要的发现合约。它告诉 OpenClaw 每个工具由哪个插件拥有，而无需加载每个已安装插件的运行时。如果清单过期，工具可能会从发现结果中缺失，或注册错误可能会归因到错误的插件。

## 包元数据

对于简单的工具插件工作流，`openclaw plugins build` 会将 `package.json` 对齐到选定的单一运行时入口：

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

已安装包应使用已构建的 JavaScript，例如 `./dist/index.js`。源码入口在工作区开发中很有用，但已发布的包不应依赖 TypeScript 运行时加载。

## 在 CI 中验证

使用 `plugins build --check` 在生成的元数据过期时让 CI 失败，而不重写文件：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` 会检查：

- `openclaw.plugin.json` 存在，并通过普通清单加载器。
- 当前入口导出 `defineToolPlugin` 元数据。
- 生成的清单字段与入口元数据匹配。
- `contracts.tools` 与声明的工具名称匹配。
- `package.json` 将 `openclaw.extensions` 指向选定的运行时入口。

## 本地安装和检查

从单独的 OpenClaw checkout 或已安装的 CLI 中安装包路径：

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

对于打包 smoke 测试，请先打包再安装 tarball：

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

安装后，启动或重启 Gateway 网关，并要求智能体使用该工具。如果你正在调试工具可见性，请先检查插件运行时和有效工具目录，再修改代码。

## 发布

包准备好后，通过 ClawHub 发布：

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

使用显式 ClawHub 定位符安装：

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

在发布切换期间，仍支持裸 npm 包规范，但 ClawHub 是 OpenClaw 插件首选的发现和分发界面。

## 故障排除

### `plugin entry not found: ./dist/index.js`

选定的入口文件不存在。运行 `npm run build`，然后重新运行 `openclaw plugins build --entry ./dist/index.js` 或 `openclaw plugins validate --entry ./dist/index.js`。

### `plugin entry does not expose defineToolPlugin metadata`

该入口未导出由 `defineToolPlugin` 创建的值。检查模块默认导出是否为 `defineToolPlugin(...)` 结果，或使用 `--entry` 传入正确入口。

### `openclaw.plugin.json generated metadata is stale`

清单不再与入口元数据匹配。运行：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

提交 `openclaw.plugin.json` 和 `package.json` 的更改。

### `package.json openclaw.extensions must include ./dist/index.js`

包元数据指向了不同的运行时入口。运行 `openclaw plugins build --entry ./dist/index.js`，让生成器将包元数据与你打算发布的入口对齐。

### `Cannot find package 'typebox'`

已构建的插件会在运行时导入 `typebox`。请将 `typebox` 保留在 `dependencies` 中，重新安装包依赖，重新构建，并再次运行验证。

### 安装后工具未出现

按顺序检查：

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` 包含带有预期工具名称的 `contracts.tools`。
4. `package.json` 包含 `openclaw.extensions: ["./dist/index.js"]`。
5. 安装插件后已重启或重新加载 Gateway 网关。

## 另请参阅

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件清单](/zh-CN/plugins/manifest)
- [插件 CLI](/zh-CN/cli/plugins)
- [ClawHub 发布](/zh-CN/clawhub/publishing)
