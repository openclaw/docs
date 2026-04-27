---
read_when:
    - 你想在 OpenClaw 中使用 Qwen
    - 你之前使用过 Qwen OAuth
summary: 通过 OpenClaw 内置的 qwen 提供商使用 Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-04-27T11:01:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 56cb6fb38db4190c195c567112ca1be80877ae3836478276d8a9598a28b886d9
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**Qwen OAuth 已被移除。** 之前使用 `portal.qwen.ai` 端点的免费层 OAuth 集成
（`qwen-portal`）现已不可用。
背景信息请参见 [Issue #49557](https://github.com/openclaw/openclaw/issues/49557)。

</Warning>

OpenClaw 现在将 Qwen 视为一个一等内置提供商，其规范 ID 为
`qwen`。该内置提供商面向 Qwen Cloud / Alibaba DashScope 以及
Coding Plan 端点，并将旧版 `modelstudio` ID 保留为
兼容性别名。

- 提供商：`qwen`
- 首选环境变量：`QWEN_API_KEY`
- 兼容性下也接受：`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`
- API 风格：与 OpenAI 兼容

<Tip>
如果你想使用 `qwen3.6-plus`，请优先选择**标准版（按量付费）**端点。
Coding Plan 对它的支持可能会落后于公开目录。
</Tip>

## 入门指南

选择你的套餐类型并按照设置步骤操作。

<Tabs>
  <Tab title="Coding Plan（订阅制）">
    **最适合：** 通过 Qwen Coding Plan 获取订阅制访问。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制一个 API 密钥。
      </Step>
      <Step title="运行新手引导">
        对于 **Global** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        对于 **China** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
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
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice ID 和 `modelstudio/...` 模型引用仍然
    可作为兼容性别名使用，但新的设置流程应优先使用规范的
    `qwen-*` auth-choice ID 和 `qwen/...` 模型引用。
    </Note>

  </Tab>

  <Tab title="标准版（按量付费）">
    **最适合：** 通过标准版 Model Studio 端点进行按量付费访问，包括 `qwen3.6-plus` 等可能在 Coding Plan 中不可用的模型。

    <Steps>
      <Step title="获取你的 API 密钥">
        在 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制一个 API 密钥。
      </Step>
      <Step title="运行新手引导">
        对于 **Global** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        对于 **China** 端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
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
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice ID 和 `modelstudio/...` 模型引用仍然
    可作为兼容性别名使用，但新的设置流程应优先使用规范的
    `qwen-*` auth-choice ID 和 `qwen/...` 模型引用。
    </Note>

  </Tab>
</Tabs>

## 套餐类型和端点

| 套餐 | 区域 | Auth choice | 端点 |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| 标准版（按量付费） | 中国 | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1` |
| 标准版（按量付费） | 全球 | `qwen-standard-api-key` | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（订阅制） | 中国 | `qwen-api-key-cn` | `coding.dashscope.aliyuncs.com/v1` |
| Coding Plan（订阅制） | 全球 | `qwen-api-key` | `coding-intl.dashscope.aliyuncs.com/v1` |

提供商会根据你的 auth choice 自动选择端点。规范
选项使用 `qwen-*` 系列；`modelstudio-*` 仅保留用于兼容性。
你也可以在配置中使用自定义 `baseUrl` 进行覆盖。

<Tip>
**管理密钥：** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文档：** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 内置目录

OpenClaw 当前内置了以下 Qwen 目录。所配置的目录
会感知端点类型：Coding Plan 配置会省略那些仅已知在
标准版端点上可用的模型。

| 模型引用 | 输入 | 上下文 | 说明 |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus` | text, image | 1,000,000 | 默认模型 |
| `qwen/qwen3.6-plus` | text, image | 1,000,000 | 需要此模型时优先选择标准版端点 |
| `qwen/qwen3-max-2026-01-23` | text | 262,144 | Qwen Max 系列 |
| `qwen/qwen3-coder-next` | text | 262,144 | 编码 |
| `qwen/qwen3-coder-plus` | text | 1,000,000 | 编码 |
| `qwen/MiniMax-M2.5` | text | 1,000,000 | 已启用推理 |
| `qwen/glm-5` | text | 202,752 | GLM |
| `qwen/glm-4.7` | text | 202,752 | GLM |
| `qwen/kimi-k2.5` | text, image | 262,144 | 通过 Alibaba 提供的 Moonshot AI |

<Note>
即使某个模型出现在内置目录中，它的可用性仍可能因端点和计费套餐而异。
</Note>

## Thinking 控制

对于支持推理的 Qwen Cloud 模型，内置提供商会将 OpenClaw 的
thinking 级别映射到 DashScope 顶层请求标志 `enable_thinking`。禁用
thinking 时会发送 `enable_thinking: false`；其他 thinking 级别则发送
`enable_thinking: true`。

## 多模态扩展

`qwen` 插件还会在**标准版**
DashScope 端点（而不是 Coding Plan 端点）上公开多模态能力：

- **视频理解**：通过 `qwen-vl-max-latest`
- **Wan 视频生成**：通过 `wan2.6-t2v`（默认）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v`

要将 Qwen 用作默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
关于共享工具参数、提供商选择和故障转移行为，请参见[视频生成](/zh-CN/tools/video-generation)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="图像和视频理解">
    内置 Qwen 插件会在**标准版** DashScope 端点（而不是 Coding Plan 端点）上
    为图像和视频注册媒体理解能力。

    | 属性 | 值 |
    | ------------- | --------------------- |
    | 模型 | `qwen-vl-max-latest` |
    | 支持的输入 | Images, video |

    媒体理解会根据已配置的 Qwen 身份验证自动解析 —— 无需
    额外配置。请确保你使用的是支持媒体理解的标准版（按量付费）
    端点。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus 可用性">
    `qwen3.6-plus` 可在标准版（按量付费）Model Studio
    端点上使用：

    - 中国：`dashscope.aliyuncs.com/compatible-mode/v1`
    - 全球：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    如果 Coding Plan 端点对
    `qwen3.6-plus` 返回“unsupported model”错误，请切换到标准版（按量付费），而不是继续使用 Coding Plan
    端点/密钥组合。

  </Accordion>

  <Accordion title="能力规划">
    `qwen` 插件正在被定位为完整 Qwen
    Cloud 接口的供应商归属点，而不仅仅是编码/文本模型。

    - **文本/聊天模型：** 现已内置
    - **工具调用、结构化输出、thinking：** 继承自与 OpenAI 兼容的传输层
    - **图像生成：** 计划在提供商插件层实现
    - **图像/视频理解：** 现已在标准版端点内置
    - **语音/音频：** 计划在提供商插件层实现
    - **内存嵌入/重排序：** 计划通过嵌入适配器接口实现
    - **视频生成：** 现已通过共享视频生成能力内置

  </Accordion>

  <Accordion title="视频生成详情">
    对于视频生成，OpenClaw 会先将已配置的 Qwen 区域映射到匹配的
    DashScope AIGC 主机，然后再提交任务：

    - 全球/国际版：`https://dashscope-intl.aliyuncs.com`
    - 中国：`https://dashscope.aliyuncs.com`

    这意味着，即使普通的 `models.providers.qwen.baseUrl` 指向的是
    Coding Plan 或标准版 Qwen 主机之一，视频生成仍会使用正确的
    区域性 DashScope 视频端点。

    当前内置 Qwen 视频生成限制：

    - 每次请求最多 **1** 个输出视频
    - 最多 **1** 个输入图像
    - 最多 **4** 个输入视频
    - 时长最多 **10 秒**
    - 支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`
    - 参考图像/视频模式当前要求使用**远程 http(s) URL**。本地
      文件路径会被直接拒绝，因为 DashScope 视频端点不接受为这些引用
      上传本地缓冲区。

  </Accordion>

  <Accordion title="流式用量兼容性">
    原生 Model Studio 端点会在共享的
    `openai-completions` 传输层上声明流式用量兼容性。OpenClaw 现在会根据端点
    能力来判断这一点，因此指向相同原生主机的、与 DashScope 兼容的自定义提供商 ID
    也会继承相同的流式用量行为，而不再需要
    必须使用内置 `qwen` 提供商 ID。

    原生流式用量兼容性同时适用于 Coding Plan 主机和
    标准版 DashScope 兼容主机：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="多模态端点区域">
    多模态接口（视频理解和 Wan 视频生成）使用的是
    **标准版** DashScope 端点，而不是 Coding Plan 端点：

    - 全球/国际版标准 base URL：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - 中国标准 base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 网关作为守护进程运行（launchd/systemd），请确保 `QWEN_API_KEY`
    对该进程可用（例如放在 `~/.openclaw/.env` 中，或通过
    `env.shellEnv` 提供）。
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
  <Card title="Alibaba（ModelStudio）" href="/zh-CN/providers/alibaba" icon="cloud">
    旧版 ModelStudio 提供商及迁移说明。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    通用故障排除和常见问题。
  </Card>
</CardGroup>
