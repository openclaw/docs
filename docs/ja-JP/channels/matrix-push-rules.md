---
read_when:
    - セルフホストの Synapse または Tuwunel 向けに Matrix のサイレントストリーミングを設定する
    - ユーザーは、プレビューを編集するたびではなく、ブロックが完了したときにのみ通知を受け取りたいと考えています
summary: 静かな確定済みプレビュー編集の受信者別 Matrix プッシュルール
title: 控えめなプレビュー用の Matrix プッシュルール
x-i18n:
    generated_at: "2026-07-16T11:21:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming.mode` が `"quiet"` の場合、OpenClaw は単一のプレビューイベントをその場で編集して応答をストリーミングします。プレビューは通知を発生させない `m.notice` イベントとして送信され、確定時の編集には `content["com.openclaw.finalized_preview"] = true` が付与されます。Matrix クライアントがこの最終編集時に通知するのは、ユーザーごとのプッシュルールがこのマーカーに一致した場合のみです。このページは、Matrix をセルフホストし、受信者アカウントごとにこのルールをインストールする必要がある運用者向けです。

`streaming.mode: "progress"` は同じ経路で下書きを確定するため、同じルールが進行状況モードで確定された編集にも適用されます。

Matrix の標準通知動作のみが必要な場合は、`streaming.mode: "partial"` を使用するか、ストリーミングを無効のままにしてください。[Matrix チャンネルのセットアップ](/ja-JP/channels/matrix#streaming-previews)を参照してください。

## 前提条件

- 受信者ユーザー = 通知を受け取るユーザー
- ボットユーザー = 応答を送信する OpenClaw Matrix アカウント
- 以下の API 呼び出しには受信者ユーザーのアクセストークンを使用する
- プッシュルールの `sender` をボットユーザーの完全な MXID と照合する
- 受信者アカウントには、すでに動作するプッシャーが必要です。静かなプレビュールールが機能するのは、通常の Matrix プッシュ配信が正常な場合のみです

## 手順

<Steps>
  <Step title="静かなプレビューを設定する">

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

  <Step title="受信者のアクセストークンを取得する">
    可能であれば、既存のクライアントセッショントークンを再利用します。新しいトークンを発行するには、次を実行します。

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

  <Step title="プッシャーが存在することを確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

プッシャーが返されない場合は、続行する前に、このアカウントの通常の Matrix プッシュ配信を修正してください。

  </Step>

  <Step title="オーバーライドプッシュルールをインストールする">
    確定済みプレビューマーカーと送信者であるボットの MXID に一致するルールをインストールします。

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

    - `https://matrix.example.org`: ホームサーバーのベース URL
    - `$USER_ACCESS_TOKEN`: 受信者ユーザーのアクセストークン
    - `openclaw-finalized-preview-botname`: 受信者ごと、ボットごとに一意のルール ID（パターン: `openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`: 受信者ではなく、OpenClaw ボットの MXID

  </Step>

  <Step title="確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

次に、ストリーミングされた応答をテストします。静かなモードでは、ルームに静かな下書きプレビューが表示され、ブロックまたはターンが完了した時点で通知されます。

  </Step>
</Steps>

後でルールを削除するには、受信者のトークンを使用して同じルール URL に `DELETE` を実行します。

## 複数ボットに関する注意事項

プッシュルールは `ruleId` をキーとします。同じ ID に対して `PUT` を再実行すると、単一のルールが更新されます。同じ受信者に通知する OpenClaw ボットが複数ある場合は、送信者の照合条件が異なるルールをボットごとに作成してください。

ユーザー定義の新しい `override` ルールは、サーバーのデフォルト抑制ルールより前に挿入されるため、追加の順序パラメーターは不要です。このルールが影響するのは、その場で確定できるテキストのみのプレビュー編集に限られます。メディア応答、古くなったプレビューのフォールバック、および Matrix のメンションを有効にする最終テキストは、代わりに通常の通知メッセージとして配信されます。

## ホームサーバーに関する注意事項

<AccordionGroup>
  <Accordion title="Synapse">
    特別な `homeserver.yaml` の変更は不要です。通常の Matrix 通知がすでにこのユーザーに届いている場合、主なセットアップ手順は、受信者のトークンを使用した上記の `pushrules` 呼び出しです。

    リバースプロキシまたはワーカーの背後で Synapse を実行している場合は、`/_matrix/client/.../pushrules/` が Synapse に正しく到達することを確認してください。プッシュ配信は、メインプロセスまたは `synapse.app.pusher` / 設定済みのプッシャーワーカーによって処理されます。それらが正常であることを確認してください。

    このルールでは `event_property_is` プッシュルール条件（MSC3758、プッシュルール v1.10）を使用します。この条件は 2023 年に Synapse に追加されました。古い Synapse リリースでは `PUT pushrules/...` 呼び出しが受け入れられても、条件には暗黙的に一致しません。確定済みプレビューの編集時に通知が届かない場合は、Synapse をアップグレードしてください。

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse と同じ手順です。確定済みプレビューマーカーのための Tuwunel 固有の設定は不要です。

    ユーザーが別のデバイスでアクティブな間に通知が届かなくなる場合は、`suppress_push_when_active` が有効になっているか確認してください。Tuwunel はこのオプションを 1.4.2（2025 年 9 月）で追加しました。1 台のデバイスがアクティブな間、他のデバイスへのプッシュを意図的に抑制できます。

  </Accordion>
</AccordionGroup>

## 関連項目

- [Matrix チャンネルのセットアップ](/ja-JP/channels/matrix)
- [ストリーミングの概念](/ja-JP/concepts/streaming)
