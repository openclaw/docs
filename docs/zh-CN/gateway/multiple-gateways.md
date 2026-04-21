---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 每个 Gateway 网关都需要独立的配置/状态/端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置档案）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-04-21T18:36:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36796da339d5baea1704a7f42530030ea6ef4fa4bde43452ffec946b917ed4a3
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 多个 Gateway 网关（同一主机）

大多数情况下应只使用一个 Gateway 网关，因为单个 Gateway 网关就能处理多个消息连接和智能体。如果你需要更强的隔离或冗余能力（例如一个救援 bot），请运行使用独立配置档案/端口的多个 Gateway 网关。

## 最佳推荐设置

对大多数用户来说，最简单的救援 bot 设置是：

- 主 bot 保持使用默认配置档案
- 救援 bot 使用 `--profile rescue` 运行
- 为救援账号使用一个完全独立的 Telegram bot
- 让救援 bot 使用不同的基础端口，例如 `19789`

这样可以让救援 bot 与主 bot 隔离，这样当主 bot 宕机时，它仍可用于调试或应用配置变更。基础端口之间至少保留 20 个端口的间隔，这样派生出的浏览器/canvas/CDP 端口就不会发生冲突。

## 救援 Bot 快速开始

除非你有非常明确的理由要采用其他方式，否则请将此作为默认路径：

```bash
# 救援 bot（独立的 Telegram bot、独立的配置档案、端口 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主 bot 已经在运行，通常这就足够了。

在执行 `openclaw --profile rescue onboard` 期间：

- 使用独立的 Telegram bot token
- 保持使用 `rescue` 配置档案
- 使用一个至少比主 bot 高 20 的基础端口
- 接受默认的救援工作区，除非你已经自行管理了一个

如果新手引导过程已经为你安装了救援服务，那么最后这条 `gateway install` 就不需要了。

## 为什么这样可行

救援 bot 能保持独立，是因为它拥有自己独立的：

- 配置档案/配置
- 状态目录
- 工作区
- 基础端口（以及派生端口）
- Telegram bot token

对大多数设置来说，救援配置档案最好使用一个完全独立的 Telegram bot：

- 易于保持为仅限操作员使用
- 独立的 bot token 和身份
- 不依赖主 bot 的渠道/应用安装
- 当主 bot 出问题时，提供简单的基于私信的恢复路径

## `--profile rescue onboard` 会更改什么

`openclaw --profile rescue onboard` 使用正常的新手引导流程，但会将所有内容写入一个独立的配置档案中。

实际效果是，救援 bot 将拥有自己独立的：

- 配置文件
- 状态目录
- 工作区（默认为 `~/.openclaw/workspace-rescue`）
- 托管服务名称

除此之外，提示内容与普通新手引导相同。

## 通用多 Gateway 网关设置

上面的救援 bot 布局是最简单的默认方案，但同样的隔离模式也适用于在同一主机上运行任意两组或多组 Gateway 网关。

更通用的做法是，为每个额外的 Gateway 网关分配一个有名称的独立配置档案，以及它自己的基础端口：

```bash
# main（默认配置档案）
openclaw setup
openclaw gateway --port 18789

# 额外的 gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果你希望两个 Gateway 网关都使用具名配置档案，也完全可行：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服务也遵循相同模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

当你想要一条备用的操作员通道时，请使用“救援 Bot 快速开始”。当你想为不同的渠道、租户、工作区或运维角色运行多个长期存在的 Gateway 网关时，请使用通用配置档案模式。

## 隔离检查清单

请确保每个 Gateway 网关实例下列项目都是唯一的：

- `OPENCLAW_CONFIG_PATH` — 每个实例独立的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例独立的会话、凭证、缓存
- `agents.defaults.workspace` — 每个实例独立的工作区根目录
- `gateway.port`（或 `--port`）— 每个实例唯一
- 派生出的浏览器/canvas/CDP 端口

如果这些内容被共享，你就会遇到配置竞争和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅限 loopback）
- canvas host 由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 使用同一端口）
- 浏览器配置档案 CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了其中任意值，就必须确保每个实例的值都唯一。

## 浏览器/CDP 说明（常见陷阱）

- **不要** 在多个实例上将 `browser.cdpUrl` 固定为相同的值。
- 每个实例都需要自己独立的浏览器控制端口和 CDP 范围（由其 gateway 端口派生）。
- 如果你需要显式指定 CDP 端口，请按实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：使用 `browser.profiles.<name>.cdpUrl`（按配置档案、按实例设置）。

## 手动环境变量示例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## 快速检查

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

说明：

- `gateway status --deep` 有助于发现旧安装遗留的 launchd/systemd/schtasks 服务。
- 只有当你是有意运行多个相互隔离的 Gateway 网关时，`gateway probe` 中类似 `multiple reachable gateways detected` 的警告文本才是符合预期的。
