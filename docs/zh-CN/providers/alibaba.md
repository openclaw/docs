---
read_when:
    - 你想在 OpenClaw 中使用阿里巴巴 Wan 视频生成服务
    - 你需要设置用于视频生成的 Model Studio 或 DashScope API key
summary: OpenClaw 中的阿里云百炼 Wan 视频生成
title: 阿里云百炼
x-i18n:
    generated_at: "2026-07-11T20:50:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

内置的 `alibaba` 插件为 Alibaba Model Studio（DashScope 的国际名称）上的 Wan 模型注册了一个视频生成提供商。该插件默认启用，只需提供 API key。

| 属性             | 值                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 提供商 ID        | `alibaba`                                                                       |
| 插件             | 内置，`enabledByDefault: true`                                                   |
| 身份验证环境变量 | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（首个匹配项生效）   |
| 新手引导标志     | `--auth-choice alibaba-model-studio-api-key`                                    |
| 直接 CLI 标志    | `--alibaba-model-studio-api-key <key>`                                          |
| 默认模型         | `alibaba/wan2.6-t2v`                                                            |
| 默认基础 URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## 入门指南

<Steps>
  <Step title="Set an API key">
    通过新手引导为 `alibaba` 提供商存储密钥：

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    或直接传入密钥：

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    或在启动 Gateway 网关前导出任一受支持的环境变量：

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # 或 DASHSCOPE_API_KEY=...
    # 或 QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    列表中包含全部五个内置 Wan 模型。如果无法解析 `MODELSTUDIO_API_KEY`，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭据。

  </Step>
</Steps>

<Note>
  Alibaba 插件和 [Qwen 插件](/zh-CN/providers/qwen)都通过 DashScope 进行身份验证，并接受部分重叠的环境变量。专用 Wan 视频功能应使用 `alibaba/...` 模型 ID；Qwen 聊天、嵌入或媒体理解应使用 `qwen/...` ID。
</Note>

## 内置 Wan 模型

| 模型引用                   | 模式                    |
| -------------------------- | ----------------------- |
| `alibaba/wan2.6-t2v`       | 文本生成视频（默认）    |
| `alibaba/wan2.6-i2v`       | 图像生成视频            |
| `alibaba/wan2.6-r2v`       | 参考素材生成视频        |
| `alibaba/wan2.6-r2v-flash` | 参考素材生成视频（快速）|
| `alibaba/wan2.7-r2v`       | 参考素材生成视频        |

## 能力和限制

三种模式具有相同的单次请求视频数量和时长上限，只有输入格式不同。

| 模式               | 最大输出视频数 | 最大输入图像数 | 最大输入视频数 | 最大时长 | 支持的控制项                                              |
| ------------------ | -------------- | -------------- | -------------- | -------- | --------------------------------------------------------- |
| 文本生成视频       | 1              | 不适用         | 不适用         | 10 秒    | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 图像生成视频       | 1              | 1              | 不适用         | 10 秒    | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 参考素材生成视频   | 1              | 不适用         | 4              | 10 秒    | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |

未指定 `durationSeconds` 的请求将使用 DashScope 接受的默认值 **5 秒**。在[视频生成工具](/zh-CN/tools/video-generation)中显式设置 `durationSeconds`，可将时长延长至最多 10 秒。

<Warning>
  参考图像和视频输入必须是远程 `http(s)` URL；DashScope 的参考模式会拒绝本地文件路径。请先将文件上传到对象存储，或使用已经能够生成公共 URL 的[媒体工具](/zh-CN/tools/media-overview)流程。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    该提供商默认使用 DashScope 国际端点。要改用中国区域端点：

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    提供商会先移除末尾的斜杠，再构建 AIGC 任务 URL。

  </Accordion>

  <Accordion title="Auth env priority">
    OpenClaw 按以下顺序从环境变量中解析 Alibaba API key，并采用首个非空值：

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    已配置的 `auth.profiles` 条目（通过 `openclaw models auth login` 设置）会覆盖环境变量解析。有关配置文件轮换、冷却期和覆盖机制，请参阅[模型常见问题中的身份验证配置文件](/zh-CN/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them)。

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    两个内置插件都与 DashScope 通信，并接受部分重叠的 API key。请使用：

    - `alibaba/wan*.*` ID：用于本页所述的专用 Wan 视频提供商。
    - `qwen/*` ID：用于 Qwen 聊天、嵌入和媒体理解（请参阅 [Qwen](/zh-CN/providers/qwen)）。

    由于身份验证环境变量列表有意重叠，只需设置一次 `MODELSTUDIO_API_KEY` 即可验证两个插件，无需分别对每个插件执行新手引导。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共用的视频工具参数和提供商选择方式。
  </Card>
  <Card title="Qwen" href="/zh-CN/providers/qwen" icon="microchip">
    使用同一 DashScope 身份验证配置 Qwen 聊天、嵌入和媒体理解。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
  <Card title="Models FAQ" href="/zh-CN/help/faq-models" icon="circle-question">
    身份验证配置文件、切换模型以及解决“无配置文件”错误。
  </Card>
</CardGroup>
