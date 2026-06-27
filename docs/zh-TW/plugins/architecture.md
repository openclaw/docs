---
read_when:
    - 建置或偵錯原生 OpenClaw 外掛
    - 了解外掛能力模型或所有權邊界
    - 處理外掛載入管線或登錄檔
    - 實作供應商執行階段掛鉤或頻道外掛
sidebarTitle: Internals
summary: 外掛內部：能力模型、所有權、合約、載入管線與執行階段輔助工具
title: 外掛內部
x-i18n:
    generated_at: "2026-06-27T19:33:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

這是 OpenClaw 外掛系統的**深度架構參考**。實務指南請從下列其中一個聚焦頁面開始。

<CardGroup cols={2}>
  <Card title="安裝並使用外掛" icon="plug" href="/zh-TW/tools/plugin">
    新增、啟用與疑難排解外掛的終端使用者指南。
  </Card>
  <Card title="建置外掛" icon="rocket" href="/zh-TW/plugins/building-plugins">
    包含最小可用 manifest 的第一個外掛教學。
  </Card>
  <Card title="通道外掛" icon="comments" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息通道外掛。
  </Card>
  <Card title="供應器外掛" icon="microchip" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型供應器外掛。
  </Card>
  <Card title="SDK 概覽" icon="book" href="/zh-TW/plugins/sdk-overview">
    匯入映射與註冊 API 參考。
  </Card>
</CardGroup>

## 公開能力模型

能力是 OpenClaw 內部公開的**原生外掛**模型。每個原生 OpenClaw 外掛都會針對一或多種能力類型註冊：

| 能力                   | 註冊方法                                         | 外掛範例                             |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 文字推論               | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| 命令列介面推論後端     | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 嵌入                   | `api.registerEmbeddingProvider(...)`             | 供應器擁有的向量外掛                 |
| 語音                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 逐字稿來源             | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| 圖像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | `google`                             |
| 通道 / 訊息傳遞        | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| 閘道探索               | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
註冊零個能力但提供鉤子、工具、探索服務或背景服務的外掛，是**僅限舊版鉤子**外掛。這種模式仍受到完整支援。
</Note>

### 外部相容性立場

能力模型已落地於核心，且目前由 bundled/native 外掛使用，但外部外掛相容性仍需要比「它已匯出，因此已凍結」更嚴格的標準。

| 外掛情況                                          | 指引                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既有外部外掛                                      | 維持以鉤子為基礎的整合可運作；這是相容性基準。                                                   |
| 新的 bundled/native 外掛                          | 優先使用明確能力註冊，而不是供應商特定的內部存取或新的僅限鉤子設計。                             |
| 採用能力註冊的外部外掛                            | 允許，但除非文件標示為穩定，否則請將能力特定的輔助介面視為仍在演進。                             |

能力註冊是預期方向。在轉換期間，舊版鉤子仍是外部外掛最安全、不中斷的路徑。匯出的輔助子路徑並非全都等同；請優先使用狹窄且有文件記載的契約，而非偶然匯出的輔助項目。

### 外掛形態

OpenClaw 會根據每個已載入外掛的實際註冊行為（不只是靜態中繼資料）將其分類為一種形態：

<AccordionGroup>
  <Accordion title="plain-capability">
    只註冊一種能力類型（例如像 `mistral` 這樣僅提供供應器的外掛）。
  </Accordion>
  <Accordion title="hybrid-capability">
    註冊多種能力類型（例如 `openai` 擁有文字推論、語音、媒體理解與圖像生成）。
  </Accordion>
  <Accordion title="hook-only">
    只註冊鉤子（具型別或自訂），沒有能力、工具、命令或服務。
  </Accordion>
  <Accordion title="non-capability">
    註冊工具、命令、服務或路由，但沒有能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 查看外掛的形態與能力明細。詳情請參閱[命令列介面參考](/zh-TW/cli/plugins#inspect)。

### 舊版鉤子

`before_agent_start` 鉤子仍作為僅限鉤子外掛的相容性路徑受到支援。舊版真實世界外掛仍依賴它。

方向：

- 維持其可運作
- 將其記錄為舊版
- 對於模型/供應器覆寫工作，優先使用 `before_model_resolve`
- 對於提示變更工作，優先使用 `before_prompt_build`
- 只有在真實使用量下降且 fixture 覆蓋證明遷移安全後才移除

### 相容性訊號

執行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 時，你可能會看到下列其中一個標籤：

| 訊號                       | 意義                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 設定可正常解析，且外掛可解析                                 |
| **compatibility advisory** | 外掛使用受支援但較舊的模式（例如 `hook-only`）               |
| **legacy warning**         | 外掛使用已棄用的 `before_agent_start`                        |
| **hard error**             | 設定無效或外掛載入失敗                                       |

`hook-only` 或 `before_agent_start` 目前都不會中斷你的外掛：`hook-only` 是提示性建議，而 `before_agent_start` 只會觸發警告。這些訊號也會出現在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架構概覽

OpenClaw 的外掛系統有四層：

<Steps>
  <Step title="Manifest + 探索">
    OpenClaw 會從已設定的路徑、工作區根目錄、全域外掛根目錄與 bundled 外掛中尋找候選外掛。探索會先讀取原生 `openclaw.plugin.json` manifest，以及受支援的 bundle manifest。
  </Step>
  <Step title="啟用 + 驗證">
    核心會決定已探索的外掛是啟用、停用、封鎖，還是被選為像記憶體這類獨佔槽位。
  </Step>
  <Step title="執行階段載入">
    原生 OpenClaw 外掛會在程序內載入，並將能力註冊到中央登錄中。封裝的 JavaScript 透過原生 `require` 載入；第三方本機來源 TypeScript 則是緊急 Jiti 後援。相容 bundle 會正規化為登錄記錄，而不匯入執行階段程式碼。
  </Step>
  <Step title="介面消費">
    OpenClaw 的其餘部分會讀取登錄，以公開工具、通道、供應器設定、鉤子、HTTP 路由、命令列介面命令與服務。
  </Step>
</Steps>

特別針對外掛命令列介面，根命令探索分成兩個階段：

- 解析時中繼資料來自 `registerCli(..., { descriptors: [...] })`
- 真正的外掛命令列介面模組可以保持延遲載入，並在第一次叫用時註冊

這會讓外掛擁有的命令列介面程式碼留在外掛內，同時仍讓 OpenClaw 在解析前保留根命令名稱。

重要的設計邊界：

- manifest/設定驗證應能從 **manifest/schema 中繼資料**運作，而不執行外掛程式碼
- 原生能力探索可以載入受信任的外掛進入點程式碼，以建立不啟動的登錄快照
- 原生執行階段行為來自外掛模組的 `register(api)` 路徑，且 `api.registrationMode === "full"`

這種切分讓 OpenClaw 能在完整執行階段啟動前，驗證設定、說明缺失/停用的外掛，並建立 UI/schema 提示。

### 外掛中繼資料快照與查找表

閘道啟動會為目前設定快照建立一個 `PluginMetadataSnapshot`。此快照僅包含中繼資料：它儲存已安裝外掛索引、manifest 登錄、manifest 診斷、擁有者映射、外掛 ID 正規化器與 manifest 記錄。它不保留已載入的外掛模組、供應器 SDK、套件內容或執行階段匯出。

具外掛感知的設定驗證、啟動自動啟用與閘道外掛啟動流程會消費該快照，而不是各自重建 manifest/索引中繼資料。`PluginLookUpTable` 衍生自同一快照，並加入目前執行階段設定的啟動外掛計畫。

啟動後，閘道會將目前中繼資料快照保留為可替換的執行階段產品。重複的執行階段供應器探索可以借用該快照，而不必為每次供應器目錄傳遞重建已安裝索引與 manifest 登錄。閘道關閉、設定/外掛庫存變更與已安裝索引寫入時，快照會被清除或替換；當不存在相容的目前快照時，呼叫端會後援到冷 manifest/索引路徑。相容性檢查必須包含外掛探索根目錄，例如 `plugins.load.paths` 與預設代理工作區，因為工作區外掛是中繼資料範圍的一部分。

快照與查找表會讓重複啟動決策維持在快速路徑上：

- 通道擁有權
- 延遲通道啟動
- 啟動外掛 ID
- 供應器與命令列介面後端擁有權
- 設定供應器、命令別名、模型目錄供應器與 manifest 契約擁有權
- 外掛設定 schema 與通道設定 schema 驗證
- 啟動自動啟用決策

安全邊界是快照替換，而不是變更。當設定、外掛庫存、安裝記錄或持久化索引政策變更時，請重建快照。不要將它視為廣泛可變的全域登錄，也不要保留無界限的歷史快照。執行階段外掛載入仍與中繼資料快照分離，因此過期的執行階段狀態無法藏在中繼資料快取後面。

快取規則記錄於[外掛架構內部](/zh-TW/plugins/architecture-internals#plugin-cache-boundary)：除非呼叫端持有目前流程的明確快照、查找表或 manifest 登錄，否則 manifest 與探索中繼資料都是新鮮的。隱藏中繼資料快取與牆鐘 TTL 不屬於外掛載入的一部分。只有執行階段載入器、模組與相依性成品快取，才能在程式碼或已安裝成品實際載入後持續存在。

部分冷路徑呼叫端仍會直接從持久化的已安裝外掛索引重建 manifest 登錄，而不是接收閘道 `PluginLookUpTable`。該路徑現在會按需重建登錄；當呼叫端已經有目前查找表或明確 manifest 登錄時，請優先透過執行階段流程傳遞它們。

### 啟用規劃

啟用規劃是控制平面的一部分。呼叫端可以在載入更廣泛的執行階段登錄之前，詢問哪些外掛與具體命令、供應器、通道、路由、代理 harness 或能力相關。

規劃器會維持目前 manifest 行為相容：

- `activation.*` 欄位是明確的規劃器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 hook 仍是 manifest 擁有權 fallback
- 僅含 id 的規劃器 API 仍可供既有呼叫端使用
- plan API 會回報原因標籤，讓診斷能區分明確提示與擁有權 fallback

<Warning>
不要將 `activation` 視為生命週期 hook 或 `register(...)` 的替代品。它是用來縮小載入範圍的中繼資料。當擁有權欄位已描述關係時，優先使用擁有權欄位；只有在需要額外規劃器提示時才使用 `activation`。
</Warning>

### Channel 外掛與共用 message 工具

Channel 外掛不需要為一般聊天動作註冊個別的 send/edit/react 工具。OpenClaw 在 core 中保留一個共用的 `message` 工具，而 Channel 外掛擁有其背後特定於 Channel 的探索與執行。

目前的邊界如下：

- core 擁有共用 `message` 工具主機、prompt wiring、session/thread bookkeeping，以及執行 dispatch
- Channel 外掛擁有 scoped action discovery、capability discovery，以及任何特定於 Channel 的 schema 片段
- Channel 外掛擁有特定於 provider 的 session conversation grammar，例如 conversation id 如何編碼 thread id 或從 parent conversation 繼承
- Channel 外掛透過其 action adapter 執行最終動作

對於 Channel 外掛，SDK 介面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。這個統一的 discovery 呼叫讓外掛能一起回傳其可見 actions、capabilities 與 schema contributions，讓這些部分不會彼此漂移。

當特定於 Channel 的 message-tool 參數帶有 media source，例如本機路徑或遠端媒體 URL 時，外掛也應從 `describeMessageTool(...)` 回傳 `mediaSourceParams`。core 會使用該明確清單套用 sandbox path normalization 與 outbound media-access hints，而不硬編碼外掛擁有的參數名稱。這裡優先使用 action-scoped maps，而不是一個 Channel-wide flat list，這樣 profile-only media 參數就不會在不相關的動作（例如 `send`）上被正規化。

core 會將 runtime scope 傳入該 discovery 步驟。重要欄位包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- trusted inbound `requesterSenderId`

這對 context-sensitive 外掛很重要。Channel 可以根據 active account、current room/thread/message 或 trusted requester identity 隱藏或公開 message actions，而不需在 core `message` 工具中硬編碼特定於 Channel 的分支。

這就是為什麼 embedded-runner routing changes 仍然是外掛工作：runner 負責將目前的 chat/session identity 轉發到外掛 discovery boundary，讓共用的 `message` 工具為目前回合公開正確的 Channel-owned surface。

對於 Channel-owned execution helpers，bundled 外掛應將 execution runtime 保留在自己的 extension modules 內。core 不再於 `src/agents/tools` 下擁有 Discord、Slack、Telegram 或 WhatsApp message-action runtimes。我們不發布個別的 `plugin-sdk/*-action-runtime` subpaths，而 bundled 外掛應直接從其 extension-owned modules 匯入自己的 local runtime code。

同樣的邊界也一般適用於 provider-named SDK seams：core 不應匯入 Slack、Discord、Signal、WhatsApp 或類似 extensions 的特定於 Channel 的 convenience barrels。如果 core 需要某項行為，應消費 bundled 外掛自己的 `api.ts` / `runtime-api.ts` barrel，或將需求提升為共用 SDK 中狹窄的 generic capability。

bundled 外掛遵循相同規則。bundled 外掛的 `runtime-api.ts` 不應重新匯出自己 branded 的 `openclaw/plugin-sdk/<plugin-id>` facade。那些 branded facades 仍是給外部外掛與較舊消費者的 compatibility shims，但 bundled 外掛應使用 local exports 加上狹窄的 generic SDK subpaths，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。新程式碼不應新增 plugin-id-specific SDK facades，除非既有外部生態系的相容性邊界需要它。

特別針對 polls，有兩條執行路徑：

- `outbound.sendPoll` 是適合 common poll model 的 Channel 的共用 baseline
- `actions.handleAction("poll")` 是特定於 Channel 的 poll semantics 或額外 poll parameters 的首選路徑

core 現在會延後共用 poll parsing，直到外掛 poll dispatch 拒絕該動作之後才進行，因此 plugin-owned poll handlers 可以接受特定於 Channel 的 poll fields，而不會先被 generic poll parser 阻擋。

完整啟動順序請參閱 [外掛架構內部](/zh-TW/plugins/architecture-internals)。

## Capability 擁有權模型

OpenClaw 將 native 外掛視為**公司**或**功能**的擁有權邊界，而不是一袋不相關 integrations 的集合。

這表示：

- company 外掛通常應擁有該公司所有面向 OpenClaw 的 surfaces
- feature 外掛通常應擁有其引入的完整 feature surface
- channels 應消費共用 core capabilities，而不是臨時重新實作 provider 行為

<AccordionGroup>
  <Accordion title="廠商多 Capability">
    `openai` 擁有 text inference、speech、realtime voice、media understanding 與 image generation。`google` 擁有 text inference 加上 media understanding、image generation 與 web search。`qwen` 擁有 text inference 加上 media understanding 與 video generation。
  </Accordion>
  <Accordion title="廠商單一 Capability">
    `elevenlabs` 和 `microsoft` 擁有 speech；`firecrawl` 擁有 web-fetch；`minimax` / `mistral` / `moonshot` / `zai` 擁有 media-understanding backends。
  </Accordion>
  <Accordion title="Feature 外掛">
    `voice-call` 擁有 call transport、tools、命令列介面、routes 與 Twilio media-stream bridging，但會消費共用 speech、realtime transcription 與 realtime voice capabilities，而不是直接匯入廠商外掛。
  </Accordion>
</AccordionGroup>

預期的最終狀態是：

- OpenAI 位於單一外掛中，即使它涵蓋文字模型、語音、影像與未來的影片
- 其他廠商可以對自己的 surface area 做同樣的事
- channels 不關心哪個廠商外掛擁有 provider；它們消費 core 公開的共用 capability contract

這是關鍵區別：

- **外掛** = 擁有權邊界
- **capability** = 多個外掛可以實作或消費的 core contract

因此，如果 OpenClaw 新增像 video 這樣的新領域，第一個問題不是「哪個 provider 應該硬編碼 video handling？」第一個問題是「core video capability contract 是什麼？」一旦該 contract 存在，vendor plugins 就可以針對它註冊，而 channel/feature plugins 可以消費它。

如果 capability 尚不存在，正確做法通常是：

<Steps>
  <Step title="定義 Capability">
    在 core 中定義缺少的 capability。
  </Step>
  <Step title="透過 SDK 公開">
    以 typed 方式透過 plugin API/runtime 公開它。
  </Step>
  <Step title="連接 Consumers">
    將 channels/features 連接到該 capability。
  </Step>
  <Step title="廠商實作">
    讓廠商外掛註冊實作。
  </Step>
</Steps>

這能保持擁有權明確，同時避免 core 行為依賴單一廠商或一次性的 plugin-specific code path。

### Capability 分層

決定程式碼歸屬位置時，使用這個 mental model：

<Tabs>
  <Tab title="Core Capability 層">
    共用 orchestration、policy、fallback、config merge rules、delivery semantics 與 typed contracts。
  </Tab>
  <Tab title="廠商外掛層">
    特定於廠商的 API、auth、model catalogs、speech synthesis、image generation、future video backends、usage endpoints。
  </Tab>
  <Tab title="Channel/Feature 外掛層">
    消費 core capabilities 並將其呈現在 surface 上的 Slack/Discord/voice-call/etc. integration。
  </Tab>
</Tabs>

例如，TTS 遵循此形狀：

- core 擁有 reply-time TTS policy、fallback order、prefs 與 channel delivery
- `openai`、`elevenlabs` 和 `microsoft` 擁有 synthesis implementations
- `voice-call` 消費 telephony TTS runtime helper

同一模式應優先用於未來 capabilities。

### Multi-capability company 外掛範例

company 外掛從外部看起來應該具有凝聚力。如果 OpenClaw 對 models、speech、realtime transcription、realtime voice、media understanding、image generation、video generation、web fetch 與 web search 有共用 contracts，廠商可以在一個地方擁有它的所有 surfaces：

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

重點不是精確的 helper 名稱。重點是形狀：

- 一個外掛擁有廠商 surface
- core 仍擁有 capability contracts
- channels 與 feature 外掛消費 `api.runtime.*` helpers，而不是廠商程式碼
- contract tests 可以斷言外掛已註冊其聲稱擁有的 capabilities

### Capability 範例：video understanding

OpenClaw 已經將 image/audio/video understanding 視為一個共用 capability。相同的擁有權模型也適用於此：

<Steps>
  <Step title="Core 定義 Contract">
    core 定義 media-understanding contract。
  </Step>
  <Step title="廠商外掛註冊">
    廠商外掛會視情況註冊 `describeImage`、`transcribeAudio` 與 `describeVideo`。
  </Step>
  <Step title="Consumers 使用共用行為">
    Channels 與 feature 外掛消費共用 core 行為，而不是直接連接到廠商程式碼。
  </Step>
</Steps>

這避免將某個 provider 的 video assumptions 烘焙進 core。外掛擁有廠商 surface；core 擁有 capability contract 與 fallback behavior。

Video generation 已經使用相同順序：core 擁有 typed capability contract 與 runtime helper，而廠商外掛會針對它註冊 `api.registerVideoGenerationProvider(...)` implementations。

需要具體 rollout checklist？請參閱 [Capability Cookbook](/zh-TW/plugins/adding-capabilities)。

## Contracts 與 enforcement

plugin API surface 有意在 `OpenClawPluginApi` 中集中並型別化。該 contract 定義支援的 registration points，以及外掛可依賴的 runtime helpers。

這很重要，原因如下：

- plugin authors 取得一個穩定的內部標準
- core 可以拒絕 duplicate ownership，例如兩個外掛註冊相同 provider id
- startup 可以對 malformed registration 顯示可行的 diagnostics
- contract tests 可以強制 bundled-plugin ownership 並防止 silent drift

有兩層 enforcement：

<AccordionGroup>
  <Accordion title="執行階段註冊強制檢查">
    外掛登錄檔會在外掛載入時驗證註冊。範例：重複的提供者 ID、重複的語音提供者 ID，以及格式錯誤的註冊，都會產生外掛診斷資訊，而不是未定義行為。
  </Accordion>
  <Accordion title="合約測試">
    內建外掛會在測試執行期間被擷取到合約登錄檔中，讓 OpenClaw 能明確斷言擁有權。目前這用於模型提供者、語音提供者、網路搜尋提供者，以及內建註冊擁有權。
  </Accordion>
</AccordionGroup>

實際效果是 OpenClaw 會預先知道哪個外掛擁有哪些介面。這讓核心與通道可以順暢組合，因為擁有權是宣告式、具型別且可測試的，而不是隱含的。

### 合約中應包含的內容

<Tabs>
  <Tab title="良好合約">
    - 具型別
    - 小而明確
    - 特定於能力
    - 由核心擁有
    - 可由多個外掛重用
    - 可由通道/功能使用，且不需要供應商知識

  </Tab>
  <Tab title="不良合約">
    - 隱藏在核心中的供應商特定政策
    - 繞過登錄檔的一次性外掛逃生口
    - 通道程式碼直接觸及供應商實作
    - 不屬於 `OpenClawPluginApi` 或 `api.runtime` 的臨時執行階段物件

  </Tab>
</Tabs>

不確定時，請提高抽象層級：先定義能力，再讓外掛接入其中。

## 執行模型

原生 OpenClaw 外掛會與閘道在**同一程序內**執行。它們沒有被沙箱隔離。已載入的原生外掛與核心程式碼具有相同的程序層級信任邊界。

<Warning>
原生外掛的影響：外掛可以註冊工具、網路處理器、鉤子與服務；外掛錯誤可能會讓閘道當機或不穩定；惡意原生外掛等同於在 OpenClaw 程序內執行任意程式碼。
</Warning>

相容套件預設更安全，因為 OpenClaw 目前將它們視為中繼資料/內容套件。在目前版本中，這主要表示內建 Skills。

對非內建外掛使用允許清單與明確的安裝/載入路徑。將工作區外掛視為開發期間程式碼，而不是生產預設值。

對於內建工作區套件名稱，請讓外掛 ID 以 npm 名稱為錨點：預設為 `@openclaw/<id>`，或在套件刻意公開較窄外掛角色時，使用已核准的具型別尾碼，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任注意事項：** `plugins.allow` 信任的是**外掛 ID**，而不是來源出處。當工作區外掛啟用/加入允許清單時，若它與內建外掛具有相同 ID，該工作區外掛會刻意遮蔽內建副本。這是正常的，且對本機開發、修補測試與緊急修正很有用。內建外掛信任會從來源快照解析，也就是載入時磁碟上的資訊清單與程式碼，而不是從安裝中繼資料解析。損毀或被替換的安裝記錄，無法在未告知的情況下將內建外掛的信任介面擴大到實際來源宣告之外。
</Note>

## 匯出邊界

OpenClaw 匯出能力，而不是實作便利性。

保持能力註冊為公開。修剪非合約輔助匯出：

- 內建外掛專用的輔助子路徑
- 不打算作為公開 API 的執行階段管線子路徑
- 供應商特定的便利輔助工具
- 屬於實作細節的設定/入門輔助工具

保留的內建外掛輔助子路徑已從產生的 SDK 匯出對應表中退役。請將擁有者特定的輔助工具保留在所屬外掛套件內；僅將可重用的主機行為提升為通用 SDK 合約，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

## 內部機制與參考

如需載入管線、登錄檔模型、提供者執行階段鉤子、閘道 HTTP 路由、訊息工具結構描述、通道目標解析、提供者目錄、脈絡引擎外掛，以及新增能力指南，請參閱[外掛架構內部機制](/zh-TW/plugins/architecture-internals)。

## 相關

- [建置外掛](/zh-TW/plugins/building-plugins)
- [外掛資訊清單](/zh-TW/plugins/manifest)
- [外掛 SDK 設定](/zh-TW/plugins/sdk-setup)
