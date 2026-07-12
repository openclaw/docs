---
read_when:
    - 你想构建一个仅添加智能体工具的简单 OpenClaw 插件
    - 你希望使用 defineToolPlugin，而不是手动编写插件清单元数据
    - 你需要搭建、生成、验证、测试或发布仅包含工具的插件
sidebarTitle: Tool Plugins
summary: 使用 defineToolPlugin 和 openclaw plugins init/build/validate 构建简单的类型化智能体工具
title: 工具插件
x-i18n:
    generated_at: "2026-07-11T20:50:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` 会构建一个仅添加智能体可调用工具的插件：不包含渠道、模型提供商、钩子、服务或设置后端。它会生成 OpenClaw 所需的插件清单元数据，以便无需加载插件运行时代码即可发现工具。

对于提供商、渠道、钩子、服务或混合能力插件，请改为从[构建插件](/zh-CN/plugins/building-plugins)、[渠道插件](/zh-CN/plugins/sdk-channel-plugins)或[提供商插件](/zh-CN/plugins/sdk-provider-plugins)开始。

## 要求

- Node 22.19+、Node 23.11+ 或 Node 24+。
- TypeScript ESM 软件包输出。
- `dependencies` 中包含 `typebox`（不能仅放在 `devDependencies` 中——生成的插件会在运行时导入它）。
- `openclaw >=2026.5.17`，这是首个导出 `openclaw/plugin-sdk/tool-plugin` 的版本。
- 软件包根目录必须随附 `dist/`、`openclaw.plugin.json` 和 `package.json`。

## 快速开始

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` 会生成以下脚手架：

| 文件                   | 用途                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`         | 包含一个 `echo` 工具的 `defineToolPlugin` 入口                     |
| `src/index.test.ts`    | 断言工具列表的元数据测试                             |
| `tsconfig.json`        | 输出到 `dist/` 的 NodeNext TypeScript 配置                             |
| `vitest.config.ts`     | 用于 `src/**/*.test.ts` 的 Vitest 配置                              |
| `package.json`         | 脚本、运行时依赖、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 为初始工具生成的插件清单元数据                  |

`npm run plugin:build` 会先运行 `npm run build`（tsc），然后运行 `openclaw plugins build --entry ./dist/index.js`。`npm run plugin:validate` 会重新构建并运行 `openclaw plugins validate --entry ./dist/index.js`。验证成功时会输出：

```text
Plugin stock-quotes is valid.
```

`openclaw plugins init <id>` 选项：

| 标志                 | 默认值            | 作用                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | 输出目录                       |
| `--name <name>`      | 首字母大写格式的 `<id>` | 显示名称                           |
| `--type <type>`      | `tool`             | 脚手架类型：`tool` 或 `provider`    |
| `--force`            | 关闭                | 覆盖现有输出目录 |

## 编写工具

`defineToolPlugin` 接受插件标识、可选的配置模式以及静态工具列表。参数类型和配置类型会从 TypeBox 模式中推断。

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

工具名称是稳定的 API。请选择唯一、全小写且足够具体的名称，以免与核心工具或其他插件发生冲突。

## 可选工具和工厂工具

如果用户应先将工具明确加入允许列表，之后才将其发送给模型，请设置 `optional: true`。`openclaw plugins build` 会写入对应的 `toolMetadata.<tool>.optional` 插件清单条目，使 OpenClaw 无需加载插件运行时代码即可识别该工具是可选的。

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

如果工具在创建前需要运行时工具上下文，例如针对特定运行选择退出、检查沙箱状态或绑定运行时辅助函数，请使用 `factory`。尽管具体工具是在运行时构建的，元数据仍保持静态。

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

工厂仍需预先声明固定的工具名称。如果插件会动态计算工具名称，或将工具与钩子、服务、提供商或命令组合使用，请直接使用 `definePluginEntry`。

## 返回值

`defineToolPlugin` 会将普通返回值封装为 OpenClaw 工具结果格式：

- 当模型应看到完全相同的文本时，返回字符串。
- 当你希望模型看到格式化的 JSON，并希望 OpenClaw 在 `details` 中保留原始值时，返回与 JSON 兼容的值。

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

如果需要自定义 `AgentToolResult`，或希望复用现有的 `api.registerTool` 实现，请使用工厂工具。

## 配置

`configSchema` 是可选的。省略它时，OpenClaw 会应用严格的空对象模式；生成的插件清单仍会包含 `configSchema`。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

使用 `configSchema` 后，第二个 `execute` 参数的类型会根据它推断：

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

OpenClaw 会从 Gateway 配置中的插件条目读取插件配置。不要在源代码或文档示例中硬编码机密；请根据插件的安全模型使用配置、环境变量或 SecretRefs。

## 生成的元数据

OpenClaw 必须先读取插件清单，之后才能导入插件运行时代码。`defineToolPlugin` 会为此公开静态元数据，而 `openclaw plugins build` 会将其写入软件包。更改插件 ID、名称、描述、配置模式、激活方式或工具名称后，请重新运行生成器：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

单工具插件生成的插件清单：

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

`contracts.tools` 是关键的发现契约：它会告诉 OpenClaw 每个工具归哪个插件所有，而无需加载所有已安装插件的运行时。过期的插件清单可能导致工具无法被发现，或将注册错误错误地归咎于其他插件。

## 软件包元数据

`openclaw plugins build` 还会使 `package.json` 与所选运行时入口保持一致：

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

请随附构建后的 JavaScript（`./dist/index.js`），而不是 TypeScript 源代码入口。源代码入口仅适用于工作区内的本地开发。

## 在 CI 中验证

生成的元数据过期时，`plugins build --check` 会失败，但不会重写文件：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` 会检查：

- `openclaw.plugin.json` 是否存在，并能否通过常规插件清单加载器。
- 当前入口是否导出 `defineToolPlugin` 元数据。
- 生成的插件清单字段是否与入口元数据匹配。
- `contracts.tools` 是否与声明的工具名称匹配。
- `package.json` 是否将 `openclaw.extensions` 指向所选运行时入口。

## 在本地安装和检查

在另一个 OpenClaw 检出目录或已安装的 CLI 中，安装该软件包路径：

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

对于打包后的冒烟测试，请先打包，再安装 tarball：

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

安装后，重启或重新加载 Gateway 网关，并让智能体使用该工具。如果工具不可见，请先检查插件运行时和实际生效的工具目录，再更改代码（参见[故障排除](#troubleshooting)）。

## 发布

软件包准备就绪后，通过 ClawHub 发布。`clawhub package publish` 接受一个来源：本地文件夹、GitHub 仓库（`owner/repo[@ref]`）或 tarball URL。

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

使用明确的 ClawHub 定位符安装：

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

在发布切换期间，裸 npm 软件包说明符仍会从 npm 安装，但 ClawHub 是 OpenClaw 插件首选的发现和分发平台。有关所有者作用域和发布审核，请参阅 [ClawHub 发布](/zh-CN/clawhub/publishing)。

## 故障排除

### `plugin entry not found: ./dist/index.js`

所选入口文件不存在。请运行 `npm run build`，然后重新运行 `openclaw plugins build --entry ./dist/index.js` 或 `openclaw plugins validate --entry ./dist/index.js`。

### `plugin entry does not expose defineToolPlugin metadata`

该入口未导出由 `defineToolPlugin` 创建的值。请确认模块的默认导出是 `defineToolPlugin(...)` 的结果，或使用 `--entry` 传入正确的入口。

### `openclaw.plugin.json generated metadata is stale`

插件清单不再与入口元数据匹配。请运行：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

同时提交 `openclaw.plugin.json` 和 `package.json` 的更改。

### `package.json openclaw.extensions must include ./dist/index.js`

软件包元数据指向了其他运行时入口。请运行 `openclaw plugins build --entry ./dist/index.js`，使生成器将软件包元数据与准备随附的入口对齐。

### `Cannot find package 'typebox'`

构建后的插件会在运行时导入 `typebox`。请将其保留在 `dependencies` 中，重新安装并构建，然后再次运行验证。

### 安装后工具未出现

请按以下顺序检查：

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` 的 `contracts.tools` 包含预期的工具名称。
4. `package.json` 包含 `openclaw.extensions: ["./dist/index.js"]`。
5. 安装插件后，已重启或重新加载 Gateway 网关。

## 另请参阅

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件清单](/zh-CN/plugins/manifest)
- [插件 CLI](/zh-CN/cli/plugins)
- [ClawHub 发布](/zh-CN/clawhub/publishing)
