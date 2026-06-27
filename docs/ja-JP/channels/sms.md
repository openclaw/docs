---
read_when:
    - Twilio を通じて OpenClaw を SMS に接続したい
    - SMS Webhook または許可リストの設定が必要です
summary: Twilio SMS チャネルのセットアップ、アクセス制御、Webhook 設定
title: SMS
x-i18n:
    generated_at: "2026-06-27T10:42:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw は、Twilio の電話番号または Messaging Service を通じて SMS を受信および送信できます。Gateway は受信用 Webhook ルートを登録し、デフォルトで Twilio リクエスト署名を検証し、Twilio の Messages API を通じて返信を送信します。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    SMS のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="Gateway security" icon="shield" href="/ja-JP/gateway/security">
    Webhook の公開範囲と送信者アクセス制御を確認します。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## 始める前に

必要なもの:

- `openclaw plugins install @openclaw/sms` で公式 SMS Plugin がインストールされていること。
- SMS 対応の電話番号を持つ Twilio アカウント、または Twilio Messaging Service。
- Twilio Account SID と Auth Token。
- OpenClaw Gateway に到達する公開 HTTPS URL。
- 送信者ポリシーの選択: 私的利用には `pairing`、事前承認済みの電話番号には `allowlist`、意図的に公開する SMS アクセスにのみ `open`。

番号が両方の機能を持つ場合は、SMS と Voice Call の両方に 1 つの Twilio 番号を使用します。Twilio で SMS Webhook と Voice Webhook を別々に設定してください。このページでは SMS Webhook のみを扱います。

## クイックセットアップ

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Create or choose a Twilio sender">
    Twilio で **Phone Numbers > Manage > Active numbers** を開き、SMS 対応番号を選択します。次を保存します。

    - Account SID、例: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - 送信元電話番号、例: `+15551234567`

    固定の送信元番号ではなく Messaging Service を使用する場合は、Messaging Service SID を保存します。例: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`。

  </Step>

  <Step title="Configure the SMS channel">

これを `sms.patch.json5` として保存し、プレースホルダーを変更します。

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

適用します。

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Point Twilio at the Gateway webhook">
    Twilio の電話番号設定で **Messaging** を開き、**A message comes in** を次に設定します。

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST` を使用します。デフォルトのローカルパスは `/webhooks/sms` です。別のルートが必要な場合は `channels.sms.webhookPath` を変更します。

  </Step>

  <Step title="Expose the exact SMS webhook path">
    公開 URL は SMS パスを Gateway プロセスにルーティングする必要があります。ローカルテストに Tailscale Funnel を使用する場合は、`/webhooks/sms` を明示的に公開します。

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call と SMS は別々の Webhook パスを使用します。同じ Twilio 番号で両方を処理する場合は、Twilio とトンネルの両方で両方のルートを設定したままにします。

  </Step>

  <Step title="Start the Gateway and approve first sender">

```bash
openclaw gateway
```

Twilio 番号にテキストメッセージを送信します。最初のメッセージによりペアリングリクエストが作成されます。承認します。

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>
</Steps>

## 設定例

### 設定ファイル

チャネル定義を Gateway 設定と一緒に運びたい場合は、設定ファイルによるセットアップを使用します。

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### 環境変数

シークレットがホスト環境から提供される単一アカウントのデプロイでは、環境変数によるセットアップを使用します。

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

次に、設定でチャネルを有効にします。

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

`TWILIO_SMS_FROM` は `TWILIO_PHONE_NUMBER` のエイリアスとして受け入れられます。Twilio が Messaging Service から送信者を選択する必要がある場合は、電話番号の送信者の代わりに `TWILIO_MESSAGING_SERVICE_SID` を使用します。

### SecretRef 認証トークン

`authToken` には SecretRef を指定できます。プレーンテキストの設定を保存する代わりに、Gateway が OpenClaw シークレットランタイムから Twilio Auth Token を解決する必要がある場合に使用します。

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

参照される環境変数またはシークレットプロバイダーは、Gateway ランタイムから見える必要があります。ホスト環境変数を変更した後は、管理対象の Gateway プロセスを再起動してください。

### Allowlist のみのプライベート番号

既知の電話番号だけがエージェントと会話できるようにする場合は、`allowlist` を使用します。

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

### Messaging Service 送信者

Twilio が Messaging Service を通じて送信者を選択する必要がある場合は、`fromNumber` の代わりに `messagingServiceSid` を使用します。

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

設定と環境変数の解決後に `fromNumber` と `messagingServiceSid` の両方が存在する場合は、`fromNumber` が使用されます。

### デフォルト送信先

送信フローで明示的な送信先が省略された場合に、自動化またはエージェント開始の配信でデフォルトの送信先を持たせるには、`defaultTo` を設定します。

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## アクセス制御

`channels.sms.dmPolicy` は直接 SMS アクセスを制御します。

- `pairing`（デフォルト）
- `allowlist`（`allowFrom` に少なくとも 1 つの送信者が必要）
- `open`（`allowFrom` に `"*"` を含める必要あり）
- `disabled`

`allowFrom` エントリは `+15551234567` のような E.164 電話番号にしてください。`sms:` プレフィックスは受け入れられ、正規化されます。プライベートアシスタントでは、明示的な電話番号を指定した `dmPolicy: "allowlist"` を推奨します。

## SMS の送信

送信 SMS ターゲットは、SMS チャネルを選択したうえで `sms:` サービスプレフィックスを使用します。

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

チャネル選択が暗黙的な場合、`twilio-sms:+15551234567` は、iMessage が使用する既存のチャネル所有 `sms:` サービスプレフィックスを奪わずに、このチャネルを選択します。

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI では明示的な `--target` が必要です。`defaultTo` は、チャネル設定からターゲットを解決できる自動化およびエージェント開始の配信パス向けです。

受信 SMS 会話からのエージェント返信は、設定済みの Twilio 送信者を通じて自動的に送信者へ返されます。

SMS 出力はプレーンテキストです。OpenClaw は Markdown を取り除き、フェンス付きコードブロックを平坦化し、読みやすいリンクを保持し、長い返信を Twilio 経由で送信する前に分割します。

## セットアップの検証

Gateway が起動した後:

1. Gateway ログに SMS Webhook ルートが表示されていることを確認します。
2. Twilio 側のプローブを実行します。

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 自分の電話から Twilio 番号に SMS を送信します。
4. `openclaw pairing list sms` を実行します。
5. `openclaw pairing approve sms <CODE>` でペアリングコードを承認します。
6. もう一度 SMS を送信し、エージェントが返信することを確認します。

送信のみのテストには、次を使用します。

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS iMessage/SMS からのエンドツーエンドテスト

Messages 経由でキャリア SMS を送信できる Mac では、電話に触れずに `imsg` を使用して送信者側を操作できます。

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

最初のメッセージでペアリングリクエストが作成されるはずです。2 番目のメッセージでは、Twilio 経由でエージェント返信を受信するはずです。

## Webhook セキュリティ

デフォルトでは、OpenClaw は `publicWebhookUrl` と `authToken` を使用して `X-Twilio-Signature` を検証します。`publicWebhookUrl` は、スキーム、ホスト、パス、クエリ文字列を含め、Twilio に設定された URL とバイト単位で一致させてください。

ローカルトンネルテストの場合に限り、次を設定できます。

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

公開 Gateway では署名検証の無効化を使用しないでください。

## マルチアカウント設定

複数の Twilio 番号を運用する場合は `accounts` を使用します。

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

各アカウントは個別の `webhookPath` を使用してください。

## トラブルシューティング

### Twilio が 403 を返す、または OpenClaw が Webhook を拒否する

`publicWebhookUrl` が、スキーム、ホスト、パス、クエリ文字列を含め、Twilio に設定された URL と正確に一致していることを確認します。Twilio は公開 URL 文字列に署名するため、プロキシによる書き換えや別のホスト名により署名検証が失敗する可能性があります。

### ペアリングリクエストが表示されない

Twilio 番号の **Messaging** Webhook URL とメソッドを確認します。SMS Webhook URL を指し、`POST` を使用している必要があります。また、Gateway が公開インターネットまたはトンネル経由で到達可能であることも確認してください。

Twilio メッセージログにエラー `11200` が表示される場合、Twilio は受信 SMS を受け入れましたが、Webhook に到達できませんでした。次を確認します。

- Twilio の **Messaging > A message comes in** が `publicWebhookUrl` を指している。
- メソッドが `POST` である。
- トンネルまたはリバースプロキシが正確な `webhookPath` を公開している。Tailscale Funnel の場合は `tailscale funnel status` を実行し、`/webhooks/sms` が一覧に表示されていることを確認する。
- `publicWebhookUrl` が Twilio の送信するものと同じスキーム、ホスト、パス、クエリ文字列を使用しているため、署名検証で署名済み URL を再現できる。

### 送信が失敗する

`accountSid`、`authToken`、および `fromNumber` または `messagingServiceSid` のいずれかが解決されていることを確認します。Twilio のトライアルアカウントを使用している場合、SMS を送信する前に、送信先番号を Twilio で検証する必要がある場合があります。

### メッセージは届くがエージェントが応答しない

`dmPolicy` と `allowFrom` を確認します。デフォルトの `pairing` ポリシーでは、通常のエージェントターンが処理される前に送信者が承認されている必要があります。
