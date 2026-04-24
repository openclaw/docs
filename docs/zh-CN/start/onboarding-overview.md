---
read_when:
    - 选择新手引导路径时
    - 设置新环境时
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引导选项与流程概览
title: 新手引导概览
x-i18n:
    generated_at: "2026-04-24T04:08:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw 有两种新手引导路径。两者都会配置 auth、Gateway 网关和可选聊天渠道——区别只在于你如何与设置流程交互。

## 我该使用哪条路径？

| | CLI 新手引导 | macOS 应用新手引导 |
| -------------- | -------------------------------------- | ------------------------- |
| **平台** | macOS、Linux、Windows（原生或 WSL2） | 仅 macOS |
| **界面** | 终端向导 | 应用内引导式 UI |
| **最适合** | 服务器、无头环境、完全控制 | 桌面 Mac、可视化设置 |
| **自动化** | 可通过 `--non-interactive` 用于脚本 | 仅手动 |
| **命令** | `openclaw onboard` | 启动应用 |

大多数用户都应从 **CLI 新手引导** 开始——它适用于所有环境，并且给你最大的控制权。

## 新手引导会配置什么

无论你选择哪条路径，新手引导都会设置：

1. **模型提供商和 auth** —— 为你选择的提供商配置 API key、OAuth 或设置 token
2. **工作区** —— 用于智能体文件、引导模板和记忆的目录
3. **Gateway 网关** —— 端口、bind 地址、auth 模式
4. **渠道**（可选）—— 内置和内置打包的聊天渠道，例如
   BlueBubbles、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **守护进程**（可选）—— 后台服务，以便 Gateway 网关自动启动

## CLI 新手引导

在任意终端中运行：

```bash
openclaw onboard
```

添加 `--install-daemon` 可一步同时安装后台服务。

完整参考：[设置向导（CLI）](/zh-CN/start/wizard)
CLI 命令文档：[`openclaw onboard`](/zh-CN/cli/onboard)

## macOS 应用新手引导

打开 OpenClaw 应用。首次运行向导会通过可视化界面引导你完成相同步骤。

完整参考：[新手引导（macOS 应用）](/zh-CN/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未在新手引导中列出，请选择 **Custom Provider** 并输入：

- API 兼容模式（OpenAI-compatible、Anthropic-compatible，或 auto-detect）
- Base URL 和 API key
- 模型 ID 和可选别名

多个自定义端点可以共存——每个端点都会拥有自己的 endpoint ID。

## 相关内容

- [入门指南](/zh-CN/start/getting-started)
- [CLI 设置参考](/zh-CN/start/wizard-cli-reference)
