---
read_when:
    - 你想在 OpenClaw 中使用 Zalo Personal（非官方）支持
    - 你正在配置或开发 zalouser 插件
summary: Zalo Personal 插件：通过原生 zca-js 进行二维码登录和消息收发（插件安装 + 频道配置 + 工具）
title: Zalo Personal 插件
x-i18n:
    generated_at: "2026-07-05T11:35:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

通过一个使用原生 `zca-js` 自动化普通 Zalo 用户账号的插件，为 OpenClaw 提供 Zalo Personal 支持。不需要外部 `zca`/`openzca` CLI 二进制文件。

<Warning>
非官方自动化可能导致账号被暂停或封禁。使用风险由你自行承担。
</Warning>

## 命名

频道 id 是 `zalouser`，用于明确表示它自动化的是 **Zalo 个人用户账号**（非官方）。单独的 `zalo` 频道 id 是官方内置的 Zalo Bot/webhook 集成 - 参见 [Zalo](/zh-CN/channels/zalo)。

## 运行位置

此插件运行在 **Gateway 网关进程内**。对于远程 Gateway 网关，请在该主机上安装/配置它，然后重启 Gateway 网关。

## 安装

### 从 npm 安装

```bash
openclaw plugins install @openclaw/zalouser
```

使用裸包名可跟随当前官方发布标签；只有在需要可复现安装时，才固定精确版本。之后重启 Gateway 网关。

### 从本地文件夹安装（开发）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之后重启 Gateway 网关。

## 配置

频道配置位于 `channels.zalouser` 下（不是 `plugins.entries.*`）：

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

有关私信/群组访问控制、多账号设置、环境变量和故障排查，请参见 [Zalo 个人渠道配置](/zh-CN/channels/zalouser)。

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Agent 工具

工具名称：`zalouser`

操作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

频道消息操作（不是 Agent 工具）也支持用于消息表情回应的 `react`。

## 相关

- [Zalo 个人渠道配置](/zh-CN/channels/zalouser)
- [Zalo（官方 Bot/webhook 渠道）](/zh-CN/channels/zalo)
- [构建插件](/zh-CN/plugins/building-plugins)
- [ClawHub](/clawhub)
