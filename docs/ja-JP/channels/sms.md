---
read_when:
    - Twilio を介して OpenClaw を SMS に接続する場合
    - SMS Webhook または許可リストの設定が必要です
summary: Twilio SMS チャネルのセットアップ、アクセス制御、Webhook の設定
title: SMS
x-i18n:
    generated_at: "2026-07-16T11:27:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw は、Twilio の電話番号または Messaging Service を介して SMS を送受信します。Gateway は受信用 Webhook ルート（デフォルトは `/webhooks/sms`）を登録し、デフォルトで Twilio リクエストの署名を検証して、Twilio の Messages API を介して返信を送信します。

ステータス: 公式 Plugin。別途インストールが必要です。テキストのみ対応し、MMS/メディアには対応していません。ダイレクトメッセージのみです。

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

以下が必要です。

- `openclaw plugins install @openclaw/sms` でインストールした公式 SMS Plugin。
- SMS 対応の電話番号、または Twilio Messaging Service を持つ Twilio アカウント。
- Twilio Account SID と Auth Token。
- OpenClaw Gateway に到達する公開 HTTPS URL。
- 送信者ポリシーの選択。個人利用には `pairing`（デフォルト）、事前承認した電話番号には `allowlist`、意図的に公開する SMS アクセスにのみ `open` を使用します。

1 つの Twilio 番号が両方の機能に対応している場合、SMS と [音声通話](/ja-JP/plugins/voice-call) の両方で使用できます。SMS Webhook と音声 Webhook は Twilio で個別に設定され、別々の Gateway パスを使用します。このページでは SMS Webhook のみを扱います。

## クイックセットアップ

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Twilio の送信元を作成または選択する">
    Twilio で **Phone Numbers > Manage > Active numbers** を開き、SMS 対応の番号を選択します。以下を保存します。

    - Account SID（例: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）
    - Auth Token
    - 送信元電話番号（例: `+15551234567`）

    固定の送信元番号ではなく Messaging Service を使用する場合は、Messaging Service SID（例: `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）を保存します。

  </Step>

  <Step title="SMS チャンネルを設定する">

以下を `sms.patch.json5` として保存し、プレースホルダーを変更します。

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

  <Step title="Twilio から Gateway Webhook を参照する">
    Twilio の電話番号設定で **Messaging** を開き、**A message comes in** を次の値に設定します。

```text
https://gateway.example.com/webhooks/sms
```

    HTTP `POST` を使用します。デフォルトのローカルパスは `/webhooks/sms` です。別のルートが必要な場合は `channels.sms.webhookPath` を変更します。

  </Step>

  <Step title="SMS Webhook の正確なパスを公開する">
    公開 URL では、SMS パスを Gateway プロセス（デフォルトポート `18789`）にルーティングする必要があります。ローカルテストに Tailscale Funnel を使用する場合は、`/webhooks/sms` を明示的に公開します。

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    音声通話と SMS は別々の Webhook パスを使用します。同じ Twilio 番号で両方を処理する場合は、Twilio とトンネルの両方で両方のルートを設定したままにしてください。

  </Step>

  <Step title="Gateway を起動し、最初の送信者を承認する">

```bash
openclaw gateway
```

Twilio 番号にテキストメッセージを送信します。最初のメッセージによってペアリング要求が作成されます。次のコマンドで承認します。

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    ペアリングコードは 1 時間後に期限切れになります。

  </Step>
</Steps>

## 設定例

すべてのキーは `channels.sms` 配下（アカウントごとのキーは `channels.sms.accounts.<id>` 配下）に置きます。

| キー                                     | デフォルト         | 用途                                                             |
| --------------------------------------- | --------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | チャンネルまたはアカウントを有効化または無効化します。                              |
| `accountSid`                            | —               | Twilio Account SID（`AC...`）。                                       |
| `authToken`                             | —               | Twilio Auth Token。プレーンテキスト文字列または SecretRef。                   |
| `fromNumber`                            | —               | E.164 形式の送信元番号。                                                |
| `messagingServiceSid`                   | —               | `fromNumber` が解決されない場合に使用する Messaging Service SID（`MG...`）。 |
| `defaultTo`                             | —               | 送信フローで明示的な宛先を省略した場合のデフォルト宛先。      |
| `webhookPath`                           | `/webhooks/sms` | Twilio からの受信 Webhook に使用する Gateway HTTP パス。                      |
| `publicWebhookUrl`                      | —               | Twilio に設定する公開 URL。署名検証に必要です。 |
| `dangerouslyDisableSignatureValidation` | `false`         | `X-Twilio-Signature` チェックを省略します。ローカルトンネルでのテスト専用です。        |
| `dmPolicy`                              | `"pairing"`     | `pairing`、`allowlist`、`open`、または `disabled`。                      |
| `allowFrom`                             | `[]`            | E.164 形式で許可する送信者番号。または `dmPolicy: "open"` と組み合わせた `"*"`。  |
| `textChunkLimit`                        | `1500`          | 送信 SMS の各チャンクで許可する最大文字数。                          |
| `accounts`、`defaultAccount`            | —               | 複数アカウントのマップとデフォルトアカウント ID。                           |

### 設定ファイル

チャンネル定義を Gateway の設定と一緒に管理する場合は、設定ファイルを使用します。

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

環境変数はデフォルトアカウントのみに適用されます。設定値は環境変数の値より優先されます。

| 変数                                        | 対応先                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER`（別名 `TWILIO_SMS_FROM`） | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom`（カンマ区切り）                      |
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

### SecretRef Auth Token

`authToken` には SecretRef（`source: "env" | "file" | "exec"`）を指定できます。プレーンテキストの設定を保存する代わりに、OpenClaw のシークレットランタイムから Twilio Auth Token を Gateway に解決させる場合に使用します。

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

参照される環境変数またはシークレットプロバイダーは、Gateway ランタイムからアクセスできる必要があります。ホストの環境変数を変更した後は、管理対象の Gateway プロセスを再起動してください。

### Messaging Service の送信元

Twilio が Messaging Service を介して送信元を選択する場合は、`fromNumber` の代わりに `messagingServiceSid` を使用します。

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

送信フローで明示的な宛先が省略された場合に、自動化またはエージェントが開始する配信でデフォルト宛先を使用するには、`defaultTo` を設定します。

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

`channels.sms.dmPolicy` は SMS の直接アクセスを制御します。

- `pairing`（デフォルト）: 不明な送信者にはペアリングコードが送られます。`openclaw pairing approve sms <CODE>` で承認します。
- `allowlist`: `allowFrom` に含まれる送信者のみを処理します。`allowFrom` が空の場合はすべての送信者を拒否します（Gateway は起動時に警告をログに記録します）。
- `open`: 設定検証では、`allowFrom` に `"*"` を含める必要があります。ワイルドカードがなければ、リストに含まれる番号のみがチャットできます。
- `disabled`: 受信したすべての DM を破棄します。

`allowFrom` の各エントリには、`+15551234567` のような E.164 形式の電話番号を指定してください。`sms:` と `twilio-sms:` のプレフィックスも受け付けられ、正規化されます。個人用アシスタントでは、明示的な電話番号を指定した `dmPolicy: "allowlist"` を推奨します。

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

SMS チャンネルを選択している場合、ターゲットには E.164 形式の番号のみ、または `sms:` プレフィックス付きの番号を指定できます。

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

チャンネル選択が暗黙的な場合、`twilio-sms:` プレフィックスはこのチャンネルを選択しますが、`sms:` サービスプレフィックスを置き換えることはありません。このサービスプレフィックスは、iMessage が自身のターゲットに対して通信事業者の SMS 配信を選択するために使用します。

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

CLI では明示的な `--target` が必要です。`defaultTo` は、チャンネル設定からターゲットを解決できる自動化およびエージェント開始の配信パス向けです。

受信した SMS 会話に対するエージェントの返信は、設定された Twilio 送信元を通じて自動的に送信者へ返されます。

SMS の出力はプレーンテキストです。OpenClaw は Markdown を除去し、フェンス付きコードブロックを平坦化し、リンクを `label (url)` として書き換え、長い返信を最大 `textChunkLimit` 文字（デフォルトは 1500）のチャンクに分割してから Twilio 経由で送信します。

## セットアップの確認

Gateway の起動後：

1. Gateway のログに SMS Webhook ルートが表示されていることを確認します。
2. Twilio 側のプローブを実行します（設定された Twilio Webhook の URL/メソッドと最近の受信エラーを確認します）：

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. スマートフォンから Twilio 番号に SMS を送信します。
4. `openclaw pairing list sms` を実行します。
5. `openclaw pairing approve sms <CODE>` でペアリングコードを承認します。
6. もう一度 SMS を送信し、エージェントが返信することを確認します。

送信のみをテストする場合は、次を使用します：

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### macOS の iMessage/SMS からのエンドツーエンドテスト

Messages を通じてキャリア SMS を送信できる Mac では、スマートフォンを操作せずに `imsg` を使用して送信側を動作させることができます：

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

最初のメッセージによってペアリングリクエストが作成されます。2 番目のメッセージでは、Twilio 経由でエージェントの返信を受信するはずです。

## Webhook のセキュリティ

デフォルトでは、OpenClaw は `publicWebhookUrl` と `authToken` を使用して `X-Twilio-Signature` を検証します。`publicWebhookUrl` のエンドポイント部分は、スキーム、ホスト、パス、クエリ文字列を含め、Twilio で設定した URL とバイト単位で完全に一致させてください。Twilio の要件に従い、OpenClaw は署名の計算から Twilio の [接続オーバーライド](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides)フラグメント（`#...`）を除外します。

Webhook ルートでは、署名検証とは独立して次の制約も適用されます：

- `POST` のみ。
- SMS アカウント、Webhook ルート、解決されたクライアントアドレスごとに、1 分あたり 300 リクエストの失敗リクエスト予算。すべてのリクエストがこの予算にカウントされますが、HTTP 429 が適用されるのは、リクエストの本文解析、Twilio 検証、または AccountSid の照合に失敗した後のみです。
- これらのチェックに合格した後、SMS アカウント、Webhook ルート、解決されたクライアントアドレスごとに、受理されたディスパッチ可能なコールバックを 1 分あたり 30 件に制限します（超過時は HTTP 429）。署名検証が無効な場合、この 30 件/分の制限が未認証ディスパッチの上限になります。
- クライアントアドレスは、共有の Gateway 信頼済みプロキシルールを使用して解決されます。`gateway.trustedProxies` に Twilio コールバックを転送するリバースプロキシが含まれている場合、OpenClaw は転送されたクライアントアドレスを基準にこれらの制限を適用します。それ以外の場合は、直接接続されたソケットのアドレスにフォールバックします。
- ペイロードの `AccountSid` は、設定された `accountSid` と一致する必要があります（一致しない場合は HTTP 403）。
- 再送された `MessageSid` の値は 10 分間重複排除されます。
- 各 SMS アカウントのリプレイキャッシュは、最大 10,000 件の有効なメッセージ SID を保持します。すべてのスロットが有効な場合、そのアカウントの新しい Webhook は、最も古いスロットが期限切れになるまで、HTTP 429 と `Retry-After` ヘッダーを返してフェイルクローズします。
- 32 KB を超えるリクエスト本文は拒否されます。

Twilio はデフォルトでは HTTP 429 を再試行せず、`Retry-After` のサポートも文書化していません。`#rp=4xx` と `#rp=all` の接続オーバーライドを使用すると 4xx の再試行が有効になりますが、Twilio は再試行トランザクション全体を 15 秒に制限しているため、リプレイキャッシュのスロットが期限切れになる前に再試行が終了する場合があります。失敗した配信を別のハンドラーで受信する必要がある場合は、フォールバック URL を設定してください。429 は信頼できるバックプレッシャーではなく、フェイルクローズによる拒否として扱ってください。

ローカルトンネルのテストでのみ、次を設定できます：

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

複数の Twilio 番号を運用する場合は、`accounts` を使用します：

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

各アカウントでは異なる `webhookPath` を使用する必要があります。別のアカウントがすでに所有しているパスの Webhook ルートを Gateway が登録することはありません。`TWILIO_*`/`SMS_*` 環境フォールバックはデフォルトアカウントにのみ適用されます。デフォルトにするアカウントを変更するには、`defaultAccount` を設定します。

## トラブルシューティング

### Twilio が 403 を返す、または OpenClaw が Webhook を拒否する

`publicWebhookUrl` が、スキーム、ホスト、パス、クエリ文字列を含め、Twilio で設定された URL と完全に一致することを確認します。Twilio は公開 URL の文字列に署名するため、プロキシによる書き換えや別名のホスト名によって署名検証が失敗する可能性があります。

`Invalid account` を伴う 403 は、受信ペイロードの `AccountSid` が設定された `accountSid` と一致していないことを意味します。Webhook がその番号を所有するアカウントを指していることを確認してください。

### ペアリングリクエストが表示されない

Twilio 番号の **Messaging** Webhook の URL とメソッドを確認します。SMS Webhook の URL を指し、`POST` を使用する必要があります。また、Gateway が公開インターネットまたはトンネル経由で到達可能であることも確認してください。

Twilio のメッセージログにエラー `11200` が表示されている場合、Twilio は受信 SMS を受理しましたが、Webhook に到達できませんでした。次を確認してください：

- Twilio の **Messaging > A message comes in** が `publicWebhookUrl` を指していること。
- メソッドが `POST` であること。
- トンネルまたはリバースプロキシが正確な `webhookPath` を公開していること。Tailscale Funnel の場合は、`tailscale funnel status` を実行し、`/webhooks/sms` が一覧に表示されることを確認します。
- `publicWebhookUrl` が Twilio の送信するものと同じスキーム、ホスト、パス、クエリ文字列を使用し、署名検証で署名済み URL を再現できること。

`openclaw channels status --channel sms --probe` には、不一致の Twilio Webhook 設定と最近の `11200` エラーの両方が表示されます。

### 送信に失敗する

`accountSid`、`authToken`、および `fromNumber` または `messagingServiceSid` のいずれかが解決されていることを確認します。Twilio のトライアルアカウントを使用している場合、SMS を送信する前に、宛先番号を Twilio で検証する必要がある場合があります。

### メッセージは届くがエージェントが応答しない

`dmPolicy` と `allowFrom` を確認します。デフォルトの `pairing` ポリシーでは、通常のエージェントターンを処理する前に送信者を承認する必要があります。
