---
read_when:
    - Signal サポートのセットアップ
    - Signal の送受信をデバッグする
summary: signal-cli（ネイティブデーモンまたは bbernhard コンテナ）経由の Signal サポート、セットアップパス、番号モデル
title: Signal
x-i18n:
    generated_at: "2026-07-03T15:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

ステータス: 外部 CLI 統合。Gateway は HTTP 経由で `signal-cli` と通信します。ネイティブデーモン (JSON-RPC + SSE) または bbernhard/signal-cli-rest-api コンテナ (REST + WebSocket) のいずれかです。

## 前提条件

- サーバーに OpenClaw がインストール済みであること (以下の Linux フローは Ubuntu 24 でテスト済み)。
- 次のいずれか:
  - ホストで `signal-cli` が利用可能であること (ネイティブモード)、**または**
  - `bbernhard/signal-cli-rest-api` Docker コンテナ (コンテナモード)。
- 検証 SMS を 1 通受信できる電話番号 (SMS 登録パス用)。
- 登録中に Signal captcha (`signalcaptchas.org`) へアクセスできるブラウザ。

## クイックセットアップ (初心者向け)

1. ボットには **別の Signal 番号** を使用します (推奨)。
2. OpenClaw Plugin をインストールします。

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli` をインストールします (JVM ビルドを使う場合は Java が必要です)。
4. セットアップパスを 1 つ選びます。
   - **パス A (QR リンク):** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。
   - **パス B (SMS 登録):** captcha + SMS 検証で専用番号を登録します。
5. OpenClaw を設定し、gateway を再起動します。
6. 最初の DM を送信し、ペアリングを承認します (`openclaw pairing approve signal <CODE>`)。

最小構成:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

フィールドリファレンス:

| フィールド        | 説明                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 形式のボット電話番号 (`+15551234567`) |
| `cliPath`    | `signal-cli` へのパス (`PATH` 上にある場合は `signal-cli`)  |
| `configPath` | `--config` として渡される signal-cli 設定ディレクトリ        |
| `dmPolicy`   | DM アクセスポリシー (`pairing` 推奨)          |
| `allowFrom`  | DM を許可する電話番号または `uuid:<id>` 値 |

## 概要

- `signal-cli` 経由の Signal チャネル (組み込み libsignal ではありません)。
- 決定的ルーティング: 返信は常に Signal に戻ります。
- DM はエージェントのメインセッションを共有します。グループは分離されます (`agent:<agentId>:signal:group:<groupId>`)。

## 設定の書き込み

デフォルトでは、Signal は `/config set|unset` によってトリガーされる設定更新の書き込みを許可されます (`commands.config: true` が必要)。

無効化するには:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデル (重要)

- gateway は **Signal デバイス** (`signal-cli` アカウント) に接続します。
- ボットを **自分の個人 Signal アカウント** で実行すると、自分自身のメッセージは無視されます (ループ保護)。
- 「自分がボットにテキストを送ると返信される」動作には、**別のボット番号** を使用します。

## セットアップパス A: 既存の Signal アカウントをリンクする (QR)

1. `signal-cli` をインストールします (JVM またはネイティブビルド)。
2. ボットアカウントをリンクします:
   - `signal-cli link -n "OpenClaw"` を実行し、Signal で QR をスキャンします。
3. Signal を設定し、gateway を起動します。

例:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

マルチアカウント対応: アカウントごとの設定と任意の `name` を指定して `channels.signal.accounts` を使用します。共有パターンについては [`gateway/configuration`](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## セットアップパス B: 専用ボット番号を登録する (SMS、Linux)

既存の Signal アプリアカウントをリンクする代わりに、専用ボット番号を使いたい場合に使用します。

1. SMS を受信できる番号を用意します (固定電話の場合は音声検証)。
   - アカウント/セッションの競合を避けるため、専用ボット番号を使用します。
2. gateway ホストに `signal-cli` をインストールします。

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド (`signal-cli-${VERSION}.tar.gz`) を使う場合は、先に JRE 25+ をインストールしてください。
`signal-cli` は最新に保ってください。上流では、Signal サーバー API の変更により古いリリースが壊れる可能性があるとされています。

3. 番号を登録して検証します。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合:

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` リンクターゲットをコピーします。
3. 可能な場合は、ブラウザセッションと同じ外部 IP から実行します。
4. すぐに登録を再実行します (captcha トークンはすぐに期限切れになります)。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、gateway を再起動して、チャネルを検証します。

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. DM 送信者をペアリングします:
   - ボット番号に任意のメッセージを送信します。
   - サーバー上でコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」を避けるため、ボット番号を電話の連絡先として保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除される可能性があります。専用ボット番号を推奨します。既存の電話アプリ設定を維持する必要がある場合は、QR リンクモードを使用してください。
</Warning>

上流リファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha フロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード (httpUrl)

`signal-cli` を自分で管理したい場合 (遅い JVM コールドスタート、コンテナ初期化、または共有 CPU)、デーモンを別途実行し、OpenClaw からそこを指すようにします。

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

これにより、OpenClaw 内の自動スポーンと起動待機をスキップします。自動スポーン時の起動が遅い場合は、`channels.signal.startupTimeoutMs` を設定します。

## コンテナモード (bbernhard/signal-cli-rest-api)

`signal-cli` をネイティブに実行する代わりに、[bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker コンテナを使用できます。これは `signal-cli` を REST API と WebSocket インターフェイスの背後にラップします。

要件:

- リアルタイムメッセージ受信のため、コンテナは **必ず** `MODE=json-rpc` で実行する必要があります。
- OpenClaw を接続する前に、コンテナ内で Signal アカウントを登録またはリンクしてください。

`docker-compose.yml` サービス例:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw 設定:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` フィールドは、OpenClaw が使用するプロトコルを制御します。

| 値         | 動作                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (デフォルト) 両方のトランスポートをプローブします。ストリーミングではコンテナ WebSocket 受信を検証します    |
| `"native"`    | ネイティブ signal-cli を強制します (`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE)         |
| `"container"` | bbernhard コンテナを強制します (`/v2/send` の REST、`/v1/receive/{account}` の WebSocket) |

`apiMode` が `"auto"` の場合、OpenClaw は検出されたモードを 30 秒間キャッシュし、プローブの繰り返しを避けます。コンテナ受信は、`/v1/receive/{account}` が WebSocket にアップグレードされた後にのみストリーミング用に選択されます。これには `MODE=json-rpc` が必要です。

コンテナモードは、コンテナが対応する API を公開している場合、ネイティブモードと同じ Signal チャネル操作をサポートします: 送信、受信、添付ファイル、入力インジケーター、既読/閲覧済みレシート、リアクション、グループ、スタイル付きテキスト。OpenClaw はネイティブ Signal RPC 呼び出しをコンテナの REST ペイロードへ変換します。これには `group.{base64(internal_id)}` グループ ID と、書式付きテキスト用の `text_mode: "styled"` が含まれます。

運用上の注意:

- コンテナモードでは `autoStart: false` を使用してください。`apiMode: "container"` が選択されている場合、OpenClaw はネイティブデーモンをスポーンすべきではありません。
- 受信には `MODE=json-rpc` を使用してください。`MODE=normal` では `/v1/about` が正常に見えることがありますが、`/v1/receive/{account}` は WebSocket にアップグレードされないため、OpenClaw は `auto` モードでコンテナ受信ストリーミングを選択しません。
- `httpUrl` が bbernhard の REST API を指していると分かっている場合は、`apiMode: "container"` を設定します。ネイティブ `signal-cli` JSON-RPC/SSE を指していると分かっている場合は、`apiMode: "native"` を設定します。デプロイが変わる可能性がある場合は `"auto"` を使用します。
- コンテナの添付ファイルダウンロードは、ネイティブモードと同じメディアバイト制限に従います。サーバーが `Content-Length` を送信する場合、サイズ超過のレスポンスは完全にバッファリングされる前に拒否されます。それ以外の場合はストリーミング中に拒否されます。

## アクセス制御 (DM + グループ)

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 不明な送信者はペアリングコードを受け取ります。承認されるまでメッセージは無視されます (コードは 1 時間後に期限切れ)。
- 承認方法:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- ペアリングは Signal DM のデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者 (`sourceUuid` 由来) は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom` は、`allowlist` が設定されている場合にどのグループまたは送信者がグループ返信をトリガーできるかを制御します。エントリには Signal グループ ID (raw、`group:<id>`、または `signal:group:<id>`)、送信者の電話番号、`uuid:<id>` 値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` は、`requireMention`、`tools`、`toolsBySender` でグループ動作を上書きできます。
- マルチアカウント設定でアカウントごとの上書きを行うには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` を通じて Signal グループを allowlist に追加しても、それだけでメンションゲートは無効になりません。具体的に設定された `channels.signal.groups["<group-id>"]` エントリは、`requireMention=true` が設定されていない限り、すべてのグループメッセージを処理します。
- ランタイムメモ: `channels.signal` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

## 仕組み (動作)

- ネイティブモード: `signal-cli` はデーモンとして実行され、gateway は SSE 経由でイベントを読み取ります。
- コンテナモード: gateway は REST API 経由で送信し、WebSocket 経由で受信します。
- 受信メッセージは共有チャネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループへルーティングされます。

## メディア + 制限

- 送信テキストは `channels.signal.textChunkLimit` (デフォルト 4000) に分割されます。
- 任意の改行分割: 長さによる分割の前に空行 (段落境界) で分割するには、`channels.signal.chunkMode="newline"` を設定します。
- 添付ファイルをサポートします (`signal-cli` から base64 を取得)。
- ボイスメモ添付では、`contentType` が欠落している場合に MIME フォールバックとして `signal-cli` のファイル名を使用するため、音声文字起こしで AAC ボイスメモを分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb` (デフォルト 8)。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使用します。
- グループ履歴コンテキストは `channels.signal.historyLimit` (または `channels.signal.accounts.*.historyLimit`) を使用し、`messages.groupChat.historyLimit` にフォールバックします。無効化するには `0` を設定します (デフォルト 50)。

## 入力中 + 既読レシート

- **入力中インジケーター**: OpenClaw は `signal-cli sendTyping` 経由で入力中シグナルを送信し、返信の実行中はそれを更新します。
- **既読通知**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読通知を転送します。
- signal-cli はグループの既読通知を公開しません。

## ライフサイクルステータスリアクション

Signal で受信ターンに対して共有の queued/thinking/tool/compaction/done/error リアクションライフサイクルを表示するには、`messages.statusReactions.enabled: true` を設定します。
Signal は受信メッセージのタイムスタンプをリアクション対象として使用します。グループリアクションは、Signal グループ ID と元の送信者を対象の作成者として送信されます。

ステータスリアクションには、ack リアクションと一致する `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions`、または `all`）も必要です。
Signal のステータスリアクションを無効にするには、`channels.signal.reactionLevel: "off"` を設定します。
メッセージツールの `react` アクションはより厳格で、`reactionLevel: "minimal"` または `"extensive"` が必要です。

`messages.removeAckAfterReply: true` は、設定された保持時間の後に最終ステータスリアクションをクリアします。それ以外の場合、Signal は最終的な done/error 状態の後に初期 ack リアクションを復元します。

## リアクション（メッセージツール）

- `channel=signal` で `message action=react` を使用します。
- 対象: 送信者の E.164 または UUID（ペアリング出力の `uuid:<id>` を使用します。裸の UUID も動作します）。
- `messageId` は、リアクションするメッセージの Signal タイムスタンプです。
- グループリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

例:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクションアクションを有効化/無効化します（デフォルトは true）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack` はエージェントのリアクションを無効にします（メッセージツールの `react` はエラーになります）。
  - `minimal`/`extensive` はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 承認リアクション

Signal の exec と Plugin 承認プロンプトは、トップレベルの `approvals.exec` と `approvals.plugin` ルーティングブロックを使用します。
Signal には `channels.signal.execApprovals` ブロックはありません。

- `👍` は一度だけ承認します。
- `👎` は拒否します。
- リクエストが永続的な承認を提示する場合は、`/approve <id> allow-always` を使用します。

承認リアクションの解決には、`channels.signal.allowFrom`、`channels.signal.defaultTo`、または一致するアカウントレベルのフィールドから明示的な Signal 承認者が必要です。
同じチャット内の直接 exec 承認プロンプトでは、明示的な承認者がなくても重複するローカルの `/approve` フォールバックを抑制できます。承認者のないグループ承認では、ローカルフォールバックが表示されたままになります。

## 配信対象（CLI/cron）

- DM: `signal:+15551234567`（または通常の E.164）。
- UUID DM: `uuid:<id>`（または裸の UUID）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（Signal アカウントでサポートされている場合）。

## エイリアス

繰り返し使う Signal 対象に安定した名前が必要な場合は、エイリアスを設定します。
エイリアスは OpenClaw 側の設定のみです。Signal の連絡先を作成または編集しません。

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Signal 配信対象を受け付ける場所ならどこでもエイリアスを使用できます。

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

アカウントごとのエイリアスはトップレベルのエイリアスを継承し、名前を追加または上書きできます。

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` と `openclaw directory groups list --channel signal` は、設定されたエイリアスを一覧表示します。
Signal ディレクトリは設定に基づきます。Signal の連絡先をライブクエリしたり、Signal アカウントを変更したりしません。

## トラブルシューティング

まずこの手順を実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、次に DM ペアリング状態を確認します。

```bash
openclaw pairing list signal
```

よくある失敗:

- デーモンには到達できるが返信がない: アカウント/デーモン設定（`httpUrl`、`account`）と受信モードを確認します。
- DM が無視される: 送信者がペアリング承認待ちです。
- グループメッセージが無視される: グループ送信者/メンションのゲートが配信をブロックしています。
- 編集後に設定検証エラーが出る: `openclaw doctor --fix` を実行します。
- 診断に Signal が表示されない: `channels.signal.enabled: true` を確認します。

追加チェック:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフロー: [/channels/troubleshooting](/ja-JP/channels/troubleshooting)。

## セキュリティメモ

- `signal-cli` はアカウントキーをローカルに保存します（通常は `~/.local/share/signal-cli/data/`）。
- サーバー移行または再構築の前に、Signal アカウント状態をバックアップしてください。
- より広範な DM アクセスを明示的に必要としない限り、`channels.signal.dmPolicy: "pairing"` のままにしてください。
- SMS 検証は登録または復旧フローでのみ必要ですが、番号/アカウントの制御を失うと再登録が複雑になる可能性があります。

## 設定リファレンス（Signal）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャンネル起動を有効化/無効化します。
- `channels.signal.apiMode`: `auto | native | container`（デフォルト: auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api) を参照してください。
- `channels.signal.account`: bot アカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.configPath`: 任意の `signal-cli --config` ディレクトリ。
- `channels.signal.httpUrl`: 完全なデーモン URL（host/port を上書きします）。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモンのバインド（デフォルト 127.0.0.1:8080）。
- `channels.signal.autoStart`: デーモンを自動起動します（`httpUrl` が未設定の場合のデフォルトは true）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ms、上限 120000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM 許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がないため、電話番号/UUID ID を使用します。
- `channels.signal.aliases`: DM またはグループ配信対象向けの OpenClaw 側エイリアス。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ許可リスト。Signal グループ ID（raw、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` 値を受け付けます。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーにしたグループごとの上書き。対応フィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: 複数アカウント設定向けの `channels.signal.groups` のアカウントごとの版。
- `channels.signal.accounts.<id>.aliases`: アカウントごとのエイリアス。トップレベルのエイリアスとマージされます。
- `channels.signal.historyLimit`: コンテキストとして含めるグループメッセージの最大数（0 で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴制限。ユーザーごとの上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.signal.chunkMode`: 長さによるチャンク化の前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline`。
- `channels.signal.mediaMaxMb`: 受信/送信メディアの上限（MB）。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションをサポートしません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連

- [チャンネル概要](/ja-JP/channels) — サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
