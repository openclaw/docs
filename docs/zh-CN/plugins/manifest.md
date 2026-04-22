---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布一个插件配置模式，或调试插件验证错误
summary: 插件清单 + JSON 模式要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-22T00:52:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# 插件清单（`openclaw.plugin.json`）

本页仅适用于**原生 OpenClaw 插件清单**。

有关兼容的 bundle 布局，请参阅 [插件 bundle](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会根据此处介绍的 `openclaw.plugin.json` 模式对其进行验证。

对于兼容 bundle，当其布局符合 OpenClaw 运行时预期时，OpenClaw 目前会读取 bundle 元数据，以及已声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
有关原生能力模型和当前外部兼容性指南，请参阅：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载你的插件代码之前读取的元数据。

用途包括：

- 插件身份标识
- 配置验证
- 无需启动插件运行时即可使用的认证和新手引导元数据
- 控制平面界面可在运行时加载前检查的低成本激活提示
- 设置 / 新手引导界面可在运行时加载前检查的低成本设置描述符
- 应在插件运行时加载前解析的别名和自动启用元数据
- 应在插件运行时加载前自动激活插件的简写模型家族归属元数据
- 用于内置兼容接线和契约覆盖的静态能力归属快照
- 共享 `openclaw qa` 主机可在插件运行时加载前检查的低成本 QA 运行器元数据
- 应在不加载运行时的情况下合并到目录和验证界面的渠道特定配置元数据
- 配置 UI 提示

不要将它用于：

- 注册运行时行为
- 声明代码入口点
- npm 安装元数据

这些应放在你的插件代码和 `package.json` 中。

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
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | 是      | `string`                         | 规范插件 id。这是 `plugins.entries.<id>` 中使用的 id。                                                                                                                                          |
| `configSchema`                      | 是      | `object`                         | 此插件配置的内联 JSON Schema。                                                                                                                                                                 |
| `enabledByDefault`                  | 否       | `true`                           | 将内置插件标记为默认启用。省略此字段，或将其设为任何非 `true` 的值，则插件默认保持禁用。                                                                                 |
| `legacyPluginIds`                   | 否       | `string[]`                       | 会规范化为此规范插件 id 的旧版 id。                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders` | 否       | `string[]`                       | 当认证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。                                                                                                              |
| `kind`                              | 否       | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的排他性插件类型。                                                                                                                                                 |
| `channels`                          | 否       | `string[]`                       | 由此插件拥有的渠道 id。用于设备发现和配置验证。                                                                                                                                  |
| `providers`                         | 否       | `string[]`                       | 由此插件拥有的提供商 id。                                                                                                                                                                           |
| `modelSupport`                      | 否       | `object`                         | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。                                                                                                                  |
| `providerEndpoints`                 | 否       | `object[]`                       | 由清单拥有的端点 host/baseUrl 元数据，用于核心在提供商运行时加载前对提供商路由进行分类。                                                                                     |
| `cliBackends`                       | 否       | `string[]`                       | 由此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。                                                                                                  |
| `syntheticAuthRefs`                 | 否       | `string[]`                       | 在运行时加载前的冷模型发现期间，应探测其插件拥有的 synthetic auth hook 的提供商或 CLI 后端引用。                                                                       |
| `nonSecretAuthMarkers`              | 否       | `string[]`                       | 由内置插件拥有的占位 API 密钥值，表示非机密的本地、OAuth 或环境凭证状态。                                                                                         |
| `commandAliases`                    | 否       | `object[]`                       | 由此插件拥有的命令名称，应在运行时加载前生成具备插件感知能力的配置和 CLI 诊断信息。                                                                                         |
| `providerAuthEnvVars`               | 否       | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量级 provider 认证环境变量元数据。                                                                                                                      |
| `providerAuthAliases`               | 否       | `Record<string, string>`         | 应复用另一个 provider id 进行认证查找的 provider id，例如与基础 provider 共享 API 密钥和认证配置文件的编码 provider。                                                   |
| `channelEnvVars`                    | 否       | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于由环境变量驱动的渠道设置或认证界面，以便通用启动 / 配置辅助工具可以看到。                     |
| `providerAuthChoices`               | 否       | `object[]`                       | 用于新手引导选择器、首选 provider 解析和简单 CLI 标志接线的轻量级认证选项元数据。                                                                                                |
| `activation`                        | 否       | `object`                         | 用于由 provider、命令、渠道、路由和能力触发加载的轻量级激活提示。仅为元数据；实际行为仍由插件运行时负责。                                                    |
| `setup`                             | 否       | `object`                         | 设备发现和设置界面可在不加载插件运行时的情况下检查的轻量级设置 / 新手引导描述符。                                                                                             |
| `qaRunners`                         | 否       | `object[]`                       | 共享 `openclaw qa` 主机在插件运行时加载前使用的轻量级 QA 运行器描述符。                                                                                                               |
| `contracts`                         | 否       | `object`                         | 用于语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web 抓取、web 搜索和工具归属的静态内置能力快照。 |
| `channelConfigs`                    | 否       | `Record<string, object>`         | 由清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和验证界面中。                                                                                                   |
| `skills`                            | 否       | `string[]`                       | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                      |
| `name`                              | 否       | `string`                         | 人类可读的插件名称。                                                                                                                                                                                  |
| `description`                       | 否       | `string`                         | 显示在插件界面中的简短摘要。                                                                                                                                                                      |
| `version`                           | 否       | `string`                         | 信息性插件版本。                                                                                                                                                                                |
| `uiHints`                           | 否       | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                            |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在 provider 运行时加载前读取这些内容。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | 是      | `string`                                        | 此选项所属的 provider id。                                                                      |
| `method`              | 是      | `string`                                        | 要分派到的认证方法 id。                                                                           |
| `choiceId`            | 是      | `string`                                        | 新手引导和 CLI 流程使用的稳定认证选项 id。                                                  |
| `choiceLabel`         | 否       | `string`                                        | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。                                        |
| `choiceHint`          | 否       | `string`                                        | 选择器的简短辅助说明文本。                                                                        |
| `assistantPriority`   | 否       | `number`                                        | 在由智能体驱动的交互式选择器中，值越小排序越靠前。                                       |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                  | 在智能体选择器中隐藏该选项，同时仍允许手动 CLI 选择。                        |
| `deprecatedChoiceIds` | 否       | `string[]`                                      | 应将用户重定向到此替代选项的旧版选项 id。                                 |
| `groupId`             | 否       | `string`                                        | 用于对相关选项分组的可选分组 id。                                                          |
| `groupLabel`          | 否       | `string`                                        | 该分组的面向用户标签。                                                                        |
| `groupHint`           | 否       | `string`                                        | 该分组的简短辅助说明文本。                                                                         |
| `optionKey`           | 否       | `string`                                        | 用于简单单标志认证流程的内部选项键。                                                      |
| `cliFlag`             | 否       | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                           |
| `cliOption`           | 否       | `string`                                        | 完整 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                             |
| `cliDescription`      | 否       | `string`                                        | CLI 帮助中使用的说明。                                                                            |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation">` | 此选项应出现于哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有一个运行时命令名称，而用户可能会误将其放入 `plugins.allow`，或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据在不导入插件运行时代码的情况下提供诊断信息。

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
| `name`       | 是      | `string`          | 属于此插件的命令名称。                               |
| `kind`       | 否       | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。 |
| `cliCommand` | 否       | `string`          | 若存在，用于 CLI 操作时建议的相关根 CLI 命令。  |

## `activation` 参考

当插件可以低成本声明哪些控制平面事件应在之后激活它时，请使用 `activation`。

## `qaRunners` 参考

当插件在共享的 `openclaw qa` 根命令下贡献一个或多个传输运行器时，请使用 `qaRunners`。请保持这些元数据轻量且静态；实际 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 接口负责。

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
| `commandName` | 是      | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。    |
| `description` | 否       | `string` | 当共享主机需要一个存根命令时使用的后备帮助文本。 |

此代码块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方将其作为在更广泛插件加载前进行收窄判断的提示，因此缺少激活元数据通常只会带来性能成本；在旧版清单归属回退仍存在的情况下，它不应改变正确性。

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
| ---------------- | -------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | 否       | `string[]`                                           | 请求这些 provider id 时，应激活此插件。     |
| `onCommands`     | 否       | `string[]`                                           | 应激活此插件的命令 id。                     |
| `onChannels`     | 否       | `string[]`                                           | 应激活此插件的渠道 id。                     |
| `onRoutes`       | 否       | `string[]`                                           | 应激活此插件的路由类型。                     |
| `onCapabilities` | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。 |

当前的实际使用方：

- 由命令触发的 CLI 规划会回退到旧版的
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 当缺少显式的渠道激活元数据时，由渠道触发的设置 / 渠道规划会回退到旧版 `channels[]`
  归属信息
- 当缺少显式的 provider 激活元数据时，由 provider 触发的设置 / 运行时规划会回退到旧版
  `providers[]` 和顶层 `cliBackends[]` 归属信息

## `setup` 参考

当设置和新手引导界面在运行时加载前需要轻量级的插件自有元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面 / 设置流程的、仅包含元数据的设置专用描述符界面。

如果存在，`setup.providers` 和 `setup.cliBackends` 是设置发现时首选的“描述符优先”查找界面。如果该描述符只能缩小候选插件范围，而设置仍需要更丰富的设置期运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为后备执行路径。

由于设置查找可能会执行插件自有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在已发现插件之间必须保持唯一。归属不明确时会采用封闭失败策略，而不是按发现顺序选择一个结果。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | 是      | `string`   | 在设置或新手引导期间暴露的 provider id。请保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否       | `string[]` | 此 provider 在无需加载完整运行时的情况下支持的设置 / 认证方法 id。           |
| `envVars`     | 否       | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。   |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 否       | `object[]` | 在设置和新手引导期间暴露的 provider 设置描述符。                                     |
| `cliBackends`      | 否       | `string[]` | 用于“描述符优先”设置查找的设置期后端 id。请保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否       | `string[]` | 由此插件设置界面拥有的配置迁移 id。                                          |
| `requiresRuntime`  | 否       | `boolean`  | 描述符查找之后，设置是否仍需要执行 `setup-api`。                            |

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
| `label`       | `string`   | 面向用户的字段标签。                |
| `help`        | `string`   | 简短辅助说明文本。                      |
| `tags`        | `string[]` | 可选的 UI 标签。                       |
| `advanced`    | `boolean`  | 将该字段标记为高级项。            |
| `sensitive`   | `boolean`  | 将该字段标记为机密或敏感项。 |
| `placeholder` | `string`   | 表单输入的占位文本。       |

## `contracts` 参考

仅在 OpenClaw 可以在不导入插件运行时的情况下读取静态能力归属元数据时使用 `contracts`。

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
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
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | 此插件拥有的语音 provider id。                          |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录 provider id。          |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音 provider id。                  |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解 provider id。             |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成 provider id。                |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成 provider id。                |
| `webFetchProviders`              | `string[]` | 此插件拥有的 Web 抓取 provider id。                       |
| `webSearchProviders`             | `string[]` | 此插件拥有的 Web 搜索 provider id。                      |
| `tools`                          | `string[]` | 此插件拥有的智能体工具名称，用于内置契约检查。 |

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
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供此字段。         |
| `uiHints`     | `Record<string, object>` | 该渠道配置部分的可选 UI 标签 / 占位符 / 敏感性提示。          |
| `label`       | `string`                 | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string`                 | 用于检查和目录界面的简短渠道描述。                               |
| `preferOver`  | `string[]`               | 在选择界面中，此渠道应优先于的旧版或低优先级插件 id。    |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据简写模型 id（如 `gpt-5.4` 或 `claude-sonnet-4.6`）推断你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用使用所属的 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 剩余的歧义会被忽略，直到用户或配置指定 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 对简写模型 id 使用 `startsWith` 进行匹配的前缀。                 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

旧版顶层能力字段已弃用。请使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；普通清单加载不再将这些顶层字段视为能力归属信息。

## 清单与 `package.json` 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置验证、认证选项元数据，以及插件代码运行前必须存在的 UI 提示 |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 配置块 |

如果你不确定某段元数据该放在哪里，请遵循这条规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，请将其放入 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，请将其放入 `package.json`

### 影响设备发现的 `package.json` 字段

有些运行时前插件元数据有意放在 `package.json` 的 `openclaw` 配置块中，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 声明原生插件入口点。必须保留在插件包目录内。                                                                                                   |
| `openclaw.runtimeExtensions`                                      | 为已安装包声明已构建的 JavaScript 运行时入口点。必须保留在插件包目录内。                                                                 |
| `openclaw.setupEntry`                                             | 在新手引导、延迟渠道启动和只读渠道状态 / SecretRef 发现期间使用的轻量级仅设置入口点。必须保留在插件包目录内。 |
| `openclaw.runtimeSetupEntry`                                      | 为已安装包声明已构建的 JavaScript 设置入口点。必须保留在插件包目录内。                                                                |
| `openclaw.channel`                                                | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择说明文案。                                                                                                 |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅依赖环境变量的设置？”。                                         |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何账号完成登录？”。                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 内置和外部发布插件的安装 / 更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | 当存在多个安装来源时的首选安装路径。                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | 支持的最低 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                     | 当配置无效时，允许一个范围很窄的内置插件重新安装恢复路径。                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置用的渠道界面，再加载完整渠道插件。                                                                                                 |

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；在较旧主机上，较新但有效的值会导致跳过该插件。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账号时，渠道插件应提供 `openclaw.setupEntry`。该设置入口应暴露渠道元数据，以及设置安全的配置、状态和密钥适配器；请将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让一个逃逸包目录的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的适用范围被刻意限制得很窄。它不会让任意损坏的配置变得可安装。当前它只允许安装流程从某些特定的过时内置插件升级失败中恢复，例如缺失的内置插件路径，或同一个内置插件中遗留的 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并引导操作人员运行 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个用于微型检查模块的包元数据：

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前进行轻量级的是 / 否认证探测时，请使用它。目标导出应是一个仅仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 采用相同结构，用于轻量级仅环境变量的已配置检查：

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

当渠道可以根据环境变量或其他很小的非运行时输入回答已配置状态时，请使用它。如果检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复的插件 id）

OpenClaw 会从多个根路径发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两个发现结果共享相同的 `id`，则只会保留**优先级最高**的清单；较低优先级的重复项会被丢弃，而不是与其并行加载。

优先级从高到低：

1. **配置选定** —— 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** —— 随 OpenClaw 一起发布的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响：

- 工作区中某个内置插件的分叉版本或过时副本，不会覆盖内置构建版本。
- 如果你确实想用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，让它依靠优先级获胜，而不是依赖工作区发现。
- 被丢弃的重复项会被记录到日志中，这样 Doctor 和启动诊断就可以指出被丢弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 Schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读取 / 写入时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 已由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 属于**错误**。
- 如果某个插件已安装，但其清单或 Schema 缺失或损坏，验证会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件处于**禁用**状态，则配置会被保留，并在 Doctor + 日志中显示**警告**。

有关完整的 `plugins.*` Schema，请参阅[配置参考](/zh-CN/gateway/configuration)。

## 说明

- 清单对于**原生 OpenClaw 插件**是**必需的**，包括从本地文件系统加载的插件。
- 运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此支持注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取有文档说明的清单字段。避免在此添加自定义顶层键。
- `providerAuthEnvVars` 是用于认证探测、环境变量标记验证以及类似 provider 认证界面的轻量级元数据路径，这些场景不应仅为了检查环境变量名而启动插件运行时。
- `providerAuthAliases` 允许 provider 变体复用另一个 provider 的认证环境变量、认证配置文件、基于配置的认证以及 API 密钥新手引导选项，而无需在核心中硬编码这种关系。
- `providerEndpoints` 允许 provider 插件拥有简单的端点 host/baseUrl 匹配元数据。仅将其用于核心已支持的端点类别；运行时行为仍由插件负责。
- `syntheticAuthRefs` 是用于 provider 自有 synthetic auth hook 的轻量级元数据路径，这些 hook 必须在运行时注册表存在之前，对冷模型发现可见。只列出那些其运行时 provider 或 CLI 后端实际实现了 `resolveSyntheticAuth` 的引用。
- `nonSecretAuthMarkers` 是用于内置插件自有占位 API 密钥的轻量级元数据路径，例如本地、OAuth 或环境凭证标记。核心会将这些视为非机密内容，用于认证显示和密钥审计，而无需硬编码所属 provider。
- `channelEnvVars` 是用于 shell 环境变量回退、设置提示以及类似渠道界面的轻量级元数据路径，这些场景不应仅为了检查环境变量名而启动插件运行时。环境变量名只是元数据，本身并不会触发激活：状态、审计、cron 投递验证以及其他只读界面，在将某个环境变量视为已配置渠道前，仍会应用插件信任和有效激活策略。
- `providerAuthChoices` 是用于认证选项选择器、`--auth-choice` 解析、首选 provider 映射以及在 provider 运行时加载前进行简单新手引导 CLI 标志注册的轻量级元数据路径。有关需要 provider 代码的运行时向导元数据，请参阅
  [provider 运行时 hook](/zh-CN/plugins/architecture#provider-runtime-hooks)。
- 排他性插件类型通过 `plugins.slots.*` 进行选择。
  - `kind: "memory"` 由 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 由 `plugins.slots.contextEngine`
    选择（默认：内置 `legacy`）。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) —— 插件快速开始
- [插件架构](/zh-CN/plugins/architecture) —— 内部架构
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) —— 插件 SDK 参考
