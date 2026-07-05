---
read_when:
    - 你需要登录网站以进行浏览器自动化
    - 你想将更新发布到 X/Twitter
summary: 浏览器自动化和 X/Twitter 发帖的手动登录
title: 浏览器登录
x-i18n:
    generated_at: "2026-07-05T11:43:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## 手动登录（推荐）

当网站要求登录时，请在宿主浏览器的 `openclaw`
配置文件中手动登录。不要把你的凭据交给模型：自动登录通常会
触发反机器人防护，并可能锁定账号。

在 X/Twitter 和其他对 Bot 敏感的网站上，无论是读取（搜索/帖子串）还是
发布，都请使用宿主浏览器（手动登录）。沙箱隔离的浏览器会话
更容易触发 Bot 检测。

返回主浏览器文档：[浏览器](/zh-CN/tools/browser)。

## 使用哪个 Chrome 配置文件？

OpenClaw 控制一个名为 `openclaw` 的专用 Chrome 配置文件（橙色调
界面），与你的日常浏览器配置文件分开。

对于智能体浏览器工具调用：

- 默认选择：智能体使用其隔离的 `openclaw` 浏览器。
- 仅当现有已登录会话很重要，并且你在电脑前可以点击/批准任何附加提示时，才使用 `profile="user"`。
- 如果你有多个用户浏览器配置文件，请明确指定配置文件，
  而不是猜测。

访问 `openclaw` 配置文件有两种方式：

1. 让智能体打开浏览器，然后你自己登录。
2. 通过 CLI 打开：

```bash
openclaw browser start
openclaw browser open https://x.com
```

对于非默认配置文件，请把 `--browser-profile <name>` 放在
子命令之前（默认是 `openclaw`）：

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## 沙箱隔离：允许访问宿主浏览器

如果智能体被沙箱隔离，它的 `browser` 工具调用默认使用沙箱
浏览器，而不是宿主浏览器。要让智能体改为面向宿主浏览器：

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

CLI 调用始终面向宿主浏览器，绝不面向沙箱，因此无论此设置如何，
你都可以自己打开宿主浏览器：

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

设置 `sandbox.browser.allowHostControl: true` 后，智能体的 `browser`
工具调用也可以面向宿主浏览器。或者，禁用发布更新的
智能体的沙箱隔离。

## 相关内容

- [浏览器](/zh-CN/tools/browser)
- [浏览器 Linux 故障排查](/zh-CN/tools/browser-linux-troubleshooting)
- [浏览器 WSL2 故障排查](/zh-CN/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
