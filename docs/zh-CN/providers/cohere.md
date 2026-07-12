---
read_when:
    - 你想在 OpenClaw 中使用 Cohere
    - 你需要设置 Cohere API key 环境变量或选择 CLI 身份验证方式
summary: Cohere 设置（身份验证 + 模型选择）
title: Cohere
x-i18n:
    generated_at: "2026-07-12T14:43:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) 通过其兼容性 API 提供兼容 OpenAI 的推理服务。在外部化过渡期间，OpenClaw 内置 Cohere 提供商，同时也将其作为官方外部插件发布。

| 属性            | 值                                                   |
| --------------- | ---------------------------------------------------- |
| 提供商 ID       | `cohere`                                             |
| 插件            | 过渡期间内置；官方外部软件包                         |
| 身份验证环境变量 | `COHERE_API_KEY`                                     |
| 新手引导标志    | `--auth-choice cohere-api-key`                       |
| 直接 CLI 标志   | `--cohere-api-key <key>`                             |
| API             | 兼容 OpenAI（`openai-completions`）                  |
| 基础 URL        | `https://api.cohere.ai/compatibility/v1`             |
| 默认模型        | `cohere/command-a-plus-05-2026`                      |
| 上下文窗口      | 128,000 个 token                                     |

## 内置目录

| 模型引用                             | 输入       | 上下文  | 最大输出 | 说明                                       |
| ------------------------------------ | ---------- | ------- | -------- | ------------------------------------------ |
| `cohere/command-a-plus-05-2026`      | 文本、图像 | 128,000 | 64,000   | 默认；旗舰智能体和推理模型                 |
| `cohere/command-a-03-2025`           | 文本       | 256,000 | 8,000    | 上一代 Command A 模型                      |
| `cohere/command-a-reasoning-08-2025` | 文本       | 256,000 | 32,000   | 智能体推理和工具使用                       |
| `cohere/command-a-vision-07-2025`    | 文本、图像 | 128,000 | 8,000    | 视觉和文档分析；不支持工具使用             |
| `cohere/north-mini-code-1-0`         | 文本、图像 | 256,000 | 64,000   | 智能体编程；推理；免费额度                 |

支持推理的 Cohere 模型支持两种兼容性 API 推理模式。OpenClaw 将 **关闭** 映射为 `none`，并将每个已启用的思考级别映射为 `high`。Command A Vision 不支持使用工具，因此 OpenClaw 会为该模型禁用智能体工具。

## 入门指南

1. 当前 OpenClaw 软件包已随附 Cohere。如果缺失，请安装外部软件包并重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. 创建 Cohere API 密钥。
3. 运行新手引导：

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. 确认目录可用：

```bash
openclaw models list --provider cohere
```

只有在尚未配置主模型时，新手引导才会将 Cohere 设置为主模型。

## 仅使用环境变量的设置

让 Gateway 网关进程能够使用 `COHERE_API_KEY`，然后选择 Cohere 模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
如果 Gateway 网关作为守护进程运行或在 Docker 中运行，请为该服务设置 `COHERE_API_KEY`。仅在交互式 shell 中导出它，并不会使已在运行的 Gateway 网关能够使用它。
</Note>

## 相关内容

- [模型提供商](/zh-CN/concepts/model-providers)
- [模型 CLI](/zh-CN/cli/models)
- [提供商目录](/zh-CN/providers/index)
