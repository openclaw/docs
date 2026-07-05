---
read_when:
    - 你希望 OpenClaw 仅在选中其模型时启动本地模型服务器
    - 你运行 ds4、inferrs、vLLM、llama.cpp、MLX 或其他 OpenAI 兼容的本地服务器
    - 你需要控制本地提供商的冷启动、就绪状态和空闲关闭
summary: 在 OpenClaw 模型请求前按需启动本地模型服务器
title: 本地模型服务
x-i18n:
    generated_at: "2026-07-05T11:18:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9098fe9245a98987e7c58edb8395ae67e7d2ee5ec2215cc7d3ae880a62073372
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` 会按需启动由提供商拥有的本地模型服务器。当请求选择该提供商的模型时，OpenClaw 会探测健康端点；如果进程已停止，就启动该进程，等待其就绪，然后发送请求。用它可以避免让昂贵的本地服务器整天运行。

## 工作原理

1. 模型请求解析到已配置的提供商。
2. 如果该提供商有 `localService`，OpenClaw 会探测 `healthUrl`。
3. 探测成功时，OpenClaw 使用已经运行的服务器。
4. 探测失败时，OpenClaw 使用 `args` 启动 `command`。
5. OpenClaw 轮询健康端点，直到 `readyTimeoutMs` 到期。
6. 模型请求通过常规提供商传输路径发送。
7. 如果该进程由 OpenClaw 启动且设置了 `idleStopMs`，OpenClaw 会在最后一个进行中的请求空闲达到该时长后停止该进程。

OpenClaw 不会为此安装 launchd、systemd、Docker 或任何守护进程。该服务器只是最先需要它的 OpenClaw 进程的普通子进程。

启动会按提供商的命令/参数/环境变量集合串行化，因此针对同一服务的并发请求不会启动重复服务器。如果另一个 OpenClaw 进程已经在同一 `healthUrl` 上有健康的服务器，本进程会复用它，但不会接管它（每个进程只管理自己亲自启动的子进程）。活跃的流式响应会持有租约，因此空闲关闭会等到响应处理完成后再进行。

## 配置形状

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

在提供商条目上设置 `timeoutSeconds`（而不是 `localService`），这样缓慢的冷启动和较长的生成过程就不会触发默认模型请求超时。只要你的服务器在基础 URL 的 `/models` 之外的位置暴露就绪状态，就应显式设置 `healthUrl`。

## 字段

| 字段             | 必填 | 说明                                                                                                                                |
| ---------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | 是   | 绝对可执行文件路径。不进行 shell PATH 查找。                                                                                        |
| `args`           | 否   | 进程参数。不进行 shell 展开、管道、通配符匹配或引号处理。                                                                           |
| `cwd`            | 否   | 进程的工作目录。                                                                                                                    |
| `env`            | 否   | 覆盖合并到 OpenClaw 进程环境中的环境变量。                                                                                          |
| `healthUrl`      | 否   | 就绪 URL。默认是在 `baseUrl` 后追加 `/models`（`http://127.0.0.1:8000/v1` 会变成 `http://127.0.0.1:8000/v1/models`）。              |
| `readyTimeoutMs` | 否   | 启动就绪截止时间。默认值：`120000`。                                                                                                |
| `idleStopMs`     | 否   | OpenClaw 启动的进程的空闲关闭延迟。`0` 或省略表示保持运行，直到 OpenClaw 退出。                                                     |

## Inferrs 示例

Inferrs 是自定义的 OpenAI 兼容 `/v1` 后端，因此同一个 `localService` API 可用于 `inferrs` 提供商条目：

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

将 `command` 替换为运行 OpenClaw 的机器上 `which inferrs` 的结果。完整的 inferrs 设置：[Inferrs](/zh-CN/providers/inferrs)。

## ds4 示例

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

完整设置、上下文大小配置和验证命令：[ds4](/zh-CN/providers/ds4)。

## 相关

<CardGroup cols={2}>
  <Card title="Local models" href="/zh-CN/gateway/local-models" icon="server">
    本地模型设置、提供商选择和安全指导。
  </Card>
  <Card title="Inferrs" href="/zh-CN/providers/inferrs" icon="cpu">
    通过 inferrs OpenAI 兼容本地服务器运行 OpenClaw。
  </Card>
</CardGroup>
