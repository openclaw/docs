---
read_when:
    - 你需要登录网站以进行浏览器自动化
    - 你想在 X/Twitter 发布更新
summary: 用于浏览器自动化和在 X/Twitter 发帖的手动登录
title: 浏览器登录
x-i18n:
    generated_at: "2026-04-05T10:10:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# 浏览器登录 + X/Twitter 发帖

## 手动登录（推荐）

当某个网站需要登录时，请在**宿主机**浏览器配置文件（openclaw 浏览器）中**手动登录**。

**不要**把你的凭证交给模型。自动化登录通常会触发反机器人防御，并可能导致账户被锁定。

返回主浏览器文档：[Browser](/zh-CN/tools/browser)。

## 使用的是哪个 Chrome 配置文件？

OpenClaw 控制一个**专用 Chrome 配置文件**（名为 `openclaw`，UI 带橙色色调）。它与你日常使用的浏览器配置文件分开。

对于 agent 浏览器工具调用：

- 默认选择：agent 应使用其隔离的 `openclaw` 浏览器。
- 仅当现有登录会话很重要，且用户就在电脑前可以点击/批准任何附加提示时，才使用 `profile="user"`。
- 如果你有多个用户浏览器配置文件，请显式指定配置文件，而不要猜测。

有两种简单的访问方式：

1. **让 agent 打开浏览器**，然后你自己登录。
2. **通过 CLI 打开它**：

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果你有多个配置文件，请传入 `--browser-profile <name>`（默认是 `openclaw`）。

## X/Twitter：推荐流程

- **阅读/搜索/线程：**使用**宿主机**浏览器（手动登录）。
- **发布更新：**使用**宿主机**浏览器（手动登录）。

## 沙箱隔离 + 宿主机浏览器访问

沙箱隔离的浏览器会话**更容易**触发机器人检测。对于 X/Twitter（以及其他严格的网站），优先使用**宿主机**浏览器。

如果 agent 处于沙箱隔离中，浏览器工具默认会使用沙箱。要允许控制宿主机：

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

然后将目标指向宿主机浏览器：

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或者为发布更新的 agent 禁用沙箱隔离。
