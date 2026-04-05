---
read_when:
    - 你希望在 OpenClaw 中使用 Zalo Personal（非官方）支持
    - 你正在配置或开发 zalouser 插件
summary: Zalo Personal 插件：通过原生 `zca-js` 使用二维码登录和消息功能（插件安装 + 渠道配置 + 工具）
title: Zalo Personal 插件
x-i18n:
    generated_at: "2026-04-05T08:41:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal（插件）

通过插件为 OpenClaw 提供 Zalo Personal 支持，使用原生 `zca-js` 自动化一个普通的 Zalo 个人账号。

> **警告：** 非官方自动化可能导致账号被暂停/封禁。请自行承担风险。

## 命名

渠道 id 为 `zalouser`，以明确表示这是在自动化一个**个人 Zalo 用户账号**（非官方）。我们保留 `zalo`，以供未来可能推出的官方 Zalo API 集成使用。

## 运行位置

此插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装并配置它，然后重启 Gateway 网关。

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 安装

### 选项 A：从 npm 安装

```bash
openclaw plugins install @openclaw/zalouser
```

之后重启 Gateway 网关。

### 选项 B：从本地文件夹安装（开发）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之后重启 Gateway 网关。

## 配置

渠道配置位于 `channels.zalouser` 下（而不是 `plugins.entries.*`）：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## 智能体工具

工具名称：`zalouser`

操作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

渠道消息操作还支持用于消息回应的 `react`。
