---
read_when:
    - 為自行託管的 Synapse 或 Tuwunel 設定 Matrix 靜默串流
    - 使用者只希望在區塊完成時收到通知，而不是每次預覽編輯時都收到通知
summary: 針對安靜完成的預覽編輯，為每位收件者設定 Matrix 推播規則
title: 靜默預覽的 Matrix 推送規則
x-i18n:
    generated_at: "2026-07-11T21:08:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

當 `channels.matrix.streaming` 為 `"quiet"` 時，OpenClaw 會透過就地編輯單一預覽事件來串流回覆。預覽會以不觸發通知的 `m.notice` 事件傳送，而完成後的編輯會標記為 `content["com.openclaw.finalized_preview"] = true`。只有當每位使用者的推送規則符合此標記時，Matrix 用戶端才會針對該最終編輯發出通知。本頁適用於自行託管 Matrix，並希望為每個接收者帳號安裝此規則的營運人員。

`streaming: "progress"` 會透過相同路徑完成草稿，因此同一規則也會針對進度模式的最終編輯觸發。

如果只需要 Matrix 的標準通知行為，請使用 `streaming: "partial"` 或關閉串流。請參閱 [Matrix 頻道設定](/zh-TW/channels/matrix#streaming-previews)。

## 先決條件

- 接收者使用者 = 應收到通知的人
- 機器人使用者 = 傳送回覆的 OpenClaw Matrix 帳號
- 下列 API 呼叫請使用接收者使用者的存取權杖
- 推送規則中的 `sender` 必須與機器人使用者的完整 MXID 相符
- 接收者帳號必須已有正常運作的推送器；只有在一般 Matrix 推送傳遞正常時，靜默預覽規則才能運作

## 步驟

<Steps>
  <Step title="設定靜默預覽">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="取得接收者的存取權杖">
    如有可能，請重複使用現有的用戶端工作階段權杖。若要建立新的權杖：

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

  <Step title="確認推送器存在">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果沒有傳回任何推送器，請先修復此帳號的一般 Matrix 推送傳遞，再繼續操作。

  </Step>

  <Step title="安裝覆寫推送規則">
    安裝一項規則，使其同時符合最終預覽標記及作為傳送者的機器人 MXID：

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

    - `https://matrix.example.org`：您的主伺服器基底 URL
    - `$USER_ACCESS_TOKEN`：接收者使用者的存取權杖
    - `openclaw-finalized-preview-botname`：每個接收者所使用、每個機器人皆不同的規則 ID（格式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：您的 OpenClaw 機器人 MXID，而非接收者的 MXID

  </Step>

  <Step title="驗證">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

接著測試串流回覆。在靜默模式下，聊天室會顯示靜默的草稿預覽，並在區塊或回合完成時發出一次通知。

  </Step>
</Steps>

若之後要移除此規則，請使用接收者的權杖對相同規則 URL 發出 `DELETE`。

## 多機器人注意事項

推送規則以 `ruleId` 為索引鍵：使用相同 ID 重新執行 `PUT` 會更新單一規則。若有多個 OpenClaw 機器人向同一接收者發出通知，請為每個機器人建立一項規則，並使用不同的傳送者比對條件。

新的使用者自訂 `override` 規則會插入伺服器預設的抑制規則之前，因此不需要額外的排序參數。此規則只會影響能夠就地完成的純文字預覽編輯；媒體回覆、過期預覽的備援處理，以及會觸發 Matrix 提及的最終文字，則會改以一般的通知訊息傳遞。

## 主伺服器注意事項

<AccordionGroup>
  <Accordion title="Synapse">
    不需要對 `homeserver.yaml` 進行特殊變更。如果一般 Matrix 通知已能傳送給此使用者，主要設定步驟就是使用接收者權杖進行上述 `pushrules` 呼叫。

    如果您透過反向代理或工作程序執行 Synapse，請確保 `/_matrix/client/.../pushrules/` 能正確抵達 Synapse。推送傳遞由主要處理程序、`synapse.app.pusher` 或已設定的推送工作程序處理，請確保它們運作正常。

    此規則使用 `event_property_is` 推送規則條件（MSC3758，推送規則 v1.10），Synapse 於 2023 年加入此條件。較舊版本的 Synapse 會接受 `PUT pushrules/...` 呼叫，但不會顯示錯誤且永遠無法符合該條件；如果完成預覽編輯時未收到通知，請升級 Synapse。

  </Accordion>

  <Accordion title="Tuwunel">
    流程與 Synapse 相同；最終預覽標記不需要任何 Tuwunel 專用設定。

    如果使用者在另一部裝置上處於活動狀態時通知消失，請檢查是否已啟用 `suppress_push_when_active`。Tuwunel 在 1.4.2（2025 年 9 月）加入此選項；當其中一部裝置處於活動狀態時，它可以有意抑制傳送至其他裝置的推送通知。

  </Accordion>
</AccordionGroup>

## 相關內容

- [Matrix 頻道設定](/zh-TW/channels/matrix)
- [串流概念](/zh-TW/concepts/streaming)
