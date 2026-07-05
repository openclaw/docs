---
read_when:
    - 你想将 Qwen 与 OpenClaw 一起使用
    - 你之前使用过 Qwen OAuth
summary: 通过其 OpenClaw 插件使用 Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-07-05T11:37:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3678ac0e56ee7cae00cb4a7e17a051734b288ebb4dfab47cb99e5b7ab745c3ce
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud 是官方外部 OpenClaw 提供商插件，规范 id 为 `qwen`。它面向 Qwen Cloud / Alibaba DashScope Standard 和 Coding Plan 端点，保留旧版 `modelstudio` id 作为兼容别名继续可用，并将 Qwen Portal 令牌流程作为单独的提供商暴露：[`qwen-oauth`](/zh-CN/providers/qwen-oauth)。

| 属性                   | 值                                         |
| ---------------------- | ------------------------------------------ |
| 提供商                 | `qwen`                                     |
| Portal 提供商          | [`qwen-oauth`](/zh-CN/providers/qwen-oauth)      |
| 首选环境变量           | `QWEN_API_KEY`                             |
| 也接受（兼容）         | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API 风格               | OpenAI 兼容                                |

<Tip>
对于 `qwen3.6-plus`，请使用 **Standard（按量付费）** 端点。它在 Coding Plan 端点上不可用。
</Tip>

## 安装插件

`qwen` 作为官方外部插件提供，不与核心捆绑。安装它并重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 入门指南

选择你的计划类型并按照设置步骤操作。

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **最适合：** 通过 Qwen Coding Plan 进行基于订阅的访问。

    <Steps>
      <Step title="Get your API key">
        从 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API key。
      </Step>
      <Step title="Run onboarding">
        对于 **Global** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        对于 **China** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型引用仍可作为兼容别名使用，但新的设置流程应优先使用规范的 `qwen-*` auth-choice id 和 `qwen/...` 模型引用。如果你定义了精确的自定义 `models.providers.modelstudio` 条目且带有另一个 `api` 值，则该自定义提供商拥有 `modelstudio/...` 引用，而不是 Qwen 兼容别名。
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **最适合：** 通过 Standard Model Studio 端点进行按量付费访问，包括 `qwen3.6-plus` 等在 Coding Plan 上不可用的模型。

    <Steps>
      <Step title="Get your API key">
        从 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API key。
      </Step>
      <Step title="Run onboarding">
        对于 **Global** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        对于 **China** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型引用仍可作为兼容别名使用，但新的设置流程应优先使用规范的 `qwen-*` auth-choice id 和 `qwen/...` 模型引用。如果你定义了精确的自定义 `models.providers.modelstudio` 条目且带有另一个 `api` 值，则该自定义提供商拥有 `modelstudio/...` 引用，而不是 Qwen 兼容别名。
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最适合：** 面向 `https://portal.qwen.ai/v1` 的 Qwen Portal 令牌。

    请参阅 [Qwen OAuth / Portal](/zh-CN/providers/qwen-oauth)，了解专用提供商页面和迁移说明。

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` 使用与 Qwen Cloud 提供商相同的 `QWEN_API_KEY` 环境变量名称，但通过 OpenClaw 新手引导配置时，会将凭证存储在 `qwen-oauth` 提供商 id 下。
    </Note>

  </Tab>
</Tabs>

## 计划类型和端点

| 计划                       | 区域   | 凭证选择                   | 端点                                             |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Coding Plan（订阅）        | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（订阅）        | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |
| Standard（按量付费）       | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard（按量付费）       | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |

提供商会根据你的凭证选择自动选择端点。规范选择使用 `qwen-*` 系列；`modelstudio-*` 仅保留用于兼容。可在配置中使用自定义 `baseUrl` 覆盖。

<Tip>
**管理 key：** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文档：** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 内置目录

OpenClaw 附带此 Qwen 静态目录。该目录感知端点：Coding Plan 配置会省略仅适用于 Standard 端点的模型。

| 模型引用                    | 输入        | 上下文    | 备注                    |
| --------------------------- | ----------- | --------- | ----------------------- |
| `qwen/qwen3.5-plus`         | 文本，图像  | 1,000,000 | 默认模型                |
| `qwen/qwen3.6-plus`         | 文本，图像  | 1,000,000 | 仅 Standard 端点        |
| `qwen/qwen3-max-2026-01-23` | 文本        | 262,144   | Qwen Max 系列           |
| `qwen/qwen3-coder-next`     | 文本        | 262,144   | 编码                    |
| `qwen/qwen3-coder-plus`     | 文本        | 1,000,000 | 编码                    |
| `qwen/MiniMax-M2.5`         | 文本        | 1,000,000 | 已启用推理              |
| `qwen/glm-5`                | 文本        | 202,752   | GLM                     |
| `qwen/glm-4.7`              | 文本        | 202,752   | GLM                     |
| `qwen/kimi-k2.5`            | 文本，图像  | 262,144   | 通过 Alibaba 使用 Moonshot AI |
| `qwen-oauth/qwen3.5-plus`   | 文本，图像  | 1,000,000 | Qwen Portal 默认值      |

<Note>
即使模型存在于静态目录中，可用性仍可能因端点和计费计划而异。
</Note>

## 思考控制

`qwen/MiniMax-M2.5` 是内置目录中唯一启用推理的模型。对于 `qwen` 系列上的推理模型，提供商会将 OpenClaw 思考级别映射到 DashScope 的顶层 `enable_thinking` 请求标志：禁用思考会发送 `enable_thinking: false`，任何其他级别都会发送 `enable_thinking: true`。自定义模型可以通过在模型条目上设置 `compat.thinkingFormat: "qwen-chat-template"` 来选择使用另一种 chat-template 思考载荷。

## 多模态附加功能

`qwen` 插件仅在 **Standard** DashScope 端点上暴露多模态能力，不在 Coding Plan 端点上暴露：

- 通过 `qwen-vl-max-latest` 进行**图像和视频理解**
- 通过 `wan2.6-t2v`（默认）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` 进行 **Wan 视频生成**

媒体理解会从已配置的 Qwen 凭证自动解析；无需额外配置。请确保你使用的是 Standard（按量付费）端点，媒体理解才能工作。

要将 Qwen 设为默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

视频生成限制：每个请求 1 个输出视频，最多 1 张输入图像（图像到视频），最多 4 个输入视频（视频到视频），最长 10 秒。支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`。参考图像/视频输入需要远程 http(s) URL；本地文件路径会被预先拒绝，因为 DashScope 视频端点不接受为这些参考上传的本地缓冲区。

<Note>
请参阅[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` 可在 Standard（按量付费）端点上使用：

    - China：`dashscope.aliyuncs.com/compatible-mode/v1`
    - Global：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    如果 Coding Plan 端点对 `qwen3.6-plus` 返回 “unsupported model” 错误，请改用 Standard（按量付费），而不是 Coding Plan 端点/key 组合。

    OpenClaw 的 Qwen 静态目录不会在 Coding Plan 端点上宣传 `qwen3.6-plus`，但如果在 `models.providers.qwen.models` 下显式配置 `qwen/qwen3.6-plus` 条目，则会在 Coding Plan base URL 上被遵循，因此如果阿里云在你的订阅上启用了该模型，你可以选择启用它。上游 API 仍会决定调用是否成功。

  </Accordion>

  <Accordion title="Video generation region routing">
    OpenClaw 会在提交视频任务前，将已配置的 Qwen 区域映射到匹配的 DashScope AIGC 主机：

    - Global/Intl：`https://dashscope-intl.aliyuncs.com`
    - China：`https://dashscope.aliyuncs.com`

    指向 Coding Plan 或 Standard Qwen 主机的普通 `models.providers.qwen.baseUrl` 仍会将视频生成路由到匹配的区域 DashScope 视频端点。

  </Accordion>

  <Accordion title="Streaming usage compatibility">
    原生 Qwen 端点在共享 `openai-completions` 传输上声明流式用量兼容性，因此面向相同原生主机的 DashScope 兼容自定义提供商 id 会继承相同行为，而不要求专门使用内置 `qwen` 提供商 id。这适用于 Coding Plan 和 Standard 端点：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Capability plan">
    `qwen` 插件正被定位为完整 Qwen Cloud 表面的厂商归属位置，而不仅限于编码/文本模型。

    - **文本/聊天模型：** 可通过插件使用
    - **工具调用、结构化输出、思考：** 继承自 OpenAI 兼容传输
    - **图像生成：** 计划在提供商插件层支持
    - **图像/视频理解：** 可通过插件在 Standard 端点使用
    - **语音/音频：** 计划在提供商插件层支持
    - **记忆嵌入/重排序：** 计划通过嵌入适配器表面支持
    - **视频生成：** 可通过插件经由共享的视频生成能力使用

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 网关以守护进程方式运行（launchd/systemd），请确保该进程可以使用 `QWEN_API_KEY`（例如，在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="Alibaba Model Studio" href="/zh-CN/providers/alibaba" icon="cloud">
    同一 DashScope 平台上的内置 Wan 视频生成提供商。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排查和常见问题。
  </Card>
</CardGroup>
