---
read_when:
    - 建置或偵錯 OpenClaw 原生外掛
    - 瞭解外掛能力模型或所有權邊界
    - 處理外掛載入流程或登錄檔
    - 實作供應商執行階段掛鉤或頻道外掛
sidebarTitle: Internals
summary: 外掛內部機制：能力模型、擁有權、契約、載入管線與執行階段輔助工具
title: 外掛內部機制
x-i18n:
    generated_at: "2026-07-11T21:32:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

這是 OpenClaw 外掛系統的**深入架構參考**。如需實用指南，請從下方的主題頁面開始。

<CardGroup cols={2}>
  <Card title="安裝與使用外掛" icon="plug" href="/zh-TW/tools/plugin">
    新增、啟用外掛及排解外掛問題的使用者指南。
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
  <Card title="SDK 概覽" icon="book" href="/zh-TW/plugins/sdk-overview">
    匯入對應表與註冊 API 參考。
  </Card>
</CardGroup>

## 公開能力模型

能力是 OpenClaw 內部公開的**原生外掛**模型。每個原生 OpenClaw 外掛都會註冊一或多種能力類型：

| 能力         | 註冊方法                                         | 外掛範例                       |
| ------------ | ------------------------------------------------ | ------------------------------ |
| 文字推論     | `api.registerProvider(...)`                      | `anthropic`、`openai`          |
| 命令列介面推論後端 | `api.registerCliBackend(...)`                    | `anthropic`、`openai`          |
| 嵌入         | `api.registerEmbeddingProvider(...)`             | 由提供者擁有的向量外掛         |
| 語音         | `api.registerSpeechProvider(...)`                | `elevenlabs`、`microsoft`      |
| 即時轉錄     | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| 即時語音     | `api.registerRealtimeVoiceProvider(...)`         | `google`、`openai`             |
| 媒體理解     | `api.registerMediaUnderstandingProvider(...)`    | `google`、`openai`             |
| 逐字稿來源   | `api.registerTranscriptSourceProvider(...)`      | `discord`                      |
| 圖像生成     | `api.registerImageGenerationProvider(...)`       | `fal`、`google`、`openai`      |
| 音樂生成     | `api.registerMusicGenerationProvider(...)`       | `fal`、`google`、`minimax`     |
| 影片生成     | `api.registerVideoGenerationProvider(...)`       | `fal`、`google`、`qwen`        |
| 網頁擷取     | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| 網頁搜尋     | `api.registerWebSearchProvider(...)`             | `brave`、`firecrawl`、`google` |
| 頻道／訊息傳遞 | `api.registerChannel(...)`                       | `matrix`、`msteams`            |
| 閘道探索     | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                      |

<Note>
註冊零項能力，但提供掛鉤、工具、探索服務或背景服務的外掛，是**僅使用舊式掛鉤**的外掛。此模式仍受到完整支援。
</Note>

### 外部相容性立場

能力模型現已整合至核心，且目前由隨附／原生外掛使用；然而，外部外掛的相容性仍需採用比「既然已匯出，就代表已凍結」更嚴格的標準。

| 外掛情境                         | 指引                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| 現有外部外掛                     | 維持掛鉤式整合正常運作；這是相容性基準。                                             |
| 新增的隨附／原生外掛             | 優先採用明確的能力註冊，而非供應商特定的內部存取方式或新的僅掛鉤設計。               |
| 採用能力註冊的外部外掛           | 可以採用，但除非文件將其標示為穩定，否則應將能力專用的輔助介面視為仍在演進。         |

能力註冊是預定的發展方向。在過渡期間，舊式掛鉤仍是外部外掛最安全且不會造成破壞的路徑。匯出的輔助子路徑並非全都具有相同地位——請優先採用範圍明確且有文件記載的契約，而非附帶匯出的輔助介面。

### 外掛形態

OpenClaw 會依據每個已載入外掛的實際註冊行為（而非僅依靜態中繼資料），將其歸類為一種形態：

<AccordionGroup>
  <Accordion title="單一能力">
    僅註冊一種能力類型（例如像 `arcee` 或 `chutes` 這類僅提供者外掛）。
  </Accordion>
  <Accordion title="混合能力">
    註冊多種能力類型（例如 `openai` 擁有文字推論、語音、媒體理解及圖像生成功能）。
  </Accordion>
  <Accordion title="僅掛鉤">
    僅註冊掛鉤（具型別或自訂），不註冊能力、工具、命令或服務。
  </Accordion>
  <Accordion title="非能力">
    註冊工具、命令、服務或路由，但不註冊能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 查看外掛的形態及能力明細。詳情請參閱[命令列介面參考](/zh-TW/cli/plugins#inspect)。

### 舊式掛鉤

`before_agent_start` 掛鉤仍作為僅掛鉤外掛的相容性路徑受到支援。現實中仍有舊式外掛依賴它。

發展方向：

- 維持其正常運作
- 在文件中將其標示為舊式功能
- 模型／提供者覆寫工作優先使用 `before_model_resolve`
- 提示詞修改工作優先使用 `before_prompt_build`
- 僅在實際使用量下降，且固定測試資料的涵蓋範圍證明遷移安全後才移除

### 相容性訊號

`openclaw doctor`、`openclaw plugins inspect <id>`、`openclaw status --all` 及 `openclaw plugins doctor` 會顯示以下相容性通知：

| 訊號                                      | 意義                                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **設定有效**                              | 設定可正常解析，且外掛可成功解析                                                                           |
| **僅掛鉤**（資訊）                        | 外掛僅註冊掛鉤；這是受支援的路徑，但尚未遷移至能力註冊                                                     |
| **舊式 `before_agent_start`**（警告）     | 外掛使用已棄用的 `before_agent_start` 掛鉤，而非 `before_model_resolve`／`before_prompt_build`             |
| **已棄用的記憶嵌入 API**（警告）          | 非隨附外掛使用舊式記憶專用嵌入提供者 API，而非 `registerEmbeddingProvider`                                 |
| **嚴重錯誤**                              | 設定無效或外掛載入失敗                                                                                     |

目前所有提示／警告訊號都不會造成外掛中斷。這些訊號也會顯示於 `openclaw status --all` 和 `openclaw plugins doctor`。

## 架構概覽

OpenClaw 的外掛系統分為四層：

<Steps>
  <Step title="資訊清單與探索">
    OpenClaw 會從已設定路徑、工作區根目錄、全域外掛根目錄及隨附外掛中尋找候選外掛。探索流程會優先讀取原生 `openclaw.plugin.json` 資訊清單及受支援的套件資訊清單。
  </Step>
  <Step title="啟用與驗證">
    核心會判定已探索的外掛是已啟用、已停用、遭封鎖，或已被選用於記憶等獨占插槽。
  </Step>
  <Step title="執行階段載入">
    原生 OpenClaw 外掛會在程序內載入，並將能力註冊至中央登錄檔。封裝後的 JavaScript 透過原生 `require` 載入；第三方本機 TypeScript 原始碼則以 Jiti 作為緊急備援。相容套件會正規化為登錄記錄，而不匯入執行階段程式碼。
  </Step>
  <Step title="介面使用">
    OpenClaw 的其餘部分會讀取登錄檔，以公開工具、頻道、提供者設定、掛鉤、HTTP 路由、命令列介面命令及服務。
  </Step>
</Steps>

特別針對外掛命令列介面，根命令探索分為兩個階段：

- 解析階段的中繼資料來自 `registerCli(..., { descriptors: [...] })`
- 實際的外掛命令列介面模組可維持延遲載入，並在首次叫用時註冊

如此一來，外掛擁有的命令列介面程式碼可保留在外掛內，同時仍讓 OpenClaw 能在解析前保留根命令名稱。

重要的設計邊界：

- 資訊清單／設定驗證應能依據**資訊清單／結構描述中繼資料**完成，而不必執行外掛程式碼
- 原生能力探索可以載入受信任的外掛進入點程式碼，以建立不啟用功能的登錄快照
- 原生執行階段行為來自外掛模組的 `register(api)` 路徑，且 `api.registrationMode === "full"`

這項分離設計讓 OpenClaw 能在完整執行階段啟用前驗證設定、說明缺少或停用的外掛，並建立使用者介面／結構描述提示。

### 外掛中繼資料快照與查詢表

閘道啟動時，會為目前的設定快照建立一個 `PluginMetadataSnapshot`。此快照僅包含中繼資料：它會儲存已安裝外掛索引、資訊清單登錄檔、資訊清單診斷資訊、擁有者對應表、外掛 ID 正規化器及資訊清單記錄。它不包含已載入的外掛模組、提供者 SDK、套件內容或執行階段匯出項目。

可感知外掛的設定驗證、啟動時自動啟用，以及閘道外掛啟動程序都會使用該快照，而非各自重新建立資訊清單／索引中繼資料。`PluginLookUpTable` 衍生自同一份快照，並加入目前執行階段設定的啟動外掛計畫。

啟動後，閘道會將目前的中繼資料快照保留為可替換的執行階段產物。重複執行的提供者探索可借用該快照，而不必在每次提供者目錄掃描時重新建構已安裝索引和資訊清單登錄檔。閘道關閉、設定／外掛清單變更及已安裝索引寫入時，快照會被清除或替換；若不存在相容的目前快照，呼叫端會退回冷路徑的資訊清單／索引流程。相容性檢查必須包含 `plugins.load.paths` 和預設代理程式工作區等外掛探索根目錄，因為工作區外掛屬於中繼資料範圍的一部分。

快照與查詢表讓重複的啟動決策維持在快速路徑上：

- 頻道擁有權
- 延後頻道啟動
- 啟動外掛 ID
- 提供者及命令列介面後端擁有權
- 設定提供者、命令別名、模型目錄提供者及資訊清單契約擁有權
- 外掛設定結構描述及頻道設定結構描述驗證
- 啟動時自動啟用決策

安全邊界是替換快照，而非修改快照。當設定、外掛清單、安裝記錄或持久化索引原則發生變更時，請重新建立快照。請勿將其視為廣泛且可變動的全域登錄檔，也不要保留數量無上限的歷史快照。執行階段外掛載入仍與中繼資料快照分離，因此過時的執行階段狀態無法隱藏在中繼資料快取之後。

快取規則記載於[外掛架構內部原理](/zh-TW/plugins/architecture-internals#plugin-cache-boundary)：除非呼叫端為目前流程持有明確的快照、查詢表或資訊清單登錄檔，否則資訊清單與探索中繼資料一律保持最新。外掛載入不包含隱藏的中繼資料快取和以實際時間為基礎的 TTL。只有在程式碼或已安裝成品實際載入後，執行階段載入器、模組及相依成品快取才能持續存在。

部分冷路徑呼叫端仍會直接從持久化的已安裝外掛索引重新建構資訊清單登錄檔，而不是接收閘道的 `PluginLookUpTable`。該路徑現在會依需求重新建構登錄檔；若呼叫端已經持有目前的查詢表或明確的資訊清單登錄檔，應優先在執行階段流程中傳遞它。

### 啟用規劃

啟用規劃是控制平面的一部分。呼叫端可以在載入範圍更廣的執行階段登錄表之前，查詢哪些外掛與具體命令、供應商、頻道、路由、代理程式框架或能力相關。

規劃器會維持目前資訊清單行為的相容性：

- `activation.*` 欄位是明確的規劃器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 與掛鉤仍作為資訊清單所有權的備援依據
- 僅傳回識別碼的規劃器 API 仍可供現有呼叫端使用
- 規劃 API 會回報原因標籤，讓診斷能區分明確提示與所有權備援

<Warning>
請勿將 `activation` 視為生命週期掛鉤或 `register(...)` 的替代方案。它是用於縮小載入範圍的中繼資料。若所有權欄位已能描述該關係，請優先使用所有權欄位；僅在需要額外規劃器提示時使用 `activation`。
</Warning>

### 頻道外掛與共用訊息工具

對於一般聊天動作，頻道外掛不需要另外註冊傳送、編輯或回應工具。OpenClaw 在核心中維持單一共用 `message` 工具，而頻道外掛則負責其背後的頻道特定探索與執行。

目前的邊界如下：

- 核心負責共用 `message` 工具主機、提示詞接線、工作階段／討論串記錄，以及執行分派
- 頻道外掛負責限定範圍的動作探索、能力探索，以及任何頻道特定的結構描述片段
- 頻道外掛負責供應商特定的工作階段對話文法，例如對話識別碼如何編碼討論串識別碼，或如何繼承自父對話
- 頻道外掛透過其動作配接器執行最終動作

對頻道外掛而言，SDK 介面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。這個統一探索呼叫可讓外掛一併傳回其可見動作、能力與結構描述貢獻，避免這些部分彼此偏離。

當頻道特定的訊息工具參數攜帶媒體來源（例如本機路徑或遠端媒體 URL）時，外掛也應從 `describeMessageTool(...)` 傳回 `mediaSourceParams`。核心使用這份明確清單套用沙箱路徑正規化與輸出媒體存取提示，而無須硬編碼由外掛擁有的參數名稱。請優先使用依動作限定範圍的對應表，而不是一份涵蓋整個頻道的平面清單，如此一來，僅限個人資料使用的媒體參數就不會在 `send` 等無關動作中被正規化。

核心會將執行階段範圍傳入該探索步驟。重要欄位包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的輸入 `requesterSenderId`

這對情境感知型外掛非常重要。頻道可以根據使用中的帳戶、目前的聊天室／討論串／訊息，或受信任的請求者身分，隱藏或顯示訊息動作，而無須在核心 `message` 工具中硬編碼頻道特定分支。

因此，嵌入式執行器的路由變更仍屬於外掛工作：執行器負責將目前的聊天／工作階段身分轉送至外掛探索邊界，讓共用 `message` 工具能為目前這一輪顯示正確的頻道自有介面。

對於頻道自有的執行輔助程式，內建外掛應將執行階段保留在各自的外掛模組中。核心不再擁有 `src/agents/tools` 下的 Discord、Slack、Telegram 或 WhatsApp 訊息動作執行階段。我們不會發布獨立的 `plugin-sdk/*-action-runtime` 子路徑；內建外掛應直接從其自有外掛模組匯入本機執行階段程式碼。

相同邊界一般也適用於以供應商命名的 SDK 介面：核心不應匯入 Discord、Signal、Slack、WhatsApp 或類似外掛的頻道特定便利彙總模組。如果核心需要某項行為，應使用內建外掛自身的 `api.ts`／`runtime-api.ts` 彙總模組，或將該需求提升為共用 SDK 中範圍狹窄的通用能力。

內建外掛也遵循相同規則。內建外掛的 `runtime-api.ts` 不應重新匯出其自有品牌的 `openclaw/plugin-sdk/<plugin-id>` 門面。這些品牌門面仍是供外部外掛與舊版使用者使用的相容性轉接層，但內建外掛應使用本機匯出，以及範圍狹窄的通用 SDK 子路徑，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。除非現有外部生態系統的相容性邊界有所要求，否則新程式碼不應新增外掛識別碼專屬的 SDK 門面。

特別針對投票，有兩條執行路徑：

- `outbound.sendPoll` 是適用於符合共通投票模型之頻道的共用基準
- `actions.handleAction("poll")` 是頻道特定投票語意或額外投票參數的首選路徑

現在，核心會將共用投票剖析延後到外掛的投票分派拒絕該動作之後，因此外掛自有的投票處理常式可以接受頻道特定的投票欄位，而不會先遭通用投票剖析器阻擋。

完整啟動順序請參閱[外掛架構內部機制](/zh-TW/plugins/architecture-internals)。

## 能力所有權模型

OpenClaw 將原生外掛視為**公司**或**功能**的所有權邊界，而不是一組互不相關整合的雜項集合。

這表示：

- 公司外掛通常應擁有該公司所有面向 OpenClaw 的介面
- 功能外掛通常應擁有其引入的完整功能介面
- 頻道應使用共用核心能力，而不是臨時重新實作供應商行為

<AccordionGroup>
  <Accordion title="供應商多能力">
    `google` 負責文字推論、命令列介面後端、嵌入、語音、即時語音、媒體理解、影像／音樂／影片生成，以及網頁搜尋。`openai` 負責文字推論、嵌入、語音、即時轉錄、即時語音、媒體理解，以及影像／影片生成。`minimax` 負責文字推論，以及媒體理解、語音、影像／音樂／影片生成與網頁搜尋。
  </Accordion>
  <Accordion title="供應商單一能力">
    `arcee` 與 `chutes` 僅負責文字推論；`microsoft` 僅負責語音。供應商外掛可以維持如此狹窄的範圍，直到需要涵蓋該供應商更多介面為止。
  </Accordion>
  <Accordion title="功能外掛">
    `voice-call` 負責通話傳輸、工具、命令列介面、路由，以及 Twilio 媒體串流橋接，但它使用共用語音、即時轉錄與即時語音能力，而不是直接匯入供應商外掛。
  </Accordion>
</AccordionGroup>

預期的最終狀態是：

- 供應商面向 OpenClaw 的介面集中在一個外掛中，即使它橫跨文字模型、語音、影像與影片
- 其他供應商也能對自己的介面範圍採取相同做法
- 頻道不在意哪個供應商外掛擁有該供應者；它們使用核心公開的共用能力合約

關鍵差異如下：

- **外掛** = 所有權邊界
- **能力** = 多個外掛可以實作或使用的核心合約

因此，如果 OpenClaw 新增影片之類的新領域，第一個問題不是「哪個供應者應硬編碼影片處理？」第一個問題應是「核心影片能力合約是什麼？」一旦該合約存在，供應商外掛就能針對它進行註冊，而頻道／功能外掛也能使用它。

如果該能力尚不存在，正確做法通常是：

<Steps>
  <Step title="定義能力">
    在核心中定義缺少的能力。
  </Step>
  <Step title="透過 SDK 公開">
    以型別化方式透過外掛 API／執行階段公開該能力。
  </Step>
  <Step title="接線使用端">
    將頻道／功能接線至該能力。
  </Step>
  <Step title="供應商實作">
    讓供應商外掛註冊實作。
  </Step>
</Steps>

這可維持明確的所有權，同時避免核心行為依賴單一供應商或一次性的外掛特定程式碼路徑。

### 能力分層

判斷程式碼歸屬位置時，請使用以下心智模型：

<Tabs>
  <Tab title="核心能力層">
    共用協調、政策、備援、設定合併規則、傳遞語意與型別化合約。
  </Tab>
  <Tab title="供應商外掛層">
    供應商特定 API、驗證、模型目錄、語音合成、影像生成、影片後端與用量端點。
  </Tab>
  <Tab title="頻道／功能外掛層">
    使用核心能力並將其呈現在某個介面上的 Discord／Slack／語音通話等整合。
  </Tab>
</Tabs>

例如，TTS 遵循以下結構：

- 核心負責回覆時的 TTS 政策、備援順序、偏好設定與頻道傳遞
- `elevenlabs`、`google`、`microsoft` 與 `openai` 負責合成實作
- `voice-call` 使用電話語音 TTS 執行階段輔助程式

未來的能力也應優先採用相同模式。

### 多能力公司外掛範例

從外部看來，公司外掛應具有一致性。如果 OpenClaw 已為模型、語音、即時轉錄、即時語音、媒體理解、影像生成、影片生成、網頁擷取與網頁搜尋提供共用合約，供應商就能在同一處擁有其所有介面：

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

重要的不是確切的輔助程式名稱，而是其結構：

- 單一外掛擁有供應商介面
- 核心仍擁有能力合約
- 頻道與功能外掛使用 `api.runtime.*` 輔助程式，而不是供應商程式碼
- 合約測試可斷言外掛確實註冊了其聲稱擁有的能力

### 能力範例：影片理解

OpenClaw 已將影像／音訊／影片理解視為一項共用能力。相同的所有權模型也適用於此：

<Steps>
  <Step title="核心定義合約">
    核心定義媒體理解合約。
  </Step>
  <Step title="供應商外掛註冊">
    供應商外掛視情況註冊 `describeImage`、`transcribeAudio` 與 `describeVideo`。
  </Step>
  <Step title="使用端採用共用行為">
    頻道與功能外掛使用共用核心行為，而不是直接接線至供應商程式碼。
  </Step>
</Steps>

如此可避免將單一供應者對影片的假設內建至核心。外掛擁有供應商介面；核心擁有能力合約與備援行為。

影片生成已採用相同順序：核心擁有型別化能力合約與執行階段輔助程式，而供應商外掛則針對該合約註冊 `api.registerVideoGenerationProvider(...)` 實作。

需要具體的推出檢查清單嗎？請參閱[能力實作手冊](/zh-TW/plugins/adding-capabilities)。

## 合約與強制執行

外掛 API 介面刻意集中於 `OpenClawPluginApi` 並採用型別定義。該契約定義了支援的註冊點，以及外掛可依賴的執行階段輔助工具。

這一點很重要，因為：

- 外掛作者可獲得一套穩定的內部標準
- 核心可拒絕重複的擁有權，例如兩個外掛註冊相同的提供者 ID
- 啟動時可針對格式錯誤的註冊顯示可採取行動的診斷資訊
- 契約測試可強制驗證內建外掛的擁有權，並防止無聲的偏移

共有兩層強制機制：

<AccordionGroup>
  <Accordion title="執行階段註冊強制機制">
    外掛載入時，外掛登錄檔會驗證註冊。例如：重複的提供者 ID、重複的語音提供者 ID，以及格式錯誤的註冊，都會產生外掛診斷資訊，而非導致未定義行為。
  </Accordion>
  <Accordion title="契約測試">
    測試執行期間，內建外掛會記錄於契約登錄檔中，讓 OpenClaw 能明確驗證擁有權。目前這用於模型提供者、語音提供者、網路搜尋提供者，以及內建註冊的擁有權。
  </Accordion>
</AccordionGroup>

實際效果是，OpenClaw 能預先知道哪個外掛擁有哪些介面。如此一來，核心與頻道便能無縫組合，因為擁有權是明確宣告、具備型別且可測試的，而非隱含的。

### 契約應包含哪些內容

<Tabs>
  <Tab title="良好的契約">
    - 具備型別
    - 小型
    - 針對特定能力
    - 由核心擁有
    - 可供多個外掛重複使用
    - 頻道與功能無須了解供應商即可使用

  </Tab>
  <Tab title="不良的契約">
    - 隱藏在核心中的供應商特定政策
    - 繞過登錄檔的一次性外掛逃生機制
    - 頻道程式碼直接存取供應商實作
    - 不屬於 `OpenClawPluginApi` 或 `api.runtime` 的臨時執行階段物件

  </Tab>
</Tabs>

如有疑問，請提高抽象層級：先定義能力，再讓外掛接入該能力。

## 執行模型

原生 OpenClaw 外掛與閘道在**同一處理程序內**執行，且不受沙箱隔離。已載入的原生外掛與核心程式碼具有相同的處理程序層級信任邊界。

<Warning>
原生外掛的影響：外掛可註冊工具、網路處理常式、鉤子及服務；外掛錯誤可能導致閘道當機或不穩定；惡意原生外掛等同於在 OpenClaw 處理程序內執行任意程式碼。
</Warning>

相容套件預設較安全，因為 OpenClaw 目前將其視為中繼資料／內容套件。在目前的版本中，這主要是指內建 Skills。

非內建外掛應使用允許清單以及明確的安裝／載入路徑。請將工作區外掛視為開發期間使用的程式碼，而非正式環境的預設項目。

對於內建工作區套件名稱，外掛 ID 應以 npm 名稱為基準：預設使用 `@openclaw/<id>`；若套件刻意公開範圍較窄的外掛角色，則可使用經核准且具型別意義的後綴，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任注意事項：** `plugins.allow` 信任的是**外掛 ID**，而非來源出處。當工作區外掛已啟用或列入允許清單時，與內建外掛具有相同 ID 的工作區外掛會刻意遮蔽內建版本。這是正常行為，對本機開發、修補程式測試及緊急修正很有用。內建外掛的信任是根據來源快照判定，也就是載入時磁碟上的資訊清單與程式碼，而非安裝中繼資料。損壞或遭替換的安裝記錄，無法悄然將內建外掛的信任範圍擴大至實際來源所宣告的範圍之外。
</Note>

## 匯出邊界

OpenClaw 匯出的是能力，而非實作上的便利功能。

保持能力註冊為公開介面。精簡不屬於契約的輔助工具匯出：

- 內建外掛專用的輔助工具子路徑
- 不打算作為公開 API 的執行階段管線子路徑
- 供應商專用的便利輔助工具
- 屬於實作細節的設定／初始設定輔助工具

保留給內建外掛的輔助工具子路徑已從產生的 SDK 匯出對應表中移除。擁有者專用的輔助工具應保留在其所屬的外掛套件內；只有可重複使用的主機行為才能提升為通用 SDK 契約，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

## 內部機制與參考資料

如需了解載入管線、登錄檔模型、提供者執行階段鉤子、閘道 HTTP 路由、訊息工具結構描述、頻道目標解析、提供者目錄、上下文引擎外掛，以及新增能力的指南，請參閱[外掛架構內部機制](/zh-TW/plugins/architecture-internals)。

## 相關內容

- [建立外掛](/zh-TW/plugins/building-plugins)
- [外掛資訊清單](/zh-TW/plugins/manifest)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
