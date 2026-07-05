---
read_when:
    - 你想在 OpenClaw 中使用 Cohere
    - 你需要 Cohere API 密钥环境变量或 CLI 认证选项
summary: Cohere 设置（凭证 + 模型选择）
title: Cohere
x-i18n:
    generated_at: "2026-07-05T11:37:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 846e69fd185c210c9ffd8719a233272aeda2aa0749f952a74714c13fd917fb66
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) 通过其 Compatibility API 提供 OpenAI 兼容的推理。OpenClaw 在 Cohere provider 外部化过渡期间内置它，同时也将其作为官方外部插件发布。

| 属性            | 值                                                   |
| --------------- | ---------------------------------------------------- |
| 提供商 ID       | `cohere`                                             |
| 插件            | 过渡期间内置；官方外部包                             |
| 凭证环境变量    | `COHERE_API_KEY`                                     |
| 新手引导标志    | `--auth-choice cohere-api-key`                       |
| 直接 CLI 标志   | `--cohere-api-key <key>`                             |
| API             | OpenAI 兼容（`openai-completions`）                  |
| 基础 URL        | `https://api.cohere.ai/compatibility/v1`             |
| 默认模型        | `cohere/command-a-03-2025`                           |
| 上下文窗口      | 256,000 个 token                                     |

## 入门指南

1. Cohere 随当前 OpenClaw 包一起提供。如果缺失，请安装外部包并重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. 创建 Cohere API key。
3. 运行新手引导：

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. 确认可用目录：

```bash
openclaw models list --provider cohere
```

新手引导仅在尚未配置主模型时，才会将 Cohere 设置为主模型。

## 仅环境变量设置

让 Gateway 网关进程可以使用 `COHERE_API_KEY`，然后选择 Cohere 模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
如果 Gateway 网关作为守护进程运行或在 Docker 中运行，请为该服务设置 `COHERE_API_KEY`。仅在交互式 shell 中导出它，不会让已经运行的 Gateway 网关可用。
</Note>

## 相关

- [模型提供商](/zh-CN/concepts/model-providers)
- [模型 CLI](/zh-CN/cli/models)
- [提供商目录](/zh-CN/providers/index)
