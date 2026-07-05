---
read_when:
    - 你需要 `defineToolPlugin`、`definePluginEntry` 或 `defineChannelPluginEntry` 的准确类型签名
    - 你想了解注册模式（完整模式、设置模式与 CLI 元数据）
    - 你正在查找入口点选项
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 参考
title: 插件入口点
x-i18n:
    generated_at: "2026-07-05T11:32:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc86fe21ccd7705aabf1873ac025c5ff7b6345da2edf2689b07d0f5e4b56e8fe
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每个插件都会导出一个默认入口对象。SDK 为每种入口形状提供一个辅助函数：`defineToolPlugin`、`definePluginEntry`、`defineChannelPluginEntry`、`defineSetupPluginEntry`。

<Tip>
  **想看演练？** 请参阅 [工具插件](/zh-CN/plugins/tool-plugins)、[渠道插件](/zh-CN/plugins/sdk-channel-plugins) 或 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)，获取分步指南。
</Tip>

## 包入口

已安装的插件会在 `package.json` 的 `openclaw` 字段中同时指向源码入口和构建后入口：

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

- `extensions` 和 `setupEntry` 是源码入口，用于工作区和 git checkout 开发。
- `runtimeExtensions` 和 `runtimeSetupEntry` 优先用于已安装的包：它们让 npm 包可以跳过运行时 TypeScript 编译。
- 当存在 `runtimeExtensions` 时，它必须与 `extensions` 的数组长度匹配（入口按位置配对）。`runtimeSetupEntry` 需要 `setupEntry`。
- 如果声明了 `runtimeExtensions`/`runtimeSetupEntry` 产物但缺失，安装/发现会因打包错误而失败；OpenClaw 不会静默回退到源码。源码回退（见下文）仅在完全没有声明运行时入口时适用。
- 如果已安装的包只声明 TypeScript 源码入口，OpenClaw 会查找匹配的构建后 `dist/*.js`（或 `.mjs`/`.cjs`）同级文件并使用它；否则会回退到 TypeScript 源码。
- 所有入口路径都必须留在插件包目录内。运行时入口和推断出的构建后 JS 同级文件，并不会让一个越界的 `extensions` 或 `setupEntry` 源码路径变得有效。

## `defineToolPlugin`

**导入：** `openclaw/plugin-sdk/tool-plugin`

用于只添加智能体工具的插件。它让源码保持简洁，从 TypeBox schema 推断配置和工具参数类型，将普通返回值包装成 OpenClaw 工具结果格式，并公开静态元数据，供 `openclaw plugins build` 写入插件清单（`contracts.tools`、`configSchema`）。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` 是可选的；省略它会使用严格的空对象模式（生成的清单仍会包含 `configSchema`）。
- `execute` 返回普通字符串或可 JSON 序列化的值；辅助函数会将它包装为文本工具结果，并把 `details` 设置为原始（未字符串化的）返回值。
- 对于自定义工具结果，`openclaw/plugin-sdk/tool-results` 会导出 `textResult` 和 `jsonResult`。
- 工具名称是静态的，因此 `openclaw plugins build` 会根据声明的工具派生 `contracts.tools`，无需手动重复名称。
- 运行时加载保持严格：已安装的插件仍然需要 `openclaw.plugin.json` 和 `package.json` 的 `openclaw.extensions`。OpenClaw 绝不会通过执行插件代码来推断缺失的清单数据。

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

用于提供商插件、高级工具插件、钩子插件，以及任何**不是**消息渠道的插件。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| 字段                      | 类型                                                             | 必填 | 默认值       |
| ------------------------- | ---------------------------------------------------------------- | ---- | ------------ |
| `id`                      | `string`                                                         | 是   | -            |
| `name`                    | `string`                                                         | 是   | -            |
| `description`             | `string`                                                         | 是   | -            |
| `kind`                    | `string`（已弃用，见下文）                                      | 否   | -            |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象模式   |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | 否   | -            |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | 否   | -            |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | 否   | -            |
| `register`                | `(api: OpenClawPluginApi) => void`                               | 是   | -            |

- `id` 必须匹配你的 `openclaw.plugin.json` 清单。
- `kind` 已弃用：请改为在 `openclaw.plugin.json` 清单的 `kind` 字段中声明一个互斥槽位（`"memory"` 或 `"context-engine"`）。运行时入口的 `kind` 仅作为旧插件的兼容性回退保留。
- `configSchema` 可以是一个函数，用于延迟求值。OpenClaw 会在首次访问时解析并记忆化该模式，因此昂贵的模式构建器只会运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

使用渠道专用接线包装 `definePluginEntry`：它会自动调用 `api.registerChannel({ plugin })`，公开一个可选的根级帮助 CLI 元数据接缝，并根据注册模式控制 `registerFull`。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 字段                  | 类型                                                             | 必填 | 默认值       |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------ |
| `id`                  | `string`                                                         | 是   | -            |
| `name`                | `string`                                                         | 是   | -            |
| `description`         | `string`                                                         | 是   | -            |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -            |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象模式   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -            |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -            |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -            |

回调会按注册模式运行（完整表格见[注册模式](#registration-mode)）：

- `setRuntime` 会在除 `"cli-metadata"` 和 `"tool-discovery"` 以外的每种模式下运行。通常通过 `createPluginRuntimeStore` 在这里存储运行时引用。
- `registerCliMetadata` 会为 `"cli-metadata"`、`"discovery"` 和 `"full"` 运行。将它用作渠道自有 CLI 描述符的规范位置，这样根级帮助可以保持非激活状态，发现快照可以包含静态命令元数据，并且普通 CLI 注册可以与完整插件加载保持兼容。
- `registerFull` 只会为 `"full"` 和 `"tool-discovery"` 运行。对于 `"tool-discovery"`，它会_取代_渠道注册运行：OpenClaw 会完全跳过 `registerChannel`/`setRuntime`，并且只调用 `registerFull`，因此你的渠道为独立工具发现或执行所需的任何提供商/工具注册，都必须放在这里，而不能藏在普通渠道设置之后。
- 发现注册是非激活的，但不是免导入的：OpenClaw 可能会求值受信任的插件入口和渠道插件模块来构建快照。保持顶层导入无副作用，并将套接字、客户端、工作进程和服务放在仅 `"full"` 路径之后。
- 与 `definePluginEntry` 一样，`configSchema` 可以是延迟工厂；OpenClaw 会在首次访问时记忆化解析后的模式。

CLI 注册：

- 对于你希望延迟加载、但又不想从根级 CLI 解析树中消失的插件自有根级 CLI 命令，请使用 `api.registerCli(..., { descriptors: [...] })`。描述符名称必须匹配字母、数字、连字符和下划线，并以字母或数字开头；OpenClaw 会拒绝其他形状，并在渲染帮助前从描述中剥离终端控制序列。覆盖注册器公开的每个顶层命令根。仅使用 `commands` 仍会走急切兼容路径。
- 对于成对节点功能命令，请使用 `api.registerNodeCliFeature(...)`，这样它们会落在 `openclaw nodes` 下（等价于 `registerCli(registrar, { parentPath: ["nodes"], ... })`）。
- 对于其他嵌套插件命令，请添加 `parentPath`，并在传给注册器的 `program` 对象上注册命令；OpenClaw 会在调用插件前将其解析为父命令。
- 对于渠道插件，请从 `registerCliMetadata` 注册 CLI 描述符，并让 `registerFull` 专注于仅运行时工作。
- 如果 `registerFull` 还会注册 Gateway 网关 RPC 方法，请将它们放在插件专用前缀下。保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终会被强制转换为 `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用于轻量级 `setup-entry.ts` 文件。它只返回 `{ plugin }`，没有运行时或 CLI 接线。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当渠道被禁用、未配置，或启用延迟加载时，OpenClaw 会加载它而不是完整入口。何时需要这样做，请参阅[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

将 `defineSetupPluginEntry(...)` 与窄范围设置辅助函数系列配对：

| 导入                                | 用途                                                                                                                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | 运行时安全的设置辅助工具：`createSetupTranslator`、导入安全的设置补丁适配器、lookup-note 输出、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
| `openclaw/plugin-sdk/channel-setup` | 可选安装的设置表面                                                                                                                                                    |
| `openclaw/plugin-sdk/setup-tools`   | 设置/安装 CLI、归档和文档辅助工具                                                                                                                                       |

将重型 SDK、CLI 注册和长生命周期运行时服务保留在
完整入口中。

拆分设置和运行时表面的内置工作区渠道可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。它让设置
入口在仍暴露运行时 setter 的同时，保留设置安全的插件/密钥导出：

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
  registerSetupRuntime(api) {
    api.registerHttpRoute({
      path: "/my-channel/events",
      auth: "plugin",
      handler: async (req, res) => {
        /* setup-safe route */
      },
    });
  },
});
```

只有当设置流程确实需要轻量运行时 setter，或需要在完整渠道入口加载前提供设置安全的 Gateway 网关表面时，才使用此方式。
`registerSetupRuntime` 只会在 `"setup-runtime"` 加载时运行；请将它
限制为仅配置路由，或必须在延迟的
完整激活前存在的方法。

## 注册模式

`api.registrationMode` 会告诉你的插件它是如何加载的：

| 模式               | 何时                                               | 注册内容                                                                                                        |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | 正常 Gateway 网关启动                             | 所有内容                                                                                                              |
| `"discovery"`      | 只读能力发现                     | 渠道注册加静态 CLI 描述符；入口代码可以加载，但跳过 socket、worker、客户端和服务 |
| `"tool-discovery"` | 作用域加载，用于列出或运行特定插件的工具 | 仅能力/工具注册；不激活渠道                                                                |
| `"setup-only"`     | 已禁用/未配置的渠道                      | 仅渠道注册                                                                                               |
| `"setup-runtime"`  | 设置流程，且运行时可用                  | 渠道注册加完整入口加载前所需的轻量运行时                               |
| `"cli-metadata"`   | 根帮助 / CLI 元数据捕获                   | 仅 CLI 描述符                                                                                                    |

`defineChannelPluginEntry` 会自动处理这种拆分。如果你直接将
`definePluginEntry` 用于渠道，请自行检查模式，并记住
`"tool-discovery"` 会跳过渠道注册：

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  if (api.registrationMode === "tool-discovery") {
    // Register capability-only surfaces (providers/tools), no channel.
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

发现模式会构建一个不会激活的注册表快照。它仍可能
求值插件入口和渠道插件对象，以便 OpenClaw 可以
注册渠道能力和静态 CLI 描述符。将发现中的模块
求值视为可信但轻量：顶层不要有网络客户端、
子进程、监听器、数据库连接、后台 worker、
凭证读取或其他实时运行时副作用。

将 `"setup-runtime"` 视为设置专用启动表面必须
存在、但不重新进入完整内置渠道运行时的窗口。适合的内容包括
渠道注册、设置安全的 HTTP 路由、设置安全的 Gateway 网关方法
以及委托式设置辅助工具。重型后台服务、CLI 注册器和
提供商/客户端 SDK 引导仍应放在 `"full"` 中。

## 插件形态

OpenClaw 会按注册行为对已加载插件进行分类：

| 形态                 | 描述                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一种能力类型（例如仅提供商）           |
| **hybrid-capability** | 多种能力类型（例如提供商 + 语音） |
| **hook-only**         | 只有钩子，没有能力                        |
| **non-capability**    | 工具/命令/服务，但没有能力        |

使用 `openclaw plugins inspect <id>` 查看插件的形态。

## 相关

- [SDK 概览](/zh-CN/plugins/sdk-overview) - 注册 API 和子路径参考
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime) - `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/zh-CN/plugins/sdk-setup) - 清单、设置入口、延迟加载
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建 `ChannelPlugin` 对象
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 提供商注册和钩子
