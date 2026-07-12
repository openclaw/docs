---
read_when:
    - 你正在为插件添加设置向导
    - 你需要了解 `setup-entry.ts` 与 `index.ts` 的区别
    - 你正在定义插件配置架构或 package.json 的 openclaw 元数据
sidebarTitle: Setup and config
summary: 设置向导、setup-entry.ts、配置架构和 package.json 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-07-11T20:50:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

插件打包（`package.json` 元数据）、清单（`openclaw.plugin.json`）、设置入口和配置架构的参考。

<Tip>
**想查找分步指南？** 操作指南结合上下文介绍了打包：[渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest)和[提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 软件包元数据

你的 `package.json` 需要包含一个 `openclaw` 字段，用于告知插件系统你的插件提供了哪些内容：

<Tabs>
  <Tab title="渠道插件">
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
  <Tab title="提供商插件 / ClawHub 基线">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
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
在 ClawHub 上对外发布需要 `compat` 和 `build`。规范的发布片段位于 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 字段

<ParamField path="extensions" type="string[]">
  入口点文件（相对于软件包根目录）。适用于工作区和 git 检出开发的有效源代码入口。
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions` 对应的已构建 JavaScript 文件；OpenClaw 加载已安装的 npm 软件包时优先使用这些文件。有关源代码/构建产物的解析顺序，请参阅 [SDK 入口点](/zh-CN/plugins/sdk-entrypoints)。
</ParamField>
<ParamField path="setupEntry" type="string">
  仅用于设置的轻量入口（可选）。
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` 对应的已构建 JavaScript 文件。还必须设置 `setupEntry`。
</ParamField>
<ParamField path="plugin" type="object">
  后备插件标识 `{ id, label }`，用于插件没有可供派生 id 或标签的渠道/提供商元数据时。
</ParamField>
<ParamField path="channel" type="object">
  用于设置、选择器、快速开始和状态界面的渠道目录元数据。
</ParamField>
<ParamField path="install" type="object">
  安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`、`requiredPlatformPackages`。
</ParamField>
<ParamField path="startup" type="object">
  启动行为标志。
</ParamField>
<ParamField path="compat" type="object">
  此插件支持的 `pluginApi` 版本范围。在 ClawHub 上对外发布时必需。
</ParamField>

<Note>
提供商 id（`providers: string[]`）属于清单元数据，而非软件包元数据。请在 `openclaw.plugin.json` 中声明，不要在此处声明——参阅[插件清单](/zh-CN/plugins/manifest)。
</Note>

### `openclaw.channel`

`openclaw.channel` 是一种轻量的软件包元数据，用于在运行时加载之前发现渠道并呈现设置界面。

| 字段                                   | 类型       | 含义                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 规范渠道 id。                                                                 |
| `label`                                | `string`   | 主要渠道标签。                                                                |
| `selectionLabel`                       | `string`   | 需要与 `label` 不同时使用的选择器/设置标签。                                  |
| `detailLabel`                          | `string`   | 用于信息更丰富的渠道目录和状态界面的次要详细信息标签。                        |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。                                                |
| `docsLabel`                            | `string`   | 需要与渠道 id 不同时，用于文档链接的覆盖标签。                                |
| `blurb`                                | `string`   | 简短的新手引导/目录描述。                                                     |
| `order`                                | `number`   | 渠道目录中的排序顺序。                                                        |
| `aliases`                              | `string[]` | 用于选择渠道的额外查找别名。                                                  |
| `preferOver`                           | `string[]` | 此渠道应优先于其显示的低优先级插件/渠道 id。                                  |
| `systemImage`                          | `string`   | 用于渠道 UI 目录的可选图标/系统图像名称。                                     |
| `selectionDocsPrefix`                  | `string`   | 选择界面中文档链接之前的前缀文本。                                            |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是带标签的文档链接。                        |
| `selectionExtras`                      | `string[]` | 追加到选择文案中的额外短字符串。                                              |
| `markdownCapable`                      | `boolean`  | 将渠道标记为支持 Markdown，以供出站格式决策使用。                              |
| `exposure`                             | `object`   | 控制渠道在设置、已配置列表和文档界面中的可见性。                              |
| `quickstartAllowFrom`                  | `boolean`  | 让此渠道加入标准快速开始 `allowFrom` 设置流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一个账户，也要求显式绑定账户。                                      |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 为此渠道解析公告目标时优先查找会话。                                          |

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

- `configured`：在已配置/状态样式的列表界面中包含该渠道
- `setup`：在交互式设置/配置选择器中包含该渠道
- `docs`：在文档/导航界面中将该渠道标记为面向公众

<Note>
`showConfigured` 和 `showInSetup` 仍作为旧版别名受到支持。优先使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是软件包元数据，而非清单元数据。

| 字段                         | 类型                                | 含义                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用于安装/更新和新手引导按需安装流程的规范 ClawHub 规格。                          |
| `npmSpec`                    | `string`                            | 用于安装/更新后备流程的规范 npm 规格。                                            |
| `localPath`                  | `string`                            | 本地开发或内置安装路径。                                                          |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 有多个来源可用时的首选安装来源。                                                  |
| `minHostVersion`             | `string`                            | 支持的最低 OpenClaw 版本，即 `>=x.y.z` 或 `>=x.y.z-prerelease`。                  |
| `expectedIntegrity`          | `string`                            | 固定版本安装所预期的 npm 分发完整性字符串，通常为 `sha512-...`。                  |
| `allowInvalidConfigRecovery` | `boolean`                           | 允许内置插件重新安装流程从特定的过时配置故障中恢复。                              |
| `requiredPlatformPackages`   | `string[]`                          | npm 安装期间验证的必需平台专用 npm 别名。                                         |

<AccordionGroup>
  <Accordion title="新手引导行为">
    交互式新手引导在按需安装界面中使用 `openclaw.install`：如果你的插件在运行时加载之前公开了提供商身份验证选项或渠道设置/目录元数据，新手引导可以提示用户选择通过 ClawHub、npm 或本地来源安装，安装或启用插件，然后继续所选流程。ClawHub 选项使用 `clawhubSpec`，并在存在时优先选择；npm 选项需要可信目录元数据，其中包含注册表 `npmSpec`（确切版本和 `expectedIntegrity` 是可选的固定值，设置后会在安装/更新时强制执行）。将“显示什么”放在 `openclaw.plugin.json` 中，将“如何安装”放在 `package.json` 中。
  </Accordion>
  <Accordion title="minHostVersion 强制执行">
    如果设置了 `minHostVersion`，安装和非内置清单注册表加载都会强制执行它。较旧的宿主会跳过外部插件；无效的版本字符串会被拒绝。内置源代码插件被视为与宿主检出版本一致。
  </Accordion>
  <Accordion title="固定版本的 npm 安装">
    对于固定版本的 npm 安装，请在 `npmSpec` 中保留确切版本，并添加预期的产物完整性值：

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
  <Accordion title="allowInvalidConfigRecovery 的适用范围">
    `allowInvalidConfigRecovery` 并非用于绕过损坏配置的通用机制。它仅用于范围有限的内置插件恢复，允许重新安装/设置修复已知的升级残留问题，例如缺少内置插件路径，或该插件自身存在过时的 `channels.<id>` 条目。如果配置因无关原因损坏，安装仍会以关闭方式失败，并提示操作员运行 `openclaw doctor --fix`。
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

启用后，即使渠道已经配置，OpenClaw 在开始监听前的启动阶段也只加载 `setupEntry`。完整入口会在 Gateway 网关开始监听后加载。

<Warning>
仅当你的 `setupEntry` 注册了 Gateway 网关开始监听前所需的全部内容（渠道注册、HTTP 路由、Gateway 网关方法）时，才启用延迟加载。如果完整入口拥有必需的启动能力，请保留默认行为。
</Warning>

如果你的设置入口/完整入口注册了 Gateway 网关 RPC 方法，请将它们置于插件专用前缀下。保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍归核心所有，并且始终规范化为 `operator.admin`。

## 插件清单

每个原生插件都必须在软件包根目录中提供 `openclaw.plugin.json`。OpenClaw 使用此文件在不执行插件代码的情况下验证配置。

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

对于渠道插件，请添加 `channels`（提供商插件则添加 `providers`）：

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

即使插件没有配置，也必须提供模式。空模式是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整的模式参考请参阅[插件清单](/zh-CN/plugins/manifest)。

## ClawHub 发布

Skills 和插件软件包使用不同的 ClawHub 发布命令。对于插件软件包，请使用软件包专用命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` 是用于发布技能文件夹的另一条命令，并非用于发布插件软件包。请参阅[在 ClawHub 上发布](/zh-CN/clawhub/publishing)。
</Note>

## 设置入口

`setup-entry.ts` 是 `index.ts` 的轻量替代方案，OpenClaw 仅需要设置相关界面（新手引导、配置修复、已禁用渠道检查）时会加载它：

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在设置流程中加载繁重的运行时代码（加密库、CLI 注册、后台服务）。

将设置安全的导出保留在配套模块中的内置工作区渠道，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。该内置契约还支持可选的 `runtime` 导出，使设置期间的运行时连接保持轻量且明确。

<AccordionGroup>
  <Accordion title="OpenClaw 何时使用 setupEntry 而不是完整入口">
    - 渠道已禁用，但仍需要设置/新手引导界面。
    - 渠道已启用，但尚未配置。
    - 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必须注册的内容">
    - 渠道插件对象（通过 `defineSetupPluginEntry`）。
    - Gateway 网关开始监听前所需的所有 HTTP 路由。
    - 启动期间所需的所有 Gateway 网关方法。

    这些启动阶段的 Gateway 网关方法仍应避开保留的核心管理命名空间，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不应包含的内容">
    - CLI 注册。
    - 后台服务。
    - 繁重的运行时导入（加密库、SDK）。
    - 仅在启动后才需要的 Gateway 网关方法。

  </Accordion>
</AccordionGroup>

### 精简的设置辅助工具导入

对于高频的纯设置路径，如果只需要设置界面的一部分，应优先使用精简的设置辅助工具接口，而不是更宽泛的 `plugin-sdk/setup` 汇总入口：

| 导入路径                           | 用途                                                                                       | 主要导出                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟渠道启动中仍可用的设置阶段运行时辅助工具                              | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容别名；请使用 `plugin-sdk/setup-runtime`                                        | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/归档/文档辅助工具                                                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

如果需要完整的共享设置工具箱（包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 等配置补丁辅助工具），请使用更宽泛的 `plugin-sdk/setup` 接口。

对于固定的设置向导文案，请使用 `createSetupTranslator(...)`。它遵循 CLI 向导的区域设置（先使用 `OPENCLAW_LOCALE`，再使用系统区域设置变量），并在无法匹配时回退到英语。插件专用的设置文本应保留在插件自有代码中；共享目录键仅用于通用设置标签、状态文本和官方内置插件的设置文案。

设置补丁适配器在导入时保持适用于高频路径。其内置单账号提升契约界面查询采用惰性加载，因此导入 `plugin-sdk/setup-runtime` 时，不会在实际使用适配器前提前加载内置契约界面发现逻辑。

### 渠道自有的单账号提升

当渠道从单账号顶层配置升级到 `channels.<id>.accounts.*` 时，默认共享行为会将提升后的账号范围值移入 `accounts.default`。

内置渠道可以通过其设置契约界面缩小或覆盖该提升行为：

- `singleAccountKeysToMove`：应移入提升后账号的额外顶层键
- `namedAccountPromotionKeys`：当命名账号已存在时，仅将这些键移入提升后的账号；共享策略/投递键仍保留在渠道根级别
- `resolveSingleAccountPromotionTarget(...)`：选择由哪个现有账号接收提升后的值

<Note>
Matrix 是当前的内置示例。如果恰好已存在一个命名的 Matrix 账号，或者 `defaultAccount` 指向 `Ops` 等现有的非规范键，提升操作会保留该账号，而不是创建新的 `accounts.default` 条目。
</Note>

## 配置模式

插件配置会依据插件清单中的 JSON Schema 进行验证。用户通过以下方式配置插件：

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

注册期间，插件会通过 `api.pluginConfig` 接收此配置。

对于渠道专用配置，请改用渠道配置部分：

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

### 构建渠道配置模式

使用 `buildChannelConfigSchema` 将 Zod 模式转换为插件自有配置产物所使用的 `ChannelConfigSchema` 包装器：

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

如果你已使用 JSON Schema 或 TypeBox 编写契约，请使用直接辅助工具，以便 OpenClaw 在元数据路径中跳过从 Zod 到 JSON Schema 的转换：

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

对于第三方插件，冷路径契约仍然是插件清单：将生成的 JSON Schema 同步到 `openclaw.plugin.json#channelConfigs`，使配置模式、设置和 UI 界面无需加载运行时代码即可检查 `channels.<id>`。

## 设置向导

渠道插件可以为 `openclaw onboard` 提供交互式设置向导。向导是 `ChannelPlugin` 上的 `ChannelSetupWizard` 对象：

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

`ChannelSetupWizard` 还支持 `textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整的内置示例请参阅 Discord 插件的 `src/setup-core.ts`。

<AccordionGroup>
  <Accordion title="共享 allowFrom 提示">
    对于仅需要标准 `note -> prompt -> parse -> merge -> patch` 流程的私信允许列表提示，优先使用 `openclaw/plugin-sdk/setup` 中的共享设置辅助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="标准渠道设置状态">
    对于仅在标签、分数和可选额外行方面存在差异的渠道设置状态块，优先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)`，而不是在每个插件中手动编写相同的 `status` 对象。
  </Accordion>
  <Accordion title="可选渠道设置界面">
    对于只应在特定上下文中显示的可选设置界面，请使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

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

    当你只需要该可选安装界面的一半时，`plugin-sdk/channel-setup` 还提供更底层的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 构建器。

    生成的可选适配器/向导在实际写入配置时采用失败关闭策略。它们在 `validateInput`、`applyAccountConfig` 和 `finalize` 中复用同一条需要安装的消息，并在设置了 `docsPath` 时附加文档链接。

  </Accordion>
  <Accordion title="由二进制程序支持的设置辅助工具">
    对于由二进制程序支持的设置 UI，优先使用共享的委托辅助工具，而不要在每个渠道中重复相同的二进制程序/状态衔接逻辑：

    - `createDetectedBinaryStatus(...)`：用于仅标签、提示、评分和二进制程序检测不同的状态块
    - `createCliPathTextInput(...)`：用于基于路径的文本输入
    - 当 `setupEntry` 需要延迟转发到功能更完整的向导时，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 当 `setupEntry` 只需委托 `textInputs[*].shouldPrompt` 决策时，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 发布和安装

**外部插件：**发布到 [ClawHub](/zh-CN/clawhub)，然后安装：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    在启动切换期间，裸包说明符会从 npm 安装；但如果名称与内置或官方插件 ID 匹配，OpenClaw 会改用对应的本地/官方副本。使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 可确定性地选择来源——参阅[管理插件](/zh-CN/plugins/manage-plugins)。

  </Tab>
  <Tab title="仅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 包说明符">
    当软件包尚未迁移到 ClawHub，或迁移期间需要直接使用 npm 安装路径时，请使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**仓库内插件：**放置在内置插件工作区目录树下；构建期间会自动发现这些插件。

<Info>
对于来源为 npm 的安装，`openclaw plugins install` 会将软件包安装到 `~/.openclaw/npm/projects` 下的每插件独立项目中，并禁用生命周期脚本（`--ignore-scripts`）。请确保插件依赖树仅包含纯 JS/TS 软件包，并避免使用需要通过 `postinstall` 构建的软件包。
</Info>

<Note>
Gateway 网关启动时不会安装插件依赖。npm/git/ClawHub 安装流程负责依赖收敛；本地插件必须已经安装其依赖。
</Note>

内置软件包元数据是显式声明的，而不是在 Gateway 网关启动时从构建后的 JavaScript 中推断。运行时依赖应归属于拥有它们的插件软件包；打包后的 OpenClaw 启动过程绝不会修复或镜像插件依赖。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 分步入门指南
- [插件清单](/zh-CN/plugins/manifest) — 完整的清单架构参考
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
