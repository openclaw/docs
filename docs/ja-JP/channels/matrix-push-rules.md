---
read_when:
    - セルフホスト型 Synapse または Tuwunel 向けの Matrix サイレントストリーミングの設定
    - ユーザーは、プレビューを編集するたびではなく、ブロックが完了したときにのみ通知を受け取ることを望んでいます
summary: 受信者ごとの Matrix プッシュルールによる、通知を抑えた確定済みプレビュー編集
title: 静かなプレビュー向けの Matrix プッシュルール
x-i18n:
    generated_at: "2026-07-11T22:01:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

`channels.matrix.streaming` が `"quiet"` の場合、OpenClaw は単一のプレビューイベントをその場で編集しながら応答をストリーミングします。プレビューは通知を発生させない `m.notice` イベントとして送信され、確定時の編集には `content["com.openclaw.finalized_preview"] = true` が設定されます。Matrix クライアントがその最終編集で通知するのは、ユーザーごとのプッシュルールがこのマーカーに一致した場合だけです。このページは、Matrix をセルフホストし、各受信者アカウントにそのルールをインストールしたい運用者向けです。

`streaming: "progress"` も同じ経路で下書きを確定するため、同じルールが進捗モードの確定時編集にも適用されます。

Matrix 標準の通知動作のみを使用する場合は、`streaming: "partial"` を使用するか、ストリーミングを無効のままにしてください。[Matrix チャンネルのセットアップ](/ja-JP/channels/matrix#streaming-previews)を参照してください。

## 前提条件

- 受信者ユーザー = 通知を受け取る人
- ボットユーザー = 応答を送信する OpenClaw Matrix アカウント
- 以下の API 呼び出しには受信者ユーザーのアクセストークンを使用する
- プッシュルールの `sender` をボットユーザーの完全な MXID と照合する
- 受信者アカウントには、すでに正常に動作するプッシャーが必要。静かなプレビュールールは、通常の Matrix プッシュ配信が正常な場合にのみ機能する

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
    確定済みプレビューマーカーと、送信者としてのボット MXID に一致するルールをインストールします。

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
    - `openclaw-finalized-preview-botname`: 受信者ごと、ボットごとに一意なルール ID（パターン: `openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`: 受信者ではなく、OpenClaw ボットの MXID

  </Step>

  <Step title="確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

次に、ストリーミング応答をテストします。静かなモードでは、ルームに通知を発生させない下書きプレビューが表示され、ブロックまたはターンの完了時に一度だけ通知されます。

  </Step>
</Steps>

後でルールを削除するには、受信者のトークンを使用して同じルール URL に `DELETE` を送信します。

## 複数ボットに関する注意事項

プッシュルールは `ruleId` をキーとします。同じ ID に対して `PUT` を再実行すると、単一のルールが更新されます。複数の OpenClaw ボットから同じ受信者に通知する場合は、送信者の照合条件が異なるルールをボットごとに1つ作成します。

ユーザー定義の新しい `override` ルールは、サーバーのデフォルト抑制ルールより前に挿入されるため、追加の順序指定パラメーターは不要です。このルールが影響するのは、その場で確定できるテキストのみのプレビュー編集だけです。メディア応答、古いプレビューへのフォールバック、Matrix のメンションを有効にする最終テキストは、代わりに通常の通知メッセージとして配信されます。

## ホームサーバーに関する注意事項

<AccordionGroup>
  <Accordion title="Synapse">
    `homeserver.yaml` に特別な変更を加える必要はありません。通常の Matrix 通知がすでにこのユーザーに届いている場合、主なセットアップ手順は、受信者のトークンを使用した上記の `pushrules` 呼び出しです。

    リバースプロキシまたはワーカーの背後で Synapse を実行している場合は、`/_matrix/client/.../pushrules/` が Synapse に正しく到達することを確認してください。プッシュ配信はメインプロセス、または `synapse.app.pusher`／設定済みのプッシャーワーカーによって処理されるため、それらが正常に動作していることを確認してください。

    このルールでは、`event_property_is` プッシュルール条件（MSC3758、プッシュルール v1.10）を使用します。これは2023年に Synapse に追加されました。それより古い Synapse リリースでは、`PUT pushrules/...` 呼び出しは受け入れられますが、条件には一切一致せず、そのことも通知されません。確定済みプレビューの編集時に通知が届かない場合は、Synapse をアップグレードしてください。

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse と同じ手順です。確定済みプレビューマーカーに関する Tuwunel 固有の設定は必要ありません。

    ユーザーが別のデバイスでアクティブな間に通知が届かなくなる場合は、`suppress_push_when_active` が有効になっているか確認してください。Tuwunel は1.4.2（2025年9月）でこのオプションを追加しました。このオプションにより、1台のデバイスがアクティブな間、他のデバイスへのプッシュ通知を意図的に抑制できます。

  </Accordion>
</AccordionGroup>

## 関連項目

- [Matrix チャンネルのセットアップ](/ja-JP/channels/matrix)
- [ストリーミングの概念](/ja-JP/concepts/streaming)
