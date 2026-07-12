---
read_when:
    - 你正在构建一个本地 AI CLI 后端插件
    - 你想为类似 `acme-cli/model` 的模型引用注册一个后端
    - 你需要将第三方 CLI 映射到 OpenClaw 的文本回退运行器中
sidebarTitle: CLI backend plugins
summary: 构建一个注册本地 AI CLI 后端的插件
title: 构建 CLI 后端插件
x-i18n:
    generated_at: "2026-07-12T14:36:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 后端插件让 OpenClaw 能够调用本地 AI CLI 作为文本推理后端。该后端会以提供商前缀的形式出现在模型引用中：

```text
acme-cli/acme-large
```

当上游集成已经通过本地命令提供、CLI 管理本地登录状态，或 API 提供商不可用时需要备用方案，可使用 CLI 后端。

<Info>
  如果上游服务提供常规 HTTP 模型 API，请改为编写
  [提供商插件](/zh-CN/plugins/sdk-provider-plugins)。如果上游运行时管理完整的智能体会话、工具事件、压缩或后台任务状态，请使用[智能体运行框架](/zh-CN/plugins/sdk-agent-harness)。
</Info>

## 插件负责的内容

CLI 后端插件包含三个契约：

| 契约                 | 文件                   | 用途                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 包入口               | `package.json`         | 将 OpenClaw 指向插件运行时模块                            |
| 清单所有权           | `openclaw.plugin.json` | 在加载运行时之前声明后端 ID                               |
| 运行时注册           | `index.ts`             | 使用命令默认值调用 `api.registerCliBackend(...)`          |

清单是设备发现元数据：它不会执行 CLI，也不会注册运行时行为。当插件入口调用 `api.registerCliBackend(...)` 时，运行时行为才会开始。

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

    已发布的包必须包含构建后的 JavaScript 运行时文件。如果源入口是 `./src/index.ts`，请添加指向对应构建后 JavaScript 文件的 `openclaw.runtimeExtensions`。请参阅[入口点](/zh-CN/plugins/sdk-entrypoints)。

  </Step>

  <Step title="声明后端所有权">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "通过 OpenClaw 运行 Acme 的本地 AI CLI",
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

    `cliBackends` 是运行时所有权列表；当配置或模型选择提及 `acme-cli/...` 时，它允许 OpenClaw 自动加载该插件。

    `setup.cliBackends` 是描述符优先的设置界面。当模型设备发现、新手引导或状态功能需要在不加载插件运行时的情况下识别该后端时，请添加此项。只有当这些静态描述符足以完成设置时，才使用 `requiresRuntime: false`。

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
      description: "通过 OpenClaw 运行 Acme 的本地 AI CLI",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    后端 ID 必须与清单中的 `cliBackends` 条目匹配。注册的 `config` 仅是默认值；运行时会将 `agents.defaults.cliBackends.acme-cli` 下的用户配置合并到该默认值之上。

  </Step>
</Steps>

## 配置结构

`CliBackendConfig` 描述 OpenClaw 应如何启动和解析 CLI：

| 字段                                                      | 用途                                                                              |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `command`                                                 | 二进制文件名称或命令的绝对路径                                                    |
| `args`                                                    | 新运行的基础 argv                                                                 |
| `resumeArgs`                                              | 恢复会话时使用的替代 argv；支持 `{sessionId}`                                     |
| `output` / `resumeOutput`                                 | 解析器：`json`、`jsonl` 或 `text`                                                 |
| `jsonlDialect`                                            | JSONL 事件方言：`claude-stream-json` 或 `gemini-stream-json`                      |
| `liveSession`                                             | 长时间运行的 CLI 进程模式（`claude-stdio`）                                       |
| `input`                                                   | 提示词传输方式：`arg` 或 `stdin`                                                   |
| `maxPromptArgChars`                                       | `arg` 模式回退到 stdin 之前允许的最大提示词长度                                   |
| `env` / `clearEnv`                                        | 要注入的额外环境变量，或启动前要移除的环境变量名称                                |
| `modelArg`                                                | 模型 ID 前使用的标志                                                              |
| `modelAliases`                                            | 将 OpenClaw 模型 ID 映射到 CLI 原生 ID                                            |
| `sessionArg` / `sessionArgs`                              | 如何传递会话 ID                                                                   |
| `sessionMode`                                             | `always`、`existing` 或 `none`                                                    |
| `sessionIdFields`                                         | OpenClaw 从 CLI 输出中读取的 JSON 字段                                             |
| `systemPromptArg` / `systemPromptFileArg`                 | 系统提示词传输方式                                                                |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 系统提示词文件的配置覆盖传输方式（例如 `-c`）                                     |
| `systemPromptMode`                                        | `append` 或 `replace`                                                             |
| `systemPromptWhen`                                        | `first`、`always` 或 `never`                                                      |
| `imageArg` / `imageMode`                                  | 图像路径标志以及传递多张图像的方式（`repeat` 或 `list`）                          |
| `imagePathScope`                                          | 移交前暂存图像文件的位置：`temp` 或 `workspace`                                   |
| `serialize`                                               | 保持同一后端的运行按顺序执行                                                      |
| `reseedFromRawTranscriptWhenUncompacted`                  | 选择在压缩前使用有界的原始记录重新设定种子，以安全重置会话                        |
| `reliability.outputLimits`                                | 为一次实时 CLI 轮次保留的最大原始 JSONL 字符数/行数（实时会话后端）               |
| `reliability.watchdog`                                    | 无输出超时调节，分别针对新运行和恢复运行                                          |

应优先使用与 CLI 匹配的最小静态配置。只有当某项行为确实应由后端负责时，才添加插件回调。

## 高级后端钩子

`CliBackendPlugin` 还可以定义：

| 钩子                               | 用途                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 合并后重写旧版用户配置                                                      |
| `resolveExecutionArgs(ctx)`        | 添加请求范围的标志，例如思考强度或旁路问题隔离                              |
| `prepareExecution(ctx)`            | 启动前创建临时身份验证或配置桥接                                            |
| `transformSystemPrompt(ctx)`       | 应用最终的 CLI 特定系统提示词转换                                           |
| `textTransforms`                   | 双向提示词/输出替换                                                         |
| `defaultAuthProfileId`             | 优先使用特定的 OpenClaw 身份验证配置文件                                    |
| `authEpochMode`                    | 决定身份验证变更如何使已存储的 CLI 会话失效                                 |
| `nativeToolMode`                   | 声明原生工具是不存在、始终启用还是可由宿主选择                              |
| `sideQuestionToolMode`             | 声明为 `/btw` 旁路问题禁用的原生工具                                        |
| `bundleMcp` / `bundleMcpMode`      | 选择启用 OpenClaw 的 loopback MCP 工具桥接                                  |
| `ownsNativeCompaction`             | 后端自行负责压缩，OpenClaw 将其推迟                                         |
| `runtimeArtifact`                  | 将脚本启动器限定到其完整的内置包树                                          |

这些钩子应由提供商负责。当后端钩子可以表达某项行为时，不要向核心添加 CLI 特定分支。

`runtimeArtifact` 由插件负责，用户无法覆盖。仅当实时推理轮次生成或重新验证已验证的设置权限时，才会查询此项；常规 CLI 运行不需要它。未声明此项的后端无法生成已验证的 CLI 设置权限。`bundled-package-tree` 声明指定确切的 `package.json` 所有者，并要求包入口点就是该命令。OpenClaw 会对受限范围内完整的已安装包树进行哈希计算，包括嵌套依赖项；遇到重定向符号链接、声明包外的启动器、必需的外部依赖声明、过大的包树和未知脚本时，将以失败关闭方式处理。只有当该包树包含完整的推理实现时才进行此声明；可选工具集成无法使外部实现图变得安全。

如果同一后端还包含独立完整的原生可执行文件，请在 `nativeExecutableNames` 中列出其规范基本名称。即使用户覆盖后端命令，其他原生命令仍不会通过验证。

`ctx.executionMode` 在普通轮次中为 `"agent"`，在临时 `/btw` 调用中为 `"side-question"`。当 CLI 需要不同的一次性标志时（例如为 BTW 禁用原生工具、会话持久化或恢复行为），请使用它。如果后端通常设置了 `nativeToolMode: "always-on"`，但其旁路问题 argv 能可靠地禁用这些工具，还应设置 `sideQuestionToolMode: "disabled"`；否则，当 BTW 要求以无工具方式运行 CLI 时，OpenClaw 将采用故障关闭策略。

仅当 `resolveExecutionArgs` 能针对单次运行禁用后端的所有原生工具时，才设置 `nativeToolMode: "selectable"`。对于这些受限运行，`ctx.toolAvailability.native` 是空元组，而 `ctx.toolAvailability.mcp` 是经过主机隔离的精确 MCP 允许列表。该钩子必须替换冲突的工具标志，并返回能够强制执行这两个值的 argv；OpenClaw 会使用最终的新建或恢复 argv 调用它一次，并在后端无法执行限制时采用故障关闭策略。此上下文中的 MCP 名称可以安全地自动批准，唯一原因是主机已将生成的 MCP 配置限制为这些服务器和工具。

### `ownsNativeCompaction`：选择不使用 OpenClaw 压缩

如果你的后端运行的智能体会压缩其**自己的**转录记录，请设置 `ownsNativeCompaction: true`，以确保 OpenClaw 的安全保障摘要器永远不会针对其会话运行——CLI 压缩生命周期将执行空操作，然后轮次继续。`claude-cli` 会声明此设置，因为 Claude Code 在内部执行压缩，没有 harness 端点。Codex 等原生 harness 会话则继续路由到其 harness 压缩端点。

**仅当以下所有条件均成立时才声明此设置**，否则延迟处理的超预算会话可能会一直超出预算或变得过期（OpenClaw 将不再对其进行补救）：

- 后端在转录记录接近上下文窗口限制时，能可靠地自行压缩转录记录或限制其大小；
- 后端会持久化可恢复的会话，使压缩后的状态能够跨轮次保留（例如 `--resume` / `--session-id`）；
- 它不是原生 harness 压缩会话——与 `agentHarnessId` 匹配的会话会改为路由到 harness 端点。

## MCP 工具桥接

默认情况下，CLI 后端不会接收 OpenClaw 工具。如果 CLI 可以使用 MCP 配置，请显式选择启用：

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
| `codex-config-overrides` | 接受 argv 配置覆盖的 CLI                        |
| `gemini-system-settings` | 从其系统设置目录读取 MCP 设置的 CLI |

仅当 CLI 确实可以使用桥接时才启用它。如果 CLI 有无法禁用的内置工具层，请设置 `nativeToolMode:
"always-on"`，这样当调用方要求不使用原生工具时，OpenClaw 可以采用故障关闭策略。如果它能针对每次运行禁用所有原生工具，请使用 `"selectable"`，并遵循上述 `resolveExecutionArgs` 契约。

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
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

记录用户可能需要的最小覆盖配置——通常只有当二进制文件不在 `PATH` 中时才需要配置 `command`。

## 验证

对于内置插件，请围绕构建器和设置注册添加一个聚焦测试，然后运行该插件的定向测试通道：

```bash
pnpm test extensions/acme-cli
```

对于本地或已安装的插件，请验证设备发现和一次真实模型运行：

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "请准确回复：后端正常" --model acme-cli/acme-large
```

如果后端支持图像或 MCP，请添加一次实时冒烟测试，使用真实 CLI 证明这些路径可用。对于提示词、图像、MCP 或会话恢复行为，不要依赖静态检查。

## 检查清单

<Check>`package.json` 包含 `openclaw.extensions`，且已发布的软件包包含构建后的运行时入口</Check>
<Check>`openclaw.plugin.json` 声明了 `cliBackends` 和有意设置的 `activation.onStartup`</Check>
<Check>当设置/模型设备发现应在后端冷启动时识别它，需提供 `setup.cliBackends`</Check>
<Check>`api.registerCliBackend(...)` 使用与插件清单相同的后端 ID</Check>
<Check>`agents.defaults.cliBackends.<id>` 下的用户覆盖配置仍然优先</Check>
<Check>会话、系统提示词、图像和输出解析器设置与真实 CLI 契约一致</Check>
<Check>定向测试和至少一次实时 CLI 冒烟测试证明后端路径可用</Check>

## 相关内容

- [CLI 后端](/zh-CN/gateway/cli-backends)——用户配置和运行时行为
- [Building Plugins](/zh-CN/plugins/building-plugins)——软件包和插件清单基础
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview)——注册 API 参考
- [插件清单](/zh-CN/plugins/manifest)——`cliBackends` 和设置描述符
- [Agent harness](/zh-CN/plugins/sdk-agent-harness)——完整的外部 Agent Runtimes
