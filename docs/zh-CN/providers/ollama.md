---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
    - 你想使用 Ollama 视觉模型进行图像理解
summary: 使用 Ollama（云端和本地模型）运行 OpenClaw
title: Ollama
x-i18n:
    generated_at: "2026-04-28T02:18:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c5658a8024ca4bb90a8cf1256cf1db21a9a9a32e21c15c2f17f1513d29726f0
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw 通过 Ollama 的原生 API（`/api/chat`）集成托管云模型和本地/自托管的 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机使用 `Cloud + Local`、直接对接 `https://ollama.com` 的 `Cloud only`，或对接可访问 Ollama 主机的 `Local only`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` 的 OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型还可能把原始工具 JSON 当作纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要带 `/v1`）。
</Warning>

Ollama provider 配置使用 `baseUrl` 作为规范键名。OpenClaw 也接受 `baseURL`，以兼容 OpenAI SDK 风格的示例，但新配置应优先使用 `baseUrl`。

## 凭证规则

<AccordionGroup>
  <Accordion title="本地和局域网主机">
    本地和局域网中的 Ollama 主机不需要真实的 bearer token。OpenClaw 仅对 loopback、私有网络、`.local` 和裸主机名的 Ollama base URL 使用本地 `ollama-local` 标记。
  </Accordion>
  <Accordion title="远程和 Ollama Cloud 主机">
    远程公共主机和 Ollama Cloud（`https://ollama.com`）需要通过 `OLLAMA_API_KEY`、auth profile 或提供商的 `apiKey` 提供真实凭证。
  </Accordion>
  <Accordion title="自定义 provider id">
    设置了 `api: "ollama"` 的自定义 provider id 遵循相同规则。例如，指向私有局域网 Ollama 主机的 `ollama-remote` 提供商可以使用 `apiKey: "ollama-local"`，子智能体会通过 Ollama provider hook 解析这个标记，而不会将其视为缺失凭证。Memory 搜索也可以把 `agents.defaults.memorySearch.provider` 设置为该自定义 provider id，这样 embeddings 就会使用匹配的 Ollama 端点。
  </Accordion>
  <Accordion title="Memory embedding 作用域">
    当 Ollama 用于 memory embeddings 时，bearer auth 的作用域限定在声明它的主机上：

    - provider 级别的密钥只会发送到该 provider 的 Ollama 主机。
    - `agents.*.memorySearch.remote.apiKey` 只会发送到它自己的远程 embedding 主机。
    - 单独的 `OLLAMA_API_KEY` 环境变量值会被视为 Ollama Cloud 约定，默认不会发送到本地或自托管主机。

  </Accordion>
</AccordionGroup>

## 入门指南

选择你偏好的设置方法和模式。

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 以最快方式完成可用的 Ollama 云端或本地设置。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        从 provider 列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **Cloud + Local** — 本地 Ollama 主机，加上通过该主机路由的云模型
        - **Cloud only** — 通过 `https://ollama.com` 使用托管的 Ollama 模型
        - **Local only** — 仅使用本地模型
      </Step>
      <Step title="选择一个模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY`，并建议使用托管云默认模型。`Cloud + Local` 和 `Local only` 会要求填写 Ollama base URL，发现可用模型，并在所选本地模型尚不可用时自动拉取它。当 Ollama 报告已安装的 `:latest` 标签（例如 `gemma4:latest`）时，设置界面只会显示这个已安装模型一次，而不会同时显示 `gemma4` 和 `gemma4:latest`，也不会再次拉取不带标签的别名。`Cloud + Local` 还会检查该 Ollama 主机是否已登录以启用云访问。
      </Step>
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非交互模式

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    你也可以选择性指定自定义 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全掌控云端或本地设置。

    <Steps>
      <Step title="选择云端或本地">
        - **Cloud + Local**：安装 Ollama，使用 `ollama signin` 登录，并通过该主机路由云请求
        - **Cloud only**：使用 `https://ollama.com` 并配合 `OLLAMA_API_KEY`
        - **Local only**：从 [ollama.com/download](https://ollama.com/download) 安装 Ollama
      </Step>
      <Step title="拉取本地模型（仅本地）">
        ```bash
        ollama pull gemma4
        # 或
        ollama pull gpt-oss:20b
        # 或
        ollama pull llama3.3
        ```
      </Step>
      <Step title="为 OpenClaw 启用 Ollama">
        对于 `Cloud only`，请使用真实的 `OLLAMA_API_KEY`。对于基于主机的设置，任意占位值都可以：

        ```bash
        # 云端
        export OLLAMA_API_KEY="your-ollama-api-key"

        # 仅本地
        export OLLAMA_API_KEY="ollama-local"

        # 或在你的配置文件中设置
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="查看并设置你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或者在配置中设置默认值：

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 云模型

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` 使用一个可访问的 Ollama 主机作为本地模型和云模型的统一控制点。这是 Ollama 推荐的混合流程。

    在设置期间使用 **Cloud + Local**。OpenClaw 会提示输入 Ollama base URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录以启用云访问。当主机已登录时，OpenClaw 还会建议托管云默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 会保持仅本地设置，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 直接对接 Ollama 的托管 API：`https://ollama.com`。

    在设置期间使用 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并填充托管云模型列表。此路径 **不** 需要本地 Ollama 服务器或 `ollama signin`。

    `openclaw onboard` 期间显示的云模型列表会从 `https://ollama.com/api/tags` 实时获取，最多 500 条，因此选择器反映的是当前托管目录，而不是静态种子列表。如果设置时 `ollama.com` 不可访问或未返回模型，OpenClaw 会回退到之前硬编码的建议值，以确保新手引导仍能完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例发现模型。此路径适用于本地或自托管的 Ollama 服务器。

    OpenClaw 当前建议 `gemma4` 作为本地默认值。

  </Tab>
</Tabs>

## 模型发现（隐式 provider）

当你设置了 `OLLAMA_API_KEY`（或 auth profile），并且**没有**定义 `models.providers.ollama` 或其他带有 `api: "ollama"` 的自定义远程 provider 时，OpenClaw 会从 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为 | 详情 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查询来读取 `contextWindow`、扩展后的 `num_ctx` Modelfile 参数，以及包括 vision/tools 在内的能力 |
| 视觉模型 | 对于 `/api/show` 报告具备 `vision` 能力的模型，会将其标记为支持图像（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词 |
| 推理检测 | 通过模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning` |
| token 限制 | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限 |
| 成本 | 将所有成本设为 `0` |

这避免了手动录入模型条目，同时让目录与本地 Ollama 实例保持一致。你可以在本地 `infer model run` 中使用完整引用，如 `ollama/<pulled-model>:latest`；OpenClaw 会从 Ollama 的实时目录中解析这个已安装模型，而不需要手写 `models.json` 条目。

```bash
# 查看有哪些可用模型
ollama list
openclaw models list
```

要进行一个范围较小的文本生成 smoke test，并避免完整的智能体工具表面，
请在本地 `infer model run` 中使用完整的 Ollama 模型引用：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

这个路径仍会使用 OpenClaw 已配置的 provider、auth 和原生 Ollama
传输，但它不会启动聊天智能体轮次，也不会加载 MCP/工具上下文。如果
这个命令成功，而普通智能体回复失败，请接着排查模型的智能体提示词/工具能力。

当你使用 `/model ollama/<model>` 切换对话时，OpenClaw 会将其视为用户的精确选择。如果已配置的 Ollama `baseUrl` 不可访问，下一条回复会因 provider 错误而失败，而不会静默地改用其他已配置的回退模型来回答。

隔离的 cron 作业在启动智能体轮次前还会额外执行一次本地安全检查。如果所选模型解析到本地、私有网络或 `.local` 的 Ollama provider，且 `/api/tags` 不可访问，OpenClaw 会将该次 cron 运行记录为 `skipped`，并在错误文本中带上所选的 `ollama/<model>`。端点预检结果会缓存 5 分钟，因此多个指向同一个已停止 Ollama 守护进程的 cron 作业不会全部发起失败的模型请求。

使用以下命令对接本地 Ollama，实时验证本地文本路径、原生流式传输路径和 embeddings：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

要添加新模型，只需用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，或配置了带有 `api: "ollama"` 的自定义远程 provider（例如 `models.providers.ollama-cloud`），则会跳过自动发现，你必须手动定义模型。像 `http://127.0.0.2:11434` 这样的 loopback 自定义 provider 仍会被视为本地。请参阅下面的显式配置部分。
</Note>

## 视觉与图像描述

内置的 Ollama 插件将 Ollama 注册为支持图像的媒体理解 provider。这使 OpenClaw 能够通过本地或托管的 Ollama 视觉模型，路由显式的图像描述请求和已配置的图像模型默认值。

对于本地视觉模型，请拉取一个支持图像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然后使用 infer CLI 进行验证：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为模型支持原生视觉能力就跳过描述。

要让 Ollama 成为入站媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

较慢的本地视觉模型相比云模型，可能需要更长的图像理解超时时间。当 Ollama 在硬件受限的情况下尝试分配模型声明的完整视觉上下文时，这些模型也可能崩溃或停止。对于只需要普通图像描述轮次的场景，请设置能力超时，并在模型条目上限制 `num_ctx`：

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

这个超时同时适用于入站图像理解，以及智能体在轮次中可调用的显式 `image` 工具。provider 级别的 `models.providers.ollama.timeoutSeconds` 仍然控制普通模型调用底层 Ollama HTTP 请求的保护超时。

使用以下命令对接本地 Ollama，实时验证显式图像工具：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果你手动定义了 `models.providers.ollama.models`，请为视觉模型标记图像输入支持：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝未标记为支持图像能力的模型的图像描述请求。使用隐式发现时，当 `/api/show` 报告视觉能力，OpenClaw 会从 Ollama 读取这一信息。

## 配置

<Tabs>
  <Tab title="基础（隐式发现）">
    最简单的仅本地启用方式是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，你可以在 provider 条目中省略 `apiKey`，OpenClaw 会在可用性检查时自动填充它。
    </Tip>

  </Tab>

  <Tab title="显式配置（手动模型）">
    当你需要托管云设置、Ollama 运行在其他主机/端口、想强制指定特定上下文窗口或模型列表，或者想完全手动定义模型时，请使用显式配置。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="自定义 base URL">
    如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此需要手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要使用 /v1 —— 请使用原生 Ollama API URL
            api: "ollama", // 显式设置以确保原生工具调用行为
            timeoutSeconds: 300, // 可选：给冷启动的本地模型更长的连接和流式输出时间
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 可选：在轮次之间保持模型加载
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，而该模式下工具调用并不可靠。请使用不带路径后缀的基础 Ollama URL。
    </Warning>

  </Tab>
</Tabs>

## 常见配方

将这些作为起点，并把模型 ID 替换为 `ollama list` 或 `openclaw models list --provider ollama` 中的精确名称。

<AccordionGroup>
  <Accordion title="带自动发现的本地模型">
    当 Ollama 与 Gateway 网关运行在同一台机器上，并且你希望 OpenClaw 自动发现已安装模型时，请使用这个方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    这种方式可以保持配置最简。除非你想手动定义模型，否则不要添加 `models.providers.ollama` 配置块。

  </Accordion>

  <Accordion title="带手动模型的局域网 Ollama 主机">
    对局域网主机请使用原生 Ollama URL。不要添加 `/v1`。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` 是 OpenClaw 侧的上下文预算。`params.num_ctx` 会随请求发送给 Ollama。当你的硬件无法运行模型声明的完整上下文时，请保持两者一致。

  </Accordion>

  <Accordion title="仅 Ollama Cloud">
    当你不运行本地守护进程，并且想直接使用托管的 Ollama 模型时，请使用这个方式。

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="通过已登录守护进程同时使用云端和本地">
    当本地或局域网 Ollama 守护进程已通过 `ollama signin` 登录，并且应同时提供本地模型和 `:cloud` 模型时，请使用这个方式。

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="多个 Ollama 主机">
    当你拥有多个 Ollama 服务器时，请使用自定义 provider ID。每个 provider 都有自己的主机、模型、凭证、超时和模型引用。

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    当 OpenClaw 发送请求时，会去掉活动 provider 前缀，因此 `ollama-large/qwen3.5:27b` 到达 Ollama 时会变成 `qwen3.5:27b`。

  </Accordion>

  <Accordion title="精简本地模型配置">
    某些本地模型可以回答简单提示，但难以应对完整的智能体工具表面。开始时，先限制工具和上下文，再考虑修改全局运行时设置。

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    仅当模型或服务器在工具 schema 上稳定失败时，才使用 `compat.supportsTools: false`。它是以牺牲智能体能力来换取稳定性。
    `localModelLean` 会从智能体表面移除浏览器、cron 和消息工具，但不会改变 Ollama 的运行时上下文或 thinking 模式。对于会循环输出或把回复预算耗在隐藏推理上的小型 Qwen 风格 thinking 模型，请将它与显式的 `params.num_ctx` 和 `params.thinking: false` 搭配使用。

  </Accordion>
</AccordionGroup>

### 模型选择

配置完成后，你的所有 Ollama 模型都可用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

也支持自定义 Ollama provider id。当模型引用使用活动
provider 前缀时，例如 `ollama-spark/qwen3:32b`，OpenClaw 只会在调用 Ollama 前移除该
前缀，因此服务器接收到的是 `qwen3:32b`。

对于较慢的本地模型，优先考虑按 provider 范围进行请求调优，而不是提高整个智能体运行时超时：

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` 适用于模型 HTTP 请求，包括连接建立、
响应头、响应体流式传输，以及整个受保护 fetch 的中止。`params.keep_alive`
会作为顶层 `keep_alive` 转发给原生 `/api/chat` 的 Ollama 请求；
当首轮加载时间是瓶颈时，请按模型进行设置。

### 快速验证

```bash
# 对这台机器可见的 Ollama 守护进程
curl http://127.0.0.1:11434/api/tags

# OpenClaw 目录和已选模型
openclaw models list --provider ollama
openclaw models status

# 直接模型 smoke test
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

对于远程主机，请将 `127.0.0.1` 替换为 `baseUrl` 中使用的主机。如果 `curl` 可用但 OpenClaw 不可用，请检查 Gateway 网关是否运行在另一台机器、容器或服务账户下。

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web 搜索**，作为内置的 `web_search` provider。

| 属性 | 详情 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你配置的 Ollama 主机（如果设置了 `models.providers.ollama.baseUrl`，则使用它，否则使用 `http://127.0.0.1:11434`）；`https://ollama.com` 直接使用托管 API |
| 凭证 | 对已登录的本地 Ollama 主机无需密钥；对于直接使用 `https://ollama.com` 的搜索或受保护主机，使用 `OLLAMA_API_KEY` 或已配置的 provider 凭证 |
| 要求 | 本地/自托管主机必须正在运行并已通过 `ollama signin` 登录；直接使用托管搜索需要 `baseUrl: "https://ollama.com"` 外加真实的 Ollama API 密钥 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Ollama Web 搜索**，或者设置：

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

要通过 Ollama Cloud 直接使用托管搜索：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

对于已登录的本地守护进程，OpenClaw 使用该守护进程的 `/api/experimental/web_search` 代理。对于 `https://ollama.com`，它会直接调用托管的 `/api/web_search` 端点。

<Note>
完整的设置和行为细节，请参阅 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **在 OpenAI 兼容模式下，工具调用并不可靠。** 仅当你需要为代理使用 OpenAI 格式，并且不依赖原生工具调用行为时，才使用此模式。
    </Warning>

    如果你必须改用 OpenAI 兼容端点（例如，在只支持 OpenAI 格式的代理之后），请显式设置 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 默认值：true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    在该模式下，可能不支持同时进行流式传输和工具调用。你可能需要在模型配置中使用 `params: { streaming: false }` 关闭流式传输。

    当 Ollama 与 `api: "openai-completions"` 一起使用时，OpenClaw 默认会注入 `options.num_ctx`，这样 Ollama 就不会静默回退到 4096 的上下文窗口。如果你的代理/上游会拒绝未知的 `options` 字段，请禁用此行为：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="上下文窗口">
    对于自动发现的模型，OpenClaw 会在可用时使用 Ollama 报告的上下文窗口，包括来自自定义 Modelfile 的更大 `PARAMETER num_ctx` 值。否则，它会回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    你可以为该 Ollama provider 下的每个模型设置 provider 级别的默认 `contextWindow`、`contextTokens` 和 `maxTokens`，然后在需要时按模型覆盖。`contextWindow` 是 OpenClaw 的提示词和压缩预算。原生 Ollama 请求不会设置 `options.num_ctx`，除非你显式配置了 `params.num_ctx`，这样 Ollama 就可以应用它自己的模型、`OLLAMA_CONTEXT_LENGTH` 或基于 VRAM 的默认值。要在不重建 Modelfile 的情况下限制或强制指定 Ollama 每次请求的运行时上下文，请设置 `params.num_ctx`；无效、零、负数和非有限值都会被忽略。OpenAI 兼容的 Ollama 适配器仍会默认根据已配置的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果你的上游拒绝 `options`，请使用 `injectNumCtxForOpenAICompat: false` 禁用。

    原生 Ollama 模型条目也接受 `params` 下常见的 Ollama 运行时选项，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只会转发 Ollama 请求键，因此像 `streaming` 这样的 OpenClaw 运行时参数不会泄露给 Ollama。使用 `params.think` 或 `params.thinking` 发送顶层 Ollama `think`；对 Qwen 风格的 thinking 模型，`false` 会禁用 API 级 thinking。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    按模型设置的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可以生效。如果两者都配置了，显式的 provider 模型条目优先于智能体默认值。

  </Accordion>

  <Accordion title="Thinking 控制">
    对于原生 Ollama 模型，OpenClaw 会按 Ollama 期望的方式转发 thinking 控制：使用顶层 `think`，而不是 `options.think`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    你也可以设置模型默认值：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    按模型设置的 `params.think` 或 `params.thinking` 可以为特定已配置模型禁用或强制启用 Ollama API thinking。像 `/think off` 这样的运行时命令仍会作用于当前运行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为支持推理的模型。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要额外配置。OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的并且在本地运行，因此所有模型成本都设置为 $0。这同时适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="Memory embeddings">
    内置的 Ollama 插件为
    [memory search](/zh-CN/concepts/memory) 注册了一个 memory embedding provider。它使用已配置的 Ollama base URL
    和 API 密钥，调用 Ollama 当前的 `/api/embed` 端点，并在可能时
    将多个 memory 块批量合并到一个 `input` 请求中。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是 —— 如果 embedding 模型在本地不存在，会自动拉取 |

    查询时 embeddings 会对需要或建议此前缀的模型使用检索前缀，包括 `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。Memory 文档批次保持原始格式，因此现有索引不需要进行格式迁移。

    要将 Ollama 选为 memory search 的 embedding provider：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Ollama 的默认值。如果在更大的主机上重建索引过慢，可以调高。
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    对于远程 embedding 主机，请将凭证作用域限制在该主机上：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输配置">
    OpenClaw 的 Ollama 集成默认使用 **原生 Ollama API**（`/api/chat`），它完全支持同时进行流式传输和工具调用。不需要额外配置。

    对于原生 `/api/chat` 请求，OpenClaw 也会直接将 thinking 控制转发给 Ollama：`/think off` 和 `openclaw agent --thinking off` 会发送顶层 `think: false`，而 `/think low|medium|high` 会发送对应的顶层 `think` 强度字符串。`/think max` 会映射到 Ollama 的最高原生强度，即 `think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 兼容端点，请参阅上方的“旧版 OpenAI 兼容模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="WSL2 崩溃循环（反复重启）">
    在带有 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安装程序会创建一个 `ollama.service` systemd 单元，并设置 `Restart=always`。如果该服务在 WSL2 启动时自动启动并加载 GPU 支持的模型，Ollama 在模型加载期间可能会锁定主机内存。Hyper-V 的内存回收并不总能回收这些被锁定的页面，因此 Windows 可能会终止 WSL2 VM，systemd 又再次启动 Ollama，于是循环反复发生。

    常见证据：

    - Windows 侧反复出现 WSL2 重启或终止
    - WSL2 启动后不久，`app.slice` 或 `ollama.service` 出现高 CPU 占用
    - 来自 systemd 的 SIGTERM，而不是 Linux OOM-killer 事件

    当 OpenClaw 检测到 WSL2、启用了 `Restart=always` 的 `ollama.service` 以及可见的 CUDA 标记时，会记录一条启动警告。

    缓解方法：

    ```bash
    sudo systemctl disable ollama
    ```

    在 Windows 侧将以下内容添加到 `%USERPROFILE%\.wslconfig`，然后运行 `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    在 Ollama 服务环境中设置更短的 keep-alive，或者仅在需要时手动启动 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    请参阅 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="未检测到 Ollama">
    请确认 Ollama 正在运行，并且你已设置 `OLLAMA_API_KEY`（或 auth profile），同时你**没有**定义显式的 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 是否可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果列表中没有你的模型，请在本地拉取该模型，或者在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # 查看已安装的内容
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    检查 Ollama 是否运行在正确的端口上：

    ```bash
    # 检查 Ollama 是否正在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="远程主机可通过 curl 访问，但 OpenClaw 不行">
    请从运行 Gateway 网关的同一台机器和同一运行时环境中进行验证：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常见原因：

    - `baseUrl` 指向 `localhost`，但 Gateway 网关运行在 Docker 中或另一台主机上。
    - URL 使用了 `/v1`，这会选择 OpenAI 兼容行为，而不是原生 Ollama。
    - 远程主机在 Ollama 侧需要调整防火墙或局域网绑定设置。
    - 模型存在于你笔记本电脑上的守护进程中，但不在远程守护进程中。

  </Accordion>

  <Accordion title="模型将工具 JSON 作为文本输出">
    这通常意味着 provider 正在使用 OpenAI 兼容模式，或者模型无法处理工具 schema。

    请优先使用原生 Ollama 模式：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    如果小型本地模型在工具 schema 上仍然失败，请在该模型条目中设置 `compat.supportsTools: false`，然后重新测试。

  </Accordion>

  <Accordion title="冷启动本地模型超时">
    大型本地模型在开始流式输出之前，首次加载可能需要较长时间。请将超时限制在 Ollama provider 范围内，并可选择要求 Ollama 在轮次之间保持模型已加载：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    如果主机本身接受连接的速度较慢，`timeoutSeconds` 也会延长该 provider 的受保护 Undici 连接超时。

  </Accordion>

  <Accordion title="大上下文模型太慢或内存不足">
    许多 Ollama 模型声明的上下文长度，大于你的硬件能够舒适运行的范围。原生 Ollama 会使用它自己的运行时上下文默认值，除非你设置 `params.num_ctx`。当你想获得可预测的首 token 延迟时，请同时限制 OpenClaw 的预算和 Ollama 的请求上下文：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    如果 OpenClaw 发送的提示词过多，请先降低 `contextWindow`。如果 Ollama 加载的运行时上下文对机器来说过大，请降低 `params.num_ctx`。如果生成时间过长，请降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助： [故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有 provider、模型引用和故障切换行为的概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    由 Ollama 驱动的 Web 搜索的完整设置和行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整的配置参考。
  </Card>
</CardGroup>
