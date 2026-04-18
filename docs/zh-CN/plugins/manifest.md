---
read_when:
    - 你正在构建一个 OpenClaw 插件
    - 你需要提供一个插件配置 schema，或调试插件校验错误
summary: 插件清单 + JSON schema 要求（严格配置校验）
title: 插件清单
x-i18n:
    generated_at: "2026-04-18T18:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa9976ac0e63a3902d9cc401ff9620fd903856c038f08a19a4f64fd7b23bc437
    source_path: plugins/manifest.md
    workflow: 15
---

# 插件清单（`openclaw.plugin.json`）

本页仅适用于**原生 OpenClaw 插件清单**。

关于兼容的 bundle 布局，请参见 [插件 bundles](/zh-CN/plugins/bundles)。

兼容的 bundle 格式使用不同的清单文件：

- Codex bundle：`.codex-plugin/plugin.json`
- Claude bundle：`.claude-plugin/plugin.json`，或不带清单的默认 Claude 组件布局
- Cursor bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 bundle 布局，但不会根据这里描述的 `openclaw.plugin.json` schema 对它们进行校验。

对于兼容 bundle，当布局符合 OpenClaw 运行时预期时，OpenClaw 当前会读取 bundle 元数据，以及声明的 skill 根目录、Claude 命令根目录、Claude bundle `settings.json` 默认值、Claude bundle LSP 默认值，以及受支持的 hook packs。

每个原生 OpenClaw 插件**必须**在**插件根目录**提供一个 `openclaw.plugin.json` 文件。OpenClaw 使用这个清单在**不执行插件代码**的情况下校验配置。缺失或无效的清单会被视为插件错误，并阻止配置校验。

查看完整的插件系统指南：[插件](/zh-CN/tools/plugin)。
关于原生能力模型和当前的外部兼容性指引，请参见：
[能力模型](/zh-CN/plugins/architecture#public-capability-model)。

## 这个文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载你的插件代码之前读取的元数据。

它适用于：

- 插件标识
- 配置校验
- 无需启动插件运行时即可获取的认证和新手引导元数据
- 运行时加载前，控制平面界面可检查的轻量激活提示
- 运行时加载前，设置 / 新手引导界面可检查的轻量设置描述符
- 运行时加载前应解析的别名和自动启用元数据
- 应在运行时加载前自动激活插件的简写模型族归属元数据
- 用于内置兼容接线和契约覆盖的静态能力归属快照
- 共享 `openclaw qa` 宿主在插件运行时加载前可检查的轻量 QA 运行器元数据
- 无需加载运行时即可合并到目录和校验界面的渠道特定配置元数据
- 配置 UI 提示

不要用于：

- 注册运行时行为
- 声明代码入口点
- npm 安装元数据

这些属于你的插件代码和 `package.json`。

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
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 规范插件 id。这是 `plugins.entries.<id>` 中使用的 id。 |
| `configSchema` | 是 | `object` | 该插件配置的内联 JSON Schema。 |
| `enabledByDefault` | 否 | `true` | 将内置插件标记为默认启用。省略该字段，或设置为任何非 `true` 的值，都会使插件默认保持禁用。 |
| `legacyPluginIds` | 否 | `string[]` | 会被规范化为此规范插件 id 的旧版 id。 |
| `autoEnableWhenConfiguredProviders` | 否 | `string[]` | 当认证、配置或模型引用提到这些 provider id 时，应自动启用此插件。 |
| `kind` | 否 | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的排他性插件类型。 |
| `channels` | 否 | `string[]` | 该插件拥有的渠道 id。用于设备发现和配置校验。 |
| `providers` | 否 | `string[]` | 该插件拥有的提供商 id。 |
| `modelSupport` | 否 | `object` | 由清单拥有的简写模型族元数据，用于在运行时之前自动加载插件。 |
| `cliBackends` | 否 | `string[]` | 该插件拥有的 CLI 推理后端 id。用于根据显式配置引用在启动时自动激活。 |
| `syntheticAuthRefs` | 否 | `string[]` | 在运行时加载前的冷启动模型发现期间，应探测其插件自有 synthetic auth hook 的 provider 或 CLI 后端引用。 |
| `commandAliases` | 否 | `object[]` | 由该插件拥有的命令名称，这些命令应在运行时加载前产生具备插件感知能力的配置和 CLI 诊断信息。 |
| `providerAuthEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的轻量 provider 认证环境变量元数据。 |
| `providerAuthAliases` | 否 | `Record<string, string>` | 应复用另一个 provider id 进行认证查找的 provider id，例如共享基础 provider API key 和认证配置文件的编码 provider。 |
| `channelEnvVars` | 否 | `Record<string, string[]>` | OpenClaw 无需加载插件代码即可检查的轻量渠道环境变量元数据。将其用于基于环境变量的渠道设置或认证界面，以便通用启动 / 配置辅助工具能够看到。 |
| `providerAuthChoices` | 否 | `object[]` | 用于新手引导选择器、首选 provider 解析和简单 CLI flag 接线的轻量认证选项元数据。 |
| `activation` | 否 | `object` | 用于 provider、命令、渠道、路由和由能力触发加载的轻量激活提示。仅为元数据；实际行为仍由插件运行时负责。 |
| `setup` | 否 | `object` | 设备发现和设置界面可在无需加载插件运行时的情况下检查的轻量设置 / 新手引导描述符。 |
| `qaRunners` | 否 | `object[]` | 共享 `openclaw qa` 宿主在插件运行时加载前使用的轻量 QA 运行器描述符。 |
| `contracts` | 否 | `object` | 面向语音、实时转写、实时语音、媒体理解、图像生成、音乐生成、视频生成、网页抓取、Web 搜索和工具归属的静态内置能力快照。 |
| `channelConfigs` | 否 | `Record<string, object>` | 由清单拥有的渠道配置元数据，在运行时加载前合并到设备发现和校验界面中。 |
| `skills` | 否 | `string[]` | 要加载的 Skills 目录，相对于插件根目录。 |
| `name` | 否 | `string` | 人类可读的插件名称。 |
| `description` | 否 | `string` | 在插件界面中显示的简短摘要。 |
| `version` | 否 | `string` | 仅供参考的插件版本。 |
| `uiHints` | 否 | `Record<string, object>` | 配置字段的 UI 标签、占位符和敏感性提示。 |

## `providerAuthChoices` 参考

每个 `providerAuthChoices` 条目描述一个新手引导或认证选项。
OpenClaw 会在 provider 运行时加载前读取这些内容。

| 字段 | 必填 | 类型 | 含义 |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider` | 是 | `string` | 此选项所属的 provider id。 |
| `method` | 是 | `string` | 要分发到的认证方法 id。 |
| `choiceId` | 是 | `string` | 供新手引导和 CLI 流程使用的稳定认证选项 id。 |
| `choiceLabel` | 否 | `string` | 面向用户的标签。如果省略，OpenClaw 会回退到 `choiceId`。 |
| `choiceHint` | 否 | `string` | 选择器中显示的简短帮助文本。 |
| `assistantPriority` | 否 | `number` | 在由智能体驱动的交互式选择器中，值越小排序越靠前。 |
| `assistantVisibility` | 否 | `"visible"` \| `"manual-only"` | 在智能体选择器中隐藏该选项，同时仍允许手动 CLI 选择。 |
| `deprecatedChoiceIds` | 否 | `string[]` | 应将用户重定向到此替代选项的旧版选项 id。 |
| `groupId` | 否 | `string` | 用于对相关选项分组的可选分组 id。 |
| `groupLabel` | 否 | `string` | 该分组的面向用户标签。 |
| `groupHint` | 否 | `string` | 该分组的简短帮助文本。 |
| `optionKey` | 否 | `string` | 用于简单单 flag 认证流程的内部选项键。 |
| `cliFlag` | 否 | `string` | CLI flag 名称，例如 `--openrouter-api-key`。 |
| `cliOption` | 否 | `string` | 完整的 CLI 选项形态，例如 `--openrouter-api-key <key>`。 |
| `cliDescription` | 否 | `string` | CLI 帮助中使用的说明。 |
| `onboardingScopes` | 否 | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些新手引导界面中。如果省略，默认值为 `["text-inference"]`。 |

## `commandAliases` 参考

当插件拥有某个运行时命令名称，而用户可能会误把它放进 `plugins.allow`，或尝试把它当作根级 CLI 命令来运行时，请使用 `commandAliases`。OpenClaw 使用这些元数据在不导入插件运行时代码的情况下提供诊断信息。

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
| `name` | 是 | `string` | 属于该插件的命令名称。 |
| `kind` | 否 | `"runtime-slash"` | 将该别名标记为聊天斜杠命令，而不是根级 CLI 命令。 |
| `cliCommand` | 否 | `string` | 如果存在，建议用于 CLI 操作的相关根级 CLI 命令。 |

## `activation` 参考

当插件可以低成本声明哪些控制平面事件应在稍后激活它时，请使用 `activation`。

## `qaRunners` 参考

当插件向共享 `openclaw qa` 根命令下贡献一个或多个传输运行器时，请使用 `qaRunners`。请保持这些元数据轻量且静态；实际的 CLI 注册仍由插件运行时通过导出 `qaRunnerCliRegistrations` 的轻量 `runtime-api.ts` 界面负责。

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
| `description` | 否 | `string` | 当共享宿主需要一个占位命令时使用的回退帮助文本。 |

这个代码块仅为元数据。它不会注册运行时行为，也不会替代 `register(...)`、`setupEntry` 或其他运行时 / 插件入口点。当前使用方将其作为在更广泛插件加载前的收窄提示，因此缺少激活元数据通常只会带来性能损耗；在旧版清单归属回退机制仍存在时，它不应影响正确性。

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
| `onProviders` | 否 | `string[]` | 请求这些 provider id 时应激活此插件。 |
| `onCommands` | 否 | `string[]` | 应激活此插件的命令 id。 |
| `onChannels` | 否 | `string[]` | 应激活此插件的渠道 id。 |
| `onRoutes` | 否 | `string[]` | 应激活此插件的路由类型。 |
| `onCapabilities` | 否 | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的宽泛能力提示。 |

当前的实际使用方：

- 由命令触发的 CLI 规划会回退到旧版的
  `commandAliases[].cliCommand` 或 `commandAliases[].name`
- 由渠道触发的设置 / 渠道规划在缺少显式渠道激活元数据时，会回退到旧版 `channels[]`
  归属
- 由 provider 触发的设置 / 运行时规划在缺少显式 provider
  激活元数据时，会回退到旧版 `providers[]` 和顶层 `cliBackends[]`
  归属

## `setup` 参考

当设置和新手引导界面在运行时加载前需要低成本、由插件拥有的元数据时，请使用 `setup`。

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

顶层 `cliBackends` 仍然有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是面向控制平面 / 设置流程的设置专用描述符界面，应保持为纯元数据。

如果存在，`setup.providers` 和 `setup.cliBackends` 是设置发现时首选的“描述符优先”查找界面。如果该描述符只是在收窄候选插件，而设置流程仍需要更丰富的设置期运行时 hook，请将 `requiresRuntime` 设为 `true`，并保留 `setup-api` 作为回退执行路径。

由于设置查找可能会执行插件自有的 `setup-api` 代码，因此规范化后的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在已发现插件之间保持唯一。归属不明确时会采用失败即关闭，而不是按发现顺序挑选赢家。

### `setup.providers` 参考

| 字段 | 必填 | 类型 | 含义 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id` | 是 | `string` | 在设置或新手引导期间暴露的 provider id。请保持规范化 id 在全局范围内唯一。 |
| `authMethods` | 否 | `string[]` | 该 provider 在无需加载完整运行时的情况下支持的设置 / 认证方法 id。 |
| `envVars` | 否 | `string[]` | 通用设置 / 状态界面可在插件运行时加载前检查的环境变量。 |

### `setup` 字段

| 字段 | 必填 | 类型 | 含义 |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers` | 否 | `object[]` | 在设置和新手引导期间暴露的 provider 设置描述符。 |
| `cliBackends` | 否 | `string[]` | 用于描述符优先设置查找的设置期后端 id。请保持规范化 id 在全局范围内唯一。 |
| `configMigrations` | 否 | `string[]` | 由该插件设置界面拥有的配置迁移 id。 |
| `requiresRuntime` | 否 | `boolean` | 在描述符查找之后，设置流程是否仍然需要执行 `setup-api`。 |

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
| `label` | `string` | 面向用户的字段标签。 |
| `help` | `string` | 简短帮助文本。 |
| `tags` | `string[]` | 可选的 UI 标签。 |
| `advanced` | `boolean` | 将该字段标记为高级项。 |
| `sensitive` | `boolean` | 将该字段标记为密钥或敏感信息。 |
| `placeholder` | `string` | 表单输入的占位文本。 |

## `contracts` 参考

仅在 OpenClaw 可以不导入插件运行时就读取的静态能力归属元数据场景下使用 `contracts`。

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
| `speechProviders` | `string[]` | 该插件拥有的语音 provider id。 |
| `realtimeTranscriptionProviders` | `string[]` | 该插件拥有的实时转写 provider id。 |
| `realtimeVoiceProviders` | `string[]` | 该插件拥有的实时语音 provider id。 |
| `mediaUnderstandingProviders` | `string[]` | 该插件拥有的媒体理解 provider id。 |
| `imageGenerationProviders` | `string[]` | 该插件拥有的图像生成 provider id。 |
| `videoGenerationProviders` | `string[]` | 该插件拥有的视频生成 provider id。 |
| `webFetchProviders` | `string[]` | 该插件拥有的网页抓取 provider id。 |
| `webSearchProviders` | `string[]` | 该插件拥有的 Web 搜索 provider id。 |
| `tools` | `string[]` | 该插件拥有的智能体工具名称，用于内置契约检查。 |

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

每个渠道条目可包含：

| 字段 | 类型 | 含义 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` 的 JSON Schema。每个已声明的渠道配置条目都必须提供。 |
| `uiHints` | `Record<string, object>` | 该渠道配置部分可选的 UI 标签 / 占位符 / 敏感性提示。 |
| `label` | `string` | 当运行时元数据尚未就绪时，合并到选择器和检查界面中的渠道标签。 |
| `description` | `string` | 用于检查和目录界面的简短渠道说明。 |
| `preferOver` | `string[]` | 该渠道在选择界面中应优先于的旧版或较低优先级插件 id。 |

## `modelSupport` 参考

当 OpenClaw 应在插件运行时加载前，根据 `gpt-5.4` 或 `claude-sonnet-4.6` 这类简写模型 id 推断你的 provider 插件时，请使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 按以下优先级应用：

- 显式 `provider/model` 引用使用其归属 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非内置插件和一个内置插件同时匹配，则非内置插件胜出
- 剩余歧义会被忽略，直到用户或配置显式指定 provider

字段：

| 字段 | 类型 | 含义 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 使用 `startsWith` 对简写模型 id 进行匹配的前缀。 |
| `modelPatterns` | `string[]` | 在移除 profile 后缀后，对简写模型 id 进行匹配的正则表达式源码。 |

旧版顶层能力键已弃用。请使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移动到 `contracts` 下；常规清单加载已不再将这些顶层字段视为能力归属。

## Manifest 与 `package.json`

这两个文件承担不同的职责：

| 文件 | 用途 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 设备发现、配置校验、认证选项元数据，以及插件代码运行前必须存在的 UI 提示 |
| `package.json` | npm 元数据、依赖安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 配置块 |

如果你不确定某段元数据应放在哪里，请使用以下规则：

- 如果 OpenClaw 必须在加载插件代码前知道它，就放进 `openclaw.plugin.json`
- 如果它与打包、入口文件或 npm 安装行为有关，就放进 `package.json`

### 影响设备发现的 `package.json` 字段

有些运行时前插件元数据会有意放在 `package.json` 的 `openclaw` 配置块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段 | 含义 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions` | 声明原生插件入口点。 |
| `openclaw.setupEntry` | 在新手引导和延迟渠道启动期间使用的轻量级仅设置入口点。 |
| `openclaw.channel` | 轻量渠道目录元数据，例如标签、文档路径、别名和选择文案。 |
| `openclaw.channel.configuredState` | 轻量已配置状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已经存在仅环境变量驱动的设置？”。 |
| `openclaw.channel.persistedAuthState` | 轻量持久化认证状态检查器元数据，可在不加载完整渠道运行时的情况下回答“是否已有任何内容完成登录？”。 |
| `openclaw.install.npmSpec` / `openclaw.install.localPath` | 内置和外部发布插件的安装 / 更新提示。 |
| `openclaw.install.defaultChoice` | 当有多个安装来源可用时的首选安装路径。 |
| `openclaw.install.minHostVersion` | 最低受支持的 OpenClaw 宿主版本，使用如 `>=2026.3.22` 这样的 semver 下限。 |
| `openclaw.install.allowInvalidConfigRecovery` | 当配置无效时，允许一个范围有限的内置插件重装恢复路径。 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 允许在启动期间先加载仅设置的渠道界面，再加载完整渠道插件。 |

`openclaw.install.minHostVersion` 会在安装和清单注册表加载期间强制执行。无效值会被拒绝；值如果有效但要求更高版本，则在旧宿主上会跳过该插件。

`openclaw.install.allowInvalidConfigRecovery` 的适用范围是有意收窄的。它不会让任意损坏配置变得可安装。目前它只允许安装流程从某些特定的陈旧内置插件升级失败中恢复，例如缺失的内置插件路径，或同一内置插件对应的陈旧 `channels.<id>` 条目。无关的配置错误仍会阻止安装，并将运维人员引导到 `openclaw doctor --fix`。

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

当设置、Doctor 或已配置状态流程需要在完整渠道插件加载前进行一个低成本的“是 / 否”认证探测时，请使用它。目标导出应是一个仅仅读取持久化状态的小函数；不要通过完整渠道运行时 barrel 暴露它。

`openclaw.channel.configuredState` 采用相同结构，用于低成本的仅环境变量已配置检查：

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

当某个渠道可以仅通过环境变量或其他微型非运行时输入来回答已配置状态时，请使用它。如果检查需要完整配置解析或真实渠道运行时，则应把该逻辑保留在插件 `config.hasConfiguredState` hook 中。

## JSON Schema 要求

- **每个插件都必须提供一个 JSON Schema**，即使它不接受任何配置。
- 可以接受空 schema（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 会在配置读写时校验，而不是在运行时校验。

## 校验行为

- 未知的 `channels.*` 键是**错误**，除非该渠道 id 由某个插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*`
  必须引用**可发现的**插件 id。未知 id 是**错误**。
- 如果某个插件已安装，但其清单或 schema 缺失或损坏，校验会失败，Doctor 会报告该插件错误。
- 如果插件配置存在，但插件处于**禁用**状态，则配置会被保留，并且 Doctor + 日志中会显示**警告**。

完整 `plugins.*` schema 请参见[配置参考](/zh-CN/gateway/configuration)。

## 说明

- 对于原生 OpenClaw 插件，清单是**必需的**，包括本地文件系统加载。
- 运行时仍会单独加载插件模块；清单仅用于设备发现 + 校验。
- 原生清单使用 JSON5 解析，因此支持注释、尾随逗号和未加引号的键，只要最终值仍然是一个对象即可。
- 清单加载器只会读取已文档化的清单字段。避免在这里添加自定义顶层键。
- `providerAuthEnvVars` 是认证探测、环境变量标记校验及类似 provider 认证界面的低成本元数据路径，这些场景不应仅为了检查环境变量名称就启动插件运行时。
- `providerAuthAliases` 允许 provider 变体复用另一个 provider 的认证环境变量、认证配置文件、基于配置的认证以及 API key 新手引导选项，而无需在核心中硬编码这种关系。
- `syntheticAuthRefs` 是 provider 自有 synthetic
  auth hook 的低成本元数据路径，这些 hook 必须在运行时注册表尚不存在时，对冷启动模型发现可见。这里只列出那些其运行时 provider 或 CLI 后端实际实现了 `resolveSyntheticAuth` 的引用。
- `channelEnvVars` 是 shell 环境变量回退、设置提示以及类似渠道界面的低成本元数据路径，这些场景不应仅为了检查环境变量名称就启动插件运行时。
- `providerAuthChoices` 是认证选项选择器、`--auth-choice` 解析、首选 provider 映射以及在 provider 运行时加载前进行简单新手引导 CLI flag 注册的低成本元数据路径。对于需要 provider 代码的运行时向导元数据，请参见
  [provider 运行时 hooks](/zh-CN/plugins/architecture#provider-runtime-hooks)。
- 排他性插件类型通过 `plugins.slots.*` 进行选择。
  - `kind: "memory"` 通过 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 通过 `plugins.slots.contextEngine`
    选择（默认：内置 `legacy`）。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- 如果你的插件依赖原生模块，请记录构建步骤以及任何包管理器允许列表要求（例如 pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins) — 插件快速开始
- [插件架构](/zh-CN/plugins/architecture) — 内部架构
- [SDK 概览](/zh-CN/plugins/sdk-overview) — 插件 SDK 参考
