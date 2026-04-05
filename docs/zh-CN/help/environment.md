---
read_when:
    - 你需要知道会加载哪些环境变量，以及按什么顺序加载
    - 你正在调试 Gateway 网关中缺失的 API key
    - 你正在记录提供商认证或部署环境
summary: OpenClaw 从哪里加载环境变量，以及它们的优先级顺序
title: 环境变量
x-i18n:
    generated_at: "2026-04-05T08:25:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# 环境变量

OpenClaw 会从多个来源拉取环境变量。规则是：**绝不覆盖现有值**。

## 优先级（从高到低）

1. **进程环境变量**（Gateway 网关进程已从父 shell/daemon 继承的内容）。
2. **当前工作目录中的 `.env`**（dotenv 默认行为；不会覆盖）。
3. **全局 `.env`**，位于 `~/.openclaw/.env`（也就是 `$OPENCLAW_STATE_DIR/.env`；不会覆盖）。
4. **`~/.openclaw/openclaw.json` 中的配置 `env` 块**（仅在缺失时应用）。
5. **可选的登录 shell 导入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），仅对缺失的预期键名生效。

在使用默认状态目录的 Ubuntu 全新安装中，OpenClaw 还会将 `~/.config/openclaw/gateway.env` 视为全局 `.env` 之后的兼容性回退文件。如果两个文件都存在且内容冲突，OpenClaw 会保留 `~/.openclaw/.env` 并打印警告。

如果配置文件完全缺失，则会跳过第 4 步；如果已启用，shell 导入仍会运行。

## 配置 `env` 块

有两种等价的方式来设置内联环境变量（两者都不会覆盖现有值）：

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

OpenClaw 还会向生成的子进程中注入上下文标记：

- `OPENCLAW_SHELL=exec`：通过 `exec` 工具运行命令时设置。
- `OPENCLAW_SHELL=acp`：为 ACP 运行时后端进程启动设置（例如 `acpx`）。
- `OPENCLAW_SHELL=acp-client`：`openclaw acp client` 启动 ACP 桥接进程时设置。
- `OPENCLAW_SHELL=tui-local`：本地 TUI `!` shell 命令时设置。

这些是运行时标记（不是必须的用户配置）。可在 shell/profile 逻辑中使用，
以应用特定于上下文的规则。

## UI 环境变量

- `OPENCLAW_THEME=light`：当你的终端使用浅色背景时，强制使用浅色 TUI 调色板。
- `OPENCLAW_THEME=dark`：强制使用深色 TUI 调色板。
- `COLORFGBG`：如果你的终端导出了它，OpenClaw 会使用背景色提示自动选择 TUI 调色板。

## 配置中的环境变量替换

你可以在配置字符串值中使用 `${VAR_NAME}` 语法直接引用环境变量：

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

完整详情请参阅[配置：环境变量替换](/gateway/configuration-reference#env-var-substitution)。

## Secret refs 与 `${ENV}` 字符串

OpenClaw 支持两种由环境变量驱动的模式：

- 配置值中的 `${VAR}` 字符串替换。
- SecretRef 对象（`{ source: "env", provider: "default", id: "VAR" }`），用于支持 secrets 引用的字段。

两者都会在激活时从进程环境变量中解析。SecretRef 详情记录在[Secrets Management](/gateway/secrets)中。

## 路径相关环境变量

| Variable               | Purpose                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | 覆盖用于所有内部路径解析的主目录（`~/.openclaw/`、智能体目录、会话、凭证）。当你以专用服务用户运行 OpenClaw 时很有用。 |
| `OPENCLAW_STATE_DIR`   | 覆盖状态目录（默认 `~/.openclaw`）。                                                                                                                   |
| `OPENCLAW_CONFIG_PATH` | 覆盖配置文件路径（默认 `~/.openclaw/openclaw.json`）。                                                                                                  |

## 日志

| Variable             | Purpose                                                                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | 同时覆盖文件和控制台的日志级别（例如 `debug`、`trace`）。优先级高于配置中的 `logging.level` 和 `logging.consoleLevel`。无效值会被忽略并发出警告。 |

### `OPENCLAW_HOME`

设置后，`OPENCLAW_HOME` 会替代系统主目录（`$HOME` / `os.homedir()`），用于所有内部路径解析。这可为无头服务账户启用完整的文件系统隔离。

**优先级：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**示例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以设为波浪线路径（例如 `~/svc`），在使用前会基于 `$HOME` 展开。

## nvm 用户：`web_fetch` TLS 失败

如果 Node.js 是通过 **nvm** 安装的（而不是系统包管理器），内置 `fetch()` 使用的是
nvm 附带的 CA 存储，它可能缺少现代根 CA（Let’s Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。这会导致 `web_fetch` 在大多数 HTTPS 站点上以 `"fetch failed"` 失败。

在 Linux 上，OpenClaw 会自动检测 nvm，并在实际启动环境中应用修复：

- `openclaw gateway install` 会将 `NODE_EXTRA_CA_CERTS` 写入 systemd 服务环境
- `openclaw` CLI 入口点会在 Node 启动前使用已设置 `NODE_EXTRA_CA_CERTS` 的环境重新执行自身

**手动修复**（适用于较旧版本或直接 `node ...` 启动）：

在启动 OpenClaw 之前导出该变量：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要只依赖写入 `~/.openclaw/.env` 来设置该变量；Node 会在进程启动时读取
`NODE_EXTRA_CA_CERTS`。

## 相关

- [Gateway 网关配置](/gateway/configuration)
- [常见问题：环境变量与 `.env` 加载](/help/faq#env-vars-and-env-loading)
- [模型概览](/concepts/models)
