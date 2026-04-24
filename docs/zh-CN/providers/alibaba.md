---
read_when:
    - 你想在 OpenClaw 中使用阿里云百炼 Wan 视频生成
    - 你需要为视频生成设置 Model Studio 或 DashScope API key
summary: OpenClaw 中的阿里云百炼 Wan 视频生成
title: 阿里云百炼
x-i18n:
    generated_at: "2026-04-24T03:42:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

OpenClaw 内置了一个 `alibaba` 视频生成提供商，用于在
Alibaba Model Studio / DashScope 上使用 Wan 模型。

- 提供商：`alibaba`
- 首选凭证：`MODELSTUDIO_API_KEY`
- 同样接受：`DASHSCOPE_API_KEY`、`QWEN_API_KEY`
- API：DashScope / Model Studio 异步视频生成

## 入门指南

<Steps>
  <Step title="设置 API key">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
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
  <Step title="验证提供商是否可用">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
任一受支持的凭证 key（`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`、`QWEN_API_KEY`）都可以使用。`qwen-standard-api-key` 新手引导选项会配置共享的 DashScope 凭证。
</Note>

## 内置 Wan 模型

内置的 `alibaba` 提供商当前注册了以下模型：

| 模型引用 | 模式 |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v` | 文本生成视频 |
| `alibaba/wan2.6-i2v` | 图像生成视频 |
| `alibaba/wan2.6-r2v` | 参考生成视频 |
| `alibaba/wan2.6-r2v-flash` | 参考生成视频（快速） |
| `alibaba/wan2.7-r2v` | 参考生成视频 |

## 当前限制

| 参数 | 限制 |
| --------------------- | --------------------------------------------------------- |
| 输出视频 | 每次请求最多 **1** 个 |
| 输入图像 | 最多 **1** 张 |
| 输入视频 | 最多 **4** 个 |
| 时长 | 最长 **10 秒** |
| 支持的控制项 | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 参考图像/视频 | 仅支持远程 `http(s)` URL |

<Warning>
参考图像/视频模式当前要求使用**远程 http(s) URL**。参考输入不支持本地文件路径。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="与 Qwen 的关系">
    内置的 `qwen` 提供商也会使用 Alibaba 托管的 DashScope 端点来进行
    Wan 视频生成。你可以这样选择：

    - 当你想使用规范的 Qwen 提供商界面时，用 `qwen/...`
    - 当你想直接使用厂商自有的 Wan 视频界面时，用 `alibaba/...`

    更多细节请参见 [Qwen 提供商文档](/zh-CN/providers/qwen)。

  </Accordion>

  <Accordion title="凭证 key 优先级">
    OpenClaw 会按以下顺序检查凭证 key：

    1. `MODELSTUDIO_API_KEY`（首选）
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    上述任意一个都可以为 `alibaba` 提供商完成认证。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频工具参数和提供商选择。
  </Card>
  <Card title="Qwen" href="/zh-CN/providers/qwen" icon="microchip">
    Qwen 提供商设置和 DashScope 集成。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    智能体默认值和模型配置。
  </Card>
</CardGroup>
