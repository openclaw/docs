---
read_when:
    - 尋找 OpenClaw 媒體功能的概覽
    - 決定要設定哪個媒體提供者
    - 了解非同步媒體生成的運作方式
sidebarTitle: Media overview
summary: 圖片、影片、音樂、語音與媒體理解能力一覽
title: 媒體概覽
x-i18n:
    generated_at: "2026-05-05T06:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 會產生圖片、影片與音樂，理解傳入媒體
（圖片、音訊、影片），並使用文字轉語音朗讀回覆。所有
媒體能力都由工具驅動：代理會依據對話決定何時使用它們，
而每個工具只有在至少設定一個後端供應商時才會出現。

## 功能

<CardGroup cols={2}>
  <Card title="圖片產生" href="/zh-TW/tools/image-generation" icon="image">
    透過 `image_generate` 從文字提示或參考圖片建立與編輯圖片。
    同步執行 —— 會在回覆中直接完成。
  </Card>
  <Card title="影片產生" href="/zh-TW/tools/video-generation" icon="video">
    透過 `video_generate` 進行文字轉影片、圖片轉影片與影片轉影片。
    非同步執行 —— 會在背景執行，並在完成時張貼結果。
  </Card>
  <Card title="音樂產生" href="/zh-TW/tools/music-generation" icon="music">
    透過 `music_generate` 產生音樂或音訊軌。共享
    供應商會非同步執行；ComfyUI 工作流程路徑會同步執行。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="microphone">
    透過 `tts` 工具加上 `messages.tts` 設定，將傳出回覆轉換成
    語音音訊。同步執行。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="eye">
    使用具備視覺能力的模型供應商與專用媒體理解 Plugin，
    摘要傳入的圖片、音訊與影片。
  </Card>
  <Card title="語音轉文字" href="/zh-TW/nodes/audio" icon="ear-listen">
    透過批次 STT 或語音通話串流 STT 供應商，轉錄傳入語音訊息。
  </Card>
</CardGroup>

## 供應商能力矩陣

| 供應商      | 圖片 | 影片 | 音樂 | TTS | STT | 即時語音 | 媒體理解 |
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
| 本機 CLI    |       |       |       |  ✓  |     |                |                     |
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
媒體理解會使用供應商設定中註冊的任何具備視覺或音訊能力的模型。
上方矩陣列出具備專用媒體理解支援的供應商；多數多模態 LLM 供應商
（Anthropic、Google、OpenAI 等）在設定為目前使用的回覆模型時，也能理解傳入媒體。
</Note>

## 非同步與同步

| 功能            | 模式         | 原因                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 圖片            | 同步         | 供應商回應會在數秒內返回；會在回覆中直接完成。                                                       |
| 文字轉語音      | 同步         | 供應商回應會在數秒內返回；會附加到回覆音訊。                                                         |
| 影片            | 非同步       | 供應商處理需要 30 秒到數分鐘；較慢的佇列可能會執行到設定的逾時時間。                                |
| 音樂（共享）    | 非同步       | 與影片相同的供應商處理特性。                                                                         |
| 音樂（ComfyUI） | 同步         | 本機工作流程會針對已設定的 ComfyUI 伺服器直接執行。                                                  |

對於非同步工具，OpenClaw 會將請求提交給供應商，立即返回工作
id，並在工作帳本中追蹤該工作。代理會在工作執行期間繼續
回應其他訊息。當供應商完成時，OpenClaw 會使用產生的媒體路徑喚醒代理，
讓代理能告知使用者，並在來源傳遞政策要求時，透過
訊息工具轉送結果。對於僅限訊息工具的群組/頻道路由，OpenClaw 會將
缺少訊息工具傳遞證據視為完成嘗試失敗，並將產生的媒體備援
直接傳送到原始頻道。

## 語音轉文字與語音通話

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio 與 xAI 在設定後，都可以透過
批次 `tools.media.audio` 路徑轉錄傳入音訊。
頻道 Plugin 在為提及門檻或指令解析預檢語音備註時，會在傳入情境中標記
已轉錄的附件，因此共享媒體理解流程會重用該轉錄稿，
而不是為同一段音訊發出第二次 STT 呼叫。

Deepgram、ElevenLabs、Mistral、OpenAI 與 xAI 也會註冊語音通話
串流 STT 供應商，因此即時電話音訊可以轉送給所選
廠商，而不必等待完整錄音完成。

## 供應商對應（廠商如何分布到各個介面）

<AccordionGroup>
  <Accordion title="Google">
    圖片、影片、音樂、批次 TTS、後端即時語音與
    媒體理解介面。
  </Accordion>
  <Accordion title="OpenAI">
    圖片、影片、批次 TTS、批次 STT、語音通話串流 STT、後端
    即時語音與記憶嵌入介面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、圖片產生/編輯、文字轉影片、批次 TTS、
    批次 STT、圖片媒體理解與記憶嵌入介面。
    DeepInfra 原生的重新排序/分類/物件偵測模型，在 OpenClaw 具備這些
    類別的專用供應商合約之前，不會註冊。
  </Accordion>
  <Accordion title="xAI">
    圖片、影片、搜尋、程式碼執行、批次 TTS、批次 STT 與語音
    通話串流 STT。xAI Realtime 語音是一項上游能力，但在
    共享即時語音合約能表示它之前，不會在 OpenClaw 中註冊。
  </Accordion>
</AccordionGroup>

## 相關

- [圖片產生](/zh-TW/tools/image-generation)
- [影片產生](/zh-TW/tools/video-generation)
- [音樂產生](/zh-TW/tools/music-generation)
- [文字轉語音](/zh-TW/tools/tts)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊節點](/zh-TW/nodes/audio)
