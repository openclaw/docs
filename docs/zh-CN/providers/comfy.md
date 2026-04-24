---
read_when:
    - 你想在 OpenClaw 中使用本地 ComfyUI 工作流
    - 你想将 Comfy Cloud 与图像、视频或音乐工作流一起使用
    - 你需要内置 comfy 插件配置键名
summary: OpenClaw 中的 ComfyUI 工作流图像、视频和音乐生成设置
title: ComfyUI
x-i18n:
    generated_at: "2026-04-24T20:30:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw 内置了一个 `comfy` 插件，用于执行由工作流驱动的 ComfyUI 运行。该插件完全由工作流驱动，因此 OpenClaw 不会尝试将通用的 `size`、`aspectRatio`、`resolution`、`durationSeconds` 或类似 TTS 的控制项映射到你的图中。

| 属性 | 详情 |
| --------------- | -------------------------------------------------------------------------------- |
| 提供商 | `comfy` |
| 模型 | `comfy/workflow` |
| 共享接口 | `image_generate`, `video_generate`, `music_generate` |
| 认证 | 本地 ComfyUI 无需认证；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| API | ComfyUI `/prompt` / `/history` / `/view` 和 Comfy Cloud `/api/*` |

## 它支持的功能

- 从工作流 JSON 生成图像
- 使用 1 张上传的参考图像进行图像编辑
- 从工作流 JSON 生成视频
- 使用 1 张上传的参考图像生成视频
- 通过共享的 `music_generate` 工具生成音乐或音频
- 从已配置的节点下载输出，或下载所有匹配的输出节点

## 入门指南

你可以选择在自己的机器上运行 ComfyUI，或使用 Comfy Cloud。

<Tabs>
  <Tab title="Local">
    **最适合：** 在你的机器或局域网上运行你自己的 ComfyUI 实例。

    <Steps>
      <Step title="在本地启动 ComfyUI">
        确保你的本地 ComfyUI 实例正在运行（默认地址为 `http://127.0.0.1:8188`）。
      </Step>
      <Step title="准备你的工作流 JSON">
        导出或创建一个 ComfyUI 工作流 JSON 文件。记下提示词输入节点和你希望 OpenClaw 读取的输出节点的节点 ID。
      </Step>
      <Step title="配置提供商">
        设置 `mode: "local"` 并指向你的工作流文件。下面是一个最小化的图像示例：

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="设置默认模型">
        将 OpenClaw 指向你所配置能力使用的 `comfy/workflow` 模型：

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="验证">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最适合：** 在不管理本地 GPU 资源的情况下，在 Comfy Cloud 上运行工作流。

    <Steps>
      <Step title="获取 API 密钥">
        在 [comfy.org](https://comfy.org) 注册，并在你的账户仪表板中生成一个 API 密钥。
      </Step>
      <Step title="设置 API 密钥">
        通过以下任一方式提供你的密钥：

        ```bash
        # 环境变量（推荐）
        export COMFY_API_KEY="your-key"

        # 备用环境变量
        export COMFY_CLOUD_API_KEY="your-key"

        # 或直接内联写入配置
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="准备你的工作流 JSON">
        导出或创建一个 ComfyUI 工作流 JSON 文件。记下提示词输入节点和输出节点的节点 ID。
      </Step>
      <Step title="配置提供商">
        设置 `mode: "cloud"` 并指向你的工作流文件：

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        云模式下，`baseUrl` 默认为 `https://cloud.comfy.org`。只有在你使用自定义云端点时，才需要设置 `baseUrl`。
        </Tip>
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="验证">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置

Comfy 支持共享的顶层连接设置，以及按能力划分的工作流部分（`image`、`video`、`music`）：

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### 共享键名

| 键名 | 类型 | 描述 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode` | `"local"` 或 `"cloud"` | 连接模式。 |
| `baseUrl` | string | 本地模式默认为 `http://127.0.0.1:8188`，云模式默认为 `https://cloud.comfy.org`。 |
| `apiKey` | string | 可选的内联密钥，可替代环境变量 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`。 |
| `allowPrivateNetwork` | boolean | 在云模式下允许使用私有网络 / 局域网 `baseUrl`。 |

### 按能力划分的键名

这些键适用于 `image`、`video` 或 `music` 部分内部：

| 键名 | 必需 | 默认值 | 描述 |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` 或 `workflowPath` | 是 | -- | ComfyUI 工作流 JSON 文件的路径。 |
| `promptNodeId` | 是 | -- | 接收文本提示词的节点 ID。 |
| `promptInputName` | 否 | `"text"` | 提示词节点上的输入名称。 |
| `outputNodeId` | 否 | -- | 读取输出的节点 ID。如果省略，则使用所有匹配的输出节点。 |
| `pollIntervalMs` | 否 | -- | 轮询作业完成状态的间隔时间（毫秒）。 |
| `timeoutMs` | 否 | -- | 工作流运行的超时时间（毫秒）。 |

`image` 和 `video` 部分还支持：

| 键名 | 必需 | 默认值 | 描述 |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId` | 传入参考图像时必需 | -- | 接收上传参考图像的节点 ID。 |
| `inputImageInputName` | 否 | `"image"` | 图像节点上的输入名称。 |

## 工作流详情

<AccordionGroup>
  <Accordion title="Image workflows">
    将默认图像模型设置为 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **参考图像编辑示例：**

    要启用通过上传参考图像进行图像编辑，请在你的图像配置中添加 `inputImageNodeId`：

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Video workflows">
    将默认视频模型设置为 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy 视频工作流通过已配置的图支持文生视频和图生视频。

    <Note>
    OpenClaw 不会将输入视频传入 Comfy 工作流。支持的输入仅包括文本提示词和单张参考图像。
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    内置插件为工作流定义的音频或音乐输出注册了一个音乐生成提供商，并通过共享的 `music_generate` 工具暴露出来：

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    使用 `music` 配置部分指向你的音频工作流 JSON 和输出节点。

  </Accordion>

  <Accordion title="Backward compatibility">
    现有的顶层图像配置（不带嵌套的 `image` 部分）仍然可用：

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw 会将这种旧版结构视为图像工作流配置。你不需要立即迁移，但对于新的设置，推荐使用嵌套的 `image` / `video` / `music` 部分。

    <Tip>
    如果你只使用图像生成，旧版扁平配置和新的嵌套 `image` 部分在功能上是等价的。
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    内置插件提供可选启用的实时覆盖测试：

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    除非配置了对应的 Comfy 工作流部分，否则实时测试会跳过各个图像、视频或音乐用例。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    图像生成工具配置和用法。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    视频生成工具配置和用法。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    音乐和音频生成工具设置。
  </Card>
  <Card title="Provider Directory" href="/zh-CN/providers/index" icon="layers">
    所有提供商和模型引用的概览。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    包含智能体默认设置在内的完整配置参考。
  </Card>
</CardGroup>
