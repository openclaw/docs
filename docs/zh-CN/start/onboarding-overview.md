---
read_when:
    - 选择新手引导路径
    - 设置新环境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引导选项和流程概览
title: 新手引导概览
x-i18n:
    generated_at: "2026-07-05T17:41:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c41a83d23341504ef8c8279530c33a7e9b73c466eb7128775756acd800849e61
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 有两条新手引导路径。两者都会配置凭证、Gateway 网关和
可选聊天渠道，只是你与设置流程交互的方式不同。

## 我应该使用哪条路径？

|                | CLI 新手引导                          | macOS 应用新手引导        |
| -------------- | -------------------------------------- | --------------------------- |
| **平台**  | macOS、Linux、Windows（原生或 WSL2） | 仅 macOS                  |
| **界面**  | 终端向导                        | 引导式 UI + Crestodian 聊天 |
| **最适合**   | 服务器、无头环境、完全控制        | 桌面 Mac、可视化设置   |
| **自动化** | 用于脚本的 `--non-interactive`        | 仅手动                 |
| **命令**    | `openclaw onboard`                     | 启动应用              |

大多数用户应从 **CLI 新手引导** 开始，它适用于所有环境，并能给你
最多控制权。

## 新手引导会配置什么

无论你选择哪条路径，新手引导都会设置：

1. **模型提供商和凭证** — 为你选择的提供商配置 API key、OAuth 或设置令牌
2. **工作区** — 用于智能体文件、引导模板和记忆的目录
3. **Gateway 网关** — 端口、绑定地址、凭证模式
4. **渠道**（可选）— 内置和捆绑的聊天渠道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **守护进程**（可选）— 后台服务，让 Gateway 网关自动启动

## CLI 新手引导

在任意终端中运行：

```bash
openclaw onboard
```

添加 `--install-daemon` 可在同一步中同时安装后台服务。

完整参考：[新手引导（CLI）](/zh-CN/start/wizard)
CLI 命令文档：[`openclaw onboard`](/zh-CN/cli/onboard)

## macOS 应用新手引导

打开 OpenClaw 应用。对于本地设置，首次运行流程会启动 Gateway 网关，
检测现有 AI 访问方式（Claude Code、Codex、Gemini CLI 或 API keys），
实时测试最佳选项，并且只有在收到真实回复后才保存；如果没有找到任何选项，
它会自动回退，并提供经过验证的手动 API-key 步骤。敏感凭证使用掩码输入。
远程设置则会连接到已经配置好的 Gateway 网关，同样的 AI 检查会针对该
Gateway 网关运行。

完整参考：[新手引导（macOS 应用）](/zh-CN/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未在新手引导中列出，请选择 **自定义提供商** 并输入：

- 端点兼容性：OpenAI 兼容（`/chat/completions`）、OpenAI Responses 兼容（`/responses`）、Anthropic 兼容（`/messages`），或未知（探测全部三种并自动检测）
- 基础 URL 和 API key（如果端点不需要，API key 可选）
- 模型 ID 和可选模型别名

多个自定义端点可以共存，每个端点都有自己的端点 ID。

## 相关

- [入门指南](/zh-CN/start/getting-started)
- [CLI 设置参考](/zh-CN/start/wizard-cli-reference)
