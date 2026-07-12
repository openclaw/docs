---
read_when:
    - 你想在 OpenClaw 中使用 Qwen
    - 你订阅了阿里云 Token Plan
    - 你之前使用了 Qwen OAuth
summary: 通过 Qwen Cloud 的 OpenClaw 插件使用它
title: Qwen
x-i18n:
    generated_at: "2026-07-11T20:53:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud 是官方的 OpenClaw 外部提供商插件，规范 id 为 `qwen`。它面向 Qwen Cloud / Alibaba DashScope 标准版和 Coding Plan 端点，将 Token Plan 公开为 `qwen-token-plan`，保留 `modelstudio` 作为兼容别名，独立拥有阿里巴巴文档中定义的 `bailian-token-plan` 自定义提供商 id，并通过 [`qwen-oauth`](/zh-CN/providers/qwen-oauth) 提供 Qwen Portal 令牌流程。

| 属性                   | 值                                         |
| ---------------------- | ------------------------------------------ |
| 提供商                 | `qwen`                                     |
| Token Plan 提供商      | `qwen-token-plan`                          |
| Portal 提供商          | [`qwen-oauth`](/zh-CN/providers/qwen-oauth)      |
| 首选环境变量           | `QWEN_API_KEY`                             |
| Token Plan 环境变量    | `QWEN_TOKEN_PLAN_API_KEY`                  |
| 也接受（兼容）         | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API 风格               | 兼容 OpenAI                                |

<Tip>
`qwen3.7-plus` 和 `qwen3.6-plus` 可用于 Coding Plan 和标准版端点。
对于 `qwen3.7-max` 或 `qwen3.6-flash`，请使用**标准版（按量付费）**端点。
</Tip>

## 安装插件

`qwen` 作为官方外部插件发布，不内置于核心中。安装该插件并重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## 入门指南

选择你的计划类型并按照设置步骤操作。

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **最适合：**通过 Qwen Coding Plan 以订阅方式访问。

    <Steps>
      <Step title="Get your API key">
        从 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API key。
      </Step>
      <Step title="Run onboarding">
        对于**全球**端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        对于**中国**端点：

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
    旧版 `modelstudio-*` 身份验证选项 id 和 `modelstudio/...` 模型引用仍可
    作为兼容别名使用，但新的设置流程应优先使用规范的
    `qwen-*` 身份验证选项 id 和 `qwen/...` 模型引用。如果你定义了一个
    `api` 值不同的精确自定义 `models.providers.modelstudio` 条目，则该
    自定义提供商将拥有 `modelstudio/...` 引用，而非使用 Qwen 兼容
    别名。
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **最适合：**通过标准版 Model Studio 端点按量付费访问，包括 Coding Plan 不提供的 `qwen3.7-max` 和 `qwen3.6-flash`。

    <Steps>
      <Step title="Get your API key">
        从 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API key。
      </Step>
      <Step title="Run onboarding">
        对于**全球**端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        对于**中国**端点：

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
    旧版 `modelstudio-*` 身份验证选项 id 和 `modelstudio/...` 模型引用仍可
    作为兼容别名使用，但新的设置流程应优先使用规范的
    `qwen-*` 身份验证选项 id 和 `qwen/...` 模型引用。如果你定义了一个
    `api` 值不同的精确自定义 `models.providers.modelstudio` 条目，则该
    自定义提供商将拥有 `modelstudio/...` 引用，而非使用 Qwen 兼容
    别名。
    </Note>

  </Tab>

  <Tab title="Token Plan (Team Edition)">
    **最适合：**通过 Alibaba Cloud Model Studio，以额度制团队订阅方式访问 Qwen 和受支持的第三方模型。

    <Steps>
      <Step title="Get your dedicated key">
        分配一个 Token Plan 席位并创建其专用的 `sk-sp-...` key。Token Plan、Coding Plan 和按量付费 key 不能互换使用。请参阅[全球 Token Plan 概览](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview)或[中国 Token Plan 概览](https://help.aliyun.com/zh/model-studio/token-plan-overview)。
      </Step>
      <Step title="Run onboarding">
        对于位于新加坡的**全球 / 国际**端点：

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        对于位于北京的**中国**端点：

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Verify the provider">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    阿里巴巴的 OpenClaw 指南使用 `bailian-token-plan` 表示手动配置的自定义
    提供商。该插件将此 id 注册为兼容所有者，但新配置应使用
    `qwen-token-plan`。精确的自定义
    `models.providers.bailian-token-plan` 条目会继续拥有其已配置的
    传输方式和目录；它绝不会合并到规范的 OpenAI 目录中。
    </Note>

    <Warning>
    Token Plan 只能用于交互式 OpenClaw 会话。不要将其用于
    cron 作业、无人值守脚本或应用后端。阿里巴巴声明，
    非交互式使用可能导致订阅被暂停或 API key 被撤销。
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **最适合：**将 Qwen Portal 令牌用于 `https://portal.qwen.ai/v1`。

    有关专用提供商页面和迁移说明，请参阅 [Qwen OAuth / Portal](/zh-CN/providers/qwen-oauth)。

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
    `qwen-oauth` 使用与 Qwen Cloud 提供商相同的 `QWEN_API_KEY` 环境变量
    名称，但通过 OpenClaw 新手引导进行配置时，会将身份验证信息存储在
    `qwen-oauth` 提供商 id 下。
    </Note>

  </Tab>
</Tabs>

## 计划类型和端点

| 计划                       | 区域 | 身份验证选项               | 端点                                                             |
| -------------------------- | ---- | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan（订阅）        | 中国 | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan（订阅）        | 全球 | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                | 全球 | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| 标准版（按量付费）         | 中国 | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| 标准版（按量付费）         | 全球 | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan（团队版）       | 中国 | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan（团队版）       | 全球 | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

提供商会根据你的身份验证选项自动选择端点。规范选项使用
`qwen-*` 系列；`modelstudio-*` 仅用于兼容。
可在配置中使用自定义 `baseUrl` 覆盖此行为。

<Tip>
**管理 key：**[home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文档：**[docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 内置目录

OpenClaw 内置了以下 Qwen 静态目录。该目录可感知端点：Coding
Plan 配置会省略仅适用于标准版端点的模型。

| 模型引用                    | 输入         | 上下文    | 说明                         |
| --------------------------- | ------------ | --------- | ---------------------------- |
| `qwen/qwen3.5-plus`         | 文本、图像   | 1,000,000 | 默认模型                     |
| `qwen/qwen3.6-flash`        | 文本、图像   | 1,000,000 | 仅限标准版端点               |
| `qwen/qwen3.6-plus`         | 文本、图像   | 1,000,000 | Coding Plan + 标准版         |
| `qwen/qwen3.7-max`          | 文本         | 1,000,000 | 仅限标准版端点               |
| `qwen/qwen3.7-plus`         | 文本、图像   | 1,000,000 | Coding Plan + 标准版         |
| `qwen/qwen3-max-2026-01-23` | 文本         | 262,144   | Qwen Max 系列                |
| `qwen/qwen3-coder-next`     | 文本         | 262,144   | 编程                         |
| `qwen/qwen3-coder-plus`     | 文本         | 1,000,000 | 编程                         |
| `qwen/MiniMax-M2.5`         | 文本         | 1,000,000 | 已启用推理                   |
| `qwen/glm-5`                | 文本         | 202,752   | GLM                          |
| `qwen/glm-4.7`              | 文本         | 202,752   | GLM                          |
| `qwen/kimi-k2.5`            | 文本、图像   | 262,144   | 通过阿里巴巴使用 Moonshot AI |
| `qwen-oauth/qwen3.5-plus`   | 文本、图像   | 1,000,000 | Qwen Portal 默认模型         |

<Note>
即使模型已列入静态目录，其可用性仍可能因端点和计费计划而异。
</Note>

### Token Plan 目录

Token Plan 使用单独的精确字符串允许列表。此处未包含仅用于图像生成的计划
模型，因为它们使用不同的 API。

| 模型引用                            | 输入         | 上下文    |
| ----------------------------------- | ------------ | --------- |
| `qwen-token-plan/qwen3.7-max`       | 文本         | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | 文本、图像   | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | 文本、图像   | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | 文本、图像   | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | 文本         | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | 文本         | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | 文本         | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | 文本、图像   | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | 文本、图像   | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | 文本、图像   | 262,144   |
| `qwen-token-plan/glm-5.2`           | 文本         | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | 文本         | 202,752   |
| `qwen-token-plan/glm-5`             | 文本         | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | 文本         | 196,608   |

## 思考控制

`qwen3.7-max`、`qwen3.7-plus`、`qwen3.6-flash` 和 `qwen3.6-plus` 在内置目录中已启用推理。对于 `qwen` 系列的推理模型，提供商会将 OpenClaw 的思考级别映射到 DashScope 顶层的 `enable_thinking` 请求标志：禁用思考时发送 `enable_thinking: false`，其他任何级别均发送 `enable_thinking: true`。自定义模型可以通过在模型条目上设置 `compat.thinkingFormat: "qwen-chat-template"`，选择使用另一种聊天模板思考负载。

Token Plan 模型也被标记为具备推理能力。`kimi-k2.7-code` 和 `MiniMax-M2.5` 仅支持思考，因此即使会话请求 `/think off`，OpenClaw 仍会保持启用思考。DeepSeek V4 会将 `minimal` 到 `high` 映射为服务的 `high` 推理强度，并将 `xhigh` 或 `max` 映射为 `max`。GLM 5.2 接受从 `minimal` 到 `max` 的完整范围；GLM 5.1 和 GLM 5 接受最高到 `xhigh` 的范围，且三者均默认为 `high`。其他混合模型遵循请求的启用或禁用状态。

## 多模态附加功能

`qwen` 插件仅在 DashScope 的 **Standard** 端点上提供多模态能力，Coding Plan 端点不支持这些能力：

- 通过 `qwen-vl-max-latest` 实现**图像和视频理解**
- 通过 `wan2.6-t2v`（默认）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` 实现 **Wan 视频生成**

系统会根据已配置的 Qwen 身份验证信息自动解析媒体理解功能，无需额外配置。请确保使用 Standard（按量付费）端点，媒体理解功能才能正常工作。

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

视频生成限制：每个请求生成 1 个输出视频；最多可提供 1 张输入图像（图生视频）或 4 个输入视频（视频转视频）；最长时长为 10 秒。支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`。作为参考的图像或视频输入必须使用远程 http(s) URL；本地文件路径会被预先拒绝，因为 DashScope 视频端点不接受为这些参考素材上传的本地缓冲区。

<Note>
有关通用工具参数、提供商选择和故障转移行为，请参阅[视频生成](/zh-CN/tools/video-generation)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="Qwen 3.6 和 3.7 的可用性">
    `qwen3.7-plus` 和 `qwen3.6-plus` 可用于 Coding Plan 和 Standard 端点。`qwen3.7-max` 和 `qwen3.6-flash` 仅可用于 Standard 端点。Standard（按量付费）端点如下：

    - 中国：`dashscope.aliyuncs.com/compatible-mode/v1`
    - 全球：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw 不会在 Coding Plan 目录中列出 `qwen3.7-max` 和 `qwen3.6-flash`。
    如果 Coding Plan 端点针对其中任一模型返回“unsupported model”错误，请切换到对应的 Standard 端点和密钥。

  </Accordion>

  <Accordion title="视频生成区域路由">
    OpenClaw 会先将已配置的 Qwen 区域映射到对应的 DashScope AIGC 主机，然后再提交视频任务：

    - 全球/国际：`https://dashscope-intl.aliyuncs.com`
    - 中国：`https://dashscope.aliyuncs.com`

    即使常规的 `models.providers.qwen.baseUrl` 指向 Coding Plan 或 Standard Qwen 主机，视频生成仍会路由到对应区域的 DashScope 视频端点。

  </Accordion>

  <Accordion title="流式用量兼容性">
    原生 Qwen 端点会在共享的 `openai-completions` 传输层上声明流式用量兼容性，因此以相同原生主机为目标的 DashScope 兼容自定义提供商 ID 会继承相同行为，而不要求必须使用内置的 `qwen` 提供商 ID。此行为适用于 Coding Plan、Standard 和 Token Plan 端点：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="能力规划">
    `qwen` 插件正被定位为完整 Qwen Cloud 功能面的供应商归属位置，而不只是编程和文本模型的归属位置。

    - **文本/聊天模型：**可通过插件使用
    - **工具调用、结构化输出、思考：**继承自 OpenAI 兼容传输层
    - **图像生成：**计划在提供商插件层实现
    - **图像/视频理解：**可通过 Standard 端点上的插件使用
    - **语音/音频：**计划在提供商插件层实现
    - **记忆嵌入/重排序：**计划通过嵌入适配器接口实现
    - **视频生成：**可通过插件及共享的视频生成能力使用

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 网关作为守护进程（launchd/systemd）运行，请确保该进程可以访问 `QWEN_API_KEY` 或 `QWEN_TOKEN_PLAN_API_KEY`（例如，将其放在 `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    通用视频工具参数和提供商选择。
  </Card>
  <Card title="Alibaba Model Studio" href="/zh-CN/providers/alibaba" icon="cloud">
    同一 DashScope 平台上的内置 Wan 视频生成提供商。
  </Card>
  <Card title="故障排查" href="/zh-CN/help/troubleshooting" icon="wrench">
    常规故障排查和常见问题。
  </Card>
</CardGroup>
