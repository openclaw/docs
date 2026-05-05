---
read_when:
    - 寻找 OpenClaw 媒体能力概览
    - 确定要配置哪个媒体提供商
    - 了解异步媒体生成的工作原理
sidebarTitle: Media overview
summary: 图像、视频、音乐、语音和媒体理解能力概览
title: 媒体概览
x-i18n:
    generated_at: "2026-05-05T05:51:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 生成图像、视频和音乐，理解传入媒体
（图像、音频、视频），并使用文本转语音朗读回复。所有
媒体能力都由工具驱动：智能体会根据对话决定何时使用它们，
并且每个工具只会在至少配置了一个后端提供商时出现。

## 能力

<CardGroup cols={2}>
  <Card title="Image generation" href="/zh-CN/tools/image-generation" icon="image">
    通过 `image_generate`，根据文本提示词或参考图像创建和编辑图像。
    同步执行，在回复中内联完成。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    通过 `video_generate` 实现文本转视频、图像转视频和视频转视频。
    异步执行，在后台运行，并在就绪后发布结果。
  </Card>
  <Card title="Music generation" href="/zh-CN/tools/music-generation" icon="music">
    通过 `music_generate` 生成音乐或音轨。共享提供商上为异步；
    ComfyUI 工作流路径同步运行。
  </Card>
  <Card title="Text-to-speech" href="/zh-CN/tools/tts" icon="microphone">
    通过 `tts` 工具和 `messages.tts` 配置，将出站回复转换为语音音频。
    同步执行。
  </Card>
  <Card title="Media understanding" href="/zh-CN/nodes/media-understanding" icon="eye">
    使用具备视觉能力的模型提供商和专用媒体理解插件，
    汇总传入的图像、音频和视频。
  </Card>
  <Card title="Speech-to-text" href="/zh-CN/nodes/audio" icon="ear-listen">
    通过批处理 STT 或 Voice Call 流式 STT 提供商转录传入的语音消息。
  </Card>
</CardGroup>

## 提供商能力矩阵

| 提供商    | 图像 | 视频 | 音乐 | TTS | STT | 实时语音 | 媒体理解 |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra   |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| Local CLI   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |     |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
媒体理解会使用你的提供商配置中注册的任何具备视觉能力或音频能力的模型。
上面的矩阵列出了具备专用媒体理解支持的提供商；大多数多模态 LLM 提供商
（Anthropic、Google、OpenAI 等）在配置为活动回复模型时，也可以理解传入媒体。
</Note>

## 异步与同步

| 能力      | 模式         | 原因                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 图像           | 同步  | 提供商响应会在数秒内返回；在回复中内联完成。                                   |
| 文本转语音  | 同步  | 提供商响应会在数秒内返回；附加到回复音频。                                   |
| 视频           | 异步 | 提供商处理需要 30 秒到数分钟；慢速队列可以运行到配置的超时时间。 |
| 音乐（共享）  | 异步 | 与视频具有相同的提供商处理特征。                                                    |
| 音乐（ComfyUI） | 同步  | 本地工作流会针对配置的 ComfyUI 服务器内联运行。                                    |

对于异步工具，OpenClaw 会向提供商提交请求，立即返回任务
ID，并在任务账本中跟踪作业。作业运行时，智能体会继续
回复其他消息。当提供商完成后，OpenClaw 会用生成的媒体路径唤醒智能体，
以便它告知用户，并在来源交付策略要求时，通过消息工具转发结果。
对于仅支持消息工具的群组/渠道路由，OpenClaw 会将缺失的消息工具交付证据
视为一次失败的完成尝试，并将生成的媒体回退直接发送到原始渠道。

## 语音转文本和 Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio 和 xAI
在配置后都可以通过批处理 `tools.media.audio` 路径转录传入音频。
渠道插件在为提及门控或命令解析预检语音便签时，会在传入上下文中标记
已转录的附件，因此共享媒体理解流程会复用该转录文本，而不是为同一段音频
发起第二次 STT 调用。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 还会注册 Voice Call
流式 STT 提供商，因此实时电话音频可以转发给选定供应商，
无需等待完整录音完成。

## 提供商映射（供应商如何跨表面拆分）

<AccordionGroup>
  <Accordion title="Google">
    图像、视频、音乐、批处理 TTS、后端实时语音和
    媒体理解表面。
  </Accordion>
  <Accordion title="OpenAI">
    图像、视频、批处理 TTS、批处理 STT、Voice Call 流式 STT、后端
    实时语音和记忆嵌入表面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、图像生成/编辑、文本转视频、批处理 TTS、
    批处理 STT、图像媒体理解和记忆嵌入表面。
    在 OpenClaw 为这些类别提供专用提供商契约之前，
    DeepInfra 原生的重排序/分类/对象检测模型不会注册。
  </Accordion>
  <Accordion title="xAI">
    图像、视频、搜索、代码执行、批处理 TTS、批处理 STT 和 Voice
    Call 流式 STT。xAI Realtime voice 是上游能力，但在共享实时语音契约
    能够表示它之前，不会注册到 OpenClaw 中。
  </Accordion>
</AccordionGroup>

## 相关内容

- [图像生成](/zh-CN/tools/image-generation)
- [视频生成](/zh-CN/tools/video-generation)
- [音乐生成](/zh-CN/tools/music-generation)
- [文本转语音](/zh-CN/tools/tts)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频节点](/zh-CN/nodes/audio)
