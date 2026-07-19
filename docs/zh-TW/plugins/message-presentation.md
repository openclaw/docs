---
read_when:
    - 新增或修改訊息卡片、圖表、表格、按鈕或選取元件的呈現方式
    - 建置支援豐富外送訊息的頻道外掛
    - 變更訊息工具的呈現方式或傳遞功能
    - 偵錯特定提供者的卡片／區塊／元件轉譯迴歸問題
summary: 適用於頻道外掛的語意訊息卡片、圖表、表格、控制項、備援文字與傳遞提示
title: 訊息呈現
x-i18n:
    generated_at: "2026-07-19T13:53:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0b56ed47ce837e865aa7ac218f02f4d5523b3b71ae22dd0074f2aab00aeecb7a
    source_path: plugins/message-presentation.md
    workflow: 16
---

訊息呈現是 OpenClaw 用於豐富外送聊天 UI 的共用合約。
它讓代理程式、命令列介面命令、核准流程和外掛只需描述一次訊息
意圖，而每個頻道外掛都能以其可支援的最佳原生形式呈現。

請使用呈現功能實作可攜式訊息 UI：文字區段、小型情境資訊／頁尾
文字、分隔線、圖表、表格、按鈕、選取選單，以及卡片標題／語氣。

請勿將 Discord `components`、Slack
`blocks`、Telegram `buttons`、Teams `card` 或 Feishu `card` 等新的供應商原生欄位加入共用
訊息工具。這些是由頻道外掛所擁有的呈現器輸出。

## 合約

外掛作者可從以下位置匯入公開合約：

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
  | {
      type: "question";
      questionId: string;
      optionValue: string;
    }
  | { type: "url"; url: string }
  | {
      type: "web-app";
      url: string;
      widgetId?: string;
    }
  | {
      type: "web-app";
      url?: string;
      widgetId: string;
    };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** 舊版回呼值。新控制項應優先使用 action。 */
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
  /** 舊版回呼值。新控制項應優先使用 action。 */
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

- `action.type: "command"` 會透過核心的命令
  路徑執行原生斜線命令。請將此用於內建命令按鈕和選單。
- `action.type: "callback"` 會透過頻道的
  互動路徑傳遞不透明的外掛資料。頻道外掛不得將回呼資料重新解讀為斜線
  命令。
- `action.type: "approval"` 用於識別一項持久的操作員核准、其
  明確的 `exec` 或 `plugin` 類型，以及要求的決定。頻道外掛會
  將該動作編碼為傳輸層私有回呼，並透過
  核准服務解析；不得剖析 `/approve` 命令文字，也不得根據 ID 推斷
  類型。
- `action.type: "question"` 用於識別即時、由執行階段建立之
  `ask_user` 問題的一個選項。與 `approval` 相同，這是 OpenClaw 執行階段動作；
  代理程式和外掛不得自行產生問題 ID。Telegram、Discord 和
  Slack 會將其對應至傳輸層私有的原生回呼，並透過
  閘道解析選項。當問題變為已回答、已過期或
  已取消時，這些頻道會編輯已送達的訊息、移除其動作，
  並附加最終狀態。WhatsApp、Signal 和 iMessage 會將最多
  四個單選選項呈現為 `1️⃣` 至 `4️⃣` 表情回應。其他問題
  形式會降級為標籤文字，而使用者可透過純文字
  回覆作答。
- `action.type: "url"` 會開啟一般連結。
- `action.type: "web-app"` 會啟動頻道原生網頁應用程式。請為
  URL 支援的應用程式設定 `url`，或為由頻道擁有其啟動
  機制的 OpenClaw 託管小工具設定 `widgetId`；至少必須提供其中一項。若兩者皆
  存在，頻道可以優先使用其原生託管小工具啟動方式，並在該機制
  不可用時使用 URL。
- `value` 是舊版不透明回呼值。新的控制項應使用 `action`，
  讓頻道外掛無須從文字猜測即可對應命令和回呼。
- `url`、`webApp` 和 `web_app` 仍作為已棄用的邊界輸入接受。
  正規化器會保留這些欄位，讓呈現器能區分已發布的舊版
  語意與明確的具型別動作。新的產生端應使用 `action`。
- `label` 為必填，並且也會用於文字備援。
- `style` 僅供參考。呈現器應將不支援的樣式對應至安全的
  預設值，而不是讓傳送失敗。
- `priority` 為選填。當頻道公布動作數量限制且必須捨棄
  控制項時，核心會優先保留優先順序較高的按鈕，並在優先順序相同的
  按鈕之間維持原始順序。當所有控制項都能容納時，會保留作者指定的
  順序。
- `disabled` 為選填。頻道必須透過 `supportsDisabled` 明確選用；否則
  核心會將停用的控制項降級為非互動式備援文字。
  即使停用的按鈕帶有 `command` 動作，在備援文字中也一律只呈現標籤。
- `reusable` 為選填。支援可重複使用之原生回呼的頻道，可以在
  成功互動後繼續提供該動作。請將其用於重新整理、檢查或更多詳細資料等
  可重複或具冪等性的動作；一般的一次性核准和破壞性動作則不要
  設定此值。

選取語意：

- `options[].action` 僅接受 `command` 或 `callback`；核准和連結動作僅適用於按鈕。
- `options[].value` 是舊版所選取的應用程式值。
- `placeholder` 僅供參考，不具原生
  選取支援的頻道可以忽略。
- 如果頻道不支援選取控制項，備援文字會列出標籤。

圖表語意：

- `pie` 要求區段值必須為正數。
- `bar`、`area` 和 `line` 使用一個有序的 `categories` 陣列。每個數列
  都必須依相同順序為每個類別提供恰好一個有限值。
- 類別標籤和數列名稱必須是唯一的。無效或不完整的圖表
  區塊會在正規化期間被捨棄，而不會默默變更資料。
- 原生圖表呈現必須透過 `presentationCapabilities.charts` 明確選用。
  其他頻道會以確定性的文字接收圖表標題、座標軸、類別、數列和值。
  這同時也是無障礙備援。

表格語意：

- `caption` 是必填的簡短標題。`headers` 必須包含至少一個
  唯一且非空白的欄標籤。
- `rows` 必須包含至少一列。每列必須為每個
  表頭恰好提供一個儲存格，且每個儲存格必須是非空白字串或有限數字。
- `rowHeaderColumnIndex` 是選填的零起算索引，用於識別原生呈現器
  應將其儲存格公開為列標頭的欄。
- 表格正規化具原子性。無效的說明文字、表頭、列寬、儲存格
  或列標頭索引會導致表格區塊被捨棄，而不是截斷或修復
  其資料。
- 原生表格呈現必須透過 `presentationCapabilities.tables` 明確選用。
  其他頻道會以確定性的線性文字接收說明文字及每一列，
  並折疊內部空白：

  ```text
  開放中的銷售管線（表格）
  - 客戶：Acme；階段：已成交；ARR：125000
  - 客戶：Globex；階段：審查中；ARR：82000
  ```

沒有獨立的 `report` 判別欄位。請使用 `title`、
`tone`、`text`、`context`、`chart`、`table` 和動作區塊組成報告。這能讓每個
區塊都可獨立呈現，並讓完整報告使用相同的
確定性文字備援。

## 產生端範例

簡易卡片：

```json
{
  "title": "部署核准",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "金絲雀版本已準備好升級。" },
    { "type": "context", "text": "組建 1234，預備環境已通過。" },
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
    { "type": "text", "text": "版本資訊已準備完成。" },
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
        { "label": "金絲雀", "value": "env:canary" },
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
    { "type": "text", "text": "依階段列出的目前商機。" },
    {
      "type": "table",
      "caption": "開放中的銷售管線",
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
  --presentation '{"title":"部署核准","tone":"warning","blocks":[{"type":"text","text":"金絲雀版本已準備完成。"},{"type":"buttons","buttons":[{"label":"核准","value":"deploy:approve","style":"success"},{"label":"拒絕","value":"deploy:decline","style":"danger"}]}]}'
```

釘選傳送：

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "已開啟主題" \
  --pin
```

使用明確 JSON 的釘選傳送：

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## 轉譯器合約

頻道外掛會在其出站轉接器上宣告轉譯支援：

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

能力布林值描述轉譯器能讓哪些項目具備互動性。選用的
`limits` 描述核心可在呼叫轉譯器前調整的通用封裝：

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

核心會在轉譯前，將通用限制套用至語意控制項。對於原生區塊
數量、卡片大小、URL 限制，以及無法用通用合約表達的供應商特殊行為，
最終的供應商特定驗證與裁切仍由轉譯器負責。如果限制移除了某個區塊
中的所有控制項，核心會將標籤保留為非互動式情境文字，讓傳送的訊息
仍有可見的後援內容。

## 核心轉譯流程

在命令列介面和標準訊息動作使用的標準出站路徑上，核心會：

1. 正規化呈現承載資料。
2. 解析目標頻道的出站轉接器。
3. 讀取 `presentationCapabilities`。
4. 當轉接器宣告相關限制時，套用動作數量、標籤長度和
   選取選項數量等通用能力限制。除非轉接器分別明確宣告
   `charts: true` 或 `tables: true`，否則圖表與表格區塊會
   轉換為具確定性的文字。
5. 當轉接器能轉譯承載資料時，呼叫 `renderPresentation`。
6. 當轉接器不存在或無法轉譯時，後援為保守的文字。
7. 透過一般頻道傳送路徑傳送產生的承載資料。
8. 在第一則訊息成功送出後，套用 `delivery.pin` 等傳送中繼資料。

直接使用 `ReplyPayload` 的頻道本機回覆或預覽漏斗，
必須進入該標準路徑，或在將承載資料投影為純文字／媒體前，
具體化相同的呈現後援內容。

核心負責後援行為，讓產生者能維持與頻道無關。頻道
外掛則負責原生轉譯和互動處理。

## 降級規則

呈現內容必須能安全地傳送至功能受限的頻道。

後援文字包括：

- 第一行使用 `title`
- 將 `text` 區塊呈現為一般段落
- 將 `context` 區塊呈現為精簡的情境行
- 將 `divider` 區塊呈現為視覺分隔線
- 按鈕標籤，包括連結按鈕的 URL
- 選取選項標籤
- 圖表標題、類型、座標軸、類別、數列和值
- 表格標題、欄首及每列的值

### 按鈕值的後援可見性

當頻道無法轉譯互動式控制項時，按鈕值和選取值會後援為純文字。
後援行為會維持可用性，同時讓不透明的回呼資料保持私密：

- **`command` 類型的動作**會轉譯為 `` label: `command` ``，讓使用者可以
  複製命令，並在頻道輸入欄中手動執行。
- **`callback` 類型的動作**和舊版 **`value`** 欄位僅轉譯
  標籤。不透明的回呼值不會顯示在後援文字中。
- **`approval` 類型的動作**僅轉譯標籤。核准 ID 和決策屬於
  傳輸資料，不會透過通用純量輔助函式或後援文字顯示。
- **`url` 動作**、由 URL 支援的 **`web-app` 動作**，以及已棄用的 **`url` /
  `webApp` / `web_app`** 輸入，會在按鈕標籤旁轉譯 URL 文字，
  因為 URL 對使用者可見。僅限託管小工具的動作，在沒有原生小工具啟動功能的頻道上僅轉譯標籤。
- **選取選項**僅轉譯標籤。底層選項值不會顯示在後援文字中。

在其後援 UI 中加入手動命令指引的頻道轉接器（例如
Feishu 文件註解指示），必須從後援轉譯器使用的相同呈現區塊
推導命令存在檢查，讓指引文字只在實際顯示手動命令時出現。

不受支援的原生控制項應降級，而不是讓整個傳送失敗。
例如：

- 停用行內按鈕的 Telegram 會傳送文字後援內容。
- 不支援選取功能的頻道會以文字列出選取選項。
- 不支援原生圖表的頻道會以文字列出圖表資料。
- 不支援原生表格的頻道會以文字列出每一個表格資料列。
- 僅含 URL 的按鈕會變成原生連結按鈕或後援 URL 行。
- 選用的釘選失敗不會導致已傳送的訊息失敗。

主要例外是 `delivery.pin.required: true`；如果要求將釘選設為
必要，但頻道無法釘選已傳送的訊息，傳送會回報失敗。

## 供應商對應

目前內建的轉譯器：

| 頻道            | 原生轉譯目標                              | 備註                                                                                                                                                                                                              |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | 元件和元件容器                            | 為現有的供應商原生承載資料產生者保留舊版 `channelData.discord.components`，但新的共用傳送應使用 `presentation`。                                                                                                              |
| Feishu          | 互動式卡片                                | 卡片標頭可使用 `title`；內文會避免重複該標題。                                                                                                                                                         |
| Matrix          | 文字後援加結構化事件欄位                  | 按鈕／選取功能會宣告為受支援，但目前每個區塊都會轉譯為 `renderMessagePresentationFallbackText` 輸出並承載於 `com.openclaw.presentation` 事件欄位中，而非原生互動式小工具。                                                                          |
| Mattermost      | 文字加互動式屬性                          | 不支援選取功能和分隔線；這些區塊會降級為文字。                                                                                                                                                                    |
| Microsoft Teams | Adaptive Cards                            | 同時提供兩者時，卡片會包含純 `message` 文字。不支援選取功能、樣式和停用狀態。                                                                                                                            |
| Slack           | Block Kit                                 | 將 `chart` 轉譯為原生 `data_visualization`，並將 `table` 轉譯為原生 `data_table`；保留舊版 `channelData.slack.blocks`，但新的共用傳送應使用 `presentation`。                                   |
| Telegram        | 文字加行內鍵盤                            | 按鈕／選取功能需要目標介面具備行內按鈕能力；否則會使用文字後援。                                                                                                                                                    |
| 純文字頻道      | 文字後援                                  | 沒有轉譯器的頻道仍會獲得可讀的輸出。                                                                                                                                                                              |

供應商原生承載資料相容性，是為現有回覆產生者提供的過渡便利措施。
這並不是新增共用原生欄位的理由。

## 呈現與 InteractiveReply

`InteractiveReply` 是核准和互動輔助函式使用的較舊內部子集。
它支援：

- 文字
- 按鈕
- 選取功能

`MessagePresentation` 是標準的共用傳送合約。它新增：

- 標題
- 語氣
- 情境
- 分隔線
- 圖表
- 表格
- 僅含 URL 的按鈕
- 透過 `ReplyPayload.delivery` 提供的通用傳送中繼資料

銜接較舊的程式碼時，請使用 `openclaw/plugin-sdk/interactive-runtime` 中的輔助函式：

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  hasMessagePresentationBlocks,
  interactiveReplyToPresentation,
  isMessagePresentationInteractiveBlock,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationChartFallbackText,
  renderMessagePresentationFallbackText,
  renderMessagePresentationTableFallbackText,
  resolveMessagePresentationActionValue,
  resolveMessagePresentationButtonAction,
  resolveMessagePresentationControlValue,
  resolveMessagePresentationOptionAction,
} from "openclaw/plugin-sdk/interactive-runtime";
```

新的程式碼應直接接受或產生 `MessagePresentation`。現有的
`interactive` 承載資料是 `presentation` 的已棄用子集；執行階段
仍支援較舊的產生者。

值得瞭解的非棄用輔助函式：

- `normalizeMessagePresentation(raw)` / `hasMessagePresentationBlocks(value)`
  驗證未指定型別的承載資料並進行型別轉換（例如來自命令列介面
  `--presentation` 旗標的 JSON），使其成為 `MessagePresentation`。
- `isMessagePresentationInteractiveBlock(block)` 將區塊的型別縮小為
  `buttons` | `select` 聯集型別。
- `resolveMessagePresentationButtonAction(button)` 和
  `resolveMessagePresentationOptionAction(option)` 會傳回標準的具型別動作，
  同時接受已棄用的邊界欄位。明確指定的 `action`
  一律優先。
- `resolveMessagePresentationActionValue(action)` /
  `resolveMessagePresentationControlValue(control)` 僅讀取命令／回呼的
  純量值。非純量的標準動作絕不會轉而使用舊版影子
  `value`，因此核准 ID 和連結目標會維持具型別狀態。
- `renderMessagePresentationChartFallbackText(block)` /
  `renderMessagePresentationTableFallbackText(block)` 會將單一結構化
  資料區塊轉譯為確定性的文字，供頻道專屬的備援路徑使用。

舊版 `InteractiveReply*` 型別和轉換輔助函式在 SDK 中已標記為
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
`presentationToInteractiveControlsReply(...)` 仍可作為舊版頻道實作的
轉譯器橋接使用。新的產生端程式碼不應呼叫它們；請傳送 `presentation`，並由核心／頻道調適處理轉譯。

核准輔助函式也有以呈現為優先的替代方案：

- 使用 `buildApprovalPresentationFromActionDescriptors(...)`，而非
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- 使用 `buildApprovalPresentation(...)`，而非
  `buildApprovalInteractiveReply(...)`
- 使用 `buildExecApprovalPresentation(...)`，而非
  `buildExecApprovalInteractiveReply(...)`

為了維持外掛相容性，這些已發布的建構器仍以命令為基礎。擁有持久核准種類的閘道
和內建頻道程式碼應使用
`buildTypedApprovalPresentation(...)`、
`buildTypedExecApprovalPendingReplyPayload(...)` 或
`buildTypedPluginApprovalPendingReplyPayload(...)`，讓傳輸層接收明確的
`approval` 動作，而非從 `/approve` 文字推斷語意。

對於沒有文字備援的呈現區塊（例如僅含分隔線的
呈現），`renderMessagePresentationFallbackText(...)` 會傳回空字串。
需要非空白傳送本文的傳輸層可傳入
`emptyFallback`，選擇使用最小本文，而不變更預設備援
契約。

## 傳遞釘選

釘選屬於傳遞行為，而非呈現。請使用 `delivery.pin`，而非
`channelData.telegram.pin` 等供應商原生欄位。

語意：

- `pin: true` 會釘選第一則成功傳遞的訊息。
- `pin.notify` 預設為 `false`。
- `pin.required` 預設為 `false`。
- 選用的釘選失敗會降級處理，並保留已傳送的訊息。
- 必要的釘選失敗會導致傳遞失敗。
- 分段訊息會釘選第一個已傳遞的區塊，而非末尾區塊。

對於供應商支援這些操作的現有
訊息，手動 `pin`、`unpin` 和 `pins` 訊息動作仍然存在。

## 外掛作者檢查清單

- 當頻道可轉譯語意呈現或安全降級時，從 `describeMessageTool(...)`
  宣告 `presentation`。
- 將 `presentationCapabilities` 新增至執行階段輸出介面卡。
- 在執行階段程式碼中實作 `renderPresentation`，而非控制平面的外掛
  設定程式碼。
- 避免在高頻設定／目錄路徑中使用原生 UI 程式庫。
- 當已知一般能力限制時，請在 `presentationCapabilities.limits` 上
  宣告這些限制。
- 在轉譯器和測試中保留最終平台限制。
- 為不支援的圖表、表格、按鈕、選取器、URL
  按鈕、標題／文字重複，以及混合 `message` 加 `presentation`
  傳送新增備援測試。
- 僅在供應商能釘選已傳送訊息 ID 時，才透過 `deliveryCapabilities.pin` 和
  `pinDeliveredMessage` 新增傳遞釘選支援。
- 請勿透過共用訊息動作結構描述公開新的供應商原生卡片／區塊／元件／按鈕
  欄位。

## 相關文件

- [訊息命令列介面](/zh-TW/cli/message)
- [外掛 SDK 概覽](/zh-TW/plugins/sdk-overview)
- [外掛架構](/zh-TW/plugins/architecture-internals#message-tool-schemas)
- [頻道呈現重構計畫](/zh-TW/plan/ui-channels)
