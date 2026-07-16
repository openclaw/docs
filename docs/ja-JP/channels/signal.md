---
read_when:
    - Signal サポートの設定
    - Signal の送受信のデバッグ
summary: signal-cli（ネイティブデーモンまたは bbernhard コンテナ）による Signal サポート、セットアップ方法、および電話番号モデル
title: Signal
x-i18n:
    generated_at: "2026-07-16T11:23:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal はダウンロード可能なチャンネル Plugin（`@openclaw/signal`）です。Gateway は HTTP 経由で `signal-cli` と通信します。ネイティブデーモン（JSON-RPC + SSE）または [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) コンテナ（REST + WebSocket）のいずれかを使用します。OpenClaw には libsignal は組み込まれていません。

## 番号モデル（最初にお読みください）

- Gateway は **Signal デバイス**、つまり `signal-cli` アカウントに接続します。
- ボットを**個人用 Signal アカウント**で実行すると、ループ防止のため自分自身のメッセージは無視されます。
- 「ボットにメッセージを送ると返信される」ようにするには、**別のボット用番号**を使用してください。

## インストール

```bash
openclaw plugins install @openclaw/signal
```

単純な Plugin 指定では、最初に ClawHub を試し、その後 npm にフォールバックします。`openclaw plugins install clawhub:@openclaw/signal` または `npm:@openclaw/signal` でソースを指定できます。`plugins install` は Plugin を登録して有効にするため、別途 `enable` の手順は不要です。一般的なインストール規則については、[Plugin](/ja-JP/tools/plugin)を参照してください。

## クイックセットアップ

<Steps>
  <Step title="番号を選択する">
    ボットには**別の Signal 番号**を使用してください（推奨）。
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
    ウィザードは `signal-cli` が `PATH` に存在するか検出し、見つからない場合はインストールを提案します。Linux x86-64 では公式のネイティブ GraalVM ビルドをダウンロードし、macOS およびその他のアーキテクチャでは Homebrew を使用してインストールします。その後、ボット番号と `signal-cli` のパスを入力するよう求めます。

    非対話型セットアップでは、`openclaw channels add --channel signal` にボットの電話番号を指定する `--signal-number <e164>`、および Signal デーモンのエンドポイント（デフォルトは `127.0.0.1:8080`）を指定する `--http-host <host>` と `--http-port <port>` も使用できます。

  </Step>
  <Step title="アカウントをリンクまたは登録する">
    - **QR リンク（最速）：** `signal-cli link -n "OpenClaw"` を実行し、Signal でスキャンします。[パス A](#setup-path-a-link-existing-signal-account-qr)を参照してください。
    - **SMS 登録：** 専用番号を captcha と SMS 認証で登録します。[パス B](#setup-path-b-register-dedicated-bot-number-sms-linux)を参照してください。

  </Step>
  <Step title="検証してペアリングする">
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

| フィールド        | 説明                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 形式のボット電話番号（`+15551234567`） |
| `cliPath`    | `signal-cli` へのパス（`PATH` にある場合は `signal-cli`）  |
| `configPath` | `--config` として渡される signal-cli 設定ディレクトリ        |
| `dmPolicy`   | DM アクセスポリシー（`pairing` を推奨）          |
| `allowFrom`  | DM を許可する電話番号または `uuid:<id>` の値 |

複数アカウントのサポート：アカウントごとの設定と任意の `name` を含む `channels.signal.accounts` を使用します。共通パターンについては、[複数アカウントのチャンネル](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## 概要

- 決定的ルーティング：返信は必ず Signal に返されます。
- DM はエージェントのメインセッションを共有し、グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。
- デフォルトでは、Signal は `/config set|unset` によってトリガーされた設定更新を書き込む場合があります（`commands.config: true` が必要）。`channels.signal.configWrites: false` で無効にできます。

## セットアップパス A：既存の Signal アカウントをリンクする（QR）

1. `signal-cli`（JVM またはネイティブビルド）をインストールするか、`openclaw channels add` にインストールさせます。
2. ボットアカウントをリンクします：`signal-cli link -n "OpenClaw"` を実行し、Signal で QR コードをスキャンします。
3. Signal を設定して Gateway を起動します。

## セットアップパス B：専用ボット番号を登録する（SMS、Linux）

既存の Signal アプリアカウントをリンクする代わりに、専用のボット番号を使用する場合に選択します。以下のフローは Ubuntu 24 でテストされています。

1. SMS（固定電話の場合は音声認証）を受信できる番号を用意します。専用のボット番号を使用すると、アカウントやセッションの競合を回避できます。
2. Gateway ホストに `signal-cli` をインストールします：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使用する場合は、最初に JRE をインストールしてください。`signal-cli` は最新の状態に保ってください。上流では、Signal サーバー API の変更に伴い古いリリースが動作しなくなる可能性があるとされています。

3. 番号を登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合（この手順を完了するにはブラウザーへのアクセスが必要です）：

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` リンクのリンク先をコピーします。
3. 可能であれば、ブラウザーセッションと同じ外部 IP から実行してください（captcha トークンは短時間で期限切れになります）。
4. 直ちに登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、Gateway を再起動してチャンネルを検証します：

```bash
# ユーザーの systemd サービスとして Gateway を実行している場合：
systemctl --user restart openclaw-gateway.service

# 続いて検証：
openclaw doctor
openclaw channels status --probe
```

5. DM の送信者をペアリングします：
   - ボット番号に任意のメッセージを送信します。
   - サーバーで承認します：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」と表示されないように、ボット番号をスマートフォンの連絡先に保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションの認証が解除される場合があります。専用のボット番号を使用するか、既存のスマートフォンアプリの設定を維持するには QR リンクモードを使用してください。
</Warning>

上流の参考資料：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- captcha フロー：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自身で管理する場合（JVM のコールドスタートが遅い、コンテナの初期化、CPU の共有など）は、デーモンを別途実行して OpenClaw の接続先として指定します：

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

これにより、自動起動と OpenClaw の起動待機がスキップされます。自動起動の開始が遅い場合は、`channels.signal.startupTimeoutMs` を設定してください。

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

`apiMode` は、OpenClaw が使用するプロトコルを制御します：

| 値         | 動作                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （デフォルト）両方のトランスポートをプローブし、ストリーミングでコンテナの WebSocket 受信を検証する    |
| `"native"`    | ネイティブ signal-cli を強制する（`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE）         |
| `"container"` | bbernhard コンテナを強制する（`/v2/send` の REST、`/v1/receive/{account}` の WebSocket） |

`apiMode` が `"auto"` の場合、OpenClaw は繰り返しプローブするのを避けるため、検出したモードをデーモン URL ごとに 30 秒間キャッシュします（両方のトランスポートが正常な場合はネイティブが優先されます）。コンテナ受信がストリーミング用に選択されるのは、`/v1/receive/{account}` が WebSocket にアップグレードされた後のみであり、これには `MODE=json-rpc` が必要です。

コンテナモードでは、コンテナが対応する API を公開している場合、ネイティブモードと同じ Signal 操作がサポートされます。これには、送信、受信、添付ファイル、入力中インジケーター、既読・閲覧済み通知、リアクション、グループ、スタイル付きテキストが含まれます。OpenClaw は、`group.{base64(internal_id)}` グループ ID や書式付きテキスト用の `text_mode: "styled"` を含む、ネイティブ Signal RPC 呼び出しをコンテナの REST ペイロードに変換します。

運用上の注意：

- コンテナモードでは `autoStart: false` を使用してください。`apiMode: "container"` が選択されている場合、OpenClaw はネイティブデーモンを起動しないようにする必要があります。
- 受信には `MODE=json-rpc` を使用してください。`MODE=normal` を使用すると `/v1/about` が正常に見える場合がありますが、`/v1/receive/{account}` は WebSocket にアップグレードされないため、OpenClaw は `auto` モードでコンテナ受信ストリーミングを選択しません。
- `httpUrl` が bbernhard REST API を指す場合は `apiMode: "container"`、ネイティブの `signal-cli` JSON-RPC/SSE を指す場合は `"native"`、デプロイによって異なる可能性がある場合は `"auto"` を設定します。
- コンテナの添付ファイルダウンロードには、ネイティブモードと同じメディアのバイト数制限が適用されます。サーバーが `Content-Length` を送信する場合、サイズ超過のレスポンスは完全にバッファリングされる前に拒否され、それ以外の場合はストリーミング中に拒否されます。

## アクセス制御（DM + グループ）

DM：

- デフォルト：`channels.signal.dmPolicy = "pairing"`。
- 不明な送信者にはペアリングコードが送られ、承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
- `openclaw pairing list signal` と `openclaw pairing approve signal <CODE>` を使用して承認します。
- Signal の DM では、ペアリングがデフォルトのトークン交換方式です。詳細：[ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` 由来）は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `allowlist` が設定されている場合、`channels.signal.groupAllowFrom` はグループ返信をトリガーできるグループまたは送信者を制御します。エントリには Signal グループ ID（未加工、`group:<id>`、または `signal:group:<id>`）、送信者の電話番号、`uuid:<id>` の値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` は、`requireMention`、`tools`、および `toolsBySender` を使用してグループの動作を上書きできます。
- 複数アカウントのセットアップでアカウントごとに上書きするには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` を通じて Signal グループを許可リストに追加しても、それだけではメンションによるゲートは無効になりません。明示的に設定された `channels.signal.groups["<group-id>"]` エントリは、`requireMention=true` が設定されていない限り、すべてのグループメッセージを処理します。
- `requireMention=true` を使用すると、Signal ネイティブの @メンションが、構造化されたメンションメタデータからボットアカウントの電話番号または `accountUuid` と照合されます。設定済みの `mentionPatterns` は、プレーンテキストのフォールバックとして引き続き使用されます。
- 実行時の注意：`channels.signal` が完全に存在しない場合、実行時にはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも同様です）。

制限されたコンテキストを持つメンションゲート付きグループ：

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

許可されていてもボットへのメンションがないグループメッセージには応答せず、上限付きの保留履歴ウィンドウにのみ保持されます。その後、ネイティブの@メンションまたはフォールバックのテキストメンションによってボットがトリガーされると、OpenClawはその最近のコンテキストを含め、同じグループに返信します。スキップされた添付ファイルの本体はダウンロードされません。保留中のコンテキストには、簡潔なメディアプレースホルダーとしてのみ表示される場合があります。

## 動作の仕組み（挙動）

- ネイティブモード: `signal-cli`はデーモンとして実行され、GatewayはSSE経由でイベントを読み取ります。
- コンテナモード: GatewayはREST API経由で送信し、WebSocket経由で受信します。
- 受信メッセージは共有チャネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループにルーティングされます。
- バックエンドが受信タイムスタンプと送信者を受け入れる場合、受信メッセージへの返信にはSignalネイティブの引用メタデータが含まれます。引用メタデータがないか拒否された場合、OpenClawは通常のメッセージとして返信を送信します。
- ネイティブ引用の使用は`channels.signal.replyToMode = off | first | all | batched`で設定し、チャット種別ごとのオーバーライドには`channels.signal.replyToModeByChatType.direct/group`を使用します。`channels.signal.accounts.<id>`のアカウントレベルの値が優先されます。

## メディアと制限

- 送信テキストは`channels.signal.textChunkLimit`（デフォルト4000）で分割されます。
- 任意の改行分割: `channels.signal.streaming.chunkMode="newline"`を設定すると、長さによる分割の前に空行（段落境界）で分割されます。
- 添付ファイルに対応しています（`signal-cli`からbase64を取得）。
- `contentType`がない場合、ボイスメモの添付ファイルはMIMEフォールバックとして`signal-cli`ファイル名を使用するため、音声文字起こしでもAACボイスメモを分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト8）。
- メディアのダウンロードをスキップするには`channels.signal.ignoreAttachments`を使用します。
- グループ履歴コンテキストでは`channels.signal.historyLimit`（または`channels.signal.accounts.*.historyLimit`）を使用し、未設定の場合は`messages.groupChat.historyLimit`にフォールバックします。無効にするには`0`を設定します（デフォルト50）。

## 入力中表示と既読通知

- **入力中インジケーター**: OpenClawは`signal-cli sendTyping`経由で入力中シグナルを送信し、返信の実行中はそれを更新します。
- **既読通知**: `channels.signal.sendReadReceipts`がtrueの場合、OpenClawは許可されたDMの既読通知を転送します。
- `signal-cli`はグループの既読通知を公開しません。

## ライフサイクルステータスリアクション

Signalで受信ターンに対する共有のキュー済み／思考中／ツール／Compaction／完了／エラーのリアクションライフサイクルを表示するには、`messages.statusReactions.enabled: true`を設定します。Signalは受信メッセージのタイムスタンプをリアクション対象として使用します。グループリアクションは、SignalグループIDと元の送信者を対象送信者として送信されます。

ステータスリアクションには、確認リアクションと一致する`messages.ackReactionScope`（`direct`、`group-all`、`group-mentions`、または`all`）も必要です。Signalのステータスリアクションを無効にするには`channels.signal.reactionLevel: "off"`を設定します。

`messages.removeAckAfterReply: true`は、設定された保持時間後に最終ステータスリアクションを消去します。それ以外の場合、Signalは最終的な完了／エラー状態の後に最初の確認リアクションを復元します。

## リアクション（メッセージツール）

`message action=react`を`channel=signal`とともに使用します。

- 対象: 送信者のE.164またはUUID（ペアリング出力の`uuid:<id>`を使用します。プレフィックスなしのUUIDも使用できます）。
- `messageId`は、リアクション対象メッセージのSignalタイムスタンプです。
- グループリアクションには`targetAuthor`または`targetAuthorUuid`が必要です。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクションアクションを有効／無効にします（デフォルトtrue）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト`minimal`）。
  - `off`/`ack`はエージェントのリアクションを無効にします（メッセージツール`react`はエラーになります）。
  - `minimal`/`extensive`はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウントごとのオーバーライド: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 承認リアクション

SignalのexecおよびPlugin承認プロンプトは、トップレベルの`approvals.exec`および`approvals.plugin`ルーティングブロックを使用します。Signalには`channels.signal.execApprovals`ブロックはありません。

- `👍`は1回のみ承認します。
- `👎`は拒否します。
- リクエストで永続的な承認が提示される場合は`/approve <id> allow-always`を使用します。

承認リアクションの解決には、`channels.signal.allowFrom`、`channels.signal.defaultTo`、または一致するアカウントレベルのフィールドで明示的に指定されたSignal承認者が必要です。同じチャットに直接送られるexec承認プロンプトでは、明示的な承認者がいなくても重複するローカルの`/approve`フォールバックを抑制できます。承認者がいないグループ承認では、ローカルフォールバックが表示されたままになります。

## 配信先（CLI/Cron）

- DM: `signal:+15551234567`（または通常のE.164）。
- UUIDのDM: `uuid:<id>`（またはプレフィックスなしのUUID）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（使用しているSignalアカウントが対応している場合）。

## エイリアス

繰り返し使用するSignalの配信先に安定した名前を付けるには、エイリアスを設定します。エイリアスはOpenClaw側の設定にすぎず、Signalの連絡先を作成または編集するものではありません。

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

Signalの配信先を指定できる場所では、どこでもエイリアスを使用できます。

```bash
openclaw message send --channel signal --target signal:ops --message "デプロイが完了しました"
```

アカウントごとのエイリアスはトップレベルのエイリアスを継承し、名前の追加やオーバーライドができます。

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

`openclaw directory peers list --channel signal`および`openclaw directory groups list --channel signal`は設定済みのエイリアスを一覧表示します。Signalディレクトリは設定に基づいており、Signalの連絡先をリアルタイムで照会したり、Signalアカウントを変更したりしません。

## トラブルシューティング

まず、次の手順を実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、次にDMのペアリング状態を確認します。

```bash
openclaw pairing list signal
```

一般的な障害:

- デーモンに到達できるが返信がない: アカウント／デーモン設定（`httpUrl`、`account`）と受信モードを確認してください。
- DMが無視される: 送信者はペアリング承認待ちです。
- グループメッセージが無視される: グループの送信者／メンションゲートによって配信がブロックされています。
- 編集後に設定検証エラーが発生する: `openclaw doctor --fix`を実行してください。
- 診断にSignalが表示されない: `channels.signal.enabled: true`を確認してください。

追加の確認:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージの流れについては、[チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)を参照してください。

## セキュリティ上の注意

- `signal-cli`はアカウントキーをローカルに保存します（通常は`~/.local/share/signal-cli/data/`）。
- サーバーの移行または再構築の前に、Signalアカウントの状態をバックアップしてください。
- より広範なDMアクセスを明示的に必要とする場合を除き、`channels.signal.dmPolicy: "pairing"`を維持してください。
- SMS認証が必要なのは登録または復旧フローのみですが、番号／アカウントの制御を失うと再登録が複雑になる可能性があります。

## 設定リファレンス（Signal）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャネルの起動を有効／無効にします。
- `channels.signal.apiMode`: `auto | native | container`（デフォルト: auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api)を参照してください。
- `channels.signal.account`: ボットアカウントのE.164。
- `channels.signal.accountUuid`: ネイティブの@メンション検出とループ防止に使用する、任意のボットアカウントUUID。
- `channels.signal.cliPath`: `signal-cli`へのパス。
- `channels.signal.configPath`: 任意の`signal-cli --config`ディレクトリ。
- `channels.signal.httpUrl`: 完全なデーモンURL（ホスト／ポートをオーバーライド）。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモンのバインド先（デフォルト`127.0.0.1:8080`）。
- `channels.signal.autoStart`: デーモンを自動起動します（`httpUrl`が未設定の場合、デフォルトtrue）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ミリ秒、最小1000、上限120000、デフォルト30000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM許可リスト（E.164または`uuid:<id>`）。`open`には`"*"`が必要です。Signalにはユーザー名がないため、電話番号／UUID IDを使用してください。
- `channels.signal.aliases`: DMまたはグループの配信先に対するOpenClaw側のエイリアス。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ許可リスト。SignalグループID（そのまま、`group:<id>`、または`signal:group:<id>`）、送信者のE.164番号、または`uuid:<id>`の値を受け付けます。
- `channels.signal.groups`: SignalグループID（または`"*"`）をキーとするグループごとのオーバーライド。対応フィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: 複数アカウント構成向けの、アカウントごとの`channels.signal.groups`。
- `channels.signal.accounts.<id>.aliases`: アカウントごとのエイリアス。トップレベルのエイリアスとマージされます。
- `channels.signal.replyToMode`: ネイティブ返信の引用モード、`off | first | all | batched`（デフォルト: `all`）。
- `channels.signal.replyToModeByChatType.direct`、`channels.signal.replyToModeByChatType.group`: チャット種別ごとのネイティブ返信引用のオーバーライド。
- `channels.signal.accounts.<id>.replyToMode`、`channels.signal.accounts.<id>.replyToModeByChatType.direct`、`channels.signal.accounts.<id>.replyToModeByChatType.group`: アカウントごとの返信引用のオーバーライド。
- `channels.signal.historyLimit`: コンテキストに含めるグループメッセージの最大数（0で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位のDM履歴上限。ユーザーごとのオーバーライド: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 文字数単位の送信チャンクサイズ（デフォルト4000）。
- `channels.signal.streaming.chunkMode`: `length`（デフォルト）、または長さによる分割の前に空行（段落境界）で分割する`newline`。
- `channels.signal.mediaMaxMb`: 受信／送信メディアの上限（MB、デフォルト8）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト`minimal`）。[リアクション](#reactions-message-tool)を参照してください。
- `channels.signal.reactionNotifications`: `off | own | all | allowlist`（デフォルト`own`）—他者からの受信リアクションをエージェントに通知する条件。
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"`の場合に、そのリアクションがエージェントへ通知される送信者。
- `channels.signal.streaming.block.enabled`、`channels.signal.streaming.block.coalesce`: チャネル間で共有されるブロックモードのストリーミング制御。[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（プレーンテキストのフォールバック。ボットアカウントのアイデンティティが設定されている場合、Signal ネイティブの @メンションは構造化メタデータから検出されます）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと堅牢化
