---
read_when:
    - 你需要 `defineToolPlugin`、`definePluginEntry` 或 `defineChannelPluginEntry` 的确切类型签名
    - 你想了解注册模式（完整模式、设置模式与 CLI 元数据）
    - 你正在查找入口点选项
sidebarTitle: Entry Points
summary: defineToolPlugin、definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 参考
title: 插件入口点
x-i18n:
    generated_at: "2026-07-14T13:57:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 8b2133dbe4ee650b27e110d472b38284d557f715829e3f0d73f8dc6c910c7c99
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每个插件都导出一个默认入口对象。SDK 为每种入口形态提供一个辅助函数：`defineToolPlugin`、`definePluginEntry`、
`defineChannelPluginEntry`、`defineSetupPluginEntry`。

<Tip>
  **想查看分步教程？** 请参阅[工具插件](/zh-CN/plugins/tool-plugins)、
  [渠道插件](/zh-CN/plugins/sdk-channel-plugins)或
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins)中的分步指南。
</Tip>

## 软件包入口

已安装的插件通过 `package.json` 的 `openclaw` 字段同时指向源代码入口和
构建后入口：

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

- `extensions` 和 `setupEntry` 是源代码入口，用于工作区和 git
  检出开发。
- 对于已安装的软件包，优先使用 `runtimeExtensions` 和 `runtimeSetupEntry`：
  它们可让 npm 软件包跳过运行时 TypeScript 编译。
- `runtimeExtensions` 如存在，其数组长度必须与 `extensions` 匹配
  （入口按位置配对）。`runtimeSetupEntry` 需要 `setupEntry`。
- 如果声明了 `runtimeExtensions`/`runtimeSetupEntry` 工件但该工件
  缺失，安装/发现会因打包错误而失败；OpenClaw 不会
  静默回退到源代码。仅当完全未声明运行时入口时，才会应用源代码回退（见下文）。
- 如果已安装的软件包仅声明 TypeScript 源代码入口，OpenClaw
  会查找匹配的构建后 `dist/*.js`（或 `.mjs`/`.cjs`）对等文件并使用它；
  否则会回退到 TypeScript 源代码。
- 所有入口路径都必须位于插件软件包目录内。运行时
  入口和推断出的构建后 JS 对等文件并不能使越界的 `extensions` 或
  `setupEntry` 源代码路径变为有效路径。

## `defineToolPlugin`

**导入：** `openclaw/plugin-sdk/tool-plugin`

适用于仅添加智能体工具的插件。它可保持源代码精简，从 TypeBox schema 中推断配置
和工具参数类型，将普通返回值封装为
OpenClaw 工具结果格式，并公开静态元数据，供
`openclaw plugins build` 写入插件清单（`contracts.tools`、
`configSchema`）。

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

- `configSchema` 是可选的；省略时使用严格的空对象 schema
  （生成的清单仍包含 `configSchema`）。
- `execute` 返回普通字符串或可 JSON 序列化的值；辅助函数
  会将其封装为文本工具结果，并将 `details` 设置为原始的
  （未字符串化）返回值。
- 对于自定义工具结果，`openclaw/plugin-sdk/tool-results` 会导出
  `textResult` 和 `jsonResult`。
- 工具名称是静态的，因此 `openclaw plugins build` 会根据已声明的工具派生
  `contracts.tools`，无需手动重复填写名称。
- 运行时加载仍采用严格模式：已安装的插件仍需提供
  `openclaw.plugin.json` 和 `package.json` `openclaw.extensions`。OpenClaw
  从不通过执行插件代码来推断缺失的清单数据。

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

适用于提供商插件、高级工具插件、钩子插件，以及任何
**不是**消息渠道的插件。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({/* ... */});
    api.registerTool({/* ... */});
  },
});
```

| 字段                      | 类型                                                             | 必需     | 默认值              |
| ------------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                      | `string`                                                         | 是       | -                   |
| `name`                    | `string`                                                         | 是       | -                   |
| `description`             | `string`                                                         | 是       | -                   |
| `kind`                    | `string`（已弃用，见下文）                                      | 否       | -                   |
| `configSchema`            | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否       | 空对象 schema       |
| `reload`                  | `OpenClawPluginReloadRegistration`                               | 否       | -                   |
| `nodeHostCommands`        | `OpenClawPluginNodeHostCommand[]`                                | 否       | -                   |
| `securityAuditCollectors` | `OpenClawPluginSecurityAuditCollector[]`                         | 否       | -                   |
| `register`                | `(api: OpenClawPluginApi) => void`                               | 是       | -                   |

- `id` 必须与你的 `openclaw.plugin.json` 清单匹配。
- 外部会话目录使用
  `openclaw/plugin-sdk/session-catalog` 和
  `api.registerSessionCatalog({ id, label, list, read, continueSession?, archive? })`。
  核心拥有 `sessions.catalog.*` Gateway 网关方法；提供商返回主机、
  会话和规范化的记录投影，而无需注册 RPC。
- `kind` 已弃用：请改为在 `openclaw.plugin.json` 清单的 `kind` 字段中声明互斥槽位（`"memory"` 或
  `"context-engine"`）。
  运行时入口的 `kind` 仅作为旧版插件的兼容回退保留。
- `configSchema` 可以是用于惰性求值的函数。OpenClaw 会在首次访问时解析并
  记忆该 schema，因此开销较大的 schema 构建器只会运行
  一次。
- `nodeHostCommands` 描述符可以定义 `isAvailable({ config, env })`。
  返回 `false` 会从无头节点的 Gateway 网关声明中省略该命令及其能力。
  OpenClaw 会根据节点本地的启动配置对其求值；命令处理程序在
  被调用时仍应验证可用性。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

使用渠道专用接线封装 `definePluginEntry`：它会自动
调用 `api.registerChannel({ plugin })`，公开可选的根帮助 CLI
元数据接缝，并根据注册模式控制 `registerFull`。

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

| 字段                  | 类型                                                             | 必需     | 默认值              |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | 是       | -                   |
| `name`                | `string`                                                         | 是       | -                   |
| `description`         | `string`                                                         | 是       | -                   |
| `plugin`              | `ChannelPlugin`                                                  | 是       | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否       | 空对象 schema       |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否       | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否       | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否       | -                   |

回调会根据注册模式运行（完整表格见
[注册模式](#registration-mode)）：

- `setRuntime` 会在除 `"cli-metadata"` 和
  `"tool-discovery"` 之外的所有模式下运行。请在此处存储运行时引用，通常通过
  `createPluginRuntimeStore` 完成。
- `registerCliMetadata` 会为 `"cli-metadata"`、`"discovery"` 和
  `"full"` 运行。将其用作渠道自有 CLI 描述符的规范位置，
  这样根帮助不会激活插件、发现快照会包含静态
  命令元数据，并且普通 CLI 注册仍与完整
  插件加载兼容。
- `registerFull` 仅为 `"full"` 和 `"tool-discovery"` 运行。对于
  `"tool-discovery"`，它会_代替_渠道注册运行：OpenClaw
  会完全跳过 `registerChannel`/`setRuntime`，并且只调用
  `registerFull`，因此渠道在独立工具发现或执行时需要的任何提供商/工具注册
  都必须放在此处，而不能隐藏在普通
  渠道设置之后。
- 发现注册不会激活插件，但并非无需导入：OpenClaw 可能会
  对受信任的插件入口和渠道插件模块求值以构建
  快照。请确保顶层导入无副作用，并将套接字、
  客户端、工作进程和服务放在仅由 `"full"` 使用的路径中。
- 与 `definePluginEntry` 类似，`configSchema` 可以是惰性工厂；OpenClaw
  会在首次访问时记忆解析后的 schema。

CLI 注册：

- 对于希望惰性加载且不会从根 CLI
  解析树中消失的插件自有根 CLI 命令，请使用 `api.registerCli(..., { descriptors: [...] })`。描述符名称必须仅包含字母、数字、连字符和
  下划线，并以字母或数字开头；OpenClaw 会拒绝其他
  形式，并在呈现帮助前从描述中移除终端控制序列。
  请覆盖注册器公开的每个顶层命令根。
  仅使用 `commands` 时仍会采用预加载兼容路径。
- 对于配对节点的功能命令，请使用 `api.registerNodeCliFeature(...)`，使其
  归入 `openclaw nodes`（等同于
  `registerCli(registrar, { parentPath: ["nodes"], ... })`）。
- 对于其他嵌套插件命令，请添加 `parentPath`，并在传给注册器的
  `program` 对象上注册命令；OpenClaw 会先将其解析为
  父命令，再调用插件。
- 对于渠道插件，请从 `registerCliMetadata` 注册 CLI 描述符，
  并让 `registerFull` 专注于仅限运行时的工作。
- 如果 `registerFull` 还注册 Gateway 网关 RPC 方法，请为它们使用
  插件专用前缀。保留的核心管理命名空间（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）始终会被强制转换为
  `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

适用于轻量级 `setup-entry.ts` 文件。仅返回 `{ plugin }`，不包含
运行时或 CLI 接线。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw 会在渠道被禁用、未配置或启用延迟加载时加载此入口，而不是完整入口。有关此机制何时会产生影响，请参阅
[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry)。

将 `defineSetupPluginEntry(...)` 与范围明确的设置辅助函数系列配合使用：

| 导入                                | 用途                                                                                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/setup-runtime` | 运行时安全的设置辅助函数：`createSetupTranslator`、可安全导入的设置补丁适配器、查找说明输出、`promptResolvedAllowFrom`、`splitSetupEntries`、委托式设置代理 |
| `openclaw/plugin-sdk/channel-setup` | 可选安装的设置界面                                                                                                                                                                  |
| `openclaw/plugin-sdk/setup-tools`   | 设置/安装 CLI、归档和文档辅助函数                                                                                                                                                   |

将大型 SDK、CLI 注册和长生命周期运行时服务保留在完整入口中。

拆分设置与运行时界面的内置工作区渠道可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。它使设置入口能够保留设置安全的插件/密钥导出，同时仍公开运行时设置函数：

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
        /* 设置安全的路由 */
      },
    });
  },
});
```

仅当设置流程在完整渠道入口加载前确实需要轻量级运行时设置函数或设置安全的 Gateway 网关界面时，才使用此方式。
`registerSetupRuntime` 仅在 `"setup-runtime"` 加载时运行；应将其限制为仅涉及配置的路由或必须在延迟完整激活前存在的方法。

## 注册模式

`api.registrationMode` 会告知插件其加载方式：

| 模式               | 使用时机                                           | 注册内容                                                                                                                |
| ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`           | Gateway 网关正常启动                             | 所有内容                                                                                                                |
| `"discovery"`      | 只读能力发现                                     | 渠道注册和静态 CLI 描述符；入口代码可以加载，但应跳过套接字、工作节点、客户端和服务                                     |
| `"tool-discovery"` | 通过限定范围的加载列出或运行特定插件的工具         | 仅注册能力/工具；不激活渠道                                                                                             |
| `"setup-only"`     | 渠道已禁用或未配置                               | 仅注册渠道                                                                                                              |
| `"setup-runtime"`  | 运行时可用的设置流程                               | 注册渠道，并且仅注册完整入口加载前所需的轻量级运行时                                                                     |
| `"cli-metadata"`   | 根帮助/CLI 元数据捕获                              | 仅注册 CLI 描述符                                                                                                       |

`defineChannelPluginEntry` 会自动处理这种拆分。如果直接将
`definePluginEntry` 用于渠道，请自行检查模式，并注意
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
    // 仅注册能力界面（提供商/工具），不注册渠道。
    return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 仅限大型运行时的注册
  api.registerService(/* ... */);
}
```

长生命周期服务可以通过其服务上下文发出小型失效或生命周期事件：

```typescript
api.registerService({
  id: "index-events",
  start(ctx) {
    ctx.gatewayEvents?.emit("changed", { revision: 1 }, { scope: "operator.read" });
  },
});
```

OpenClaw 会将其命名空间设为 `plugin.<plugin-id>.changed`。事件名称只能包含一个小写片段，载荷必须是大小受限的 JSON，并且权限范围必须是
`operator.read`、`operator.write` 或 `operator.admin`。发射器仅在服务生命周期内存在，并会在服务停止或启动失败后被撤销。应优先使用版本或失效载荷，而非完整记录，以便获得授权的客户端通过插件限定范围的 Gateway 网关方法重新读取规范状态。

发现模式会构建一个不会激活插件的注册表快照。它仍可能执行插件入口和渠道插件对象，以便 OpenClaw 注册渠道能力和静态 CLI 描述符。应将发现期间的模块执行视为可信但轻量的操作：顶层不得创建网络客户端、子进程、监听器、数据库连接、后台工作节点，不得读取凭据，也不得产生其他实时运行时副作用。

应将 `"setup-runtime"` 视为一个时间窗口：在此期间，仅用于设置的启动界面必须存在，且不会重新进入完整的内置渠道运行时。适合放在此处的内容包括渠道注册、设置安全的 HTTP 路由、设置安全的 Gateway 网关方法和委托式设置辅助函数。大型后台服务、CLI 注册器和提供商/客户端 SDK 引导逻辑仍应放在 `"full"` 中。

## 插件形态

OpenClaw 根据已加载插件的注册行为对其进行分类：

| 形态                  | 描述                                      |
| --------------------- | ----------------------------------------- |
| **plain-capability**  | 一种能力类型（例如仅提供商）              |
| **hybrid-capability** | 多种能力类型（例如提供商 + 语音）         |
| **hook-only**         | 仅有钩子，没有能力                        |
| **non-capability**    | 包含工具/命令/服务，但没有能力             |

使用 `openclaw plugins inspect <id>` 查看插件的形态。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) - 注册 API 和子路径参考
- [运行时辅助函数](/zh-CN/plugins/sdk-runtime) - `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/zh-CN/plugins/sdk-setup) - 清单、设置入口和延迟加载
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建 `ChannelPlugin` 对象
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 提供商注册和钩子
