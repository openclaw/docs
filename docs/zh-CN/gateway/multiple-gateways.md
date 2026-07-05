---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 每个 Gateway 网关都需要隔离的配置、状态和端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置文件）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-07-05T11:19:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

大多数设置只需要一个 Gateway 网关：单个 Gateway 网关可以处理多个消息连接和智能体。仅当你需要更强的隔离或冗余时（例如救援机器人），才使用隔离的配置档案/端口运行单独的 Gateway 网关。

## 救援机器人快速开始

最简单的救援机器人设置：

- 将主机器人保留在默认配置档案上。
- 在 `--profile rescue` 上运行救援机器人，并使用它自己的 Telegram 机器人令牌。
- 将救援机器人放在不同的基础端口上，例如 `19789`。

这样，如果主机器人宕机，救援机器人仍然可以调试或应用配置更改。基础端口之间至少保留 20 个端口，以避免派生的浏览器/CDP 端口发生冲突。

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主机器人已经在运行，通常这就是你需要做的全部。如果新手引导已经安装了救援服务，请跳过最后的 `gateway install`。

在 `openclaw --profile rescue onboard` 期间：

- 使用单独的 Telegram 机器人令牌，专用于救援账号（易于保持仅操作员可用，独立于主机器人的渠道/应用安装，并且是简单的基于私信的恢复路径）。
- 保留 `rescue` 配置档案名称。
- 使用比主机器人至少高 20 的基础端口。
- 接受默认救援工作区，除非你已经自行管理了一个。

### `--profile rescue onboard` 会更改什么

`--profile rescue onboard` 会运行正常的新手引导流程，但会将所有内容写入单独的配置档案，因此救援机器人会获得自己的：

- 配置档案/配置文件
- 状态目录
- 工作区（默认：`~/.openclaw/workspace-rescue`）
- 托管服务名称
- 基础端口（以及派生端口）
- Telegram 机器人令牌

除此之外，提示与正常新手引导相同。

## 通用多 Gateway 网关设置

同样的隔离模式适用于同一主机上的任意一对或一组 Gateway 网关：为每个额外 Gateway 网关分配自己的命名配置档案和基础端口：

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

两侧都使用命名配置档案也可以：

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

将救援机器人快速开始用于备用操作员通道；将通用配置档案模式用于跨不同渠道、租户、工作区或运维角色的多个长期运行的 Gateway 网关。

## 隔离检查清单

每个 Gateway 网关实例都要保持这些设置唯一：

| 设置                         | 用途                                 |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | 每实例配置文件                       |
| `OPENCLAW_STATE_DIR`         | 每实例会话、凭证、缓存               |
| `agents.defaults.workspace`  | 每实例工作区根目录                   |
| `gateway.port`（或 `--port`） | 每个实例唯一                         |
| 派生的浏览器/CDP 端口        | 见下文                               |

共享其中任何一项都会导致配置竞争和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅本地回环）。
- Canvas 主机由 Gateway 网关 HTTP 服务器本身提供服务（与 `gateway.port` 相同的端口）。
- 浏览器配置档案 CDP 端口会从 `browser control port + 9` 到 `+ 108` 自动分配。

如果在配置或环境变量中覆盖其中任何一项，你都必须让它们在每个实例中保持唯一。

## 浏览器/CDP 说明（常见陷阱）

- **不要**在多个实例上将 `browser.cdpUrl` 固定为相同值。
- 每个实例都需要自己的浏览器控制端口和 CDP 范围（从其 Gateway 网关端口派生）。
- 对于显式 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 对于远程 Chrome，请使用 `browser.profiles.<name>.cdpUrl`（按配置档案、按实例）。

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

- `gateway status --deep` 会捕获旧安装中遗留的 launchd/systemd/schtasks 服务。
- `gateway probe` 警告文本（例如 `multiple reachable gateway identities detected`）只有在你有意运行多个隔离的 Gateway 网关，或 OpenClaw 无法证明可达探测目标是同一个 Gateway 网关时才是预期情况。指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或配置的远程 URL 属于一个具有多个传输协议的 Gateway 网关，即使传输端口不同也是如此。

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关锁](/zh-CN/gateway/gateway-lock)
- [配置](/zh-CN/gateway/configuration)
