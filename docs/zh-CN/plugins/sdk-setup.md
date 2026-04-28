---
read_when:
    - 你正在为一个插件添加设置向导
    - 你需要理解 `setup-entry.ts` 与 `index.ts` 的区别
    - 你正在定义插件配置 schema 或 `package.json` 中的 OpenClaw 元数据
sidebarTitle: Setup and config
summary: 设置向导、`setup-entry.ts`、配置 schema，以及 `package.json` 元数据
title: 插件设置和配置
x-i18n:
    generated_at: "2026-04-26T08:13:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

插件打包（`package.json` 元数据）、清单（`openclaw.plugin.json`）、设置入口和配置 schema 的参考文档。

<Tip>
**想看操作演练？** 操作指南会在具体上下文中讲解打包流程：[渠道插件](/zh-CN/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和 [提供商插件](/zh-CN/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要一个 `openclaw` 字段，用来告诉插件系统你的插件提供了什么：

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
          "blurb": "渠道的简短说明。"
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
如果你要在 ClawHub 上对外发布插件，则必须提供这些 `compat` 和 `build` 字段。规范的发布片段位于 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 字段

<ParamField path="extensions" type="string[]">
  入口点文件（相对于包根目录）。
</ParamField>
<ParamField path="setupEntry" type="string">
  仅用于设置的轻量入口（可选）。
</ParamField>
<ParamField path="channel" type="object">
  用于设置、选择器、快速开始和状态界面的渠道目录元数据。
</ParamField>
<ParamField path="providers" type="string[]">
  该插件注册的提供商 id。
</ParamField>
<ParamField path="install" type="object">
  安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  启动行为标记。
</ParamField>

### `openclaw.channel`

`openclaw.channel` 是轻量级包元数据，用于在运行时加载前支持渠道发现和设置界面。

| 字段                                   | 类型       | 含义                                                                           |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | 规范渠道 id。                                                                  |
| `label`                                | `string`   | 主要渠道标签。                                                                 |
| `selectionLabel`                       | `string`   | 当需要区别于 `label` 时，在选择器/设置中显示的标签。                           |
| `detailLabel`                          | `string`   | 用于更丰富渠道目录和状态界面的次级详细标签。                                   |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。                                                 |
| `docsLabel`                            | `string`   | 当文档链接标签需要区别于渠道 id 时使用的覆盖标签。                             |
| `blurb`                                | `string`   | 简短的新手引导/目录说明。                                                      |
| `order`                                | `number`   | 在渠道目录中的排序顺序。                                                       |
| `aliases`                              | `string[]` | 渠道选择的额外查找别名。                                                       |
| `preferOver`                           | `string[]` | 该渠道应优先于哪些较低优先级的插件/渠道 id。                                   |
| `systemImage`                          | `string`   | 渠道 UI 目录中可选的图标/系统图像名称。                                        |
| `selectionDocsPrefix`                  | `string`   | 在选择界面中显示于文档链接前的前缀文本。                                       |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径，而不是显示带标签的文档链接。                     |
| `selectionExtras`                      | `string[]` | 附加到选择文案中的额外简短字符串。                                             |
| `markdownCapable`                      | `boolean`  | 将该渠道标记为支持 Markdown，以便进行出站格式化决策。                          |
| `exposure`                             | `object`   | 控制渠道在设置、已配置列表和文档界面中的可见性。                               |
| `quickstartAllowFrom`                  | `boolean`  | 允许该渠道使用标准快速开始 `allowFrom` 设置流程。                              |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一个账号，也要求显式账号绑定。                                       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 为该渠道解析通知目标时，优先使用会话查找。                                     |

示例：

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel（自托管）",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "基于 Webhook 的自托管聊天集成。",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "指南：",
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

- `configured`：在已配置/状态类列表界面中包含该渠道
- `setup`：在交互式设置/配置选择器中包含该渠道
- `docs`：将该渠道标记为在文档/导航界面中对外可见

<Note>
`showConfigured` 和 `showInSetup` 仍然作为旧版别名受支持。推荐优先使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是包元数据，不是清单元数据。

| 字段                         | 类型                 | 含义                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 用于安装/更新流程的规范 npm spec。                                               |
| `localPath`                  | `string`             | 本地开发或内置安装路径。                                                         |
| `defaultChoice`              | `"npm"` \| `"local"` | 当两者都可用时，优先使用的安装来源。                                             |
| `minHostVersion`             | `string`             | 最低支持的 OpenClaw 版本，格式为 `>=x.y.z`。                                     |
| `expectedIntegrity`          | `string`             | 预期的 npm dist 完整性字符串，通常为 `sha512-...`，用于固定版本安装。            |
| `allowInvalidConfigRecovery` | `boolean`            | 允许内置插件的重新安装流程从特定的过期配置错误中恢复。                           |

<AccordionGroup>
  <Accordion title="新手引导行为">
    交互式新手引导也会使用 `openclaw.install` 来支持按需安装界面。如果你的插件在运行时加载前就公开提供商认证选项，或提供渠道设置/目录元数据，新手引导就可以显示该选项，提示选择 npm 还是本地安装，安装或启用插件，然后继续所选流程。npm 新手引导选项需要可信的目录元数据以及注册表中的 `npmSpec`；精确版本和 `expectedIntegrity` 是可选的固定项。如果提供了 `expectedIntegrity`，安装/更新流程会强制校验它。请将“显示什么”的元数据放在 `openclaw.plugin.json` 中，将“如何安装”的元数据放在 `package.json` 中。
  </Accordion>
  <Accordion title="`minHostVersion` 强制执行">
    如果设置了 `minHostVersion`，安装和清单注册表加载都会强制执行它。较旧的宿主会跳过该插件；无效的版本字符串会被拒绝。
  </Accordion>
  <Accordion title="固定版本的 npm 安装">
    对于固定版本的 npm 安装，请在 `npmSpec` 中保留精确版本，并添加预期的制品完整性值：

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
  <Accordion title="`allowInvalidConfigRecovery` 的适用范围">
    `allowInvalidConfigRecovery` 并不是对损坏配置的通用绕过机制。它只适用于狭窄范围内的内置插件恢复场景，使重新安装/设置能够修复已知升级遗留问题，例如缺失的内置插件路径，或同一插件对应的过期 `channels.<id>` 条目。如果配置因无关原因损坏，安装仍会以安全关闭方式失败，并提示操作员运行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延迟完整加载

渠道插件可以通过以下方式选择启用延迟加载：

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

启用后，OpenClaw 在监听前的启动阶段只会加载 `setupEntry`，即使该渠道已经配置完成也是如此。完整入口会在 Gateway 网关开始监听后再加载。

<Warning>
只有当你的 `setupEntry` 已注册 Gateway 网关在开始监听前所需的一切内容时，才应启用延迟加载（渠道注册、HTTP 路由、Gateway 网关方法）。如果完整入口拥有启动所需的关键能力，请保持默认行为。
</Warning>

如果你的设置/完整入口会注册 Gateway 网关 RPC 方法，请将它们保留在插件专属前缀下。保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍归核心所有，并始终解析为 `operator.admin`。

## 插件清单

每个原生插件都必须在包根目录中提供一个 `openclaw.plugin.json`。OpenClaw 会用它在不执行插件代码的情况下验证配置。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "为 OpenClaw 添加 My Plugin 功能",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook 验证密钥"
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

<Note>
旧版仅 Skills 的发布别名是给 Skills 使用的。插件包始终应使用 `clawhub package publish`。
</Note>

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量替代方案，当 OpenClaw 只需要设置界面时（新手引导、配置修复、已禁用渠道检查）就会加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在设置流程中加载沉重的运行时代码（加密库、CLI 注册、后台服务）。

对于将设置安全导出保存在 sidecar 模块中的内置工作区渠道，可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`，而不是 `defineSetupPluginEntry(...)`。该内置契约也支持可选的 `runtime` 导出，从而让设置时的运行时接线保持轻量且明确。

<AccordionGroup>
  <Accordion title="OpenClaw 何时使用 setupEntry 而不是完整入口">
    - 渠道已禁用，但仍需要设置/新手引导界面。
    - 渠道已启用，但尚未配置。
    - 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必须注册什么">
    - 渠道插件对象（通过 `defineSetupPluginEntry`）。
    - Gateway 网关开始监听前所需的任何 HTTP 路由。
    - 启动期间所需的任何 Gateway 网关方法。

    这些启动期 Gateway 网关方法仍应避免使用保留的核心管理命名空间，例如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不应包含什么">
    - CLI 注册。
    - 后台服务。
    - 沉重的运行时导入（加密、SDK）。
    - 仅在启动后才需要的 Gateway 网关方法。

  </Accordion>
</AccordionGroup>

### 缩窄的设置辅助导入

对于仅设置的热路径，如果你只需要设置界面的一部分，优先使用这些缩窄的设置辅助接缝，而不是更宽泛的 `plugin-sdk/setup` 总入口：

| 导入路径                           | 适用场景                                                                                | 关键导出                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟渠道启动中仍可用的设置时运行时辅助工具                           | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 具备环境感知能力的账号设置适配器                                                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI、归档、文档辅助工具                                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

当你需要完整的共享设置工具箱时，请使用更宽泛的 `plugin-sdk/setup` 接缝，其中也包括诸如 `moveSingleAccountChannelSectionToDefaultAccount(...)` 这样的配置补丁辅助工具。

这些设置补丁适配器在导入时仍然是热路径安全的。它们对内置单账号提升契约界面的查找是惰性的，因此导入 `plugin-sdk/setup-runtime` 不会在适配器真正使用前就急切加载内置契约界面发现逻辑。

### 渠道自有的单账号提升

当某个渠道从单账号顶层配置升级到 `channels.<id>.accounts.*` 时，默认的共享行为是将被提升的账号范围值移动到 `accounts.default` 中。

内置渠道可以通过其设置契约界面来缩窄或覆盖这一提升行为：

- `singleAccountKeysToMove`：应移动到提升后账号中的额外顶层键
- `namedAccountPromotionKeys`：当具名账号已存在时，只有这些键会移动到提升后的账号中；共享策略/投递键会保留在渠道根部
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账号接收被提升的值

<Note>
Matrix 是当前的内置示例。如果恰好已存在一个具名的 Matrix 账号，或者 `defaultAccount` 指向某个现有的非规范键（例如 `Ops`），提升过程会保留该账号，而不是新建 `accounts.default` 条目。
</Note>

## 配置 schema

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

你的插件在注册期间会通过 `api.pluginConfig` 接收这份配置。

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

### 构建渠道配置 schema

使用 `buildChannelConfigSchema` 将一个 Zod schema 转换为插件自有配置制品所使用的 `ChannelConfigSchema` 包装器：

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

对于第三方插件，冷路径契约仍然是插件清单：请将生成的 JSON Schema 镜像到 `openclaw.plugin.json#channelConfigs` 中，这样配置 schema、设置和 UI 界面就可以在不加载运行时代码的情况下检查 `channels.<id>`。

## 设置向导

渠道插件可以为 `openclaw onboard` 提供交互式设置向导。该向导是 `ChannelPlugin` 上的一个 `ChannelSetupWizard` 对象：

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "已连接",
    unconfiguredLabel: "未配置",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot 令牌",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "使用环境变量中的 MY_CHANNEL_BOT_TOKEN 吗？",
      keepPrompt: "保留当前令牌吗？",
      inputPrompt: "输入你的 Bot 令牌：",
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

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等等。完整示例请参见内置插件包（例如 Discord 插件中的 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共享的 allowFrom 提示">
    对于只需要标准 `note -> prompt -> parse -> merge -> patch` 流程的私信允许列表提示，优先使用 `openclaw/plugin-sdk/setup` 中的共享设置辅助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="标准渠道设置状态">
    对于仅在标签、分数和可选额外行上存在差异的渠道设置状态块，优先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)`，而不是在每个插件中手写相同的 `status` 对象。
  </Accordion>
  <Accordion title="可选的渠道设置界面">
    对于只应在特定上下文中显示的可选设置界面，请使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // 返回 { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` 还公开了更底层的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 构建器，适用于你只需要这个可选安装界面的一半能力时。

    生成的可选适配器/向导在真实配置写入时会以安全关闭方式失败。它们会在 `validateInput`、`applyAccountConfig` 和 `finalize` 之间复用同一条“需要安装”的消息，并在设置了 `docsPath` 时追加文档链接。

  </Accordion>
  <Accordion title="由二进制驱动的设置辅助工具">
    对于由二进制驱动的设置 UI，优先使用共享的委托式辅助工具，而不是在每个渠道中复制相同的二进制/状态胶水代码：

    - `createDetectedBinaryStatus(...)`：适用于仅在标签、提示、分数和二进制检测上不同的状态块
    - `createCliPathTextInput(...)`：适用于基于路径的文本输入
    - `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`：适用于 `setupEntry` 需要惰性转发到更沉重的完整向导时
    - `createDelegatedTextInputShouldPrompt(...)`：适用于 `setupEntry` 只需要委托 `textInputs[*].shouldPrompt` 决策时

  </Accordion>
</AccordionGroup>

## 发布和安装

**外部插件：** 发布到 [ClawHub](/zh-CN/tools/clawhub) 或 npm，然后安装：

<Tabs>
  <Tab title="自动（先 ClawHub 后 npm）">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw 会先尝试 ClawHub，失败后自动回退到 npm。

  </Tab>
  <Tab title="仅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 包 spec">
    没有对应的 `npm:` 覆盖写法。当你希望在 ClawHub 回退之后走 npm 路径时，请使用普通的 npm 包 spec：

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**仓库内插件：** 放在内置插件工作区树下，构建期间会自动发现。

**用户可以安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
对于来源于 npm 的安装，`openclaw plugins install` 会运行项目本地的 `npm install --ignore-scripts`（不执行生命周期脚本），并忽略继承的全局 npm 安装设置。请保持插件依赖树为纯 JS/TS，并避免依赖那些需要 `postinstall` 构建的包。
</Info>

<Note>
只有 OpenClaw 自有的内置插件属于启动修复例外：当打包安装检测到某个插件已通过插件配置、旧版渠道配置，或其内置的默认启用清单被启用时，启动过程会在导入前先为该插件安装缺失的运行时依赖。第三方插件不应依赖启动时安装；请继续使用显式的插件安装器。
</Note>

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 分步的入门指南
- [插件清单](/zh-CN/plugins/manifest) — 完整的清单 schema 参考
- [SDK 入口点](/zh-CN/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
