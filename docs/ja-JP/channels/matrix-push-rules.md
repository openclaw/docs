---
read_when:
    - セルフホストの Synapse または Tuwunel 向けに Matrix の静かなストリーミングを設定する
    - ユーザーが求めているのは、プレビュー編集のたびではなく、完成したブロックに対してのみ通知を受け取ることです
summary: 静かな最終プレビュー編集のための、受信者ごとの Matrix プッシュルール
title: 静かなプレビューのための Matrix プッシュルール
x-i18n:
    generated_at: "2026-04-24T04:46:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

`channels.matrix.streaming` が `"quiet"` の場合、OpenClaw は 1 つのプレビューイベントをその場で編集し、最終確定編集にカスタムコンテンツフラグを付けます。Matrix クライアントがその最終編集でのみ通知するのは、ユーザーごとのプッシュルールがそのフラグに一致する場合です。このページは、Matrix をセルフホストしていて、各受信者アカウントにそのルールをインストールしたい運用者向けです。

標準の Matrix 通知動作だけでよい場合は、`streaming: "partial"` を使うか、ストリーミングをオフのままにしてください。[Matrix チャネル設定](/ja-JP/channels/matrix#streaming-previews)を参照してください。

## 前提条件

- recipient user = 通知を受け取る人
- bot user = 返信を送信する OpenClaw Matrix アカウント
- 以下の API 呼び出しでは受信者ユーザーのアクセストークンを使用する
- プッシュルール内の `sender` はボットユーザーの完全な MXID と一致させる
- 受信者アカウントには、すでに正常に動作する pusher が存在している必要があります。静かなプレビュー用ルールは、通常の Matrix プッシュ配信が正常な場合にのみ機能します

## 手順

<Steps>
  <Step title="静かなプレビューを設定する">

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

  <Step title="受信者のアクセストークンを取得する">
    可能であれば、既存のクライアントセッショントークンを再利用してください。新しく発行するには:

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

  <Step title="pusher が存在することを確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

pusher が返ってこない場合は、続行する前にこのアカウントの通常の Matrix プッシュ配信を修正してください。

  </Step>

  <Step title="override プッシュルールをインストールする">
    OpenClaw は、最終確定されたテキストのみのプレビュー編集に `content["com.openclaw.finalized_preview"] = true` を付けます。そのマーカーと、送信者としてのボット MXID に一致するルールをインストールしてください。

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

    実行前に次を置き換えてください。

    - `https://matrix.example.org`: あなたの homeserver のベース URL
    - `$USER_ACCESS_TOKEN`: 受信者ユーザーのアクセストークン
    - `openclaw-finalized-preview-botname`: 受信者ごとのボットごとに一意な rule ID（パターン: `openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`: 受信者ではなく、あなたの OpenClaw ボットの MXID

  </Step>

  <Step title="確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

次に、ストリーミング返信をテストしてください。quiet モードでは、ルームには静かな下書きプレビューが表示され、ブロックまたはターンの完了時に 1 回だけ通知されます。

  </Step>
</Steps>

後でルールを削除するには、受信者のトークンを使って同じルール URL に `DELETE` してください。

## 複数ボットに関する注意

プッシュルールは `ruleId` で識別されます。同じ ID に対して `PUT` を再実行すると、1 つのルールが更新されます。同じ受信者に複数の OpenClaw ボットが通知する場合は、送信者一致が異なるボットごとに 1 つずつルールを作成してください。

新しいユーザー定義の `override` ルールは、デフォルトの抑制ルールより前に挿入されるため、追加の並び順パラメーターは不要です。このルールが影響するのは、その場で最終確定できるテキストのみのプレビュー編集だけです。メディアフォールバックと古いプレビューフォールバックでは、通常の Matrix 配信が使われます。

## homeserver に関する注意

<AccordionGroup>
  <Accordion title="Synapse">
    特別な `homeserver.yaml` の変更は必要ありません。通常の Matrix 通知がすでにこのユーザーに届いている場合、主な設定手順は受信者トークンと上記の `pushrules` 呼び出しです。

    Synapse をリバースプロキシや worker の背後で動かしている場合は、`/_matrix/client/.../pushrules/` が正しく Synapse に届くことを確認してください。プッシュ配信はメインプロセス、または `synapse.app.pusher` / 設定済みの pusher worker によって処理されるため、それらが正常であることを確認してください。

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse と同じ手順です。最終確定プレビューマーカーのために Tuwunel 固有の設定は必要ありません。

    ユーザーが別のデバイスでアクティブな間に通知が消える場合は、`suppress_push_when_active` が有効になっていないか確認してください。Tuwunel は 1.4.2（2025 年 9 月）でこのオプションを追加しており、1 台のデバイスがアクティブな間、他のデバイスへのプッシュを意図的に抑制することがあります。

  </Accordion>
</AccordionGroup>

## 関連

- [Matrix チャネル設定](/ja-JP/channels/matrix)
- [ストリーミングの概念](/ja-JP/concepts/streaming)
