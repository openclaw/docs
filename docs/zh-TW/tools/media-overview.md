---
read_when:
    - 尋找 OpenClaw 媒體功能的概覽
    - 決定要設定哪個媒體提供者
    - 了解非同步媒體生成的運作方式
sidebarTitle: Media overview
summary: 影像、影片、音樂、語音與媒體理解能力一覽
title: 媒體概覽
x-i18n:
    generated_at: "2026-05-05T01:50:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd6b93fd79897001d24f3ba5a5c8cb9bd17281116fad17262a6389214db7059
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw 會產生影像、影片和音樂，理解傳入的媒體
（圖片、音訊、影片），並透過文字轉語音大聲讀出回覆。所有
媒體功能都由工具驅動：代理會根據對話判斷何時使用它們，
而且每個工具只會在至少設定了一個後端
供應商時出現。

## 功能

<CardGroup cols={2}>
  <Card title="影像生成" href="/zh-TW/tools/image-generation" icon="image">
    透過 `image_generate`，從文字提示或參考圖片建立和編輯影像。
    同步 — 會隨回覆內嵌完成。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    透過 `video_generate` 進行文字轉影片、圖片轉影片和影片轉影片。
    非同步 — 在背景執行，並在就緒時發布結果。
  </Card>
  <Card title="音樂生成" href="/zh-TW/tools/music-generation" icon="music">
    透過 `music_generate` 產生音樂或音軌。共享
    供應商為非同步；ComfyUI 工作流程路徑則同步執行。
  </Card>
  <Card title="文字轉語音" href="/zh-TW/tools/tts" icon="microphone">
    透過 `tts` 工具加上
    `messages.tts` 設定，將傳出回覆轉換為語音音訊。同步。
  </Card>
  <Card title="媒體理解" href="/zh-TW/nodes/media-understanding" icon="eye">
    使用具備視覺能力的模型供應商和專用媒體理解 plugins，
    摘要傳入的圖片、音訊和影片。
  </Card>
  <Card title="語音轉文字" href="/zh-TW/nodes/audio" icon="ear-listen">
    透過批次 STT 或 Voice Call
    串流 STT 供應商轉錄傳入的語音訊息。
  </Card>
</CardGroup>

## 供應商功能矩陣

| 供應商    | 影像 | 影片 | 音樂 | TTS | STT | 即時語音 | 媒體理解 |
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
媒體理解會使用你供應商設定中註冊的任何具備視覺能力或音訊能力的模型。
上方矩陣列出具備專用媒體理解支援的供應商；多數多模態 LLM
供應商（Anthropic、Google、OpenAI 等）在設定為作用中的
回覆模型時，也能理解傳入的媒體。
</Note>

## 非同步與同步

| 功能      | 模式         | 原因                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 影像           | 同步  | 供應商回應會在數秒內返回；隨回覆內嵌完成。 |
| 文字轉語音  | 同步  | 供應商回應會在數秒內返回；附加到回覆音訊。 |
| 影片           | 非同步 | 供應商處理需要 30 秒到數分鐘。                 |
| 音樂（共享）  | 非同步 | 與影片相同的供應商處理特性。                  |
| 音樂（ComfyUI） | 同步  | 本機工作流程會針對已設定的 ComfyUI 伺服器內嵌執行。  |

對於非同步工具，OpenClaw 會將請求提交給供應商、立即返回任務
id，並在任務帳本中追蹤作業。作業執行期間，代理會繼續
回應其他訊息。供應商完成後，
OpenClaw 會用產生的媒體路徑喚醒代理，讓它告知
使用者，並在來源交付政策要求時，透過
訊息工具轉送結果。

## 語音轉文字與 Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio 和 xAI 都可以在設定後，
透過批次 `tools.media.audio` 路徑轉錄
傳入音訊。Channel plugins 會在為提及門檻或命令
解析而預檢語音備註時，將已轉錄的附件標記在傳入內容上，
因此共享媒體理解流程會重用該文字稿，而不是對同一段音訊
進行第二次 STT 呼叫。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 也會註冊 Voice Call
串流 STT 供應商，因此可以將即時電話音訊轉送給所選
供應商，而不必等待錄音完成。

## 供應商對應（供應商如何分布於各介面）

<AccordionGroup>
  <Accordion title="Google">
    影像、影片、音樂、批次 TTS、後端即時語音，以及
    媒體理解介面。
  </Accordion>
  <Accordion title="OpenAI">
    影像、影片、批次 TTS、批次 STT、Voice Call 串流 STT、後端
    即時語音，以及記憶嵌入介面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、影像生成/編輯、文字轉影片、批次 TTS、
    批次 STT、影像媒體理解，以及記憶嵌入介面。
    DeepInfra 原生重新排序/分類/物件偵測模型尚未
    註冊，直到 OpenClaw 為這些
    類別提供專用供應商合約。
  </Accordion>
  <Accordion title="xAI">
    影像、影片、搜尋、程式碼執行、批次 TTS、批次 STT，以及 Voice
    Call 串流 STT。xAI Realtime voice 是上游能力，但在共享即時語音合約能夠
    表示它之前，不會註冊到 OpenClaw。
  </Accordion>
</AccordionGroup>

## 相關

- [影像生成](/zh-TW/tools/image-generation)
- [影片生成](/zh-TW/tools/video-generation)
- [音樂生成](/zh-TW/tools/music-generation)
- [文字轉語音](/zh-TW/tools/tts)
- [媒體理解](/zh-TW/nodes/media-understanding)
- [音訊節點](/zh-TW/nodes/audio)
