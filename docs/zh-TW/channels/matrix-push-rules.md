---
read_when:
    - 為自行託管的 Synapse 或 Tuwunel 設定 Matrix 靜默串流
    - 使用者希望只在區塊完成時收到通知，而不是每次預覽編輯時都收到通知
summary: 用於靜默完成預覽編輯的逐收件者 Matrix 推送規則
title: 用於靜音預覽的 Matrix 推播規則
x-i18n:
    generated_at: "2026-04-30T02:47:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

當 `channels.matrix.streaming` 為 `"quiet"` 時，OpenClaw 會就地編輯單一預覽事件，並以自訂內容旗標標記最終編輯。只有當每位使用者的推送規則符合該旗標時，Matrix 用戶端才會在最終編輯時通知。此頁面適用於自行託管 Matrix，並想為每個接收者帳號安裝該規則的維運人員。

如果你只想使用標準的 Matrix 通知行為，請使用 `streaming: "partial"` 或關閉串流。請參閱 [Matrix 頻道設定](/zh-TW/channels/matrix#streaming-previews)。

## 先決條件

- 接收者使用者 = 應該收到通知的人
- 機器人使用者 = 傳送回覆的 OpenClaw Matrix 帳號
- 下方 API 呼叫請使用接收者使用者的存取權杖
- 在推送規則中將 `sender` 比對為機器人使用者的完整 MXID
- 接收者帳號必須已經有可運作的推送器 — 靜默預覽規則只有在一般 Matrix 推送傳遞健全時才會運作

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
    盡可能重用現有用戶端工作階段權杖。若要核發新的權杖：

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

如果沒有傳回任何推送器，請先修正此帳號的一般 Matrix 推送傳遞，再繼續。

  </Step>

  <Step title="安裝覆寫推送規則">
    OpenClaw 會以 `content["com.openclaw.finalized_preview"] = true` 標記已最終化的純文字預覽編輯。安裝一條規則，比對該標記以及作為傳送者的機器人 MXID：

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

    - `https://matrix.example.org`：你的家伺服器基底 URL
    - `$USER_ACCESS_TOKEN`：接收者使用者的存取權杖
    - `openclaw-finalized-preview-botname`：每個機器人、每個接收者都唯一的規則 ID（模式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：你的 OpenClaw 機器人 MXID，不是接收者的

  </Step>

  <Step title="驗證">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

接著測試串流回覆。在靜默模式中，房間會顯示靜默草稿預覽，並在區塊或回合完成時通知一次。

  </Step>
</Steps>

若稍後要移除規則，請使用接收者的權杖對同一個規則 URL 執行 `DELETE`。

## 多機器人注意事項

推送規則以 `ruleId` 作為鍵：對同一個 ID 重新執行 `PUT` 會更新單一規則。若有多個 OpenClaw 機器人要通知同一個接收者，請為每個機器人建立一條規則，並使用不同的傳送者比對。

新的使用者定義 `override` 規則會插入在預設抑制規則之前，因此不需要額外的排序參數。此規則只會影響可就地最終化的純文字預覽編輯；媒體後備與過期預覽後備會使用一般 Matrix 傳遞。

## 家伺服器注意事項

<AccordionGroup>
  <Accordion title="Synapse">
    不需要特殊的 `homeserver.yaml` 變更。如果一般 Matrix 通知已經能送達此使用者，上方的接收者權杖加上 `pushrules` 呼叫就是主要設定步驟。

    如果你在反向代理或工作節點後方執行 Synapse，請確認 `/_matrix/client/.../pushrules/` 能正確到達 Synapse。推送傳遞由主程序或 `synapse.app.pusher`／已設定的推送工作節點處理 — 請確認它們都正常運作。

    此規則使用 `event_property_is` 推送規則條件（MSC3758，推送規則 v1.10），Synapse 於 2023 年加入此條件。較舊的 Synapse 版本會接受 `PUT pushrules/...` 呼叫，但會默默永遠無法比對條件 — 若最終化預覽編輯沒有送出通知，請升級 Synapse。

  </Accordion>

  <Accordion title="Tuwunel">
    流程與 Synapse 相同；最終化預覽標記不需要 Tuwunel 專屬設定。

    如果使用者在另一台裝置上處於活動狀態時通知消失，請檢查是否已啟用 `suppress_push_when_active`。Tuwunel 於 1.4.2（2025 年 9 月）加入此選項，且它可以在一台裝置處於活動狀態時刻意抑制傳送到其他裝置的推送。

  </Accordion>
</AccordionGroup>

## 相關

- [Matrix 頻道設定](/zh-TW/channels/matrix)
- [串流概念](/zh-TW/concepts/streaming)
