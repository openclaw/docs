---
read_when:
    - Twilio を介して OpenClaw を SMS に接続する場合
    - SMS Webhook または許可リストの設定が必要です
summary: Twilio SMS チャネルのセットアップ、アクセス制御、Webhook の設定
title: SMS
x-i18n:
    generated_at: "2026-07-12T14:19:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw は、Twilio の電話番号または Messaging Service を介して SMS を受信および送信します。Gateway は受信用 Webhook ルート（デフォルトは `/webhooks/sms`）を登録し、デフォルトで Twilio リクエスト署名を検証して、Twilio の Messages API を介して返信を送信します。

ステータス: 公式 Plugin、別途インストール。テキストのみ: MMS/メディア非対応、ダイレクトメッセージのみ。

<CardGroup cols={3}>
  <Card title="ペアリング" icon="link" href="/ja-JP/channels/pairing">
    SMS のデフォルトの DM ポリシーはペアリングです。
  </Card>
  <Card title="Gateway のセキュリティ" icon="shield" href="/ja-JP/gateway/security">
    Webhook の公開範囲と送信者のアクセス制御を確認します。
  </Card>
  <Card title="チャンネルのトラブルシューティング" icon="wrench" href="/ja-JP/channels/troubleshooting">
    チャンネル横断の診断と修復手順です。
  </Card>
</CardGroup>

## 始める前に

必要なもの:

- `openclaw plugins install @openclaw/sms` でインストールした公式 SMS Plugin。
- SMS 対応の電話番号、または Twilio Messaging Service を持つ Twilio アカウント。
- Twilio Account SID と Auth Token。
- OpenClaw Gateway に到達する公開 HTTPS URL。
- 送信者ポリシーの選択: 個人利用には `pairing`（デフォルト）、事前承認済みの電話番号には `allowlist`、意図的に公開する SMS アクセスに限り `open`。

1 つの Twilio 番号が両方の機能に対応していれば、SMS と [音声通話](/ja-JP/plugins/voice-call) の両方に使用できます。SMS Webhook と音声 Webhook は Twilio で個別に設定され、別々の Gateway パスを使用します。このページでは SMS Webhook のみを扱います。

## クイックセットアップ

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Twilio の送信元を作成または選択する">
    Twilio で **Phone Numbers > Manage > Active numbers** を開き、SMS 対応の番号を選択します。以下を保存します:

    - Account SID（例: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
    - Auth Token
    - 送信元の電話番号（例: `+15551234567`）

    固定の送信元番号ではなく Messaging Service を使用する場合は、Messaging Service SID（例: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）を保存します。

  </Step>

  <Step title="SMS チャンネルを設定する">

以下を `sms.patch.json5` として保存し、プレースホルダーを変更します:

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

適用します:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Twilio を Gateway Webhook に向ける">
    Twilio の電話番号設定で **Messaging** を開き、**A message comes in** を次のように設定します:

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST` を使用します。デフォルトのローカルパスは `/webhooks/sms` です。別のルートが必要な場合は `channels.sms.webhookPath` を変更します。

  </Step>

  <Step title="SMS Webhook の正確なパスを公開する">
    公開 URL は、SMS パスを Gateway プロセス（デフォルトポート `18789`）にルーティングする必要があります。ローカルテストに Tailscale Funnel を使用する場合は、`/webhooks/sms` を明示的に公開します:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    音声通話と SMS は別々の Webhook パスを使用します。同じ Twilio 番号で両方を処理する場合は、Twilio とトンネルの両方で両方のルートを設定したままにします。

  </Step>

  <Step title="Gateway を起動して最初の送信者を承認する">

```bash
openclaw gateway
```

Twilio 番号にテキストメッセージを送信します。最初のメッセージでペアリングリクエストが作成されます。次のコマンドで承認します:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>
</Steps>

## 設定例

すべてのキーは `channels.sms` 配下（アカウントごとの設定は `channels.sms.accounts.<id>` 配下）に置きます:

| キー                                    | デフォルト      | 用途                                                                    |
| --------------------------------------- | --------------- | ----------------------------------------------------------------------- |
| `enabled`                               | `true`          | チャンネルまたはアカウントを有効または無効にします。                    |
| `accountSid`                            | —               | Twilio Account SID（`AC...`）。                                         |
| `authToken`                             | —               | Twilio Auth Token。プレーンテキスト文字列または SecretRef。              |
| `fromNumber`                            | —               | E.164 形式の送信元番号。                                                 |
| `messagingServiceSid`                   | —               | `fromNumber` が解決されない場合に使用する Messaging Service SID（`MG...`）。 |
| `defaultTo`                             | —               | 送信フローで明示的な宛先を省略した場合のデフォルトの送信先。             |
| `webhookPath`                           | `/webhooks/sms` | Twilio からの受信 Webhook に使用する Gateway HTTP パス。                 |
| `publicWebhookUrl`                      | —               | Twilio に設定する公開 URL。署名検証に必要です。                           |
| `dangerouslyDisableSignatureValidation` | `false`         | `X-Twilio-Signature` の確認を省略します。ローカルトンネルのテスト専用です。 |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open`、または `disabled`。                      |
| `allowFrom`                             | `[]`            | E.164 形式で許可する送信者番号。または `dmPolicy: "open"` とともに `"*"`。 |
| `textChunkLimit`                        | `1500`          | 送信 SMS チャンクあたりの最大文字数。                                    |
| `accounts`, `defaultAccount`            | —               | 複数アカウントのマップとデフォルトのアカウント ID。                      |

### 設定ファイル

チャンネル定義を Gateway 設定とともに移行できるようにする場合は、設定ファイルによるセットアップを使用します。

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

環境変数はデフォルトアカウントにのみ適用されます。設定値は環境変数の値より優先されます。

| 変数                                            | 対応先                                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER`（別名 `TWILIO_SMS_FROM`） | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom`（カンマ区切り）                        |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation`（`"true"`） |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

次に、設定でチャンネルを有効にします。

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

### SecretRef 認証トークン

`authToken` には SecretRef（`source: "env" | "file" | "exec"`）を指定できます。平文の設定を保存する代わりに、Gateway が OpenClaw のシークレットランタイムから Twilio Auth Token を解決する必要がある場合に使用します。

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

参照先の環境変数またはシークレットプロバイダーは、Gateway ランタイムから参照できる必要があります。ホストの環境変数を変更した後は、管理対象の Gateway プロセスを再起動してください。

### Messaging Service の送信元

Twilio が Messaging Service を通じて送信元を選択する必要がある場合は、`fromNumber` の代わりに `messagingServiceSid` を使用します。

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

### デフォルトの送信先

自動化またはエージェント主導の配信で、送信フローに明示的な送信先が指定されていない場合のデフォルト宛先を設定するには、`defaultTo` を指定します。

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

`channels.sms.dmPolicy` は、SMS のダイレクトアクセスを制御します。

- `pairing`（デフォルト）: 未知の送信者にはペアリングコードが送信されます。`openclaw pairing approve sms <CODE>` で承認します。
- `allowlist`: `allowFrom` に含まれる送信者のみが処理されます。`allowFrom` が空の場合、すべての送信者が拒否されます（Gateway は起動時に警告をログに記録します）。
- `open`: 設定の検証では、`allowFrom` に `"*"` が含まれている必要があります。ワイルドカードがない場合、一覧に記載された番号のみがチャットできます。
- `disabled`: 受信したすべての DM が破棄されます。

`allowFrom` のエントリには、`+15551234567` のような E.164 電話番号を指定する必要があります。`sms:` および `twilio-sms:` プレフィックスも使用でき、正規化されます。プライベートアシスタントでは、明示的な電話番号を指定した `dmPolicy: "allowlist"` を推奨します。

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

SMS チャネルを選択した場合、ターゲットには E.164 形式の番号をそのまま指定するか、`sms:` プレフィックスを付けて指定できます。

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

チャネルの選択が暗黙的な場合、`twilio-sms:` プレフィックスを使用すると、このチャネルが選択されます。その際、iMessage が自身のターゲットで通信事業者の SMS 配信を選択するために使用する `sms:` サービスプレフィックスを奪うことはありません。

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI では、`--target` を明示的に指定する必要があります。`defaultTo` は、チャネル設定からターゲットを解決できる、自動化およびエージェントが開始する配信経路のためのものです。

受信 SMS の会話に対するエージェントの返信は、設定された Twilio の送信元を通じて、自動的に送信者へ返されます。

SMS の出力はプレーンテキストです。OpenClaw は Markdown を除去し、フェンス付きコードブロックを平坦化し、リンクを `label (url)` の形式に書き換え、長い返信を最大 `textChunkLimit` 文字（デフォルトは 1500）のチャンクに分割してから Twilio 経由で送信します。

## セットアップの確認

Gateway の起動後：

1. Gateway ログに SMS Webhook ルートが表示されていることを確認します。
2. Twilio 側のプローブを実行します（設定済みの Twilio Webhook URL/メソッドと、最近の受信エラーを確認します）。

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. 携帯電話から Twilio 番号に SMS を送信します。
4. `openclaw pairing list sms` を実行します。
5. `openclaw pairing approve sms <CODE>` でペアリングコードを承認します。
6. もう一度 SMS を送信し、エージェントから返信があることを確認します。

送信のみをテストする場合は、次を使用します。

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS の iMessage/SMS からのエンドツーエンドテスト

「メッセージ」を介して通信事業者の SMS を送信できる Mac では、携帯電話を操作せずに `imsg` を使用して送信側を駆動できます。

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

最初のメッセージでペアリングリクエストが作成されます。2 番目のメッセージでは、Twilio を介してエージェントからの返信を受信します。

## Webhook のセキュリティ

デフォルトでは、OpenClaw は `publicWebhookUrl` と `authToken` を使用して `X-Twilio-Signature` を検証します。`publicWebhookUrl` のエンドポイント部分は、スキーム、ホスト、パス、クエリ文字列を含め、Twilio に設定した URL とバイト単位で完全に一致させてください。Twilio の要件に従い、OpenClaw は署名の計算から Twilio の [接続オーバーライド](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides)フラグメント（`#...`）を除外します。

Webhook ルートでは、署名検証とは独立して、次の制約も適用されます。

- `POST` のみ。
- 送信元 IP ごとに 1 分あたり 30 リクエストのレート制限（超過時は HTTP 429）。
- ペイロードの `AccountSid` は、設定済みの `accountSid` と一致する必要があります（一致しない場合は HTTP 403）。
- 再送された `MessageSid` 値は 10 分間重複排除されます。
- 各 SMS アカウントの再送キャッシュには、有効なメッセージ SID が最大 10,000 件保持されます。すべてのスロットが有効な場合、そのアカウントへの新しい Webhook は、最も古いスロットの有効期限が切れるまで、HTTP 429 と `Retry-After` ヘッダーを返してフェイルクローズします。
- 32 KB を超えるリクエスト本文は拒否されます。

Twilio はデフォルトでは HTTP 429 を再試行せず、`Retry-After` のサポートも文書化していません。`#rp=4xx` および `#rp=all` 接続オーバーライドを使用すると 4xx の再試行が有効になりますが、Twilio は再試行トランザクション全体を 15 秒に制限するため、再送キャッシュのスロットが期限切れになる前に再試行が終了する可能性があります。失敗した配信を別のハンドラーで受信する必要がある場合は、フォールバック URL を設定してください。429 は信頼できるバックプレッシャーではなく、フェイルクローズによる拒否として扱ってください。

ローカルトンネルのテストに限り、次を設定できます。

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

公開 Gateway では署名検証を無効にしないでください。

## 複数アカウントの設定

複数の Twilio 番号を運用する場合は、`accounts` を使用します。

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

各アカウントでは異なる `webhookPath` を使用する必要があります。Gateway は、別のアカウントがすでに所有しているパスへの Webhook ルートの登録を拒否します。`TWILIO_*`/`SMS_*` 環境変数のフォールバックはデフォルトアカウントにのみ適用されます。デフォルトにするアカウントを変更するには、`defaultAccount` を設定してください。

## トラブルシューティング

### Twilio が 403 を返す、または OpenClaw が Webhook を拒否する

`publicWebhookUrl` が、スキーム、ホスト、パス、クエリ文字列を含め、Twilio に設定した URL と完全に一致していることを確認してください。Twilio は公開 URL 文字列に署名するため、プロキシによる書き換えや別名のホスト名によって署名検証が失敗する可能性があります。

`Invalid account` を伴う 403 は、受信ペイロードの `AccountSid` が設定済みの `accountSid` と一致していないことを意味します。Webhook が、その番号を所有するアカウントを参照していることを確認してください。

### ペアリングリクエストが表示されない

Twilio 番号の **Messaging** Webhook URL とメソッドを確認してください。SMS Webhook URL を参照し、`POST` を使用する必要があります。また、Gateway が公開インターネットまたはトンネル経由で到達可能であることも確認してください。

Twilio のメッセージログにエラー `11200` が表示されている場合、Twilio は受信 SMS を受け付けましたが、Webhook に到達できませんでした。次を確認してください。

- Twilio の **Messaging > A message comes in** が `publicWebhookUrl` を参照している。
- メソッドが `POST` である。
- トンネルまたはリバースプロキシが正確な `webhookPath` を公開している。Tailscale Funnel の場合は `tailscale funnel status` を実行し、`/webhooks/sms` が一覧に含まれていることを確認します。
- 署名検証で署名対象 URL を再現できるように、`publicWebhookUrl` が Twilio の送信時と同じスキーム、ホスト、パス、クエリ文字列を使用している。

`openclaw channels status --channel sms --probe` は、Twilio Webhook 設定の不一致と最近の `11200` エラーの両方を表示します。

### 送信に失敗する

`accountSid`、`authToken`、および `fromNumber` または `messagingServiceSid` のいずれかが解決されていることを確認してください。Twilio のトライアルアカウントを使用している場合、SMS を送信する前に、Twilio で宛先番号の検証が必要になることがあります。

### メッセージは届くがエージェントが応答しない

`dmPolicy` と `allowFrom` を確認してください。デフォルトの `pairing` ポリシーでは、通常のエージェントターンが処理される前に送信者を承認する必要があります。
