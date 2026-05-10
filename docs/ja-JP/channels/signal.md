---
read_when:
    - Signal サポートの設定
    - Signal の送信/受信のデバッグ
summary: signal-cli（ネイティブデーモンまたは bbernhard コンテナ）経由の Signal サポート、セットアップパス、および電話番号モデル
title: Signal
x-i18n:
    generated_at: "2026-05-10T19:23:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Status: 外部 CLI 統合。Gateway は HTTP 経由で `signal-cli` と通信します — ネイティブデーモン（JSON-RPC + SSE）または bbernhard/signal-cli-rest-api コンテナ（REST + WebSocket）のどちらかです。

## 前提条件

- サーバーに OpenClaw がインストールされていること（以下の Linux フローは Ubuntu 24 でテスト済み）。
- 次のいずれか:
  - ホストで `signal-cli` を利用できること（ネイティブモード）、**または**
  - `bbernhard/signal-cli-rest-api` Docker コンテナ（コンテナモード）。
- 確認 SMS を 1 回受信できる電話番号（SMS 登録パス用）。
- 登録中に Signal captcha（`signalcaptchas.org`）へアクセスできるブラウザー。

## クイックセットアップ（初心者向け）

1. ボット用に**別の Signal 番号**を使用します（推奨）。
2. `signal-cli` をインストールします（JVM ビルドを使う場合は Java が必要）。
3. セットアップパスを 1 つ選びます:
   - **パス A（QR リンク）:** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。
   - **パス B（SMS 登録）:** captcha + SMS 確認で専用番号を登録します。
4. OpenClaw を設定し、gateway を再起動します。
5. 最初の DM を送信し、ペアリングを承認します（`openclaw pairing approve signal <CODE>`）。

最小設定:

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

| フィールド       | 説明                                       |
| ----------- | ------------------------------------------------- |
| `account`   | E.164 形式のボット電話番号（`+15551234567`） |
| `cliPath`   | `signal-cli` へのパス（`PATH` 上にある場合は `signal-cli`）  |
| `dmPolicy`  | DM アクセスポリシー（`pairing` を推奨）          |
| `allowFrom` | DM を許可する電話番号または `uuid:<id>` 値 |

## 概要

- `signal-cli` 経由の Signal チャンネル（組み込み libsignal ではありません）。
- 決定的ルーティング: 返信は常に Signal に戻ります。
- DM はエージェントのメインセッションを共有します。グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。

## 設定の書き込み

デフォルトでは、Signal は `/config set|unset` によってトリガーされる設定更新の書き込みを許可されています（`commands.config: true` が必要）。

無効にするには:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデル（重要）

- gateway は **Signal デバイス**（`signal-cli` アカウント）に接続します。
- ボットを**自分の個人 Signal アカウント**で実行すると、自分自身のメッセージは無視されます（ループ保護）。
- 「自分がボットにテキストを送ると返信する」動作には、**別のボット番号**を使用してください。

## セットアップパス A: 既存の Signal アカウントをリンクする（QR）

1. `signal-cli`（JVM またはネイティブビルド）をインストールします。
2. ボットアカウントをリンクします:
   - `signal-cli link -n "OpenClaw"` の後、Signal で QR をスキャンします。
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

マルチアカウント対応: アカウントごとの設定と任意の `name` を指定して `channels.signal.accounts` を使用します。共通パターンについては [`gateway/configuration`](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## セットアップパス B: 専用ボット番号を登録する（SMS、Linux）

既存の Signal アプリのアカウントをリンクする代わりに、専用のボット番号が必要な場合に使用します。

1. SMS を受信できる番号を取得します（固定電話の場合は音声確認）。
   - アカウントやセッションの競合を避けるため、専用のボット番号を使用します。
2. gateway ホストに `signal-cli` をインストールします:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使用する場合は、先に JRE 25+ をインストールします。
`signal-cli` は最新に保ってください。上流では、Signal サーバー API の変更により古いリリースが壊れる可能性があると案内されています。

3. 番号を登録して確認します:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合:

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` リンクターゲットをコピーします。
3. 可能であれば、ブラウザーセッションと同じ外部 IP から実行します。
4. すぐに登録を再実行します（captcha トークンはすぐ期限切れになります）:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、gateway を再起動して、チャンネルを確認します:

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
   - 「Unknown contact」を避けるため、ボット番号をスマートフォンの連絡先として保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除される可能性があります。専用のボット番号を推奨します。既存のスマートフォンアプリ設定を維持する必要がある場合は、QR リンクモードを使用してください。
</Warning>

上流リファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha フロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自分で管理したい場合（遅い JVM コールドスタート、コンテナ初期化、共有 CPU など）、デーモンを別途実行し、OpenClaw からそこを指すようにします:

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

これにより、OpenClaw 内部の自動起動と起動待機がスキップされます。自動起動時に起動が遅い場合は、`channels.signal.startupTimeoutMs` を設定します。

## コンテナモード（bbernhard/signal-cli-rest-api）

`signal-cli` をネイティブに実行する代わりに、[bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker コンテナを使用できます。これは `signal-cli` を REST API と WebSocket インターフェイスの背後にラップします。

要件:

- リアルタイムのメッセージ受信には、コンテナを **`MODE=json-rpc`** で実行する必要があります。
- OpenClaw を接続する前に、コンテナ内で Signal アカウントを登録またはリンクしてください。

`docker-compose.yml` サービスの例:

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

`apiMode` フィールドは、OpenClaw が使用するプロトコルを制御します:

| 値         | 動作                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （デフォルト）両方のトランスポートをプローブします。ストリーミングはコンテナ WebSocket 受信を検証します    |
| `"native"`    | ネイティブ signal-cli を強制します（`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE）         |
| `"container"` | bbernhard コンテナを強制します（`/v2/send` の REST、`/v1/receive/{account}` の WebSocket） |

`apiMode` が `"auto"` の場合、OpenClaw は検出されたモードを 30 秒間キャッシュし、繰り返しのプローブを避けます。コンテナ受信は、`/v1/receive/{account}` が WebSocket にアップグレードされた後にのみストリーミング用として選択されます。これには `MODE=json-rpc` が必要です。

コンテナモードは、コンテナが対応する API を公開している場合、ネイティブモードと同じ Signal チャンネル操作をサポートします: 送信、受信、添付ファイル、入力インジケーター、既読/表示済み受領、リアクション、グループ、スタイル付きテキストです。OpenClaw は、ネイティブ Signal RPC 呼び出しをコンテナの REST ペイロードに変換します。これには、`group.{base64(internal_id)}` グループ ID や、書式付きテキスト用の `text_mode: "styled"` が含まれます。

運用上の注意:

- コンテナモードでは `autoStart: false` を使用します。`apiMode: "container"` が選択されている場合、OpenClaw はネイティブデーモンを起動しないでください。
- 受信には `MODE=json-rpc` を使用します。`MODE=normal` では `/v1/about` は正常に見える場合がありますが、`/v1/receive/{account}` は WebSocket にアップグレードされないため、OpenClaw は `auto` モードでコンテナ受信ストリーミングを選択しません。
- `httpUrl` が bbernhard の REST API を指していることがわかっている場合は、`apiMode: "container"` を設定します。ネイティブ `signal-cli` JSON-RPC/SSE を指していることがわかっている場合は、`apiMode: "native"` を設定します。デプロイによって異なる可能性がある場合は `"auto"` を使用します。
- コンテナ添付ファイルのダウンロードは、ネイティブモードと同じメディアバイト制限に従います。サーバーが `Content-Length` を送信する場合、サイズ超過のレスポンスは完全にバッファリングされる前に拒否されます。それ以外の場合はストリーミング中に拒否されます。

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 不明な送信者にはペアリングコードが送られます。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れ）。
- 次で承認します:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- ペアリングは Signal DM のデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` 由来）は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `allowlist` が設定されている場合、`channels.signal.groupAllowFrom` はどのグループまたは送信者がグループ返信をトリガーできるかを制御します。エントリーには、Signal グループ ID（raw、`group:<id>`、または `signal:group:<id>`）、送信者の電話番号、`uuid:<id>` 値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` は、`requireMention`、`tools`、`toolsBySender` でグループ動作を上書きできます。
- マルチアカウント設定でアカウントごとの上書きを行うには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` によって Signal グループを許可リストに追加しても、それだけではメンションゲートは無効になりません。具体的に設定された `channels.signal.groups["<group-id>"]` エントリーは、`requireMention=true` が設定されていない限り、すべてのグループメッセージを処理します。
- ランタイムの注意: `channels.signal` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

## 仕組み（動作）

- ネイティブモード: `signal-cli` はデーモンとして実行され、gateway は SSE 経由でイベントを読み取ります。
- コンテナモード: gateway は REST API 経由で送信し、WebSocket 経由で受信します。
- 受信メッセージは共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループに戻ります。

## メディア + 制限

- 送信テキストは `channels.signal.textChunkLimit`（デフォルト 4000）に分割されます。
- 任意の改行チャンク化: `channels.signal.chunkMode="newline"` を設定すると、長さによる分割の前に空行（段落境界）で分割します。
- 添付ファイルに対応しています（base64 は `signal-cli` から取得）。
- ボイスメモ添付ファイルは、`contentType` がない場合に `signal-cli` のファイル名を MIME フォールバックとして使用するため、音声文字起こしでも AAC ボイスメモを分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト 8）。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使用します。
- グループ履歴コンテキストは `channels.signal.historyLimit`（または `channels.signal.accounts.*.historyLimit`）を使用し、`messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します（デフォルト 50）。

## 入力中表示 + 既読受領

- **入力インジケーター**: OpenClaw は `signal-cli sendTyping` 経由で入力シグナルを送信し、返信の実行中に更新します。
- **既読受領**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読受領を転送します。
- Signal-cli はグループの既読受領を公開しません。

## リアクション（メッセージツール）

- `message action=react` を `channel=signal` とともに使用します。
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

- `channels.signal.actions.reactions`: リアクションアクションを有効化/無効化します（デフォルトは true）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack` はエージェントのリアクションを無効化します（メッセージツールの `react` はエラーになります）。
  - `minimal`/`extensive` はエージェントのリアクションを有効化し、ガイダンスレベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`。

## 配信ターゲット（CLI/Cron）

- DM: `signal:+15551234567`（またはプレーンな E.164）。
- UUID DM: `uuid:<id>`（または裸の UUID）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（使用中の Signal アカウントでサポートされている場合）。

## トラブルシューティング

まずこの手順を実行します:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、次に DM ペアリング状態を確認します:

```bash
openclaw pairing list signal
```

よくある失敗:

- デーモンには到達できるが返信がない: アカウント/デーモン設定（`httpUrl`, `account`）と受信モードを確認します。
- DM が無視される: 送信者がペアリング承認待ちです。
- グループメッセージが無視される: グループ送信者/メンションゲーティングが配信をブロックしています。
- 編集後に設定検証エラーが出る: `openclaw doctor --fix` を実行します。
- 診断に Signal がない: `channels.signal.enabled: true` を確認します。

追加チェック:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフローについては、[/channels/troubleshooting](/ja-JP/channels/troubleshooting) を参照してください。

## セキュリティノート

- `signal-cli` はアカウントキーをローカルに保存します（通常は `~/.local/share/signal-cli/data/`）。
- サーバー移行または再構築の前に、Signal アカウント状態をバックアップしてください。
- より広範な DM アクセスを明示的に必要としない限り、`channels.signal.dmPolicy: "pairing"` のままにします。
- SMS 検証が必要なのは登録またはリカバリーフローのみですが、番号/アカウントの制御を失うと再登録が複雑になる可能性があります。

## 設定リファレンス（Signal）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャネル起動を有効化/無効化します。
- `channels.signal.apiMode`: `auto | native | container`（デフォルト: auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api) を参照してください。
- `channels.signal.account`: ボットアカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.httpUrl`: 完全なデーモン URL（host/port を上書きします）。
- `channels.signal.httpHost`, `channels.signal.httpPort`: デーモンのバインド先（デフォルト 127.0.0.1:8080）。
- `channels.signal.autoStart`: デーモンを自動生成します（`httpUrl` が未設定の場合、デフォルトは true）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ms、上限 120000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM 許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がありません。電話番号/UUID ID を使用してください。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ許可リスト。Signal グループ ID（raw、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` 値を受け付けます。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーにしたグループごとの上書き。サポートされるフィールド: `requireMention`, `tools`, `toolsBySender`。
- `channels.signal.accounts.<id>.groups`: マルチアカウント構成向けの `channels.signal.groups` のアカウントごとの版。
- `channels.signal.historyLimit`: コンテキストとして含めるグループメッセージの最大数（0 で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴上限。ユーザーごとの上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.signal.chunkMode`: 長さによるチャンク分割の前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline`。
- `channels.signal.mediaMaxMb`: 受信/送信メディアの上限（MB）。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションをサポートしていません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連

- [チャネル概要](/ja-JP/channels) — サポートされているすべてのチャネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [チャネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと強化
