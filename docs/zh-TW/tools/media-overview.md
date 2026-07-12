---
read_when:
    - 想瞭解 OpenClaw 媒體功能的概覽
    - 決定要設定哪個媒體供應商
    - 瞭解非同步媒體生成的運作方式
sidebarTitle: Media overview
summary: 圖片、影片、音樂、語音與媒體理解能力一覽
title: 媒體概覽
x-i18n:
    generated_at: "2026-07-11T21:52:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 可生成圖片、影片和音樂，理解傳入的媒體
（圖片、音訊、影片），並透過文字轉語音朗讀回覆。所有
媒體功能都由工具驅動：代理程式會根據對話決定何時使用，
而且每項工具只會在至少設定一個支援供應商時出現。

即時語音使用 Talk 工作階段合約，而非單次媒體工具
路徑。Talk 有三種模式：供應商原生的 `realtime`、本機或串流
`stt-tts`，以及用於僅觀察式語音擷取的 `transcription`。這些模式
與電話、會議、瀏覽器即時通訊和原生按住說話用戶端共用
供應商目錄、事件封裝格式和取消語意。

## 功能

<CardGroup cols={2}>
  <Card title="Image generation" href="/zh-TW/tools/image-generation" icon="image">
    透過 `image_generate`，依據文字提示或參考圖片建立和編輯圖片。
    在聊天工作階段中採非同步執行——於背景執行，並在就緒後
    發布結果。
  </Card>
  <Card title="Video generation" href="/zh-TW/tools/video-generation" icon="video">
    透過 `video_generate` 實現文字轉影片、圖片轉影片和影片轉影片。
    採非同步執行——於背景執行，並在就緒後發布結果。
  </Card>
  <Card title="Music generation" href="/zh-TW/tools/music-generation" icon="music">
    透過 `music_generate` 生成音樂或音軌。在聊天
    工作階段中，使用共用的媒體生成任務生命週期非同步執行。
  </Card>
  <Card title="Text-to-speech" href="/zh-TW/tools/tts" icon="microphone">
    透過 `tts` 工具和 `messages.tts` 設定，將傳出回覆轉換成
    語音。採同步執行。
  </Card>
  <Card title="Media understanding" href="/zh-TW/nodes/media-understanding" icon="eye">
    使用具備視覺能力的模型供應商和專用的媒體理解外掛，
    摘要傳入的圖片、音訊和影片。
  </Card>
  <Card title="Speech-to-text" href="/zh-TW/nodes/audio" icon="ear-listen">
    透過批次 STT 或語音通話串流 STT 供應商，
    轉錄傳入的語音訊息。
  </Card>
</CardGroup>

## 供應商功能矩陣

<Note>
此表涵蓋專用的媒體生成、TTS 和 STT 外掛。許多
聊天模型供應商（Anthropic、Google、OpenAI 等）也能透過其回覆模型
理解傳入的媒體；完整供應商清單請參閱
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
此處的**即時語音**是指供應商原生的雙向即時通訊（Talk
`realtime` 模式，例如 Gemini Live 或 OpenAI Realtime API）——目前只有 Google
和 OpenAI 註冊此功能。Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI
另行註冊語音通話串流 STT（單向音訊轉文字）；請參閱下方的
[語音轉文字與語音通話](#speech-to-text-and-voice-call)。
xAI 即時語音是上游功能，但在共用即時語音合約能夠表示它之前，
不會註冊至 OpenClaw。
</Note>

## 非同步與同步

| 功能           | 模式       | 原因                                                                                                 |
| -------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| 圖片           | 非同步     | 供應商的處理時間可能超過單次聊天回合；生成的附件使用共用完成路徑。                                   |
| 文字轉語音     | 同步       | 供應商回應會在數秒內傳回；音訊會附加至回覆。                                                         |
| 影片           | 非同步     | 供應商處理需要 30 秒至數分鐘；緩慢的佇列最長可執行至設定的逾時時間。                                 |
| 音樂           | 非同步     | 具有與影片相同的供應商處理特性。                                                                     |

對於非同步工具，OpenClaw 會將請求提交給供應商、立即傳回任務
識別碼，並在任務帳本中追蹤工作。工作執行期間，代理程式仍可繼續
回應其他訊息。當供應商完成後，
OpenClaw 會以生成媒體的路徑喚醒代理程式，使其能透過工作階段的一般可見回覆模式告知
使用者：若已設定，則自動傳送最終回覆；若工作階段要求
使用訊息工具，則使用 `message(action="send")`。如果請求者的工作階段處於非使用中狀態，或其主動喚醒
失敗，而且完成回覆中仍缺少部分生成媒體，
OpenClaw 會以具等冪性的直接備援方式，僅傳送缺少的媒體。已由
完成回覆傳送的媒體不會再次發布。

## 語音轉文字與語音通話

設定後，Deepgram、DeepInfra、ElevenLabs、Google、Groq、Mistral、OpenAI、OpenRouter、
SenseAudio 和 xAI 都能透過批次
`tools.media.audio` 路徑轉錄傳入的音訊。為提及閘控或命令剖析而預先檢查
語音備註的頻道外掛，會在傳入內容中標記已轉錄的
附件，讓共用媒體理解處理流程重複使用該轉錄內容，
而不會對同一段音訊進行第二次 STT 呼叫。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 也會註冊語音通話
串流 STT 供應商，因此即時電話音訊可直接轉送給所選
供應商，而無須等待錄音完成。

對於即時使用者對話，建議使用 [Talk 模式](/zh-TW/nodes/talk)。批次音訊
附件仍使用媒體路徑；瀏覽器即時通訊、原生按住說話、
電話和會議音訊應使用 Talk 事件，以及由閘道傳回的工作階段範圍
目錄。

## 供應商對應關係（供應商如何分布於各介面）

<AccordionGroup>
  <Accordion title="Google">
    圖片、影片、音樂、批次 TTS、批次 STT、後端即時語音，以及
    媒體理解介面。
  </Accordion>
  <Accordion title="OpenAI">
    圖片、影片、批次 TTS、批次 STT、語音通話串流 STT、後端
    即時語音，以及記憶嵌入介面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天／模型路由、圖片生成／編輯、文字轉影片、批次 TTS、
    批次 STT、圖片媒體理解，以及記憶嵌入介面。
    DeepInfra 也提供重新排序、分類、物件偵測和
    其他原生模型類型；OpenClaw 目前尚未針對這些
    類別提供供應商合約，因此此外掛不會註冊它們。
  </Accordion>
  <Accordion title="xAI">
    圖片、影片、搜尋、程式碼執行、批次 TTS、批次 STT，以及語音
    通話串流 STT。xAI 即時語音是上游功能，但在
    共用即時語音合約能夠表示它之前，不會註冊至 OpenClaw。
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
