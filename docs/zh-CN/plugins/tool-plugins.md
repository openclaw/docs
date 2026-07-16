---
read_when:
    - 你想构建一个仅添加智能体工具的简单 OpenClaw 插件
    - 你希望使用 defineToolPlugin，而不是手动编写插件清单元数据
    - 你需要搭建、生成、验证、测试或发布仅包含工具的插件
sidebarTitle: Tool Plugins
summary: 使用 defineToolPlugin 和 openclaw plugins init/build/validate 构建简单的类型化智能体工具
title: 工具插件
x-i18n:
    generated_at: "2026-07-16T11:50:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` 构建一个仅添加智能体可调用工具的插件：不包含
渠道、模型提供商、钩子、服务或设置后端。它会生成
OpenClaw 所需的清单元数据，以便无需加载插件运行时代码即可发现工具。

对于提供商、渠道、钩子、服务或混合能力插件，请改从
[构建插件](/zh-CN/plugins/building-plugins)、[渠道插件](/zh-CN/plugins/sdk-channel-plugins)
或[提供商插件](/zh-CN/plugins/sdk-provider-plugins)开始。

## 要求

- Node 22.22.3+、Node 24.15+ 或 Node 25.9+。
- TypeScript ESM 软件包输出。
- `typebox` 位于 `dependencies` 中（不能只位于 `devDependencies` 中——生成的
  插件会在运行时导入它）。
- `openclaw >=2026.5.17`，即首个导出
  `openclaw/plugin-sdk/tool-plugin` 的版本。
- 软件包根目录需发布 `dist/`、`openclaw.plugin.json` 和
  `package.json`。

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
| `tsconfig.json`        | 输出到 `dist/` 的 NodeNext TypeScript                             |
| `vitest.config.ts`     | 用于 `src/**/*.test.ts` 的 Vitest 配置                              |
| `package.json`         | 脚本、运行时依赖项、`openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | 初始工具的已生成清单元数据                  |

`npm run plugin:build` 会运行 `npm run build`（tsc），然后运行
`openclaw plugins build --entry ./dist/index.js`。`npm run plugin:validate`
会重新构建并运行 `openclaw plugins validate --entry ./dist/index.js`。
验证成功时会输出：

```text
插件 stock-quotes 有效。
```

`openclaw plugins init <id>` 选项：

| 标志                 | 默认值            | 效果                                 |
| -------------------- | ------------------ | -------------------------------------- |
| `--directory <path>` | `<id>`             | 输出目录                       |
| `--name <name>`      | 首字母大写格式的 `<id>` | 显示名称                           |
| `--type <type>`      | `tool`             | 搭建类型：`tool` 或 `provider`    |
| `--force`            | 关闭                | 覆盖现有输出目录 |

## 编写工具

`defineToolPlugin` 接受插件标识、可选配置架构和
静态工具列表。参数和配置类型从
TypeBox 架构推断。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "获取股票报价快照。",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "报价 API 密钥。" })),
    baseUrl: Type.Optional(Type.String({ description: "报价 API 基础 URL。" })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "股票报价",
      description: "获取股票报价快照。",
      parameters: Type.Object({
        symbol: Type.String({ description: "股票代码，例如 OPEN。" }),
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

工具名称是稳定的 API。请选择唯一、全小写且
足够具体的名称，以避免与核心工具或其他插件冲突。

## 可选工具和工厂工具

当用户应在工具发送给模型之前明确将其加入允许列表时，请设置 `optional: true`。
`openclaw plugins build` 会写入对应的
`toolMetadata.<tool>.optional` 清单条目，因此 OpenClaw 无需加载插件运行时代码即可识别该
工具为可选工具。

```typescript
tool({
  name: "workflow_run",
  description: "运行外部工作流。",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

当工具需要运行时工具上下文才能创建时，请使用 `factory`——例如针对某次特定运行选择退出、检查沙箱状态或绑定
运行时辅助程序。即使具体工具在运行时构建，
元数据仍保持静态。

```typescript
tool({
  name: "local_workflow",
  description: "在沙箱隔离的会话之外运行本地工作流。",
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

工厂仍需预先声明固定工具名称。当插件动态计算工具名称，或将工具
与钩子、服务、提供商或命令结合时，请直接使用 `definePluginEntry`。

## 返回值

`defineToolPlugin` 会将普通返回值包装成 OpenClaw 工具结果
格式：

- 当模型应看到完全相同的文本时，返回字符串。
- 当希望模型看到格式化的 JSON，并让 OpenClaw 在 `details` 中保留原始值时，
  返回与 JSON 兼容的值。

```typescript
tool({
  name: "echo_text",
  description: "回显输入文本。",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "以结构化 JSON 的形式回显输入。",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

当需要自定义 `AgentToolResult` 或希望复用现有
`api.registerTool` 实现时，请使用工厂工具。

## 配置

`configSchema` 是可选的。省略它后，OpenClaw 会应用严格的空对象
架构；生成的清单仍会包含 `configSchema`。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "添加不需要配置的工具。",
  tools: () => [],
});
```

使用 `configSchema` 时，第二个 `execute` 参数的类型会从中推断：

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "添加已配置的工具。",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "检查配置是否可用。",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw 从 Gateway 网关配置中的插件条目读取插件配置。不要
在源代码或文档示例中硬编码机密；请根据插件的安全模型使用配置、环境
变量或 SecretRef。

## 生成的元数据

OpenClaw 必须在导入插件运行时代码之前读取插件清单。
`defineToolPlugin` 为此公开静态元数据，而
`openclaw plugins build` 会将其写入软件包。更改插件 ID、名称、描述、配置架构、激活设置或工具
名称后，请重新运行生成器：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

单工具插件的生成清单：

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

`contracts.tools` 是重要的发现契约：它告诉 OpenClaw 每个工具归哪个
插件所有，而无需加载所有已安装插件的运行时。过期清单可能导致工具无法被发现，或将注册
错误归咎于错误的插件。

## 软件包元数据

`openclaw plugins build` 还会将 `package.json` 与所选运行时
入口对齐：

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

请发布构建后的 JavaScript（`./dist/index.js`），而不是 TypeScript 源代码入口。
源代码入口仅适用于工作区本地开发。

## 在 CI 中验证

当生成的元数据过期时，`plugins build --check` 会失败且不会重写文件：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` 会检查：

- `openclaw.plugin.json` 存在并通过常规清单加载器。
- 当前入口导出 `defineToolPlugin` 元数据。
- 生成的清单字段与入口元数据匹配。
- `contracts.tools` 与声明的工具名称匹配。
- `package.json` 将 `openclaw.extensions` 指向所选运行时入口。

## 在本地安装和检查

在另一个 OpenClaw 检出目录或已安装的 CLI 中，安装软件包路径：

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

对于软件包冒烟测试，请先打包并安装 tarball：

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

安装后，重启或重新加载 Gateway 网关，并要求智能体使用该
工具。如果工具不可见，请先检查插件运行时和有效
工具目录，再修改代码（参见[故障排除](#troubleshooting)）。

## 发布

软件包准备就绪后，通过 ClawHub 发布。`clawhub package publish`
接受一个来源：本地文件夹、GitHub 仓库（`owner/repo[@ref]`）或
tarball URL。

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

使用明确的 ClawHub 定位符安装：

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

在发布切换期间，裸 npm 软件包规范仍会从 npm 安装，但
ClawHub 是 OpenClaw
插件的首选发现和分发平台。有关所有者作用域和
发布审核，请参阅 [ClawHub 发布](/zh-CN/clawhub/publishing)。

## 故障排除

### `plugin entry not found: ./dist/index.js`

所选入口文件不存在。运行 `npm run build`，然后重新运行
`openclaw plugins build --entry ./dist/index.js` 或
`openclaw plugins validate --entry ./dist/index.js`。

### `plugin entry does not expose defineToolPlugin metadata`

入口未导出由 `defineToolPlugin` 创建的值。确认
模块的默认导出是 `defineToolPlugin(...)` 的结果，或使用
`--entry` 传入正确的入口。

### `openclaw.plugin.json generated metadata is stale`

清单不再与入口元数据匹配。运行：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

同时提交 `openclaw.plugin.json` 和 `package.json` 的更改。

### `package.json openclaw.extensions must include ./dist/index.js`

软件包元数据指向了不同的运行时入口。运行
`openclaw plugins build --entry ./dist/index.js`，使生成器将
软件包元数据与准备发布的入口对齐。

### `Cannot find package 'typebox'`

构建后的插件会在运行时导入 `typebox`。请将其保留在 `dependencies` 中，
重新安装、重新构建并再次运行验证。

### 工具安装后未出现

按顺序检查以下各项：

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` 包含具有预期工具名称的 `contracts.tools`。
4. `package.json` 包含 `openclaw.extensions: ["./dist/index.js"]`。
5. 安装插件后，Gateway 网关已重启或重新加载。

## 另请参阅

- [构建插件](/zh-CN/plugins/building-plugins)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)
- [插件清单](/zh-CN/plugins/manifest)
- [插件 CLI](/zh-CN/cli/plugins)
- [ClawHub 发布](/zh-CN/clawhub/publishing)
