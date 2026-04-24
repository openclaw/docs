---
read_when:
    - 设置一台新机器
    - 你想要“最新最强”，同时又不破坏你的个人设置
summary: OpenClaw 的高级设置与开发工作流
title: 设置
x-i18n:
    generated_at: "2026-04-24T03:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
如果这是你第一次设置，请先阅读[入门指南](/zh-CN/start/getting-started)。
有关新手引导的详细信息，请参阅[设置向导（CLI）](/zh-CN/start/wizard)。
</Note>

## TL;DR

根据你希望更新的频率，以及你是否想自己运行 Gateway 网关，选择一种设置工作流：

- **个性化内容放在仓库之外：** 将你的配置和工作区保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/` 中，这样仓库更新就不会影响它们。
- **稳定工作流（推荐大多数人使用）：** 安装 macOS 应用，并让它运行内置的 Gateway 网关。
- **前沿工作流（开发）：** 通过 `pnpm gateway:watch` 自行运行 Gateway 网关，然后让 macOS 应用在本地模式下连接上来。

## 前置要求（从源码）

- 推荐使用 Node 24（仍支持 Node 22 LTS，目前为 `22.14+`）
- 推荐使用 `pnpm`（或者如果你明确要使用 [Bun 工作流](/zh-CN/install/bun)，也可以用 Bun）
- Docker（可选；仅用于容器化设置/e2e——请参阅 [Docker](/zh-CN/install/docker)）

## 个性化策略（这样更新就不会伤到你）

如果你想要“100% 按我定制”**并且**易于更新，请将你的自定义内容保存在：

- **配置：** `~/.openclaw/openclaw.json`（JSON/近似 JSON5）
- **工作区：** `~/.openclaw/workspace`（skills、提示词、记忆；建议将其设为私有 git 仓库）

一次性初始化：

```bash
openclaw setup
```

在这个仓库内，使用本地 CLI 入口：

```bash
openclaw setup
```

如果你还没有全局安装，请通过 `pnpm openclaw setup` 运行（如果你使用的是 Bun 工作流，则用 `bun run openclaw setup`）。

## 从此仓库运行 Gateway 网关

执行 `pnpm build` 后，你可以直接运行打包后的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定工作流（先用 macOS 应用）

1. 安装并启动 **OpenClaw.app**（菜单栏应用）。
2. 完成新手引导/权限检查清单（TCC 提示）。
3. 确保 Gateway 网关处于 **Local** 模式并正在运行（由应用管理）。
4. 连接各个接口（例如：WhatsApp）：

```bash
openclaw channels login
```

5. 完整性检查：

```bash
openclaw health
```

如果你的构建中没有新手引导：

- 运行 `openclaw setup`，然后运行 `openclaw channels login`，再手动启动 Gateway 网关（`openclaw gateway`）。

## 前沿工作流（在终端中运行 Gateway 网关）

目标：开发 TypeScript Gateway 网关，获得热重载，同时保持 macOS 应用 UI 已连接。

### 0）（可选）也从源码运行 macOS 应用

如果你也想让 macOS 应用使用前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1）启动开发版 Gateway 网关

```bash
pnpm install
# 仅首次运行（或在重置本地 OpenClaw 配置/工作区之后）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 会以 watch 模式运行 gateway，并在相关源码、
配置以及内置插件元数据变更时重新加载。
`pnpm openclaw setup` 是全新 checkout 时，用于初始化本地配置/工作区的一次性步骤。
`pnpm gateway:watch` 不会重建 `dist/control-ui`，因此在 `ui/` 变更后请重新运行 `pnpm ui:build`，或在开发 Control UI 时使用 `pnpm ui:dev`。

如果你明确使用的是 Bun 工作流，对应命令为：

```bash
bun install
# 仅首次运行（或在重置本地 OpenClaw 配置/工作区之后）
bun run openclaw setup
bun run gateway:watch
```

### 2）让 macOS 应用连接到你正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- 连接模式：**Local**
  应用会连接到已配置端口上正在运行的 gateway。

### 3）验证

- 应用内的 Gateway 网关状态应显示为 **“Using existing gateway …”**
- 或通过 CLI：

```bash
openclaw health
```

### 常见陷阱

- **端口错误：** Gateway WebSocket 默认是 `ws://127.0.0.1:18789`；请确保应用和 CLI 使用同一个端口。
- **状态存储位置：**
  - 渠道/提供商状态：`~/.openclaw/credentials/`
  - 模型认证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭证存储映射

在调试认证问题或决定备份哪些内容时，可参考这里：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**：配置/env 或 `channels.telegram.tokenFile`（仅允许普通文件；拒绝符号链接）
- **Discord bot token**：配置/env 或 SecretRef（env/file/exec 提供商）
- **Slack tokens**：配置/env（`channels.slack.*`）
- **配对允许列表：**
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账户）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账户）
- **模型认证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **基于文件的 secrets 负载（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  更多细节请参阅：[安全](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏你的设置）

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 视为“你的内容”；不要把个人提示词/配置放进 `openclaw` 仓库中。
- 更新源码：`git pull` + 你所选包管理器的安装步骤（默认是 `pnpm install`；Bun 工作流使用 `bun install`）+ 继续使用对应的 `gateway:watch` 命令。

## Linux（systemd 用户服务）

Linux 安装使用 systemd **用户**服务。默认情况下，systemd 会在用户
注销/空闲时停止用户服务，这会终止 Gateway 网关。新手引导会尝试为你启用
lingering（可能会提示输入 sudo）。如果仍未启用，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于始终在线或多用户服务器，可考虑使用**系统**服务而不是
用户服务（这样就不需要 lingering）。有关 systemd 的说明，请参阅 [Gateway runbook](/zh-CN/gateway)。

## 相关文档

- [Gateway runbook](/zh-CN/gateway)（标志、托管、端口）
- [Gateway 网关配置](/zh-CN/gateway/configuration)（配置 schema + 示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签 + `replyToMode` 设置）
- [OpenClaw assistant 设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（gateway 生命周期）
