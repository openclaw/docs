---
read_when:
    - 你想构建一个只添加智能体工具的简单 OpenClaw 插件
    - 你想使用 defineToolPlugin，而不是手写插件清单元数据
    - 你需要脚手架搭建、生成、验证、测试或发布一个仅工具插件
sidebarTitle: Tool Plugins
summary: 使用 defineToolPlugin 和 openclaw plugins init/build/validate 构建简单的类型化智能体工具
title: 工具插件
x-i18n:
    generated_at: "2026-07-05T11:33:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` 会构建一个只添加可由智能体调用的工具的插件：没有
渠道、模型提供商、钩子、服务或设置后端。它会生成 OpenClaw 发现工具所需的
插件清单元数据，而无需加载插件运行时代码。

对于提供商、渠道、钩子、服务或混合能力插件，请改从
[Building plugins](/zh-CN/plugins/building-plugins)、[渠道插件](/zh-CN/plugins/sdk-channel-plugins)
或 [提供商插件](/zh-CN/plugins/sdk-provider-plugins) 开始。

## 要求

- Node 22.19+、Node 23.11+ 或 Node 24+。
- TypeScript ESM 包输出。
- `dependencies` 中包含 `typebox`（不只是 `devDependencies`，生成的
  插件会在运行时导入它）。
- `openclaw >=2026.5.17`，这是第一个导出
  `openclaw/plugin-sdk/tool-plugin` 的版本。
- 一个会发布 `dist/`、`openclaw.plugin.json` 和
  `package.json` 的包根目录。

## 快速开始

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` 会搭建：

| 文件                   | 用途                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | 包含一个 `echo` 工具的 `defineToolPlugin` 入口                     |
| `src/index.test.ts`    | 断言工具列表的元数据测试                             |
| `tsconfig.json`        | 输出到 `dist/` 的 NodeNext TypeScript 配置                             |
| `vitest.config.ts`     | 用于 `src/**/*.test.ts` 的 Vitest 配置                              |
| `package.json`         | 脚本、运行时依赖、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 为初始工具生成的插件清单元数据                  |

`npm run plugin:build` 会运行 `npm run build`（tsc），然后运行
`openclaw plugins build --entry ./dist/index.js`。`npm run plugin:validate`
会重新构建并运行 `openclaw plugins validate --entry ./dist/index.js`。
验证成功会打印：

```text
Plugin stock-quotes is valid.
```

`openclaw plugins init <id>` 选项：

| 标志                 | 默认值            | 作用                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | 输出目录                       |
| `--name <name>`      | 首字母大写的 `<id>` | 显示名称                           |
| `--type <type>`      | `tool`             | 脚手架类型：`tool` 或 `provider`    |
| `--force`            | 关闭                | 覆盖现有输出目录 |

## 编写工具

`defineToolPlugin` 接收插件身份、可选配置架构，以及一个
静态工具列表。参数和配置类型会从
TypeBox 架构推断。

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

工具名称是稳定 API。选择唯一、小写且
足够具体的名称，以避免与核心工具或其他插件冲突。

## 可选工具和工厂工具

当用户应在工具发送给模型前显式将其加入允许列表时，设置 `optional: true`。
`openclaw plugins build` 会写入匹配的
`toolMetadata.<tool>.optional` 插件清单条目，因此 OpenClaw 无需加载插件运行时代码
即可看到该工具是可选的。

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

当工具需要运行时工具上下文后才能创建时，请使用 `factory`，
例如为特定运行选择退出、检查沙箱状态，或绑定
运行时辅助函数。即使具体工具是在
运行时构建的，元数据也保持静态。

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

工厂仍会预先声明固定的工具名称。当插件动态计算工具名称，或将工具
与钩子、服务、提供商或命令组合时，请直接使用 `definePluginEntry`。

## 返回值

`defineToolPlugin` 会将普通返回值包装为 OpenClaw 工具结果
格式：

- 当模型应看到确切文本时，返回字符串。
- 当你希望模型看到格式化 JSON，并让 OpenClaw 在 `details` 中保留原始值时，
  返回 JSON 兼容值。

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

当你需要自定义 `AgentToolResult`，或想复用现有
`api.registerTool` 实现时，请使用工厂工具。

## 配置

`configSchema` 是可选的。省略它时，OpenClaw 会应用严格的空对象
架构；生成的插件清单仍会包含 `configSchema`。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

使用 `configSchema` 时，第二个 `execute` 参数会按其类型化：

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

OpenClaw 会从 Gateway 网关配置中的插件条目读取插件配置。不要在源代码或文档示例中
硬编码密钥；请根据插件的安全模型使用配置、环境变量
或 SecretRefs。

## 生成的元数据

OpenClaw 必须在导入插件运行时代码前读取插件清单。
`defineToolPlugin` 会为此暴露静态元数据，并且
`openclaw plugins build` 会将其写入包中。在更改插件 id、名称、描述、配置架构、激活方式或工具
名称后，请重新运行生成器：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

单工具插件的生成插件清单：

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

`contracts.tools` 是重要的发现契约：它告诉 OpenClaw 每个工具由哪个
插件拥有，而无需加载每个已安装插件的运行时。过期的插件清单意味着工具可能在发现中缺失，
或者注册错误会被归因到错误的插件。

## 包元数据

`openclaw plugins build` 还会将 `package.json` 对齐到所选运行时
入口：

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

发布构建后的 JavaScript（`./dist/index.js`），而不是 TypeScript 源入口。
源入口仅适用于工作区本地开发。

## 在 CI 中验证

当生成的元数据过期时，`plugins build --check` 会失败且不重写文件：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` 会检查：

- `openclaw.plugin.json` 存在，并通过常规插件清单加载器。
- 当前入口导出 `defineToolPlugin` 元数据。
- 生成的插件清单字段与入口元数据匹配。
- `contracts.tools` 与声明的工具名称匹配。
- `package.json` 将 `openclaw.extensions` 指向所选运行时入口。

## 本地安装和检查

从单独的 OpenClaw 检出目录或已安装的 CLI 中，安装包路径：

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

对于打包后的冒烟测试，请先打包并安装 tarball：

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

安装后，重启或重新加载 Gateway 网关，并让智能体使用该
工具。如果工具不可见，请在更改代码前检查插件运行时和有效
工具目录（参见[故障排查](#troubleshooting)）。

## 发布

包准备就绪后通过 ClawHub 发布。`clawhub package publish`
接收一个来源：本地文件夹、GitHub 仓库（`owner/repo[@ref]`）或
tarball URL。

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

使用显式 ClawHub 定位符安装：

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

在发布切换期间，裸 npm 包规范仍会从 npm 安装，但
ClawHub 是 OpenClaw 插件首选的发现和分发界面。
关于所有者范围和发布审查，请参见 [ClawHub 发布](/zh-CN/clawhub/publishing)。

## 故障排查

### `plugin entry not found: ./dist/index.js`

所选入口文件不存在。运行 `npm run build`，然后重新运行
`openclaw plugins build --entry ./dist/index.js` 或
`openclaw plugins validate --entry ./dist/index.js`。

### `plugin entry does not expose defineToolPlugin metadata`

该入口未导出由 `defineToolPlugin` 创建的值。确认
模块的默认导出是 `defineToolPlugin(...)` 结果，或使用
`--entry` 传入正确入口。

### `openclaw.plugin.json generated metadata is stale`

插件清单不再与入口元数据匹配。运行：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

提交 `openclaw.plugin.json` 和 `package.json` 两者的变更。

### `package.json openclaw.extensions must include ./dist/index.js`

包元数据指向了另一个运行时入口。运行
`openclaw plugins build --entry ./dist/index.js`，让生成器将
包元数据与你打算发布的入口对齐。

### `Cannot find package 'typebox'`

构建后的插件会在运行时导入 `typebox`。请将它保留在 `dependencies` 中，
重新安装、重新构建，并重新运行验证。

### 安装后工具未出现

按顺序检查这些内容：

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` 包含带有预期工具名称的 `contracts.tools`。
4. `package.json` 包含 `openclaw.extensions: ["./dist/index.js"]`。
5. 安装插件后，Gateway 网关已重启或重新加载。

## 另请参阅

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件清单](/zh-CN/plugins/manifest)
- [插件 CLI](/zh-CN/cli/plugins)
- [ClawHub 发布](/zh-CN/clawhub/publishing)
