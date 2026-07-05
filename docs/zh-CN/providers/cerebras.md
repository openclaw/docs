---
read_when:
    - 你想将 Cerebras 与 OpenClaw 一起使用
    - 你需要 Cerebras API key 环境变量或 CLI 凭证选择
summary: Cerebras 设置（凭证 + 模型选择）
title: Cerebras
x-i18n:
    generated_at: "2026-07-05T11:34:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) 在自定义推理硬件上提供高速、兼容 OpenAI 的推理。该插件内置静态的四模型目录（无实时发现）。

| 属性            | 值                                                        |
| --------------- | --------------------------------------------------------- |
| 提供商 id       | `cerebras`                                                |
| 插件            | 官方外部包（`@openclaw/cerebras-provider`）               |
| 凭证环境变量    | `CEREBRAS_API_KEY`                                        |
| 新手引导标志    | `--auth-choice cerebras-api-key`                          |
| 直接 CLI 标志   | `--cerebras-api-key <key>`                                |
| API             | 兼容 OpenAI（`openai-completions`）                       |
| 基础 URL        | `https://api.cerebras.ai/v1`                              |
| 默认模型        | `cerebras/zai-glm-4.7`                                    |

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

    列出全部四个静态模型。如果 `CEREBRAS_API_KEY` 未解析，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭证。

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

全部四个模型共享 128k 上下文窗口和 8,192 个最大输出 token。

| 模型 ref                                  | 名称                 | 推理 | 说明                                   |
| ----------------------------------------- | -------------------- | ---- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 是   | 默认模型；预览版推理模型               |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 是   | 生产推理模型                           |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 否   | 预览版非推理模型                       |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 否   | 面向速度的生产模型                     |

<Warning>
Cerebras 将 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 标记为预览模型，并且文档说明 `llama3.1-8b` 以及 `qwen-3-235b-a22b-instruct-2507` 将于 2026 年 5 月 27 日弃用。在生产工作负载中依赖它们之前，请查看 Cerebras 的[支持模型页面](https://inference-docs.cerebras.ai/models/overview)。
</Warning>

## 手动配置

大多数设置只需要 API key。使用显式的 `models.providers.cerebras` 配置来覆盖模型元数据，或以 `mode: "merge"` 针对静态目录运行：

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
如果 Gateway 网关作为守护进程运行（launchd、systemd、Docker），请确保 `CEREBRAS_API_KEY` 对该进程可用，例如放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供。仅在交互式 shell 中导出的 key 对托管服务没有帮助，除非单独导入该环境变量。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 ref 和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    两个支持推理的 Cerebras 模型的推理强度级别。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
  <Card title="模型常见问题" href="/zh-CN/help/faq-models" icon="circle-question">
    凭证档案、切换模型，以及解决 “no profile” 错误。
  </Card>
</CardGroup>
