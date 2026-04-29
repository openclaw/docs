---
read_when:
    - 你正在构建 OpenClaw 插件
    - 你需要发布插件配置模式，或调试插件验证错误
summary: 插件清单 + JSON 架构要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-29T08:48:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a529f9d4388039d76a6e351b454622b657a1ddcd4f4159f10be988568343cc2
    source_path: plugins/manifest.md
    workflow: 16
---

此页面仅适用于 **OpenClaw 原生插件清单**。

有关兼容包布局，请参阅[插件包](/zh-CN/plugins/bundles)。

兼容包格式使用不同的清单文件：

- Codex 包：`.codex-plugin/plugin.json`
- Claude 包：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor 包：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些包布局，但它们不会根据此处描述的 `openclaw.plugin.json` 架构进行验证。

对于兼容包，当布局符合 OpenClaw 运行时期望时，OpenClaw 目前会读取包元数据、声明的 skill 根目录、Claude 命令根目录、Claude 包 `settings.json` 默认值、Claude 包 LSP 默认值，以及支持的钩子包。

每个原生 OpenClaw 插件都**必须**在**插件根目录**中提供 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整插件系统指南：[插件](/zh-CN/tools/plugin)。
有关原生能力模型和当前外部兼容性指南：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。以下所有内容都必须足够轻量，无需启动插件运行时即可检查。

**用于：**

- 插件标识、配置验证和配置 UI 提示
- 凭证、新手引导和设置元数据（别名、自动启用、提供商环境变量、凭证选项）
- 控制平面界面的激活提示
- 模型系列所有权简写
- 静态能力所有权快照（`contracts`）
- 共享 `openclaw qa` 宿主可检查的 QA 运行器元数据
- 合并到目录和验证界面的渠道特定配置元数据

**不要用于：** 注册运行时行为、声明代码入口点，或 npm 安装元数据。这些属于你的插件代码和 `package.json`。

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

| 字段                                 | 必填     | 类型                             | 含义                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是       | `string`                         | 规范插件 id。这是 `plugins.entries.<id>` 中使用的 id。                                                                                                                                                                            |
| `configSchema`                       | 是       | `object`                         | 此插件配置的内联 JSON Schema。                                                                                                                                                                                                    |
| `enabledByDefault`                   | 否       | `true`                           | 将内置插件标记为默认启用。省略它，或设置为任何非 `true` 值，可让插件默认保持禁用。                                                                                                                                               |
| `legacyPluginIds`                    | 否       | `string[]`                       | 会规范化为此规范插件 id 的旧版 id。                                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                       | 当凭证、配置或模型引用提到这些提供商 id 时，应自动启用此插件。                                                                                                                                                                   |
| `kind`                               | 否       | `"memory"` \| `"context-engine"` | 声明 `plugins.slots.*` 使用的互斥插件类型。                                                                                                                                                                                       |
| `channels`                           | 否       | `string[]`                       | 此插件拥有的渠道 id。用于设备发现和配置校验。                                                                                                                                                                                    |
| `providers`                          | 否       | `string[]`                       | 此插件拥有的提供商 id。                                                                                                                                                                                                           |
| `providerDiscoveryEntry`             | 否       | `string`                         | 轻量级提供商发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的清单范围提供商目录元数据。                                                                                                                |
| `modelSupport`                       | 否       | `object`                         | 清单拥有的简写模型系列元数据，用于在运行时之前自动加载插件。                                                                                                                                                                     |
| `modelCatalog`                       | 否       | `object`                         | 此插件拥有的提供商的声明式模型目录元数据。这是未来在不加载插件运行时的情况下进行只读列表、新手引导、模型选择器、别名和抑制的控制平面契约。                                                                                    |
| `modelPricing`                       | 否       | `object`                         | 提供商拥有的外部价格查找策略。用它让本地/自托管提供商跳过远程价格目录，或将提供商引用映射到 OpenRouter/LiteLLM 目录 id，而无需在核心中硬编码提供商 id。                                                                        |
| `modelIdNormalization`               | 否       | `object`                         | 提供商拥有的模型 id 别名/前缀清理，必须在提供商运行时加载前执行。                                                                                                                                                               |
| `providerEndpoints`                  | 否       | `object[]`                       | 清单拥有的端点 host/baseUrl 元数据，用于核心必须在提供商运行时加载前分类的提供商路由。                                                                                                                                           |
| `providerRequest`                    | 否       | `object`                         | 泛型请求策略在提供商运行时加载前使用的廉价提供商系列和请求兼容性元数据。                                                                                                                                                        |
| `cliBackends`                        | 否       | `string[]`                       | 此插件拥有的 CLI 推理后端 id。用于从显式配置引用进行启动时自动激活。                                                                                                                                                             |
| `syntheticAuthRefs`                  | 否       | `string[]`                       | 提供商或 CLI 后端引用，其插件拥有的合成凭证钩子应在运行时加载前的冷启动模型发现期间被探测。                                                                                                                                     |
| `nonSecretAuthMarkers`               | 否       | `string[]`                       | 内置插件拥有的占位 API key 值，表示非机密的本地、OAuth 或环境凭证状态。                                                                                                                                                          |
| `commandAliases`                     | 否       | `object[]`                       | 此插件拥有的命令名称，应在运行时加载前生成具备插件感知能力的配置和 CLI 诊断。                                                                                                                                                    |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`       | 已弃用的兼容性环境变量元数据，用于提供商凭证/Status 查找。新插件应优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期内仍会读取此项。                                                                                   |
| `providerAuthAliases`                | 否       | `Record<string, string>`         | 应复用另一个提供商 id 进行凭证查找的提供商 id，例如共享基础提供商 API key 和凭证配置档的编码提供商。                                                                                                                            |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`       | OpenClaw 无需加载插件代码即可检查的廉价渠道环境变量元数据。将其用于通用启动/配置助手应能看到的环境变量驱动渠道设置或凭证界面。                                                                                                  |
| `providerAuthChoices`                | 否       | `object[]`                       | 用于新手引导选择器、首选提供商解析和简单 CLI 标志接线的廉价凭证选项元数据。                                                                                                                                                      |
| `activation`                         | 否       | `object`                         | 用于启动、提供商、命令、渠道、路由和能力触发加载的廉价激活规划器元数据。仅为元数据；实际行为仍由插件运行时拥有。                                                                                                                |
| `setup`                              | 否       | `object`                         | 设备发现和设置界面无需加载插件运行时即可检查的廉价设置/新手引导描述符。                                                                                                                                                         |
| `qaRunners`                          | 否       | `object[]`                       | 共享 `openclaw qa` 宿主在插件运行时加载前使用的廉价 QA 运行器描述符。                                                                                                                                                            |
| `contracts`                          | 否       | `object`                         | 用于外部凭证钩子、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、Web 获取、Web 搜索和工具归属的静态内置能力快照。                                                                                           |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`         | 为 `contracts.mediaUnderstandingProviders` 中声明的提供商 id 提供的廉价媒体理解默认值。                                                                                                                                          |
| `channelConfigs`                     | 否       | `Record<string, object>`         | 清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和校验界面中。                                                                                                                                                            |
| `skills`                             | 否       | `string[]`                       | 要加载的 Skill 目录，相对于插件根目录。                                                                                                                                                                                          |
| `name`                               | 否       | `string`                         | 人类可读的插件名称。                                                                                                                                                                                                              |
| `description`                        | 否       | `string`                         | 插件界面中显示的简短摘要。                                                                                                                                                                                                        |
| `version`                            | 否       | `string`                         | 信息性插件版本。                                                                                                                                                                                                                  |
| `uiHints`                            | 否       | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                                         |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个新手引导或凭证选项。
OpenClaw 会在提供商运行时加载前读取它。
提供商设置列表会使用这些清单选项、从描述符派生的设置
选项，以及安装目录元数据，而无需加载提供商运行时。

| 字段                  | 必填 | 类型                                            | 含义                                                                                               |
| --------------------- | ---- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                        | 此选项所属的提供商 id。                                                                            |
| `method`              | 是   | `string`                                        | 要分派到的凭证方法 id。                                                                            |
| `choiceId`            | 是   | `string`                                        | 新手引导和 CLI 流程使用的稳定凭证选项 id。                                                         |
| `choiceLabel`         | 否   | `string`                                        | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。                                           |
| `choiceHint`          | 否   | `string`                                        | 选择器的简短辅助文本。                                                                             |
| `assistantPriority`   | 否   | `number`                                        | 数值越低，在智能体驱动的交互式选择器中排序越靠前。                                                 |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 从智能体选择器中隐藏该选项，同时仍允许手动 CLI 选择。                                              |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 应将用户重定向到此替代选项的旧版选项 id。                                                          |
| `groupId`             | 否   | `string`                                        | 用于分组相关选项的可选分组 id。                                                                    |
| `groupLabel`          | 否   | `string`                                        | 该分组的面向用户标签。                                                                             |
| `groupHint`           | 否   | `string`                                        | 该分组的简短辅助文本。                                                                             |
| `optionKey`           | 否   | `string`                                        | 用于简单单标志凭证流程的内部选项键。                                                               |
| `cliFlag`             | 否   | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                         |
| `cliOption`           | 否   | `string`                                        | 完整 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                             |
| `cliDescription`      | 否   | `string`                                        | CLI 帮助中使用的描述。                                                                             |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。                        |

## commandAliases 参考

当插件拥有一个运行时命令名称，而用户可能会误将其放入 `plugins.allow` 或尝试作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据进行诊断，而无需导入插件运行时代码。

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

| 字段         | 必填 | 类型              | 含义                                                           |
| ------------ | ---- | ----------------- | -------------------------------------------------------------- |
| `name`       | 是   | `string`          | 属于此插件的命令名称。                                         |
| `kind`       | 否   | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。                |
| `cliCommand` | 否   | `string`          | 如果存在，用于建议 CLI 操作的相关根 CLI 命令。                 |

## activation 参考

当插件可以低成本声明哪些控制平面事件应将其纳入激活/加载计划时，请使用 `activation`。

此块是规划器元数据，不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不承诺插件代码已经执行。激活规划器使用这些字段在回退到现有清单所有权元数据之前缩小候选插件范围，例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和钩子。

优先使用已经描述所有权的最窄元数据。当 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 能表达这种关系时，请使用这些字段。将 `activation` 用于那些无法由这些所有权字段表示的额外规划器提示。
对于 `claude-cli`、`codex-cli` 或 `google-gemini-cli` 等 CLI 运行时别名，请使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅用于尚无所有权字段的嵌入式智能体 harness id。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。当前使用方将其作为更广泛插件加载前的缩小范围提示，因此缺少激活元数据通常只影响性能；只要旧版清单所有权回退仍然存在，它不应改变正确性。

随着 OpenClaw 摆脱隐式启动导入，每个插件都应有意设置 `activation.onStartup`。仅当插件必须在 Gateway 网关启动期间运行时，才将其设置为 `true`。当插件在启动时处于惰性状态，并且应仅由更窄的触发器加载时，将其设置为 `false`。省略 `onStartup` 会为没有静态能力元数据的插件保留已弃用的旧版隐式启动 sidecar 回退；未来版本可能会停止在启动时加载这些插件，除非它们声明 `activation.onStartup: true`。当插件仍依赖该回退时，插件 Status 和兼容性报告会用 `legacy-implicit-startup-sidecar` 发出警告。

对于迁移测试，设置 `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` 以仅禁用该已弃用的回退。此选择加入模式不会阻止显式的 `activation.onStartup: true` 插件，也不会阻止由渠道、配置、agent-harness、memory 或其他更窄激活触发器加载的插件。

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

| 字段               | 必填 | 类型                                                 | 含义                                                                                                                                                                                                                      |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 显式 Gateway 网关启动激活。每个插件都应设置此项。`true` 会在启动期间导入插件；`false` 会选择退出已弃用的隐式 sidecar 启动回退，除非另一个匹配的触发器要求加载。                                                            |
| `onProviders`      | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的提供商 id。                                                                                                                                                                                  |
| `onAgentHarnesses` | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的嵌入式智能体 harness 运行时 id。对于 CLI 后端别名，请使用顶层 `cliBackends`。                                                                                                                |
| `onCommands`       | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的命令 id。                                                                                                                                                                                    |
| `onChannels`       | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的渠道 id。                                                                                                                                                                                    |
| `onRoutes`         | 否   | `string[]`                                           | 应将此插件纳入激活/加载计划的路由种类。                                                                                                                                                                                   |
| `onConfigPaths`    | 否   | `string[]`                                           | 当路径存在且未被显式禁用时，应将此插件纳入启动/加载计划的根相对配置路径。                                                                                                                                                 |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。尽可能优先使用更窄的字段。                                                                                                                                                            |

当前实时使用方：

- Gateway 网关启动规划使用 `activation.onStartup` 进行显式启动导入，并选择退出已弃用的隐式 sidecar 启动回退
- 命令触发的 CLI 规划会回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- agent-runtime 启动规划对嵌入式 harness 使用 `activation.onAgentHarnesses`，对 CLI 运行时别名使用顶层 `cliBackends[]`
- 渠道触发的设置/渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]` 所有权
- 启动插件规划对非渠道根配置界面使用 `activation.onConfigPaths`，例如内置浏览器插件的 `browser` 块
- 提供商触发的设置/运行时规划在缺少显式提供商激活元数据时，会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 所有权

规划器诊断可以区分显式激活提示和清单所有权回退。例如，`activation-command-hint` 表示 `activation.onCommands` 匹配，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 所有权。这些原因标签用于宿主诊断和测试；插件作者应继续声明最能描述所有权的元数据。

## qaRunners 参考

当插件在共享的 `openclaw qa` 根之下贡献一个或多个传输运行器时，请使用 `qaRunners`。保持这些元数据轻量且静态；插件运行时仍通过轻量的 `runtime-api.ts` 界面拥有实际 CLI 注册，该界面会导出 `qaRunnerCliRegistrations`。

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

| 字段          | 必填 | 类型     | 含义                                                               |
| ------------- | ---- | -------- | ------------------------------------------------------------------ |
| `commandName` | 是   | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。                   |
| `description` | 否   | `string` | 当共享宿主需要存根命令时使用的后备帮助文本。                       |

## setup 参考

当设置和新手引导界面需要在运行时加载前获取由插件拥有的低成本元数据时，使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是设置专用的描述符界面，用于应保持仅元数据的控制平面/设置流程。

当存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现首选的描述符优先查找界面。如果描述符只是缩小候选插件范围，而设置仍需要更丰富的设置时运行时钩子，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为后备执行路径。

OpenClaw 还会在通用提供商凭证和环境变量查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用窗口期仍通过兼容性适配器受支持，但仍使用它的非内置插件会收到清单诊断。新插件应将设置/Status 环境元数据放在 `setup.providers[].envVars` 上。

当没有设置条目可用，或当 `setup.requiresRuntime: false` 声明不需要设置运行时时，OpenClaw 也可以从 `setup.providers[].authMethods` 推导简单的设置选项。显式的 `providerAuthChoices` 条目仍然是自定义标签、CLI 标志、新手引导范围和助手元数据的首选。

只有当这些描述符足以覆盖设置界面时，才设置 `requiresRuntime: false`。OpenClaw 将显式的 `false` 视为仅描述符契约，并且不会执行 `setup-api` 或 `openclaw.setupEntry` 来进行设置查找。如果仅描述符插件仍随附这些设置运行时条目之一，OpenClaw 会报告一个追加诊断，并继续忽略它。省略 `requiresRuntime` 会保留旧版后备行为，因此已添加描述符但未添加该标志的现有插件不会中断。

由于设置查找可以执行由插件拥有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在所有发现到的插件中保持唯一。所有权不明确时会失败关闭，而不是从发现顺序中选出胜者。

当设置运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的提供商或 CLI 后端，或某个描述符没有匹配的运行时注册，设置注册表诊断会报告描述符漂移。这些诊断是追加性的，不会拒绝旧版插件。

### setup.providers 参考

| 字段          | 必填 | 类型       | 含义                                                                           |
| ------------- | ---- | ---------- | ------------------------------------------------------------------------------ |
| `id`          | 是   | `string`   | 在设置或新手引导期间暴露的提供商 ID。保持规范化 ID 全局唯一。                 |
| `authMethods` | 否   | `string[]` | 此提供商无需加载完整运行时即可支持的设置/凭证方法 ID。                        |
| `envVars`     | 否   | `string[]` | 通用设置/Status 界面可在插件运行时加载前检查的环境变量。                      |

### setup 字段

| 字段               | 必填 | 类型       | 含义                                                                                         |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在设置和新手引导期间暴露的提供商设置描述符。                                                 |
| `cliBackends`      | 否   | `string[]` | 用于描述符优先设置查找的设置时后端 ID。保持规范化 ID 全局唯一。                              |
| `configMigrations` | 否   | `string[]` | 由此插件的设置界面拥有的配置迁移 ID。                                                        |
| `requiresRuntime`  | 否   | `boolean`  | 描述符查找之后，设置是否仍需要执行 `setup-api`。                                             |

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

| 字段          | 类型       | 含义                           |
| ------------- | ---------- | ------------------------------ |
| `label`       | `string`   | 面向用户的字段标签。           |
| `help`        | `string`   | 简短帮助文本。                 |
| `tags`        | `string[]` | 可选的 UI 标签。               |
| `advanced`    | `boolean`  | 将字段标记为高级字段。         |
| `sensitive`   | `boolean`  | 将字段标记为机密或敏感字段。   |
| `placeholder` | `string`   | 表单输入的占位符文本。         |

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

| 字段                             | 类型       | 含义                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex 应用服务器扩展工厂 ID，目前为 `codex-app-server`。              |
| `agentToolResultMiddleware`      | `string[]` | 内置插件可为其注册工具结果中间件的运行时 ID。                         |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部凭证配置文件钩子的提供商 ID。                         |
| `speechProviders`                | `string[]` | 此插件拥有的语音提供商 ID。                                           |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录提供商 ID。                                       |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音提供商 ID。                                       |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的 Memory embedding 提供商 ID。                             |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解提供商 ID。                                       |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成提供商 ID。                                       |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成提供商 ID。                                       |
| `webFetchProviders`              | `string[]` | 此插件拥有的 Web-fetch 提供商 ID。                                    |
| `webSearchProviders`             | `string[]` | 此插件拥有的 Web-search 提供商 ID。                                   |
| `migrationProviders`             | `string[]` | 此插件为 `openclaw migrate` 拥有的导入提供商 ID。                     |
| `tools`                          | `string[]` | 此插件为内置契约检查拥有的 Agent 工具名称。                           |

`contracts.embeddedExtensionFactories` 保留给内置的仅 Codex 应用服务器扩展工厂。内置工具结果转换应改为声明 `contracts.agentToolResultMiddleware`，并使用 `api.registerAgentToolResultMiddleware(...)` 注册。外部插件不能注册工具结果中间件，因为该接缝可以在模型看到高信任工具输出前重写它。

实现 `resolveExternalAuthProfiles` 的提供商插件应声明 `contracts.externalAuthProviders`。没有该声明的插件仍会通过已弃用的兼容性后备运行，但该后备更慢，并会在迁移窗口期后移除。

内置 Memory embedding 提供商应为其暴露的每个适配器 ID 声明 `contracts.memoryEmbeddingProviders`，包括 `local` 等内置适配器。独立 CLI 路径使用此清单契约，在完整 Gateway 网关运行时注册提供商之前，仅加载拥有它的插件。

## mediaUnderstandingProviderMetadata 参考

当媒体理解提供商具有默认模型、自动凭证后备优先级，或通用核心帮助程序在运行时加载前需要的原生文档支持时，使用 `mediaUnderstandingProviderMetadata`。键还必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

| 字段                   | 类型                                | 含义                                                                 |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此提供商暴露的媒体能力。                                             |
| `defaultModels`        | `Record<string, string>`            | 当配置未指定模型时使用的能力到模型默认值。                           |
| `autoPriority`         | `Record<string, number>`            | 数值越小，在基于凭证的自动提供商后备中排序越靠前。                   |
| `nativeDocumentInputs` | `"pdf"[]`                           | 提供商支持的原生文档输入。                                           |

## channelConfigs 参考

当渠道插件需要在运行时加载前获取低成本配置元数据时，使用 `channelConfigs`。只读渠道设置/Status 发现可以直接使用此元数据处理已配置的外部渠道，适用于没有设置条目可用，或 `setup.requiresRuntime: false` 声明不需要设置运行时的情况。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置区段。用户仍然在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 会读取清单元数据，以便在插件运行时代码执行前确定哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述不同路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明 `channels[]` 的非内置插件也应声明匹配的
`channelConfigs` 条目。没有这些条目时，OpenClaw 仍可加载插件，但
冷路径配置 schema、设置和 Control UI 界面要等到插件运行时执行后，才能知道
渠道拥有的选项形状。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和
`nativeSkillsAutoEnabled` 可以为在渠道运行时加载前执行的命令配置
检查声明静态 `auto` 默认值。内置渠道也可以通过
`package.json#openclaw.channel.commands` 发布相同默认值，并与
其他由包拥有的渠道目录元数据放在一起。

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

| 字段         | 类型                     | 含义                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个声明的渠道配置条目都必须提供。         |
| `uiHints`     | `Record<string, object>` | 该渠道配置部分的可选 UI 标签、占位符和敏感提示。          |
| `label`       | `string`                 | 运行时元数据未就绪时，合并到选择器和检查界面的渠道标签。 |
| `description` | `string`                 | 用于检查和目录界面的简短渠道说明。                               |
| `commands`    | `object`                 | 用于运行时前配置检查的静态原生命令和原生 Skills 自动默认值。       |
| `preferOver`  | `string[]`               | 此渠道在选择界面中应优先于的旧版或较低优先级插件 ID。    |

### 替换另一个渠道插件

当你的插件是某个渠道 ID 的首选拥有者，而另一个插件也能提供该渠道时，
使用 `preferOver`。常见情况包括重命名的插件 ID、取代内置插件的
独立插件，或为了配置兼容性而保留相同渠道 ID 的维护分支。

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

配置 `channels.chat` 后，OpenClaw 会同时考虑渠道 ID 和
首选插件 ID。如果较低优先级的插件只是因为它是内置插件或默认启用而被选中，
OpenClaw 会在有效运行时配置中禁用它，使一个插件拥有该渠道及其工具。
显式用户选择仍然优先：如果用户明确启用了两个插件，OpenClaw
会保留该选择，并报告重复渠道/工具诊断，而不是静默更改请求的插件集合。

将 `preferOver` 限定到确实能提供同一渠道的插件 ID。
它不是通用优先级字段，也不会重命名用户配置键。

## modelSupport 参考

当 OpenClaw 应在插件运行时加载前，根据 `gpt-5.5` 或
`claude-sonnet-4.6` 这样的简写模型 ID 推断你的提供商插件时，
使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用以下优先级：

- 显式 `provider/model` 引用使用所属 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置
  插件胜出
- 其余歧义会被忽略，直到用户或配置指定提供商

字段：

| 字段           | 类型       | 含义                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 ID 匹配的前缀。                 |
| `modelPatterns` | `string[]` | 移除 profile 后缀后，与简写模型 ID 匹配的正则表达式源。 |

## modelCatalog 参考

当 OpenClaw 应在加载插件运行时前了解提供商模型元数据时，
使用 `modelCatalog`。这是固定目录行、提供商别名、
抑制规则和发现模式的清单所属来源。运行时刷新仍属于提供商运行时代码，
但清单会告诉核心何时需要运行时。

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

| 字段          | 类型                                                     | 含义                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此插件拥有的提供商 ID 的目录行。键也应出现在顶层 `providers` 中。       |
| `aliases`      | `Record<string, object>`                                 | 应解析到所属提供商、用于目录或抑制规划的提供商别名。              |
| `suppressions` | `object[]`                                               | 因提供商特定原因由此插件抑制的来自其他来源的模型行。                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | 提供商目录是否可从清单元数据读取、刷新到缓存，或需要运行时。 |

`aliases` 参与模型目录规划中的提供商所有权查找。
别名目标必须是同一插件拥有的顶层提供商。当使用按提供商过滤的列表并指定别名时，
OpenClaw 可以读取所属清单，并在不加载提供商运行时的情况下
应用别名 API/base URL 覆盖。
别名不会扩展未过滤的目录列表；宽泛列表只会发出所属的
规范提供商行。

`suppressions` 取代旧的提供商运行时 `suppressBuiltInModel` 钩子。
只有当提供商由该插件拥有，或声明为指向所属提供商的
`modelCatalog.aliases` 键时，抑制条目才会生效。模型解析期间不再调用
运行时抑制钩子。

提供商字段：

| 字段     | 类型                     | 含义                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此提供商目录中模型的可选默认 base URL。    |
| `api`     | `ModelApi`               | 此提供商目录中模型的可选默认 API 适配器。 |
| `headers` | `Record<string, string>` | 应用于此提供商目录的可选静态 headers。      |
| `models`  | `object[]`               | 必需的模型行。没有 `id` 的行会被忽略。            |

模型字段：

| 字段           | 类型                                                           | 含义                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | 提供商本地模型 ID，不带 `provider/` 前缀。                    |
| `name`          | `string`                                                       | 可选显示名称。                                                      |
| `api`           | `ModelApi`                                                     | 可选的逐模型 API 覆盖。                                            |
| `baseUrl`       | `string`                                                       | 可选的逐模型 base URL 覆盖。                                       |
| `headers`       | `Record<string, string>`                                       | 可选的逐模型静态 headers。                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模态。                                               |
| `reasoning`     | `boolean`                                                      | 模型是否暴露推理行为。                               |
| `contextWindow` | `number`                                                       | 原生提供商上下文窗口。                                             |
| `contextTokens` | `number`                                                       | 当与 `contextWindow` 不同时，可选的有效运行时上下文上限。 |
| `maxTokens`     | `number`                                                       | 已知时的最大输出 token 数。                                           |
| `cost`          | `object`                                                       | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat`        | `object`                                                       | 匹配 OpenClaw 模型配置兼容性的可选兼容性标志。  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。只有当该行完全不应出现时才抑制。          |
| `statusReason`  | `string`                                                       | 与非可用状态一起显示的可选原因。                            |
| `replaces`      | `string[]`                                                     | 此模型取代的较旧提供商本地模型 ID。                       |
| `replacedBy`    | `string`                                                       | 已弃用行的替代提供商本地模型 ID。                    |
| `tags`          | `string[]`                                                     | 选择器和过滤器使用的稳定标签。                                    |

抑制字段：

| 字段                       | 类型       | 含义                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游行的提供商 id。必须由此插件拥有，或声明为已拥有的别名。 |
| `model`                    | `string`   | 要抑制的提供商本地模型 id。                                                                      |
| `reason`                   | `string`   | 直接请求被抑制行时显示的可选消息。                                     |
| `when.baseUrlHosts`        | `string[]` | 抑制生效前所需的有效提供商基础 URL 主机可选列表。               |
| `when.providerConfigApiIn` | `string[]` | 抑制生效前所需的精确提供商配置 `api` 值可选列表。              |

不要把仅运行时数据放入 `modelCatalog`。仅当清单行足够完整，使按提供商过滤的列表和选择器界面可以跳过注册表/运行时发现时，才使用 `static`。当清单行可作为有用的可列表种子或补充，但刷新/缓存之后可以添加更多行时，使用 `refreshable`；refreshable 行本身不具备权威性。当 OpenClaw 必须加载提供商运行时才能知道列表时，使用 `runtime`。

## modelIdNormalization 参考

使用 `modelIdNormalization` 执行低成本、由提供商拥有的模型 id 清理，并且该清理必须发生在提供商运行时加载之前。这样可以把短模型名称、提供商本地旧版 id、代理前缀规则等别名保留在所属插件清单中，而不是放入核心模型选择表。

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

| 字段                                 | 类型                    | 含义                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大小写不敏感的精确模型 id 别名。值会按原样返回。                  |
| `stripPrefixes`                      | `string[]`              | 在别名查找前移除的前缀，适用于旧版提供商/模型重复。     |
| `prefixWhenBare`                     | `string`                | 当规范化后的模型 id 尚未包含 `/` 时添加的前缀。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 别名查找之后的条件裸 id 前缀规则，按 `modelPrefix` 和 `prefix` 设定。 |

## providerEndpoints 参考

使用 `providerEndpoints` 描述通用请求策略在提供商运行时加载之前必须知道的端点分类。核心仍然拥有每个 `endpointClass` 的含义；插件清单拥有主机和基础 URL 元数据。

端点字段：

| 字段                           | 类型       | 含义                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | 已知的核心端点类别，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。        |
| `hosts`                        | `string[]` | 映射到该端点类别的精确主机名。                                                |
| `hostSuffixes`                 | `string[]` | 映射到该端点类别的主机后缀。用 `.` 前缀表示仅匹配域名后缀。 |
| `baseUrls`                     | `string[]` | 映射到该端点类别的精确规范化 HTTP(S) 基础 URL。                             |
| `googleVertexRegion`           | `string`   | 用于精确全局主机的静态 Google Vertex 区域。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 从匹配主机中剥离的后缀，用于暴露 Google Vertex 区域前缀。                 |

## providerRequest 参考

使用 `providerRequest` 提供低成本的请求兼容性元数据，使通用请求策略无需加载提供商运行时即可使用。将特定行为的载荷重写保留在提供商运行时钩子或共享的提供商家族辅助函数中。

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

| 字段                  | 类型         | 含义                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用请求兼容性决策和诊断使用的提供商家族标签。 |
| `compatibilityFamily` | `"moonshot"` | 可选的提供商家族兼容性分组，供共享请求辅助函数使用。              |
| `openAICompletions`   | `object`     | OpenAI 兼容的 completions 请求标志，目前为 `supportsStreamingUsage`。       |

## modelPricing 参考

当提供商需要在运行时加载之前控制控制平面定价行为时，使用 `modelPricing`。Gateway 网关定价缓存会读取此元数据，而不会导入提供商运行时代码。

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

| 字段         | 类型              | 含义                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | 对于本地/自托管提供商设为 `false`，这类提供商绝不应获取 OpenRouter 或 LiteLLM 定价。 |
| `openRouter` | `false \| object` | OpenRouter 定价查找映射。`false` 会禁用此提供商的 OpenRouter 查找。           |
| `liteLLM`    | `false \| object` | LiteLLM 定价查找映射。`false` 会禁用此提供商的 LiteLLM 查找。                 |

来源字段：

| 字段                       | 类型               | 含义                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 当外部目录提供商 id 与 OpenClaw 提供商 id 不同时使用，例如 `zai` 提供商对应的 `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | 将包含斜杠的模型 id 视为嵌套提供商/模型引用，适用于 OpenRouter 等代理提供商。       |
| `modelIdTransforms`        | `"version-dots"[]` | 额外的外部目录模型 id 变体。`version-dots` 会尝试 `claude-opus-4.6` 这样的点分版本 id。            |

### OpenClaw 提供商索引

OpenClaw 提供商索引是 OpenClaw 拥有的预览元数据，用于插件可能尚未安装的提供商。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。提供商索引是内部回退契约，未来可安装提供商和安装前模型选择器界面会在提供商插件未安装时使用它。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单 `modelCatalog`。
3. 显式刷新得到的模型目录缓存。
4. OpenClaw 提供商索引预览行。

提供商索引不得包含密钥、启用状态、运行时钩子或特定实时账号的模型数据。它的预览目录使用与插件清单相同的 `modelCatalog` 提供商行形状，但应仅限于稳定的显示元数据，除非 `api`、`baseUrl`、定价或兼容性标志等运行时适配器字段被有意保持与已安装插件清单一致。具有实时 `/models` 发现能力的提供商应通过显式模型目录缓存路径写入刷新行，而不是让普通列表或新手引导调用提供商 API。

对于插件已移出核心或尚未安装的提供商，提供商索引条目也可以携带可安装插件元数据。此元数据沿用渠道目录模式：包名、npm 安装规格、预期完整性，以及低成本的认证选项标签，足以显示一个可安装设置选项。插件安装后，其清单优先，该提供商的提供商索引条目会被忽略。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 下；正常清单加载不再把这些顶层字段视为能力所有权。

## 清单与 package.json

这两个文件承担不同职责：

| 文件                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 发现、配置校验、认证选项元数据，以及必须在插件代码运行前存在的 UI 提示                         |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块 |

如果你不确定某项元数据应该放在哪里，请使用这条规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，就放入 `openclaw.plugin.json`
- 如果它涉及打包、入口文件或 npm 安装行为，就放入 `package.json`

### 影响发现的 package.json 字段

部分预运行时插件元数据会有意放在 `package.json` 的 `openclaw` 块下，而不是放在 `openclaw.plugin.json` 中。

重要示例：

| 字段                                                              | 含义                                                                                                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 声明原生插件入口点。必须保持在插件包目录内。                                                                                                                                            |
| `openclaw.runtimeExtensions`                                      | 声明已安装包的已构建 JavaScript 运行时入口点。必须保持在插件包目录内。                                                                                                                  |
| `openclaw.setupEntry`                                             | 新手引导、延迟渠道启动，以及只读渠道 Status/SecretRef 发现期间使用的轻量级仅设置入口点。必须保持在插件包目录内。                                                                       |
| `openclaw.runtimeSetupEntry`                                      | 声明已安装包的已构建 JavaScript 设置入口点。必须保持在插件包目录内。                                                                                                                    |
| `openclaw.channel`                                                | 低成本渠道目录元数据，例如标签、文档路径、别名和选择文案。                                                                                                                              |
| `openclaw.channel.commands`                                       | 在渠道运行时加载之前，配置、审计和命令列表界面使用的静态原生命令和原生技能自动默认元数据。                                                                                             |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，无需加载完整渠道运行时即可回答“是否已经存在仅 env 设置？”。                                                                                              |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化凭证检查器元数据，无需加载完整渠道运行时即可回答“是否已经有任何内容登录？”。                                                                                                |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 内置插件和外部发布插件的安装/更新提示。                                                                                                                                                 |
| `openclaw.install.defaultChoice`                                  | 有多个安装来源可用时的首选安装路径。                                                                                                                                                    |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw 宿主版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                                                                   |
| `openclaw.install.expectedIntegrity`                              | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会用它校验获取到的工件。                                                                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | 当配置无效时，允许一个很窄的内置插件重装恢复路径。                                                                                                                                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许仅设置渠道界面在启动期间先于完整渠道插件加载。                                                                                                                                      |

Manifest 元数据决定在运行时加载之前，哪些提供商/渠道/设置选项会出现在
新手引导中。`package.json#openclaw.install` 会告诉新手引导在用户选择其中一个
选项时，如何获取或启用该插件。不要把安装提示移到 `openclaw.plugin.json`。

`openclaw.install.minHostVersion` 会在安装和 manifest 注册表加载期间强制执行。
无效值会被拒绝；较新但有效的值会让插件在较旧宿主上被跳过。

精确 npm 版本固定已经位于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录
条目应将精确 spec 与 `expectedIntegrity` 配对，这样如果获取到的 npm 工件
不再匹配固定发布版本，更新流程会以关闭方式失败。为兼容性，交互式新手引导
仍会提供受信任注册表 npm spec，包括裸包名和 dist-tag。目录诊断可以区分
精确、浮动、完整性固定、缺少完整性、包名不匹配，以及无效默认选择来源。
当 `expectedIntegrity` 存在但没有可被它固定的有效 npm 来源时，它们也会发出警告。
当 `expectedIntegrity` 存在时，
安装/更新流程会强制校验它；省略时，注册表解析会被记录但不带完整性固定。

当 Status、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账号时，
渠道插件应提供 `openclaw.setupEntry`。设置入口应暴露渠道元数据，以及设置安全的配置、
Status 和机密适配器；将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源入口点字段的包边界检查。例如，
`openclaw.runtimeExtensions` 不能让逃逸的 `openclaw.extensions` 路径变为可加载。

`openclaw.install.allowInvalidConfigRecovery` 是刻意收窄的。它不会让任意损坏配置变得可安装。
目前它只允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，
或同一个内置插件的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作者引导到
`openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个小型检查器模块的包元数据：

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

当设置、Doctor、Status 或只读存在性流程需要在完整渠道插件加载前做一次低成本
是/否凭证探测时使用它。持久化凭证状态不是已配置渠道状态：不要使用此元数据来自动启用插件、
修复运行时依赖，或决定是否应加载渠道运行时。目标导出应是一个只读取持久化状态的小函数；
不要通过完整渠道运行时 barrel 转发它。

`openclaw.channel.configuredState` 对低成本仅 env 已配置检查采用相同形状：

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

当渠道可以从 env 或其他很小的非运行时输入回答已配置状态时使用它。如果检查需要完整配置解析
或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState`
钩子中。

## 设备发现优先级（重复插件 ID）

OpenClaw 会从多个根发现插件（内置、全局安装、工作区、显式配置选择的路径）。如果两个发现结果共享同一个 `id`，只保留**优先级最高**的 manifest；较低优先级的重复项会被丢弃，而不是并排加载。

优先级从高到低：

1. **配置选择** — 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** — 随 OpenClaw 一起发布的插件
3. **全局安装** — 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** — 相对于当前工作区发现的插件

影响：

- 工作区中某个内置插件的分叉或陈旧副本不会遮蔽内置构建。
- 如果确实要用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，让它依靠优先级获胜，而不是依赖工作区发现。
- 重复项丢弃会被记录，这样 Doctor 和启动诊断就能指向被丢弃的副本。

## JSON Schema 要求

- **每个插件都必须附带 JSON Schema**，即使它不接受任何配置。
- 空 schema 可以接受（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读/写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 ID 由
  插件 manifest 声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现**的插件 ID。未知 ID 是**错误**。
- 如果插件已安装但 manifest 或 schema 损坏或缺失，
  验证会失败，Doctor 会报告插件错误。
- 如果插件配置存在但插件被**禁用**，配置会被保留，并在
  Doctor + 日志中显示**警告**。

完整 `plugins.*` schema 见[配置参考](/zh-CN/gateway/configuration)。

## 备注

- 原生 OpenClaw 插件**必须**提供 manifest，包括本地文件系统加载。运行时仍会单独加载插件模块；manifest 只用于发现 + 验证。
- 原生 manifest 使用 JSON5 解析，因此只要最终值仍是对象，就接受注释、尾随逗号和未加引号的键。
- Manifest 加载器只读取已文档化的 manifest 字段。避免自定义顶层键。
- 当插件不需要 `channels`、`providers`、`cliBackends` 和 `skills` 时，它们都可以省略。
- `providerDiscoveryEntry` 必须保持轻量级，不应导入宽泛的运行时代码；将它用于静态提供商目录元数据或狭窄的发现描述符，而不是请求时执行。
- 独占插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 在此 manifest 中声明独占插件类型。运行时入口 `OpenClawPluginDefinition.kind` 已弃用，仅作为旧插件的兼容性回退保留。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅为声明式。Status、审计、cron 投递验证和其他只读界面在将环境变量视为已配置前，仍会应用插件信任和有效激活策略。
- 对于需要提供商代码的运行时向导元数据，见[提供商运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤和任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关

<CardGroup cols={3}>
  <Card title="构建插件" href="/zh-CN/plugins/building-plugins" icon="rocket">
    插件入门。
  </Card>
  <Card title="插件架构" href="/zh-CN/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="SDK 概览" href="/zh-CN/plugins/sdk-overview" icon="book">
    插件 SDK 参考和子路径导入。
  </Card>
</CardGroup>
