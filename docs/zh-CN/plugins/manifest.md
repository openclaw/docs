---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布一个插件配置 schema，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-27T19:38:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a700ecd97b16735e415814731841c686490f12d0e303c09800afe664880ec3e
    source_path: plugins/manifest.md
    workflow: 15
---

此页面仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参阅 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json` 或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会根据此处描述的 `openclaw.plugin.json` schema 对它们进行验证。

对于兼容 bundle，当其布局符合 OpenClaw 运行时预期时，OpenClaw 当前会读取 bundle 元数据、声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值，以及支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指导，请参阅：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便无需启动插件运行时即可检查。

**用于：**

- 插件身份、配置验证，以及配置 UI 提示
- 认证、新手引导和设置元数据（别名、自动启用、提供商环境变量、认证选项）
- 控制平面界面的激活提示
- 简写模型家族归属
- 静态能力归属快照（`contracts`）
- 供共享 `openclaw qa` 宿主检查的 QA 运行器元数据
- 合并到目录和验证界面中的渠道特定配置元数据

**不要用于：** 注册运行时行为、声明代码入口点，或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

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
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
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
| `id` | 是 | `string` | 规范插件 id。这是 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 该插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略它，或将其设置为任何非 `true` 的值，则插件默认保持禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的排他性插件类型。 |
| `channels` | 否 | `string[]` | 由此插件拥有的渠道 id。用于设备发现和配置验证。 |
| `providers` | 否 | `string[]` | 由此插件拥有的提供商 id。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级的提供商设备发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、限定于清单范围的提供商目录元数据。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `modelCatalog` | 否 | `object` | 由此插件拥有的提供商声明式模型目录元数据。这是未来只读列表、新手引导、模型选择器、别名和抑制功能的控制平面契约，无需加载插件运行时。 |
| `modelPricing` | 否 | `object` | 由提供商拥有的外部定价查找策略。用它可将本地/自托管提供商排除在远程定价目录之外，或将提供商引用映射到 OpenRouter/LiteLLM 目录 id，而无需在核心中硬编码提供商 id。 |
| `modelIdNormalization` | 否 | `object` | 由提供商拥有的模型 id 别名/前缀清理规则，必须在提供商运行时加载前运行。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的端点 host/baseUrl 元数据，用于核心必须在提供商运行时加载前分类的提供商路由。 |
| `providerRequest` | 否 | `object` | 轻量级的提供商家族和请求兼容性元数据，供通用请求策略在提供商运行时加载前使用。 |
| `cliBackends` | 否 | `string[]` | 由此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 提供商或 CLI 后端引用；在运行时加载前的冷模型设备发现期间，应探测其由插件拥有的合成认证钩子。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API key 值，用于表示非密钥的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 由此插件拥有的命令名称；这些命令应在运行时加载前生成插件感知的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | 已弃用的兼容性环境变量元数据，用于提供商认证/Status 查找。对于新插件，优先使用 `setup.providers[].envVars`；在弃用窗口期内，OpenClaw 仍会读取此字段。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个提供商 id 进行认证查找的提供商 id，例如与基础提供商共享 API key 和认证配置的 coding 提供商。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于由环境变量驱动的渠道设置或认证界面，使通用启动/配置辅助工具能够识别。 |
| `providerAuthChoices` | 否 | `object[]` | 轻量级认证选项元数据，用于新手引导选择器、首选提供商解析，以及简单的 CLI 标志接线。 |
| `activation` | 否 | `object` | 轻量级激活规划器元数据，用于由提供商、命令、渠道、路由和能力触发的加载。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 轻量级设置/新手引导描述符，供设备发现和设置界面在不加载插件运行时的情况下检查。 |
| `qaRunners` | 否 | `object[]` | 由共享 `openclaw qa` 宿主在插件运行时加载前使用的轻量级 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 针对外部认证钩子、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web 抓取、web 搜索和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的提供商 id 提供的轻量级媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和验证界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件界面中的简短摘要。 |
| `version` | 否 | `string` | 信息性插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在提供商运行时加载前读取它。
提供商设置列表使用这些清单选项、从描述符派生的设置选项，以及安装目录元数据，而无需加载提供商运行时。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的提供商 id。 |
| `method` | 是 | `string` | 要分发到的认证方法 id。 |
| `choiceId` | 是 | `string` | 供新手引导和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏该选项，但仍允许手动 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于将相关选项分组的可选组 id。 |
| `groupLabel` | 否 | `string` | 该组面向用户的标签。 |
| `groupHint` | 否 | `string` | 该组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 用于简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 用于 CLI 帮助的说明文本。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有一个运行时命令名称，而用户可能误将其放入 `plugins.allow`，或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据来生成诊断信息，而无需导入插件运行时代码。

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
| `cliCommand` | 否 | `string` | 如果存在，可建议用于 CLI 操作的相关根 CLI 命令。 |

## `activation` 参考

当插件可以以低成本声明哪些控制平面事件应将其纳入激活/加载计划时，请使用 `activation`。

此块是规划器元数据，不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段缩小候选插件范围，然后再回退到现有的清单归属元数据，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。

优先使用已经描述归属关系的最窄元数据。能用 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 表达关系时，就使用这些字段。只有在这些归属字段无法表达时，才使用 `activation` 提供额外的规划器提示。
对于 `claude-cli`、`codex-cli` 或 `google-gemini-cli` 这类 CLI 运行时别名，请使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅用于那些尚无归属字段的嵌入式智能体 harness id。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。当前使用方将它作为在更广泛插件加载前进行缩小范围的提示，因此缺少激活元数据通常只会影响性能；在旧版清单归属回退仍然存在时，它不应改变正确性。

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders` | 否 | `string[]` | 应将此插件纳入激活/加载计划的提供商 id。 |
| `onAgentHarnesses` | 否 | `string[]` | 应将此插件纳入激活/加载计划的嵌入式智能体 harness 运行时 id。对于 CLI 后端别名，请使用顶层 `cliBackends`。 |
| `onCommands` | 否 | `string[]` | 应将此插件纳入激活/加载计划的命令 id。 |
| `onChannels` | 否 | `string[]` | 应将此插件纳入激活/加载计划的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应将此插件纳入激活/加载计划的路由类型。 |
| `onConfigPaths` | 否 | `string[]` | 当某个相对根路径的配置路径存在且未被显式禁用时，应将此插件纳入启动/加载计划。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。可能时优先使用更窄的字段。 |

当前实时使用方：

- 由命令触发的 CLI 规划会回退到旧版的
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 智能体运行时启动规划对嵌入式 harness 使用 `activation.onAgentHarnesses`，对 CLI 运行时别名使用顶层 `cliBackends[]`
- 由渠道触发的设置/渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]` 归属
- 启动插件规划对非渠道的根配置界面使用 `activation.onConfigPaths`，例如内置浏览器插件的 `browser` 块
- 由提供商触发的设置/运行时规划在缺少显式提供商激活元数据时，会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 归属。这些原因标签用于宿主诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享的 `openclaw qa` 根命令下贡献一个或多个传输运行器时，请使用 `qaRunners`。保持此元数据轻量且静态；实际的 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 接口负责。

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
| `commandName` | 是 | `string` | 挂载在 `openclaw qa` 之下的子命令，例如 `matrix`。 |
| `description` | 否 | `string` | 当共享宿主需要一个 stub 命令时使用的回退帮助文本。 |

## `setup` 参考

当设置和新手引导界面在运行时加载前需要由插件拥有的轻量级元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是用于控制平面/设置流程的、仅元数据的设置专用描述符界面。

存在时，`setup.providers` 和 `setup.cliBackends` 是设置设备发现的首选“描述符优先”查找界面。如果描述符只能缩小候选插件范围，而设置仍需要更丰富的设置时运行时钩子，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会将 `setup.providers[].envVars` 纳入通用提供商认证和环境变量查找。`providerAuthEnvVars` 在弃用窗口期内仍通过兼容适配器受到支持，但仍在使用它的非内置插件会收到清单诊断信息。新插件应将设置/Status 环境变量元数据放在 `setup.providers[].envVars` 上。

当没有可用的设置入口，或 `setup.requiresRuntime: false` 声明设置运行时并非必需时，OpenClaw 也可以根据 `setup.providers[].authMethods` 推导出简单的设置选项。对于自定义标签、CLI 标志、新手引导范围和助手元数据，显式的 `providerAuthChoices` 条目仍然是首选。

仅当这些描述符已足以支持设置界面时，才设置 `requiresRuntime: false`。OpenClaw 将显式的 `false` 视为仅描述符契约，并且不会为设置查找执行 `setup-api` 或 `openclaw.setupEntry`。如果一个仅描述符插件仍然提供了这些设置运行时入口之一，OpenClaw 会报告一个附加诊断，并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，这样为现有插件添加描述符而未添加该标志时不会出错。

由于设置查找可能执行插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在所有已发现插件之间必须保持唯一。归属不明确时会采用失败关闭，而不是按发现顺序选一个“赢家”。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的提供商或 CLI 后端，或者某个描述符没有对应的运行时注册，设置注册表诊断就会报告描述符漂移。这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或新手引导期间公开的提供商 id。保持规范化 id 在全局唯一。 |
| `authMethods` | 否 | `string[]` | 该提供商在不加载完整运行时的情况下支持的设置/认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置/Status 界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和新手引导期间公开的提供商设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置时后端 id。保持规范化 id 在全局唯一。 |
| `configMigrations` | 否 | `string[]` | 由该插件设置界面拥有的配置迁移 id。 |
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
| `help` | `string` | 简短辅助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级项。 |
| `sensitive` | `boolean` | 将该字段标记为密钥或敏感信息。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅在 OpenClaw 可无需导入插件运行时就能读取的静态能力归属元数据场景下使用 `contracts`。

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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段 | 类型 | 含义 |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories` | `string[]` | Codex app-server 扩展工厂 id，目前为 `codex-app-server`。 |
| `agentToolResultMiddleware` | `string[]` | 内置插件可为其注册工具结果中间件的运行时 id。 |
| `externalAuthProviders` | `string[]` | 此插件拥有其外部认证配置钩子的提供商 id。 |
| `speechProviders` | `string[]` | 此插件拥有的语音提供商 id。 |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 id。 |
| `realtimeVoiceProviders` | `string[]` | 此插件拥有的实时语音提供商 id。 |
| `memoryEmbeddingProviders` | `string[]` | 此插件拥有的 Memory 嵌入提供商 id。 |
| `mediaUnderstandingProviders` | `string[]` | 此插件拥有的媒体理解提供商 id。 |
| `imageGenerationProviders` | `string[]` | 此插件拥有的图像生成提供商 id。 |
| `videoGenerationProviders` | `string[]` | 此插件拥有的视频生成提供商 id。 |
| `webFetchProviders` | `string[]` | 此插件拥有的 web 抓取提供商 id。 |
| `webSearchProviders` | `string[]` | 此插件拥有的 web 搜索提供商 id。 |
| `migrationProviders` | `string[]` | 此插件为 `openclaw migrate` 拥有的导入提供商 id。 |
| `tools` | `string[]` | 此插件为内置契约检查拥有的智能体工具名称。 |

`contracts.embeddedExtensionFactories` 保留用于内置的、仅适用于 Codex app-server 的扩展工厂。内置工具结果转换应声明 `contracts.agentToolResultMiddleware`，并通过 `api.registerAgentToolResultMiddleware(...)` 注册。外部插件不能注册工具结果中间件，因为该接口可能会在模型看到之前重写高信任度工具输出。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`。未声明的插件仍可通过已弃用的兼容性回退运行，但该回退更慢，并将在迁移窗口结束后移除。

内置 Memory 嵌入提供商应为其公开的每个适配器 id 声明 `contracts.memoryEmbeddingProviders`，包括诸如 `local` 之类的内置适配器。独立 CLI 路径使用此清单契约，在完整 Gateway 网关运行时注册提供商之前仅加载拥有该适配器的插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解提供商具有默认模型、自动认证回退优先级，或泛型核心辅助工具在运行时加载前所需的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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
| `capabilities` | `("image" \| "audio" \| "video")[]` | 该提供商公开的媒体能力。 |
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的能力到模型默认值映射。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证的自动提供商回退时，数字越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | 该提供商支持的原生文档输入。 |

## `channelConfigs` 参考

当渠道插件在运行时加载前需要轻量级配置元数据时，请使用 `channelConfigs`。当没有可用的设置入口，或 `setup.requiresRuntime: false` 声明设置运行时并非必需时，只读渠道设置/Status 设备发现可以直接使用这些元数据来处理已配置的外部渠道。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置区段。用户仍然在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 读取清单元数据，以便在插件运行时代码执行之前确定哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明了 `channels[]` 的非内置插件也应声明匹配的 `channelConfigs` 条目。没有它们，OpenClaw 仍然可以加载插件，但冷路径配置 schema、设置和 Control UI 界面在插件运行时执行之前无法知道该渠道所拥有的选项结构。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以为在渠道运行时加载前执行的命令配置检查声明静态 `auto` 默认值。内置渠道也可以通过 `package.json#openclaw.channel.commands` 发布相同的默认值，并与其其他由包拥有的渠道目录元数据一起提供。

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

每个渠道条目可以包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供。 |
| `uiHints` | `Record<string, object>` | 该渠道配置区段的可选 UI 标签/占位符/敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道说明。 |
| `commands` | `object` | 供运行时前配置检查使用的静态原生命令和原生 Skills 自动默认值。 |
| `preferOver` | `string[]` | 在选择界面中，该渠道应优先于的旧版或较低优先级插件 id。 |

### 替换另一个渠道插件

当你的插件是某个渠道 id 的首选拥有者，而另一个插件也能提供该渠道时，请使用 `preferOver`。常见情况包括：插件 id 重命名、独立插件取代内置插件，或维护中的分支为了配置兼容性而保留相同的渠道 id。

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

当配置了 `channels.chat` 时，OpenClaw 会同时考虑渠道 id 和首选插件 id。如果低优先级插件只是因为它是内置插件或默认启用而被选中，OpenClaw 会在有效运行时配置中禁用它，以便由一个插件独占该渠道及其工具。显式用户选择仍然优先：如果用户显式启用了两个插件，OpenClaw 会保留该选择，并报告重复的渠道/工具诊断，而不是静默更改请求的插件集合。

将 `preferOver` 限定在确实可以提供同一渠道的插件 id 上。它不是通用优先级字段，也不会重命名用户配置键。

## `modelSupport` 参考

当 OpenClaw 需要在插件运行时加载前，根据诸如 `gpt-5.5` 或 `claude-sonnet-4.6` 这类简写模型 id 推断你的提供商插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用使用拥有该模型的 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 剩余歧义会被忽略，直到用户或配置指定提供商

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 id 匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除配置文件后缀后，用于匹配简写模型 id 的正则表达式源。 |

## `modelCatalog` 参考

当 OpenClaw 需要在加载插件运行时之前了解提供商模型元数据时，请使用 `modelCatalog`。这是固定目录行、提供商别名、抑制规则和发现模式的清单拥有来源。运行时刷新仍属于提供商运行时代码，但清单会告诉核心何时需要运行时。

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
| `providers` | `Record<string, object>` | 由该插件拥有的提供商 id 的目录条目。键也应出现在顶层 `providers` 中。 |
| `aliases` | `Record<string, object>` | 应解析到某个拥有中的提供商、以用于目录或抑制规划的提供商别名。 |
| `suppressions` | `object[]` | 由于提供商特定原因而由该插件抑制的、来自其他来源的模型条目。 |
| `discovery` | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供商目录是否可从清单元数据读取、刷新到缓存，或必须依赖运行时。 |

`aliases` 会参与模型目录规划中的提供商归属查找。别名目标必须是由同一插件拥有的顶层提供商。当按提供商过滤的列表使用别名时，OpenClaw 可以读取拥有它的清单，并应用别名 API/base URL 覆盖，而无需加载提供商运行时。

`suppressions` 是提供商运行时 `suppressBuiltInModel` 钩子的首选静态替代方案。只有当提供商由该插件拥有，或作为指向某个拥有中提供商的 `modelCatalog.aliases` 键被声明时，抑制条目才会生效。对于尚未迁移的插件，运行时抑制钩子仍会作为已弃用的兼容性回退继续运行。

提供商字段：

| 字段 | 类型 | 含义 |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string` | 此提供商目录中模型的可选默认 base URL。 |
| `api` | `ModelApi` | 此提供商目录中模型的可选默认 API 适配器。 |
| `headers` | `Record<string, string>` | 适用于此提供商目录的可选静态 headers。 |
| `models` | `object[]` | 必填的模型条目。没有 `id` 的条目会被忽略。 |

模型字段：

| 字段 | 类型 | 含义 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id` | `string` | 提供商本地模型 id，不含 `provider/` 前缀。 |
| `name` | `string` | 可选显示名称。 |
| `api` | `ModelApi` | 可选的按模型粒度 API 覆盖。 |
| `baseUrl` | `string` | 可选的按模型粒度 base URL 覆盖。 |
| `headers` | `Record<string, string>` | 可选的按模型粒度静态 headers。 |
| `input` | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模态。 |
| `reasoning` | `boolean` | 模型是否公开 reasoning 行为。 |
| `contextWindow` | `number` | 提供商原生上下文窗口。 |
| `contextTokens` | `number` | 当与 `contextWindow` 不同时，可选的有效运行时上下文上限。 |
| `maxTokens` | `number` | 已知时的最大输出 token 数。 |
| `cost` | `object` | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat` | `object` | 与 OpenClaw 模型配置兼容性匹配的可选兼容性标志。 |
| `status` | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅当该条目完全不应出现时才使用 suppress。 |
| `statusReason` | `string` | 与非可用状态一起显示的可选原因。 |
| `replaces` | `string[]` | 该模型取代的旧版提供商本地模型 id。 |
| `replacedBy` | `string` | 已弃用条目的替代提供商本地模型 id。 |
| `tags` | `string[]` | 供选择器和过滤器使用的稳定标签。 |

不要将仅运行时数据放入 `modelCatalog`。如果提供商需要账号状态、API 请求或本地进程发现才能确定完整模型集合，请在 `discovery` 中将该提供商声明为 `refreshable` 或 `runtime`。

## `modelIdNormalization` 参考

对于必须在提供商运行时加载前发生的、低成本且由提供商拥有的模型 id 清理，请使用 `modelIdNormalization`。这样可以将简短模型名称、提供商本地旧版 id，以及代理前缀规则等别名保存在拥有该模型的插件清单中，而不是保存在核心模型选择表中。

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

提供商字段：

| 字段 | 类型 | 含义 |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases` | `Record<string,string>` | 不区分大小写的精确模型 id 别名。返回值按原样保留。 |
| `stripPrefixes` | `string[]` | 在别名查找前要移除的前缀，适用于旧版 `provider/model` 重复情况。 |
| `prefixWhenBare` | `string` | 当规范化后的模型 id 尚未包含 `/` 时要添加的前缀。 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]` | 别名查找后的条件裸 id 前缀规则，以 `modelPrefix` 和 `prefix` 为键。 |

## `providerEndpoints` 参考

对于通用请求策略必须在提供商运行时加载前知道的端点分类，请使用 `providerEndpoints`。每个 `endpointClass` 的含义仍由核心负责；插件清单负责 host 和 base URL 元数据。

端点字段：

| 字段 | 类型 | 含义 |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass` | `string` | 已知的核心端点类别，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。 |
| `hosts` | `string[]` | 映射到该端点类别的精确主机名。 |
| `hostSuffixes` | `string[]` | 映射到该端点类别的主机后缀。若仅匹配域名后缀，则以 `.` 为前缀。 |
| `baseUrls` | `string[]` | 映射到该端点类别的精确规范化 HTTP(S) base URL。 |
| `googleVertexRegion` | `string` | 精确全局主机对应的静态 Google Vertex 区域。 |
| `googleVertexRegionHostSuffix` | `string` | 从匹配主机中剥离以暴露 Google Vertex 区域前缀的后缀。 |

## `providerRequest` 参考

对于通用请求策略在无需加载提供商运行时的情况下所需的低成本请求兼容性元数据，请使用 `providerRequest`。将特定行为的 payload 重写保留在提供商运行时钩子或共享提供商家族辅助工具中。

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

提供商字段：

| 字段 | 类型 | 含义 |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family` | `string` | 通用请求兼容性决策和诊断所使用的提供商家族标签。 |
| `compatibilityFamily` | `"moonshot"` | 供共享请求辅助工具使用的可选提供商家族兼容性分组。 |
| `openAICompletions` | `object` | OpenAI 兼容 completions 请求标志，目前为 `supportsStreamingUsage`。 |

## `modelPricing` 参考

当提供商需要在运行时加载前提供控制平面定价行为时，请使用 `modelPricing`。Gateway 网关定价缓存会读取此元数据，而无需导入提供商运行时代码。

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

提供商字段：

| 字段 | 类型 | 含义 |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external` | `boolean` | 对于永远不应获取 OpenRouter 或 LiteLLM 定价的本地/自托管提供商，设置为 `false`。 |
| `openRouter` | `false \| object` | OpenRouter 定价查找映射。`false` 会禁用此提供商的 OpenRouter 查找。 |
| `liteLLM` | `false \| object` | LiteLLM 定价查找映射。`false` 会禁用此提供商的 LiteLLM 查找。 |

来源字段：

| 字段 | 类型 | 含义 |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | 当外部目录提供商 id 与 OpenClaw 提供商 id 不同时使用的外部目录提供商 id，例如 `zai` 提供商对应的 `z-ai`。 |
| `passthroughProviderModel` | `boolean` | 将包含斜杠的模型 id 视为嵌套的 `provider/model` 引用，适用于 OpenRouter 之类的代理提供商。 |
| `modelIdTransforms` | `"version-dots"[]` | 额外的外部目录模型 id 变体。`version-dots` 会尝试诸如 `claude-opus-4.6` 之类的点号版本 id。 |

### OpenClaw Provider Index

OpenClaw Provider Index 是由 OpenClaw 拥有的预览元数据，用于其插件可能尚未安装的提供商。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。Provider Index 是内部回退契约，未来可安装提供商和预安装模型选择器界面会在提供商插件尚未安装时使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单中的 `modelCatalog`。
3. 来自显式刷新的模型目录缓存。
4. OpenClaw Provider Index 预览条目。

Provider Index 不得包含密钥、启用状态、运行时钩子或实时的账号特定模型数据。它的预览目录使用与插件清单相同的 `modelCatalog` 提供商条目结构，但应仅限于稳定的显示元数据，除非运行时适配器字段（如 `api`、`baseUrl`、定价或兼容性标志）被有意保持与已安装插件清单一致。对于具有实时 `/models` 发现能力的提供商，应通过显式模型目录缓存路径写入刷新后的条目，而不是在正常列表或新手引导流程中调用提供商 API。

Provider Index 条目还可以携带可安装插件元数据，用于那些插件已移出核心或尚未安装的提供商。此元数据遵循与渠道目录相同的模式：包名、npm 安装规格、预期完整性，以及轻量级认证选项标签，足以显示一个可安装的设置选项。一旦插件安装完成，其清单即取得优先权，Provider Index 中该提供商的条目会被忽略。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## 清单与 `package.json` 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置验证、认证选项元数据，以及在插件代码运行前必须存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 配置块 |

如果你不确定某段元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，请放在 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，请放在 `package.json`

### 会影响设备发现的 `package.json` 字段

某些运行时前插件元数据有意放在 `package.json` 的 `openclaw` 配置块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须保持在插件包目录内。 |
| `openclaw.runtimeExtensions` | 为已安装包声明构建后的 JavaScript 运行时入口点。必须保持在插件包目录内。 |
| `openclaw.setupEntry` | 在新手引导、延迟渠道启动和只读渠道 Status/SecretRef 发现期间使用的轻量级仅设置入口点。必须保持在插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装包声明构建后的 JavaScript 设置入口点。必须保持在插件包目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.commands` | 在渠道运行时加载前供配置、审计和命令列表界面使用的静态原生命令和原生 Skills 自动默认元数据。 |
| `openclaw.channel.configuredState` | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅环境变量的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何登录状态？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装/更新提示。 |
| `openclaw.install.defaultChoice` | 当存在多个安装来源时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 宿主版本，使用类似 `>=2026.3.22` 的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm 分发完整性字符串，例如 `sha512-...`；安装和更新流程会据此验证获取到的制品。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个受限的内置插件重新安装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置的渠道界面，再加载完整渠道插件。 |

清单元数据决定了在运行时加载前，新手引导中会出现哪些提供商/渠道/设置选项。`package.json#openclaw.install` 告诉新手引导当用户选择这些选项之一时，如何获取或启用该插件。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；较新的但有效的值会让旧宿主跳过该插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确规格与 `expectedIntegrity` 配对，这样如果获取到的 npm 制品不再匹配固定版本，更新流程就会以失败关闭。出于兼容性考虑，交互式新手引导仍会提供受信任注册表的 npm 规格，包括裸包名和 dist-tag。目录诊断可以区分精确、浮动、带完整性固定、缺失完整性、包名不匹配和无效默认选项来源。它们还会在存在 `expectedIntegrity` 但没有可用于固定的有效 npm 来源时发出警告。当存在 `expectedIntegrity` 时，安装/更新流程会强制执行它；省略时，注册表解析结果会被记录，但不会附带完整性固定。

当 Status、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账号时，渠道插件应提供 `openclaw.setupEntry`。设置入口应公开渠道元数据以及适用于设置的安全配置、Status 和 secrets 适配器；将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 是有意保持狭窄范围的。它不会让任意损坏的配置变得可安装。当前它只允许安装流程从特定的旧内置插件升级失败中恢复，例如缺失的内置插件路径，或同一个内置插件的过期 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并引导操作员使用 `openclaw doctor --fix`。

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

当设置、Doctor、Status 或只读存在性流程需要在完整渠道插件加载前执行一个低成本的“是/否”认证探测时，请使用它。持久化认证状态并不是已配置的渠道状态：不要用这个元数据自动启用插件、修复运行时依赖，或决定是否应加载某个渠道运行时。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 来间接调用它。

`openclaw.channel.configuredState` 采用相同的结构，用于低成本的仅环境变量已配置检查：

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

当某个渠道可以通过环境变量或其他微小的非运行时输入来回答已配置状态时，请使用它。如果检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` 钩子中。

## 设备发现优先级（重复插件 id）

OpenClaw 会从多个根目录发现插件（内置、全局安装、工作区、显式配置选择的路径）。如果两个发现结果共享相同的 `id`，则只保留**最高优先级**的清单；较低优先级的重复项会被丢弃，而不是与其并行加载。

优先级从高到低如下：

1. **配置选择** — 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** — 随 OpenClaw 一起发布的插件
3. **全局安装** — 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** — 相对于当前工作区发现的插件

影响：

- 工作区中一个分叉版或陈旧的内置插件副本不会遮蔽内置构建版本。
- 如果你确实要用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其凭借优先级获胜，而不是依赖工作区发现。
- 被丢弃的重复项会被记录，这样 Doctor 和启动诊断就能指出被丢弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读取/写入时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键会被视为**错误**，除非该渠道 id 已由插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现**的插件 id。未知 id 会被视为**错误**。
- 如果插件已安装，但其清单或 schema 缺失或损坏，验证将失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件已**禁用**，配置会被保留，并且 Doctor + 日志中会显示**警告**。

完整的 `plugins.*` schema 请参阅[配置参考](/zh-CN/gateway/configuration)。

## 注意事项

- 对于**原生 OpenClaw 插件**，包括本地文件系统加载，清单都是**必需的**。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍然是对象，就接受注释、尾随逗号和未加引号的键。
- 清单加载器只会读取已记录的清单字段。避免自定义顶层键。
- 当插件不需要它们时，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；将其用于静态提供商目录元数据或窄范围发现描述符，而不是请求时执行。
- 排他性插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 对应 `plugins.slots.memory`，`kind: "context-engine"` 对应 `plugins.slots.contextEngine`（默认 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅为声明式。Status、审计、cron 投递验证和其他只读界面在将某个环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 对于需要提供商代码的运行时向导元数据，请参阅[提供商运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器允许列表要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关内容

<CardGroup cols={3}>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件入门指南。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考和子路径导入。
  </Card>
</CardGroup>
