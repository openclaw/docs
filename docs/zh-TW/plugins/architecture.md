---
read_when:
    - 建置或偵錯原生 OpenClaw Plugin
    - 了解 Plugin 能力模型或所有權邊界
    - 處理 Plugin 載入管線或註冊表
    - 實作提供者執行階段掛鉤或通道 Plugin
sidebarTitle: Internals
summary: Plugin 內部機制：能力模型、所有權、合約、載入管線與執行階段輔助工具
title: Plugin 內部機制
x-i18n:
    generated_at: "2026-04-30T03:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

這是 OpenClaw Plugin 系統的**深度架構參考**。如需實務指南，請從下方其中一個聚焦頁面開始。

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/zh-TW/tools/plugin">
    終端使用者指南，說明如何新增、啟用 Plugin，以及排除 Plugin 問題。
  </Card>
  <Card title="Building plugins" icon="rocket" href="/zh-TW/plugins/building-plugins">
    第一個 Plugin 教學，包含最小可運作的 manifest。
  </Card>
  <Card title="Channel plugins" icon="comments" href="/zh-TW/plugins/sdk-channel-plugins">
    建置訊息通道 Plugin。
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/zh-TW/plugins/sdk-provider-plugins">
    建置模型供應器 Plugin。
  </Card>
  <Card title="SDK overview" icon="book" href="/zh-TW/plugins/sdk-overview">
    匯入對應表與註冊 API 參考。
  </Card>
</CardGroup>

## 公開能力模型

能力是 OpenClaw 內部公開的**原生 Plugin**模型。每個原生 OpenClaw Plugin 都會針對一個或多個能力類型註冊：

| 能力                   | 註冊方法                                         | 範例 Plugin                          |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| 文字推論               | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI 推論後端           | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| 語音                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| 即時轉錄               | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| 即時語音               | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| 媒體理解               | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| 圖像生成               | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| 音樂生成               | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| 影片生成               | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| 網頁擷取               | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| 網頁搜尋               | `api.registerWebSearchProvider(...)`             | `google`                             |
| 通道 / 訊息            | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway 探索           | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
註冊零個能力，但提供 hook、工具、探索服務或背景服務的 Plugin，是**舊版僅 hook** Plugin。此模式仍受到完整支援。
</Note>

### 外部相容性立場

能力模型已進入核心，且目前由內建/原生 Plugin 使用，但外部 Plugin 相容性仍需要比「已匯出，所以已凍結」更嚴格的標準。

| Plugin 情況                                      | 指引                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 既有外部 Plugin                                  | 維持以 hook 為基礎的整合可用；這是相容性基準。                                                   |
| 新的內建/原生 Plugin                             | 偏好明確的能力註冊，而不是供應商特定的深入存取或新的僅 hook 設計。                               |
| 採用能力註冊的外部 Plugin                        | 允許，但除非文件標明穩定，否則應將能力特定的輔助介面視為仍在演進。                               |

能力註冊是預期方向。在轉換期間，舊版 hook 仍是外部 Plugin 最安全、最不易破壞相容性的路徑。匯出的輔助子路徑並非全部等同，應偏好狹窄且有文件說明的合約，而不是偶然匯出的輔助項目。

### Plugin 形態

OpenClaw 會根據實際註冊行為，而不只是靜態 metadata，將每個載入的 Plugin 分類為一種形態：

<AccordionGroup>
  <Accordion title="plain-capability">
    只註冊一種能力類型，例如像 `mistral` 這類僅供應器 Plugin。
  </Accordion>
  <Accordion title="hybrid-capability">
    註冊多種能力類型，例如 `openai` 擁有文字推論、語音、媒體理解和圖像生成。
  </Accordion>
  <Accordion title="hook-only">
    只註冊 hook（具型別或自訂），沒有能力、工具、命令或服務。
  </Accordion>
  <Accordion title="non-capability">
    註冊工具、命令、服務或路由，但沒有能力。
  </Accordion>
</AccordionGroup>

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形態與能力明細。詳情請參閱 [CLI 參考](/zh-TW/cli/plugins#inspect)。

### 舊版 hook

`before_agent_start` hook 仍作為僅 hook Plugin 的相容性路徑受到支援。舊版真實世界 Plugin 仍依賴它。

方向：

- 保持其可用
- 將其記錄為舊版
- 針對模型/供應器覆寫工作，偏好 `before_model_resolve`
- 針對提示變更工作，偏好 `before_prompt_build`
- 只有在真實使用量下降，且 fixture 覆蓋證明遷移安全後才移除

### 相容性訊號

執行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 時，你可能會看到以下其中一種標籤：

| 訊號                       | 意義                                                         |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | 設定可正常解析，且 Plugin 可解析                             |
| **compatibility advisory** | Plugin 使用受支援但較舊的模式，例如 `hook-only`              |
| **legacy warning**         | Plugin 使用已棄用的 `before_agent_start`                     |
| **hard error**             | 設定無效，或 Plugin 載入失敗                                 |

`hook-only` 和 `before_agent_start` 目前都不會破壞你的 Plugin：`hook-only` 是 advisory，而 `before_agent_start` 只會觸發 warning。這些訊號也會出現在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架構概覽

OpenClaw 的 Plugin 系統有四層：

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw 會從已設定的路徑、工作區根目錄、全域 Plugin 根目錄，以及內建 Plugin 找出候選 Plugin。探索會先讀取原生 `openclaw.plugin.json` manifest，以及受支援的 bundle manifest。
  </Step>
  <Step title="Enablement + validation">
    核心會判斷已探索到的 Plugin 是啟用、停用、封鎖，還是被選入像 memory 這類 exclusive slot。
  </Step>
  <Step title="Runtime loading">
    原生 OpenClaw Plugin 會透過 jiti 在程序內載入，並將能力註冊到中央 registry。相容 bundle 會被正規化為 registry record，而不匯入 runtime code。
  </Step>
  <Step title="Surface consumption">
    OpenClaw 其他部分會讀取 registry，以暴露工具、通道、供應器設定、hook、HTTP 路由、CLI 命令和服務。
  </Step>
</Steps>

特別針對 Plugin CLI，root command 探索分為兩個階段：

- parse-time metadata 來自 `registerCli(..., { descriptors: [...] })`
- 真正的 Plugin CLI 模組可以保持 lazy，並在首次呼叫時註冊

這會讓 Plugin 擁有的 CLI code 留在 Plugin 內，同時仍讓 OpenClaw 在解析前保留 root command 名稱。

重要的設計邊界：

- manifest/config 驗證應可透過 **manifest/schema metadata** 運作，而不執行 Plugin code
- 原生能力探索可以載入受信任的 Plugin entry code，以建立不啟動的 registry snapshot
- 原生 runtime 行為來自 Plugin 模組的 `register(api)` 路徑，且 `api.registrationMode === "full"`

這種拆分讓 OpenClaw 能在完整 runtime 啟動前驗證設定、解釋缺少/停用的 Plugin，並建立 UI/schema 提示。

### Plugin metadata snapshot 與 lookup table

Gateway 啟動時會為目前的 config snapshot 建立一個 `PluginMetadataSnapshot`。snapshot 只含 metadata：它儲存已安裝的 Plugin index、manifest registry、manifest diagnostics、owner maps、Plugin id normalizer，以及 manifest records。它不保存已載入的 Plugin modules、provider SDK、package contents 或 runtime exports。

支援 Plugin 的 config 驗證、啟動自動啟用，以及 Gateway Plugin bootstrap 會使用該 snapshot，而不是各自重新建立 manifest/index metadata。`PluginLookUpTable` 由同一個 snapshot 衍生，並為目前 runtime config 加上 startup plugin plan。

啟動後，Gateway 會將目前的 metadata snapshot 保留為可替換的 runtime product。重複的 runtime provider 探索可以借用該 snapshot，而不是為每次 provider-catalog pass 重建 installed index 與 manifest registry。Gateway 關閉、config/Plugin inventory 變更，以及 installed index 寫入時，會清除或替換 snapshot；如果沒有相容的 current snapshot，呼叫端會回退到 cold manifest/index path。相容性檢查必須包含 Plugin 探索根目錄，例如 `plugins.load.paths` 和預設 agent workspace，因為 workspace Plugin 是 metadata 範圍的一部分。

snapshot 與 lookup table 讓重複的啟動決策留在快速路徑：

- channel ownership
- deferred channel startup
- startup plugin ids
- provider and CLI backend ownership
- setup provider, command alias, model catalog provider, and manifest contract ownership
- plugin config schema and channel config schema validation
- startup auto-enable decisions

安全邊界是 snapshot 替換，而不是 mutation。當 config、Plugin inventory、install records 或 persisted index policy 變更時，請重建 snapshot。不要把它視為廣泛可變的全域 registry，也不要保留無界限的歷史 snapshot。Runtime Plugin 載入仍與 metadata snapshot 分離，因此 stale runtime state 不會被隱藏在 metadata cache 後方。

cache 規則記錄於 [Plugin architecture internals](/zh-TW/plugins/architecture-internals#plugin-cache-boundary)：除非呼叫端持有目前流程的明確 snapshot、lookup table 或 manifest registry，否則 manifest 與 discovery metadata 都是 fresh。隱藏 metadata cache 和 wall-clock TTL 不是 Plugin 載入的一部分。只有 runtime loader、module 與 dependency-artifact cache 可以在 code 或 installed artifacts 實際載入後持續存在。

部分 cold-path 呼叫端仍會直接從持久化的 installed plugin index 重建 manifest registries，而不是接收 Gateway `PluginLookUpTable`。該路徑現在會按需重建 registry；當呼叫端已經有 current lookup table 或明確 manifest registry 時，請偏好透過 runtime flows 傳遞它。

### 啟動規劃

啟動規劃是 control plane 的一部分。呼叫端可以在載入更廣泛的 runtime registries 前，詢問哪些 Plugin 與具體命令、供應器、通道、路由、agent harness 或能力相關。

planner 會維持目前 manifest 行為的相容性：

- `activation.*` 欄位是明確的 planner 提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 與 hook 仍作為 manifest ownership fallback
- ids-only planner API 仍可供既有呼叫端使用
- plan API 會回報 reason labels，讓 diagnostics 能區分明確提示與 ownership fallback

<Warning>
請勿將 `activation` 視為生命週期 hook 或 `register(...)` 的替代品。它是用來縮小載入範圍的中繼資料。當所有權欄位已經描述關係時，優先使用所有權欄位；只有在需要額外的規劃器提示時才使用 `activation`。
</Warning>

### 頻道 Plugin 與共用訊息工具

頻道 Plugin 不需要為一般聊天動作註冊個別的傳送/編輯/反應工具。OpenClaw 在核心中保留一個共用的 `message` 工具，而頻道 Plugin 則擁有其背後的頻道特定探索與執行。

目前的邊界如下：

- 核心擁有共用的 `message` 工具主機、提示接線、工作階段/對話串簿記，以及執行分派
- 頻道 Plugin 擁有限定範圍的動作探索、能力探索，以及任何頻道特定的 schema 片段
- 頻道 Plugin 擁有供應商特定的工作階段對話文法，例如對話 ID 如何編碼對話串 ID，或如何從父對話繼承
- 頻道 Plugin 透過其動作適配器執行最終動作

對於頻道 Plugin，SDK 表面是 `ChannelMessageActionAdapter.describeMessageTool(...)`。這個統一的探索呼叫可讓 Plugin 一次回傳其可見動作、能力和 schema 貢獻，避免這些部分彼此漂移。

當頻道特定的訊息工具參數攜帶媒體來源，例如本機路徑或遠端媒體 URL 時，Plugin 也應該從 `describeMessageTool(...)` 回傳 `mediaSourceParams`。核心會使用該明確清單來套用沙箱路徑正規化與對外媒體存取提示，而不會硬編碼 Plugin 擁有的參數名稱。這裡優先使用動作限定的映射，而不是整個頻道共用的一份扁平清單，這樣僅限設定檔的媒體參數才不會在 `send` 等不相關動作上被正規化。

核心會將執行階段範圍傳入該探索步驟。重要欄位包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的傳入 `requesterSenderId`

這對情境敏感的 Plugin 很重要。頻道可以根據作用中的帳號、目前的房間/對話串/訊息，或受信任的請求者身分，隱藏或公開訊息動作，而不需要在核心 `message` 工具中硬編碼頻道特定分支。

這就是為什麼嵌入式執行器的路由變更仍然是 Plugin 工作：執行器負責將目前的聊天/工作階段身分轉送到 Plugin 探索邊界，讓共用的 `message` 工具為目前回合公開正確的頻道擁有表面。

對於頻道擁有的執行輔助工具，內建 Plugin 應該將執行執行階段保留在自己的擴充模組內。核心不再於 `src/agents/tools` 下擁有 Discord、Slack、Telegram 或 WhatsApp 訊息動作執行階段。我們不會發布個別的 `plugin-sdk/*-action-runtime` 子路徑，內建 Plugin 應該直接從其擴充擁有的模組匯入自己的本機執行階段程式碼。

同樣的邊界也一般適用於以供應商命名的 SDK 接縫：核心不應匯入 Slack、Discord、Signal、WhatsApp 或類似擴充的頻道特定便利 barrel。如果核心需要某項行為，要嘛使用內建 Plugin 自己的 `api.ts` / `runtime-api.ts` barrel，要嘛將需求提升為共用 SDK 中狹窄的通用能力。

內建 Plugin 遵循相同規則。內建 Plugin 的 `runtime-api.ts` 不應重新匯出自己帶品牌的 `openclaw/plugin-sdk/<plugin-id>` facade。這些帶品牌的 facade 會保留為外部 Plugin 與舊版使用者的相容性 shim，但內建 Plugin 應使用本機匯出，以及狹窄的通用 SDK 子路徑，例如 `openclaw/plugin-sdk/channel-policy`、`openclaw/plugin-sdk/runtime-store` 或 `openclaw/plugin-sdk/webhook-ingress`。新程式碼不應新增 Plugin ID 特定的 SDK facade，除非既有外部生態系的相容性邊界需要它。

專就投票而言，有兩條執行路徑：

- `outbound.sendPoll` 是符合通用投票模型之頻道的共用基準
- `actions.handleAction("poll")` 是頻道特定投票語意或額外投票參數的偏好路徑

核心現在會等到 Plugin 投票分派拒絕該動作之後，才延後進行共用投票解析，因此 Plugin 擁有的投票處理器可以接受頻道特定投票欄位，而不會先被通用投票解析器阻擋。

完整啟動順序請參閱 [Plugin 架構內部](/zh-TW/plugins/architecture-internals)。

## 能力所有權模型

OpenClaw 將原生 Plugin 視為**公司**或**功能**的所有權邊界，而不是不相關整合的大雜燴。

這表示：

- 公司 Plugin 通常應該擁有該公司所有面向 OpenClaw 的表面
- 功能 Plugin 通常應該擁有它引入的完整功能表面
- 頻道應該使用共用核心能力，而不是臨時重新實作供應商行為

<AccordionGroup>
  <Accordion title="Vendor multi-capability">
    `openai` 擁有文字推理、語音、即時語音、媒體理解，以及影像生成。`google` 擁有文字推理，加上媒體理解、影像生成和網頁搜尋。`qwen` 擁有文字推理，加上媒體理解和影片生成。
  </Accordion>
  <Accordion title="Vendor single-capability">
    `elevenlabs` 與 `microsoft` 擁有語音；`firecrawl` 擁有網頁擷取；`minimax` / `mistral` / `moonshot` / `zai` 擁有媒體理解後端。
  </Accordion>
  <Accordion title="Feature plugin">
    `voice-call` 擁有通話傳輸、工具、CLI、路由，以及 Twilio 媒體串流橋接，但會使用共用語音、即時轉錄與即時語音能力，而不是直接匯入供應商 Plugin。
  </Accordion>
</AccordionGroup>

預期的最終狀態是：

- OpenAI 位於單一 Plugin 中，即使它橫跨文字模型、語音、影像和未來的影片
- 另一個供應商也可以為自己的表面區域做同樣的事
- 頻道不在乎哪個供應商 Plugin 擁有該供應商；它們使用核心公開的共用能力合約

這是關鍵差異：

- **Plugin** = 所有權邊界
- **能力** = 多個 Plugin 可以實作或使用的核心合約

因此，如果 OpenClaw 新增影片等新領域，第一個問題不是「哪個供應商應該硬編碼影片處理？」第一個問題是「核心影片能力合約是什麼？」一旦該合約存在，供應商 Plugin 就能針對它註冊，而頻道/功能 Plugin 則能使用它。

如果能力尚不存在，正確做法通常是：

<Steps>
  <Step title="Define the capability">
    在核心中定義缺少的能力。
  </Step>
  <Step title="Expose through the SDK">
    以型別化方式透過 Plugin API/執行階段公開它。
  </Step>
  <Step title="Wire consumers">
    將頻道/功能接到該能力。
  </Step>
  <Step title="Vendor implementations">
    讓供應商 Plugin 註冊實作。
  </Step>
</Steps>

這讓所有權保持明確，同時避免核心行為依賴單一供應商或一次性的 Plugin 特定程式碼路徑。

### 能力分層

決定程式碼歸屬時，請使用這個心智模型：

<Tabs>
  <Tab title="Core capability layer">
    共用的編排、政策、備援、設定合併規則、交付語意，以及型別化合約。
  </Tab>
  <Tab title="Vendor plugin layer">
    供應商特定 API、驗證、模型目錄、語音合成、影像生成、未來影片後端、用量端點。
  </Tab>
  <Tab title="Channel/feature plugin layer">
    Slack/Discord/voice-call/等等整合，使用核心能力並將其呈現在某個表面上。
  </Tab>
</Tabs>

例如，TTS 遵循這個形狀：

- 核心擁有回覆時 TTS 政策、備援順序、偏好設定，以及頻道交付
- `openai`、`elevenlabs` 和 `microsoft` 擁有合成實作
- `voice-call` 使用電話 TTS 執行階段輔助工具

未來能力也應優先採用相同模式。

### 多能力公司 Plugin 範例

公司 Plugin 從外部看起來應該要有內聚性。如果 OpenClaw 對模型、語音、即時轉錄、即時語音、媒體理解、影像生成、影片生成、網頁擷取和網頁搜尋都有共用合約，供應商就能在一個地方擁有其所有表面：

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

重要的不是確切的輔助工具名稱。重要的是形狀：

- 一個 Plugin 擁有供應商表面
- 核心仍然擁有能力合約
- 頻道和功能 Plugin 使用 `api.runtime.*` 輔助工具，而不是供應商程式碼
- 合約測試可以斷言該 Plugin 已註冊它宣稱擁有的能力

### 能力範例：影片理解

OpenClaw 已將影像/音訊/影片理解視為一項共用能力。相同的所有權模型也適用於此：

<Steps>
  <Step title="Core defines the contract">
    核心定義媒體理解合約。
  </Step>
  <Step title="Vendor plugins register">
    供應商 Plugin 視情況註冊 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="Consumers use the shared behavior">
    頻道和功能 Plugin 使用共用核心行為，而不是直接接到供應商程式碼。
  </Step>
</Steps>

這避免將某個供應商的影片假設烘焙進核心。Plugin 擁有供應商表面；核心擁有能力合約與備援行為。

影片生成已經使用相同順序：核心擁有型別化能力合約與執行階段輔助工具，而供應商 Plugin 會針對它註冊 `api.registerVideoGenerationProvider(...)` 實作。

需要具體的推出檢查清單嗎？請參閱 [能力 Cookbook](/zh-TW/plugins/architecture)。

## 合約與強制執行

Plugin API 表面刻意在 `OpenClawPluginApi` 中型別化並集中管理。該合約定義了支援的註冊點，以及 Plugin 可以依賴的執行階段輔助工具。

這很重要，原因如下：

- Plugin 作者取得一個穩定的內部標準
- 核心可以拒絕重複所有權，例如兩個 Plugin 註冊相同的供應商 ID
- 啟動可以針對格式錯誤的註冊顯示可行的診斷
- 合約測試可以強制執行內建 Plugin 所有權並防止無聲漂移

強制執行有兩層：

<AccordionGroup>
  <Accordion title="執行階段註冊強制執行">
    Plugin 登錄表會在 Plugin 載入時驗證註冊。範例：重複的 provider ID、重複的語音 provider ID，以及格式錯誤的註冊，都會產生 Plugin 診斷，而不是未定義行為。
  </Accordion>
  <Accordion title="契約測試">
    內建 Plugin 會在測試執行期間被擷取到契約登錄表中，讓 OpenClaw 可以明確斷言所有權。目前這用於模型 provider、語音 provider、網頁搜尋 provider，以及內建註冊所有權。
  </Accordion>
</AccordionGroup>

實際效果是 OpenClaw 會預先知道哪個 Plugin 擁有哪個介面。這讓核心與通道可以順暢組合，因為所有權是宣告式、具型別且可測試的，而不是隱含的。

### 契約中應包含的內容

<Tabs>
  <Tab title="良好契約">
    - 具型別
    - 小而精簡
    - 針對特定能力
    - 由核心擁有
    - 可由多個 Plugin 重複使用
    - 可由通道/功能使用，且不需要供應商知識

  </Tab>
  <Tab title="不良契約">
    - 隱藏在核心中的供應商特定政策
    - 繞過登錄表的一次性 Plugin 逃生通道
    - 通道程式碼直接存取供應商實作
    - 不屬於 `OpenClawPluginApi` 或 `api.runtime` 的臨時執行階段物件

  </Tab>
</Tabs>

不確定時，請提升抽象層級：先定義能力，再讓 Plugin 接入它。

## 執行模型

原生 OpenClaw Plugin 會與 Gateway **在同一行程中**執行。它們不會被沙箱化。已載入的原生 Plugin 具有與核心程式碼相同的行程層級信任邊界。

<Warning>
原生 Plugin 的影響：Plugin 可以註冊工具、網路處理常式、hook 和服務；Plugin 錯誤可能使 Gateway 當機或不穩定；惡意原生 Plugin 等同於在 OpenClaw 行程內執行任意程式碼。
</Warning>

相容套件預設更安全，因為 OpenClaw 目前會將它們視為中繼資料/內容包。在目前版本中，這大多表示內建 Skills。

對於非內建 Plugin，請使用允許清單與明確的安裝/載入路徑。將工作區 Plugin 視為開發期間程式碼，而非正式環境預設值。

對於內建工作區套件名稱，請讓 Plugin ID 錨定在 npm 名稱中：預設為 `@openclaw/<id>`，或在套件刻意公開較窄 Plugin 角色時，使用已核准的具型別尾碼，例如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任注意事項：** `plugins.allow` 信任的是 **Plugin ID**，不是來源出處。與內建 Plugin 具有相同 ID 的工作區 Plugin，在該工作區 Plugin 啟用/列入允許清單時，會刻意遮蔽內建副本。這是正常的，也有助於本機開發、修補測試和 hotfix。內建 Plugin 的信任會從來源快照解析，也就是載入時磁碟上的 manifest 與程式碼，而不是從安裝中繼資料解析。損毀或被替換的安裝記錄，無法在實際來源聲明之外，靜默擴大內建 Plugin 的信任介面。
</Note>

## 匯出邊界

OpenClaw 匯出能力，而不是實作便利性。

保持能力註冊為公開。修剪非契約輔助匯出：

- 內建 Plugin 專用輔助子路徑
- 不打算作為公開 API 的執行階段管線子路徑
- 供應商特定便利輔助工具
- 屬於實作細節的設定/入門輔助工具

保留的內建 Plugin 輔助子路徑已從產生的 SDK 匯出對應中退役。請將擁有者特定輔助工具保留在所屬 Plugin 套件內；只將可重複使用的主機行為提升為通用 SDK 契約，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

## 內部與參考

如需載入管線、登錄表模型、provider 執行階段 hook、Gateway HTTP 路由、訊息工具 schema、通道目標解析、provider 目錄、內容引擎 Plugin，以及新增能力指南，請參閱 [Plugin 架構內部](/zh-TW/plugins/architecture-internals)。

## 相關

- [建置 Plugin](/zh-TW/plugins/building-plugins)
- [Plugin manifest](/zh-TW/plugins/manifest)
- [Plugin SDK 設定](/zh-TW/plugins/sdk-setup)
