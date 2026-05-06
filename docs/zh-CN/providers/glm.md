---
read_when:
    - 你想在 OpenClaw 中使用 GLM 模型
    - 你需要模型命名约定和设置
summary: GLM 模型系列概览及其在 OpenClaw 中的使用方法
title: GLM（智谱）
x-i18n:
    generated_at: "2026-05-06T00:20:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM 是可通过 [Z.AI](https://z.ai) 平台使用的模型系列（不是公司）。在 OpenClaw 中，GLM 模型通过内置的 `zai` 提供商访问，引用格式如 `zai/glm-5.1`。

| 属性                | 值                                                                          |
| ------------------- | --------------------------------------------------------------------------- |
| 提供商 ID           | `zai`                                                                       |
| 插件                | 内置，`enabledByDefault: true`                                              |
| 认证环境变量        | `ZAI_API_KEY` 或 `Z_AI_API_KEY`                                             |
| 新手引导选项        | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | OpenAI 兼容                                                                 |
| 默认 base URL       | `https://api.z.ai/api/paas/v4`                                              |
| 建议默认值          | `zai/glm-5.1`                                                               |
| 默认图像模型        | `zai/glm-4.6v`                                                              |

## 入门指南

<Steps>
  <Step title="选择认证路径并运行新手引导">
    选择与你的 Z.AI 套餐和区域匹配的新手引导选项。通用的 `zai-api-key` 选项会根据密钥形态自动检测匹配的端点；如果你想强制使用特定的 Coding Plan 或通用 API 表面，请使用明确的区域选项。

    | 认证选项            | 最适合                                            |
    | ------------------- | ------------------------------------------------- |
    | `zai-api-key`       | 带端点自动检测的通用 API key                     |
    | `zai-coding-global` | Coding Plan 用户（全球）                         |
    | `zai-coding-cn`     | Coding Plan 用户（中国区域）                     |
    | `zai-global`        | 通用 API（全球）                                 |
    | `zai-cn`            | 通用 API（中国区域）                             |

    <CodeGroup>

```bash 自动检测
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan（全球）
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan（中国）
openclaw onboard --auth-choice zai-coding-cn
```

```bash 通用 API（全球）
openclaw onboard --auth-choice zai-global
```

```bash 通用 API（中国）
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="将 GLM 设置为默认模型">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## 配置示例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` 可让 OpenClaw 根据密钥形态检测匹配的 Z.AI 端点，并自动应用正确的 base URL。如果你想固定到特定的 Coding Plan 或通用 API 表面，请使用明确的区域选项。
</Tip>

## 内置目录

内置的 `zai` 提供商会预置 13 个 GLM 模型引用。除非另有标注，所有条目都支持推理；`glm-5v-turbo` 和 `glm-4.6v` 除文本外也接受图像输入。

| 模型引用             | 说明                                               |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | 默认模型。推理，仅文本，202k 上下文。             |
| `zai/glm-5`          | 推理，仅文本，202k 上下文。                       |
| `zai/glm-5-turbo`    | 推理，仅文本，202k 上下文。                       |
| `zai/glm-5v-turbo`   | 推理，文本 + 图像，202k 上下文。                  |
| `zai/glm-4.7`        | 推理，仅文本，204k 上下文。                       |
| `zai/glm-4.7-flash`  | 推理，仅文本，200k 上下文。                       |
| `zai/glm-4.7-flashx` | 推理，仅文本。                                    |
| `zai/glm-4.6`        | 推理，仅文本。                                    |
| `zai/glm-4.6v`       | 推理，文本 + 图像。默认图像模型。                 |
| `zai/glm-4.5`        | 推理，仅文本。                                    |
| `zai/glm-4.5-air`    | 推理，仅文本。                                    |
| `zai/glm-4.5-flash`  | 推理，仅文本。                                    |
| `zai/glm-4.5v`       | 推理，文本 + 图像。                               |

<Note>
  GLM 版本和可用性可能会变化。运行 `openclaw models list --provider zai` 查看你的已安装版本已知的目录行，并查看 Z.AI 文档了解新增或弃用的模型。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="端点自动检测">
    使用 `zai-api-key` 认证选项时，OpenClaw 会检查密钥形态以确定正确的 Z.AI base URL。明确的区域选项（`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`）会覆盖自动检测并直接固定端点。
  </Accordion>

  <Accordion title="提供商详情">
    GLM 模型由 `zai` 运行时提供商提供服务。有关完整的提供商配置、区域端点和其他能力，请参阅 [Z.AI 提供商页面](/zh-CN/providers/zai)。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Z.AI 提供商" href="/zh-CN/providers/zai" icon="server">
    完整的 Z.AI 提供商配置和区域端点。
  </Card>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/zh-CN/tools/thinking" icon="brain">
    面向具备推理能力的 GLM 系列的 `/think` 级别。
  </Card>
  <Card title="Models 常见问题" href="/zh-CN/help/faq-models" icon="circle-question">
    认证配置文件、切换模型，以及解决 “no profile” 错误。
  </Card>
</CardGroup>
