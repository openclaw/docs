---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要提供插件配置 schema，或调试插件校验错误
summary: 插件清单 + JSON schema 要求（严格配置校验）
title: 插件清单
x-i18n:
    generated_at: "2026-04-26T04:25:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e33fe37d43ea78c941fbce5af3564c4fae5740e04a0dfaa321163f94b5ef876
    source_path: plugins/manifest.md
    workflow: 15
---

此页面仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参见 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会按照此处描述的 `openclaw.plugin.json` schema 对其进行校验。

对于兼容 bundle，当布局符合 OpenClaw 运行时预期时，OpenClaw 目前会读取 bundle 元数据、声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码的情况下**校验配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

请参见完整的插件系统指南：[Plugins](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指导，请参见：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 这个文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便在不启动插件运行时的情况下进行检查。

**它的用途包括：**

- 插件标识、配置校验和配置 UI 提示
- 认证、新手引导和设置元数据（别名、自动启用、provider 环境变量、认证选项）
- 控制平面界面的激活提示
- 简写模型族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 主机可检查的 QA 运行器元数据
- 合并到目录和校验界面的渠道专用配置元数据

**不要将它用于：**注册运行时行为、声明代码入口点或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

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
| `id` | 是 | `string` | 规范插件 id。这是在 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 此插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略此字段，或设置为任何非 `true` 的值，以使插件默认禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些 provider id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的排他性插件类型。 |
| `channels` | 否 | `string[]` | 由此插件拥有的渠道 id。用于发现和配置校验。 |
| `providers` | 否 | `string[]` | 由此插件拥有的 provider id。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级 provider 发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载、且作用域限定于清单的 provider 目录元数据。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型族元数据，用于在运行时之前自动加载插件。 |
| `modelCatalog` | 否 | `object` | 由声明式方式定义的、用于此插件所拥有 provider 的模型目录元数据。这是未来只读列表、onboarding、模型选择器、别名和抑制功能在不加载插件运行时情况下使用的控制平面契约。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的端点 host/baseUrl 元数据，用于核心在 provider 运行时加载前必须分类的 provider 路由。 |
| `cliBackends` | 否 | `string[]` | 由此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 在运行时加载前，冷启动模型发现期间应探测其插件自有 synthetic auth hook 的 provider 或 CLI 后端引用。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API key 值，表示非密钥的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 由此插件拥有的命令名称，这些命令应在运行时加载前生成具备插件感知能力的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | 已弃用的兼容性环境变量元数据，用于 provider 认证/Status 查找。对于新插件，优先使用 `setup.providers[].envVars`；在弃用窗口期间，OpenClaw 仍会读取此字段。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行认证查找的 provider id，例如与基础 provider 共用 API key 和认证配置文件的 coding provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于基于环境变量的渠道设置或认证界面，以便通用启动/配置辅助逻辑能够识别。 |
| `providerAuthChoices` | 否 | `object[]` | 用于 onboarding 选择器、首选 provider 解析和简单 CLI 标志接线的轻量级认证选项元数据。 |
| `activation` | 否 | `object` | 用于 provider、命令、渠道、路由和能力触发加载的轻量级激活规划元数据。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 轻量级设置/onboarding 描述符，供发现和设置界面在不加载插件运行时的情况下检查。 |
| `qaRunners` | 否 | `object[]` | 由共享 `openclaw qa` 主机在插件运行时加载前使用的轻量级 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 静态内置能力快照，用于 external auth hook、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search 和工具归属。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的 provider id 提供的轻量级 media-understanding 默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，会在运行时加载前合并到发现和校验界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件界面中的简短摘要。 |
| `version` | 否 | `string` | 说明性的插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个 onboarding 或认证选项。
OpenClaw 会在 provider 运行时加载前读取它。
Provider 设置流程会优先使用这些清单选项，然后为了兼容性回退到运行时向导元数据和安装目录选项。

| 字段 | 必需 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的 provider id。 |
| `method` | 是 | `string` | 要分派到的认证方法 id。 |
| `choiceId` | 是 | `string` | onboarding 和 CLI 流程使用的稳定 auth-choice id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。若省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏该选项，但仍允许手动通过 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于对相关选项分组的可选组 id。 |
| `groupLabel` | 否 | `string` | 该分组的面向用户标签。 |
| `groupHint` | 否 | `string` | 该分组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | CLI 帮助中使用的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些 onboarding 界面中。若省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有某个运行时命令名称，而用户可能误将其放入 `plugins.allow` 或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据在不导入插件运行时代码的情况下提供诊断。

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
| `kind` | 否 | `"runtime-slash"` | 将此别名标记为聊天斜杠命令，而不是根 CLI 命令。 |
| `cliCommand` | 否 | `string` | 若存在，用于 CLI 操作时建议的相关根 CLI 命令。 |

## `activation` 参考

当插件可以用低成本声明哪些控制平面事件应将其纳入激活/加载计划时，请使用 `activation`。

此块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已执行。激活规划器使用这些字段在回退到现有清单归属元数据（如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前，先缩小候选插件范围。

优先使用已经能描述归属关系的最窄元数据。若 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 已能表达这种关系，就应使用它们。只有在这些归属字段无法表示额外规划提示时，才使用 `activation`。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。当前使用方将其作为更广泛插件加载前的缩小范围提示，因此缺失激活元数据通常只会带来性能损失；在旧版清单归属回退仍然存在时，它不应改变正确性。

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
| `onProviders` | 否 | `string[]` | 应将此插件纳入激活/加载计划的 provider id。 |
| `onCommands` | 否 | `string[]` | 应将此插件纳入激活/加载计划的命令 id。 |
| `onChannels` | 否 | `string[]` | 应将此插件纳入激活/加载计划的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应将此插件纳入激活/加载计划的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。可能时优先使用更窄的字段。 |

当前的在线使用方：

- 由命令触发的 CLI 规划会回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置/渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]` 归属
- 由 provider 触发的设置/运行时规划在缺少显式 provider 激活元数据时，会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 归属。这些原因标签用于主机诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享 `openclaw qa` 根命令下提供一个或多个传输运行器时，请使用 `qaRunners`。保持这些元数据轻量且静态；实际 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 界面负责。

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
| `description` | 否 | `string` | 当共享主机需要一个存根命令时使用的回退帮助文本。 |

## `setup` 参考

当设置和 onboarding 界面需要在运行时加载前获取由插件拥有的轻量级元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续用于描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面/设置流程的专用设置描述符界面，应保持仅包含元数据。

存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现的首选“描述符优先”查找界面。如果描述符只能缩小候选插件范围，而设置仍需要更丰富的设置期运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会将 `setup.providers[].envVars` 纳入通用 provider 认证和环境变量查找。`providerAuthEnvVars` 在弃用窗口期间仍通过兼容适配器受支持，但仍在使用它的非内置插件会收到清单诊断。新插件应将 setup/Status 环境变量元数据放在 `setup.providers[].envVars` 上。

当没有可用的设置入口，或者 `setup.requiresRuntime: false` 声明设置运行时没有必要时，OpenClaw 还可以从 `setup.providers[].authMethods` 推导出简单的设置选项。对于自定义标签、CLI 标志、onboarding 范围和助手元数据，显式的 `providerAuthChoices` 条目仍然是首选。

只有当这些描述符足以满足设置界面需求时，才应设置 `requiresRuntime: false`。OpenClaw 将显式的 `false` 视为仅描述符契约，并且不会为设置查找执行 `setup-api` 或 `openclaw.setupEntry`。如果仅描述符插件仍然提供了其中一个设置运行时入口，OpenClaw 会报告附加诊断，并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，这样那些添加了描述符但未加此标志的现有插件就不会出问题。

由于设置查找可能会执行插件自有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在已发现插件之间必须保持唯一。若归属关系含糊不清，系统会以失败关闭的方式处理，而不是按发现顺序选出赢家。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的 provider 或 CLI 后端，或者某个描述符没有匹配的运行时注册，设置注册表诊断会报告描述符漂移。这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必需 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或 onboarding 期间暴露的 provider id。保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 此 provider 在不加载完整运行时的情况下支持的设置/认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置/Status 界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必需 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和 onboarding 期间暴露的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置期后端 id。保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由此插件的设置界面拥有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 描述符查找之后，设置是否仍需要执行 `setup-api`。 |

## `uiHints` 参考

`uiHints` 是一个从配置字段名映射到小型渲染提示的映射表。

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
| `tags` | `string[]` | 可选 UI 标签。 |
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
| `embeddedExtensionFactories` | `string[]` | Codex app-server 扩展工厂 id，目前为 `codex-app-server`。 |
| `agentToolResultMiddleware` | `string[]` | 内置插件可为其注册工具结果中间件的运行时 id。 |
| `externalAuthProviders` | `string[]` | 此插件拥有其外部认证配置文件 hook 的 provider id。 |
| `speechProviders` | `string[]` | 此插件拥有的语音 provider id。 |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转写 provider id。 |
| `realtimeVoiceProviders` | `string[]` | 此插件拥有的实时语音 provider id。 |
| `memoryEmbeddingProviders` | `string[]` | 此插件拥有的 Memory embedding provider id。 |
| `mediaUnderstandingProviders` | `string[]` | 此插件拥有的媒体理解 provider id。 |
| `imageGenerationProviders` | `string[]` | 此插件拥有的图像生成 provider id。 |
| `videoGenerationProviders` | `string[]` | 此插件拥有的视频生成 provider id。 |
| `webFetchProviders` | `string[]` | 此插件拥有的 web-fetch provider id。 |
| `webSearchProviders` | `string[]` | 此插件拥有的 web search provider id。 |
| `tools` | `string[]` | 此插件拥有的 Agent 工具名称，用于内置契约检查。 |

`contracts.embeddedExtensionFactories` 被保留用于仅限内置 Codex app-server 的扩展工厂。内置工具结果转换应声明 `contracts.agentToolResultMiddleware`，并通过 `api.registerAgentToolResultMiddleware(...)` 注册。外部插件不能注册工具结果中间件，因为该接口可能会在模型看到高信任工具输出之前重写它。

实现 `resolveExternalAuthProfiles` 的 provider 插件应声明 `contracts.externalAuthProviders`。未声明该字段的插件仍会通过已弃用的兼容性回退运行，但该回退更慢，并将在迁移窗口结束后移除。

内置 Memory embedding provider 应为其暴露的每个适配器 id 声明 `contracts.memoryEmbeddingProviders`，包括诸如 `local` 之类的内置适配器。独立 CLI 路径使用此清单契约在完整 Gateway 网关运行时注册 provider 之前，仅加载拥有该适配器的插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解 provider 具有默认模型、自动认证回退优先级，或 generic core helper 在运行时加载前需要的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键名还必须在 `contracts.mediaUnderstandingProviders` 中声明。

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
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的“能力到模型”的默认值。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证的自动 provider 回退时，数字越小越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 此 provider 支持的原生文档输入。 |

## `channelConfigs` 参考

当渠道插件在运行时加载前需要轻量级配置元数据时，请使用 `channelConfigs`。当没有可用的设置入口，或 `setup.requiresRuntime: false` 声明设置运行时没有必要时，只读的渠道设置/Status 发现可以直接使用这些元数据来处理已配置的外部渠道。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置区段。用户仍然在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 读取清单元数据，以便在插件运行时代码执行前判断哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同路径：

- `configSchema` 校验 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 校验 `channels.<channel-id>`

声明了 `channels[]` 的非内置插件也应声明匹配的 `channelConfigs` 条目。否则，OpenClaw 仍能加载插件，但冷路径配置 schema、设置和 Control UI 界面在插件运行时执行之前，无法知道该渠道拥有的选项结构。

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
| `uiHints` | `Record<string, object>` | 该渠道配置区段的可选 UI 标签/占位符/敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道说明。 |
| `preferOver` | `string[]` | 在选择界面中，此渠道应优先于其上的旧版或较低优先级插件 id。 |

### 替换另一个渠道插件

当你的插件是某个渠道 id 的首选拥有者，而另一个插件也能提供该渠道时，请使用 `preferOver`。常见情况包括：插件 id 被重命名、独立插件取代了内置插件，或者维护中的分叉为了配置兼容性保留相同的渠道 id。

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

当配置了 `channels.chat` 时，OpenClaw 会同时考虑渠道 id 和首选插件 id。如果低优先级插件只是因为内置或默认启用而被选中，OpenClaw 会在生效运行时配置中禁用它，这样就只有一个插件拥有该渠道及其工具。显式的用户选择仍然优先：如果用户显式启用了两个插件，OpenClaw 会保留这一选择，并报告重复的渠道/工具诊断，而不是静默更改请求的插件集合。

将 `preferOver` 限定在那些确实能提供同一渠道的插件 id 上。它不是通用优先级字段，也不会重命名用户配置键。

## `modelSupport` 参考

当 OpenClaw 应该在插件运行时加载前，从类似 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 id 推断出你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用会使用其所属 `providers` 清单元数据
- `modelPatterns` 的优先级高于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件优先
- 若仍存在歧义，则会忽略，直到用户或配置明确指定 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 对简写模型 id 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

## `modelCatalog` 参考

当 OpenClaw 应该在加载插件运行时之前就了解 provider 模型元数据时，请使用 `modelCatalog`。这是由清单拥有的固定目录行、provider 别名、抑制规则和发现模式的数据源。运行时刷新仍属于 provider 运行时代码，但清单会告诉核心何时需要运行时。

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

顶层字段：

| 字段 | 类型 | 含义 |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers` | `Record<string, object>` | 由此插件拥有的 provider id 的目录条目。键名也应出现在顶层 `providers` 中。 |
| `aliases` | `Record<string, object>` | 用于目录或抑制规划时，应解析到某个所属 provider 的 provider 别名。 |
| `suppressions` | `object[]` | 出于 provider 专属原因，被此插件从其他来源抑制的模型条目。 |
| `discovery` | `Record<string, "static" \| "refreshable" \| "runtime">` | provider 目录是否可以从清单元数据读取、刷新到缓存，或必须依赖运行时。 |

Provider 字段：

| 字段 | 类型 | 含义 |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string` | 此 provider 目录中模型的可选默认 base URL。 |
| `api` | `ModelApi` | 此 provider 目录中模型的可选默认 API 适配器。 |
| `headers` | `Record<string, string>` | 适用于此 provider 目录的可选静态 headers。 |
| `models` | `object[]` | 必填的模型条目。没有 `id` 的条目会被忽略。 |

模型字段：

| 字段 | 类型 | 含义 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id` | `string` | provider 本地模型 id，不含 `provider/` 前缀。 |
| `name` | `string` | 可选显示名称。 |
| `api` | `ModelApi` | 可选的逐模型 API 覆盖。 |
| `baseUrl` | `string` | 可选的逐模型 base URL 覆盖。 |
| `headers` | `Record<string, string>` | 可选的逐模型静态 headers。 |
| `input` | `Array<"text" \| "image" \| "document">` | 模型接受的模态类型。 |
| `reasoning` | `boolean` | 该模型是否暴露 reasoning 行为。 |
| `contextWindow` | `number` | provider 原生上下文窗口。 |
| `contextTokens` | `number` | 当与 `contextWindow` 不同时，可选的生效运行时上下文上限。 |
| `maxTokens` | `number` | 已知时的最大输出 token 数。 |
| `cost` | `object` | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat` | `object` | 可选的兼容性标志，与 OpenClaw 模型配置兼容性一致。 |
| `status` | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。只有在该条目绝不能出现时才使用 suppress。 |
| `statusReason` | `string` | 与非可用状态一同显示的可选原因。 |
| `replaces` | `string[]` | 被此模型取代的旧版 provider 本地模型 id。 |
| `replacedBy` | `string` | 用于已弃用条目的替代 provider 本地模型 id。 |
| `tags` | `string[]` | 供选择器和过滤器使用的稳定标签。 |

不要将仅运行时数据放入 `modelCatalog`。如果某个 provider 需要账户状态、API 请求或本地进程发现才能知道完整模型集合，请在 `discovery` 中将该 provider 声明为 `refreshable` 或 `runtime`。

### OpenClaw Provider Index

OpenClaw Provider Index 是由 OpenClaw 拥有的预览元数据，适用于其插件可能尚未安装的 provider。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。Provider Index 是内部回退契约，未来可安装 provider 和预安装模型选择器界面会在 provider 插件未安装时使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单中的 `modelCatalog`。
3. 来自显式刷新的模型目录缓存。
4. OpenClaw Provider Index 预览条目。

Provider Index 不得包含密钥、启用状态、运行时 hook 或实时的账户专属模型数据。它的预览目录使用与插件清单相同的 `modelCatalog` provider 条目结构，但除非有意与已安装插件清单中的运行时适配器字段（如 `api`、`baseUrl`、定价或兼容性标志）保持一致，否则应限制为稳定的显示元数据。具有实时 `/models` 发现功能的 provider 应通过显式模型目录缓存路径写入刷新后的条目，而不是让常规列表或 onboarding 去调用 provider API。

旧版顶层能力键已弃用。请使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## Manifest 与 `package.json`

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 发现、配置校验、认证选项元数据，以及必须在插件代码运行前存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块 |

如果你不确定某项元数据应该放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，就将其放在 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就将其放在 `package.json`

### 会影响发现的 `package.json` 字段

有些运行时前的插件元数据有意放在 `package.json` 的 `openclaw` 块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保持在插件包目录内。 |
| `openclaw.runtimeExtensions` | 为已安装包声明构建后的 JavaScript 运行时入口点。必须保持在插件包目录内。 |
| `openclaw.setupEntry` | 轻量级、仅用于设置的入口点，在 onboarding、延迟渠道启动和只读渠道 Status/SecretRef 发现期间使用。必须保持在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装包声明构建后的 JavaScript 设置入口点。必须保持在插件包目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.configuredState` | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅基于环境变量的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何已登录状态？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装/更新提示。 |
| `openclaw.install.defaultChoice` | 当存在多个安装来源时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm 分发完整性字符串，例如 `sha512-...`；安装和更新流程会用它校验下载的制品。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个受限的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用的渠道界面，再加载完整渠道插件。 |

清单元数据决定在运行时加载前，onboarding 中会显示哪些 provider/渠道/设置选项。`package.json#openclaw.install` 则告诉 onboarding，当用户选择其中一个选项时，应如何获取或启用该插件。不要将安装提示移入 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；对旧主机而言，较新的但有效的值会导致跳过该插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确 spec 与 `expectedIntegrity` 配对使用，这样如果下载到的 npm 制品不再匹配固定版本，更新流程就会以失败关闭的方式中止。为了兼容性，交互式 onboarding 仍会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。目录诊断可以区分精确、浮动、带完整性固定、缺少完整性、包名不匹配和无效默认选项来源。若存在 `expectedIntegrity`，但没有可供其固定的有效 npm 来源，也会发出警告。

当存在 `expectedIntegrity` 时，安装/更新流程会强制校验它；当省略时，注册表解析结果会被记录，但不会附带完整性固定。

当 Status、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。该设置入口应暴露渠道元数据，以及适用于设置的配置、Status 和密钥适配器；网络客户端、网关监听器和传输运行时应保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 被有意限制得很窄。它不会让任意损坏的配置都变得可安装。当前它只允许安装流程从某些特定的过期内置插件升级失败中恢复，例如缺失的内置插件路径，或属于同一个内置插件的过期 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将运维人员引导至 `openclaw doctor --fix`。

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前进行廉价的“是/否”认证探测时，请使用它。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 对于廉价的仅环境变量已配置检查，采用相同结构：

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

当某个渠道可以基于环境变量或其他微型的非运行时输入来回答已配置状态时，请使用它。如果检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 发现优先级（重复插件 id）

OpenClaw 会从多个根位置发现插件（内置、全局安装、工作区、配置中显式选定的路径）。如果两个发现结果共享相同的 `id`，则只保留**优先级最高**的清单；较低优先级的重复项会被丢弃，而不是与其并行加载。

优先级从高到低如下：

1. **配置选定** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一同提供的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 工作区中某个内置插件的分叉版或过期副本不会遮蔽内置构建版本。
- 若要真正用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其凭借优先级胜出，而不要依赖工作区发现。
- 被丢弃的重复项会被记录日志，以便 Doctor 和启动诊断可以指出被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读写时校验，而不是在运行时校验。

## 校验行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 id。未知 id 会被视为**错误**。
- 如果某个插件已安装，但其清单或 schema 缺失或损坏，校验将失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件被**禁用**，配置会被保留，并在 Doctor + 日志中显示**警告**。

完整的 `plugins.*` schema 请参见[配置参考](/zh-CN/gateway/configuration)。

## 说明

- **原生 OpenClaw 插件必须提供清单**，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于发现 + 校验。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是对象即可。
- 清单加载器只会读取文档中说明的清单字段。避免使用自定义顶层键。
- 当插件不需要它们时，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；应将其用于静态 provider 目录元数据或狭义发现描述符，而不是请求时执行。
- 排他性插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 对应 `plugins.slots.memory`，`kind: "context-engine"` 对应 `plugins.slots.contextEngine`（默认值为 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅具有声明性。Status、审计、cron 投递校验及其他只读界面在将某个环境变量视为已配置之前，仍会应用插件信任和生效激活策略。
- 关于需要 provider 代码的运行时向导元数据，请参见 [Provider 运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
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
