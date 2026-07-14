---
read_when:
    - Signal サポートの設定
    - Signal の送受信のデバッグ
summary: signal-cli（ネイティブデーモンまたは bbernhard コンテナ）による Signal サポート、セットアップパス、および電話番号モデル
title: Signal
x-i18n:
    generated_at: "2026-07-14T13:29:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2f4702a4bea94e28326892e9c12223fb768166470da3c3627209403d6231188d
    source_path: channels/signal.md
    workflow: 16
---

Signal はダウンロード可能なチャンネル Plugin（`@openclaw/signal`）です。Gateway は HTTP 経由で `signal-cli` と通信します。ネイティブデーモン（JSON-RPC + SSE）または [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) コンテナ（REST + WebSocket）のいずれかを使用します。OpenClaw は libsignal を組み込みません。

## 番号モデル（最初にお読みください）

- Gateway は **Signal デバイス**、つまり `signal-cli` アカウントに接続します。
- ボットを **個人用 Signal アカウント**で実行すると、自分自身のメッセージは無視されます（ループ防止）。
- 「ボットにメッセージを送ると返信される」ようにするには、**ボット専用の別番号**を使用してください。

## インストール

```bash
openclaw plugins install @openclaw/signal
```

修飾なしの Plugin 指定では、まず ClawHub を試し、次に npm へフォールバックします。`openclaw plugins install clawhub:@openclaw/signal` または `npm:@openclaw/signal` でソースを強制指定できます。`plugins install` は Plugin を登録して有効化するため、別途 `enable` の手順は不要です。一般的なインストール規則については、[Plugin](/ja-JP/tools/plugin)を参照してください。

## クイックセットアップ

<Steps>
  <Step title="番号を選択">
    ボットには **Signal の別番号**を使用してください（推奨）。
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
    ウィザードは `signal-cli` が `PATH` 上にあるかを検出し、見つからない場合はインストールを提案します。Linux x86-64 では公式のネイティブ GraalVM ビルドをダウンロードし、macOS およびその他のアーキテクチャでは Homebrew 経由でインストールします。その後、ボット番号と `signal-cli` のパスを入力するよう求めます。
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

| フィールド        | 説明                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 形式のボット電話番号（`+15551234567`） |
| `cliPath`    | `signal-cli` へのパス（`PATH` 上にある場合は `signal-cli`）  |
| `configPath` | `--config` として渡される signal-cli 設定ディレクトリ        |
| `dmPolicy`   | DM アクセスポリシー（`pairing` を推奨）          |
| `allowFrom`  | DM を許可する電話番号または `uuid:<id>` 値 |

複数アカウントのサポート：アカウントごとの設定とオプションの `name` を含む `channels.signal.accounts` を使用します。共通パターンについては、[複数アカウントのチャンネル](/ja-JP/gateway/config-channels#multi-account-all-channels)を参照してください。

## 概要

- 決定論的ルーティング：返信は常に Signal に戻されます。
- DM はエージェントのメインセッションを共有し、グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。
- デフォルトでは、Signal は `/config set|unset` によって発生した設定更新を書き込む場合があります（`commands.config: true` が必要）。`channels.signal.configWrites: false` で無効化できます。

## セットアップパス A：既存の Signal アカウントをリンク（QR）

1. `signal-cli`（JVM またはネイティブビルド）をインストールするか、`openclaw channels add` にインストールを任せます。
2. ボットアカウントをリンクします：`signal-cli link -n "OpenClaw"` を実行し、Signal で QR コードをスキャンします。
3. Signal を設定して Gateway を起動します。

## セットアップパス B：ボット専用番号を登録（SMS、Linux）

既存の Signal アプリアカウントをリンクする代わりに、ボット専用番号を使用する場合は、この手順を使用します。以下のフローは Ubuntu 24 でテスト済みです。

1. SMS（固定電話の場合は音声認証）を受信できる番号を用意します。ボット専用番号を使用すると、アカウントやセッションの競合を回避できます。
2. Gateway ホストに `signal-cli` をインストールします：

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使用する場合は、先に JRE をインストールしてください。`signal-cli` を最新の状態に保ってください。上流では、Signal サーバー API の変更により古いリリースが動作しなくなる可能性があるとされています。

3. 番号を登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合（この手順を完了するにはブラウザへのアクセスが必要です）：

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` リンクのリンク先をコピーします。
3. 可能な場合は、ブラウザセッションと同じ外部 IP から実行してください（captcha トークンは短時間で期限切れになります）。
4. 直ちに登録して認証します：

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を設定し、Gateway を再起動して、チャンネルを検証します：

```bash
# Gateway をユーザー systemd サービスとして実行している場合：
systemctl --user restart openclaw-gateway.service

# 次に検証：
openclaw doctor
openclaw channels status --probe
```

5. DM の送信者をペアリングします：
   - ボット番号に任意のメッセージを送信します。
   - サーバー上で承認します：`openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」と表示されないように、ボット番号をスマートフォンの連絡先として保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションの認証が解除される場合があります。ボット専用番号を使用するか、既存のスマートフォンアプリ設定を維持するには QR リンクモードを使用してください。
</Warning>

上流リファレンス：

- `signal-cli` README：`https://github.com/AsamK/signal-cli`
- Captcha フロー：`https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー：`https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自分で管理する場合（JVM のコールドスタートが遅い、コンテナの初期化、CPU の共有など）は、デーモンを別途実行し、OpenClaw から接続します：

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

これにより、自動起動と OpenClaw の起動待機がスキップされます。自動起動の開始が遅い場合は、`channels.signal.startupTimeoutMs` を設定します。

## コンテナモード（bbernhard/signal-cli-rest-api）

`signal-cli` をネイティブに実行する代わりに、REST + WebSocket インターフェースの背後で `signal-cli` をラップする [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker コンテナを使用します。

要件：

- リアルタイムでメッセージを受信するには、コンテナを `MODE=json-rpc` で実行する**必要があります**。
- OpenClaw に接続する前に、コンテナ内で Signal アカウントを登録またはリンクします。

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
| `"auto"`      | （デフォルト）両方のトランスポートをプローブします。ストリーミングではコンテナの WebSocket 受信を検証します    |
| `"native"`    | ネイティブ signal-cli を強制します（`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE）         |
| `"container"` | bbernhard コンテナを強制します（`/v2/send` の REST、`/v1/receive/{account}` の WebSocket） |

`apiMode` が `"auto"` の場合、OpenClaw はプローブの繰り返しを避けるため、デーモン URL ごとに検出されたモードを 30 秒間キャッシュします（両方のトランスポートが正常な場合はネイティブが優先されます）。コンテナ受信がストリーミング用に選択されるのは、`/v1/receive/{account}` が WebSocket にアップグレードされた後のみであり、これには `MODE=json-rpc` が必要です。

コンテナが対応する API を公開している場合、コンテナモードはネイティブモードと同じ Signal 操作をサポートします。送受信、添付ファイル、入力中インジケーター、既読・閲覧済み通知、リアクション、グループ、スタイル付きテキストに対応します。OpenClaw は、`group.{base64(internal_id)}` グループ ID や書式付きテキスト用の `text_mode: "styled"` を含むネイティブ Signal RPC 呼び出しを、コンテナの REST ペイロードに変換します。

運用上の注意：

- コンテナモードでは `autoStart: false` を使用してください。`apiMode: "container"` が選択されている場合、OpenClaw はネイティブデーモンを起動すべきではありません。
- 受信には `MODE=json-rpc` を使用してください。`MODE=normal` によって `/v1/about` が正常に見える場合がありますが、`/v1/receive/{account}` は WebSocket にアップグレードされないため、OpenClaw は `auto` モードでコンテナ受信ストリーミングを選択しません。
- `httpUrl` が bbernhard REST API を指す場合は `apiMode: "container"`、ネイティブ `signal-cli` の JSON-RPC/SSE を指す場合は `"native"`、デプロイによって異なる可能性がある場合は `"auto"` を設定します。
- コンテナの添付ファイルダウンロードには、ネイティブモードと同じメディアバイト制限が適用されます。サーバーが `Content-Length` を送信する場合、サイズ超過のレスポンスは完全にバッファリングされる前に拒否され、それ以外の場合はストリーミング中に拒否されます。

## アクセス制御（DM + グループ）

DM：

- デフォルト：`channels.signal.dmPolicy = "pairing"`。
- 不明な送信者にはペアリングコードが提示され、承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
- `openclaw pairing list signal` および `openclaw pairing approve signal <CODE>` で承認します。
- ペアリングは Signal DM のデフォルトのトークン交換方式です。詳細：[ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` から取得）は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ：

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `allowlist` が設定されている場合、`channels.signal.groupAllowFrom` はグループ返信をトリガーできるグループまたは送信者を制御します。エントリには、Signal グループ ID（未加工、`group:<id>`、または `signal:group:<id>`）、送信者の電話番号、`uuid:<id>` 値、または `*` を指定できます。
- `channels.signal.groups["<group-id>" | "*"]` は、`requireMention`、`tools`、および `toolsBySender` でグループの動作を上書きできます。
- 複数アカウント構成でアカウントごとに上書きするには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` を通じて Signal グループを許可リストに追加しても、それだけではメンションによる制限は無効になりません。明示的に設定された `channels.signal.groups["<group-id>"]` エントリは、`requireMention=true` が設定されていない限り、すべてのグループメッセージを処理します。
- `requireMention=true` の場合、Signal ネイティブの @メンションは、構造化されたメンションメタデータからボットアカウントの電話番号または `accountUuid` と照合されます。設定済みの `mentionPatterns` はプレーンテキストのフォールバックとして残ります。
- ランタイムに関する注意：`channels.signal` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

コンテキストを制限した、メンション必須のグループ：

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

許可されたグループメッセージのうち、ボットへのメンションがないものには応答せず、上限付きの保留履歴ウィンドウ内にのみ保持されます。その後、ネイティブの@メンションまたはフォールバックのテキストメンションによってボットが起動されると、OpenClaw はその直近のコンテキストを含め、同じグループに返信します。スキップされた添付ファイルの本文はダウンロードされません。保留中のコンテキストには、簡潔なメディアプレースホルダーとしてのみ表示される場合があります。

## 動作の仕組み（挙動）

- ネイティブモード：`signal-cli` はデーモンとして実行され、Gateway は SSE 経由でイベントを読み取ります。
- コンテナモード：Gateway は REST API 経由で送信し、WebSocket 経由で受信します。
- 受信メッセージは、共有チャネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループに返されます。
- 受信メッセージへの返信には、バックエンドが受信タイムスタンプと送信者を受け入れる場合、ネイティブの Signal 引用メタデータが含まれます。引用メタデータがないか拒否された場合、OpenClaw は通常のメッセージとして返信を送信します。
- ネイティブ引用の使用は `channels.signal.replyToMode = off | first | all | batched` で設定し、チャット種別ごとのオーバーライドには `channels.signal.replyToModeByChatType.direct/group` を使用します。`channels.signal.accounts.<id>` 配下のアカウントレベルの値が優先されます。

## メディアと制限

- 送信テキストは `channels.signal.textChunkLimit`（デフォルト 4000）単位に分割されます。
- 任意の改行分割：`channels.signal.streaming.chunkMode="newline"` を設定すると、長さによる分割の前に空行（段落境界）で分割されます。
- 添付ファイルに対応しています（`signal-cli` から base64 を取得）。
- `contentType` がない場合、ボイスメモの添付ファイルでは `signal-cli` ファイル名を MIME のフォールバックとして使用するため、音声文字起こしで AAC ボイスメモを引き続き分類できます。
- デフォルトのメディア上限：`channels.signal.mediaMaxMb`（デフォルト 8）。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使用します。
- グループ履歴コンテキストには `channels.signal.historyLimit`（または `channels.signal.accounts.*.historyLimit`）が使用され、未設定の場合は `messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します（デフォルト 50）。

## 入力中表示と既読通知

- **入力中インジケーター**：OpenClaw は `signal-cli sendTyping` 経由で入力中シグナルを送信し、返信の処理中はそれを更新します。
- **既読通知**：`channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読通知を転送します。
- `signal-cli` はグループの既読通知を公開しません。

## ライフサイクル状態リアクション

`messages.statusReactions.enabled: true` を設定すると、Signal で受信ターンに対する共有のキュー待ち／思考中／ツール／Compaction／完了／エラーのリアクションライフサイクルを表示できます。Signal は受信メッセージのタイムスタンプをリアクション対象として使用します。グループリアクションは、Signal グループ ID と元の送信者を対象作成者として送信されます。

状態リアクションには、確認リアクションと一致する `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions`、または `all`）も必要です。Signal の状態リアクションを無効にするには `channels.signal.reactionLevel: "off"` を設定します。

`messages.removeAckAfterReply: true` は、設定された保持時間の経過後に最終状態リアクションを消去します。それ以外の場合、Signal は最終的な完了／エラー状態の後に最初の確認リアクションを復元します。

## リアクション（メッセージツール）

`message action=react` を `channel=signal` とともに使用します。

- 対象：送信者の E.164 または UUID（ペアリング出力の `uuid:<id>` を使用します。UUID 単体でも動作します）。
- `messageId` は、リアクション対象メッセージの Signal タイムスタンプです。
- グループリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定：

- `channels.signal.actions.reactions`：リアクションアクションを有効化／無効化します（デフォルト true）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（デフォルト `minimal`）。
  - `off`/`ack` はエージェントのリアクションを無効にします（メッセージツールの `react` はエラーになります）。
  - `minimal`/`extensive` はエージェントのリアクションを有効にし、ガイダンスレベルを設定します。
- アカウントごとのオーバーライド：`channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 承認リアクション

Signal の exec および Plugin 承認プロンプトでは、トップレベルの `approvals.exec` と `approvals.plugin` のルーティングブロックを使用します。Signal には `channels.signal.execApprovals` ブロックはありません。

- `👍` は一度だけ承認します。
- `👎` は拒否します。
- リクエストで永続的な承認が提示される場合は `/approve <id> allow-always` を使用します。

承認リアクションを解決するには、`channels.signal.allowFrom`、`channels.signal.defaultTo`、または一致するアカウントレベルのフィールドで Signal の承認者を明示的に指定する必要があります。同じチャット内の直接的な exec 承認プロンプトでは、明示的な承認者がいなくても重複するローカルの `/approve` フォールバックを抑制できます。承認者がいないグループ承認では、ローカルフォールバックが引き続き表示されます。

## 配信先（CLI/Cron）

- DM：`signal:+15551234567`（または E.164 単体）。
- UUID の DM：`uuid:<id>`（または UUID 単体）。
- グループ：`signal:group:<groupId>`。
- ユーザー名：`username:<name>`（使用中の Signal アカウントが対応している場合）。

## エイリアス

繰り返し使用する Signal の配信先に安定した名前を付けるには、エイリアスを設定します。エイリアスは OpenClaw 側のみの設定です。Signal の連絡先を作成または編集することはありません。

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

Signal の配信先を指定できるすべての場所でエイリアスを使用できます。

```bash
openclaw message send --channel signal --target signal:ops --message "デプロイが完了しました"
```

アカウントごとのエイリアスはトップレベルのエイリアスを継承し、名前を追加またはオーバーライドできます。

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

最初に次の手順を実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

必要に応じて、次に DM のペアリング状態を確認します。

```bash
openclaw pairing list signal
```

よくある障害：

- デーモンに到達できるが返信がない：アカウント／デーモンの設定（`httpUrl`、`account`）と受信モードを確認します。
- DM が無視される：送信者はペアリング承認待ちです。
- グループメッセージが無視される：グループの送信者／メンションゲートによって配信がブロックされています。
- 編集後に設定検証エラーが発生する：`openclaw doctor --fix` を実行します。
- 診断に Signal が表示されない：`channels.signal.enabled: true` を確認します。

追加の確認：

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージ手順については、[チャネルのトラブルシューティング](/ja-JP/channels/troubleshooting)を参照してください。

## セキュリティに関する注意事項

- `signal-cli` はアカウントキーをローカルに保存します（通常は `~/.local/share/signal-cli/data/`）。
- サーバーの移行または再構築の前に、Signal アカウントの状態をバックアップしてください。
- DM へのアクセスを明示的に拡大したい場合を除き、`channels.signal.dmPolicy: "pairing"` を維持してください。
- SMS 検証が必要なのは登録または復旧フローのみですが、番号／アカウントの制御を失うと再登録が複雑になる可能性があります。

## 設定リファレンス（Signal）

完全な設定：[設定](/ja-JP/gateway/configuration)

プロバイダーオプション：

- `channels.signal.enabled`：チャネルの起動を有効化／無効化します。
- `channels.signal.apiMode`：`auto | native | container`（デフォルト：auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api)を参照してください。
- `channels.signal.account`：ボットアカウントの E.164。
- `channels.signal.accountUuid`：ネイティブ@メンションの検出とループ保護に使用する、任意のボットアカウント UUID。
- `channels.signal.cliPath`：`signal-cli` へのパス。
- `channels.signal.configPath`：任意の `signal-cli --config` ディレクトリ。
- `channels.signal.httpUrl`：完全なデーモン URL（ホスト／ポートをオーバーライド）。
- `channels.signal.httpHost`、`channels.signal.httpPort`：デーモンのバインド先（デフォルト `127.0.0.1:8080`）。
- `channels.signal.autoStart`：デーモンを自動起動します（`httpUrl` が未設定の場合、デフォルト true）。
- `channels.signal.startupTimeoutMs`：起動待機タイムアウト（ミリ秒）（最小 1000、上限 120000、デフォルト 30000）。
- `channels.signal.receiveMode`：`on-start | manual`。
- `channels.signal.ignoreAttachments`：添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`：デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`：既読通知を転送します。
- `channels.signal.dmPolicy`：`pairing | allowlist | open | disabled`（デフォルト：pairing）。
- `channels.signal.allowFrom`：DM の許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がないため、電話番号／UUID ID を使用します。
- `channels.signal.aliases`：DM またはグループの配信先に使用する OpenClaw 側のエイリアス。
- `channels.signal.groupPolicy`：`open | allowlist | disabled`（デフォルト：allowlist）。
- `channels.signal.groupAllowFrom`：グループの許可リスト。Signal グループ ID（未加工、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` の値を指定できます。
- `channels.signal.groups`：Signal グループ ID（または `"*"`）をキーとするグループごとのオーバーライド。対応フィールド：`requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`：複数アカウント設定向けの、アカウントごとの `channels.signal.groups`。
- `channels.signal.accounts.<id>.aliases`：トップレベルのエイリアスとマージされる、アカウントごとのエイリアス。
- `channels.signal.replyToMode`：ネイティブ返信引用モード、`off | first | all | batched`（デフォルト：`all`）。
- `channels.signal.replyToModeByChatType.direct`、`channels.signal.replyToModeByChatType.group`：チャット種別ごとのネイティブ返信引用のオーバーライド。
- `channels.signal.accounts.<id>.replyToMode`、`channels.signal.accounts.<id>.replyToModeByChatType.direct`、`channels.signal.accounts.<id>.replyToModeByChatType.group`：アカウントごとの返信引用のオーバーライド。
- `channels.signal.historyLimit`：コンテキストに含めるグループメッセージの最大数（0 で無効）。
- `channels.signal.dmHistoryLimit`：ユーザーターン単位の DM 履歴上限。ユーザーごとのオーバーライド：`channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`：送信チャンクの文字数（デフォルト 4000）。
- `channels.signal.streaming.chunkMode`：`length`（デフォルト）、または長さによる分割の前に空行（段落境界）で分割する `newline`。
- `channels.signal.mediaMaxMb`：受信／送信メディアの上限（MB）（デフォルト 8）。
- `channels.signal.reactionLevel`：`off | ack | minimal | extensive`（デフォルト `minimal`）。[リアクション](#reactions-message-tool)を参照してください。
- `channels.signal.reactionNotifications`：`off | own | all | allowlist`（デフォルト `own`）- エージェントが他者からの受信リアクションについて通知される条件。
- `channels.signal.reactionAllowlist`：`reactionNotifications: "allowlist"` の場合に、そのリアクションがエージェントに通知される送信者。
- `channels.signal.streaming.block.enabled`、`channels.signal.streaming.block.coalesce`：チャネル間で共有されるブロックモードのストリーミング制御。[ストリーミング](/ja-JP/concepts/streaming)を参照してください。

関連するグローバルオプション：

- `agents.list[].groupChat.mentionPatterns`（プレーンテキストのフォールバック。ボットアカウントのアイデンティティが設定されている場合、Signal ネイティブの @メンションは構造化メタデータから検出されます）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連項目

- [チャンネルの概要](/ja-JP/channels) - サポートされているすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションによる制御
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルとセキュリティ強化
