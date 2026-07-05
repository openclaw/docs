---
read_when:
    - 你想在 OpenClaw 中使用阿里巴巴 Wan 视频生成
    - 你需要设置 Model Studio 或 DashScope API key 才能进行视频生成
summary: OpenClaw 中的 Alibaba Model Studio Wan 视频生成
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-05T11:34:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

内置的 `alibaba` 插件为 Alibaba Model Studio（DashScope 的国际名称）上的 Wan 模型注册视频生成提供商。它默认启用；只需要 API key。

| 属性             | 值                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| 提供商 id        | `alibaba`                                                                       |
| 插件             | 内置，`enabledByDefault: true`                                                  |
| 认证环境变量     | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（第一个匹配项生效） |
| 新手引导标志     | `--auth-choice alibaba-model-studio-api-key`                                    |
| 直接 CLI 标志    | `--alibaba-model-studio-api-key <key>`                                          |
| 默认模型         | `alibaba/wan2.6-t2v`                                                            |
| 默认基础 URL     | `https://dashscope-intl.aliyuncs.com`                                           |

## 入门指南

<Steps>
  <Step title="设置 API key">
    通过新手引导为 `alibaba` 提供商存储密钥：

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    或直接传入密钥：

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    或在启动 Gateway 网关前导出一个受支持的环境变量：

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="设置默认视频模型">
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
  <Step title="验证提供商已配置">
    ```bash
    openclaw models list --provider alibaba
    ```

    列表包含全部五个内置 Wan 模型。如果无法解析 `MODELSTUDIO_API_KEY`，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭据。

  </Step>
</Steps>

<Note>
  Alibaba 插件和 [Qwen 插件](/zh-CN/providers/qwen) 都面向 DashScope 进行认证，并接受重叠的环境变量。对于专用的 Wan 视频能力面，请使用 `alibaba/...` 模型 id；对于 Qwen 聊天、嵌入或媒体理解，请使用 `qwen/...` id。
</Note>

## 内置 Wan 模型

| 模型引用                   | 模式              |
| -------------------------- | ----------------- |
| `alibaba/wan2.6-t2v`       | 文本转视频（默认） |
| `alibaba/wan2.6-i2v`       | 图像转视频        |
| `alibaba/wan2.6-r2v`       | 参考转视频        |
| `alibaba/wan2.6-r2v-flash` | 参考转视频（快速） |
| `alibaba/wan2.7-r2v`       | 参考转视频        |

## 能力和限制

三种模式共享相同的每请求视频数量和时长上限；只有输入形态不同。

| 模式       | 最大输出视频数 | 最大输入图像数 | 最大输入视频数 | 最大时长 | 支持的控制项                                              |
| ---------- | -------------- | -------------- | -------------- | -------- | --------------------------------------------------------- |
| 文本转视频 | 1              | n/a            | n/a            | 10 s     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 图像转视频 | 1              | 1              | n/a            | 10 s     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| 参考转视频 | 1              | n/a            | 4              | 10 s     | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

省略 `durationSeconds` 的请求会使用 DashScope 接受的默认值：**5 秒**。在[视频生成工具](/zh-CN/tools/video-generation)上显式设置 `durationSeconds`，即可延长至最高 10 s。

<Warning>
  参考图像和视频输入必须是远程 `http(s)` URL；DashScope 的参考模式会拒绝本地文件路径。请先上传到对象存储，或使用已经生成公共 URL 的[媒体工具](/zh-CN/tools/media-overview)流程。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="覆盖 DashScope 基础 URL">
    提供商默认使用国际 DashScope 端点。若要面向中国区域端点：

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

    提供商会先移除末尾斜杠，然后再构造 AIGC 任务 URL。

  </Accordion>

  <Accordion title="认证环境变量优先级">
    OpenClaw 按以下顺序从环境变量解析 Alibaba API key，并采用第一个非空值：

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    已配置的 `auth.profiles` 条目（通过 `openclaw models auth login` 设置）会覆盖环境变量解析。关于配置文件轮换、冷却和覆盖机制，请参阅[模型常见问题中的认证配置文件](/zh-CN/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them)。

  </Accordion>

  <Accordion title="与 Qwen 插件的关系">
    两个内置插件都与 DashScope 通信，并接受重叠的 API key。使用：

    - `alibaba/wan*.*` id 用于本页记录的专用 Wan 视频提供商。
    - `qwen/*` id 用于 Qwen 聊天、嵌入和媒体理解（参见 [Qwen](/zh-CN/providers/qwen)）。

    由于认证环境变量列表有意重叠，设置一次 `MODELSTUDIO_API_KEY` 即可认证两个插件；不需要分别对每个插件执行新手引导。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="Qwen" href="/zh-CN/providers/qwen" icon="microchip">
    在同一个 DashScope 认证上设置 Qwen 聊天、嵌入和媒体理解。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
  <Card title="模型常见问题" href="/zh-CN/help/faq-models" icon="circle-question">
    认证配置文件、切换模型以及解决 “no profile” 错误。
  </Card>
</CardGroup>
