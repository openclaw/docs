---
read_when:
    - 你想要一个支持二维码登录的个人 Zalo 助手机器人
    - 你正在安装或排查 openclaw-zaloclawbot 渠道插件的问题
summary: 通过外部 openclaw-zaloclawbot 插件设置 Zalo ClawBot 渠道
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-05T11:04:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw 通过目录列出的外部 `@zalo-platforms/openclaw-zaloclawbot` 插件连接到 Zalo ClawBot。登录使用 Zalo Mini App 二维码；配置中的插件 ID 是 `openclaw-zaloclawbot`。

## 兼容性

| 插件版本 | OpenClaw 版本 | npm dist-tag | 状态        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.4          | >=2026.4.10      | `latest`     | 活跃 / Beta |

## 前置条件

- Node.js >= 22
- 已安装 [OpenClaw](https://docs.openclaw.ai/install)（`openclaw` CLI 可用）
- 移动设备上的 Zalo 账号，用于扫描登录二维码

## 使用 onboard 安装（推荐）

```bash
openclaw onboard
```

从渠道菜单中选择 **Zalo ClawBot**。向导会从官方目录安装插件（经过完整性验证），在终端中渲染登录二维码，并在你使用 Zalo 应用扫描后完成渠道设置。

## 手动安装

要将该渠道添加到已完成新手引导的 Gateway 网关：

### 1. 安装插件

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

使用精确固定的版本，这样 OpenClaw 会在安装期间根据目录完整性哈希验证该包。

### 2. 在配置中启用插件

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. 生成二维码并登录

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

使用 Zalo 移动应用扫描终端渲染的二维码，在 Zalo Mini App 内接受使用条款，并授权会话。

### 4. 重启 Gateway 网关

```bash
openclaw gateway restart
```

## 工作原理

标准 Zalo 渠道需要注册你自己的 Zalo Official Account（OA）并配置静态开发者凭证；与之不同，Zalo ClawBot 是共享官方基础设施上的**绑定所有者的个人助手**：

1. **新手引导：**二维码会解析到一个 Zalo Mini App，它会在共享官方 OA 下预置一个新的私有 Bot，并直接绑定到你的 Zalo 用户 ID。
2. **绑定所有者的隐私：**该 Bot 只与其所有者通信。来自其他用户的消息会在平台层被丢弃。
3. **官方 API 路径：**该插件使用 Zalo Bot Platform API，而不是浏览器或 Web 会话自动化。

## 底层机制

该插件通过持久长轮询循环（`getUpdates`）与 Zalo 通信。对于本地桌面/终端 Gateway 网关运行，Webhooks 默认禁用。消息在客户端处理，并映射到你的本地 Agent Runtimes。

该插件在 OpenClaw 状态目录下管理 Bot 凭证。请将该目录视为敏感目录，并将其纳入与其余 OpenClaw 状态相同的访问控制和备份策略。

该插件的运行时完全位于外部 `@zalo-platforms/openclaw-zaloclawbot` 包中；下方安装/配置之外的行为细节来自插件维护者报告，尚未根据 OpenClaw 核心源代码验证。

## 故障排查

- **二维码登录超时：**出于安全原因，登录令牌（`zbsk`）会在 5 分钟后过期。如果二维码在你扫描之前过期，请重新运行登录命令以生成新的二维码。
- **Gateway 网关加载失败：**确认你的 OpenClaw 主机版本为 `2026.4.10` 或更高。旧版本不支持此 ID 所需的外部 npm 插件安装台账。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有支持的渠道
- [Zalo](/zh-CN/channels/zalo) - 内置的 Zalo Bot Creator / Marketplace 渠道
- [配对](/zh-CN/channels/pairing) - 私信认证和配对流程
- [插件](/zh-CN/tools/plugin) - 安装和管理插件
