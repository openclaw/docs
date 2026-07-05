---
read_when:
    - 你想通过 LM Studio 使用开源模型运行 OpenClaw
    - 你想要设置和配置 LM Studio
summary: 使用 LM Studio 运行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-07-05T11:37:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio 在本地运行 llama.cpp (GGUF) 或 MLX 模型，可作为 GUI 应用运行，也可作为无头 `llmster`
守护进程运行。安装和产品文档请参见 [lmstudio.ai](https://lmstudio.ai/)。

## 快速开始

<Steps>
  <Step title="安装并启动服务器">
    安装 LM Studio（桌面版）或 `llmster`（无头版），然后启动服务器：

    ```bash
    lms server start --port 1234
    ```

    或运行无头守护进程：

    ```bash
    lms daemon up
    ```

    如果使用桌面应用，请启用 JIT 以顺畅加载模型；请参见
    [LM Studio JIT 和 TTL 指南](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)。

  </Step>
  <Step title="如果启用了身份验证，请设置 API 密钥">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    如果禁用了 LM Studio 身份验证，请在设置期间将 API 密钥留空。请参见
    [LM Studio 身份验证](https://lmstudio.ai/docs/developer/core/authentication)。

  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard
    ```

    选择 `LM Studio`，然后在 `Default model` 提示中选择一个模型。

  </Step>
</Steps>

稍后更改默认模型：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型键使用 `author/model-name` 格式（例如 `qwen/qwen3.5-9b`）；OpenClaw 模型引用
会在前面添加提供商：`lmstudio/qwen/qwen3.5-9b`。运行以下命令并查看 `key` 字段，
即可找到模型的确切键：

```bash
curl http://localhost:1234/api/v1/models
```

## 非交互式新手引导

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

或者显式指定基础 URL、模型和 API 密钥：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接收 LM Studio 返回的模型键（例如 `qwen/qwen3.5-9b`），不包含
`lmstudio/` 提供商前缀。对于需要身份验证的服务器，传入 `--lmstudio-api-key`（或设置 `LM_API_TOKEN`）；
对于不需要身份验证的服务器则省略它，OpenClaw 会改为存储一个本地非秘密标记。
`--custom-api-key` 仍为兼容性而接受，但首选 `--lmstudio-api-key`。

这会写入 `models.providers.lmstudio`，并将默认模型设置为 `lmstudio/<custom-model-id>`。
提供 API 密钥还会写入 `lmstudio:default` 身份验证配置文件。

交互式设置还可以提示输入首选加载上下文长度，并将其应用到保存到配置中的已发现模型。

## 配置

### 流式用量兼容性

LM Studio 并不总是在流式响应中发出 OpenAI 形态的 `usage` 对象。OpenClaw
会改为从 llama.cpp 风格的 `timings.prompt_n` / `timings.predicted_n` 元数据中恢复 token 计数。
任何解析为本地端点（环回主机）的 OpenAI 兼容端点都会获得相同的回退，
这涵盖 vLLM、SGLang、llama.cpp、LocalAI、Jan、TabbyAPI
和 text-generation-webui 等其他本地后端。

### Thinking 兼容性

当 LM Studio 的 `/api/v1/models` 发现接口报告模型特定推理选项时，OpenClaw
会在模型兼容性元数据中暴露匹配的 `reasoning_effort` 值（`none`、`minimal`、`low`、`medium`、`high`、`xhigh`）。
某些 LM Studio 构建会公布二元 UI 选项（`allowed_options: ["off",
"on"]`），但在 `/v1/chat/completions` 上拒绝这些字面值；OpenClaw 会在发送请求前将该二元形态
规范化为六级刻度，包括仍包含 `off`/`on` 推理映射的旧版已保存配置。

### 显式配置

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 禁用预加载

LM Studio 支持即时（JIT）模型加载，即在首次请求时加载模型。OpenClaw
默认通过 LM Studio 的原生加载端点预加载模型，这在禁用 JIT 时很有帮助。
若要改由 LM Studio 的 JIT、空闲 TTL 和自动逐出行为拥有模型生命周期，
请禁用 OpenClaw 的预加载步骤：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN 或 tailnet 主机

使用 LM Studio 主机的可达地址，保留 `/v1`，并确保该机器上的 LM Studio
绑定到环回以外的地址：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

`lmstudio` 会自动信任其配置端点来发起模型请求，包括环回、LAN 和 tailnet 主机
（元数据/链路本地来源除外）。任何自定义/本地 OpenAI 兼容提供商条目都会获得相同的精确来源信任。
发往不同私有主机或端口的请求仍需要 `models.providers.<id>.request.allowPrivateNetwork: true`；
将其设置为 `false` 可选择退出默认信任。

## 故障排查

### 未检测到 LM Studio

确保 LM Studio 正在运行：

```bash
lms server start --port 1234
```

如果启用了身份验证，还要设置 `LM_API_TOKEN`。验证 API 是否可访问：

```bash
curl http://localhost:1234/api/v1/models
```

### 身份验证错误（HTTP 401）

- 检查 `LM_API_TOKEN` 是否与 LM Studio 中配置的密钥匹配。
- 请参见 [LM Studio 身份验证](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果服务器不需要身份验证，请在设置期间将密钥留空。

## 相关内容

- [模型选择](/zh-CN/concepts/model-providers)
- [Ollama](/zh-CN/providers/ollama)
- [本地模型](/zh-CN/gateway/local-models)
