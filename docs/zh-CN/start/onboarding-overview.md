---
read_when:
    - 选择新手引导路径
    - 设置新环境
sidebarTitle: Onboarding Overview
summary: OpenClaw 新手引导选项和流程概览
title: 新手引导概览
x-i18n:
    generated_at: "2026-07-11T20:57:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3460887108dc078c963802a32238133814afcc7d36b27eb4760280328ee070e5
    source_path: start/onboarding-overview.md
    workflow: 16
---

OpenClaw 提供终端和 macOS 应用新手引导。两者都会先建立推理能力：
检测现有的 AI 访问方式，要求完成一次实时补全，然后才启动
Crestodian 来配置其余设置。如果可访问且已配置的 Gateway 网关中，
默认智能体已经配置了模型，则会跳过新手引导并打开常规智能体界面。
终端流程还提供完整的经典向导，用于详细设置。

## 我应该使用哪种方式？

|              | CLI 新手引导                     | macOS 应用新手引导               |
| ------------ | -------------------------------- | -------------------------------- |
| **平台**     | macOS、Linux、Windows（原生或 WSL2） | 仅限 macOS                       |
| **界面**     | 先设置推理，再使用 Crestodian    | 先设置推理，再使用 Crestodian    |
| **最适合**   | 服务器、无头环境、完全控制       | 桌面 Mac、可视化设置             |
| **自动化**   | 脚本可使用 `--non-interactive`   | 仅支持手动操作                   |
| **命令**     | `openclaw onboard`               | 启动应用                         |

大多数用户应从 **CLI 新手引导** 开始——它适用于所有平台，并让你拥有
最大的控制权。

## 新手引导会配置什么

引导式推理阶段仅建立以下内容：

1. **模型提供商和身份验证**——检测到的访问方式或已验证的 API 密钥
2. **已验证的推理**——使用默认智能体的实际生效模型完成一次真实补全

补全通过后，Crestodian 可以配置工作区、Gateway 网关、
Gateway 网关服务、渠道、智能体、插件和其他可选功能。

经典 CLI 向导还可以配置：

1. **渠道**（可选）——内置及随附的聊天渠道，例如
   Discord、Feishu、Google Chat、iMessage、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
2. **高级 Gateway 网关控制**——远程模式、网络设置和守护进程选项

## CLI 新手引导

在任意终端中运行：

```bash
openclaw onboard
```

引导式流程会检测现有的 AI 访问方式，按顺序进行实时测试，
失败时继续尝试下一项，并提供隐藏输入内容的手动密钥输入方式。只有在补全
通过后，它才会保存模型和凭据，然后启动 Crestodian
来配置工作区、Gateway 网关、渠道、智能体、插件和其他
可选功能。推理前不会启动 Crestodian，也没有跳过 AI 的路径或
流程内切换到经典向导的机制。如果你想改用经典向导，请退出并运行
`openclaw onboard --classic`。

推理通过后，Crestodian 可以将渠道设置交给隐藏输入内容的终端
向导。它不会打开引导式或经典提供商设置；如需更改模型提供商或其
身份验证，请退出 Crestodian 并运行 `openclaw onboard`。

使用 `openclaw onboard --classic` 进行详细的模型/身份验证、渠道、Skills、
远程 Gateway 网关或导入设置。添加 `--install-daemon` 也会选择
经典流程，并在一个步骤中安装后台服务。使用 `openclaw
crestodian` 进行对话式的非推理设置和修复。`openclaw
onboard --modern` 是一个兼容性别名，使用相同的实时推理
门控。

完整参考：[新手引导（CLI）](/zh-CN/start/wizard)
CLI 命令文档：[`openclaw onboard`](/zh-CN/cli/onboard)

## macOS 应用新手引导

打开 OpenClaw 应用。如果其已配置的本地或远程 Gateway 网关可访问，
并且默认智能体已经配置了模型，应用会跳过新手引导
和 Crestodian，立即打开常规智能体界面。

对于全新或配置不完整的 Gateway 网关，首次运行流程会检测现有的 AI
访问方式（Claude Code、Codex 或 API 密钥），实时测试最佳
选项，并且仅在收到真实回复后保存——如果失败，会自动尝试其他选项；
如果未找到任何选项，则提供经过验证的手动 API 密钥步骤。敏感
凭据采用隐藏输入。推理通过后，Crestodian 会启动并
帮助配置其余内容。

设置完成后，Gemini CLI 仍可供常规智能体使用，但不会
用于此推理门控，因为它无法强制执行无工具探测。

完整参考：[新手引导（macOS 应用）](/zh-CN/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未列出，请运行 `openclaw onboard --classic`，选择
**Custom Provider**，然后输入：

- 端点兼容性：兼容 OpenAI（`/chat/completions`）、兼容 OpenAI Responses（`/responses`）、兼容 Anthropic（`/messages`），或未知（探测全部三种并自动检测）
- 基础 URL 和 API 密钥（如果端点不需要 API 密钥，则可不填）
- 模型 ID 和可选的模型别名

多个自定义端点可以共存——每个端点都会获得自己的端点 ID。

## 相关内容

- [入门指南](/zh-CN/start/getting-started)
- [CLI 设置参考](/zh-CN/start/wizard-cli-reference)
