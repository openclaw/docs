---
read_when:
    - Signal サポートの設定
    - Signal の送受信をデバッグする
summary: signal-cli（ネイティブデーモンまたは bbernhard コンテナ）による Signal 対応、セットアップパス、および番号モデル
title: Signal
x-i18n:
    generated_at: "2026-07-12T14:19:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal はダウンロード可能なチャンネル Plugin（`@openclaw/signal`）です。Gateway は HTTP 経由で `signal-cli` と通信します。ネイティブデーモン（JSON-RPC + SSE）または [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) コンテナ（REST + WebSocket）を使用できます。OpenClaw は libsignal を組み込みません。

## 番号モデル（最初にお読みください）

- Gateway は **Signal デバイス**、つまり `signal-cli` アカウントに接続します。
- ボットを**個人用の Signal アカウント**で実行すると、ループ防止のため自分自身のメッセージは無視されます。
- 「ボットにメッセージを送ると返信される」動作にするには、**別のボット用番号**を使用してください。

## インストール

```bash
openclaw plugins install @openclaw/signal
```

修飾子のない Plugin 指定では、最初に ClawHub を試し、その後 npm にフォールバックします。`openclaw plugins install clawhub:@openclaw/signal` または `npm:@openclaw/signal` でソースを強制指定できます。`plugins install` は Plugin を登録して有効化するため、別途 `enable` を実行する必要はありません。一般的なインストール規則については、[Plugin](/ja-JP/tools/plugin)を参照してください。

## クイックセットアップ

<Steps>
  <Step title="番号を選択">
    ボットには**別の Signal 番号**を使用してください（推奨）。
  </Step>
  <Step title="Plugin をインストール">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="ガイド付きセットアップを実行">
    ```bash
    openclaw channels add
    ```
    ウィザードは `signal-cli` が `PATH` に存在するかを検出し、存在しない場合はインストールを提案します。Linux x86-64 では公式のネイティブ GraalVM ビルドをダウンロードし、macOS およびその他のアーキテクチャでは Homebrew を使用してインストールします。その後、ボット番号と `signal-cli` のパスを入力するよう求めます。
  </Step>
  <Step title="アカウントをリンクまたは登録">
    - **QR リンク（最速）：** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。[パス A](#setup-path-a-link-existing-signal-account-qr)を参照してください。
    - **SMS 登録：** 専用番号を captcha と SMS 認証で登録します。[パス B](#setup-path-b-register-dedicated-bot-number-sms-linux)を参照してください。

  </Step>
  <Step title="検証してペアリング">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    最初の DM を送信し、ペアリングを承認します：`openclaw pairing approve signal <CODE>`。
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

| フィールド     | 説明                                                   |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 形式のボット電話番号（`+15551234567`）             |
| `cliPath`    | `signal-cli` へのパス（`PATH` 上にある場合は `signal-cli`） |
| `configPath` | `--config` として渡す signal-cli 設定ディレクトリ           |
| `dmPolicy`   | DM アクセスポリシー（`pairing` を推奨）                    |
| `allowFrom`  | DM を許可する電話番号または `uuid:<id>` 値                  |

マルチアカウント対応：アカウントごとの設定と任意の `name` を指定して `channels.signal.accounts` を使用します。共通パターンについては、[マルチアカウントチャンネル](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## 概要

- 決定的ルーティング：返信は常に Signal に返されます。
- DM はエージェントのメインセッションを共有し、グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。
- デフォルトでは、Signal は `/config set|unset` によってトリガーされる設定更新を書き込む場合があります（`commands.config: true` が必要）。無効にするには `channels.signal.configWrites: false` を設定します。

## セットアップパス A：既存の Signal アカウントをリンク（QR）

1. `signal-cli`（JVM またはネイティブビルド）をインストールするか、`openclaw channels add` にインストールさせます。
2. ボットアカウントをリンクします：`signal-cli link -n "OpenClaw"` を実行し、Signal で QR コードをスキャンします。
3. Signal を設定して Gateway を起動します。

## セットアップパス B：専用ボット番号を登録（SMS、Linux）

既存の Signal アプリアカウントをリンクする代わりに、専用ボット番号を使用する場合はこの方法を使用します。以下の手順は Ubuntu 24 でテスト済みです。

1. SMS（固定電話の場合は音声認証）を受信できる番号を取得します。専用ボット番号を使用すると、アカウントやセッションの競合を回避できます。
2. Gateway ホストに `signal-cli` をインストールします：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使用する場合は、最初に JRE をインストールしてください。`signal-cli` を最新の状態に保ってください。Signal サーバー API の変更により、古いリリースが動作しなくなる可能性があるとアップストリームで説明されています。

3. 番号を登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合（この手順を完了するにはブラウザへのアクセスが必要です）：

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` リンク先をコピーします。
3. 可能であれば、ブラウザセッションと同じ外部 IP から実行してください（captcha トークンはすぐに期限切れになります）。
4. 直ちに登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、Gateway を再起動してチャンネルを検証します：

```bash
# Gateway をユーザー systemd サービスとして実行している場合：
systemctl --user restart openclaw-gateway.service

# 続いて検証：
openclaw doctor
openclaw channels status --probe
```

5. DM 送信者をペアリングします：
   - ボット番号に任意のメッセージを送信します。
   - サーバーで承認します：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」と表示されないよう、スマートフォンの連絡先にボット番号を保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除される可能性があります。専用ボット番号を使用するか、既存のスマートフォンアプリ設定を維持するために QR リンクモードを使用してください。
</Warning>

アップストリームの参考資料：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- captcha の手順：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクの手順：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自身で管理する場合（JVM のコールドスタートが遅い、コンテナ初期化、CPU を共有している場合など）は、デーモンを別途実行し、OpenClaw から接続先を指定します：

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

これにより、自動起動と OpenClaw の起動待機がスキップされます。自動起動に時間がかかる場合は、`channels.signal.startupTimeoutMs` を設定してください。

## コンテナモード（bbernhard/signal-cli-rest-api）

`signal-cli` をネイティブで実行する代わりに、REST + WebSocket インターフェースで `signal-cli` をラップする [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker コンテナを使用できます。

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

| 値            | 動作                                                                                  |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （デフォルト）両方のトランスポートをプローブし、ストリーミングでコンテナの WebSocket 受信を検証します |
| `"native"`    | ネイティブ signal-cli を強制使用します（`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE） |
| `"container"` | bbernhard コンテナを強制使用します（`/v2/send` の REST、`/v1/receive/{account}` の WebSocket） |

`apiMode` が `"auto"` の場合、OpenClaw はプローブの繰り返しを避けるため、デーモン URL ごとに検出されたモードを 30 秒間キャッシュします（両方のトランスポートが正常な場合はネイティブが優先されます）。コンテナ受信がストリーミング用に選択されるのは、`/v1/receive/{account}` が WebSocket にアップグレードされた後のみであり、これには `MODE=json-rpc` が必要です。

コンテナが対応する API を公開している場合、コンテナモードはネイティブモードと同じ Signal 操作をサポートします。これには、送信、受信、添付ファイル、入力中インジケーター、既読・閲覧済み受領通知、リアクション、グループ、スタイル付きテキストが含まれます。OpenClaw はネイティブ Signal RPC 呼び出しをコンテナの REST ペイロードに変換します。これには、`group.{base64(internal_id)}` グループ ID や、書式付きテキスト用の `text_mode: "styled"` が含まれます。

運用上の注意：

- コンテナモードでは `autoStart: false` を使用してください。`apiMode: "container"` が選択されている場合、OpenClaw はネイティブデーモンを起動すべきではありません。
- 受信には `MODE=json-rpc` を使用してください。`MODE=normal` では `/v1/about` が正常に見える場合がありますが、`/v1/receive/{account}` は WebSocket にアップグレードされないため、OpenClaw は `auto` モードでコンテナの受信ストリーミングを選択しません。
- `httpUrl` が bbernhard REST API を指す場合は `apiMode: "container"`、ネイティブ `signal-cli` の JSON-RPC/SSE を指す場合は `"native"`、デプロイ環境によって異なる可能性がある場合は `"auto"` を設定してください。
- コンテナの添付ファイルダウンロードには、ネイティブモードと同じメディアバイト制限が適用されます。サイズ超過のレスポンスは、サーバーが `Content-Length` を送信する場合は完全にバッファリングされる前に拒否され、それ以外の場合はストリーミング中に拒否されます。

## アクセス制御（DM + グループ）

DM：

- デフォルト：`channels.signal.dmPolicy = "pairing"`。
- 不明な送信者にはペアリングコードが発行され、承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
- `openclaw pairing list signal` および `openclaw pairing approve signal <CODE>` で承認します。
- ペアリングは Signal DM のデフォルトのトークン交換方式です。詳細：[ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` 由来）は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `allowlist` が設定されている場合、`channels.signal.groupAllowFrom` はグループ返信をトリガーできるグループまたは送信者を制御します。エントリには Signal グループ ID（未加工、`group:<id>`、または `signal:group:<id>`）、送信者の電話番号、`uuid:<id>` 値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` では、`requireMention`、`tools`、`toolsBySender` を使用してグループの動作を上書きできます。
- マルチアカウント設定でアカウントごとの上書きを行うには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` でグループを許可リストに追加しても、それだけではメンション制限は無効になりません。個別に設定された `channels.signal.groups["<group-id>"]` エントリは、`requireMention: true` が明示的に設定されていない限り、すべてのグループメッセージを処理します。
- ランタイムに関する注意：`channels.signal` が完全に存在しない場合、グループチェックではランタイムが `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

## 仕組み（動作）

- ネイティブモード：`signal-cli` はデーモンとして実行され、Gateway は SSE 経由でイベントを読み取ります。
- コンテナモード：Gateway は REST API 経由で送信し、WebSocket 経由で受信します。
- 受信メッセージは共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループにルーティングされます。
- 受信メッセージへの返信には、バックエンドが受信タイムスタンプと作成者を受け入れる場合、Signal ネイティブの引用メタデータが含まれます。引用メタデータがないか拒否された場合、OpenClaw は返信を通常のメッセージとして送信します。
- ネイティブ引用の使用は、`channels.signal.replyToMode = off | first | all | batched`、またはチャット種別ごとの上書きとして `channels.signal.replyToModeByChatType.direct/group` で設定します。`channels.signal.accounts.<id>` 配下のアカウントレベルの値が優先されます。

## メディアと制限

- 送信テキストは `channels.signal.textChunkLimit`（デフォルト 4000）に従ってチャンク分割されます。
- オプションの改行単位チャンク分割: `channels.signal.chunkMode="newline"` を設定すると、長さによるチャンク分割の前に空行（段落境界）で分割されます。
- 添付ファイルに対応しています（`signal-cli` から base64 形式で取得）。
- `contentType` がない場合、ボイスメモの添付ファイルでは `signal-cli` のファイル名を MIME のフォールバックとして使用するため、音声文字起こしで AAC ボイスメモを引き続き分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト 8）。
- メディアのダウンロードをスキップするには、`channels.signal.ignoreAttachments` を使用します。
- グループ履歴コンテキストでは `channels.signal.historyLimit`（または `channels.signal.accounts.*.historyLimit`）を使用し、未設定の場合は `messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します（デフォルト 50）。

## 入力中表示 + 既読通知

- **入力中インジケーター**: OpenClaw は `signal-cli sendTyping` を介して入力中シグナルを送信し、応答の処理中は更新を続けます。
- **既読通知**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読通知を転送します。
- `signal-cli` はグループの既読通知を公開していません。

## ライフサイクル状態リアクション

`messages.statusReactions.enabled: true` を設定すると、受信ターンに対して、キュー待ち・思考中・ツール実行・Compaction・完了・エラーという共通のリアクションライフサイクルを Signal に表示できます。Signal は受信メッセージのタイムスタンプをリアクション対象として使用します。グループリアクションは、Signal グループ ID に加え、元の送信者を対象作成者として送信されます。

状態リアクションには、確認リアクションと、一致する `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions`、または `all`）も必要です。Signal の状態リアクションを無効にするには、`channels.signal.reactionLevel: "off"` を設定します。

`messages.removeAckAfterReply: true` を設定すると、構成された保持時間の経過後に最終状態リアクションが削除されます。それ以外の場合、Signal は最終の完了またはエラー状態の後に最初の確認リアクションを復元します。

## リアクション（メッセージツール）

`channel=signal` を指定して `message action=react` を使用します。

- 対象: 送信者の E.164 または UUID（ペアリング出力の `uuid:<id>` を使用します。プレフィックスなしの UUID も使用できます）。
- `messageId` は、リアクション対象メッセージの Signal タイムスタンプです。
- グループリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

構成:

- `channels.signal.actions.reactions`: リアクションアクションを有効化または無効化します（デフォルト true）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト `minimal`）。
  - `off`/`ack` はエージェントのリアクションを無効にします（メッセージツールの `react` はエラーになります）。
  - `minimal`/`extensive` はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウント単位のオーバーライド: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 承認リアクション

Signal の実行およびPlugin承認プロンプトでは、トップレベルの `approvals.exec` と `approvals.plugin` ルーティングブロックを使用します。Signal には `channels.signal.execApprovals` ブロックはありません。

- `👍` は一度だけ承認します。
- `👎` は拒否します。
- リクエストで永続的な承認が提示されている場合は、`/approve <id> allow-always` を使用します。

承認リアクションの解決には、`channels.signal.allowFrom`、`channels.signal.defaultTo`、または一致するアカウントレベルのフィールドで、Signal の承認者を明示的に指定する必要があります。同じダイレクトチャット内の実行承認プロンプトでは、承認者が明示されていなくても、重複するローカルの `/approve` フォールバックを非表示にできます。承認者がいないグループ承認では、ローカルのフォールバックが表示されたままになります。

## 配信先（CLI/Cron）

- DM: `signal:+15551234567`（またはプレフィックスなしの E.164）。
- UUID DM: `uuid:<id>`（またはプレフィックスなしの UUID）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（Signal アカウントで対応している場合）。

## エイリアス

繰り返し使用する Signal の配信先に安定した名前を付けるには、エイリアスを構成します。エイリアスは OpenClaw 側の構成にのみ存在し、Signal の連絡先を作成または編集するものではありません。

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

アカウント単位のエイリアスはトップレベルのエイリアスを継承し、名前を追加またはオーバーライドできます。

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

`openclaw directory peers list --channel signal` と `openclaw directory groups list --channel signal` は、構成済みのエイリアスを一覧表示します。Signal ディレクトリは構成に基づいており、Signal の連絡先をリアルタイムで照会したり、Signal アカウントを変更したりすることはありません。

## トラブルシューティング

まず、次の手順を順番に実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に、必要に応じて DM のペアリング状態を確認します。

```bash
openclaw pairing list signal
```

よくある問題:

- デーモンには到達できるが応答がない: アカウントおよびデーモンの設定（`httpUrl`、`account`）と受信モードを確認します。
- DM が無視される: 送信者はペアリング承認待ちです。
- グループメッセージが無視される: グループ送信者またはメンションのゲートによって配信がブロックされています。
- 編集後に構成検証エラーが発生する: `openclaw doctor --fix` を実行します。
- 診断に Signal が表示されない: `channels.signal.enabled: true` であることを確認します。

追加の確認:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージ手順については、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)を参照してください。

## セキュリティ上の注意

- `signal-cli` はアカウントキーをローカルに保存します（通常は `~/.local/share/signal-cli/data/`）。
- サーバーの移行または再構築を行う前に、Signal アカウントの状態をバックアップしてください。
- より広範な DM アクセスを明示的に許可する場合を除き、`channels.signal.dmPolicy: "pairing"` を維持してください。
- SMS 検証が必要なのは登録または復旧フローのみですが、電話番号やアカウントの制御を失うと再登録が複雑になる可能性があります。

## 構成リファレンス（Signal）

完全な構成: [構成](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャンネルの起動を有効化または無効化します。
- `channels.signal.apiMode`: `auto | native | container`（デフォルト: auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api)を参照してください。
- `channels.signal.account`: ボットアカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.configPath`: オプションの `signal-cli --config` ディレクトリ。
- `channels.signal.httpUrl`: 完全なデーモン URL（ホストおよびポートより優先されます）。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモンのバインド先（デフォルト `127.0.0.1:8080`）。
- `channels.signal.autoStart`: デーモンを自動起動します（`httpUrl` が未設定の場合、デフォルト true）。
- `channels.signal.startupTimeoutMs`: 起動待機のタイムアウト（ミリ秒）（最小 1000、上限 120000、デフォルト 30000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM 許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がないため、電話番号または UUID ID を使用してください。
- `channels.signal.aliases`: DM またはグループの配信先に対する OpenClaw 側のエイリアス。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ許可リスト。Signal グループ ID（そのまま、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` 値を指定できます。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーとするグループ単位のオーバーライド。対応フィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: 複数アカウント構成向けの、アカウント単位版 `channels.signal.groups`。
- `channels.signal.accounts.<id>.aliases`: アカウント単位のエイリアス。トップレベルのエイリアスとマージされます。
- `channels.signal.replyToMode`: ネイティブ返信引用モード、`off | first | all | batched`（デフォルト: `all`）。
- `channels.signal.replyToModeByChatType.direct`、`channels.signal.replyToModeByChatType.group`: チャット種別ごとのネイティブ返信引用オーバーライド。
- `channels.signal.accounts.<id>.replyToMode`、`channels.signal.accounts.<id>.replyToModeByChatType.direct`、`channels.signal.accounts.<id>.replyToModeByChatType.group`: アカウント単位の返信引用オーバーライド。
- `channels.signal.historyLimit`: コンテキストに含めるグループメッセージの最大数（0 で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴上限。ユーザー単位のオーバーライド: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクの文字数（デフォルト 4000）。
- `channels.signal.chunkMode`: 長さで分割する `length`（デフォルト）、または長さによるチャンク分割の前に空行（段落境界）で分割する `newline`。
- `channels.signal.mediaMaxMb`: 受信および送信メディアの上限（MB、デフォルト 8）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト `minimal`）。[リアクション](#reactions-message-tool)を参照してください。
- `channels.signal.reactionNotifications`: `off | own | all | allowlist`（デフォルト `own`）- 他者から受信したリアクションをエージェントに通知する条件。
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"` の場合に、そのリアクションがエージェントへ通知される送信者。
- `channels.signal.blockStreaming`、`channels.signal.blockStreamingCoalesce`: チャンネル間で共通のブロックモードストリーミング制御。[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションに対応していません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - 対応しているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM の認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化策
