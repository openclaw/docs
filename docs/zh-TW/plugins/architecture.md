---
read_when:
    - 建置或偵錯原生 OpenClaw 外掛
    - 瞭解外掛能力模型或所有權邊界
    - 處理外掛載入流水線或登錄檔時
    - 實作供應商執行階段掛鉤或頻道外掛
sidebarTitle: Internals
summary: 外掛內部機制：能力模型、所有權、契約、載入流水線與執行階段輔助工具
title: 外掛內部機制
x-i18n:
    generated_at: "2026-07-20T00:53:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 28910ea251a40dd0840726f9f6f6aa65d3bf33b385b0cc61748f14b5ce4c0ee9
    source_path: plugins/architecture.md
    workflow: 16
---

這是 OpenClaw 外掛系統的**深入架構參考文件**。如需實作指南，請從下方其中一個主題頁面開始。

<CardGroup cols={2}>
  <Card title="安裝及使用外掛" icon="plug" href="/zh-TW/tools/plugin">
    新增、啟用及疑難排解外掛的終端使用者指南。
  </Card>
  <Card title="建置外掛" icon="rocket" href="/zh-TW/plugins/building-plugins">
    使用最小可運作資訊清單的第一個外掛教學。
  </Card>
  <Card title="頻道外掛" icon="comments" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息頻道外掛。
  </Card>
  <Card title="提供者外掛" icon="microchip" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型提供者外掛。
  </Card>
  <Card title="SDK 概觀" icon="book" href="/zh-TW/plugins/sdk-overview">
    匯入對應表及註冊 API 參考文件。
  </Card>
</CardGroup>

## 公開能力模型

能力是 OpenClaw 內部公開的**原生外掛**模型。每個原生 OpenClaw 外掛都會註冊一或多種能力類型：

| 能力                   | 註冊方法                                         | 外掛範例                       |
| ---------------------- | ------------------------------------------------ | ------------------------------ |
| 文字推論               | `api.registerProvider(...)`                      | `anthropic`、`openai`          |
| 命令列介面推論後端     | `api.registerCliBackend(...)`                    | `anthropic`、`openai`          |
| 嵌入                   | `api.registerEmbeddingProvider(...)`             | 提供者擁有的向量外掛           |
| 語音                   | `api.registerSpeechProvider(...)`                | `elevenlabs`、`microsoft`      |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | `google`、`openai`             |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | `google`、`openai`             |
| 轉錄內容來源           | `api.registerTranscriptSourceProvider(...)`      | `discord`                      |
| 圖像生成               | `api.registerImageGenerationProvider(...)`       | `fal`、`google`、`openai`      |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | `fal`、`google`、`minimax`     |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | `fal`、`google`、`qwen`        |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | `brave`、`firecrawl`、`google` |
| 頻道／訊息傳遞         | `api.registerChannel(...)`                       | `matrix`、`msteams`            |
| 閘道探索               | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                      |

<Note>
註冊零項能力，但提供鉤子、工具、探索服務或背景服務的外掛，屬於**舊式純鉤子**外掛。此模式仍受到完整支援。
</Note>

### 外部相容性立場

能力模型已整合至核心，目前也用於隨附／原生外掛；但外部外掛的相容性仍需要比「既然已匯出，就代表已凍結」更嚴謹的標準。

| 外掛情境                                         | 指引                                                                                         |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 現有外部外掛                                     | 維持以鉤子為基礎的整合正常運作；這是相容性基準。                                             |
| 新的隨附／原生外掛                               | 優先使用明確的能力註冊，而非廠商專屬的內部存取方式或新的純鉤子設計。                         |
| 採用能力註冊的外部外掛                           | 允許使用，但除非文件標示為穩定，否則應將能力專屬的輔助介面視為仍在演進。                     |

能力註冊是預定的發展方向。在轉換期間，舊式鉤子仍是外部外掛最安全且不會造成破壞的路徑。匯出的輔助子路徑並非全都具有同等地位——應優先採用範圍明確且有文件說明的合約，而非附帶匯出的輔助介面。

### 外掛形態

OpenClaw 會根據每個已載入外掛的實際註冊行為（而非僅依靜態中繼資料）將其分類為一種形態：

<AccordionGroup>
  <Accordion title="單一能力">
    僅註冊一種能力類型（例如僅提供者外掛 `arcee` 或 `chutes`）。
  </Accordion>
  <Accordion title="混合能力">
    註冊多種能力類型（例如 `openai` 擁有文字推論、語音、媒體理解及圖像生成能力）。
  </Accordion>
  <Accordion title="純鉤子">
    僅註冊鉤子（具型別或自訂），不註冊任何能力、工具、命令或服務。
  </Accordion>
  <Accordion title="非能力">
    註冊工具、命令、服務或路由，但不註冊任何能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 查看外掛的形態及能力明細。詳情請參閱[命令列介面參考文件](/zh-TW/cli/plugins#inspect)。

### 相容性訊號

`openclaw doctor`、`openclaw plugins inspect <id>`、`openclaw status --all` 及 `openclaw plugins doctor` 會顯示以下相容性通知：

| 訊號                                        | 含義                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **設定有效**                                | 設定可正常剖析，且外掛可解析                                                                                  |
| **純鉤子**（資訊）                          | 外掛僅註冊鉤子；這是受支援的路徑，但尚未移轉至能力註冊                                                       |
| **已棄用的記憶嵌入 API**（警告）            | 非隨附外掛使用舊版記憶體專用嵌入提供者 API，而非 `registerEmbeddingProvider` |
| **嚴重錯誤**                                | 設定無效或外掛載入失敗                                                                                        |

目前所有建議／警告訊號都不會導致你的外掛中斷。這些訊號也會出現在 `openclaw status --all` 及 `openclaw plugins doctor` 中。

## 架構概觀

OpenClaw 的外掛系統包含四個層級：

<Steps>
  <Step title="資訊清單與探索">
    OpenClaw 會從已設定的路徑、工作區根目錄、全域外掛根目錄及隨附外掛中尋找候選外掛。探索程序會先讀取原生 `openclaw.plugin.json` 資訊清單及受支援的套件資訊清單。
  </Step>
  <Step title="啟用與驗證">
    核心會判斷已探索的外掛為啟用、停用、封鎖，或獲選用於記憶體等互斥插槽。
  </Step>
  <Step title="執行階段載入">
    原生 OpenClaw 外掛會在處理程序內載入，並將能力註冊至中央登錄。封裝的 JavaScript 會透過原生 `require` 載入；第三方本機原始碼 TypeScript 則使用緊急備援的 Jiti。相容套件會正規化為登錄記錄，而不匯入執行階段程式碼。
  </Step>
  <Step title="介面使用">
    OpenClaw 的其他部分會讀取登錄，以公開工具、頻道、提供者設定、鉤子、HTTP 路由、命令列介面命令及服務。
  </Step>
</Steps>

特別針對外掛命令列介面，根命令探索分為兩個階段：

- 剖析時中繼資料來自 `registerCli(..., { descriptors: [...] })`
- 實際的外掛命令列介面模組可維持延遲載入，並在首次叫用時註冊

如此可讓外掛擁有的命令列介面程式碼保留在外掛內，同時仍讓 OpenClaw 在剖析前保留根命令名稱。

重要的設計邊界如下：

- 資訊清單／設定驗證應能透過**資訊清單／結構描述中繼資料**運作，而不執行外掛程式碼
- 原生能力探索可載入受信任的外掛進入點程式碼，以建立不啟用功能的登錄快照
- 原生執行階段行為來自外掛模組使用 `api.registrationMode === "full"` 的 `register(api)` 路徑

此劃分讓 OpenClaw 能在完整執行階段啟用前驗證設定、說明缺少／停用的外掛，並建立使用者介面／結構描述提示。

### 外掛中繼資料快照與查閱表

閘道啟動時會為目前的設定快照建立一個 `PluginMetadataSnapshot`。此快照僅包含中繼資料：儲存已安裝外掛索引、資訊清單登錄、資訊清單診斷、擁有者對應表、外掛 ID 正規化器及資訊清單記錄。它不包含已載入的外掛模組、提供者 SDK、套件內容或執行階段匯出項目。

外掛感知設定驗證、啟動時自動啟用及閘道外掛啟動程序會使用該快照，而不會各自重新建立資訊清單／索引中繼資料。`PluginLookUpTable` 衍生自相同快照，並加入目前執行階段設定的啟動外掛計畫。

啟動後，閘道會將目前的中繼資料快照保留為可替換的執行階段產物。重複的執行階段提供者探索可借用該快照，而不必為每次提供者目錄巡查重新建構已安裝索引及資訊清單登錄。閘道關閉、設定／外掛清單變更及寫入已安裝索引時，快照會遭清除或替換；若不存在相容的目前快照，呼叫端會退回冷路徑的資訊清單／索引流程。相容性檢查必須包括 `plugins.load.paths` 及預設代理程式工作區等外掛探索根目錄，因為工作區外掛屬於中繼資料範圍的一部分。

快照與查閱表會讓重複的啟動決策維持在快速路徑上：

- 頻道擁有權
- 延遲頻道啟動
- 啟動外掛 ID
- 提供者及命令列介面後端擁有權
- 設定提供者、命令別名、模型目錄提供者及資訊清單合約擁有權
- 外掛設定結構描述及頻道設定結構描述驗證
- 啟動時自動啟用決策

安全邊界在於替換快照，而非變更快照。當設定、外掛清單、安裝記錄或持久化索引原則變更時，應重新建立快照。請勿將其視為廣泛的可變全域登錄，也不要保留無上限的歷史快照。執行階段外掛載入仍與中繼資料快照分離，因此過時的執行階段狀態無法隱藏在中繼資料快取之後。

快取規則記載於[外掛架構內部機制](/zh-TW/plugins/architecture-internals#plugin-cache-boundary)：除非呼叫端持有目前流程的明確快照、查閱表或資訊清單登錄，否則資訊清單與探索中繼資料皆為最新狀態。隱藏的中繼資料快取及依實際時鐘計算的 TTL 不屬於外掛載入機制。只有在程式碼或已安裝成品實際載入後，執行階段載入器、模組及相依成品快取才能持續存在。

部分冷路徑呼叫端仍會直接從持久化的已安裝外掛索引重新建構資訊清單登錄，而不是接收閘道 `PluginLookUpTable`。此路徑目前會依需求重新建構登錄；若呼叫端已擁有目前的查閱表或明確的資訊清單登錄，應優先透過執行階段流程傳遞。

### 啟用規劃

啟用規劃是控制平面的一部分。呼叫端可以在載入範圍更廣的執行階段登錄前，查詢哪些外掛與具體的命令、提供者、頻道、路由、代理程式測試架構或能力相關。

規劃器會維持目前資訊清單行為的相容性：

- `activation.*` 欄位是明確的規劃器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和鉤子仍是資訊清單擁有權的備援機制
- 僅含 ID 的規劃器 API 仍可供現有呼叫端使用
- 規劃 API 會回報原因標籤，讓診斷能區分明確提示與擁有權備援機制

<Warning>
請勿將 `activation` 視為生命週期鉤子或 `register(...)` 的替代方案。它是用於縮小載入範圍的中繼資料。當擁有權欄位已描述該關係時，應優先使用這些欄位；只有額外的規劃器提示才使用 `activation`。
</Warning>

### 頻道外掛與共用訊息工具

頻道外掛不需要為一般聊天動作另外註冊傳送、編輯或回應工具。OpenClaw 在核心中保留一個共用的 `message` 工具，而頻道外掛負責其背後的頻道專屬探索與執行。

目前的邊界如下：

- 核心負責共用的 `message` 工具主機、提示詞連接、工作階段／討論串簿記，以及執行分派
- 頻道外掛負責限定範圍的動作探索、功能探索，以及任何頻道專屬結構描述片段
- 頻道外掛負責供應商專屬的工作階段對話語法，例如對話 ID 如何編碼討論串 ID，或如何繼承自上層對話
- 頻道外掛透過其動作配接器執行最終動作

對頻道外掛而言，SDK 介面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。這個統一的探索呼叫可讓外掛一併回傳其可見動作、功能與結構描述貢獻，避免這些部分彼此偏離。

訊息動作名稱刻意採用由核心擁有的封閉詞彙表，讓每種傳輸方式都能呈現所有動作。外掛須透過核心 PR 新增動作名稱；刻意不支援執行階段註冊。

當頻道專屬的訊息工具參數帶有媒體來源（例如本機路徑或遠端媒體 URL）時，外掛也應從 `describeMessageTool(...)` 回傳 `mediaSourceParams`。核心使用這份明確清單來套用沙箱路徑正規化與外送媒體存取提示，而不必硬式編碼由外掛擁有的參數名稱。應優先在此使用以動作為範圍的對應表，而非整個頻道共用的扁平清單，以免僅供個人檔案使用的媒體參數在 `send` 等無關動作上也遭到正規化。

核心會將執行階段範圍傳入該探索步驟。重要欄位包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的傳入 `requesterSenderId`

這對情境感知型外掛很重要。頻道可以依據使用中的帳號、目前的聊天室／討論串／訊息，或受信任的請求者身分，隱藏或顯示訊息動作，而不必在核心 `message` 工具中硬式編碼頻道專屬分支。

這就是為什麼嵌入式執行器的路由變更仍屬於外掛工作：執行器負責將目前的聊天／工作階段身分轉送至外掛探索邊界，使共用的 `message` 工具能為目前這一輪公開正確的頻道所屬介面。

對頻道所屬的執行輔助程式而言，內建外掛應將執行階段保留在自身的外掛模組中。核心不再擁有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 訊息動作執行階段。我們不會發布獨立的 `plugin-sdk/*-action-runtime` 子路徑，而內建外掛應直接從其外掛所屬模組匯入自身的本機執行階段程式碼。

相同邊界通常也適用於以供應商命名的 SDK 接合面：核心不應匯入 Discord、Signal、Slack、WhatsApp 或類似外掛的頻道專屬便利彙總模組。若核心需要某項行為，應使用內建外掛自身的 `api.ts`／`runtime-api.ts` 彙總模組，或將需求提升為共用 SDK 中範圍狹窄的通用功能。

內建外掛也遵循相同規則。內建外掛的 `runtime-api.ts` 不應重新匯出自身品牌化的 `openclaw/plugin-sdk/<plugin-id>` 外觀介面。這些品牌化外觀介面仍是供外部外掛與舊版使用者使用的相容性墊片，但內建外掛應使用本機匯出，加上 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress` 等範圍狹窄的通用 SDK 子路徑。除非現有外部生態系統的相容性邊界有所要求，否則新程式碼不應新增外掛 ID 專屬的 SDK 外觀介面。

針對投票，具體有兩條執行路徑：

- `outbound.sendPoll` 是適用於符合通用投票模型之頻道的共用基準
- `actions.handleAction("poll")` 是頻道專屬投票語意或額外投票參數的首選路徑

核心現在會將共用投票剖析延後至外掛投票分派拒絕該動作之後，因此外掛所屬的投票處理常式可以接受頻道專屬投票欄位，而不會先遭通用投票剖析器阻擋。

如需完整的啟動順序，請參閱[外掛架構內部機制](/zh-TW/plugins/architecture-internals)。

## 功能擁有權模型

OpenClaw 將原生外掛視為某個**公司**或某項**功能**的擁有權邊界，而不是互不相關整合的雜物集合。

這表示：

- 公司外掛通常應負責該公司所有面向 OpenClaw 的介面
- 功能外掛通常應負責其引入的完整功能介面
- 頻道應使用共用核心功能，而非臨時重新實作供應商行為

<AccordionGroup>
  <Accordion title="供應商多功能">
    `google` 負責文字推論、命令列介面後端、嵌入、語音、即時語音、媒體理解、影像／音樂／影片生成與網頁搜尋。`openai` 負責文字推論、嵌入、語音、即時轉錄、即時語音、媒體理解與影像／影片生成。`minimax` 負責文字推論，以及媒體理解、語音、影像／音樂／影片生成與網頁搜尋。
  </Accordion>
  <Accordion title="供應商單一功能">
    `arcee` 和 `chutes` 僅負責文字推論；`microsoft` 僅負責語音。供應商外掛可以維持如此狹窄的範圍，直到需要涵蓋該供應商的更多介面。
  </Accordion>
  <Accordion title="功能外掛">
    `voice-call` 負責通話傳輸、工具、命令列介面、路由與 Twilio 媒體串流橋接，但會使用共用的語音、即時轉錄與即時語音功能，而非直接匯入供應商外掛。
  </Accordion>
</AccordionGroup>

預期的最終狀態如下：

- 即使供應商面向 OpenClaw 的介面橫跨文字模型、語音、影像與影片，也應集中在一個外掛中
- 其他供應商也能以相同方式處理自身的介面範圍
- 頻道不需在意哪個供應商外掛負責該供應商；它們使用核心所公開的共用功能合約

關鍵差異如下：

- **外掛** = 擁有權邊界
- **功能** = 多個外掛可以實作或使用的核心合約

因此，若 OpenClaw 新增影片等領域，第一個問題不應是「哪個供應商應硬式編碼影片處理？」第一個問題應是「核心的影片功能合約是什麼？」該合約建立後，供應商外掛便可向其註冊，頻道／功能外掛也可使用它。

如果該功能尚不存在，通常正確的做法是：

<Steps>
  <Step title="定義功能">
    在核心中定義缺少的功能。
  </Step>
  <Step title="透過 SDK 公開">
    以具型別的方式透過外掛 API／執行階段公開它。
  </Step>
  <Step title="連接使用端">
    將頻道／功能連接至該功能。
  </Step>
  <Step title="供應商實作">
    讓供應商外掛註冊實作。
  </Step>
</Steps>

這可在保持擁有權明確的同時，避免核心行為依賴單一供應商或一次性的外掛專屬程式碼路徑。

### 功能分層

決定程式碼歸屬位置時，請使用以下心智模型：

<Tabs>
  <Tab title="核心功能層">
    共用協調、政策、備援、設定合併規則、傳遞語意與具型別的合約。
  </Tab>
  <Tab title="供應商外掛層">
    供應商專屬 API、驗證、模型目錄、語音合成、影像生成、影片後端與用量端點。
  </Tab>
  <Tab title="頻道／功能外掛層">
    使用核心功能並將其呈現在某個介面上的 Discord／Slack／語音通話等整合。
  </Tab>
</Tabs>

例如，TTS 遵循以下形式：

- 核心負責回覆時的 TTS 政策、備援順序、偏好設定與頻道傳遞
- `elevenlabs`、`google`、`microsoft` 和 `openai` 負責合成實作
- `voice-call` 使用電話語音 TTS 執行階段輔助程式

未來的功能也應優先採用相同模式。

### 多功能公司外掛範例

公司外掛從外部看來應具有一致性。如果 OpenClaw 為模型、語音、即時轉錄、即時語音、媒體理解、影像生成、影片生成、網頁擷取與網頁搜尋提供共用合約，供應商便可在單一位置負責其所有介面：

```ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { exampleAiMedia } from "./exampleai-media.js";

export default definePluginEntry({
  id: "exampleai",
  name: "ExampleAI",
  description: "ExampleAI 模型與媒體功能。",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // 驗證／模型目錄／執行階段鉤子
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // 供應商語音設定 — 直接實作 SpeechProviderPlugin 介面
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      describeImage: (req) => exampleAiMedia.describeImage(req),
      transcribeAudio: (req) => exampleAiMedia.transcribeAudio(req),
      describeVideo: (req) => exampleAiMedia.describeVideo(req),
    });

    api.registerWebSearchProvider({
      id: "exampleai-search",
      createTool() {
        // 回傳供應商所屬的網頁搜尋工具。
      },
    });
  },
});
```

重要的不是輔助程式的確切名稱，而是整體形式：

- 由一個外掛負責供應商介面
- 核心仍負責功能合約
- 供應商請求轉譯與 HTTP 輔助程式留在供應商外掛中
- 頻道與功能外掛使用 `api.runtime.*` 輔助程式，而非供應商程式碼
- 合約測試可斷言外掛已註冊其聲稱負責的功能

### 功能範例：影片理解

OpenClaw 已將影像／音訊／影片理解視為一項共用功能。相同的擁有權模型也適用於此：

<Steps>
  <Step title="核心定義合約">
    核心定義媒體理解合約。
  </Step>
  <Step title="供應商外掛註冊">
    供應商外掛視情況註冊 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="使用端使用共用行為">
    頻道與功能外掛使用共用核心行為，而非直接連接供應商程式碼。
  </Step>
</Steps>

這可避免將某個供應商對影片的假設寫死在核心中。外掛負責供應商介面；核心負責功能合約與備援行為。

影片生成功能已使用相同的順序：核心擁有具型別的能力合約與執行階段輔助程式，而供應商外掛則依據該合約註冊 `api.registerVideoGenerationProvider(...)` 實作。

需要具體的推出檢查清單嗎？請參閱[能力實作手冊](/zh-TW/plugins/adding-capabilities)。

## 合約與強制執行

外掛 API 介面刻意在 `OpenClawPluginApi` 中集中管理並提供型別。該合約定義支援的註冊點，以及外掛可依賴的執行階段輔助程式。

這一點很重要，因為：

- 外掛作者可獲得一套穩定的內部標準
- 核心可拒絕重複的擁有權，例如兩個外掛註冊相同的提供者 ID
- 啟動時可針對格式錯誤的註冊提供可採取行動的診斷資訊
- 合約測試可強制執行內建外掛的擁有權，並防止無聲偏移

強制執行分為兩層：

<AccordionGroup>
  <Accordion title="執行階段註冊強制執行">
    外掛載入時，外掛登錄會驗證各項註冊。例如：重複的提供者 ID、重複的語音提供者 ID，以及格式錯誤的註冊，都會產生外掛診斷資訊，而不是導致未定義行為。
  </Accordion>
  <Accordion title="合約測試">
    測試執行期間，內建外掛會記錄在合約登錄中，讓 OpenClaw 能明確驗證擁有權。目前這用於模型提供者、語音提供者、網頁搜尋提供者，以及內建註冊的擁有權。
  </Accordion>
</AccordionGroup>

實際效果是，OpenClaw 能預先知道哪個外掛擁有哪些介面。如此一來，核心與頻道便能順暢組合，因為擁有權是明確宣告、具型別且可測試的，而不是隱含的。

### 合約中應包含的內容

<Tabs>
  <Tab title="良好的合約">
    - 具型別
    - 精簡
    - 針對特定能力
    - 由核心擁有
    - 可由多個外掛重複使用
    - 頻道／功能無須知道供應商即可使用

  </Tab>
  <Tab title="不良的合約">
    - 隱藏在核心中的供應商特定政策
    - 繞過登錄的一次性外掛逃生口
    - 頻道程式碼直接存取供應商實作
    - 不屬於 `OpenClawPluginApi` 或 `api.runtime` 的臨時執行階段物件

  </Tab>
</Tabs>

如有疑問，請提高抽象層級：先定義能力，再讓外掛接入該能力。

## 執行模型

原生 OpenClaw 外掛與閘道在**同一處理程序內**執行，且不受沙箱隔離。載入的原生外掛與核心程式碼具有相同的處理程序層級信任邊界。

<Warning>
原生外掛的影響：外掛可註冊工具、網路處理常式、掛鉤和服務；外掛錯誤可能導致閘道當機或不穩定；惡意原生外掛等同於在 OpenClaw 處理程序內任意執行程式碼。
</Warning>

相容套件預設更安全，因為 OpenClaw 目前將其視為中繼資料／內容套件。在目前的版本中，這主要是指內建 Skills。

對非內建外掛使用允許清單及明確的安裝／載入路徑。將工作區外掛視為開發階段的程式碼，而非生產環境的預設項目。

對於內建工作區套件名稱，外掛 ID 應預設以 npm 名稱為依據：`@openclaw/<id>`；若套件刻意公開範圍較窄的外掛角色，則使用經核准的具型別後綴，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任注意事項：**`plugins.allow` 信任的是**外掛 ID**，而不是來源出處。當具有與內建外掛相同 ID 的工作區外掛已啟用或加入允許清單時，該工作區外掛會刻意覆蓋內建副本。這是正常行為，且有助於本機開發、修補測試及緊急修正。內建外掛的信任是根據來源快照判定，也就是載入時磁碟上的資訊清單與程式碼，而不是安裝中繼資料。遭破壞或替換的安裝記錄，無法在未被察覺的情況下，將內建外掛的信任範圍擴大至實際來源所宣告的範圍之外。
</Note>

## 匯出邊界

OpenClaw 匯出的是能力，而不是實作上的便利功能。

保持能力註冊公開。精簡非合約的輔助程式匯出：

- 內建外掛專用的輔助程式子路徑
- 不打算作為公開 API 的執行階段管線子路徑
- 供應商專用的便利輔助程式
- 屬於實作細節的設定／初始設定輔助程式

保留的內建外掛輔助程式子路徑已從產生的 SDK 匯出對應表中淘汰。將擁有者專用的輔助程式保留在其所屬的外掛套件內；只有可重複使用的主機行為才能提升為通用 SDK 合約，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 及注入的外掛 API 能力。

## 內部機制與參考資料

如需瞭解載入流水線、登錄模型、提供者執行階段掛鉤、閘道 HTTP 路由、訊息工具結構描述、頻道目標解析、提供者目錄、內容引擎外掛，以及新增能力的指南，請參閱[外掛架構內部機制](/zh-TW/plugins/architecture-internals)。

## 相關內容

- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛資訊清單](/zh-TW/plugins/manifest)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
