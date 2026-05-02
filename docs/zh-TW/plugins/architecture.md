---
read_when:
    - 建置或偵錯原生 OpenClaw Plugin
    - 了解 Plugin 能力模型或所有權邊界
    - 處理 Plugin 載入管線或註冊表
    - 實作提供者執行階段鉤子或通道 Plugin
sidebarTitle: Internals
summary: Plugin 內部機制：能力模型、所有權、契約、載入管線與執行階段輔助工具
title: Plugin 內部機制
x-i18n:
    generated_at: "2026-05-02T02:54:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

這是 OpenClaw Plugin 系統的**深度架構參考**。如需實用指南，請從下方其中一個聚焦頁面開始。

<CardGroup cols={2}>
  <Card title="安裝並使用 Plugin" icon="plug" href="/zh-TW/tools/plugin">
    用於新增、啟用和疑難排解 Plugin 的終端使用者指南。
  </Card>
  <Card title="建置 Plugin" icon="rocket" href="/zh-TW/plugins/building-plugins">
    以最小可運作 manifest 開始的第一個 Plugin 教學。
  </Card>
  <Card title="Channel Plugin" icon="comments" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息通道 Plugin。
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型 Provider Plugin。
  </Card>
  <Card title="SDK 概覽" icon="book" href="/zh-TW/plugins/sdk-overview">
    Import map 與註冊 API 參考。
  </Card>
</CardGroup>

## 公開能力模型

Capabilities 是 OpenClaw 內部公開的**原生 Plugin** 模型。每個原生 OpenClaw Plugin 都會針對一種或多種 capability 類型註冊：

| Capability             | 註冊方法                                         | 範例 Plugin                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 文字推論               | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推論後端           | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 語音                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 圖片生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | `google`                             |
| 通道 / 訊息            | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway 探索           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
註冊零個 capability 但提供 hook、工具、探索服務或背景服務的 Plugin，是**舊版僅 hook** Plugin。此模式仍受到完整支援。
</Note>

### 外部相容性立場

Capability 模型已落地於核心，且目前由內建/原生 Plugin 使用，但外部 Plugin 相容性仍需要比「它已匯出，所以它已凍結」更嚴格的標準。

| Plugin 狀況                                      | 指引                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 現有外部 Plugin                                  | 保持以 hook 為基礎的整合可運作；這是相容性基準。                                                |
| 新的內建/原生 Plugin                             | 優先使用明確的 capability 註冊，而不是廠商特定的越界存取或新的僅 hook 設計。                   |
| 採用 capability 註冊的外部 Plugin                | 允許，但除非文件標示為穩定，否則應將 capability 特定的輔助介面視為仍在演進。                  |

Capability 註冊是預期方向。在轉換期間，舊版 hook 仍是外部 Plugin 最安全、不中斷的路徑。匯出的輔助子路徑並非全都等同；請優先使用狹窄且有文件記載的合約，而不是偶然匯出的輔助介面。

### Plugin 形態

OpenClaw 會根據每個已載入 Plugin 的實際註冊行為（而不只是靜態中繼資料）將其分類為一種形態：

<AccordionGroup>
  <Accordion title="plain-capability">
    只註冊一種 capability 類型（例如像 `mistral` 這樣僅提供 Provider 的 Plugin）。
  </Accordion>
  <Accordion title="hybrid-capability">
    註冊多種 capability 類型（例如 `openai` 擁有文字推論、語音、媒體理解和圖片生成）。
  </Accordion>
  <Accordion title="hook-only">
    只註冊 hook（具型別或自訂），沒有 capability、工具、命令或服務。
  </Accordion>
  <Accordion title="non-capability">
    註冊工具、命令、服務或路由，但沒有 capability。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形態與 capability 細目。詳情請參閱 [CLI 參考](/zh-TW/cli/plugins#inspect)。

### 舊版 hook

`before_agent_start` hook 仍作為僅 hook Plugin 的相容性路徑受到支援。舊版實務 Plugin 仍依賴它。

方向：

- 保持其可運作
- 將其文件化為舊版
- 模型/Provider 覆寫工作優先使用 `before_model_resolve`
- Prompt 變更工作優先使用 `before_prompt_build`
- 只在實際使用量下降，且 fixture 覆蓋證明遷移安全後才移除

### 相容性訊號

執行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 時，你可能會看到以下其中一個標籤：

| 訊號                       | 意義                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Config 解析正常，且 Plugin 可解析                           |
| **compatibility advisory** | Plugin 使用受支援但較舊的模式（例如 `hook-only`）            |
| **legacy warning**         | Plugin 使用已棄用的 `before_agent_start`                    |
| **hard error**             | Config 無效或 Plugin 載入失敗                               |

`hook-only` 或 `before_agent_start` 目前都不會使你的 Plugin 中斷：`hook-only` 是提示性訊號，而 `before_agent_start` 只會觸發警告。這些訊號也會出現在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架構概覽

OpenClaw 的 Plugin 系統有四層：

<Steps>
  <Step title="Manifest + 探索">
    OpenClaw 會從已設定的路徑、workspace 根目錄、全域 Plugin 根目錄和內建 Plugin 中尋找候選 Plugin。探索會優先讀取原生 `openclaw.plugin.json` manifest，以及受支援的 bundle manifest。
  </Step>
  <Step title="啟用 + 驗證">
    核心會決定探索到的 Plugin 是啟用、停用、封鎖，或是被選為 memory 等排他 slot。
  </Step>
  <Step title="執行階段載入">
    原生 OpenClaw Plugin 會在處理程序內載入，並將 capability 註冊到中央 registry。封裝的 JavaScript 透過原生 `require` 載入；第三方本機來源 TypeScript 則是緊急 Jiti fallback。相容 bundle 會被正規化為 registry 記錄，而不會匯入執行階段程式碼。
  </Step>
  <Step title="介面消費">
    OpenClaw 的其餘部分會讀取 registry，以公開工具、通道、Provider 設定、hook、HTTP 路由、CLI 命令和服務。
  </Step>
</Steps>

特別對 Plugin CLI 而言，根命令探索會分成兩個階段：

- 解析時中繼資料來自 `registerCli(..., { descriptors: [...] })`
- 真正的 Plugin CLI 模組可以保持 lazy，並在首次呼叫時註冊

這可讓 Plugin 擁有的 CLI 程式碼保留在 Plugin 內，同時仍讓 OpenClaw 在解析前保留根命令名稱。

重要的設計邊界：

- manifest/config 驗證應能從**manifest/schema 中繼資料**完成，而不執行 Plugin 程式碼
- 原生 capability 探索可載入受信任的 Plugin 入口程式碼，以建構非啟動式 registry snapshot
- 原生執行階段行為來自 Plugin 模組的 `register(api)` 路徑，且 `api.registrationMode === "full"`

這樣的分離讓 OpenClaw 能在完整執行階段啟用前，驗證 config、說明缺失/停用的 Plugin，並建構 UI/schema 提示。

### Plugin 中繼資料 snapshot 與查詢表

Gateway 啟動時會為目前的 config snapshot 建立一個 `PluginMetadataSnapshot`。此 snapshot 僅含中繼資料：它儲存已安裝 Plugin index、manifest registry、manifest diagnostics、owner map、Plugin id normalizer，以及 manifest records。它不保存已載入的 Plugin 模組、Provider SDK、套件內容或執行階段匯出。

具 Plugin 感知的 config 驗證、啟動自動啟用，以及 Gateway Plugin bootstrap 會消費此 snapshot，而不是各自重新建構 manifest/index 中繼資料。`PluginLookUpTable` 由同一個 snapshot 衍生，並加入目前執行階段 config 的啟動 Plugin plan。

啟動後，Gateway 會將目前的中繼資料 snapshot 保留為可替換的執行階段產物。重複的執行階段 Provider 探索可借用該 snapshot，而不必為每次 Provider catalog pass 重新建構已安裝 index 和 manifest registry。Gateway 關閉、config/Plugin inventory 變更，以及已安裝 index 寫入時，snapshot 會被清除或替換；當沒有相容的目前 snapshot 存在時，呼叫端會回退到冷 manifest/index 路徑。相容性檢查必須包含 Plugin 探索根目錄，例如 `plugins.load.paths` 和預設 agent workspace，因為 workspace Plugin 是中繼資料範圍的一部分。

Snapshot 與查詢表會讓重複的啟動決策保持在快速路徑上：

- 通道 ownership
- 延遲通道啟動
- 啟動 Plugin id
- Provider 與 CLI 後端 ownership
- 設定 Provider、命令 alias、模型 catalog Provider，以及 manifest contract ownership
- Plugin config schema 與通道 config schema 驗證
- 啟動自動啟用決策

安全邊界是 snapshot 替換，而不是 mutation。當 config、Plugin inventory、安裝記錄或持久化 index policy 變更時，請重建 snapshot。不要將它視為廣泛可變的全域 registry，也不要保留無界的歷史 snapshot。執行階段 Plugin 載入仍與中繼資料 snapshot 分離，因此過期的執行階段狀態不會被隱藏在中繼資料 cache 後面。

Cache 規則記載於 [Plugin 架構內部](/zh-TW/plugins/architecture-internals#plugin-cache-boundary)：除非呼叫端為目前 flow 持有明確的 snapshot、查詢表或 manifest registry，否則 manifest 與探索中繼資料都是新鮮的。隱藏中繼資料 cache 和 wall-clock TTL 並非 Plugin 載入的一部分。只有在程式碼或已安裝 artifact 實際載入後，執行階段 loader、模組和 dependency artifact cache 才可以持續存在。

某些 cold-path 呼叫端仍會直接從持久化的已安裝 Plugin index 重建 manifest registry，而不是接收 Gateway `PluginLookUpTable`。該路徑現在會依需求重建 registry；當呼叫端已經擁有目前查詢表或明確 manifest registry 時，請優先在執行階段 flow 中傳遞它。

### 啟動規劃

啟動規劃是控制平面的一部分。呼叫端可以在載入更廣泛的執行階段 registry 前，詢問哪些 Plugin 與具體命令、Provider、通道、路由、agent harness 或 capability 相關。

Planner 會保持目前 manifest 行為相容：

- `activation.*` 欄位是明確的 planner 提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hook 仍作為 manifest ownership fallback
- 僅 ids 的 planner API 仍可供現有呼叫端使用
- plan API 會回報原因標籤，讓 diagnostics 能區分明確提示與 ownership fallback

<Warning>
不要將 `activation` 視為生命週期 hook 或 `register(...)` 的替代品。它是用來縮小載入範圍的中繼資料。當擁有權欄位已經描述關係時，優先使用擁有權欄位；只有在需要額外的規劃器提示時才使用 `activation`。
</Warning>

### 頻道 Plugin 與共用訊息工具

頻道 Plugin 不需要為一般聊天動作註冊個別的傳送/編輯/反應工具。OpenClaw 在核心中保留一個共用的 `message` 工具，而頻道 Plugin 擁有其背後的頻道專屬探索與執行。

目前的邊界如下：

- 核心擁有共用的 `message` 工具主機、提示詞接線、session/thread 簿記，以及執行分派
- 頻道 Plugin 擁有範圍限定的動作探索、能力探索，以及任何頻道專屬 schema 片段
- 頻道 Plugin 擁有提供者專屬的 session 對話文法，例如對話 id 如何編碼 thread id 或從父對話繼承
- 頻道 Plugin 透過其動作 adapter 執行最終動作

對於頻道 Plugin，SDK 介面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。這個統一的探索呼叫讓 Plugin 可以一起回傳其可見動作、能力與 schema 貢獻，讓這些部分不會彼此漂移。

當頻道專屬的訊息工具參數帶有媒體來源，例如本機路徑或遠端媒體 URL 時，Plugin 也應該從 `describeMessageTool(...)` 回傳 `mediaSourceParams`。核心會使用該明確清單來套用沙箱路徑正規化與對外媒體存取提示，而不會硬編碼 Plugin 擁有的參數名稱。這裡請優先使用動作範圍的 map，而不是整個頻道共用的一個扁平清單，這樣僅供 profile 使用的媒體參數就不會在 `send` 等無關動作上被正規化。

核心會把執行階段範圍傳入該探索步驟。重要欄位包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的傳入 `requesterSenderId`

這對情境敏感的 Plugin 很重要。頻道可以根據啟用中的帳號、目前房間/thread/message，或受信任的請求者身分，隱藏或公開訊息動作，而不需要在核心 `message` 工具中硬編碼頻道專屬分支。

這就是為什麼嵌入式 runner 路由變更仍然是 Plugin 工作：runner 負責把目前聊天/session 身分轉送到 Plugin 探索邊界，讓共用的 `message` 工具為目前回合公開正確的頻道擁有介面。

對於頻道擁有的執行 helper，內建 Plugin 應該將執行 runtime 保留在它們自己的 extension 模組內。核心不再於 `src/agents/tools` 下擁有 Discord、Slack、Telegram 或 WhatsApp 的訊息動作 runtime。我們不發布個別的 `plugin-sdk/*-action-runtime` 子路徑，而內建 Plugin 應該直接從其 extension 擁有的模組匯入自己的本機 runtime 程式碼。

相同邊界也適用於一般提供者命名的 SDK seam：核心不應匯入 Slack、Discord、Signal、WhatsApp 或類似 extension 的頻道專屬便利 barrel。如果核心需要某個行為，要嘛使用內建 Plugin 自己的 `api.ts` / `runtime-api.ts` barrel，要嘛將需求提升為共用 SDK 中狹窄的泛用能力。

內建 Plugin 遵循相同規則。內建 Plugin 的 `runtime-api.ts` 不應重新匯出自己的品牌化 `openclaw/plugin-sdk/<plugin-id>` facade。這些品牌化 facade 仍然是外部 Plugin 與舊版使用者的相容性 shim，但內建 Plugin 應使用本機匯出加上狹窄的泛用 SDK 子路徑，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。新程式碼不應新增 Plugin id 專屬的 SDK facade，除非既有外部生態系的相容性邊界需要它。

特別針對投票，有兩條執行路徑：

- `outbound.sendPoll` 是適用於符合通用投票模型之頻道的共用基線
- `actions.handleAction("poll")` 是頻道專屬投票語意或額外投票參數的偏好路徑

核心現在會延後共用投票解析，直到 Plugin 投票分派拒絕該動作之後，因此 Plugin 擁有的投票 handler 可以接受頻道專屬投票欄位，而不會先被泛用投票 parser 阻擋。

完整啟動順序請參閱 [Plugin 架構內部](/zh-TW/plugins/architecture-internals)。

## 能力擁有權模型

OpenClaw 將原生 Plugin 視為一個**公司**或一項**功能**的擁有權邊界，而不是一袋無關整合的集合。

這表示：

- 公司 Plugin 通常應該擁有該公司所有面向 OpenClaw 的介面
- 功能 Plugin 通常應該擁有它引入的完整功能介面
- 頻道應該使用共用核心能力，而不是臨時重新實作提供者行為

<AccordionGroup>
  <Accordion title="供應商多能力">
    `openai` 擁有文字推論、語音、即時語音、媒體理解與影像生成。`google` 擁有文字推論加上媒體理解、影像生成與網頁搜尋。`qwen` 擁有文字推論加上媒體理解與影片生成。
  </Accordion>
  <Accordion title="供應商單一能力">
    `elevenlabs` 與 `microsoft` 擁有語音；`firecrawl` 擁有網頁擷取；`minimax` / `mistral` / `moonshot` / `zai` 擁有媒體理解後端。
  </Accordion>
  <Accordion title="功能 Plugin">
    `voice-call` 擁有通話傳輸、工具、CLI、路由與 Twilio 媒體串流橋接，但會使用共用語音、即時轉錄與即時語音能力，而不是直接匯入供應商 Plugin。
  </Accordion>
</AccordionGroup>

預期的最終狀態是：

- OpenAI 存在於一個 Plugin 中，即使它橫跨文字模型、語音、影像與未來影片
- 另一個供應商也可以對自己的介面範圍採用相同做法
- 頻道不在意哪個供應商 Plugin 擁有該提供者；它們使用核心公開的共用能力合約

這是關鍵差異：

- **Plugin** = 擁有權邊界
- **能力** = 多個 Plugin 可以實作或使用的核心合約

因此，如果 OpenClaw 新增一個像影片這樣的新領域，第一個問題不是「哪個提供者應該硬編碼影片處理？」第一個問題是「核心影片能力合約是什麼？」一旦該合約存在，供應商 Plugin 就可以針對它註冊，而頻道/功能 Plugin 可以使用它。

如果能力尚不存在，正確做法通常是：

<Steps>
  <Step title="定義能力">
    在核心中定義缺少的能力。
  </Step>
  <Step title="透過 SDK 公開">
    以型別化方式透過 Plugin API/runtime 公開它。
  </Step>
  <Step title="接線消費者">
    將頻道/功能接線到該能力。
  </Step>
  <Step title="供應商實作">
    讓供應商 Plugin 註冊實作。
  </Step>
</Steps>

這會讓擁有權保持明確，同時避免核心行為依賴單一供應商或一次性的 Plugin 專屬程式碼路徑。

### 能力分層

決定程式碼歸屬位置時，請使用這個心智模型：

<Tabs>
  <Tab title="核心能力層">
    共用編排、政策、fallback、設定合併規則、交付語意與型別化合約。
  </Tab>
  <Tab title="供應商 Plugin 層">
    供應商專屬 API、驗證、模型目錄、語音合成、影像生成、未來影片後端、用量端點。
  </Tab>
  <Tab title="頻道/功能 Plugin 層">
    Slack/Discord/voice-call/等整合，使用核心能力並在某個介面上呈現它們。
  </Tab>
</Tabs>

例如，TTS 遵循這個形狀：

- 核心擁有回覆時 TTS 政策、fallback 順序、偏好設定與頻道交付
- `openai`、`elevenlabs` 與 `microsoft` 擁有合成實作
- `voice-call` 使用電話語音 TTS runtime helper

未來能力也應優先採用相同模式。

### 多能力公司 Plugin 範例

公司 Plugin 從外部看起來應該是有凝聚力的。如果 OpenClaw 有模型、語音、即時轉錄、即時語音、媒體理解、影像生成、影片生成、網頁擷取與網頁搜尋的共用合約，供應商可以在一個地方擁有其所有介面：

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

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
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
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

重要的不是確切的 helper 名稱。重要的是形狀：

- 一個 Plugin 擁有供應商介面
- 核心仍然擁有能力合約
- 頻道與功能 Plugin 使用 `api.runtime.*` helper，而不是供應商程式碼
- 合約測試可以斷言 Plugin 註冊了它宣稱擁有的能力

### 能力範例：影片理解

OpenClaw 已經將影像/音訊/影片理解視為一個共用能力。相同擁有權模型也適用於此：

<Steps>
  <Step title="核心定義合約">
    核心定義媒體理解合約。
  </Step>
  <Step title="供應商 Plugin 註冊">
    供應商 Plugin 視情況註冊 `describeImage`、`transcribeAudio` 與 `describeVideo`。
  </Step>
  <Step title="消費者使用共用行為">
    頻道與功能 Plugin 使用共用核心行為，而不是直接接線到供應商程式碼。
  </Step>
</Steps>

這會避免把某個提供者的影片假設烘焙到核心中。Plugin 擁有供應商介面；核心擁有能力合約與 fallback 行為。

影片生成已經使用相同順序：核心擁有型別化能力合約與 runtime helper，而供應商 Plugin 針對它註冊 `api.registerVideoGenerationProvider(...)` 實作。

需要具體推出檢查清單嗎？請參閱 [能力 Cookbook](/zh-TW/plugins/architecture)。

## 合約與強制執行

Plugin API 介面刻意在 `OpenClawPluginApi` 中型別化並集中管理。該合約定義了支援的註冊點，以及 Plugin 可以依賴的 runtime helper。

這很重要，原因如下：

- Plugin 作者取得一個穩定的內部標準
- 核心可以拒絕重複擁有權，例如兩個 Plugin 註冊相同的提供者 id
- 啟動可以為格式錯誤的註冊顯示可操作的診斷
- 合約測試可以強制執行內建 Plugin 擁有權並防止無聲漂移

有兩層強制執行：

<AccordionGroup>
  <Accordion title="執行階段註冊強制檢查">
    Plugin 登錄檔會在 plugins 載入時驗證註冊。範例：重複的供應商 ID、重複的語音供應商 ID，以及格式錯誤的註冊，會產生 Plugin 診斷，而不是未定義行為。
  </Accordion>
  <Accordion title="契約測試">
    測試執行期間，內建 plugins 會被擷取到契約登錄檔中，讓 OpenClaw 可以明確斷言所有權。如今這用於模型供應商、語音供應商、網頁搜尋供應商，以及內建註冊所有權。
  </Accordion>
</AccordionGroup>

實際效果是 OpenClaw 會預先知道哪個 Plugin 擁有哪個介面。如此一來，核心與通道就能順暢組合，因為所有權是宣告式、有型別且可測試的，而不是隱含的。

### 契約中應包含什麼

<Tabs>
  <Tab title="良好契約">
    - 有型別
    - 小型
    - 針對特定能力
    - 由核心擁有
    - 可由多個 plugins 重複使用
    - 可供通道/功能使用，而不需要供應商知識

  </Tab>
  <Tab title="不良契約">
    - 隱藏在核心中的供應商特定政策
    - 繞過登錄檔的一次性 Plugin 逃生出口
    - 通道程式碼直接觸及供應商實作
    - 不屬於 `OpenClawPluginApi` 或 `api.runtime` 的臨時執行階段物件

  </Tab>
</Tabs>

若有疑問，請提高抽象層級：先定義能力，再讓 plugins 插入其中。

## 執行模型

原生 OpenClaw plugins 會與 Gateway **同處理程序**執行。它們沒有沙箱隔離。已載入的原生 Plugin 與核心程式碼具有相同的處理程序層級信任邊界。

<Warning>
原生 Plugin 的影響：Plugin 可以註冊工具、網路處理常式、hooks 和服務；Plugin 錯誤可能會讓 Gateway 當機或不穩定；惡意原生 Plugin 等同於在 OpenClaw 處理程序內執行任意程式碼。
</Warning>

相容 bundles 預設較安全，因為 OpenClaw 目前會將它們視為中繼資料/內容套件。在目前版本中，這主要代表內建 Skills。

對於非內建 plugins，請使用允許清單與明確的安裝/載入路徑。請將工作區 plugins 視為開發期間程式碼，而不是生產預設值。

對於內建工作區套件名稱，請讓 Plugin ID 錨定在 npm 名稱中：預設為 `@openclaw/<id>`，或在套件刻意公開較窄的 Plugin 角色時，使用已核准的具型別尾碼，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任注意事項：**`plugins.allow` 信任的是 **Plugin IDs**，而不是來源出處。當已啟用/列入允許清單時，與內建 Plugin 具有相同 ID 的工作區 Plugin 會刻意遮蔽內建副本。這很正常，而且對本機開發、修補測試和熱修復很有用。內建 Plugin 信任是從來源快照解析，也就是載入時磁碟上的 manifest 與程式碼，而不是從安裝中繼資料解析。損毀或被替換的安裝記錄，不能悄悄擴大內建 Plugin 的信任介面，超出實際來源所宣稱的範圍。
</Note>

## 匯出邊界

OpenClaw 匯出的是能力，而不是實作便利性。

保持能力註冊公開。裁剪非契約輔助匯出：

- 內建 Plugin 特定的輔助子路徑
- 非預期作為公開 API 的執行階段管線子路徑
- 供應商特定的便利輔助項
- 屬於實作細節的設定/入門輔助項

保留的內建 Plugin 輔助子路徑已從產生的 SDK 匯出對應表中退役。請將擁有者特定的輔助項保留在擁有該項的 Plugin 套件內；只將可重複使用的主機行為提升為通用 SDK 契約，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

## 內部結構與參考

關於載入管線、登錄檔模型、供應商執行階段 hooks、Gateway HTTP 路由、訊息工具綱要、通道目標解析、供應商目錄、內容引擎 plugins，以及新增能力指南，請參閱 [Plugin 架構內部結構](/zh-TW/plugins/architecture-internals)。

## 相關

- [建置 plugins](/zh-TW/plugins/building-plugins)
- [Plugin manifest](/zh-TW/plugins/manifest)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
