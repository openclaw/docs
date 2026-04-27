---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的安装与配置指南
    - 你想使用 Ollama 视觉模型进行图像理解
summary: 使用 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-04-27T11:00:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ed7ba98c3c6ed3f4b68a104349ac7597fe79f36d0a846bf364a1e2e09be7b5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw 与 Ollama 的原生 API（`/api/chat`）集成，可用于托管云模型以及本地/自托管 Ollama 服务器。你可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机实现 `Cloud + Local`、直接连接 `https://ollama.com` 的 `Cloud only`，以及连接可访问 Ollama 主机的 `Local only`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` OpenAI-compatible URL（`http://host:11434/v1`）。这会破坏工具调用，而且模型可能会把原始工具 JSON 当作纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不要带 `/v1`）。
</Warning>

Ollama provider 配置使用 `baseUrl` 作为规范键。OpenClaw 也接受 `baseURL` 以兼容 OpenAI SDK 风格示例，但新配置应优先使用 `baseUrl`。

## 认证规则

<AccordionGroup>
  <Accordion title="本地和 LAN 主机">
    本地和 LAN Ollama 主机不需要真实的 bearer token。对于 loopback、私有网络、`.local` 和裸主机名的 Ollama base URL，OpenClaw 仅使用本地 `ollama-local` 标记。
  </Accordion>
  <Accordion title="远程和 Ollama Cloud 主机">
    远程公网主机和 Ollama Cloud（`https://ollama.com`）需要通过 `OLLAMA_API_KEY`、auth profile 或 provider 的 `apiKey` 提供真实凭证。
  </Accordion>
  <Accordion title="自定义 provider id">
    设置了 `api: "ollama"` 的自定义 provider id 遵循相同规则。例如，指向私有 LAN Ollama 主机的 `ollama-remote` provider 可以使用 `apiKey: "ollama-local"`，子智能体会通过 Ollama provider hook 解析该标记，而不会将其视为缺失凭证。
  </Accordion>
  <Accordion title="记忆嵌入作用域">
    当 Ollama 用于记忆嵌入时，bearer 认证会限定在其声明所在的主机上：

    - provider 级密钥只会发送到该 provider 的 Ollama 主机。
    - `agents.*.memorySearch.remote.apiKey` 只会发送到其远程嵌入主机。
    - 纯 `OLLAMA_API_KEY` 环境变量值会被视为 Ollama Cloud 约定，默认不会发送到本地或自托管主机。

  </Accordion>
</AccordionGroup>

## 入门指南

选择你偏好的设置方式和模式。

<Tabs>
  <Tab title="新手引导（推荐）">
    **最适合：** 以最快路径完成可用的 Ollama 云端或本地设置。

    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        从 provider 列表中选择 **Ollama**。
      </Step>
      <Step title="选择你的模式">
        - **Cloud + Local** — 本地 Ollama 主机，加上通过该主机路由的云模型
        - **Cloud only** — 通过 `https://ollama.com` 使用托管 Ollama 模型
        - **Local only** — 仅使用本地模型
      </Step>
      <Step title="选择一个模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY` 并推荐托管云端默认模型。`Cloud + Local` 和 `Local only` 会要求输入 Ollama base URL、发现可用模型，并在所选本地模型尚不可用时自动拉取它。`Cloud + Local` 还会检查该 Ollama 主机是否已登录云端访问。
      </Step>
      <Step title="验证模型是否可用">
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

    也可以选择指定自定义 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **最适合：** 完全控制云端或本地设置。

    <Steps>
      <Step title="选择云端或本地">
        - **Cloud + Local**：安装 Ollama，使用 `ollama signin` 登录，并通过该主机路由云请求
        - **Cloud only**：配合 `OLLAMA_API_KEY` 使用 `https://ollama.com`
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

        # 或在配置文件中设置
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="检查并设置你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在配置中设置默认值：

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
    `Cloud + Local` 使用一个可访问的 Ollama 主机作为本地和云模型的统一控制点。这是 Ollama 推荐的混合流程。

    设置时使用 **Cloud + Local**。OpenClaw 会提示输入 Ollama base URL，从该主机发现本地模型，并检查该主机是否已通过 `ollama signin` 登录以访问云端。当主机已登录时，OpenClaw 还会推荐托管云端默认模型，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 会保持为仅本地设置，直到你运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 通过 Ollama 的托管 API `https://ollama.com` 运行。

    设置时使用 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并填充托管云模型列表。此路径**不**需要本地 Ollama 服务器或 `ollama signin`。

    在 `openclaw onboard` 期间显示的云模型列表会通过 `https://ollama.com/api/tags` 实时获取，最多 500 项，因此选择器反映的是当前托管目录，而不是静态预设。如果在设置时 `ollama.com` 不可达或未返回模型，OpenClaw 会回退到之前的硬编码建议，以确保新手引导仍可完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 会从已配置的 Ollama 实例发现模型。此路径适用于本地或自托管 Ollama 服务器。

    OpenClaw 当前推荐 `gemma4` 作为本地默认模型。

  </Tab>
</Tabs>

## 模型发现（隐式 provider）

当你设置 `OLLAMA_API_KEY`（或 auth profile），并且**没有**定义 `models.providers.ollama` 或其他设置了 `api: "ollama"` 的自定义远程 provider 时，OpenClaw 会从位于 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为 | 细节 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询 | 查询 `/api/tags` |
| 能力检测 | 使用尽力而为的 `/api/show` 查询来读取 `contextWindow`、扩展后的 `num_ctx` Modelfile 参数，以及包括 vision/tools 在内的能力 |
| 视觉模型 | 当 `/api/show` 报告 `vision` 能力时，这些模型会被标记为具备图像能力（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词 |
| 推理检测 | 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning` |
| Token 限制 | 将 `maxTokens` 设置为 OpenClaw 为 Ollama 使用的默认最大 token 上限 |
| 成本 | 所有成本均设为 `0` |

这样可以避免手动录入模型，同时保持目录与本地 Ollama 实例同步。

```bash
# 查看有哪些模型可用
ollama list
openclaw models list
```

要添加新模型，只需通过 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型会被自动发现并可立即使用。

<Note>
如果你显式设置了 `models.providers.ollama`，或配置了诸如 `models.providers.ollama-cloud` 且 `api: "ollama"` 的自定义远程 provider，则会跳过自动发现，你必须手动定义模型。诸如 `http://127.0.0.2:11434` 这样的 loopback 自定义 provider 仍会被视为本地。参见下方显式配置部分。
</Note>

## 视觉与图像描述

内置的 Ollama 插件会将 Ollama 注册为具备图像能力的媒体理解 provider。这使 OpenClaw 能够通过本地或托管的 Ollama 视觉模型来路由显式图像描述请求，以及已配置的图像模型默认值。

对于本地视觉，请拉取一个支持图像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然后使用 infer CLI 验证：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因为该模型支持原生视觉而跳过描述。

要将 Ollama 设为入站媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

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

较慢的本地视觉模型可能需要比云模型更长的图像理解超时时间。当 Ollama 试图在受限硬件上分配其宣称的完整视觉上下文时，它们也可能崩溃或停止。当你只需要普通图像描述轮次时，请设置能力超时，并在模型条目上限制 `num_ctx`：

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

这个超时适用于入站图像理解，也适用于智能体在轮次期间可以调用的显式 `image` 工具。provider 级别的 `models.providers.ollama.timeoutSeconds` 仍控制普通模型调用底层 Ollama HTTP 请求的保护时限。

可通过以下命令对本地 Ollama 执行显式图像工具的实时验证：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果你手动定义了 `models.providers.ollama.models`，请将视觉模型标记为支持图像输入：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

对于未标记为具备图像能力的模型，OpenClaw 会拒绝图像描述请求。在隐式发现模式下，当 `/api/show` 报告 vision 能力时，OpenClaw 会从 Ollama 中读取该信息。

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

  <Tab title="显式（手动模型）">
    当你需要托管云端设置、Ollama 运行在另一台主机/端口、你想强制指定特定上下文窗口或模型列表，或者你想完全手动定义模型时，请使用显式配置。

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
    如果 Ollama 运行在不同的主机或端口上（显式配置会禁用自动发现，因此你需要手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不要带 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置以确保使用原生工具调用行为
            timeoutSeconds: 300, // 可选：给冷启动的本地模型更多连接和流式输出时间
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 可选：在轮次之间保持模型已加载
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI-compatible 模式，而该模式下工具调用并不可靠。请使用不带路径后缀的基础 Ollama URL。
    </Warning>

  </Tab>
</Tabs>

## 常见配方

将以下内容作为起点，并把模型 id 替换为 `ollama list` 或 `openclaw models list --provider ollama` 中显示的精确名称。

<AccordionGroup>
  <Accordion title="带自动发现的本地模型">
    当 Ollama 与 Gateway 网关运行在同一台机器上，并且你希望 OpenClaw 自动发现已安装模型时，请使用此方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    这种方式可以让配置保持最简。除非你想手动定义模型，否则不要添加 `models.providers.ollama` 块。

  </Accordion>

  <Accordion title="带手动模型的 LAN Ollama 主机">
    对 LAN 主机请使用原生 Ollama URL。不要添加 `/v1`。

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

    `contextWindow` 是 OpenClaw 侧的上下文预算。`params.num_ctx` 会随请求发送给 Ollama。当你的硬件无法运行模型宣称的完整上下文时，请让两者保持一致。

  </Accordion>

  <Accordion title="仅 Ollama Cloud">
    当你不运行本地守护进程，并且想直接使用托管 Ollama 模型时，请使用此方式。

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
    当本地或 LAN Ollama 守护进程已使用 `ollama signin` 登录，并且应同时提供本地模型和 `:cloud` 模型时，请使用此方式。

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
    当你有多个 Ollama 服务器时，请使用自定义 provider id。每个 provider 都有自己的主机、模型、认证、超时和模型引用。

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

    当 OpenClaw 发送请求时，活动 provider 前缀会被移除，因此 `ollama-large/qwen3.5:27b` 到达 Ollama 时会变成 `qwen3.5:27b`。

  </Accordion>

  <Accordion title="精简的本地模型配置">
    有些本地模型可以回答简单提示，但在完整的智能体工具表面下会出现困难。在更改全局运行时设置之前，先尝试限制工具和上下文。

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

    仅当模型或服务器在工具 schema 上稳定失败时，才使用 `compat.supportsTools: false`。它是用智能体能力换取稳定性。
    `localModelLean` 会从智能体表面移除浏览器、cron 和消息工具，但不会改变 Ollama 的运行时上下文或思考模式。对于会循环或把响应预算花在隐藏推理上的小型 Qwen 风格思考模型，请将它与显式 `params.num_ctx` 和 `params.thinking: false` 搭配使用。

  </Accordion>
</AccordionGroup>

### 模型选择

一旦完成配置，你的所有 Ollama 模型都可用：

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

也支持自定义 Ollama provider id。当模型引用使用活动 provider 前缀时，例如 `ollama-spark/qwen3:32b`，OpenClaw 在调用 Ollama 前只会移除该前缀，因此服务器接收到的是 `qwen3:32b`。

对于较慢的本地模型，优先使用 provider 作用域的请求调优，而不是提高整个智能体运行时超时：

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

`timeoutSeconds` 适用于模型 HTTP 请求，包括连接建立、headers、body 流式传输以及整个受保护获取的中止。`params.keep_alive` 会作为顶层 `keep_alive` 转发给 Ollama 的原生 `/api/chat` 请求；当首轮加载时间是瓶颈时，请按模型设置它。

### 快速验证

```bash
# 此机器可见的 Ollama 守护进程
curl http://127.0.0.1:11434/api/tags

# OpenClaw 目录和当前选中的模型
openclaw models list --provider ollama
openclaw models status

# 直接模型冒烟测试
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

对于远程主机，请将 `127.0.0.1` 替换为 `baseUrl` 中使用的主机。如果 `curl` 可用但 OpenClaw 不行，请检查 Gateway 网关是否运行在不同的机器、容器或服务账号下。

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web 搜索** 作为内置的 `web_search` provider。

| 属性 | 细节 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机 | 使用你配置的 Ollama 主机（设置了 `models.providers.ollama.baseUrl` 时使用该值，否则使用 `http://127.0.0.1:11434`）；`https://ollama.com` 会直接使用托管 API |
| 认证 | 对已登录的本地 Ollama 主机无需密钥；对于直接 `https://ollama.com` 搜索或受认证保护的主机，则使用 `OLLAMA_API_KEY` 或已配置的 provider 认证 |
| 要求 | 本地/自托管主机必须正在运行，并且已通过 `ollama signin` 登录；直接托管搜索则需要 `baseUrl: "https://ollama.com"` 加上真实的 Ollama API 密钥 |

在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 **Ollama Web 搜索**，或设置：

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

若要通过 Ollama Cloud 直接进行托管搜索：

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

对于已登录的本地守护进程，OpenClaw 会使用该守护进程的 `/api/experimental/web_search` 代理。对于 `https://ollama.com`，它会直接调用托管的 `/api/web_search` 端点。

<Note>
有关完整的设置与行为细节，请参见 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI-compatible 模式">
    <Warning>
    **在 OpenAI-compatible 模式下，工具调用并不可靠。** 仅当你需要为某个代理使用 OpenAI 格式，且不依赖原生工具调用行为时，才使用此模式。
    </Warning>

    如果你必须改用 OpenAI-compatible 端点（例如位于仅支持 OpenAI 格式的代理之后），请显式设置 `api: "openai-completions"`：

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

    在此模式下，可能无法同时支持流式传输和工具调用。你可能需要在模型配置中使用 `params: { streaming: false }` 来禁用流式传输。

    当 Ollama 使用 `api: "openai-completions"` 时，OpenClaw 默认会注入 `options.num_ctx`，以避免 Ollama 静默回退到 4096 的上下文窗口。如果你的代理/上游拒绝未知的 `options` 字段，请禁用此行为：

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
    对于自动发现的模型，OpenClaw 会在可用时使用 Ollama 报告的上下文窗口，包括来自自定义 Modelfile 的更大 `PARAMETER num_ctx` 值。否则，它会回退到 OpenClaw 为 Ollama 使用的默认上下文窗口。

    你可以为该 Ollama provider 下的每个模型设置 provider 级别的 `contextWindow`、`contextTokens` 和 `maxTokens` 默认值，并在需要时按模型覆盖。`contextWindow` 是 OpenClaw 的提示词和压缩预算。原生 Ollama 请求默认不会设置 `options.num_ctx`，除非你显式配置了 `params.num_ctx`，这样 Ollama 就可以应用它自己的模型、`OLLAMA_CONTEXT_LENGTH` 或基于 VRAM 的默认值。若要在不重建 Modelfile 的情况下限制或强制 Ollama 的每请求运行时上下文，请设置 `params.num_ctx`；无效值、零、负数和非有限值都会被忽略。OpenAI-compatible Ollama 适配器仍会默认从配置的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果你的上游拒绝 `options`，可通过 `injectNumCtxForOpenAICompat: false` 禁用此行为。

    原生 Ollama 模型条目也接受位于 `params` 下的常见 Ollama 运行时选项，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 只会转发 Ollama 请求键，因此像 `streaming` 这样的 OpenClaw 运行时参数不会泄漏给 Ollama。使用 `params.think` 或 `params.thinking` 来发送顶层 Ollama `think`；对 Qwen 风格的思考模型来说，`false` 会禁用 API 级思考。

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

    也可以使用按模型设置的 `agents.defaults.models["ollama/<model>"].params.num_ctx`。如果两者都已配置，则显式 provider 模型条目优先生效。

  </Accordion>

  <Accordion title="思考控制">
    对于原生 Ollama 模型，OpenClaw 会按照 Ollama 的预期转发思考控制：使用顶层 `think`，而不是 `options.think`。

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

    按模型设置的 `params.think` 或 `params.thinking` 可为某个已配置模型禁用或强制启用 Ollama API 思考。像 `/think off` 这样的运行时命令仍会作用于当前运行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认会将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为具备推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    无需额外配置。OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的，并且在本地运行，因此所有模型成本都设为 $0。这同时适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="记忆嵌入">
    内置的 Ollama 插件会为 [memory search](/zh-CN/concepts/memory) 注册一个记忆嵌入 provider。它使用已配置的 Ollama base URL 和 API 密钥，调用 Ollama 当前的 `/api/embed` 端点，并在可能时将多个记忆分块批量合并到一次 `input` 请求中。

    | 属性 | 值 |
    | ------------- | ------------------- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是 — 如果嵌入模型在本地不存在，会自动拉取 |

    查询时嵌入会为那些需要或推荐检索前缀的模型使用对应前缀，包括 `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。记忆文档批次则保持原始形式，因此现有索引无需进行格式迁移。

    要选择 Ollama 作为记忆搜索嵌入 provider：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

    对于远程嵌入主机，请将认证限定在该主机范围内：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              model: "nomic-embed-text",
              apiKey: "ollama-local",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输配置">
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），它完全支持同时进行流式传输和工具调用。无需任何特殊配置。

    对于原生 `/api/chat` 请求，OpenClaw 也会直接将思考控制转发给 Ollama：`/think off` 和 `openclaw agent --thinking off` 会发送顶层 `think: false`，而 `/think low|medium|high` 会发送匹配的顶层 `think` 努力度字符串。`/think max` 会映射到 Ollama 的最高原生努力级别，即 `think: "high"`。

    <Tip>
    如果你需要使用 OpenAI-compatible 端点，请参见上面的“旧版 OpenAI-compatible 模式”部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="未检测到 Ollama">
    请确保 Ollama 正在运行，并且你已设置 `OLLAMA_API_KEY`（或 auth profile），同时**没有**定义显式的 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 是否可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果你的模型未列出，请在本地拉取该模型，或在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # 查看已安装的模型
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    检查 Ollama 是否运行在正确的端口上：

    ```bash
    # 检查 Ollama 是否在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="远程主机用 curl 可用，但 OpenClaw 不行">
    请从运行 Gateway 网关的同一台机器和运行时环境中进行验证：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常见原因：

    - `baseUrl` 指向 `localhost`，但 Gateway 网关运行在 Docker 中或另一台主机上。
    - URL 使用了 `/v1`，从而选择了 OpenAI-compatible 行为，而非原生 Ollama。
    - 远程主机在 Ollama 侧需要调整防火墙或 LAN 绑定。
    - 模型存在于你笔记本电脑的守护进程中，但不在远程守护进程中。

  </Accordion>

  <Accordion title="模型将工具 JSON 作为文本输出">
    这通常意味着 provider 正在使用 OpenAI-compatible 模式，或者模型无法处理工具 schema。

    优先使用原生 Ollama 模式：

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

    如果某个小型本地模型仍然在工具 schema 上失败，请在该模型条目中设置 `compat.supportsTools: false`，然后重新测试。

  </Accordion>

  <Accordion title="冷启动本地模型超时">
    大型本地模型在开始流式输出之前，首次加载可能需要很长时间。请将超时保持在 Ollama provider 作用域内，并可选择要求 Ollama 在轮次之间保持模型已加载：

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

    如果主机本身建立连接就很慢，`timeoutSeconds` 也会延长该 provider 的受保护 Undici 连接超时。

  </Accordion>

  <Accordion title="大上下文模型太慢或内存不足">
    许多 Ollama 模型宣称的上下文大小超出了你的硬件能够舒适运行的范围。原生 Ollama 会使用它自己的运行时上下文默认值，除非你设置 `params.num_ctx`。当你需要可预测的首 token 延迟时，请同时限制 OpenClaw 的预算和 Ollama 的请求上下文：

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

    如果 OpenClaw 发送的提示词过多，请先降低 `contextWindow`。如果 Ollama 加载的运行时上下文对机器来说过大，请降低 `params.num_ctx`。如果生成过程太长，请降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    由 Ollama 驱动的网页搜索的完整设置与行为细节。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
