---
read_when:
    - 建置或偵錯原生 OpenClaw 外掛
    - 了解外掛能力模型或所有權邊界
    - 處理外掛載入管線或登錄檔
    - 實作提供者執行階段鉤子或通道外掛
sidebarTitle: Internals
summary: 外掛內部：能力模型、擁有權、合約、載入管線與執行階段輔助工具
title: 外掛內部
x-i18n:
    generated_at: "2026-07-05T11:34:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

這是 OpenClaw 外掛系統的**深度架構參考**。如需實用指南，請從下方其中一個聚焦頁面開始。

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/zh-TW/tools/plugin">
    新增、啟用及疑難排解外掛的終端使用者指南。
  </Card>
  <Card title="Building plugins" icon="rocket" href="/zh-TW/plugins/building-plugins">
    使用最小可運作 manifest 的第一個外掛教學。
  </Card>
  <Card title="Channel plugins" icon="comments" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息通道外掛。
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型提供者外掛。
  </Card>
  <Card title="SDK overview" icon="book" href="/zh-TW/plugins/sdk-overview">
    匯入對應與註冊 API 參考。
  </Card>
</CardGroup>

## 公開能力模型

能力是 OpenClaw 內部公開的**原生外掛**模型。每個原生 OpenClaw 外掛都會針對一種或多種能力類型註冊：

| 能力                   | 註冊方法                                         | 範例外掛                       |
| ---------------------- | ------------------------------------------------ | ------------------------------ |
| 文字推論               | `api.registerProvider(...)`                      | `anthropic`, `openai`          |
| 命令列介面推論後端     | `api.registerCliBackend(...)`                    | `anthropic`, `openai`          |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | 提供者擁有的向量外掛           |
| 語音                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`      |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | `google`, `openai`             |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | `google`, `openai`             |
| 逐字稿來源             | `api.registerTranscriptSourceProvider(...)`      | `discord`                      |
| 影像生成               | `api.registerImageGenerationProvider(...)`       | `fal`, `google`, `openai`      |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | `fal`, `google`, `minimax`     |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | `fal`, `google`, `qwen`        |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | `firecrawl`                    |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | `brave`, `firecrawl`, `google` |
| 通道／訊息             | `api.registerChannel(...)`                       | `matrix`, `msteams`            |
| 閘道探索               | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                      |

<Note>
註冊零個能力，但提供 hooks、工具、探索服務或背景服務的外掛，是**僅 legacy hook** 外掛。該模式仍受到完整支援。
</Note>

### 外部相容性立場

能力模型已落入核心，且目前由內建／原生外掛使用，但外部外掛相容性仍需要比「它已匯出，因此已凍結」更嚴格的標準。

| 外掛情境                                          | 指引                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 現有外部外掛                                      | 保持以 hook 為基礎的整合可運作；這是相容性基準。                                                 |
| 新的內建／原生外掛                                | 優先使用明確的能力註冊，而不是供應商特定的直接存取或新的僅 hook 設計。                           |
| 採用能力註冊的外部外掛                            | 允許，但除非文件標示為穩定，否則請將能力特定的輔助介面視為仍在演進。                             |

能力註冊是預期方向。在轉換期間，legacy hooks 仍是外部外掛最安全、無破壞性的路徑。匯出的輔助子路徑並不完全等價；請優先使用狹窄且已文件化的合約，而不是偶然匯出的輔助項目。

### 外掛形態

OpenClaw 會根據每個已載入外掛的實際註冊行為（而不只是靜態中繼資料）將其分類為一種形態：

<AccordionGroup>
  <Accordion title="plain-capability">
    精確註冊一種能力類型（例如像 `arcee` 或 `chutes` 這類僅提供者的外掛）。
  </Accordion>
  <Accordion title="hybrid-capability">
    註冊多種能力類型（例如 `openai` 擁有文字推論、語音、媒體理解與影像生成）。
  </Accordion>
  <Accordion title="hook-only">
    僅註冊 hooks（具型別或自訂），沒有能力、工具、命令或服務。
  </Accordion>
  <Accordion title="non-capability">
    註冊工具、命令、服務或路由，但沒有能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 查看外掛的形態與能力明細。詳情請參閱[命令列介面參考](/zh-TW/cli/plugins#inspect)。

### Legacy hooks

`before_agent_start` hook 仍作為僅 hook 外掛的相容性路徑受到支援。Legacy 真實世界外掛仍依賴它。

方向：

- 保持其可運作
- 將其文件化為 legacy
- 對模型／提供者覆寫工作，優先使用 `before_model_resolve`
- 對提示變更工作，優先使用 `before_prompt_build`
- 只有在實際使用量下降，且 fixture 覆蓋證明遷移安全後才移除

### 相容性訊號

`openclaw doctor`、`openclaw plugins inspect <id>`、`openclaw status --all` 與 `openclaw plugins doctor` 會顯示這些相容性通知：

| 訊號                                       | 意義                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **config valid**                           | 設定可正常解析，且外掛可解析                                                                                  |
| **hook-only** (info)                       | 外掛僅註冊 hooks；這是受支援路徑，但尚未遷移到能力註冊                                                       |
| **legacy `before_agent_start`** (warn)     | 外掛使用已棄用的 `before_agent_start` hook，而不是 `before_model_resolve`／`before_prompt_build`              |
| **deprecated memory-embedding API** (warn) | 非內建外掛使用舊的記憶體特定 embedding 提供者 API，而不是 `registerEmbeddingProvider`                        |
| **hard error**                             | 設定無效或外掛載入失敗                                                                                        |

目前沒有任何 advisory／warn 訊號會中斷你的外掛。這些訊號也會出現在 `openclaw status --all` 和 `openclaw plugins doctor`。

## 架構概覽

OpenClaw 的外掛系統有四層：

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw 會從已設定路徑、工作區根目錄、全域外掛根目錄與內建外掛中尋找候選外掛。探索會先讀取原生 `openclaw.plugin.json` manifests，以及受支援的 bundle manifests。
  </Step>
  <Step title="Enablement + validation">
    核心會決定已探索到的外掛是啟用、停用、封鎖，或被選為像記憶體這類專用槽位。
  </Step>
  <Step title="Runtime loading">
    原生 OpenClaw 外掛會在程序內載入，並將能力註冊到中央 registry。封裝的 JavaScript 會透過原生 `require` 載入；第三方本機來源 TypeScript 則是緊急 Jiti fallback。相容 bundle 會正規化為 registry records，而不匯入執行階段程式碼。
  </Step>
  <Step title="Surface consumption">
    OpenClaw 的其餘部分會讀取 registry，以公開工具、通道、提供者設定、hooks、HTTP 路由、命令列介面命令與服務。
  </Step>
</Steps>

專就外掛命令列介面而言，根命令探索分為兩個階段：

- 解析時中繼資料來自 `registerCli(..., { descriptors: [...] })`
- 真正的外掛命令列介面模組可以保持 lazy，並在第一次呼叫時註冊

這會讓外掛擁有的命令列介面程式碼留在外掛內，同時仍允許 OpenClaw 在解析前保留根命令名稱。

重要的設計邊界：

- manifest／config 驗證應能在不執行外掛程式碼的情況下，從 **manifest／schema 中繼資料**運作
- 原生能力探索可以載入受信任的外掛進入點程式碼，以建立非啟用的 registry snapshot
- 原生執行階段行為來自外掛模組的 `register(api)` 路徑，且 `api.registrationMode === "full"`

這種分離讓 OpenClaw 能在完整執行階段啟動前，驗證設定、說明缺少／已停用的外掛，並建立 UI／schema 提示。

### 外掛中繼資料 snapshot 與 lookup table

閘道啟動會為目前的設定 snapshot 建立一個 `PluginMetadataSnapshot`。該 snapshot 僅含中繼資料：它儲存已安裝外掛索引、manifest registry、manifest diagnostics、擁有者對應、外掛 id normalizer，以及 manifest records。它不持有已載入的外掛模組、提供者 SDK、套件內容或執行階段匯出。

外掛感知的 config 驗證、啟動自動啟用與閘道外掛 bootstrap 會使用該 snapshot，而不是各自重建 manifest／index 中繼資料。`PluginLookUpTable` 由同一個 snapshot 衍生，並加入目前執行階段 config 的啟動外掛計畫。

啟動後，閘道會將目前的中繼資料 snapshot 保留為可替換的執行階段產品。重複的執行階段提供者探索可以借用該 snapshot，而不是在每次 provider-catalog pass 都重建已安裝索引與 manifest registry。閘道關閉、config／外掛 inventory 變更，以及已安裝索引寫入時，snapshot 會被清除或替換；當不存在相容的目前 snapshot 時，呼叫端會 fallback 到冷 manifest／index 路徑。相容性檢查必須包含外掛探索根目錄，例如 `plugins.load.paths` 與預設 agent 工作區，因為工作區外掛是中繼資料範圍的一部分。

snapshot 與 lookup table 讓重複的啟動決策保持在快速路徑上：

- 通道擁有權
- 延遲通道啟動
- 啟動外掛 id
- 提供者與命令列介面後端擁有權
- 設定提供者、命令別名、模型 catalog 提供者與 manifest 合約擁有權
- 外掛 config schema 與通道 config schema 驗證
- 啟動自動啟用決策

安全邊界是 snapshot 替換，而不是突變。當 config、外掛 inventory、安裝 records 或持久化 index policy 變更時，請重建 snapshot。不要把它視為廣泛可變的全域 registry，也不要保留無界限的歷史 snapshots。執行階段外掛載入仍與中繼資料 snapshots 分離，因此過時的執行階段狀態無法隱藏在中繼資料 cache 後面。

cache 規則記錄於[外掛架構內部細節](/zh-TW/plugins/architecture-internals#plugin-cache-boundary)：manifest 與探索中繼資料除非呼叫端持有目前流程的明確 snapshot、lookup table 或 manifest registry，否則都是新鮮的。隱藏中繼資料 caches 與 wall-clock TTLs 不屬於外掛載入的一部分。只有執行階段 loader、module 與 dependency-artifact caches 可以在程式碼或已安裝 artifacts 實際載入後持續存在。

部分冷路徑呼叫端仍會直接從持久化的已安裝外掛索引重建 manifest registries，而不是接收閘道 `PluginLookUpTable`。該路徑現在會依需求重建 registry；當呼叫端已經有目前 lookup table 或明確 manifest registry 時，請優先透過執行階段流程傳遞它們。

### 啟用規劃

啟用規劃是控制平面的一部分。呼叫端可以在載入更廣泛的執行階段登錄表之前，詢問哪些外掛與具體命令、供應商、通道、路由、代理執行框架或能力相關。

規劃器會維持目前資訊清單行為的相容性：

- `activation.*` 欄位是明確的規劃器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和掛鉤仍是資訊清單擁有權後援
- 僅 ids 的規劃器 API 仍可供現有呼叫端使用
- plan API 會回報原因標籤，讓診斷能區分明確提示與擁有權後援

<Warning>
不要把 `activation` 視為生命週期掛鉤或 `register(...)` 的替代品。它是用來縮小載入範圍的中繼資料。當擁有權欄位已經描述關係時，請優先使用擁有權欄位；只有在需要額外規劃器提示時才使用 `activation`。
</Warning>

### 通道外掛與共用訊息工具

通道外掛不需要為一般聊天動作註冊獨立的傳送/編輯/反應工具。OpenClaw 會在核心中保留一個共用的 `message` 工具，而通道外掛則擁有其背後的通道專屬探索與執行。

目前的邊界是：

- 核心擁有共用 `message` 工具主機、提示接線、工作階段/討論串簿記，以及執行分派
- 通道外掛擁有限定範圍的動作探索、能力探索，以及任何通道專屬 schema 片段
- 通道外掛擁有供應商專屬的工作階段對話文法，例如對話 id 如何編碼討論串 id 或從父對話繼承
- 通道外掛透過其動作配接器執行最終動作

對通道外掛而言，SDK 介面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。這個統一的探索呼叫可讓外掛一起回傳其可見動作、能力和 schema 貢獻，避免這些部分彼此偏移。

當通道專屬的訊息工具參數帶有媒體來源，例如本機路徑或遠端媒體 URL 時，外掛也應從 `describeMessageTool(...)` 回傳 `mediaSourceParams`。核心會使用該明確清單來套用沙盒路徑正規化和傳出媒體存取提示，而不需硬編碼外掛擁有的參數名稱。請優先在那裡使用動作範圍的對應表，而不是整個通道共用的一個平面清單，這樣只用於個人檔案的媒體參數就不會在 `send` 等無關動作上被正規化。

核心會把執行階段範圍傳入該探索步驟。重要欄位包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的傳入 `requesterSenderId`

這對具備情境感知的外掛很重要。通道可以根據作用中的帳戶、目前房間/討論串/訊息，或受信任的請求者身分來隱藏或公開訊息動作，而不需要在核心 `message` 工具中硬編碼通道專屬分支。

這也是為什麼嵌入式執行器路由變更仍屬於外掛工作的原因：執行器負責把目前聊天/工作階段身分轉送到外掛探索邊界，讓共用 `message` 工具針對目前回合公開正確的通道擁有介面。

對於通道擁有的執行輔助工具，內建外掛應將執行執行階段保留在自己的外掛模組內。核心不再於 `src/agents/tools` 下擁有 Discord、Slack、Telegram 或 WhatsApp 訊息動作執行階段。我們不會發布獨立的 `plugin-sdk/*-action-runtime` 子路徑，內建外掛應直接從其外掛擁有的模組匯入自己的本機執行階段程式碼。

同樣的邊界一般也適用於以供應商命名的 SDK 接縫：核心不應匯入 Discord、Signal、Slack、WhatsApp 或類似外掛的通道專屬便利 barrel。如果核心需要某項行為，請使用內建外掛自己的 `api.ts` / `runtime-api.ts` barrel，或將該需求提升為共用 SDK 中狹窄的通用能力。

內建外掛也遵循相同規則。內建外掛的 `runtime-api.ts` 不應重新匯出自己的品牌化 `openclaw/plugin-sdk/<plugin-id>` facade。這些品牌化 facade 仍是給外部外掛和較舊消費者使用的相容性 shim，但內建外掛應使用本機匯出，加上狹窄的通用 SDK 子路徑，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。除非現有外部生態系的相容性邊界需要，否則新程式碼不應新增 plugin-id 專屬的 SDK facade。

特別對投票而言，有兩條執行路徑：

- `outbound.sendPoll` 是符合常見投票模型的通道所使用的共用基準
- `actions.handleAction("poll")` 是通道專屬投票語意或額外投票參數的偏好路徑

核心現在會延後共用投票解析，直到外掛投票分派拒絕該動作之後，因此外掛擁有的投票處理器可以接受通道專屬投票欄位，而不會先被通用投票解析器阻擋。

完整啟動順序請參閱[外掛架構內部機制](/zh-TW/plugins/architecture-internals)。

## 能力擁有權模型

OpenClaw 將原生外掛視為**公司**或**功能**的擁有權邊界，而不是一袋彼此無關的整合。

這表示：

- 公司外掛通常應擁有該公司面向 OpenClaw 的所有介面
- 功能外掛通常應擁有其導入的完整功能介面
- 通道應使用共用核心能力，而不是臨時重新實作供應商行為

<AccordionGroup>
  <Accordion title="供應商多能力">
    `google` 擁有文字推理、命令列介面後端、嵌入、語音、即時語音、媒體理解、圖片/音樂/影片生成，以及網頁搜尋。`openai` 擁有文字推理、嵌入、語音、即時轉錄、即時語音、媒體理解、圖片/影片生成。`minimax` 擁有文字推理，以及媒體理解、語音、圖片/音樂/影片生成和網頁搜尋。
  </Accordion>
  <Accordion title="供應商單一能力">
    `arcee` 和 `chutes` 只擁有文字推理；`microsoft` 只擁有語音。供應商外掛可以保持這麼狹窄，直到需要涵蓋該供應商更多介面為止。
  </Accordion>
  <Accordion title="功能外掛">
    `voice-call` 擁有通話傳輸、工具、命令列介面、路由和 Twilio 媒體串流橋接，但會使用共用語音、即時轉錄和即時語音能力，而不是直接匯入供應商外掛。
  </Accordion>
</AccordionGroup>

預期的最終狀態是：

- 供應商面向 OpenClaw 的介面會位於單一外掛中，即使它橫跨文字模型、語音、圖片和影片
- 其他供應商也可以針對自己的介面範圍採取相同做法
- 通道不需要關心哪個供應商外掛擁有該提供者；它們使用核心公開的共用能力合約

這是關鍵差異：

- **外掛** = 擁有權邊界
- **能力** = 多個外掛可以實作或使用的核心合約

因此，如果 OpenClaw 新增像影片這樣的新領域，第一個問題不是「哪個供應商應該硬編碼影片處理？」第一個問題是「核心影片能力合約是什麼？」一旦該合約存在，供應商外掛就可以針對它註冊，通道/功能外掛也可以使用它。

如果能力尚不存在，正確做法通常是：

<Steps>
  <Step title="定義能力">
    在核心中定義缺少的能力。
  </Step>
  <Step title="透過 SDK 公開">
    以型別化方式透過外掛 API/執行階段公開它。
  </Step>
  <Step title="接線消費者">
    將通道/功能接線到該能力。
  </Step>
  <Step title="供應商實作">
    讓供應商外掛註冊實作。
  </Step>
</Steps>

這會讓擁有權保持明確，同時避免核心行為依賴單一供應商或一次性的外掛專屬程式碼路徑。

### 能力分層

決定程式碼歸屬時，請使用這個心智模型：

<Tabs>
  <Tab title="核心能力層">
    共用編排、政策、後援、設定合併規則、遞送語意，以及型別化合約。
  </Tab>
  <Tab title="供應商外掛層">
    供應商專屬 API、驗證、模型目錄、語音合成、圖片生成、影片後端、用量端點。
  </Tab>
  <Tab title="通道/功能外掛層">
    使用核心能力並將其呈現在某個介面上的 Discord/Slack/voice-call/等整合。
  </Tab>
</Tabs>

例如，TTS 遵循這個形狀：

- 核心擁有回覆時 TTS 政策、後援順序、偏好設定和通道遞送
- `elevenlabs`、`google`、`microsoft` 和 `openai` 擁有合成實作
- `voice-call` 使用電話 TTS 執行階段輔助工具

未來能力也應優先採用相同模式。

### 多能力公司外掛範例

公司外掛從外部看起來應該是內聚的。如果 OpenClaw 有模型、語音、即時轉錄、即時語音、媒體理解、圖片生成、影片生成、網頁擷取和網頁搜尋的共用合約，供應商可以在一個地方擁有其所有介面：

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

重要的不是確切的輔助工具名稱。重要的是形狀：

- 一個外掛擁有供應商介面
- 核心仍擁有能力合約
- 通道和功能外掛使用 `api.runtime.*` 輔助工具，而不是供應商程式碼
- 合約測試可以斷言外掛註冊了它聲稱擁有的能力

### 能力範例：影片理解

OpenClaw 已經將圖片/音訊/影片理解視為一個共用能力。相同的擁有權模型也適用於那裡：

<Steps>
  <Step title="核心定義合約">
    核心定義媒體理解合約。
  </Step>
  <Step title="供應商外掛註冊">
    供應商外掛視情況註冊 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消費者使用共用行為">
    通道和功能外掛使用共用核心行為，而不是直接接線到供應商程式碼。
  </Step>
</Steps>

這能避免把某個提供者的影片假設烘焙進核心。外掛擁有供應商介面；核心擁有能力合約和後援行為。

影片生成已經使用相同順序：核心擁有型別化能力合約和執行階段輔助工具，而供應商外掛會針對它註冊 `api.registerVideoGenerationProvider(...)` 實作。

需要具體的推出檢查清單嗎？請參閱[能力食譜](/zh-TW/plugins/adding-capabilities)。

## 合約與強制執行

外掛 API 介面刻意在 `OpenClawPluginApi` 中以型別定義並集中管理。該合約定義了支援的註冊點，以及外掛可以依賴的執行階段輔助工具。

這很重要，原因如下：

- 外掛作者能取得一個穩定的內部標準
- 核心可以拒絕重複的所有權，例如兩個外掛註冊相同的提供者 ID
- 啟動流程可以針對格式錯誤的註冊顯示可操作的診斷資訊
- 合約測試可以強制執行內建外掛所有權，並防止無聲漂移

有兩層強制執行機制：

<AccordionGroup>
  <Accordion title="執行階段註冊強制執行">
    外掛登錄會在外掛載入時驗證註冊。範例：重複的提供者 ID、重複的語音提供者 ID，以及格式錯誤的註冊，都會產生外掛診斷資訊，而不是未定義行為。
  </Accordion>
  <Accordion title="合約測試">
    內建外掛會在測試執行期間擷取到合約登錄中，讓 OpenClaw 能明確判斷所有權。目前這用於模型提供者、語音提供者、網頁搜尋提供者，以及內建註冊所有權。
  </Accordion>
</AccordionGroup>

實際效果是，OpenClaw 會預先知道哪個外掛擁有哪些介面。這讓核心和通道能順暢組合，因為所有權是宣告式、有型別且可測試的，而不是隱含的。

### 合約中應包含什麼

<Tabs>
  <Tab title="良好合約">
    - 有型別
    - 小型
    - 針對特定能力
    - 由核心擁有
    - 可由多個外掛重複使用
    - 可由通道/功能使用，且不需要知道供應商細節

  </Tab>
  <Tab title="不良合約">
    - 隱藏在核心中的供應商特定政策
    - 繞過登錄的一次性外掛逃生口
    - 通道程式碼直接觸及供應商實作
    - 不屬於 `OpenClawPluginApi` 或 `api.runtime` 的臨時執行階段物件

  </Tab>
</Tabs>

不確定時，請提高抽象層級：先定義能力，再讓外掛接入其中。

## 執行模型

原生 OpenClaw 外掛會與閘道在**同一程序內**執行。它們不會被沙箱隔離。已載入的原生外掛與核心程式碼具有相同的程序層級信任邊界。

<Warning>
原生外掛的影響：外掛可以註冊工具、網路處理常式、鉤子和服務；外掛錯誤可能使閘道當機或不穩定；惡意原生外掛等同於在 OpenClaw 程序內任意執行程式碼。
</Warning>

相容套件預設較安全，因為 OpenClaw 目前將它們視為中繼資料/內容套件。在目前版本中，這主要表示內建 Skills。

對非內建外掛使用允許清單和明確的安裝/載入路徑。將工作區外掛視為開發期間程式碼，而不是生產預設值。

對於內建工作區套件名稱，請讓外掛 ID 錨定在 npm 名稱中：預設為 `@openclaw/<id>`，或者在套件刻意公開較窄的外掛角色時，使用已核准且有型別的後綴，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任注意事項：** `plugins.allow` 信任的是**外掛 ID**，而不是來源出處。當工作區外掛啟用/列入允許清單時，若其 ID 與內建外掛相同，會刻意遮蔽內建副本。這是正常行為，且有助於本機開發、修補測試和熱修復。內建外掛信任是由來源快照解析，也就是載入時磁碟上的資訊清單和程式碼，而不是由安裝中繼資料解析。損毀或遭替換的安裝記錄，無法在未察覺的情況下將內建外掛的信任範圍擴大到實際來源宣告之外。
</Note>

## 匯出邊界

OpenClaw 匯出的是能力，而不是實作便利性。

保持能力註冊為公開。修剪非合約輔助匯出：

- 內建外掛特定的輔助子路徑
- 不打算作為公開 API 的執行階段管線子路徑
- 供應商特定的便利輔助工具
- 屬於實作細節的設定/入門輔助工具

保留的內建外掛輔助子路徑已從產生的 SDK 匯出對應中淘汰。將擁有者特定的輔助工具保留在擁有該功能的外掛套件內；只將可重複使用的主機行為提升為通用 SDK 合約，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

## 內部機制與參考

關於載入管線、登錄模型、提供者執行階段鉤子、閘道 HTTP 路由、訊息工具結構描述、通道目標解析、提供者目錄、情境引擎外掛，以及新增能力指南，請參閱[外掛架構內部機制](/zh-TW/plugins/architecture-internals)。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛資訊清單](/zh-TW/plugins/manifest)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
