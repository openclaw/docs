---
read_when:
    - 在同一台机器上运行多个 Gateway 网关
    - 你需要为每个 Gateway 网关隔离配置/状态/端口
summary: 在同一主机上运行多个 OpenClaw Gateway 网关（隔离、端口和 profiles）
title: 多个 Gateway 网关
x-i18n:
    generated_at: "2026-04-05T08:23:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 061f204bf56b28c6bd0e2c9aee6c561a8a162ca219060117fea4d3a007f01899
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# 多个 Gateway 网关（同一主机）

大多数设置应使用一个 Gateway 网关，因为单个 Gateway 网关可以处理多个消息连接和智能体。如果你需要更强的隔离或冗余（例如一个救援机器人），请使用隔离的 profiles/端口运行独立的 Gateway 网关。

## 隔离检查清单（必需）

- `OPENCLAW_CONFIG_PATH` — 每个实例单独的配置文件
- `OPENCLAW_STATE_DIR` — 每个实例单独的会话、凭证、缓存
- `agents.defaults.workspace` — 每个实例单独的工作区根目录
- `gateway.port`（或 `--port`）— 每个实例唯一
- 派生端口（browser/canvas）不得重叠

如果这些内容被共享，你将遇到配置竞争和端口冲突。

## 推荐方式：profiles（`--profile`）

Profiles 会自动限定 `OPENCLAW_STATE_DIR` 和 `OPENCLAW_CONFIG_PATH`，并为服务名添加后缀。

```bash
# main
openclaw --profile main setup
openclaw --profile main gateway --port 18789

# rescue
openclaw --profile rescue setup
openclaw --profile rescue gateway --port 19001
```

按 profile 划分的服务：

```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

## 救援机器人指南

在同一主机上运行第二个 Gateway 网关，并为其单独设置：

- profile/配置
- 状态目录
- 工作区
- 基础端口（以及派生端口）

这样可以将救援机器人与主机器人隔离开，使其在主机器人宕机时仍可用于调试或应用配置更改。

端口间隔：基础端口之间至少保留 20 个端口的间距，这样派生的 browser/canvas/CDP 端口就不会发生冲突。

### 如何安装（救援机器人）

```bash
# Main bot（现有或全新，不带 --profile 参数）
# 运行在端口 18789 + Chrome CDC/Canvas/... 端口
openclaw onboard
openclaw gateway install

# Rescue bot（隔离的 profile + 端口）
openclaw --profile rescue onboard
# 说明：
# - 默认情况下，workspace 名称会自动追加 -rescue 后缀
# - 端口应至少比 18789 大 20 个端口，
#   更推荐选择完全不同的基础端口，例如 19789，
# - 其余新手引导步骤与正常情况相同

# 安装服务（如果 setup 期间未自动完成）
openclaw --profile rescue gateway install
```

## 端口映射（派生）

基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 浏览器控制服务端口 = 基础端口 + 2（仅限 loopback）
- canvas 主机由 Gateway 网关 HTTP 服务器提供服务（与 `gateway.port` 使用相同端口）
- Browser profile 的 CDP 端口会从 `browser.controlPort + 9 .. + 108` 自动分配

如果你在配置或环境变量中覆盖了这些值，必须确保它们在每个实例之间保持唯一。

## Browser/CDP 说明（常见陷阱）

- **不要**在多个实例上将 `browser.cdpUrl` 固定为相同的值。
- 每个实例都需要自己独立的浏览器控制端口和 CDP 范围（从其 gateway 端口派生）。
- 如果你需要显式指定 CDP 端口，请为每个实例设置 `browser.profiles.<name>.cdpPort`。
- 远程 Chrome：请使用 `browser.profiles.<name>.cdpUrl`（按 profile、按实例设置）。

## 手动环境变量示例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw-main \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19001
```

## 快速检查

```bash
openclaw --profile main gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw --profile main status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

解释：

- `gateway status --deep` 有助于发现旧安装遗留下来的 launchd/systemd/schtasks 服务。
- 类似 `multiple reachable gateways detected` 这样的 `gateway probe` 警告文本，只有在你有意运行多个隔离 Gateway 网关时才是正常现象。
