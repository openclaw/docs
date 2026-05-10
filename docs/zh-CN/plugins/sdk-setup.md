---
read_when:
    - 你正在为插件添加设置向导
    - 你需要理解 setup-entry.ts 与 index.ts 的区别
    - 你正在定义插件配置 schema 或 package.json openclaw 元数据
sidebarTitle: Setup and config
summary: 设置向导、setup-entry.ts、配置架构和 package.json 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-05-10T19:44:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

插件打包（`package.json` 元数据）、清单（`openclaw.plugin.json`）、设置入口和配置 schema 的参考。

<Tip>
**在寻找分步指南？** 这些操作指南会在上下文中介绍打包：[渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和 [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要一个 `openclaw` 字段，用来告诉插件系统你的插件提供什么：

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
如果你在 ClawHub 上对外发布插件，这些 `compat` 和 `build` 字段是必需的。规范发布片段位于 `docs/snippets/plugin-publish/`。
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

`openclaw.channel` 是便宜的包元数据，用于在运行时加载前支持渠道设备发现和设置界面。

| 字段                                   | 类型       | 含义                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 规范渠道 ID。                                                                 |
| `label`                                | `string`   | 主要渠道标签。                                                                |
| `selectionLabel`                       | `string`   | 当需要不同于 `label` 时使用的选择器/设置标签。                                |
| `detailLabel`                          | `string`   | 用于更丰富渠道目录和 Status 界面的次要详情标签。                              |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。                                                |
| `docsLabel`                            | `string`   | 当文档链接标签需要不同于渠道 ID 时使用的覆盖标签。                            |
| `blurb`                                | `string`   | 简短的新手引导/目录描述。                                                     |
| `order`                                | `number`   | 渠道目录中的排序顺序。                                                        |
| `aliases`                              | `string[]` | 用于渠道选择的额外查找别名。                                                  |
| `preferOver`                           | `string[]` | 此渠道应优先于的较低优先级插件/渠道 ID。                                      |
| `systemImage`                          | `string`   | 渠道 UI 目录可选的图标/系统图片名称。                                         |
| `selectionDocsPrefix`                  | `string`   | 选择界面中文档链接前的前缀文本。                                              |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是带标签的文档链接。                        |
| `selectionExtras`                      | `string[]` | 附加到选择文案中的额外短字符串。                                              |
| `markdownCapable`                      | `boolean`  | 将该渠道标记为支持 Markdown，用于出站格式化决策。                             |
| `exposure`                             | `object`   | 控制渠道在设置、已配置列表和文档界面中的可见性。                              |
| `quickstartAllowFrom`                  | `boolean`  | 让此渠道加入标准快速开始 `allowFrom` 设置流程。                               |
| `forceAccountBinding`                  | `boolean`  | 即使只有一个账号，也要求显式账号绑定。                                        |
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

- `configured`：将该渠道包含在已配置/Status 风格的列表界面中
- `setup`：将该渠道包含在交互式设置/配置选择器中
- `docs`：在文档/导航界面中将该渠道标记为面向公众

<Note>
`showConfigured` 和 `showInSetup` 仍作为旧版别名受支持。优先使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是包元数据，不是清单元数据。

| 字段                         | 类型                                | 含义                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | 用于安装/更新和新手引导按需安装流程的规范 ClawHub spec。                         |
| `npmSpec`                    | `string`                            | 用于安装/更新回退流程的规范 npm spec。                                           |
| `localPath`                  | `string`                            | 本地开发或内置安装路径。                                                         |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 当有多个来源可用时的首选安装来源。                                               |
| `minHostVersion`             | `string`                            | 最低支持的 OpenClaw 版本，格式为 `>=x.y.z` 或 `>=x.y.z-prerelease`。             |
| `expectedIntegrity`          | `string`                            | 用于固定安装的预期 npm dist 完整性字符串，通常是 `sha512-...`。                  |
| `allowInvalidConfigRecovery` | `boolean`                           | 允许内置插件重装流程从特定的陈旧配置失败中恢复。                                |

<AccordionGroup>
  <Accordion title="新手引导行为">
    交互式新手引导也会在按需安装界面中使用 `openclaw.install`。如果你的插件在运行时加载前公开提供商认证选项或渠道设置/目录元数据，新手引导可以显示该选项，提示选择 ClawHub、npm 或本地安装，安装或启用插件，然后继续所选流程。ClawHub 新手引导选项使用 `clawhubSpec`，并且在存在时优先使用；npm 选项需要带有注册表 `npmSpec` 的可信目录元数据；精确版本和 `expectedIntegrity` 是可选的 npm 固定项。如果存在 `expectedIntegrity`，安装/更新流程会对 npm 强制执行它。将“显示什么”的元数据放在 `openclaw.plugin.json` 中，将“如何安装它”的元数据放在 `package.json` 中。
  </Accordion>
  <Accordion title="minHostVersion 强制执行">
    如果设置了 `minHostVersion`，安装和非内置清单注册表加载都会强制执行它。较旧的宿主会跳过外部插件；无效版本字符串会被拒绝。内置源码插件被视为与宿主检出版本一致。
  </Accordion>
  <Accordion title="固定 npm 安装">
    对于固定 npm 安装，请在 `npmSpec` 中保留精确版本，并添加预期的构件完整性：

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
  <Accordion title="allowInvalidConfigRecovery 范围">
    `allowInvalidConfigRecovery` 不是破损配置的通用绕过。它只用于狭窄的内置插件恢复，因此重装/设置可以修复已知升级遗留问题，例如缺少内置插件路径，或同一插件的陈旧 `channels.<id>` 条目。如果配置因无关原因损坏，安装仍会失败关闭，并提示操作员运行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延迟完整加载

渠道插件可以通过以下方式选择延迟加载：

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

启用后，即使对于已配置的渠道，OpenClaw 也只会在监听前启动阶段加载 `setupEntry`。完整入口会在 Gateway 网关开始监听后加载。

<Warning>
只有当你的 `setupEntry` 注册了 Gateway 网关开始监听前所需的一切（渠道注册、HTTP 路由、Gateway 网关方法）时，才启用延迟加载。如果完整入口拥有必需的启动能力，请保留默认行为。
</Warning>

如果你的设置/完整入口注册了 Gateway 网关 RPC 方法，请将它们放在插件专用前缀下。保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持由核心拥有，并且始终解析为 `operator.admin`。

## 插件清单

每个 Native Codex plugins 都必须在包根目录中随附 `openclaw.plugin.json`。OpenClaw 使用它在不执行插件代码的情况下验证配置。

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

即使没有配置的插件也必须随附 schema。空 schema 是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

请参阅[插件清单](/zh-CN/plugins/manifest)了解完整 schema 参考。

## ClawHub 发布

对于插件包，请使用包专用的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
旧版仅 Skills 发布别名供 Skills 使用。插件包应始终使用 `clawhub package publish`。
</Note>

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量替代入口，OpenClaw 在只需要设置接口面（新手引导、配置修复、禁用渠道检查）时会加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这避免在设置流程中加载重型运行时代码（加密库、CLI 注册、后台服务）。

在伴生模块中保留设置安全导出的内置工作区渠道，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。该内置契约还支持可选的 `runtime` 导出，使设置时的运行时装配保持轻量且明确。

<AccordionGroup>
  <Accordion title="OpenClaw 何时使用 setupEntry 而不是完整入口">
    - 渠道已禁用，但需要设置/新手引导接口面。
    - 渠道已启用，但未配置。
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
    - 重型运行时导入（加密库、SDK）。
    - 仅在启动后需要的 Gateway 网关方法。

  </Accordion>
</AccordionGroup>

### 窄范围设置辅助导入

在需要高频加载的仅设置路径上，如果你只需要设置接口面的一部分，优先使用窄范围设置辅助接口，而不是更宽泛的 `plugin-sdk/setup` 总入口：

| 导入路径                           | 用途                                                                                      | 关键导出                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 设置时运行时辅助工具，可在 `setupEntry` / 延迟渠道启动中保持可用                          | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容别名；请使用 `plugin-sdk/setup-runtime`                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/归档/文档辅助工具                                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

当你需要完整的共享设置工具箱时，请使用更宽泛的 `plugin-sdk/setup` 接口，包括 `moveSingleAccountChannelSectionToDefaultAccount(...)` 等配置补丁辅助工具。

设置补丁适配器在导入时保持热路径安全。其内置单账号提升契约接口面查找是懒加载的，因此导入 `plugin-sdk/setup-runtime` 不会在适配器实际使用前急切加载内置契约接口面发现逻辑。

### 渠道拥有的单账号提升

当某个渠道从单账号顶层配置升级为 `channels.<id>.accounts.*` 时，默认共享行为是将提升后的账号作用域值移动到 `accounts.default`。

内置渠道可以通过其设置契约接口面收窄或覆盖该提升：

- `singleAccountKeysToMove`：应移动到被提升账号的额外顶层键
- `namedAccountPromotionKeys`：当命名账号已存在时，仅这些键会移动到被提升账号；共享策略/投递键保留在渠道根级别
- `resolveSingleAccountPromotionTarget(...)`：选择由哪个现有账号接收被提升的值

<Note>
Matrix 是当前的内置示例。如果已经恰好存在一个命名的 Matrix 账号，或者如果 `defaultAccount` 指向 `Ops` 等现有非规范键，提升会保留该账号，而不是创建新的 `accounts.default` 条目。
</Note>

## 配置架构

插件配置会根据你的清单中的 JSON Schema 进行验证。用户通过以下方式配置插件：

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

你的插件在注册期间会以 `api.pluginConfig` 接收此配置。

对于特定渠道配置，请改用渠道配置段：

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

使用 `buildChannelConfigSchema` 将 Zod 架构转换为插件拥有的配置工件使用的 `ChannelConfigSchema` 包装器：

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

如果你已经用 JSON Schema 或 TypeBox 编写契约，请使用直接辅助函数，这样 OpenClaw 就能在元数据路径上跳过从 Zod 到 JSON Schema 的转换：

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

对于第三方插件，冷路径契约仍然是插件清单：将生成的 JSON Schema 镜像到 `openclaw.plugin.json#channelConfigs`，这样配置架构、设置和 UI 接口面就能在不加载运行时代码的情况下检查 `channels.<id>`。

## 设置向导

渠道插件可以为 `openclaw onboard` 提供交互式设置向导。该向导是 `ChannelPlugin` 上的 `ChannelSetupWizard` 对象：

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

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整示例请参见内置插件包（例如 Discord 插件的 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共享的 allowFrom 提示">
    对于只需要标准 `note -> prompt -> parse -> merge -> patch` 流程的私信允许列表提示，优先使用来自 `openclaw/plugin-sdk/setup` 的共享设置辅助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="标准渠道设置状态">
    对于仅因标签、分数和可选额外行而变化的渠道设置状态块，优先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)`，而不是在每个插件中手写相同的 `status` 对象。
  </Accordion>
  <Accordion title="可选渠道设置接口面">
    对于只应在特定上下文中出现的可选设置接口面，请使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

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

    当你只需要该可选安装接口面的一半时，`plugin-sdk/channel-setup` 还暴露了更底层的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 构建器。

    生成的可选适配器/向导对真实配置写入采用失败关闭策略。它们在 `validateInput`、`applyAccountConfig` 和 `finalize` 中复用同一条需要安装的消息，并在设置 `docsPath` 时追加文档链接。

  </Accordion>
  <Accordion title="二进制文件驱动的设置辅助工具">
    对于二进制文件驱动的设置 UI，优先使用共享委托辅助工具，而不是在每个渠道中复制相同的二进制文件/状态衔接代码：

    - `createDetectedBinaryStatus(...)` 用于仅因标签、提示、分数和二进制文件检测而变化的状态块
    - `createCliPathTextInput(...)` 用于由路径支撑的文本输入
    - 当 `setupEntry` 需要懒加载转发到更重的完整向导时，使用 `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`
    - 当 `setupEntry` 只需要委托 `textInputs[*].shouldPrompt` 决策时，使用 `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 发布和安装

**外部插件：**发布到 [ClawHub](/zh-CN/clawhub)，然后安装：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    不带前缀的包规范会在发布切换期间从 npm 安装。

  </Tab>
  <Tab title="仅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 包规范">
    当包尚未迁移到 ClawHub，或迁移期间需要直接 npm 安装路径时，请使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**仓库内插件：** 放在内置插件工作区树下，它们会在构建期间自动被发现。

**用户可以安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
对于来自 npm 的安装，`openclaw plugins install` 会在 `~/.openclaw/npm` 下安装包，并禁用生命周期脚本。请保持插件依赖树为纯 JS/TS，并避免使用需要 `postinstall` 构建的包。
</Info>

<Note>
Gateway 网关启动不会安装插件依赖。npm/git/ClawHub 安装流程负责依赖收敛；本地插件必须已经安装好其依赖。
</Note>

内置包元数据是显式的，不是在 Gateway 网关启动时从构建后的 JavaScript 推断出来的。运行时依赖属于拥有它们的插件包；打包版 OpenClaw 启动绝不会修复或镜像插件依赖。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 逐步入门指南
- [插件清单](/zh-CN/plugins/manifest) — 完整清单 schema 参考
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
