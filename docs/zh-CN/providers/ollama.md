---
read_when:
    - 你希望通过 Ollama 使用云端或本地模型运行 OpenClaw
    - 你需要 Ollama 的设置和配置指南
    - 你希望使用 Ollama 视觉模型进行图像理解
summary: 使用 Ollama 运行 OpenClaw（云端和本地模型）
title: Ollama
x-i18n:
    generated_at: "2026-07-16T11:51:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 使用 Ollama 的原生 API（`/api/chat`），而不是 OpenAI 兼容的
`/v1` 端点。支持三种模式：

| 模式          | 使用方式                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| 云端 + 本地 | 可访问的 Ollama 主机，提供本地模型以及（如果已登录）`:cloud` 模型 |
| 仅云端    | 直接使用 `https://ollama.com`，无需本地守护进程                                   |
| 仅本地    | 可访问的 Ollama 主机，仅提供本地模型                                       |

要使用专用 `ollama-cloud` 提供商 ID 进行仅云端设置，请参阅
[Ollama Cloud](/zh-CN/providers/ollama-cloud)。如果你希望将云端路由与本地 `ollama` 提供商分开，
请使用 `ollama-cloud/<model>` 引用。

<Warning>
不要使用 `/v1` OpenAI 兼容 URL（`http://host:11434/v1`）。它会破坏工具调用，并可能导致模型将原始工具调用 JSON 作为纯文本输出。请使用原生 URL：`baseUrl: "http://host:11434"`（不含 `/v1`）。
</Warning>

规范配置键为 `baseUrl`。对于 OpenAI SDK 风格的示例，也接受 `baseURL`，
但新配置应使用 `baseUrl`。

## 身份验证规则

<AccordionGroup>
  <Accordion title="本地和局域网主机">
    local loopback、专用网络、`.local` 和裸主机名形式的 Ollama URL 不需要真实的 bearer token。OpenClaw 对这些地址使用 `ollama-local` 标记。
  </Accordion>
  <Accordion title="远程和 Ollama Cloud 主机">
    公共远程主机和 `https://ollama.com` 需要真实凭据：`OLLAMA_API_KEY`、身份验证配置文件或提供商的 `apiKey`。对于直接托管使用，首选 `ollama-cloud` 提供商。
  </Accordion>
  <Accordion title="自定义提供商 ID">
    使用 `api: "ollama"` 的自定义提供商遵循相同规则。例如，指向专用局域网主机的 `ollama-remote` 提供商可以使用 `apiKey: "ollama-local"`；子智能体通过 Ollama 提供商钩子解析该标记，而不会将其视为缺失凭据。`agents.defaults.memorySearch.provider` 也可以指向自定义提供商 ID，使嵌入使用该 Ollama 端点。
  </Accordion>
  <Accordion title="身份验证配置文件">
    `auth-profiles.json` 存储提供商 ID 的凭据；请将端点设置（`baseUrl`、`api`、模型、请求头、超时）放入 `models.providers.<id>`。`{ "ollama-windows": { "apiKey": "ollama-local" } }` 等旧版扁平文件不是运行时格式；`openclaw doctor --fix` 会将其重写为规范的 `ollama-windows:default` API 密钥配置文件并创建备份。该旧版文件中的 `baseUrl` 值是无效杂项，应移至提供商配置。
  </Accordion>
  <Accordion title="记忆嵌入范围">
    Ollama 记忆嵌入的 bearer 身份验证仅限于声明它的主机：

    - 提供商级密钥仅发送到该提供商的主机。
    - `agents.*.memorySearch.remote.apiKey` 仅发送到其远程嵌入主机。
    - 纯 `OLLAMA_API_KEY` 环境变量值会被视为 Ollama Cloud 约定，默认不会发送到本地或自托管主机。

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

        在全新的引导式设置中，OpenClaw 会先检查默认或已配置的
        Ollama 主机。如果已安装的模型声明支持工具，共享的
        CLI/macOS 设置流程会立即提供该模型，并通过一次真实的
        补全请求进行验证。此自动检查绝不会拉取模型；如果没有合适的
        已安装模型，新手引导将继续进入常规 Ollama 选择器。
      </Step>
      <Step title="选择模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY`，并建议托管云端默认值。`Cloud + Local` 和 `Local only` 会提示输入 Ollama 基础 URL、发现可用模型，并在选定的本地模型缺失时自动拉取。已安装的 `:latest` 标签（例如 `gemma4:latest`）只显示一次，而不会重复显示 `gemma4`。`Cloud + Local` 还会检查主机是否已登录以访问云端。
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

    `--custom-base-url` 和 `--custom-model-id` 是可选的；省略它们将使用本地默认主机和 `gemma4` 建议模型。

  </Tab>

  <Tab title="手动设置">
    <Steps>
      <Step title="安装并启动 Ollama">
        从 [ollama.com/download](https://ollama.com/download) 获取，然后拉取一个模型：

        ```bash
        ollama pull gemma4
        ```

        要使用混合云端访问，请在同一主机上运行 `ollama signin`。
      </Step>
      <Step title="设置凭据">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # 本地/局域网主机，任意值均可
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

`Cloud + Local` 通过一个可访问的 Ollama 主机路由本地模型和 `:cloud` 模型——
这是 Ollama 的混合流程；如果你希望同时使用两者，应在设置期间选择此模式。

OpenClaw 会提示输入基础 URL、发现本地模型，并检查
`ollama signin` 状态。登录后，它会建议托管默认值
（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）。如果
未登录，在运行 `ollama signin` 之前，设置将保持仅本地模式。

如果要在没有本地守护进程的情况下仅访问云端，请使用 `openclaw onboard --auth-choice ollama-cloud` 并参阅 [Ollama Cloud](/zh-CN/providers/ollama-cloud)——该路径不需要 `ollama signin` 或正在运行的服务器：

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

在 `openclaw onboard` 期间显示的云端模型列表会从
`https://ollama.com/api/tags` 实时填充，上限为 500 个条目，因此选择器会反映
当前的托管目录。如果设置时 `ollama.com` 无法访问或未返回任何
模型，OpenClaw 会回退到硬编码的建议列表，使新手引导仍能完成。

## 模型发现（隐式提供商）

当已设置 `OLLAMA_API_KEY`（或身份验证配置文件），且未定义
`models.providers.ollama`，也未定义另一个使用 `api: "ollama"` 的自定义提供商时，
OpenClaw 会从 `http://127.0.0.1:11434` 发现模型：

| 行为             | 详细信息                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 能力检测 | 尽力通过 `/api/show` 读取 `contextWindow`、`num_ctx` Modelfile 参数和能力（视觉/工具/思考）                                                                                                                                                                       |
| 视觉模型        | `/api/show` 中的 `vision` 能力会将模型标记为支持图像（`input: ["text", "image"]`）                                                                                                                                                                                             |
| 推理检测  | 可用时使用 `/api/show` 中的 `thinking` 能力；当 Ollama 省略能力信息时，回退到名称启发式规则（`r1`、`reason`、`reasoning`、`think`）。无论报告的能力如何，`glm-5.2:cloud` 和 `deepseek-v4-flash\|pro:cloud` 始终被视为推理模型。 |
| 令牌限制         | `maxTokens` 默认为 OpenClaw 的 Ollama 最大令牌上限                                                                                                                                                                                                                                       |
| 费用                | 所有费用均为 `0`                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

设置带有显式 `models` 数组的 `models.providers.ollama`，或设置使用
`api: "ollama"` 且 `baseUrl` 不是 local loopback 的自定义提供商，会禁用
自动发现；此时必须手动定义模型（参阅
[配置](#configuration)）。指向托管 `https://ollama.com` 的 `models.providers.ollama` 条目也会跳过发现，
因为 Ollama Cloud 模型由提供商管理。local loopback 自定义提供商（例如
`http://127.0.0.2:11434`）仍被视为本地提供商，并保留自动发现。

你可以使用 `ollama/<pulled-model>:latest` 之类的完整引用，而无需手写
`models.json` 条目；OpenClaw 会实时解析它。对于已登录的
主机，选择未列出的 `ollama/<model>:cloud` 引用时，系统会使用
`/api/show` 验证该确切模型，并且仅当 Ollama 确认元数据后才将其
添加到运行时目录——拼写错误仍会因模型未知而失败。

### 冒烟测试

要进行跳过完整智能体工具表面的窄范围文本探测：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "仅回复：pong" \
    --json
```

添加 `--file` 和一张图像即可进行精简的视觉模型探测（接受 PNG/JPEG/WebP；
非图像文件会在调用 Ollama 前被拒绝——音频请使用
`openclaw infer audio transcribe`）：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "用一句话描述这张图片。" \
    --file ./photo.jpg \
    --json
```

两种路径都不会加载聊天工具、记忆或会话上下文。如果这些路径成功，
而普通智能体回复失败，则问题很可能出在模型的工具/智能体能力，
而不是端点。

使用 `/model ollama/<model>` 选择模型属于用户的明确选择：如果
配置的 `baseUrl` 无法访问，下一次回复将因提供商错误而失败，
而不会静默回退到另一个已配置模型。

隔离的 cron 作业在启动智能体轮次前会额外执行一项本地安全检查：
如果所选模型解析为本地/专用网络/`.local` Ollama
提供商，而 `/api/tags` 无法访问，OpenClaw 会将该次运行记录为
`skipped`，并在错误文本中包含模型。此端点检查会按主机缓存
5 分钟，因此针对已停止守护进程的重复 cron 作业不会全部
发起必然失败的请求。

实时验证：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

对于 Ollama Cloud，将同一实时测试指向托管端点（默认跳过
嵌入；可使用 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` 强制启用，因为
云端密钥可能没有 `/api/embed` 的授权）：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

要添加模型，拉取后即可自动发现：

```bash
ollama pull mistral
```

## 节点本地推理

智能体可以将短任务委派给已配对桌面设备或
服务器节点上的 Ollama 模型。提示词和响应通过现有的已验证
Gateway 网关/节点连接传输；请求在节点自身的 loopback Ollama
端点（`http://127.0.0.1:11434`）上运行。

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

    在 Gateway 网关主机上批准设备及其节点命令，然后验证：

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    首次连接或添加了 Ollama 命令的升级可能会触发
    节点命令审批。如果节点连接后未公布
    `ollama.models` 和 `ollama.chat`，请再次检查 `openclaw nodes pending`。

  </Step>
  <Step title="从智能体使用">
    内置 Ollama 插件提供 `node_inference` 工具。智能体先调用
    `action: "discover"`，然后使用结果中的节点和模型调用 `action: "run"`
    （恰好连接了一个具备相应能力的节点时，`run` 可以省略节点）。
    例如：“发现我的节点上的 Ollama 模型，然后使用已加载且速度最快的模型
    总结此文本。”
  </Step>
</Steps>

发现过程读取 `/api/tags`，检查 `/api/show` 能力，并在
`/api/ps` 可用时优先排列已加载的模型。它仅返回 Ollama 报告为
支持聊天（`completion` 能力）的本地模型——
Ollama Cloud 条目和仅支持嵌入的模型会被排除。每次运行都会禁用
模型思考，并且默认输出 512 个 token（硬上限为 8192），除非
工具调用请求不同的 `maxTokens`；某些模型（例如 GPT-OSS）
不支持禁用思考，仍可能输出推理 token。

要让 Ollama 在节点上保持运行但不向智能体公开：

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

重启节点（`openclaw node restart`，或者对于前台会话，停止后重新运行 `openclaw node run`）。
节点将停止公布 `ollama.models` 和
`ollama.chat`；Ollama 本身以及 Gateway 网关的 Ollama 提供商不受影响。
将值改回 `true` 并重启即可重新启用；命令界面发生变化后，
重新连接时可能需要再次批准 `openclaw nodes pending`。

不启动智能体轮次，直接验证节点命令：

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

`--invoke-timeout` 限制节点运行命令的最长时间；
`--timeout` 限制整个 Gateway 网关调用的最长时间，且应设置得更长。

节点本地推理始终使用节点自身的 loopback 端点——它
不会复用已配置的远程/云端 `models.providers.ollama.baseUrl`。
节点命令默认可用于 macOS、Linux 和 Windows 节点
主机，并继续受正常节点配对/命令策略约束。

## 视觉和图像描述

内置 Ollama 插件会将 Ollama 注册为支持图像的
媒体理解提供商，因此 OpenClaw 可以通过本地或托管的 Ollama
视觉模型路由显式图像描述请求和已配置的图像模型默认值。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` 必须是完整的 `<provider/model>` 引用；设置后，`infer image
describe` 会优先尝试该模型，而不是对已原生支持视觉的模型跳过描述。如果调用失败，OpenClaw 可以继续通过
`agents.defaults.imageModel.fallbacks`；文件/URL 准备错误会在尝试回退前
导致失败。将 `infer image describe` 用于 OpenClaw 的
图像理解流程和已配置的 `imageModel`；将 `infer model run
--file` 用于带自定义提示词的原始多模态探测。

要让 Ollama 成为入站媒体的默认图像理解提供商：

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

优先使用完整的 `ollama/<model>` 引用。仅当
`qwen2.5vl:7b` 之类的裸 `imageModel` 引用以完全相同的模型
列在 `models.providers.ollama.models` 下且带有
`input: ["text", "image"]`，并且没有其他已配置的图像提供商公开
相同裸 ID 时，才会规范化为 `ollama/qwen2.5vl:7b`；否则请显式使用提供商前缀。

缓慢的本地视觉模型可能需要比云端模型更长的图像理解超时时间，
而且如果 Ollama 尝试分配模型所公布的完整视觉上下文，
在资源受限的硬件上可能会崩溃。设置能力
超时时间并限制 `num_ctx`：

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

此超时时间适用于入站图像理解和显式
`image` 工具。对于普通模型调用，`models.providers.ollama.timeoutSeconds` 仍控制
底层 Ollama HTTP 请求保护时限。

实时验证：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果手动定义 `models.providers.ollama.models`，请显式标记视觉模型：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝未标记为
支持图像的模型所对应的图像描述请求。使用隐式发现时，此信息来自 `/api/show` 的视觉
能力。

## 配置

<Tabs>
  <Tab title="基础配置（隐式发现）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，则可以在提供商条目中省略 `apiKey`；OpenClaw 会自动填充该值以执行可用性检查。
    </Tip>

  </Tab>

  <Tab title="显式配置（手动模型）">
    对于托管云端设置、非默认主机/端口、强制指定
    上下文窗口或完全手动的模型列表，请使用显式配置：

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
    显式配置会禁用自动发现，因此必须列出模型：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不含 /v1 - 原生 Ollama API URL
            api: "ollama", // 显式指定：保证原生工具调用行为
            timeoutSeconds: 300, // 可选：为冷启动本地模型提供更长的连接/流式传输时间预算
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
    不要添加 `/v1`。该路径会选择 OpenAI 兼容模式，而该模式下的工具调用并不可靠。
    </Warning>

  </Tab>
</Tabs>

## 常用方案

将模型 ID 替换为 `ollama list` 或
`openclaw models list --provider ollama` 中的确切名称。

<AccordionGroup>
  <Accordion title="使用自动发现的本地模型">
    Ollama 与 Gateway 网关位于同一台机器上，并自动发现：

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    除非需要手动模型，否则不要添加 `models.providers.ollama` 块。

  </Accordion>

  <Accordion title="使用手动模型的局域网 Ollama 主机">
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
    Ollama。当硬件无法运行模型所公布的完整
    上下文时，请让两者保持一致。

  </Accordion>

  <Accordion title="仅使用 Ollama Cloud">
    不运行本地守护进程，直接使用托管模型：

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

    对于专用的 `ollama-cloud` 提供商 ID（而不是此结构），请参阅
    [Ollama Cloud](/zh-CN/providers/ollama-cloud)。

  </Accordion>

  <Accordion title="通过已登录的守护进程同时使用云端和本地模型">
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
    运行多个 Ollama 服务器时使用自定义提供商 ID；每个服务器都有自己的
    主机、模型、身份验证和超时设置。

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

    OpenClaw 会在调用 Ollama 前移除当前提供商前缀（如果没有，则回退为不带修饰的
    `ollama/` 前缀），因此 `ollama-large/qwen3.5:27b`
    到达 Ollama 时为 `qwen3.5:27b`。

  </Accordion>

  <Accordion title="精简的本地模型配置">
    一些本地模型能够处理简单提示词，但难以应对完整的智能体
    工具界面。请先限制工具和上下文，再调整全局运行时
    设置：

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

    仅当模型或服务器在处理工具架构时持续
    失败，才使用 `compat.supportsTools: false`——它以牺牲智能体能力来换取稳定性。
    `localModelLean` 会从智能体直接可用的工具界面中移除重量级的浏览器、cron、消息、媒体生成、
    语音和 PDF 工具（除非明确要求），
    并将较大的工具目录置于工具搜索之后。它不会更改 Ollama 的
    运行时上下文或思考模式。对于会陷入循环或
    将预算耗费在隐藏推理上的小型 Qwen 风格思考模型，请将它与 `params.num_ctx` 和
    `params.thinking: false` 配合使用。

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

自定义提供商 ID 的工作方式相同：对于使用当前提供商
前缀的引用（例如 `ollama-spark/qwen3:32b`），OpenClaw 会在
调用 Ollama 前移除该前缀，并发送 `qwen3:32b`。

对于速度较慢的本地模型，请优先调整提供商范围内的设置，而不是提高整个
智能体运行时的超时：

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

`timeoutSeconds` 涵盖模型 HTTP 请求的全过程：连接建立、请求头、
请求体流式传输以及受保护 fetch 的总中止时间。`params.keep_alive` 会在原生 `/api/chat` 请求中
作为顶层 `keep_alive` 转发；当首次轮次的加载时间成为瓶颈时，请按
模型进行设置。

### 快速验证

```bash
# 此计算机可访问 Ollama 守护进程
curl http://127.0.0.1:11434/api/tags

# OpenClaw 目录和所选模型
openclaw models list --provider ollama
openclaw models status

# 直接进行模型冒烟测试
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "仅回复：ok"
```

对于远程主机，请将 `127.0.0.1` 替换为 `baseUrl` 主机。如果 `curl`
可以工作而 OpenClaw 不行，请检查 Gateway 网关是否运行在不同的
计算机、容器或服务账户下。

## Ollama Web 搜索

OpenClaw 将 **Ollama Web 搜索** 内置为 `web_search` 提供商。

| 属性        | 详情                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机        | 设置后使用 `models.providers.ollama.baseUrl`，否则使用 `http://127.0.0.1:11434`；`https://ollama.com` 直接使用托管 API                          |
| 身份验证    | 对已登录的本地主机无需密钥；直接进行 `https://ollama.com` 搜索或使用受身份验证保护的主机时，使用 `OLLAMA_API_KEY` 或配置的提供商身份验证           |
| 要求        | 本地/自托管主机必须正在运行，并已使用 `ollama signin` 登录；直接托管搜索需要 `baseUrl: "https://ollama.com"` 以及真实的 API 密钥 |

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

通过 Ollama Cloud 直接进行托管搜索：

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

对于自托管主机，OpenClaw 会先尝试本地 `/api/experimental/web_search`
代理，然后回退到同一主机上的托管 `/api/web_search` 路径；
已登录的本地守护进程通常会通过本地代理响应。直接
`https://ollama.com` 调用始终使用托管的 `/api/web_search` 端点。

<Note>
有关完整设置和行为，请参阅 [Ollama Web 搜索](/zh-CN/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **此模式下的工具调用并不可靠。** 仅当代理需要 OpenAI 格式，并且你不依赖原生工具调用时才使用此模式。
    </Warning>

    对于 `/v1/chat/completions` 后面的代理，请显式设置
    `api: "openai-completions"`：

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

    此模式可能不支持同时进行流式传输和工具调用；你
    可能需要在模型上设置 `params: { streaming: false }`。

    在此模式下，OpenClaw 默认会注入 `options.num_ctx`，这样 Ollama 就
    不会静默回退到 4096-token 上下文。如果你的代理拒绝
    未知的 `options` 字段，请禁用它：

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
    对于自动发现的模型，OpenClaw 使用 `/api/show`
    报告的上下文窗口，包括自定义 Modelfile 中较大的
    `PARAMETER num_ctx` 值；否则会回退到 OpenClaw 的默认 Ollama 上下文
    窗口。

    提供商级别的 `contextWindow`、`contextTokens` 和 `maxTokens` 会为
    该提供商下的每个模型设置默认值，并且可按模型覆盖。
    `contextWindow` 是 OpenClaw 自身的提示词/压缩预算。原生
    `/api/chat` 请求会保持 `options.num_ctx` 未设置，除非你显式设置
    `params.num_ctx`，因此 Ollama 会应用其自身的模型、
    `OLLAMA_CONTEXT_LENGTH` 或基于 VRAM 的默认值；无效、零、负数
    或非有限的 `params.num_ctx` 值将被忽略。如果较旧的配置仅使用
    `contextWindow`/`maxTokens` 强制设置原生请求上下文，请运行
    `openclaw doctor --fix` 将这些值复制到 `params.num_ctx`。OpenAI
    兼容适配器仍会默认根据已配置的 `params.num_ctx` 或
    `contextWindow` 注入 `options.num_ctx`；如果上游拒绝
    `options`，请使用 `injectNumCtxForOpenAICompat: false` 禁用此行为。

    原生模型条目还接受 `params` 下常用的 Ollama 运行时选项，
    这些选项会作为原生 `/api/chat` `options` 转发：`num_keep`、`seed`、
    `num_predict`、`top_k`、`top_p`、`min_p`、`typical_p`、`repeat_last_n`、
    `temperature`、`repeat_penalty`、`presence_penalty`、`frequency_penalty`、
    `stop`、`num_batch`、`num_gpu`、`main_gpu`、`use_mmap` 和 `num_thread`。
    少数键（`format`、`keep_alive`、`truncate`、`shift`）会作为
    顶层请求字段转发，而不是嵌套在 `options` 中。OpenClaw 仅
    转发这些 Ollama 请求键，因此仅用于运行时的参数（例如
    `streaming`）绝不会发送给 Ollama。使用 `params.think`（或
    `params.thinking`）设置顶层 `think`；`false` 会为 Qwen 风格的思考模型禁用 API 级
    思考。

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

    按模型设置 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也
    有效；如果两者均已设置，则显式提供商模型条目优先。

  </Accordion>

  <Accordion title="思考控制">
    OpenClaw 会按 Ollama 预期的方式转发思考设置：使用顶层 `think`，而不是
    `options.think`。对于 `/api/show` 报告具有
    `thinking` 能力的自动发现模型，会提供 `/think low`、`/think medium`、`/think high`
    和 `/think max`；非思考模型仅提供 `/think off`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    或者设置模型默认值：

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
    思考。当当前运行仅使用隐式 `off` 默认值时，OpenClaw 会保留该显式配置；
    非关闭状态的运行时命令（例如 `/think medium`）仍会覆盖它。对于明确标记为
    `reasoning: false` 的模型，绝不会发送真值思考请求；无论如何都会发送
    `think: false` 请求。

  </Accordion>

  <Accordion title="推理模型">
    默认将名为 `deepseek-r1`、`reasoning`、`reason` 或 `think` 的模型
    视为支持推理，无需额外配置：

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="模型成本">
    Ollama 在本地运行且免费，因此自动发现和手动定义的模型成本均为 `0`。
  </Accordion>

  <Accordion title="记忆嵌入">
    内置的 Ollama 插件为[记忆搜索](/zh-CN/concepts/memory)注册了一个记忆嵌入提供商。
    它使用配置的 Ollama 基础 URL 和 API key，调用 `/api/embed`，
    并在可能的情况下将多个记忆分块合并到一个 `input` 请求中。

    当 `proxy.enabled=true` 时，发送到根据所配置 `baseUrl` 推导出的精确主机本地
    环回源的嵌入请求，会使用 OpenClaw 的受保护直接路径，而不是托管式转发代理。
    配置的主机名本身必须为 `localhost` 或环回 IP 字面量——仅通过 DNS
    解析为环回地址的名称仍使用托管式代理路径。局域网、tailnet、专用网络和公网
    Ollama 主机始终使用托管式代理路径，并且重定向到其他主机/端口时不会继承信任。
    `proxy.loopbackMode: "proxy"` 仍会通过代理路由环回流量；`proxy.loopbackMode: "block"`
    会在连接前拒绝它——请参阅[托管式代理](/zh-CN/security/network-proxy#gateway-loopback-mode)。

    | 属性 | 值 |
    | --- | --- |
    | 默认模型 | `nomic-embed-text` |
    | 自动拉取 | 是，如果本地不存在 |
    | 默认内联并发数 | 1（其他提供商的默认值更高；如果主机能够承受，可通过 `nonBatchConcurrency` 提高） |

    查询时嵌入会为要求或建议使用检索前缀的模型添加前缀：
    `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。
    文档批次保持原始格式，因此现有索引不需要格式迁移。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Ollama 的默认值。如果在较大主机上重新索引过慢，可提高此值。
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    对于远程嵌入主机，请将身份验证限制在该主机范围内：

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
    Ollama 默认使用**原生 API**（`/api/chat`），该 API 同时支持流式传输和工具调用，
    无需特殊配置。

    对于原生请求，会直接转发思考控制：除非配置了显式的
    `params.think`/`params.thinking`，否则 `/think off`
    和 `openclaw agent --thinking off` 会发送顶层 `think: false`；
    `/think
    low|medium|high` 会发送匹配的强度字符串；`/think max` 映射到
    Ollama 的最高强度 `think: "high"`。

    <Tip>
    如果要改用 OpenAI 兼容端点，请参阅上方的“旧版 OpenAI 兼容模式”——在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排查

<AccordionGroup>
  <Accordion title="WSL2 崩溃循环（反复重启）">
    在使用 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安装程序会创建一个
    带有 `Restart=always` 的 `ollama.service` systemd 单元。如果该服务
    自动启动并在 WSL2 启动期间加载 GPU 支持的模型，Ollama 可能会在加载时锁定
    主机内存；Hyper-V 内存回收不一定总能回收这些内存页，因此 Windows 可能会
    终止 WSL2 虚拟机，systemd 随后重启 Ollama，导致循环反复发生。

    佐证现象：WSL2 反复重启/终止，WSL2 启动后 `app.slice` 或
    `ollama.service` 立即出现高 CPU 占用，以及收到来自 systemd 的 SIGTERM，
    而不是由 Linux OOM killer 终止。

    当 OpenClaw 检测到 WSL2、通过 `Restart=always` 启用了
    `ollama.service`，并且存在可见的 CUDA 标记时，会记录启动警告。

    缓解措施：

    ```bash
    sudo systemctl disable ollama
    ```

    在 Windows 端，将以下内容添加到 `%USERPROFILE%\.wslconfig`，然后运行
    `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    或者缩短保活时间，或仅在需要时手动启动 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    请参阅 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="未检测到 Ollama">
    确认 Ollama 正在运行、已设置 `OLLAMA_API_KEY`（或身份验证配置文件），
    并且**没有**显式定义 `models.providers.ollama`：

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    在本地拉取模型，或在 `models.providers.ollama` 中显式定义它：

    ```bash
    ollama list  # 查看已安装的模型
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    ```bash
    # 检查 Ollama 是否正在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="远程主机可通过 curl 访问，但 OpenClaw 无法访问">
    请从运行 Gateway 网关的同一台机器和运行时中验证：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常见原因：

    - `baseUrl` 指向 `localhost`，但 Gateway 网关运行在 Docker 中或另一台主机上。
    - URL 使用 `/v1`，因此选择了 OpenAI 兼容行为，而不是原生 Ollama 行为。
    - 远程主机需要更改防火墙或局域网绑定设置。
    - 模型位于你笔记本电脑的守护进程中，而不在远程守护进程中。

  </Accordion>

  <Accordion title="模型将工具 JSON 作为文本输出">
    通常是因为提供商处于 OpenAI 兼容模式，或者模型无法处理工具 schema。
    优先使用原生模式：

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
    如果托管式 Kimi/GLM 响应是很长且不具语言意义的符号序列，系统会将其视为
    提供商调用失败，而不是成功回复，因此会接管并执行正常的重试、回退和错误处理，
    而不会将损坏的文本持久化到会话中。

    如果问题再次发生，请记录模型名称、当前会话文件，以及运行使用的是
    `Cloud + Local` 还是 `Cloud only`，然后尝试新会话和回退模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷启动本地模型超时">
    大型本地模型首次加载可能需要较长时间。将超时范围限定到 Ollama 提供商，
    并可选择在多轮交互之间保持模型加载状态：

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

    如果主机本身接受连接的速度较慢，`timeoutSeconds` 还会延长该提供商的
    受保护连接超时时间。

  </Accordion>

  <Accordion title="大上下文模型速度过慢或内存不足">
    许多模型声明的上下文大小超出了你的硬件能够舒适运行的范围。除非设置了
    `params.num_ctx`，否则原生 Ollama 会使用其自身的运行时默认值。请同时限制
    OpenClaw 的预算和 Ollama 的请求上下文，以获得可预测的首 token 延迟：

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

    如果 OpenClaw 发送的提示词过多，请降低 `contextWindow`。
    如果 Ollama 的运行时上下文对该机器而言过大，请降低 `params.num_ctx`。
    如果生成时间过长，请降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排查](/zh-CN/help/troubleshooting)和[常见问题](/zh-CN/help/faq)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/zh-CN/providers/ollama-cloud" icon="cloud">
    使用专用 `ollama-cloud` 提供商的纯云端设置。
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
