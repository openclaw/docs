---
read_when:
    - 你想将本地 ComfyUI 工作流与 OpenClaw 搭配使用
    - 你想将 Comfy Cloud 用于图像、视频或音乐工作流
    - 你需要内置 comfy 插件的配置键
summary: OpenClaw 中的 ComfyUI 工作流图像、视频和音乐生成设置
title: ComfyUI
x-i18n:
    generated_at: "2026-07-05T11:34:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0602dcad22ed36e8cbf5b04f5098f613d48fcd6af55b0e13804cfeb4533d0247
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw 随附内置的 `comfy` 插件，用于以工作流驱动的 ComfyUI 运行。该
插件完全由工作流驱动：OpenClaw 不会把通用的 `size`、
`aspectRatio`、`resolution`、`durationSeconds` 或 TTS 风格控制映射到
你的图。

| 属性         | 详情                                                                             |
| ------------ | -------------------------------------------------------------------------------- |
| 提供商       | `comfy`                                                                          |
| 模型         | `comfy/workflow`                                                                 |
| 共享工具     | `image_generate`、`video_generate`、`music_generate`                             |
| 凭证         | 本地 ComfyUI 无需；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| API          | ComfyUI `/prompt` / `/history` / `/view`；Comfy Cloud `/api/*`                   |

## 支持内容

- 从工作流 JSON 生成和编辑图像（编辑接受 1 张上传的参考图像）
- 从工作流 JSON 生成视频，支持文本生成视频或图像生成视频（1 张参考图像）
- 通过共享的 `music_generate` 工具生成音乐/音频，可选 1 张参考图像
- 从配置的节点下载输出，或在未配置时从所有匹配的输出节点下载

## 入门指南

选择在你自己的机器上运行 ComfyUI，或使用 Comfy Cloud。

<Tabs>
  <Tab title="本地">
    **最适合：** 在你的机器或局域网上运行你自己的 ComfyUI 实例。

    <Steps>
      <Step title="在本地启动 ComfyUI">
        确保你的本地 ComfyUI 实例正在运行（默认值为 `http://127.0.0.1:8188`）。
      </Step>
      <Step title="准备你的工作流 JSON">
        导出或创建一个 ComfyUI 工作流 JSON 文件。记下提示词输入节点和你希望 OpenClaw 读取的输出节点的节点 ID。
      </Step>
      <Step title="配置提供商">
        设置 `mode: "local"` 并指向你的工作流文件。最小图像示例：

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
        将 OpenClaw 指向你已配置能力的 `comfy/workflow` 模型：

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
    **最适合：** 在不管理本地 GPU 资源的情况下在 Comfy Cloud 上运行工作流。

    <Steps>
      <Step title="获取 API key">
        在 [comfy.org](https://comfy.org) 注册，并从你的账号仪表板生成 API key。
      </Step>
      <Step title="设置 API key">
        通过以下任一方法提供你的 key：

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
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
        云模式会默认将 `baseUrl` 设为 `https://cloud.comfy.org`。仅在使用自定义云端端点时设置 `baseUrl`。
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

Comfy 支持共享的顶层连接设置，以及按能力划分的工作流小节（`image`、`video`、`music`）：

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

### 共享键

| 键                    | 类型                   | 描述                                                                                  |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` 或 `"cloud"` | 连接模式。默认值为 `"local"`。                                                       |
| `baseUrl`             | string                 | 本地默认值为 `http://127.0.0.1:8188`，云端默认值为 `https://cloud.comfy.org`。 |
| `apiKey`              | string                 | 可选内联 key，可替代 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 环境变量。 |
| `allowPrivateNetwork` | boolean                | 允许在云模式中使用私有/局域网 `baseUrl`。                                          |

### 按能力配置的键

这些键适用于 `image`、`video` 或 `music` 小节内部：

| 键                           | 必需 | 默认值   | 描述                                                                         |
| ---------------------------- | ---- | -------- | ---------------------------------------------------------------------------- |
| `workflow` 或 `workflowPath` | 是   | --       | 内联工作流 JSON，或 ComfyUI 工作流 JSON 文件的路径。                         |
| `promptNodeId`               | 是   | --       | 接收文本提示词的节点 ID。                                                    |
| `promptInputName`            | 否   | `"text"` | 提示词节点上的输入名称。                                                     |
| `outputNodeId`               | 否   | --       | 要读取输出的节点 ID。如果省略，则使用所有匹配的输出节点。                   |
| `pollIntervalMs`             | 否   | `1500`   | 作业完成轮询间隔，单位为毫秒。                                               |
| `timeoutMs`                  | 否   | `300000` | 工作流运行超时时间，单位为毫秒。                                             |

`image` 和 `video` 小节还支持参考图像输入节点：

| 键                    | 必需                         | 默认值    | 描述                                     |
| --------------------- | ---------------------------- | --------- | ---------------------------------------- |
| `inputImageNodeId`    | 是（传入参考图像时）         | --        | 接收已上传参考图像的节点 ID。           |
| `inputImageInputName` | 否                           | `"image"` | 图像节点上的输入名称。                   |

`apiKey` 接受字面字符串或 [secret reference](/zh-CN/gateway/configuration-reference#secrets) 对象。

## 工作流详情

<AccordionGroup>
  <Accordion title="图像工作流">
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

    要启用带上传参考图像的图像编辑，请在你的图像配置中添加 `inputImageNodeId`：

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

  <Accordion title="视频工作流">
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

    Comfy 视频工作流通过配置的图支持文本生成视频和图像生成视频。

    <Note>
    OpenClaw 不会将输入视频传入 Comfy 工作流。仅支持文本提示词和单张参考图像作为输入。
    </Note>

  </Accordion>

  <Accordion title="音乐工作流">
    内置插件为工作流定义的音频或音乐输出注册音乐生成提供商，并通过共享的 `music_generate` 工具公开。它接受可选参考图像（最多 1 张）：

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    使用 `music` 配置小节指向你的音频工作流 JSON 和输出节点。

  </Accordion>

  <Accordion title="向后兼容性">
    现有的顶层图像配置（没有嵌套的 `image` 小节）仍可使用：

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

    OpenClaw 会将该旧形状视为图像工作流配置。你无需立即迁移，但建议新设置使用嵌套的 `image` / `video` / `music` 小节。如果你只使用图像生成，旧的扁平配置和新的嵌套 `image` 小节在功能上等价。

  </Accordion>

  <Accordion title="实时测试">
    内置插件提供可选择启用的实时覆盖：

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    除非配置了匹配的 Comfy 工作流小节，否则实时测试会跳过单独的图像、视频或音乐用例。

  </Accordion>
</AccordionGroup>

## 相关

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
  <Card title="提供商目录" href="/zh-CN/providers/index" icon="layers">
    所有提供商和模型引用的概览。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    包含 Agent 默认值的完整配置参考。
  </Card>
</CardGroup>
