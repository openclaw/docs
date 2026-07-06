---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要交付插件配置模式，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-07-06T21:51:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 317fa77e9e760777a64daa183c72118b78a75a786ca1ca5f8a3fbf289cadff02
    source_path: plugins/manifest.md
    workflow: 16
---

本页介绍 **原生 OpenClaw 插件清单** `openclaw.plugin.json`。如需了解兼容的包布局（Codex、Claude、Cursor），请参阅 [插件包](/zh-CN/plugins/bundles)。

兼容包格式改用各自的清单文件：

- Codex 包：`.codex-plugin/plugin.json`
- Claude 包：`.claude-plugin/plugin.json`，或没有清单的默认 Claude 组件布局
- Cursor 包：`.cursor-plugin/plugin.json`

OpenClaw 会自动检测这些布局，但不会按下面的 `openclaw.plugin.json` 架构验证它们。对于兼容包，当布局符合 OpenClaw 的运行时预期时，OpenClaw 会读取包元数据、声明的 Skills 根目录、Claude 命令根目录、Claude `settings.json` 默认值、Claude LSP 默认值以及支持的钩子包。

每个原生 OpenClaw 插件都**必须**在**插件根目录**中随附 `openclaw.plugin.json`。OpenClaw 会读取它，以便在**不执行插件代码**的情况下验证配置。缺失或无效的清单会阻止配置验证，并被视为插件错误。

完整的插件系统指南请参阅 [插件](/zh-CN/tools/plugin)；原生能力模型和当前外部兼容性指南请参阅 [能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。其中的所有内容都必须足够轻量，可以在不启动插件运行时的情况下检查。

**用于：**

- 插件标识、配置验证和配置 UI 提示
- 凭证、新手引导和设置元数据（别名、自动启用、提供商环境变量、凭证选项）
- 控制平面表面的激活提示
- 模型系列所有权简写
- 静态能力所有权快照（`contracts`）
- 共享 `openclaw qa` 宿主可检查的 QA 运行器元数据
- 合并到目录和验证表面的渠道专属配置元数据

**不要用于：**注册运行时行为、声明代码入口点或 npm 安装元数据。这些属于你的插件代码和 `package.json`。

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

| 字段                                 | 必填     | 类型                         | 含义                                                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                     | 规范插件 id。这是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                                                                 |
| `configSchema`                       | 是       | `object`                     | 此插件配置的内联 JSON Schema。                                                                                                                                                                                                                          |
| `requiresPlugins`                    | 否       | `string[]`                   | 要让此插件生效，也必须安装的插件 id。设备发现会保持插件可加载，但在缺少任何必需插件时发出警告。                                                                                                                                                         |
| `enabledByDefault`                   | 否       | `true`                       | 将内置插件标记为默认启用。省略它，或设置任何非 `true` 值，都会让该插件默认保持禁用。                                                                                                                                                                    |
| `enabledByDefaultOnPlatforms`        | 否       | `string[]`                   | 仅在列出的 Node.js 平台上将内置插件标记为默认启用，例如 `["darwin"]`。显式配置仍然优先。                                                                                                                                                               |
| `legacyPluginIds`                    | 否       | `string[]`                   | 会规范化为此规范插件 id 的旧版 id。                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                   | 当凭证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。                                                                                                                                                                                          |
| `kind`                               | 否       | `PluginKind \| PluginKind[]` | 声明 `plugins.slots.*` 使用的一个或多个互斥插件类型（`"memory"`、`"context-engine"`）。同时拥有两个槽位的插件会在一个数组中声明这两个类型。                                                                                                            |
| `channels`                           | 否       | `string[]`                   | 此插件拥有的渠道 id。用于设备发现和配置验证。                                                                                                                                                                                                           |
| `providers`                          | 否       | `string[]`                   | 此插件拥有的提供商 id。                                                                                                                                                                                                                                 |
| `providerCatalogEntry`               | 否       | `string`                     | 轻量级提供商目录模块路径，相对于插件根目录，用于限定在插件清单范围内、无需激活完整插件运行时即可加载的提供商目录元数据。                                                                                                                               |
| `modelSupport`                       | 否       | `object`                     | 插件清单拥有的模型族简写元数据，用于在运行时之前自动加载插件。                                                                                                                                                                                          |
| `modelCatalog`                       | 否       | `object`                     | 此插件拥有的提供商的声明式模型目录元数据。这是未来只读列表、新手引导、模型选择器、别名和抑制功能在不加载插件运行时的情况下使用的控制平面契约。                                                                                                        |
| `modelPricing`                       | 否       | `object`                     | 提供商拥有的外部定价查询策略。使用它可让本地/自托管提供商退出远程定价目录，或将提供商引用映射到 OpenRouter/LiteLLM 目录 id，而无需在核心中硬编码提供商 id。                                                                                            |
| `modelIdNormalization`               | 否       | `object`                     | 提供商拥有的模型 id 别名/前缀清理，必须在提供商运行时加载之前运行。                                                                                                                                                                                     |
| `providerEndpoints`                  | 否       | `object[]`                   | 插件清单拥有的端点主机/baseUrl 元数据，用于核心在提供商运行时加载之前对提供商路由进行分类。                                                                                                                                                            |
| `providerRequest`                    | 否       | `object`                     | 泛用请求策略在提供商运行时加载之前使用的轻量级提供商族和请求兼容性元数据。                                                                                                                                                                              |
| `secretProviderIntegrations`         | 否       | `Record<string, object>`     | 声明式 SecretRef exec 提供商预设，设置或安装界面可以提供它们，而无需在核心中硬编码提供商特定集成。                                                                                                                                                      |
| `cliBackends`                        | 否       | `string[]`                   | 此插件拥有的 CLI 推理后端 id。用于从显式配置引用中进行启动时自动激活。                                                                                                                                                                                  |
| `syntheticAuthRefs`                  | 否       | `string[]`                   | 提供商或 CLI 后端引用，在运行时加载之前的冷模型发现期间，应探测其插件拥有的合成凭证钩子。                                                                                                                                                              |
| `nonSecretAuthMarkers`               | 否       | `string[]`                   | 内置插件拥有的占位 API key 值，表示非机密的本地、OAuth 或环境凭据状态。                                                                                                                                                                                 |
| `commandAliases`                     | 否       | `object[]`                   | 此插件拥有的命令名称，应在运行时加载之前生成感知插件的配置和 CLI 诊断。                                                                                                                                                                                 |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`   | 已弃用的兼容性环境变量元数据，用于提供商凭证/状态查询。新插件优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期间仍会读取此项。                                                                                                               |
| `providerUsageAuthEnvVars`           | 否       | `Record<string, string[]>`   | 仅用于用量/计费的提供商凭据。OpenClaw 使用这些名称进行用量发现和密钥清理，但绝不会用于推理凭证。                                                                                                                                                        |
| `providerAuthAliases`                | 否       | `Record<string, string>`     | 应复用另一个提供商 id 进行凭证查询的提供商 id，例如共享基础提供商 API key 和凭证配置的代码提供商。                                                                                                                                                      |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`   | OpenClaw 无需加载插件代码即可检查的轻量级渠道环境变量元数据。将它用于由环境变量驱动的渠道设置或凭证界面，供泛用启动/配置助手查看。                                                                                                                     |
| `providerAuthChoices`                | 否       | `object[]`                   | 面向新手引导选择器、首选提供商解析和简单 CLI 标志接线的轻量级凭证选项元数据。                                                                                                                                                                          |
| `activation`                         | 否       | `object`                     | 面向启动、提供商、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅限元数据；实际行为仍由插件运行时拥有。                                                                                                                                      |
| `setup`                              | 否       | `object`                     | 轻量级设置/新手引导描述符，供设备发现和设置界面在不加载插件运行时的情况下检查。                                                                                                                                                                        |
| `qaRunners`                          | 否       | `object[]`                   | 共享 `openclaw qa` 主机在插件运行时加载之前使用的轻量级 QA runner 描述符。                                                                                                                                                                              |
| `contracts`                          | 否       | `object`                     | 面向外部凭证钩子、嵌入、语音、实时转录、实时语音、媒体理解、图像/视频/音乐生成、Web 获取、Web 搜索、文档/Web 内容提取和工具所有权的静态能力所有权快照。                                                                                                |
| `configContracts`                    | 否       | `object`                     | 插件清单拥有的配置行为，供泛用核心助手使用：危险标志检测、SecretRef 迁移目标和旧版配置路径收窄。请参阅 [configContracts 参考](#configcontracts-reference)。                                                                                             |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`     | 针对 `contracts.mediaUnderstandingProviders` 中声明的提供商 id 的轻量级媒体理解默认值。                                                                                                                                                                 |
| `imageGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 为 `contracts.imageGenerationProviders` 中声明的提供商 ID 提供的低成本图像生成凭证元数据，包括提供商拥有的凭证别名和 base-url 保护。                                                                                       |
| `videoGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 为 `contracts.videoGenerationProviders` 中声明的提供商 ID 提供的低成本视频生成凭证元数据，包括提供商拥有的凭证别名和 base-url 保护。                                                                                       |
| `musicGenerationProviderMetadata`    | 否       | `Record<string, object>`     | 为 `contracts.musicGenerationProviders` 中声明的提供商 ID 提供的低成本音乐生成凭证元数据，包括提供商拥有的凭证别名和 base-url 保护。                                                                                       |
| `toolMetadata`                       | 否       | `Record<string, object>`     | 为 `contracts.tools` 中声明的插件拥有的工具提供的低成本可用性元数据。当工具不应加载运行时，除非存在配置、环境变量或凭证证据时使用它。                                                                                |
| `channelConfigs`                     | 否       | `Record<string, object>`     | 由清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和验证表面。                                                                                                                                               |
| `skills`                             | 否       | `string[]`                   | 要加载的 Skill 目录，相对于插件根目录。                                                                                                                                                                                                  |
| `name`                               | 否       | `string`                     | 人类可读的插件名称。                                                                                                                                                                                                                              |
| `description`                        | 否       | `string`                     | 插件表面中显示的简短摘要。                                                                                                                                                                                                                  |
| `icon`                               | 否       | `string`                     | 用于市场/目录卡片的 HTTPS 图像 URL。ClawHub 接受任何有效的 `https://` URL，并在省略或无效时回退到默认插件图标。                                                                                       |
| `version`                            | 否       | `string`                     | 信息性插件版本。                                                                                                                                                                                                                            |
| `uiHints`                            | 否       | `Record<string, object>`     | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                                        |

## 生成提供商元数据参考

生成提供商元数据字段描述在匹配的 `contracts.*GenerationProviders` 列表中声明的提供商的静态鉴权信号。OpenClaw 会在提供商运行时加载前读取这些字段，这样核心工具无需导入每个提供商插件就能判断某个生成提供商是否可用。

这些字段只用于成本低、声明式的事实。传输、请求转换、令牌刷新、凭证校验和实际生成行为都保留在插件运行时中。

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

| 字段                   | 必填 | 类型       | 含义                                                                                                                                       |
| ---------------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`              | 否   | `string[]` | 应计为该生成提供商静态鉴权别名的其他提供商 ID。                                                                                           |
| `authProviders`        | 否   | `string[]` | 其已配置鉴权配置文件应计为该生成提供商鉴权的提供商 ID。                                                                                   |
| `configSignals`        | 否   | `object[]` | 面向本地或自托管提供商的低成本纯配置可用性信号，这些提供商无需鉴权配置文件或环境变量即可配置。                                             |
| `authSignals`          | 否   | `object[]` | 显式鉴权信号。存在时，它们会替代来自提供商 ID、`aliases` 和 `authProviders` 的默认信号集。                                                   |
| `referenceAudioInputs` | 否   | `boolean`  | 仅限视频生成。当提供商接受参考音频资产时设为 `true`；否则 `video_generate` 会隐藏音频参考参数。                                             |

每个 `configSignals` 条目支持：

| 字段             | 必填 | 类型       | 含义                                                                                                                                                                             |
| ---------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | 是   | `string`   | 指向要检查的插件所有配置对象的点路径，例如 `plugins.entries.example.config`。                                                                                                    |
| `overlayPath`    | 否   | `string`   | 根配置内部的点路径；在评估信号前，该路径处的对象应覆盖根对象。用于能力专用配置，例如 `image`、`video` 或 `music`。                                                              |
| `overlayMapPath` | 否   | `string`   | 根配置内部的点路径；该路径处对象的每个对象值都应覆盖根对象。用于命名账号映射，例如 `accounts`，其中任何已配置账号都应符合条件。                                                |
| `required`       | 否   | `string[]` | 有效配置内部必须具有已配置值的点路径。字符串必须非空；对象和数组不得为空。                                                                                                      |
| `requiredAny`    | 否   | `string[]` | 有效配置内部的点路径，其中至少一个必须具有已配置值。                                                                                                                            |
| `mode`           | 否   | `object`   | 有效配置内部可选的字符串模式守卫。当纯配置可用性只适用于某一种模式时使用。                                                                                                      |

每个 `mode` 守卫支持：

| 字段         | 必填 | 类型       | 含义                                                                   |
| ------------ | ---- | ---------- | ---------------------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效配置内部的点路径。默认为 `mode`。                                  |
| `default`    | 否   | `string`   | 配置省略该路径时使用的模式值。                                         |
| `allowed`    | 否   | `string[]` | 如果存在，只有当有效模式是这些值之一时，信号才通过。                   |
| `disallowed` | 否   | `string[]` | 如果存在，当有效模式是这些值之一时，信号失败。                         |

每个 `authSignals` 条目支持：

| 字段              | 必填 | 类型     | 含义                                                                                                                                         |
| ----------------- | ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已配置鉴权配置文件中检查的提供商 ID。                                                                                                    |
| `providerBaseUrl` | 否   | `object` | 可选守卫，使信号只在被引用的已配置提供商使用允许的基础 URL 时计入。当某个鉴权别名只对特定 API 有效时使用。                                  |

每个 `providerBaseUrl` 守卫支持：

| 字段              | 必填 | 类型       | 含义                                                                                                                                    |
| ----------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 其 `baseUrl` 应被检查的提供商配置 ID。                                                                                                  |
| `defaultBaseUrl`  | 否   | `string`   | 当提供商配置省略 `baseUrl` 时假定的基础 URL。                                                                                           |
| `allowedBaseUrls` | 是   | `string[]` | 该鉴权信号允许的基础 URL。当已配置或默认基础 URL 与这些规范化值之一不匹配时，会忽略该信号。                                             |

## 工具元数据参考

`toolMetadata` 使用与生成提供商元数据相同的 `configSignals` 和 `authSignals` 形状，并按工具名称作为键。`contracts.tools` 声明所有权。`toolMetadata` 声明低成本可用性证据，使 OpenClaw 可以避免仅仅为了让工具工厂返回 `null` 而导入插件运行时。

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

除上面的共享 `configSignals`/`authSignals` 字段外，`toolMetadata` 条目还接受 `optional`（将工具标记为插件激活非必需）和 `replaySafe`（将工具执行标记为在不完整模型轮次后可安全重复）。

如果某个工具没有 `toolMetadata`，OpenClaw 会保留现有行为，并在工具契约匹配策略时加载拥有它的插件。对于工厂依赖鉴权/配置的热路径工具，插件作者应声明 `toolMetadata`，而不是让核心导入运行时来询问。

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个新手引导或鉴权选择。OpenClaw 会在提供商运行时加载前读取它。提供商设置列表会使用这些清单选择、从描述符派生的设置选择，以及安装目录元数据，而无需加载提供商运行时。

| 字段                  | 必需 | 类型                                                                  | 含义                                                                                                      |
| --------------------- | ---- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                                              | 此选择所属的提供商 id。                                                                                  |
| `method`              | 是   | `string`                                                              | 要分派到的凭证方法 id。                                                                                  |
| `choiceId`            | 是   | `string`                                                              | 新手引导和 CLI 流程使用的稳定凭证选择 id。                                                              |
| `choiceLabel`         | 否   | `string`                                                              | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。                                                 |
| `choiceHint`          | 否   | `string`                                                              | 选择器的简短辅助文本。                                                                                   |
| `assistantPriority`   | 否   | `number`                                                              | 值越低，在助手驱动的交互式选择器中排序越靠前。                                                          |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                                        | 从助手选择器中隐藏该选择，同时仍允许手动 CLI 选择。                                                      |
| `deprecatedChoiceIds` | 否   | `string[]`                                                            | 应将用户重定向到此替代选择的旧版选择 id。                                                               |
| `groupId`             | 否   | `string`                                                              | 用于分组相关选择的可选组 id。                                                                            |
| `groupLabel`          | 否   | `string`                                                              | 该组面向用户的标签。                                                                                     |
| `groupHint`           | 否   | `string`                                                              | 该组的简短辅助文本。                                                                                     |
| `onboardingFeatured`  | 否   | `boolean`                                                             | 在交互式新手引导选择器的精选层级中显示此组，位于“更多...”条目之前。                                      |
| `optionKey`           | 否   | `string`                                                              | 简单单标志凭证流程的内部选项键。                                                                        |
| `cliFlag`             | 否   | `string`                                                              | CLI 标志名称，例如 `--openrouter-api-key`。                                                              |
| `cliOption`           | 否   | `string`                                                              | 完整 CLI 选项形态，例如 `--openrouter-api-key <key>`。                                                   |
| `cliDescription`      | 否   | `string`                                                              | CLI 帮助中使用的描述。                                                                                   |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此选择应出现在哪些新手引导界面中。如果省略，默认为 `["text-inference"]`。                                |

## commandAliases 参考

当插件拥有一个运行时命令名称，而用户可能误将其放入 `plugins.allow` 或尝试作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据进行诊断，而无需导入插件运行时代码。

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

| 字段         | 必需 | 类型              | 含义                                                                |
| ------------ | ---- | ----------------- | ------------------------------------------------------------------- |
| `name`       | 是   | `string`          | 属于此插件的命令名称。                                              |
| `kind`       | 否   | `"runtime-slash"` | 将别名标记为聊天斜杠命令，而不是根 CLI 命令。                      |
| `cliCommand` | 否   | `string`          | 如果存在，用于建议 CLI 操作的相关根 CLI 命令。                     |

## activation 参考

当插件可以低成本声明哪些控制平面事件应将其包含在激活/加载计划中时，请使用 `activation`。

此块是规划器元数据，不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不承诺插件代码已经执行。激活规划器使用这些字段在回退到现有清单所有权元数据（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子）之前缩小候选插件范围。

优先使用已经描述所有权的最窄元数据。当 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 能表达这种关系时，请使用这些字段。对于无法由这些所有权字段表示的额外规划器提示，请使用 `activation`。对于 CLI 运行时别名（例如 `claude-cli`、`my-cli` 或 `google-gemini-cli`），请使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅用于尚无所有权字段的嵌入式智能体 harness id。

每个插件都应有意设置 `activation.onStartup`。仅当插件必须在 Gateway 网关启动期间运行时，才将其设为 `true`。当插件在启动时处于惰性状态，并且只应由更窄的触发器加载时，将其设为 `false`。省略 `onStartup` 不再隐式地在启动时加载插件；请为启动、渠道、配置、智能体 harness、记忆或其他更窄的激活触发器使用显式激活元数据。

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

| 字段               | 必需 | 类型                                                 | 含义                                                                                                                                                                                       |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | 否   | `boolean`                                            | 显式 Gateway 网关启动激活。每个插件都应设置此项。`true` 会在启动期间导入插件；`false` 会让它在启动时保持惰性，除非另一个匹配的触发器要求加载。                                            |
| `onProviders`      | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的提供商 id。                                                                                                                                              |
| `onAgentHarnesses` | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的嵌入式智能体 harness 运行时 id。CLI 后端别名请使用顶层 `cliBackends`。                                                                                   |
| `onCommands`       | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的命令 id。                                                                                                                                                |
| `onChannels`       | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的渠道 id。                                                                                                                                                |
| `onRoutes`         | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的路由类型。                                                                                                                                               |
| `onConfigPaths`    | 否   | `string[]`                                           | 当路径存在且未被显式禁用时，应将此插件包含在启动/加载计划中的相对根目录配置路径。                                                                                                        |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。尽可能优先使用更窄的字段。                                                                                                                           |

当前实际使用方：

- Gateway 网关启动规划使用 `activation.onStartup` 进行显式启动导入。
- 命令触发的 CLI 规划会回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`。
- 智能体运行时启动规划会对嵌入式 harness 使用 `activation.onAgentHarnesses`，并对 CLI 运行时别名使用顶层 `cliBackends[]`。
- 渠道触发的设置/渠道规划会在缺少显式渠道激活元数据时，回退到旧版 `channels[]` 所有权。
- 启动插件规划会对非渠道根配置界面使用 `activation.onConfigPaths`，例如内置浏览器插件的 `browser` 块。
- 提供商触发的设置/运行时规划会在缺少显式提供商激活元数据时，回退到旧版 `providers[]` 和顶层 `cliBackends[]` 所有权。

规划器诊断可以区分显式激活提示和清单所有权回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 所有权。这些原因标签用于宿主诊断和测试；插件作者应继续声明最能描述所有权的元数据。

## qaRunners 参考

当插件在共享的 `openclaw qa` 根命令下贡献一个或多个传输运行器时，请使用 `qaRunners`。保持此元数据轻量且静态；插件运行时仍通过轻量级 `runtime-api.ts` 界面拥有实际的 CLI 注册，该界面会导出匹配的 `qaRunnerCliRegistrations`。可选的 `adapterFactory` 会将传输暴露给共享 QA 场景，而不改变已注册命令的运行器。

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

| 字段          | 必需 | 类型     | 含义                                                            |
| ------------- | ---- | -------- | --------------------------------------------------------------- |
| `commandName` | 是   | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。                |
| `description` | 否   | `string` | 当共享宿主需要存根命令时使用的回退帮助文本。                   |

`adapterFactory` id 必须匹配 `commandName`。不要为清单中不存在的命令导出注册项。

## setup 参考

当设置和新手引导界面需要在运行时加载前获取低成本的插件自有元数据时，使用 `setup`。

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
            "source": "openai local credentials"
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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推断后端。`setup.cliBackends` 是面向应保持仅元数据的控制平面/设置流程的设置专用描述符界面。

存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现中首选的描述符优先查找界面。如果描述符只是缩小候选插件范围，而设置仍需要更丰富的设置时运行时钩子，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 也会在通用提供商凭证和环境变量查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用窗口期间仍通过兼容适配器受支持，但仍使用它的非内置插件会收到清单诊断。新插件应将设置/状态环境元数据放在 `setup.providers[].envVars` 上。

当计费或组织级凭证必须激活 `resolveUsageAuth` 但不能成为推断凭证时，使用 `providerUsageAuthEnvVars`。这些名称会加入工作区 dotenv 阻止、ACP 子进程剥离、沙箱密钥过滤和广泛密钥清理。提供商运行时仍会在 `resolveUsageAuth` 内读取并分类该值。

当没有设置条目可用，或 `setup.requiresRuntime: false` 声明不需要设置运行时时，OpenClaw 也可以从 `setup.providers[].authMethods` 推导简单的设置选项。对于自定义标签、CLI 标志、新手引导范围和助手元数据，显式 `providerAuthChoices` 条目仍然优先。

仅当这些描述符足以满足设置界面时，才设置 `requiresRuntime: false`。OpenClaw 会将显式 `false` 视为仅描述符契约，并且不会执行 `setup-api` 或 `openclaw.setupEntry` 来进行设置查找。如果仅描述符插件仍随附这些设置运行时条目之一，OpenClaw 会报告一条增量诊断并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，因此已经添加描述符但没有该标志的现有插件不会中断。

由于设置查找可以执行插件自有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在已发现插件之间保持唯一。所有权存在歧义时会失败关闭，而不是按发现顺序挑选胜者。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的提供商或 CLI 后端，或者某个描述符没有匹配的运行时注册，设置注册表诊断会报告描述符漂移。这些诊断是增量的，不会拒绝旧版插件。

### setup.providers 参考

| 字段           | 必需 | 类型       | 含义                                                                                                  |
| -------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `id`           | 是   | `string`   | 在设置或新手引导期间暴露的提供商 id。保持规范化 id 全局唯一。                                        |
| `authMethods`  | 否   | `string[]` | 此提供商在不加载完整运行时的情况下支持的设置/凭证方法 id。                                           |
| `envVars`      | 否   | `string[]` | 通用设置/状态界面可在插件运行时加载前检查的环境变量。                                                |
| `authEvidence` | 否   | `object[]` | 面向可通过非密钥标记进行身份验证的提供商的低成本本地凭证证据检查。                                  |

`authEvidence` 用于提供商自有的本地凭证标记，可在不加载运行时代码的情况下验证。这些检查必须保持低成本且本地化：不进行网络调用，不读取钥匙串或密钥管理器，不执行 shell 命令，也不探测提供商 API。

支持的证据条目：

| 字段               | 必需 | 类型       | 含义                                                                                                           |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 当前为 `local-file-with-env`。                                                                                 |
| `fileEnvVar`       | 否   | `string`   | 包含显式凭证文件路径的环境变量。                                                                               |
| `fallbackPaths`    | 否   | `string[]` | 当 `fileEnvVar` 不存在或为空时检查的本地凭证文件路径。支持 `${HOME}` 和 `${APPDATA}`。                         |
| `requiresAnyEnv`   | 否   | `string[]` | 至少一个列出的环境变量必须非空，证据才有效。                                                                  |
| `requiresAllEnv`   | 否   | `string[]` | 每个列出的环境变量都必须非空，证据才有效。                                                                    |
| `credentialMarker` | 是   | `string`   | 证据存在时返回的非密钥标记。                                                                                  |
| `source`           | 否   | `string`   | 用于凭证/状态输出的面向用户的来源标签。                                                                       |

### setup 字段

| 字段               | 必需 | 类型       | 含义                                                                                              |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在设置和新手引导期间暴露的提供商设置描述符。                                                      |
| `cliBackends`      | 否   | `string[]` | 用于描述符优先设置查找的设置时后端 id。保持规范化 id 全局唯一。                                  |
| `configMigrations` | 否   | `string[]` | 此插件设置界面拥有的配置迁移 id。                                                                 |
| `requiresRuntime`  | 否   | `boolean`  | 描述符查找后，设置是否仍需要执行 `setup-api`。                                                     |

## uiHints 参考

`uiHints` 是从配置字段名称到小型渲染提示的映射。

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

| 字段          | 类型       | 含义                         |
| ------------- | ---------- | ---------------------------- |
| `label`       | `string`   | 面向用户的字段标签。         |
| `help`        | `string`   | 简短帮助文本。               |
| `tags`        | `string[]` | 可选 UI 标签。               |
| `advanced`    | `boolean`  | 将字段标记为高级。           |
| `sensitive`   | `boolean`  | 将字段标记为密钥或敏感信息。 |
| `placeholder` | `string`   | 表单输入的占位符文本。       |

## contracts 参考

仅将 `contracts` 用于 OpenClaw 可在不导入插件运行时的情况下读取的静态能力所有权元数据。

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
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段                             | 类型       | 含义                                                                                                                         |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 扩展工厂 ID，目前为 `codex-app-server`。                                                                    |
| `agentToolResultMiddleware`      | `string[]` | 此插件可为其注册工具结果中间件的运行时 ID。                                                                                  |
| `trustedToolPolicies`            | `string[]` | 已安装插件可注册的插件本地受信任预工具策略 ID。内置插件可以在没有此字段的情况下注册策略。                                   |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部凭证配置文件钩子的提供商 ID。                                                                                |
| `embeddingProviders`             | `string[]` | 此插件拥有的通用嵌入提供商 ID，用于可复用的向量嵌入，包括记忆。                                                             |
| `speechProviders`                | `string[]` | 此插件拥有的语音提供商 ID。                                                                                                  |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转写提供商 ID。                                                                                              |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音提供商 ID。                                                                                              |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的已弃用、记忆专用嵌入提供商 ID。                                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解提供商 ID。                                                                                              |
| `transcriptSourceProviders`      | `string[]` | 此插件拥有的转录来源提供商 ID。                                                                                              |
| `documentExtractors`             | `string[]` | 此插件拥有的文档（例如 PDF）提取器提供商 ID。                                                                                |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成提供商 ID。                                                                                              |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成提供商 ID。                                                                                              |
| `musicGenerationProviders`       | `string[]` | 此插件拥有的音乐生成提供商 ID。                                                                                              |
| `webContentExtractors`           | `string[]` | 此插件拥有的网页内容提取提供商 ID。                                                                                          |
| `webFetchProviders`              | `string[]` | 此插件拥有的 Web 抓取提供商 ID。                                                                                             |
| `webSearchProviders`             | `string[]` | 此插件拥有的 Web 搜索提供商 ID。                                                                                             |
| `usageProviders`                 | `string[]` | 此插件拥有其用量凭证和用量快照钩子的提供商 ID。                                                                              |
| `migrationProviders`             | `string[]` | 此插件为 `openclaw migrate` 拥有的导入提供商 ID。                                                                            |
| `gatewayMethodDispatch`          | `string[]` | 为经过身份验证的插件 HTTP 路由预留的授权项，这些路由会在进程内分派 Gateway 网关方法。                                       |
| `tools`                          | `string[]` | 此插件拥有的智能体工具名称。                                                                                                 |

`contracts.embeddedExtensionFactories` 会保留给仅用于内置 Codex app-server 的扩展工厂。内置工具结果转换应改为声明 `contracts.agentToolResultMiddleware`，并通过 `api.registerAgentToolResultMiddleware(...)` 注册。已安装插件只有在显式启用且仅针对其在 `contracts.agentToolResultMiddleware` 中声明的运行时，才可以使用同一个中间件接入点。

需要主机受信任预工具策略层级的已安装插件，必须在 `contracts.trustedToolPolicies` 中声明每个已注册的本地 ID，并且必须显式启用。内置插件保留现有受信任策略路径，但带有未声明策略 ID 的已安装插件会在注册前被拒绝。策略 ID 的作用域限定在注册该策略的插件内，因此两个插件都可以声明并注册 `workflow-budget`；单个插件不能重复注册同一个本地 ID。

运行时 `api.registerTool(...)` 注册必须匹配 `contracts.tools`。工具发现会使用此列表，只加载可能拥有所请求工具的插件运行时。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`；未声明的外部凭证钩子会被忽略。

同时实现 `resolveUsageAuth` 和 `fetchUsageSnapshot` 的提供商插件，应在 `contracts.usageProviders` 中声明每个自动发现的提供商 ID。用量发现会先读取此契约，再只加载已声明所有者的运行时代码，并在加载后验证两个钩子。

通用嵌入提供商应为每个通过 `api.registerEmbeddingProvider(...)` 注册的适配器声明 `contracts.embeddingProviders`。可复用向量生成应使用通用契约，包括被记忆搜索消费的提供商。`contracts.memoryEmbeddingProviders` 是已弃用的记忆专用兼容项，只会在现有提供商迁移到通用嵌入提供商接入点期间保留。

`contracts.gatewayMethodDispatch` 当前接受 `"authenticated-request"`。它是一个 API 卫生门控，用于那些有意在进程内分派 Gateway 网关控制平面方法的原生插件 HTTP 路由，而不是针对恶意原生插件的沙箱。仅将它用于已经要求 Gateway 网关 HTTP 凭证、并经过严格评审的内置或操作员界面。

## configContracts 参考

使用 `configContracts` 来描述清单拥有的配置行为，使通用核心辅助函数无需导入插件运行时即可使用：危险标志检测、SecretRef 迁移目标和旧版配置路径收窄。

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

| 字段                          | 是否必需 | 类型       | 含义                                                                                                                                                                                                                   |
| ----------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | 否       | `string[]` | 根相对配置路径，表示此插件的设置时兼容性迁移可能适用。当配置从未引用该插件时，这允许通用运行时配置读取跳过每个插件设置界面。                              |
| `compatibilityRuntimePaths`   | 否       | `string[]` | 此插件可在运行时、插件代码完全激活前处理的根相对兼容性路径。对于应在不导入每个兼容插件运行时的情况下收窄内置候选集的旧版界面，请使用此项。                |
| `dangerousFlags`              | 否       | `object[]` | 当启用时，`openclaw doctor` 应标记为不安全或危险的配置字面量。见下文。                                                                                   |
| `secretInputs`                | 否       | `object`   | `plugins.entries.<id>.config` 下的配置路径，SecretRef 迁移/审计目标注册表应将其视为密钥形态字符串。见下文。                                               |

每个 `dangerousFlags` 条目支持：

| 字段     | 是否必需 | 类型                                  | 含义                                                                                                        |
| -------- | -------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `path`   | 是       | `string`                              | 相对于 `plugins.entries.<id>.config` 的点分隔配置路径。支持用于映射/数组片段的 `*` 通配符。                 |
| `equals` | 是       | `string \| number \| boolean \| null` | 将此配置值标记为危险的精确字面量。                                                                         |

`secretInputs` 支持：

| 字段                    | 是否必需 | 类型       | 含义                                                                                                                                                                                           |
| ----------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | 否       | `boolean`  | 在决定此 SecretRef 界面是否处于活动状态时，覆盖内置插件的默认启用状态。当插件是内置插件，但该界面应保持非活动状态直到在配置中显式启用时，使用此项。                                           |
| `paths`                 | 是       | `object[]` | 密钥形态配置路径，每个路径都带有 `path`（点分隔、相对于 `plugins.entries.<id>.config`、支持 `*` 通配符）和可选的 `expected`（目前仅支持 `"string"`）。                                         |

## mediaUnderstandingProviderMetadata 参考

当媒体理解提供商具有默认模型、自动凭证回退优先级或原生文档支持，并且通用核心辅助函数需要在运行时加载前使用这些信息时，请使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

| 字段                   | 类型                                                             | 含义                                                                                                            |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | 此提供商暴露的媒体能力。                                                                                       |
| `defaultModels`        | `Record<string, string>`                                         | 当配置未指定模型时使用的能力到模型默认值。                                                                      |
| `autoPriority`         | `Record<string, number>`                                         | 数字越小，在基于凭证的自动提供商回退中排序越靠前。                                                              |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | 提供商支持的原生文档输入。                                                                                      |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 按文档类型覆盖的模型。设置 `image: false` 可为该文档类型禁用基于图像的提取。                                    |

## channelConfigs 参考

当渠道插件需要在运行时加载前获取低成本配置元数据时，使用 `channelConfigs`。当没有可用的设置入口，或 `setup.requiresRuntime: false` 声明不需要设置运行时时，只读渠道设置/状态发现可以直接使用此元数据处理已配置的外部渠道。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置段。用户仍然在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 会读取清单元数据，以便在插件运行时代码执行前决定哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明 `channels[]` 的非内置插件也应声明匹配的 `channelConfigs` 条目。没有它们时，OpenClaw 仍可加载插件，但冷路径配置 schema、设置和 Control UI 表面在插件运行时执行前无法知道渠道拥有的选项形状。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以为渠道运行时加载前执行的命令配置检查声明静态 `auto` 默认值。内置渠道也可以通过 `package.json#openclaw.channel.commands` 发布相同默认值，并与它们其他由包拥有的渠道目录元数据并列。

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

| 字段          | 类型                     | 含义                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都需要它。                    |
| `uiHints`     | `Record<string, object>` | 该渠道配置段的可选 UI 标签/占位符/敏感提示。                                          |
| `label`       | `string`                 | 当运行时元数据尚未就绪时，合并到选择器和检查表面的渠道标签。                          |
| `description` | `string`                 | 用于检查和目录表面的简短渠道描述。                                                    |
| `commands`    | `object`                 | 用于运行时前配置检查的静态原生命令和原生技能自动默认值。                              |
| `preferOver`  | `string[]`               | 此渠道在选择表面中应优先于其上的旧版或较低优先级插件 ID。                             |

### 替换另一个渠道插件

当你的插件是某个渠道 ID 的首选所有者，而另一个插件也能提供该渠道 ID 时，使用 `preferOver`。常见情况包括重命名的插件 ID、取代某个内置插件的独立插件，或为配置兼容性保留相同渠道 ID 的维护中 fork。

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

配置了 `channels.chat` 时，OpenClaw 会同时考虑渠道 ID 和首选插件 ID。如果较低优先级插件只是因为它是内置插件或默认启用才被选中，OpenClaw 会在有效运行时配置中禁用它，以便一个插件拥有该渠道及其工具。显式用户选择仍然优先：如果用户显式启用两个插件（通过 `plugins.allow` 或实质性的 `plugins.entries` 配置），OpenClaw 会保留该选择，并报告重复渠道/工具诊断，而不是静默更改请求的插件集。

请将 `preferOver` 限定在确实能够提供相同渠道的插件 ID 范围内。它不是通用优先级字段，也不会重命名用户配置键。

## modelSupport 参考

当 OpenClaw 应在插件运行时加载前，根据 `gpt-5.5` 或 `claude-sonnet-4.6` 这类简写模型 ID 推断你的提供商插件时，使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用使用所属 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，非内置插件优先
- 剩余歧义会被忽略，直到用户或配置指定提供商

字段：

| 字段            | 类型       | 含义                                                                        |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 ID 匹配的前缀。                                |
| `modelPatterns` | `string[]` | 在移除配置文件后缀后，与简写模型 ID 匹配的正则源。                          |

`modelPatterns` 条目会通过 `compileSafeRegex` 编译，该函数会拒绝包含嵌套重复的模式（例如 `(a+)+$`）。未通过安全检查的模式会被静默跳过，行为与语法无效的正则相同。保持模式简单，并避免嵌套量词。

## modelCatalog 参考

当 OpenClaw 应在加载插件运行时前知道提供商模型元数据时，使用 `modelCatalog`。这是固定目录行、提供商别名、抑制规则和发现模式的清单拥有来源。运行时刷新仍归提供商运行时代码所有，但清单会告诉核心何时需要运行时。

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

| 字段             | 类型                                                     | 含义                                                                                                  |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 此插件拥有的提供商 ID 的目录行。键也应出现在顶层 `providers` 中。                                      |
| `aliases`        | `Record<string, object>`                                 | 应解析为某个已拥有提供商的提供商别名，用于目录或抑制规划。                                            |
| `suppressions`   | `object[]`                                               | 此插件因提供商特定原因而抑制的、来自另一来源的模型行。                                                |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供商目录是否可以从清单元数据读取、刷新到缓存，或需要运行时。                                        |
| `runtimeAugment` | `boolean`                                                | 仅当提供商运行时必须在清单/配置规划后追加目录行时，才设置为 `true`。                                  |

`aliases` 参与模型目录规划的提供商所有权查找。别名目标必须是同一插件拥有的顶层提供商。当按提供商过滤的列表使用别名时，OpenClaw 可以读取所属清单并应用别名 API/base URL 覆盖，而无需加载提供商运行时。别名不会扩展未过滤的目录列表；宽泛列表只发出所属规范提供商行。

`suppressions` 替代旧的提供商运行时 `suppressBuiltInModel` 钩子。仅当提供商由该插件拥有，或声明为指向某个已拥有提供商的 `modelCatalog.aliases` 键时，抑制条目才会生效。模型解析期间不再调用运行时抑制钩子。

提供商字段：

| 字段      | 类型                     | 含义                                                          |
| --------- | ------------------------ | ------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供商目录中模型的可选默认 base URL。                       |
| `api`     | `ModelApi`               | 此提供商目录中模型的可选默认 API 适配器。                     |
| `headers` | `Record<string, string>` | 应用于此提供商目录的可选静态标头。                            |
| `models`  | `object[]`               | 必需的模型行。没有 `id` 的行会被忽略。                        |

模型字段：

| 字段               | 类型                                                           | 含义                                                                        |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | 提供商本地模型 ID，不包含 `provider/` 前缀。                                |
| `name`             | `string`                                                       | 可选显示名称。                                                              |
| `api`              | `ModelApi`                                                     | 可选的按模型 API 覆盖项。                                                   |
| `baseUrl`          | `string`                                                       | 可选的按模型基础 URL 覆盖项。                                               |
| `headers`          | `Record<string, string>`                                       | 可选的按模型静态标头。                                                      |
| `input`            | `Array<"text" \| "image" \| "document">`                       | 模型接受的模态。其他值会被静默丢弃。                                        |
| `reasoning`        | `boolean`                                                      | 模型是否暴露推理行为。                                                      |
| `contextWindow`    | `number`                                                       | 原生提供商上下文窗口。                                                      |
| `contextTokens`    | `number`                                                       | 当不同于 `contextWindow` 时，可选的有效运行时上下文上限。                   |
| `maxTokens`        | `number`                                                       | 已知时的最大输出 token 数。                                                 |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 可选的按 thinking level 的模型 ID 或参数覆盖项。                            |
| `cost`             | `object`                                                       | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。                   |
| `compat`           | `object`                                                       | 可选的兼容性标志，与 OpenClaw 模型配置兼容性匹配。                          |
| `mediaInput`       | `object`                                                       | 可选的按模态输入配置，目前仅支持图像。                                      |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。只有当该行完全不应出现时才抑制。                                  |
| `statusReason`     | `string`                                                       | 可选原因，与非可用状态一起显示。                                            |
| `replaces`         | `string[]`                                                     | 此模型取代的旧提供商本地模型 ID。                                           |
| `replacedBy`       | `string`                                                       | 已弃用行的替代提供商本地模型 ID。                                           |
| `tags`             | `string[]`                                                     | 选择器和筛选器使用的稳定标签。                                              |

抑制字段：

| 字段                       | 类型       | 含义                                                                                                      |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游行的提供商 ID。必须归此插件所有，或声明为 owned alias。                                       |
| `model`                    | `string`   | 要抑制的提供商本地模型 ID。                                                                               |
| `reason`                   | `string`   | 当被抑制的行被直接请求时显示的可选消息。                                                                  |
| `when.baseUrlHosts`        | `string[]` | 可选的有效提供商基础 URL 主机列表，只有满足这些主机时抑制才适用。                                        |
| `when.providerConfigApiIn` | `string[]` | 可选的精确提供商配置 `api` 值列表，只有满足这些值时抑制才适用。                                          |

不要在 `modelCatalog` 中放入仅运行时数据。只有当清单行足够完整，能让按提供商筛选的列表和选择器界面跳过注册表/运行时发现时，才使用 `static`。当清单行可作为有用的可列出种子或补充，但刷新/缓存稍后可以添加更多行时，使用 `refreshable`；refreshable 行本身不是权威来源。当 OpenClaw 必须加载提供商运行时才能知道列表时，使用 `runtime`。

## modelIdNormalization 参考

使用 `modelIdNormalization` 进行低成本、由提供商拥有的模型 ID 清理，这必须在提供商运行时加载前发生。这会把短模型名、提供商本地旧版 ID 和代理前缀规则等别名保留在拥有方插件清单中，而不是放在核心模型选择表里。

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

| 字段                                 | 类型                    | 含义                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不区分大小写的精确模型 ID 别名。值会按写法返回。                                         |
| `stripPrefixes`                      | `string[]`              | 在别名查找前移除的前缀，适用于旧版 provider/model 重复。                                 |
| `prefixWhenBare`                     | `string`                | 当规范化后的模型 ID 尚未包含 `/` 时添加的前缀。                                          |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 别名查找后的条件裸 ID 前缀规则，按 `modelPrefix` 和 `prefix` 键控。                       |

## providerEndpoints 参考

使用 `providerEndpoints` 进行端点分类，供通用请求策略在提供商运行时加载前了解。核心仍拥有每个 `endpointClass` 的含义；插件清单拥有主机和基础 URL 元数据。

正式外部化的提供商插件会从核心发行包中排除，因此
它们的清单在安装前不可见。它们的 `providerEndpoints` 也必须
镜像到 `scripts/lib/official-external-provider-catalog.json`，以便
在没有插件时端点分类仍能工作；契约测试会强制执行该镜像。

端点字段：

| 字段                           | 类型       | 含义                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端点类别，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                  |
| `hosts`                        | `string[]` | 映射到端点类别的精确主机名。                                                                   |
| `hostSuffixes`                 | `string[]` | 映射到端点类别的主机后缀。以 `.` 为前缀表示仅匹配域名后缀。                                   |
| `baseUrls`                     | `string[]` | 映射到端点类别的精确规范化 HTTP(S) 基础 URL。                                                  |
| `googleVertexRegion`           | `string`   | 精确全局主机的静态 Google Vertex 区域。                                                        |
| `googleVertexRegionHostSuffix` | `string`   | 从匹配主机中剥离的后缀，用于暴露 Google Vertex 区域前缀。                                     |

## providerRequest 参考

使用 `providerRequest` 提供低成本请求兼容性元数据，让通用请求策略无需加载提供商运行时即可使用。将特定行为的载荷重写保留在提供商运行时钩子或共享提供商家族辅助函数中。

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

| 字段                  | 类型         | 含义                                                                           |
| --------------------- | ------------ | ------------------------------------------------------------------------------ |
| `family`              | `string`     | 通用请求兼容性决策和诊断使用的提供商家族标签。                                 |
| `compatibilityFamily` | `"moonshot"` | 可选的提供商家族兼容性分组，用于共享请求辅助函数。                             |
| `openAICompletions`   | `object`     | OpenAI 兼容 completions 请求标志，目前为 `supportsStreamingUsage`。            |

## secretProviderIntegrations 参考

当插件可以发布可复用的 SecretRef exec 提供商预设时，使用 `secretProviderIntegrations`。OpenClaw 会在插件运行时加载前读取此元数据，将插件所有权存储到 `secrets.providers.<alias>.pluginIntegration`，并把实际密钥解析留给 SecretRef 运行时。预设仅对内置插件和从托管插件安装根发现的已安装插件暴露，例如 git 和 ClawHub 安装。

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

映射键是集成 ID。如果省略 `providerAlias`，OpenClaw 会使用集成 ID 作为 SecretRef 提供商别名。提供商别名必须匹配普通 SecretRef 提供商别名模式，例如 `team-secrets` 或 `onepassword-work`。

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

启动/重新加载时，OpenClaw 会通过加载当前插件清单元数据来解析该提供商，检查拥有方插件是否已安装且处于活动状态，并从清单中实体化 exec 命令。禁用或移除该插件会撤销活动 SecretRef 的提供商。想要独立 exec 配置的操作员仍可直接编写手动 `command`/`args` 提供商。

目前仅支持 `source: "exec"` 预设。`command` 必须是 `${node}`，且 `args[0]` 必须是一个以 `./` 开头、相对于插件根目录的解析器脚本。OpenClaw 会在启动/重新加载时将其实体化为当前 Node 可执行文件和插件内脚本的绝对路径。Node 选项（例如 `--require`、`--import`、`--loader`、`--env-file`、`--eval` 和 `--print`）不属于清单预设契约。需要非 Node 命令的操作员可以直接配置独立的手动 exec 提供商。

OpenClaw 会从插件根目录派生清单预设的 `trustedDirs`，对于 `${node}` 预设，则从当前 Node 可执行文件目录派生。清单编写的 `trustedDirs` 会被忽略。其他 exec 提供商选项，例如 `timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv` 和 `allowInsecurePath`，会传递到普通的 SecretRef exec 提供商配置。

## modelPricing 参考

当提供商需要在运行时加载前控制控制平面定价行为时，使用 `modelPricing`。Gateway 网关定价缓存会读取此元数据，而不会导入提供商运行时代码。

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

| 字段         | 类型              | 含义                                                                                               |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 对永远不应获取 OpenRouter 或 LiteLLM 定价的本地/自托管提供商设为 `false`。                         |
| `openRouter` | `false \| object` | OpenRouter 定价查找映射。`false` 会禁用此提供商的 OpenRouter 查找。                                |
| `liteLLM`    | `false \| object` | LiteLLM 定价查找映射。`false` 会禁用此提供商的 LiteLLM 查找。                                      |

源字段：

| 字段                       | 类型               | 含义                                                                                                                       |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 当外部目录提供商 ID 与 OpenClaw 提供商 ID 不同时使用，例如 `zai` 提供商对应的 `z-ai`。                                     |
| `passthroughProviderModel` | `boolean`          | 将包含斜杠的模型 ID 视为嵌套的提供商/模型引用，适用于 OpenRouter 等代理提供商。                                           |
| `modelIdTransforms`        | `"version-dots"[]` | 额外的外部目录模型 ID 变体。`version-dots` 会尝试带点的版本 ID，例如 `claude-opus-4.6`。                                  |

### OpenClaw 提供商索引

OpenClaw 提供商索引是 OpenClaw 拥有的预览元数据，用于其插件可能尚未安装的提供商。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。提供商索引是内部回退契约，未来的可安装提供商和预安装模型选择器界面会在提供商插件未安装时使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单 `modelCatalog`。
3. 显式刷新生成的模型目录缓存。
4. OpenClaw 提供商索引预览行。

提供商索引不得包含密钥、启用状态、运行时钩子或实时账号专属模型数据。它的预览目录使用与插件清单相同的 `modelCatalog` 提供商行形状，但应仅限于稳定的显示元数据，除非有意让 `api`、`baseUrl`、定价或兼容性标志等运行时适配器字段与已安装插件清单保持一致。具有实时 `/models` 发现能力的提供商，应通过显式模型目录缓存路径写入刷新后的行，而不是在普通列表或新手引导中调用提供商 API。

提供商索引条目也可以携带可安装插件元数据，用于插件已移出核心或尚未安装的提供商。此元数据遵循渠道目录模式：包名、npm 安装规格、预期完整性，以及轻量的凭证选择标签，足以显示一个可安装的设置选项。一旦插件安装完成，它的清单优先，该提供商的提供商索引条目会被忽略。

`openclaw doctor --fix` 会将一小组封闭的旧版顶层清单能力键迁移到 `contracts.*`：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders` 和 `tools`。这些键（或任何其他能力列表）都不再作为顶层清单字段读取；普通清单加载只会识别 `contracts` 下的它们。

## 清单与 package.json

这两个文件承担不同职责：

| 文件                   | 用途                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | 发现、配置验证、凭证选择元数据，以及必须在插件代码运行前存在的 UI 提示                                                         |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块                                               |

如果你不确定某段元数据应该放在哪里，请使用这条规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，就放入 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就放入 `package.json`

### 影响发现的 package.json 字段

某些运行时前插件元数据有意放在 `package.json` 的 `openclaw` 块下，而不是 `openclaw.plugin.json` 中。`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw 插件契约；原生插件必须使用 `openclaw.plugin.json` 以及下面受支持的 `package.json#openclaw` 字段。

重要示例：

| 字段                                                                                       | 含义                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 声明原生插件入口点。必须保持在插件包目录内。                                                                                                           |
| `openclaw.runtimeExtensions`                                                               | 声明已安装包的构建后 JavaScript 运行时入口点。必须保持在插件包目录内。                                                                                 |
| `openclaw.setupEntry`                                                                      | 轻量的仅设置入口点，用于新手引导、延迟的渠道启动，以及只读渠道状态/SecretRef 发现。必须保持在插件包目录内。                                           |
| `openclaw.runtimeSetupEntry`                                                               | 声明已安装包的构建后 JavaScript 设置入口点。需要 `setupEntry`，必须存在，并且必须保持在插件包目录内。                                                  |
| `openclaw.channel`                                                                         | 轻量渠道目录元数据，例如标签、文档路径、别名和选择文案。                                                                                               |
| `openclaw.channel.commands`                                                                | 静态原生命令和原生技能自动默认元数据，在渠道运行时加载前供配置、审计和命令列表界面使用。                                                               |
| `openclaw.channel.configuredState`                                                         | 轻量已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经存在仅环境变量设置？”。                                                       |
| `openclaw.channel.persistedAuthState`                                                      | 轻量持久化凭证检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何登录状态？”。                                                             |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置和外部发布插件的安装/更新提示。                                                                                                                    |
| `openclaw.install.defaultChoice`                                                           | 当有多个安装来源可用时的首选安装路径。                                                                                                                 |
| `openclaw.install.minHostVersion`                                                          | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                           |
| `openclaw.compat.pluginApi`                                                                | 此包所需的最低 OpenClaw 插件 API 范围，使用类似 `>=2026.5.27` 的 semver 下限。                                                                          |
| `openclaw.install.expectedIntegrity`                                                       | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会用它校验获取到的构件。                                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 当配置无效时，允许一个狭窄的内置插件重装恢复路径。                                                                                                     |
| `openclaw.install.requiredPlatformPackages`                                                | 当其锁文件平台约束匹配当前主机时必须具现化的 npm 包别名。                                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 允许设置运行时渠道界面在监听前加载，然后将完整已配置渠道插件延迟到监听后的激活阶段。                                                                   |

清单元数据决定哪些提供商/渠道/设置选项会在运行时加载前出现在新手引导中。`package.json#openclaw.install` 告诉新手引导当用户选择其中一个选项时，如何获取或启用该插件。不要把安装提示移入 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 会在非内置插件来源的安装和清单注册表加载期间强制执行。无效值会被拒绝；较新但有效的值会让旧主机跳过外部插件。内置源插件假定与主机检出版本保持一致。

`openclaw.install.requiredPlatformPackages` 适用于通过可选、特定平台别名暴露所需原生二进制文件的 npm 包。为每个受支持的平台别名列出裸 npm 包名。在 npm 安装期间，OpenClaw 只会校验锁文件约束与当前主机匹配的已声明别名。如果 npm 报告成功但遗漏该别名，OpenClaw 会使用新缓存重试一次；如果该别名仍然缺失，则回滚安装。

`openclaw.compat.pluginApi` 会在安装非内置插件来源的软件包时强制执行。用它表示该软件包构建时所依据的 OpenClaw 插件 SDK/运行时 API 下限。当插件软件包需要更新的 API，但仍希望为其他流程保留较低的安装提示时，它可以比 `minHostVersion` 更严格。官方 OpenClaw 发布同步默认会把现有官方插件的 API 下限提升到 OpenClaw 发布版本，但仅插件发布可以在软件包有意支持旧版主机时保留较低下限。不要只使用软件包版本作为兼容性契约。`peerDependencies.openclaw` 仍然是 npm 软件包元数据；OpenClaw 使用 `openclaw.compat.pluginApi` 契约来做安装兼容性决策。

当插件发布在 ClawHub 上时，官方按需安装元数据应使用 `clawhubSpec`；新手引导会将其视为首选远程来源，并在安装后记录 ClawHub 工件事实。`npmSpec` 仍然是尚未迁移到 ClawHub 的软件包的兼容性回退。

精确 npm 版本固定已经位于 `npmSpec` 中，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确规格与 `expectedIntegrity` 配对，这样如果获取到的 npm 工件不再匹配固定发布版本，更新流程会失败关闭。为兼容性起见，交互式新手引导仍会提供可信注册表 npm 规格，包括裸软件包名和 dist-tags。目录诊断可以区分精确、浮动、完整性固定、缺失完整性、软件包名不匹配，以及无效的默认选择来源。当存在 `expectedIntegrity` 但没有可固定的有效 npm 来源时，它们也会发出警告。存在 `expectedIntegrity` 时，安装/更新流程会强制执行它；省略时，会记录注册表解析结果，但不带完整性固定。

当状态、频道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。设置入口应暴露渠道元数据以及可安全用于设置的配置、状态和密钥适配器；将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖来源入口点字段的软件包边界检查。例如，`openclaw.runtimeExtensions` 不能让逃逸的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的范围有意很窄。它不会让任意损坏的配置变得可安装。目前它只允许安装流程从特定的过时内置插件升级失败中恢复，例如缺失的内置插件路径，或同一内置插件的过时 `channels.<id>` 条目。不相关的配置错误仍会阻止安装，并将操作员引导到 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是用于一个小型检查器模块的软件包元数据：

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

当设置、Doctor、状态或只读存在性流程需要在完整渠道插件加载前进行廉价的是/否认证探测时使用它。持久化认证状态不是已配置的渠道状态：不要使用此元数据自动启用插件、修复运行时依赖，或决定是否应加载渠道运行时。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 路由它。

`openclaw.channel.configuredState` 对廉价的仅环境已配置检查采用相同形状：

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

当某个渠道可以从环境或其他极小的非运行时输入回答已配置状态时使用它。如果检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` 钩子中。

## 设备发现优先级（重复插件 ID）

OpenClaw 会从三个根发现插件，并按以下顺序检查：随 OpenClaw 发布的内置插件、全局安装根（`~/.openclaw/extensions`）和当前工作区根（`<workspace>/.openclaw/extensions`），再加上任何显式的 `plugins.load.paths` 条目。

如果两个发现结果共享同一个 `id`，只保留**最高优先级**清单；较低优先级的重复项会被丢弃，而不是并排加载。优先级从高到低如下：

1. **配置选中** — 在 `plugins.entries.<id>` 中显式固定的路径
2. **匹配已跟踪安装记录的全局安装** — 通过 `openclaw plugin install`/`openclaw plugin update` 安装，且 OpenClaw 的安装跟踪识别为同一 id 的插件，即使该 id 也属于内置插件
3. **内置** — 随 OpenClaw 发布的插件
4. **工作区** — 相对于当前工作区发现的插件
5. 任何其他已发现候选项

影响：

- 位于工作区或全局根中未被跟踪的内置插件分叉副本或过时副本不会遮蔽内置构建。
- 若要覆盖内置插件，可以为该 id 运行 `openclaw plugin install`，让已跟踪的全局安装优先于内置副本；也可以通过 `plugins.entries.<id>` 固定特定路径，使其凭借配置选中优先级胜出。
- 重复丢弃会被记录到日志中，以便 Doctor 和启动诊断指向被丢弃的副本。
- 配置选中的重复覆盖在诊断中会表述为显式覆盖，但仍会警告，以便过时分叉和意外遮蔽保持可见。

## JSON Schema 要求

- **每个插件都必须附带 JSON Schema**，即使它不接受任何配置。
- 空 schema 是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读写时验证，而不是在运行时验证。
- 使用新配置键扩展或分叉内置插件时，请同时更新该插件的 `openclaw.plugin.json` `configSchema`。内置插件 schema 是严格的，因此如果在用户配置中添加 `plugins.entries.<id>.config.myNewKey`，但没有将 `myNewKey` 添加到 `configSchema.properties`，会在插件运行时加载前被拒绝。

示例 schema 扩展：

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

- 未知的 `channels.*` 键是**错误**，除非渠道 id 由插件清单声明。如果同一 id 也出现在 `plugins.allow`、`plugins.entries` 或 `plugins.installs` 中（即被引用但当前不可发现的插件），OpenClaw 会将其降级为**警告**。
- `plugins.entries.<id>`、`plugins.allow` 和 `plugins.deny` 引用未知插件 id 时是**警告**（“已忽略过时配置条目”），不是错误，因此升级以及已移除/重命名的插件不会阻止 Gateway 网关启动。
- `plugins.slots.memory` 引用未知插件 id 时是**错误**，但已知的 `memory-lancedb` 官方外部插件除外，它会改为警告。
- 如果插件已安装但清单或 schema 损坏或缺失，验证会失败，Doctor 会报告插件错误。
- 如果存在插件配置但插件被**禁用**，配置会被保留，并在 Doctor + 日志中浮现**警告**。

完整的 `plugins.*` schema 请参阅[配置参考](/zh-CN/gateway/configuration)。

## 说明

- 清单是 **Native Codex plugins 必需的**，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于发现 + 验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍然是对象，就接受注释、尾随逗号和未加引号的键。
- 清单加载器只读取已文档化的清单字段。避免使用自定义顶层键。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerCatalogEntry` 必须保持轻量，不应导入宽泛的运行时代码；将其用于静态提供商目录元数据或窄范围发现描述符，而不是请求时执行。
- 独占插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`（默认 `memory-core`），`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 在此清单中声明独占插件类型。运行时入口 `OpenClawPluginDefinition.kind` 已弃用，仅作为旧插件的兼容性回退保留。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅为声明式。状态、审计、cron 投递验证和其他只读表面在将环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 对于需要提供商代码的运行时向导元数据，请参阅[提供商运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关

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
