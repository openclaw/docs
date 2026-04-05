---
read_when:
    - 你需要 `definePluginEntry` 或 `defineChannelPluginEntry` 的精确类型签名
    - 你想了解注册模式（full 与 setup 与 CLI metadata）
    - 你正在查找入口点选项
sidebarTitle: Entry Points
summary: '`definePluginEntry`、`defineChannelPluginEntry` 和 `defineSetupPluginEntry` 的参考'
title: 插件入口点
x-i18n:
    generated_at: "2026-04-05T08:39:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# 插件入口点

每个插件都会导出一个默认入口对象。SDK 提供了三个辅助函数来
创建它们。

<Tip>
  **在找演练指南？** 请参见 [渠道插件](/plugins/sdk-channel-plugins)
  或 [提供商插件](/plugins/sdk-provider-plugins) 获取分步指南。
</Tip>

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

用于提供商插件、工具插件、hook 插件，以及任何**不属于**
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

| 字段           | 类型                                                             | 必填 | 默认值              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 是   | —                   |
| `name`         | `string`                                                         | 是   | —                   |
| `description`  | `string`                                                         | 是   | —                   |
| `kind`         | `string`                                                         | 否   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 schema       |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | —                   |

- `id` 必须与你的 `openclaw.plugin.json` 清单一致。
- `kind` 用于独占槽位：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是一个用于惰性求值的函数。
- OpenClaw 会在首次访问时解析并缓存该 schema，因此高开销的 schema
  构建器只会运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

使用渠道专属接线封装 `definePluginEntry`。它会自动调用
`api.registerChannel({ plugin })`，暴露一个可选的根帮助 CLI metadata
边界，并根据注册模式控制 `registerFull`。

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

| 字段                  | 类型                                                             | 必填 | 默认值              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 是   | —                   |
| `name`                | `string`                                                         | 是   | —                   |
| `description`         | `string`                                                         | 是   | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 是   | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 schema       |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |

- `setRuntime` 会在注册期间调用，以便你保存 runtime 引用
  （通常通过 `createPluginRuntimeStore`）。在 CLI metadata
  捕获期间会跳过它。
- `registerCliMetadata` 会在 `api.registrationMode === "cli-metadata"`
  和 `api.registrationMode === "full"` 两种情况下运行。
  请将其作为渠道自有 CLI 描述符的规范位置，以便根帮助
  保持非激活，同时常规 CLI 命令注册仍与完整插件加载兼容。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在
  setup-only 加载期间会跳过。
- 与 `definePluginEntry` 一样，`configSchema` 也可以是惰性工厂，而 OpenClaw
  会在首次访问时缓存解析后的 schema。
- 对于插件自有的根 CLI 命令，当你希望命令保持惰性加载且不从
  根 CLI 解析树中消失时，请优先使用 `api.registerCli(..., { descriptors: [...] })`。
  对于渠道插件，请优先在 `registerCliMetadata(...)` 中注册这些描述符，
  并让 `registerFull(...)` 专注于仅运行时工作。
- 如果 `registerFull(...)` 也注册 gateway RPC 方法，请将它们保留在
  插件专属前缀下。保留的核心管理命名空间（`config.*`、
  `exec.approvals.*`、`wizard.*`、`update.*`）始终会被强制解析为
  `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用于轻量级 `setup-entry.ts` 文件。仅返回 `{ plugin }`，不包含
runtime 或 CLI 接线。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当某个渠道被禁用、未配置，或启用了延迟加载时，OpenClaw 会加载它而不是完整入口。
关于何时会发生这种情况，请参见
[设置和配置](/plugins/sdk-setup#setup-entry)。

在实践中，请将 `defineSetupPluginEntry(...)` 与以下窄范围设置辅助函数
家族配合使用：

- `openclaw/plugin-sdk/setup-runtime`：用于运行时安全的设置辅助函数，例如
  导入安全的设置补丁适配器、lookup-note 输出、
  `promptResolvedAllowFrom`、`splitSetupEntries` 和委托式设置代理
- `openclaw/plugin-sdk/channel-setup`：用于可选安装的设置界面
- `openclaw/plugin-sdk/setup-tools`：用于设置 / 安装 CLI / 归档 / 文档辅助函数

请将重量级 SDK、CLI 注册和长生命周期运行时服务保留在完整
入口中。

## 注册模式

`api.registrationMode` 会告诉你的插件它是如何被加载的：

| 模式               | 时机                              | 应注册的内容                                                                    |
| ------------------ | --------------------------------- | ------------------------------------------------------------------------------- |
| `"full"`           | 正常 Gateway 网关启动             | 所有内容                                                                        |
| `"setup-only"`     | 已禁用 / 未配置的渠道             | 仅渠道注册                                                                      |
| `"setup-runtime"`  | 设置流程且 runtime 可用           | 渠道注册，以及完整入口加载前所需的轻量运行时                                    |
| `"cli-metadata"`   | 根帮助 / CLI metadata 捕获        | 仅 CLI 描述符                                                                   |

`defineChannelPluginEntry` 会自动处理这一拆分。如果你直接将
`definePluginEntry` 用于渠道，请自行检查模式：

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

请将 `"setup-runtime"` 视为这样一个阶段：仅设置启动界面必须
存在，但不能重新进入完整的内置渠道运行时。适合放在这里的有：
渠道注册、设置安全的 HTTP 路由、设置安全的 gateway 方法，以及
委托式设置辅助函数。重量级后台服务、CLI 注册器以及
提供商 / 客户端 SDK 引导仍然应归入 `"full"`。

对于 CLI 注册器，尤其要注意：

- 当注册器拥有一个或多个根命令，并且你
  希望 OpenClaw 在首次调用时再惰性加载真实 CLI 模块时，请使用 `descriptors`
- 确保这些描述符覆盖注册器暴露的每个顶级命令根
- 仅在急切兼容路径中使用单独的 `commands`

## 插件形态

OpenClaw 会根据已加载插件的注册行为对其进行分类：

| 形态                  | 说明                                         |
| --------------------- | -------------------------------------------- |
| **plain-capability**  | 单一能力类型（例如仅提供商）                 |
| **hybrid-capability** | 多种能力类型（例如提供商 + 语音）            |
| **hook-only**         | 仅 hooks，无能力                             |
| **non-capability**    | 有工具 / 命令 / 服务，但无能力               |

使用 `openclaw plugins inspect <id>` 可查看插件的形态。

## 相关内容

- [SDK 概览](/plugins/sdk-overview) — 注册 API 和子路径参考
- [运行时辅助函数](/plugins/sdk-runtime) — `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/plugins/sdk-setup) — 清单、设置入口、延迟加载
- [渠道插件](/plugins/sdk-channel-plugins) — 构建 `ChannelPlugin` 对象
- [提供商插件](/plugins/sdk-provider-plugins) — 提供商注册和 hooks
