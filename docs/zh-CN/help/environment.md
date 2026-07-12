---
read_when:
    - 你需要了解会加载哪些环境变量，以及它们的加载顺序
    - 你正在调试 Gateway 网关中缺失的 API 密钥
    - 你正在编写提供商身份验证或部署环境的文档
summary: OpenClaw 加载环境变量的位置及其优先级顺序
title: 环境变量
x-i18n:
    generated_at: "2026-07-12T14:30:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw 从多个来源加载环境变量。规则是**绝不覆盖现有值**。
工作区 `.env` 文件属于较低信任级别的来源：OpenClaw 会先忽略工作区 `.env` 中的提供商凭据和受保护的运行时控制项，再应用优先级规则。

## 优先级（从高到低）

1. **进程环境**（Gateway 网关进程已从父 shell/守护进程继承的环境）。
2. **当前工作目录中的 `.env`**（dotenv 默认行为；不覆盖；忽略提供商凭据和受保护的运行时控制项）。
3. **全局 `.env`**，位于 `~/.openclaw/.env`（也称 `$OPENCLAW_STATE_DIR/.env`；建议用于提供商 API 密钥；不覆盖）。
4. **配置中的 `env` 块**，位于 `~/.openclaw/openclaw.json`（仅在缺失时应用）。
5. **可选的登录 shell 导入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`），仅应用缺失的预期键名。

在使用默认状态目录的全新 Ubuntu 安装中，OpenClaw 还会将 `~/.config/openclaw/gateway.env` 视为全局 `.env` 之后的兼容性回退。如果两个文件同时存在但内容冲突，OpenClaw 会保留 `~/.openclaw/.env` 中的值并输出警告。

如果配置文件完全不存在，则跳过第 4 步；如果启用了 shell 导入，它仍会运行。

## 提供商凭据和工作区 `.env`

不要仅将提供商 API 密钥保存在工作区 `.env` 中。OpenClaw 会阻止从工作区 `.env` 文件加载大量提供商凭据键和端点重定向键，其中包括所有已知的提供商身份验证环境变量（例如 `GEMINI_API_KEY`、`GOOGLE_API_KEY`、`XAI_API_KEY`、`MISTRAL_API_KEY`、`GROQ_API_KEY`、`DEEPSEEK_API_KEY`、`PERPLEXITY_API_KEY`、`BRAVE_API_KEY`、`TAVILY_API_KEY`、`EXA_API_KEY`、`FIRECRAWL_API_KEY`），以及所有以 `_API_HOST`、`_BASE_URL` 或 `_HOMESERVER` 结尾的键，还有整个 `OPENCLAW_*`、`CLAWHUB_*`、`ANTHROPIC_API_KEY_*` 和 `OPENAI_API_KEY_*` 命名空间。

请改用以下任一可信来源存储提供商凭据：

- Gateway 网关进程环境，例如 shell、launchd/systemd 单元、容器密钥或 CI 密钥。
- 位于 `~/.openclaw/.env` 或 `$OPENCLAW_STATE_DIR/.env` 的全局运行时 dotenv 文件。
- `~/.openclaw/openclaw.json` 配置中的 `env` 块。
- 启用 `env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1` 时的可选登录 shell 导入。

如果你以前仅将提供商密钥存储在工作区 `.env` 中，请将其移至上述任一可信来源。工作区 `.env` 仍可提供不属于凭据、端点重定向、主机覆盖或 `OPENCLAW_*` 运行时控制项的普通项目变量。

有关安全设计依据，请参阅[工作区 `.env` 文件](/zh-CN/gateway/security#workspace-env-files)。

## 配置 `env` 块

可以通过两种等效方式设置内联环境变量（两者都不会覆盖现有值）：

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

配置 `env` 块仅接受字面字符串值。它不会展开
`file:...` 值；例如，`XAI_API_KEY: "file:secrets/xai-api-key.txt"`
会以完全相同的字符串传递给提供商。

对于基于文件的提供商密钥，请在支持 SecretRef 的凭据字段中使用
SecretRef：

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

有关支持的字段，请参阅[密钥管理](/zh-CN/gateway/secrets)和
[SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)。

## Shell 环境导入

`env.shellEnv` 会运行你的登录 shell，并且仅导入**缺失的**预期键名：

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
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`（默认值为 `15000`）

## Exec shell 快照

在非 Windows 的 Gateway 网关主机上，bash 和 zsh `exec` 命令默认使用启动快照。
在 Gateway 网关进程环境中设置 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` 可禁用此路径。
值 `false`、`no` 和 `off` 也会禁用它。每次调用的 `exec.env` 值无法切换
快照，也无法重定向快照缓存。

## 运行时注入的环境变量

OpenClaw 还会向生成的子进程中注入上下文标记：

- `OPENCLAW_SHELL=exec`：为通过 `exec` 工具运行的命令设置。
- `OPENCLAW_SHELL=acp-client`：当 `openclaw acp client` 生成 ACP 桥接进程时设置。
- `OPENCLAW_SHELL=tui-local`：为本地 TUI `!` shell 命令设置。
- `OPENCLAW_CLI=1`：为 CLI 入口点生成的子进程设置。

这些是运行时标记（并非必需的用户配置）。你可以在 shell/profile 逻辑中使用它们
来应用特定于上下文的规则。

## UI 环境变量

- `OPENCLAW_THEME=light`：当终端背景为浅色时，强制使用浅色 TUI 调色板。
- `OPENCLAW_THEME=dark`：强制使用深色 TUI 调色板。
- `COLORFGBG`：如果终端导出了该变量，OpenClaw 会使用其中的背景颜色提示自动选择 TUI 调色板。

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

有关完整详情，请参阅[配置：环境变量替换](/zh-CN/gateway/configuration-reference#env-var-substitution)。

## 密钥引用与 `${ENV}` 字符串

OpenClaw 支持两种由环境变量驱动的模式：

- 配置值中的 `${VAR}` 字符串替换。
- 对于支持密钥引用的字段，使用 SecretRef 对象（`{ source: "env", provider: "default", id: "VAR" }`）。

两者都会在激活时从进程环境中解析。SecretRef 的详细信息参见[密钥管理](/zh-CN/gateway/secrets)。
配置 `env` 块本身不会解析 SecretRef 或 `file:...`
简写值。

## 路径相关的环境变量

| 变量                     | 用途                                                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 覆盖 OpenClaw 内部路径默认值使用的主目录（`~/.openclaw/`、智能体目录、会话、凭据、安装程序新手引导，以及默认开发检出）。以专用服务用户身份运行 OpenClaw 时非常有用。 |
| `OPENCLAW_STATE_DIR`     | 覆盖状态目录（默认值为 `~/.openclaw`）。                                                                                                                                                                                                       |
| `OPENCLAW_CONFIG_PATH`   | 覆盖配置文件路径（默认值为 `~/.openclaw/openclaw.json`）。                                                                                                                                                                                      |
| `OPENCLAW_INCLUDE_ROOTS` | 目录路径列表，允许 `$include` 指令从配置目录外解析文件（默认：无——`$include` 仅限于配置目录）。支持波浪号展开。                                                                                                                                |

## 日志

| 变量                             | 用途                                                                                                                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 覆盖文件和控制台的日志级别（例如 `debug`、`trace`）。优先级高于配置中的 `logging.level` 和 `logging.consoleLevel`。无效值会被忽略并输出警告。 |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 在不启用全局调试日志的情况下，以 `info` 级别输出有针对性的模型请求/响应计时诊断。                                                                                                                         |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 模型载荷诊断：`summary`、`tools` 或 `full-redacted`。`full-redacted` 有大小上限并经过脱敏，但可能包含提示词/消息文本。                                                                                       |
| `OPENCLAW_DEBUG_SSE`             | 流式传输诊断：使用 `events` 输出首次事件/完成事件计时，使用 `peek` 包含前 5 个经过脱敏的 SSE 事件。                                                                                                        |
| `OPENCLAW_DEBUG_CODE_MODE`       | 代码模式的模型表面诊断，包括隐藏提供商工具以及紧凑控制/direct 强制执行。                                                                                                                                  |

### `OPENCLAW_HOME`

设置后，`OPENCLAW_HOME` 会替代系统主目录（`$HOME` / `os.homedir()`），用于 OpenClaw 内部路径默认值。这包括默认状态目录、配置路径、智能体目录、凭据、安装程序新手引导工作区，以及 `openclaw update --channel dev` 使用的默认开发检出。

**优先级：** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android 上的 Termux `PREFIX` 主目录回退 > `os.homedir()`

**示例**（macOS LaunchDaemon）：

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以设置为波浪号路径（例如 `~/svc`），使用前会通过相同的操作系统主目录回退链进行展开。

`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH` 和 `OPENCLAW_GIT_DIR` 等显式路径变量仍具有更高优先级。shell 启动文件检测、包管理器设置和主机 `~` 展开等操作系统账户任务仍可能使用真实的系统主目录。

## nvm 用户：web_fetch TLS 失败

如果 Node.js 是通过 **nvm**（而非系统包管理器）安装的，内置 `fetch()` 会使用
nvm 捆绑的 CA 存储，其中可能缺少现代根 CA（用于 Let's Encrypt 的 ISRG Root X1/X2、
DigiCert Global Root G2 等）。这会导致 `web_fetch` 在大多数 HTTPS 站点上以 `"fetch failed"` 失败。

在 Linux 上，OpenClaw 会自动检测 nvm，并在实际启动环境中应用修复：

- `openclaw gateway install` 将 `NODE_EXTRA_CA_CERTS` 写入 systemd 服务环境
- `openclaw` CLI 入口点会在 Node 启动前设置 `NODE_EXTRA_CA_CERTS`，然后重新执行自身

**手动修复（适用于旧版本或直接执行 `node ...` 的情况）：**

在启动 OpenClaw 前导出该变量：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要依赖仅将此变量写入 `~/.openclaw/.env`；Node 会在进程启动时读取
`NODE_EXTRA_CA_CERTS`。

## 旧版环境变量

OpenClaw 仅读取 `OPENCLAW_*` 环境变量。早期版本中的旧版
`CLAWDBOT_*` 和 `MOLTBOT_*` 前缀会被静默
忽略。

如果 Gateway 网关进程启动时仍设置了任何此类变量，OpenClaw 会输出一条
Node 弃用警告（`OPENCLAW_LEGACY_ENV_VARS`），其中列出检测到的
前缀和总数。请将旧版前缀替换为 `OPENCLAW_` 以重命名每个值（例如将
`CLAWDBOT_GATEWAY_TOKEN` 改为 `OPENCLAW_GATEWAY_TOKEN`）；旧名称不会生效。

## 相关内容

- [Gateway 配置](/zh-CN/gateway/configuration)
- [常见问题：环境变量和 .env 加载](/zh-CN/help/faq#env-vars-and-env-loading)
- [Models 概览](/zh-CN/concepts/models)
