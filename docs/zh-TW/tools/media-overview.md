---
read_when:
    - 想了解 OpenClaw 媒體功能的概覽
    - 決定要設定哪個媒體提供者
    - 了解非同步媒體生成的運作方式
sidebarTitle: Media overview
summary: 圖片、影片、音樂、語音與媒體理解功能總覽
title: 媒體概覽
x-i18n:
    generated_at: "2026-05-06T02:59:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201d01244fc6a587b730ae3033de5990b2f01f63e6e40339c738c95040e085b3
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 會產生圖片、影片與音樂、理解傳入媒體（圖片、音訊、影片），並透過文字轉語音朗讀回覆。所有媒體能力都由工具驅動：代理會根據對話決定何時使用它們，而且每個工具只會在至少設定一個支援提供者時出現。

即時語音使用 Talk 工作階段合約，而不是一次性媒體工具路徑。Talk 有三種模式：提供者原生的 `realtime`、本機或串流式 `stt-tts`，以及用於僅觀察語音擷取的 `transcription`。這些模式會與電話、會議、瀏覽器即時通訊，以及原生按住說話用戶端共用提供者目錄、事件封套與取消語意。

## 能力

<CardGroup cols={2}>
  <Card title="圖片產生" href="/zh-TW/tools/image-generation" icon="image">
    透過 `image_generate` 從文字提示或參考圖片建立與編輯圖片。同步執行：會隨回覆內嵌完成。
  </Card>
  <Card title="影片產生" href="/zh-TW/tools/video-generation" icon="video">
    透過 `video_generate` 進行文字轉影片、圖片轉影片，以及影片轉影片。非同步執行：會在背景執行，並在準備就緒時發布結果。
  </Card>
  <Card title="音樂產生" href="/zh-TW/tools/music-generation" icon="music">
    透過 `music_generate` 產生音樂或音訊軌。共用提供者會非同步執行；ComfyUI 工作流程路徑會同步執行。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="microphone">
    透過 `tts` 工具加上 `messages.tts` 設定，將對外回覆轉換為語音音訊。同步執行。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="eye">
    使用具備視覺能力的模型提供者與專用媒體理解 Plugin，摘要傳入圖片、音訊與影片。
  </Card>
  <Card title="語音轉文字" href="/zh-TW/nodes/audio" icon="ear-listen">
    透過批次 STT 或 Voice Call 串流 STT 提供者，轉錄傳入語音訊息。
  </Card>
</CardGroup>

## 提供者能力矩陣

| 提供者 | 圖片 | 影片 | 音樂 | TTS | STT | 即時語音 | 媒體理解 |
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
媒體理解會使用任何在你的提供者設定中註冊、具備視覺能力或音訊能力的模型。上方矩陣列出具備專用媒體理解支援的提供者；多數多模態 LLM 提供者（Anthropic、Google、OpenAI 等）在設定為作用中回覆模型時，也能理解傳入媒體。
</Note>

## 非同步與同步

| 能力 | 模式 | 原因 |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 圖片 | 同步 | 提供者回應會在數秒內返回；隨回覆內嵌完成。 |
| 文字轉語音 | 同步 | 提供者回應會在數秒內返回；附加到回覆音訊。 |
| 影片 | 非同步 | 提供者處理需要 30 秒到數分鐘；緩慢佇列可能會執行到設定的逾時時間。 |
| 音樂（共用） | 非同步 | 與影片相同的提供者處理特性。 |
| 音樂（ComfyUI） | 同步 | 本機工作流程會對設定的 ComfyUI 伺服器內嵌執行。 |

對於非同步工具，OpenClaw 會將請求提交給提供者、立即返回任務 ID，並在任務分類帳中追蹤工作。代理會在工作執行期間繼續回應其他訊息。提供者完成後，OpenClaw 會以產生的媒體路徑喚醒代理，讓它告知使用者，並在來源傳遞政策要求時，透過訊息工具轉送結果。對於僅限訊息工具的群組/頻道路由，OpenClaw 會將缺少訊息工具傳遞證據視為完成嘗試失敗，並直接將產生的媒體備援傳送到原始頻道。

## 語音轉文字與 Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio 與 xAI 在設定後，都能透過批次 `tools.media.audio` 路徑轉錄傳入音訊。頻道 Plugin 若為了提及閘控或命令剖析而預先檢查語音備註，會在傳入內容上標記已轉錄的附件，因此共用媒體理解流程會重用該逐字稿，而不是對同一段音訊進行第二次 STT 呼叫。

Deepgram、ElevenLabs、Mistral、OpenAI 與 xAI 也會註冊 Voice Call 串流 STT 提供者，因此即時電話音訊可轉送給選定供應商，而不必等待錄音完成。

對於即時使用者對話，請優先使用 [Talk 模式](/zh-TW/nodes/talk)。批次音訊附件會留在媒體路徑上；瀏覽器即時通訊、原生按住說話、電話與會議音訊應使用 Talk 事件，以及 Gateway 返回的工作階段範圍目錄。

## 提供者對應（供應商如何分布於各介面）

<AccordionGroup>
  <Accordion title="Google">
    圖片、影片、音樂、批次 TTS、後端即時語音，以及媒體理解介面。
  </Accordion>
  <Accordion title="OpenAI">
    圖片、影片、批次 TTS、批次 STT、Voice Call 串流 STT、後端即時語音，以及記憶嵌入介面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、圖片產生/編輯、文字轉影片、批次 TTS、批次 STT、圖片媒體理解，以及記憶嵌入介面。DeepInfra 原生的重新排序/分類/物件偵測模型要等到 OpenClaw 擁有這些類別的專用提供者合約後，才會註冊。
  </Accordion>
  <Accordion title="xAI">
    圖片、影片、搜尋、程式碼執行、批次 TTS、批次 STT，以及 Voice Call 串流 STT。xAI Realtime 語音是上游能力，但在共用即時語音合約能表示它之前，不會在 OpenClaw 中註冊。
  </Accordion>
</AccordionGroup>

## 相關

- [圖片產生](/zh-TW/tools/image-generation)
- [影片產生](/zh-TW/tools/video-generation)
- [音樂產生](/zh-TW/tools/music-generation)
- [文字轉語音](/zh-TW/tools/tts)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊節點](/zh-TW/nodes/audio)
- [Talk 模式](/zh-TW/nodes/talk)
