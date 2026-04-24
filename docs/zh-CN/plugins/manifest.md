---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要交付一个插件配置 schema，或调试插件校验错误
summary: 插件清单 + JSON schema 要求（严格配置校验）
title: 插件清单
x-i18n:
    generated_at: "2026-04-24T22:21:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddabd562db22a82ff9c46094248350ac30565c9c10c9d87d3c0e85d49e7044a9
    source_path: plugins/manifest.md
    workflow: 15
---

本页仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参见 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但它们不会根据这里描述的 `openclaw.plugin.json` schema 进行校验。

对于兼容 bundle，当布局符合 OpenClaw 运行时预期时，OpenClaw 当前会读取 bundle 元数据、声明的 skill 根目录、Claude 命令根目录、Claude bundle 的 `settings.json` 默认值、Claude bundle 的 LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用这个清单在**不执行插件代码**的情况下校验配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

请参见完整的插件系统指南：[Plugins](/zh-CN/tools/plugin)。
关于原生能力模型和当前的外部兼容性指引，请参见：
[Capability model](/zh-CN/plugins/architecture#public-capability-model)。

## 这个文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，能够在不启动插件运行时的情况下完成检查。

**用于：**

- 插件身份、配置校验和配置 UI 提示
- 凭证、onboarding 和设置元数据（别名、自动启用、provider 环境变量、认证选项）
- 控制平面界面的激活提示
- 模型家族归属的简写声明
- 静态能力归属快照（`contracts`）
- 供共享 `openclaw qa` 主机检查的 QA 运行器元数据
- 合并到目录和校验界面的渠道专属配置元数据

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
      "choiceLabel": "OpenRouter API 密钥",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API 密钥",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API 密钥",
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
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略它，或设置为任何非 `true` 的值，则该插件默认保持禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当凭证、配置或模型引用提到这些 provider id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的排他性插件类型。 |
| `channels` | 否 | `string[]` | 此插件拥有的渠道 id。用于设备发现和配置校验。 |
| `providers` | 否 | `string[]` | 此插件拥有的 provider id。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级 provider 发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、限定于清单范围内的 provider 目录元数据。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的 endpoint 主机 / `baseUrl` 元数据，用于核心在 provider 运行时加载前必须分类的 provider 路由。 |
| `cliBackends` | 否 | `string[]` | 此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | provider 或 CLI 后端引用，在运行时加载前的冷模型发现期间，应探测其由插件拥有的 synthetic auth hook。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API 密钥值，用于表示非机密的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 此插件拥有的命令名称，应在运行时加载前生成带有插件感知能力的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | 已弃用的兼容性环境变量元数据，用于 provider 凭证 / 状态查找。新插件应优先使用 `setup.providers[].envVars`；在弃用窗口期内，OpenClaw 仍会读取此字段。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行凭证查找的 provider id，例如与基础 provider 共享 API 密钥和凭证配置文件的 coding provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于由环境变量驱动的渠道设置或凭证界面，以便通用的启动 / 配置辅助程序能够识别。 |
| `providerAuthChoices` | 否 | `object[]` | 轻量级认证选项元数据，用于 onboarding 选择器、首选 provider 解析和简单的 CLI flag 绑定。 |
| `activation` | 否 | `object` | 轻量级激活规划器元数据，用于由 provider、命令、渠道、路由和能力触发的加载。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 轻量级设置 / onboarding 描述符，供发现和设置界面在不加载插件运行时的情况下检查。 |
| `qaRunners` | 否 | `object[]` | 轻量级 QA 运行器描述符，供共享的 `openclaw qa` 主机在插件运行时加载前使用。 |
| `contracts` | 否 | `object` | 静态的内置能力快照，涵盖外部认证 hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、网页搜索和工具归属。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 针对在 `contracts.mediaUnderstandingProviders` 中声明的 provider id 的轻量级媒体理解默认元数据。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，在运行时加载前合并到发现和校验界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 在插件界面中显示的简短摘要。 |
| `version` | 否 | `string` | 仅供参考的插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个 onboarding 或认证选项。
OpenClaw 会在 provider 运行时加载之前读取它。
provider 设置流程会优先使用这些清单选项，然后为了兼容性回退到运行时向导元数据和安装目录选项。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的 provider id。 |
| `method` | 是 | `string` | 要分发到的认证方法 id。 |
| `choiceId` | 是 | `string` | onboarding 和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短帮助文本。 |
| `assistantPriority` | 否 | `number` | 在由智能体驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在智能体选择器中隐藏该选项，但仍允许手动 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于将相关选项分组的可选分组 id。 |
| `groupLabel` | 否 | `string` | 该分组面向用户的标签。 |
| `groupHint` | 否 | `string` | 该分组的简短帮助文本。 |
| `optionKey` | 否 | `string` | 用于简单单 flag 认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI flag 名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 用于 CLI 帮助中的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 该选项应出现在哪些 onboarding 界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有一个运行时命令名称，而用户可能错误地将其放入 `plugins.allow`，或尝试将其作为根级 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据在不导入插件运行时代码的情况下生成诊断信息。

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
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根级 CLI 命令。 |
| `cliCommand` | 否 | `string` | 相关的根级 CLI 命令；如果存在，可用于建议 CLI 操作。 |

## `activation` 参考

当插件可以以低成本声明哪些控制平面事件应将其纳入激活 / 加载计划时，请使用 `activation`。

这个代码块是规划器元数据，不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段在回退到现有清单归属元数据（如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前缩小候选插件范围。

优先使用已能描述归属关系的最窄元数据。如果 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 已能表达这种关系，请使用这些字段。仅当这些归属字段无法表示额外的规划器提示时，才使用 `activation`。

这个代码块仅是元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前消费者会在进行更广泛的插件加载之前将其用作缩小范围的提示，因此缺少激活元数据通常只会带来性能成本；只要旧版清单归属回退仍然存在，它就不应改变正确性。

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
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。可行时优先使用更窄的字段。 |

当前在线消费者：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 当缺少显式渠道激活元数据时，由渠道触发的设置 / 渠道规划会回退到旧版 `channels[]`
  归属
- 当缺少显式 provider 激活元数据时，由 provider 触发的设置 / 运行时规划会回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改为使用了 `commandAliases` 归属。这些原因标签用于主机诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享 `openclaw qa` 根命令下提供一个或多个传输运行器时，请使用 `qaRunners`。请保持这些元数据轻量且静态；实际的 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 界面负责。

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

顶层 `cliBackends` 仍然有效，并继续用于描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面 / 设置流程的、应保持仅元数据形式的设置专用描述符界面。

存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现时首选的“描述符优先”查找界面。如果描述符仅用于缩小候选插件范围，而设置仍需要更丰富的设置时运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会将 `setup.providers[].envVars` 纳入通用 provider 凭证和环境变量查找。`providerAuthEnvVars` 在弃用窗口期内仍通过兼容适配器受支持，但仍使用它的非内置插件会收到清单诊断。新插件应将设置 / 状态环境变量元数据放在 `setup.providers[].envVars` 上。

仅当这些描述符足以支持设置界面时，才设置 `requiresRuntime: false`。OpenClaw 将显式 `false` 视为纯描述符契约，并且不会为设置查找执行 `setup-api` 或 `openclaw.setupEntry`。如果纯描述符插件仍然提供了这些设置运行时入口之一，OpenClaw 会报告一个附加诊断，并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，这样那些添加了描述符但未添加该标志的现有插件就不会出问题。

由于设置查找可能执行由插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在已发现插件之间保持唯一。归属不明确时会以失败关闭，而不是按照发现顺序挑选一个胜者。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的 provider 或 CLI 后端，或者某个描述符没有匹配的运行时注册，设置注册表诊断会报告描述符漂移。这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或 onboarding 期间暴露的 provider id。请确保规范化后的 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 该 provider 在不加载完整运行时的情况下支持的设置 / 认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和 onboarding 期间暴露的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于“描述符优先”设置查找的设置时后端 id。请确保规范化后的 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 属于此插件设置界面的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 在描述符查找之后，设置是否仍需要执行 `setup-api`。 |

## `uiHints` 参考

`uiHints` 是一个从配置字段名称映射到小型渲染提示的映射表。

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
| `sensitive` | `boolean` | 将该字段标记为机密或敏感字段。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅在 OpenClaw 可以在不导入插件运行时的情况下读取静态能力归属元数据时使用 `contracts`。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex-app-server"],
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
| `embeddedExtensionFactories` | `string[]` | 已弃用的内嵌扩展工厂 id。 |
| `agentToolResultMiddleware` | `string[]` | 内置插件可为其注册工具结果中间件的 harness id。 |
| `externalAuthProviders` | `string[]` | 此插件拥有其外部认证配置文件 hook 的 provider id。 |
| `speechProviders` | `string[]` | 此插件拥有的语音 provider id。 |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录 provider id。 |
| `realtimeVoiceProviders` | `string[]` | 此插件拥有的实时语音 provider id。 |
| `memoryEmbeddingProviders` | `string[]` | 此插件拥有的 Memory 嵌入 provider id。 |
| `mediaUnderstandingProviders` | `string[]` | 此插件拥有的媒体理解 provider id。 |
| `imageGenerationProviders` | `string[]` | 此插件拥有的图像生成 provider id。 |
| `videoGenerationProviders` | `string[]` | 此插件拥有的视频生成 provider id。 |
| `webFetchProviders` | `string[]` | 此插件拥有的网页抓取 provider id。 |
| `webSearchProviders` | `string[]` | 此插件拥有的网页搜索 provider id。 |
| `tools` | `string[]` | 此插件拥有的智能体工具名称，用于内置契约检查。 |

保留 `contracts.embeddedExtensionFactories` 是为了支持仍然需要直接 Pi 内嵌运行器事件的内置兼容代码。新的内置工具结果转换应声明 `contracts.agentToolResultMiddleware`，并改为使用 `api.registerAgentToolResultMiddleware(...)` 注册。
外部插件不能注册工具结果中间件，因为这个接口可以在模型看到高信任工具输出之前重写它。

实现 `resolveExternalAuthProfiles` 的 provider 插件应声明 `contracts.externalAuthProviders`。未声明该字段的插件仍会通过已弃用的兼容性回退路径运行，但该回退路径更慢，并将在迁移窗口结束后移除。

内置的 Memory 嵌入 provider 应为它们暴露的每个适配器 id 声明 `contracts.memoryEmbeddingProviders`，包括诸如 `local` 之类的内置适配器。独立 CLI 路径使用这个清单契约，仅在完整 Gateway 网关运行时注册 provider 之前加载所属插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解 provider 具有默认模型、自动认证回退优先级，或 generic core helper 在运行时加载前所需的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。其键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

每个 provider 条目可以包含：

| 字段 | 类型 | 含义 |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities` | `("image" \| "audio" \| "video")[]` | 此 provider 暴露的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的“能力到模型”默认值。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证自动回退 provider 时的排序优先级；数字越小越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该 provider 支持的原生文档输入。 |

## `channelConfigs` 参考

当渠道插件在运行时加载前需要轻量级配置元数据时，请使用 `channelConfigs`。对于已配置的外部渠道，如果没有可用的设置入口，或者 `setup.requiresRuntime: false` 声明设置运行时并非必需，只读的渠道设置 / 状态发现可以直接使用这些元数据。

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
| `uiHints` | `Record<string, object>` | 该渠道配置区段的可选 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道描述。 |
| `preferOver` | `string[]` | 在选择界面中，此渠道应优先于的旧版或更低优先级插件 id。 |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据像 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 id 推断出你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用以下优先级：

- 显式的 `provider/model` 引用使用所属 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 剩余的歧义会被忽略，直到用户或配置明确指定 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 id 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，用于与简写模型 id 匹配的正则表达式源码。 |

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## 清单与 `package.json` 的区别

这两个文件承担不同的职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 必须在插件代码运行前存在的设备发现、配置校验、认证选项元数据和 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 代码块 |

如果你不确定某条元数据应放在哪里，请使用这条规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，就把它放在 `openclaw.plugin.json` 中
- 如果它与打包、入口文件或 npm 安装行为有关，就把它放在 `package.json` 中

### 会影响设备发现的 `package.json` 字段

有些运行时之前的插件元数据刻意放在 `package.json` 的 `openclaw` 代码块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保留在插件包目录内。 |
| `openclaw.runtimeExtensions` | 为已安装包声明构建后的 JavaScript 运行时入口点。必须保留在插件包目录内。 |
| `openclaw.setupEntry` | 轻量级、仅用于设置的入口点，在 onboarding、延后渠道启动和只读渠道状态 / SecretRef 发现期间使用。必须保留在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装包声明构建后的 JavaScript 设置入口点。必须保留在插件包目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择说明文案。 |
| `openclaw.channel.configuredState` | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅环境变量的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经有任何内容处于登录状态？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 为内置和外部发布插件提供的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 当有多个安装来源可用时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低受支持的 OpenClaw 主机版本，使用诸如 `>=2026.3.22` 这样的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会根据它校验获取到的构件。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个范围很窄的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用途的渠道界面，再加载完整渠道插件。 |

清单元数据决定了在运行时加载前，哪些 provider / 渠道 / 设置选项会出现在 onboarding 中。`package.json#openclaw.install` 则告诉 onboarding，当用户选择其中一个选项时，应如何获取或启用该插件。不要把安装提示移动到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装期间和清单注册表加载期间强制执行。无效值会被拒绝；较新的有效值会导致该插件在旧主机上被跳过。

精确的 npm 版本固定已经存放在 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确 spec 与 `expectedIntegrity` 搭配使用，这样如果获取到的 npm 构件不再匹配固定的发布版本，更新流程就会以失败关闭。为兼容性起见，交互式 onboarding 仍然会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。目录诊断可以区分精确、浮动、带完整性固定、缺少完整性、包名不匹配和无效默认选项来源。它们还会在存在 `expectedIntegrity` 但没有可供其固定的有效 npm 来源时发出警告。存在 `expectedIntegrity` 时，安装 / 更新流程会强制执行它；省略时，注册表解析结果会被记录，但不带完整性固定。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。设置入口点应暴露渠道元数据以及适合设置阶段使用的配置、状态和 secrets 适配器；请将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会绕过对源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越出包目录的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的范围是刻意收窄的。它不会让任意损坏的配置都能安装。当前它仅允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或同一个内置插件下陈旧的 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并引导操作人员使用 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个用于微型检查器模块的包元数据：

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前执行一个低成本的“是 / 否”认证探测时，请使用它。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 对低成本的仅环境变量已配置检查采用相同结构：

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

当某个渠道可以基于环境变量或其他微型的非运行时输入来判断已配置状态时，请使用它。如果该检查需要完整配置解析或真实的渠道运行时，请将该逻辑保留在插件的 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复的插件 id）

OpenClaw 会从多个根路径发现插件（内置、全局安装、工作区、配置中显式选定的路径）。如果两个发现结果共享同一个 `id`，只会保留**优先级最高**的清单；优先级较低的重复项会被丢弃，而不是与之并行加载。

优先级从高到低：

1. **配置选定** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一起发布的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 放在工作区中的某个内置插件 fork 或陈旧副本，不会遮蔽内置版本。
- 如果确实要用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，让它凭优先级获胜，而不是依赖工作区发现。
- 被丢弃的重复项会记录日志，这样 Doctor 和启动诊断就能指向被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- schema 会在配置读写时校验，而不是在运行时校验。

## 校验行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 是**错误**。
- 如果插件已安装，但其清单或 schema 缺失或损坏，校验会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件**已禁用**，配置会被保留，并且 Doctor + 日志中会显示一个**警告**。

完整的 `plugins.*` schema 请参见 [Configuration reference](/zh-CN/gateway/configuration)。

## 说明

- 清单对于**原生 OpenClaw 插件**是**必需的**，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于设备发现 + 校验。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取文档中说明过的清单字段。避免使用自定义顶层键。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；请将其用于静态 provider 目录元数据或狭义发现描述符，而不是请求时执行逻辑。
- 排他性插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认值为 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）只是声明式信息。状态、审计、cron 投递校验以及其他只读界面，在将环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 对于需要 provider 代码的运行时向导元数据，请参见 [Provider runtime hooks](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

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
