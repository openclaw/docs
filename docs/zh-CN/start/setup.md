---
read_when:
    - 设置新机器
    - 你既想要“最新 + 最佳”，又不想破坏你的个人设置
summary: OpenClaw 的高级设置和开发工作流
title: 设置
x-i18n:
    generated_at: "2026-04-29T08:48:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
如果你是首次设置，请从[入门指南](/zh-CN/start/getting-started)开始。
有关新手引导详情，请参阅[新手引导（CLI）](/zh-CN/start/wizard)。
</Note>

## 简要概览

根据你想要更新的频率，以及是否想自己运行 Gateway 网关，选择一个设置流程：

- **定制内容位于仓库之外：** 将你的配置和工作区保存在 `~/.openclaw/openclaw.json` 和 `~/.openclaw/workspace/` 中，这样仓库更新不会影响它们。
- **稳定流程（推荐大多数人使用）：** 安装 macOS 应用，并让它运行内置的 Gateway 网关。
- **前沿流程（开发）：** 通过 `pnpm gateway:watch` 自己运行 Gateway 网关，然后让 macOS 应用以 Local 模式连接。

## 前置条件（从源码运行）

- 推荐 Node 24（Node 22 LTS，目前为 `22.14+`，仍受支持）
- 首选 `pnpm`（如果你有意使用 [Bun 流程](/zh-CN/install/bun)，也可以使用 Bun）
- Docker（可选；仅用于容器化设置/e2e，请参阅 [Docker](/zh-CN/install/docker)）

## 定制策略（避免更新造成影响）

如果你想要“100% 按我定制”_并且_轻松更新，请将你的自定义内容保存在：

- **配置：** `~/.openclaw/openclaw.json`（JSON/类似 JSON5）
- **工作区：** `~/.openclaw/workspace`（skills、prompts、memories；将其设为私有 git 仓库）

只需引导一次：

```bash
openclaw setup
```

在此仓库内，使用本地 CLI 入口：

```bash
openclaw setup
```

如果你还没有全局安装，请通过 `pnpm openclaw setup` 运行（如果你正在使用 Bun 流程，则使用 `bun run openclaw setup`）。

## 从此仓库运行 Gateway 网关

执行 `pnpm build` 后，可以直接运行打包后的 CLI：

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 稳定流程（macOS 应用优先）

1. 安装并启动 **OpenClaw.app**（菜单栏）。
2. 完成新手引导/权限检查清单（TCC 提示）。
3. 确保 Gateway 网关为 **Local** 且正在运行（由应用管理）。
4. 关联界面（示例：WhatsApp）：

```bash
openclaw channels login
```

5. 完整性检查：

```bash
openclaw health
```

如果你的构建中没有新手引导：

- 运行 `openclaw setup`，然后运行 `openclaw channels login`，再手动启动 Gateway 网关（`openclaw gateway`）。

## 前沿流程（在终端中运行 Gateway 网关）

目标：开发 TypeScript Gateway 网关，获得热重载，并保持 macOS 应用 UI 已连接。

### 0)（可选）也从源码运行 macOS 应用

如果你还想让 macOS 应用也使用前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1) 启动开发 Gateway 网关

```bash
pnpm install
# 仅首次运行（或重置本地 OpenClaw 配置/工作区后）
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` 会在一个具名 tmux 会话中启动或重启 Gateway 网关监听进程，并从交互式终端自动附加。非交互式 shell 会保持分离并打印 `tmux attach -t openclaw-gateway-watch-main`；使用 `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` 可让交互式运行保持分离，或使用 `pnpm gateway:watch:raw` 以前台监听模式运行。监听器会在相关源码、配置和内置插件元数据变更时重新加载。
`pnpm openclaw setup` 是全新检出时一次性的本地配置/工作区初始化步骤。
`pnpm gateway:watch` 不会重新构建 `dist/control-ui`，因此在 `ui/` 变更后请重新运行 `pnpm ui:build`，或在开发 Control UI 时使用 `pnpm ui:dev`。

如果你有意使用 Bun 流程，等价命令如下：

```bash
bun install
# 仅首次运行（或重置本地 OpenClaw 配置/工作区后）
bun run openclaw setup
bun run gateway:watch
```

### 2) 将 macOS 应用指向你正在运行的 Gateway 网关

在 **OpenClaw.app** 中：

- 连接模式：**Local**
  应用会连接到已配置端口上正在运行的 Gateway 网关。

### 3) 验证

- 应用内 Gateway 网关状态应显示 **“正在使用现有 Gateway 网关 …”**
- 或通过 CLI：

```bash
openclaw health
```

### 常见陷阱

- **端口错误：** Gateway 网关 WS 默认值为 `ws://127.0.0.1:18789`；保持应用和 CLI 使用同一端口。
- **状态存储位置：**
  - 渠道/提供商状态：`~/.openclaw/credentials/`
  - 模型认证配置文件：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭证存储映射

在调试认证或决定备份内容时使用此映射：

- **WhatsApp**：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人令牌**：配置/环境变量或 `channels.telegram.tokenFile`（仅普通文件；拒绝符号链接）
- **Discord 机器人令牌**：配置/环境变量或 SecretRef（env/file/exec 提供商）
- **Slack 令牌**：配置/环境变量（`channels.slack.*`）
- **配对允许列表**：
  - `~/.openclaw/credentials/<channel>-allowFrom.json`（默认账户）
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`（非默认账户）
- **模型认证配置文件**：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **文件支持的 secrets 有效载荷（可选）**：`~/.openclaw/secrets.json`
- **旧版 OAuth 导入**：`~/.openclaw/credentials/oauth.json`
  更多详情：[安全](/zh-CN/gateway/security#credential-storage-map)。

## 更新（不破坏你的设置）

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 视为“你的内容”；不要把个人 prompts/配置放进 `openclaw` 仓库。
- 更新源码：`git pull` + 你选择的包管理器安装步骤（默认 `pnpm install`；Bun 流程使用 `bun install`）+ 继续使用匹配的 `gateway:watch` 命令。

## Linux（systemd 用户服务）

Linux 安装使用 systemd **用户**服务。默认情况下，systemd 会在注销/空闲时停止用户服务，这会终止 Gateway 网关。新手引导会尝试为你启用 linger（可能会提示输入 sudo）。如果仍未启用，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于常驻或多用户服务器，请考虑使用 **system** 服务而不是用户服务（无需 linger）。systemd 说明请参阅 [Gateway 网关运行手册](/zh-CN/gateway)。

## 相关文档

- [Gateway 网关运行手册](/zh-CN/gateway)（标志、监督、端口）
- [Gateway 网关配置](/zh-CN/gateway/configuration)（配置架构 + 示例）
- [Discord](/zh-CN/channels/discord) 和 [Telegram](/zh-CN/channels/telegram)（回复标签 + replyToMode 设置）
- [OpenClaw 助手设置](/zh-CN/start/openclaw)
- [macOS 应用](/zh-CN/platforms/macos)（Gateway 网关生命周期）
