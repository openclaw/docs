---
read_when:
    - 你正在为插件添加设置向导
    - 你需要了解 `setup-entry.ts` 与 `index.ts` 的区别
    - 你正在定义插件配置 schema 或 `package.json` 中的 openclaw 元数据
sidebarTitle: Setup and Config
summary: 设置向导、`setup-entry.ts`、配置 schema 和 `package.json` 元数据
title: 插件设置与配置
x-i18n:
    generated_at: "2026-04-25T00:43:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27bba27f8bd7b8469cfc9dc8d65b12242eef9e04e1c20e5192e51ada6512491
    source_path: plugins/sdk-setup.md
    workflow: 15
---

插件打包（`package.json` 元数据）、清单
（`openclaw.plugin.json`）、设置入口和配置 schema 的参考文档。

<Tip>
  **在找操作指南？** 操作型文档会在具体上下文中讲解打包：
  [渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要包含一个 `openclaw` 字段，用来告诉插件系统
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

如果你要将插件发布到外部的 ClawHub，这些 `compat` 和 `build`
字段是必需的。规范的发布代码片段位于
`docs/snippets/plugin-publish/`。

### `openclaw` 字段

| 字段 | 类型 | 说明 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 入口文件（相对于包根目录） |
| `setupEntry` | `string` | 仅用于设置的轻量入口（可选） |
| `channel` | `object` | 用于设置、选择器、快速开始和状态界面的渠道目录元数据 |
| `providers` | `string[]` | 此插件注册的提供商 id |
| `install` | `object` | 安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery` |
| `startup` | `object` | 启动行为标志 |

### `openclaw.channel`

`openclaw.channel` 是廉价的包元数据，用于在运行时加载前支持渠道发现和设置
界面。

| 字段 | 类型 | 含义 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id` | `string` | 规范渠道 id。 |
| `label` | `string` | 主要渠道标签。 |
| `selectionLabel` | `string` | 当需要与 `label` 不同时，用于选择器 / 设置的标签。 |
| `detailLabel` | `string` | 用于更丰富的渠道目录和状态界面的次级详情标签。 |
| `docsPath` | `string` | 用于设置和选择链接的文档路径。 |
| `docsLabel` | `string` | 当需要不同于渠道 id 时，用于文档链接的覆盖标签。 |
| `blurb` | `string` | 简短的新手引导 / 目录说明。 |
| `order` | `number` | 在渠道目录中的排序顺序。 |
| `aliases` | `string[]` | 用于渠道选择的额外查找别名。 |
| `preferOver` | `string[]` | 此渠道应优先于的较低优先级插件 / 渠道 id。 |
| `systemImage` | `string` | 用于渠道 UI 目录的可选图标 / system-image 名称。 |
| `selectionDocsPrefix` | `string` | 在选择界面中文档链接前显示的前缀文本。 |
| `selectionDocsOmitLabel` | `boolean` | 在选择文案中直接显示文档路径，而不是带标签的文档链接。 |
| `selectionExtras` | `string[]` | 附加在选择文案中的额外简短字符串。 |
| `markdownCapable` | `boolean` | 将渠道标记为支持 Markdown，用于出站格式决策。 |
| `exposure` | `object` | 控制渠道在设置、已配置列表和文档界面中的可见性。 |
| `quickstartAllowFrom` | `boolean` | 让此渠道加入标准快速开始 `allowFrom` 设置流程。 |
| `forceAccountBinding` | `boolean` | 即使只存在一个账户，也要求显式账户绑定。 |
| `preferSessionLookupForAnnounceTarget` | `boolean` | 为此渠道解析 announce 目标时优先使用会话查找。 |

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

- `configured`：在已配置 / 状态类列表界面中包含该渠道
- `setup`：在交互式设置 / 配置选择器中包含该渠道
- `docs`：将该渠道标记为在文档 / 导航界面中面向公开

`showConfigured` 和 `showInSetup` 仍作为旧版别名受支持。建议优先使用
`exposure`。

### `openclaw.install`

`openclaw.install` 是包元数据，不是清单元数据。

| 字段 | 类型 | 含义 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec` | `string` | 用于安装 / 更新流程的规范 npm 规范。 |
| `localPath` | `string` | 本地开发或内置安装路径。 |
| `defaultChoice` | `"npm"` \| `"local"` | 当两者都可用时，首选的安装来源。 |
| `minHostVersion` | `string` | 最低支持的 OpenClaw 版本，格式为 `>=x.y.z`。 |
| `expectedIntegrity` | `string` | 预期的 npm 分发完整性字符串，通常为 `sha512-...`，用于固定版本安装。 |
| `allowInvalidConfigRecovery` | `boolean` | 允许内置插件重装流程从特定的陈旧配置故障中恢复。 |

交互式新手引导也会使用 `openclaw.install` 来支持按需安装
界面。如果你的插件在运行时加载前就暴露提供商认证选项或渠道设置 / 目录
元数据，新手引导就可以显示该选择、提示选择 npm 或本地安装、安装或启用插件，然后继续选定流程。Npm 新手引导选项需要可信的目录元数据，以及注册表中的
`npmSpec`；精确版本和 `expectedIntegrity` 是可选的固定项。如果
存在 `expectedIntegrity`，安装 / 更新流程会强制校验它。请将“显示什么”
元数据保存在 `openclaw.plugin.json` 中，将“如何安装”
元数据保存在 `package.json` 中。

如果设置了 `minHostVersion`，安装和清单注册表加载都会强制执行它。
较旧的宿主会跳过该插件；无效的版本字符串会被拒绝。

对于固定版本的 npm 安装，请在 `npmSpec` 中保留精确版本，并添加
预期的构件完整性：

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

`allowInvalidConfigRecovery` 不是对损坏配置的通用绕过方式。它
仅用于狭义的内置插件恢复，以便重装 / 设置可以修复已知的升级遗留问题，例如缺失的内置插件路径，或该插件对应的陈旧 `channels.<id>`
条目。如果配置因无关原因损坏，安装仍会默认拒绝，并提示操作员运行 `openclaw doctor --fix`。

### 延迟完整加载

渠道插件可通过以下方式选择延迟加载：

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

启用后，即使对于已配置的渠道，OpenClaw 在监听前的启动
阶段也只会加载 `setupEntry`。完整入口会在
Gateway 网关开始监听之后加载。

<Warning>
  仅当你的 `setupEntry` 在 Gateway 网关开始监听之前就注册了所有必需内容时，才启用延迟加载（渠道注册、HTTP 路由、
  Gateway 网关方法）。如果完整入口拥有必需的启动能力，请保持默认行为。
</Warning>

如果你的设置 / 完整入口会注册 Gateway 网关 RPC 方法，请将它们保留在
插件专用前缀下。保留的核心管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍归核心所有，并始终解析为
`operator.admin`。

## 插件清单

每个原生插件都必须在包根目录中提供一个 `openclaw.plugin.json`。
OpenClaw 使用它在不执行插件代码的情况下验证配置。

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

即使插件没有任何配置，也必须提供 schema。空 schema 是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整 schema 参考请参见[插件清单](/zh-CN/plugins/manifest)。

## ClawHub 发布

对于插件包，请使用包专用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧版仅用于 Skills 的发布别名只适用于 Skills。插件包
应始终使用 `clawhub package publish`。

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量替代方案，
当 OpenClaw 仅需要设置界面时会加载它（新手引导、配置修复、
已禁用渠道检查）。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在设置流程中加载较重的运行时代码（加密库、CLI 注册、
后台服务）。

对于将设置安全导出保存在 sidecar 模块中的内置工作区渠道，
可以使用来自
`openclaw/plugin-sdk/channel-entry-contract` 的
`defineBundledChannelSetupEntry(...)`，而不是
`defineSetupPluginEntry(...)`。
该内置契约也支持可选的
`runtime` 导出，这样设置时的运行时接线就可以保持轻量且明确。

**OpenClaw 在以下情况下会使用 `setupEntry` 而不是完整入口：**

- 渠道已禁用，但需要设置 / 新手引导界面
- 渠道已启用但尚未配置
- 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**

- 渠道插件对象（通过 `defineSetupPluginEntry`）
- 在 Gateway 网关监听之前所需的任何 HTTP 路由
- 启动期间所需的任何 Gateway 网关方法

这些启动期 Gateway 网关方法仍应避免使用保留的核心管理
命名空间，例如 `config.*` 或 `update.*`。

**`setupEntry` 不应包含的内容：**

- CLI 注册
- 后台服务
- 较重的运行时导入（加密、SDK）
- 仅在启动后才需要的 Gateway 网关方法

### 窄范围设置辅助导入

对于仅设置的高频路径，如果你只需要部分设置能力，
请优先使用更窄的设置辅助导入面，而不是更宽泛的
`plugin-sdk/setup` 总入口：

| 导入路径 | 适用场景 | 关键导出 |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | 在 `setupEntry` / 延迟渠道启动中仍可用的设置时运行时辅助工具 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 具备环境感知能力的账户设置适配器 | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools` | 设置 / 安装 CLI / 归档 / 文档辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

当你需要完整的共享设置工具箱时，请使用更宽泛的
`plugin-sdk/setup` 导入面，包括诸如
`moveSingleAccountChannelSectionToDefaultAccount(...)` 之类的配置补丁辅助工具。

这些设置补丁适配器在导入时仍然适合高频路径。它们对内置
单账户提升契约导入面的查找是惰性的，因此导入
`plugin-sdk/setup-runtime` 不会在适配器真正使用之前急切加载
内置契约导入面发现逻辑。

### 渠道自有的单账户提升

当一个渠道从单账户顶层配置升级到
`channels.<id>.accounts.*` 时，默认共享行为会将提升后的
账户作用域值移动到 `accounts.default` 中。

内置渠道可以通过其设置
契约导入面缩小或覆盖该提升行为：

- `singleAccountKeysToMove`：应移动到
  提升后账户中的额外顶层键
- `namedAccountPromotionKeys`：当命名账户已存在时，仅这些
  键会移动到提升后的账户中；共享策略 / 投递键保留在
  渠道根级别
- `resolveSingleAccountPromotionTarget(...)`：选择由哪个现有账户
  接收提升后的值

Matrix 是当前的内置示例。如果恰好只存在一个已命名的 Matrix 账户，
或者 `defaultAccount` 指向一个现有的非规范键，例如 `Ops`，
则提升会保留该账户，而不是创建新的
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

你的插件会在注册期间通过 `api.pluginConfig` 接收此配置。

对于渠道专属配置，请改用渠道配置段：

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

使用 `buildChannelConfigSchema` 可将一个 Zod schema 转换为
由插件自有配置工件使用的 `ChannelConfigSchema` 包装器：

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
将生成的 JSON Schema 镜像到 `openclaw.plugin.json#channelConfigs` 中，
这样配置 schema、设置和 UI 界面就可以在不加载运行时代码的情况下检查 `channels.<id>`。

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
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。
完整示例可参见内置插件包（例如 Discord 插件的 `src/channel.setup.ts`）。

对于只需要标准
`note -> prompt -> parse -> merge -> patch` 流程的私信 allowlist 提示，
请优先使用来自 `openclaw/plugin-sdk/setup` 的共享设置
辅助工具：`createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)` 和
`createNestedChannelParsedAllowFromPrompt(...)`。

对于仅在标签、分数和可选附加行上有所不同的渠道设置状态块，
请优先使用 `openclaw/plugin-sdk/setup` 中的
`createStandardChannelSetupStatus(...)`，而不是在
每个插件中手写同样的 `status` 对象。

对于只应在特定上下文中出现的可选设置界面，请使用
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
`createOptionalChannelSetupWizard(...)` 构建器，以便你只需要该
可选安装界面的一半时使用。

生成的可选适配器 / 向导在真正的配置写入上会默认拒绝。
它们会在 `validateInput`、
`applyAccountConfig` 和 `finalize` 之间复用同一条需要安装的消息，并在设置了 `docsPath` 时附加文档链接。

对于基于二进制的设置 UI，请优先使用共享委托辅助工具，而不是
把相同的二进制 / 状态胶水逻辑复制到每个渠道中：

- `createDetectedBinaryStatus(...)`：用于仅在标签、
  提示、分数和二进制检测上不同的状态块
- `createCliPathTextInput(...)`：用于基于路径的文本输入
- `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和
  `createDelegatedResolveConfigured(...)`：用于 `setupEntry` 需要延迟转发到
  更重型完整向导的情况
- `createDelegatedTextInputShouldPrompt(...)`：用于 `setupEntry` 只需要
  委托一个 `textInputs[*].shouldPrompt` 决策的情况

## 发布与安装

**外部插件：** 发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 会先尝试 ClawHub，然后自动回退到 npm。你也可以显式强制使用 ClawHub：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

没有对应的 `npm:` 覆盖方式。当你希望在 ClawHub 回退后走 npm 路径时，
请使用普通 npm 包规范：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**仓库内插件：** 放在内置插件工作区树下，它们会在构建期间自动
被发现。

**用户可以安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
  对于来源于 npm 的安装，`openclaw plugins install` 会运行
  `npm install --ignore-scripts`（不执行生命周期脚本）。请保持插件依赖
  树为纯 JS / TS，并避免依赖需要 `postinstall` 构建的包。
</Info>

内置的 OpenClaw 自有插件是唯一的启动修复例外：当
打包安装检测到某个插件已通过插件配置、旧版渠道配置或其
内置默认启用清单而被启用时，启动流程会在导入前安装该插件缺失的
运行时依赖。第三方插件不应依赖启动期安装；
请继续使用显式插件安装器。

## 相关内容

- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) -- `definePluginEntry` 和 `defineChannelPluginEntry`
- [插件清单](/zh-CN/plugins/manifest) -- 完整清单 schema 参考
- [构建插件](/zh-CN/plugins/building-plugins) -- 分步入门指南
