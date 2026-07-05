---
read_when:
    - セルフホストの Synapse または Tuwunel 向けに Matrix の静かなストリーミングを設定する
    - ユーザーはすべてのプレビュー編集ではなく、完了したブロックでのみ通知を望んでいる
summary: 受信者ごとの Matrix プッシュルールによる、通知を抑えた確定済みプレビュー編集
title: 静かなプレビュー向けの Matrix プッシュルール
x-i18n:
    generated_at: "2026-07-05T11:04:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming` が `"quiet"` の場合、OpenClaw は単一のプレビューイベントをその場で編集して返信をストリーミングします。プレビューは通知しない `m.notice` イベントとして送信され、確定済みの編集には `content["com.openclaw.finalized_preview"] = true` が付けられます。Matrix クライアントは、ユーザーごとのプッシュルールがこのマーカーに一致する場合にのみ、その最終編集で通知します。このページは、Matrix をセルフホストし、各受信者アカウントにそのルールをインストールしたい運用者向けです。

`streaming: "progress"` は同じ経路で下書きを確定するため、同じルールは進行モードの確定済み編集にも発火します。

標準の Matrix 通知動作だけが必要な場合は、`streaming: "partial"` を使用するか、ストリーミングをオフのままにしてください。[Matrix チャネル設定](/ja-JP/channels/matrix#streaming-previews)を参照してください。

## 前提条件

- 受信者ユーザー = 通知を受け取るべき人
- bot ユーザー = 返信を送信する OpenClaw Matrix アカウント
- 以下の API 呼び出しには受信者ユーザーのアクセストークンを使用する
- プッシュルール内の `sender` は bot ユーザーの完全な MXID と照合する
- 受信者アカウントには、動作中の pushers がすでに存在している必要があります。静かなプレビュールールは、通常の Matrix プッシュ配信が健全な場合にのみ機能します

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
    可能な場合は、既存のクライアントセッショントークンを再利用してください。新しく発行するには:

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

  <Step title="pushers が存在することを確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

pushers が返らない場合は、続行する前にこのアカウントの通常の Matrix プッシュ配信を修正してください。

  </Step>

  <Step title="override プッシュルールをインストールする">
    確定済みプレビューマーカーと送信者としての bot MXID に一致するルールをインストールします:

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

    実行前に置き換えてください:

    - `https://matrix.example.org`: あなたのホームサーバーのベース URL
    - `$USER_ACCESS_TOKEN`: 受信者ユーザーのアクセストークン
    - `openclaw-finalized-preview-botname`: 受信者ごと、bot ごとに一意のルール ID (パターン: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: 受信者ではなく、あなたの OpenClaw bot MXID

  </Step>

  <Step title="確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

次に、ストリーミングされた返信をテストします。静かなモードでは、ルームに静かな下書きプレビューが表示され、ブロックまたはターンが完了した時点で一度だけ通知されます。

  </Step>
</Steps>

後でルールを削除するには、受信者のトークンで同じルール URL に対して `DELETE` します。

## 複数 bot のメモ

プッシュルールは `ruleId` によってキー付けされます。同じ ID に対して `PUT` を再実行すると、単一のルールが更新されます。同じ受信者に通知する OpenClaw bot が複数ある場合は、bot ごとに異なる送信者一致を持つルールを 1 つ作成してください。

新しいユーザー定義の `override` ルールは、サーバー既定の抑制ルールより前に挿入されるため、追加の順序パラメーターは不要です。このルールは、その場で確定できるテキストのみのプレビュー編集にだけ影響します。メディア返信、古いプレビューのフォールバック、Matrix メンションを有効にする最終テキストは、代わりに通常の通知メッセージとして配信されます。

## ホームサーバーのメモ

<AccordionGroup>
  <Accordion title="Synapse">
    特別な `homeserver.yaml` の変更は不要です。通常の Matrix 通知がすでにこのユーザーに届いている場合、上記の受信者トークン + `pushrules` 呼び出しが主な設定手順です。

    リバースプロキシまたは workers の背後で Synapse を実行している場合は、`/_matrix/client/.../pushrules/` が Synapse に正しく到達することを確認してください。プッシュ配信はメインプロセス、または `synapse.app.pusher` / 設定済みの pusher workers によって処理されます。それらが健全であることを確認してください。

    このルールは `event_property_is` プッシュルール条件 (MSC3758、push rule v1.10) を使用します。これは 2023 年に Synapse に追加されました。古い Synapse リリースでは `PUT pushrules/...` 呼び出しを受け付けますが、条件には暗黙的に一致しません。確定済みプレビュー編集で通知が届かない場合は、Synapse をアップグレードしてください。

  </Accordion>

  <Accordion title="Tuwunel">
    フローは Synapse と同じです。確定済みプレビューマーカーに Tuwunel 固有の設定は不要です。

    ユーザーが別のデバイスでアクティブな間に通知が消える場合は、`suppress_push_when_active` が有効になっているか確認してください。Tuwunel は 1.4.2 (2025 年 9 月) でこのオプションを追加しており、1 台のデバイスがアクティブな間、他のデバイスへのプッシュを意図的に抑制できます。

  </Accordion>
</AccordionGroup>

## 関連

- [Matrix チャネル設定](/ja-JP/channels/matrix)
- [ストリーミングの概念](/ja-JP/concepts/streaming)
