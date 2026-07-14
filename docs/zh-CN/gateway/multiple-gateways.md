---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 每个 Gateway 网关都需要独立的配置、状态和端口
summary: 在一台主机上运行多个 OpenClaw Gateway 网关（隔离、端口和配置文件）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-07-14T13:40:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

大多数设置只需要一个 Gateway 网关——单个 Gateway 网关即可处理多个消息连接和智能体。仅当需要更强的隔离或冗余时（例如救援机器人），才应使用相互隔离的配置文件/端口运行多个独立的 Gateway 网关。

## 救援机器人快速开始

最简单的救援机器人设置：

- 让主机器人继续使用默认配置文件。
- 使用 `--profile rescue` 运行救援机器人，并为其配置独立的 Telegram Bot 令牌。
- 为救援机器人使用不同的基础端口，例如 `19789`。

这样，即使主机器人停机，救援机器人仍可调试或应用配置更改。基础端口之间至少应间隔 20 个端口，以免派生的浏览器/CDP 端口发生冲突。

```bash
# 救援机器人（独立的 Telegram 机器人、独立的配置文件、端口 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果主机器人已在运行，通常只需执行以上操作。如果新手引导已安装救援服务，请跳过最后的 `gateway install`。

在 `openclaw --profile rescue onboard` 期间：

- 使用专供救援账户的独立 Telegram Bot 令牌（便于仅限操作员使用，不依赖主机器人的渠道/应用安装，并可提供简单的私信恢复路径）。
- 保留 `rescue` 配置文件名称。
- 使用至少比主机器人高 20 的基础端口。
- 除非你已自行管理救援工作区，否则接受默认的救援工作区。

### `--profile rescue onboard` 会更改什么

`--profile rescue onboard` 会运行常规新手引导流程，但将所有内容写入独立的配置文件，因此救援机器人会拥有自己的：

- 配置文件/配置
- 状态目录
- 工作区（默认：`~/.openclaw/workspace-rescue`）
- 托管服务名称
- 基础端口（以及派生端口）
- Telegram Bot 令牌

除此之外，提示与常规新手引导完全相同。

## 常规多 Gateway 网关设置

同样的隔离模式适用于同一主机上的任意一对或一组 Gateway 网关——为每个额外的 Gateway 网关分配独立的命名配置文件和基础端口：

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

服务也遵循相同的模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

将救援机器人快速开始用于备用操作员通道；将常规配置文件模式用于跨不同渠道、租户、工作区或运维角色运行多个长期存在的 Gateway 网关。

## 隔离检查清单

确保每个 Gateway 网关实例的以下设置均不相同：

| 设置                         | 用途                                 |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | 每个实例的配置文件                   |
| `OPENCLAW_STATE_DIR`         | 每个实例的会话、凭据和缓存           |
| `agents.defaults.workspace`  | 每个实例的工作区根目录               |
| `gateway.port`（或 `--port`） | 每个实例必须唯一                     |
| 派生的浏览器/CDP 端口       | 见下文                               |

共享其中任何一项都会导致配置、状态或端口冲突。即使
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` 跳过按配置实施的单实例限制，Gateway 网关启动流程
仍会强制要求状态目录的所有权唯一。

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅限环回地址）。
- Canvas 主机由 Gateway 网关 HTTP 服务器本身提供服务（端口与 `gateway.port` 相同）。
- 浏览器配置文件的 CDP 端口会从 `browser control port + 9` 到 `+ 108` 自动分配。

如果在配置或环境变量中覆盖其中任何设置，必须确保各实例使用不同的值。

## 浏览器/CDP 注意事项（常见陷阱）

- **不要**将多个实例的 `browser.cdpUrl` 固定为相同的值。
- 每个实例都需要自己的浏览器控制端口和 CDP 范围（从其 Gateway 网关端口派生）。
- 如需使用显式 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 如需使用远程 Chrome，请使用 `browser.profiles.<name>.cdpUrl`（每个配置文件、每个实例分别设置）。

## 手动设置环境变量示例

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

- `gateway status --deep` 可检测旧版安装遗留的 launchd/systemd/schtasks 服务。
- 仅当你有意运行多个相互隔离的 Gateway 网关，或 OpenClaw 无法确认可访问的探测目标属于同一个 Gateway 网关时，才应出现类似 `multiple reachable gateway identities detected` 的 `gateway probe` 警告文本。指向同一个 Gateway 网关的 SSH 隧道、代理 URL 或已配置的远程 URL，仍是一个使用多种传输方式的 Gateway 网关，即使传输端口不同也是如此。

## 相关内容

- [Gateway 网关运行手册](/zh-CN/gateway)
- [Gateway 网关锁](/zh-CN/gateway/gateway-lock)
- [配置](/zh-CN/gateway/configuration)
