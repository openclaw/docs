---
read_when:
    - 你希望 OpenClaw 仅在选择其模型或嵌入提供商时启动本地模型服务器
    - 你运行 ds4、inferrs、vLLM、llama.cpp、MLX 或其他与 OpenAI 兼容的本地服务器
    - 你需要控制本地提供商的冷启动、就绪状态和空闲关闭行为
summary: 在 OpenClaw 发起模型和嵌入请求前按需启动本地模型服务器
title: 本地模型服务
x-i18n:
    generated_at: "2026-07-12T14:31:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` 会按需启动由提供商拥有的本地模型服务器。当模型或嵌入请求选择该提供商时，OpenClaw 会探测健康检查端点；如果服务未运行，则启动进程并等待其就绪，然后发送请求。使用它可以避免让资源开销较大的本地服务器全天运行。

## 工作原理

1. 模型或嵌入请求解析到已配置的提供商。
2. 如果该提供商具有 `localService`，OpenClaw 会探测 `healthUrl`。
3. 如果探测成功，OpenClaw 会使用已在运行的服务器。
4. 如果探测失败，OpenClaw 会使用 `args` 启动 `command`。
5. OpenClaw 会轮询健康检查端点，直到 `readyTimeoutMs` 到期。
6. 请求通过正常的模型或嵌入传输路径发送。
7. 如果进程由 OpenClaw 启动且已设置 `idleStopMs`，则在最后一个进行中的请求空闲达到该时长后，OpenClaw 会停止该进程。

OpenClaw 不会为此安装 launchd、systemd、Docker 或任何守护进程。服务器只是最先需要它的 OpenClaw 进程所启动的普通子进程。

对于每组已配置的提供商及命令、参数和环境变量组合，启动过程会串行执行，因此针对同一服务的并发聊天和嵌入请求不会生成重复的服务器。每个请求都会持有自己的租约，直到响应处理完成，因此空闲关闭会等待所有进行中的模型和嵌入请求完成。已配置的提供商别名仍彼此独立：两个别名可以指向不同的 GPU 主机，而不会合并到同一个 Ollama、LM Studio 或 OpenAI 兼容适配器 ID 上。

如果另一个 OpenClaw 进程已在同一 `healthUrl` 上运行健康的服务器，当前进程会复用它，但不会接管它（每个进程只管理自己启动的子进程）。启动和退出日志包含长度受限且经过脱敏的子进程输出尾部，以及计时和退出详情；配置的环境变量值绝不会输出。

## 配置结构

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

在提供商条目（而不是 `localService`）上设置 `timeoutSeconds`，这样缓慢的冷启动和长时间生成就不会触发默认的模型请求超时。如果服务器在基础 URL 的 `/models` 以外位置提供就绪状态，请显式设置 `healthUrl`。

## 字段

| 字段             | 必需 | 说明                                                                                                                                 |
| ---------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | 是   | 可执行文件的绝对路径。不进行 shell PATH 查找。                                                                                       |
| `args`           | 否   | 进程参数。不进行 shell 展开、管道处理、通配符匹配或引号处理。                                                                        |
| `cwd`            | 否   | 进程的工作目录。                                                                                                                     |
| `env`            | 否   | 与 OpenClaw 进程环境合并的环境变量。                                                                                                 |
| `healthUrl`      | 否   | 就绪状态 URL。默认在 `baseUrl` 后附加 `/models`（`http://127.0.0.1:8000/v1` 会变为 `http://127.0.0.1:8000/v1/models`）。             |
| `readyTimeoutMs` | 否   | 启动就绪期限。默认值：`120000`。                                                                                                     |
| `idleStopMs`     | 否   | 由 OpenClaw 启动的进程的空闲关闭延迟。设为 `0` 或省略时，进程会一直运行到 OpenClaw 退出。                                             |

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

将 `command` 替换为在运行 OpenClaw 的计算机上执行 `which inferrs` 所得到的结果。完整的 inferrs 设置：[Inferrs](/zh-CN/providers/inferrs)。

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

## 相关内容

<CardGroup cols={2}>
  <Card title="本地模型" href="/zh-CN/gateway/local-models" icon="server">
    本地模型设置、提供商选择和安全指导。
  </Card>
  <Card title="Inferrs" href="/zh-CN/providers/inferrs" icon="cpu">
    通过 inferrs 的 OpenAI 兼容本地服务器运行 OpenClaw。
  </Card>
</CardGroup>
