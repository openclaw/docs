---
read_when:
    - Signal 対応の設定
    - Signal の送受信のデバッグ
summary: signal-cli（JSON-RPC + SSE）による Signal サポート、セットアップ手順、番号モデル
title: Signal
x-i18n:
    generated_at: "2026-04-30T16:27:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 111b6ebe3bde4e03c7ed432f52d663f0b471f0fc4a4bf835c1ac1972467e0b96
    source_path: channels/signal.md
    workflow: 16
---

Status: 外部 CLI 統合。Gateway は HTTP JSON-RPC + SSE 経由で `signal-cli` と通信します。

## 前提条件

- サーバーに OpenClaw がインストールされていること (以下の Linux フローは Ubuntu 24 でテスト済み)。
- Gateway が実行されるホストで `signal-cli` を利用できること。
- 検証用 SMS を 1 通受信できる電話番号 (SMS 登録パスの場合)。
- 登録中に Signal captcha (`signalcaptchas.org`) 用のブラウザーアクセスがあること。

## クイックセットアップ (初心者向け)

1. ボットには **別の Signal 番号** を使います (推奨)。
2. `signal-cli` をインストールします (JVM ビルドを使う場合は Java が必要です)。
3. セットアップパスを 1 つ選びます。
   - **パス A (QR リンク):** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。
   - **パス B (SMS 登録):** captcha + SMS 検証で専用番号を登録します。
4. OpenClaw を設定し、Gateway を再起動します。
5. 最初の DM を送信し、ペアリングを承認します (`openclaw pairing approve signal <CODE>`)。

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

| フィールド | 説明 |
| ----------- | ------------------------------------------------- |
| `account`   | E.164 形式のボット電話番号 (`+15551234567`) |
| `cliPath`   | `signal-cli` へのパス (`PATH` 上にある場合は `signal-cli`) |
| `dmPolicy`  | DM アクセスポリシー (`pairing` 推奨) |
| `allowFrom` | DM が許可される電話番号または `uuid:<id>` 値 |

## これは何か

- `signal-cli` 経由の Signal チャンネル (組み込みの libsignal ではありません)。
- 決定的なルーティング: 返信は常に Signal に戻ります。
- DM はエージェントのメインセッションを共有します。グループは分離されます (`agent:<agentId>:signal:group:<groupId>`)。

## 設定の書き込み

デフォルトでは、Signal は `/config set|unset` によってトリガーされる設定更新を書き込めます (`commands.config: true` が必要)。

無効にするには:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデル (重要)

- Gateway は **Signal デバイス** (`signal-cli` アカウント) に接続します。
- ボットを **自分の個人用 Signal アカウント** で実行すると、自分自身のメッセージは無視されます (ループ保護)。
- 「自分がボットにテキストを送り、ボットが返信する」には、**別のボット番号** を使います。

## セットアップパス A: 既存の Signal アカウントをリンクする (QR)

1. `signal-cli` (JVM またはネイティブビルド) をインストールします。
2. ボットアカウントをリンクします。
   - `signal-cli link -n "OpenClaw"` を実行し、Signal で QR をスキャンします。
3. Signal を設定し、Gateway を起動します。

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

マルチアカウント対応: アカウントごとの設定と任意の `name` を指定して `channels.signal.accounts` を使います。共通パターンについては [`gateway/configuration`](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## セットアップパス B: 専用ボット番号を登録する (SMS、Linux)

既存の Signal アプリアカウントをリンクする代わりに、専用ボット番号を使いたい場合に使います。

1. SMS を受信できる番号を用意します (固定電話の場合は音声検証)。
   - アカウントやセッションの競合を避けるため、専用のボット番号を使います。
2. Gateway ホストに `signal-cli` をインストールします。

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
3. 可能な場合は、ブラウザーセッションと同じ外部 IP から実行します。
4. すぐに登録を再実行します (captcha トークンは短時間で期限切れになります)。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、Gateway を再起動して、チャンネルを検証します。

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. DM 送信者をペアリングします。
   - ボット番号に任意のメッセージを送信します。
   - サーバー上でコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」を避けるため、ボット番号をスマートフォンの連絡先に保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除されることがあります。専用ボット番号を使うか、既存のスマートフォンアプリ設定を維持する必要がある場合は QR リンクモードを使ってください。
</Warning>

上流リファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha フロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード (httpUrl)

`signal-cli` を自分で管理したい場合 (遅い JVM コールドスタート、コンテナー初期化、共有 CPU など) は、デーモンを別に実行し、OpenClaw からそこを指すようにします。

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

これにより、自動 spawn と OpenClaw 内部の起動待機がスキップされます。自動 spawn 時の起動が遅い場合は、`channels.signal.startupTimeoutMs` を設定してください。

## アクセス制御 (DM + グループ)

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 不明な送信者はペアリングコードを受け取ります。承認されるまでメッセージは無視されます (コードは 1 時間後に期限切れになります)。
- 次で承認します。
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- ペアリングは Signal DM のデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者 (`sourceUuid` 由来) は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom` は、`allowlist` が設定されている場合にどのグループまたは送信者がグループ返信をトリガーできるかを制御します。エントリには Signal グループ ID (raw、`group:<id>`、または `signal:group:<id>`)、送信者の電話番号、`uuid:<id>` 値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` は、`requireMention`、`tools`、`toolsBySender` でグループの動作を上書きできます。
- マルチアカウント構成でアカウントごとに上書きするには、`channels.signal.accounts.<id>.groups` を使います。
- `groupAllowFrom` で Signal グループを許可リストに入れても、それだけではメンションゲートは無効になりません。具体的に設定された `channels.signal.groups["<group-id>"]` エントリは、`requireMention=true` が設定されていない限り、すべてのグループメッセージを処理します。
- ランタイムの注意: `channels.signal` が完全に存在しない場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします (`channels.defaults.groupPolicy` が設定されている場合でも)。

## 仕組み (動作)

- `signal-cli` はデーモンとして実行され、Gateway は SSE 経由でイベントを読み取ります。
- 受信メッセージは共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループにルーティングされます。

## メディア + 制限

- 送信テキストは `channels.signal.textChunkLimit` (デフォルト 4000) に分割されます。
- 任意の改行チャンク分割: 長さによるチャンク分割の前に空行 (段落境界) で分割するには、`channels.signal.chunkMode="newline"` を設定します。
- 添付ファイルに対応しています (`signal-cli` から base64 を取得)。
- ボイスメモの添付ファイルは、`contentType` がない場合に `signal-cli` のファイル名を MIME フォールバックとして使うため、音声文字起こしで AAC ボイスメモを分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb` (デフォルト 8)。
- メディアのダウンロードをスキップするには、`channels.signal.ignoreAttachments` を使います。
- グループ履歴コンテキストは `channels.signal.historyLimit` (または `channels.signal.accounts.*.historyLimit`) を使い、`messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します (デフォルト 50)。

## 入力中表示 + 既読レシート

- **入力中インジケーター**: OpenClaw は `signal-cli sendTyping` 経由で入力中シグナルを送信し、返信の実行中はそれを更新します。
- **既読レシート**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読レシートを転送します。
- Signal-cli はグループの既読レシートを公開しません。

## リアクション (メッセージツール)

- `channel=signal` で `message action=react` を使います。
- ターゲット: 送信者の E.164 または UUID (ペアリング出力の `uuid:<id>` を使います。裸の UUID も機能します)。
- `messageId` は、リアクション対象メッセージの Signal タイムスタンプです。
- グループリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

例:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクションアクションを有効/無効にします (デフォルト true)。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack` はエージェントのリアクションを無効にします (メッセージツール `react` はエラーになります)。
  - `minimal`/`extensive` はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 配信ターゲット (CLI/cron)

- DM: `signal:+15551234567` (またはプレーンな E.164)。
- UUID DM: `uuid:<id>` (または裸の UUID)。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>` (Signal アカウントで対応している場合)。

## トラブルシューティング

まずこの手順を実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて DM ペアリング状態を確認します。

```bash
openclaw pairing list signal
```

よくある失敗:

- デーモンに到達できるが返信がない: アカウント/デーモン設定 (`httpUrl`、`account`) と受信モードを確認します。
- DM が無視される: 送信者がペアリング承認待ちです。
- グループメッセージが無視される: グループの送信者/メンションゲートが配信をブロックしています。
- 編集後の設定検証エラー: `openclaw doctor --fix` を実行します。
- 診断に Signal がない: `channels.signal.enabled: true` を確認します。

追加チェック:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフロー: [/channels/troubleshooting](/ja-JP/channels/troubleshooting)。

## セキュリティ上の注意

- `signal-cli` はアカウントキーをローカルに保存します (通常は `~/.local/share/signal-cli/data/`)。
- サーバー移行や再構築の前に、Signal アカウント状態をバックアップしてください。
- より広い DM アクセスを明示的に必要としない限り、`channels.signal.dmPolicy: "pairing"` を維持してください。
- SMS 検証は登録または復旧フローでのみ必要ですが、番号/アカウントの制御を失うと再登録が複雑になる可能性があります。

## 設定リファレンス (Signal)

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャンネル起動を有効/無効にします。
- `channels.signal.account`: ボットアカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.httpUrl`: 完全なデーモン URL（host/port を上書きします）。
- `channels.signal.httpHost`, `channels.signal.httpPort`: デーモンのバインド（デフォルト 127.0.0.1:8080）。
- `channels.signal.autoStart`: デーモンを自動生成します（`httpUrl` が未設定の場合、デフォルトは true）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ms、上限 120000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM の許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がないため、電話番号/UUID ID を使用します。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループの許可リスト。Signal グループ ID（生の値、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` 値を受け付けます。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーにしたグループごとの上書き。対応フィールド: `requireMention`, `tools`, `toolsBySender`。
- `channels.signal.accounts.<id>.groups`: 複数アカウント構成向けの、`channels.signal.groups` のアカウントごとのバージョン。
- `channels.signal.historyLimit`: コンテキストとして含めるグループメッセージの最大数（0 で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴上限。ユーザーごとの上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.signal.chunkMode`: 長さによるチャンク分割の前に空行（段落境界）で分割するには、`length`（デフォルト）または `newline`。
- `channels.signal.mediaMaxMb`: 受信/送信メディアの上限（MB）。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションに対応していません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連項目

- [チャンネル概要](/ja-JP/channels) — 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) — DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) — グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) — アクセスモデルと堅牢化
