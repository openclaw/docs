---
read_when:
    - 你想将 GitHub Copilot 用作模型提供商
    - 你需要 `openclaw models auth login-github-copilot` 流程
summary: 使用设备流程从 OpenClaw 登录 GitHub Copilot
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-05T08:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92857c119c314e698f922dbdbbc15d21b64d33a25979a2ec0ac1e82e586db6d6
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

## 什么是 GitHub Copilot？

GitHub Copilot 是 GitHub 的 AI 编码助手。它会根据你的 GitHub 账号和套餐提供对 Copilot 模型的访问。OpenClaw 可以通过两种不同方式将 Copilot 用作模型提供商。

## 在 OpenClaw 中使用 Copilot 的两种方式

### 1) 内置 GitHub Copilot 提供商（`github-copilot`）

使用原生设备登录流程获取 GitHub token，然后在 OpenClaw 运行时将其交换为 Copilot API token。这是**默认**且最简单的方式，因为它不需要 VS Code。

### 2) Copilot Proxy 插件（`copilot-proxy`）

使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 会与该代理的 `/v1` 端点通信，并使用你在其中配置的模型列表。如果你已经在 VS Code 中运行 Copilot Proxy，或需要通过它进行路由，请选择这种方式。你必须启用该插件，并保持 VS Code 扩展持续运行。

将 GitHub Copilot 用作模型提供商（`github-copilot`）。登录命令会运行 GitHub 设备流程、保存一个认证 profile，并更新你的配置以使用该 profile。

## CLI 设置

```bash
openclaw models auth login-github-copilot
```

系统会提示你访问一个 URL 并输入一次性代码。在流程完成之前，请保持终端处于打开状态。

### 可选标志

```bash
openclaw models auth login-github-copilot --yes
```

如果你还想一步同时应用该提供商推荐的默认模型，请改用通用认证命令：

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## 设置默认模型

```bash
openclaw models set github-copilot/gpt-4o
```

### 配置片段

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## 说明

- 需要交互式 TTY；请直接在终端中运行。
- Copilot 模型可用性取决于你的套餐；如果某个模型被拒绝，请尝试另一个 ID（例如 `github-copilot/gpt-4.1`）。
- Claude 模型 ID 会自动使用 Anthropic Messages 传输；GPT、o 系列和 Gemini 模型会继续使用 OpenAI Responses 传输。
- 登录会将 GitHub token 存储在认证 profile 存储中，并在 OpenClaw 运行时将其交换为 Copilot API token。
