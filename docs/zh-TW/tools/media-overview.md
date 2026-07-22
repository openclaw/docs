---
read_when:
    - 想了解 OpenClaw 媒體功能的概覽
    - 決定要設定哪個媒體供應商
    - 了解非同步媒體生成的運作方式
sidebarTitle: Media overview
summary: 圖片、影片、音樂、語音及媒體理解功能一覽
title: 媒體概覽
x-i18n:
    generated_at: "2026-07-22T10:50:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18eb79e6915c5dc8d705bf5cadfcdddecaf7d21a037f102696d4f2bcd41e5bea
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 可產生圖片、影片與音樂、理解傳入的媒體
（圖片、音訊、影片），並透過文字轉語音朗讀回覆。所有
媒體功能皆由工具驅動：代理程式會根據對話決定何時使用，
而且每項工具都只會在至少設定一個後端
供應商時出現。

即時語音使用 Talk 工作階段合約，而非單次媒體工具
路徑。Talk 有三種模式：供應商原生 `realtime`、本機或串流
`stt-tts`，以及用於僅觀察語音擷取的 `transcription`。這些模式
與電話、會議、瀏覽器即時功能及原生按住說話用戶端
共用供應商目錄、事件封套與取消語意。

## 功能

<CardGroup cols={2}>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    透過 `image_generate`，根據文字提示或參考圖片建立及編輯圖片。
    在聊天工作階段中以非同步方式執行——在背景執行，並在
    就緒時發布結果。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    透過 `video_generate` 實現文字轉影片、圖片轉影片及影片轉影片。
    非同步——在背景執行，並在結果就緒時發布。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    透過 `music_generate` 生成音樂或音軌。在聊天
    工作階段中，依照共用的媒體生成任務生命週期非同步執行。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="microphone">
    透過 `tts` 工具搭配 `tts` 設定，
    將傳出回覆轉換為語音音訊。同步執行。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="eye">
    使用具備視覺能力的模型供應商及專用媒體理解外掛，
    摘要傳入的圖片、音訊與影片。
  </Card>
  <Card title="語音轉文字" href="/zh-TW/nodes/audio" icon="ear-listen">
    透過批次 STT 或 Voice Call 串流 STT 供應商，
    轉錄傳入的語音訊息。
  </Card>
</CardGroup>

## 供應商功能矩陣

<Note>
此表涵蓋專用的媒體生成、TTS 與 STT 外掛。許多
聊天模型供應商（Anthropic、Google、OpenAI 等）也可透過其回覆模型
理解傳入媒體；完整供應商清單請參閱
[媒體理解](/zh-TW/nodes/media-understanding#provider-support-matrix)。
</Note>

| 供應商            | 圖片 | 影片 | 音樂 | TTS | STT | 即時語音 | 媒體理解 |
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
| 本機命令列介面    |       |       |       |  ✓  |     |                |                     |
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
此處的**即時語音**是指供應商原生的雙向即時功能（Talk
`realtime` 模式，例如 Gemini Live 或 OpenAI Realtime API）——目前只有 Google
與 OpenAI 註冊此功能。Deepgram、ElevenLabs、Mistral、OpenAI 與 xAI
則另外註冊 Voice Call 串流 STT（單向音訊轉文字）；請參閱下方的
[語音轉文字與 Voice Call](#speech-to-text-and-voice-call)。
xAI 即時語音是上游功能，但在共用即時語音合約能夠表示此功能前，
不會在 OpenClaw 中註冊。
</Note>

## 非同步與同步

| 功能           | 模式   | 原因                                                                                                 |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 圖片           | 非同步 | 供應商處理時間可能超過一輪聊天；生成的附件使用共用完成路徑。                                         |
| 文字轉語音     | 同步   | 供應商回應會在數秒內傳回；附加至回覆音訊。                                                           |
| 影片           | 非同步 | 供應商處理需時 30 秒至數分鐘；緩慢的佇列最長可執行至設定的逾時時間。                                  |
| 音樂           | 非同步 | 與影片具有相同的供應商處理特性。                                                                     |

對於非同步工具，OpenClaw 會將要求提交給供應商、立即傳回任務
ID，並在任務帳本中追蹤工作。工作執行期間，代理程式可繼續
回覆其他訊息。供應商完成後，
OpenClaw 會以生成的媒體路徑喚醒代理程式，使其能透過
工作階段的一般可見回覆模式告知
使用者：若已設定，則自動傳送最終回覆；
若工作階段要求使用訊息工具，則使用 `message(action="send")`。
如果要求者工作階段處於非使用中狀態或其主動喚醒
失敗，且完成回覆仍缺少部分生成的媒體，
OpenClaw 會以冪等的直接備援方式，僅傳送缺少的媒體。已由
完成回覆傳送的媒體不會再次發布。

## 語音轉文字與 Voice Call

設定後，Deepgram、DeepInfra、ElevenLabs、Google、Groq、Mistral、OpenAI、OpenRouter、
SenseAudio 與 xAI 都可透過批次
`tools.media.audio` 路徑轉錄傳入音訊。針對提及閘門或命令剖析
預先檢查語音訊息的頻道外掛，會在傳入內容中標記已轉錄的
附件，讓共用媒體理解流程重複使用該轉錄內容，
而不會對同一段音訊發出第二次 STT 呼叫。

Deepgram、ElevenLabs、Mistral、OpenAI 與 xAI 也會註冊 Voice Call
串流 STT 供應商，因此即時電話音訊可轉送至所選
廠商，無須等待錄音完成。

對於即時使用者對話，建議使用 [Talk 模式](/zh-TW/nodes/talk)。批次音訊
附件仍使用媒體路徑；瀏覽器即時功能、原生按住說話、
電話與會議音訊應使用 Talk 事件，以及閘道傳回的工作階段範圍
目錄。

## 供應商對應（廠商如何分布於各介面）

<AccordionGroup>
  <Accordion title="Google">
    圖片、影片、音樂、批次 TTS、批次 STT、後端即時語音，以及
    媒體理解介面。
  </Accordion>
  <Accordion title="OpenAI">
    圖片、影片、批次 TTS、批次 STT、Voice Call 串流 STT、後端
    即時語音，以及記憶嵌入介面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天／模型路由、圖片生成／編輯、文字轉影片、批次 TTS、
    批次 STT、圖片媒體理解，以及記憶嵌入介面。
    DeepInfra 也提供重新排序、分類、物件偵測及
    其他原生模型類型；OpenClaw 尚未為這些
    類別提供供應商合約，因此此外掛不會註冊它們。
  </Accordion>
  <Accordion title="xAI">
    圖片、影片、搜尋、程式碼執行、批次 TTS、批次 STT，以及 Voice
    Call 串流 STT。xAI 即時語音是上游功能，但在共用即時語音合約能夠
    表示此功能前，不會在 OpenClaw 中
    註冊。
  </Accordion>
</AccordionGroup>

## 相關內容

- [圖片生成](/zh-TW/tools/image-generation)
- [影片生成](/zh-TW/tools/video-generation)
- [音樂生成](/zh-TW/tools/music-generation)
- [文字轉語音](/zh-TW/tools/tts)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊節點](/zh-TW/nodes/audio)
- [Talk 模式](/zh-TW/nodes/talk)
