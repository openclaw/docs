---
read_when:
    - 你想要一个通过二维码登录的个人 Zalo 助手 Bot
    - 你正在安装或排查 openclaw-zaloclawbot 渠道插件的故障
summary: 通过外部 openclaw-zaloclawbot 插件设置 Zalo ClawBot 渠道
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-07-11T20:21:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw 通过目录中列出的外部 `@zalo-platforms/openclaw-zaloclawbot` 插件连接到 Zalo ClawBot。登录使用 Zalo Mini App 二维码；配置中的插件 ID 为 `openclaw-zaloclawbot`。

## 兼容性

| 插件版本 | OpenClaw 版本 | npm dist-tag | 状态          |
| -------- | ------------- | ------------ | ------------- |
| 0.1.4    | >=2026.4.10   | `latest`     | 活跃 / 测试版 |

## 前置条件

- Node.js >= 22
- 已安装 [OpenClaw](https://docs.openclaw.ai/install)（`openclaw` CLI 可用）
- 移动设备上的 Zalo 账号，用于扫描登录二维码

## 使用新手引导安装（推荐）

```bash
openclaw onboard
```

从渠道菜单中选择 **Zalo ClawBot**。向导会从官方目录安装插件（并验证完整性），在终端中显示登录二维码；使用 Zalo 应用扫描后，向导将完成渠道设置。

## 手动安装

要将该渠道添加到已经完成新手引导的 Gateway 网关：

### 1. 安装插件

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

请使用精确锁定的版本，以便 OpenClaw 在安装期间根据目录中的完整性哈希验证软件包。

### 2. 在配置中启用插件

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. 生成二维码并登录

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

使用 Zalo 移动应用扫描终端中显示的二维码，在 Zalo Mini App 内接受使用条款，并授权该会话。

### 4. 重启 Gateway 网关

```bash
openclaw gateway restart
```

## 工作原理

标准 Zalo 渠道要求注册自己的 Zalo Official Account（OA）并配置静态开发者凭据；与之不同，Zalo ClawBot 是运行在共享官方基础设施上的**所有者绑定型个人助理**：

1. **新手引导：**二维码会跳转到 Zalo Mini App，将共享官方 OA 下新配置的私有机器人直接绑定到你的 Zalo 用户 ID。
2. **所有者绑定隐私保护：**机器人只与其所有者通信。其他用户发送的消息会在平台层被丢弃。
3. **官方 API 路径：**该插件使用 Zalo Bot Platform API，而不是浏览器或 Web 会话自动化。

## 底层机制

该插件通过持久化长轮询循环（`getUpdates`）与 Zalo 通信。对于本地桌面端或终端中的 Gateway 网关运行方式，默认禁用 Webhooks。消息在客户端处理，并映射到你的本地智能体运行时。

该插件在 OpenClaw 状态目录下管理机器人凭据。请将该目录视为敏感目录，并对其采用与其他 OpenClaw 状态相同的访问控制和备份策略。

该插件的运行时完全位于外部 `@zalo-platforms/openclaw-zaloclawbot` 软件包中；下文除安装和配置之外的行为细节由插件维护者提供，未经 OpenClaw 核心源代码验证。

## 故障排查

- **二维码登录超时：**出于安全考虑，登录令牌（`zbsk`）会在 5 分钟后过期。如果二维码在扫描前过期，请重新运行登录命令以生成新二维码。
- **Gateway 网关加载失败：**确认 OpenClaw 主机版本为 `2026.4.10` 或更高版本。旧版本不支持此 ID 所需的外部 npm 插件安装记录机制。

## 相关内容

- [渠道概览](/zh-CN/channels) - 所有受支持的渠道
- [Zalo](/zh-CN/channels/zalo) - 内置的 Zalo Bot Creator / Marketplace 渠道
- [配对](/zh-CN/channels/pairing) - 私信身份验证和配对流程
- [插件](/zh-CN/tools/plugin) - 安装和管理插件
