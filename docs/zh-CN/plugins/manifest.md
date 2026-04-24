---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要提供插件配置 schema，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-24T05:09:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27765f1efc9720bd68c73d3ede796a91e9afec479f89eda531dd14adc708e53
    source_path: plugins/manifest.md
    workflow: 15
---

本页仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参阅 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会按照这里描述的 `openclaw.plugin.json` schema 对它们进行验证。

对于兼容 bundle，当前在布局符合 OpenClaw 运行时预期时，OpenClaw 会读取 bundle 元数据、声明的 skill 根目录、Claude 命令根目录、Claude bundle 的 `settings.json` 默认值、Claude bundle 的 LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码的情况下**验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整的插件系统指南：[Plugins](/zh-CN/tools/plugin)。
关于原生能力模型及当前的外部兼容性指导，请参阅：
[Capability model](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，能够在不启动插件运行时的情况下进行检查。

**用于：**

- 插件标识、配置验证，以及配置 UI 提示
- 凭证、onboarding 和设置元数据（别名、自动启用、provider 环境变量、认证选项）
- 控制平面界面的激活提示
- 简写的模型家族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 主机可检查的 QA runner 元数据
- 合并到目录和验证界面中的特定于渠道的配置元数据

**不要用于：**注册运行时行为、声明代码入口点，或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

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

| 字段 | 必填 | 类型 | 含义 |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` | 是 | `string` | 规范的插件 id。这是 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 此插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略此字段，或将其设置为任何非 `true` 的值，则该插件默认禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当凭证、配置或模型引用提到这些 provider id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明 `plugins.slots.*` 使用的独占插件类型。 |
| `channels` | 否 | `string[]` | 此插件拥有的渠道 id。用于设备发现和配置验证。 |
| `providers` | 否 | `string[]` | 此插件拥有的 provider id。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级 provider 发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、受清单作用域约束的 provider 目录元数据。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的 endpoint 主机 / `baseUrl` 元数据，用于核心在 provider 运行时加载前必须分类的 provider 路由。 |
| `cliBackends` | 否 | `string[]` | 此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | provider 或 CLI 后端引用，在运行时加载前的冷启动模型发现期间，应探测其插件拥有的 synthetic auth hook。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API key 值，表示非秘密的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 此插件拥有的命令名称，在运行时加载前应生成带有插件感知能力的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量级 provider 认证环境变量元数据。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行认证查找的 provider id，例如共享基础 provider API key 和认证配置文件的 coding provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于由环境变量驱动的渠道设置，或通用启动 / 配置辅助工具应识别的认证界面。 |
| `providerAuthChoices` | 否 | `object[]` | 用于 onboarding 选择器、首选 provider 解析和简单 CLI 标志接线的轻量级认证选项元数据。 |
| `activation` | 否 | `object` | 用于 provider、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 可供设备发现和设置界面在不加载插件运行时的情况下检查的轻量级设置 / onboarding 描述符。 |
| `qaRunners` | 否 | `object[]` | 共享 `openclaw qa` 主机在插件运行时加载前使用的轻量级 QA runner 描述符。 |
| `contracts` | 否 | `object` | 用于 external auth hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web-fetch、网页搜索和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的 provider id 提供的轻量级媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和验证界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skill 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件界面中的简短摘要。 |
| `version` | 否 | `string` | 仅供参考的插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个 onboarding 或认证选项。
OpenClaw 会在 provider 运行时加载前读取它。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的 provider id。 |
| `method` | 是 | `string` | 要分派到的认证方法 id。 |
| `choiceId` | 是 | `string` | onboarding 和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由智能体驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在智能体选择器中隐藏该选项，但仍允许通过手动 CLI 进行选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于对相关选项进行分组的可选组 id。 |
| `groupLabel` | 否 | `string` | 该组面向用户的标签。 |
| `groupHint` | 否 | `string` | 该组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 在 CLI 帮助中使用的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些 onboarding 界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有一个运行时命令名称，而用户可能会误将其放入 `plugins.allow`，或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据来生成诊断信息，而无需导入插件运行时代码。

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

| 字段 | 必填 | 类型 | 含义 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | 是 | `string` | 属于此插件的命令名称。 |
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。 |
| `cliCommand` | 否 | `string` | 若存在，用于 CLI 操作时建议的相关根 CLI 命令。 |

## `activation` 参考

当插件可以以低成本声明哪些控制平面事件应将其纳入激活 / 加载计划时，请使用 `activation`。

此块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段来缩小候选插件范围，然后才回退到现有的清单归属元数据，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks。

优先使用已经能够描述归属关系的最窄元数据。如果 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 已能表达这种关系，请使用这些字段。只有当这些归属字段无法表示额外的规划器提示时，才使用 `activation`。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方将其用作更广泛插件加载前的缩小范围提示，因此缺少激活元数据通常只会带来性能成本；在旧版清单归属回退仍然存在的情况下，不应改变正确性。

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

| 字段 | 必填 | 类型 | 含义 |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的 provider id。 |
| `onCommands` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的命令 id。 |
| `onChannels` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。能用更窄字段时应优先使用更窄字段。 |

当前在线使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置 / 渠道规划在缺少显式渠道激活元数据时，
  会回退到旧版 `channels[]` 归属
- 由 provider 触发的设置 / 运行时规划在缺少显式 provider
  激活元数据时，会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 归属。这些原因标签用于主机诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享 `openclaw qa` 根命令下贡献一个或多个传输 runner 时，请使用 `qaRunners`。保持这些元数据轻量且静态；实际的 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 界面负责。

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

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是 | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。 |
| `description` | 否 | `string` | 当共享主机需要 stub 命令时使用的回退帮助文本。 |

## `setup` 参考

当设置和 onboarding 界面在运行时加载前需要插件拥有的轻量级元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面 / 设置流程、应保持仅元数据形式的设置专用描述符界面。

存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现的首选描述符优先查找界面。如果描述符仅用于缩小候选插件范围，而设置仍需要更丰富的设置时运行时 hook，请将 `requiresRuntime` 设为 `true`，并保留 `setup-api` 作为回退执行路径。

由于设置查找可能会执行插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在已发现插件之间必须保持唯一。归属关系不明确时会采用失败即关闭的方式，而不是根据发现顺序选择一个“赢家”。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或 onboarding 期间暴露的 provider id。保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 此 provider 在不加载完整运行时的情况下支持的设置 / 认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和 onboarding 期间暴露的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置时后端 id。保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由此插件设置界面拥有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 在描述符查找之后，设置是否仍需要执行 `setup-api`。 |

## `uiHints` 参考

`uiHints` 是从配置字段名称映射到小型渲染提示的映射表。

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

每个字段提示可包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短辅助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级项。 |
| `sensitive` | `boolean` | 将该字段标记为秘密或敏感项。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅当 OpenClaw 可以在不导入插件运行时的情况下读取静态能力归属元数据时，才使用 `contracts`。

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | 内置插件可为其注册工厂的嵌入式运行时 id。 |
| `externalAuthProviders` | `string[]` | 此插件拥有其 external auth profile hook 的 provider id。 |
| `speechProviders` | `string[]` | 此插件拥有的语音 provider id。 |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录 provider id。 |
| `realtimeVoiceProviders` | `string[]` | 此插件拥有的实时语音 provider id。 |
| `memoryEmbeddingProviders` | `string[]` | 此插件拥有的 Memory embedding provider id。 |
| `mediaUnderstandingProviders` | `string[]` | 此插件拥有的媒体理解 provider id。 |
| `imageGenerationProviders` | `string[]` | 此插件拥有的图像生成 provider id。 |
| `videoGenerationProviders` | `string[]` | 此插件拥有的视频生成 provider id。 |
| `webFetchProviders` | `string[]` | 此插件拥有的 web-fetch provider id。 |
| `webSearchProviders` | `string[]` | 此插件拥有的网页搜索 provider id。 |
| `tools` | `string[]` | 在内置契约检查中，此插件拥有的智能体工具名称。 |

实现 `resolveExternalAuthProfiles` 的 provider 插件应声明 `contracts.externalAuthProviders`。未声明的插件仍会通过一个已弃用的兼容性回退路径运行，但该回退路径更慢，并将在迁移窗口结束后移除。

内置的 Memory embedding provider 应为其暴露的每个适配器 id 声明 `contracts.memoryEmbeddingProviders`，包括 `local` 这类内置适配器。独立 CLI 路径使用此清单契约，在完整 Gateway 网关运行时注册 provider 之前，仅加载拥有该 provider 的插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解 provider 具有默认模型、自动认证回退优先级，或通用核心辅助工具在运行时加载前需要的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

每个 provider 条目可包含：

| 字段 | 类型 | 含义 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | 此 provider 暴露的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的能力到模型默认映射。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证的自动 provider 回退时，数值越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该 provider 支持的原生文档输入。 |

## `channelConfigs` 参考

当渠道插件在运行时加载前需要轻量级配置元数据时，请使用 `channelConfigs`。

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

每个渠道条目可包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供。 |
| `uiHints` | `Record<string, object>` | 该渠道配置部分可选的 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未准备好时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道说明。 |
| `preferOver` | `string[]` | 在选择界面中，该渠道应优先于的旧版或较低优先级插件 id。 |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据像 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 id 推断你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用使用其所属 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件优先
- 剩余的歧义会被忽略，直到用户或配置指定了 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 对简写模型 id 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

旧版顶层能力键已弃用。请使用 `openclaw doctor --fix`，将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## 清单与 `package.json` 的区别

这两个文件承担不同的职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 发现、配置验证、auth-choice 元数据，以及必须在插件代码运行前存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 配置块 |

如果你不确定某项元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，把它放在 `openclaw.plugin.json` 中
- 如果它与打包、入口文件或 npm 安装行为有关，把它放在 `package.json` 中

### 会影响发现的 `package.json` 字段

一些运行时前的插件元数据有意放在 `package.json` 的 `openclaw` 配置块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保留在插件包目录内。 |
| `openclaw.runtimeExtensions` | 为已安装包声明构建后的 JavaScript 运行时入口点。必须保留在插件包目录内。 |
| `openclaw.setupEntry` | 在 onboarding、延迟渠道启动以及只读渠道状态 / SecretRef 发现期间使用的轻量级仅设置入口点。必须保留在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装包声明构建后的 JavaScript 设置入口点。必须保留在插件包目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择说明文案。 |
| `openclaw.channel.configuredState` | 轻量级 configured-state 检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅由环境变量驱动的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何账号登录？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 有多个安装来源可用时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 主机版本，使用如 `>=2026.3.22` 这样的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm 分发完整性字符串，例如 `sha512-...`；安装和更新流程会据此校验获取的制品。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一种范围很窄的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置的渠道界面，再加载完整的渠道插件。 |

清单元数据决定了在运行时加载前，onboarding 中会出现哪些 provider / 渠道 / 设置选项。`package.json#openclaw.install` 则告诉 onboarding，当用户选择这些选项之一时，应如何获取或启用该插件。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；较新的但有效的值会使旧主机跳过该插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。当你希望更新流程在获取到的 npm 制品不再匹配已固定版本时采用失败即关闭的方式，请将其与 `expectedIntegrity` 配合使用。交互式 onboarding 会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。存在 `expectedIntegrity` 时，安装 / 更新流程会强制校验；省略时，注册表解析结果会被记录，但不会附带完整性固定。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账号时，渠道插件应提供 `openclaw.setupEntry`。设置入口点应暴露渠道元数据以及适用于设置阶段的配置、状态和 secrets 适配器；网络客户端、Gateway 网关监听器和传输运行时应保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的适用范围被有意限制得很窄。它不会让任意损坏的配置变得可安装。当前它只允许安装流程从某些特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或同一内置插件对应的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并引导操作人员运行 `openclaw doctor --fix`。

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

当设置、Doctor 或 configured-state 流程需要在完整渠道插件加载前进行低成本的认证是 / 否探测时，请使用它。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 对低成本的仅环境变量 configured 检查采用相同结构：

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

当渠道可以通过环境变量或其他轻量级非运行时输入来判断 configured-state 时，请使用它。如果检查需要完整配置解析或真实的渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复插件 id）

OpenClaw 会从多个根目录发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两个发现结果共享同一个 `id`，则只保留**优先级最高**的清单；优先级较低的重复项会被丢弃，而不是与其并列加载。

优先级从高到低如下：

1. **Config-selected** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **Bundled** —— 随 OpenClaw 一起发布的插件
3. **Global install** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **Workspace** —— 相对于当前工作区发现的插件

影响如下：

- 工作区中放置的内置插件分叉版本或陈旧副本不会遮蔽内置构建版本。
- 若要真正用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其凭优先级获胜，而不是依赖工作区发现。
- 被丢弃的重复项会被记录日志，以便 Doctor 和启动诊断指出被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是允许的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键会被视为**错误**，除非该渠道 id 已由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 id。未知 id 会被视为**错误**。
- 如果插件已安装，但其清单或 schema 损坏或缺失，验证会失败，Doctor 会报告该插件错误。
- 如果插件配置存在但插件**已禁用**，配置会被保留，并且会在 Doctor 和日志中显示**警告**。

完整的 `plugins.*` schema 请参阅[配置参考](/zh-CN/gateway/configuration)。

## 说明

- **原生 OpenClaw 插件必须提供清单**，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取文档中记录的清单字段。避免使用自定义顶层键。
- 当插件不需要它们时，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；应将其用于静态 provider 目录元数据或窄范围的发现描述符，而不是请求时执行。
- 独占插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 环境变量元数据（`providerAuthEnvVars`、`channelEnvVars`）仅具有声明性。状态、审计、cron 投递验证以及其他只读界面，在将某个环境变量视为已配置前，仍会应用插件信任和有效激活策略。
- 关于需要 provider 代码的运行时向导元数据，请参阅 [Provider runtime hooks](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器允许列表要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关内容

<CardGroup cols={3}>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件快速开始。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考和子路径导入。
  </Card>
</CardGroup>
