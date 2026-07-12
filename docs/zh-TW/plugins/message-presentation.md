---
read_when:
    - 新增或修改訊息卡片、圖表、表格、按鈕或選取項目的呈現方式
    - 建置支援豐富外送訊息的頻道外掛
    - 變更訊息工具的呈現或傳遞功能
    - 偵錯特定提供者的卡片／區塊／元件算繪迴歸問題
summary: 適用於頻道外掛的語意訊息卡片、圖表、表格、控制項、備用文字與傳遞提示
title: 訊息呈現
x-i18n:
    generated_at: "2026-07-12T14:41:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 400841f6fd1817350bffdfca15c7154bc98811fbe984056416d86d7fe990b5b5
    source_path: plugins/message-presentation.md
    workflow: 16
---

訊息呈現是 OpenClaw 用於豐富外送聊天介面的共用契約。
它讓代理程式、命令列介面命令、核准流程和外掛只需描述一次訊息
意圖，同時由每個頻道外掛盡可能呈現最佳的原生形式。

請使用呈現功能建構可攜式訊息介面：文字區段、小型內容／頁尾
文字、分隔線、圖表、表格、按鈕、選取選單，以及卡片標題／語氣。

請勿將 Discord `components`、Slack `blocks`、Telegram `buttons`、
Teams `card` 或 Feishu `card` 等新的供應商原生欄位加入共用
訊息工具。這些是由頻道外掛擁有的呈現器輸出。

## 契約

外掛作者可從以下位置匯入公開契約：

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

結構：

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] }
  | {
      type: "chart";
      chartType: "pie";
      title: string;
      segments: Array<{ label: string; value: number }>;
    }
  | {
      type: "chart";
      chartType: "bar" | "area" | "line";
      title: string;
      categories: string[];
      series: Array<{ name: string; values: number[] }>;
      xLabel?: string;
      yLabel?: string;
    }
  | {
      type: "table";
      caption: string;
      headers: string[];
      rows: Array<Array<string | number>>;
      rowHeaderColumnIndex?: number;
    };

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: "allow-once" | "allow-always" | "deny";
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** 舊版回呼值。新控制項請優先使用 action。 */
  value?: string;
  /** @deprecated 請使用 type 為 "url" 的 action。 */
  url?: string;
  /** @deprecated 請使用 type 為 "web-app" 的 action。 */
  webApp?: { url: string };
  /** @deprecated 請使用 type 為 "web-app" 的 action。 */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: Extract<MessagePresentationAction, { type: "command" | "callback" }>;
  /** 舊版回呼值。新控制項請優先使用 action。 */
  value?: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

按鈕語意：

- `action.type: "command"` 會透過核心的命令路徑執行原生斜線命令。
  內建命令按鈕和選單應使用此類型。
- `action.type: "callback"` 會透過頻道的互動路徑傳遞不透明的外掛資料。
  頻道外掛不得將回呼資料重新解讀為斜線命令。
- `action.type: "approval"` 會識別一項持久的操作員核准、其明確的
  `exec` 或 `plugin` 類型，以及要求的決定。頻道外掛會將該動作編碼成
  傳輸層私有的回呼，並透過核准服務加以解析；不得剖析 `/approve`
  命令文字，也不得從 ID 推斷類型。
- `action.type: "url"` 會開啟一般連結。
- `action.type: "web-app"` 會啟動頻道原生網頁應用程式。
- `value` 是舊版的不透明回呼值。新控制項應使用 `action`，
  讓頻道外掛不必從文字猜測，即可對應命令與回呼。
- `url`、`webApp` 和 `web_app` 仍可作為已棄用的邊界輸入。
  正規化器會保留這些欄位，讓呈現器能區分已發布的舊版
  語意與明確的型別化動作。新的產生端應使用 `action`。
- `label` 為必填，也會用於文字後援。
- `style` 僅供建議。呈現器應將不支援的樣式對應至安全的
  預設值，而非讓傳送失敗。
- `priority` 為選填。當頻道宣告動作限制且必須捨棄部分控制項時，
  核心會優先保留優先級較高的按鈕，並維持相同優先級按鈕之間的
  原始順序。當所有控制項都容納得下時，會保留作者設定的順序。
- `disabled` 為選填。頻道必須透過 `supportsDisabled` 明確啟用支援；
  否則核心會將停用的控制項降級為非互動式後援文字。即使停用按鈕
  帶有 `command` 動作，在後援文字中也一律只呈現標籤。
- `reusable` 為選填。支援可重複使用原生回呼的頻道，可以在互動
  成功後繼續提供該動作。它適用於重新整理、檢查或查看更多詳細資料等
  可重複或具冪等性的動作；一般的一次性核准與破壞性動作請不要設定。

選取語意：

- `options[].action` 只接受 `command` 或 `callback`；核准與連結動作僅限按鈕使用。
- `options[].value` 是舊版的已選應用程式值。
- `placeholder` 僅供建議，不支援原生選取功能的頻道可能會忽略它。
- 如果頻道不支援選取，後援文字會列出標籤。

圖表語意：

- `pie` 要求區段值必須為正數。
- `bar`、`area` 和 `line` 使用一個有序的 `categories` 陣列。每個數列
  都必須依相同順序，為每個類別提供恰好一個有限值。
- 類別標籤和數列名稱必須唯一。無效或不完整的圖表
  區塊會在正規化期間被捨棄，而不會靜默變更資料。
- 原生圖表呈現須透過 `presentationCapabilities.charts` 明確啟用。
  其他頻道會以具決定性的文字接收圖表標題、座標軸、類別、數列和值。
  這也是無障礙後援。

表格語意：

- `caption` 是必填的簡短標題。`headers` 必須包含至少一個
  唯一且非空白的欄標籤。
- `rows` 必須包含至少一列。每列必須恰好對每個
  標頭提供一個儲存格，且每個儲存格都必須是非空白字串或有限數字。
- `rowHeaderColumnIndex` 是選填的零起始索引，用於識別其儲存格
  應由原生呈現器公開為列標頭的欄。
- 表格正規化具有不可分割性。無效的標題、標頭、列寬、儲存格
  或列標頭索引會導致整個表格區塊被捨棄，而非截斷或修復
  其資料。
- 原生表格呈現須透過 `presentationCapabilities.tables` 明確啟用。
  其他頻道會以具決定性的線性文字接收標題和每一列，
  並摺疊內部空白：

  ```text
  進行中的銷售管線（表格）
  - 客戶：Acme；階段：已成交；ARR：125000
  - 客戶：Globex；階段：審查中；ARR：82000
  ```

沒有獨立的 `report` 判別欄位。請使用 `title`、`tone`、`text`、
`context`、`chart`、`table` 和動作區塊組成報告。這可讓每個
區塊獨立呈現，並讓完整報告具備相同的具決定性文字後援。

## 產生端範例

簡易卡片：

```json
{
  "title": "部署核准",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary 已可提升。" },
    { "type": "context", "text": "建置版本 1234，預備環境已通過。" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "核准",
          "action": { "type": "callback", "value": "deploy:approve" },
          "style": "success"
        },
        {
          "label": "拒絕",
          "action": { "type": "callback", "value": "deploy:decline" },
          "style": "danger"
        }
      ]
    }
  ]
}
```

僅含 URL 的連結按鈕：

```json
{
  "blocks": [
    { "type": "text", "text": "版本資訊已準備就緒。" },
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "開啟版本資訊",
          "action": { "type": "url", "url": "https://example.com/release" }
        }
      ]
    }
  ]
}
```

Telegram Mini App 按鈕：

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [
        {
          "label": "啟動",
          "action": { "type": "web-app", "url": "https://example.com/app" }
        }
      ]
    }
  ]
}
```

選取選單：

```json
{
  "title": "選擇環境",
  "blocks": [
    {
      "type": "select",
      "placeholder": "環境",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "正式環境", "value": "env:prod" }
      ]
    }
  ]
}
```

圖表：

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "line",
      "title": "季度營收",
      "categories": ["第 1 季", "第 2 季", "第 3 季"],
      "series": [
        { "name": "產品", "values": [120, 145, 138] },
        { "name": "服務", "values": [80, 95, 104] }
      ],
      "xLabel": "季度",
      "yLabel": "營收"
    }
  ]
}
```

表格報告：

```json
{
  "title": "銷售管線報告",
  "tone": "info",
  "blocks": [
    { "type": "text", "text": "依階段顯示目前的商機。" },
    {
      "type": "table",
      "caption": "進行中的銷售管線",
      "headers": ["客戶", "階段", "ARR"],
      "rows": [
        ["Acme", "已成交", 125000],
        ["Globex", "審查中", 82000]
      ],
      "rowHeaderColumnIndex": 0
    },
    { "type": "context", "text": "已從 CRM 快照更新。" }
  ]
}
```

命令列介面傳送：

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "部署核准" \
  --presentation '{"title":"部署核准","tone":"warning","blocks":[{"type":"text","text":"Canary 已準備就緒。"},{"type":"buttons","buttons":[{"label":"核准","value":"deploy:approve","style":"success"},{"label":"拒絕","value":"deploy:decline","style":"danger"}]}]}'
```

釘選傳遞：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "主題已開啟" \
  --pin
```

使用明確 JSON 的釘選傳遞：

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 呈現器契約

頻道外掛會在其外送介面卡上宣告呈現支援：

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    charts: false,
    tables: false,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

能力布林值描述呈現器可將哪些項目設為可互動。選填的
`limits` 描述核心在呼叫呈現器前可調整的通用範圍：

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  charts?: boolean;
  tables?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

核心會在算繪前，先將通用限制套用至語意控制項。算繪器仍負責最終的供應商專屬驗證與截斷，以處理原生區塊數量、卡片大小、URL 限制，以及無法透過通用合約表達的供應商特殊行為。如果限制移除了某個區塊中的所有控制項，核心會將標籤保留為非互動式情境文字，讓傳送的訊息仍有可見的備援內容。

## 核心算繪流程

在命令列介面與標準訊息動作所使用的標準輸出路徑上，核心會：

1. 正規化呈現酬載。
2. 解析目標頻道的輸出配接器。
3. 讀取 `presentationCapabilities`。
4. 當配接器宣告相關限制時，套用動作數量、標籤長度和選取選項數量等通用能力限制。除非配接器分別明確宣告 `charts: true` 或 `tables: true`，否則圖表和表格區塊會轉換為具確定性的文字。
5. 當配接器能夠算繪酬載時，呼叫 `renderPresentation`。
6. 當配接器不存在或無法算繪時，改用保守的文字備援。
7. 透過一般頻道傳遞路徑傳送產生的酬載。
8. 在第一則訊息成功傳送後，套用 `delivery.pin` 等傳遞中繼資料。

直接使用 `ReplyPayload` 的頻道本機回覆或預覽匯流流程，必須進入該標準路徑，或在將酬載投影為純文字／媒體前，具體產生相同的呈現備援。

核心負責備援行為，讓產生器可維持與頻道無關。頻道外掛負責原生算繪與互動處理。

## 降級規則

呈現內容必須能安全地傳送至能力受限的頻道。

備援文字包括：

- 第一行為 `title`
- `text` 區塊顯示為一般段落
- `context` 區塊顯示為精簡的情境資訊行
- `divider` 區塊顯示為視覺分隔線
- 按鈕標籤，包括連結按鈕的 URL
- 選取選項標籤
- 圖表標題、類型、座標軸、類別、資料系列和值
- 表格標題、欄位標題及每列的所有值

### 按鈕值的備援顯示情況

當某個頻道無法呈現互動式控制項時，按鈕和選取值會改以純文字顯示。此備援行為可在維持可用性的同時，確保不透明的回呼資料不會外洩：

- **`command` 類型的動作**會呈現為 `label: \`command\`` so users can
  copy the command and run it manually in the channel input.
- **`callback`-typed actions** and legacy **`value`** fields render as
  label-only. The opaque callback value is not exposed in fallback text.
- **`approval`-typed actions** render label-only. Approval IDs and decisions are
  transport data and are not exposed through generic scalar helpers or fallback
  text.
- **`url` / `web-app` actions** and deprecated **`url` / `webApp` / `web_app`**
  輸入會將 URL 文字與按鈕標籤一併呈現，因為 URL 會顯示給
  使用者。
- **選取選項**僅呈現標籤。底層的選項值不會
  顯示在後援文字中。

在其後備 UI 中加入手動命令指引的頻道配接器（例如 Feishu 文件留言指示），必須從後備轉譯器所使用的相同呈現區塊推導是否存在命令的檢查結果，確保只有在實際顯示手動命令時，才會顯示指引文字。

不支援的原生控制項應以降級方式處理，而不是導致整個傳送失敗。
範例：

- 停用內嵌按鈕的 Telegram 會傳送文字備援內容。
- 不支援選取功能的頻道會將選項以文字列出。
- 不支援原生圖表的頻道會將圖表資料以文字列出。
- 不支援原生表格的頻道會將每個表格列以文字列出。
- 僅含 URL 的按鈕會轉換為原生連結按鈕或備援 URL 文字行。
- 選用的置頂操作失敗不會導致已傳遞的訊息失敗。

主要例外是 `delivery.pin.required: true`；如果要求將置頂設為
必要操作，而頻道無法將已傳送的訊息置頂，傳遞會回報失敗。

## 提供者對應

目前隨附的轉譯器：

| 頻道            | 原生算繪目標                              | 備註                                                                                                                                                                                                                                      |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 元件與元件容器                            | 為現有的提供者原生承載內容產生器保留舊版 `channelData.discord.components`，但新的共用傳送應使用 `presentation`。                                                                                                                            |
| Feishu          | 互動式卡片                                | 卡片標頭可使用 `title`；內文會避免重複該標題。                                                                                                                                                                                           |
| Matrix          | 文字後援加上結構化事件欄位                | 按鈕／選取項目會宣告為支援，但目前每個區塊都會算繪為 `renderMessagePresentationFallbackText` 輸出，並承載於 `com.openclaw.presentation` 事件欄位中，而非原生互動式小工具。                                                                    |
| Mattermost      | 文字加上互動式屬性                        | 不支援選取項目與分隔線；這些區塊會降級為文字。                                                                                                                                                                                            |
| Microsoft Teams | Adaptive Cards                            | 同時提供卡片與純 `message` 文字時，卡片會包含該文字。不支援選取項目、樣式與停用狀態。                                                                                                                                                     |
| Slack           | Block Kit                                 | 將 `chart` 算繪為原生 `data_visualization`，並將 `table` 算繪為原生 `data_table`；保留舊版 `channelData.slack.blocks`，但新的共用傳送應使用 `presentation`。                                                                                 |
| Telegram        | 文字加上行內鍵盤                          | 按鈕／選取項目要求目標介面具備行內按鈕功能；否則會使用文字後援。                                                                                                                                                                         |
| 純文字頻道      | 文字後援                                  | 沒有算繪器的頻道仍會取得可讀的輸出。                                                                                                                                                                                                      |

提供者原生承載內容相容性是為現有回覆產生器提供的過渡機制。
不應以此為由新增共用的原生欄位。

## Presentation 與 InteractiveReply 的比較

`InteractiveReply` 是核准與互動輔助程式所使用的較舊內部子集。
它支援：

- 文字
- 按鈕
- 選取項目

`MessagePresentation` 是標準的共用傳送合約。它新增：

- 標題
- 語氣
- 情境資訊
- 分隔線
- 圖表
- 表格
- 僅含 URL 的按鈕
- 透過 `ReplyPayload.delivery` 提供通用的遞送中繼資料

銜接舊版程式碼時，請使用 `openclaw/plugin-sdk/interactive-runtime` 中的輔助函式：
__OC_I18N_900014__
新程式碼應直接接受或產生 `MessagePresentation`。現有的
`interactive` 承載內容是 `presentation` 的已棄用子集；執行階段
仍支援較舊的產生器。

值得瞭解的未棄用輔助函式：

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  會驗證未具型別的承載內容並進行強制轉換（例如來自命令列介面
  `--presentation` 旗標的 JSON），使其成為 `MessagePresentation`。
- `isMessagePresentationInteractiveBlock(block)` 會將區塊縮限為
  `buttons` | `select` 聯集。
- `resolveMessagePresentationButtonAction(button)` 和
  `resolveMessagePresentationOptionAction(option)` 會傳回標準的具型別
  動作，同時接受已棄用的邊界欄位。明確的 `action`
  一律優先。
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` 只會讀取命令／回呼
  純量值。非純量的標準動作絕不會轉而使用舊版影子 `value`，
  因此核准 ID 與連結目標會維持具型別狀態。
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` 會將單一結構化
  資料區塊算繪為確定性的文字，供頻道特定的後援路徑使用。

舊版 `InteractiveReply*` 型別與轉換輔助函式在 SDK 中已標示為
`@deprecated`：

- `InteractiveReply`、`InteractiveReplyBlock`、`InteractiveReplyButton`、
  `InteractiveReplyOption`、`InteractiveReplySelectBlock` 和
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` 和
`presentationToInteractiveControlsReply(...)` 仍可作為舊版頻道實作的算繪器
橋接層使用。新的產生器程式碼不應呼叫它們；請傳送 `presentation`，並讓核心／頻道
調整機制處理算繪。

核准輔助函式也有以 Presentation 優先的替代項目：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)`，而不是
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)`，而不是
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)`，而不是
  `buildExecApprovalInteractiveReply(...)`

為了維持外掛相容性，這些已發布的建構器仍由命令支援。擁有持久核准種類的閘道
與隨附頻道程式碼應使用
`buildTypedApprovalPresentation(...)`、
`buildTypedExecApprovalPendingReplyPayload(...)` 或
`buildTypedPluginApprovalPendingReplyPayload(...)`，如此傳輸層會收到明確的
`approval` 動作，而不必從 `/approve` 文字推斷語意。

對於沒有文字後援的 Presentation 區塊，例如僅含分隔線的
Presentation，`renderMessagePresentationFallbackText(...)` 會傳回空字串。
要求傳送內文不可為空的傳輸層可以傳入
`emptyFallback`，選擇使用最精簡的內文，而不變更預設的後援
合約。

## 遞送固定目標

釘選屬於傳遞行為，而非呈現。請使用 `delivery.pin`，不要使用
`channelData.telegram.pin` 等供應商原生欄位。

語意：

- `pin: true` 會釘選第一則成功傳遞的訊息。
- `pin.notify` 預設為 `false`。
- `pin.required` 預設為 `false`。
- 選用的釘選失敗時會降級處理，並保留已傳送的訊息。
- 必要的釘選失敗時，傳遞會失敗。
- 分塊訊息會釘選第一個已傳遞的區塊，而非最後一個區塊。

對於既有訊息，只要供應商支援這些操作，手動 `pin`、`unpin` 和 `pins`
訊息動作仍然可用。

## 外掛作者檢查清單

- 當頻道能夠呈現語意化呈現，或可安全降級時，請宣告來自
  `describeMessageTool(...)` 的 `presentation`。
- 將 `presentationCapabilities` 新增至執行階段的輸出配接器。
- 在執行階段程式碼中實作 `renderPresentation`，而非在控制平面的外掛
  設定程式碼中實作。
- 請勿將原生 UI 程式庫放入高頻的設定／目錄路徑。
- 如果已知通用能力限制，請在 `presentationCapabilities.limits` 上宣告。
- 在轉譯器和測試中保留最終的平台限制。
- 為不支援的圖表、表格、按鈕、選取器、URL
  按鈕、標題／文字重複，以及混合 `message` 與 `presentation`
  傳送新增後備測試。
- 僅當供應商能夠釘選已傳送的訊息 ID 時，才透過 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 新增傳遞釘選支援。
- 請勿透過共用訊息動作結構描述公開新的供應商原生卡片／區塊／元件／按鈕
  欄位。

## 相關文件

- [訊息命令列介面](/zh-TW/cli/message)
- [外掛 SDK 概觀](/zh-TW/plugins/sdk-overview)
- [外掛架構](/zh-TW/plugins/architecture-internals#message-tool-schemas)
- [頻道呈現重構計畫](/zh-TW/plan/ui-channels)
