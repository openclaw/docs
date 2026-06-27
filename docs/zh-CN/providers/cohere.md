---
read_when:
    - 你想在 OpenClaw 中使用 Cohere
    - 你需要 Cohere API 密钥环境变量或 CLI 身份验证选项
summary: Cohere 设置（凭证 + 模型选择）
title: Cohere
x-i18n:
    generated_at: "2026-06-27T03:02:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) 通过其 Compatibility API 提供 OpenAI 兼容推理。OpenClaw 在外部化过渡期间内置 Cohere 提供商，并且也将其作为带有 Command A 模型目录的官方外部插件发布。

| 属性            | 值                                                   |
| --------------- | ---------------------------------------------------- |
| 提供商 id       | `cohere`                                             |
| 插件            | 过渡期间内置；官方外部包                             |
| 凭证环境变量    | `COHERE_API_KEY`                                     |
| 新手引导标志    | `--auth-choice cohere-api-key`                       |
| 直接 CLI 标志   | `--cohere-api-key <key>`                             |
| API             | OpenAI 兼容（`openai-completions`）                  |
| 基础 URL        | `https://api.cohere.ai/compatibility/v1`             |
| 默认模型        | `cohere/command-a-03-2025`                           |

## 开始使用

1. 当前 OpenClaw 包已包含 Cohere。如果不可用，请安装外部包并重启 Gateway 网关：

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

4. 确认目录可用：

```bash
openclaw models list --provider cohere
```

仅当尚未配置主模型时，才会设置默认模型。

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
如果 Gateway 网关以守护进程或在 Docker 中运行，请为该服务配置 `COHERE_API_KEY`。仅在交互式 shell 中导出它，不会让已经运行的 Gateway 网关可以使用它。
</Note>

## 相关内容

- [模型提供商](/zh-CN/concepts/model-providers)
- [模型 CLI](/zh-CN/cli/models)
- [提供商目录](/zh-CN/providers)
