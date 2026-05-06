---
read_when:
    - 你想将 Cerebras 与 OpenClaw 一起使用
    - 你需要 Cerebras API 密钥环境变量或 CLI 认证选项
summary: Cerebras 设置（身份验证 + 模型选择）
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T00:02:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) 在定制推理硬件上提供高速、OpenAI 兼容的推理服务。OpenClaw 包含一个内置的 Cerebras provider 插件，并带有静态的四模型目录。

| 属性            | 值                                       |
| --------------- | ---------------------------------------- |
| 提供商 ID       | `cerebras`                               |
| 插件            | 内置，`enabledByDefault: true`           |
| 认证环境变量    | `CEREBRAS_API_KEY`                       |
| 新手引导标志    | `--auth-choice cerebras-api-key`         |
| 直接 CLI 标志   | `--cerebras-api-key <key>`               |
| API             | OpenAI 兼容（`openai-completions`）      |
| 基础 URL        | `https://api.cerebras.ai/v1`             |
| 默认模型        | `cerebras/zai-glm-4.7`                   |

## 入门指南

<Steps>
  <Step title="获取 API key">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 中创建 API key。
  </Step>
  <Step title="运行新手引导">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider cerebras
    ```

    列表应包含全部四个内置模型。如果 `CEREBRAS_API_KEY` 未解析，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭证。

  </Step>
</Steps>

## 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 内置目录

OpenClaw 随附一个静态 Cerebras 目录，镜像公共的 OpenAI 兼容端点。全部四个模型共享 128k 上下文和 8,192 个最大输出 token。

| 模型引用                                  | 名称                 | 推理 | 备注                             |
| ----------------------------------------- | -------------------- | ---- | -------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 是   | 默认模型；预览版推理模型         |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 是   | 生产级推理模型                   |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 否   | 预览版非推理模型                 |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 否   | 面向速度优化的生产级模型         |

<Warning>
  Cerebras 将 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 标记为预览模型，并且文档说明 `llama3.1-8b` 以及 `qwen-3-235b-a22b-instruct-2507` 将于 2026 年 5 月 27 日弃用。在将它们用于生产工作负载之前，请查看 Cerebras 的支持模型页面。
</Warning>

## 手动配置

内置插件通常意味着你只需要 API key。当你想覆盖模型元数据，或以 `mode: "merge"` 针对静态目录运行时，请使用显式的 `models.providers.cerebras` 配置：

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
  如果 Gateway 网关以守护进程运行（launchd、systemd、Docker），请确保该进程可以使用 `CEREBRAS_API_KEY`，例如在 `~/.openclaw/.env` 中提供，或通过 `env.shellEnv` 提供。仅位于 `~/.profile` 中的 key 无法帮助托管服务，除非单独导入环境变量。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    两个支持推理的 Cerebras 模型的推理强度等级。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
  <Card title="Models 常见问题" href="/zh-CN/help/faq-models" icon="circle-question">
    认证配置文件、切换模型以及解决 “no profile” 错误。
  </Card>
</CardGroup>
