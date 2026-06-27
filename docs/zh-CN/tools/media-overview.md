---
read_when:
    - 查找 OpenClaw 媒体功能概览
    - 决定配置哪个媒体提供商
    - 了解异步媒体生成的工作原理
sidebarTitle: Media overview
summary: 图像、视频、音乐、语音和媒体理解能力一览
title: 媒体概览
x-i18n:
    generated_at: "2026-06-27T03:29:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 可以生成图像、视频和音乐，理解入站媒体（图像、音频、视频），并通过文本转语音大声朗读回复。所有媒体能力都由工具驱动：智能体会根据对话决定何时使用它们，并且每个工具只会在至少配置了一个后端提供商时出现。

实时语音使用 Talk 会话合约，而不是一次性媒体工具路径。Talk 有三种模式：提供商原生的 `realtime`、本地或流式的 `stt-tts`，以及用于仅观察语音捕获的 `transcription`。这些模式与电话、会议、浏览器实时能力和原生按键通话客户端共享提供商目录、事件信封和取消语义。

## 能力

<CardGroup cols={2}>
  <Card title="Image generation" href="/zh-CN/tools/image-generation" icon="image">
    通过 `image_generate`，基于文本提示词或参考图像创建和编辑图像。在聊天会话中异步运行 — 后台执行，并在准备好后发布结果。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    通过 `video_generate` 实现文本转视频、图像转视频和视频转视频。异步运行 — 后台执行，并在准备好后发布结果。
  </Card>
  <Card title="Music generation" href="/zh-CN/tools/music-generation" icon="music">
    通过 `music_generate` 生成音乐或音轨。在聊天会话中基于共享的媒体生成任务生命周期异步运行。
  </Card>
  <Card title="Text-to-speech" href="/zh-CN/tools/tts" icon="microphone">
    通过 `tts` 工具和 `messages.tts` 配置，将出站回复转换为语音音频。同步执行。
  </Card>
  <Card title="Media understanding" href="/zh-CN/nodes/media-understanding" icon="eye">
    使用支持视觉的模型提供商和专用媒体理解插件，总结入站图像、音频和视频。
  </Card>
  <Card title="Speech-to-text" href="/zh-CN/nodes/audio" icon="ear-listen">
    通过批量 STT 或 Voice Call 流式 STT 提供商转录入站语音消息。
  </Card>
</CardGroup>

## 提供商能力矩阵

| 提供商          | 图像 | 视频 | 音乐 | TTS | STT | 实时语音 | 媒体理解 |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram          |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Local CLI         |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| Qwen              |       |   ✓   |       |     |     |                |                     |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
媒体理解会使用你的提供商配置中注册的任何支持视觉或音频的模型。上面的矩阵列出了具备专用媒体理解支持的提供商；大多数多模态 LLM 提供商（Anthropic、Google、OpenAI 等）在配置为当前回复模型时，也可以理解入站媒体。
</Note>

## 异步与同步

| 能力     | 模式         | 原因                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 图像          | 异步 | 提供商处理可能比一个聊天轮次更久；生成的附件使用共享完成路径。   |
| 文本转语音 | 同步  | 提供商响应会在数秒内返回；附加到回复音频。                                   |
| 视频          | 异步 | 提供商处理需要 30 秒到数分钟；较慢的队列可能运行到配置的超时时间。 |
| 音乐          | 异步 | 与视频具有相同的提供商处理特性。                                                    |

对于异步工具，OpenClaw 会将请求提交给提供商，立即返回任务 ID，并在任务账本中跟踪作业。作业运行时，智能体会继续回复其他消息。当提供商完成后，OpenClaw 会用生成的媒体路径唤醒智能体，使其能够通过会话的正常可见回复模式告知用户：配置后自动交付最终回复，或在会话要求使用消息工具时通过 `message(action="send")` 发送。如果请求方会话处于非活动状态，或其主动唤醒失败，并且完成回复中仍缺少某些生成的媒体，OpenClaw 会发送一次幂等的直接兜底回复，只包含缺失的媒体。已经由完成回复交付的媒体不会再次发布。

## 语音转文本和 Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、OpenRouter、SenseAudio 和 xAI 在配置后都可以通过批量 `tools.media.audio` 路径转录入站音频。为提及门控或命令解析预检语音备注的渠道插件，会在入站上下文中标记已转录的附件，因此共享媒体理解流程会复用该转录文本，而不是对同一段音频进行第二次 STT 调用。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 也会注册 Voice Call 流式 STT 提供商，因此实时电话音频可以转发给所选供应商，而无需等待完整录音。

对于实时用户对话，优先使用 [Talk 模式](/zh-CN/nodes/talk)。批量音频附件仍保留在媒体路径上；浏览器实时能力、原生按键通话、电话和会议音频应使用 Talk 事件，以及 Gateway 网关 返回的会话范围目录。

## 提供商映射（供应商如何分布在各个表面）

<AccordionGroup>
  <Accordion title="Google">
    图像、视频、音乐、批量 TTS、后端实时语音和媒体理解表面。
  </Accordion>
  <Accordion title="OpenAI">
    图像、视频、批量 TTS、批量 STT、Voice Call 流式 STT、后端实时语音和记忆嵌入表面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、图像生成/编辑、文本转视频、批量 TTS、批量 STT、图像媒体理解和记忆嵌入表面。在 OpenClaw 为这些类别提供专用提供商合约之前，不会注册 DeepInfra 原生的重排/分类/目标检测模型。
  </Accordion>
  <Accordion title="xAI">
    图像、视频、搜索、代码执行、批量 TTS、批量 STT 和 Voice Call 流式 STT。xAI Realtime 语音是一项上游能力，但在共享实时语音合约能够表示它之前，不会在 OpenClaw 中注册。
  </Accordion>
</AccordionGroup>

## 相关内容

- [图像生成](/zh-CN/tools/image-generation)
- [视频生成](/zh-CN/tools/video-generation)
- [音乐生成](/zh-CN/tools/music-generation)
- [文本转语音](/zh-CN/tools/tts)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频节点](/zh-CN/nodes/audio)
- [Talk 模式](/zh-CN/nodes/talk)
