---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布插件配置模式或调试插件验证错误
summary: 插件清单 + JSON 架构要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-05-02T02:49:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fb98614783b679d6b49d2237148765708e5c5fc2ee40162d3ddd4752f763c2
    source_path: plugins/manifest.md
    workflow: 16
---

此页面仅适用于 **OpenClaw 原生插件清单**。

有关兼容的包布局，请参阅 [插件包](/zh-CN/plugins/bundles)。

兼容包格式使用不同的清单文件：

- Codex 包：`.codex-plugin/plugin.json`
- Claude 包：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件
  布局
- Cursor 包：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些包布局，但不会根据此处描述的 `openclaw.plugin.json` schema
对它们进行验证。

对于兼容包，当布局符合 OpenClaw 运行时预期时，OpenClaw 目前会读取包元数据、声明的
skill 根目录、Claude 命令根目录、Claude 包 `settings.json` 默认值、
Claude 包 LSP 默认值，以及受支持的 hook packs。

每个原生 OpenClaw 插件**必须**在**插件根目录**中附带一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并会阻止配置验证。

参阅完整插件系统指南：[插件](/zh-CN/tools/plugin)。
有关原生能力模型和当前外部兼容性指南：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，能够在不启动插件运行时的情况下检查。

**将它用于：**

- 插件身份、配置验证和配置 UI 提示
- 凭证、新手引导和设置元数据（别名、自动启用、提供商环境变量、凭证选项）
- 控制平面界面的激活提示
- 简写模型系列归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` host 可检查的 QA runner 元数据
- 合并到目录和验证界面的渠道专用配置元数据

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

| 字段                                 | 必填 | 类型                             | 含义                                                                                                                                                                                                                             |
| ------------------------------------ | ---- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是   | `string`                         | 规范插件 id。这是在 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                                         |
| `configSchema`                       | 是   | `object`                         | 此插件配置的内联 JSON Schema。                                                                                                                                                                                                   |
| `enabledByDefault`                   | 否   | `true`                           | 将内置插件标记为默认启用。省略它，或设置任意非 `true` 值，可让插件默认保持禁用。                                                                                                                                                |
| `legacyPluginIds`                    | 否   | `string[]`                       | 会规范化为此规范插件 id 的旧版 id。                                                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | 否   | `string[]`                       | 当凭证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。                                                                                                                                                                  |
| `kind`                               | 否   | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的独占插件类型。                                                                                                                                                                                    |
| `channels`                           | 否   | `string[]`                       | 此插件拥有的渠道 id。用于设备发现和配置验证。                                                                                                                                                                                   |
| `providers`                          | 否   | `string[]`                       | 此插件拥有的提供商 id。                                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | 否   | `string`                         | 轻量级提供商发现模块路径，相对于插件根目录，用于清单作用域内的提供商目录元数据，可在不激活完整插件运行时的情况下加载。                                                                                                         |
| `modelSupport`                       | 否   | `object`                         | 清单拥有的简写模型系列元数据，用于在运行时之前自动加载插件。                                                                                                                                                                    |
| `modelCatalog`                       | 否   | `object`                         | 此插件拥有的提供商的声明式模型目录元数据。这是未来只读列表、新手引导、模型选择器、别名和抑制功能的控制平面契约，无需加载插件运行时。                                                                                           |
| `modelPricing`                       | 否   | `object`                         | 提供商拥有的外部定价查询策略。用它让本地/自托管提供商退出远程定价目录，或将提供商引用映射到 OpenRouter/LiteLLM 目录 id，而无需在核心中硬编码提供商 id。                                                                        |
| `modelIdNormalization`               | 否   | `object`                         | 提供商拥有的模型 id 别名/前缀清理，必须在提供商运行时加载前运行。                                                                                                                                                               |
| `providerEndpoints`                  | 否   | `object[]`                       | 清单拥有的端点 host/baseUrl 元数据，用于核心在提供商运行时加载前对提供商路由进行分类。                                                                                                                                          |
| `providerRequest`                    | 否   | `object`                         | 轻量级提供商系列和请求兼容性元数据，由通用请求策略在提供商运行时加载前使用。                                                                                                                                                    |
| `cliBackends`                        | 否   | `string[]`                       | 此插件拥有的 CLI 推理后端 id。用于从显式配置引用进行启动自动激活。                                                                                                                                                              |
| `syntheticAuthRefs`                  | 否   | `string[]`                       | 提供商或 CLI 后端引用，其插件拥有的合成凭证钩子应在运行时加载前的冷模型发现期间被探测。                                                                                                                                         |
| `nonSecretAuthMarkers`               | 否   | `string[]`                       | 内置插件拥有的占位 API key 值，表示非密钥的本地、OAuth 或环境凭据状态。                                                                                                                                                         |
| `commandAliases`                     | 否   | `object[]`                       | 此插件拥有的命令名称，应在运行时加载前生成插件感知的配置和 CLI 诊断。                                                                                                                                                           |
| `providerAuthEnvVars`                | 否   | `Record<string, string[]>`       | 已弃用的兼容性环境变量元数据，用于提供商凭证/Status 查询。新插件请优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期间仍会读取此项。                                                                                  |
| `providerAuthAliases`                | 否   | `Record<string, string>`         | 应复用另一个提供商 id 进行凭证查询的提供商 id，例如共享基础提供商 API key 和凭证配置文件的编码提供商。                                                                                                                         |
| `channelEnvVars`                     | 否   | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将此项用于由环境变量驱动的渠道设置，或通用启动/配置帮助器应看到的凭证界面。                                                                                 |
| `providerAuthChoices`                | 否   | `object[]`                       | 用于新手引导选择器、首选提供商解析和简单 CLI 标志接线的轻量级凭证选择元数据。                                                                                                                                                  |
| `activation`                         | 否   | `object`                         | 用于启动、提供商、命令、渠道、路由和能力触发加载的轻量级激活规划器元数据。仅为元数据；插件运行时仍拥有实际行为。                                                                                                               |
| `setup`                              | 否   | `object`                         | 轻量级设置/新手引导描述符，设备发现和设置界面可在不加载插件运行时的情况下检查。                                                                                                                                                 |
| `qaRunners`                          | 否   | `object[]`                       | 共享 `openclaw qa` 宿主在插件运行时加载前使用的轻量级 QA 运行器描述符。                                                                                                                                                         |
| `contracts`                          | 否   | `object`                         | 外部凭证钩子、语音、实时转写、实时语音、媒体理解、图像生成、音乐生成、视频生成、Web 获取、Web 搜索和工具所有权的静态内置能力快照。                                                                                            |
| `mediaUnderstandingProviderMetadata` | 否   | `Record<string, object>`         | 针对 `contracts.mediaUnderstandingProviders` 中声明的提供商 id 的轻量级媒体理解默认值。                                                                                                                                          |
| `channelConfigs`                     | 否   | `Record<string, object>`         | 清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和验证界面中。                                                                                                                                                           |
| `skills`                             | 否   | `string[]`                       | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                                                         |
| `name`                               | 否   | `string`                         | 人类可读的插件名称。                                                                                                                                                                                                             |
| `description`                        | 否   | `string`                         | 显示在插件界面中的简短摘要。                                                                                                                                                                                                     |
| `version`                            | 否   | `string`                         | 信息性插件版本。                                                                                                                                                                                                                 |
| `uiHints`                            | 否   | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                                        |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个新手引导或凭证选择。
OpenClaw 会在提供商运行时加载前读取此项。
提供商设置列表会使用这些清单选择、从描述符派生的设置
选择，以及安装目录元数据，而无需加载提供商运行时。

| 字段                  | 必需 | 类型                                            | 含义                                                                                                   |
| --------------------- | ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | 是   | `string`                                        | 此选项所属的提供商 ID。                                                                                |
| `method`              | 是   | `string`                                        | 要分发到的认证方法 ID。                                                                                |
| `choiceId`            | 是   | `string`                                        | 新手引导和 CLI 流程使用的稳定认证选项 ID。                                                            |
| `choiceLabel`         | 否   | `string`                                        | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。                                              |
| `choiceHint`          | 否   | `string`                                        | 用于选择器的简短辅助文本。                                                                             |
| `assistantPriority`   | 否   | `number`                                        | 数值越低，在助手驱动的交互式选择器中排序越靠前。                                                       |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 从助手选择器中隐藏该选项，同时仍允许手动 CLI 选择。                                                    |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 应将用户重定向到此替代选项的旧版选项 ID。                                                             |
| `groupId`             | 否   | `string`                                        | 用于对相关选项分组的可选分组 ID。                                                                      |
| `groupLabel`          | 否   | `string`                                        | 该分组的面向用户标签。                                                                                 |
| `groupHint`           | 否   | `string`                                        | 分组的简短辅助文本。                                                                                   |
| `optionKey`           | 否   | `string`                                        | 用于简单单标志认证流程的内部选项键。                                                                   |
| `cliFlag`             | 否   | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                            |
| `cliOption`           | 否   | `string`                                        | 完整 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                                 |
| `cliDescription`      | 否   | `string`                                        | CLI 帮助中使用的描述。                                                                                 |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。                            |

## commandAliases 参考

当插件拥有一个运行时命令名称，而用户可能会误将其放入 `plugins.allow`
或尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw
使用此元数据进行诊断，而无需导入插件运行时代码。

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

| 字段         | 必需 | 类型              | 含义                                                              |
| ------------ | ---- | ----------------- | ----------------------------------------------------------------- |
| `name`       | 是   | `string`          | 属于此插件的命令名称。                                            |
| `kind`       | 否   | `"runtime-slash"` | 将别名标记为聊天斜杠命令，而不是根 CLI 命令。                    |
| `cliCommand` | 否   | `string`          | 如果存在，用于建议 CLI 操作的相关根 CLI 命令。                   |

## activation 参考

当插件可以低成本声明哪些控制平面事件应将其包含在激活/加载计划中时，请使用 `activation`。

此块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会替代
`register(...)`，也不承诺插件代码已经执行。激活规划器使用这些字段在回退到现有清单所有权元数据
（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、
`contracts.tools` 和钩子）之前缩小候选插件范围。

优先使用已经描述所有权的最窄元数据。当 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts`
能够表达这种关系时，请使用这些字段。对于无法由这些所有权字段表示的额外规划器提示，请使用 `activation`。
对 CLI 运行时别名（例如 `claude-cli`、`codex-cli` 或 `google-gemini-cli`）使用顶层 `cliBackends`；
`activation.onAgentHarnesses` 仅用于尚无所有权字段的嵌入式智能体 harness ID。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。
当前消费者会在更广泛地加载插件之前将其用作缩小范围的提示，因此缺少非启动激活元数据通常只会影响性能；
只要清单所有权回退仍然存在，就不应改变正确性。

每个插件都应有意设置 `activation.onStartup`。仅当插件必须在 Gateway 网关启动期间运行时，才将其设为 `true`。
当插件在启动时处于惰性状态，并且只应由更窄的触发器加载时，将其设为 `false`。
省略 `onStartup` 不再会隐式启动加载该插件；请为启动、渠道、配置、智能体 harness、记忆或其他更窄的激活触发器使用显式激活元数据。

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

| 字段               | 必需 | 类型                                                 | 含义                                                                                                                                                      |
| ------------------ | ---- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 显式 Gateway 网关启动激活。每个插件都应设置此项。`true` 会在启动期间导入插件；`false` 会使其在启动时保持惰性，除非另一个匹配的触发器要求加载。            |
| `onProviders`      | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的提供商 ID。                                                                                                             |
| `onAgentHarnesses` | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的嵌入式智能体 harness 运行时 ID。对 CLI 后端别名使用顶层 `cliBackends`。                                                  |
| `onCommands`       | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的命令 ID。                                                                                                               |
| `onChannels`       | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的渠道 ID。                                                                                                               |
| `onRoutes`         | 否   | `string[]`                                           | 应将此插件包含在激活/加载计划中的路由类型。                                                                                                             |
| `onConfigPaths`    | 否   | `string[]`                                           | 当路径存在且未被显式禁用时，应将此插件包含在启动/加载计划中的根相对配置路径。                                                                            |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。尽可能优先使用更窄的字段。                                                                                           |

当前实时消费者：

- Gateway 网关启动规划使用 `activation.onStartup` 进行显式启动导入
- 命令触发的 CLI 规划会回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 智能体运行时启动规划对嵌入式 harness 使用 `activation.onAgentHarnesses`，对 CLI 运行时别名使用顶层 `cliBackends[]`
- 渠道触发的设置/渠道规划会在缺少显式渠道激活元数据时回退到旧版 `channels[]` 所有权
- 启动插件规划会对非渠道根配置界面使用 `activation.onConfigPaths`，例如内置浏览器插件的 `browser` 块
- 提供商触发的设置/运行时规划会在缺少显式提供商激活元数据时回退到旧版 `providers[]` 和顶层 `cliBackends[]` 所有权

规划器诊断可以区分显式激活提示与清单所有权回退。例如，`activation-command-hint` 表示
`activation.onCommands` 匹配，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 所有权。
这些原因标签用于主机诊断和测试；插件作者应继续声明最能描述所有权的元数据。

## qaRunners 参考

当插件在共享的 `openclaw qa` 根之下贡献一个或多个传输运行器时，请使用 `qaRunners`。
保持此元数据低成本且静态；插件运行时仍通过轻量级 `runtime-api.ts` 界面拥有实际的 CLI 注册，
该界面会导出 `qaRunnerCliRegistrations`。

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

| 字段          | 必需 | 类型     | 含义                                                               |
| ------------- | ---- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是   | `string` | 挂载在 `openclaw qa` 之下的子命令，例如 `matrix`。                 |
| `description` | 否   | `string` | 当共享主机需要存根命令时使用的回退帮助文本。                       |

## setup 参考

当设置和新手引导界面需要在运行时加载之前获取低成本的插件自有元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推断后端。`setup.cliBackends` 是用于控制平面/设置流程的设置专用描述符表面，这些流程应保持仅元数据。

存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现首选的描述符优先查找表面。如果描述符只缩小候选插件范围，而设置仍需要更丰富的设置期运行时钩子，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会在通用提供商认证和环境变量查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用窗口期间仍通过兼容适配器受支持，但仍使用它的非内置插件会收到清单诊断。新插件应将设置/Status 环境元数据放在 `setup.providers[].envVars` 上。

当没有可用的设置条目，或 `setup.requiresRuntime: false` 声明不需要设置运行时时，OpenClaw 也可以从 `setup.providers[].authMethods` 推导简单的设置选项。对于自定义标签、CLI 标志、新手引导范围和助手元数据，显式 `providerAuthChoices` 条目仍是首选。

仅当这些描述符足以支撑设置表面时，才设置 `requiresRuntime: false`。OpenClaw 会将显式 `false` 视为仅描述符契约，并且不会为了设置查找而执行 `setup-api` 或 `openclaw.setupEntry`。如果仅描述符插件仍随附这些设置运行时条目之一，OpenClaw 会报告一条附加诊断并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，因此已添加描述符但未添加该标志的现有插件不会中断。

由于设置查找可以执行插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在已发现插件之间保持唯一。所有权不明确时会失败关闭，而不是从发现顺序中选出胜者。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的提供商或 CLI 后端，或如果某个描述符没有匹配的运行时注册，设置注册表诊断会报告描述符漂移。这些诊断是附加的，不会拒绝旧版插件。

### setup.providers 参考

| 字段           | 必需 | 类型       | 含义                                                                                             |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | 是   | `string`   | 设置或新手引导期间公开的提供商 ID。保持规范化 ID 全局唯一。                                     |
| `authMethods`  | 否   | `string[]` | 此提供商在不加载完整运行时的情况下支持的设置/认证方法 ID。                                      |
| `envVars`      | 否   | `string[]` | 通用设置/Status 表面可在插件运行时加载前检查的环境变量。                                        |
| `authEvidence` | 否   | `object[]` | 针对可通过非机密标记进行认证的提供商的低成本本地认证证据检查。                                 |

`authEvidence` 用于提供商拥有的本地凭据标记，可在不加载运行时代码的情况下验证。这些检查必须保持低成本且本地：不进行网络调用，不读取钥匙串或密钥管理器，不执行 shell 命令，也不探测提供商 API。

支持的证据条目：

| 字段               | 必需 | 类型       | 含义                                                                                                      |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 当前为 `local-file-with-env`。                                                                            |
| `fileEnvVar`       | 否   | `string`   | 包含显式凭据文件路径的环境变量。                                                                          |
| `fallbackPaths`    | 否   | `string[]` | 当 `fileEnvVar` 缺失或为空时检查的本地凭据文件路径。支持 `${HOME}` 和 `${APPDATA}`。                      |
| `requiresAnyEnv`   | 否   | `string[]` | 在证据有效前，列出的环境变量中至少一个必须非空。                                                          |
| `requiresAllEnv`   | 否   | `string[]` | 在证据有效前，列出的每个环境变量都必须非空。                                                              |
| `credentialMarker` | 是   | `string`   | 当证据存在时返回的非机密标记。                                                                            |
| `source`           | 否   | `string`   | 用于认证/Status 输出的面向用户来源标签。                                                                  |

### setup 字段

| 字段               | 必需 | 类型       | 含义                                                                                              |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 设置和新手引导期间公开的提供商设置描述符。                                                        |
| `cliBackends`      | 否   | `string[]` | 用于描述符优先设置查找的设置期后端 ID。保持规范化 ID 全局唯一。                                  |
| `configMigrations` | 否   | `string[]` | 此插件设置表面拥有的配置迁移 ID。                                                                 |
| `requiresRuntime`  | 否   | `boolean`  | 设置在描述符查找后是否仍需要执行 `setup-api`。                                                     |

## uiHints 参考

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

| 字段          | 类型       | 含义                         |
| ------------- | ---------- | ---------------------------- |
| `label`       | `string`   | 面向用户的字段标签。         |
| `help`        | `string`   | 简短帮助文本。               |
| `tags`        | `string[]` | 可选 UI 标签。               |
| `advanced`    | `boolean`  | 将字段标记为高级。           |
| `sensitive`   | `boolean`  | 将字段标记为机密或敏感。     |
| `placeholder` | `string`   | 表单输入的占位符文本。       |

## contracts 参考

仅将 `contracts` 用于 OpenClaw 可在不导入插件运行时的情况下读取的静态能力所有权元数据。

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

| 字段                             | 类型       | 含义                                                                      |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex 应用服务器扩展工厂 ID，当前为 `codex-app-server`。                  |
| `agentToolResultMiddleware`      | `string[]` | 内置插件可为其注册工具结果中间件的运行时 ID。                             |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部认证配置文件钩子的提供商 ID。                             |
| `speechProviders`                | `string[]` | 此插件拥有的语音提供商 ID。                                                |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 ID。                                            |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音提供商 ID。                                            |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的记忆嵌入提供商 ID。                                            |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解提供商 ID。                                            |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成提供商 ID。                                            |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成提供商 ID。                                            |
| `webFetchProviders`              | `string[]` | 此插件拥有的 Web 获取提供商 ID。                                           |
| `webSearchProviders`             | `string[]` | 此插件拥有的 Web 搜索提供商 ID。                                           |
| `migrationProviders`             | `string[]` | 此插件为 `openclaw migrate` 拥有的导入提供商 ID。                         |
| `tools`                          | `string[]` | 此插件为内置契约检查拥有的智能体工具名称。                                 |

`contracts.embeddedExtensionFactories` 保留给仅用于内置 Codex 应用服务器的扩展工厂。内置工具结果转换应声明 `contracts.agentToolResultMiddleware`，并改用 `api.registerAgentToolResultMiddleware(...)` 注册。外部插件无法注册工具结果中间件，因为该接缝可以在模型看到高信任度工具输出之前重写它。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`。没有该声明的插件仍会通过已弃用的兼容回退运行，但该回退更慢，并将在迁移窗口之后移除。

内置记忆嵌入提供商应为其公开的每个适配器 ID 声明 `contracts.memoryEmbeddingProviders`，包括 `local` 等内置适配器。独立 CLI 路径会使用此清单契约，在完整 Gateway 网关运行时注册提供商之前，仅加载拥有它的插件。

## mediaUnderstandingProviderMetadata 参考

当媒体理解提供商具有默认模型、自动认证回退优先级，或通用核心助手需要在运行时加载前获知的原生文档支持时，使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

| 字段                   | 类型                                | 含义                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供商公开的媒体能力。                                                     |
| `defaultModels`        | `Record<string, string>`            | 配置未指定模型时使用的能力到模型默认值。                                     |
| `autoPriority`         | `Record<string, number>`            | 数字越小，在基于凭证的自动提供商回退中排序越靠前。                           |
| `nativeDocumentInputs` | `"pdf"[]`                           | 提供商支持的原生文档输入。                                                   |

## channelConfigs 参考

当渠道插件需要在运行时加载前获取轻量配置元数据时，使用 `channelConfigs`。
当没有可用的设置入口，或 `setup.requiresRuntime: false` 声明不需要设置运行时时，只读渠道设置/Status 发现可以直接将此元数据用于已配置的外部渠道。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置
章节。用户仍然在 `channels.<channel-id>` 下配置渠道实例。
OpenClaw 会读取清单元数据，以便在插件运行时代码执行前决定哪个插件拥有该已配置
渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述不同的
路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明 `channels[]` 的非内置插件也应声明匹配的
`channelConfigs` 条目。没有它们时，OpenClaw 仍然可以加载插件，但
冷路径配置架构、设置和 Control UI 表面无法在插件运行时执行前知道
渠道拥有的选项形状。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和
`nativeSkillsAutoEnabled` 可以为命令配置检查声明静态 `auto` 默认值，这些检查会在渠道运行时加载前运行。内置渠道也可以通过 `package.json#openclaw.channel.commands` 发布相同默认值，并与其他由包拥有的渠道目录元数据一起发布。

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

| 字段          | 类型                     | 含义                                                                                       |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个声明的渠道配置条目都需要它。                           |
| `uiHints`     | `Record<string, object>` | 该渠道配置章节的可选 UI 标签/占位符/敏感提示。                                             |
| `label`       | `string`                 | 运行时元数据尚未就绪时，合并到选择器和检查表面的渠道标签。                                 |
| `description` | `string`                 | 用于检查和目录表面的简短渠道说明。                                                         |
| `commands`    | `object`                 | 用于运行时前配置检查的静态原生命令和原生 skill 自动默认值。                                |
| `preferOver`  | `string[]`               | 此渠道在选择表面中应优先于的旧版或较低优先级插件 id。                                      |

### 替换另一个渠道插件

当你的插件是某个渠道 id 的首选拥有者，而另一个插件也可以提供该渠道时，使用 `preferOver`。常见情况包括重命名的插件 id、取代内置插件的独立插件，或为了配置兼容性而保留相同渠道 id 的维护分支。

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

当配置了 `channels.chat` 时，OpenClaw 会同时考虑渠道 id 和
首选插件 id。如果较低优先级插件只是因为它是内置插件或默认启用而被选中，OpenClaw 会在有效
运行时配置中禁用它，这样一个插件就拥有该渠道及其工具。显式用户
选择仍然优先：如果用户显式启用两个插件，OpenClaw 会
保留该选择，并报告重复渠道/工具诊断，而不是
静默更改请求的插件集。

将 `preferOver` 的作用范围限制在确实能够提供相同渠道的插件 id。
它不是通用优先级字段，也不会重命名用户配置键。

## modelSupport 参考

当 OpenClaw 应在插件运行时加载前，根据 `gpt-5.5` 或 `claude-sonnet-4.6` 等简写模型 id 推断你的提供商插件时，使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用以下优先级：

- 显式 `provider/model` 引用使用拥有它的 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置
  插件胜出
- 剩余的歧义会被忽略，直到用户或配置指定提供商

字段：

| 字段            | 类型       | 含义                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 id 匹配的前缀。                         |
| `modelPatterns` | `string[]` | 移除 profile 后缀后，与简写模型 id 匹配的正则表达式源。              |

## modelCatalog 参考

当 OpenClaw 应在加载插件运行时前了解提供商模型元数据时，使用 `modelCatalog`。这是固定目录行、提供商别名、抑制规则和发现模式的清单拥有来源。运行时刷新仍然属于提供商运行时代码，但清单会告诉 core 何时需要运行时。

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

| 字段           | 类型                                                     | 含义                                                                                                      |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此插件拥有的提供商 id 的目录行。键也应出现在顶层 `providers` 中。                                         |
| `aliases`      | `Record<string, object>`                                 | 应解析为已拥有提供商的提供商别名，用于目录或抑制规划。                                                    |
| `suppressions` | `object[]`                                               | 此插件因提供商特定原因而抑制的来自其他来源的模型行。                                                      |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供商目录是否可从清单元数据读取、刷新到缓存，或需要运行时。                                              |

`aliases` 参与模型目录规划的提供商所有权查找。
别名目标必须是同一插件拥有的顶层提供商。当一个
按提供商过滤的列表使用别名时，OpenClaw 可以读取拥有它的清单，并
应用别名 API/base URL 覆盖，而无需加载提供商运行时。
别名不会展开未过滤的目录列表；宽泛列表只发出拥有它的
规范提供商行。

`suppressions` 替代旧的提供商运行时 `suppressBuiltInModel` 钩子。
只有当提供商由该插件拥有，或声明为 `modelCatalog.aliases` 键并指向已拥有提供商时，抑制条目才会被遵循。模型解析期间不再调用运行时
抑制钩子。

提供商字段：

| 字段      | 类型                     | 含义                                                       |
| --------- | ------------------------ | ---------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供商目录中模型的可选默认 base URL。                   |
| `api`     | `ModelApi`               | 此提供商目录中模型的可选默认 API 适配器。                 |
| `headers` | `Record<string, string>` | 应用于此提供商目录的可选静态标头。                       |
| `models`  | `object[]`               | 必需的模型行。没有 `id` 的行会被忽略。                    |

模型字段：

| 字段           | 类型                                                           | 含义                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 提供商本地模型 ID，不包含 `provider/` 前缀。                    |
| `name`          | `string`                                                       | 可选显示名称。                                                      |
| `api`           | `ModelApi`                                                     | 可选的按模型 API 覆盖值。                                            |
| `baseUrl`       | `string`                                                       | 可选的按模型基础 URL 覆盖值。                                       |
| `headers`       | `Record<string, string>`                                       | 可选的按模型静态标头。                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模态。                                               |
| `reasoning`     | `boolean`                                                      | 模型是否暴露推理行为。                               |
| `contextWindow` | `number`                                                       | 原生提供商上下文窗口。                                             |
| `contextTokens` | `number`                                                       | 与 `contextWindow` 不同时，可选的有效运行时上下文上限。 |
| `maxTokens`     | `number`                                                       | 已知时的最大输出 token 数。                                           |
| `cost`          | `object`                                                       | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat`        | `object`                                                       | 与 OpenClaw 模型配置兼容性匹配的可选兼容性标志。  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表 Status。仅当该行完全不应出现时才抑制。          |
| `statusReason`  | `string`                                                       | 与非可用 Status 一起显示的可选原因。                            |
| `replaces`      | `string[]`                                                     | 此模型取代的旧提供商本地模型 ID。                       |
| `replacedBy`    | `string`                                                       | 已弃用行的替代提供商本地模型 ID。                    |
| `tags`          | `string[]`                                                     | 选择器和过滤器使用的稳定标签。                                    |

抑制字段：

| 字段                      | 类型       | 含义                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游行的提供商 ID。必须由此插件拥有，或声明为已拥有的别名。 |
| `model`                    | `string`   | 要抑制的提供商本地模型 ID。                                                                      |
| `reason`                   | `string`   | 直接请求被抑制的行时显示的可选消息。                                     |
| `when.baseUrlHosts`        | `string[]` | 应用抑制之前所需的有效提供商基础 URL 主机可选列表。               |
| `when.providerConfigApiIn` | `string[]` | 应用抑制之前所需的精确提供商配置 `api` 值可选列表。              |

不要把仅运行时数据放入 `modelCatalog`。仅当清单行足够完整，能让按提供商过滤的列表和选择器界面跳过注册表/运行时发现时，才使用 `static`。当清单行可作为有用的可列出种子或补充、但刷新/缓存之后可能继续添加更多行时，使用 `refreshable`；refreshable 行本身并非权威来源。当 OpenClaw 必须加载提供商运行时才能知道列表时，使用 `runtime`。

## modelIdNormalization 参考

使用 `modelIdNormalization` 执行低成本的提供商自有模型 ID 清理，且该清理必须在提供商运行时加载之前发生。这样会把短模型名称、提供商本地旧版 ID、代理前缀规则等别名保留在所属插件清单中，而不是放进核心模型选择表。

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
| `aliases`                            | `Record<string,string>` | 不区分大小写的精确模型 ID 别名。值会按写入形式返回。                  |
| `stripPrefixes`                      | `string[]`              | 别名查找前要移除的前缀，适用于旧版 provider/model 重复。     |
| `prefixWhenBare`                     | `string`                | 规范化后的模型 ID 尚未包含 `/` 时要添加的前缀。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 别名查找后的条件裸 ID 前缀规则，以 `modelPrefix` 和 `prefix` 为键。 |

## providerEndpoints 参考

使用 `providerEndpoints` 进行端点分类，供通用请求策略在提供商运行时加载之前了解。核心仍拥有每个 `endpointClass` 的含义；插件清单拥有主机和基础 URL 元数据。

端点字段：

| 字段                          | 类型       | 含义                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端点类别，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 映射到该端点类别的精确主机名。                                                |
| `hostSuffixes`                 | `string[]` | 映射到该端点类别的主机后缀。用 `.` 作为前缀表示仅匹配域名后缀。 |
| `baseUrls`                     | `string[]` | 映射到该端点类别的精确规范化 HTTP(S) 基础 URL。                             |
| `googleVertexRegion`           | `string`   | 精确全局主机的静态 Google Vertex 区域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 从匹配主机中剥离的后缀，用于暴露 Google Vertex 区域前缀。                 |

## providerRequest 参考

使用 `providerRequest` 存放低成本请求兼容性元数据，让通用请求策略无需加载提供商运行时即可使用。将特定行为的载荷重写保留在提供商运行时钩子或共享提供商族辅助工具中。

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

| 字段                 | 类型         | 含义                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用请求兼容性决策和诊断使用的提供商族标签。 |
| `compatibilityFamily` | `"moonshot"` | 共享请求辅助工具使用的可选提供商族兼容性分组。              |
| `openAICompletions`   | `object`     | OpenAI 兼容 completions 请求标志，目前为 `supportsStreamingUsage`。       |

## modelPricing 参考

当提供商需要在运行时加载之前控制控制面定价行为时，使用 `modelPricing`。Gateway 网关定价缓存会读取这些元数据，而不导入提供商运行时代码。

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
| `external`   | `boolean`         | 对本地/自托管提供商设置为 `false`，它们永远不应获取 OpenRouter 或 LiteLLM 定价。 |
| `openRouter` | `false \| object` | OpenRouter 定价查找映射。`false` 会禁用此提供商的 OpenRouter 查找。           |
| `liteLLM`    | `false \| object` | LiteLLM 定价查找映射。`false` 会禁用此提供商的 LiteLLM 查找。                 |

来源字段：

| 字段                      | 类型               | 含义                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 外部目录提供商 ID，当它不同于 OpenClaw 提供商 ID 时使用，例如 `zai` 提供商对应的 `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | 将包含斜杠的模型 ID 视为嵌套 provider/model 引用，适用于 OpenRouter 等代理提供商。       |
| `modelIdTransforms`        | `"version-dots"[]` | 额外的外部目录模型 ID 变体。`version-dots` 会尝试带点号的版本 ID，例如 `claude-opus-4.6`。            |

### OpenClaw 提供商索引

OpenClaw 提供商索引是 OpenClaw 拥有的提供商预览元数据，适用于其插件可能尚未安装的提供商。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。提供商索引是内部回退契约，未来可安装提供商和预安装模型选择器界面会在提供商插件未安装时使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单 `modelCatalog`。
3. 来自显式刷新的模型目录缓存。
4. OpenClaw 提供商索引预览行。

提供商索引不得包含密钥、启用状态、运行时钩子或
实时账号特定模型数据。它的预览目录使用与插件清单相同的
`modelCatalog` 提供商行形状，但除非 `api`、`baseUrl`、定价或兼容性标志等运行时适配器字段有意与已安装的插件清单保持一致，
否则应仅限于稳定的显示元数据。具有实时 `/models` 发现能力的提供商应通过显式模型目录缓存路径
写入刷新的行，而不是让常规列表或新手引导调用提供商 API。

提供商索引条目也可以携带可安装插件元数据，适用于插件已移出核心或尚未安装的提供商。此
元数据沿用渠道目录模式：包名、npm 安装规格、
预期完整性以及轻量的认证选择标签，足以显示一个
可安装的设置选项。插件安装后，其清单优先，该提供商的
提供商索引条目会被忽略。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 下；常规
清单加载不再将这些顶层字段视为能力所有权。

## 清单与 package.json

这两个文件承担不同职责：

| 文件                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置验证、认证选择元数据，以及必须在插件代码运行前存在的 UI 提示                         |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块 |

如果你不确定某段元数据应放在哪里，使用这条规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，把它放在 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，把它放在 `package.json`

### 影响设备发现的 package.json 字段

一些运行时前的插件元数据有意放在 `package.json` 的
`openclaw` 块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段                                                             | 含义                                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 声明原生插件入口点。必须保持在插件包目录内。                                                                                                   |
| `openclaw.runtimeExtensions`                                      | 声明已安装包的已构建 JavaScript 运行时入口点。必须保持在插件包目录内。                                                                 |
| `openclaw.setupEntry`                                             | 轻量级的仅设置入口点，用于新手引导、延迟的渠道启动，以及只读渠道 Status/SecretRef 发现。必须保持在插件包目录内。 |
| `openclaw.runtimeSetupEntry`                                      | 声明已安装包的已构建 JavaScript 设置入口点。需要 `setupEntry`，必须存在，并且必须保持在插件包目录内。                         |
| `openclaw.channel`                                                | 轻量渠道目录元数据，例如标签、文档路径、别名和选择文案。                                                                                                 |
| `openclaw.channel.commands`                                       | 静态原生命令和原生 skill 自动默认元数据，在渠道运行时加载前供配置、审计和命令列表界面使用。                                          |
| `openclaw.channel.configuredState`                                | 轻量的已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅环境变量设置？”。                                         |
| `openclaw.channel.persistedAuthState`                             | 轻量的持久化认证检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经有任何登录状态？”。                                               |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 内置和外部发布插件的安装/更新提示。                                                                                                                   |
| `openclaw.install.defaultChoice`                                  | 当有多个安装来源可用时的首选安装路径。                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 或 `>=2026.5.1-beta.1` 的 semver 下限。                                                                             |
| `openclaw.install.expectedIntegrity`                              | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会用它校验获取到的构件。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | 当配置无效时，允许一个狭窄的内置插件重新安装恢复路径。                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许仅设置的渠道界面在启动期间先于完整渠道插件加载。                                                                                                 |

清单元数据决定运行时加载前哪些提供商/渠道/设置选择会出现在
新手引导中。`package.json#openclaw.install` 告诉
新手引导当用户选择其中某个选项时如何获取或启用该插件。不要把安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在非内置插件来源的安装和清单
注册表加载期间强制执行。无效值会被拒绝；
较新但有效的值会让旧主机跳过外部插件。内置源
插件会被假定与主机检出版本一致。

精确的 npm 版本固定已存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录
条目应将精确规格与 `expectedIntegrity` 配对，这样如果获取到的 npm 构件不再匹配固定版本，
更新流程就会失败关闭。
为兼容性，交互式新手引导仍会提供受信任注册表的 npm 规格，包括裸
包名和 dist-tags。目录诊断可以
区分精确、浮动、完整性固定、缺少完整性、包名
不匹配以及无效默认选择来源。它们还会在
`expectedIntegrity` 存在但没有可用于固定它的有效 npm 来源时发出警告。
当 `expectedIntegrity` 存在时，
安装/更新流程会强制执行它；当它省略时，注册表解析会在
没有完整性固定的情况下记录。

当 Status、渠道列表或 SecretRef 扫描需要在不加载完整
运行时的情况下识别已配置账号时，渠道插件应提供 `openclaw.setupEntry`。
设置入口应暴露渠道元数据以及设置安全的配置、
Status 和密钥适配器；将网络客户端、Gateway 网关监听器和
传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源入口点字段的包边界检查。
例如，`openclaw.runtimeExtensions` 不能让一个逃逸的
`openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 有意保持狭窄。它
不会让任意损坏的配置变得可安装。目前它只允许安装
流程从特定的过时内置插件升级失败中恢复，例如
缺少内置插件路径，或同一内置插件的过时 `channels.<id>` 条目。
无关的配置错误仍会阻止安装，并将操作员引导到
`openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是用于小型检查器
模块的包元数据：

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

当设置、Doctor、Status 或只读存在性流程需要在完整渠道插件加载前进行轻量
是/否认证探测时使用它。持久化认证状态不是
已配置渠道状态：不要使用此元数据自动启用插件、
修复运行时依赖，或决定渠道运行时是否应加载。
目标导出应是一个只读取持久化状态的小函数；不要
通过完整渠道运行时 barrel 路由它。

`openclaw.channel.configuredState` 对轻量的仅环境变量
已配置检查遵循相同形状：

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

当某个渠道可以根据环境变量或其他小型
非运行时输入回答已配置状态时使用它。如果检查需要完整配置解析或真实的
渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState`
钩子中。

## 设备发现优先级（重复插件 ID）

OpenClaw 会从多个根发现插件（内置、全局安装、工作区、显式配置选择的路径）。如果两个发现结果共享相同 `id`，只保留**最高优先级**的清单；较低优先级的重复项会被丢弃，而不是并排加载。

优先级，从高到低：

1. **配置选择** — 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** — 随 OpenClaw 一起发布的插件
3. **全局安装** — 安装到全局 OpenClaw 插件根目录的插件
4. **工作区** — 相对于当前工作区发现的插件

影响：

- 位于工作区的内置插件分叉或过时副本不会遮蔽内置构建。
- 如果确实要用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，使它通过优先级获胜，而不是依赖工作区发现。
- 重复项丢弃会被记录，因此 Doctor 和启动诊断可以指向被丢弃的副本。

## JSON Schema 要求

- **每个插件都必须随附 JSON Schema**，即使它不接受任何配置。
- 空 schema 可以接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非渠道 id 由
  插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现**的插件 id。未知 id 是**错误**。
- 如果插件已安装，但清单或架构损坏或缺失，
  验证会失败，并且 Doctor 会报告插件错误。
- 如果插件配置存在但插件已**禁用**，配置会保留，并且
  Doctor + 日志中会显示**警告**。

完整的 `plugins.*` 架构请参阅[配置参考](/zh-CN/gateway/configuration)。

## 备注

- **原生 OpenClaw 插件**必须提供清单，包括从本地文件系统加载的插件。运行时仍会单独加载插件模块；清单仅用于发现 + 验证。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是对象。
- 清单加载器只读取已记录的清单字段。避免使用自定义顶级键。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入大范围运行时代码；将它用于静态提供商目录元数据或窄范围发现描述符，而不是请求时执行。
- 独占插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 在此清单中声明独占插件类型。运行时入口 `OpenClawPluginDefinition.kind` 已弃用，仅作为旧版插件的兼容回退保留。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅是声明式的。Status、审计、cron 投递验证以及其他只读界面在将环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
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
