---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要发布插件配置 schema，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-28T01:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: f19c39220215b72341b89540ee952642c3387effb8f32cbc5a623571e4f9afd1
    source_path: plugins/manifest.md
    workflow: 15
---

此页面仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参阅 [Plugin bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但它们不会根据这里描述的 `openclaw.plugin.json` schema 进行验证。

对于兼容 bundle，当前当布局符合 OpenClaw 运行时期望时，OpenClaw 会读取 bundle 元数据、声明的 skill 根目录、Claude 命令根目录、Claude bundle 的 `settings.json` 默认值、Claude bundle 的 LSP 默认值，以及受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
关于原生能力模型和当前外部兼容性指引，请参阅：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便在不启动插件运行时的情况下进行检查。

**请将它用于：**

- 插件标识、配置验证和配置 UI 提示
- 认证、新手引导和设置元数据（别名、自动启用、provider 环境变量、认证选项）
- 控制平面界面的激活提示
- 简写的模型家族归属
- 静态能力归属快照（`contracts`）
- 共享 `openclaw qa` 宿主可检查的 QA 运行器元数据
- 合并到目录和验证界面中的渠道特定配置元数据

**不要将它用于：** 注册运行时行为、声明代码入口点或 npm 安装元数据。这些内容属于你的插件代码和 `package.json`。

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
| `id` | 是 | `string` | 规范的插件 id。这就是在 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 此插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略它，或设置为任何非 `true` 的值，都会使插件默认保持禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会规范化为此标准插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些 provider id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的排他性插件类型。 |
| `channels` | 否 | `string[]` | 由此插件拥有的渠道 id。用于发现和配置验证。 |
| `providers` | 否 | `string[]` | 由此插件拥有的 provider id。 |
| `providerDiscoveryEntry` | 否 | `string` | 轻量级 provider 发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、限定于清单作用域的 provider 目录元数据。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。 |
| `modelCatalog` | 否 | `object` | 由声明方式定义的、适用于此插件所拥有 provider 的模型目录元数据。这是未来只读列表、新手引导、模型选择器、别名和抑制功能的控制平面契约，并且无需加载插件运行时。 |
| `modelPricing` | 否 | `object` | 由 provider 拥有的外部定价查找策略。用它可将本地 / 自托管 provider 排除在远程定价目录之外，或将 provider 引用映射到 OpenRouter / LiteLLM 目录 id，而无需在核心中硬编码 provider id。 |
| `modelIdNormalization` | 否 | `object` | 由 provider 拥有的模型 id 别名 / 前缀清理逻辑，必须在 provider 运行时加载前执行。 |
| `providerEndpoints` | 否 | `object[]` | 由清单拥有的 endpoint 主机 / baseUrl 元数据，用于核心必须在 provider 运行时加载前分类的 provider 路由。 |
| `providerRequest` | 否 | `object` | 轻量级 provider 家族和请求兼容性元数据，供通用请求策略在 provider 运行时加载前使用。 |
| `cliBackends` | 否 | `string[]` | 由此插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 其插件自有 synthetic auth hook 应在运行时加载前的冷模型发现期间被探测的 provider 或 CLI 后端引用。 |
| `nonSecretAuthMarkers` | 否 | `string[]` | 由内置插件拥有的占位 API 密钥值，用于表示非机密的本地、OAuth 或环境凭证状态。 |
| `commandAliases` | 否 | `object[]` | 由此插件拥有的命令名，在运行时加载前应生成具备插件感知能力的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | 已弃用的兼容性环境变量元数据，用于 provider 认证 / 状态查找。对于新插件，优先使用 `setup.providers[].envVars`；在弃用窗口期间，OpenClaw 仍会读取此字段。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行认证查找的 provider id，例如共享基础 provider API 密钥和认证配置文件的编码 provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 可在不加载插件代码的情况下检查的轻量级渠道环境变量元数据。将其用于通用启动 / 配置辅助工具应看到的、由环境变量驱动的渠道设置或认证界面。 |
| `providerAuthChoices` | 否 | `object[]` | 轻量级认证选项元数据，用于新手引导选择器、首选 provider 解析和简单 CLI 标志绑定。 |
| `activation` | 否 | `object` | 轻量级激活规划器元数据，用于由 provider、命令、渠道、路由和能力触发的加载。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 轻量级设置 / 新手引导描述符，供发现和设置界面在不加载插件运行时的情况下检查。 |
| `qaRunners` | 否 | `object[]` | 轻量级 QA 运行器描述符，供共享 `openclaw qa` 宿主在插件运行时加载前使用。 |
| `contracts` | 否 | `object` | 外部认证 hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、网页搜索和工具归属的静态内置能力快照。 |
| `mediaUnderstandingProviderMetadata` | 否 | `Record<string, object>` | 为 `contracts.mediaUnderstandingProviders` 中声明的 provider id 提供的轻量级媒体理解默认值。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，在运行时加载前合并到发现和验证界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 显示在插件界面中的简短摘要。 |
| `version` | 否 | `string` | 信息性插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在 provider 运行时加载前读取它。
provider 设置列表会使用这些清单选项、从描述符派生的设置选项，以及安装目录元数据，而无需加载 provider 运行时。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的 provider id。 |
| `method` | 是 | `string` | 要分派到的认证方式 id。 |
| `choiceId` | 是 | `string` | 供新手引导和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器中的简短辅助文本。 |
| `assistantPriority` | 否 | `number` | 在由助手驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在助手选择器中隐藏此选项，同时仍允许通过手动 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于对相关选项分组的可选分组 id。 |
| `groupLabel` | 否 | `string` | 该分组面向用户的标签。 |
| `groupHint` | 否 | `string` | 该分组的简短辅助文本。 |
| `optionKey` | 否 | `string` | 简单单标志认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI 标志名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形式，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | 用于 CLI 帮助的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有某个运行时命令名称，而用户可能误将其放入 `plugins.allow` 或尝试将其作为根级 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据来提供诊断，而无需导入插件运行时代码。

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
| `cliCommand` | 否 | `string` | 若存在，用于建议进行 CLI 操作的相关根级 CLI 命令。 |

## `activation` 参考

当插件可以低成本地声明哪些控制平面事件应将其纳入激活 / 加载计划时，请使用 `activation`。

此块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段在回退到现有清单归属元数据（如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前，先缩小候选插件范围。

优先使用已经能描述归属关系的最窄元数据。当这些字段足以表达关系时，请使用 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts`。对于那些无法通过这些归属字段表达的额外规划提示，再使用 `activation`。
对于 `claude-cli`、`codex-cli` 或 `google-gemini-cli` 之类的 CLI 运行时别名，请使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅用于尚未拥有归属字段的嵌入式 agent harness id。

此块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方会先把它当作缩小范围的提示，然后才进行更广泛的插件加载，因此缺失激活元数据通常只会带来性能成本；只要旧版清单归属回退仍然存在，它就不应改变正确性。

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
| `onProviders` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的 provider id。 |
| `onAgentHarnesses` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的嵌入式 agent harness 运行时 id。CLI 后端别名请使用顶层 `cliBackends`。 |
| `onCommands` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的命令 id。 |
| `onChannels` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应将此插件纳入激活 / 加载计划的路由类型。 |
| `onConfigPaths` | 否 | `string[]` | 当路径存在且未被显式禁用时，应将此插件纳入启动 / 加载计划的相对于根的配置路径。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划所用的宽泛能力提示。若可能，优先使用更窄的字段。 |

当前在线使用方包括：

- 由命令触发的 CLI 规划会回退到旧版的
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- agent 运行时启动规划会对嵌入式 harness 使用 `activation.onAgentHarnesses`，对 CLI 运行时别名使用顶层 `cliBackends[]`
- 由渠道触发的设置 / 渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]` 归属
- 启动插件规划会对非渠道的根配置界面使用 `activation.onConfigPaths`，例如内置浏览器插件的 `browser` 块
- 由 provider 触发的设置 / 运行时规划在缺少显式 provider 激活元数据时，会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示匹配了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 归属。这些原因标签用于宿主诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享 `openclaw qa` 根命令下提供一个或多个传输运行器时，请使用 `qaRunners`。请保持这些元数据轻量且静态；实际的 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 接口负责。

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
| `description` | 否 | `string` | 当共享宿主需要存根命令时使用的回退帮助文本。 |

## `setup` 参考

当设置和新手引导界面需要在运行时加载前获取由插件拥有的轻量级元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是专用于设置的描述符界面，供应保持为仅元数据的控制平面 / 设置流程使用。

存在 `setup.providers` 和 `setup.cliBackends` 时，它们是设置发现时首选的“描述符优先”查找界面。如果描述符仅用于缩小候选插件范围，而设置仍需要更丰富的设置期运行时 hook，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

OpenClaw 还会将 `setup.providers[].envVars` 纳入通用 provider 认证和环境变量查找。`providerAuthEnvVars` 在弃用窗口期间仍通过兼容适配器受支持，但仍在使用它的非内置插件会收到清单诊断。新插件应将设置 / 状态环境变量元数据放在 `setup.providers[].envVars` 上。

OpenClaw 也可以在没有 setup 条目可用时，或当 `setup.requiresRuntime: false` 声明不需要 setup 运行时时，根据 `setup.providers[].authMethods` 派生出简单的设置选项。对于自定义标签、CLI 标志、新手引导范围和助手元数据，显式的 `providerAuthChoices` 条目仍然是首选。

仅当这些描述符已足以满足设置界面需求时，才设置 `requiresRuntime: false`。OpenClaw 会将显式 `false` 视为仅描述符契约，并且不会为了 setup 查找而执行 `setup-api` 或 `openclaw.setupEntry`。如果仅描述符插件仍然提供了这些 setup 运行时入口之一，OpenClaw 会报告附加诊断，并继续忽略它。省略 `requiresRuntime` 会保留旧版回退行为，从而避免那些添加了描述符但未设置该标志的现有插件发生破坏。

由于 setup 查找可能会执行插件自有的 `setup-api` 代码，规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在所有已发现插件之间保持唯一。归属不明确时会采用失败关闭，而不是按发现顺序选出一个“赢家”。

当 setup 运行时确实执行时，如果 `setup-api` 注册了清单描述符未声明的 provider 或 CLI 后端，或者某个描述符没有对应的运行时注册，setup 注册表诊断会报告描述符漂移。这些诊断是附加性的，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在 setup 或新手引导期间暴露的 provider id。保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 此 provider 在无需加载完整运行时的情况下支持的 setup / 认证方式 id。 |
| `envVars` | 否 | `string[]` | 通用 setup / 状态界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在 setup 和新手引导期间暴露的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先 setup 查找的设置期后端 id。保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由此插件的 setup 界面拥有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 描述符查找之后，setup 是否仍需要执行 `setup-api`。 |

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

每个字段提示可包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短辅助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级字段。 |
| `sensitive` | `boolean` | 将该字段标记为机密或敏感字段。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅将 `contracts` 用于 OpenClaw 可在不导入插件运行时的情况下读取的静态能力归属元数据。

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
| `migrationProviders` | `string[]` | 此插件为 `openclaw migrate` 拥有的导入 provider id。 |
| `tools` | `string[]` | 此插件为内置契约检查拥有的智能体工具名称。 |

`contracts.embeddedExtensionFactories` 被保留用于仅适用于内置 Codex app-server 的扩展工厂。内置工具结果转换应声明 `contracts.agentToolResultMiddleware`，并通过 `api.registerAgentToolResultMiddleware(...)` 注册。外部插件不能注册工具结果中间件，因为该接口可能会在模型看到之前重写高信任度的工具输出。

实现了 `resolveExternalAuthProfiles` 的 provider 插件应声明 `contracts.externalAuthProviders`。未声明的插件仍会通过已弃用的兼容性回退运行，但该回退更慢，并将在迁移窗口结束后移除。

内置的 Memory 嵌入 provider 应为其暴露的每个适配器 id 声明 `contracts.memoryEmbeddingProviders`，包括如 `local` 之类的内置适配器。独立 CLI 路径使用此清单契约，在完整 Gateway 网关运行时注册 provider 之前，仅加载拥有对应归属的插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解 provider 具有默认模型、自动认证回退优先级或通用核心辅助工具在运行时加载前所需的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。其中的键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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
| `defaultModels` | `Record<string, string>` | 当配置未指定模型时使用的“能力到模型”默认值。 |
| `autoPriority` | `Record<string, number>` | 用于基于凭证的自动 provider 回退时，数字越小排序越靠前。 |
| `nativeDocumentInputs` | `"pdf"[]` | provider 支持的原生文档输入。 |

## `channelConfigs` 参考

当渠道插件在运行时加载前需要轻量级配置元数据时，请使用 `channelConfigs`。当没有 setup 条目可用时，或当 `setup.requiresRuntime: false` 声明不需要 setup 运行时时，只读的渠道 setup / 状态发现可以直接使用这些元数据来处理已配置的外部渠道。

`channelConfigs` 是插件清单元数据，不是新的顶层用户配置区段。用户仍然在 `channels.<channel-id>` 下配置渠道实例。OpenClaw 会读取清单元数据，以决定在插件运行时代码执行前，哪个插件拥有该已配置渠道。

对于渠道插件，`configSchema` 和 `channelConfigs` 描述的是不同路径：

- `configSchema` 用于验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 用于验证 `channels.<channel-id>`

声明了 `channels[]` 的非内置插件也应声明匹配的 `channelConfigs` 条目。否则，OpenClaw 仍然可以加载该插件，但冷路径配置 schema、setup 和 Control UI 界面在插件运行时执行之前将无法得知该渠道拥有的选项结构。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以为在渠道运行时加载前执行的命令配置检查声明静态 `auto` 默认值。内置渠道也可以通过 `package.json#openclaw.channel.commands`，连同其他包自有的渠道目录元数据一起发布相同的默认值。

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

每个渠道条目可包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供。 |
| `uiHints` | `Record<string, object>` | 该渠道配置区段可选的 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道描述。 |
| `commands` | `object` | 用于运行时前配置检查的静态原生命令和原生 Skills 自动默认值。 |
| `preferOver` | `string[]` | 在选择界面中，此渠道应优先于的旧版或较低优先级插件 id。 |

### 替换另一个渠道插件

当你的插件是某个渠道 id 的首选拥有者，而另一个插件也能提供该渠道时，请使用 `preferOver`。常见情况包括插件 id 重命名、独立插件取代内置插件，或为保持配置兼容性而沿用相同渠道 id 的维护分支。

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

当配置了 `channels.chat` 时，OpenClaw 会同时考虑渠道 id 和首选插件 id。如果较低优先级插件只是因为它是内置插件或默认启用而被选中，OpenClaw 会在生效运行时配置中禁用它，从而让一个插件独占该渠道及其工具。显式用户选择仍然优先生效：如果用户显式启用了两个插件，OpenClaw 会保留该选择，并报告重复的渠道 / 工具诊断，而不是悄悄更改所请求的插件集合。

请将 `preferOver` 限定在那些确实能提供同一渠道的插件 id 上。它不是一个通用优先级字段，也不会重命名用户配置键。

## `modelSupport` 参考

当 OpenClaw 需要在插件运行时加载前，根据 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 id 推断你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用使用其拥有者的 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件都匹配，则非内置插件胜出
- 剩余歧义会被忽略，直到用户或配置指定 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 对简写模型 id 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

## `modelCatalog` 参考

当 OpenClaw 需要在加载插件运行时之前了解 provider 模型元数据时，请使用 `modelCatalog`。这是固定目录行、provider 别名、抑制规则和发现模式的清单自有来源。运行时刷新仍属于 provider 运行时代码，但清单会告诉核心何时需要运行时。

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
| `providers` | `Record<string, object>` | 由此插件拥有的 provider id 的目录行。键也应出现在顶层 `providers` 中。 |
| `aliases` | `Record<string, object>` | 应解析到某个自有 provider 的 provider 别名，用于目录或抑制规划。 |
| `suppressions` | `object[]` | 由于 provider 特定原因而被此插件抑制的、来自其他来源的模型行。 |
| `discovery` | `Record<string, "static" \| "refreshable" \| "runtime">` | 该 provider 目录是否可以从清单元数据读取、刷新到缓存，或必须依赖运行时。 |

`aliases` 会参与 modelCatalog 规划中的 provider 归属查找。别名目标必须是由同一插件拥有的顶层 provider。当经过 provider 过滤的列表使用别名时，OpenClaw 可以读取拥有者清单并应用别名的 API / base URL 覆盖，而无需加载 provider 运行时。

`suppressions` 取代了旧版 provider 运行时的 `suppressBuiltInModel` hook。仅当 provider 由该插件拥有，或被声明为指向自有 provider 的 `modelCatalog.aliases` 键时，抑制条目才会生效。在模型解析期间，不再调用运行时抑制 hook。

Provider 字段：

| 字段 | 类型 | 含义 |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string` | 该 provider 目录中模型的可选默认 base URL。 |
| `api` | `ModelApi` | 该 provider 目录中模型的可选默认 API 适配器。 |
| `headers` | `Record<string, string>` | 应用于该 provider 目录的可选静态请求头。 |
| `models` | `object[]` | 必填的模型行。没有 `id` 的行会被忽略。 |

模型字段：

| 字段 | 类型 | 含义 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id` | `string` | provider 本地模型 id，不带 `provider/` 前缀。 |
| `name` | `string` | 可选显示名称。 |
| `api` | `ModelApi` | 可选的逐模型 API 覆盖。 |
| `baseUrl` | `string` | 可选的逐模型 base URL 覆盖。 |
| `headers` | `Record<string, string>` | 可选的逐模型静态请求头。 |
| `input` | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 该模型接受的模态。 |
| `reasoning` | `boolean` | 该模型是否暴露推理行为。 |
| `contextWindow` | `number` | 原生 provider 上下文窗口。 |
| `contextTokens` | `number` | 当与 `contextWindow` 不同时，可选的有效运行时上下文上限。 |
| `maxTokens` | `number` | 已知时的最大输出 token 数。 |
| `cost` | `object` | 可选的每百万 token 美元定价，包括可选的 `tieredPricing`。 |
| `compat` | `object` | 与 OpenClaw 模型配置兼容性匹配的可选兼容性标志。 |
| `status` | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅当该行完全不应出现时才使用 suppression。 |
| `statusReason` | `string` | 与非可用状态一同显示的可选原因。 |
| `replaces` | `string[]` | 此模型取代的旧版 provider 本地模型 id。 |
| `replacedBy` | `string` | 已弃用条目的替代 provider 本地模型 id。 |
| `tags` | `string[]` | 供选择器和过滤器使用的稳定标签。 |

抑制字段：

| 字段 | 类型 | 含义 |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | 要抑制的上游行所属的 provider id。必须由此插件拥有，或声明为自有别名。 |
| `model` | `string` | 要抑制的 provider 本地模型 id。 |
| `reason` | `string` | 直接请求被抑制行时显示的可选消息。 |
| `when.baseUrlHosts` | `string[]` | 抑制生效前所需的有效 provider base URL 主机可选列表。 |
| `when.providerConfigApiIn` | `string[]` | 抑制生效前所需的精确 provider 配置 `api` 值可选列表。 |

不要将仅运行时数据放入 `modelCatalog`。如果某个 provider 需要账户状态、API 请求或本地进程发现才能知道完整模型集合，请在 `discovery` 中将该 provider 声明为 `refreshable` 或 `runtime`。

## `modelIdNormalization` 参考

对于必须在 provider 运行时加载前完成的、由 provider 自有的轻量级模型 id 清理，请使用 `modelIdNormalization`。这样可以将短模型名称、provider 本地旧版 id 和代理前缀规则等别名保存在所属插件清单中，而不是放在核心模型选择表中。

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

Provider 字段：

| 字段 | 类型 | 含义 |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases` | `Record<string,string>` | 不区分大小写的精确模型 id 别名。返回值将按原样保留。 |
| `stripPrefixes` | `string[]` | 在别名查找前要移除的前缀，适用于旧版 `provider/model` 重复形式。 |
| `prefixWhenBare` | `string` | 当规范化后的模型 id 尚未包含 `/` 时要添加的前缀。 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]` | 别名查找后应用的条件性裸 id 前缀规则，按 `modelPrefix` 和 `prefix` 键控。 |

## `providerEndpoints` 参考

对于通用请求策略在 provider 运行时加载前必须知道的 endpoint 分类，请使用 `providerEndpoints`。核心仍拥有每个 `endpointClass` 的含义；插件清单则拥有主机和 base URL 元数据。

Endpoint 字段：

| 字段 | 类型 | 含义 |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass` | `string` | 已知的核心 endpoint 类别，例如 `openrouter`、`moonshot-native` 或 `google-vertex`。 |
| `hosts` | `string[]` | 映射到该 endpoint 类别的精确主机名。 |
| `hostSuffixes` | `string[]` | 映射到该 endpoint 类别的主机后缀。若只匹配域名后缀，请以 `.` 开头。 |
| `baseUrls` | `string[]` | 映射到该 endpoint 类别的精确规范化 HTTP(S) base URL。 |
| `googleVertexRegion` | `string` | 精确全局主机对应的静态 Google Vertex 区域。 |
| `googleVertexRegionHostSuffix` | `string` | 从匹配主机中去除以暴露 Google Vertex 区域前缀的后缀。 |

## `providerRequest` 参考

对于通用请求策略在不加载 provider 运行时的情况下所需的轻量级请求兼容性元数据，请使用 `providerRequest`。行为特定的负载重写仍应保留在 provider 运行时 hook 或共享 provider 家族辅助工具中。

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

Provider 字段：

| 字段 | 类型 | 含义 |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family` | `string` | 供通用请求兼容性决策和诊断使用的 provider 家族标签。 |
| `compatibilityFamily` | `"moonshot"` | 供共享请求辅助工具使用的可选 provider 家族兼容性分组。 |
| `openAICompletions` | `object` | 与 OpenAI 兼容的 completions 请求标志，目前为 `supportsStreamingUsage`。 |

## `modelPricing` 参考

当 provider 需要在运行时加载前提供控制平面定价行为时，请使用 `modelPricing`。Gateway 网关定价缓存会在不导入 provider 运行时代码的情况下读取这些元数据。

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

Provider 字段：

| 字段 | 类型 | 含义 |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external` | `boolean` | 对于绝不应获取 OpenRouter 或 LiteLLM 定价的本地 / 自托管 provider，设为 `false`。 |
| `openRouter` | `false \| object` | OpenRouter 定价查找映射。设为 `false` 会禁用该 provider 的 OpenRouter 查找。 |
| `liteLLM` | `false \| object` | LiteLLM 定价查找映射。设为 `false` 会禁用该 provider 的 LiteLLM 查找。 |

来源字段：

| 字段 | 类型 | 含义 |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | 当外部目录 provider id 与 OpenClaw provider id 不同时使用的外部目录 provider id，例如 `zai` provider 对应的 `z-ai`。 |
| `passthroughProviderModel` | `boolean` | 将包含斜杠的模型 id 视为嵌套的 `provider/model` 引用，适用于 OpenRouter 这类代理 provider。 |
| `modelIdTransforms` | `"version-dots"[]` | 额外的外部目录模型 id 变体。`version-dots` 会尝试带点号的版本 id，例如 `claude-opus-4.6`。 |

### OpenClaw Provider Index

OpenClaw Provider Index 是由 OpenClaw 拥有的预览元数据，用于其插件可能尚未安装的 provider。它不是插件清单的一部分。插件清单仍然是已安装插件的权威来源。Provider Index 是未来可安装 provider 和安装前模型选择器界面在 provider 插件尚未安装时所使用的内部回退契约。

目录权威顺序：

1. 用户配置。
2. 已安装插件清单中的 `modelCatalog`。
3. 来自显式刷新的模型目录缓存。
4. OpenClaw Provider Index 预览行。

Provider Index 不得包含密钥、启用状态、运行时 hook 或与实时账户相关的模型数据。其预览目录使用与插件清单相同的 `modelCatalog` provider 行结构，但除非有意与已安装插件清单中的运行时适配器字段（如 `api`、`baseUrl`、定价或兼容性标志）保持一致，否则应限制为稳定的显示元数据。对于具备实时 `/models` 发现能力的 provider，应通过显式模型目录缓存路径写入刷新后的行，而不是在普通列表或新手引导过程中调用 provider API。

Provider Index 条目还可以携带适用于那些插件已移出核心或尚未安装的 provider 的可安装插件元数据。这些元数据沿用渠道目录模式：包名、npm 安装规范、预期完整性，以及轻量级认证选项标签，已足以显示一个可安装的设置选项。一旦插件安装完成，其清单即优先生效，而该 provider 的 Provider Index 条目会被忽略。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载不再将这些顶层字段视为能力归属。

## 清单与 `package.json` 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 发现、配置验证、认证选项元数据，以及必须在插件代码运行前存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、setup 或目录元数据的 `openclaw` 块 |

如果你不确定某段元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，就放到 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就放到 `package.json`

### 会影响发现的 `package.json` 字段

某些运行时前插件元数据有意放在 `package.json` 的 `openclaw` 块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions` | 声明原生插件入口点。必须位于插件包目录内。 |
| `openclaw.runtimeExtensions` | 为已安装包声明已构建的 JavaScript 运行时入口点。必须位于插件包目录内。 |
| `openclaw.setupEntry` | 在新手引导、延迟渠道启动和只读渠道状态 / SecretRef 发现期间使用的轻量级仅 setup 入口点。必须位于插件包目录内。 |
| `openclaw.runtimeSetupEntry` | 为已安装包声明已构建的 JavaScript setup 入口点。必须位于插件包目录内。 |
| `openclaw.channel` | 轻量级渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.commands` | 在渠道运行时加载前，供配置、审计和命令列表界面使用的静态原生命令和原生 Skills 自动默认元数据。 |
| `openclaw.channel.configuredState` | 轻量级已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅环境变量驱动的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量级持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何已登录状态？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 用于内置和外部发布插件的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 存在多个安装来源时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低支持的 OpenClaw 宿主版本，使用如 `>=2026.3.22` 这样的 semver 下限。 |
| `openclaw.install.expectedIntegrity` | 预期的 npm 分发完整性字符串，例如 `sha512-...`；安装和更新流程会据此验证获取到的工件。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个受限的内置插件重装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅 setup 的渠道界面，再加载完整渠道插件。 |

清单元数据决定了在运行时加载前，哪些 provider / 渠道 / setup 选项会出现在新手引导中。`package.json#openclaw.install` 则告诉新手引导：当用户选择其中一个选项时，应如何获取或启用该插件。不要把安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；较新的但有效的值会使插件在较旧宿主上被跳过。

精确 npm 版本钉住已经位于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确 spec 与 `expectedIntegrity` 配对使用，这样如果获取到的 npm 工件不再匹配被钉住的发布版本，更新流程就会采用失败关闭。为兼容性考虑，交互式新手引导仍会提供受信任注册表 npm spec，包括裸包名和 dist-tag。目录诊断可以区分精确来源、浮动来源、带完整性钉住来源、缺少完整性来源、包名不匹配来源和无效默认选项来源。它们还会在存在 `expectedIntegrity` 但没有可用于钉住它的有效 npm 来源时发出警告。当存在 `expectedIntegrity` 时，安装 / 更新流程会强制执行它；当省略时，注册表解析结果会被记录，但不会带完整性钉住。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。该 setup 入口应暴露渠道元数据，以及适用于 setup 的安全配置、状态和 secrets 适配器；请将网络客户端、Gateway 网关监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不会覆盖源入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的范围是有意收窄的。它不会让任意损坏的配置都变得可安装。当前它只允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或同一内置插件下陈旧的 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并引导操作员使用 `openclaw doctor --fix`。

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

当 setup、Doctor、Status 或只读存在性流程需要在完整渠道插件加载前进行廉价的“是 / 否”认证探测时，请使用它。持久化认证状态不等于已配置的渠道状态：不要用这些元数据来自动启用插件、修复运行时依赖，或决定是否应加载某个渠道运行时。目标导出应是一个仅仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 转发它。

`openclaw.channel.configuredState` 采用相同的结构，用于廉价的仅环境变量已配置检查：

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

当某个渠道可以仅根据环境变量或其他很小的非运行时输入回答其已配置状态时，请使用它。如果该检查需要完整配置解析或真实的渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 发现优先级（重复插件 id）

OpenClaw 会从多个根位置发现插件（内置、全局安装、工作区、显式配置选择的路径）。如果两个发现结果共享相同的 `id`，则只保留**优先级最高**的清单；较低优先级的重复项会被丢弃，而不会与其并列加载。

优先级从高到低如下：

1. **配置选择** —— 在 `plugins.entries.<id>` 中显式钉住的路径
2. **内置** —— 随 OpenClaw 一起发布的插件
3. **全局安装** —— 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** —— 相对于当前工作区发现的插件

影响如下：

- 位于工作区中的某个内置插件分支或陈旧副本不会遮蔽内置构建版本。
- 若要真正用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 显式钉住它，使其依靠优先级胜出，而不要依赖工作区发现。
- 被丢弃的重复项会记录到日志中，以便 Doctor 和启动诊断可以指向被舍弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 空 schema 也是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读取 / 写入时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 已由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 属于**错误**。
- 如果插件已安装，但其清单或 schema 缺失或损坏，验证会失败，并且 Doctor 会报告该插件错误。
- 如果插件配置存在，但插件已**禁用**，则配置会被保留，并且 Doctor + 日志中会显示**警告**。

完整 `plugins.*` schema 请参阅 [配置参考](/zh-CN/gateway/configuration)。

## 说明

- 对于**原生 OpenClaw 插件**，包括本地文件系统加载，清单都是**必需的**。运行时仍会单独加载插件模块；清单仅用于发现 + 验证。
- 原生清单使用 JSON5 解析，因此接受注释、尾随逗号和不加引号的键，只要最终值仍然是对象即可。
- 清单加载器只会读取已文档化的清单字段。避免使用自定义顶层键。
- 当插件不需要它们时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入大范围的运行时代码；请将其用于静态 provider 目录元数据或范围较窄的发现描述符，而不是请求时执行逻辑。
- 排他性插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory` 选择，`kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认值为 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅具有声明性。Status、审计、cron 投递验证及其他只读界面在将某个环境变量视为已配置前，仍会应用插件信任和生效激活策略。
- 对于需要 provider 代码的运行时向导元数据，请参阅 [Provider 运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器允许列表要求（例如 pnpm 的 `allow-build-scripts` + `pnpm rebuild <package>`）。

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
