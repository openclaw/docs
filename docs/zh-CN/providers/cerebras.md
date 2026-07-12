---
read_when:
    - 你想将 Cerebras 与 OpenClaw 搭配使用
    - 你需要设置 Cerebras API key 环境变量，或选择 CLI 身份验证方式
summary: Cerebras 设置（身份验证 + 模型选择）
title: Cerebras
x-i18n:
    generated_at: "2026-07-11T20:51:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) 在定制推理硬件上提供高速、兼容 OpenAI 的推理服务。该插件附带静态的四模型目录（不支持实时发现）。

| 属性 | 值 |
| --------------- | --------------------------------------------------------- |
| 提供商 ID | `cerebras` |
| 插件 | 官方外部软件包（`@openclaw/cerebras-provider`） |
| 身份验证环境变量 | `CEREBRAS_API_KEY` |
| 新手引导标志 | `--auth-choice cerebras-api-key` |
| 直接 CLI 标志 | `--cerebras-api-key <key>` |
| API | 兼容 OpenAI（`openai-completions`） |
| 基础 URL | `https://api.cerebras.ai/v1` |
| 默认模型 | `cerebras/zai-glm-4.7` |

## 安装插件

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="获取 API key">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 中创建 API key。
  </Step>
  <Step title="运行新手引导">
    <CodeGroup>

```bash 新手引导
openclaw onboard --auth-choice cerebras-api-key
```

```bash 直接标志
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash 仅环境变量
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider cerebras
    ```

    列出全部四个静态模型。如果无法解析 `CEREBRAS_API_KEY`，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭据。

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

全部四个模型都具有 128k 上下文窗口和最多 8,192 个输出 token。

| 模型引用 | 名称 | 推理 | 说明 |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7` | Z.ai GLM 4.7 | 是 | 默认模型；预览版推理模型 |
| `cerebras/gpt-oss-120b` | GPT OSS 120B | 是 | 生产级推理模型 |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 否 | 预览版非推理模型 |
| `cerebras/llama3.1-8b` | Llama 3.1 8B | 否 | 注重速度的生产级模型 |

<Warning>
Cerebras 将 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 标记为预览版模型，并且其文档说明 `llama3.1-8b` 与 `qwen-3-235b-a22b-instruct-2507` 将于 2026 年 5 月 27 日弃用。在将它们用于生产工作负载之前，请查看 Cerebras 的[支持模型页面](https://inference-docs.cerebras.ai/models/overview)。
</Warning>

## 手动配置

大多数设置只需要 API key。若要覆盖模型元数据，或针对静态目录以 `mode: "merge"` 运行，请使用显式的 `models.providers.cerebras` 配置：

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
如果 Gateway 网关以守护进程形式运行（launchd、systemd、Docker），请确保该进程可以访问 `CEREBRAS_API_KEY`，例如将其配置在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 提供。除非单独导入环境变量，否则仅在交互式 shell 中导出的 key 无法供托管服务使用。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    两个支持推理的 Cerebras 模型所使用的推理强度级别。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
  <Card title="模型常见问题" href="/zh-CN/help/faq-models" icon="circle-question">
    身份验证配置文件、切换模型以及解决“无配置文件”错误。
  </Card>
</CardGroup>
