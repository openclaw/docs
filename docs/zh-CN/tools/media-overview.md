---
read_when:
    - 想了解 OpenClaw 的媒体能力概览
    - 决定要配置哪个媒体提供商
    - 了解异步媒体生成的工作方式
sidebarTitle: Media overview
summary: 图像、视频、音乐、语音和媒体理解能力一览
title: 媒体概览
x-i18n:
    generated_at: "2026-04-26T05:24:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw 可以生成图像、视频和音乐，理解传入媒体
（图像、音频、视频），并通过文本转语音将回复朗读出来。所有
媒体能力都由工具驱动：智能体会根据对话决定何时使用它们，而每个工具仅会在至少配置了一个
底层提供商时出现。

## 功能

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    通过 `image_generate` 根据文本提示词或参考图像创建和编辑图像。
    同步 —— 与回复内联完成。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    通过 `video_generate` 实现文生视频、图生视频和视频转视频。
    异步 —— 在后台运行，并在准备就绪后发布结果。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    通过 `music_generate` 生成音乐或音频轨道。在共享
    提供商上为异步；ComfyUI 工作流路径为同步运行。
  </Card>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="microphone">
    通过 `tts` 工具以及
    `messages.tts` 配置，将发出的回复转换为语音音频。同步。
  </Card>
  <Card title="媒体理解" href="/zh-CN/nodes/media-understanding" icon="eye">
    使用具备视觉能力的模型
    提供商和专用媒体理解插件，对传入的图像、音频和视频进行摘要。
  </Card>
  <Card title="语音转文本" href="/zh-CN/nodes/audio" icon="ear-listen">
    通过批量 STT 或 Voice Call
    流式 STT 提供商，转录传入的语音消息。
  </Card>
</CardGroup>

## 提供商能力矩阵

| 提供商 | Image | Video | Music | TTS | STT | Realtime voice | Media understanding |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
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
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
媒体理解会使用在你的提供商配置中注册的任何具备视觉能力或音频能力的模型。
上面的矩阵列出了具有专用
媒体理解支持的提供商；大多数多模态 LLM 提供商（Anthropic、Google、
OpenAI 等）在被配置为当前活动回复模型时，也可以理解传入媒体。
</Note>

## 异步与同步

| 能力 | 模式 | 原因 |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 图像 | 同步 | 提供商响应会在几秒内返回；与回复内联完成。 |
| 文本转语音 | 同步 | 提供商响应会在几秒内返回；附加到回复音频。 |
| 视频 | 异步 | 提供商处理需要 30 秒到数分钟。 |
| 音乐（共享） | 异步 | 与视频具有相同的提供商处理特性。 |
| 音乐（ComfyUI） | 同步 | 本地工作流会针对已配置的 ComfyUI 服务器内联运行。 |

对于异步工具，OpenClaw 会将请求提交给提供商，立即返回任务
id，并在任务账本中跟踪该作业。作业运行期间，智能体会继续
响应其他消息。当提供商完成后，
OpenClaw 会唤醒智能体，以便它将完成的媒体发回原始
渠道。

## 语音转文本和 Voice Call

Deepgram、ElevenLabs、Mistral、OpenAI、SenseAudio 和 xAI 都可以在完成配置后，通过批量 `tools.media.audio` 路径转录
传入音频。
对于会在预检语音便笺时执行提及门控或命令解析的渠道插件，
它们会在传入上下文中标记已转录的附件，因此共享的
媒体理解流程会复用该转录结果，而不会为同一段音频再次发起
第二次 STT 调用。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 还会注册 Voice Call
流式 STT 提供商，因此实时电话音频可以转发到所选
供应商，而无需等待录音完成。

## 提供商映射（供应商如何划分到不同表面）

<AccordionGroup>
  <Accordion title="Google">
    图像、视频、音乐、批量 TTS、后端实时语音，以及
    媒体理解表面。
  </Accordion>
  <Accordion title="OpenAI">
    图像、视频、批量 TTS、批量 STT、Voice Call 流式 STT、后端
    实时语音，以及记忆嵌入表面。
  </Accordion>
  <Accordion title="xAI">
    图像、视频、搜索、代码执行、批量 TTS、批量 STT 和 Voice
    Call 流式 STT。xAI Realtime voice 是上游能力，但
    在共享 realtime-voice 合同能够表示它之前，
    不会在 OpenClaw 中注册。
  </Accordion>
</AccordionGroup>

## 相关内容

- [图像生成](/zh-CN/tools/image-generation)
- [视频生成](/zh-CN/tools/video-generation)
- [音乐生成](/zh-CN/tools/music-generation)
- [文本转语音](/zh-CN/tools/tts)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频节点](/zh-CN/nodes/audio)
