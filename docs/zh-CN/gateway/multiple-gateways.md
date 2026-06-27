---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 每个 Gateway 网关都需要隔离的配置、状态和端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置档案）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-06-27T02:04:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

大多数设置应使用一个 Gateway 网关，因为单个 Gateway 网关可以处理多个消息连接和智能体。如果你需要更强的隔离或冗余（例如救援机器人），请使用隔离的配置文件/端口运行单独的 Gateway 网关。

## 最佳推荐设置

对大多数用户来说，最简单的救援机器人设置是：

- 将主机器人保留在默认配置文件上
- 在 `--profile rescue` 上运行救援机器人
- 为救援账号使用一个完全独立的 Telegram bot
- 将救援机器人保持在不同的基础端口上，例如 `19789`

这会让救援机器人与主机器人隔离，因此当主机器人宕机时，它可以调试或应用配置更改。基础端口之间至少留出 20 个端口，这样派生的浏览器/canvas/CDP 端口就不会冲突。

## 救援机器人快速开始

除非你有充分理由采用其他做法，否则请将此作为默认路径：

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主机器人已经在运行，通常这就是你需要做的全部。

在 `openclaw --profile rescue onboard` 期间：

- 使用单独的 Telegram bot token
- 保持使用 `rescue` 配置文件
- 使用比主机器人至少高 20 的基础端口
- 接受默认救援工作区，除非你已经自行管理了一个工作区

如果新手引导已经为你安装了救援服务，则不需要最后的 `gateway install`。

## 为什么这有效

救援机器人保持独立，因为它拥有自己的：

- 配置文件/配置
- 状态目录
- 工作区
- 基础端口（以及派生端口）
- Telegram bot token

对大多数设置来说，请为救援配置文件使用一个完全独立的 Telegram bot：

- 易于保持仅操作员可用
- 单独的 bot token 和身份
- 独立于主机器人的渠道/应用安装
- 当主机器人损坏时，提供简单的基于私信的恢复路径

## `--profile rescue onboard` 会更改什么

`openclaw --profile rescue onboard` 使用正常的新手引导流程，但会将所有内容写入单独的配置文件。

实际上，这意味着救援机器人会获得自己的：

- 配置文件
- 状态目录
- 工作区（默认为 `~/.openclaw/workspace-rescue`）
- 托管服务名称

除此之外，提示与正常新手引导相同。

## 通用多 Gateway 网关设置

上面的救援机器人布局是最简单的默认方式，但相同的隔离模式也适用于同一主机上的任意一对或一组 Gateway 网关。

对于更通用的设置，请为每个额外的 Gateway 网关指定自己的命名配置文件和基础端口：

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果你希望两个 Gateway 网关都使用命名配置文件，也可以这样做：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服务遵循相同模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

当你需要一个备用操作员通道时，请使用救援机器人快速开始。当你需要为不同渠道、租户、工作区或运维角色运行多个长期存在的 Gateway 网关时，请使用通用配置文件模式。

## 隔离检查清单

保持每个 Gateway 网关实例的这些项唯一：

- `OPENCLAW_CONFIG_PATH` — 每实例配置文件
- `OPENCLAW_STATE_DIR` — 每实例会话、凭证、缓存
- `agents.defaults.workspace` — 每实例工作区根目录
- `gateway.port`（或 `--port`）— 每实例唯一
- 派生的浏览器/canvas/CDP 端口

如果这些项被共享，你会遇到配置竞态和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅 local loopback）
- canvas 主机由 Gateway 网关 HTTP 服务器提供服务（与 `gateway.port` 相同端口）
- 浏览器配置文件 CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖其中任何一项，必须保持它们在每个实例中唯一。

## 浏览器/CDP 说明（常见踩坑）

- **不要**在多个实例上将 `browser.cdpUrl` 固定为相同值。
- 每个实例都需要自己的浏览器控制端口和 CDP 范围（从其 Gateway 网关端口派生）。
- 如果需要显式 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：使用 `browser.profiles.<name>.cdpUrl`（按配置文件、按实例）。

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

解读：

- `gateway status --deep` 有助于发现旧安装中遗留的 launchd/systemd/schtasks 服务。
- 只有当你有意运行多个隔离的 Gateway 网关，或 OpenClaw 无法证明可达探测目标是同一个 Gateway 网关时，才预期会出现 `gateway probe` 警告文本，例如 `multiple reachable gateway identities detected`。指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或配置的远程 URL，都是一个带有多个传输方式的 Gateway 网关，即使传输端口不同也是如此。

## 相关

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关锁](/zh-CN/gateway/gateway-lock)
- [配置](/zh-CN/gateway/configuration)
