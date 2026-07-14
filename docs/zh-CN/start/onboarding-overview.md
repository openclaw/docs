---
read_when:
    - 选择新手引导路径
    - 设置新环境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引导选项和流程概览
title: 新手引导概览
x-i18n:
    generated_at: "2026-07-14T14:07:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: e045bbbc4516cf2b89d5867978e9d88d83e744da3794748952375496c06f59c3
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 提供终端和 macOS 应用新手引导。两者都会先建立推理能力：
检测现有的 AI 访问权限，要求完成一次实时补全，然后才启动
Crestodian 来配置其余设置。如果已配置且可访问的 Gateway 网关
其默认智能体已经配置了模型，则会跳过新手引导并打开
常规智能体 UI。终端流程还提供完整的经典向导，用于
详细设置。

## 应该使用哪种方式？

|                | CLI 新手引导                           | macOS 应用新手引导               |
| -------------- | -------------------------------------- | -------------------------------- |
| **平台**       | macOS、Linux、Windows（原生或 WSL2）   | 仅 macOS                         |
| **界面**       | 推理设置，然后是 Crestodian            | 推理设置，然后是 Crestodian      |
| **最适合**     | 服务器、无头环境、完全控制             | Mac 桌面设备、可视化设置         |
| **自动化**     | 用于脚本的 `--non-interactive`          | 仅限手动                         |
| **命令**       | `openclaw onboard`                     | 启动应用                         |

大多数用户应从 **CLI 新手引导** 开始——它可在所有平台上运行，并为
你提供最充分的控制。

## 新手引导配置的内容

引导式推理阶段仅建立以下内容：

1. **模型提供商和身份验证** — 检测到的访问权限，或经过验证的提供商登录、
   API key 或 token
2. **已验证的推理** — 使用默认智能体的实际生效
   模型完成一次真实补全

补全通过后，Crestodian 可以配置工作区、Gateway 网关、
Gateway 网关服务、渠道、智能体、插件及其他可选功能。

经典 CLI 向导还可以配置：

1. **渠道**（可选）— 内置和捆绑的聊天渠道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
2. **高级 Gateway 网关控制** — 远程模式、网络设置和守护进程选项

## CLI 新手引导

在任意终端中运行：

```bash
openclaw onboard
```

引导流程会检测现有的 AI 访问权限，按顺序进行实时测试，
并在失败时继续尝试下一项。如果所有检测均失败，它会首先显示 OpenAI、
Anthropic、xAI (Grok)、Google 和 OpenRouter。**More…** 包含
按提供商分组的其余提供商，第二级菜单中列出区域、套餐以及支持的
浏览器、设备、API key 或 token 方式。只有在补全通过后，它才会保存模型
和凭据，然后启动 Crestodian 来配置工作区、Gateway 网关、渠道、智能体、
插件及其他可选功能。**Skip for now** 会退出而不启动 Crestodian。流程中
不会转接至经典向导；如果要改用经典向导，请退出并运行
`openclaw onboard --classic`。

推理通过后，Crestodian 可以将渠道设置交给使用掩码输入的终端
向导。它不会打开引导式或经典提供商设置；如需更改模型提供商或其
身份验证，请退出 Crestodian 并运行 `openclaw onboard`。

使用 `openclaw onboard --classic` 进行详细的模型/身份验证、渠道、技能、
远程 Gateway 网关或导入设置。添加 `--install-daemon` 还会选择
经典流程，并一步安装后台服务。使用 `openclaw
crestodian` 进行对话式的非推理设置和修复。`openclaw
onboard --modern` 是使用相同实时推理
门槛的兼容性别名。

完整参考：[新手引导（CLI）](/zh-CN/start/wizard)
CLI 命令文档：[`openclaw onboard`](/zh-CN/cli/onboard)

## macOS 应用新手引导

打开 OpenClaw 应用。如果其配置的本地或远程 Gateway 网关可访问，
并且默认智能体已配置模型，应用会跳过新手引导和
Crestodian，立即打开常规智能体 UI。

对于全新或未完整配置的 Gateway 网关，首次运行流程会检测现有的 AI
访问权限（Claude Code、Codex 或 API key），实时测试最佳
选项，并且仅在收到真实回复后才保存；如果失败，它会自动回退，
在未发现任何选项时提供经过验证的手动 API key 步骤。敏感
凭据使用掩码输入。推理通过后，Crestodian 会启动并
协助配置其余内容。

设置完成后，Gemini CLI 仍可供常规智能体使用，但不会
用于此推理门槛，因为它无法强制执行无工具探测。

完整参考：[新手引导（macOS 应用）](/zh-CN/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未列出，请运行 `openclaw onboard --classic`，选择
**Custom Provider**，然后输入：

- 端点兼容性：OpenAI 兼容（`/chat/completions`）、OpenAI Responses 兼容（`/responses`）、Anthropic 兼容（`/messages`）或未知（探测全部三种并自动检测）
- Base URL 和 API key（如果端点不要求 API key，则可不填写）
- 模型 ID 和可选的模型别名

多个自定义端点可以共存——每个端点都有自己的端点 ID。

## 相关内容

- [入门指南](/zh-CN/start/getting-started)
- [CLI 设置参考](/zh-CN/start/wizard-cli-reference)
