---
read_when:
    - セルフホストの Synapse または Tuwunel 向け Matrix 静音ストリーミングの設定
    - ユーザーは、すべてのプレビュー編集ごとではなく、完了したブロックについてのみ通知を受け取りたいと考えています。
summary: 通知を抑えた確定済みプレビュー編集のための受信者別 Matrix プッシュルール
title: 静かなプレビュー向けのMatrixプッシュルール
x-i18n:
    generated_at: "2026-04-30T04:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming` が `"quiet"` の場合、OpenClaw は単一のプレビューイベントをその場で編集し、確定した編集にカスタムコンテンツフラグを付けます。Matrix クライアントは、ユーザーごとのプッシュルールがそのフラグに一致する場合にのみ、最終編集で通知します。このページは、Matrix をセルフホストしていて、各受信者アカウントにそのルールをインストールしたい運用者向けです。

標準の Matrix 通知動作だけが必要な場合は、`streaming: "partial"` を使うか、ストリーミングをオフのままにしてください。[Matrix チャンネル設定](/ja-JP/channels/matrix#streaming-previews)を参照してください。

## 前提条件

- 受信者ユーザー = 通知を受け取るべき人
- bot ユーザー = 返信を送信する OpenClaw Matrix アカウント
- 下記の API 呼び出しには受信者ユーザーのアクセストークンを使用する
- プッシュルールの `sender` は bot ユーザーの完全な MXID と照合する
- 受信者アカウントには、動作中の pusher がすでに必要です。quiet プレビュールールは、通常の Matrix プッシュ配信が正常な場合にのみ機能します

## 手順

<Steps>
  <Step title="quiet プレビューを設定する">

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
    可能な場合は既存のクライアントセッショントークンを再利用してください。新しく発行するには、次のようにします。

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
    OpenClaw は、確定したテキストのみのプレビュー編集に `content["com.openclaw.finalized_preview"] = true` を付けます。そのマーカーと、送信者としての bot MXID に一致するルールをインストールします。

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

    実行前に置き換えてください。

    - `https://matrix.example.org`: ホームサーバーのベース URL
    - `$USER_ACCESS_TOKEN`: 受信者ユーザーのアクセストークン
    - `openclaw-finalized-preview-botname`: bot ごと、受信者ごとに一意のルール ID（パターン: `openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`: OpenClaw bot の MXID。受信者のものではありません

  </Step>

  <Step title="確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

その後、ストリーミングされた返信をテストします。quiet モードでは、ルームに quiet ドラフトプレビューが表示され、ブロックまたはターンが完了した時点で一度だけ通知されます。

  </Step>
</Steps>

後でルールを削除するには、同じルール URL に受信者のトークンで `DELETE` を送信します。

## 複数 bot に関する注記

プッシュルールは `ruleId` をキーにします。同じ ID に対して `PUT` を再実行すると、単一のルールが更新されます。同じ受信者に通知する OpenClaw bot が複数ある場合は、bot ごとに、異なる送信者一致を持つルールを 1 つ作成してください。

新しいユーザー定義の `override` ルールは、デフォルトの抑制ルールより前に挿入されるため、追加の順序パラメーターは不要です。このルールは、その場で確定できるテキストのみのプレビュー編集にのみ影響します。メディアのフォールバックと古いプレビューのフォールバックは、通常の Matrix 配信を使用します。

## ホームサーバーに関する注記

<AccordionGroup>
  <Accordion title="Synapse">
    特別な `homeserver.yaml` の変更は不要です。通常の Matrix 通知がすでにこのユーザーに届いている場合は、上記の受信者トークン + `pushrules` 呼び出しが主な設定手順です。

    Synapse をリバースプロキシまたは worker の背後で実行している場合は、`/_matrix/client/.../pushrules/` が Synapse に正しく到達することを確認してください。プッシュ配信はメインプロセス、または `synapse.app.pusher` / 設定済みの pusher worker によって処理されます。それらが正常であることを確認してください。

    このルールは `event_property_is` プッシュルール条件（MSC3758、プッシュルール v1.10）を使用します。これは 2023 年に Synapse に追加されました。古い Synapse リリースは `PUT pushrules/...` 呼び出しを受け付けますが、条件には暗黙的に一致しません。確定したプレビュー編集で通知が届かない場合は Synapse をアップグレードしてください。

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse と同じフローです。確定プレビューマーカーに Tuwunel 固有の設定は不要です。

    ユーザーが別のデバイスでアクティブな間に通知が消える場合は、`suppress_push_when_active` が有効になっているか確認してください。Tuwunel はこのオプションを 1.4.2（2025 年 9 月）で追加しており、1 台のデバイスがアクティブな間、他のデバイスへのプッシュを意図的に抑制できます。

  </Accordion>
</AccordionGroup>

## 関連

- [Matrix チャンネル設定](/ja-JP/channels/matrix)
- [ストリーミングの概念](/ja-JP/concepts/streaming)
