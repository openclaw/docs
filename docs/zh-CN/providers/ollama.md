---
read_when:
    - 你想通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 设置和配置指导
    - 你想使用 Ollama 视觉模型来理解图像
summary: 使用 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-07-05T11:36:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11984ebca98d7b98f1c89e6820fd29524ec41a38ca4a403260e322dbf55a75e2
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 使用 Ollama 的原生 API（`/api/chat`），而不是兼容 OpenAI 的
`/v1` 端点。支持三种模式：

| 模式          | 使用内容                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| 云端 + 本地 | 可访问的 Ollama 主机，提供本地模型，以及（如果已登录）`:cloud` 模型 |
| 仅云端    | 直接使用 `https://ollama.com`，不需要本地守护进程                                   |
| 仅本地    | 可访问的 Ollama 主机，仅本地模型                                       |

如需使用专用 `ollama-cloud` 提供商 id 进行仅云端设置，请参阅
[Ollama Cloud](/zh-CN/providers/ollama-cloud)。当你希望云端路由与本地 `ollama` 提供商分开时，请使用 `ollama-cloud/<model>` 引用。

<Warning>
不要使用兼容 OpenAI 的 `/v1` URL（`http://host:11434/v1`）。它会破坏工具调用，模型可能会把原始工具调用 JSON 作为纯文本输出。请使用原生 URL：`baseUrl: "http://host:11434"`（不带 `/v1`）。
</Warning>

规范配置键是 `baseUrl`。也接受 `baseURL`，用于
OpenAI SDK 风格的示例，但新配置应使用 `baseUrl`。

## 凭证规则

<AccordionGroup>
  <Accordion title="本地和 LAN 主机">
    Loopback、私有网络、`.local` 和裸主机名 Ollama URL 不需要真实的 bearer token。OpenClaw 对这些地址使用 `ollama-local` 标记。
  </Accordion>
  <Accordion title="远程和 Ollama Cloud 主机">
    公共远程主机和 `https://ollama.com` 需要真实凭据：`OLLAMA_API_KEY`、凭证配置文件，或提供商的 `apiKey`。如需直接托管使用，优先使用 `ollama-cloud` 提供商。
  </Accordion>
  <Accordion title="自定义提供商 id">
    带有 `api: "ollama"` 的自定义提供商遵循相同规则。例如，指向私有 LAN 主机的 `ollama-remote` 提供商可以使用 `apiKey: "ollama-local"`；子智能体会通过 Ollama 提供商钩子解析该标记，而不是把它当作缺失凭据处理。`agents.defaults.memorySearch.provider` 也可以指向自定义提供商 id，让嵌入使用该 Ollama 端点。
  </Accordion>
  <Accordion title="凭证配置文件">
    `auth-profiles.json` 存储提供商 id 的凭据；请将端点设置（`baseUrl`、`api`、模型、headers、超时）放在 `models.providers.<id>` 中。较旧的扁平文件，例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`，不是运行时格式；`openclaw doctor --fix` 会将它们重写为规范的 `ollama-windows:default` API key 配置文件并创建备份。该旧文件中的 `baseUrl` 值是噪声，应移至提供商配置。
  </Accordion>
  <Accordion title="记忆嵌入范围">
    Ollama 记忆嵌入的 bearer 凭证仅限于声明它的主机：

    - 提供商级 key 只会发送到该提供商的主机。
    - `agents.*.memorySearch.remote.apiKey` 只会发送到其远程嵌入主机。
    - 纯 `OLLAMA_API_KEY` 环境变量值会被视为 Ollama Cloud 约定，默认不会发送到本地/自托管主机。

  </Accordion>
</AccordionGroup>

## 入门指南

<Tabs>
  <Tab title="新手引导（推荐）">
    <Steps>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard
        ```

        选择 **Ollama**，然后选择一种模式：**云端 + 本地**、**仅云端** 或 **仅本地**。
      </Step>
      <Step title="选择模型">
        `仅云端` 会提示输入 `OLLAMA_API_KEY`，并建议托管云端默认值。`云端 + 本地` 和 `仅本地` 会提示输入 Ollama base URL，发现可用模型，并在所选本地模型缺失时自动拉取。已安装的 `:latest` 标签（例如 `gemma4:latest`）只显示一次，而不会重复显示 `gemma4`。`云端 + 本地` 还会检查主机是否已登录以访问云端。
      </Step>
      <Step title="验证">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    非交互式：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` 和 `--custom-model-id` 是可选的；省略它们会使用本地默认主机和建议的 `gemma4` 模型。

  </Tab>

  <Tab title="手动设置">
    <Steps>
      <Step title="安装并启动 Ollama">
        从 [ollama.com/download](https://ollama.com/download) 获取，然后拉取一个模型：

        ```bash
        ollama pull gemma4
        ```

        如需混合云端访问，请在同一主机上运行 `ollama signin`。
      </Step>
      <Step title="设置凭据">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # 本地/LAN 主机，任意值都可用
        export OLLAMA_API_KEY="your-real-key"   # 仅用于 https://ollama.com
        ```

        或在配置中设置：`openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`。
      </Step>
      <Step title="选择模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在配置中设置：

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

## 通过本地主机使用云端模型

`云端 + 本地` 会通过一个可访问的 Ollama 主机路由本地模型和 `:cloud` 模型，这是 Ollama 的混合流程，也是你同时需要两者时应在设置期间选择的模式。

OpenClaw 会提示输入 base URL，发现本地模型，并检查
`ollama signin` 状态。登录后，它会建议托管默认值
（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）。如果
未登录，设置会保持为仅本地，直到你运行 `ollama signin`。

如需在没有本地守护进程的情况下进行仅云端访问，请使用 `openclaw onboard --auth-choice ollama-cloud` 并参阅 [Ollama Cloud](/zh-CN/providers/ollama-cloud)，该路径不需要 `ollama signin` 或运行中的服务器：

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 期间显示的云端模型列表会从
`https://ollama.com/api/tags` 实时填充，上限为 500 个条目，因此选择器会反映当前托管目录。如果 `ollama.com` 不可达或在设置时没有返回模型，OpenClaw 会回退到其硬编码建议列表，以便新手引导仍能完成。

## 模型发现（隐式提供商）

当设置了 `OLLAMA_API_KEY`（或凭证配置文件），并且既未定义
`models.providers.ollama`，也未定义另一个带有 `api: "ollama"` 的自定义提供商时，OpenClaw 会从 `http://127.0.0.1:11434` 发现模型：

| 行为             | 详情                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 能力检测 | 尽力读取 `/api/show` 中的 `contextWindow`、`num_ctx` Modelfile 参数和能力（vision/tools/thinking）                                                                                                                                                                       |
| 视觉模型        | 来自 `/api/show` 的 `vision` 能力会将模型标记为支持图像（`input: ["text", "image"]`）                                                                                                                                                                                             |
| 推理检测  | 可用时使用来自 `/api/show` 的 `thinking` 能力；当 Ollama 省略能力时，回退到名称启发式规则（`r1`、`reason`、`reasoning`、`think`）。无论报告的能力如何，`glm-5.2:cloud` 和 `deepseek-v4-flash\|pro:cloud` 始终被视为推理模型。 |
| Token 限制         | `maxTokens` 默认使用 OpenClaw 的 Ollama 最大 token 上限                                                                                                                                                                                                                                       |
| 成本                | 所有成本均为 `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

使用显式 `models` 数组设置 `models.providers.ollama`，或使用带有 `api: "ollama"` 和非 loopback `baseUrl` 的自定义提供商，会禁用自动发现；之后必须手动定义模型（请参阅
[配置](#configuration)）。指向托管 `https://ollama.com` 的 `models.providers.ollama` 条目也会跳过发现，因为 Ollama Cloud 模型由提供商管理。诸如
`http://127.0.0.2:11434` 的 loopback 自定义提供商仍会被视为本地，并保留自动发现。

你可以使用完整引用，例如 `ollama/<pulled-model>:latest`，而不需要手写 `models.json` 条目；OpenClaw 会实时解析它。对于已登录的主机，选择未列出的 `ollama/<model>:cloud` 引用时，会用 `/api/show` 验证该精确模型，并且仅在 Ollama 确认元数据时将其加入运行时目录，拼写错误仍会以未知模型失败。

### 冒烟测试

用于跳过完整智能体工具表面的窄文本探测：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

为精简视觉模型探测添加带图像的 `--file`（接受 PNG/JPEG/WebP；非图像文件会在调用 Ollama 之前被拒绝，请将 `openclaw infer audio transcribe` 用于音频）：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

这两个路径都不会加载聊天工具、记忆或会话上下文。如果它成功而正常智能体回复失败，问题很可能是模型的工具/智能体能力，而不是端点。

使用 `/model ollama/<model>` 选择模型是精确的用户选择：如果配置的 `baseUrl` 不可达，下一次回复会因提供商错误而失败，而不会静默回退到另一个已配置模型。

隔离的 cron 作业在启动智能体轮次前会添加一个本地安全检查：如果所选模型解析到本地/私有网络/`.local` Ollama 提供商，并且 `/api/tags` 不可达，OpenClaw 会将该运行记录为 `skipped`，并在错误文本中包含模型。此端点检查会按主机缓存 5 分钟，因此针对已停止守护进程的重复 cron 作业不会全部启动失败请求。

实时验证：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

对于 Ollama Cloud，将同一个实时测试指向托管端点（默认跳过
embeddings；如需强制启用，请设置 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`，因为
cloud key 可能未授权 `/api/embed`）：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

要添加模型，拉取它后会自动被发现：

```bash
ollama pull mistral
```

## 节点本地推理

智能体可以将一个短任务委托给已配对桌面或服务器节点上的 Ollama 模型。
提示词和响应会通过现有已认证的 Gateway 网关/节点连接传输；请求会在节点自己的
loopback Ollama 端点（`http://127.0.0.1:11434`）上运行。

<Steps>
  <Step title="在节点上启动 Ollama">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="连接节点主机">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    在 Gateway 网关主机上批准该设备及其节点命令，然后验证：

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    首次连接，或添加 Ollama 命令的升级，可能会触发节点命令审批。
    如果节点连接后没有声明 `ollama.models` 和 `ollama.chat`，请再次检查
    `openclaw nodes pending`。

  </Step>
  <Step title="从智能体使用它">
    内置 Ollama 插件会暴露 `node_inference` 工具。智能体先调用
    `action: "discover"`，然后使用结果中的节点和模型调用 `action: "run"`
    （当只有一个具备能力的节点已连接时，`run` 可以省略节点）。例如：“发现我的节点上的 Ollama 模型，然后使用加载速度最快的模型总结这段文本。”
  </Step>
</Steps>

设备发现会读取 `/api/tags`，检查 `/api/show` 能力，并在可用时使用
`/api/ps` 优先排序已加载的模型。它只返回 Ollama 报告为具备聊天能力
（`completion` 能力）的本地模型；Ollama Cloud 行和仅 embedding 的模型会被排除。
每次运行都会禁用模型思考，并默认将输出限制为 512 tokens（硬上限 8192），
除非工具调用请求不同的 `maxTokens`；某些模型（例如 GPT-OSS）不支持禁用思考，
仍可能输出推理 tokens。

要让 Ollama 在节点上持续运行但不暴露给智能体：

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

重启节点（`openclaw node restart`，或对于前台会话，停止并重新运行
`openclaw node run`）。节点会停止声明 `ollama.models` 和 `ollama.chat`；
Ollama 本身和 Gateway 网关的 Ollama 提供商不受影响。将该值改回 `true`
并重启即可重新启用；命令表面的变更可能需要在重新连接后再次通过
`openclaw nodes pending` 审批。

无需智能体轮次即可直接验证节点命令：

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` 限制节点可用于运行命令的时长；
`--timeout` 限制整个 Gateway 网关调用，应设置得更大。

节点本地推理始终使用节点自己的 loopback 端点，不会复用已配置的远程/cloud
`models.providers.ollama.baseUrl`。节点命令默认在 macOS、Linux 和 Windows
节点主机上可用，并仍受正常节点配对/命令策略约束。

## 视觉和图像描述

内置 Ollama 插件会将 Ollama 注册为具备图像能力的媒体理解提供商，因此
OpenClaw 可以将显式图像描述请求和已配置的图像模型默认值路由到本地或托管的
Ollama 视觉模型。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` 必须是完整的 `<provider/model>` 引用；设置后，`infer image
describe` 会先尝试该模型，而不是对已经原生支持视觉的模型跳过描述。
如果调用失败，OpenClaw 可以继续尝试 `agents.defaults.imageModel.fallbacks`；
文件/URL 准备错误会在尝试 fallback 前失败。使用 `infer image describe`
运行 OpenClaw 的图像理解流程和已配置的 `imageModel`；使用 `infer model run
--file` 通过自定义提示词进行原始多模态探测。

要将 Ollama 设为入站媒体的默认图像理解提供商：

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

优先使用完整的 `ollama/<model>` 引用。裸 `imageModel` 引用（例如
`qwen2.5vl:7b`）只有在该精确模型列在 `models.providers.ollama.models`
下、包含 `input: ["text", "image"]`，且没有其他已配置的图像提供商暴露相同裸 id
时，才会规范化为 `ollama/qwen2.5vl:7b`；否则请显式使用提供商前缀。

较慢的本地视觉模型可能需要比 cloud 模型更长的图像理解超时，并且如果 Ollama
尝试分配模型完整声明的视觉上下文，可能会在受限硬件上崩溃。设置能力超时并限制
`num_ctx`：

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

此超时适用于入站图像理解和显式 `image` 工具。
`models.providers.ollama.timeoutSeconds` 仍控制普通模型调用底层 Ollama
HTTP 请求的保护超时。

实时验证：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果你手动定义 `models.providers.ollama.models`，请显式标记视觉模型：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝对未标记为具备图像能力的模型发起图像描述请求。使用隐式设备发现时，
这来自 `/api/show` 的视觉能力。

## 配置

<Tabs>
  <Tab title="基础（隐式设备发现）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，你可以在提供商条目中省略 `apiKey`；OpenClaw 会为可用性检查填入它。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    对于托管 cloud 设置、非默认主机/端口、强制上下文窗口，或完全手动的模型列表，
    请使用显式配置：

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

  <Tab title="自定义基础 URL">
    显式配置会禁用自动设备发现，因此必须列出模型：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要添加 `/v1`。该路径会选择 OpenAI 兼容模式，而在该模式下工具调用不可靠。
    </Warning>

  </Tab>
</Tabs>

## 常用配方

将模型 ID 替换为 `ollama list` 或
`openclaw models list --provider ollama` 中的精确名称。

<AccordionGroup>
  <Accordion title="使用自动设备发现的本地模型">
    与 Gateway 网关位于同一台机器上的 Ollama，会被自动发现：

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    除非你需要手动模型，否则不要添加 `models.providers.ollama` 块。

  </Accordion>

  <Accordion title="带手动模型的 LAN Ollama 主机">
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

    `contextWindow` 是 OpenClaw 的上下文预算；`params.num_ctx` 会发送给
    Ollama。当硬件无法运行模型完整声明的上下文时，请保持二者一致。

  </Accordion>

  <Accordion title="仅 Ollama Cloud">
    没有本地守护进程，直接使用托管模型：

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

    如需使用专用的 `ollama-cloud` 提供商 id，而不是这种配置形态，请参阅
    [Ollama Cloud](/zh-CN/providers/ollama-cloud)。

  </Accordion>

  <Accordion title="通过已登录守护进程同时使用 cloud 和本地">
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

  <Accordion title="Multiple Ollama hosts">
    运行多个 Ollama 服务器时使用自定义提供商 ID；每个提供商都有自己的主机、模型、身份验证和超时设置。

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

    OpenClaw 会在调用 Ollama 前去掉活动提供商前缀（回退到裸 `ollama/` 前缀），因此 `ollama-large/qwen3.5:27b` 会以 `qwen3.5:27b` 发送到 Ollama。

  </Accordion>

  <Accordion title="Lean local model profile">
    一些本地模型可以处理简单提示词，但难以应对完整的智能体工具表面。在触碰全局运行时设置前，先限制工具和上下文：

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
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

    仅当模型或服务器在工具 schema 上会稳定失败时，才使用 `compat.supportsTools: false`，它会以智能体能力换取稳定性。`localModelLean` 会从直接智能体表面移除浏览器、cron 和消息工具（如果运行需要直接消息投递语义，则保留消息），并把更大的目录放到工具搜索后面，但不会改变 Ollama 的运行时上下文或思考模式。对于会循环或把预算花在隐藏推理上的小型 Qwen 风格思考模型，将它与 `params.num_ctx` 和 `params.thinking: false` 搭配使用。

  </Accordion>
</AccordionGroup>

### 模型选择

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

自定义提供商 ID 的工作方式相同：对于使用活动提供商前缀的 ref，例如 `ollama-spark/qwen3:32b`，OpenClaw 会在调用 Ollama 前去掉该前缀，发送 `qwen3:32b`。

对于较慢的本地模型，优先使用按提供商限定的调优，再考虑提高整个智能体运行时超时：

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

`timeoutSeconds` 覆盖模型 HTTP 请求：连接建立、标头、正文流式传输，以及受保护 fetch 的总中止时间。`params.keep_alive` 会在原生 `/api/chat` 请求中作为顶层 `keep_alive` 转发；当首轮加载时间是瓶颈时，按模型设置它。

### 快速验证

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

对于远程主机，将 `127.0.0.1` 替换为 `baseUrl` 主机。如果 `curl` 可用但 OpenClaw 不可用，请检查 Gateway 网关是否运行在不同的机器、容器或服务账号上。

## Ollama Web 搜索

OpenClaw 将 **Ollama Web 搜索** 内置为 `web_search` 提供商。

| 属性        | 详情                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机        | 设置时为 `models.providers.ollama.baseUrl`，否则为 `http://127.0.0.1:11434`；`https://ollama.com` 会直接使用托管 API                          |
| 身份验证        | 对已登录的本地主机无需密钥；对直接 `https://ollama.com` 搜索或受身份验证保护的主机，使用 `OLLAMA_API_KEY` 或配置的提供商身份验证           |
| 要求 | 本地/自托管主机必须正在运行并已通过 `ollama signin` 登录；直接托管搜索需要 `baseUrl: "https://ollama.com"` 加真实 API 密钥 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择它，或设置：

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

对于通过 Ollama Cloud 进行的直接托管搜索：

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

对于自托管主机，OpenClaw 会先尝试本地 `/api/experimental/web_search` 代理，然后回退到同一主机上的托管 `/api/web_search` 路径；已登录的本地 daemon 通常会通过本地代理响应。直接 `https://ollama.com` 调用始终使用托管的 `/api/web_search` 端点。

<Note>
完整设置和行为请参见 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **此模式下工具调用不可靠。** 仅在代理需要 OpenAI 格式且你不依赖原生工具调用时使用。
    </Warning>

    对 `/v1/chat/completions` 后面的代理显式设置 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    此模式可能不支持同时进行流式传输和工具调用；你可能需要在模型上设置 `params: { streaming: false }`。

    OpenClaw 在此模式下默认注入 `options.num_ctx`，因此 Ollama 不会静默回退到 4096-token 上下文。如果你的代理拒绝未知 `options` 字段，请禁用它：

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

  <Accordion title="Context windows">
    对于自动发现的模型，OpenClaw 会使用 `/api/show` 报告的上下文窗口，包括来自自定义 Modelfile 的更大 `PARAMETER num_ctx` 值；否则会回退到 OpenClaw 的默认 Ollama 上下文窗口。

    提供商级 `contextWindow`、`contextTokens` 和 `maxTokens` 会为该提供商下的每个模型设置默认值，并且可按模型覆盖。`contextWindow` 是 OpenClaw 自己的提示词/压缩预算。原生 `/api/chat` 请求会保持 `options.num_ctx` 未设置，除非你显式设置 `params.num_ctx`，因此 Ollama 会应用它自己的模型、`OLLAMA_CONTEXT_LENGTH` 或基于 VRAM 的默认值；无效、零、负数或非有限的 `params.num_ctx` 值会被忽略。如果旧配置只使用 `contextWindow`/`maxTokens` 来强制原生请求上下文，请运行 `openclaw doctor --fix` 将它们复制到 `params.num_ctx`。OpenAI 兼容适配器仍会默认从配置的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果上游拒绝 `options`，请使用 `injectNumCtxForOpenAICompat: false` 禁用。

    原生模型条目也接受 `params` 下的常用 Ollama 运行时选项，并作为原生 `/api/chat` `options` 转发：`num_keep`、`seed`、`num_predict`、`top_k`、`top_p`、`min_p`、`typical_p`、`repeat_last_n`、`temperature`、`repeat_penalty`、`presence_penalty`、`frequency_penalty`、`stop`、`num_batch`、`num_gpu`、`main_gpu`、`use_mmap` 和 `num_thread`。少数键（`format`、`keep_alive`、`truncate`、`shift`）会作为顶层请求字段转发，而不是嵌套的 `options`。OpenClaw 只转发这些 Ollama 请求键，因此仅运行时参数（如 `streaming`）绝不会发送给 Ollama。使用 `params.think`（或 `params.thinking`）设置顶层 `think`；`false` 会为 Qwen 风格思考模型禁用 API 级思考。

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

    按模型设置的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也有效；如果两者都设置，显式的提供商模型条目优先。

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw 会按 Ollama 期望的方式转发思考：使用顶层 `think`，而不是 `options.think`。当自动发现模型的 `/api/show` 报告 `thinking` 能力时，会暴露 `/think low`、`/think medium`、`/think high` 和 `/think max`；非思考模型只暴露 `/think off`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    或设置模型默认值：

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

    每个模型的 `params.think`/`params.thinking` 可以为特定模型禁用或强制启用 API
    思考。OpenClaw 会在当前运行仅有隐式 `off` 默认值时保留该显式配置；非 `off`
    的运行时命令（例如 `/think medium`）仍会覆盖它。真值的思考请求绝不会发送给显式标记为
    `reasoning: false` 的模型；`think: false` 请求始终会发送。

  </Accordion>

  <Accordion title="推理模型">
    名称为 `deepseek-r1`、`reasoning`、`reason` 或 `think` 的模型默认会被视为
    具备推理能力，无需额外配置：

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="模型成本">
    Ollama 在本地运行且免费，因此无论是自动发现的模型还是手动定义的模型，所有模型成本都是 `0`。
  </Accordion>

  <Accordion title="记忆嵌入">
    内置的 Ollama 插件会为 [记忆搜索](/zh-CN/concepts/memory) 注册一个记忆嵌入提供商。
    它使用已配置的 Ollama 基础 URL 和 API key，调用 `/api/embed`，并在可能时将多个记忆片段批量合并到一个
    `input` 请求中。

    当 `proxy.enabled=true` 时，发送到根据已配置 `baseUrl` 推导出的精确主机本地
    loopback 源的嵌入请求，会使用 OpenClaw 的受保护直连路径，而不是托管转发代理。
    已配置的主机名本身必须是 `localhost` 或 loopback IP 字面量；仅解析到 loopback 的 DNS 名称仍会使用托管代理路径。LAN、
    tailnet、私有网络和公共 Ollama 主机始终保留在托管代理路径上，并且重定向到其他主机/端口不会继承信任。
    `proxy.loopbackMode: "proxy"` 仍会通过代理路由 loopback 流量；`proxy.loopbackMode: "block"` 会在连接前拒绝它。
    请参阅 [托管代理](/zh-CN/security/network-proxy#gateway-loopback-mode)。

    | 属性 | 值 |
    | --- | --- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是，如果本地不存在 |
    | 默认内联并发 | 1（其他提供商默认值更高；如果主机可以承受，可用 `nonBatchConcurrency` 提高） |

    查询时嵌入会为要求或推荐使用检索前缀的模型使用检索前缀：`nomic-embed-text`、`qwen3-embedding` 和
    `mxbai-embed-large`。文档批次保持原始格式，因此现有索引不需要格式迁移。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
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
    Ollama 默认使用**原生 API**（`/api/chat`），它同时支持流式传输和工具调用，无需特殊配置。

    对于原生请求，思考控制会直接转发：`/think off`
    和 `openclaw agent --thinking off` 会发送顶层 `think: false`，除非配置了显式
    `params.think`/`params.thinking`；`/think
    low|medium|high` 会发送匹配的 effort 字符串；`/think max` 会映射到
    Ollama 的最高 effort，即 `think: "high"`。

    <Tip>
    如需改用 OpenAI 兼容端点，请参阅上文“旧版 OpenAI 兼容模式”；在那里，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排查

<AccordionGroup>
  <Accordion title="WSL2 崩溃循环（反复重启）">
    在配备 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安装程序会创建一个带有
    `Restart=always` 的 `ollama.service` systemd 单元。如果该服务自动启动，并在 WSL2 启动期间加载 GPU 支持的模型，Ollama 可能会在加载时占用主机内存；Hyper-V 内存回收不一定总能回收这些页面，因此 Windows 可能会终止 WSL2 VM，systemd 随后重启
    Ollama，循环便会重复。

    证据：WSL2 反复重启/终止，WSL2 启动后 `app.slice` 或
    `ollama.service` 中 CPU 占用很高，以及来自 systemd 而非 Linux OOM killer 的 SIGTERM。

    当 OpenClaw 检测到 WSL2、启用了带有 `Restart=always` 的 `ollama.service`，并且存在可见的 CUDA 标记时，会记录启动警告。

    缓解方法：

    ```bash
    sudo systemctl disable ollama
    ```

    在 Windows 端，将以下内容添加到 `%USERPROFILE%\.wslconfig`，然后运行
    `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    或者缩短 keep-alive / 仅在需要时手动启动 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    请参阅 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="未检测到 Ollama">
    确认 Ollama 正在运行，已设置 `OLLAMA_API_KEY`（或认证配置文件），并且
    `models.providers.ollama` **没有**被显式定义：

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    在本地拉取模型，或在 `models.providers.ollama` 中显式定义它：

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="远程主机可通过 curl 使用，但 OpenClaw 不可用">
    请从运行 Gateway 网关的同一台机器和同一运行时进行验证：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常见原因：

    - `baseUrl` 指向 `localhost`，但 Gateway 网关在 Docker 中或另一台主机上运行。
    - URL 使用 `/v1`，选择了 OpenAI 兼容行为而非原生 Ollama。
    - 远程主机需要调整防火墙或 LAN 绑定。
    - 模型在你的笔记本电脑守护进程上，但不在远程守护进程上。

  </Accordion>

  <Accordion title="模型将工具 JSON 作为文本输出">
    通常是因为提供商处于 OpenAI 兼容模式，或模型无法处理工具 schema。优先使用原生模式：

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

    如果小型本地模型仍无法处理工具 schema，请在该模型条目上设置
    `compat.supportsTools: false`，然后重新测试。

  </Accordion>

  <Accordion title="Kimi 或 GLM 返回乱码符号">
    托管 Kimi/GLM 返回的长篇非语言符号串会被视为一次失败的提供商调用，而不是成功回复，因此会进入正常的重试/回退/错误处理流程，而不会将损坏文本持久化到会话中。

    如果问题再次出现，请捕获模型名称、当前会话文件，以及该次运行使用的是 `Cloud + Local` 还是 `Cloud only`，然后尝试新的会话和回退模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷启动本地模型超时">
    大型本地模型可能需要很长的首次加载时间。将超时范围限定到
    Ollama 提供商，并可选择在轮次之间保持模型加载：

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

    如果主机本身接受连接较慢，`timeoutSeconds` 也会延长该提供商的受保护连接超时。

  </Accordion>

  <Accordion title="大上下文模型太慢或内存不足">
    许多模型宣称的上下文长度超过你的硬件可以舒适运行的范围。原生 Ollama 会使用自己的运行时默认值，除非设置了
    `params.num_ctx`。同时限制 OpenClaw 的预算和 Ollama 的请求上下文，以获得可预测的首个 token 延迟：

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

    如果 OpenClaw 发送的 prompt 过多，请降低 `contextWindow`。如果 Ollama 的运行时上下文对机器来说过大，请降低
    `params.num_ctx`。如果生成时间过长，请降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排查](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/zh-CN/providers/ollama-cloud" icon="cloud">
    使用专用 `ollama-cloud` 提供商的仅云端设置。
  </Card>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web 搜索" href="/zh-CN/tools/ollama-search" icon="magnifying-glass">
    Ollama 驱动的 Web 搜索的完整设置和行为详情。
  </Card>
  <Card title="配置" href="/zh-CN/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
