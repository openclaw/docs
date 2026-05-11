---
read_when:
    - 你需要知道会加载哪些环境变量，以及加载顺序
    - 你正在调试 Gateway 网关中缺失的 API 密钥
    - 你正在为提供商凭证或部署环境编写文档
summary: OpenClaw 从何处加载环境变量以及优先级顺序
title: 环境变量
x-i18n:
    generated_at: "2026-05-11T20:29:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b91e9bb3c386292f11a3ffe5ae718a74a800bd19fe95073da990d881e6069d
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 会从多个来源读取环境变量。规则是：**绝不覆盖已有值**。

## 优先级（最高 → 最低）

1. **进程环境**（Gateway 网关进程已从父 shell/守护进程继承的环境）。
2. **当前工作目录中的 `.env`**（dotenv 默认行为；不会覆盖）。
3. **全局 `.env`**，位于 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`；不会覆盖）。
4. **`~/.openclaw/openclaw.json` 中的配置 `env` 块**（仅在缺失时应用）。
5. **可选的登录 shell 导入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），仅对缺失的预期键名应用。

在使用默认状态目录的 Ubuntu 全新安装中，OpenClaw 还会在全局 `.env` 之后，将 `~/.config/openclaw/gateway.env` 作为兼容性回退。如果两个文件都存在且内容不一致，OpenClaw 会保留 `~/.openclaw/.env` 并打印警告。

如果配置文件完全缺失，则跳过第 4 步；如果启用了 shell 导入，它仍会运行。

## 配置 `env` 块

设置内联环境变量有两种等效方式（都不会覆盖已有值）：

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

## Shell 环境导入

`env.shellEnv` 会运行你的登录 shell，并且只导入**缺失的**预期键名：

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

## 运行时注入的环境变量

OpenClaw 还会将上下文标记注入到派生的子进程中：

- `OPENCLAW_SHELL=exec`：为通过 `exec` 工具运行的命令设置。
- `OPENCLAW_SHELL=acp`：为 ACP 运行时后端进程派生设置（例如 `acpx`）。
- `OPENCLAW_SHELL=acp-client`：为派生 ACP 桥接进程的 `openclaw acp client` 设置。
- `OPENCLAW_SHELL=tui-local`：为本地 TUI `!` shell 命令设置。

这些是运行时标记（不是必需的用户配置）。它们可用于 shell/profile 逻辑，
以应用特定于上下文的规则。

## UI 环境变量

- `OPENCLAW_THEME=light`：当你的终端使用浅色背景时，强制使用浅色 TUI 调色板。
- `OPENCLAW_THEME=dark`：强制使用深色 TUI 调色板。
- `COLORFGBG`：如果你的终端导出了它，OpenClaw 会使用背景色提示自动选择 TUI 调色板。

## 配置中的环境变量替换

你可以使用 `${VAR_NAME}` 语法在配置字符串值中直接引用环境变量：

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

了解详情，请参阅[配置：环境变量替换](/zh-CN/gateway/configuration-reference#env-var-substitution)。

## 密钥引用与 `${ENV}` 字符串

OpenClaw 支持两种由环境变量驱动的模式：

- 配置值中的 `${VAR}` 字符串替换。
- SecretRef 对象（`{ source: "env", provider: "default", id: "VAR" }`），用于支持密钥引用的字段。

两者都会在激活时从进程环境中解析。SecretRef 详情记录在[密钥管理](/zh-CN/gateway/secrets)中。

## 路径相关环境变量

| 变量                     | 用途                                                                                                                                                                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆盖用于所有内部路径解析的主目录（`~/.openclaw/`、智能体目录、会话、凭证）。在以专用服务用户运行 OpenClaw 时很有用。                                                                    |
| `OPENCLAW_STATE_DIR`     | 覆盖状态目录（默认 `~/.openclaw`）。                                                                                                                                                     |
| `OPENCLAW_CONFIG_PATH`   | 覆盖配置文件路径（默认 `~/.openclaw/openclaw.json`）。                                                                                                                                   |
| `OPENCLAW_INCLUDE_ROOTS` | 目录路径列表，`$include` 指令可在这些目录中解析配置目录之外的文件（默认：无 — `$include` 被限制在配置目录内）。会展开波浪号。 |

## 日志记录

| 变量                             | 用途                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 覆盖文件和控制台的日志级别（例如 `debug`、`trace`）。优先于配置中的 `logging.level` 和 `logging.consoleLevel`。无效值会被忽略并伴随警告。                                   |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在 `info` 级别发出有针对性的模型请求/响应计时诊断，而无需启用全局调试日志。                                                                                                |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型负载诊断：`summary`、`tools` 或 `full-redacted`。`full-redacted` 会被截断和脱敏，但可能包含提示词/消息文本。                                                            |
| `OPENCLAW_DEBUG_SSE`             | 流式传输诊断：`events` 用于 first/done 计时，`peek` 用于包含前五个已脱敏的 SSE 事件。                                                                                       |
| `OPENCLAW_DEBUG_CODE_MODE`       | 代码模式模型表面诊断，包括隐藏提供商工具以及强制仅允许 exec/wait。                                                                                                         |

### `OPENCLAW_HOME`

设置后，`OPENCLAW_HOME` 会在所有内部路径解析中替代系统主目录（`$HOME` / `os.homedir()`）。这可为无界面服务账号启用完整的文件系统隔离。

**优先级：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**示例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以设置为波浪号路径（例如 `~/svc`），使用前会通过 `$HOME` 展开。

## nvm 用户：web_fetch TLS 失败

如果 Node.js 是通过 **nvm** 安装的（而不是系统包管理器），内置的 `fetch()` 会使用
nvm 捆绑的 CA 存储，其中可能缺少现代根 CA（Let’s Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。这会导致 `web_fetch` 在大多数 HTTPS 站点上以 `"fetch failed"` 失败。

在 Linux 上，OpenClaw 会自动检测 nvm，并在实际启动环境中应用修复：

- `openclaw gateway install` 会将 `NODE_EXTRA_CA_CERTS` 写入 systemd 服务环境
- `openclaw` CLI 入口点会在 Node 启动前，使用已设置的 `NODE_EXTRA_CA_CERTS` 重新执行自身

**手动修复（适用于旧版本或直接 `node ...` 启动）：**

在启动 OpenClaw 前导出该变量：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要依赖只将此变量写入 `~/.openclaw/.env`；Node 会在进程启动时读取
`NODE_EXTRA_CA_CERTS`。

## 旧版环境变量

OpenClaw 只读取 `OPENCLAW_*` 环境变量。早期版本中的旧版
`CLAWDBOT_*` 和 `MOLTBOT_*` 前缀会被静默
忽略。

如果在启动时 Gateway 网关进程上仍设置了其中任何变量，OpenClaw 会发出一条
Node 弃用警告（`OPENCLAW_LEGACY_ENV_VARS`），其中列出检测到的
前缀和总数量。请将每个值的旧版前缀替换为 `OPENCLAW_` 来重命名（例如 `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`）；旧名称不会生效。

## 相关内容

- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [常见问题：环境变量和 .env 加载](/zh-CN/help/faq#env-vars-and-env-loading)
- [Models 概览](/zh-CN/concepts/models)
