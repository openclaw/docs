---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布一个插件配置 schema，或调试插件校验错误
summary: 插件清单 + JSON schema 要求（严格配置校验）
title: 插件清单
x-i18n:
    generated_at: "2026-04-26T04:44:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b4988c8d383d27e10d04bc327d45e41714456288922aa1b108e4c5609e4a803
    source_path: plugins/manifest.md
    workflow: 15
---

此页面仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参见 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会按照此处描述的 `openclaw.plugin.json` schema 对它们进行校验。

对于兼容 bundle，当其布局符合 OpenClaw 运行时预期时，OpenClaw 当前会读取 bundle 元数据，以及声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值和受支持的 hook pack。

每个原生 OpenClaw 插件**必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下校验配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

请参见完整的插件系统指南：[Plugins](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指南，请参见：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便在不启动插件运行时的情况下进行检查。

**可用于：**

- 插件标识、配置校验和配置 UI 提示
- 认证、新手引导和设置元数据（别名、自动启用、提供商环境变量、认证选项）
- 控制平面界面的激活提示
- 简写模型族归属
- 静态能力归属快照（`contracts`）
- 供共享 `openclaw qa` 主机检查的 QA runner 元数据
- 合并到目录和校验界面的渠道特定配置元数据

**不要用于：**注册运行时行为、声明代码入口点或 npm 安装元数据。这些应放在你的插件代码和 `package.json` 中。

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
| `id`                                 | 是       | `string`                         | 规范插件 id。这是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                               |
| `configSchema`                       | 是       | `object`                         | 此插件配置的内联 JSON Schema。                                                                                                                                                                                      |
| `enabledByDefault`                   | 否       | `true`                           | 将内置插件标记为默认启用。省略此项，或设置为任何非 `true` 的值，则该插件默认保持禁用。                                                                                                      |
| `legacyPluginIds`                    | 否       | `string[]`                       | 会规范化为此规范插件 id 的旧版 id。                                                                                                                                                                            |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                       | 当认证、配置或模型引用提到这些 provider id 时，应自动启用此插件。                                                                                                                                   |
| `kind`                               | 否       | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的独占插件类型。                                                                                                                                                                      |
| `channels`                           | 否       | `string[]`                       | 由此插件拥有的渠道 id。用于发现和配置校验。                                                                                                                                                       |
| `providers`                          | 否       | `string[]`                       | 由此插件拥有的 provider id。                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | 否       | `string`                         | 轻量级 provider 发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、限定在清单范围内的 provider 目录元数据。                                             |
| `modelSupport`                       | 否       | `object`                         | 由清单拥有的简写模型族元数据，用于在运行时之前自动加载插件。                                                                                                                                       |
| `modelCatalog`                       | 否       | `object`                         | 由此插件拥有的 provider 的声明式模型目录元数据。这是未来只读列表、onboarding、新手引导、模型选择器、别名和抑制功能在不加载插件运行时情况下的控制平面契约。       |
| `providerEndpoints`                  | 否       | `object[]`                       | 由清单拥有的端点 host/baseUrl 元数据，适用于核心必须在 provider 运行时加载前进行分类的 provider 路由。                                                                                                          |
| `cliBackends`                        | 否       | `string[]`                       | 由此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。                                                                                                                       |
| `syntheticAuthRefs`                  | 否       | `string[]`                       | 在运行时加载前进行冷模型发现期间，应探测其插件自有 synthetic auth hook 的 provider 或 CLI 后端引用。                                                                                            |
| `nonSecretAuthMarkers`               | 否       | `string[]`                       | 由内置插件拥有的占位 API key 值，表示非机密的本地、OAuth 或环境凭证状态。                                                                                                              |
| `commandAliases`                     | 否       | `object[]`                       | 由此插件拥有的命令名称，这些名称应在运行时加载前生成具备插件感知能力的配置和 CLI 诊断信息。                                                                                                              |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`       | 用于 provider 认证/Status 查找的已弃用兼容环境变量元数据。新插件优先使用 `setup.providers[].envVars`；在弃用过渡期内，OpenClaw 仍会读取此项。                                               |
| `providerAuthAliases`                | 否       | `Record<string, string>`         | 应复用另一个 provider id 进行认证查找的 provider id，例如与基础 provider API key 和认证配置文件共享的 coding provider。                                                                        |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于通用启动/配置辅助工具应可见的、由环境变量驱动的渠道设置或认证界面。                                          |
| `providerAuthChoices`                | 否       | `object[]`                       | 用于 onboarding 选择器、首选 provider 解析和简单 CLI 标志连接的轻量级认证选项元数据。                                                                                                                     |
| `activation`                         | 否       | `object`                         | 用于 provider、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅为元数据；实际行为仍由插件运行时负责。                                                              |
| `setup`                              | 否       | `object`                         | 轻量级设置/新手引导描述符，供发现和设置界面在不加载插件运行时的情况下检查。                                                                                                                  |
| `qaRunners`                          | 否       | `object[]`                       | 由共享 `openclaw qa` 主机在插件运行时加载前使用的轻量级 QA runner 描述符。                                                                                                                                    |
| `contracts`                          | 否       | `object`                         | 外部认证 hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、网页搜索和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`         | 为 `contracts.mediaUnderstandingProviders` 中声明的 provider id 提供的轻量级媒体理解默认值。                                                                                                                          |
| `channelConfigs`                     | 否       | `Record<string, object>`         | 由清单拥有的渠道配置元数据，会在运行时加载前合并到发现和校验界面中。                                                                                                                        |
| `skills`                             | 否       | `string[]`                       | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                                           |
| `name`                               | 否       | `string`                         | 人类可读的插件名称。                                                                                                                                                                                                       |
| `description`                        | 否       | `string`                         | 显示在插件界面中的简短摘要。                                                                                                                                                                                           |
| `version`                            | 否       | `string`                         | 仅供参考的插件版本。                                                                                                                                                                                                     |
| `uiHints`                            | 否       | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个 onboarding 或认证选项。
OpenClaw 会在 provider 运行时加载之前读取这些内容。
provider 设置流程会优先使用这些清单选项，然后为兼容性回退到运行时向导元数据和安装目录选项。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | 是       | `string`                                        | 此选项所属的 provider id。                                                                      |
| `method`              | 是       | `string`                                        | 要分发到的认证方法 id。                                                                           |
| `choiceId`            | 是       | `string`                                        | onboarding 和 CLI 流程使用的稳定认证选项 id。                                                  |
| `choiceLabel`         | 否       | `string`                                        | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。                                        |
| `choiceHint`          | 否       | `string`                                        | 选择器的简短辅助文本。                                                                        |
| `assistantPriority`   | 否       | `number`                                        | 在由智能体驱动的交互式选择器中，值越小排序越靠前。                                       |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                  | 在智能体选择器中隐藏该选项，但仍允许手动通过 CLI 选择。                        |
| `deprecatedChoiceIds` | 否       | `string[]`                                      | 应将用户重定向到此替代选项的旧版选项 id。                                 |
| `groupId`             | 否       | `string`                                        | 用于对相关选项分组的可选组 id。                                                          |
| `groupLabel`          | 否       | `string`                                        | 该分组面向用户的标签。                                                                        |
| `groupHint`           | 否       | `string`                                        | 该分组的简短辅助文本。                                                                         |
| `optionKey`           | 否       | `string`                                        | 用于简单单标志认证流程的内部选项键。                                                      |
| `cliFlag`             | 否       | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                           |
| `cliOption`           | 否       | `string`                                        | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                             |
| `cliDescription`      | 否       | `string`                                        | CLI 帮助中使用的说明。                                                                            |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些 onboarding 界面中。如果省略，默认为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有一个运行时命令名，而用户可能会误将其放入 `plugins.allow`，或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据在不导入插件运行时代码的情况下提供诊断信息。

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
| `name`       | 是       | `string`          | 属于此插件的命令名称。                               |
| `kind`       | 否       | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。 |
| `cliCommand` | 否       | `string`          | 相关的根 CLI 命令；如果存在，可用于建议 CLI 操作。  |

## `activation` 参考

当插件可以以低成本声明哪些控制平面事件应将其纳入激活/加载计划时，请使用 `activation`。

此块是规划器元数据，不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器会使用这些字段缩小候选插件范围，然后再回退到现有的清单归属元数据，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks。

优先使用已经描述归属关系的最窄元数据。如果 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 这些字段已经能够表达该关系，就使用它们。只有在这些归属字段无法表示额外规划提示时，才使用 `activation`。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。当前使用方会先将它作为缩小范围的提示，再进行更广泛的插件加载，因此缺失激活元数据通常只会带来性能成本；只要旧版清单归属回退仍然存在，它就不应影响正确性。

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
| `onProviders`    | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的 provider id。                                  |
| `onCommands`     | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的命令 id。                                   |
| `onChannels`     | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的渠道 id。                                   |
| `onRoutes`       | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的路由类型。                                   |
| `onCapabilities` | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。尽可能优先使用更窄的字段。 |

当前的实际使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置/渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]`
  归属
- 由 provider 触发的设置/运行时规划在缺少显式 provider
  激活元数据时，会回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改为使用 `commandAliases` 归属。这些原因标签用于主机诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享的 `openclaw qa` 根命令下提供一个或多个传输 runner 时，请使用 `qaRunners`。保持此元数据轻量且静态；插件运行时仍通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 界面负责实际 CLI 注册。

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
| `commandName` | 是       | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。    |
| `description` | 否       | `string` | 当共享主机需要 stub 命令时使用的回退帮助文本。 |

## `setup` 参考

当设置和 onboarding 界面需要在运行时加载前读取由插件拥有的轻量级元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面/设置流程的设置专用描述符界面，应保持为仅元数据。

当存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现的首选“描述符优先”查找界面。如果描述符只能缩小候选插件范围，而设置仍需要更丰富的设置期运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会在通用 provider 认证和环境变量查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用过渡期内仍通过兼容适配器受支持，但仍使用它的非内置插件会收到清单诊断。新插件应将设置/Status 环境变量元数据放在 `setup.providers[].envVars` 上。

当没有设置入口，或 `setup.requiresRuntime: false` 声明设置运行时非必需时，OpenClaw 还可以从 `setup.providers[].authMethods` 派生简单的设置选项。对于自定义标签、CLI 标志、onboarding 范围和智能体元数据，显式的 `providerAuthChoices` 条目仍然是首选。

只有当这些描述符已足以支撑设置界面时，才设置 `requiresRuntime: false`。OpenClaw 会将显式 `false` 视为“仅描述符”契约，并且不会为了设置查找而执行 `setup-api` 或 `openclaw.setupEntry`。如果一个仅描述符插件仍提供了这些设置运行时入口之一，OpenClaw 会报告一条附加诊断，并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，因此现有那些添加了描述符但未添加该标志的插件不会中断。

由于设置查找可能会执行插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在已发现插件之间必须保持唯一。归属关系不明确时会采用失败即关闭的策略，而不是按发现顺序选出一个“胜者”。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的 provider 或 CLI 后端，或者某个描述符没有匹配的运行时注册项，设置注册表诊断会报告描述符漂移。这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | 是       | `string`   | 在设置或 onboarding 期间暴露的 provider id。保持规范化 id 在全局唯一。 |
| `authMethods` | 否       | `string[]` | 此 provider 在不加载完整运行时的情况下支持的设置/认证方法 id。           |
| `envVars`     | 否       | `string[]` | 通用设置/Status 界面可在插件运行时加载前检查的环境变量。   |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 否       | `object[]` | 在设置和 onboarding 期间暴露的 provider 设置描述符。                                     |
| `cliBackends`      | 否       | `string[]` | 用于“描述符优先”设置查找的设置期后端 id。保持规范化 id 在全局唯一。 |
| `configMigrations` | 否       | `string[]` | 属于此插件设置界面的配置迁移 id。                                          |
| `requiresRuntime`  | 否       | `boolean`  | 在描述符查找之后，设置是否仍需要执行 `setup-api`。                            |

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

每个字段提示可包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 面向用户的字段标签。                |
| `help`        | `string`   | 简短辅助文本。                      |
| `tags`        | `string[]` | 可选 UI 标签。                       |
| `advanced`    | `boolean`  | 将该字段标记为高级选项。            |
| `sensitive`   | `boolean`  | 将该字段标记为机密或敏感字段。 |
| `placeholder` | `string`   | 表单输入的占位文本。       |

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
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 扩展工厂 id，目前为 `codex-app-server`。 |
| `agentToolResultMiddleware`      | `string[]` | 内置插件可为其注册工具结果中间件的运行时 id。 |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部认证配置文件 hook 的 provider id。       |
| `speechProviders`                | `string[]` | 此插件拥有的语音 provider id。                                 |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录 provider id。                 |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音 provider id。                         |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的 Memory 嵌入 provider id。                       |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解 provider id。                    |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成 provider id。                       |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成 provider id。                       |
| `webFetchProviders`              | `string[]` | 此插件拥有的网页抓取 provider id。                              |
| `webSearchProviders`             | `string[]` | 此插件拥有的网页搜索 provider id。                             |
| `tools`                          | `string[]` | 此插件拥有的 Agent 工具名称，用于内置契约检查。        |

`contracts.embeddedExtensionFactories` 保留用于仅面向内置 Codex
app-server 的扩展工厂。内置工具结果转换应声明 `contracts.agentToolResultMiddleware`，并改为使用
`api.registerAgentToolResultMiddleware(...)` 进行注册。外部插件不能
注册工具结果中间件，因为该接缝可以在模型看到高信任度工具输出之前重写它。

实现 `resolveExternalAuthProfiles` 的 provider 插件应声明
`contracts.externalAuthProviders`。未声明该项的插件仍会通过一个已弃用的兼容性回退路径运行，但该回退更慢，并将在迁移窗口结束后移除。

内置 Memory 嵌入 provider 应为其暴露的每个适配器 id 声明
`contracts.memoryEmbeddingProviders`，包括诸如 `local` 之类的内置适配器。独立 CLI 路径使用此清单契约，以便在完整 Gateway 网关运行时注册 provider 之前，仅加载其所属插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解 provider 具有默认模型、自动认证回退优先级，或通用核心辅助工具在运行时加载前需要的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键也必须在
`contracts.mediaUnderstandingProviders` 中声明。

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此 provider 暴露的媒体能力。                                 |
| `defaultModels`        | `Record<string, string>`            | 当配置未指定模型时使用的“能力到模型”默认值。      |
| `autoPriority`         | `Record<string, number>`            | 用于基于凭证自动回退 provider 时，数值越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | 该 provider 支持的原生文档输入。                            |

## `channelConfigs` 参考

当一个渠道插件在运行时加载前需要轻量级配置元数据时，请使用 `channelConfigs`。当没有可用的设置入口，或 `setup.requiresRuntime: false` 声明设置运行时非必需时，只读渠道设置/Status 发现可以直接使用这些元数据来处理已配置的外部渠道。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置节。用户仍然在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 读取清单元数据，以便在插件运行时代码执行前确定哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同路径：

- `configSchema` 校验 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 校验 `channels.<channel-id>`

声明了 `channels[]` 的非内置插件也应声明匹配的 `channelConfigs` 条目。没有它们时，OpenClaw 仍然可以加载插件，但冷路径配置 schema、设置和 Control UI 界面在插件运行时执行前无法知道该渠道拥有的选项结构。

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
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个声明的渠道配置条目都必须提供。         |
| `uiHints`     | `Record<string, object>` | 该渠道配置节的可选 UI 标签/占位符/敏感性提示。          |
| `label`       | `string`                 | 当运行时元数据尚未准备好时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string`                 | 用于检查和目录界面的简短渠道说明。                               |
| `preferOver`  | `string[]`               | 在选择界面中，此渠道应优先于的旧版或较低优先级插件 id。    |

### 替换另一个渠道插件

当你的插件是某个渠道 id 的首选拥有者，而另一个插件也能提供该渠道时，请使用 `preferOver`。常见情况包括：插件 id 已重命名、独立插件替代了内置插件，或一个维护中的 fork 为了配置兼容性而保留相同的渠道 id。

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

当配置了 `channels.chat` 时，OpenClaw 会同时考虑渠道 id 和首选插件 id。如果低优先级插件之所以被选中，只是因为它是内置的或默认启用，OpenClaw 会在生效运行时配置中将其禁用，从而确保只有一个插件拥有该渠道及其工具。显式用户选择仍然优先：如果用户显式启用了两个插件，OpenClaw 会保留该选择，并报告重复渠道/工具诊断，而不是静默更改所请求的插件集合。

请将 `preferOver` 限定在确实能够提供同一渠道的插件 id 范围内。它不是通用优先级字段，也不会重命名用户配置键。

## `modelSupport` 参考

当 OpenClaw 需要在插件运行时加载前，根据诸如 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 id 推断你的 provider 插件时，请使用 `modelSupport`。

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
- 如果一个非内置插件和一个内置插件同时匹配，则非内置插件胜出
- 剩余的歧义会被忽略，直到用户或配置指定某个 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 对简写模型 id 使用 `startsWith` 匹配的前缀。                 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

## `modelCatalog` 参考

当 OpenClaw 需要在加载插件运行时之前了解 provider 模型元数据时，请使用 `modelCatalog`。这是由清单拥有的固定目录行、provider 别名、抑制规则和发现模式的数据源。运行时刷新仍属于 provider 运行时代码，但清单会告知核心何时需要运行时。

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
| `providers`    | `Record<string, object>`                                 | 由此插件拥有的 provider id 的目录行。键也应出现在顶层 `providers` 中。       |
| `aliases`      | `Record<string, object>`                                 | 应解析到所属 provider 的 provider 别名，用于目录或抑制规划。              |
| `suppressions` | `object[]`                                               | 因特定 provider 原因而由此插件抑制的、来自其他来源的模型行。                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | provider 目录是否可从清单元数据读取、刷新到缓存，或是否需要运行时。 |

provider 字段：

| 字段 | 类型 | 含义 |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此 provider 目录中模型的可选默认 base URL。    |
| `api`     | `ModelApi`               | 此 provider 目录中模型的可选默认 API 适配器。 |
| `headers` | `Record<string, string>` | 应用于此 provider 目录的可选静态标头。      |
| `models`  | `object[]`               | 必填模型行。没有 `id` 的行会被忽略。            |

模型字段：

| 字段 | 类型 | 含义 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | provider 本地模型 id，不含 `provider/` 前缀。                    |
| `name`          | `string`                                                       | 可选显示名称。                                                      |
| `api`           | `ModelApi`                                                     | 可选的逐模型 API 覆盖。                                            |
| `baseUrl`       | `string`                                                       | 可选的逐模型 base URL 覆盖。                                       |
| `headers`       | `Record<string, string>`                                       | 可选的逐模型静态标头。                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模态。                                               |
| `reasoning`     | `boolean`                                                      | 模型是否暴露 reasoning 行为。                               |
| `contextWindow` | `number`                                                       | 原生 provider 上下文窗口。                                             |
| `contextTokens` | `number`                                                       | 与 `contextWindow` 不同时的可选有效运行时上下文上限。 |
| `maxTokens`     | `number`                                                       | 已知时的最大输出 token 数。                                           |
| `cost`          | `object`                                                       | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat`        | `object`                                                       | 与 OpenClaw 模型配置兼容性匹配的可选兼容标志。  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅当该行完全不应出现时才使用抑制。          |
| `statusReason`  | `string`                                                       | 非可用状态下显示的可选原因。                            |
| `replaces`      | `string[]`                                                     | 此模型取代的旧 provider 本地模型 id。                       |
| `replacedBy`    | `string`                                                       | 已弃用行对应的替代 provider 本地模型 id。                    |
| `tags`          | `string[]`                                                     | 供选择器和筛选器使用的稳定标签。                                    |

不要将仅运行时数据放入 `modelCatalog`。如果某个 provider 需要账户状态、API 请求或本地进程发现才能获知完整模型集，请在 `discovery` 中将该 provider 声明为 `refreshable` 或 `runtime`。

### OpenClaw Provider Index

OpenClaw Provider Index 是由 OpenClaw 拥有的预览元数据，用于那些其插件可能尚未安装的 provider。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。Provider Index 是内部回退契约，未来可安装 provider 和预安装模型选择器界面会在 provider 插件未安装时使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单 `modelCatalog`。
3. 显式刷新得到的模型目录缓存。
4. OpenClaw Provider Index 预览行。

Provider Index 不得包含机密、启用状态、运行时 hook 或实时的账户特定模型数据。它的预览目录使用与插件清单相同的 `modelCatalog` provider 行结构，但除非运行时适配器字段（如 `api`、`baseUrl`、定价或兼容标志）被有意与已安装插件清单保持一致，否则应限制为稳定显示元数据。具有实时 `/models` 发现能力的 provider，应通过显式模型目录缓存路径写入刷新后的行，而不是在常规列表或 onboarding 期间调用 provider API。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders`
移动到 `contracts` 下；常规清单加载已不再将这些顶层字段视为能力归属。

## 清单与 `package.json` 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 发现、配置校验、认证选项元数据，以及必须在插件代码运行前存在的 UI 提示 |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 配置块 |

如果你不确定某段元数据应放在哪里，请使用这个规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，请将其放在 `openclaw.plugin.json` 中
- 如果它与打包、入口文件或 npm 安装行为有关，请将其放在 `package.json` 中

### 影响发现的 `package.json` 字段

某些运行时前的插件元数据会被有意放在 `package.json` 的
`openclaw` 配置块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 声明原生插件入口点。必须保持在插件包目录内。                                                                                                   |
| `openclaw.runtimeExtensions`                                      | 为已安装包声明构建后的 JavaScript 运行时入口点。必须保持在插件包目录内。                                                                 |
| `openclaw.setupEntry`                                             | 轻量级、仅用于设置的入口点，供 onboarding、延迟渠道启动和只读渠道 Status/SecretRef 发现使用。必须保持在插件包目录内。 |
| `openclaw.runtimeSetupEntry`                                      | 为已安装包声明构建后的 JavaScript 设置入口点。必须保持在插件包目录内。                                                                |
| `openclaw.channel`                                                | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。                                                                                                 |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅环境变量驱动的设置？”。                                         |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何账号已登录？”。                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 内置插件和外部发布插件的安装/更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | 当存在多个安装来源时的首选安装路径。                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                                                    |
| `openclaw.install.expectedIntegrity`                              | 预期的 npm 分发完整性字符串，例如 `sha512-...`；安装和更新流程会据此校验获取到的工件。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | 当配置无效时，允许一个范围很窄的内置插件重新安装恢复路径。                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用的渠道界面，再加载完整渠道插件。                                                                                                 |

清单元数据决定了在运行时加载前，哪些 provider/渠道/设置选项会出现在 onboarding 中。`package.json#openclaw.install` 则告诉 onboarding，当用户选择这些选项之一时，应如何获取或启用该插件。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；在旧主机上，较新但有效的值会导致跳过该插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确 spec 与 `expectedIntegrity` 配对使用，这样如果获取到的 npm 工件不再匹配已固定的发布版本，更新流程就会采用失败即关闭策略。出于兼容性考虑，交互式 onboarding 仍会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。目录诊断可以区分精确来源、浮动来源、带完整性固定的来源、缺少完整性的来源、包名不匹配来源以及无效默认选项来源。如果存在 `expectedIntegrity`，但没有可供其固定的有效 npm 来源，它们也会发出警告。当存在 `expectedIntegrity` 时，安装/更新流程会强制执行；当省略时，注册表解析结果会被记录，但没有完整性固定。

当 Status、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账号时，渠道插件应提供 `openclaw.setupEntry`。该设置入口应暴露渠道元数据，以及适用于设置的安全配置、Status 和 secrets 适配器；网络客户端、网关监听器和传输运行时应保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的设计范围是有意收窄的。它不会让任意损坏的配置变为可安装。当前它只允许安装流程从某些特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或同一个内置插件对应的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作人员引导到 `openclaw doctor --fix`。

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前进行一个低成本的是/否认证探测时，请使用它。目标导出应是一个仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 转发它。

`openclaw.channel.configuredState` 对于低成本的仅环境变量已配置检查，采用相同的结构：

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

当一个渠道可以仅根据环境变量或其他微型非运行时输入来回答其已配置状态时，请使用它。如果该检查需要完整配置解析或真实渠道运行时，请改为将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 发现优先级（重复插件 id）

OpenClaw 会从多个根目录发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两个发现结果共享相同的 `id`，则只保留**优先级最高**的清单；较低优先级的重复项会被丢弃，而不是与其并行加载。

优先级从高到低如下：

1. **配置中选定** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一起发布的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 位于工作区中的某个内置插件 fork 或陈旧副本，不会遮蔽内置构建版本。
- 如果要真正用本地插件覆盖一个内置插件，请通过 `plugins.entries.<id>` 固定它，使其依靠优先级胜出，而不是依赖工作区发现。
- 被丢弃的重复项会被记录日志，以便 Doctor 和启动诊断能指出被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 允许空 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读写时校验，而不是在运行时校验。

## 校验行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 属于**错误**。
- 如果某个插件已安装，但其清单或 schema 缺失或损坏，
  校验会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件处于**禁用**状态，则该配置会被保留，并且
  Doctor + 日志中会显示一条**警告**。

有关完整 `plugins.*` schema，请参见 [配置参考](/zh-CN/gateway/configuration)。

## 说明

- **原生 OpenClaw 插件必须提供清单**，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于发现 + 校验。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取有文档记录的清单字段。请避免使用自定义顶层键。
- 当插件不需要它们时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；应将其用于静态 provider 目录元数据或窄范围发现描述符，而不是请求时执行。
- 独占插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 对应 `plugins.slots.memory`，`kind: "context-engine"` 对应 `plugins.slots.contextEngine`（默认 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅是声明式信息。Status、审计、cron 投递校验及其他只读界面，在将某个环境变量视为已配置前，仍会应用插件信任和生效激活策略。
- 关于需要 provider 代码的运行时向导元数据，请参见 [Provider runtime hooks](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
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
