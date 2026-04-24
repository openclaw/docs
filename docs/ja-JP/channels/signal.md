---
read_when:
    - Signalサポートのセットアップ
    - Signalの送受信のデバッグ
summary: signal-cli（JSON-RPC + SSE）によるSignalサポート、セットアップ方法、および番号モデル
title: Signal
x-i18n:
    generated_at: "2026-04-24T04:47:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8fb4f08f8607dbe923fdc24d9599623165e1f1268c7fc48ecb457ce3d61172d2
    source_path: channels/signal.md
    workflow: 15
---

# Signal（signal-cli）

ステータス: 外部CLI連携。GatewayはHTTP JSON-RPC + SSE経由で`signal-cli`と通信します。

## 前提条件

- サーバーにOpenClawがインストールされていること（以下のLinuxフローはUbuntu 24でテスト済み）。
- gatewayを実行するホストで`signal-cli`が利用可能であること。
- 1回の認証SMSを受信できる電話番号（SMS登録パス用）。
- 登録時のSignal captcha（`signalcaptchas.org`）にアクセスするためのブラウザ。

## クイックセットアップ（初心者向け）

1. ボット用に**別のSignal番号**を使います（推奨）。
2. `signal-cli`をインストールします（JVMビルドを使う場合はJavaが必要です）。
3. 次のいずれかのセットアップパスを選びます。
   - **パスA（QRリンク）:** `signal-cli link -n "OpenClaw"`を実行し、Signalでスキャンします。
   - **パスB（SMS登録）:** captcha + SMS認証で専用番号を登録します。
4. OpenClawを設定し、gatewayを再起動します。
5. 最初のDMを送り、ペアリングを承認します（`openclaw pairing approve signal <CODE>`）。

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
| `account`   | E.164形式のボット電話番号（`+15551234567`） |
| `cliPath`   | `signal-cli`へのパス（`PATH`上にある場合は`signal-cli`） |
| `dmPolicy`  | DMアクセスポリシー（`pairing`推奨） |
| `allowFrom` | DMを許可する電話番号または`uuid:<id>`値 |

## これは何か

- `signal-cli`経由のSignalチャネル（埋め込みlibsignalではありません）。
- 決定的ルーティング: 返信は常にSignalへ戻ります。
- DMはエージェントのメインセッションを共有し、グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。

## 設定の書き込み

デフォルトでは、Signalでは`/config set|unset`によってトリガーされる設定更新の書き込みが許可されています（`commands.config: true`が必要）。

無効化するには:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 番号モデル（重要）

- gatewayは**Signalデバイス**（`signal-cli`アカウント）に接続します。
- ボットを**自分の個人Signalアカウント**で実行すると、自分自身のメッセージは無視されます（ループ保護）。
- 「自分がボットにテキストを送り、ボットが返信する」ようにしたい場合は、**別のボット番号**を使ってください。

## セットアップパスA: 既存のSignalアカウントをリンクする（QR）

1. `signal-cli`をインストールします（JVMまたはネイティブビルド）。
2. ボットアカウントをリンクします。
   - `signal-cli link -n "OpenClaw"`を実行し、SignalでQRをスキャンします。
3. Signalを設定してgatewayを起動します。

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

マルチアカウント対応: `channels.signal.accounts`を使用し、アカウントごとの設定と任意の`name`を指定します。共通パターンについては[`gateway/configuration`](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## セットアップパスB: 専用ボット番号を登録する（SMS、Linux）

既存のSignalアプリのアカウントをリンクする代わりに、専用のボット番号を使いたい場合はこれを使用します。

1. SMSを受信できる番号を用意します（固定電話の場合は音声認証でも可）。
   - アカウント/セッションの競合を避けるため、専用のボット番号を使用してください。
2. gatewayホストに`signal-cli`をインストールします。

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVMビルド（`signal-cli-${VERSION}.tar.gz`）を使う場合は、先にJRE 25+をインストールしてください。
`signal-cli`は最新の状態に保ってください。SignalサーバーAPIの変更により、古いリリースは動作しなくなることがあるとupstreamで案内されています。

3. 番号を登録して認証します。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captchaが必要な場合:

1. `https://signalcaptchas.org/registration/generate.html`を開きます。
2. captchaを完了し、「Open Signal」の`signalcaptcha://...`リンク先をコピーします。
3. 可能であれば、ブラウザーセッションと同じ外部IPから実行してください。
4. すぐに再度登録を実行します（captchaトークンはすぐ期限切れになります）。

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClawを設定し、gatewayを再起動して、チャネルを確認します。

```bash
# gatewayをユーザーsystemdサービスとして実行している場合:
systemctl --user restart openclaw-gateway.service

# その後、確認:
openclaw doctor
openclaw channels status --probe
```

5. DM送信者をペアリングします。
   - ボット番号に任意のメッセージを送信します。
   - サーバーでコードを承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」を避けるため、そのボット番号を自分の電話で連絡先として保存します。

重要: `signal-cli`で電話番号アカウントを登録すると、その番号のメインSignalアプリセッションが認証解除されることがあります。専用のボット番号を使うか、既存の電話アプリ環境を維持したい場合はQRリンクモードを使用してください。

upstreamリファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captchaフロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Linkingフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli`を自分で管理したい場合（JVMのコールドスタートが遅い、コンテナ初期化、共有CPUなど）は、デーモンを別途実行し、OpenClawからそこを参照します。

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

これにより、OpenClaw内での自動起動と起動待機をスキップします。自動起動時に起動が遅い場合は、`channels.signal.startupTimeoutMs`を設定してください。

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 未知の送信者にはペアリングコードが返され、承認されるまでメッセージは無視されます（コードは1時間で期限切れ）。
- 承認方法:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- ペアリングはSignal DMのデフォルトのトークン交換です。詳細: [Pairing](/ja-JP/channels/pairing)
- UUIDのみの送信者（`sourceUuid`由来）は、`channels.signal.allowFrom`に`uuid:<id>`として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `allowlist`が設定されている場合、`channels.signal.groupAllowFrom`でグループ内でトリガーできる送信者を制御します。
- `channels.signal.groups["<group-id>" | "*"]`では、`requireMention`、`tools`、`toolsBySender`によってグループ動作を上書きできます。
- マルチアカウント構成でアカウントごとに上書きするには、`channels.signal.accounts.<id>.groups`を使用します。
- 実行時の注意: `channels.signal`自体が完全に欠けている場合、実行時にはグループチェックで`groupPolicy="allowlist"`にフォールバックします（`channels.defaults.groupPolicy`が設定されていても同様です）。

## 仕組み（動作）

- `signal-cli`はデーモンとして動作し、gatewayはSSE経由でイベントを読み取ります。
- 受信メッセージは共有チャネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループへルーティングされます。

## メディア + 制限

- 送信テキストは`channels.signal.textChunkLimit`（デフォルト4000）でチャンク化されます。
- 任意の改行チャンク化: `channels.signal.chunkMode="newline"`を設定すると、長さによるチャンク化の前に空行（段落境界）で分割します。
- 添付ファイルに対応しています（`signal-cli`から取得したbase64）。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト8）。
- メディアのダウンロードをスキップするには`channels.signal.ignoreAttachments`を使用します。
- グループ履歴コンテキストは`channels.signal.historyLimit`（または`channels.signal.accounts.*.historyLimit`）を使用し、`messages.groupChat.historyLimit`にフォールバックします。無効化するには`0`を設定します（デフォルト50）。

## タイピング + 既読通知

- **タイピングインジケーター**: OpenClawは`signal-cli sendTyping`経由でタイピングシグナルを送信し、返信実行中はこれを更新します。
- **既読通知**: `channels.signal.sendReadReceipts`がtrueの場合、OpenClawは許可されたDMの既読通知を転送します。
- signal-cliはグループの既読通知を公開しません。

## リアクション（messageツール）

- `channel=signal`で`message action=react`を使用します。
- ターゲット: 送信者のE.164またはUUID（ペアリング出力の`uuid:<id>`を使用してください。UUID単体でも動作します）。
- `messageId`はリアクション対象メッセージのSignalタイムスタンプです。
- グループリアクションには`targetAuthor`または`targetAuthorUuid`が必要です。

例:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクションアクションの有効/無効（デフォルトtrue）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`。
  - `off`/`ack`はエージェントのリアクションを無効にします（messageツールの`react`はエラーになります）。
  - `minimal`/`extensive`はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 配信先（CLI/Cron）

- DM: `signal:+15551234567`（またはE.164そのまま）。
- UUID DM: `uuid:<id>`（またはUUID単体）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（Signalアカウントが対応している場合）。

## トラブルシューティング

まず次の段階的確認を実行してください。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、その後DMのペアリング状態を確認します。

```bash
openclaw pairing list signal
```

よくある障害:

- デーモンには到達できるが返信がない: アカウント/デーモン設定（`httpUrl`、`account`）と受信モードを確認してください。
- DMが無視される: 送信者がペアリング承認待ちです。
- グループメッセージが無視される: グループ送信者/メンションゲーティングにより配信がブロックされています。
- 編集後に設定検証エラーが出る: `openclaw doctor --fix`を実行してください。
- 診断にSignalが表示されない: `channels.signal.enabled: true`を確認してください。

追加確認:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフロー: [/channels/troubleshooting](/ja-JP/channels/troubleshooting)。

## セキュリティに関する注意

- `signal-cli`はアカウント鍵をローカルに保存します（通常は`~/.local/share/signal-cli/data/`）。
- サーバー移行や再構築の前にSignalアカウント状態をバックアップしてください。
- より広いDMアクセスを明示的に望まない限り、`channels.signal.dmPolicy: "pairing"`を維持してください。
- SMS認証が必要なのは登録または復旧フローのみですが、番号/アカウントの管理を失うと再登録が複雑になることがあります。

## 設定リファレンス（Signal）

完全な設定: [Configuration](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャネル起動の有効/無効。
- `channels.signal.account`: ボットアカウントのE.164。
- `channels.signal.cliPath`: `signal-cli`へのパス。
- `channels.signal.httpUrl`: 完全なデーモンURL（host/portより優先）。
- `channels.signal.httpHost`, `channels.signal.httpPort`: デーモンのバインド先（デフォルトは127.0.0.1:8080）。
- `channels.signal.autoStart`: デーモンの自動起動（`httpUrl`未設定時のデフォルトはtrue）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ミリ秒、上限120000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップ。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視。
- `channels.signal.sendReadReceipts`: 既読通知を転送。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM許可リスト（E.164または`uuid:<id>`）。`open`では`"*"`が必要です。Signalにはユーザー名がないため、電話番号/UUID IDを使用します。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ送信者許可リスト。
- `channels.signal.groups`: SignalグループID（または`"*"`）をキーにしたグループごとの上書き。対応フィールド: `requireMention`, `tools`, `toolsBySender`。
- `channels.signal.accounts.<id>.groups`: マルチアカウント構成向けの、`channels.signal.groups`のアカウントごと版。
- `channels.signal.historyLimit`: コンテキストとして含めるグループメッセージの最大数（0で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位のDM履歴上限。ユーザーごとの上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）。
- `channels.signal.chunkMode`: `length`（デフォルト）または`newline`。長さによるチャンク化の前に空行（段落境界）で分割します。
- `channels.signal.mediaMaxMb`: 受信/送信メディア上限（MB）。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signalはネイティブメンションをサポートしません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連

- [Channels Overview](/ja-JP/channels) — サポートされているすべてのチャネル
- [Pairing](/ja-JP/channels/pairing) — DM認証とペアリングフロー
- [Groups](/ja-JP/channels/groups) — グループチャットの動作とメンションゲーティング
- [Channel Routing](/ja-JP/channels/channel-routing) — メッセージのセッションルーティング
- [Security](/ja-JP/gateway/security) — アクセスモデルとハードニング
