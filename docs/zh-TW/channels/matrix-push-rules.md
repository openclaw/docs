---
read_when:
    - 為自行託管的 Synapse 或 Tuwunel 設定 Matrix 靜默串流
    - 使用者只希望在區塊完成時收到通知，而不是每次預覽編輯時都收到通知
summary: 針對無聲最終預覽編輯的各收件者 Matrix 推播規則
title: 用於靜默預覽的 Matrix 推播規則
x-i18n:
    generated_at: "2026-07-14T13:27:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

當 `channels.matrix.streaming.mode` 為 `"quiet"` 時，OpenClaw 會就地編輯單一預覽事件，以串流方式傳送回覆。預覽會以不觸發通知的 `m.notice` 事件傳送，最終完成的編輯則會標記 `content["com.openclaw.finalized_preview"] = true`。只有在符合該標記的使用者專屬推播規則存在時，Matrix 用戶端才會針對最終編輯發出通知。本頁適用於自行託管 Matrix，並希望為每個接收者帳號安裝此規則的營運人員。

`streaming.mode: "progress"` 也會透過相同路徑完成草稿，因此同一規則也會針對進度模式中已完成的編輯觸發。

如果只需要 Matrix 的標準通知行為，請使用 `streaming.mode: "partial"`，或關閉串流。請參閱 [Matrix 頻道設定](/zh-TW/channels/matrix#streaming-previews)。

## 先決條件

- 接收者使用者 = 應收到通知的人員
- 機器人使用者 = 傳送回覆的 OpenClaw Matrix 帳號
- 下方的 API 呼叫請使用接收者使用者的存取權杖
- 在推播規則中，讓 `sender` 比對機器人使用者的完整 MXID
- 接收者帳號必須已有正常運作的推播器；只有在一般 Matrix 推播傳遞正常時，靜默預覽規則才會運作

## 步驟

<Steps>
  <Step title="設定靜默預覽">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="取得接收者的存取權杖">
    盡可能重複使用現有的用戶端工作階段權杖。若要核發新的權杖：

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="確認推播器存在">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果未傳回任何推播器，請先修復此帳號的一般 Matrix 推播傳遞，再繼續操作。

  </Step>

  <Step title="安裝覆寫推播規則">
    安裝一項規則，以比對最終預覽標記，並將機器人 MXID 作為傳送者：

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    執行前請替換：

    - `https://matrix.example.org`：你的主伺服器基底 URL
    - `$USER_ACCESS_TOKEN`：接收者使用者的存取權杖
    - `openclaw-finalized-preview-botname`：每個接收者的每個機器人都必須使用唯一的規則 ID（格式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：你的 OpenClaw 機器人 MXID，而非接收者的 MXID

  </Step>

  <Step title="驗證">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

接著測試串流回覆。在靜默模式下，聊天室會顯示靜默草稿預覽，並在區塊或回合完成時發出一次通知。

  </Step>
</Steps>

若之後要移除規則，請使用接收者的權杖，對相同的規則 URL 執行 `DELETE`。

## 多機器人注意事項

推播規則以 `ruleId` 作為索引鍵：針對相同 ID 重新執行 `PUT`，會更新單一規則。如果有多個 OpenClaw 機器人要通知同一位接收者，請為每個機器人建立一項規則，並使用不同的傳送者比對條件。

新建立的使用者自訂 `override` 規則會插入伺服器預設的抑制規則之前，因此不需要額外的排序參數。此規則只會影響可就地完成的純文字預覽編輯；媒體回覆、過期預覽的備援，以及會觸發 Matrix 提及的最終文字，則會改以一般會觸發通知的訊息傳送。

## 主伺服器注意事項

<AccordionGroup>
  <Accordion title="Synapse">
    不需要特別變更 `homeserver.yaml`。如果一般 Matrix 通知已可送達此使用者，主要設定步驟就是使用接收者權杖執行上述 `pushrules` 呼叫。

    如果 Synapse 位於反向 Proxy 或 Worker 後方，請確認 `/_matrix/client/.../pushrules/` 能正確送達 Synapse。推播傳遞由主要程序或 `synapse.app.pusher`／已設定的推播器 Worker 處理，請確保它們運作正常。

    此規則使用 `event_property_is` 推播規則條件（MSC3758，推播規則 v1.10），Synapse 已於 2023 年加入此條件。舊版 Synapse 會接受 `PUT pushrules/...` 呼叫，但條件永遠不會符合且不會顯示任何錯誤；如果最終預覽編輯未觸發通知，請升級 Synapse。

  </Accordion>

  <Accordion title="Tuwunel">
    流程與 Synapse 相同；最終預覽標記不需要任何 Tuwunel 專用設定。

    如果使用者在另一台裝置上處於活動狀態時通知消失，請檢查是否已啟用 `suppress_push_when_active`。Tuwunel 於 1.4.2（2025 年 9 月）加入此選項；當一台裝置處於活動狀態時，它可能會刻意抑制傳送至其他裝置的推播。

  </Accordion>
</AccordionGroup>

## 相關內容

- [Matrix 頻道設定](/zh-TW/channels/matrix)
- [串流概念](/zh-TW/concepts/streaming)
