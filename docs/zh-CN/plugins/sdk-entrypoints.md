---
read_when:
    - 你需要 defineToolPlugin、definePluginEntry 或 defineChannelPluginEntry 的确切类型签名
    - 你想了解注册模式（完整 vs 设置 vs CLI 元数据）
    - 你正在查找入口点选项
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的参考
title: 插件入口点
x-i18n:
    generated_at: "2026-07-05T01:58:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eea0981df2d977ac8eceb32a757db3e8edbb57b7a60889dd1dd6ec75e110a230
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每个插件都会导出一个默认入口对象。SDK 提供用于创建它们的辅助函数。

对于已安装的插件，`package.json` 应在可用时将运行时加载指向已构建的 JavaScript：

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

`extensions` 和 `setupEntry` 仍然是适用于工作区和 git 检出开发的有效源码入口。当 OpenClaw 加载已安装包时，优先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，让 npm 包可以避免运行时 TypeScript 编译。显式运行时入口是必需的：`runtimeSetupEntry` 需要 `setupEntry`，缺少 `runtimeExtensions` 或 `runtimeSetupEntry` 构件会导致安装/设备发现失败，而不是静默回退到源码。如果已安装包只声明 TypeScript 源码入口，OpenClaw 会在存在匹配的已构建 `dist/*.js` 对等文件时使用它，然后再回退到 TypeScript 源码。

所有入口路径都必须保留在插件包目录内。运行时入口和推断出的已构建 JavaScript 对等文件，不会让逃逸出去的 `extensions` 或 `setupEntry` 源码路径变为有效。

<Tip>
  **想找一份演练？** 请参阅 [工具插件](/zh-CN/plugins/tool-plugins)、[渠道插件](/zh-CN/plugins/sdk-channel-plugins) 或 [提供商插件](/zh-CN/plugins/sdk-provider-plugins)，获取分步指南。
</Tip>

## `defineToolPlugin`

**导入：** `openclaw/plugin-sdk/tool-plugin`

适用于只添加智能体工具的简单插件。`defineToolPlugin` 让创作源码保持小巧，从 TypeBox schema 推断配置和工具参数类型，将普通返回值包装为 OpenClaw 工具结果格式，并暴露静态元数据，供 `openclaw plugins build` 写入插件清单。

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

- `configSchema` 是可选的。省略时，OpenClaw 会使用严格的空对象 schema，生成的清单仍会包含 `configSchema`。
- `execute` 返回普通字符串或可 JSON 序列化的值。该辅助函数会将其包装为带有 `details` 的文本工具结果。
- 对于自定义工具结果，`openclaw/plugin-sdk/tool-results` 会导出 `textResult` 和 `jsonResult`。
- 工具名称是静态的。`openclaw plugins build` 会从声明的工具派生 `contracts.tools`，因此作者无需手动重复名称。
- 运行时加载保持严格。已安装插件仍然需要 `openclaw.plugin.json` 和 `package.json` 中的 `openclaw.extensions`；OpenClaw 不会执行插件代码来推断缺失的清单数据。

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

适用于提供商插件、高级工具插件、钩子插件，以及任何**不是**消息渠道的内容。

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

| 字段           | 类型                                                             | 必需 | 默认值          |
| -------------- | ---------------------------------------------------------------- | ---- | --------------- |
| `id`           | `string`                                                         | 是   | -               |
| `name`         | `string`                                                         | 是   | -               |
| `description`  | `string`                                                         | 是   | -               |
| `kind`         | `string`                                                         | 否   | -               |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 schema   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | -               |

- `id` 必须与你的 `openclaw.plugin.json` 清单匹配。
- `kind` 用于独占插槽：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函数，用于延迟求值。
- OpenClaw 会在首次访问时解析并记忆该 schema，因此开销较大的 schema 构建器只会运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用渠道特定的接线包装 `definePluginEntry`。自动调用 `api.registerChannel({ plugin })`，暴露一个可选的根帮助 CLI 元数据接缝，并按注册模式门控 `registerFull`。

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

| 字段                  | 类型                                                             | 必需 | 默认值          |
| --------------------- | ---------------------------------------------------------------- | ---- | --------------- |
| `id`                  | `string`                                                         | 是   | -               |
| `name`                | `string`                                                         | 是   | -               |
| `description`         | `string`                                                         | 是   | -               |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -               |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 schema   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -               |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -               |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -               |

- `setRuntime` 会在注册期间调用，以便你存储运行时引用（通常通过 `createPluginRuntimeStore`）。CLI 元数据捕获期间会跳过它。
- `registerCliMetadata` 会在 `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"` 和 `api.registrationMode === "full"` 期间运行。将它用作渠道拥有的 CLI 描述符的规范位置，这样根帮助保持非激活状态，设备发现快照包含静态命令元数据，普通 CLI 命令注册也继续兼容完整插件加载。
- 设备发现注册是非激活的，但并非免导入。OpenClaw 可能会求值受信任的插件入口和渠道插件模块来构建快照，因此请保持顶层导入无副作用，并将套接字、客户端、worker 和服务放在仅 `"full"` 使用的路径之后。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在仅设置加载期间会跳过它。
- 与 `definePluginEntry` 一样，`configSchema` 可以是惰性工厂，OpenClaw 会在首次访问时记忆解析后的 schema。
- 对于插件拥有的根 CLI 命令，如果你希望命令保持惰性加载且不从根 CLI 解析树中消失，优先使用 `api.registerCli(..., { descriptors: [...] })`。对于配对节点功能命令，优先使用 `api.registerNodeCliFeature(...)`，使命令落在 `openclaw nodes` 下。对于其他嵌套插件命令，请添加 `parentPath`，并在传给注册器的 `program` 对象上注册命令；OpenClaw 会在调用插件前将其解析为父命令。对于渠道插件，优先从 `registerCliMetadata(...)` 注册这些描述符，并让 `registerFull(...)` 专注于仅运行时工作。
- 如果 `registerFull(...)` 也注册 Gateway 网关 RPC 方法，请将它们放在插件特定前缀下。保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终会被强制转换为 `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用于轻量级 `setup-entry.ts` 文件。只返回 `{ plugin }`，没有运行时或 CLI 接线。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当某个渠道被禁用、未配置，或启用延迟加载时，OpenClaw 会加载它而不是完整入口。请参阅 [设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)，了解它何时重要。

实践中，将 `defineSetupPluginEntry(...)` 与窄范围设置辅助函数族配对使用：

- `openclaw/plugin-sdk/setup-runtime` 用于运行时安全的设置辅助函数，例如 `createSetupTranslator`、导入安全的设置补丁适配器、查找说明输出、`promptResolvedAllowFrom`、`splitSetupEntries` 和委托设置代理
- `openclaw/plugin-sdk/channel-setup` 用于可选安装设置表面
- `openclaw/plugin-sdk/setup-tools` 用于设置/安装 CLI/归档/文档辅助函数

将重量级 SDK、CLI 注册和长期运行的运行时服务保留在完整入口中。

拆分设置和运行时表面的内置工作区渠道，可以改用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。该契约让设置入口在保留设置安全的插件/密钥导出的同时，仍然暴露运行时 setter：

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

只有在设置流程确实需要轻量级运行时 setter，或在完整渠道入口加载前需要设置安全的 Gateway 网关表面时，才使用该内置契约。`registerSetupRuntime` 仅对 `"setup-runtime"` 加载运行；请将其限制为仅配置路由或必须在延迟完整激活之前存在的方法。

## 注册模式

`api.registrationMode` 会告诉你的插件它是如何被加载的：

| 模式              | 适用场景                              | 要注册的内容                                                                                                        |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 正常 Gateway 网关启动            | 所有内容                                                                                                              |
| `"discovery"`     | 只读能力发现    | 渠道注册加静态 CLI 描述符；入口代码可以加载，但跳过套接字、工作线程、客户端和服务 |
| `"setup-only"`    | 已禁用/未配置的渠道     | 仅渠道注册                                                                                               |
| `"setup-runtime"` | 有运行时可用的设置流程 | 渠道注册加完整入口加载前所需的轻量级运行时                               |
| `"cli-metadata"`  | 根帮助 / CLI 元数据捕获  | 仅 CLI 描述符                                                                                                    |

`defineChannelPluginEntry` 会自动处理这种拆分。如果你直接为渠道使用
`definePluginEntry`，请自行检查模式：

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

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

设备发现模式会构建一个不激活的注册表快照。它仍可能求值
插件入口和渠道插件对象，以便 OpenClaw 注册渠道
能力和静态 CLI 描述符。将设备发现中的模块求值视为
可信但轻量：顶层不要有网络客户端、子进程、监听器、数据库
连接、后台工作线程、凭证读取或其他实时运行时副作用。

将 `"setup-runtime"` 视为一个窗口，在此期间仅设置启动界面必须
存在，而不会重新进入完整的内置渠道运行时。适合的内容包括
渠道注册、设置安全的 HTTP 路由、设置安全的 Gateway 网关方法以及
委托的设置助手。繁重的后台服务、CLI 注册器和
提供商/客户端 SDK 启动仍属于 `"full"`。

对于 CLI 注册器，具体而言：

- 当注册器拥有一个或多个根命令，并且你希望 OpenClaw 在首次调用时
  延迟加载真正的 CLI 模块时，使用 `descriptors`
- 确保这些描述符覆盖注册器暴露的每个顶级命令根
- 将描述符命令名称限制为字母、数字、连字符和下划线，
  并以字母或数字开头；OpenClaw 会拒绝不符合这种形状的描述符名称，
  并在渲染帮助前从描述中剥离终端控制序列
- 仅在急切兼容路径中单独使用 `commands`

## 插件形态

OpenClaw 按注册行为对已加载插件分类：

| 形态                 | 描述                                        |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一种能力类型（例如仅提供商）           |
| **hybrid-capability** | 多种能力类型（例如提供商 + 语音） |
| **hook-only**         | 只有钩子，没有能力                        |
| **non-capability**    | 工具/命令/服务，但没有能力        |

使用 `openclaw plugins inspect <id>` 查看插件的形态。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) - 注册 API 和子路径参考
- [运行时助手](/zh-CN/plugins/sdk-runtime) - `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/zh-CN/plugins/sdk-setup) - 清单、设置入口、延迟加载
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建 `ChannelPlugin` 对象
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 提供商注册和钩子
