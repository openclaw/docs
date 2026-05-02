---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布插件配置架构，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-05-02T08:16:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9cb6eff8d35cbd819178be9885801e2b84ad29cd12bbfd2f630467914366e4
    source_path: plugins/manifest.md
    workflow: 16
---

此页面仅适用于 **原生 OpenClaw 插件清单**。

兼容的包布局，请参阅 [插件包](/zh-CN/plugins/bundles)。

兼容的包格式使用不同的清单文件：

- Codex 包：`.codex-plugin/plugin.json`
- Claude 包：`.claude-plugin/plugin.json`，或没有清单的默认 Claude 组件布局
- Cursor 包：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些包布局，但它们不会根据此处描述的 `openclaw.plugin.json` 架构进行验证。

对于兼容包，OpenClaw 目前会在布局符合 OpenClaw 运行时期望时，读取包元数据以及声明的 skill 根目录、Claude 命令根目录、Claude 包 `settings.json` 默认值、Claude 包 LSP 默认值和支持的钩子包。

每个原生 OpenClaw 插件**必须**在**插件根目录**中提供 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

查看完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
原生能力模型和当前外部兼容性指导请参阅：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。以下所有内容都必须足够轻量，可以在不启动插件运行时的情况下检查。

**用于：**

- 插件身份、配置验证和配置 UI 提示
- 凭证、新手引导和设置元数据（别名、自动启用、提供商环境变量、凭证选项）
- 控制平面界面的激活提示
- 模型系列所有权简写
- 静态能力所有权快照（`contracts`）
- 共享 `openclaw qa` 宿主可检查的 QA 运行器元数据
- 合并到目录和验证界面的渠道专用配置元数据

**不要用于：**注册运行时行为、声明代码入口点，或 npm 安装元数据。这些属于你的插件代码和 `package.json`。

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

| 字段                                 | 必需 | 类型                             | 含义                                                                                                                                                                                                                                 |
| ------------------------------------ | ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | 是   | `string`                         | 规范插件 ID。这是 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                               |
| `configSchema`                       | 是   | `object`                         | 此插件配置的内联 JSON Schema。                                                                                                                                                                                                       |
| `enabledByDefault`                   | 否   | `true`                           | 将内置插件标记为默认启用。省略它，或设置任何非 `true` 值，即可让插件保持默认禁用。                                                                                                                                                   |
| `legacyPluginIds`                    | 否   | `string[]`                       | 会规范化为此规范插件 ID 的旧版 ID。                                                                                                                                                                                                  |
| `autoEnableWhenConfiguredProviders`  | 否   | `string[]`                       | 当身份验证、配置或模型引用提到这些提供商 ID 时，应自动启用此插件。                                                                                                                                                                   |
| `kind`                               | 否   | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的互斥插件类型。                                                                                                                                                                                        |
| `channels`                           | 否   | `string[]`                       | 此插件拥有的渠道 ID。用于设备发现和配置验证。                                                                                                                                                                                        |
| `providers`                          | 否   | `string[]`                       | 此插件拥有的提供商 ID。                                                                                                                                                                                                              |
| `providerDiscoveryEntry`             | 否   | `string`                         | 轻量级提供商设备发现模块路径，相对于插件根目录，用于清单作用域的提供商目录元数据，可在不激活完整插件运行时的情况下加载。                                                                                                            |
| `modelSupport`                       | 否   | `object`                         | 清单拥有的简写模型系列元数据，用于在运行时之前自动加载插件。                                                                                                                                                                         |
| `modelCatalog`                       | 否   | `object`                         | 此插件拥有的提供商的声明式模型目录元数据。这是未来只读列表、新手引导、模型选择器、别名和抑制功能的控制平面契约，无需加载插件运行时。                                                                                                |
| `modelPricing`                       | 否   | `object`                         | 提供商拥有的外部价格查询策略。用它让本地/自托管提供商退出远程价格目录，或将提供商引用映射到 OpenRouter/LiteLLM 目录 ID，而无需在核心中硬编码提供商 ID。                                                                              |
| `modelIdNormalization`               | 否   | `object`                         | 提供商拥有的模型 ID 别名/前缀清理，必须在提供商运行时加载之前运行。                                                                                                                                                                  |
| `providerEndpoints`                  | 否   | `object[]`                       | 清单拥有的端点 host/baseUrl 元数据，用于核心在提供商运行时加载之前对提供商路由进行分类。                                                                                                                                             |
| `providerRequest`                    | 否   | `object`                         | 轻量级提供商系列和请求兼容性元数据，由通用请求策略在提供商运行时加载之前使用。                                                                                                                                                       |
| `cliBackends`                        | 否   | `string[]`                       | 此插件拥有的 CLI 推理后端 ID。用于根据显式配置引用在启动时自动激活。                                                                                                                                                                 |
| `syntheticAuthRefs`                  | 否   | `string[]`                       | 提供商或 CLI 后端引用，其由插件拥有的合成身份验证钩子应在运行时加载之前的冷启动模型设备发现期间被探测。                                                                                                                             |
| `nonSecretAuthMarkers`               | 否   | `string[]`                       | 内置插件拥有的占位 API 密钥值，表示非机密的本地、OAuth 或环境凭证状态。                                                                                                                                                              |
| `commandAliases`                     | 否   | `object[]`                       | 此插件拥有的命令名称，应在运行时加载之前生成插件感知的配置和 CLI 诊断信息。                                                                                                                                                          |
| `providerAuthEnvVars`                | 否   | `Record<string, string[]>`       | 已弃用的兼容性环境变量元数据，用于提供商身份验证/状态查询。新插件优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期间仍会读取此字段。                                                                                       |
| `providerAuthAliases`                | 否   | `Record<string, string>`         | 应复用另一个提供商 ID 进行身份验证查询的提供商 ID，例如共享基础提供商 API 密钥和身份验证配置文件的编码提供商。                                                                                                                       |
| `channelEnvVars`                     | 否   | `Record<string, string[]>`       | OpenClaw 无需加载插件代码即可检查的轻量级渠道环境变量元数据。将其用于环境变量驱动的渠道设置，或通用启动/配置助手应看到的身份验证界面。                                                                                              |
| `providerAuthChoices`                | 否   | `object[]`                       | 用于新手引导选择器、首选提供商解析和简单 CLI 标志接线的轻量级身份验证选项元数据。                                                                                                                                                    |
| `activation`                         | 否   | `object`                         | 用于启动、提供商、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅为元数据；插件运行时仍拥有实际行为。                                                                                                                     |
| `setup`                              | 否   | `object`                         | 轻量级设置/新手引导描述符，设备发现和设置界面可在不加载插件运行时的情况下检查。                                                                                                                                                      |
| `qaRunners`                          | 否   | `object[]`                       | 共享 `openclaw qa` 主机在插件运行时加载之前使用的轻量级 QA 运行器描述符。                                                                                                                                                            |
| `contracts`                          | 否   | `object`                         | 外部身份验证钩子、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web-fetch、Web 搜索和工具所有权的静态能力所有权快照。                                                                                            |
| `mediaUnderstandingProviderMetadata` | 否   | `Record<string, object>`         | 在 `contracts.mediaUnderstandingProviders` 中声明的提供商 ID 的轻量级媒体理解默认值。                                                                                                                                                |
| `imageGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 在 `contracts.imageGenerationProviders` 中声明的提供商 ID 的轻量级图像生成身份验证元数据，包括提供商拥有的身份验证别名和 base-url 防护。                                                                                             |
| `videoGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 在 `contracts.videoGenerationProviders` 中声明的提供商 ID 的轻量级视频生成身份验证元数据，包括提供商拥有的身份验证别名和 base-url 防护。                                                                                             |
| `musicGenerationProviderMetadata`    | 否   | `Record<string, object>`         | 在 `contracts.musicGenerationProviders` 中声明的提供商 ID 的轻量级音乐生成身份验证元数据，包括提供商拥有的身份验证别名和 base-url 防护。                                                                                             |
| `toolMetadata`                       | 否   | `Record<string, object>`         | 在 `contracts.tools` 中声明的插件拥有工具的轻量级可用性元数据。当某个工具不应加载运行时，除非存在配置、环境变量或身份验证证据时，请使用它。                                                                                           |
| `channelConfigs`                     | 否   | `Record<string, object>`         | 清单拥有的渠道配置元数据，会在运行时加载之前合并到设备发现和验证界面中。                                                                                                                                                             |
| `skills`                             | 否   | `string[]`                       | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                                                             |
| `name`                               | 否   | `string`                         | 人类可读的插件名称。                                                                                                                                                                                                                 |
| `description`                        | 否       | `string`                         | 插件界面中显示的简短摘要。                                                                                                                                                                                             |
| `version`                            | 否       | `string`                         | 信息性插件版本。                                                                                                                                                                                                       |
| `uiHints`                            | 否       | `Record<string, object>`         | UI 标签、占位符，以及配置字段的敏感性提示。                                                                                                                                                                   |

## 生成提供商元数据参考

生成提供商元数据字段描述了在匹配的 `contracts.*GenerationProviders` 列表中声明的提供商的静态凭证信号。
OpenClaw 会在提供商运行时加载之前读取这些字段，因此核心工具可以在不导入每个提供商插件的情况下判断某个生成提供商是否可用。

这些字段只应用于低成本的声明式事实。传输、请求转换、令牌刷新、凭证验证和实际生成行为都保留在插件运行时中。

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

| 字段            | 必填 | 类型       | 含义                                                                                                 |
| --------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `aliases`       | 否   | `string[]` | 应算作生成提供商静态凭证别名的其他提供商 ID。                                                       |
| `authProviders` | 否   | `string[]` | 其已配置凭证配置档案应算作此生成提供商凭证的提供商 ID。                                             |
| `configSignals` | 否   | `object[]` | 面向本地或自托管提供商的低成本纯配置可用性信号，这些提供商无需凭证配置档案或环境变量即可配置。     |
| `authSignals`   | 否   | `object[]` | 显式凭证信号。存在时，这些信号会替代来自提供商 ID、`aliases` 和 `authProviders` 的默认信号集。       |

每个 `configSignals` 条目支持：

| 字段          | 必填 | 类型       | 含义                                                                                                                       |
| ------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | 是   | `string`   | 要检查的插件自有配置对象的点路径，例如 `plugins.entries.example.config`。                                                  |
| `overlayPath` | 否   | `string`   | 根配置内部的点路径，其对象应在评估信号前覆盖根对象。将其用于能力特定配置，例如 `image`、`video` 或 `music`。              |
| `required`    | 否   | `string[]` | 有效配置内部必须具有已配置值的点路径。字符串必须非空；对象和数组也不得为空。                                             |
| `requiredAny` | 否   | `string[]` | 有效配置内部的点路径，其中至少一个必须具有已配置值。                                                                       |
| `mode`        | 否   | `object`   | 有效配置内部的可选字符串模式保护。仅当纯配置可用性只适用于某一种模式时使用此项。                                         |

每个 `mode` 保护支持：

| 字段         | 必填 | 类型       | 含义                                                               |
| ------------ | ---- | ---------- | ------------------------------------------------------------------ |
| `path`       | 否   | `string`   | 有效配置内部的点路径。默认为 `mode`。                              |
| `default`    | 否   | `string`   | 配置省略该路径时要使用的模式值。                                   |
| `allowed`    | 否   | `string[]` | 如果存在，只有当有效模式是这些值之一时，信号才会通过。             |
| `disallowed` | 否   | `string[]` | 如果存在，当有效模式是这些值之一时，信号会失败。                   |

每个 `authSignals` 条目支持：

| 字段              | 必填 | 类型     | 含义                                                                                                             |
| ----------------- | ---- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 要在已配置凭证配置档案中检查的提供商 ID。                                                                       |
| `providerBaseUrl` | 否   | `object` | 可选保护，仅当引用的已配置提供商使用允许的基础 URL 时，才让信号计入。当凭证别名只对特定 API 有效时使用此项。 |

每个 `providerBaseUrl` 保护支持：

| 字段              | 必填 | 类型       | 含义                                                                                                      |
| ----------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 其 `baseUrl` 应被检查的提供商配置 ID。                                                                    |
| `defaultBaseUrl`  | 否   | `string`   | 当提供商配置省略 `baseUrl` 时要假定的基础 URL。                                                           |
| `allowedBaseUrls` | 是   | `string[]` | 此凭证信号允许的基础 URL。当已配置或默认基础 URL 与这些规范化值之一不匹配时，该信号会被忽略。           |

## 工具元数据参考

`toolMetadata` 使用与生成提供商元数据相同的 `configSignals` 和 `authSignals` 形状，并按工具名称作为键。`contracts.tools` 声明所有权。`toolMetadata` 声明低成本可用性证据，因此 OpenClaw 可以避免仅仅为了让某个工具工厂返回 `null` 而导入插件运行时。

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
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

如果某个工具没有 `toolMetadata`，OpenClaw 会保留现有行为，并在工具契约与策略匹配时加载拥有该工具的插件。对于工厂依赖凭证/配置的热路径工具，插件作者应声明 `toolMetadata`，而不是让核心导入运行时来询问。

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个新手引导或凭证选择。
OpenClaw 会在提供商运行时加载之前读取此信息。
提供商设置列表会使用这些清单选择、从描述符派生的设置选择和安装目录元数据，而无需加载提供商运行时。

| 字段                  | 必填 | 类型                                            | 含义                                                                                         |
| --------------------- | ---- | ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                        | 此选择所属的提供商 ID。                                                                      |
| `method`              | 是   | `string`                                        | 要分派到的凭证方法 ID。                                                                      |
| `choiceId`            | 是   | `string`                                        | 新手引导和 CLI 流程使用的稳定凭证选择 ID。                                                   |
| `choiceLabel`         | 否   | `string`                                        | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。                                     |
| `choiceHint`          | 否   | `string`                                        | 选择器的简短辅助文本。                                                                       |
| `assistantPriority`   | 否   | `number`                                        | 值越低，在智能体驱动的交互式选择器中排序越靠前。                                             |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 从智能体选择器中隐藏该选择，同时仍允许手动 CLI 选择。                                        |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 应将用户重定向到此替代选择的旧版选择 ID。                                                    |
| `groupId`             | 否   | `string`                                        | 用于分组相关选择的可选分组 ID。                                                              |
| `groupLabel`          | 否   | `string`                                        | 该分组面向用户的标签。                                                                       |
| `groupHint`           | 否   | `string`                                        | 分组的简短辅助文本。                                                                         |
| `optionKey`           | 否   | `string`                                        | 简单单标志凭证流程的内部选项键。                                                             |
| `cliFlag`             | 否   | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                   |
| `cliOption`           | 否   | `string`                                        | 完整的 CLI 选项形状，例如 `--openrouter-api-key <key>`。                                     |
| `cliDescription`      | 否   | `string`                                        | CLI 帮助中使用的描述。                                                                       |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此选择应出现在哪些新手引导界面中。如果省略，默认为 `["text-inference"]`。                    |

## commandAliases 参考

当插件拥有某个运行时命令名称，而用户可能会误将其放入 `plugins.allow` 或尝试作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用此元数据进行诊断，而无需导入插件运行时代码。

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

| 字段         | 必填 | 类型              | 含义                                                              |
| ------------ | ---- | ----------------- | ----------------------------------------------------------------- |
| `name`       | 是   | `string`          | 属于此插件的命令名称。                                            |
| `kind`       | 否   | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。                   |
| `cliCommand` | 否   | `string`          | 如存在相关根 CLI 命令，则建议将其用于 CLI 操作。                  |

## activation 参考

当插件可以低成本声明哪些控制平面事件应将其纳入 activation/load 计划时，请使用 `activation`。

此块是规划器元数据，不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不承诺插件代码已经执行。activation 规划器使用这些字段在回退到现有 manifest 所有权元数据（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前缩小候选插件范围。

优先使用已经描述所有权的最窄元数据。当 `providers`、`channels`、`commandAliases`、setup 描述符或 `contracts` 能表达这种关系时，请使用这些字段。对于无法由这些所有权字段表示的额外规划器提示，请使用 `activation`。
对于 `claude-cli`、`codex-cli` 或 `google-gemini-cli` 等 CLI 运行时别名，请使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅用于尚无所有权字段的嵌入式 agent harness ID。

此块仅是元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。当前使用方将它作为更广泛插件加载之前的缩窄提示，因此缺失非启动 activation 元数据通常只会影响性能；只要 manifest 所有权回退仍然存在，就不应改变正确性。

每个插件都应有意设置 `activation.onStartup`。仅当插件必须在 Gateway 网关启动期间运行时，才将其设为 `true`。当插件在启动时处于惰性状态并且只应由更窄的触发器加载时，将其设为 `false`。省略 `onStartup` 不再隐式地在启动时加载插件；请为启动、渠道、配置、agent harness、memory 或其他更窄的 activation 触发器使用显式 activation 元数据。

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

| 字段               | 必填 | 类型                                                 | 含义                                                                                                                                                                                    |
| ------------------ | ---- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 显式 Gateway 网关启动 activation。每个插件都应设置此项。`true` 会在启动期间导入插件；`false` 会使其保持启动惰性，除非另一个匹配触发器需要加载它。                                      |
| `onProviders`      | 否   | `string[]`                                           | 应将此插件纳入 activation/load 计划的提供商 ID。                                                                                                                                        |
| `onAgentHarnesses` | 否   | `string[]`                                           | 应将此插件纳入 activation/load 计划的嵌入式 agent harness 运行时 ID。对于 CLI backend 别名，请使用顶层 `cliBackends`。                                                                 |
| `onCommands`       | 否   | `string[]`                                           | 应将此插件纳入 activation/load 计划的命令 ID。                                                                                                                                          |
| `onChannels`       | 否   | `string[]`                                           | 应将此插件纳入 activation/load 计划的渠道 ID。                                                                                                                                          |
| `onRoutes`         | 否   | `string[]`                                           | 应将此插件纳入 activation/load 计划的路由种类。                                                                                                                                         |
| `onConfigPaths`    | 否   | `string[]`                                           | 当路径存在且未被显式禁用时，应将此插件纳入 startup/load 计划的根相对配置路径。                                                                                                         |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面 activation 规划使用的宽泛能力提示。尽可能优先使用更窄的字段。                                                                                                                 |

当前实时使用方：

- Gateway 网关启动规划使用 `activation.onStartup` 进行显式启动导入
- 命令触发的 CLI 规划回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- agent-runtime 启动规划对嵌入式 harness 使用 `activation.onAgentHarnesses`，并对 CLI 运行时别名使用顶层 `cliBackends[]`
- 渠道触发的 setup/channel 规划在缺少显式渠道 activation 元数据时回退到旧版 `channels[]` 所有权
- 启动插件规划针对非渠道根配置表面（例如内置浏览器插件的 `browser` 块）使用 `activation.onConfigPaths`
- 提供商触发的 setup/runtime 规划在缺少显式提供商 activation 元数据时回退到旧版 `providers[]` 和顶层 `cliBackends[]` 所有权

规划器诊断可以区分显式 activation 提示与 manifest 所有权回退。例如，`activation-command-hint` 表示 `activation.onCommands` 匹配，而 `manifest-command-alias` 表示规划器改用 `commandAliases` 所有权。这些原因标签用于主机诊断和测试；插件作者应继续声明最能描述所有权的元数据。

## qaRunners 参考

当插件在共享的 `openclaw qa` 根命令下贡献一个或多个传输 runner 时，请使用 `qaRunners`。保持此元数据低成本且静态；插件运行时仍通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 表面拥有实际 CLI 注册。

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

| 字段          | 必填 | 类型     | 含义                                                                 |
| ------------- | ---- | -------- | -------------------------------------------------------------------- |
| `commandName` | 是   | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。                      |
| `description` | 否   | `string` | 当共享主机需要存根命令时使用的回退帮助文本。                         |

## setup 参考

当 setup 和新手引导表面需要在运行时加载前获得低成本的插件所有元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推断 backend。`setup.cliBackends` 是用于应保持仅元数据的控制平面/setup 流程的 setup 专用描述符表面。

存在时，`setup.providers` 和 `setup.cliBackends` 是 setup 设备发现的首选描述符优先查找表面。如果描述符仅缩小候选插件范围，而 setup 仍需要更丰富的 setup-time 运行时 hooks，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会在通用提供商 auth 和环境变量查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用窗口期间仍通过兼容性适配器受支持，但仍使用它的非内置插件会收到 manifest 诊断。新插件应将 setup/status env 元数据放在 `setup.providers[].envVars` 上。

当没有 setup 条目可用，或当 `setup.requiresRuntime: false` 声明不需要 setup 运行时时，OpenClaw 也可以从 `setup.providers[].authMethods` 派生简单的 setup 选择。显式 `providerAuthChoices` 条目仍然优先用于自定义标签、CLI 标志、新手引导范围和 assistant 元数据。

仅当这些描述符足以满足 setup 表面时，才设置 `requiresRuntime: false`。OpenClaw 将显式 `false` 视为仅描述符契约，并且不会为 setup 查找执行 `setup-api` 或 `openclaw.setupEntry`。如果仅描述符插件仍随附这些 setup 运行时条目之一，OpenClaw 会报告附加诊断并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，因此已添加描述符但未添加该标志的现有插件不会中断。

由于 setup 查找可以执行插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在所有发现的插件中保持唯一。模糊所有权会封闭失败，而不是按发现顺序选择胜出者。

当 setup 运行时确实执行时，如果 `setup-api` 注册了 manifest 描述符未声明的提供商或 CLI backend，或者某个描述符没有匹配的运行时注册，setup 注册表诊断会报告描述符漂移。这些诊断是附加的，不会拒绝旧版插件。

### setup.providers 参考

| 字段           | 必填 | 类型       | 含义                                                                                         |
| -------------- | ---- | ---------- | -------------------------------------------------------------------------------------------- |
| `id`           | 是   | `string`   | 在 setup 或新手引导期间公开的提供商 ID。保持规范化 ID 全局唯一。                             |
| `authMethods`  | 否   | `string[]` | 此提供商在不加载完整运行时的情况下支持的 setup/auth 方法 ID。                                |
| `envVars`      | 否   | `string[]` | 通用 setup/status 表面可在插件运行时加载前检查的环境变量。                                   |
| `authEvidence` | 否   | `object[]` | 针对可通过非机密标记进行身份验证的提供商的低成本本地身份验证证据检查。                       |

`authEvidence` 用于由提供商拥有的本地凭证标记，可在不加载运行时代码的情况下验证。这些检查必须保持低成本且本地执行：不进行网络调用，不读取钥匙串或密钥管理器，不执行 shell 命令，也不探测提供商 API。

支持的证据条目：

| 字段               | 必填 | 类型       | 含义                                                                                                                   |
| ------------------ | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 当前为 `local-file-with-env`。                                                                                         |
| `fileEnvVar`       | 否   | `string`   | 包含显式凭证文件路径的环境变量。                                                                                       |
| `fallbackPaths`    | 否   | `string[]` | 当 `fileEnvVar` 缺失或为空时检查的本地凭证文件路径。支持 `${HOME}` 和 `${APPDATA}`。                                   |
| `requiresAnyEnv`   | 否   | `string[]` | 在证据有效之前，列出的环境变量中至少一个必须非空。                                                                     |
| `requiresAllEnv`   | 否   | `string[]` | 在证据有效之前，列出的每个环境变量都必须非空。                                                                         |
| `credentialMarker` | 是   | `string`   | 证据存在时返回的非密钥标记。                                                                                           |
| `source`           | 否   | `string`   | 用于身份验证/状态输出的面向用户的来源标签。                                                                            |

### 设置字段

| 字段               | 必填 | 类型       | 含义                                                                                                      |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 设置和新手引导期间公开的提供商设置描述符。                                                                |
| `cliBackends`      | 否   | `string[]` | 设置时用于描述符优先设置查找的后端 ID。保持规范化 ID 在全局唯一。                                         |
| `configMigrations` | 否   | `string[]` | 此插件的设置表面拥有的配置迁移 ID。                                                                       |
| `requiresRuntime`  | 否   | `boolean`  | 描述符查找后，设置是否仍需要执行 `setup-api`。                                                            |

## `uiHints` 参考

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

| 字段          | 类型       | 含义                       |
| ------------- | ---------- | -------------------------- |
| `label`       | `string`   | 面向用户的字段标签。       |
| `help`        | `string`   | 简短辅助文本。             |
| `tags`        | `string[]` | 可选 UI 标签。             |
| `advanced`    | `boolean`  | 将字段标记为高级。         |
| `sensitive`   | `boolean`  | 将字段标记为密钥或敏感。   |
| `placeholder` | `string`   | 表单输入的占位文本。       |

## `contracts` 参考

仅将 `contracts` 用于静态能力所有权元数据，OpenClaw 可以在不导入插件运行时的情况下读取这些元数据。

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

| 字段                             | 类型       | 含义                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 扩展工厂 ID，当前为 `codex-app-server`。              |
| `agentToolResultMiddleware`      | `string[]` | 内置插件可为其注册工具结果中间件的运行时 ID。                         |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部身份验证配置文件钩子的提供商 ID。                     |
| `speechProviders`                | `string[]` | 此插件拥有的语音提供商 ID。                                           |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 ID。                                       |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音提供商 ID。                                       |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的记忆嵌入提供商 ID。                                       |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解提供商 ID。                                       |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成提供商 ID。                                       |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成提供商 ID。                                       |
| `webFetchProviders`              | `string[]` | 此插件拥有的 Web 获取提供商 ID。                                      |
| `webSearchProviders`             | `string[]` | 此插件拥有的 Web 搜索提供商 ID。                                      |
| `migrationProviders`             | `string[]` | 此插件为 `openclaw migrate` 拥有的导入提供商 ID。                     |
| `tools`                          | `string[]` | 此插件拥有的智能体工具名称。                                          |

`contracts.embeddedExtensionFactories` 为内置的仅限 Codex app-server 的扩展工厂保留。内置工具结果转换应改为声明 `contracts.agentToolResultMiddleware`，并使用 `api.registerAgentToolResultMiddleware(...)` 注册。外部插件不能注册工具结果中间件，因为该接缝可在模型看到高信任工具输出之前重写它。

运行时 `api.registerTool(...)` 注册必须与 `contracts.tools` 匹配。工具发现使用此列表仅加载可拥有所请求工具的插件运行时。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`。没有声明的插件仍会通过一个已弃用的兼容性回退运行，但该回退更慢，并会在迁移窗口结束后移除。

内置记忆嵌入提供商应为其公开的每个适配器 ID 声明 `contracts.memoryEmbeddingProviders`，包括 `local` 等内置适配器。独立 CLI 路径使用此清单契约，在完整 Gateway 网关运行时注册提供商之前仅加载拥有方插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解提供商具有默认模型、自动身份验证回退优先级，或在运行时加载前通用核心辅助函数需要的原生文档支持时，使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

| 字段                   | 类型                                | 含义                                                                   |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供商公开的媒体能力。                                               |
| `defaultModels`        | `Record<string, string>`            | 配置未指定模型时使用的能力到模型默认值。                               |
| `autoPriority`         | `Record<string, number>`            | 数字越小，在基于凭证的自动提供商回退中排序越靠前。                     |
| `nativeDocumentInputs` | `"pdf"[]`                           | 提供商支持的原生文档输入。                                             |

## `channelConfigs` 参考

当渠道插件需要在运行时加载前提供低成本配置元数据时，使用 `channelConfigs`。当没有可用的设置条目，或 `setup.requiresRuntime: false` 声明设置不需要运行时时，只读渠道设置/状态发现可以直接使用此元数据处理已配置的外部渠道。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置部分。用户仍在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 读取清单元数据，以在插件运行时代码执行前判断哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明 `channels[]` 的非内置插件也应声明匹配的 `channelConfigs` 条目。没有它们，OpenClaw 仍可加载该插件，但冷路径配置 schema、设置和 Control UI 表面在插件运行时执行前无法知道该渠道拥有的选项形状。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以为在渠道运行时加载前运行的命令配置检查声明静态 `auto` 默认值。内置渠道也可以通过 `package.json#openclaw.channel.commands` 与其其他包拥有的渠道目录元数据一起发布相同默认值。

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

| 字段          | 类型                     | 含义                                                                                   |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个声明的渠道配置条目都必须提供。                    |
| `uiHints`     | `Record<string, object>` | 该渠道配置部分的可选 UI 标签、占位符和敏感信息提示。                                  |
| `label`       | `string`                 | 当运行时元数据尚未就绪时，合并到选择器和检查界面的渠道标签。                         |
| `description` | `string`                 | 用于检查和目录界面的简短渠道描述。                                                     |
| `commands`    | `object`                 | 用于运行时前配置检查的静态原生命令和原生技能自动默认值。                              |
| `preferOver`  | `string[]`               | 该渠道在选择界面中应优先于的旧版或低优先级插件 ID。                                  |

### 替换另一个渠道插件

当你的插件是某个渠道 ID 的首选拥有者，而另一个插件也可以提供该渠道时，
使用 `preferOver`。常见情况包括重命名后的插件 ID、取代内置插件的独立插件，
或为了配置兼容性而保留相同渠道 ID 的维护分支。

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

配置 `channels.chat` 时，OpenClaw 会同时考虑渠道 ID 和首选插件 ID。
如果低优先级插件只是因为内置或默认启用而被选中，OpenClaw 会在有效的
运行时配置中禁用它，这样一个插件就拥有该渠道及其工具。显式用户选择
仍然优先：如果用户显式启用了两个插件，OpenClaw 会保留该选择，并报告
重复渠道或工具诊断，而不是静默更改请求的插件集合。

将 `preferOver` 限定在确实可以提供相同渠道的插件 ID 范围内。它不是通用的
优先级字段，也不会重命名用户配置键。

## modelSupport 参考

当 OpenClaw 应该在插件运行时加载之前，根据 `gpt-5.5` 或 `claude-sonnet-4.6`
这类简写模型 ID 推断你的提供商插件时，使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用以下优先级：

- 显式 `provider/model` 引用使用所属 `providers` manifest 元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，非内置插件胜出
- 剩余歧义会被忽略，直到用户或配置指定提供商

字段：

| 字段            | 类型       | 含义                                                                   |
| --------------- | ---------- | ---------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 ID 匹配的前缀。                           |
| `modelPatterns` | `string[]` | 移除 profile 后缀后，与简写模型 ID 匹配的正则表达式源。                |

## modelCatalog 参考

当 OpenClaw 应该在加载插件运行时之前了解提供商模型元数据时，使用 `modelCatalog`。
这是由 manifest 拥有的固定目录行、提供商别名、抑制规则和发现模式来源。
运行时刷新仍属于提供商运行时代码，但 manifest 会告诉核心何时需要运行时。

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

| 字段           | 类型                                                     | 含义                                                                                                     |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此插件拥有的提供商 ID 对应的目录行。键也应出现在顶层 `providers` 中。                                   |
| `aliases`      | `Record<string, object>`                                 | 在目录或抑制规划中应解析为所属提供商的提供商别名。                                                       |
| `suppressions` | `object[]`                                               | 此插件因提供商特定原因而抑制的来自另一来源的模型行。                                                     |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供商目录是可以从 manifest 元数据读取、刷新到缓存，还是需要运行时。                                    |

`aliases` 参与模型目录规划中的提供商归属查找。别名目标必须是同一插件拥有的
顶层提供商。当按提供商筛选的列表使用别名时，OpenClaw 可以读取所属 manifest，
并在不加载提供商运行时的情况下应用别名 API 和基础 URL 覆盖。
别名不会扩展未筛选的目录列表；宽泛列表只会发出所属规范提供商行。

`suppressions` 取代旧的提供商运行时 `suppressBuiltInModel` 钩子。
只有当提供商由该插件拥有，或声明为指向所属提供商的 `modelCatalog.aliases`
键时，抑制条目才会生效。模型解析期间不再调用运行时抑制钩子。

提供商字段：

| 字段      | 类型                     | 含义                                                       |
| --------- | ------------------------ | ---------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供商目录中模型的可选默认基础 URL。                    |
| `api`     | `ModelApi`               | 此提供商目录中模型的可选默认 API 适配器。                 |
| `headers` | `Record<string, string>` | 应用于此提供商目录的可选静态标头。                        |
| `models`  | `object[]`               | 必需的模型行。没有 `id` 的行会被忽略。                    |

模型字段：

| 字段            | 类型                                                           | 含义                                                                        |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 提供商本地模型 ID，不含 `provider/` 前缀。                                  |
| `name`          | `string`                                                       | 可选显示名称。                                                              |
| `api`           | `ModelApi`                                                     | 可选的单模型 API 覆盖。                                                     |
| `baseUrl`       | `string`                                                       | 可选的单模型基础 URL 覆盖。                                                 |
| `headers`       | `Record<string, string>`                                       | 可选的单模型静态标头。                                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模态。                                                            |
| `reasoning`     | `boolean`                                                      | 模型是否暴露 reasoning 行为。                                                |
| `contextWindow` | `number`                                                       | 原生提供商上下文窗口。                                                      |
| `contextTokens` | `number`                                                       | 当不同于 `contextWindow` 时，可选的有效运行时上下文上限。                  |
| `maxTokens`     | `number`                                                       | 已知时的最大输出 token 数。                                                  |
| `cost`          | `object`                                                       | 可选的每百万 token 美元价格，包括可选的 `tieredPricing`。                  |
| `compat`        | `object`                                                       | 与 OpenClaw 模型配置兼容性匹配的可选兼容性标志。                           |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅当该行完全不应出现时才抑制。                                   |
| `statusReason`  | `string`                                                       | 随非可用状态显示的可选原因。                                                |
| `replaces`      | `string[]`                                                     | 此模型取代的较旧提供商本地模型 ID。                                        |
| `replacedBy`    | `string`                                                       | 已弃用行的替代提供商本地模型 ID。                                          |
| `tags`          | `string[]`                                                     | 选择器和筛选器使用的稳定标签。                                              |

抑制字段：

| 字段                       | 类型       | 含义                                                                                                     |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游行的提供商 ID。必须由此插件拥有，或声明为所属别名。                                         |
| `model`                    | `string`   | 要抑制的提供商本地模型 ID。                                                                              |
| `reason`                   | `string`   | 直接请求被抑制行时显示的可选消息。                                                                       |
| `when.baseUrlHosts`        | `string[]` | 抑制生效前所需的有效提供商基础 URL 主机可选列表。                                                       |
| `when.providerConfigApiIn` | `string[]` | 抑制生效前所需的精确提供商配置 `api` 值可选列表。                                                       |

不要将仅运行时数据放入 `modelCatalog`。只有当清单行足够完整，能让按提供商筛选的列表和选择器界面跳过注册表/运行时发现时，才使用 `static`。当清单行可作为有用的可列出种子或补充，但之后的刷新/缓存可以添加更多行时，使用 `refreshable`；可刷新的行本身并不具备权威性。当 OpenClaw 必须加载提供商运行时才能知道列表时，使用 `runtime`。

## modelIdNormalization 参考

使用 `modelIdNormalization` 进行低成本、由提供商拥有的模型 ID 清理，并且该清理必须在提供商运行时加载之前发生。这样可以把短模型名称、提供商本地旧 ID、代理前缀规则等别名保留在所属插件清单中，而不是放进核心模型选择表。

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
| `aliases`                            | `Record<string,string>` | 不区分大小写的精确模型 ID 别名。值会按原样返回。                                         |
| `stripPrefixes`                      | `string[]`              | 在别名查找前移除的前缀，适用于旧版提供商/模型重复场景。                                  |
| `prefixWhenBare`                     | `string`                | 当规范化后的模型 ID 尚未包含 `/` 时添加的前缀。                                          |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 别名查找后的条件裸 ID 前缀规则，以 `modelPrefix` 和 `prefix` 为键。                       |

## providerEndpoints 参考

使用 `providerEndpoints` 提供端点分类，让通用请求策略在提供商运行时加载之前即可了解。核心仍然拥有每个 `endpointClass` 的含义；插件清单拥有主机和基础 URL 元数据。

端点字段：

| 字段                           | 类型       | 含义                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知核心端点类别，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。                    |
| `hosts`                        | `string[]` | 映射到该端点类别的精确主机名。                                                                 |
| `hostSuffixes`                 | `string[]` | 映射到该端点类别的主机后缀。使用 `.` 前缀表示仅按域名后缀匹配。                               |
| `baseUrls`                     | `string[]` | 映射到该端点类别的精确规范化 HTTP(S) 基础 URL。                                                |
| `googleVertexRegion`           | `string`   | 精确全局主机的静态 Google Vertex 区域。                                                        |
| `googleVertexRegionHostSuffix` | `string`   | 从匹配主机中剥离的后缀，用于暴露 Google Vertex 区域前缀。                                     |

## providerRequest 参考

使用 `providerRequest` 提供低成本的请求兼容性元数据，供通用请求策略在不加载提供商运行时的情况下使用。将特定行为的载荷重写保留在提供商运行时钩子或共享的提供商家族辅助函数中。

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

| 字段                  | 类型         | 含义                                                                           |
| --------------------- | ------------ | ------------------------------------------------------------------------------ |
| `family`              | `string`     | 通用请求兼容性决策和诊断使用的提供商家族标签。                                 |
| `compatibilityFamily` | `"moonshot"` | 可选的提供商家族兼容性分组，用于共享请求辅助函数。                             |
| `openAICompletions`   | `object`     | 与 OpenAI 兼容的补全请求标志，目前为 `supportsStreamingUsage`。                |

## modelPricing 参考

当提供商需要在运行时加载之前控制控制平面的定价行为时，使用 `modelPricing`。Gateway 网关定价缓存会读取这些元数据，而无需导入提供商运行时代码。

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

| 字段         | 类型              | 含义                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 对于绝不应获取 OpenRouter 或 LiteLLM 定价的本地/自托管提供商，设为 `false`。                      |
| `openRouter` | `false \| object` | OpenRouter 定价查询映射。`false` 会禁用该提供商的 OpenRouter 查询。                               |
| `liteLLM`    | `false \| object` | LiteLLM 定价查询映射。`false` 会禁用该提供商的 LiteLLM 查询。                                     |

来源字段：

| 字段                       | 类型               | 含义                                                                                                                |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 当外部目录提供商 ID 与 OpenClaw 提供商 ID 不同时使用，例如 `zai` 提供商对应的 `z-ai`。                              |
| `passthroughProviderModel` | `boolean`          | 将包含斜杠的模型 ID 视为嵌套的提供商/模型引用，适用于 OpenRouter 等代理提供商。                                     |
| `modelIdTransforms`        | `"version-dots"[]` | 额外的外部目录模型 ID 变体。`version-dots` 会尝试带点的版本 ID，例如 `claude-opus-4.6`。                            |

### OpenClaw 提供商索引

OpenClaw 提供商索引是 OpenClaw 拥有的预览元数据，用于插件可能尚未安装的提供商。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。提供商索引是内部回退契约，未来的可安装提供商和安装前模型选择器界面会在提供商插件未安装时使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单 `modelCatalog`。
3. 显式刷新得到的模型目录缓存。
4. OpenClaw 提供商索引预览行。

提供商索引不得包含密钥、启用状态、运行时钩子或实时账号特定模型数据。其预览目录使用与插件清单相同的 `modelCatalog` 提供商行形状，但应限制为稳定的显示元数据，除非有意让 `api`、`baseUrl`、定价或兼容性标志等运行时适配器字段与已安装插件清单保持一致。具有实时 `/models` 发现能力的提供商，应通过显式模型目录缓存路径写入刷新后的行，而不是让普通列表或新手引导调用提供商 API。

提供商索引条目也可以携带可安装插件元数据，用于插件已移出核心或尚未安装的提供商。该元数据镜像渠道目录模式：包名、npm 安装规范、预期完整性以及低成本的认证选择标签，足以展示一个可安装设置选项。插件安装后，其清单优先，该提供商的提供商索引条目会被忽略。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 下；普通清单加载不再将这些顶层字段视为能力归属。

## 清单与 package.json

这两个文件承担不同职责：

| 文件                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 发现、配置验证、认证选择元数据，以及必须在插件代码运行前存在的 UI 提示                                                           |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 区块                                               |

如果你不确定某段元数据应该放在哪里，请使用这条规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，就放入 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就放入 `package.json`

### 影响发现的 package.json 字段

一些运行时前插件元数据会有意放在 `package.json` 的 `openclaw` 区块下，而不是放在 `openclaw.plugin.json` 中。

重要示例：

| 字段                                                              | 含义                                                                                                                                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 声明原生插件入口点。必须保留在插件包目录内。                                                                                                                                        |
| `openclaw.runtimeExtensions`                                      | 为已安装包声明已构建的 JavaScript 运行时入口点。必须保留在插件包目录内。                                                                                                           |
| `openclaw.setupEntry`                                             | 轻量级、仅用于设置的入口点，用于新手引导、延迟渠道启动，以及只读渠道 Status/SecretRef 发现。必须保留在插件包目录内。                                                               |
| `openclaw.runtimeSetupEntry`                                      | 为已安装包声明已构建的 JavaScript 设置入口点。需要 `setupEntry`，必须存在，并且必须保留在插件包目录内。                                                                            |
| `openclaw.channel`                                                | 低成本渠道目录元数据，例如标签、文档路径、别名和选择文案。                                                                                                                          |
| `openclaw.channel.commands`                                       | 静态原生命令和原生 Skills 自动默认元数据，在渠道运行时加载前供配置、审计和命令列表界面使用。                                                                                       |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，可以在不加载完整渠道运行时的情况下回答“是否已经存在仅环境变量的设置？”。                                                                              |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化凭证检查器元数据，可以在不加载完整渠道运行时的情况下回答“是否已有任何登录状态？”。                                                                                      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 内置插件和外部发布插件的安装/更新提示。                                                                                                                                             |
| `openclaw.install.defaultChoice`                                  | 有多个安装来源可用时首选的安装路径。                                                                                                                                                |
| `openclaw.install.minHostVersion`                                 | 支持的最低 OpenClaw 主机版本，使用类似 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                                                        |
| `openclaw.install.expectedIntegrity`                              | 预期的 npm 发行完整性字符串，例如 `sha512-...`；安装和更新流程会用它校验获取到的工件。                                                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | 在配置无效时，允许一个范围很窄的内置插件重新安装恢复路径。                                                                                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许仅设置用途的渠道界面在启动期间先于完整渠道插件加载。                                                                                                                            |

Manifest 元数据决定运行时加载前，新手引导中会显示哪些提供商/渠道/设置选项。`package.json#openclaw.install` 会告诉新手引导，当用户选择其中一个选项时如何获取或启用该插件。不要把安装提示移到 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 会在安装和非内置插件来源的 Manifest 注册表加载期间强制执行。无效值会被拒绝；较新但有效的值会让旧主机跳过外部插件。内置源插件会被假定与主机检出版本一致。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确规格与 `expectedIntegrity` 配对，这样如果获取到的 npm 工件不再匹配固定版本，更新流程会以关闭失败的方式处理。为了兼容性，交互式新手引导仍会提供受信任注册表中的 npm 规格，包括裸包名和 dist-tag。目录诊断可以区分精确来源、浮动来源、完整性固定来源、缺少完整性的来源、包名不匹配来源，以及无效默认选择来源。它们还会在存在 `expectedIntegrity` 但没有可由其固定的有效 npm 来源时发出警告。当存在 `expectedIntegrity` 时，安装/更新流程会强制校验它；当省略它时，会记录注册表解析结果，但不带完整性固定。

当 Status、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账号时，渠道插件应提供 `openclaw.setupEntry`。设置入口应暴露渠道元数据，以及对设置安全的配置、状态和密钥适配器；将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让逃逸的 `openclaw.extensions` 路径变为可加载。

`openclaw.install.allowInvalidConfigRecovery` 的范围有意保持很窄。它不会让任意损坏配置变得可安装。目前，它只允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺少内置插件路径，或同一个内置插件存在陈旧的 `channels.<id>` 条目。不相关的配置错误仍会阻止安装，并将操作员引导到 `openclaw doctor --fix`。

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

当设置、Doctor、Status 或只读存在性流程需要在完整渠道插件加载前进行低成本的是/否凭证探测时使用它。持久化凭证状态不是已配置渠道状态：不要使用此元数据自动启用插件、修复运行时依赖，或决定是否应加载某个渠道运行时。目标导出应是一个只读取持久化状态的小函数；不要通过完整渠道运行时 barrel 来路由它。

`openclaw.channel.configuredState` 对低成本的仅环境变量已配置检查使用相同结构：

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

当渠道可以从环境变量或其他很小的非运行时输入回答已配置状态时使用它。如果检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` 钩子中。

## 设备发现优先级（重复插件 ID）

OpenClaw 会从多个根位置发现插件（内置、全局安装、工作区、显式配置选择的路径）。如果两个发现结果共享同一个 `id`，只保留**最高优先级**的 Manifest；较低优先级的重复项会被丢弃，而不是并排加载。

优先级从高到低：

1. **配置选择**——在 `plugins.entries.<id>` 中显式固定的路径
2. **内置**——随 OpenClaw 一起提供的插件
3. **全局安装**——安装到全局 OpenClaw 插件根目录的插件
4. **工作区**——相对于当前工作区发现的插件

影响：

- 放在工作区中的内置插件分叉副本或陈旧副本不会遮蔽内置构建。
- 若要真正用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使其凭借优先级获胜，而不是依赖工作区发现。
- 重复项丢弃会记录到日志中，因此 Doctor 和启动诊断可以指向被丢弃的副本。
- 配置选择的重复覆盖会在诊断中表述为显式覆盖，但仍会发出警告，以便陈旧分叉和意外遮蔽保持可见。

## JSON Schema 要求

- **每个插件都必须随附 JSON Schema**，即使它不接受任何配置。
- 空 schema 是可以接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读写时校验，而不是在运行时校验。
- 当扩展或分叉带有新配置键的内置插件时，请同时更新该插件的 `openclaw.plugin.json` `configSchema`。内置插件 schema 是严格的，因此如果在用户配置中添加 `plugins.entries.<id>.config.myNewKey`，但没有把 `myNewKey` 添加到 `configSchema.properties`，则会在插件运行时加载前被拒绝。

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

## 校验行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 ID 由插件 Manifest 声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 ID。未知 ID 是**错误**。
- 如果插件已安装，但 Manifest 或 schema 损坏或缺失，校验会失败，Doctor 会报告插件错误。
- 如果插件配置存在但插件被**禁用**，配置会被保留，并且 Doctor + 日志中会显示**警告**。

完整的 `plugins.*` schema 见[配置参考](/zh-CN/gateway/configuration)。

## 注释

- 清单对**原生 OpenClaw 插件**是必需的，包括从本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍是对象，就接受注释、尾随逗号和未加引号的键。
- 清单加载器只读取已文档化的清单字段。避免自定义顶层键。
- 当插件不需要时，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；将它用于静态提供商目录元数据或范围较窄的设备发现描述符，而不是请求时执行。
- 独占插件类型通过 `plugins.slots.*` 选择：通过 `plugins.slots.memory` 选择 `kind: "memory"`，通过 `plugins.slots.contextEngine` 选择 `kind: "context-engine"`（默认 `legacy`）。
- 在此清单中声明独占插件类型。运行时入口 `OpenClawPluginDefinition.kind` 已弃用，仅作为旧插件的兼容性回退保留。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅为声明式。Status、审计、cron 交付验证和其他只读界面在将环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 对于需要提供商代码的运行时向导元数据，请参阅 [Provider runtime hooks](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

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
