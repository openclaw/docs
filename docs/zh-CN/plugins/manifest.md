---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要交付插件配置 schema，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-25T00:42:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: ada68754e06044810bb38c890e1aa6cb2b62fe70103306417486fc6504a57c38
    source_path: plugins/manifest.md
    workflow: 15
---

本页仅适用于**原生 OpenClaw 插件清单**。

有关兼容的 bundle 布局，请参见 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会根据此处描述的 `openclaw.plugin.json` schema 对其进行验证。

对于兼容 bundle，当布局符合 OpenClaw 运行时预期时，OpenClaw 当前会读取 bundle 元数据、声明的 skill 根目录、Claude 命令根目录、Claude bundle 的 `settings.json` 默认值、Claude bundle 的 LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用这个清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

参见完整的插件系统指南：[Plugins](/zh-CN/tools/plugin)。
有关原生能力模型和当前外部兼容性指导，请参见：
[Capability model](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。以下所有内容都必须足够轻量，以便在不启动插件运行时的情况下进行检查。

**用于：**

- 插件标识、配置验证和配置 UI 提示
- 凭证、新手引导和设置元数据（别名、自动启用、提供商环境变量、凭证选项）
- 控制平面界面的激活提示
- 简写的模型家族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 主机可检查的 QA 运行器元数据
- 合并到目录和验证界面的渠道专用配置元数据

**不要用于：** 注册运行时行为、声明代码入口点或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

## 最小示例

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## 完整示例

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## 顶层字段参考

| 字段 | 必需 | 类型 | 含义 |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` | 是 | `string` | 规范插件 ID。这是在 `plugins.entries.<id>` 中使用的 ID。 |
| `configSchema` | 是 | `object` | 此插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略此字段，或将其设置为任何非 `true` 的值，则插件默认保持禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此标准插件 ID 的旧版 ID。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当凭证、配置或模型引用提到这些提供商 ID 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的排他性插件类型。 |
| `channels` | 否 | `string[]` | 由此插件拥有的渠道 ID。用于发现和配置验证。 |
| `providers` | 否 | `string[]` | 由此插件拥有的提供商 ID。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级提供商发现模块路径，相对于插件根目录，用于范围限定在清单内的提供商目录元数据，这些元数据可以在不激活完整插件运行时的情况下加载。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的 endpoint 主机 / `baseUrl` 元数据，用于核心在提供商运行时加载之前必须分类的提供商路由。 |
| `cliBackends` | 否 | `string[]` | 由此插件拥有的 CLI 推理后端 ID。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 在运行时加载之前的冷模型发现期间，应探测其插件自有 synthetic auth hook 的提供商或 CLI 后端引用。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API key 值，表示非密钥的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 由此插件拥有的命令名称，应在运行时加载前生成具备插件感知能力的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | 用于提供商鉴权 / 状态查找的已弃用兼容环境变量元数据。新插件优先使用 `setup.providers[].envVars`；在弃用窗口期内，OpenClaw 仍会读取此字段。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个提供商 ID 进行鉴权查找的提供商 ID，例如与基础提供商共享 API key 和 auth profiles 的 coding 提供商。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可以在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。对于通用启动 / 配置帮助器需要感知的环境变量驱动渠道设置或鉴权界面，请使用此字段。 |
| `providerAuthChoices` | 否 | `object[]` | 用于新手引导选择器、首选提供商解析和简单 CLI 标志接线的轻量级鉴权选项元数据。 |
| `activation` | 否 | `object` | 用于基于提供商、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 供设备发现和设置界面在不加载插件运行时的情况下检查的轻量级设置 / 新手引导描述符。 |
| `qaRunners` | 否 | `object[]` | 在插件运行时加载之前，由共享 `openclaw qa` 主机使用的轻量级 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 针对外部鉴权 hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web-fetch、Web 搜索和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的提供商 ID 提供的轻量级媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，在运行时加载之前合并到设备发现和验证界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 在插件界面中显示的简短摘要。 |
| `version` | 否 | `string` | 信息性插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或鉴权选项。
OpenClaw 会在提供商运行时加载之前读取它。
提供商设置流程会优先使用这些清单选项，然后为了兼容性回退到运行时向导元数据和安装目录选项。

| 字段 | 必需 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的提供商 ID。 |
| `method` | 是 | `string` | 要分派到的鉴权方法 ID。 |
| `choiceId` | 是 | `string` | 由新手引导和 CLI 流程使用的稳定鉴权选项 ID。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短帮助文本。 |
| `assistantPriority` | 否 | `number` | 在由智能体驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在智能体选择器中隐藏该选项，但仍允许手动 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 ID。 |
| `groupId` | 否 | `string` | 用于分组相关选项的可选分组 ID。 |
| `groupLabel` | 否 | `string` | 该分组的面向用户标签。 |
| `groupHint` | 否 | `string` | 该分组的简短帮助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志鉴权流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | CLI 帮助中使用的描述。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选项应显示在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当某个插件拥有一个运行时命令名称，而用户可能会错误地将其放入 `plugins.allow`，或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据在不导入插件运行时代码的情况下生成诊断信息。

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| 字段 | 必需 | 类型 | 含义 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | 是 | `string` | 属于此插件的命令名称。 |
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。 |
| `cliCommand` | 否 | `string` | 若存在，可建议用于 CLI 操作的相关根 CLI 命令。 |

## `activation` 参考

当插件可以低成本声明哪些控制平面事件应将其纳入激活 / 加载计划时，请使用 `activation`。

该块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段来缩小候选插件范围，然后才回退到现有的清单归属元数据，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks。

优先使用已经能描述归属关系的最窄元数据。如果这些字段已经表达该关系，请使用 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts`。对于那些无法由这些归属字段表示的额外规划器提示，再使用 `activation`。

该块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方会在更广泛的插件加载之前将其作为缩小范围的提示，因此缺失激活元数据通常只会带来性能成本；在旧版清单归属回退仍存在时，它不应改变正确性。

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 字段 | 必需 | 类型 | 含义 |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的提供商 ID。 |
| `onCommands` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的命令 ID。 |
| `onChannels` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的渠道 ID。 |
| `onRoutes` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 供控制平面激活规划使用的宽泛能力提示。尽可能优先使用更窄的字段。 |

当前在线使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置 / 渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]`
  归属
- 由提供商触发的设置 / 运行时规划在缺少显式提供商
  激活元数据时，会回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 归属。这些原因标签用于宿主诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享 `openclaw qa` 根命令下贡献一个或多个传输运行器时，请使用 `qaRunners`。保持这些元数据轻量且静态；实际 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 界面负责。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| 字段 | 必需 | 类型 | 含义 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是 | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。 |
| `description` | 否 | `string` | 当共享宿主需要一个存根命令时使用的回退帮助文本。 |

## `setup` 参考

当设置和新手引导界面需要在运行时加载之前获取廉价的插件自有元数据时，请使用 `setup`。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面 / 设置流程、应保持为纯元数据的设置专用描述符界面。

当存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现时优先使用的、以描述符为先的查找界面。如果描述符只能缩小候选插件范围，而设置仍需要更丰富的设置时运行时 hooks，请设置 `requiresRuntime: true`，并将 `setup-api` 保留为回退执行路径。

OpenClaw 还会在通用提供商凭证和环境变量查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用窗口期内仍通过兼容适配器受支持，但仍使用它的非内置插件会收到清单诊断。新插件应将设置 / 状态环境变量元数据放在 `setup.providers[].envVars` 上。

当没有可用的设置入口时，或者 `setup.requiresRuntime: false` 声明设置运行时不是必需时，OpenClaw 还可以从 `setup.providers[].authMethods` 派生简单的设置选项。对于自定义标签、CLI 标志、新手引导范围和智能体元数据，显式的 `providerAuthChoices` 条目仍然是首选。

仅当这些描述符已足以满足设置界面时，才将 `requiresRuntime` 设为 `false`。OpenClaw 会将显式的 `false` 视为纯描述符契约，并且不会为设置查找执行 `setup-api` 或 `openclaw.setupEntry`。如果一个纯描述符插件仍然提供了这些设置运行时入口之一，OpenClaw 会报告附加诊断并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，这样那些在未设置该标志的情况下添加了描述符的现有插件不会出错。

由于设置查找可能会执行插件自有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在已发现插件之间必须保持唯一。归属不明确时会以封闭失败的方式处理，而不是根据发现顺序选出“赢家”。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的提供商或 CLI 后端，或者某个描述符没有匹配的运行时注册，则设置注册表诊断会报告描述符漂移。这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必需 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或新手引导期间公开的提供商 ID。保持规范化 ID 在全局唯一。 |
| `authMethods` | 否 | `string[]` | 此提供商在不加载完整运行时的情况下支持的设置 / 鉴权方法 ID。 |
| `envVars` | 否 | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必需 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和新手引导期间公开的提供商设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置时后端 ID。保持规范化 ID 在全局唯一。 |
| `configMigrations` | 否 | `string[]` | 属于此插件设置界面的配置迁移 ID。 |
| `requiresRuntime` | 否 | `boolean` | 在描述符查找之后，设置是否仍需要执行 `setup-api`。 |

## `uiHints` 参考

`uiHints` 是从配置字段名到小型渲染提示的映射。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每个字段提示可以包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短帮助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级字段。 |
| `sensitive` | `boolean` | 将该字段标记为密钥或敏感字段。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅当 OpenClaw 可以在不导入插件运行时的情况下读取静态能力归属元数据时，才使用 `contracts`。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段 | 类型 | 含义 |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | 已弃用的内嵌扩展工厂 ID。 |
| `agentToolResultMiddleware` | `string[]` | 内置插件可为其注册工具结果中间件的运行时 ID。 |
| `externalAuthProviders` | `string[]` | 其外部凭证 profile hook 由此插件拥有的提供商 ID。 |
| `speechProviders` | `string[]` | 由此插件拥有的语音提供商 ID。 |
| `realtimeTranscriptionProviders` | `string[]` | 由此插件拥有的实时转录提供商 ID。 |
| `realtimeVoiceProviders` | `string[]` | 由此插件拥有的实时语音提供商 ID。 |
| `memoryEmbeddingProviders` | `string[]` | 由此插件拥有的记忆嵌入提供商 ID。 |
| `mediaUnderstandingProviders` | `string[]` | 由此插件拥有的媒体理解提供商 ID。 |
| `imageGenerationProviders` | `string[]` | 由此插件拥有的图像生成提供商 ID。 |
| `videoGenerationProviders` | `string[]` | 由此插件拥有的视频生成提供商 ID。 |
| `webFetchProviders` | `string[]` | 由此插件拥有的 web-fetch 提供商 ID。 |
| `webSearchProviders` | `string[]` | 由此插件拥有的 Web 搜索提供商 ID。 |
| `tools` | `string[]` | 为内置契约检查而由此插件拥有的智能体工具名称。 |

`contracts.embeddedExtensionFactories` 被保留用于仍需要直接 Pi 内嵌运行器事件的内置兼容代码。新的内置工具结果转换应声明 `contracts.agentToolResultMiddleware`，并改为使用 `api.registerAgentToolResultMiddleware(...)` 注册。
外部插件无法注册工具结果中间件，因为该接口可以在模型看到之前重写高信任度工具输出。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`。未声明该字段的插件仍会通过已弃用的兼容回退运行，但该回退更慢，并将在迁移窗口结束后移除。

内置记忆嵌入提供商应为其公开的每个适配器 ID 声明 `contracts.memoryEmbeddingProviders`，包括诸如 `local` 之类的内建适配器。独立 CLI 路径会使用此清单契约，仅在完整 Gateway 网关运行时注册提供商之前加载其所属插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解提供商具有默认模型、自动凭证回退优先级，或通用核心帮助器在运行时加载之前所需的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键还必须在 `contracts.mediaUnderstandingProviders` 中声明。

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

每个提供商条目可以包含：

| 字段 | 类型 | 含义 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | 此提供商公开的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的“能力到模型”默认值。 |
| `autoPriority` | `Record<string, number>` | 对于基于凭证的自动提供商回退，数字越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该提供商支持的原生文档输入。 |

## `channelConfigs` 参考

当渠道插件在运行时加载之前需要廉价的配置元数据时，请使用 `channelConfigs`。对于已配置的外部渠道，如果没有可用设置入口，或者 `setup.requiresRuntime: false` 声明设置运行时不是必需，则只读渠道设置 / 状态发现可直接使用这些元数据。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明了 `channels[]` 的非内置插件也应声明对应的 `channelConfigs` 条目。若未声明，OpenClaw 仍可加载该插件，但冷路径配置 schema、设置和 Control UI 界面在插件运行时执行之前无法知道该渠道自有选项的结构。

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

每个渠道条目可以包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。每个声明的渠道配置条目都必须提供。 |
| `uiHints` | `Record<string, object>` | 该渠道配置段的可选 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未准备好时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道描述。 |
| `preferOver` | `string[]` | 在选择界面中，此渠道应优先于的旧版或低优先级插件 ID。 |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载之前，通过诸如 `gpt-5.5` 或 `claude-sonnet-4.6` 之类的简写模型 ID 推断你的提供商插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 采用以下优先级：

- 显式 `provider/model` 引用使用其所属的 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件同时匹配，则非内置插件胜出
- 剩余歧义会被忽略，直到用户或配置明确指定提供商

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 针对简写模型 ID 使用 `startsWith` 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，针对简写模型 ID 进行匹配的正则表达式源码。 |

旧版顶层能力键已弃用。请使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；普通清单加载不再将这些顶层字段视为能力归属。

## 清单与 `package.json`

这两个文件承担不同的职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置验证、鉴权选项元数据，以及必须在插件代码运行前存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块 |

如果你不确定某条元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，请将其放入 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，请将其放入 `package.json`

### 会影响设备发现的 `package.json` 字段

一些运行时之前的插件元数据有意放在 `package.json` 的 `openclaw` 块下，而不是放在 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保留在插件包目录内。 |
| `openclaw.runtimeExtensions` | 为已安装包声明已构建的 JavaScript 运行时入口点。必须保留在插件包目录内。 |
| `openclaw.setupEntry` | 轻量级、仅用于设置的入口点，用于新手引导、延迟渠道启动以及只读渠道状态 / SecretRef 发现。必须保留在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装包声明已构建的 JavaScript 设置入口点。必须保留在插件包目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.configuredState` | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经存在仅环境变量的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化凭证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何已登录状态？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置和外部发布插件的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 当存在多个安装来源时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 宿主版本，使用类似 `>=2026.3.22` 的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会据此验证获取到的制品。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个范围狭窄的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许仅设置用的渠道界面在启动期间先于完整渠道插件加载。 |

清单元数据决定了在运行时加载之前，新手引导中会出现哪些提供商 / 渠道 / 设置选项。`package.json#openclaw.install` 则告诉新手引导：当用户选择这些选项之一时，应如何获取或启用该插件。不要将安装提示移入 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；较新的但有效的值会让旧宿主跳过该插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确规格与 `expectedIntegrity` 配对使用，这样如果获取到的 npm 制品不再匹配固定发布版本，更新流程就会以封闭失败的方式中止。出于兼容性考虑，交互式新手引导仍会提供受信任注册表的 npm 规格，包括裸包名和 dist-tag。目录诊断可以区分精确、浮动、带完整性固定、缺少完整性、包名不匹配和无效默认选项来源。它们还会在存在 `expectedIntegrity` 但没有可用于固定的有效 npm 来源时发出警告。当存在 `expectedIntegrity` 时，安装 / 更新流程会强制执行它；当其被省略时，注册表解析结果会被记录，但不会带有完整性固定。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。该设置入口应公开渠道元数据以及适用于设置场景的配置、状态和密钥适配器；将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能使一个越界的 `openclaw.extensions` 路径变为可加载。

`openclaw.install.allowInvalidConfigRecovery` 的范围是有意保持狭窄的。它不会让任意损坏的配置变得可安装。当前它只允许安装流程从特定的旧内置插件升级故障中恢复，例如缺失的内置插件路径，或属于同一内置插件的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将运维人员引导至 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个微型检查器模块的包元数据：

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

当设置、doctor 或已配置状态流程需要在完整渠道插件加载之前进行廉价的“是 / 否”凭证探测时，请使用它。目标导出应是一个仅仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 来路由它。

`openclaw.channel.configuredState` 对于廉价的仅环境变量已配置检查采用相同结构：

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

当某个渠道可以基于环境变量或其他微小的非运行时输入来回答已配置状态时，请使用它。如果该检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复插件 ID）

OpenClaw 会从多个根目录发现插件（内置、全局安装、工作区、显式由配置选择的路径）。如果两个发现结果共享相同的 `id`，则只保留**优先级最高**的清单；较低优先级的重复项会被丢弃，而不会与其并行加载。

优先级从高到低如下：

1. **配置选定** — 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** — 随 OpenClaw 一起发布的插件
3. **全局安装** — 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** — 相对于当前工作区发现的插件

影响：

- 工作区中某个内置插件的 fork 或过期副本不会覆盖内置构建。
- 如果你确实想用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其凭借优先级获胜，而不是依赖工作区发现。
- 被丢弃的重复项会被记录到日志中，以便 Doctor 和启动诊断可以指出被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读取 / 写入时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 ID 由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现**的插件 ID。未知 ID 是**错误**。
- 如果插件已安装，但清单或 schema 缺失或损坏，则验证会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件已**禁用**，则配置会被保留，并在 Doctor + 日志中显示**警告**。

完整 `plugins.*` schema 请参见 [Configuration reference](/zh-CN/gateway/configuration)。

## 说明

- 对于**原生 OpenClaw 插件**，包括本地文件系统加载，清单都是**必需的**。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍是一个对象，就接受注释、尾随逗号和未加引号的键。
- 清单加载器只会读取文档中说明的清单字段。避免使用自定义顶层键。
- 当插件不需要它们时，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；应将其用于静态提供商目录元数据或狭义发现描述符，而不是请求时执行。
- 排他性插件类型通过 `plugins.slots.*` 进行选择：`kind: "memory"` 通过 `plugins.slots.memory` 选择，`kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认值 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅是声明式的。状态、审计、cron 投递验证和其他只读界面在将某个环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 对于需要提供商代码的运行时向导元数据，请参见 [Provider runtime hooks](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关内容

<CardGroup cols={3}>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件入门指南。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="插件 SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考和子路径导入。
  </Card>
</CardGroup>
