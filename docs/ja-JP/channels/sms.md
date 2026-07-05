---
read_when:
    - OpenClaw を Twilio 経由で SMS に接続したい
    - SMS Webhook または許可リストのセットアップが必要です
summary: Twilio SMS チャネルのセットアップ、アクセス制御、Webhook 設定
title: SMS
x-i18n:
    generated_at: "2026-07-05T11:06:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee82f9d5a18309e1ccdf341fb78440926f8f2c4bbd00249ad4ab5ce4532c61d
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw は Twilio の電話番号または Messaging Service を通じて SMS を受信および送信します。Gateway は受信用 Webhook ルート（デフォルトは `/webhooks/sms`）を登録し、デフォルトで Twilio リクエスト署名を検証し、Twilio の Messages API 経由で返信を送信します。

状態: 公式Plugin、別途インストール。テキストのみ: MMS/メディアなし、ダイレクトメッセージのみ。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ja-JP/channels/pairing">
    SMS のデフォルト DM ポリシーはペアリングです。
  </Card>
  <Card title="Gateway security" icon="shield" href="/ja-JP/gateway/security">
    Webhook の公開範囲と送信者アクセス制御を確認します。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復プレイブック。
  </Card>
</CardGroup>

## 始める前に

必要なもの:

- `openclaw plugins install @openclaw/sms` でインストールした公式 SMS Plugin。
- SMS 対応の電話番号を持つ Twilio アカウント、または Twilio Messaging Service。
- Twilio Account SID と Auth Token。
- OpenClaw Gateway に到達する公開 HTTPS URL。
- 送信者ポリシーの選択: 私的利用には `pairing`（デフォルト）、事前承認済み電話番号には `allowlist`、意図的に公開する SMS アクセスの場合のみ `open`。

1 つの Twilio 番号は、両方の機能を持つ場合、SMS と [音声通話](/ja-JP/plugins/voice-call) の両方に使用できます。SMS Webhook と Voice Webhook は Twilio で別々に設定され、別々の Gateway パスを使用します。このページでは SMS Webhook のみを扱います。

## クイックセットアップ

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Create or choose a Twilio sender">
    Twilio で **Phone Numbers > Manage > Active numbers** を開き、SMS 対応番号を選択します。以下を保存します。

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
    Twilio 電話番号設定で **Messaging** を開き、**A message comes in** を次のように設定します。

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST` を使用します。デフォルトのローカルパスは `/webhooks/sms` です。別のルートが必要な場合は `channels.sms.webhookPath` を変更します。

  </Step>

  <Step title="Expose the exact SMS webhook path">
    公開 URL は SMS パスを Gateway プロセス（デフォルトポート `18789`）へルーティングする必要があります。ローカルテストに Tailscale Funnel を使用する場合は、`/webhooks/sms` を明示的に公開します。

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    音声通話と SMS は別々の Webhook パスを使用します。同じ Twilio 番号が両方を処理する場合は、Twilio とトンネルの両方で両方のルートを設定したままにします。

  </Step>

  <Step title="Start the Gateway and approve first sender">

```bash
openclaw gateway
```

Twilio 番号にテキストメッセージを送信します。最初のメッセージでペアリングリクエストが作成されます。承認します。

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>
</Steps>

## 設定例

すべてのキーは `channels.sms` 配下（アカウントごとは `channels.sms.accounts.<id>` 配下）にあります。

| キー                                    | デフォルト    | 目的                                                                  |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | チャンネル/アカウントを有効または無効にします。                              |
| `accountSid`                            | —               | Twilio Account SID（`AC...`）。                                       |
| `authToken`                             | —               | Twilio Auth Token。平文文字列または SecretRef。                   |
| `fromNumber`                            | —               | E.164 送信元番号。                                                |
| `messagingServiceSid`                   | —               | `fromNumber` が解決されない場合に使用される Messaging Service SID（`MG...`）。 |
| `defaultTo`                             | —               | 送信フローが明示的なターゲットを省略した場合のデフォルト宛先。      |
| `webhookPath`                           | `/webhooks/sms` | 受信 Twilio Webhook 用の Gateway HTTP パス。                      |
| `publicWebhookUrl`                      | —               | Twilio に設定される公開 URL。署名検証に必要。 |
| `dangerouslyDisableSignatureValidation` | `false`         | `X-Twilio-Signature` チェックをスキップします。ローカルトンネルテスト専用。        |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open`、または `disabled`。                      |
| `allowFrom`                             | `[]`            | E.164 の許可済み送信者番号、または `dmPolicy: "open"` と併用する `"*"`。  |
| `textChunkLimit`                        | `1500`          | 送信 SMS チャンクあたりの最大文字数。                          |
| `accounts`, `defaultAccount`            | —               | 複数アカウントのマップとデフォルトアカウント ID。                           |

### 設定ファイル

チャンネル定義を Gateway 設定と一緒に扱いたい場合は、設定ファイルセットアップを使用します。

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

環境変数はデフォルトアカウントのみに適用されます。設定値は env 値より優先されます。

| 変数                                            | 対応先                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom`（カンマ区切り）                      |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

その後、設定でチャンネルを有効化します。

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

### SecretRef auth token

`authToken` には SecretRef（`source: "env" | "file" | "exec"`）を指定できます。Gateway が平文設定を保存する代わりに、OpenClaw secrets ランタイムから Twilio Auth Token を解決する必要がある場合に使用します。

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

### Messaging Service 送信元

Twilio に Messaging Service 経由で送信元を選択させる場合は、`fromNumber` の代わりに `messagingServiceSid` を使用します。

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

設定と env の解決後に `fromNumber` と `messagingServiceSid` の両方が存在する場合は、`fromNumber` が使用されます。

### デフォルト送信先ターゲット

自動化またはエージェント起点の配信で、送信フローが明示的なターゲットを省略した場合にデフォルト宛先を持たせるには、`defaultTo` を設定します。

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

- `pairing`（デフォルト）: 不明な送信者にはペアリングコードが返されます。`openclaw pairing approve sms <CODE>` で承認します。
- `allowlist`: `allowFrom` 内の送信者のみ処理されます。空の `allowFrom` はすべての送信者を拒否します（Gateway は起動時警告をログに記録します）。
- `open`: 設定検証では `allowFrom` に `"*"` が含まれている必要があります。ワイルドカードがない場合は、一覧にある番号のみがチャットできます。
- `disabled`: すべての受信 DM が破棄されます。

`allowFrom` エントリは `+15551234567` のような E.164 電話番号にする必要があります。`sms:` と `twilio-sms:` プレフィックスは受け入れられ、正規化されます。プライベートアシスタントでは、明示的な電話番号を指定した `dmPolicy: "allowlist"` を推奨します。

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

## SMS の送信

SMS チャンネルを選択している場合、ターゲットには裸の E.164 番号または `sms:` プレフィックスを指定できます。

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

チャンネル選択が暗黙的な場合、`twilio-sms:` プレフィックスは、このチャンネルを選択します。iMessage が自身のターゲット用にキャリア SMS 配信を選ぶために使用する `sms:` サービスプレフィックスは奪いません。

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI には明示的な `--target` が必要です。`defaultTo` は、チャンネル設定からターゲットを解決できる自動化およびエージェント起点の配信パス用です。

受信 SMS 会話からのエージェント返信は、設定済みの Twilio 送信元を通じて自動的に送信者へ返送されます。

SMS 出力はプレーンテキストです。OpenClaw は Markdown を除去し、フェンス付きコードブロックを平坦化し、リンクを `label (url)` として書き換え、長い返信を Twilio 経由で送信する前に最大 `textChunkLimit` 文字（デフォルト 1500）のチャンクに分割します。

## セットアップの検証

Gateway の起動後:

1. Gateway ログに SMS Webhook ルートが表示されていることを確認します。
2. Twilio 側のプローブを実行します（設定済みの Twilio Webhook URL/メソッドと、直近のインバウンドエラーを確認します）。

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 自分の電話から Twilio 番号へ SMS を送信します。
4. `openclaw pairing list sms` を実行します。
5. `openclaw pairing approve sms <CODE>` でペアリングコードを承認します。
6. もう一度 SMS を送信し、エージェントが返信することを確認します。

アウトバウンドのみのテストには、次を使用します。

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS iMessage/SMS からのエンドツーエンドテスト

Messages 経由でキャリア SMS を送信できる Mac では、電話に触れずに `imsg` を使って送信側を駆動できます。

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

最初のメッセージでペアリングリクエストが作成されるはずです。2 通目のメッセージでは、Twilio 経由でエージェントの返信を受け取るはずです。

## Webhook セキュリティ

デフォルトでは、OpenClaw は `publicWebhookUrl` と `authToken` を使用して `X-Twilio-Signature` を検証します。`publicWebhookUrl` は、スキーム、ホスト、パス、クエリ文字列を含め、Twilio に設定された URL とバイト単位で一致させてください。

Webhook ルートは、署名検証とは独立して、次も強制します。

- `POST` のみ。
- 送信元 IP ごとに 1 分あたり 30 リクエストのレート制限（超過時は HTTP 429）。
- ペイロードの `AccountSid` は設定済みの `accountSid` と一致する必要があります（一致しない場合は HTTP 403）。
- 再送された `MessageSid` 値は 10 分間重複排除されます。
- 32 KB を超えるリクエストボディは拒否されます。

ローカルトンネルのテストでのみ、次を設定できます。

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

各アカウントは個別の `webhookPath` を使用する必要があります。Gateway は、別のアカウントがすでに所有しているパスの Webhook ルート登録を拒否します。`TWILIO_*`/`SMS_*` 環境フォールバックはデフォルトアカウントにのみ適用されます。どのアカウントをデフォルトにするかを変更するには `defaultAccount` を設定します。

## トラブルシューティング

### Twilio が 403 を返す、または OpenClaw が Webhook を拒否する

`publicWebhookUrl` が、スキーム、ホスト、パス、クエリ文字列を含め、Twilio に設定された URL と完全に一致していることを確認します。Twilio は公開 URL 文字列に署名するため、プロキシによる書き換えや別のホスト名により署名検証が失敗することがあります。

`Invalid account` を伴う 403 は、インバウンドペイロードの `AccountSid` が設定済みの `accountSid` と一致しないことを意味します。Webhook が、その番号を所有するアカウントを指していることを確認してください。

### ペアリングリクエストが表示されない

Twilio 番号の **Messaging** Webhook URL とメソッドを確認します。SMS Webhook URL を指し、`POST` を使用する必要があります。また、Gateway が公開インターネットまたはトンネル経由で到達可能であることも確認します。

Twilio メッセージログにエラー `11200` が表示される場合、Twilio はインバウンド SMS を受け付けましたが Webhook に到達できませんでした。次を確認してください。

- Twilio **Messaging > A message comes in** が `publicWebhookUrl` を指している。
- メソッドが `POST` である。
- トンネルまたはリバースプロキシが正確な `webhookPath` を公開している。Tailscale Funnel の場合は `tailscale funnel status` を実行し、`/webhooks/sms` が一覧にあることを確認します。
- `publicWebhookUrl` が Twilio の送信するものと同じスキーム、ホスト、パス、クエリ文字列を使用しており、署名検証で署名済み URL を再現できる。

`openclaw channels status --channel sms --probe` は、Twilio Webhook 設定の不一致と直近の `11200` エラーの両方を表示します。

### アウトバウンド送信に失敗する

`accountSid`、`authToken`、および `fromNumber` または `messagingServiceSid` のいずれかが解決されていることを確認します。Twilio のトライアルアカウントを使用している場合、アウトバウンド SMS を送信する前に、宛先番号を Twilio で検証する必要がある場合があります。

### メッセージは届くがエージェントが応答しない

`dmPolicy` と `allowFrom` を確認します。デフォルトの `pairing` ポリシーでは、通常のエージェントターンが処理される前に、送信者が承認されている必要があります。
