---
read_when:
    - 你想在 OpenClaw 中使用 Meta
    - 你需要设置 `MODEL_API_KEY` 环境变量或选择 CLI 身份验证方式
summary: Meta 设置（身份验证 + muse-spark-1.1 模型选择）
title: Meta
x-i18n:
    generated_at: "2026-07-12T14:43:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** 使用与 OpenAI 兼容的 **Responses API**（`POST /v1/responses`）
来支持 `muse-spark-1.1` 推理模型。该提供商以 OpenClaw 内置
插件的形式提供。

| 属性              | 值                                 |
| ----------------- | ---------------------------------- |
| 提供商 ID         | `meta`                             |
| 插件              | 内置提供商                         |
| 身份验证环境变量  | `MODEL_API_KEY`                    |
| 新手引导标志      | `--auth-choice meta-api-key`       |
| 直接 CLI 标志     | `--meta-api-key <key>`             |
| API               | Responses API (`openai-responses`) |
| 基础 URL          | `https://api.meta.ai/v1`           |
| 默认模型          | `meta/muse-spark-1.1`              |
| 默认推理强度      | `high` (`reasoning.effort`)        |

## 入门指南

<Steps>
  <Step title="设置 API key">
    <CodeGroup>

```bash 新手引导
openclaw onboard --auth-choice meta-api-key
```

```bash 直接标志
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash 仅使用环境变量
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider meta
    ```

    列出静态的 `muse-spark-1.1` 目录条目。如果无法解析 `MODEL_API_KEY`，
    `openclaw models status --json` 会在 `auth.unusableProfiles`
    下报告缺失的凭据。

  </Step>
</Steps>

## 非交互式设置

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## 内置目录

| 模型引用              | 名称           | 推理 | 上下文窗口 | 最大输出 |
| --------------------- | -------------- | ---- | ---------- | -------- |
| `meta/muse-spark-1.1` | Muse Spark 1.1 | 是   | 1,048,576  | 131,072  |

能力：

- 文本 + 图像输入
- 工具调用和流式传输
- 推理强度：`minimal`、`low`、`medium`、`high`、`xhigh`（默认：`high`）
- 无状态加密推理重放（`store: false`、`include: ["reasoning.encrypted_content"]`）

<Warning>
`muse-spark-1.1` 不接受 `reasoning.effort: "none"`。对于此提供商，OpenClaw 会将
`--thinking off` 映射为 `minimal`。
</Warning>

## 手动配置

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
如果 Gateway 网关以守护进程（launchd、systemd、Docker）的形式运行，请确保
该进程可以访问 `MODEL_API_KEY`，例如将其放在
`~/.openclaw/.env` 中或通过 `env.shellEnv` 提供。如果环境变量仅在
交互式 shell 中导出，除非单独导入该环境变量，否则它不会对托管服务
生效。
</Note>

## 冒烟测试

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

实时测试使用 `muse-spark-1.1` 调用 `POST /v1/responses`。

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    muse-spark-1.1 的推理强度级别。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
</CardGroup>
