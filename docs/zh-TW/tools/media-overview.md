---
read_when:
    - 尋找 OpenClaw 媒體功能概覽
    - 決定要設定哪個媒體提供者
    - 了解非同步媒體生成的運作方式
sidebarTitle: Media overview
summary: 圖片、影片、音樂、語音與媒體理解能力一覽
title: 媒體概覽
x-i18n:
    generated_at: "2026-04-30T03:46:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 會生成圖片、影片和音樂，理解傳入媒體
（圖片、音訊、影片），並使用文字轉語音大聲說出回覆。所有
媒體功能都由工具驅動：代理會根據對話決定何時使用它們，
而且每個工具只有在至少設定一個支援提供者時才會出現。

## 功能

<CardGroup cols={2}>
  <Card title="圖片生成" href="/zh-TW/tools/image-generation" icon="image">
    透過 `image_generate`，從文字提示或參考圖片建立和編輯圖片。
    同步 - 會在回覆中內嵌完成。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    透過 `video_generate` 進行文字轉影片、圖片轉影片和影片轉影片。
    非同步 - 在背景執行，並在準備好後發佈結果。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    透過 `music_generate` 生成音樂或音軌。在共用
    提供者上非同步；ComfyUI 工作流程路徑會同步執行。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="microphone">
    透過 `tts` 工具加上 `messages.tts` 設定，將傳出的回覆
    轉換為語音音訊。同步。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="eye">
    使用具備視覺能力的模型提供者和專用媒體理解 Plugin，
    摘要傳入圖片、音訊和影片。
  </Card>
  <Card title="語音轉文字" href="/zh-TW/nodes/audio" icon="ear-listen">
    透過批次 STT 或 Voice Call 串流 STT 提供者轉錄傳入語音訊息。
  </Card>
</CardGroup>

## 提供者功能矩陣

| 提供者    | 圖片 | 影片 | 音樂 | TTS | STT | 即時語音 | 媒體理解 |
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
媒體理解會使用你提供者設定中註冊的任何具備視覺能力或音訊能力的模型。
上方矩陣列出具備專用媒體理解支援的提供者；大多數多模態 LLM
提供者（Anthropic、Google、OpenAI 等）在設定為目前作用中的回覆模型時，
也可以理解傳入媒體。
</Note>

## 非同步與同步

| 功能      | 模式         | 原因                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 圖片           | 同步  | 提供者回應會在數秒內返回；會在回覆中內嵌完成。 |
| 文字轉語音  | 同步  | 提供者回應會在數秒內返回；會附加到回覆音訊。 |
| 影片           | 非同步 | 提供者處理需要 30 秒到數分鐘。                 |
| 音樂（共用）  | 非同步 | 與影片相同的提供者處理特性。                  |
| 音樂（ComfyUI） | 同步  | 本機工作流程會針對設定的 ComfyUI 伺服器內嵌執行。  |

對於非同步工具，OpenClaw 會將請求提交給提供者、立即返回任務
id，並在任務帳本中追蹤作業。代理會在作業執行期間繼續回應
其他訊息。當提供者完成後，OpenClaw 會喚醒代理，讓它可以將完成的媒體
發佈回原始頻道。

## 語音轉文字與 Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio 和 xAI 都可以在設定後，
透過批次 `tools.media.audio` 路徑轉錄傳入音訊。
預先檢查語音備註以進行提及閘控或命令
解析的頻道 Plugin，會在傳入內容上標記已轉錄附件，因此共用
媒體理解流程會重複使用該逐字稿，而不會針對同一段音訊再發出第二次
STT 呼叫。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 也會註冊 Voice Call
串流 STT 提供者，因此可將即時電話音訊轉送到所選
供應商，而不必等待錄音完成。

## 提供者對應（供應商如何分佈於各介面）

<AccordionGroup>
  <Accordion title="Google">
    圖片、影片、音樂、批次 TTS、後端即時語音，以及
    媒體理解介面。
  </Accordion>
  <Accordion title="OpenAI">
    圖片、影片、批次 TTS、批次 STT、Voice Call 串流 STT、後端
    即時語音，以及記憶嵌入介面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、圖片生成/編輯、文字轉影片、批次 TTS、
    批次 STT、圖片媒體理解，以及記憶嵌入介面。
    DeepInfra 原生重新排序/分類/物件偵測模型尚未
    註冊，直到 OpenClaw 針對這些
    類別具備專用提供者合約為止。
  </Accordion>
  <Accordion title="xAI">
    圖片、影片、搜尋、程式碼執行、批次 TTS、批次 STT，以及 Voice
    Call 串流 STT。xAI Realtime voice 是上游功能，但在共用即時語音合約能夠
    表示它之前，不會在 OpenClaw 中註冊。
  </Accordion>
</AccordionGroup>

## 相關

- [圖片生成](/zh-TW/tools/image-generation)
- [影片生成](/zh-TW/tools/video-generation)
- [音樂生成](/zh-TW/tools/music-generation)
- [文字轉語音](/zh-TW/tools/tts)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊節點](/zh-TW/nodes/audio)
