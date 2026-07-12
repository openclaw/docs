---
read_when:
    - 设置新机器
    - 你希望获得“最新、最好”的体验，同时不破坏你的个人设置
summary: OpenClaw 高级设置和开发工作流
title: 设置
x-i18n:
    generated_at: "2026-07-12T14:46:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是首次设置，请从[入门指南](/zh-CN/start/getting-started)开始。
有关新手引导的详细信息，请参阅[新手引导（CLI）](/zh-CN/start/wizard)。
</Note>

## 概要

根据你希望更新的频率以及是否想自行运行 Gateway 网关，选择设置工作流：

- **将个性化内容放在仓库之外：** 将配置和工作区保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/` 中，这样仓库更新不会改动它们。
- **稳定版工作流（推荐大多数用户使用）：** 安装 macOS 应用，并让它运行内置的 Gateway 网关。
- **前沿版工作流（开发）：** 通过 `pnpm gateway:watch` 自行运行 Gateway 网关，然后让 macOS 应用以 Local 模式连接。

## 前置条件（从源码运行）

- 推荐使用 Node 24（仍支持 Node 22 LTS，当前为 `22.19+`）
- 从源码检出时必须使用 `pnpm`。在开发模式下，OpenClaw 会从
  `extensions/*` 的 pnpm 工作区包加载内置插件，因此在根目录运行 `npm install`
  无法准备完整的源码树。
- Docker（可选；仅用于容器化设置/E2E——请参阅 [Docker](/zh-CN/install/docker)）

## 个性化策略（避免更新造成影响）

如果你既希望“100% 为我量身定制”，又希望轻松更新，请将自定义内容保存在：

- **配置：** `~/.openclaw/openclaw.json`（类似 JSON/JSON5）
- **工作区：** `~/.openclaw/workspace`（Skills、提示词、记忆；将其设为私有 Git 仓库）

只需初始化一次配置/工作区文件夹，无需运行完整的新手引导向导：

```bash
openclaw setup --baseline
```

尚未全局安装？请改为从此仓库运行：

```bash
pnpm openclaw setup --baseline
```

（不带 `--baseline` 的 `openclaw setup` 是 `openclaw onboard` 的别名，会运行完整的交互式向导。）

## 从此仓库运行 Gateway 网关

运行 `pnpm build` 后，可以直接运行已打包的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定版工作流（优先使用 macOS 应用）

1. 安装并启动 **OpenClaw.app**（菜单栏应用）。
2. 完成新手引导/权限检查清单（TCC 提示）。
3. 确保 Gateway 网关设为 **Local** 且正在运行（由应用管理）。
4. 连接渠道（例如 WhatsApp）：

```bash
openclaw channels login
```

5. 执行完整性检查：

```bash
openclaw health
```

如果你的构建版本不提供新手引导：

- 运行 `openclaw setup`，然后运行 `openclaw channels login`，再手动启动 Gateway 网关（`openclaw gateway`）。

## 前沿版工作流（在终端中运行 Gateway 网关）

目标：开发 TypeScript Gateway 网关、获得热重载，并保持 macOS 应用 UI 与其连接。

### 0)（可选）同时从源码运行 macOS 应用

如果你还希望使用前沿版 macOS 应用：

```bash
./scripts/restart-mac.sh
```

### 1) 启动开发版 Gateway 网关

```bash
pnpm install
# 仅首次运行时需要（或重置本地 OpenClaw 配置/工作区后）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 会在命名的 tmux 会话
（`openclaw-gateway-watch-main`）中启动或重启 Gateway 网关监视进程，并从交互式
终端自动附加。非交互式 shell 会保持分离并输出
`tmux attach -t openclaw-gateway-watch-main`；使用
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可让交互式运行保持
分离，或使用 `pnpm gateway:watch:raw` 进入前台监视模式。监视器会在相关源码、
配置和内置插件元数据发生变化时重新加载。如果受监视的 Gateway 网关在启动期间退出，
`gateway:watch` 会运行一次 `openclaw doctor --fix --non-interactive` 并重试；
将 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` 设为可禁用此仅用于开发环境的修复步骤。
`pnpm gateway:watch` 不会重新构建 `dist/control-ui`，因此修改 `ui/` 后请重新运行 `pnpm ui:build`，或者在开发 Control UI 时使用 `pnpm ui:dev`。

### 2) 将 macOS 应用连接到正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- Connection Mode: **Local**
  应用将连接到配置端口上正在运行的 Gateway 网关。

### 3) 验证

- 应用内的 Gateway 网关状态应显示 **"Using existing gateway …"**
- 或通过 CLI 验证：

```bash
openclaw health
```

### 常见陷阱

- **端口错误：** Gateway 网关的 WebSocket 默认地址为 `ws://127.0.0.1:18789`；请确保应用和 CLI 使用相同端口。
- **状态存储位置：**
  - 渠道/提供商状态：`~/.openclaw/credentials/`
  - 模型身份验证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话和记录：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - 旧版/归档会话工件：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭证存储映射

调试身份验证问题或决定备份内容时，请参考以下信息：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram Bot 令牌**：配置/环境变量或 `channels.telegram.tokenFile`（仅支持常规文件；拒绝符号链接）
- **Discord Bot 令牌**：配置/环境变量或 SecretRef（env/file/exec 提供商）
- **Slack 令牌**：配置/环境变量（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账户）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账户）
- **模型身份验证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的密钥载荷（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  更多详情：[安全性](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏现有设置）

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 视为“你的内容”；不要将个人提示词/配置放入 `openclaw` 仓库。
- 更新源码：运行 `git pull` + `pnpm install`，并继续使用 `pnpm gateway:watch`。

## Linux（systemd 用户服务）

Linux 安装使用 systemd **用户**服务。默认情况下，systemd 会在用户注销或空闲时停止
用户服务，这会终止 Gateway 网关。新手引导会尝试为你启用 lingering（可能会提示输入 sudo）。
如果仍未启用，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于常驻或多用户服务器，请考虑使用**系统**服务而不是用户服务（无需 lingering）。
有关 systemd 的说明，请参阅 [Gateway 网关运行手册](/zh-CN/gateway)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)（标志、进程监管、端口）
- [Gateway 配置](/zh-CN/gateway/configuration)（配置模式和示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签和 replyToMode 设置）
- [OpenClaw 助手设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（Gateway 网关生命周期）
