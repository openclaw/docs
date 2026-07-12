---
read_when:
    - 建置可呈現 OpenClaw 豐富回應的 Matrix 用戶端
    - 偵錯 com.openclaw.presentation 事件內容
summary: 供支援 OpenClaw 的用戶端使用的 Matrix MessagePresentation 中繼資料
title: Matrix 呈現中繼資料
x-i18n:
    generated_at: "2026-07-11T21:08:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw 會將正規化的 `MessagePresentation` 中繼資料附加至傳出的 Matrix `m.room.message` 事件，並置於 `com.openclaw.presentation` 內容鍵下。

一般 Matrix 用戶端會繼續呈現純文字 `body`。支援 OpenClaw 的用戶端可以讀取結構化中繼資料，並呈現按鈕、選取控制項、上下文列與分隔線等原生介面。

## 事件內容

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` 是中繼資料結構描述版本；目前版本為 `1`。`type` 是穩定的判別欄位，固定為 `"message.presentation"`。Matrix 轉接器只會發出版本與類型完全相符的酬載；同樣地，用戶端應忽略無法安全解讀的未知版本、未知的 `type` 值與未知的區塊類型。
- `title` 與 `tone`（`info`、`success`、`warning`、`danger`、`neutral`）是選用提示。
- 按鈕與選取選項除了舊版字串 `value` 外，也可以攜帶具型別的 `action`（`{ "type": "command", "command": "/..." }` 或 `{ "type": "callback", "value": "..." }`）。兩者同時存在時，優先使用 `action`。

## 備援行為

OpenClaw 一律會在 `body` 中產生可讀的純文字備援內容。結構化中繼資料是附加資訊，不得作為基本 Matrix 互通性的必要條件。

備援呈現規則：

- `title`、`text` 與 `context` 內容會呈現為純文字行。
- 具有 `command` 動作的按鈕會呈現為 ``標籤：`/command` ``，讓命令保持可複製。具有 `callback` 動作或只有舊版 `value` 的按鈕只會呈現標籤，以免不透明的回呼值外洩；停用的按鈕一律只呈現標籤。URL 與網頁應用程式按鈕會呈現為 `標籤：URL`。
- 選取區塊會將預留位置文字（或 `選項：`）呈現為標題，並在下方列出僅含標籤的選項行。
- 如果沒有任何可呈現的內容，例如只有分隔線的呈現內容，本文會備援為 `---`。

不支援的用戶端仍會顯示備援文字。支援 OpenClaw 的用戶端可優先使用結構化中繼資料進行顯示，同時保留備援內容供複製、搜尋、通知與無障礙功能使用。

## 支援的區塊

Matrix 傳出轉接器宣告原生支援：

- `buttons`
- `select`
- `context`
- `divider`

`text` 區塊一律透過備援本文獲得支援。所有區塊都應視為盡力呈現的提示；遇到未知欄位與區塊類型時應予以忽略，而非使整則訊息失敗。

## 互動

此中繼資料不會新增 Matrix 回呼語意。按鈕與選取項目的值是備援互動酬載，通常是斜線命令或文字命令。想要支援互動的 Matrix 用戶端會解析控制項的值（依序使用 `action.command`、`action.value`、`value`），並以一般訊息傳回聊天室。

例如，值為 `/model deepseek/deepseek-chat` 的按鈕，可以透過在同一聊天室中將該值作為加密的 Matrix 文字訊息傳送來處理。

## 與核准中繼資料的關係

`com.openclaw.presentation` 用於一般的豐富訊息呈現。

核准提示使用專用的 `com.openclaw.approval` 中繼資料，因為核准包含安全性敏感的狀態、決策及執行／外掛詳細資料。如果同一事件同時含有這兩個中繼資料鍵，用戶端應優先使用專用的核准呈現器。

## 媒體訊息

當回覆包含多個媒體 URL 時，OpenClaw 會為每個媒體 URL 傳送一個 Matrix 事件。說明文字與呈現中繼資料只會附加至第一個事件，讓用戶端取得一份穩定的結構化酬載，而不會產生重複的呈現器。長文字分割成多個事件時也適用相同規則：中繼資料只會附加在第一個事件上。

請保持呈現中繼資料精簡。大量使用者可見文字應保留在 `body` 中，並使用一般的 Matrix 文字分塊路徑。
