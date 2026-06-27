---
read_when:
    - 你需要知道加载了哪些环境变量，以及加载顺序
    - 你正在调试 Gateway 网关中缺失的 API 密钥
    - 你正在记录提供商凭证或部署环境
summary: OpenClaw 从哪里加载环境变量及其优先级顺序
title: 环境变量
x-i18n:
    generated_at: "2026-06-27T02:12:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 会从多个来源拉取环境变量。规则是**绝不覆盖现有值**。
工作区 `.env` 文件是信任级别较低的来源：OpenClaw 会先忽略工作区 `.env` 中的提供商凭证和受保护的运行时控制项，再应用优先级。

## 优先级（最高 → 最低）

1. **进程环境**（Gateway 网关进程已从父 shell/守护进程继承的环境）。
2. **当前工作目录中的 `.env`**（dotenv 默认值；不会覆盖；提供商凭证和受保护的运行时控制项会被忽略）。
3. **全局 `.env`**，位于 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`；推荐用于提供商 API 密钥；不会覆盖）。
4. **配置 `env` 块**，位于 `~/.openclaw/openclaw.json`（仅在缺失时应用）。
5. **可选的登录 shell 导入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），仅应用于缺失的预期键名。

在使用默认状态目录的 Ubuntu 全新安装中，OpenClaw 还会在全局 `.env` 之后将 `~/.config/openclaw/gateway.env` 作为兼容性回退。如果两个文件都存在且内容不一致，OpenClaw 会保留 `~/.openclaw/.env` 并打印警告。

如果配置文件完全缺失，则跳过第 4 步；如果已启用，shell 导入仍会运行。

## 提供商凭证和工作区 `.env`

不要只把提供商 API 密钥保存在工作区 `.env` 中。OpenClaw 会忽略来自工作区 `.env` 文件的提供商凭证环境变量，包括 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY` 和 `FIRECRAWL_API_KEY` 等常见键名。

请使用以下可信来源之一保存提供商凭证：

- Gateway 网关进程环境，例如 shell、launchd/systemd 单元、容器密钥或 CI 密钥。
- 全局运行时 dotenv 文件 `~/.openclaw/.env` 或 `$OPENCLAW_STATE_DIR/.env`。
- `~/.openclaw/openclaw.json` 中的配置 `env` 块。
- 启用 `env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1` 时的可选登录 shell 导入。

如果你之前只把提供商密钥存储在工作区 `.env` 中，请将它们移到上面的可信来源之一。工作区 `.env` 仍可提供普通项目变量，但不能用于凭证、端点重定向、主机覆盖或 `OPENCLAW_*` 运行时控制项。

安全原因请参阅[工作区 `.env` 文件](/zh-CN/gateway/security#workspace-env-files)。

## 配置 `env` 块

设置内联环境变量的两种等效方式（两者都不会覆盖）：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

配置 `env` 块只接受字面量字符串值。它不会展开
`file:...` 值；例如，`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
会作为这个精确字符串传递给提供商。

对于基于文件的提供商密钥，请在支持它的凭证字段上使用 SecretRef：

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

请参阅[密钥管理](/zh-CN/gateway/secrets)和
[SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)了解
支持的字段。

## Shell 环境导入

`env.shellEnv` 会运行你的登录 shell，并且只导入**缺失**的预期键名：

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

等效环境变量：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Exec shell 快照

在非 Windows Gateway 网关主机上，bash 和 zsh `exec` 命令默认使用启动快照。
在 Gateway 网关进程环境中设置 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 可禁用此路径。
值 `false`、`no` 和 `off` 也会禁用它。按调用传入的 `exec.env` 值无法切换
快照或重定向快照缓存。

## 运行时注入的环境变量

OpenClaw 还会向生成的子进程注入上下文标记：

- `OPENCLAW_SHELL=exec`：为通过 `exec` 工具运行的命令设置。
- `OPENCLAW_SHELL=acp`：为 ACP 运行时后端进程生成设置（例如 `acpx`）。
- `OPENCLAW_SHELL=acp-client`：为 `openclaw acp client` 生成 ACP 桥接进程时设置。
- `OPENCLAW_SHELL=tui-local`：为本地 TUI `!` shell 命令设置。
- `OPENCLAW_CLI=1`：为 CLI 入口点生成的子进程设置。

这些是运行时标记（不是必需的用户配置）。它们可用于 shell/profile 逻辑，
以应用特定上下文的规则。

## UI 环境变量

- `OPENCLAW_THEME=light`：当你的终端使用浅色背景时，强制使用浅色 TUI 调色板。
- `OPENCLAW_THEME=dark`：强制使用深色 TUI 调色板。
- `COLORFGBG`：如果你的终端导出了它，OpenClaw 会使用背景色提示来自动选择 TUI 调色板。

## 配置中的环境变量替换

你可以使用 `${VAR_NAME}` 语法，在配置字符串值中直接引用环境变量：

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

完整详情请参阅[配置：环境变量替换](/zh-CN/gateway/configuration-reference#env-var-substitution)。

## Secret refs 与 `${ENV}` 字符串

OpenClaw 支持两种由环境驱动的模式：

- 配置值中的 `${VAR}` 字符串替换。
- 对于支持密钥引用的字段，使用 SecretRef 对象（`{ source: "env", provider: "default", id: "VAR" }`）。

两者都会在激活时从进程环境解析。SecretRef 详情记录在[密钥管理](/zh-CN/gateway/secrets)中。
配置 `env` 块本身不会解析 SecretRefs 或 `file:...`
简写值。

## 路径相关环境变量

| 变量                     | 用途                                                                                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆盖用于 OpenClaw 内部路径默认值的主目录（`~/.openclaw/`、智能体目录、会话、凭证、安装器新手引导以及默认开发检出）。在以专用服务用户运行 OpenClaw 时很有用。 |
| `OPENCLAW_STATE_DIR`     | 覆盖状态目录（默认 `~/.openclaw`）。                                                                                                                                                                                          |
| `OPENCLAW_CONFIG_PATH`   | 覆盖配置文件路径（默认 `~/.openclaw/openclaw.json`）。                                                                                                                                                                        |
| `OPENCLAW_INCLUDE_ROOTS` | 目录路径列表，`$include` 指令可从这些目录解析配置目录之外的文件（默认：无 — `$include` 被限制在配置目录内）。会展开波浪号。                                     |

## 日志

| 变量                             | 用途                                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 覆盖文件和控制台的日志级别（例如 `debug`、`trace`）。优先级高于配置中的 `logging.level` 和 `logging.consoleLevel`。无效值会被忽略并发出警告。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在 `info` 级别发出定向的模型请求/响应计时诊断，而无需启用全局 debug 日志。                                                                                                     |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型载荷诊断：`summary`、`tools` 或 `full-redacted`。`full-redacted` 会被限制大小并做脱敏，但可能包含提示词/消息文本。                                                         |
| `OPENCLAW_DEBUG_SSE`             | 流式传输诊断：`events` 用于 first/done 计时，`peek` 用于包含前五个脱敏 SSE 事件。                                                                                               |
| `OPENCLAW_DEBUG_CODE_MODE`       | 代码模式模型表面诊断，包括提供商工具隐藏和仅允许 exec/wait 的强制执行。                                                                                                        |

### `OPENCLAW_HOME`

设置后，`OPENCLAW_HOME` 会替换系统主目录（`$HOME` / `os.homedir()`），用于 OpenClaw 内部路径默认值。这包括默认状态目录、配置路径、智能体目录、凭证、安装器新手引导工作区，以及 `openclaw update --channel dev` 使用的默认开发检出。

**优先级：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上的 Termux `PREFIX` 主目录回退 > `os.homedir()`

**示例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以设置为波浪线路径（例如 `~/svc`），使用前会通过同一套 OS 主目录回退链进行展开。

显式路径变量（例如 `OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH` 和 `OPENCLAW_GIT_DIR`）仍然具有优先级。OS 账户任务（例如 shell 启动文件检测、包管理器设置和主机 `~` 展开）仍可能使用真实系统主目录。

## nvm 用户：web_fetch TLS 失败

如果 Node.js 是通过 **nvm** 安装的（而不是系统包管理器），内置 `fetch()` 会使用
nvm 捆绑的 CA 存储，其中可能缺少现代根 CA（Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。这会导致 `web_fetch` 在大多数 HTTPS 站点上以 `"fetch failed"` 失败。

在 Linux 上，OpenClaw 会自动检测 nvm，并在实际启动环境中应用修复：

- `openclaw gateway install` 会把 `NODE_EXTRA_CA_CERTS` 写入 systemd 服务环境
- `openclaw` CLI 入口点会在 Node 启动前，带着已设置的 `NODE_EXTRA_CA_CERTS` 重新执行自身

**手动修复（适用于旧版本或直接 `node ...` 启动）：**

在启动 OpenClaw 之前导出变量：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要依赖只把此变量写入 `~/.openclaw/.env`；Node 会在进程启动时读取
`NODE_EXTRA_CA_CERTS`。

## 旧版环境变量

OpenClaw 只读取 `OPENCLAW_*` 环境变量。早期版本中的旧版
`CLAWDBOT_*` 和 `MOLTBOT_*` 前缀会被静默
忽略。

如果 Gateway 网关进程启动时仍设置了其中任何变量，OpenClaw 会发出一个
Node 弃用警告（`OPENCLAW_LEGACY_ENV_VARS`），列出检测到的
前缀和总数。请将旧版前缀替换为 `OPENCLAW_` 来重命名每个值（例如 `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`）；旧名称不会生效。

## 相关

- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [常见问题：环境变量和 .env 加载](/zh-CN/help/faq#env-vars-and-env-loading)
- [Models 概览](/zh-CN/concepts/models)
