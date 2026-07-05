---
read_when:
    - 想了解 OpenClaw 媒体能力概览
    - 决定要配置哪个媒体提供商
    - 了解异步媒体生成的工作原理
sidebarTitle: Media overview
summary: 图像、视频、音乐、语音和媒体理解能力一览
title: 媒体概览
x-i18n:
    generated_at: "2026-07-05T11:47:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 可以生成图像、视频和音乐，理解传入媒体
（图像、音频、视频），并通过文本转语音朗读回复。所有
媒体能力都由工具驱动：智能体会根据对话决定何时使用它们，
并且每个工具只会在至少配置了一个后端提供商时出现。

实时语音使用 Talk 会话契约，而不是一次性媒体工具
路径。Talk 有三种模式：提供商原生的 `realtime`、本地或流式
`stt-tts`，以及用于仅观察语音捕获的 `transcription`。这些模式
与电话、会议、浏览器实时以及原生按键通话客户端共享提供商目录、
事件封包和取消语义。

## 能力

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    通过 `image_generate` 从文本提示词或参考图像创建和编辑图像。
    在聊天会话中异步执行——在后台运行，并在准备就绪后
    发布结果。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    通过 `video_generate` 实现文本转视频、图像转视频和视频转视频。
    异步执行——在后台运行，并在准备就绪后发布结果。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    通过 `music_generate` 生成音乐或音轨。在聊天
    会话中基于共享的媒体生成任务生命周期异步执行。
  </Card>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="microphone">
    通过 `tts` 工具加 `messages.tts` 配置，将出站回复转换为
    语音音频。同步执行。
  </Card>
  <Card title="媒体理解" href="/zh-CN/nodes/media-understanding" icon="eye">
    使用具备视觉能力的模型提供商和专用媒体理解插件，
    总结传入图像、音频和视频。
  </Card>
  <Card title="语音转文本" href="/zh-CN/nodes/audio" icon="ear-listen">
    通过批量 STT 或 Voice Call 流式 STT 提供商转写传入语音消息。
  </Card>
</CardGroup>

## 提供商能力矩阵

<Note>
此表涵盖专用媒体生成、TTS 和 STT 插件。许多
聊天模型提供商（Anthropic、Google、OpenAI 等）也可以通过
它们的回复模型理解传入媒体；请参阅
[媒体理解](/zh-CN/nodes/media-understanding#provider-support-matrix)中的完整提供商列表。
</Note>

| 提供商            | 图像 | 视频 | 音乐 | TTS | STT | 实时语音 | 媒体理解 |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| Azure Speech      |       |       |       |  ✓  |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Deepgram          |       |       |       |     |  ✓  |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Inworld           |       |       |       |  ✓  |     |                |                     |
| LiteLLM           |   ✓   |       |       |     |     |                |                     |
| Local CLI         |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| PixVerse          |       |   ✓   |       |     |     |                |                     |
| Qwen              |       |   ✓   |       |     |     |                |          ✓          |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Volcengine        |       |       |       |  ✓  |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |       |       |       |  ✓  |     |                |                     |

<Note>
这里的**实时语音**是指提供商原生的双向实时能力（Talk
`realtime` 模式，例如 Gemini Live 或 OpenAI Realtime API）——目前只有 Google
和 OpenAI 注册了该能力。Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI
还单独注册了 Voice Call 流式 STT（单向音频转文本）；请参阅下方的
[语音转文本和 Voice Call](#speech-to-text-and-voice-call)。
xAI Realtime voice 是上游能力，但在共享实时语音契约能够表示它之前，
不会在 OpenClaw 中注册。
</Note>

## 异步与同步

| 能力           | 模式 | 原因                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 图像          | 异步 | 提供商处理可能超过一个聊天轮次；生成的附件使用共享完成路径。   |
| 文本转语音 | 同步  | 提供商响应会在数秒内返回；附加到回复音频。                                   |
| 视频          | 异步 | 提供商处理需要 30 秒到几分钟；较慢的队列可能运行到配置的超时时间。 |
| 音乐          | 异步 | 与视频具有相同的提供商处理特征。                                                    |

对于异步工具，OpenClaw 会将请求提交给提供商，立即返回一个任务
ID，并在任务账本中跟踪该作业。智能体会在作业运行时继续
响应其他消息。当提供商完成后，OpenClaw 会用生成的媒体路径唤醒
智能体，使其能够通过会话的正常可见回复模式告知
用户：在已配置时自动投递最终回复，或在会话需要
消息工具时使用 `message(action="send")`。如果请求方会话处于非活动状态，
或其活动唤醒失败，并且完成回复中仍缺少某些生成媒体，
OpenClaw 会发送一个幂等的直接兜底回复，只包含缺失的媒体。
已由完成回复投递过的媒体不会再次发布。

## 语音转文本和 Voice Call

Deepgram、DeepInfra、ElevenLabs、Google、Groq、Mistral、OpenAI、OpenRouter、
SenseAudio 和 xAI 在配置后都可以通过批量
`tools.media.audio` 路径转写传入音频。对语音备注进行预检以用于
提及门控或命令解析的渠道插件，会在传入上下文中标记已转写的
附件，因此共享媒体理解流程会复用该转写文本，而不是对同一
音频发起第二次 STT 调用。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 还注册了 Voice Call
流式 STT 提供商，因此可以将实时电话音频转发给所选
供应商，而无需等待录音完成。

对于实时用户对话，优先使用 [Talk 模式](/zh-CN/nodes/talk)。批量音频
附件仍走媒体路径；浏览器实时、原生按键通话、
电话和会议音频应使用 Talk 事件以及 Gateway 网关返回的
会话范围目录。

## 提供商映射（供应商如何分布在各个表面）

<AccordionGroup>
  <Accordion title="Google">
    图像、视频、音乐、批量 TTS、批量 STT、后端实时语音和
    媒体理解表面。
  </Accordion>
  <Accordion title="OpenAI">
    图像、视频、批量 TTS、批量 STT、Voice Call 流式 STT、后端
    实时语音和记忆嵌入表面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、图像生成/编辑、文本转视频、批量 TTS、
    批量 STT、图像媒体理解和记忆嵌入表面。
    DeepInfra 还公开重排序、分类、目标检测和
    其他原生模型类型；OpenClaw 还没有针对这些
    类别的提供商契约，因此此插件不会注册它们。
  </Accordion>
  <Accordion title="xAI">
    图像、视频、搜索、代码执行、批量 TTS、批量 STT 和 Voice
    Call 流式 STT。xAI Realtime voice 是上游能力，但在
    共享实时语音契约能够表示它之前，不会在 OpenClaw 中
    注册。
  </Accordion>
</AccordionGroup>

## 相关

- [图像生成](/zh-CN/tools/image-generation)
- [视频生成](/zh-CN/tools/video-generation)
- [音乐生成](/zh-CN/tools/music-generation)
- [文本转语音](/zh-CN/tools/tts)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频节点](/zh-CN/nodes/audio)
- [Talk 模式](/zh-CN/nodes/talk)
