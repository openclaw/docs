---
read_when:
    - 你需要登录网站以进行浏览器自动化
    - 你想在 X/Twitter 上发布更新
summary: 用于浏览器自动化 + X/Twitter 发布的手动登录
title: 浏览器登录
x-i18n:
    generated_at: "2026-05-06T01:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## 手动登录（推荐）

当网站要求登录时，请在**主机**浏览器配置文件（OpenClaw 浏览器）中**手动登录**。

**不要**把你的凭证交给模型。自动登录通常会触发反机器人防护机制，并可能锁定账户。

返回主浏览器文档：[浏览器](/zh-CN/tools/browser)。

## 使用哪个 Chrome 配置文件？

OpenClaw 控制一个**专用 Chrome 配置文件**（名为 `openclaw`，橙色调 UI）。这与你日常使用的浏览器配置文件分离。

对于智能体浏览器工具调用：

- 默认选择：智能体应使用其隔离的 `openclaw` 浏览器。
- 仅当现有已登录会话很重要，并且用户就在电脑前可以点击/批准任何附加提示时，才使用 `profile="user"`。
- 如果你有多个用户浏览器配置文件，请显式指定配置文件，而不是猜测。

访问它有两种简单方式：

1. **让智能体打开浏览器**，然后你自己登录。
2. **通过 CLI 打开它**：

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果你有多个配置文件，请传入 `--browser-profile <name>`（默认值为 `openclaw`）。

## X/Twitter：推荐流程

- **阅读/搜索/帖子串：**使用**主机**浏览器（手动登录）。
- **发布更新：**使用**主机**浏览器（手动登录）。

## 沙箱隔离 + 主机浏览器访问

沙箱隔离的浏览器会话**更有可能**触发机器人检测。对于 X/Twitter（以及其他严格的网站），优先使用**主机**浏览器。

如果智能体已沙箱隔离，浏览器工具默认使用沙箱。要允许主机控制：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

然后将目标设为主机浏览器：

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或者为发布更新的智能体禁用沙箱隔离。

## 相关

- [浏览器](/zh-CN/tools/browser)
- [浏览器 Linux 故障排除](/zh-CN/tools/browser-linux-troubleshooting)
- [浏览器 WSL2 故障排除](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
