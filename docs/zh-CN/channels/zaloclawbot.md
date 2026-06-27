---
read_when:
    - 你想要一个通过二维码登录的个人 Zalo 助手机器人
    - 你正在安装 openclaw-zaloclawbot 渠道插件，或对其进行故障排除
summary: 通过外部 openclaw-zaloclawbot 插件设置 Zalo ClawBot 渠道
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T01:29:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw 通过目录列出的外部 `@zalo-platforms/openclaw-zaloclawbot` 插件连接到 Zalo ClawBot。登录使用 Zalo Mini App 二维码。

## 兼容性

| 插件版本 | OpenClaw 版本 | npm dist-tag | 状态        |
| -------------- | ---------------- | ------------ | ------------- |
| 0.1.x          | >=2026.4.10      | `latest`     | 活跃 / Beta |

## 前提条件

- Node.js **>= 22**
- 必须已安装 [OpenClaw](https://docs.openclaw.ai/install)（`openclaw` CLI 可用）。
- 移动设备上的 Zalo 账号，用于扫描登录二维码。

## 使用 onboard 安装（推荐）

运行 OpenClaw 新手引导向导，并从渠道菜单中选择 **Zalo ClawBot**：

```bash
openclaw onboard
```

该向导会从官方目录安装插件（已验证完整性），直接在终端中渲染登录二维码，并在你用 Zalo 应用扫描后完成渠道设置。不需要额外命令。

## 手动安装

要将该渠道添加到已完成新手引导的 Gateway 网关，请按以下步骤操作：

### 1. 安装插件

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

使用上面显示的精确固定版本（它与官方目录条目匹配），这样 OpenClaw 会在安装期间根据目录完整性哈希验证该包。

### 2. 在配置中启用插件

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. 生成二维码并登录

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

使用 Zalo 移动应用扫描终端渲染的二维码，在 Zalo Mini App 中接受使用条款，并授权会话。

### 4. 重启 Gateway 网关

```bash
openclaw gateway restart
```

---

## 工作原理

与标准的开发者 Zalo 渠道不同，后者要求你注册自己的 Zalo 官方账号（OA）并粘贴静态开发者凭证；Zalo ClawBot 使用共享的官方基础设施，以**绑定所有者的个人助手**形式运行：

1. **安全新手引导：** 二维码会解析到一个安全的 Zalo Mini App，该应用会将共享官方 OA 下新配置的私有 bot 直接绑定到你的 Zalo 用户 ID。
2. **绑定所有者的隐私：** 按设计，bot 只能与其所有者通信。来自其他用户的消息会在平台层被丢弃，使连接保持私密且安全。
3. **官方 API 路径：** 插件使用 Zalo Bot Platform API，而不是浏览器或 Web 会话自动化。

## 内部机制

Zalo ClawBot 插件通过持久的长轮询消息循环与 Zalo API 通信。为了保持运行时干净且轻量：

- 长轮询连接使用 `getUpdates` 端点。
- 对于本地桌面/终端 Gateway 网关运行，默认禁用 webhook。
- 消息在客户端处理，并直接映射到你的本地智能体运行时。

外部插件在 OpenClaw 状态目录下管理 bot 凭证。
请将该目录视为敏感目录，并将其纳入与其他 OpenClaw 状态相同的访问控制和备份策略。

---

## 故障排除

- **二维码登录超时：** 登录令牌（`zbsk`）出于安全原因会在 5 分钟后过期。如果二维码在你扫描前过期，只需重新运行登录命令即可生成新的二维码。
- **Gateway 网关加载失败：** 确保你的 OpenClaw 主机版本为 `2026.4.10` 或更高版本。旧版本不支持外部 npm 插件安装账本。
