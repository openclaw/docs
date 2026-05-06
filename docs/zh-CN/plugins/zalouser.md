---
read_when:
    - 你想要在 OpenClaw 中支持 Zalo Personal（非官方）
    - 你正在配置或开发 zalouser 插件
summary: Zalo Personal 插件：通过原生 zca-js 进行 QR 登录 + 消息收发（插件安装 + 渠道配置 + 工具）
title: Zalo 个人插件
x-i18n:
    generated_at: "2026-05-06T16:11:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

通过插件为 OpenClaw 提供 Zalo Personal 支持，使用原生 `zca-js` 自动化普通 Zalo 用户账号。

<Warning>
非官方自动化可能导致账号被暂停或封禁。使用风险由你自行承担。
</Warning>

## 命名

渠道 id 是 `zalouser`，以明确表示它自动化的是**个人 Zalo 用户账号**（非官方）。我们保留 `zalo`，用于未来可能的官方 Zalo API 集成。

## 运行位置

此插件运行在 **Gateway 网关进程内部**。

如果你使用远程 Gateway 网关，请在**运行 Gateway 网关的机器**上安装/配置它，然后重启 Gateway 网关。

不需要外部 `zca`/`openzca` CLI 二进制文件。

## 安装

### 选项 A：从 npm 安装

```bash
openclaw plugins install @openclaw/zalouser
```

使用裸包名以跟随当前官方发布标签。只有在需要可复现安装时，才固定精确版本。

随后重启 Gateway 网关。

### 选项 B：从本地文件夹安装（开发）

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

随后重启 Gateway 网关。

## 配置

渠道配置位于 `channels.zalouser` 下（不是 `plugins.entries.*`）：

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

动作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

渠道消息动作还支持用于消息回应的 `react`。

## 相关内容

- [构建插件](/zh-CN/plugins/building-plugins)
- [社区插件](/zh-CN/plugins/community)
