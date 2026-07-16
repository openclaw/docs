---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布插件配置架构或调试插件验证错误
summary: 插件清单 + JSON Schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-07-16T11:42:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

本页介绍 **OpenClaw 原生插件清单** `openclaw.plugin.json`。有关兼容的 bundle 布局（Codex、Claude、Cursor），请参阅[插件 bundle](/zh-CN/plugins/bundles)。

兼容的 bundle 格式改用各自的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或者使用不含清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 会自动检测这些布局，但不会依据下方的 `openclaw.plugin.json` schema 对其进行验证。对于兼容的 bundle，当布局符合 OpenClaw 的运行时预期时，OpenClaw 会读取 bundle 元数据、声明的技能根目录、Claude 命令根目录、Claude `settings.json` 默认值、Claude LSP 默认值以及受支持的钩子包。

每个 OpenClaw 原生插件都**必须**在**插件根目录**中提供 `openclaw.plugin.json`。OpenClaw 会读取它，以便**在不执行插件代码的情况下**验证配置。清单缺失或无效会阻止配置验证，并被视为插件错误。

有关完整的插件系统指南，请参阅[插件](/zh-CN/tools/plugin)；有关原生能力模型和当前的外部兼容性指南，请参阅[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。其中的所有内容都必须足够轻量，无需启动插件运行时即可检查。

**用于：**

- 插件标识、配置验证和配置 UI 提示
- 身份验证、新手引导和设置元数据（别名、自动启用、提供商环境变量、身份验证选项）
- 控制平面界面的激活提示
- 模型系列简写形式的所有权
- 静态能力所有权快照（`contracts`）
- 共享 `openclaw qa` 主机可以检查的 QA 运行器元数据
- 合并到目录和验证界面的渠道特定配置元数据

**不要用于：**注册运行时行为、声明代码入口点或指定 npm 安装元数据。这些内容应放在插件代码和 `package.json` 中。

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
  "description": "OpenRouter 提供商插件",
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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

| 字段                                 | 必填     | 类型                         | 含义                                                                                                                                                                                                                                                               |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                     | 规范插件 ID。这是在 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                                                        |
| `configSchema`                       | 是       | `object`                     | 此插件配置的内联 JSON Schema。                                                                                                                                                                                                                               |
| `requiresPlugins`                    | 否       | `string[]`                   | 此插件要生效还必须安装的插件 ID。即使缺少任何必需插件，发现机制仍会保持该插件可加载，但会发出警告。                                                                                                               |
| `enabledByDefault`                   | 否       | `true`                       | 将内置插件标记为默认启用。省略此项或设置任何非 `true` 值，可使插件保持默认禁用。                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 将内置插件标记为仅在所列 Node.js 平台上默认启用，例如 `["darwin"]`。显式配置仍具有优先权。                                                                                                                                   |
| `legacyPluginIds`                    | 否       | `string[]`                   | 会规范化为此规范插件 ID 的旧版 ID。                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 当身份验证、配置或模型引用提及这些提供商 ID 时，应自动启用此插件。                                                                                                                                                                            |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 声明 `plugins.slots.*` 使用的一种或多种互斥插件类型（`"memory"`、`"context-engine"`）。同时拥有两个槽位的插件会在一个数组中声明这两种类型。                                                                                                    |
| `channels`                           | 否       | `string[]`                   | 此插件拥有的渠道 ID。用于发现和配置验证。                                                                                                                                                                                                |
| `providers`                          | 否       | `string[]`                   | 此插件拥有的提供商 ID。                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | 否       | `string`                     | 相对于插件根目录的轻量级提供商目录模块路径，用于清单范围内的提供商目录元数据，无需激活完整插件运行时即可加载。                                                                                        |
| `modelSupport`                       | 否       | `object`                     | 清单拥有的简写模型系列元数据，用于在运行时之前自动加载插件。                                                                                                                                                                                |
| `modelCatalog`                       | 否       | `object`                     | 此插件所拥有提供商的声明式模型目录元数据。这是未来在不加载插件运行时的情况下实现只读列表、新手引导、模型选择器、别名和抑制功能的控制平面契约。                                                |
| `modelPricing`                       | 否       | `object`                     | 提供商拥有的外部定价查询策略。使用它可让本地/自托管提供商退出远程定价目录，或将提供商引用映射到 OpenRouter/LiteLLM 目录 ID，而无需在核心中硬编码提供商 ID。                                                    |
| `modelIdNormalization`               | 否       | `object`                     | 必须在提供商运行时加载前执行的、由提供商拥有的模型 ID 别名/前缀清理。                                                                                                                                                                                  |
| `providerEndpoints`                  | 否       | `object[]`                   | 清单拥有的端点主机/baseUrl 元数据，用于核心必须在提供商运行时加载前分类的提供商路由。                                                                                                                                                   |
| `providerRequest`                    | 否       | `object`                     | 通用请求策略在提供商运行时加载前使用的低成本提供商系列和请求兼容性元数据。                                                                                                                                                     |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 声明式 SecretRef Exec 提供商预设，设置或安装界面可以提供这些预设，而无需在核心中硬编码提供商特定的集成。                                                                                                                            |
| `cliBackends`                        | 否       | `string[]`                   | 此插件拥有的 CLI 推理后端 ID。用于根据显式配置引用在启动时自动激活。                                                                                                                                                                |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 在运行时加载前进行冷模型发现时，应探测其插件自有合成身份验证钩子的提供商或 CLI 后端引用。                                                                                                                                     |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | 内置插件拥有的占位 API 密钥值，表示非机密的本地、OAuth 或环境凭据状态。                                                                                                                                                       |
| `commandAliases`                     | 否       | `object[]`                   | 此插件拥有的命令名称，应在运行时加载前生成可感知插件的配置和 CLI 诊断。                                                                                                                                                       |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`   | 用于提供商身份验证/状态查询的已弃用兼容环境变量元数据。新插件应优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期内仍会读取此项。                                                                                        |
| `providerUsageAuthEnvVars`           | 否       | `Record<string, string[]>`   | 仅用于用量/计费的提供商凭据。OpenClaw 使用这些名称进行用量发现和机密信息清理，但绝不会将其用于推理身份验证。                                                                                                                                  |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 身份验证查询时应复用另一个提供商 ID 的提供商 ID，例如共享基础提供商 API 密钥和身份验证配置文件的编码提供商。                                                                                                                 |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`   | OpenClaw 无需加载插件代码即可检查的低成本渠道环境变量元数据。用于通用启动/配置辅助工具应能看到的、由环境变量驱动的渠道设置或身份验证界面。                                                                                   |
| `providerAuthChoices`                | 否       | `object[]`                   | 用于新手引导选择器、首选提供商解析和简单 CLI 标志接线的低成本身份验证选项元数据。                                                                                                                                                              |
| `activation`                         | 否       | `object`                     | 用于启动、提供商、命令、渠道、路由和能力触发加载的低成本激活规划器元数据。仅限元数据；实际行为仍由插件运行时拥有。                                                                                              |
| `setup`                              | 否       | `object`                     | 发现和设置界面无需加载插件运行时即可检查的低成本设置/新手引导描述符。                                                                                                                                                           |
| `qaRunners`                          | 否       | `object[]`                   | 共享 `openclaw qa` 主机在插件运行时加载前使用的低成本 QA 运行器描述符。                                                                                                                                                                             |
| `contracts`                          | 否       | `object`                     | 外部身份验证钩子、嵌入、语音、实时转录、实时语音、媒体理解、图像/视频/音乐生成、Web 获取、Web 搜索、工作节点提供商、文档/Web 内容提取和工具所有权的静态能力所有权快照。 |
| `configContracts`                    | 否       | `object`                     | 由清单负责、供通用核心辅助函数使用的配置行为：危险标志检测、SecretRef 迁移目标和旧版配置路径收窄。请参阅 [configContracts 参考](#configcontracts-reference)。                                                     |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 为 `contracts.mediaUnderstandingProviders` 中声明的提供商 ID 提供低成本的媒体理解默认值。                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 为 `contracts.imageGenerationProviders` 中声明的提供商 ID 提供低成本的图像生成身份验证元数据，包括由提供商负责的身份验证别名和基础 URL 防护。                                                                                                         |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 为 `contracts.videoGenerationProviders` 中声明的提供商 ID 提供低成本的视频生成身份验证元数据，包括由提供商负责的身份验证别名和基础 URL 防护。                                                                                                         |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 为 `contracts.musicGenerationProviders` 中声明的提供商 ID 提供低成本的音乐生成身份验证元数据，包括由提供商负责的身份验证别名和基础 URL 防护。                                                                                                         |
| `toolMetadata`                       | 否       | `Record<string, object>`     | 为 `contracts.tools` 中声明的插件自有工具提供低成本的可用性元数据。当工具仅应在存在配置、环境变量或身份验证凭据时加载运行时时，请使用此元数据。                                                                                                  |
| `channelConfigs`                     | 否       | `Record<string, object>`     | 由清单负责的渠道配置元数据，在加载运行时之前合并到发现和验证界面中。                                                                                                                                                                 |
| `skills`                             | 否       | `string[]`                   | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                                                                                    |
| `name`                               | 否       | `string`                     | 易于理解的插件名称。                                                                                                                                                                                                                                                |
| `description`                        | 否       | `string`                     | 插件界面中显示的简短摘要。                                                                                                                                                                                                                                    |
| `catalog`                            | 否       | `object`                     | 插件目录界面的可选呈现提示。此元数据不会安装、启用插件，也不会授予插件信任。                                                                                                                                               |
| `icon`                               | 否       | `string`                     | 用于市场/目录卡片的 HTTPS 图像 URL。ClawHub 接受任何有效的 `https://` URL；如果省略此项或其无效，则回退到默认插件图标。                                                                                                         |
| `version`                            | 否       | `string`                     | 仅供参考的插件版本。                                                                                                                                                                                                                                              |
| `uiHints`                            | 否       | `Record<string, object>`     | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                                                          |

## 目录参考

`catalog` 为插件浏览器提供可选的显示提示。宿主可以忽略这些提示。它们绝不会安装或启用插件，也不会改变插件的运行时行为或信任级别。

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| 字段      | 类型      | 含义                                                              |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | 目录界面是否应重点展示此插件。                       |
| `order`    | `number`  | 精选插件中的升序显示提示；值越小，显示越靠前。 |

## 生成提供商元数据参考

生成提供商元数据字段描述匹配的 `contracts.*GenerationProviders` 列表中所声明提供商的静态身份验证信号。OpenClaw 会在提供商运行时加载前读取这些字段，以便核心工具无需导入每个提供商插件，即可判断生成提供商是否可用。

这些字段仅用于低成本的声明式事实。传输、请求转换、令牌刷新、凭据验证和实际生成行为仍由插件运行时负责。

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

每个元数据条目支持：

| 字段                  | 必需 | 类型       | 含义                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | 否       | `string[]` | 应计为该生成提供商静态身份验证别名的其他提供商 ID。                                                       |
| `authProviders`        | 否       | `string[]` | 其已配置身份验证配置文件应计为该生成提供商身份验证的提供商 ID。                                                      |
| `configSignals`        | 否       | `object[]` | 面向无需身份验证配置文件或环境变量即可配置的本地或自托管提供商的低成本、仅配置可用性信号。                 |
| `authSignals`          | 否       | `object[]` | 显式身份验证信号。如果存在，它们会替代来自提供商 ID、`aliases` 和 `authProviders` 的默认信号集。                     |
| `referenceAudioInputs` | 否       | `boolean`  | 仅用于视频生成。当提供商接受参考音频资源时设为 `true`；否则，`video_generate` 会隐藏音频参考参数。 |

每个 `configSignals` 条目支持：

| 字段            | 必需 | 类型       | 含义                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是      | `string`   | 要检查的插件自有配置对象的点分路径，例如 `plugins.entries.example.config`。                                                                                      |
| `overlayPath`    | 否       | `string`   | 根配置内部的点分路径，在评估信号前，该路径对应的对象应覆盖根对象。用于 `image`、`video` 或 `music` 等能力特定配置。   |
| `overlayMapPath` | 否       | `string`   | 根配置内部的点分路径，该路径对应对象中的每个值都应分别覆盖根对象。用于 `accounts` 等命名账户映射，其中任意已配置账户均应满足条件。 |
| `required`       | 否       | `string[]` | 有效配置内部必须具有已配置值的点分路径。字符串必须非空；对象和数组不得为空。                                                  |
| `requiredAny`    | 否       | `string[]` | 有效配置内部的点分路径，其中至少一个必须具有已配置值。                                                                                                    |
| `mode`           | 否       | `object`   | 有效配置内部的可选字符串模式守卫。当仅有一种模式适用仅配置可用性时使用。                                                                  |

每个 `mode` 守卫支持：

| 字段        | 必需 | 类型       | 含义                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | 否       | `string`   | 有效配置内部的点分路径。默认为 `mode`。                          |
| `default`    | 否       | `string`   | 配置省略该路径时使用的模式值。                                  |
| `allowed`    | 否       | `string[]` | 如果存在，仅当有效模式为这些值之一时，信号才通过。 |
| `disallowed` | 否       | `string[]` | 如果存在，当有效模式为这些值之一时，信号失败。       |

每个 `authSignals` 条目支持：

| 字段             | 必需 | 类型     | 含义                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是      | `string` | 要在已配置身份验证配置文件中检查的提供商 ID。                                                                                                                             |
| `providerBaseUrl` | 否       | `object` | 可选守卫，仅当引用的已配置提供商使用允许的基础 URL 时，才会计入该信号。用于身份验证别名仅对特定 API 有效的情况。 |

每个 `providerBaseUrl` 守卫支持：

| 字段             | 必需 | 类型       | 含义                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是      | `string`   | 应检查其 `baseUrl` 的提供商配置 ID。                                                                                                |
| `defaultBaseUrl`  | 否       | `string`   | 提供商配置省略 `baseUrl` 时采用的基础 URL。                                                                                         |
| `allowedBaseUrls` | 是      | `string[]` | 此身份验证信号允许的基础 URL。当已配置或默认基础 URL 与这些规范化值均不匹配时，将忽略该信号。 |

## 工具元数据参考

`toolMetadata` 使用与生成提供商元数据相同的 `configSignals` 和 `authSignals` 结构，并以工具名称为键。`contracts.tools` 声明所有权。`toolMetadata` 声明低成本可用性证据，使 OpenClaw 无需仅为让工具工厂返回 `null` 而导入插件运行时。

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

除上述共享的 `configSignals`/`authSignals` 字段外，`toolMetadata` 条目还接受 `optional`（将工具标记为非插件激活必需）和 `replaySafe`（将工具执行标记为可在不完整的模型轮次后安全重复）。

如果工具没有 `toolMetadata`，OpenClaw 会保留现有行为，并在工具契约符合策略时加载其所属插件。对于工厂依赖身份验证或配置的热路径工具，插件作者应声明 `toolMetadata`，而不是让核心导入运行时进行询问。

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一种新手引导或身份验证选项。OpenClaw 会在提供商运行时加载前读取此信息。提供商设置列表会使用这些清单选项、由描述符派生的设置选项以及安装目录元数据，而无需加载提供商运行时。

| 字段                  | 必填 | 类型                                                                  | 含义                                                                                                          |
| --------------------- | ---- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                                              | 此选项所属的提供商 ID。                                                                                       |
| `method`              | 是   | `string`                                                              | 要分派到的身份验证方法 ID。                                                                                   |
| `choiceId`            | 是   | `string`                                                              | 新手引导和 CLI 流程使用的稳定身份验证选项 ID。                                                               |
| `choiceLabel`         | 否   | `string`                                                              | 面向用户的标签。如果省略，OpenClaw 将回退到 `choiceId`。                                             |
| `choiceHint`          | 否   | `string`                                                              | 供选择器使用的简短辅助文本。                                                                                 |
| `assistantPriority`   | 否   | `number`                                                              | 在智能体驱动的交互式选择器中，值越小排序越靠前。                                                             |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                                        | 在智能体选择器中隐藏此选项，同时仍允许通过 CLI 手动选择。                                                    |
| `deprecatedChoiceIds` | 否   | `string[]`                                                            | 应将用户重定向到此替代选项的旧选项 ID。                                                                      |
| `groupId`             | 否   | `string`                                                              | 用于将相关选项分组的可选组 ID。                                                                               |
| `groupLabel`          | 否   | `string`                                                              | 该组面向用户的标签。                                                                                          |
| `groupHint`           | 否   | `string`                                                              | 该组的简短辅助文本。                                                                                          |
| `onboardingFeatured`  | 否   | `boolean`                                                             | 在交互式新手引导选择器的精选层级中显示此组，位于“More...”条目之前。                                          |
| `optionKey`           | 否   | `string`                                                              | 用于简单单标志身份验证流程的内部选项键。                                                                      |
| `cliFlag`             | 否   | `string`                                                              | CLI 标志名称，例如 `--openrouter-api-key`。                                                                      |
| `cliOption`           | 否   | `string`                                                              | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                                               |
| `cliDescription`      | 否   | `string`                                                              | CLI 帮助中使用的说明。                                                                                        |
| `appGuidedSecret`     | 否   | `boolean`                                                             | 粘贴一个密钥并采用提供商默认值，即足以完成应用引导式设置。                                                   |
| `appGuidedDiscovery`  | 否   | `boolean`                                                             | 匹配的运行时身份验证方法通过 `appGuidedSetup` 负责只读的本地发现。                                         |
| `appGuidedAuth`       | 否   | `"oauth"` \| `"device-code"`                                          | 由提供商负责、原生设置客户端可通用呈现的交互式登录。                                                         |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，则默认为 `["text-inference"]`。                                    |

当 `appGuidedDiscovery` 为 true 时，匹配的提供商身份验证方法必须公开
`appGuidedSetup.detect` 和 `appGuidedSetup.prepare`。检测必须是
只读的：不得登录、拉取模型、下载或写入配置。准备过程会重新检查
所选的确切模型并返回配置提案；OpenClaw 会隔离地对该
提案进行实时测试，并且仅在成功后提交。

## commandAliases 参考

当插件拥有一个运行时命令名称，而用户可能误将其放入 `plugins.allow` 或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据进行诊断，无需导入插件运行时代码。

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

| 字段         | 必填 | 类型              | 含义                                                                 |
| ------------ | ---- | ----------------- | -------------------------------------------------------------------- |
| `name`       | 是   | `string`          | 属于此插件的命令名称。                                               |
| `kind`       | 否   | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。                      |
| `cliCommand` | 否   | `string`          | 如果存在，用于建议执行 CLI 操作的相关根 CLI 命令。                   |

## activation 参考

当插件可以低成本声明哪些控制平面事件应将其纳入激活/加载计划时，请使用 `activation`。

此块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会取代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段来缩小候选插件范围，然后才会回退到现有的插件清单所有权元数据，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。

优先使用已经描述所有权的最精确元数据。当 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 能表达这种关系时，请使用这些字段。对于这些所有权字段无法表示的额外规划器提示，请使用 `activation`。对于 `claude-cli`、`my-cli` 或 `google-gemini-cli` 等 CLI 运行时别名，请使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅用于尚无所有权字段的嵌入式 Agent harness ID。

每个插件都应有意设置 `activation.onStartup`。仅当插件必须在 Gateway 网关启动期间运行时，才将其设为 `true`。当插件在启动时处于惰性状态，并且只应通过更精确的触发条件加载时，将其设为 `false`。省略 `onStartup` 不再会隐式地在启动时加载插件；请使用显式激活元数据来指定启动、渠道、配置、Agent harness、记忆或其他更精确的激活触发条件。

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 字段               | 必填 | 类型                                                 | 含义                                                                                                                                                                                           |
| ------------------ | ---- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 显式 Gateway 网关启动激活。每个插件都应设置此项。`true` 会在启动期间导入插件；`false` 会使其保持启动时惰性，除非其他匹配的触发条件要求加载。 |
| `onProviders`      | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的提供商 ID。                                                                                                                                                        |
| `onAgentHarnesses` | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的嵌入式 Agent harness 运行时 ID。CLI 后端别名请使用顶层 `cliBackends`。                                                                                         |
| `onCommands`       | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的命令 ID。                                                                                                                                                          |
| `onChannels`       | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的渠道 ID。                                                                                                                                                          |
| `onRoutes`         | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的路由种类。                                                                                                                                                         |
| `onConfigPaths`    | 否   | `string[]`                                           | 当路径存在且未被显式禁用时，应将此插件纳入启动/加载计划的根目录相对配置路径。                                                                                                                    |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。应尽可能优先使用更精确的字段。                                                                                                                              |

当前实时使用方：

- Gateway 网关启动规划使用 `activation.onStartup` 进行显式启动导入。
- 命令触发的 CLI 规划会回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- Agent 运行时启动规划对嵌入式 harness 使用 `activation.onAgentHarnesses`，对 CLI 运行时别名使用顶层 `cliBackends[]`。
- 当缺少显式渠道激活元数据时，渠道触发的设置/渠道规划会回退到旧版 `channels[]` 所有权。
- 启动插件规划对非渠道根配置表面使用 `activation.onConfigPaths`，例如内置浏览器插件的 `browser` 块。
- 当缺少显式提供商激活元数据时，提供商触发的设置/运行时规划会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 所有权。

规划器诊断可以区分显式激活提示和清单所有权回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 所有权。这些原因标签用于宿主诊断和测试；插件作者应继续声明最准确描述所有权的元数据。

## qaRunners 参考

当插件在共享 `openclaw qa` 根下提供一个或多个传输运行器时，请使用 `qaRunners`。此元数据应保持轻量且静态；插件
运行时仍通过轻量级 `runtime-api.ts` 表面负责实际的 CLI 注册，该表面导出匹配的 `qaRunnerCliRegistrations`。可选的
`adapterFactory` 可将传输公开给共享 QA 场景，而不更改已注册命令的运行器。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "针对一次性 homeserver 运行由 Docker 支持的 Matrix 实时 QA 通道"
    }
  ]
}
```

| 字段         | 必需 | 类型     | 含义                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是      | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。    |
| `description` | 否       | `string` | 共享宿主需要占位命令时使用的回退帮助文本。 |

`adapterFactory` id 必须与 `commandName` 匹配。不要为清单中不存在的命令导出注册项。

## setup 参考

当设置和新手引导表面需要在运行时加载之前获取轻量的插件自有元数据时，请使用 `setup`。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "OpenAI 本地凭据"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面/设置流程的设置专用描述符表面，应仅包含元数据。

如果存在，`setup.providers` 和 `setup.cliBackends` 是设置发现首选的描述符优先查找表面。如果描述符仅缩小候选插件范围，而设置仍需要更丰富的设置时运行时钩子，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会在通用提供商身份验证和环境变量查找中包含 `setup.providers[].envVars`。在弃用期内，`providerAuthEnvVars` 仍通过兼容适配器受到支持，但仍使用它的非内置插件会收到清单诊断。新插件应将设置/状态环境元数据放在 `setup.providers[].envVars` 上。

当计费或组织级凭据必须激活 `resolveUsageAuth`、但不能成为推理凭据时，请使用 `providerUsageAuthEnvVars`。这些名称会加入工作区 dotenv 阻止列表、ACP 子进程剥离、沙箱密钥过滤和广泛的密钥清理。提供商运行时仍在 `resolveUsageAuth` 中读取并分类该值。

当没有设置条目，或者 `setup.requiresRuntime: false` 声明不需要设置运行时时，OpenClaw 还可以从 `setup.providers[].authMethods` 派生简单的设置选项。对于自定义标签、CLI 标志、新手引导范围和助手元数据，仍优先使用显式 `providerAuthChoices` 条目。

仅当这些描述符足以支持设置表面时，才设置 `requiresRuntime: false`。OpenClaw 将显式 `false` 视为仅描述符契约，并且不会执行 `setup-api` 或 `openclaw.setupEntry` 进行设置查找。如果仅描述符插件仍提供其中一个设置运行时条目，OpenClaw 会报告附加诊断并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，因此已添加描述符但未添加该标志的现有插件不会中断。

由于设置查找可以执行插件自有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在已发现插件中保持唯一。所有权不明确时会采用故障关闭，而不是根据发现顺序选择胜者。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的提供商或 CLI 后端，或者描述符没有匹配的运行时注册项，设置注册表诊断会报告描述符偏差。这些诊断是附加性的，不会拒绝旧版插件。

### setup.providers 参考

| 字段          | 必需 | 类型       | 含义                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | 是      | `string`   | 在设置或新手引导期间公开的提供商 id。规范化后的 id 必须保持全局唯一。             |
| `authMethods`  | 否       | `string[]` | 此提供商无需加载完整运行时即可支持的设置/身份验证方法 id。                       |
| `envVars`      | 否       | `string[]` | 通用设置/状态表面可在插件运行时加载之前检查的环境变量。               |
| `authEvidence` | 否       | `object[]` | 针对可通过非密钥标记进行身份验证的提供商的轻量本地身份验证证据检查。 |

`authEvidence` 用于无需加载运行时代码即可验证的提供商自有本地凭据标记。这些检查必须保持轻量且仅限本地：不得调用网络、读取钥匙串或密钥管理器、执行 shell 命令，也不得探测提供商 API。

支持的证据条目：

| 字段              | 必需 | 类型       | 含义                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | 是      | `string`   | 当前为 `local-file-with-env`。                                                                               |
| `fileEnvVar`       | 否       | `string`   | 包含显式凭据文件路径的环境变量。                                                           |
| `fallbackPaths`    | 否       | `string[]` | 当 `fileEnvVar` 不存在或为空时检查的本地凭据文件路径。支持 `${HOME}` 和 `${APPDATA}`。 |
| `requiresAnyEnv`   | 否       | `string[]` | 证据有效前，列出的环境变量中必须至少有一个非空。                                    |
| `requiresAllEnv`   | 否       | `string[]` | 证据有效前，列出的每个环境变量都必须非空。                                           |
| `credentialMarker` | 是      | `string`   | 存在证据时返回的非密钥标记。                                                       |
| `source`           | 否       | `string`   | 用于身份验证/状态输出的面向用户的来源标签。                                                               |

### setup 字段

| 字段              | 必需 | 类型       | 含义                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 否       | `object[]` | 在设置和新手引导期间公开的提供商设置描述符。                                     |
| `cliBackends`      | 否       | `string[]` | 用于描述符优先设置查找的设置时后端 id。规范化后的 id 必须保持全局唯一。 |
| `configMigrations` | 否       | `string[]` | 此插件设置表面拥有的配置迁移 id。                                          |
| `requiresRuntime`  | 否       | `boolean`  | 描述符查找后，设置是否仍需要执行 `setup-api`。                            |

## uiHints 参考

`uiHints` 是从配置字段名称到小型渲染提示的映射。键可以使用点表示嵌套配置字段，但任何路径段都不得为 `__proto__`、`constructor` 或 `prototype`；设置会拒绝这些名称。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API 密钥",
      "help": "用于 OpenRouter 请求",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每个字段提示可包含：

| 字段         | 类型       | 含义                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 面向用户的字段标签。                |
| `help`        | `string`   | 简短的辅助文本。                      |
| `tags`        | `string[]` | 可选的 UI 标签。                       |
| `advanced`    | `boolean`  | 将字段标记为高级。            |
| `sensitive`   | `boolean`  | 将字段标记为密钥或敏感信息。 |
| `placeholder` | `string`   | 表单输入的占位符文本。       |

## contracts 参考

仅将 `contracts` 用于 OpenClaw 无需导入插件运行时即可读取的静态能力所有权元数据。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段                            | 类型       | 含义                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 扩展工厂 ID，目前为 `codex-app-server`。                                                                |
| `agentToolResultMiddleware`      | `string[]` | 此插件可为其注册工具结果中间件的运行时 ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | 已安装插件可注册的插件本地可信工具前策略 ID。内置插件无需此字段即可注册策略。 |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部身份验证配置文件钩子的提供商 ID。                                                                      |
| `embeddingProviders`             | `string[]` | 此插件拥有的通用嵌入提供商 ID，用于可复用的向量嵌入，包括记忆。                                 |
| `speechProviders`                | `string[]` | 此插件拥有的语音提供商 ID。                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 ID。                                                                                |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音提供商 ID。                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的已弃用记忆专用嵌入提供商 ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解提供商 ID。                                                                                   |
| `transcriptSourceProviders`      | `string[]` | 此插件拥有的转录文本来源提供商 ID。                                                                                     |
| `documentExtractors`             | `string[]` | 此插件拥有的文档（例如 PDF）提取器提供商 ID。                                                                  |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成提供商 ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成提供商 ID。                                                                                      |
| `musicGenerationProviders`       | `string[]` | 此插件拥有的音乐生成提供商 ID。                                                                                      |
| `webContentExtractors`           | `string[]` | 此插件拥有的网页内容提取提供商 ID。                                                                           |
| `webFetchProviders`              | `string[]` | 此插件拥有的 Web 获取提供商 ID。                                                                                             |
| `webSearchProviders`             | `string[]` | 此插件拥有的 Web 搜索提供商 ID。                                                                                            |
| `workerProviders`                | `string[]` | 此插件拥有的云端工作节点提供商 ID，用于预配和由配置文件支持的租约生命周期。                                      |
| `usageProviders`                 | `string[]` | 此插件拥有其用量身份验证和用量快照钩子的提供商 ID。                                                             |
| `migrationProviders`             | `string[]` | 此插件为 `openclaw migrate` 拥有的导入提供商 ID。                                                                         |
| `gatewayMethodDispatch`          | `string[]` | 为经过身份验证的插件 HTTP 路由保留的授权，这些路由在进程内分派 Gateway 网关方法。                                  |
| `tools`                          | `string[]` | 此插件拥有的 Agent 工具名称。                                                                                                   |

`contracts.embeddedExtensionFactories` 保留用于内置的仅限 Codex app-server 的扩展工厂。内置工具结果转换应改为声明 `contracts.agentToolResultMiddleware`，并使用 `api.registerAgentToolResultMiddleware(...)` 注册。只有在明确启用时，已安装插件才能使用相同的中间件接缝，并且仅可用于它们在 `contracts.agentToolResultMiddleware` 中声明的运行时。

需要主机可信工具前策略层级的已安装插件，必须在 `contracts.trustedToolPolicies` 中声明每个已注册的本地 ID，并且必须被明确启用。内置插件继续使用现有的可信策略路径，但策略 ID 未声明的已安装插件会在注册前被拒绝。策略 ID 的作用域限定于注册它的插件，因此两个插件都可以声明并注册 `workflow-budget`；单个插件不得重复注册同一个本地 ID。

运行时 `api.registerTool(...)` 注册必须与 `contracts.tools` 匹配。工具发现使用此列表，仅加载能够拥有所请求工具的插件运行时。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`；未声明的外部身份验证钩子会被忽略。

同时实现 `resolveUsageAuth` 和 `fetchUsageSnapshot` 的提供商插件，应在 `contracts.usageProviders` 中声明每个自动发现的提供商 ID。用量发现会在加载运行时代码前读取此契约，然后仅加载已声明的所有者，并在加载后验证这两个钩子。

通用嵌入提供商应为使用 `api.registerEmbeddingProvider(...)` 注册的每个适配器声明 `contracts.embeddingProviders`。可复用的向量生成应使用通用契约，包括供记忆搜索使用的提供商。`contracts.memoryEmbeddingProviders` 是已弃用的记忆专用兼容机制，仅在现有提供商迁移到通用嵌入提供商接缝期间保留。

工作节点提供商必须在 `contracts.workerProviders` 中声明每个 `api.registerWorkerProvider(...)` ID。核心在调用 `provision` 前持久化长期意图；提供商在外部分配前验证其设置，并且使用相同操作 ID 的重复调用必须采用同一个租约。核心还会持久化该已验证的设置快照，并将其与 `leaseId` 一起传递给 `inspect({ leaseId, profile })` 和 `destroy({ leaseId, profile })`，即使具名配置文件随后被更改或移除也是如此。销毁操作具有幂等性，检查操作返回封闭的 `active` / `destroyed` / `unknown` 状态联合类型，并且 SSH 私钥材料仅通过 `SecretRef` 引用。预配的 SSH 端点还必须包含来自可信预配输出的公共 `hostKey`，其格式必须恰好为 `algorithm base64`，不得包含主机名或注释，以便核心在连接前固定主机。生成动态身份引用的提供商可以实现权威的 `resolveSshIdentity({ leaseId, profile, keyRef })`；未实现它的提供商使用核心的通用密钥解析器。权威的 `unknown` 会将活动的本地记录标记为孤立；在销毁请求持久化后，它用于确认拆除完成。

`contracts.gatewayMethodDispatch` 当前接受 `"authenticated-request"`。它是一个 API 规范性门控，用于有意在进程内分派 Gateway 网关控制平面方法的原生插件 HTTP 路由，而不是防范恶意原生插件的沙箱。仅将其用于经过严格审查、并且已经要求 Gateway 网关 HTTP 身份验证的内置或操作员界面。只有当获得授权的路由同时声明 `auth: "gateway"` 和路由专用的 `gatewayRuntimeScopeSurface: "trusted-operator"` 时，它才能在 Gateway 网关根工作准入关闭期间继续访问；同一插件的普通同级路由仍受准入边界限制。这样可以在不向整个插件授予准入绕过权限的情况下，保持暂停状态查询和恢复操作可用。分派之外的解析和响应塑形应保持有限；实质性或变更性工作必须通过 Gateway 网关方法分派执行，由该分派负责准入和权限范围执行。

## configContracts 参考

对于通用核心辅助程序所需、且无需导入插件运行时的清单自有配置行为，请使用 `configContracts`：危险标志检测、SecretRef 迁移目标和旧版配置路径范围收窄。

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| 字段                         | 是否必需 | 类型       | 含义                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 否       | `string[]` | 表明此插件的设置时兼容性迁移可能适用的根相对配置路径。当配置从未引用该插件时，使通用运行时配置读取能够跳过该插件的所有设置界面。                 |
| `compatibilityRuntimePaths`   | 否       | `string[]` | 在插件代码完全激活前，此插件可在运行时处理的根相对兼容性路径。用于应在不导入每个兼容插件运行时的情况下缩小内置候选集范围的旧版界面。 |
| `dangerousFlags`              | 否       | `object[]` | 启用时，`openclaw doctor` 应标记为不安全或危险的配置字面值。见下文。                                                                                                                                   |
| `secretInputs`                | 否       | `object`   | `plugins.entries.<id>.config` 下的配置路径，SecretRef 迁移/审计目标注册表应将其视为密钥形态的字符串。见下文。                                                                                  |

每个 `dangerousFlags` 条目支持：

| 字段    | 是否必需 | 类型                                  | 含义                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | 是      | `string`                              | 相对于 `plugins.entries.<id>.config`、以点分隔的配置路径。支持将 `*` 通配符用于映射/数组段。 |
| `equals` | 是      | `string \| number \| boolean \| null` | 将此配置值标记为危险的精确字面值。                                                            |

`secretInputs` 支持：

| 字段                   | 必需 | 类型       | 含义                                                                                                                                                                                                   |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 否       | `boolean`  | 在确定此 SecretRef 界面是否处于活动状态时，覆盖内置插件的默认启用状态。当插件为内置插件，但应在配置中明确启用之前保持此界面不活动时，请使用此项。 |
| `paths`                 | 是      | `object[]` | 机密形式的配置路径，每个路径都包含 `path`（以点分隔，相对于 `plugins.entries.<id>.config`，支持 `*` 通配符），还可包含 `expected`（目前仅支持 `"string"`）。                            |

## mediaUnderstandingProviderMetadata 参考

当媒体理解提供商具有默认模型、自动身份验证回退优先级或通用核心辅助程序在运行时加载前所需的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。键还必须在 `contracts.mediaUnderstandingProviders` 中声明。

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

每个提供商条目可以包含：

| 字段                  | 类型                                                             | 含义                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此提供商公开的媒体能力。                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | 配置未指定模型时使用的能力到模型默认映射。                                         |
| `autoPriority`         | `Record<string, number>`                                         | 在基于凭据的自动提供商回退排序中，数值越小越靠前。                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 提供商支持的原生文档输入。                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 按文档类型设置的模型覆盖。将 `image: false` 设为禁用该文档类型的基于图像提取。 |

## channelConfigs 参考

当渠道插件需要在运行时加载前获取轻量级配置元数据时，请使用 `channelConfigs`。如果没有可用的设置条目，或者 `setup.requiresRuntime: false` 声明不需要设置运行时，则只读渠道设置/状态发现可以直接对已配置的外部渠道使用此元数据。

`channelConfigs` 是插件清单元数据，而不是新的顶层用户配置部分。用户仍在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 会读取清单元数据，以便在插件运行时代码执行前确定哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述不同的路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明 `channels[]` 的非内置插件还应声明匹配的 `channelConfigs` 条目。如果没有这些条目，OpenClaw 仍可加载该插件，但在插件运行时执行之前，冷路径配置架构、设置和 Control UI 界面无法获知该渠道自有选项的结构。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以为渠道运行时加载前执行的命令配置检查声明静态 `auto` 默认值。内置渠道还可以通过 `package.json#openclaw.channel.commands` 发布相同的默认值，并与其包自有的其他渠道目录元数据放在一起。

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
          "label": "主服务器 URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix 主服务器连接",
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

| 字段         | 类型                     | 含义                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目均必需。         |
| `uiHints`     | `Record<string, object>` | 该渠道配置部分可选的 UI 标签、占位符和敏感信息提示。          |
| `label`       | `string`                 | 运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string`                 | 用于检查和目录界面的简短渠道描述。                               |
| `commands`    | `object`                 | 用于运行时前配置检查的静态原生命令和原生技能自动默认值。       |
| `preferOver`  | `string[]`               | 此渠道在选择界面中应优先于的旧版或较低优先级插件 ID。    |

### 替换另一个渠道插件

当你的插件是某个渠道 ID 的首选所有者，而另一个插件也可以提供该渠道时，请使用 `preferOver`。常见情况包括插件 ID 已重命名、独立插件取代内置插件，或者维护中的分支为了配置兼容性而保留相同的渠道 ID。

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

配置 `channels.chat` 后，OpenClaw 会同时考虑渠道 ID 和首选插件 ID。如果较低优先级插件仅因其为内置插件或默认启用而被选中，OpenClaw 会在有效运行时配置中将其禁用，从而由一个插件拥有该渠道及其工具。用户的明确选择仍然优先：如果用户明确启用两个插件（通过 `plugins.allow` 或实质性的 `plugins.entries` 配置），OpenClaw 会保留该选择，并报告渠道/工具重复诊断，而不是静默更改请求的插件集合。

请将 `preferOver` 限定为确实能够提供同一渠道的插件 ID。它不是通用优先级字段，也不会重命名用户配置键。

## modelSupport 参考

如果 OpenClaw 应在插件运行时加载前，根据 `gpt-5.6-sol` 或 `claude-sonnet-4.6` 等简写模型 ID 推断你的提供商插件，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用以下优先级：

- 显式 `provider/model` 引用使用所属 `providers` 的清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件均匹配，则非内置插件优先
- 其余歧义将被忽略，直到用户或配置指定提供商

字段：

| 字段           | 类型       | 含义                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 ID 匹配的前缀。                 |
| `modelPatterns` | `string[]` | 移除配置文件后缀后，与简写模型 ID 匹配的正则表达式源。 |

`modelPatterns` 条目通过 `compileSafeRegex` 编译，该程序会拒绝包含嵌套重复的模式（例如 `(a+)+$`）。未通过安全检查的模式会被静默跳过，与语法无效的正则表达式相同。请保持模式简单，并避免嵌套量词。

## modelCatalog 参考

如果 OpenClaw 应在加载插件运行时前获知提供商模型元数据，请使用 `modelCatalog`。这是固定目录行、提供商别名、抑制规则和发现模式的清单自有来源。运行时刷新仍由提供商运行时代码负责，但清单会告知核心何时需要运行时。

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
        "reason": "Azure OpenAI Responses 上不可用"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

顶层字段：

| 字段            | 类型                                                     | 含义                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 此插件所拥有的提供商 ID 的目录行。键也应出现在顶层 `providers` 中。       |
| `aliases`        | `Record<string, object>`                                 | 在目录或抑制规划中应解析为所拥有提供商的提供商别名。              |
| `suppressions`   | `object[]`                                               | 来自其他来源、此插件因提供商特定原因而抑制的模型行。                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供商目录是否可从清单元数据读取、可刷新到缓存中，或需要运行时。 |
| `runtimeAugment` | `boolean`                                                | 仅当提供商运行时必须在清单/配置规划后追加目录行时，才设为 `true`。       |

`aliases` 参与模型目录规划中的提供商所有权查找。别名目标必须是同一插件所拥有的顶层提供商。当按提供商筛选的列表使用别名时，OpenClaw 无需加载提供商运行时，即可读取所有者清单并应用别名 API/基础 URL 覆盖。别名不会扩展未筛选的目录列表；宽泛列表仅输出所有者的规范提供商行。

`suppressions` 取代旧的提供商运行时 `suppressBuiltInModel` 钩子。仅当提供商归该插件所有，或声明为指向所拥有提供商的 `modelCatalog.aliases` 键时，抑制条目才会生效。模型解析期间不再调用运行时抑制钩子。

提供商字段：

| 字段                 | 类型                     | 含义                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | 此提供商目录中模型的可选默认基础 URL。                                                                                                                                                    |
| `api`                 | `ModelApi`               | 此提供商目录中模型的可选默认 API 适配器。                                                                                                                                                 |
| `headers`             | `Record<string, string>` | 应用于此提供商目录的可选静态标头。                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | 提供商建议用于简短内部实用任务（标题、进度叙述）的可选小模型 ID。当 `agents.defaults.utilityModel` 未设置且此提供商为智能体的主模型提供服务时使用。 |
| `models`              | `object[]`               | 必需的模型行。没有 `id` 的行将被忽略。                                                                                                                                                            |

模型字段：

| 字段              | 类型                                                           | 含义                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 提供商本地模型 ID，不含 `provider/` 前缀。                    |
| `name`             | `string`                                                       | 可选显示名称。                                                      |
| `api`              | `ModelApi`                                                     | 可选的单模型 API 覆盖。                                            |
| `baseUrl`          | `string`                                                       | 可选的单模型基础 URL 覆盖。                                       |
| `headers`          | `Record<string, string>`                                       | 可选的单模型静态标头。                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模态。其他值会被静默丢弃。            |
| `reasoning`        | `boolean`                                                      | 模型是否提供推理行为。                               |
| `contextWindow`    | `number`                                                       | 提供商原生上下文窗口。                                             |
| `contextTokens`    | `number`                                                       | 与 `contextWindow` 不同时的可选有效运行时上下文上限。 |
| `maxTokens`        | `number`                                                       | 已知时的最大输出 token 数。                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 可选的按思考级别设置的模型 ID 或参数覆盖。                    |
| `cost`             | `object`                                                       | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat`           | `object`                                                       | 与 OpenClaw 模型配置兼容性相匹配的可选兼容性标志。  |
| `mediaInput`       | `object`                                                       | 可选的按模态输入配置，目前仅支持图像。                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅当该行完全不应出现时才抑制。          |
| `statusReason`     | `string`                                                       | 随非可用状态显示的可选原因。                            |
| `replaces`         | `string[]`                                                     | 此模型所取代的旧提供商本地模型 ID。                       |
| `replacedBy`       | `string`                                                       | 已弃用行的替代提供商本地模型 ID。                    |
| `tags`             | `string[]`                                                     | 选择器和筛选器使用的稳定标签。                                    |

抑制字段：

| 字段                      | 类型       | 含义                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游行的提供商 ID。必须归此插件所有，或声明为所拥有的别名。 |
| `model`                    | `string`   | 要抑制的提供商本地模型 ID。                                                                      |
| `reason`                   | `string`   | 直接请求被抑制行时显示的可选消息。                                     |
| `when.baseUrlHosts`        | `string[]` | 应用抑制前所需的有效提供商基础 URL 主机可选列表。               |
| `when.providerConfigApiIn` | `string[]` | 应用抑制前所需的提供商配置 `api` 精确值可选列表。              |

不要在 `modelCatalog` 中放置仅限运行时的数据。仅当清单行足够完整，使按提供商筛选的列表和选择器界面可以跳过注册表/运行时发现时，才使用 `static`。当清单行是有用的可列出种子或补充内容，但刷新/缓存稍后可以添加更多行时，使用 `refreshable`；可刷新行本身并非权威数据。当 OpenClaw 必须加载提供商运行时才能获知列表时，使用 `runtime`。

## modelIdNormalization 参考

对于必须在提供商运行时加载前执行的低成本、由提供商所有的模型 ID 清理，请使用 `modelIdNormalization`。这样可将短模型名称、提供商本地旧版 ID 和代理前缀规则等别名保留在所有者插件清单中，而不是放入核心模型选择表。

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

| 字段                                | 类型                    | 含义                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不区分大小写的精确模型 ID 别名。值将按原样返回。                  |
| `stripPrefixes`                      | `string[]`              | 在别名查找前移除的前缀，适用于旧版提供商/模型重复情况。     |
| `prefixWhenBare`                     | `string`                | 当规范化模型 ID 尚未包含 `/` 时添加的前缀。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 别名查找后应用的条件式裸 ID 前缀规则，以 `modelPrefix` 和 `prefix` 为键。 |

## providerEndpoints 参考

对于通用请求策略必须在提供商运行时加载前获知的端点分类，请使用 `providerEndpoints`。核心仍负责定义每个 `endpointClass` 的含义；插件清单负责主机和基础 URL 元数据。

正式外置的提供商插件被排除在核心发行版之外，因此
它们的清单在安装之前不可见。其 `providerEndpoints`
还必须镜像到 `scripts/lib/official-external-provider-catalog.json` 中，以便
在没有插件的情况下端点分类仍可正常工作；契约测试会
强制执行此镜像要求。

端点字段：

| 字段                          | 类型       | 含义                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端点类别，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 映射到该端点类别的确切主机名。                                                |
| `hostSuffixes`                 | `string[]` | 映射到该端点类别的主机后缀。为 `.` 添加前缀可仅匹配域名后缀。 |
| `baseUrls`                     | `string[]` | 映射到该端点类别的确切规范化 HTTP(S) 基础 URL。                             |
| `googleVertexRegion`           | `string`   | 用于确切全局主机的静态 Google Vertex 区域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 从匹配主机中移除的后缀，用于提取 Google Vertex 区域前缀。                 |

## providerRequest 参考

当通用请求策略需要廉价的请求兼容性元数据，同时又不加载提供商运行时，请使用 `providerRequest`。特定于行为的载荷重写应保留在提供商运行时钩子或共享的提供商系列辅助程序中。

```json
{
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

| 字段                 | 类型         | 含义                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用请求兼容性决策和诊断使用的提供商系列标签。 |
| `compatibilityFamily` | `"moonshot"` | 用于共享请求辅助程序的可选提供商系列兼容性分组。              |
| `openAICompletions`   | `object`     | OpenAI 兼容的补全请求标志，目前为 `supportsStreamingUsage`。       |

## secretProviderIntegrations 参考

当插件可以发布可复用的 SecretRef Exec 提供商预设时，请使用 `secretProviderIntegrations`。OpenClaw 会在插件运行时加载前读取此元数据，将插件所有权存储在 `secrets.providers.<alias>.pluginIntegration` 中，并将实际的密钥解析交给 SecretRef 运行时。仅为内置插件以及从托管插件安装根目录发现的已安装插件（例如通过 git 和 ClawHub 安装的插件）提供预设。

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

映射键是集成 ID。如果省略 `providerAlias`，OpenClaw 会将集成 ID 用作 SecretRef 提供商别名。提供商别名必须符合常规的 SecretRef 提供商别名模式，例如 `team-secrets` 或 `onepassword-work`。

当操作员选择该预设时，OpenClaw 会写入如下提供商引用：

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

在启动或重新加载时，OpenClaw 会通过加载当前插件清单元数据、检查所属插件是否已安装且处于活动状态，并根据清单具体化 Exec 命令来解析该提供商。禁用或移除插件会撤销活动 SecretRef 使用的该提供商。需要独立 Exec 配置的操作员仍可直接手动编写 `command`/`args` 提供商。

目前仅支持 `source: "exec"` 预设。`command` 必须为 `${node}`，且 `args[0]` 必须为插件根目录相对路径下的 `./` 解析器脚本。OpenClaw 会在启动或重新加载时，将其具体化为当前 Node 可执行文件以及插件内脚本的绝对路径。`--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print` 等 Node 选项不属于清单预设契约。需要非 Node 命令的操作员可以直接配置独立的手动 Exec 提供商。

对于清单预设，OpenClaw 根据插件根目录派生 `trustedDirs`；对于 `${node}` 预设，还会根据当前 Node 可执行文件目录派生该值。清单中编写的 `trustedDirs` 会被忽略。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath` 等其他 Exec 提供商选项会原样传递到常规 SecretRef Exec 提供商配置。

## modelPricing 参考

当提供商需要在运行时加载前控制控制平面定价行为时，请使用 `modelPricing`。Gateway 网关定价缓存无需导入提供商运行时代码即可读取此元数据。

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

| 字段        | 类型              | 含义                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 对于绝不应获取 OpenRouter 或 LiteLLM 定价的本地/自托管提供商，将其设置为 `false`。 |
| `openRouter` | `false \| object` | OpenRouter 定价查询映射。`false` 会禁用此提供商的 OpenRouter 查询。           |
| `liteLLM`    | `false \| object` | LiteLLM 定价查询映射。`false` 会禁用此提供商的 LiteLLM 查询。                 |

来源字段：

| 字段                      | 类型               | 含义                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 当外部目录提供商 ID 与 OpenClaw 提供商 ID 不同时使用的外部目录提供商 ID，例如 `zai` 提供商对应的 `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | 将包含斜杠的模型 ID 视为嵌套的提供商/模型引用，适用于 OpenRouter 等代理提供商。       |
| `modelIdTransforms`        | `"version-dots"[]` | 额外的外部目录模型 ID 变体。`version-dots` 会尝试 `claude-opus-4.6` 之类的点分版本 ID。            |

### OpenClaw 提供商索引

OpenClaw 提供商索引是由 OpenClaw 所有的预览元数据，用于插件可能尚未安装的提供商。它不属于插件清单。插件清单仍是已安装插件的权威来源。提供商索引是一项内部回退契约，当提供商插件尚未安装时，未来的可安装提供商界面和安装前模型选择器界面将使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单 `modelCatalog`。
3. 通过显式刷新生成的模型目录缓存。
4. OpenClaw 提供商索引预览行。

提供商索引不得包含密钥、启用状态、运行时钩子或特定于实时账户的模型数据。其预览目录使用与插件清单相同的 `modelCatalog` 提供商行结构，但应仅限于稳定的显示元数据，除非有意让 `api`、`baseUrl`、定价或兼容性标志等运行时适配器字段与已安装插件清单保持一致。具有实时 `/models` 发现功能的提供商应通过显式模型目录缓存路径写入刷新后的行，而不应让常规列表或新手引导调用提供商 API。

对于插件已移出核心或尚未安装的提供商，提供商索引条目也可以携带可安装插件元数据。此元数据沿用渠道目录模式：包名、npm 安装规范、预期完整性以及简单的身份验证选项标签，足以显示可安装的设置选项。插件安装后，其清单优先，并且会忽略该提供商的提供商索引条目。

`openclaw doctor --fix` 会将一小组封闭的旧版顶层清单能力键迁移到 `contracts.*` 中：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。这些字段（或任何其他能力列表）均不再作为顶层清单字段读取；常规清单加载仅在 `contracts` 下识别它们。

## 清单与 package.json

这两个文件承担不同的职责：

| 文件                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 在插件代码运行前必须存在的发现、配置验证、身份验证选项元数据和 UI 提示                         |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装限制、设置或目录元数据的 `openclaw` 块 |

如果不确定某项元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前获知该元数据，请将其放入 `openclaw.plugin.json`
- 如果它涉及打包、入口文件或 npm 安装行为，请将其放入 `package.json`

### 影响发现的 package.json 字段

有些运行前插件元数据有意放在 `package.json` 的 `openclaw` 块下，而不是 `openclaw.plugin.json` 中。`openclaw.bundle` 和 `openclaw.bundle.json` 并非 OpenClaw 插件契约；Native Codex plugins 必须使用 `openclaw.plugin.json` 以及下方受支持的 `package.json#openclaw` 字段。

重要示例：

| 字段                                                                                      | 含义                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 声明原生插件入口点。必须位于插件包目录内。                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | 声明已安装包构建后的 JavaScript 运行时入口点。必须位于插件包目录内。                                                                 |
| `openclaw.setupEntry`                                                                      | 仅用于设置的轻量入口点，在新手引导、延迟渠道启动以及只读渠道状态/SecretRef 发现期间使用。必须位于插件包目录内。 |
| `openclaw.runtimeSetupEntry`                                                               | 声明已安装包构建后的 JavaScript 设置入口点。需要 `setupEntry`，必须存在，并且必须位于插件包目录内。                         |
| `openclaw.channel`                                                                         | 低开销的渠道目录元数据，例如标签、文档路径、别名和选项文案。                                                                                                 |
| `openclaw.channel.commands`                                                                | 在渠道运行时加载前，由配置、审计和命令列表界面使用的静态原生命令及原生技能自动默认元数据。                                          |
| `openclaw.channel.configuredState`                                                         | 轻量的已配置状态检查器元数据，无需加载完整渠道运行时即可回答“是否已存在仅使用环境变量的设置？”。                                         |
| `openclaw.channel.persistedAuthState`                                                      | 轻量的持久化身份验证检查器元数据，无需加载完整渠道运行时即可回答“是否已有任何登录状态？”。                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置插件和外部发布插件的安装/更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | 有多个安装来源可用时的首选安装路径。                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | 支持的最低 OpenClaw 主机版本，使用类似 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                                             |
| `openclaw.compat.pluginApi`                                                                | 此包所需的最低 OpenClaw 插件 API 版本范围，使用类似 `>=2026.5.27` 的 semver 下限。                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会据此验证获取的工件。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 配置无效时，允许使用范围受限的内置插件重装恢复路径。                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | 当 npm 包别名的 lockfile 平台约束与当前主机匹配时，这些别名必须实际安装。                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 允许设置运行时的渠道界面在开始监听前加载，然后将完整的已配置渠道插件延迟到监听后的激活阶段。                                                 |

清单元数据决定运行时加载前新手引导中显示哪些提供商/渠道/设置选项。`package.json#openclaw.install` 告知新手引导，当用户选择其中一个选项时应如何获取或启用该插件。不要将安装提示移入 `openclaw.plugin.json`。

对于非内置插件来源，安装和清单注册表加载期间会强制执行 `openclaw.install.minHostVersion`。无效值会被拒绝；有效但较新的值会使较旧主机跳过外部插件。假定内置源码插件与主机检出版本一致。

`openclaw.install.requiredPlatformPackages` 适用于通过可选的特定平台别名提供必要原生二进制文件的 npm 包。为每个受支持的平台别名列出不带版本的 npm 包名。在 npm 安装期间，OpenClaw 仅验证 lockfile 约束与当前主机匹配的已声明别名。如果 npm 报告成功但遗漏该别名，OpenClaw 会使用全新缓存重试一次；如果仍缺少该别名，则回滚安装。

对于非内置插件来源，会在包安装期间强制执行 `openclaw.compat.pluginApi`。将其用于构建该包时所依据的 OpenClaw 插件 SDK/运行时 API 下限。当插件包需要更新的 API，但仍为其他流程保留较低的安装提示时，它可以比 `minHostVersion` 更严格。默认情况下，OpenClaw 官方版本同步会将现有官方插件的 API 下限提升到 OpenClaw 发布版本，但如果包有意支持较旧主机，仅发布插件的版本可以保留较低下限。不要仅将包版本用作兼容性契约。`peerDependencies.openclaw` 仍是 npm 包元数据；OpenClaw 使用 `openclaw.compat.pluginApi` 契约做出安装兼容性决策。

当插件发布在 ClawHub 上时，官方按需安装元数据应使用 `clawhubSpec`；新手引导会将其视为首选远程来源，并在安装后记录 ClawHub 工件信息。对于尚未迁移到 ClawHub 的包，`npmSpec` 仍是兼容性回退方案。

精确的 npm 版本固定已位于 `npmSpec` 中，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确规范与 `expectedIntegrity` 配对，以便获取的 npm 工件不再与固定版本匹配时，更新流程以失败关闭。为保持兼容性，交互式新手引导仍会提供可信注册表中的 npm 规范，包括不带版本的包名和 dist-tag。目录诊断可以区分精确来源、浮动来源、完整性固定来源、缺少完整性来源、包名不匹配来源和无效的默认选项来源。当存在 `expectedIntegrity` 但没有可供其固定的有效 npm 来源时，诊断也会发出警告。存在 `expectedIntegrity` 时，安装/更新流程会强制执行它；省略时，则记录注册表解析结果，但不固定完整性值。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。设置入口应公开渠道元数据以及可安全用于设置的配置、状态和机密信息适配器；网络客户端、Gateway 网关监听器和传输运行时应保留在主扩展入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 无法使越出包边界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的适用范围有意限定得很窄。它不会使任意损坏的配置变得可安装。目前，它仅允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺少内置插件路径，或同一内置插件存在陈旧的 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作员引导至 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是用于微型检查器模块的包元数据：

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

当设置、Doctor、状态或只读存在性流程需要在完整渠道插件加载前进行低开销的是/否身份验证探测时，请使用它。持久化身份验证状态不等于已配置渠道状态：不要使用此元数据自动启用插件、修复运行时依赖项或决定是否应加载渠道运行时。目标导出应是仅读取持久化状态的小型函数；不要通过完整渠道运行时 barrel 导出它。

`openclaw.channel.configuredState` 支持低开销的已配置状态检查。当环境变量足够时，优先使用声明式环境元数据：

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

当列出的每个变量都必需时使用 `env.allOf`；当任一非空变量即可满足要求时使用 `env.anyOf`。如果微型非运行时检查需要的信息超出环境元数据，请使用 `specifier` 和 `exportName`，如 `persistedAuthState` 所示；存在 `env` 时，OpenClaw 会直接使用它，而不加载该模块。如果检查需要完整配置解析或真实渠道运行时，请改为将该逻辑保留在插件的 `config.hasConfiguredState` 钩子中。

## 设备发现优先级（重复的插件 ID）

OpenClaw 从三个根目录发现插件，并按以下顺序检查：OpenClaw 随附的内置插件、全局安装根目录（`~/.openclaw/extensions`）和当前工作区根目录（`<workspace>/.openclaw/extensions`），此外还包括任何显式的 `plugins.load.paths` 条目。

如果两个发现结果具有相同的 `id`，则仅保留优先级**最高**的清单；优先级较低的重复项会被丢弃，而不会与其并列加载。优先级从高到低如下：

1. **配置选定** — 在 `plugins.entries.<id>` 中显式固定的路径
2. **与跟踪安装记录匹配的全局安装** — 通过 `openclaw plugin install`/`openclaw plugin update` 安装，且 OpenClaw 的安装跟踪将其识别为同一 ID 的插件，即使该 ID 也属于内置插件
3. **内置** — OpenClaw 随附的插件
4. **工作区** — 相对于当前工作区发现的插件
5. 任何其他发现的候选项

影响如下：

- 位于工作区或全局根目录中且未被跟踪的内置插件分叉副本或陈旧副本，不会遮蔽内置构建。
- 要覆盖内置插件，可以为该 ID 运行 `openclaw plugin install`，使被跟踪的全局安装优先于内置副本；也可以通过 `plugins.entries.<id>` 固定特定路径，使其凭借配置选定优先级胜出。
- 重复项丢弃事件会被记录到日志中，以便 Doctor 和启动诊断指出被丢弃的副本。
- 在诊断中，配置选定的重复项覆盖会被表述为显式覆盖，但仍会发出警告，以便陈旧分叉和意外遮蔽保持可见。

## JSON Schema 要求

- **每个插件都必须附带一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也可以接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在读取/写入配置时验证，而不是在运行时验证。
- 使用新配置键扩展或派生内置插件时，请同时更新该插件的 `openclaw.plugin.json` `configSchema`。内置插件的 schema 是严格的，因此，如果在用户配置中添加 `plugins.entries.<id>.config.myNewKey`，但未将 `myNewKey` 添加到 `configSchema.properties`，则会在插件运行时加载前被拒绝。

Schema 扩展示例：

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## 验证行为

- 未知的 `channels.*` 键属于**错误**，除非该渠道 ID 已由插件清单声明。如果同一 ID 也出现在 `plugins.allow`、`plugins.entries` 或 `plugins.installs` 中（即引用了某个当前无法发现的插件），OpenClaw 会将其降级为**警告**。
- 引用未知插件 ID 的 `plugins.entries.<id>`、`plugins.allow` 和 `plugins.deny` 属于**警告**（“已忽略过期的配置条目”），而不是错误，因此升级以及插件被移除或重命名不会阻止 Gateway 网关启动。
- 引用未知插件 ID 的 `plugins.slots.memory` 属于**错误**，但已知的 `memory-lancedb` 官方外部插件除外；对于该插件只会发出警告。
- 如果插件已安装，但其清单或 schema 损坏或缺失，验证将失败，并且 Doctor 会报告插件错误。
- 如果存在插件配置，但插件已被**禁用**，该配置会被保留，并在 Doctor 和日志中显示**警告**。

有关完整的 `plugins.*` schema，请参阅[配置参考](/zh-CN/gateway/configuration)。

## 注意事项

- 对于**原生 OpenClaw 插件**，清单是**必需的**，包括从本地文件系统加载的插件。运行时仍会单独加载插件模块；清单仅用于设备发现和验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍为对象，就可以使用注释、尾随逗号和不带引号的键。
- 清单加载器仅会读取文档中列出的清单字段。请避免使用自定义顶级键。
- 如果插件不需要，`channels`、`providers`、`cliBackends` 和 `skills` 均可省略。
- `providerCatalogEntry` 必须保持轻量，不应导入大范围的运行时代码；请将其用于静态提供商目录元数据或范围明确的发现描述符，而不是请求期间的执行。
- 互斥插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory` 选择（默认值为 `memory-core`），`kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认值为 `legacy`）。
- 请在此清单中声明互斥插件类型。运行时入口中的 `OpenClawPluginDefinition.kind` 已弃用，仅作为旧版插件的兼容性回退机制保留。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 以及 `channelEnvVars`）仅为声明性信息。在将环境变量视为已配置之前，状态、审计、cron 投递验证和其他只读界面仍会应用插件信任和实际激活策略。
- 对于需要提供商代码的运行时向导元数据，请参阅[提供商运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及所有软件包管理器白名单要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关内容

<CardGroup cols={3}>
  <Card title="Building Plugins" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件入门指南。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="插件 SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考和子路径导入。
  </Card>
</CardGroup>
