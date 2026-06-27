---
read_when:
    - 你想将 Qwen 与 OpenClaw 一起使用
    - 你之前使用过 Qwen OAuth
summary: 通过 OpenClaw 插件使用 Qwen Cloud
title: Qwen
x-i18n:
    generated_at: "2026-06-27T03:10:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw 现在将 Qwen 视为拥有规范 id
`qwen` 的一等提供商插件。该提供商插件面向 Qwen Cloud / Alibaba DashScope 和
Coding Plan 端点，让旧版 `modelstudio` id 继续作为兼容性
别名工作，并且还将 Qwen Portal 令牌流程公开为提供商 `qwen-oauth`。

- 提供商：`qwen`
- Portal 提供商：[`qwen-oauth`](/zh-CN/providers/qwen-oauth)
- 首选环境变量：`QWEN_API_KEY`
- 为兼容性也接受：`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`
- API 风格：OpenAI 兼容

<Tip>
如果你想使用 `qwen3.6-plus`，请优先选择 **Standard（按量付费）** 端点。
Coding Plan 支持可能滞后于公开目录。
</Tip>

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 入门指南

选择你的计划类型并按照设置步骤操作。

<Tabs>
  <Tab title="Coding Plan（订阅）">
    **最适合：** 通过 Qwen Coding Plan 进行基于订阅的访问。

    <Steps>
      <Step title="获取你的 API key">
        从 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API key。
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
    旧版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型引用仍然
    可作为兼容性别名工作，但新的设置流程应优先使用规范的
    `qwen-*` auth-choice id 和 `qwen/...` 模型引用。如果你定义了一个精确的
    自定义 `models.providers.modelstudio` 条目，并使用另一个 `api` 值，则该
    自定义提供商拥有 `modelstudio/...` 引用，而不是 Qwen 兼容性
    别名。
    </Note>

  </Tab>

  <Tab title="Standard（按量付费）">
    **最适合：** 通过 Standard Model Studio 端点进行按量付费访问，包括 `qwen3.6-plus` 等可能无法在 Coding Plan 上使用的模型。

    <Steps>
      <Step title="获取你的 API key">
        从 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API key。
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
    旧版 `modelstudio-*` auth-choice id 和 `modelstudio/...` 模型引用仍然
    可作为兼容性别名工作，但新的设置流程应优先使用规范的
    `qwen-*` auth-choice id 和 `qwen/...` 模型引用。如果你定义了一个精确的
    自定义 `models.providers.modelstudio` 条目，并使用另一个 `api` 值，则该
    自定义提供商拥有 `modelstudio/...` 引用，而不是 Qwen 兼容性
    别名。
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最适合：** 针对 `https://portal.qwen.ai/v1` 的 Qwen Portal 令牌。

    请参阅 [Qwen OAuth / Portal](/zh-CN/providers/qwen-oauth) 了解专用提供商
    页面和迁移说明。

    <Steps>
      <Step title="提供你的 Portal 令牌">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="设置默认模型">
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
      <Step title="验证模型可用">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` 使用与 DashScope 提供商相同的 `QWEN_API_KEY` 环境变量名称，
    但通过 OpenClaw 新手引导配置时，会将凭证存储在 `qwen-oauth` 提供商 id 下。
    </Note>

  </Tab>
</Tabs>

## 计划类型和端点

| 计划                       | 区域 | Auth choice                | 端点                                             |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard（按量付费）       | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard（按量付费）       | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（订阅）        | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（订阅）        | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

该提供商会根据你的 auth choice 自动选择端点。规范
选项使用 `qwen-*` 系列；`modelstudio-*` 仅保留用于兼容性。
你可以在配置中使用自定义 `baseUrl` 覆盖。

<Tip>
**管理 key：** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文档：** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 内置目录

OpenClaw 当前随附此 Qwen 静态目录。已配置的目录会
感知端点：Coding Plan 配置会省略已知仅适用于
Standard 端点的模型。

| 模型引用                    | 输入        | 上下文    | 说明                                               |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | 文本、图像  | 1,000,000 | 默认模型                                           |
| `qwen/qwen3.6-plus`         | 文本、图像  | 1,000,000 | 需要此模型时优先使用 Standard 端点                 |
| `qwen/qwen3-max-2026-01-23` | 文本        | 262,144   | Qwen Max 系列                                      |
| `qwen/qwen3-coder-next`     | 文本        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | 文本        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | 文本        | 1,000,000 | 已启用推理                                         |
| `qwen/glm-5`                | 文本        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | 文本        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | 文本、图像  | 262,144   | 通过 Alibaba 使用 Moonshot AI                      |
| `qwen-oauth/qwen3.5-plus`   | 文本、图像  | 1,000,000 | Qwen Portal 默认值                                 |

<Note>
即使模型出现在静态目录中，可用性仍可能因端点和计费计划而异。
</Note>

## 思考控制

对于已启用推理的 Qwen Cloud 模型，该提供商会将 OpenClaw
思考级别映射到 DashScope 的顶层 `enable_thinking` 请求标志。禁用
思考会发送 `enable_thinking: false`；其他思考级别会发送
`enable_thinking: true`。

## 多模态附加功能

`qwen` 插件还在 **Standard**
DashScope 端点（不是 Coding Plan 端点）上公开多模态能力：

- 通过 `qwen-vl-max-latest` 进行**视频理解**
- 通过 `wan2.6-t2v`（默认）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` 进行 **Wan 视频生成**

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
请参阅 [视频生成](/zh-CN/tools/video-generation) 了解共享工具参数、提供商选择和故障转移行为。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="图像和视频理解">
    Qwen 插件会在 **Standard** DashScope 端点
    （不是 Coding Plan 端点）上注册图像和视频的媒体理解。

    | 属性          | 值                    |
    | ------------- | --------------------- |
    | 模型          | `qwen-vl-max-latest`  |
    | 支持的输入    | 图像、视频            |

    媒体理解会根据已配置的 Qwen 凭证自动解析，无需
    额外配置。请确保你使用的是 Standard（按量付费）
    端点，以支持媒体理解。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus 可用性">
    `qwen3.6-plus` 可在 Standard（按量付费）Model Studio
    端点上使用：

    - China：`dashscope.aliyuncs.com/compatible-mode/v1`
    - Global：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    如果 Coding Plan 端点针对
    `qwen3.6-plus` 返回 “unsupported model” 错误，请改用 Standard（按量付费）
    端点/key 组合，而不是 Coding Plan 端点/key 组合。

    OpenClaw 的 Qwen 静态目录不会在 Coding
    Plan 端点上宣传 `qwen3.6-plus`，但会尊重
    `models.providers.qwen.models` 下显式配置的 `qwen/qwen3.6-plus` 条目，
    并在 Coding Plan baseUrl 上生效，因此如果 Aliyun 在你的订阅中启用该模型，
    你可以选择启用它。上游 API 仍会决定调用是否成功。

  </Accordion>

  <Accordion title="能力计划">
    `qwen` 插件正在被定位为完整 Qwen
    Cloud 能力面的供应商归属，而不仅仅是 coding/文本模型。

    - **文本/聊天模型：** 可通过插件使用
    - **工具调用、结构化输出、思考：** 继承自 OpenAI 兼容传输
    - **图像生成：** 计划在提供商插件层实现
    - **图像/视频理解：** 可通过插件在 Standard 端点上使用
    - **语音/音频：** 计划在提供商插件层实现
    - **记忆嵌入/重排序：** 计划通过嵌入适配器表面实现
    - **视频生成：** 可通过插件经由共享视频生成能力使用

  </Accordion>

  <Accordion title="视频生成详情">
    对于视频生成，OpenClaw 会先将已配置的 Qwen 区域映射到匹配的
    DashScope AIGC 主机，然后提交任务：

    - Global/Intl：`https://dashscope-intl.aliyuncs.com`
    - China：`https://dashscope.aliyuncs.com`

    这意味着，指向 Coding Plan 或 Standard Qwen 主机的普通
    `models.providers.qwen.baseUrl` 仍会让视频生成使用正确的
    区域 DashScope 视频端点。

    当前 Qwen 视频生成限制：

    - 每个请求最多 **1** 个输出视频
    - 最多 **1** 张输入图像
    - 最多 **4** 个输入视频
    - 最长 **10 秒** 时长
    - 支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`
    - 参考图像/视频模式目前需要**远程 http(s) URL**。本地
      文件路径会被提前拒绝，因为 DashScope 视频端点不接受为这些参考上传本地缓冲区。

  </Accordion>

  <Accordion title="流式用量兼容性">
    原生 Model Studio 端点会在共享的 `openai-completions` 传输协议上声明流式用量兼容性。OpenClaw 现在会根据端点能力来判断，因此指向相同原生主机的 DashScope 兼容自定义提供商 id 会继承相同的流式用量行为，而不再需要专门使用内置的 `qwen` 提供商 id。

    原生流式用量兼容性同时适用于 Coding Plan 主机和标准 DashScope 兼容主机：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="多模态端点区域">
    多模态能力面（视频理解和 Wan 视频生成）使用 **标准** DashScope 端点，而不是 Coding Plan 端点：

    - 全球/国际标准基础 URL：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - 中国标准基础 URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 网关作为守护进程运行（launchd/systemd），请确保该进程可以访问 `QWEN_API_KEY`（例如，在 `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频工具参数和提供商选择。
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/zh-CN/providers/alibaba" icon="cloud">
    旧版 ModelStudio 提供商和迁移说明。
  </Card>
  <Card title="故障排除" href="/zh-CN/help/troubleshooting" icon="wrench">
    一般故障排除和常见问题。
  </Card>
</CardGroup>
