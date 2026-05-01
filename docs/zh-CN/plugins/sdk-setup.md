---
read_when:
    - 你正在为插件添加设置向导
    - 你需要理解 setup-entry.ts 与 index.ts 的区别
    - 你正在定义插件配置 schema 或 package.json 的 openclaw 元数据
sidebarTitle: Setup and config
summary: 设置向导、setup-entry.ts、配置模式和 package.json 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-05-01T20:40:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d61cbbeb3e9e303d098fcddf4ba101ff6717c232d5db4b36c28008c84bd32be8
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Reference for plugin packaging (`package.json` 元数据)、清单 (`openclaw.plugin.json`)、设置入口和配置架构的参考。

<Tip>
**想找演练？** 操作指南会在上下文中介绍打包：[渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和 [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要一个 `openclaw` 字段，用来告诉插件系统你的插件提供什么：

<Tabs>
  <Tab title="Channel plugin">
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
  </Tab>
  <Tab title="Provider plugin / ClawHub baseline">
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
  </Tab>
</Tabs>

<Note>
如果你在 ClawHub 上外部发布该插件，这些 `compat` 和 `build` 字段是必需的。规范发布片段位于 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 字段

<ParamField path="extensions" type="string[]">
  入口点文件（相对于包根目录）。
</ParamField>
<ParamField path="setupEntry" type="string">
  轻量级的仅设置入口（可选）。
</ParamField>
<ParamField path="channel" type="object">
  用于设置、选择器、快速开始和 Status 界面的渠道目录元数据。
</ParamField>
<ParamField path="providers" type="string[]">
  此插件注册的提供商 ID。
</ParamField>
<ParamField path="install" type="object">
  安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  启动行为标志。
</ParamField>

### `openclaw.channel`

`openclaw.channel` 是用于在运行时加载前支持渠道发现和设置界面的低成本包元数据。

| 字段                                   | 类型       | 含义                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 规范渠道 ID。                                                                 |
| `label`                                | `string`   | 主要渠道标签。                                                                |
| `selectionLabel`                       | `string`   | 当需要不同于 `label` 时使用的选择器/设置标签。                                |
| `detailLabel`                          | `string`   | 用于更丰富的渠道目录和 Status 界面的次级详情标签。                            |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。                                                |
| `docsLabel`                            | `string`   | 当需要不同于渠道 ID 时，用于文档链接的覆盖标签。                              |
| `blurb`                                | `string`   | 简短的新手引导/目录描述。                                                     |
| `order`                                | `number`   | 渠道目录中的排序顺序。                                                        |
| `aliases`                              | `string[]` | 用于渠道选择的额外查找别名。                                                  |
| `preferOver`                           | `string[]` | 此渠道应优先于的低优先级插件/渠道 ID。                                        |
| `systemImage`                          | `string`   | 渠道 UI 目录的可选图标/系统图片名称。                                         |
| `selectionDocsPrefix`                  | `string`   | 选择界面中文档链接前的前缀文本。                                              |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是带标签的文档链接。                       |
| `selectionExtras`                      | `string[]` | 追加到选择文案中的额外短字符串。                                              |
| `markdownCapable`                      | `boolean`  | 将该渠道标记为支持 Markdown，用于出站格式化决策。                             |
| `exposure`                             | `object`   | 用于设置、已配置列表和文档界面的渠道可见性控制。                              |
| `quickstartAllowFrom`                  | `boolean`  | 将此渠道纳入标准快速开始 `allowFrom` 设置流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只有一个账号，也要求显式绑定账号。                                        |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 为此渠道解析公告目标时优先使用会话查找。                                      |

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
- `docs`：在文档/导航界面中将该渠道标记为面向公众

<Note>
`showConfigured` 和 `showInSetup` 仍作为旧版别名受支持。优先使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是包元数据，不是清单元数据。

| 字段                         | 类型                 | 含义                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 用于安装/更新流程的规范 npm 规格。                                               |
| `localPath`                  | `string`             | 本地开发或内置安装路径。                                                         |
| `defaultChoice`              | `"npm"` \| `"local"` | 两者都可用时的首选安装来源。                                                     |
| `minHostVersion`             | `string`             | 最低支持的 OpenClaw 版本，形式为 `>=x.y.z`。                                     |
| `expectedIntegrity`          | `string`             | 预期的 npm 分发完整性字符串，通常为 `sha512-...`，用于固定版本安装。             |
| `allowInvalidConfigRecovery` | `boolean`            | 允许内置插件重新安装流程从特定的陈旧配置失败中恢复。                             |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    交互式新手引导也会将 `openclaw.install` 用于按需安装界面。如果你的插件在运行时加载前公开提供商认证选择或渠道设置/目录元数据，新手引导可以显示该选项，提示选择 npm 或本地安装，安装或启用该插件，然后继续所选流程。npm 新手引导选项需要带有注册表 `npmSpec` 的可信目录元数据；精确版本和 `expectedIntegrity` 是可选固定值。如果存在 `expectedIntegrity`，安装/更新流程会强制校验它。将“显示什么”的元数据保留在 `openclaw.plugin.json` 中，将“如何安装它”的元数据保留在 `package.json` 中。
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    如果设置了 `minHostVersion`，安装和清单注册表加载都会强制执行它。旧版主机会跳过该插件；无效的版本字符串会被拒绝。
  </Accordion>
  <Accordion title="Pinned npm installs">
    对于固定版本的 npm 安装，请在 `npmSpec` 中保留精确版本，并添加预期的工件完整性：

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

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` 不是破损配置的通用绕过开关。它仅用于狭窄的内置插件恢复场景，让重新安装/设置可以修复已知升级残留，例如缺失的内置插件路径，或同一插件的陈旧 `channels.<id>` 条目。如果配置因无关原因损坏，安装仍会以失败关闭，并提示操作员运行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

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

启用后，即使对于已经配置的渠道，OpenClaw 在监听前启动阶段也只加载 `setupEntry`。完整入口会在 Gateway 网关开始监听后加载。

<Warning>
仅当你的 `setupEntry` 在 Gateway 网关开始监听前注册了 Gateway 网关所需的一切（渠道注册、HTTP 路由、Gateway 网关方法）时，才启用延迟加载。如果完整入口拥有必需的启动能力，请保留默认行为。
</Warning>

如果你的设置/完整入口注册 Gateway 网关 RPC 方法，请将它们放在插件专用前缀下。保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍由核心拥有，并始终解析为 `operator.admin`。

## 插件清单

每个原生插件都必须在包根目录中随附一个 `openclaw.plugin.json`。OpenClaw 使用它在不执行插件代码的情况下验证配置。

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

对于渠道插件，添加 `kind` 和 `channels`：

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

即使没有配置的插件也必须随附一个架构。空架构是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整架构参考见[插件清单](/zh-CN/plugins/manifest)。

## ClawHub 发布

对于插件包，请使用包专用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
旧版的仅 Skills 发布别名用于 Skills。插件包应始终使用 `clawhub package publish`。
</Note>

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量级替代项，OpenClaw 在只需要设置界面时加载它（新手引导、配置修复、已禁用渠道检查）。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这可以避免在设置流程中加载繁重的运行时代码（加密库、CLI 注册、后台服务）。

将设置安全导出保存在辅助模块中的内置工作区渠道，可以使用来自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。该内置契约还支持可选的 `runtime` 导出，因此设置期间的运行时接线可以保持轻量且明确。

<AccordionGroup>
  <Accordion title="OpenClaw 何时使用 setupEntry 而不是完整入口">
    - 渠道已禁用，但需要设置/新手引导界面。
    - 渠道已启用，但尚未配置。
    - 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必须注册什么">
    - 渠道插件对象（通过 `defineSetupPluginEntry`）。
    - Gateway 网关监听前所需的任何 HTTP 路由。
    - 启动期间所需的任何 Gateway 网关方法。

    这些启动 Gateway 网关方法仍应避免使用保留的核心管理命名空间，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不应包含什么">
    - CLI 注册。
    - 后台服务。
    - 繁重的运行时导入（加密、SDK）。
    - 仅在启动后需要的 Gateway 网关方法。

  </Accordion>
</AccordionGroup>

### 窄范围设置辅助导入

对于热门的仅设置路径，如果你只需要设置界面的一部分，优先使用窄范围设置辅助接缝，而不是更宽泛的 `plugin-sdk/setup` 总入口：

| 导入路径                        | 用途                                                                                | 关键导出                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟渠道启动中仍可用的设置期间运行时辅助工具 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 感知环境的账号设置适配器                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/归档/文档辅助工具                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

当你需要完整的共享设置工具箱时，请使用更宽泛的 `plugin-sdk/setup` 接缝，包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 等配置补丁辅助工具。

设置补丁适配器在导入时保持热路径安全。它们的内置单账号提升契约界面查找是惰性的，因此导入 `plugin-sdk/setup-runtime` 不会在实际使用适配器前急切加载内置契约界面发现逻辑。

### 渠道拥有的单账号提升

当渠道从单账号顶层配置升级到 `channels.<id>.accounts.*` 时，默认共享行为是将提升后的账号范围值移动到 `accounts.default`。

内置渠道可以通过其设置契约界面缩小或覆盖该提升行为：

- `singleAccountKeysToMove`：应移动到提升后账号中的额外顶层键
- `namedAccountPromotionKeys`：当命名账号已存在时，只有这些键会移动到提升后的账号；共享策略/投递键仍保留在渠道根部
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账号接收提升后的值

<Note>
Matrix 是当前的内置示例。如果已经恰好存在一个命名 Matrix 账号，或者 `defaultAccount` 指向现有的非规范键（例如 `Ops`），提升会保留该账号，而不是创建新的 `accounts.default` 条目。
</Note>

## 配置架构

插件配置会根据你清单中的 JSON Schema 进行验证。用户通过以下方式配置插件：

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

你的插件会在注册期间以 `api.pluginConfig` 接收此配置。

对于渠道专属配置，请改用渠道配置部分：

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

### 构建渠道配置架构

使用 `buildChannelConfigSchema` 将 Zod 架构转换为插件拥有的配置工件所使用的 `ChannelConfigSchema` 包装器：

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

对于第三方插件，冷路径契约仍然是插件清单：将生成的 JSON Schema 镜像到 `openclaw.plugin.json#channelConfigs`，这样配置架构、设置和 UI 界面就可以在不加载运行时代码的情况下检查 `channels.<id>`。

## 设置向导

渠道插件可以为 `openclaw onboard` 提供交互式设置向导。该向导是 `ChannelPlugin` 上的一个 `ChannelSetupWizard` 对象：

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

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整示例请参见内置插件包（例如 Discord 插件 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共享 allowFrom 提示">
    对于只需要标准 `note -> prompt -> parse -> merge -> patch` 流程的私信允许列表提示，优先使用来自 `openclaw/plugin-sdk/setup` 的共享设置辅助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="标准渠道设置 Status">
    对于只按标签、分数和可选额外行变化的渠道设置 Status 块，优先使用来自 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)`，而不是在每个插件中手写相同的 `status` 对象。
  </Accordion>
  <Accordion title="可选渠道设置界面">
    对于只应在特定上下文中出现的可选设置界面，请使用来自 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface`：

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

    当你只需要该可选安装界面的一半时，`plugin-sdk/channel-setup` 还公开了更低层的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 构建器。

    生成的可选适配器/向导会在真实配置写入时关闭失败。它们在 `validateInput`、`applyAccountConfig` 和 `finalize` 中复用同一条需要安装的消息，并在设置了 `docsPath` 时附加文档链接。

  </Accordion>
  <Accordion title="二进制支持的设置辅助工具">
    对于二进制支持的设置 UI，优先使用共享的委托辅助工具，而不是将相同的二进制/Status 胶水复制到每个渠道中：

    - `createDetectedBinaryStatus(...)` 用于只按标签、提示、分数和二进制检测变化的 Status 块
    - `createCliPathTextInput(...)` 用于路径支持的文本输入
    - 当 `setupEntry` 需要惰性转发到更重的完整向导时，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 当 `setupEntry` 只需要委托 `textInputs[*].shouldPrompt` 决策时，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 发布和安装

**外部插件：**发布到 [ClawHub](/zh-CN/tools/clawhub)，然后安装：

<Tabs>
  <Tab title="自动（先 ClawHub 后 npm）">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw 会先尝试 ClawHub，并自动回退到 npm。

  </Tab>
  <Tab title="仅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 包规格">
    当包尚未迁移到 ClawHub，或者你在迁移期间需要直接的 npm 安装路径时，请使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**仓库内插件：**放置在内置插件工作区树下，它们会在构建期间被自动发现。

**用户可以安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
对于来自 npm 的安装，`openclaw plugins install` 会在禁用生命周期脚本的情况下将包安装到 `~/.openclaw/npm` 下。请保持插件依赖树为纯 JS/TS，并避免使用需要 `postinstall` 构建的包。
</Info>

<Note>
Gateway 网关启动不会安装插件依赖。npm/git/ClawHub 安装流程负责依赖收敛；本地插件必须已经安装好其依赖。
</Note>

内置包元数据是显式的，不是在 Gateway 网关启动时从构建后的 JavaScript 推断出来的。运行时依赖项应放在拥有它们的插件包中；打包版 OpenClaw 启动流程绝不会修复或镜像插件依赖项。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 分步入门指南
- [插件清单](/zh-CN/plugins/manifest) — 完整的清单 schema 参考
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
