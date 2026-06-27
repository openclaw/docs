---
read_when:
    - Signal サポートの設定
    - Signal の送受信をデバッグする
summary: signal-cli 経由の Signal 対応（ネイティブデーモンまたは bbernhard コンテナ）、セットアップパス、および番号モデル
title: Signal
x-i18n:
    generated_at: "2026-06-27T10:41:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

ステータス: 外部 CLI 統合。Gateway は HTTP 経由で `signal-cli` と通信します。ネイティブデーモン（JSON-RPC + SSE）または bbernhard/signal-cli-rest-api コンテナ（REST + WebSocket）のどちらかです。

## 前提条件

- サーバーに OpenClaw がインストール済み（以下の Linux フローは Ubuntu 24 でテスト済み）。
- 次のいずれか:
  - ホストで `signal-cli` を利用可能（ネイティブモード）、**または**
  - `bbernhard/signal-cli-rest-api` Docker コンテナ（コンテナモード）。
- 検証 SMS を 1 回受信できる電話番号（SMS 登録パス用）。
- 登録中に Signal captcha（`signalcaptchas.org`）へアクセスするためのブラウザー。

## クイックセットアップ（初心者向け）

1. ボットには**別の Signal 番号**を使用します（推奨）。
2. OpenClaw Plugin をインストールします:

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli` をインストールします（JVM ビルドを使う場合は Java が必要）。
4. セットアップパスを 1 つ選択します:
   - **パス A（QR リンク）:** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。
   - **パス B（SMS 登録）:** captcha + SMS 検証で専用番号を登録します。
5. OpenClaw を設定し、Gateway を再起動します。
6. 最初の DM を送信し、ペアリングを承認します（`openclaw pairing approve signal <CODE>`）。

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

| フィールド   | 説明                                                        |
| ------------ | ----------------------------------------------------------- |
| `account`    | E.164 形式のボット電話番号（`+15551234567`）                |
| `cliPath`    | `signal-cli` へのパス（`PATH` 上にある場合は `signal-cli`） |
| `configPath` | `--config` として渡される signal-cli 設定ディレクトリ       |
| `dmPolicy`   | DM アクセスポリシー（`pairing` 推奨）                       |
| `allowFrom`  | DM を許可する電話番号または `uuid:<id>` 値                  |

## これは何か

- `signal-cli` 経由の Signal チャンネル（埋め込み libsignal ではありません）。
- 決定的なルーティング: 返信は常に Signal に戻ります。
- DM はエージェントのメインセッションを共有します。グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。

## 設定の書き込み

デフォルトでは、Signal は `/config set|unset` によってトリガーされる設定更新の書き込みを許可されます（`commands.config: true` が必要）。

無効化するには:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデル（重要）

- Gateway は **Signal デバイス**（`signal-cli` アカウント）に接続します。
- ボットを**自分の個人 Signal アカウント**で実行すると、自分自身のメッセージは無視されます（ループ保護）。
- 「自分がボットにテキストを送り、返信を受け取る」には、**別のボット番号**を使用します。

## セットアップパス A: 既存の Signal アカウントをリンクする（QR）

1. `signal-cli`（JVM またはネイティブビルド）をインストールします。
2. ボットアカウントをリンクします:
   - `signal-cli link -n "OpenClaw"` を実行し、Signal で QR をスキャンします。
3. Signal を設定し、Gateway を開始します。

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

複数アカウントのサポート: アカウントごとの設定と任意の `name` を指定して `channels.signal.accounts` を使用します。共有パターンについては [`gateway/configuration`](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## セットアップパス B: 専用ボット番号を登録する（SMS、Linux）

既存の Signal アプリアカウントをリンクするのではなく、専用のボット番号が必要な場合に使用します。

1. SMS（または固定電話の場合は音声検証）を受信できる番号を取得します。
   - アカウントやセッションの競合を避けるため、専用のボット番号を使用します。
2. Gateway ホストに `signal-cli` をインストールします:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使う場合は、先に JRE 25+ をインストールしてください。
`signal-cli` は最新に保ってください。上流では、Signal サーバー API の変更により古いリリースが壊れる可能性があると記載されています。

3. 番号を登録して検証します:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合:

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` リンクターゲットをコピーします。
3. 可能であれば、ブラウザーセッションと同じ外部 IP から実行します。
4. すぐに登録を再実行します（captcha トークンはすぐに期限切れになります）:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、Gateway を再起動して、チャンネルを検証します:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. DM 送信者をペアリングします:
   - ボット番号に任意のメッセージを送信します。
   - サーバーでコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」を避けるため、電話でボット番号を連絡先として保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除される場合があります。専用のボット番号を優先するか、既存の電話アプリ設定を維持する必要がある場合は QR リンクモードを使用してください。
</Warning>

上流リファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha フロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自分で管理したい場合（遅い JVM コールドスタート、コンテナ初期化、または共有 CPU）、デーモンを別途実行し、OpenClaw にその場所を指定します:

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

これにより、OpenClaw 内での自動スポーンと起動待機をスキップします。自動スポーン時に起動が遅い場合は、`channels.signal.startupTimeoutMs` を設定します。

## コンテナモード（bbernhard/signal-cli-rest-api）

`signal-cli` をネイティブで実行する代わりに、[bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker コンテナを使用できます。これは `signal-cli` を REST API と WebSocket インターフェイスの背後にラップします。

要件:

- リアルタイムメッセージ受信のため、コンテナは **必ず** `MODE=json-rpc` で実行する必要があります。
- OpenClaw に接続する前に、コンテナ内で Signal アカウントを登録またはリンクします。

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

`apiMode` フィールドは OpenClaw が使用するプロトコルを制御します:

| 値            | 動作                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| `"auto"`      | （デフォルト）両方のトランスポートをプローブします。ストリーミングではコンテナ WebSocket 受信を検証します |
| `"native"`    | ネイティブ signal-cli を強制します（`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE）                |
| `"container"` | bbernhard コンテナを強制します（`/v2/send` の REST、`/v1/receive/{account}` の WebSocket）              |

`apiMode` が `"auto"` の場合、OpenClaw は繰り返しのプローブを避けるため、検出されたモードを 30 秒間キャッシュします。コンテナ受信は、`/v1/receive/{account}` が WebSocket にアップグレードされた後にのみストリーミング用として選択されます。これには `MODE=json-rpc` が必要です。

コンテナモードは、コンテナが対応する API を公開している場合、ネイティブモードと同じ Signal チャンネル操作をサポートします: 送信、受信、添付ファイル、入力中インジケーター、既読/閲覧済み受領、リアクション、グループ、スタイル付きテキスト。OpenClaw は、ネイティブ Signal RPC 呼び出しをコンテナの REST ペイロードに変換します。これには、`group.{base64(internal_id)}` グループ ID と、書式付きテキスト用の `text_mode: "styled"` が含まれます。

運用上の注意:

- コンテナモードでは `autoStart: false` を使用します。`apiMode: "container"` が選択されている場合、OpenClaw はネイティブデーモンをスポーンすべきではありません。
- 受信には `MODE=json-rpc` を使用します。`MODE=normal` では `/v1/about` が正常に見える場合がありますが、`/v1/receive/{account}` は WebSocket アップグレードされないため、OpenClaw は `auto` モードでコンテナ受信ストリーミングを選択しません。
- `httpUrl` が bbernhard の REST API を指していることがわかっている場合は `apiMode: "container"` を設定します。ネイティブ `signal-cli` JSON-RPC/SSE を指していることがわかっている場合は `apiMode: "native"` を設定します。デプロイが変わる可能性がある場合は `"auto"` を使用します。
- コンテナ添付ファイルのダウンロードは、ネイティブモードと同じメディアバイト制限に従います。サーバーが `Content-Length` を送信する場合は完全にバッファリングされる前に、そうでない場合はストリーミング中に、サイズ超過のレスポンスが拒否されます。

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 不明な送信者はペアリングコードを受け取ります。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れ）。
- 次で承認します:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- ペアリングは Signal DM のデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` 由来）は `channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom` は、`allowlist` が設定されている場合にグループ返信をトリガーできるグループまたは送信者を制御します。エントリには、Signal グループ ID（raw、`group:<id>`、または `signal:group:<id>`）、送信者の電話番号、`uuid:<id>` 値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` は、`requireMention`、`tools`、`toolsBySender` でグループの動作を上書きできます。
- 複数アカウントセットアップでアカウントごとの上書きを行うには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` で Signal グループを許可リストに追加しても、それ自体ではメンションゲートは無効になりません。具体的に設定された `channels.signal.groups["<group-id>"]` エントリは、`requireMention=true` が設定されていない限り、すべてのグループメッセージを処理します。
- ランタイム注記: `channels.signal` が完全に存在しない場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

## 仕組み（動作）

- ネイティブモード: `signal-cli` はデーモンとして実行され、Gateway は SSE 経由でイベントを読み取ります。
- コンテナモード: Gateway は REST API 経由で送信し、WebSocket 経由で受信します。
- 受信メッセージは共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループに戻ります。

## メディア + 制限

- 送信テキストは `channels.signal.textChunkLimit`（デフォルト 4000）に分割されます。
- 任意の改行分割: 長さによる分割の前に空行（段落境界）で分割するには、`channels.signal.chunkMode="newline"` を設定します。
- 添付ファイルをサポートします（`signal-cli` から base64 を取得）。
- 音声メモ添付ファイルは、`contentType` がない場合に MIME フォールバックとして `signal-cli` ファイル名を使用するため、音声文字起こしでも AAC 音声メモを分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト 8）。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使用します。
- グループ履歴コンテキストは `channels.signal.historyLimit`（または `channels.signal.accounts.*.historyLimit`）を使用し、`messages.groupChat.historyLimit` にフォールバックします。無効化するには `0` を設定します（デフォルト 50）。

## 入力中 + 既読受領

- **入力中インジケーター**: OpenClaw は `signal-cli sendTyping` 経由で入力中シグナルを送信し、返信の実行中に更新します。
- **既読通知**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読通知を転送します。
- signal-cli はグループの既読通知を公開していません。

## リアクション（message ツール）

- `channel=signal` で `message action=react` を使用します。
- ターゲット: 送信者の E.164 または UUID（ペアリング出力の `uuid:<id>` を使用します。裸の UUID も機能します）。
- `messageId` は、リアクション対象メッセージの Signal タイムスタンプです。
- グループリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

例:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクションアクションを有効化/無効化します（デフォルト true）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack` はエージェントリアクションを無効化します（message ツールの `react` はエラーになります）。
  - `minimal`/`extensive` はエージェントリアクションを有効化し、ガイダンスレベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 承認リアクション

Signal の exec と Plugin 承認プロンプトは、トップレベルの `approvals.exec` と
`approvals.plugin` ルーティングブロックを使用します。Signal には
`channels.signal.execApprovals` ブロックはありません。

- `👍` は一度だけ承認します。
- `👎` は拒否します。
- リクエストが永続的な承認を提示している場合は、`/approve <id> allow-always` を使用します。

承認リアクションの解決には、`channels.signal.allowFrom`、`channels.signal.defaultTo`、または一致するアカウントレベルのフィールドからの明示的な Signal 承認者が必要です。
同じチャットでの直接 exec 承認プロンプトは、明示的な承認者なしでも重複するローカル `/approve` フォールバックを抑制できます。承認者のないグループ承認では、ローカルフォールバックは表示されたままになります。

## 配信ターゲット（CLI/cron）

- DM: `signal:+15551234567`（またはプレーンな E.164）。
- UUID DM: `uuid:<id>`（または裸の UUID）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（使用している Signal アカウントでサポートされている場合）。

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

- デーモンには到達できるが返信がない: アカウント/デーモン設定（`httpUrl`、`account`）と受信モードを確認してください。
- DM が無視される: 送信者がペアリング承認待ちです。
- グループメッセージが無視される: グループ送信者/メンションのゲート処理が配信をブロックしています。
- 編集後に設定検証エラーが出る: `openclaw doctor --fix` を実行してください。
- 診断に Signal が表示されない: `channels.signal.enabled: true` を確認してください。

追加の確認:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフローについては、[/channels/troubleshooting](/ja-JP/channels/troubleshooting) を参照してください。

## セキュリティメモ

- `signal-cli` はアカウントキーをローカルに保存します（通常は `~/.local/share/signal-cli/data/`）。
- サーバー移行または再構築の前に、Signal アカウント状態をバックアップしてください。
- より広い DM アクセスを明示的に必要とする場合を除き、`channels.signal.dmPolicy: "pairing"` のままにしてください。
- SMS 検証は登録または復旧フローでのみ必要ですが、番号/アカウントの制御を失うと再登録が複雑になる場合があります。

## 設定リファレンス（Signal）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャネル起動を有効化/無効化します。
- `channels.signal.apiMode`: `auto | native | container`（デフォルト: auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api) を参照してください。
- `channels.signal.account`: ボットアカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.configPath`: 任意の `signal-cli --config` ディレクトリ。
- `channels.signal.httpUrl`: 完全なデーモン URL（host/port を上書きします）。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモンのバインド（デフォルト 127.0.0.1:8080）。
- `channels.signal.autoStart`: デーモンを自動生成します（`httpUrl` 未設定時のデフォルトは true）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ms、上限 120000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM 許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がありません。電話番号/UUID ID を使用してください。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ許可リスト。Signal グループ ID（raw、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` 値を受け付けます。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーにしたグループごとの上書き。対応フィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: 複数アカウント構成向けの `channels.signal.groups` のアカウントごとのバージョン。
- `channels.signal.historyLimit`: コンテキストに含める最大グループメッセージ数（0 で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴制限。ユーザーごとの上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.signal.chunkMode`: 長さによるチャンク化の前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline`。
- `channels.signal.mediaMaxMb`: 受信/送信メディア上限（MB）。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションに対応していません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連

- [チャネル概要](/ja-JP/channels) — 対応しているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションのゲート処理
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
