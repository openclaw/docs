---
read_when:
    - 你需要 `definePluginEntry` 或 `defineChannelPluginEntry` 的确切类型签名
    - 你想了解注册模式（完整、设置或 CLI 元数据）
    - 你正在查找入口点选项
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的参考
title: 插件入口点
x-i18n:
    generated_at: "2026-04-21T22:19:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 304501849aa835b775f9b7b85c507aaeb532f90bf6473d7644f0e41144d9a914
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# 插件入口点

每个插件都会导出一个默认入口对象。SDK 提供了三个辅助函数来创建它们。

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

`extensions` 和 `setupEntry` 仍然是用于工作区和 git 检出开发的有效源码入口。`runtimeExtensions` 和 `runtimeSetupEntry` 在 OpenClaw 加载已安装的软件包时会被优先使用，并让 npm 软件包避免在运行时编译 TypeScript。如果已安装的软件包只声明了 TypeScript 源码入口，OpenClaw 会在存在匹配的已构建 `dist/*.js` 对应文件时优先使用它，否则回退到 TypeScript 源码。

<Tip>
  **在寻找操作演练吗？** 请参阅 [渠道插件](/zh-CN/plugins/sdk-channel-plugins) 或 [提供商插件](/zh-CN/plugins/sdk-provider-plugins) 获取分步指南。
</Tip>

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

用于提供商插件、工具插件、hook 插件，以及任何**不是**消息渠道的插件。

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

| 字段 | 类型 | 必填 | 默认值 |
| -------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`           | `string`                                                         | 是       | —                   |
| `name`         | `string`                                                         | 是       | —                   |
| `description`  | `string`                                                         | 是       | —                   |
| `kind`         | `string`                                                         | 否       | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否       | 空对象 schema |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是       | —                   |

- `id` 必须与你的 `openclaw.plugin.json` 清单匹配。
- `kind` 用于排他槽位：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是一个用于惰性求值的函数。
- OpenClaw 会在首次访问时解析并记忆该 schema，因此开销较大的 schema 构建器只会运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用渠道专用接线对 `definePluginEntry` 进行封装。会自动调用 `api.registerChannel({ plugin })`，暴露一个可选的根帮助 CLI 元数据接缝，并根据注册模式控制 `registerFull`。

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

| 字段 | 类型 | 必填 | 默认值 |
| --------------------- | ---------------------------------------------------------------- | -------- | ------------------- |
| `id`                  | `string`                                                         | 是       | —                   |
| `name`                | `string`                                                         | 是       | —                   |
| `description`         | `string`                                                         | 是       | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 是       | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否       | 空对象 schema |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否       | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否       | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否       | —                   |

- `setRuntime` 会在注册期间被调用，这样你就可以存储运行时引用（通常通过 `createPluginRuntimeStore`）。在 CLI 元数据捕获期间会跳过它。
- `registerCliMetadata` 会在 `api.registrationMode === "cli-metadata"` 和 `api.registrationMode === "full"` 两种情况下运行。
  将它用作渠道自有 CLI 描述符的规范位置，这样根帮助就能保持非激活状态，同时普通 CLI 命令注册仍然与完整插件加载兼容。
- `registerFull` 只会在 `api.registrationMode === "full"` 时运行。在仅设置加载期间会跳过它。
- 与 `definePluginEntry` 一样，`configSchema` 可以是惰性工厂，OpenClaw 会在首次访问时记忆已解析的 schema。
- 对于插件自有的根 CLI 命令，如果你希望命令保持惰性加载，同时又不从根 CLI 解析树中消失，请优先使用 `api.registerCli(..., { descriptors: [...] })`。
  对于渠道插件，优先从 `registerCliMetadata(...)` 注册这些描述符，并让 `registerFull(...)` 专注于仅运行时工作。
- 如果 `registerFull(...)` 还会注册 Gateway 网关 RPC 方法，请将它们保留在插件专属前缀下。保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终会被强制为 `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用于轻量级的 `setup-entry.ts` 文件。只返回 `{ plugin }`，不包含运行时或 CLI 接线。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当渠道被禁用、未配置，或启用了延迟加载时，OpenClaw 会加载这个入口而不是完整入口。关于何时这点很重要，请参阅 [设置](/zh-CN/plugins/sdk-setup#setup-entry)。

在实践中，将 `defineSetupPluginEntry(...)` 与更窄的设置辅助函数族搭配使用：

- `openclaw/plugin-sdk/setup-runtime`，用于运行时安全的设置辅助函数，例如导入安全的设置补丁适配器、查找说明输出、`promptResolvedAllowFrom`、`splitSetupEntries` 和委托设置代理
- `openclaw/plugin-sdk/channel-setup`，用于可选安装的设置表面
- `openclaw/plugin-sdk/setup-tools`，用于设置/安装 CLI/归档/文档辅助函数

将重量级 SDK、CLI 注册以及长生命周期运行时服务保留在完整入口中。

拆分设置与运行时表面的内置工作区渠道可以改用来自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`。这个契约允许设置入口在仍暴露运行时 setter 的同时，保留设置安全的 plugin/secrets 导出：

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

仅当设置流程确实需要在完整渠道入口加载之前使用轻量级运行时 setter 时，才使用这个内置契约。

## 注册模式

`api.registrationMode` 会告诉你的插件它是如何被加载的：

| 模式 | 时机 | 应注册的内容 |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | 正常 Gateway 网关 启动            | 所有内容 |
| `"setup-only"`    | 已禁用/未配置的渠道     | 仅渠道注册 |
| `"setup-runtime"` | 设置流程中运行时可用 | 渠道注册，以及仅在完整入口加载前所需的轻量级运行时 |
| `"cli-metadata"`  | 根帮助 / CLI 元数据捕获  | 仅 CLI 描述符 |

`defineChannelPluginEntry` 会自动处理这种拆分。如果你直接对渠道使用 `definePluginEntry`，请自行检查模式：

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

将 `"setup-runtime"` 视为这样一个窗口：仅设置启动表面必须存在，但又不能重新进入完整的内置渠道运行时。适合放在这里的内容包括渠道注册、设置安全的 HTTP 路由、设置安全的 Gateway 网关 方法，以及委托设置辅助函数。重量级后台服务、CLI 注册器和 provider/client SDK 引导仍应属于 `"full"`。

对于 CLI 注册器，尤其如此：

- 当注册器拥有一个或多个根命令，并且你希望 OpenClaw 在首次调用时再惰性加载真实 CLI 模块时，请使用 `descriptors`
- 确保这些描述符覆盖该注册器暴露的每个顶层命令根
- 仅在急切兼容路径中单独使用 `commands`

## 插件形态

OpenClaw 会根据已加载插件的注册行为对其进行分类：

| 形态 | 说明 |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 单一能力类型（例如仅 provider） |
| **hybrid-capability** | 多种能力类型（例如 provider + speech） |
| **hook-only**         | 只有 hook，没有能力 |
| **non-capability**    | 工具/命令/服务，但没有能力 |

使用 `openclaw plugins inspect <id>` 查看插件的形态。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-overview) — 注册 API 和子路径参考
- [运行时辅助函数](/zh-CN/plugins/sdk-runtime) — `api.runtime` 和 `createPluginRuntimeStore`
- [设置](/zh-CN/plugins/sdk-setup) — 清单、设置入口、延迟加载
- [渠道插件](/zh-CN/plugins/sdk-channel-plugins) — 构建 `ChannelPlugin` 对象
- [提供商插件](/zh-CN/plugins/sdk-provider-plugins) — provider 注册和 hook
