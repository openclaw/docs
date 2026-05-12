---
read_when:
    - 查找 OpenClaw 的媒体能力概览
    - 决定要配置哪个媒体提供商
    - 了解异步媒体生成的工作原理
sidebarTitle: Media overview
summary: 图像、视频、音乐、语音和媒体理解能力一览
title: 媒体概览
x-i18n:
    generated_at: "2026-05-12T08:45:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7ca89d058467968ee140cb3318fe8a1fb96d09fe7c59982efce36eb9b714591
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
与电话、会议、浏览器实时和原生按键通话客户端共享提供商目录、
事件封包和取消语义。

## 能力

<CardGroup cols={2}>
  <Card title="图像生成" href="/zh-CN/tools/image-generation" icon="image">
    通过 `image_generate` 从文本提示或参考图像创建和编辑图像。
    同步执行——随回复内联完成。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    通过 `video_generate` 实现文本到视频、图像到视频和视频到视频。
    异步执行——在后台运行，并在就绪后发布结果。
  </Card>
  <Card title="音乐生成" href="/zh-CN/tools/music-generation" icon="music">
    通过 `music_generate` 生成音乐或音频轨道。共享提供商上异步执行；
    ComfyUI 工作流路径同步运行。
  </Card>
  <Card title="文本转语音" href="/zh-CN/tools/tts" icon="microphone">
    通过 `tts` 工具和 `messages.tts` 配置，将传出回复转换为语音音频。
    同步执行。
  </Card>
  <Card title="媒体理解" href="/zh-CN/nodes/media-understanding" icon="eye">
    使用具备视觉能力的模型提供商和专用媒体理解插件，
    总结传入图像、音频和视频。
  </Card>
  <Card title="语音转文本" href="/zh-CN/nodes/audio" icon="ear-listen">
    通过批量 STT 或语音通话流式 STT 提供商转录传入语音消息。
  </Card>
</CardGroup>

## 提供商能力矩阵

| 提供商      | 图像 | 视频 | 音乐 | TTS | STT | 实时语音 | 媒体理解 |
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
| 本地 CLI   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
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
（Anthropic、Google、OpenAI 等）在被配置为当前回复模型时，也可以理解
传入媒体。
</Note>

## 异步与同步

| 能力            | 模式 | 原因                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 图像            | 同步 | 提供商响应会在数秒内返回；随回复内联完成。                                   |
| 文本转语音      | 同步 | 提供商响应会在数秒内返回；附加到回复音频。                                   |
| 视频            | 异步 | 提供商处理需要 30 秒到数分钟；较慢队列可能一直运行到配置的超时时间。 |
| 音乐（共享）    | 异步 | 与视频相同的提供商处理特征。                                                    |
| 音乐（ComfyUI） | 同步 | 本地工作流针对配置的 ComfyUI 服务器内联运行。                                    |

对于异步工具，OpenClaw 会将请求提交给提供商，立即返回任务
ID，并在任务账本中跟踪作业。作业运行期间，智能体会继续
回复其他消息。提供商完成后，OpenClaw 会用生成的媒体路径唤醒
智能体，使其能够告知用户，并在来源投递策略要求时，通过
消息工具转发结果。对于仅使用消息工具的群组/频道路由，OpenClaw 会将
缺失消息工具投递证据视为完成尝试失败，并将生成的媒体回退结果
直接发送到原始渠道。

## 语音转文本和语音通话

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、OpenRouter、SenseAudio 和 xAI 在配置后都可以通过
批量 `tools.media.audio` 路径转录传入音频。
如果渠道插件为了提及门控或命令解析而预检语音备注，
它会在传入上下文中标记已转录的附件，因此共享
媒体理解过程会复用该转录稿，而不是为同一段音频发起第二次
STT 调用。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 还会注册语音通话
流式 STT 提供商，因此实时电话音频可以转发到选定的
厂商，而无需等待录音完成。

对于实时用户对话，优先使用 [Talk 模式](/zh-CN/nodes/talk)。批量音频
附件仍留在媒体路径上；浏览器实时、原生按键通话、
电话和会议音频应使用 Talk 事件，以及 Gateway 网关返回的
会话范围目录。

## 提供商映射（厂商如何拆分到各个界面）

<AccordionGroup>
  <Accordion title="Google">
    图像、视频、音乐、批量 TTS、后端实时语音和
    媒体理解界面。
  </Accordion>
  <Accordion title="OpenAI">
    图像、视频、批量 TTS、批量 STT、语音通话流式 STT、后端
    实时语音和记忆嵌入界面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、图像生成/编辑、文本到视频、批量 TTS、
    批量 STT、图像媒体理解和记忆嵌入界面。
    DeepInfra 原生的重排序/分类/对象检测模型不会被注册，
    直到 OpenClaw 为这些类别提供专用的提供商契约。
  </Accordion>
  <Accordion title="xAI">
    图像、视频、搜索、代码执行、批量 TTS、批量 STT 和语音
    通话流式 STT。xAI Realtime voice 是上游能力，但在共享
    实时语音契约能够表示它之前，不会在 OpenClaw 中注册。
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
