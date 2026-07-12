---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 每个 Gateway 网关都需要隔离的配置、状态和端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置文件）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-07-11T20:33:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

大多数设置只需要一个 Gateway 网关——单个 Gateway 网关可处理多个消息连接和智能体。只有在需要更强的隔离或冗余时（例如救援 Bot），才使用相互隔离的配置文件和端口运行多个独立的 Gateway 网关。

## 救援 Bot 快速开始

最简单的救援 Bot 设置：

- 主 Bot 继续使用默认配置文件。
- 使用 `--profile rescue` 运行救援 Bot，并为其配置独立的 Telegram Bot 令牌。
- 为救援 Bot 使用不同的基础端口，例如 `19789`。

这样，即使主 Bot 停机，救援 Bot 仍可调试或应用配置更改。基础端口之间至少应间隔 20 个端口，以免派生的浏览器/CDP 端口发生冲突。

```bash
# 救援 Bot（独立的 Telegram Bot、独立的配置文件、端口 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果主 Bot 已在运行，通常只需完成这些操作。如果新手引导已安装救援服务，请跳过最后的 `gateway install`。

执行 `openclaw --profile rescue onboard` 时：

- 使用独立的 Telegram Bot 令牌，专用于救援账号（便于限制为仅操作员使用，与主 Bot 的渠道/应用安装相互独立，并提供简单的私信恢复路径）。
- 保留 `rescue` 配置文件名称。
- 使用至少比主 Bot 高 20 的基础端口。
- 除非你已经自行管理工作区，否则接受默认的救援工作区。

### `--profile rescue onboard` 会更改什么

`--profile rescue onboard` 会运行常规新手引导流程，但将所有内容写入独立的配置文件，因此救援 Bot 会拥有自己的：

- 配置文件/配置文件
- 状态目录
- 工作区（默认：`~/.openclaw/workspace-rescue`）
- 托管服务名称
- 基础端口（以及派生端口）
- Telegram Bot 令牌

除此之外，提示与常规新手引导完全相同。

## 常规多 Gateway 网关设置

同样的隔离模式适用于在一台主机上运行任意两个或多个 Gateway 网关——为每个额外的 Gateway 网关分配独立的命名配置文件和基础端口：

```bash
# 主实例（默认配置文件）
openclaw setup
openclaw gateway --port 18789

# 额外的 Gateway 网关
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

两侧都使用命名配置文件也可以：

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

如需备用操作员通道，请使用救援 Bot 快速开始；如需跨不同渠道、租户、工作区或运维角色运行多个长期存在的 Gateway 网关，请使用常规配置文件模式。

## 隔离检查清单

每个 Gateway 网关实例的以下设置必须保持唯一：

| 设置                         | 用途                                   |
| ---------------------------- | -------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | 每个实例独立的配置文件                 |
| `OPENCLAW_STATE_DIR`         | 每个实例独立的会话、凭据和缓存         |
| `agents.defaults.workspace`  | 每个实例独立的工作区根目录             |
| `gateway.port`（或 `--port`） | 每个实例使用唯一端口                   |
| 派生的浏览器/CDP 端口        | 见下文                                 |

共享其中任何一项都会导致配置竞态和端口冲突。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅限环回接口）。
- Canvas 主机由 Gateway 网关 HTTP 服务器本身提供服务（与 `gateway.port` 使用相同端口）。
- 浏览器配置文件的 CDP 端口会从“浏览器控制端口 + 9”到“+ 108”的范围内自动分配。

如果在配置或环境变量中覆盖其中任何设置，必须确保每个实例使用的值都不相同。

## 浏览器/CDP 注意事项（常见陷阱）

- **不要**将多个实例的 `browser.cdpUrl` 固定为同一个值。
- 每个实例都需要自己的浏览器控制端口和 CDP 范围（根据其 Gateway 网关端口派生）。
- 如需显式指定 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 如需使用远程 Chrome，请使用 `browser.profiles.<name>.cdpUrl`（每个配置文件、每个实例分别设置）。

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

- `gateway status --deep` 可检测旧安装遗留的 launchd/systemd/schtasks 服务。
- 只有在你有意运行多个相互隔离的 Gateway 网关，或 OpenClaw 无法证明可访问的探测目标属于同一 Gateway 网关时，`gateway probe` 中类似 `multiple reachable gateway identities detected` 的警告文本才是预期行为。指向同一 Gateway 网关的 SSH 隧道、代理 URL 或已配置的远程 URL，表示一个 Gateway 网关使用多个传输方式，即使各传输方式的端口不同也是如此。

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关锁](/zh-CN/gateway/gateway-lock)
- [配置](/zh-CN/gateway/configuration)
