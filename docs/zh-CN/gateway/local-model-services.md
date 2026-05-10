---
read_when:
    - 你希望 OpenClaw 仅在对应模型被选中时才启动本地模型服务器
    - 你运行 ds4、inferrs、vLLM、llama.cpp、MLX，或其他与 OpenAI 兼容的本地服务器
    - 你需要控制本地提供商的冷启动、就绪状态和空闲关闭
summary: 在 OpenClaw 模型请求前按需启动本地模型服务器
title: 本地模型服务
x-i18n:
    generated_at: "2026-05-10T19:34:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` 让 OpenClaw 按需启动由提供商拥有的本地模型服务器。这是提供商级配置：当所选模型属于该提供商时，OpenClaw 会探测服务；如果端点不可用，就启动进程，等待就绪，然后发送模型请求。

它适用于那些整天保持运行成本较高的本地服务器，也适用于希望仅通过选择模型就能启动后端的手动设置。

## 工作原理

1. 模型请求解析到已配置的提供商。
2. 如果该提供商有 `localService`，OpenClaw 会探测 `healthUrl`。
3. 如果探测成功，OpenClaw 会使用现有服务器。
4. 如果探测失败，OpenClaw 会用 `args` 启动 `command`。
5. OpenClaw 会轮询就绪状态，直到 `readyTimeoutMs` 到期。
6. 模型请求会通过常规提供商传输发送。
7. 如果进程由 OpenClaw 启动，并且 `idleStopMs` 为正数，则在最后一个进行中的请求空闲达到该时长后，进程会被停止。

OpenClaw 不会为此安装 launchd、systemd、Docker 或守护进程。该服务器是第一个需要它的 OpenClaw 进程的子进程。

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

## 字段

- `command`：可执行文件的绝对路径。不使用 shell 查找。
- `args`：进程参数。不会应用 shell 展开、管道、通配符匹配或引用规则。
- `cwd`：进程的可选工作目录。
- `env`：可选环境变量，会覆盖合并到 OpenClaw 进程环境之上。
- `healthUrl`：就绪 URL。如果省略，OpenClaw 会将 `/models` 追加到 `baseUrl`，因此 `http://127.0.0.1:8000/v1` 会变成 `http://127.0.0.1:8000/v1/models`。
- `readyTimeoutMs`：启动就绪截止时间。默认值：`120000`。
- `idleStopMs`：OpenClaw 启动的进程的空闲关闭延迟。`0` 或省略会使进程保持运行，直到 OpenClaw 退出。

## Inferrs 示例

Inferrs 是自定义的 OpenAI 兼容 `/v1` 后端，因此同一个本地服务 API 可与 `inferrs` 提供商条目配合使用。

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

将 `command` 替换为运行 OpenClaw 的机器上 `which inferrs` 的结果。

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

## 运维说明

- 一个 OpenClaw 进程会管理它启动的子进程。另一个 OpenClaw 进程如果看到同一个健康检查 URL 已经可用，会直接复用它，但不会接管它。
- 启动会按每组提供商命令和参数进行串行化，因此并发请求不会为同一配置生成重复服务器。
- 活跃的流式响应会持有租约；空闲关闭会等待到响应体处理完成。
- 对较慢的本地提供商使用 `timeoutSeconds`，这样冷启动和长时间生成不会触发默认模型请求超时。
- 如果你的服务器在 `/v1/models` 以外的位置暴露就绪状态，请使用显式 `healthUrl`。

## 相关

<CardGroup cols={2}>
  <Card title="本地模型" href="/zh-CN/gateway/local-models" icon="server">
    本地模型设置、提供商选择和安全指导。
  </Card>
  <Card title="Inferrs" href="/zh-CN/providers/inferrs" icon="cpu">
    通过 inferrs OpenAI 兼容本地服务器运行 OpenClaw。
  </Card>
</CardGroup>
