---
read_when:
    - 你正在为插件添加设置向导
    - 你需要理解 setup-entry.ts 与 index.ts 的区别
    - 你正在定义插件配置 schema 或 package.json 中的 openclaw 元数据
sidebarTitle: Setup and Config
summary: 设置向导、setup-entry.ts、配置 schema 和 package.json 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-04-05T08:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# 插件设置和配置

这是关于插件打包（`package.json` 元数据）、清单
（`openclaw.plugin.json`）、设置入口和配置 schema 的参考文档。

<Tip>
  **想看操作演练？** 操作指南会在实际场景中介绍打包：
  [渠道插件](/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和
  [提供商插件](/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
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

如果你要在 ClawHub 上对外发布该插件，则必须包含这些 `compat` 和 `build`
字段。规范的发布片段位于
`docs/snippets/plugin-publish/`。

### `openclaw` 字段

| 字段         | 类型       | 描述                                                                                             |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | 入口点文件（相对于包根目录）                                                                     |
| `setupEntry` | `string`   | 仅用于设置的轻量入口（可选）                                                                     |
| `channel`    | `object`   | 用于设置、选择器、快速开始和状态表面的渠道目录元数据                                             |
| `providers`  | `string[]` | 由该插件注册的提供商 id                                                                          |
| `install`    | `object`   | 安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`allowInvalidConfigRecovery` |
| `startup`    | `object`   | 启动行为标志                                                                                     |

### `openclaw.channel`

`openclaw.channel` 是廉价的包元数据，用于在运行时加载之前进行渠道发现和设置
表面展示。

| 字段                                   | 类型       | 含义                                                           |
| -------------------------------------- | ---------- | -------------------------------------------------------------- |
| `id`                                   | `string`   | 规范渠道 id。                                                  |
| `label`                                | `string`   | 主要渠道标签。                                                 |
| `selectionLabel`                       | `string`   | 当它应与 `label` 不同时，在选择器/设置中的标签。               |
| `detailLabel`                          | `string`   | 用于更丰富渠道目录和状态表面的次级详细标签。                   |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。                                 |
| `docsLabel`                            | `string`   | 当应不同于渠道 id 时，用作文档链接的覆盖标签。                 |
| `blurb`                                | `string`   | 简短的新手引导/目录说明。                                      |
| `order`                                | `number`   | 在渠道目录中的排序顺序。                                       |
| `aliases`                              | `string[]` | 用于渠道选择的额外查找别名。                                   |
| `preferOver`                           | `string[]` | 此渠道应优先于的较低优先级插件/渠道 id。                       |
| `systemImage`                          | `string`   | 用于渠道 UI 目录的可选图标/system-image 名称。                 |
| `selectionDocsPrefix`                  | `string`   | 在选择表面中文档链接前显示的前缀文本。                         |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是显示带标签的文档链接。     |
| `selectionExtras`                      | `string[]` | 附加在选择文案中的额外短文本。                                 |
| `markdownCapable`                      | `boolean`  | 将此渠道标记为支持 Markdown，用于出站格式决策。                |
| `showConfigured`                       | `boolean`  | 控制已配置渠道列表表面是否显示此渠道。                         |
| `quickstartAllowFrom`                  | `boolean`  | 让此渠道选择加入标准快速开始 `allowFrom` 设置流程。            |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一个账户，也要求显式账户绑定。                       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 为该渠道解析公告目标时优先使用会话查找。                       |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` 是包元数据，不是清单元数据。

| 字段                         | 类型                 | 含义                                                                         |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 用于安装/更新流程的规范 npm spec。                                           |
| `localPath`                  | `string`             | 本地开发或内置安装路径。                                                     |
| `defaultChoice`              | `"npm"` \| `"local"` | 当两者都可用时的首选安装来源。                                               |
| `minHostVersion`             | `string`             | 最低支持的 OpenClaw 版本，格式为 `>=x.y.z`。                                 |
| `allowInvalidConfigRecovery` | `boolean`            | 允许内置插件重装流程从特定的陈旧配置故障中恢复。                             |

如果设置了 `minHostVersion`，安装和清单注册表加载都会
强制执行它。较旧的宿主会跳过该插件；无效的版本字符串会被拒绝。

`allowInvalidConfigRecovery` 并不是对损坏配置的通用绕过。它
仅用于狭义的内置插件恢复，以便重装/设置能够修复已知的升级遗留问题，
例如缺失的内置插件路径，或属于同一插件的陈旧 `channels.<id>`
条目。如果配置因无关原因损坏，安装
仍会以失败即关闭的方式终止，并提示操作员运行 `openclaw doctor --fix`。

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

启用后，OpenClaw 在监听前启动阶段
仅加载 `setupEntry`，即使是已经配置好的渠道也是如此。完整入口会在
gateway 开始监听之后再加载。

<Warning>
  只有当你的 `setupEntry` 在 gateway 开始监听前
  注册了它所需的一切内容（渠道注册、HTTP 路由、
  gateway 方法）时，才启用延迟加载。如果完整入口拥有必需的
  启动能力，请保持默认行为。
</Warning>

如果你的设置/完整入口会注册 gateway RPC 方法，请将它们放在
插件专用前缀下。保留的 core 管理命名空间（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）仍归 core 所有，并始终解析
为 `operator.admin`。

## 插件清单

每个原生插件都必须在包根目录中包含一个 `openclaw.plugin.json`。
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

即使插件没有任何配置，也必须提供一个 schema。空 schema 是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整 schema 参考请参见 [插件清单](/plugins/manifest)。

## ClawHub 发布

对于插件包，请使用包专用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧版仅面向 skill 的发布别名是给 skills 用的。插件包应始终使用
`clawhub package publish`。

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量替代方案，
当 OpenClaw 只需要设置表面时（新手引导、配置修复、
禁用渠道检查），会加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在设置流程中加载沉重的运行时代码（加密库、CLI 注册、
后台服务）。

**OpenClaw 在以下情况下会使用 `setupEntry` 而不是完整入口：**

- 渠道已禁用，但仍需要设置/新手引导表面
- 渠道已启用，但尚未配置
- 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**

- 渠道插件对象（通过 `defineSetupPluginEntry`）
- 任何在 gateway 监听前必需的 HTTP 路由
- 启动期间所需的任何 gateway 方法

这些启动 gateway 方法同样应避免使用保留的 core 管理
命名空间，例如 `config.*` 或 `update.*`。

**`setupEntry` 不应包含的内容：**

- CLI 注册
- 后台服务
- 沉重的运行时导入（加密、SDK）
- 仅在启动后才需要的 gateway 方法

### 窄设置辅助工具导入

对于热点的仅设置路径，当你只需要设置表面的一部分时，
优先使用窄设置辅助工具接缝，而不是更宽泛的
`plugin-sdk/setup` 总表面：

| 导入路径                           | 用途                                                                                     | 关键导出                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟渠道启动中仍然可用的设置时运行时辅助工具                          | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 面向环境感知账户设置适配器                                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/归档/文档辅助工具                                                         | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

当你需要完整的共享设置工具箱时，请使用更宽泛的
`plugin-sdk/setup` 接缝，其中包括配置补丁辅助工具，例如
`moveSingleAccountChannelSectionToDefaultAccount(...)`。

这些设置补丁适配器在导入时仍对热点路径安全。它们的内置
单账户提升契约表面查找是惰性的，因此导入
`plugin-sdk/setup-runtime` 不会在实际使用适配器前就急切加载
内置契约表面发现逻辑。

### 渠道自有的单账户提升

当某个渠道从单账户顶层配置升级到
`channels.<id>.accounts.*` 时，默认的共享行为会将被提升的
账户作用域值移动到 `accounts.default` 中。

内置渠道可以通过其设置
契约表面来缩小或覆盖该提升行为：

- `singleAccountKeysToMove`：应移动到
  被提升账户中的额外顶层键
- `namedAccountPromotionKeys`：当命名账户已经存在时，仅这些
  键会移动到被提升账户中；共享策略/投递键则保留在
  渠道根部
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账户
  接收被提升的值

Matrix 是当前的内置示例。如果恰好已经存在一个命名 Matrix 账户，
或者 `defaultAccount` 指向某个现有的非规范键
（例如 `Ops`），提升会保留该账户，而不是创建新的
`accounts.default` 条目。

## 配置 schema

插件配置会根据你清单中的 JSON Schema 进行验证。用户通过以下方式
配置插件：

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

在注册期间，你的插件会通过 `api.pluginConfig` 收到这份配置。

对于渠道特定配置，请改用渠道配置段：

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

使用来自 `openclaw/plugin-sdk/core` 的 `buildChannelConfigSchema`，将
Zod schema 转换为 OpenClaw 用于验证的 `ChannelConfigSchema` 包装器：

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

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
完整示例请查看内置插件包（例如 Discord 插件的 `src/channel.setup.ts`）。

对于只需要标准
`note -> prompt -> parse -> merge -> patch` 流程的私信 allowlist 提示，
优先使用来自 `openclaw/plugin-sdk/setup` 的共享设置
辅助工具：`createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)` 和
`createNestedChannelParsedAllowFromPrompt(...)`。

对于只在标签、分数和可选额外行上变化的渠道设置状态块，
优先使用来自 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，
而不是在每个插件中手写相同的 `status` 对象。

对于只应在特定上下文中出现的可选设置表面，请使用
来自 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface`：

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
`createOptionalChannelSetupWizard(...)` builder，
适用于你只需要该可选安装表面其中一半的情况。

生成的可选 adapter/wizard 在真实配置写入时默认失败即关闭。它们会在
`validateInput`、`applyAccountConfig` 和 `finalize` 之间复用同一条安装必需消息，
并在设置了 `docsPath` 时附加文档链接。

对于由二进制驱动的设置 UI，优先使用共享委托辅助工具，而不是
在每个渠道中复制相同的二进制/状态胶水代码：

- `createDetectedBinaryStatus(...)`：用于仅在标签、
  提示、分数和二进制检测上变化的状态块
- `createCliPathTextInput(...)`：用于基于路径的文本输入
- `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和
  `createDelegatedResolveConfigured(...)`：当 `setupEntry` 需要惰性转发到
  更重的完整向导时使用
- `createDelegatedTextInputShouldPrompt(...)`：当 `setupEntry` 只需要
  委托 `textInputs[*].shouldPrompt` 决策时使用

## 发布和安装

**外部插件：** 发布到 [ClawHub](/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 会先尝试 ClawHub，失败后再自动回退到 npm。你也可以显式强制使用 ClawHub：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

没有对应的 `npm:` 覆盖方式。如果你想在 ClawHub 回退后走普通 npm 路径，
请使用普通 npm 包 spec：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**仓库内插件：** 放在内置插件工作区树下，构建期间会自动
发现它们。

**用户可安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
  对于来自 npm 的安装，`openclaw plugins install` 会运行
  `npm install --ignore-scripts`（不执行生命周期脚本）。请保持插件依赖
  树为纯 JS/TS，并避免依赖需要 `postinstall` 构建的包。
</Info>

## 相关内容

- [插件入口点](/plugins/sdk-entrypoints) -- `definePluginEntry` 和 `defineChannelPluginEntry`
- [插件清单](/plugins/manifest) -- 完整清单 schema 参考
- [构建插件](/plugins/building-plugins) -- 分步入门指南
