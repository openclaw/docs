---
read_when:
    - セルフホスト型SynapseまたはTuwunel向けにMatrixの静かなストリーミングを設定する方法
    - ユーザーは、すべてのプレビュー編集ではなく、完了したブロックでのみ通知を受け取りたいと考えています
summary: 静かな確定済みプレビュー編集に対する受信者ごとのMatrixプッシュルール
title: 静かなプレビューに対するMatrixプッシュルール
x-i18n:
    generated_at: "2026-04-23T15:00:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbfdf2552ca352858d4e8d03a2a0f5f3b420d33b01063c111c0335c0229f0534
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

# 静かなプレビューに対するMatrixプッシュルール

`channels.matrix.streaming` が `"quiet"` の場合、OpenClaw は単一のプレビューイベントをその場で編集し、確定した編集にカスタムのコンテンツフラグを付けます。Matrixクライアントが最終編集時にのみ通知するには、ユーザーごとのプッシュルールがそのフラグに一致する必要があります。このページは、Matrixをセルフホストしていて、受信者アカウントごとにそのルールをインストールしたい運用者向けです。

標準のMatrix通知動作だけが必要な場合は、`streaming: "partial"` を使うか、ストリーミングをオフのままにしてください。[Matrixチャネルの設定](/ja-JP/channels/matrix#streaming-previews)を参照してください。

## 前提条件

- recipient user = 通知を受け取る人
- bot user = 返信を送信するOpenClaw Matrixアカウント
- 以下のAPI呼び出しでは recipient user のアクセストークンを使用する
- プッシュルール内の `sender` は bot user の完全なMXID に一致させる
- recipient アカウントには、すでに動作する pusher が存在している必要があります。静かなプレビュールールは、通常のMatrixプッシュ配信が正常に機能している場合にのみ動作します

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
    可能であれば既存のクライアントセッショントークンを再利用してください。新しく発行するには、次を実行します。

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

pusher が返ってこない場合は、続行する前にこのアカウントの通常のMatrixプッシュ配信を修正してください。

  </Step>

  <Step title="override プッシュルールをインストールする">
    OpenClaw は、確定したテキストのみのプレビュー編集に `content["com.openclaw.finalized_preview"] = true` を付けます。このマーカーと bot MXID を送信者として一致させるルールをインストールしてください。

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

    実行前に以下を置き換えてください。

    - `https://matrix.example.org`: あなたのホームサーバーのベースURL
    - `$USER_ACCESS_TOKEN`: recipient user のアクセストークン
    - `openclaw-finalized-preview-botname`: 受信者ごと・bot ごとに一意な rule ID（パターン: `openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`: recipient ではなく、あなたのOpenClaw bot のMXID

  </Step>

  <Step title="確認する">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

その後、ストリーミング返信をテストしてください。quiet モードでは、ルームには静かな下書きプレビューが表示され、ブロックまたはターンの完了時に一度だけ通知されます。

  </Step>
</Steps>

後でルールを削除するには、recipient のトークンを使って同じルールURL に対して `DELETE` してください。

## 複数botに関する注意

プッシュルールは `ruleId` によって識別されます。同じID に対して `PUT` を再実行すると、単一のルールが更新されます。同じ recipient に複数のOpenClaw bot が通知する場合は、送信者一致条件が異なる bot ごとに1つのルールを作成してください。

新しいユーザー定義の `override` ルールは、デフォルトの抑制ルールより前に挿入されるため、追加の順序パラメーターは不要です。このルールが影響するのは、その場で確定可能なテキストのみのプレビュー編集だけです。メディアのフォールバックや古いプレビューのフォールバックでは、通常のMatrix配信が使われます。

## ホームサーバーに関する注意

<AccordionGroup>
  <Accordion title="Synapse">
    特別な `homeserver.yaml` の変更は不要です。通常のMatrix通知がすでにこのユーザーに届いている場合、主な設定手順は受信者トークンと上記の `pushrules` 呼び出しです。

    Synapse をリバースプロキシや workers の背後で運用している場合は、`/_matrix/client/.../pushrules/` が正しくSynapse に到達することを確認してください。プッシュ配信はメインプロセスまたは `synapse.app.pusher` / 設定済みの pusher workers によって処理されるため、それらが正常であることを確認してください。

  </Accordion>

  <Accordion title="Tuwunel">
    Synapse と同じフローで、確定済みプレビューマーカーのためのTuwunel固有設定は不要です。

    ユーザーが別のデバイスでアクティブなときに通知が消える場合は、`suppress_push_when_active` が有効になっていないか確認してください。Tuwunel は 1.4.2（2025年9月）でこのオプションを追加しており、1つのデバイスがアクティブな間、他のデバイスへのプッシュを意図的に抑制することがあります。

  </Accordion>
</AccordionGroup>

## 関連

- [Matrixチャネルの設定](/ja-JP/channels/matrix)
- [ストリーミングの概念](/ja-JP/concepts/streaming)
