---
read_when:
    - 建置能呈現 OpenClaw 豐富回應的 Matrix 用戶端
    - 偵錯 com.openclaw.presentation 事件內容
summary: Matrix MessagePresentation 中繼資料，供支援 OpenClaw 的用戶端使用
title: 矩陣呈現中繼資料
x-i18n:
    generated_at: "2026-07-05T11:04:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw 會將正規化的 `MessagePresentation` 中繼資料附加到外送 Matrix `m.room.message` 事件的 `com.openclaw.presentation` 內容鍵之下。

標準 Matrix 用戶端會繼續呈現純文字 `body`。支援 OpenClaw 的用戶端可以讀取結構化中繼資料，並呈現按鈕、選取項、脈絡列與分隔線等原生使用者介面。

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

- `version` 是中繼資料結構描述版本；目前版本是 `1`。`type` 是穩定的辨別欄位，一律為 `"message.presentation"`。Matrix 配接器只會發出完全符合此版本與類型的酬載；用戶端同樣應忽略無法安全解讀的未知版本、未知 `type` 值，以及未知區塊類型。
- `title` 與 `tone`（`info`、`success`、`warning`、`danger`、`neutral`）是選用提示。
- 按鈕與選取選項可以在舊版字串 `value` 旁攜帶具型別的 `action`（`{ "type": "command", "command": "/..." }` 或 `{ "type": "callback", "value": "..." }`）。兩者都存在時，請優先使用 `action`。

## 備援行為

OpenClaw 一律會將可讀的純文字備援內容呈現到 `body`。結構化中繼資料是加成資訊，不得成為基本 Matrix 互通性的必要條件。

備援呈現規則：

- `title`、`text` 與 `context` 內容會呈現為純文字行。
- 具有 `command` 動作的按鈕會呈現為 ``label: `/command` ``，讓命令保持可複製。具有 `callback` 動作或只有舊版 `value` 的按鈕只會呈現標籤，讓不透明的回呼值維持私密；停用的按鈕一律只呈現標籤。URL 與 Web 應用程式按鈕會呈現為 `label: URL`。
- 選取區塊會將預留位置（或 `Options:`）呈現為標題，並加上只含標籤的選項行。
- 如果沒有任何內容可呈現，例如只有分隔線的呈現內容，本文會退回為 `---`。

不支援的用戶端會繼續顯示備援文字。支援 OpenClaw 的用戶端可以偏好使用結構化中繼資料顯示，同時保留備援內容用於複製、搜尋、通知與無障礙存取。

## 支援的區塊

Matrix 外送配接器宣告原生支援：

- `buttons`
- `select`
- `context`
- `divider`

`text` 區塊一律透過備援本文支援。請將所有區塊視為盡力而為的呈現提示；忽略未知欄位與區塊類型，而不是讓整則訊息失敗。

## 互動

此中繼資料不會新增 Matrix 回呼語義。按鈕與選取值是備援互動酬載，通常是斜線命令或文字命令。想要支援互動的 Matrix 用戶端會解析控制項值（依序為 `action.command`、`action.value`、`value`），並將其作為一般訊息送回房間。

例如，值為 `/model deepseek/deepseek-chat` 的按鈕，可以透過在同一房間中將該值作為加密 Matrix 文字訊息送出來處理。

## 與核准中繼資料的關係

`com.openclaw.presentation` 用於一般豐富訊息呈現。

核准提示使用專用的 `com.openclaw.approval` 中繼資料，因為核准會攜帶安全敏感的狀態、決策，以及執行／外掛詳細資料。如果同一事件同時存在這兩個中繼資料鍵，用戶端應優先使用專用的核准呈現器。

## 媒體訊息

當回覆包含多個媒體 URL 時，OpenClaw 會為每個媒體 URL 傳送一個 Matrix 事件。標題文字與呈現中繼資料只會附加到第一個事件，讓用戶端取得一個穩定的結構化酬載，而不會出現重複的呈現器。長文字分段為多個事件時也適用相同規則：中繼資料只會搭載在第一個事件上。

請保持呈現中繼資料精簡。大型使用者可見文字應保留在 `body` 中，並使用一般 Matrix 文字分段路徑。
