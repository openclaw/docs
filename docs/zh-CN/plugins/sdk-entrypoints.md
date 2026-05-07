---
read_when:
    - 你需要 definePluginEntry 或 defineChannelPluginEntry 的精确类型签名
    - 你想了解注册模式（完整模式、设置模式与 CLI 元数据）
    - 你正在查找入口点选项
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 参考
title: 插件入口点
x-i18n:
    generated_at: "2026-05-07T13:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fecc65b8f196f3b40daee2e6087759b8786b033e1cd0c3d3b5695c9f8a3f66a
    source_path: plugins/sdk-entrypoints.md
    workflow: 16
---

每个插件都会导出一个默认入口对象。SDK 提供三个用于创建它们的辅助函数。

对于已安装的插件，`package.json` 应在可用时将运行时加载指向构建后的 JavaScript：

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

`extensions` 和 `setupEntry` 仍是用于工作区和 git 检出开发的有效源入口。当 OpenClaw 加载已安装的软件包时，优先使用 `runtimeExtensions` 和 `runtimeSetupEntry`，并允许 npm 软件包避免运行时 TypeScript 编译。显式运行时入口是必需的：`runtimeSetupEntry` 需要 `setupEntry`，缺失的 `runtimeExtensions` 或 `runtimeSetupEntry` 构件会导致安装/发现失败，而不是静默回退到源代码。如果已安装的软件包只声明 TypeScript 源入口，OpenClaw 会在存在匹配的构建后 `dist/*.js` 对等文件时使用它，然后再回退到 TypeScript 源代码。

所有入口路径都必须保持在插件软件包目录内。运行时入口和推断出的构建后 JavaScript 对等文件，并不会让逃逸到包外的 `extensions` 或 `setupEntry` 源路径变得有效。

<Tip>
  **想要查看分步演练？** 请参阅 [渠道插件](/zh-CN/plugins/sdk-channel-plugins)
  或 [提供商插件](/zh-CN/plugins/sdk-provider-plugins) 获取分步指南。
</Tip>

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

适用于提供商插件、工具插件、钩子插件，以及任何**不是**
消息渠道的插件。

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

| 字段           | 类型                                                             | 必填 | 默认值          |
| -------------- | ---------------------------------------------------------------- | ---- | --------------- |
| `id`           | `string`                                                         | 是   | -               |
| `name`         | `string`                                                         | 是   | -               |
| `description`  | `string`                                                         | 是   | -               |
| `kind`         | `string`                                                         | 否   | -               |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 schema   |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | -               |

- `id` 必须与你的 `openclaw.plugin.json` 清单匹配。
- `kind` 用于独占槽位：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是一个函数，用于惰性求值。
- OpenClaw 会在首次访问时解析并记忆该 schema，因此昂贵的 schema
  构建器只会运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用渠道专用接线包装 `definePluginEntry`。自动调用
`api.registerChannel({ plugin })`，暴露可选的根帮助 CLI 元数据
seam，并根据注册模式门控 `registerFull`。

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

| 字段                  | 类型                                                             | 必填 | 默认值          |
| --------------------- | ---------------------------------------------------------------- | ---- | --------------- |
| `id`                  | `string`                                                         | 是   | -               |
| `name`                | `string`                                                         | 是   | -               |
| `description`         | `string`                                                         | 是   | -               |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -               |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 schema   |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -               |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -               |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -               |

- `setRuntime` 会在注册期间被调用，因此你可以存储运行时引用
  （通常通过 `createPluginRuntimeStore`）。在 CLI 元数据捕获期间会跳过它。
- `registerCliMetadata` 会在 `api.registrationMode === "cli-metadata"`、
  `api.registrationMode === "discovery"` 和
  `api.registrationMode === "full"` 期间运行。
  将它作为渠道自有 CLI 描述符的规范位置，使根帮助保持非激活，发现快照包含静态命令元数据，并且普通 CLI 命令注册仍与完整插件加载兼容。
- 发现注册是非激活的，但不是免导入的。OpenClaw 可能会
  求值受信任的插件入口和渠道插件模块来构建
  快照，因此请保持顶层导入无副作用，并将套接字、
  客户端、worker 和服务放在仅限 `"full"` 的路径之后。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在仅设置加载期间会跳过它。
- 与 `definePluginEntry` 一样，`configSchema` 可以是惰性工厂，OpenClaw
  会在首次访问时记忆已解析的 schema。
- 对于插件自有的根 CLI 命令，如果你希望命令保持惰性加载且不从
  根 CLI 解析树中消失，优先使用 `api.registerCli(..., { descriptors: [...] })`。
  对于成对节点功能命令，优先使用
  `api.registerNodeCliFeature(...)`，使命令落在 `openclaw nodes` 下。
  对于其他嵌套插件命令，添加 `parentPath` 并在传给注册器的
  `program` 对象上注册命令；OpenClaw 会在调用插件前将它解析到
  父命令。对于渠道插件，优先从 `registerCliMetadata(...)` 注册
  这些描述符，并让 `registerFull(...)` 专注于仅运行时工作。
- 如果 `registerFull(...)` 也注册 Gateway 网关 RPC 方法，请将它们放在
  插件专用前缀下。保留的核心管理员命名空间（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）始终会被强制为
  `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

适用于轻量级的 `setup-entry.ts` 文件。仅返回 `{ plugin }`，没有
运行时或 CLI 接线。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当渠道被禁用、未配置，或启用延迟加载时，OpenClaw 会加载它，而不是完整入口。请参阅
[设置和配置](/zh-CN/plugins/sdk-setup#setup-entry) 了解这何时重要。

实践中，请将 `defineSetupPluginEntry(...)` 与狭窄的设置辅助函数
系列配对：

- `openclaw/plugin-sdk/setup-runtime` 用于运行时安全的设置辅助函数，例如
  可安全导入的设置补丁适配器、lookup-note 输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 和委托设置代理
- `openclaw/plugin-sdk/channel-setup` 用于可选安装设置表面
- `openclaw/plugin-sdk/setup-tools` 用于设置/安装 CLI/归档/文档辅助函数

请将重型 SDK、CLI 注册和长生命周期运行时服务放在完整
入口中。

拆分设置和运行时表面的内置工作区渠道，可以改用
`openclaw/plugin-sdk/channel-entry-contract` 中的
`defineBundledChannelSetupEntry(...)`。该契约让
设置入口能够保留设置安全的插件/密钥导出，同时仍然暴露
运行时 setter：

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
});
```

只有当设置流程确实需要在完整渠道入口加载前使用轻量级运行时
setter 时，才使用该内置契约。

## 注册模式

`api.registrationMode` 会告诉你的插件它是如何被加载的：

| 模式              | 何时                              | 要注册的内容                                                                                                            |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 正常 Gateway 网关启动             | 全部                                                                                                                    |
| `"discovery"`     | 只读能力发现                      | 渠道注册加静态 CLI 描述符；入口代码可能会加载，但跳过套接字、worker、客户端和服务 |
| `"setup-only"`    | 已禁用/未配置的渠道               | 仅渠道注册                                                                                                              |
| `"setup-runtime"` | 有运行时可用的设置流程            | 渠道注册加完整入口加载前所需的轻量级运行时                                                                              |
| `"cli-metadata"`  | 根帮助 / CLI 元数据捕获           | 仅 CLI 描述符                                                                                                           |

`defineChannelPluginEntry` 会自动处理这种拆分。如果你直接对渠道使用
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

发现模式会构建一个非激活的注册表快照。它仍可能求值
插件入口和渠道插件对象，以便 OpenClaw 注册渠道
能力和静态 CLI 描述符。请将发现中的模块求值视为
受信任但轻量：顶层不得有网络客户端、子进程、监听器、数据库
连接、后台 worker、凭证读取或其他实时运行时副作用。

将 `"setup-runtime"` 视为这样一个窗口：仅设置启动表面必须
存在，同时不重新进入完整内置渠道运行时。合适的内容包括
渠道注册、设置安全的 HTTP 路由、设置安全的 Gateway 网关方法，以及
委托设置辅助函数。重型后台服务、CLI 注册器和
提供商/客户端 SDK 引导仍属于 `"full"`。

对于 CLI 注册器，具体来说：

- 当注册器拥有一个或多个根命令，并且你希望 OpenClaw 在首次调用时懒加载真正的 CLI 模块，请使用 `descriptors`
- 确保这些描述符覆盖注册器暴露的每个顶层命令根
- 将描述符命令名称限制为字母、数字、连字符和下划线，并以字母或数字开头；OpenClaw 会拒绝不符合该格式的描述符名称，并在渲染帮助前从说明中移除终端控制序列
- 仅在急切加载的兼容路径中单独使用 `commands`

## 插件形态

OpenClaw 会按已加载插件的注册行为对其分类：

| 形态                  | 说明                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一种能力类型（例如仅提供商）                       |
| **hybrid-capability** | 多种能力类型（例如提供商 + 语音）                  |
| **hook-only**         | 只有钩子，没有能力                                 |
| **non-capability**    | 工具/命令/服务，但没有能力                         |

使用 `openclaw plugins inspect <id>` 查看插件的形态。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) - 注册 API 和子路径参考
- [运行时辅助工具](/zh-CN/plugins/sdk-runtime) - `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/zh-CN/plugins/sdk-setup) - 清单、设置入口、延迟加载
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) - 构建 `ChannelPlugin` 对象
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) - 提供商注册和钩子
