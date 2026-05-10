---
read_when:
    - 选择新手引导路径
    - 设置新环境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引导选项和流程概览
title: 新手引导概览
x-i18n:
    generated_at: "2026-05-10T19:49:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9b375b9090250992b9deead25ae6502592cb63c9774204782b2d4f69d8f3395
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 有两条新手引导路径。两者都会配置凭证、Gateway 网关和
可选聊天渠道，只是你与设置流程交互的方式不同。

## 我应该使用哪条路径？

|                | CLI 新手引导                         | macOS 应用新手引导      |
| -------------- | -------------------------------------- | ------------------------- |
| **平台**  | macOS、Linux、Windows（原生或 WSL2） | 仅 macOS                |
| **界面**  | 终端向导                        | 应用中的引导式 UI      |
| **最适合**   | 服务器、无头环境、完全控制        | 桌面 Mac、可视化设置 |
| **自动化** | 脚本可用 `--non-interactive`        | 仅手动               |
| **命令**    | `openclaw onboard`                     | 启动应用            |

大多数用户应该从 **CLI 新手引导** 开始：它可在任何地方运行，并且给你最多控制权。

## 新手引导会配置什么

无论你选择哪条路径，新手引导都会设置：

1. **模型提供商和凭证** — 所选提供商的 API 密钥、OAuth 或设置令牌
2. **工作区** — 用于智能体文件、引导模板和记忆的目录
3. **Gateway 网关** — 端口、绑定地址、凭证模式
4. **渠道**（可选）— 内置和打包提供的聊天渠道，例如
   iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **守护进程**（可选）— 后台服务，让 Gateway 网关自动启动

## CLI 新手引导

在任意终端中运行：

```bash
openclaw onboard
```

添加 `--install-daemon` 可同时一步安装后台服务。

完整参考：[新手引导（CLI）](/zh-CN/start/wizard)
CLI 命令文档：[`openclaw onboard`](/zh-CN/cli/onboard)

## macOS 应用新手引导

打开 OpenClaw 应用。首次运行向导会通过可视化界面引导你完成相同步骤。

完整参考：[新手引导（macOS 应用）](/zh-CN/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未在新手引导中列出，请选择 **自定义提供商** 并输入：

- API 兼容模式（OpenAI 兼容、Anthropic 兼容或自动检测）
- 基础 URL 和 API 密钥
- 模型 ID 和可选别名

多个自定义端点可以共存，每个端点都会获得自己的端点 ID。

## 相关

- [入门指南](/zh-CN/start/getting-started)
- [CLI 设置参考](/zh-CN/start/wizard-cli-reference)
