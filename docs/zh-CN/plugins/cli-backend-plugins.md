---
read_when:
    - 你正在构建一个本地 AI CLI 后端插件
    - 你想为诸如 acme-cli/model 这样的模型引用注册一个后端
    - 你需要将第三方 CLI 映射到 OpenClaw 的文本回退运行器
sidebarTitle: CLI backend plugins
summary: 构建一个注册本地 AI CLI 后端的插件
title: 构建 CLI 后端插件
x-i18n:
    generated_at: "2026-05-07T13:20:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 后端插件让 OpenClaw 将本地 AI CLI 作为文本推理后端调用。该后端会在模型引用中显示为提供商前缀：

```text
acme-cli/acme-large
```

当上游集成已经暴露为本地命令、CLI 拥有本地登录状态，或当 API 提供商不可用时 CLI 可作为有用的后备方案时，请使用 CLI 后端。

<Info>
  如果上游服务暴露的是普通 HTTP 模型 API，请改写
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。如果上游运行时拥有完整的智能体会话、工具事件、压缩或后台任务状态，请使用[智能体运行框架](/zh-CN/plugins/sdk-agent-harness)。
</Info>

## 插件负责什么

CLI 后端插件有三个契约：

| 契约                 | 文件                   | 用途                                             |
| -------------------- | ---------------------- | ------------------------------------------------ |
| 包入口               | `package.json`         | 将 OpenClaw 指向插件运行时模块                   |
| 清单所有权           | `openclaw.plugin.json` | 在运行时加载之前声明后端 id                      |
| 运行时注册           | `index.ts`             | 使用命令默认值调用 `api.registerCliBackend(...)` |

清单是设备发现元数据。它不会执行 CLI，也不会注册运行时行为。运行时行为会在插件入口调用 `api.registerCliBackend(...)` 时开始。

## 最小后端插件

<Steps>
  <Step title="创建包元数据">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    已发布的包必须随附构建后的 JavaScript 运行时文件。如果你的源入口是 `./src/index.ts`，请添加指向构建后 JavaScript 对等文件的 `openclaw.runtimeExtensions`。参见[入口点](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="声明后端所有权">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` 是运行时所有权列表。当配置或模型选择提到 `acme-cli/...` 时，它会让 OpenClaw 自动加载插件。

    `setup.cliBackends` 是描述符优先的设置表面。当模型设备发现、新手引导或 Status 应在不加载插件运行时的情况下识别该后端时，请添加它。只有当这些静态描述符足以用于设置时，才使用 `requiresRuntime: false`。

  </Step>

  <Step title="注册后端">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    后端 id 必须与清单中的 `cliBackends` 条目匹配。已注册的 `config` 只是默认值；运行时会将 `agents.defaults.cliBackends.acme-cli` 下的用户配置合并覆盖它。

  </Step>
</Steps>

## 配置形状

`CliBackendConfig` 描述 OpenClaw 应如何启动并解析 CLI：

| 字段                                      | 用途                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | 二进制名称或绝对命令路径                                    |
| `args`                                    | 全新运行的基础 argv                                         |
| `resumeArgs`                              | 恢复会话的替代 argv；支持 `{sessionId}`                     |
| `output` / `resumeOutput`                 | 解析器：`json`、`jsonl` 或 `text`                           |
| `input`                                   | 提示词传输方式：`arg` 或 `stdin`                            |
| `modelArg`                                | 模型 id 前使用的标志                                        |
| `modelAliases`                            | 将 OpenClaw 模型 id 映射到 CLI 原生 id                      |
| `sessionArg` / `sessionArgs`              | 如何传递会话 id                                             |
| `sessionMode`                             | `always`、`existing` 或 `none`                              |
| `sessionIdFields`                         | OpenClaw 从 CLI 输出读取的 JSON 字段                        |
| `systemPromptArg` / `systemPromptFileArg` | 系统提示词传输方式                                          |
| `systemPromptWhen`                        | `first`、`always` 或 `never`                                |
| `imageArg` / `imageMode`                  | 图片路径支持                                                |
| `serialize`                               | 保持同一后端的运行有序                                      |
| `reliability.watchdog`                    | 无输出超时调优                                              |

优先使用与 CLI 匹配的最小静态配置。只有当行为确实属于该后端时，才添加插件回调。

## 高级后端钩子

`CliBackendPlugin` 还可以定义：

| 钩子                               | 用途                                                 |
| ---------------------------------- | ---------------------------------------------------- |
| `normalizeConfig(config, context)` | 合并后重写旧版用户配置                               |
| `resolveExecutionArgs(ctx)`        | 添加请求作用域标志，例如思考力度                     |
| `prepareExecution(ctx)`            | 启动前创建临时凭证或配置桥接                         |
| `transformSystemPrompt(ctx)`       | 应用最终的 CLI 特定系统提示词转换                    |
| `textTransforms`                   | 双向提示词/输出替换                                  |
| `defaultAuthProfileId`             | 优先使用特定的 OpenClaw 凭证配置                     |
| `authEpochMode`                    | 决定凭证变更如何使已存储的 CLI 会话失效              |
| `nativeToolMode`                   | 声明 CLI 是否有始终启用的原生工具                    |
| `bundleMcp` / `bundleMcpMode`      | 选择加入 OpenClaw 的 loopback MCP 工具桥接            |

让这些钩子保持由提供商拥有。当后端钩子可以表达该行为时，不要向核心添加 CLI 特定分支。

## MCP 工具桥接

CLI 后端默认不会收到 OpenClaw 工具。如果 CLI 可以使用 MCP 配置，请显式选择加入：

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

支持的桥接模式包括：

| 模式                     | 用途                                                |
| ------------------------ | --------------------------------------------------- |
| `claude-config-file`     | 接受 MCP 配置文件的 CLI                             |
| `codex-config-overrides` | 接受 argv 上配置覆盖的 CLI                          |
| `gemini-system-settings` | 从系统设置目录读取 MCP 设置的 CLI                   |

只有当 CLI 实际能够使用该桥接时才启用它。如果 CLI 有自己的内置工具层且无法禁用，请设置 `nativeToolMode:
"always-on"`，这样当调用方要求没有原生工具时，OpenClaw 可以失败关闭。

## 用户配置

用户可以覆盖任何后端默认值：

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

记录用户可能需要的最小覆盖项。通常只有当二进制不在 `PATH` 中时才需要 `command`。

## 验证

对于内置插件，请围绕构建器和设置注册添加聚焦测试，然后运行该插件的目标测试通道：

```bash
pnpm test extensions/acme-cli
```

对于本地或已安装插件，请验证设备发现和一次真实模型运行：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

如果后端支持图片或 MCP，请添加一个实时冒烟测试，用真实 CLI 证明这些路径。不要依赖静态检查来验证提示词、图片、MCP 或会话恢复行为。

## 检查清单

<Check>`package.json` 具有 `openclaw.extensions`，并且已发布包具有构建后的运行时入口</Check>
<Check>`openclaw.plugin.json` 声明 `cliBackends` 和有意设置的 `activation.onStartup`</Check>
<Check>当设置/模型设备发现应在冷状态看到后端时，存在 `setup.cliBackends`</Check>
<Check>`api.registerCliBackend(...)` 使用与清单相同的后端 id</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的用户覆盖仍然优先</Check>
<Check>会话、系统提示词、图片和输出解析器设置与真实 CLI 契约匹配</Check>
<Check>目标测试和至少一次实时 CLI 冒烟测试证明后端路径</Check>

## 相关

- [CLI 后端](/zh-CN/gateway/cli-backends) - 用户配置和运行时行为
- [构建插件](/zh-CN/plugins/building-plugins) - 包和清单基础
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) - 注册 API 参考
- [插件清单](/zh-CN/plugins/manifest) - `cliBackends` 和设置描述符
- [智能体运行框架](/zh-CN/plugins/sdk-agent-harness) - 完整外部 Agent Runtimes
