---
read_when:
- 你需要了解会加载哪些环境变量，以及加载顺序
- 你正在调试 Gateway 网关中缺失的 API 密钥
- 你正在编写提供商身份验证或部署环境相关文档
summary: OpenClaw 从哪里加载环境变量及其优先级顺序
title: 环境变量
x-i18n:
  generated_at: '2026-04-23T20:50:33Z'
  model: gpt-5.4
  provider: openai
  source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
  source_path: help/environment.md
  workflow: 15
---
OpenClaw 会从多个来源拉取环境变量。规则是：**绝不覆盖已有值**。

## 优先级（从高到低）

1. **进程环境变量**（即 Gateway 网关进程已经从父 shell/daemon 继承到的值）。
2. **当前工作目录中的 `.env`**（dotenv 默认行为；不会覆盖已有值）。
3. **全局 `.env`**，位于 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`；不会覆盖已有值）。
4. **`~/.openclaw/openclaw.json` 中的配置 `env` 块**（仅在变量缺失时才应用）。
5. **可选的登录 shell 导入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），仅针对缺失的预期键应用。

在使用默认状态目录的 Ubuntu 全新安装中，OpenClaw 还会在全局 `.env` 之后，将 `~/.config/openclaw/gateway.env` 作为兼容性回退来源。如果这两个文件同时存在且内容不一致，OpenClaw 会保留 `~/.openclaw/.env`，并打印一条警告。

如果配置文件完全不存在，则会跳过第 4 步；如果已启用 shell 导入，第 5 步仍会运行。

## 配置 `env` 块

设置内联环境变量有两种等价方式（两者都不会覆盖已有值）：

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

## Shell 环境变量导入

`env.shellEnv` 会运行你的登录 shell，并且只导入**缺失的**预期键：

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

对应的环境变量：

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## 运行时注入的环境变量

OpenClaw 还会向生成的子进程中注入上下文标记：

- `OPENCLAW_SHELL=exec`：用于通过 `exec` 工具运行的命令。
- `OPENCLAW_SHELL=acp`：用于 ACP 运行时后端进程启动（例如 `acpx`）。
- `OPENCLAW_SHELL=acp-client`：用于 `openclaw acp client` 启动 ACP bridge 进程时。
- `OPENCLAW_SHELL=tui-local`：用于本地 TUI `!` shell 命令。

这些是运行时标记（不是用户必须配置的项）。它们可用于 shell/配置文件逻辑中，
以应用特定上下文规则。

## UI 环境变量

- `OPENCLAW_THEME=light`：当你的终端使用浅色背景时，强制使用浅色 TUI 配色。
- `OPENCLAW_THEME=dark`：强制使用深色 TUI 配色。
- `COLORFGBG`：如果你的终端导出了该变量，OpenClaw 会使用其中的背景色提示来自动选择 TUI 配色。

## 配置中的环境变量替换

你可以在配置字符串值中直接使用 `${VAR_NAME}` 语法引用环境变量：

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

完整详情请参见[配置：环境变量替换](/zh-CN/gateway/configuration-reference#env-var-substitution)。

## Secret refs 与 `${ENV}` 字符串

OpenClaw 支持两种由环境变量驱动的模式：

- 配置值中的 `${VAR}` 字符串替换。
- 对于支持 secrets 引用的字段，可使用 SecretRef 对象（`{ source: "env", provider: "default", id: "VAR" }`）。

两者都会在激活时从进程环境变量中解析。SecretRef 详情记录在[Secrets Management](/zh-CN/gateway/secrets)中。

## 与路径相关的环境变量

| 变量                   | 用途                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | 覆盖所有内部路径解析所使用的主目录（`~/.openclaw/`、智能体目录、会话、凭证）。当 OpenClaw 作为专用服务用户运行时很有用。                                               |
| `OPENCLAW_STATE_DIR`   | 覆盖状态目录（默认 `~/.openclaw`）。                                                                                                                                      |
| `OPENCLAW_CONFIG_PATH` | 覆盖配置文件路径（默认 `~/.openclaw/openclaw.json`）。                                                                                                                    |

## 日志

| 变量                 | 用途                                                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | 覆盖文件和控制台的日志级别（例如 `debug`、`trace`）。优先级高于配置中的 `logging.level` 和 `logging.consoleLevel`。无效值会被忽略，并打印警告。                                |

### `OPENCLAW_HOME`

设置后，`OPENCLAW_HOME` 会替代系统主目录（`$HOME` / `os.homedir()`），用于所有内部路径解析。这使得无头服务账户可以实现完整的文件系统隔离。

**优先级：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**示例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以设置为波浪线路径（例如 `~/svc`），使用前会先通过 `$HOME` 展开。

## nvm 用户：`web_fetch` TLS 失败

如果 Node.js 是通过 **nvm** 安装的（而不是系统包管理器），内置的 `fetch()` 会使用
nvm 自带的 CA 存储，其中可能缺少现代根 CA（如 Let’s Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。这会导致 `web_fetch` 在大多数 HTTPS 网站上因 `"fetch failed"` 而失败。

在 Linux 上，OpenClaw 会自动检测 nvm，并在实际启动环境中应用修复：

- `openclaw gateway install` 会将 `NODE_EXTRA_CA_CERTS` 写入 systemd 服务环境
- `openclaw` CLI 入口点会在 Node 启动前使用已设置 `NODE_EXTRA_CA_CERTS` 的环境重新执行自身

**手动修复**（适用于较旧版本或直接通过 `node ...` 启动的情况）：

在启动 OpenClaw 前导出该变量：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要只依赖写入 `~/.openclaw/.env` 来设置这个变量；Node 会在进程启动时读取
`NODE_EXTRA_CA_CERTS`。

## 相关

- [Gateway 网关配置](/zh-CN/gateway/configuration)
- [常见问题：环境变量和 .env 加载](/zh-CN/help/faq#env-vars-and-env-loading)
- [模型概览](/zh-CN/concepts/models)
