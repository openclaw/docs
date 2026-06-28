---
read_when:
    - 建置可呈現 OpenClaw 豐富回應的 Matrix 用戶端
    - 偵錯 com.openclaw.presentation 事件內容
summary: 供支援 OpenClaw 的用戶端使用的 Matrix MessagePresentation 中繼資料
title: Matrix 呈現中繼資料
x-i18n:
    generated_at: "2026-05-10T19:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 可將標準化的 `MessagePresentation` 中繼資料附加到對外傳送的 Matrix `m.room.message` 事件，位置在 `com.openclaw.presentation` 之下。

一般 Matrix 用戶端會繼續呈現純文字 `body`。支援 OpenClaw 的用戶端可以讀取結構化中繼資料，並呈現原生 UI，例如按鈕、選擇器、上下文列和分隔線。

## 事件內容

中繼資料會儲存在 Matrix 事件內容中：

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` 是 Matrix 呈現中繼資料結構描述版本。`type` 是提供給支援 OpenClaw 的用戶端使用的穩定判別值。用戶端應忽略未知的 `type` 值、無法安全解讀的未知版本，以及未知的區塊類型。

## 後援行為

OpenClaw 一律會將可讀的純文字後援內容呈現到 `body` 中。結構化中繼資料是附加資訊，不得作為基本 Matrix 互通性的必要條件。

不支援的用戶端應繼續顯示後援文字。支援 OpenClaw 的用戶端可以偏好使用結構化中繼資料進行顯示，同時保留後援文字以供複製、搜尋、通知和無障礙使用。

## 支援的區塊

Matrix 對外傳送配接器宣告支援：

- `buttons`
- `select`
- `context`
- `divider`

用戶端應將這些區塊視為盡力而為的呈現提示。遇到未知欄位和未知區塊類型時，應予以忽略，而不是導致整則訊息無法呈現。

## 互動

此中繼資料不會新增 Matrix 回呼語意。按鈕和選擇選項的值是後援互動酬載，通常是斜線命令或文字命令。想支援互動的 Matrix 用戶端，可以將所選值作為一般訊息傳回聊天室。

例如，值為 `/model deepseek/deepseek-chat` 的按鈕，可以透過在同一個聊天室中傳送該值作為加密的 Matrix 文字訊息來處理。

## 與核准中繼資料的關係

`com.openclaw.presentation` 用於一般豐富訊息呈現。

核准提示會使用專用的 `com.openclaw.approval` 中繼資料，因為核准承載安全敏感的狀態、決策，以及執行/Plugin 詳細資料。如果同一個事件上同時存在兩個中繼資料鍵，用戶端應偏好使用專用的核准呈現器。

## 媒體訊息

當回覆包含多個媒體 URL 時，OpenClaw 會針對每個媒體 URL 傳送一個 Matrix 事件。呈現中繼資料只會附加到第一個媒體事件，讓用戶端擁有一個穩定的結構化酬載，並避免重複呈現器。

請讓呈現中繼資料保持精簡。大型使用者可見文字應留在 `body` 中，並使用一般 Matrix 文字分塊路徑。
