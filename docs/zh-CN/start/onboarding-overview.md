---
read_when:
    - 选择新手引导路径
    - 设置新环境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引导选项和流程概览
title: 新手引导概览
x-i18n:
    generated_at: "2026-07-12T14:46:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 提供终端和 macOS 应用新手引导。两者都会先建立推理能力：
它们会检测现有的 AI 访问权限，要求完成一次实时补全，然后才启动
Crestodian 来配置其余设置。如果已配置且可访问的 Gateway 网关中，
默认智能体已配置模型，则会跳过新手引导并打开常规智能体 UI。终端流程还提供
完整的经典向导，用于详细设置。

## 我应该使用哪种方式？

|                | CLI 新手引导                           | macOS 应用新手引导               |
| -------------- | -------------------------------------- | -------------------------------- |
| **平台**       | macOS、Linux、Windows（原生或 WSL2）   | 仅限 macOS                       |
| **界面**       | 推理设置，然后进入 Crestodian          | 推理设置，然后进入 Crestodian    |
| **最适合**     | 服务器、无头环境、完全控制             | Mac 桌面端、可视化设置           |
| **自动化**     | 脚本可使用 `--non-interactive`         | 仅限手动                         |
| **命令**       | `openclaw onboard`                     | 启动应用                         |

大多数用户应从 **CLI 新手引导** 开始——它适用于所有平台，并让
你拥有最大的控制权。

## 新手引导配置的内容

引导式推理阶段仅建立以下内容：

1. **模型提供商和身份验证** — 检测到的访问权限或已验证的 API key
2. **已验证的推理** — 使用默认智能体的实际生效
   模型进行一次真实补全

该补全通过后，Crestodian 可以配置工作区、Gateway 网关、
Gateway 网关服务、渠道、智能体、插件和其他可选功能。

经典 CLI 向导还可以配置：

1. **渠道**（可选）— 内置和内置提供的聊天渠道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
2. **高级 Gateway 网关控制** — 远程模式、网络设置和守护进程选项

## CLI 新手引导

在任意终端中运行：

```bash
openclaw onboard
```

引导流程会检测现有的 AI 访问权限，按顺序进行实时测试，
失败时继续尝试下一候选项，并提供掩码显示的手动密钥输入。只有在补全通过后，它才会保存
模型和凭据，然后启动 Crestodian
来配置工作区、Gateway 网关、渠道、智能体、插件和其他
可选功能。推理之前不会启动 Crestodian，也没有跳过 AI 的路径或
流程内的经典向导切换。若要改用经典向导，请退出并运行
`openclaw onboard --classic`。

推理通过后，Crestodian 可以将渠道设置交给一个采用掩码输入的终端
向导。它不会打开引导式或经典提供商设置；若要更改模型提供商或其身份验证，请退出 Crestodian 并
运行 `openclaw onboard`。

使用 `openclaw onboard --classic` 进行详细的模型/身份验证、渠道、技能、
远程 Gateway 网关或导入设置。添加 `--install-daemon` 还会选择
经典流程，并一步安装后台服务。使用 `openclaw
crestodian` 进行对话式非推理设置和修复。`openclaw
onboard --modern` 是一个兼容性别名，使用相同的实时推理
门控。

完整参考：[新手引导（CLI）](/zh-CN/start/wizard)
CLI 命令文档：[`openclaw onboard`](/zh-CN/cli/onboard)

## macOS 应用新手引导

打开 OpenClaw 应用。如果其配置的本地或远程 Gateway 网关可访问，
且默认智能体已经配置模型，应用会跳过新手引导
和 Crestodian，并立即打开常规智能体 UI。

对于全新或配置不完整的 Gateway 网关，首次运行流程会检测现有的 AI
访问权限（Claude Code、Codex 或 API key），实时测试最佳
选项，并且只在收到真实回复后才保存——测试失败时会自动回退，
如果未找到任何选项，则提供经过验证的手动 API key 步骤。敏感
凭据使用掩码输入。推理通过后，Crestodian 会启动并
帮助配置其余内容。

设置完成后，Gemini CLI 仍可供常规智能体使用，但不会
用于此推理门控，因为它无法强制执行无工具探测。

完整参考：[新手引导（macOS 应用）](/zh-CN/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未列出，请运行 `openclaw onboard --classic`，选择
**自定义提供商**，然后输入：

- 端点兼容性：兼容 OpenAI（`/chat/completions`）、兼容 OpenAI Responses（`/responses`）、兼容 Anthropic（`/messages`）或未知（探测全部三种并自动检测）
- 基础 URL 和 API key（如果端点不需要，则 API key 可选）
- 模型 ID 和可选的模型别名

可以同时使用多个自定义端点——每个端点都有自己的端点 ID。

## 相关内容

- [入门指南](/zh-CN/start/getting-started)
- [CLI 设置参考](/zh-CN/start/wizard-cli-reference)
