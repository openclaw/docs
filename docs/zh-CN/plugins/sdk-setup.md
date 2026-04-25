---
read_when:
    - 你正在为插件添加一个设置向导
    - 你需要了解 `setup-entry.ts` 与 `index.ts` 的区别
    - 你正在定义插件配置 schema 或 `package.json` 中的 openclaw 元数据
sidebarTitle: Setup and Config
summary: 设置向导、setup-entry.ts、配置 schema 和 package.json 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-04-25T05:55:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 487cff34e0f9ae307a7c920dfc3cb0a8bbf2cac5e137abd8be4d1fbed19200ca
    source_path: plugins/sdk-setup.md
    workflow: 15
---

插件打包（`package.json` 元数据）、清单
（`openclaw.plugin.json`）、设置入口和配置 schema 的参考文档。

<Tip>
  **想看操作指南？** 操作型指南会在上下文中介绍打包：
  [渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要一个 `openclaw` 字段，用来告诉插件系统
你的插件提供了什么：

**渠道插件：**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**提供商插件 / ClawHub 发布基线：**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

如果你要将插件作为外部包发布到 ClawHub，这些 `compat` 和 `build`
字段是必填的。规范的发布片段位于
`docs/snippets/plugin-publish/`。

### `openclaw` 字段

| 字段 | 类型 | 说明 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 入口点文件（相对于包根目录） |
| `setupEntry` | `string`   | 仅用于设置的轻量级入口（可选） |
| `channel`    | `object`   | 用于设置、选择器、快速开始和 Status 界面的渠道目录元数据 |
| `providers`  | `string[]` | 该插件注册的 provider ID |
| `install`    | `object`   | 安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery` |
| `startup`    | `object`   | 启动行为标志 |

### `openclaw.channel`

`openclaw.channel` 是轻量级包元数据，用于在运行时加载之前进行渠道发现和设置
界面展示。

| 字段 | 类型 | 含义 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 规范渠道 ID。 |
| `label`                                | `string`   | 主渠道标签。 |
| `selectionLabel`                       | `string`   | 当需要与 `label` 不同时，用于选择器/设置的标签。 |
| `detailLabel`                          | `string`   | 用于更丰富渠道目录和 Status 界面的次级详情标签。 |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。 |
| `docsLabel`                            | `string`   | 当文档链接标签需要与渠道 ID 不同时，使用该覆盖标签。 |
| `blurb`                                | `string`   | 简短的新手引导/目录说明。 |
| `order`                                | `number`   | 在渠道目录中的排序顺序。 |
| `aliases`                              | `string[]` | 渠道选择的额外查找别名。 |
| `preferOver`                           | `string[]` | 该渠道应优先于的低优先级插件/渠道 ID。 |
| `systemImage`                          | `string`   | 用于渠道 UI 目录的可选图标/system-image 名称。 |
| `selectionDocsPrefix`                  | `string`   | 在选择界面中文档链接前显示的前缀文本。 |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是带标签的文档链接。 |
| `selectionExtras`                      | `string[]` | 附加到选择文案中的额外短字符串。 |
| `markdownCapable`                      | `boolean`  | 将该渠道标记为支持 Markdown，以供出站格式化决策使用。 |
| `exposure`                             | `object`   | 控制渠道在设置、已配置列表和文档界面中的可见性。 |
| `quickstartAllowFrom`                  | `boolean`  | 允许该渠道使用标准快速开始 `allowFrom` 设置流程。 |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一个账户，也要求显式账户绑定。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 为该渠道解析公告目标时，优先使用会话查找。 |

示例：

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` 支持：

- `configured`：在已配置/Status 风格的列表界面中包含该渠道
- `setup`：在交互式设置/配置选择器中包含该渠道
- `docs`：将该渠道标记为面向公开的文档/导航界面内容

`showConfigured` 和 `showInSetup` 仍作为旧版别名受支持。推荐使用
`exposure`。

### `openclaw.install`

`openclaw.install` 是包元数据，不是清单元数据。

| 字段 | 类型 | 含义 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 安装/更新流程中使用的规范 npm spec。 |
| `localPath`                  | `string`             | 本地开发或内置安装路径。 |
| `defaultChoice`              | `"npm"` \| `"local"` | 当两者都可用时，优先的安装来源。 |
| `minHostVersion`             | `string`             | 最低支持的 OpenClaw 版本，格式为 `>=x.y.z`。 |
| `expectedIntegrity`          | `string`             | 预期的 npm dist integrity 字符串，通常为 `sha512-...`，用于固定版本安装。 |
| `allowInvalidConfigRecovery` | `boolean`            | 允许内置插件重装流程恢复某些特定的陈旧配置故障。 |

交互式新手引导也会使用 `openclaw.install` 来支持按需安装
界面。如果你的插件在运行时加载前就暴露 provider 认证选项或渠道设置/目录
元数据，新手引导就可以显示该选项，提示选择 npm 还是本地安装，
安装或启用插件，然后继续所选流程。Npm 新手引导选项需要受信任的目录元数据，
并带有 registry `npmSpec`；精确版本和 `expectedIntegrity` 是可选的固定项。如果
存在 `expectedIntegrity`，安装/更新流程会强制校验它。请将“显示什么”
元数据保留在 `openclaw.plugin.json` 中，而“如何安装”
元数据保留在 `package.json` 中。

如果设置了 `minHostVersion`，安装和清单注册表加载都会强制执行它。
旧版本宿主会跳过该插件；无效的版本字符串会被拒绝。

对于固定版本的 npm 安装，请在 `npmSpec` 中保留精确版本，并添加
预期制品完整性值：

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` 不是针对损坏配置的通用绕过开关。它
仅用于狭义的内置插件恢复场景，这样重装/设置就可以修复已知的升级遗留问题，
例如缺失的内置插件路径，或同一插件对应的陈旧 `channels.<id>`
条目。如果配置因无关原因损坏，安装
仍会默认失败关闭，并提示操作员运行 `openclaw doctor --fix`。

### 延迟完整加载

渠道插件可以通过以下配置选择延迟加载：

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

启用后，OpenClaw 在监听前启动阶段只会加载 `setupEntry`，即使是
已经配置好的渠道也是如此。完整入口会在 Gateway 网关开始监听后再加载。

<Warning>
  只有当你的 `setupEntry` 在 Gateway 网关开始监听前就注册了所需的一切内容时，
  才应启用延迟加载（渠道注册、HTTP 路由、Gateway 网关方法）。如果完整入口拥有必需的启动能力，请保留默认行为。
</Warning>

如果你的设置/完整入口注册了 Gateway 网关 RPC 方法，请将它们放在
插件专属前缀下。保留的核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍归核心所有，并始终解析
到 `operator.admin`。

## 插件清单

每个原生插件都必须在包根目录提供一个 `openclaw.plugin.json`。
OpenClaw 用它在不执行插件代码的情况下验证配置。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

对于渠道插件，请添加 `kind` 和 `channels`：

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

即使插件没有任何配置，也必须提供一个 schema。空 schema 也是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整 schema 参考请参见 [插件清单](/zh-CN/plugins/manifest)。

## ClawHub 发布

对于插件包，请使用包专用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧版仅 Skills 的发布别名是给 Skills 用的。插件包应当
始终使用 `clawhub package publish`。

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量级替代方案，
当 OpenClaw 只需要设置界面时（新手引导、配置修复、
已禁用渠道检查），会加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这可以避免在设置流程中加载重量级运行时代码（加密库、CLI 注册、
后台服务）。

如果内置工作区渠道将设置安全的导出放在侧车模块中，
可以使用
`openclaw/plugin-sdk/channel-entry-contract` 提供的
`defineBundledChannelSetupEntry(...)`，而不是
`defineSetupPluginEntry(...)`。

该内置契约还支持可选的
`runtime` 导出，以便让设置阶段的运行时接线保持轻量且显式。

**OpenClaw 在以下情况下会使用 `setupEntry`，而不是完整入口：**

- 渠道已禁用，但仍需要设置/新手引导界面
- 渠道已启用，但尚未配置
- 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**

- 渠道插件对象（通过 `defineSetupPluginEntry`）
- Gateway 网关监听前所需的任何 HTTP 路由
- 启动期间所需的任何 Gateway 网关方法

这些启动阶段的 Gateway 网关方法仍应避免使用保留的核心管理
命名空间，例如 `config.*` 或 `update.*`。

**`setupEntry` 不应包含的内容：**

- CLI 注册
- 后台服务
- 重量级运行时导入（加密、SDK）
- 仅在启动后才需要的 Gateway 网关方法

### 窄化的设置辅助导入

对于仅设置的热路径，若你只需要设置界面的一部分，
优先使用窄化的设置辅助接缝，而不是更宽泛的
`plugin-sdk/setup` 总入口：

| 导入路径 | 用途 | 关键导出 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟渠道启动中仍可用的设置期运行时辅助工具 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 具备环境感知能力的账户设置适配器 | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/归档/文档辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

当你需要完整的共享设置工具箱时，请使用更宽泛的
`plugin-sdk/setup` 接缝，其中包括配置补丁辅助函数，例如
`moveSingleAccountChannelSectionToDefaultAccount(...)`。

这些设置补丁适配器在导入时仍然是热路径安全的。它们内置的
单账户提升契约界面查找是惰性的，因此导入
`plugin-sdk/setup-runtime` 不会在适配器真正使用前，急切加载内置契约界面发现逻辑。

### 渠道自有的单账户提升

当某个渠道从单账户顶层配置升级为
`channels.<id>.accounts.*` 时，默认共享行为是将被提升的
账户级值移入 `accounts.default`。

内置渠道可以通过其设置契约界面缩小或覆盖这种提升行为：

- `singleAccountKeysToMove`：额外的顶层键，这些键应移入
  被提升的账户
- `namedAccountPromotionKeys`：当已存在命名账户时，只有这些
  键会移入被提升的账户；共享策略/投递键保留在渠道根部
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账户
  接收被提升的值

Matrix 是当前的内置示例。如果已经恰好存在一个命名的 Matrix 账户，
或者如果 `defaultAccount` 指向某个现有的非规范键，例如 `Ops`，
提升过程会保留该账户，而不是新建一个
`accounts.default` 条目。

## 配置 schema

插件配置会根据清单中的 JSON Schema 进行验证。用户通过以下方式配置插件：

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

在注册期间，你的插件会通过 `api.pluginConfig` 接收到这份配置。

对于渠道专属配置，请改用渠道配置节：

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### 构建渠道配置 schema

使用 `buildChannelConfigSchema` 将 Zod schema 转换为
插件自有配置制品所使用的 `ChannelConfigSchema` 包装器：

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

对于第三方插件，冷路径契约仍然是插件清单：
请将生成的 JSON Schema 镜像到 `openclaw.plugin.json#channelConfigs` 中，
这样配置 schema、设置和 UI 界面就可以在不加载运行时代码的情况下检查
`channels.<id>`。

## 设置向导

渠道插件可以为 `openclaw onboard` 提供交互式设置向导。
该向导是 `ChannelPlugin` 上的一个 `ChannelSetupWizard` 对象：

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等内容。
完整示例请参见内置插件包（例如 Discord 插件的 `src/channel.setup.ts`）。

对于只需要标准
`note -> prompt -> parse -> merge -> patch` 流程的私信允许列表提示，
优先使用 `openclaw/plugin-sdk/setup` 中的共享设置
辅助函数：`createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)` 和
`createNestedChannelParsedAllowFromPrompt(...)`。

对于只在标签、分数和可选额外行上变化的渠道设置 Status 区块，
优先使用 `openclaw/plugin-sdk/setup` 中的
`createStandardChannelSetupStatus(...)`，而不是在每个插件中手写相同的
`status` 对象。

对于仅应在特定上下文中出现的可选设置界面，请使用
`openclaw/plugin-sdk/channel-setup` 中的
`createOptionalChannelSetupSurface`：

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` 还暴露了更底层的
`createOptionalChannelSetupAdapter(...)` 和
`createOptionalChannelSetupWizard(...)` 构建器，以便在你只需要其中一半
可选安装界面时使用。

生成的可选适配器/向导在真实配置写入时会默认失败关闭。它们会在
`validateInput`、`applyAccountConfig` 和 `finalize` 之间复用同一条
“需要安装”的消息，并在设置了 `docsPath` 时附加文档链接。

对于基于二进制的设置 UI，请优先使用共享的委托辅助函数，而不是
在每个渠道中重复同样的二进制/Status 粘合逻辑：

- `createDetectedBinaryStatus(...)`：用于只在标签、
  提示、分数和二进制检测上变化的 Status 区块
- `createCliPathTextInput(...)`：用于基于路径的文本输入
- `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和
  `createDelegatedResolveConfigured(...)`：当 `setupEntry` 需要惰性转发到
  更重的完整向导时使用
- `createDelegatedTextInputShouldPrompt(...)`：当 `setupEntry` 只需要
  委托 `textInputs[*].shouldPrompt` 决策时使用

## 发布与安装

**外部插件：** 发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 会先尝试 ClawHub，失败后自动回退到 npm。你也可以显式强制使用 ClawHub：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # 仅 ClawHub
```

没有对应的 `npm:` 覆盖前缀。如果你想在 ClawHub 回退之后走 npm 路径，
请直接使用普通的 npm 包 spec：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**仓库内插件：** 放在内置插件工作区树下，即可在构建期间自动
发现。

**用户可执行安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
  对于来自 npm 的安装，`openclaw plugins install` 会运行
  `npm install --ignore-scripts`（不执行生命周期脚本）。请保持插件依赖
  树为纯 JS/TS，并避免使用需要 `postinstall` 构建的包。
</Info>

只有 OpenClaw 自有的内置插件才是启动修复的例外：当某个打包安装发现
某插件已通过插件配置、旧版渠道配置或其内置默认启用清单被启用时，
启动过程会在导入前先安装该插件缺失的运行时依赖。第三方插件
不应依赖启动时安装；请继续使用显式插件安装器。

## 相关内容

- [SDK 概览](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
- [插件清单](/zh-CN/plugins/manifest) — 完整清单 schema 参考
- [构建插件](/zh-CN/plugins/building-plugins) — 分步入门指南
