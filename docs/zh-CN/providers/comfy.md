---
read_when:
    - 你想将本地 ComfyUI 工作流与 OpenClaw 搭配使用
    - 你想将 Comfy Cloud 用于图像、视频或音乐工作流
    - 你需要内置的 comfy 插件配置键。
summary: 在 OpenClaw 中设置 ComfyUI 工作流以生成图像、视频和音乐
title: ComfyUI
x-i18n:
    generated_at: "2026-07-11T20:51:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw 内置了一个用于工作流驱动型 ComfyUI 运行的 `comfy` 插件。该插件完全由工作流驱动：OpenClaw 不会将通用的 `size`、`aspectRatio`、`resolution`、`durationSeconds` 或 TTS 风格的控制项映射到你的图中。

| 属性         | 详情                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| 提供商       | `comfy`                                                                                   |
| 模型         | `comfy/workflow`                                                                          |
| 共享工具     | `image_generate`、`video_generate`、`music_generate`                                      |
| 身份验证     | 本地 ComfyUI 无需身份验证；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`      |
| API          | ComfyUI `/prompt` / `/history` / `/view`；Comfy Cloud `/api/*`                            |

## 支持的功能

- 使用工作流 JSON 生成和编辑图像（编辑时接受 1 张上传的参考图像）
- 使用工作流 JSON 生成视频，支持文本生成视频或图像生成视频（1 张参考图像）
- 通过共享的 `music_generate` 工具生成音乐/音频，可选择提供 1 张参考图像
- 从配置的节点下载输出；未配置节点时，从所有匹配的输出节点下载

## 入门指南

选择在自己的计算机上运行 ComfyUI，或使用 Comfy Cloud。

<Tabs>
  <Tab title="Local">
    **最适合：**在你的计算机或局域网上运行自己的 ComfyUI 实例。

    <Steps>
      <Step title="Start ComfyUI locally">
        确保你的本地 ComfyUI 实例正在运行（默认为 `http://127.0.0.1:8188`）。
      </Step>
      <Step title="Prepare your workflow JSON">
        导出或创建 ComfyUI 工作流 JSON 文件。记下提示词输入节点以及希望 OpenClaw 读取的输出节点的节点 ID。
      </Step>
      <Step title="Configure the provider">
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
      <Step title="Set the default model">
        为你配置的能力将 OpenClaw 指向 `comfy/workflow` 模型：

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
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最适合：**在无需管理本地 GPU 资源的情况下，通过 Comfy Cloud 运行工作流。

    <Steps>
      <Step title="Get an API key">
        在 [comfy.org](https://comfy.org) 注册，并通过你的账户控制面板生成 API key。
      </Step>
      <Step title="Set the API key">
        通过以下任一方式提供你的密钥：

        ```bash
        # 新手引导标志
        openclaw onboard --comfy-api-key "your-key"

        # 环境变量（守护进程的首选方式）
        export COMFY_API_KEY="your-key"

        # 备用环境变量
        export COMFY_CLOUD_API_KEY="your-key"

        # 或在配置中内联设置
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepare your workflow JSON">
        导出或创建 ComfyUI 工作流 JSON 文件。记下提示词输入节点和输出节点的节点 ID。
      </Step>
      <Step title="Configure the provider">
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
        云端模式下，`baseUrl` 默认为 `https://cloud.comfy.org`。仅在使用自定义云端端点时设置 `baseUrl`。
        </Tip>
      </Step>
      <Step title="Set the default model">
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
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置

Comfy 支持共享的顶层连接设置，以及按能力划分的工作流配置段（`image`、`video`、`music`）：

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

| 键                    | 类型                     | 描述                                                                                          |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `mode`                | `"local"` 或 `"cloud"`   | 连接模式。默认为 `"local"`。                                                                 |
| `baseUrl`             | 字符串                   | 本地模式默认为 `http://127.0.0.1:8188`，云端模式默认为 `https://cloud.comfy.org`。            |
| `apiKey`              | 字符串                   | 可选的内联密钥，可替代 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 环境变量。                     |
| `allowPrivateNetwork` | 布尔值                   | 在云端模式下允许使用私有网络/局域网 `baseUrl`，或允许本地私有 DNS FQDN。                      |

<Note>
在 `local` 模式下，无需设置 `allowPrivateNetwork` 即可使用回环/私有 IP 字面量以及 `http://comfyui:8188` 之类的单标签服务名称。对于 `https://comfy.local.example.com` 之类外观类似公网域名的私有 DNS FQDN，需要设置 `allowPrivateNetwork: true`。对私有来源的信任范围仅限于配置的协议、主机名和端口；本地重定向不能离开配置的主机名，而云端重定向到公共 CDN 时会使用默认 SSRF 策略进行检查。
</Note>

### 按能力配置的键

这些键适用于 `image`、`video` 或 `music` 配置段：

| 键                           | 必需 | 默认值   | 描述                                                                       |
| ---------------------------- | ---- | -------- | -------------------------------------------------------------------------- |
| `workflow` 或 `workflowPath` | 是   | --       | 内联工作流 JSON，或 ComfyUI 工作流 JSON 文件的路径。                       |
| `promptNodeId`               | 是   | --       | 接收文本提示词的节点 ID。                                                  |
| `promptInputName`            | 否   | `"text"` | 提示词节点上的输入名称。                                                   |
| `outputNodeId`               | 否   | --       | 要从中读取输出的节点 ID。省略时，将使用所有匹配的输出节点。                |
| `pollIntervalMs`             | 否   | `1500`   | 轮询作业是否完成的时间间隔，以毫秒为单位。                                 |
| `timeoutMs`                  | 否   | `300000` | 工作流运行的超时时间，以毫秒为单位。                                       |

`image` 和 `video` 配置段还支持参考图像输入节点：

| 键                    | 必需                         | 默认值    | 描述                             |
| --------------------- | ---------------------------- | --------- | -------------------------------- |
| `inputImageNodeId`    | 是（传入参考图像时）         | --        | 接收上传参考图像的节点 ID。      |
| `inputImageInputName` | 否                           | `"image"` | 图像节点上的输入名称。           |

`apiKey` 接受字面量字符串或[机密引用](/zh-CN/gateway/configuration-reference#secrets)对象。

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

    要启用通过上传参考图像进行图像编辑，请在图像配置中添加 `inputImageNodeId`：

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

    Comfy 视频工作流通过配置的图支持文本生成视频和图像生成视频。

    <Note>
    OpenClaw 不会将输入视频传入 Comfy 工作流。仅支持文本提示词和单张参考图像作为输入。
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    内置插件为工作流定义的音频或音乐输出注册了一个音乐生成提供商，并通过共享的 `music_generate` 工具提供该功能。它接受可选的参考图像（最多 1 张）：

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    使用 `music` 配置段指向你的音频工作流 JSON 和输出节点。

  </Accordion>

  <Accordion title="Backward compatibility">
    现有的顶层图像配置（不含嵌套的 `image` 配置段）仍然有效：

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

    OpenClaw 会将该旧版结构视为图像工作流配置。你不需要立即迁移，但对于新设置，建议使用嵌套的 `image` / `video` / `music` 配置段。如果你只使用图像生成，则旧版扁平配置与新的嵌套 `image` 配置段在功能上等效。

  </Accordion>

  <Accordion title="Live tests">
    内置插件提供了可选择启用的实时测试覆盖：

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    除非已配置对应的 Comfy 工作流部分，否则实时测试会跳过单独的图像、视频或音乐用例。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    图像生成工具的配置和用法。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    视频生成工具的配置和用法。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    音乐和音频生成工具的设置。
  </Card>
  <Card title="提供商目录" href="/zh-CN/providers/index" icon="layers">
    所有提供商和模型引用的概览。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/config-agents#agent-defaults" icon="gear">
    完整的配置参考，包括 Agent 默认设置。
  </Card>
</CardGroup>
