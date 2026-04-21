---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 每个 Gateway 网关都需要独立隔离的配置 / 状态 / 端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置档案）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-04-21T18:05:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a0bae1fbb088d1c1b7a90bb1de8f33471a19c5fbeafd8e2a0556d8eeadf8c15
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 多个 Gateway 网关（同一主机）

大多数情况下应只使用一个 Gateway 网关，因为单个 Gateway 网关就可以处理多个消息连接和智能体。如果你需要更强的隔离性或冗余（例如救援机器人），请运行使用独立配置档案 / 端口隔离的多个 Gateway 网关。

## 最佳推荐设置

对大多数用户来说，最简单的救援机器人设置是：

- 主机器人保留在默认配置档案上
- 救援机器人使用 `--profile rescue` 运行
- 为救援账号使用一个完全独立的 Telegram 机器人
- 让救援机器人使用不同的基础端口，例如 `19789`

这样可以让救援机器人与主机器人隔离，因此当主机器人宕机时，它仍然可以用于调试或应用配置更改。基础端口之间至少保留 20 个端口的间隔，这样派生出的浏览器 / canvas / CDP 端口就不会发生冲突。

## 救援机器人快速开始

除非你有充分理由采用其他方式，否则请将此作为默认路径：

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主机器人已经在运行，通常这就是你所需要做的全部操作。

在执行 `openclaw --profile rescue onboard` 期间：

- 使用单独的 Telegram 机器人令牌
- 保留 `rescue` 配置档案
- 使用比主机器人至少高 20 的基础端口
- 接受默认的救援工作区，除非你已经自行管理了一个工作区

如果新手引导已经为你安装了救援服务，那么最后的 `gateway install` 就不需要了。

## 为什么这样可行

救援机器人之所以能保持独立，是因为它拥有自己独立的：

- 配置档案 / 配置
- 状态目录
- 工作区
- 基础端口（以及派生端口）
- Telegram 机器人令牌

对于大多数设置，建议为救援配置档案使用一个完全独立的 Telegram 机器人：

- 易于保持为仅操作员可用
- 具有独立的机器人令牌和身份
- 不依赖主机器人的渠道 / 应用安装
- 当主机器人损坏时，提供简单的基于私信的恢复路径

## `--profile rescue onboard` 会更改什么

`openclaw --profile rescue onboard` 使用正常的新手引导流程，但它会把所有内容写入一个独立的配置档案中。

实际效果是，救援机器人会拥有自己独立的：

- 配置文件
- 状态目录
- 工作区（默认是 `~/.openclaw/workspace-rescue`）
- 托管服务名称

除此之外，提示内容与普通新手引导相同。

## 隔离检查清单

为每个 Gateway 网关实例保持以下项唯一：

- `OPENCLAW_CONFIG_PATH` — 每个实例独立的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例独立的会话、凭证、缓存
- `agents.defaults.workspace` — 每个实例独立的工作区根目录
- `gateway.port`（或 `--port`）— 每个实例唯一
- 派生的浏览器 / canvas / CDP 端口

如果这些项目被共享，你将遇到配置竞争和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅限 loopback）
- canvas host 由 Gateway 网关 HTTP 服务器提供（与 `gateway.port` 使用相同端口）
- Browser 配置档案 CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了其中任何一项，必须确保每个实例都保持唯一。

## 浏览器 / CDP 说明（常见陷阱）

- **不要** 在多个实例上把 `browser.cdpUrl` 固定为相同的值。
- 每个实例都需要自己独立的浏览器控制端口和 CDP 范围（从其 Gateway 网关端口派生）。
- 如果你需要显式指定 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：请使用 `browser.profiles.<name>.cdpUrl`（按配置档案、按实例设置）。

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

- `gateway status --deep` 有助于发现旧安装遗留下来的 launchd / systemd / schtasks 服务。
- 当你有意运行多个相互隔离的 Gateway 网关时，`gateway probe` 中诸如 `multiple reachable gateways detected` 这样的警告文本属于预期现象。
