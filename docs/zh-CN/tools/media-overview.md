---
read_when:
    - 查找 OpenClaw 的媒体能力概览
    - 决定要配置哪个媒体提供商
    - 了解异步媒体生成的工作方式
sidebarTitle: Media overview
summary: 图像、视频、音乐、语音和媒体理解能力一览
title: 媒体概览
x-i18n:
    generated_at: "2026-04-28T12:05:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 生成图像、视频和音乐，理解传入媒体（图像、音频、视频），并使用文本转语音大声说出回复。所有媒体能力都由工具驱动：智能体会根据对话决定何时使用它们，并且每个工具只有在至少配置了一个后端提供商时才会出现。

## 能力

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    通过 `image_generate` 根据文本提示词或参考图像创建和编辑图像。同步执行——随回复内联完成。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    通过 `video_generate` 执行文生视频、图生视频和视频转视频。异步执行——在后台运行，并在结果就绪后发布。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    通过 `music_generate` 生成音乐或音轨。在共享提供商上异步执行；ComfyUI 工作流路径同步运行。
  </Card>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="microphone">
    通过 `tts` 工具和 `messages.tts` 配置，将发出的回复转换为语音音频。同步执行。
  </Card>
  <Card title="媒体理解" href="/zh-CN/nodes/media-understanding" icon="eye">
    使用支持视觉的模型提供商和专用媒体理解插件，总结传入的图像、音频和视频。
  </Card>
  <Card title="语音转文本" href="/zh-CN/nodes/audio" icon="ear-listen">
    通过批量 STT 或 Voice Call 流式 STT 提供商转录传入的语音消息。
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
媒体理解会使用你的提供商配置中注册的任何支持视觉或支持音频的模型。上面的矩阵列出了具有专用媒体理解支持的提供商；大多数多模态 LLM 提供商（Anthropic、Google、OpenAI 等）在配置为活动回复模型时，也可以理解传入媒体。
</Note>

## 异步与同步

| 能力      | 模式         | 原因                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 图像           | 同步  | 提供商响应会在数秒内返回；随回复内联完成。 |
| 文本转语音  | 同步  | 提供商响应会在数秒内返回；附加到回复音频。 |
| 视频           | 异步 | 提供商处理需要 30 秒到数分钟。                 |
| 音乐（共享）  | 异步 | 与视频具有相同的提供商处理特征。                  |
| 音乐（ComfyUI） | 同步  | 本地工作流会针对已配置的 ComfyUI 服务器内联运行。  |

对于异步工具，OpenClaw 会将请求提交给提供商，立即返回任务 ID，并在任务账本中跟踪作业。智能体会在作业运行期间继续响应其他消息。当提供商完成后，OpenClaw 会唤醒智能体，使其可以将完成的媒体发布回原始渠道。

## 语音转文本和 Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio 和 xAI 在配置后都可以通过批量 `tools.media.audio` 路径转录传入音频。对语音便笺执行预检以进行提及门控或命令解析的渠道插件，会在传入上下文中标记已转录的附件，因此共享媒体理解流程会复用该转录，而不会为同一段音频发起第二次 STT 调用。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 还会注册 Voice Call 流式 STT 提供商，因此实时电话音频可以转发给所选供应商，而无需等待完整录音完成。

## 提供商映射（供应商如何拆分到不同表面）

<AccordionGroup>
  <Accordion title="Google">
    图像、视频、音乐、批量 TTS、后端实时语音和媒体理解表面。
  </Accordion>
  <Accordion title="OpenAI">
    图像、视频、批量 TTS、批量 STT、Voice Call 流式 STT、后端实时语音和记忆嵌入表面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、图像生成/编辑、文本转视频、批量 TTS、批量 STT、图像媒体理解和记忆嵌入表面。在 OpenClaw 为这些类别提供专用提供商契约之前，DeepInfra 原生的重排序/分类/目标检测模型不会注册。
  </Accordion>
  <Accordion title="xAI">
    图像、视频、搜索、代码执行、批量 TTS、批量 STT 和 Voice Call 流式 STT。xAI Realtime 语音是一项上游能力，但在共享实时语音契约能够表示它之前，不会在 OpenClaw 中注册。
  </Accordion>
</AccordionGroup>

## 相关

- [图像生成](/zh-CN/tools/image-generation)
- [视频生成](/zh-CN/tools/video-generation)
- [音乐生成](/zh-CN/tools/music-generation)
- [文本转语音](/zh-CN/tools/tts)
- [媒体理解](/zh-CN/nodes/media-understanding)
- [音频节点](/zh-CN/nodes/audio)
