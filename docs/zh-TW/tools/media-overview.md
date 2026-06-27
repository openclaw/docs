---
read_when:
    - 正在尋找 OpenClaw 媒體功能的概覽
    - 決定要設定哪個媒體提供者
    - 了解非同步媒體生成的運作方式
sidebarTitle: Media overview
summary: 影像、影片、音樂、語音與媒體理解能力一覽
title: 媒體概覽
x-i18n:
    generated_at: "2026-06-27T20:08:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 可生成圖片、影片和音樂，理解傳入媒體
（圖片、音訊、影片），並使用文字轉語音朗讀回覆。所有
媒體功能都由工具驅動：代理會根據對話決定何時使用它們，
而且每個工具只會在至少設定一個後端供應商時出現。

即時語音使用 Talk 工作階段合約，而不是一次性媒體工具
路徑。Talk 有三種模式：供應商原生的 `realtime`、本機或串流式
`stt-tts`，以及用於僅觀察語音擷取的 `transcription`。這些模式
與電話、會議、瀏覽器即時通訊和原生按住說話用戶端共用
供應商目錄、事件信封和取消語意。

## 功能

<CardGroup cols={2}>
  <Card title="Image generation" href="/zh-TW/tools/image-generation" icon="image">
    透過 `image_generate`，從文字提示或參考圖片建立和編輯圖片。
    在聊天工作階段中為非同步 — 會在背景執行，並在就緒時
    發布結果。
  </Card>
  <Card title="Video generation" href="/zh-TW/tools/video-generation" icon="video">
    透過 `video_generate` 進行文字轉影片、圖片轉影片和影片轉影片。
    非同步 — 會在背景執行，並在就緒時發布結果。
  </Card>
  <Card title="Music generation" href="/zh-TW/tools/music-generation" icon="music">
    透過 `music_generate` 生成音樂或音軌。在聊天
    工作階段中，會使用共用的媒體生成任務生命週期進行非同步處理。
  </Card>
  <Card title="Text-to-speech" href="/zh-TW/tools/tts" icon="microphone">
    透過 `tts` 工具加上 `messages.tts` 設定，將傳出的回覆
    轉換為語音音訊。同步。
  </Card>
  <Card title="Media understanding" href="/zh-TW/nodes/media-understanding" icon="eye">
    使用具備視覺能力的模型供應商和專用媒體理解外掛，
    摘要傳入的圖片、音訊和影片。
  </Card>
  <Card title="Speech-to-text" href="/zh-TW/nodes/audio" icon="ear-listen">
    透過批次 STT 或語音通話串流 STT 供應商轉錄傳入的語音訊息。
  </Card>
</CardGroup>

## 供應商功能矩陣

| 供應商          | 圖片 | 影片 | 音樂 | TTS | STT | 即時語音 | 媒體理解 |
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
媒體理解會使用你供應商設定中註冊的任何具備視覺能力或音訊能力的模型。
上方矩陣列出具備專用媒體理解支援的供應商；大多數多模態 LLM 供應商
（Anthropic、Google、OpenAI 等）在設定為作用中的回覆模型時，
也可以理解傳入媒體。
</Note>

## 非同步與同步

| 功能     | 模式         | 原因                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 圖片          | 非同步 | 供應商處理可能超出一次聊天回合；生成的附件使用共用完成路徑。   |
| 文字轉語音 | 同步  | 供應商回應會在數秒內返回；附加到回覆音訊。                                   |
| 影片          | 非同步 | 供應商處理需要 30 秒到數分鐘；緩慢佇列可能執行到設定的逾時時間。 |
| 音樂          | 非同步 | 與影片相同的供應商處理特性。                                                    |

對於非同步工具，OpenClaw 會將請求提交給供應商，立即返回任務
id，並在任務帳本中追蹤作業。代理會在作業執行期間繼續
回應其他訊息。當供應商完成時，OpenClaw 會用生成的媒體路徑
喚醒代理，讓它能透過工作階段一般可見回覆模式告知
使用者：設定時自動交付最終回覆，或在工作階段要求
訊息工具時使用 `message(action="send")`。如果請求者工作階段
處於非作用中，或其作用中喚醒失敗，且完成回覆中仍缺少
某些生成媒體，OpenClaw 會只針對缺少的媒體傳送具冪等性的
直接備援。已由完成回覆交付的媒體不會再次發布。

## 語音轉文字與語音通話

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、OpenRouter、SenseAudio 和 xAI 在設定後，
都可以透過批次 `tools.media.audio` 路徑轉錄傳入音訊。
會為提及閘控或命令解析預檢語音備註的頻道外掛，會在傳入
內容上標記已轉錄的附件，因此共用媒體理解流程會重用該轉錄稿，
而不是針對同一段音訊進行第二次 STT 呼叫。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 也會註冊語音通話
串流 STT 供應商，因此即時電話音訊可以轉送到選取的
廠商，而不必等待完整錄音。

對於即時使用者對話，請優先使用 [Talk 模式](/zh-TW/nodes/talk)。批次音訊
附件會保留在媒體路徑上；瀏覽器即時通訊、原生按住說話、
電話和會議音訊應使用 Talk 事件，以及閘道傳回的
工作階段範圍目錄。

## 供應商對應（廠商如何分散到各介面）

<AccordionGroup>
  <Accordion title="Google">
    圖片、影片、音樂、批次 TTS、後端即時語音，以及
    媒體理解介面。
  </Accordion>
  <Accordion title="OpenAI">
    圖片、影片、批次 TTS、批次 STT、語音通話串流 STT、後端
    即時語音，以及記憶嵌入介面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、圖片生成/編輯、文字轉影片、批次 TTS、
    批次 STT、圖片媒體理解，以及記憶嵌入介面。
    DeepInfra 原生的重新排序/分類/物件偵測模型，在 OpenClaw
    具備這些類別的專用供應商合約之前不會註冊。
  </Accordion>
  <Accordion title="xAI">
    圖片、影片、搜尋、程式碼執行、批次 TTS、批次 STT，以及語音
    通話串流 STT。xAI Realtime 語音是上游功能，但在共用即時語音
    合約能表示它之前，不會在 OpenClaw 中註冊。
  </Accordion>
</AccordionGroup>

## 相關

- [圖片生成](/zh-TW/tools/image-generation)
- [影片生成](/zh-TW/tools/video-generation)
- [音樂生成](/zh-TW/tools/music-generation)
- [文字轉語音](/zh-TW/tools/tts)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊節點](/zh-TW/nodes/audio)
- [Talk 模式](/zh-TW/nodes/talk)
