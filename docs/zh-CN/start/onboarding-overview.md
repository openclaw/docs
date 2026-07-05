---
read_when:
    - 选择新手引导路径
    - 设置新环境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引导选项和流程概览
title: 新手引导概览
x-i18n:
    generated_at: "2026-07-05T11:42:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62fdb7768aff55620c6195b8017dd95baa1ef393b03e39e5a07b1a9b9e6ef5a4
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 有两条新手引导路径。两者都会配置凭证、Gateway 网关和
可选聊天渠道——区别只在于你如何与设置流程交互。

## 我应该使用哪条路径？

|                | CLI 新手引导                         | macOS 应用新手引导        |
| -------------- | -------------------------------------- | --------------------------- |
| **平台**  | macOS、Linux、Windows（原生或 WSL2） | 仅 macOS                  |
| **界面**  | 终端向导                        | 引导式 UI + Crestodian 聊天 |
| **最适合**   | 服务器、无头环境、完全控制        | 桌面 Mac、可视化设置   |
| **自动化** | 脚本可使用 `--non-interactive`        | 仅手动                 |
| **命令**    | `openclaw onboard`                     | 启动应用              |

大多数用户应从 **CLI 新手引导** 开始——它适用于所有环境，并给予
你最多控制权。

## 新手引导会配置什么

无论你选择哪条路径，新手引导都会设置：

1. **模型提供商和凭证**——所选提供商的 API key、OAuth 或设置令牌
2. **工作区**——用于智能体文件、引导模板和记忆的目录
3. **Gateway 网关**——端口、绑定地址、凭证模式
4. **渠道**（可选）——内置和捆绑的聊天渠道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **守护进程**（可选）——后台服务，让 Gateway 网关自动启动

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
然后打开一个 Crestodian 对话，用于检测现有 AI 访问权限，提出
工作区和配置方案，并在批准后应用该方案。敏感
凭据使用遮罩输入。远程设置则会连接到已配置的
Gateway 网关。

完整参考：[新手引导（macOS 应用）](/zh-CN/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未在新手引导中列出，请选择 **自定义提供商** 并
输入：

- 端点兼容性：OpenAI 兼容（`/chat/completions`）、OpenAI Responses 兼容（`/responses`）、Anthropic 兼容（`/messages`）或未知（探测全部三种并自动检测）
- Base URL 和 API key（如果端点不需要，API key 是可选的）
- 模型 ID 和可选模型别名

多个自定义端点可以共存——每个端点都有自己的端点 ID。

## 相关内容

- [入门指南](/zh-CN/start/getting-started)
- [CLI 设置参考](/zh-CN/start/wizard-cli-reference)
