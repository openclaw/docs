---
read_when:
    - Signal サポートのセットアップ
    - Signal の送受信のデバッグ
summary: signal-cli（ネイティブデーモンまたは bbernhard コンテナ）による Signal 対応、セットアップ方法、電話番号モデル
title: Signal
x-i18n:
    generated_at: "2026-07-11T21:58:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal はダウンロード可能なチャンネル Plugin（`@openclaw/signal`）です。Gateway は HTTP 経由で `signal-cli` と通信します。ネイティブデーモン（JSON-RPC + SSE）または [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) コンテナ（REST + WebSocket）を使用できます。OpenClaw は libsignal を組み込みません。

## 番号モデル（最初にお読みください）

- Gateway は **Signal デバイス**、つまり `signal-cli` アカウントに接続します。
- **個人用 Signal アカウント**でボットを実行すると、ループ防止のため自分自身のメッセージは無視されます。
- 「ボットにメッセージを送ると返信される」ようにするには、**ボット専用の別番号**を使用してください。

## インストール

```bash
openclaw plugins install @openclaw/signal
```

接頭辞のない Plugin 指定では、まず ClawHub を試し、その後 npm にフォールバックします。`openclaw plugins install clawhub:@openclaw/signal` または `npm:@openclaw/signal` でソースを指定できます。`plugins install` は Plugin を登録して有効化するため、個別の `enable` 手順は不要です。一般的なインストール規則については、[Plugin](/ja-JP/tools/plugin)を参照してください。

## クイックセットアップ

<Steps>
  <Step title="番号を選択する">
    ボットには**専用の別の Signal 番号**を使用してください（推奨）。
  </Step>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="ガイド付きセットアップを実行する">
    ```bash
    openclaw channels add
    ```
    ウィザードは `signal-cli` が `PATH` に存在するかを検出し、存在しない場合はインストールを提案します。Linux x86-64 では公式のネイティブ GraalVM ビルドをダウンロードし、macOS およびその他のアーキテクチャでは Homebrew 経由でインストールします。その後、ボット番号と `signal-cli` のパスを入力するよう求めます。
  </Step>
  <Step title="アカウントをリンクまたは登録する">
    - **QR リンク（最速）：** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。[手順 A](#setup-path-a-link-existing-signal-account-qr)を参照してください。
    - **SMS 登録：** 専用番号を CAPTCHA と SMS 認証で登録します。[手順 B](#setup-path-b-register-dedicated-bot-number-sms-linux)を参照してください。

  </Step>
  <Step title="確認してペアリングする">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    最初の DM を送信してペアリングを承認します：`openclaw pairing approve signal <CODE>`。
  </Step>
</Steps>

最小構成：

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

| フィールド   | 説明                                                   |
| ------------ | ------------------------------------------------------ |
| `account`    | E.164 形式のボットの電話番号（`+15551234567`）         |
| `cliPath`    | `signal-cli` へのパス（`PATH` 上にある場合は `signal-cli`） |
| `configPath` | `--config` として渡す signal-cli の設定ディレクトリ    |
| `dmPolicy`   | DM アクセスポリシー（`pairing` を推奨）                |
| `allowFrom`  | DM を許可する電話番号または `uuid:<id>` 値             |

複数アカウント対応：アカウントごとの設定と任意の `name` を指定した `channels.signal.accounts` を使用します。共通パターンについては、[複数アカウントのチャンネル](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## 概要

- 決定論的ルーティング：返信は常に Signal に返されます。
- DM はエージェントのメインセッションを共有し、グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。
- デフォルトでは、Signal は `/config set|unset` によって発生する設定更新を書き込む場合があります（`commands.config: true` が必要です）。無効化するには `channels.signal.configWrites: false` を設定します。

## セットアップ手順 A：既存の Signal アカウントをリンクする（QR）

1. `signal-cli`（JVM またはネイティブビルド）をインストールするか、`openclaw channels add` にインストールさせます。
2. ボットアカウントをリンクします：`signal-cli link -n "OpenClaw"` を実行し、Signal で QR コードをスキャンします。
3. Signal を設定し、Gateway を起動します。

## セットアップ手順 B：ボット専用番号を登録する（SMS、Linux）

既存の Signal アプリアカウントをリンクする代わりに、ボット専用番号を使用する場合はこの手順を使用します。以下の手順は Ubuntu 24 でテストされています。

1. SMS を受信できる番号を用意します（固定電話の場合は音声認証も使用できます）。ボット専用番号を使用すると、アカウントやセッションの競合を回避できます。
2. Gateway ホストに `signal-cli` をインストールします：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使用する場合は、最初に JRE をインストールしてください。`signal-cli` は最新の状態に保ってください。Signal サーバー API の変更により、古いリリースが動作しなくなる可能性があるとアップストリームで説明されています。

3. 番号を登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

CAPTCHA が必要な場合（この手順を完了するにはブラウザへのアクセスが必要です）：

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. CAPTCHA を完了し、"Open Signal" から `signalcaptcha://...` リンクのリンク先をコピーします。
3. 可能な場合は、ブラウザセッションと同じ外部 IP から実行します（CAPTCHA トークンは短時間で期限切れになります）。
4. 直ちに登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、Gateway を再起動してチャンネルを確認します：

```bash
# Gateway をユーザーの systemd サービスとして実行している場合：
systemctl --user restart openclaw-gateway.service

# 次に確認：
openclaw doctor
openclaw channels status --probe
```

5. DM の送信者をペアリングします：
   - ボット番号に任意のメッセージを送信します。
   - サーバーで承認します：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」と表示されないように、ボット番号を電話の連絡先に保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除される可能性があります。ボット専用番号を使用するか、既存の電話アプリの設定を維持するために QR リンクモードを使用してください。
</Warning>

アップストリームの参照資料：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- CAPTCHA の手順：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンク手順：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自分で管理する場合（JVM のコールドスタートが遅い場合、コンテナの初期化、共有 CPU など）は、デーモンを別途実行し、OpenClaw から接続するように設定します：

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

これにより、自動起動と OpenClaw の起動待機が省略されます。自動起動時の開始に時間がかかる場合は、`channels.signal.startupTimeoutMs` を設定します。

## コンテナモード（bbernhard/signal-cli-rest-api）

`signal-cli` をネイティブで実行する代わりに、REST + WebSocket インターフェースの背後で `signal-cli` をラップする [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker コンテナを使用できます。

要件：

- リアルタイムでメッセージを受信するには、コンテナを `MODE=json-rpc` で実行する**必要があります**。
- OpenClaw に接続する前に、コンテナ内で Signal アカウントを登録またはリンクしてください。

`docker-compose.yml` サービスの例：

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

OpenClaw の設定：

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // または自動検出する場合は "auto"
    },
  },
}
```

`apiMode` は OpenClaw が使用するプロトコルを制御します：

| 値            | 動作                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- |
| `"auto"`      | （デフォルト）両方のトランスポートを検査し、ストリーミングでコンテナの WebSocket 受信を検証する |
| `"native"`    | ネイティブ signal-cli を強制する（`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE）     |
| `"container"` | bbernhard コンテナを強制する（`/v2/send` の REST、`/v1/receive/{account}` の WebSocket）   |

`apiMode` が `"auto"` の場合、OpenClaw は検出したモードをデーモン URL ごとに 30 秒間キャッシュし、検査の繰り返しを回避します（両方のトランスポートが正常な場合はネイティブが優先されます）。コンテナ受信は、`/v1/receive/{account}` が WebSocket にアップグレードされた後にのみストリーミング用として選択されます。これには `MODE=json-rpc` が必要です。

コンテナが対応する API を公開している場合、コンテナモードはネイティブモードと同じ Signal 操作に対応します。これには、送信、受信、添付ファイル、入力中インジケーター、既読・閲覧済み通知、リアクション、グループ、装飾付きテキストが含まれます。OpenClaw は、`group.{base64(internal_id)}` 形式のグループ ID や、書式付きテキスト用の `text_mode: "styled"` を含め、ネイティブの Signal RPC 呼び出しをコンテナの REST ペイロードに変換します。

運用上の注意：

- コンテナモードでは `autoStart: false` を使用してください。`apiMode: "container"` が選択されている場合、OpenClaw がネイティブデーモンを起動しないようにする必要があります。
- 受信には `MODE=json-rpc` を使用してください。`MODE=normal` では `/v1/about` が正常に見える場合がありますが、`/v1/receive/{account}` は WebSocket にアップグレードされないため、OpenClaw は `auto` モードでコンテナ受信ストリーミングを選択しません。
- `httpUrl` が bbernhard REST API を指す場合は `apiMode: "container"`、ネイティブ `signal-cli` の JSON-RPC/SSE を指す場合は `"native"`、デプロイ環境によって異なる可能性がある場合は `"auto"` を設定します。
- コンテナでの添付ファイルのダウンロードには、ネイティブモードと同じメディアのバイト数制限が適用されます。サーバーが `Content-Length` を送信する場合、サイズ超過のレスポンスは完全にバッファリングされる前に拒否されます。それ以外の場合はストリーミング中に拒否されます。

## アクセス制御（DM + グループ）

DM：

- デフォルト：`channels.signal.dmPolicy = "pairing"`。
- 不明な送信者にはペアリングコードが発行され、承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
- `openclaw pairing list signal` と `openclaw pairing approve signal <CODE>` で承認します。
- ペアリングは Signal の DM でデフォルトのトークン交換方法です。詳細：[ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` から取得）は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom` は、`allowlist` が設定されている場合にグループ返信をトリガーできるグループまたは送信者を制御します。エントリには、Signal グループ ID（未加工、`group:<id>`、または `signal:group:<id>`）、送信者の電話番号、`uuid:<id>` 値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` では、`requireMention`、`tools`、`toolsBySender` を使ってグループの動作を上書きできます。
- 複数アカウント構成でアカウントごとの上書きを行うには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` でグループを許可リストに追加しても、それだけではメンション必須設定は無効になりません。個別に設定された `channels.signal.groups["<group-id>"]` エントリは、`requireMention: true` が明示的に設定されていない限り、すべてのグループメッセージを処理します。
- 実行時の注意：`channels.signal` が完全に存在しない場合、実行時はグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

## 仕組み（動作）

- ネイティブモード：`signal-cli` はデーモンとして実行され、Gateway は SSE 経由でイベントを読み取ります。
- コンテナモード：Gateway は REST API 経由で送信し、WebSocket 経由で受信します。
- 受信メッセージは共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループにルーティングされます。
- 受信メッセージへの返信には、バックエンドが受信時のタイムスタンプと送信者を受け入れる場合、Signal ネイティブの引用メタデータが含まれます。引用メタデータがない場合や拒否された場合、OpenClaw は通常のメッセージとして返信を送信します。
- ネイティブ引用の使用は `channels.signal.replyToMode = off | first | all | batched` で設定します。チャット種別ごとに上書きするには `channels.signal.replyToModeByChatType.direct/group` を使用します。`channels.signal.accounts.<id>` 配下のアカウントレベルの値が優先されます。

## メディアと制限

- 送信テキストは `channels.signal.textChunkLimit`（デフォルト 4000）に従って分割されます。
- オプションの改行分割: `channels.signal.chunkMode="newline"` を設定すると、長さによる分割の前に空行（段落境界）で分割されます。
- 添付ファイルに対応しています（`signal-cli` から base64 形式で取得）。
- `contentType` がない場合、ボイスメモの添付では `signal-cli` のファイル名を MIME のフォールバックとして使用するため、音声文字起こしで AAC ボイスメモを引き続き分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト 8）。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使用します。
- グループ履歴コンテキストには `channels.signal.historyLimit`（または `channels.signal.accounts.*.historyLimit`）が使用され、未設定の場合は `messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します（デフォルト 50）。

## 入力中表示と既読通知

- **入力中インジケーター**: OpenClaw は `signal-cli sendTyping` を介して入力中シグナルを送信し、返信の実行中はそれを更新します。
- **既読通知**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読通知を転送します。
- `signal-cli` はグループの既読通知を公開しません。

## ライフサイクル状態リアクション

`messages.statusReactions.enabled: true` を設定すると、Signal で受信ターンに対する共通のキュー待ち／思考中／ツール／Compaction／完了／エラーのリアクションライフサイクルが表示されます。Signal は受信メッセージのタイムスタンプをリアクション対象として使用します。グループリアクションは、Signal グループ ID と元の送信者を対象作成者として送信されます。

状態リアクションには、確認リアクションと、それに一致する `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions`、または `all`）も必要です。Signal の状態リアクションを無効にするには `channels.signal.reactionLevel: "off"` を設定します。

`messages.removeAckAfterReply: true` を設定すると、構成された保持時間の経過後に最終状態リアクションが消去されます。それ以外の場合、Signal は最終的な完了／エラー状態の後に最初の確認リアクションを復元します。

## リアクション（メッセージツール）

`channel=signal` を指定して `message action=react` を使用します。

- 対象: 送信者の E.164 または UUID（ペアリング出力の `uuid:<id>` を使用。UUID 単体でも動作します）。
- `messageId` は、リアクションするメッセージの Signal タイムスタンプです。
- グループリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクションアクションを有効／無効にします（デフォルト true）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト `minimal`）。
  - `off`／`ack` はエージェントのリアクションを無効にします（メッセージツールの `react` はエラーになります）。
  - `minimal`／`extensive` はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウントごとの上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 承認リアクション

Signal の実行および Plugin 承認プロンプトでは、最上位の `approvals.exec` および `approvals.plugin` ルーティングブロックを使用します。Signal には `channels.signal.execApprovals` ブロックはありません。

- `👍` は一度だけ承認します。
- `👎` は拒否します。
- リクエストで永続的な承認が提示されている場合は、`/approve <id> allow-always` を使用します。

承認リアクションを解決するには、`channels.signal.allowFrom`、`channels.signal.defaultTo`、または一致するアカウントレベルのフィールドで Signal 承認者を明示的に指定する必要があります。同じチャットへの直接実行承認プロンプトでは、明示的な承認者がいなくても、重複するローカルの `/approve` フォールバックを非表示にできます。承認者のいないグループ承認では、ローカルのフォールバックが引き続き表示されます。

## 配信先（CLI／Cron）

- DM: `signal:+15551234567`（または通常の E.164）。
- UUID DM: `uuid:<id>`（または UUID 単体）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（Signal アカウントで対応している場合）。

## エイリアス

繰り返し使用する Signal の対象に安定した名前を付けるには、エイリアスを設定します。エイリアスは OpenClaw 側の設定にすぎず、Signal の連絡先を作成または編集するものではありません。

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

Signal の配信先を指定できる場所では、どこでもエイリアスを使用できます。

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

アカウントごとのエイリアスは最上位のエイリアスを継承し、名前を追加または上書きできます。

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

`openclaw directory peers list --channel signal` と `openclaw directory groups list --channel signal` は、設定済みのエイリアスを一覧表示します。Signal ディレクトリは設定に基づいており、Signal の連絡先をライブ照会したり、Signal アカウントを変更したりしません。

## トラブルシューティング

まず次の手順を実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

その後、必要に応じて DM のペアリング状態を確認します。

```bash
openclaw pairing list signal
```

一般的な障害:

- デーモンには到達できるが返信がない: アカウント／デーモン設定（`httpUrl`、`account`）と受信モードを確認します。
- DM が無視される: 送信者のペアリング承認が保留中です。
- グループメッセージが無視される: グループの送信者／メンション制御によって配信がブロックされています。
- 編集後に設定検証エラーが発生する: `openclaw doctor --fix` を実行します。
- 診断に Signal が表示されない: `channels.signal.enabled: true` になっていることを確認します。

追加の確認:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージ手順については、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)を参照してください。

## セキュリティに関する注意事項

- `signal-cli` はアカウントキーをローカル（通常は `~/.local/share/signal-cli/data/`）に保存します。
- サーバーの移行または再構築の前に、Signal アカウントの状態をバックアップしてください。
- より広範な DM アクセスを明示的に許可する場合を除き、`channels.signal.dmPolicy: "pairing"` を維持してください。
- SMS 検証が必要なのは登録または復旧フローのみですが、電話番号／アカウントの管理権を失うと再登録が複雑になる可能性があります。

## 設定リファレンス（Signal）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャンネルの起動を有効／無効にします。
- `channels.signal.apiMode`: `auto | native | container`（デフォルト: auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api)を参照してください。
- `channels.signal.account`: ボットアカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.configPath`: オプションの `signal-cli --config` ディレクトリ。
- `channels.signal.httpUrl`: デーモンの完全な URL（ホスト／ポートを上書きします）。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモンのバインド先（デフォルト `127.0.0.1:8080`）。
- `channels.signal.autoStart`: デーモンを自動起動します（`httpUrl` が未設定の場合、デフォルト true）。
- `channels.signal.startupTimeoutMs`: 起動待機のタイムアウト（ミリ秒、最小 1000、上限 120000、デフォルト 30000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM の許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がないため、電話番号／UUID ID を使用してください。
- `channels.signal.aliases`: DM またはグループの配信先に使用する OpenClaw 側のエイリアス。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループの許可リスト。Signal グループ ID（そのまま、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` 値を指定できます。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーとするグループごとの上書き。対応フィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: 複数アカウント構成における、アカウントごとの `channels.signal.groups`。
- `channels.signal.accounts.<id>.aliases`: アカウントごとのエイリアス。最上位のエイリアスとマージされます。
- `channels.signal.replyToMode`: ネイティブ返信の引用モード。`off | first | all | batched`（デフォルト: `all`）。
- `channels.signal.replyToModeByChatType.direct`、`channels.signal.replyToModeByChatType.group`: チャット種別ごとのネイティブ返信引用の上書き。
- `channels.signal.accounts.<id>.replyToMode`、`channels.signal.accounts.<id>.replyToModeByChatType.direct`、`channels.signal.accounts.<id>.replyToModeByChatType.group`: アカウントごとの返信引用の上書き。
- `channels.signal.historyLimit`: コンテキストに含めるグループメッセージの最大数（0 で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴上限。ユーザーごとの上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクの文字数（デフォルト 4000）。
- `channels.signal.chunkMode`: `length`（デフォルト）、または長さによる分割の前に空行（段落境界）で分割する `newline`。
- `channels.signal.mediaMaxMb`: 受信／送信メディアの上限（MB、デフォルト 8）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト `minimal`）。[リアクション](#reactions-message-tool)を参照してください。
- `channels.signal.reactionNotifications`: `off | own | all | allowlist`（デフォルト `own`）- 他者からの受信リアクションをエージェントに通知する条件。
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"` の場合に、リアクションがエージェントへ通知される送信者。
- `channels.signal.blockStreaming`、`channels.signal.blockStreamingCoalesce`: チャンネル間で共有されるブロックモードのストリーミング制御。[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションに対応していません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連項目

- [チャンネル概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンション制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
