---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要交付一个插件配置 schema，或调试插件验证错误
summary: 插件清单 + JSON schema 要求（严格配置验证）
title: 插件清单
x-i18n:
    generated_at: "2026-04-24T19:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4eb13f5b90656d164736e0fed964e6e2f0c8af2cfc7e9788c888bc65be8f0cf
    source_path: plugins/manifest.md
    workflow: 15
---

本页仅适用于**原生 OpenClaw 插件清单**。

如需了解兼容的 bundle 布局，请参阅 [插件 bundle](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但它们不会按照此处描述的 `openclaw.plugin.json` schema 进行验证。

对于兼容 bundle，OpenClaw 当前会在布局符合 OpenClaw 运行时预期时，读取 bundle 元数据，以及声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值和受支持的 hook pack。

每个原生 OpenClaw 插件**都必须**在**插件根目录**中提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行插件代码的情况下**验证配置。缺失或无效的清单会被视为插件错误，并阻止配置验证。

请参阅完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
有关原生能力模型和当前外部兼容性指南，请参阅：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载你的插件代码之前**读取的元数据。下面的所有内容都必须足够轻量，以便在不启动插件运行时的情况下完成检查。

**用于：**

- 插件标识、配置验证和配置 UI 提示
- 认证、新手引导和设置元数据（别名、自动启用、provider 环境变量、认证选项）
- control-plane 表面的激活提示
- 简写模型家族归属
- 静态能力归属快照（`contracts`）
- 供共享 `openclaw qa` 宿主检查的 QA 运行器元数据
- 合并到 catalog 和验证表面的渠道专用配置元数据

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
| `id`                                 | 是       | `string`                         | 规范插件 ID。这是在 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                          |
| `configSchema`                       | 是       | `object`                         | 此插件配置的内联 JSON Schema。                                                                                                                                                                                                    |
| `enabledByDefault`                   | 否       | `true`                           | 将内置插件标记为默认启用。省略此字段，或将其设置为任何非 `true` 的值，则插件默认保持禁用。                                                                                                                                       |
| `legacyPluginIds`                    | 否       | `string[]`                       | 会规范化为此规范插件 ID 的旧版 ID。                                                                                                                                                                                               |
| `autoEnableWhenConfiguredProviders`  | 否       | `string[]`                       | 当认证、配置或模型引用提到这些 provider ID 时，应自动启用此插件。                                                                                                                                                                 |
| `kind`                               | 否       | `"memory"` \| `"context-engine"` | 声明一个由 `plugins.slots.*` 使用的互斥插件类型。                                                                                                                                                                                 |
| `channels`                           | 否       | `string[]`                       | 由此插件拥有的渠道 ID。用于设备发现和配置验证。                                                                                                                                                                                   |
| `providers`                          | 否       | `string[]`                       | 由此插件拥有的 provider ID。                                                                                                                                                                                                      |
| `providerDiscoveryEntry`             | 否       | `string`                         | 轻量级 provider 发现模块路径，相对于插件根目录，用于可在不激活完整插件运行时的情况下加载的、清单作用域的 provider catalog 元数据。                                                                                                |
| `modelSupport`                       | 否       | `object`                         | 由清单拥有的简写模型家族元数据，用于在运行时之前自动加载插件。                                                                                                                                                                     |
| `providerEndpoints`                  | 否       | `object[]`                       | 由清单拥有的 endpoint host/baseUrl 元数据，用于 core 必须在 provider 运行时加载前分类的 provider 路由。                                                                                                                          |
| `cliBackends`                        | 否       | `string[]`                       | 由此插件拥有的 CLI 推理后端 ID。用于根据显式配置引用在启动时自动激活。                                                                                                                                                            |
| `syntheticAuthRefs`                  | 否       | `string[]`                       | provider 或 CLI 后端引用，在运行时加载前的冷模型发现期间，应探测其由插件拥有的 synthetic auth hook。                                                                                                                               |
| `nonSecretAuthMarkers`               | 否       | `string[]`                       | 由内置插件拥有的占位 API key 值，表示非密钥的本地、OAuth 或环境凭证状态。                                                                                                                                                         |
| `commandAliases`                     | 否       | `object[]`                       | 由此插件拥有的命令名称，在运行时加载前应生成具备插件感知能力的配置和 CLI 诊断信息。                                                                                                                                               |
| `providerAuthEnvVars`                | 否       | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量 provider 认证环境变量元数据。                                                                                                                                                        |
| `providerAuthAliases`                | 否       | `Record<string, string>`         | 应复用另一个 provider ID 进行认证查找的 provider ID，例如共享基础 provider API key 和 auth profile 的 coding provider。                                                                                                            |
| `channelEnvVars`                     | 否       | `Record<string, string[]>`       | OpenClaw 可在不加载插件代码的情况下检查的轻量渠道环境变量元数据。对于由环境变量驱动的渠道设置或认证表面，请使用此字段，以便通用启动/配置辅助逻辑能够看到它们。                                                                    |
| `providerAuthChoices`                | 否       | `object[]`                       | 用于新手引导选择器、首选 provider 解析和简单 CLI 标志接线的轻量认证选项元数据。                                                                                                                                                    |
| `activation`                         | 否       | `object`                         | 用于 provider、命令、渠道、路由和能力触发加载的轻量激活规划器元数据。仅为元数据；实际行为仍由插件运行时拥有。                                                                                                                     |
| `setup`                              | 否       | `object`                         | 轻量设置/新手引导描述符，供设备发现和设置表面在不加载插件运行时的情况下检查。                                                                                                                                                      |
| `qaRunners`                          | 否       | `object[]`                       | 由共享 `openclaw qa` 宿主在插件运行时加载前使用的轻量 QA 运行器描述符。                                                                                                                                                           |
| `contracts`                          | 否       | `object`                         | 外部 auth hook、speech、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、web-fetch、Web 搜索 和工具归属的静态内置能力快照。                                                                                           |
| `mediaUnderstandingProviderMetadata` | 否       | `Record<string, object>`         | 为在 `contracts.mediaUnderstandingProviders` 中声明的 provider ID 提供的轻量媒体理解默认值。                                                                                                                                        |
| `channelConfigs`                     | 否       | `Record<string, object>`         | 由清单拥有的渠道配置元数据，会在运行时加载前合并到设备发现和验证表面中。                                                                                                                                                          |
| `skills`                             | 否       | `string[]`                       | 要加载的 Skills 目录，相对于插件根目录。                                                                                                                                                                                           |
| `name`                               | 否       | `string`                         | 人类可读的插件名称。                                                                                                                                                                                                               |
| `description`                        | 否       | `string`                         | 显示在插件表面中的简短摘要。                                                                                                                                                                                                       |
| `version`                            | 否       | `string`                         | 信息性插件版本。                                                                                                                                                                                                                   |
| `uiHints`                            | 否       | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                                           |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在 provider 运行时加载前读取此信息。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | 是       | `string`                                        | 此选项所属的 provider ID。                                                                               |
| `method`              | 是       | `string`                                        | 要分发到的认证方法 ID。                                                                                  |
| `choiceId`            | 是       | `string`                                        | 由新手引导和 CLI 流程使用的稳定认证选项 ID。                                                            |
| `choiceLabel`         | 否       | `string`                                        | 面向用户的标签。若省略，OpenClaw 会回退到 `choiceId`。                                                   |
| `choiceHint`          | 否       | `string`                                        | 选择器的简短辅助文本。                                                                                   |
| `assistantPriority`   | 否       | `number`                                        | 在由 assistant 驱动的交互式选择器中，值越小排序越靠前。                                                  |
| `assistantVisibility` | 否       | `"visible"` \| `"manual-only"`                  | 在 assistant 选择器中隐藏该选项，但仍允许手动通过 CLI 选择。                                             |
| `deprecatedChoiceIds` | 否       | `string[]`                                      | 旧版选项 ID，应将用户重定向到这个替代选项。                                                              |
| `groupId`             | 否       | `string`                                        | 用于对相关选项分组的可选组 ID。                                                                          |
| `groupLabel`          | 否       | `string`                                        | 该分组的面向用户标签。                                                                                   |
| `groupHint`           | 否       | `string`                                        | 该分组的简短辅助文本。                                                                                   |
| `optionKey`           | 否       | `string`                                        | 用于简单单标志认证流程的内部选项键。                                                                     |
| `cliFlag`             | 否       | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                              |
| `cliOption`           | 否       | `string`                                        | 完整 CLI 选项形式，例如 `--openrouter-api-key <key>`。                                                   |
| `cliDescription`      | 否       | `string`                                        | CLI 帮助中使用的说明。                                                                                   |
| `onboardingScopes`    | 否       | `Array<"text-inference" \| "image-generation">` | 该选项应出现在哪些新手引导表面中。若省略，则默认是 `["text-inference"]`。                               |

## `commandAliases` 参考

当插件拥有某个运行时命令名，而用户可能错误地将其放入 `plugins.allow`，或者尝试将其作为根 CLI 命令运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据来生成诊断信息，而无需导入插件运行时代码。

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
| `name`       | 是       | `string`          | 属于此插件的命令名称。                                                  |
| `kind`       | 否       | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根 CLI 命令。                         |
| `cliCommand` | 否       | `string`          | 若存在，用于 CLI 操作时建议的相关根 CLI 命令。                          |

## `activation` 参考

当插件可以低成本声明哪些 control-plane 事件应将其纳入激活/加载计划时，请使用 `activation`。

此块是规划器元数据，而不是生命周期 API。它不会注册运行时行为，不会替代 `register(...)`，也不保证插件代码已经执行。激活规划器使用这些字段在回退到现有清单归属元数据（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hooks）之前缩小候选插件范围。

优先使用已经能描述归属关系的最窄元数据。当这些字段能够表达关系时，请使用 `providers`、`channels`、`commandAliases`、setup 描述符或 `contracts`。只有在这些归属字段无法表示额外规划提示时，才使用 `activation`。

此块仅是元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时/插件入口点。当前使用方会将其作为更广泛插件加载之前的缩小范围提示，因此缺少激活元数据通常只会影响性能；在旧版清单归属回退仍存在时，它不应改变正确性。

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
| `onProviders`    | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的 provider ID。                                                             |
| `onCommands`     | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的命令 ID。                                                                  |
| `onChannels`     | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的渠道 ID。                                                                  |
| `onRoutes`       | 否       | `string[]`                                           | 应将此插件纳入激活/加载计划的路由类型。                                                                 |
| `onCapabilities` | 否       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane 激活规划使用的宽泛能力提示。可能时优先使用更窄的字段。                                    |

当前的实时使用方：

- 由命令触发的 CLI 规划会回退到旧版
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的 setup/channel 规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]`
  归属
- 由 provider 触发的 setup/runtime 规划在缺少显式 provider
  激活元数据时，会回退到旧版 `providers[]` 和顶层 `cliBackends[]` 归属

规划器诊断可以区分显式激活提示和清单归属回退。例如，`activation-command-hint` 表示命中了 `activation.onCommands`，而 `manifest-command-alias` 表示规划器改为使用 `commandAliases` 归属。这些原因标签面向宿主诊断和测试；插件作者应继续声明最能描述归属关系的元数据。

## `qaRunners` 参考

当插件在共享 `openclaw qa` 根命令下提供一个或多个传输运行器时，请使用 `qaRunners`。请让这些元数据保持轻量且静态；实际 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量 `runtime-api.ts` 表面拥有。

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
| `commandName` | 是       | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。                   |
| `description` | 否       | `string` | 当共享宿主需要一个桩命令时使用的后备帮助文本。                     |

## `setup` 参考

当设置和新手引导表面在运行时加载前需要低成本的插件拥有元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是一个面向 setup 的描述符表面，供应保持为纯元数据的 control-plane/setup 流程使用。

存在 `setup.providers` 和 `setup.cliBackends` 时，它们是 setup 发现的首选“描述符优先”查找表面。如果描述符只能缩小候选插件范围，而 setup 仍需要更丰富的设置时运行时 hooks，请设置 `requiresRuntime: true`，并保留 `setup-api` 作为回退执行路径。

仅当这些描述符对 setup 表面来说已经足够时，才设置 `requiresRuntime: false`。OpenClaw 会将显式 `false` 视为仅描述符契约，并且在 setup 查找时不会执行 `setup-api`。若省略 `requiresRuntime`，则保留旧版回退行为，以确保那些添加了描述符但未添加该标志的现有插件不会出问题。

由于 setup 查找可能会执行插件拥有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在所有已发现插件之间保持唯一。归属不明确时会以失败关闭，而不是按发现顺序选择一个赢家。

当 setup 运行时确实执行时，如果 `setup-api` 注册了清单描述符中未声明的 provider 或 CLI 后端，或者某个描述符没有匹配的运行时注册，setup 注册表诊断会报告描述符漂移。这些诊断是增量补充，不会拒绝旧版插件。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | 是       | `string`   | 在 setup 或新手引导期间暴露的 provider ID。请保持规范化 ID 在全局范围内唯一。       |
| `authMethods` | 否       | `string[]` | 此 provider 在不加载完整运行时的情况下支持的 setup/auth 方法 ID。                   |
| `envVars`     | 否       | `string[]` | 通用 setup/status 表面可在插件运行时加载前检查的环境变量。                          |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | 否       | `object[]` | 在 setup 和新手引导期间暴露的 provider setup 描述符。                                               |
| `cliBackends`      | 否       | `string[]` | 用于“描述符优先” setup 查找的 setup 时后端 ID。请保持规范化 ID 在全局范围内唯一。                  |
| `configMigrations` | 否       | `string[]` | 属于此插件 setup 表面的配置迁移 ID。                                                                |
| `requiresRuntime`  | 否       | `boolean`  | 在描述符查找之后，setup 是否仍需要执行 `setup-api`。                                                |

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

每个字段提示可以包含：

| 字段 | 类型 | 含义 |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | 面向用户的字段标签。                    |
| `help`        | `string`   | 简短辅助文本。                          |
| `tags`        | `string[]` | 可选的 UI 标签。                        |
| `advanced`    | `boolean`  | 将该字段标记为高级项。                  |
| `sensitive`   | `boolean`  | 将该字段标记为密钥或敏感项。            |
| `placeholder` | `string`   | 表单输入的占位文本。                    |

## `contracts` 参考

仅在 OpenClaw 可在不导入插件运行时的情况下读取静态能力归属元数据时使用 `contracts`。

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
| -------------------------------- | ---------- | ---------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | 已弃用的内嵌 extension factory ID。                              |
| `agentToolResultMiddleware`      | `string[]` | 此插件可为其注册工具结果中间件的 harness ID。                    |
| `externalAuthProviders`          | `string[]` | 此插件拥有其外部 auth profile hook 的 provider ID。              |
| `speechProviders`                | `string[]` | 此插件拥有的 speech provider ID。                                |
| `realtimeTranscriptionProviders` | `string[]` | 此插件拥有的实时转录 provider ID。                               |
| `realtimeVoiceProviders`         | `string[]` | 此插件拥有的实时语音 provider ID。                               |
| `memoryEmbeddingProviders`       | `string[]` | 此插件拥有的 memory embedding provider ID。                      |
| `mediaUnderstandingProviders`    | `string[]` | 此插件拥有的媒体理解 provider ID。                               |
| `imageGenerationProviders`       | `string[]` | 此插件拥有的图像生成 provider ID。                               |
| `videoGenerationProviders`       | `string[]` | 此插件拥有的视频生成 provider ID。                               |
| `webFetchProviders`              | `string[]` | 此插件拥有的 web-fetch provider ID。                             |
| `webSearchProviders`             | `string[]` | 此插件拥有的 Web 搜索 provider ID。                              |
| `tools`                          | `string[]` | 此插件为内置契约检查所拥有的智能体工具名称。                     |

`contracts.embeddedExtensionFactories` 被保留用于仍然需要直接 Pi 内嵌运行器事件的内置兼容代码。新的工具结果转换应声明 `contracts.agentToolResultMiddleware`，并改用 `api.registerAgentToolResultMiddleware(...)` 进行注册。

实现 `resolveExternalAuthProfiles` 的 provider 插件应声明 `contracts.externalAuthProviders`。未声明该字段的插件仍会通过一个已弃用的兼容性回退路径运行，但该回退路径更慢，并将在迁移窗口结束后移除。

内置 memory embedding provider 应为其暴露的每个适配器 ID 声明 `contracts.memoryEmbeddingProviders`，包括像 `local` 这样的内置适配器。独立 CLI 路径使用此清单契约，只在完整 Gateway 网关运行时注册 provider 之前加载所属插件。

## `mediaUnderstandingProviderMetadata` 参考

当媒体理解 provider 具有默认模型、自动认证回退优先级，或需要在运行时加载前供通用 core 辅助逻辑使用的原生文档支持时，请使用 `mediaUnderstandingProviderMetadata`。其键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 该 provider 暴露的媒体能力。                                                 |
| `defaultModels`        | `Record<string, string>`            | 当配置未指定模型时使用的“能力到模型”默认值。                                 |
| `autoPriority`         | `Record<string, number>`            | 在基于凭证的自动 provider 回退中，数字越小排序越靠前。                       |
| `nativeDocumentInputs` | `"pdf"[]`                           | 该 provider 支持的原生文档输入。                                             |

## `channelConfigs` 参考

当渠道插件在运行时加载前需要低成本配置元数据时，请使用 `channelConfigs`。

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
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供。                     |
| `uiHints`     | `Record<string, object>` | 该渠道配置部分的可选 UI 标签/占位符/敏感性提示。                                         |
| `label`       | `string`                 | 当运行时元数据尚未就绪时，合并到选择器和检查表面中的渠道标签。                            |
| `description` | `string`                 | 用于检查和 catalog 表面的简短渠道说明。                                                   |
| `preferOver`  | `string[]`               | 在选择表面中应优先于其显示的旧版或较低优先级插件 ID。                                    |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据像 `gpt-5.5` 或 `claude-sonnet-4.6` 这样的简写模型 ID 推断你的 provider 插件时，请使用 `modelSupport`。

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
- 如果一个非内置插件和一个内置插件同时匹配，则非内置插件获胜
- 剩余歧义会被忽略，直到用户或配置显式指定 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 与简写模型 ID 匹配的前缀。                                    |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，用于与简写模型 ID 匹配的正则表达式源码。                 |

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 下；常规清单加载已不再将这些顶层字段视为能力归属。

## 清单与 package.json 的区别

这两个文件承担不同职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置验证、认证选项元数据，以及在插件代码运行前必须存在的 UI 提示                                                     |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或 catalog 元数据的 `openclaw` 块                                          |

如果你不确定某条元数据应放在哪里，请遵循这条规则：

- 如果 OpenClaw 必须在加载插件代码之前知道它，请将其放在 `openclaw.plugin.json` 中
- 如果它与打包、入口文件或 npm 安装行为有关，请将其放在 `package.json` 中

### 会影响设备发现的 `package.json` 字段

某些运行时前插件元数据有意放在 `package.json` 的 `openclaw` 块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | 声明原生插件入口点。必须保持在插件包目录内。                                                                                                                                         |
| `openclaw.runtimeExtensions`                                      | 为已安装包声明已构建的 JavaScript 运行时入口点。必须保持在插件包目录内。                                                                                                            |
| `openclaw.setupEntry`                                             | 仅用于 setup 的轻量入口点，在新手引导、延迟渠道启动和只读渠道状态/SecretRef 发现期间使用。必须保持在插件包目录内。                                                                 |
| `openclaw.runtimeSetupEntry`                                      | 为已安装包声明已构建的 JavaScript setup 入口点。必须保持在插件包目录内。                                                                                                            |
| `openclaw.channel`                                                | 轻量渠道 catalog 元数据，例如标签、文档路径、别名和选择文案。                                                                                                                       |
| `openclaw.channel.configuredState`                                | 轻量 configured-state 检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已存在仅基于环境变量的设置？”。                                                                       |
| `openclaw.channel.persistedAuthState`                             | 轻量 persisted-auth 检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何已登录状态？”。                                                                                 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 内置插件和外部发布插件的安装/更新提示。                                                                                                                                              |
| `openclaw.install.defaultChoice`                                  | 当有多个安装源可用时的首选安装路径。                                                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw 宿主版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                                                               |
| `openclaw.install.expectedIntegrity`                              | 预期的 npm dist 完整性字符串，例如 `sha512-...`；安装和更新流程会据此校验获取到的产物。                                                                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | 当配置无效时，允许一个受限的内置插件重新安装恢复路径。                                                                                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间，先加载仅用于 setup 的渠道表面，再加载完整渠道插件。                                                                                                                  |

清单元数据决定了在运行时加载前，新手引导中会出现哪些 provider/channel/setup 选项。`package.json#openclaw.install` 则告诉新手引导，当用户选择这些选项之一时，应如何获取或启用该插件。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；对于较新的但有效的值，在较旧宿主上会跳过该插件。

精确的 npm 版本固定已经存在于 `npmSpec` 中，例如
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部 catalog 条目应将精确 spec 与 `expectedIntegrity` 搭配使用，这样一旦获取到的 npm 产物不再匹配固定发布版本，更新流程就会以失败关闭。为了兼容性，交互式新手引导仍会提供受信任注册表的 npm spec，包括裸包名和 dist-tag。catalog 诊断可以区分精确、浮动、带完整性固定、缺失完整性、包名不匹配以及无效 default-choice 来源。它们还会在存在 `expectedIntegrity` 但没有可用于固定的有效 npm 源时发出警告。
当存在 `expectedIntegrity` 时，安装/更新流程会强制执行它；当省略该字段时，注册表解析结果会被记录，但不会附带完整性固定。

当状态、渠道列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时，渠道插件应提供 `openclaw.setupEntry`。该 setup 入口点应暴露渠道元数据以及对 setup 安全的配置、状态和密钥适配器；请将网络客户端、Gateway 网关监听器和传输运行时保留在主 extension 入口点中。

运行时入口点字段不会覆盖源码入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能让越界的 `openclaw.extensions` 路径变得可加载。

`openclaw.install.allowInvalidConfigRecovery` 的设计刻意保持狭窄。它不会让任意损坏的配置变得可安装。目前，它只允许安装流程从特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或同一内置插件对应的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将操作员引导至 `openclaw doctor --fix`。

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

当 setup、Doctor 或 configured-state 流程需要在完整渠道插件加载前进行低成本的 yes/no 认证探测时，请使用它。目标导出应是一个仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 对低成本、仅基于环境变量的 configured 检查采用相同结构：

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

当某个渠道可以通过环境变量或其他小型非运行时输入回答 configured-state 时，请使用它。如果该检查需要完整配置解析或真实渠道运行时，请将该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## 设备发现优先级（重复插件 ID）

OpenClaw 会从多个根位置发现插件（内置、全局安装、工作区、配置中显式选择的路径）。如果两个发现结果共享同一个 `id`，则只保留**优先级最高**的清单；优先级较低的重复项会被丢弃，而不是与其并排加载。

优先级从高到低如下：

1. **配置选定** — 在 `plugins.entries.<id>` 中显式固定的路径
2. **内置** — 随 OpenClaw 一起发布的插件
3. **全局安装** — 安装到全局 OpenClaw 插件根目录中的插件
4. **工作区** — 相对于当前工作区发现的插件

影响：

- 工作区中存在的某个内置插件的分叉或陈旧副本，不会遮蔽内置构建版本。
- 如果你确实要用本地插件覆盖内置插件，请通过 `plugins.entries.<id>` 固定它，让它凭优先级获胜，而不是依赖工作区发现。
- 重复项的丢弃会被记录，因此 Doctor 和启动诊断可以指向被丢弃的副本。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 schema（例如，`{ "type": "object", "additionalProperties": false }`）。
- schema 会在配置读写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 ID 已由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 ID。未知 ID 都是**错误**。
- 如果插件已安装，但其清单或 schema 缺失或损坏，验证会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件已**禁用**，则该配置会被保留，并且 Doctor + 日志中会显示**警告**。

有关完整的 `plugins.*` schema，请参阅 [配置参考](/zh-CN/gateway/configuration)。

## 说明

- **原生 OpenClaw 插件必须提供**清单，包括本地文件系统加载。运行时仍会单独加载插件模块；清单仅用于设备发现 + 验证。
- 原生清单使用 JSON5 解析，因此允许注释、尾随逗号和未加引号的键，只要最终值仍然是对象即可。
- 清单加载器只会读取有文档说明的清单字段。避免使用自定义顶层键。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- `providerDiscoveryEntry` 必须保持轻量，不应导入宽泛的运行时代码；请将其用于静态 provider catalog 元数据或狭窄的发现描述符，而不是请求时执行。
- 互斥插件类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 环境变量元数据（`providerAuthEnvVars`、`channelEnvVars`）仅具有声明性质。状态、审计、cron 投递验证以及其他只读表面，在将环境变量视为已配置之前，仍会应用插件信任和有效激活策略。
- 对于需要 provider 代码的运行时向导元数据，请参阅 [Provider 运行时钩子](/zh-CN/plugins/architecture-internals#provider-runtime-hooks)。
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
