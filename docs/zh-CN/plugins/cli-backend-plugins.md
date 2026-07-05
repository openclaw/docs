---
read_when:
    - 你正在构建一个本地 AI CLI 后端插件
    - 你想为诸如 acme-cli/model 这样的模型引用注册一个后端
    - 你需要将第三方 CLI 映射到 OpenClaw 的文本回退运行器
sidebarTitle: CLI backend plugins
summary: 构建一个注册本地 AI CLI 后端的插件
title: 构建 CLI 后端插件
x-i18n:
    generated_at: "2026-07-05T11:28:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97540f49e64df176c5bbfa596ba40acbf6418ad97ee55a5a79e257db68e49c7b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 后端插件让 OpenClaw 能够将本地 AI CLI 作为文本推理
后端调用。该后端会在模型引用中显示为提供商前缀：

```text
acme-cli/acme-large
```

当上游集成已经以本地命令形式暴露、CLI 拥有本地登录状态，或 API
提供商不可用时作为回退方案，可以使用 CLI 后端。

<Info>
  如果上游服务暴露普通的 HTTP 模型 API，请改写
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。如果上游
  运行时拥有完整的智能体会话、工具事件、压缩或后台
  任务状态，请使用 [agent harness](/zh-CN/plugins/sdk-agent-harness)。
</Info>

## 插件拥有的内容

CLI 后端插件有三个合约：

| 合约                 | 文件                   | 用途                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 包入口               | `package.json`         | 将 OpenClaw 指向插件运行时模块                            |
| 清单所有权           | `openclaw.plugin.json` | 在运行时加载前声明后端 id                                 |
| 运行时注册           | `index.ts`             | 使用命令默认值调用 `api.registerCliBackend(...)`          |

清单是设备发现元数据：它不会执行 CLI 或注册
运行时行为。运行时行为从插件入口调用
`api.registerCliBackend(...)` 时开始。

## 最小后端插件

<Steps>
  <Step title="Create package metadata">
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

    已发布的包必须随附构建后的 JavaScript 运行时文件。如果你的源码
    入口是 `./src/index.ts`，请添加 `openclaw.runtimeExtensions`，指向
    构建后的 JavaScript 对等文件。参见 [入口点](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="Declare backend ownership">
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

    `cliBackends` 是运行时所有权列表；当配置或模型选择提到
    `acme-cli/...` 时，它会让 OpenClaw 自动加载该
    插件。

    `setup.cliBackends` 是描述符优先的设置表面。当模型设备发现、新手引导或状态
    应该在不加载插件运行时的情况下识别该后端时，请添加它。仅当
    这些静态描述符足以用于设置时，才使用 `requiresRuntime: false`。

  </Step>

  <Step title="Register the backend">
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

    后端 id 必须匹配清单中的 `cliBackends` 条目。已注册的
    `config` 只是默认值；运行时会将
    `agents.defaults.cliBackends.acme-cli` 下的用户配置合并覆盖它。

  </Step>
</Steps>

## 配置结构

`CliBackendConfig` 描述 OpenClaw 应该如何启动和解析 CLI：

| 字段                                                      | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | 二进制名称或绝对命令路径                                                          |
| `args`                                                    | 全新运行的基础 argv                                                               |
| `resumeArgs`                                              | 恢复会话的替代 argv；支持 `{sessionId}`                                           |
| `output` / `resumeOutput`                                 | 解析器：`json`、`jsonl` 或 `text`                                                 |
| `jsonlDialect`                                            | JSONL 事件方言：`claude-stream-json` 或 `gemini-stream-json`                      |
| `liveSession`                                             | 长生命周期 CLI 进程模式（`claude-stdio`）                                         |
| `input`                                                   | 提示传输：`arg` 或 `stdin`                                                        |
| `maxPromptArgChars`                                       | `arg` 模式下回退到 stdin 前的最大提示长度                                         |
| `env` / `clearEnv`                                        | 要注入的额外环境变量，或启动前要剥离的名称                                        |
| `modelArg`                                                | 模型 id 前使用的标志                                                              |
| `modelAliases`                                            | 将 OpenClaw 模型 id 映射到 CLI 原生 id                                            |
| `sessionArg` / `sessionArgs`                              | 如何传递会话 id                                                                   |
| `sessionMode`                                             | `always`、`existing` 或 `none`                                                    |
| `sessionIdFields`                                         | OpenClaw 从 CLI 输出读取的 JSON 字段                                              |
| `systemPromptArg` / `systemPromptFileArg`                 | 系统提示传输                                                                      |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 系统提示文件的配置覆盖传输（例如 `-c`）                                           |
| `systemPromptMode`                                        | `append` 或 `replace`                                                             |
| `systemPromptWhen`                                        | `first`、`always` 或 `never`                                                      |
| `imageArg` / `imageMode`                                  | 图片路径标志，以及如何传递多张图片（`repeat` 或 `list`）                          |
| `imagePathScope`                                          | 交接前暂存图片文件所在位置：`temp` 或 `workspace`                                 |
| `serialize`                                               | 保持同一后端运行按顺序执行                                                        |
| `reseedFromRawTranscriptWhenUncompacted`                  | 为安全重置会话，在压缩前选择启用有界原始转录重播                                 |
| `reliability.outputLimits`                                | 单个实时 CLI 轮次保留的最大原始 JSONL 字符数/行数（实时会话后端）                 |
| `reliability.watchdog`                                    | 无输出超时调优，区分全新运行和恢复运行                                            |

优先使用与 CLI 匹配的最小静态配置。只有在行为确实属于该后端时，
才添加插件回调。

## 高级后端钩子

`CliBackendPlugin` 还可以定义：

| 钩子                               | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 合并后重写旧版用户配置                                                      |
| `resolveExecutionArgs(ctx)`        | 添加请求范围的标志，例如思考强度或旁支问题隔离                              |
| `prepareExecution(ctx)`            | 启动前创建临时认证或配置桥接                                                |
| `transformSystemPrompt(ctx)`       | 应用最终的 CLI 特定系统提示转换                                             |
| `textTransforms`                   | 双向提示/输出替换                                                           |
| `defaultAuthProfileId`             | 优先使用特定的 OpenClaw 认证配置文件                                        |
| `authEpochMode`                    | 决定认证变更如何使已存储的 CLI 会话失效                                     |
| `nativeToolMode`                   | 声明 CLI 是否有始终开启的原生工具                                           |
| `sideQuestionToolMode`             | 声明用于 `/btw` 旁支问题的已禁用原生工具                                    |
| `bundleMcp` / `bundleMcpMode`      | 选择启用 OpenClaw 的 loopback MCP 工具桥接                                  |
| `ownsNativeCompaction`             | 后端拥有自己的压缩 - OpenClaw 会延后处理                                    |

保持这些钩子由提供商拥有。当后端钩子可以表达行为时，不要向核心添加
CLI 特定分支。

`ctx.executionMode` 对普通轮次是 `"agent"`，对临时 `/btw` 调用是
`"side-question"`。当 CLI 需要不同的一次性标志时使用它，
例如为 BTW 禁用原生工具、会话持久化或恢复行为。如果某个后端通常有
`nativeToolMode: "always-on"`，但它的旁支问题 argv 能可靠地禁用这些工具，
也请设置 `sideQuestionToolMode: "disabled"`；否则当 BTW
需要无工具 CLI 运行时，OpenClaw 会失败关闭。

### `ownsNativeCompaction`：选择退出 OpenClaw 压缩

如果你的后端运行的智能体会压缩它**自己的**转录，请设置
`ownsNativeCompaction: true`，这样 OpenClaw 的防护摘要器就绝不会针对
它的会话运行 - CLI 压缩生命周期会返回 no-op，并继续该
轮次。`claude-cli` 会声明它，因为 Claude Code 会在内部压缩，
且没有 harness 端点。Codex 等原生 harness 会话则会继续
路由到它们的 harness 压缩端点。

**只有在以下所有条件都成立时才声明它**，否则被延后的
超预算会话可能继续超预算或变陈旧（OpenClaw 不再
救援它）：

- 后端在接近其窗口时可靠地压缩或限制自己的 transcript；
- 它持久化可恢复的会话，使压缩后的状态能跨轮次保留
  （例如 `--resume` / `--session-id`）；
- 它不是原生 harness 压缩会话 - 匹配 `agentHarnessId`
  的会话会改为路由到 harness 端点。

## MCP 工具桥接

CLI 后端默认不会接收 OpenClaw 工具。如果 CLI 可以消费
MCP 配置，请显式选择启用：

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

支持的桥接模式：

| 模式                     | 用途                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | 接受 MCP 配置文件的 CLI                              |
| `codex-config-overrides` | 接受 argv 上配置覆盖的 CLI                        |
| `gemini-system-settings` | 从系统设置目录读取 MCP 设置的 CLI |

只有在 CLI 确实可以消费该桥接时才启用它。如果 CLI 有
无法禁用的内置工具层，请设置 `nativeToolMode:
"always-on"`，这样当调用方要求没有原生
工具时，OpenClaw 可以安全失败。

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

记录用户可能需要的最小覆盖项 - 通常只有在二进制文件位于 `PATH`
之外时才需要 `command`。

## 验证

对于内置插件，请围绕构建器和设置注册添加一个聚焦测试，
然后运行该插件的目标测试通道：

```bash
pnpm test extensions/acme-cli
```

对于本地或已安装的插件，请验证发现和一次真实模型运行：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

如果后端支持图片或 MCP，请添加一个实时冒烟测试，用真实 CLI
证明这些路径。不要依赖静态检查来验证提示词、图片、
MCP 或会话恢复行为。

## 清单

<Check>`package.json` 有 `openclaw.extensions`，并且发布包有已构建的运行时条目</Check>
<Check>`openclaw.plugin.json` 声明 `cliBackends` 和有意设置的 `activation.onStartup`</Check>
<Check>当设置/模型发现需要在冷启动时看到该后端时，存在 `setup.cliBackends`</Check>
<Check>`api.registerCliBackend(...)` 使用与清单相同的后端 id</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的用户覆盖仍然优先</Check>
<Check>会话、系统提示词、图片和输出解析器设置与真实 CLI 契约匹配</Check>
<Check>目标测试和至少一次实时 CLI 冒烟测试证明后端路径</Check>

## 相关

- [CLI 后端](/zh-CN/gateway/cli-backends) - 用户配置和运行时行为
- [构建插件](/zh-CN/plugins/building-plugins) - 包和清单基础
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) - 注册 API 参考
- [插件清单](/zh-CN/plugins/manifest) - `cliBackends` 和设置描述符
- [Agent harness](/zh-CN/plugins/sdk-agent-harness) - 完整的外部 Agent Runtimes
