---
read_when:
    - Signal サポートの設定
    - Signal の送受信をデバッグする
summary: signal-cli（ネイティブデーモンまたは bbernhard コンテナ）による Signal サポート、セットアップパス、番号モデル
title: Signal
x-i18n:
    generated_at: "2026-07-05T11:03:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e1095c142a1d5137676f803430826f1b45a70ed41dabf8b17dcdca1605ad2f
    source_path: channels/signal.md
    workflow: 16
---

Signal はダウンロード可能なチャンネル Plugin（`@openclaw/signal`）です。Gateway は HTTP 経由で `signal-cli` と通信します。ネイティブデーモン（JSON-RPC + SSE）または [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) コンテナ（REST + WebSocket）のいずれかです。OpenClaw は libsignal を組み込みません。

## 番号モデル（最初に読んでください）

- Gateway は **Signal デバイス**、つまり `signal-cli` アカウントに接続します。
- ボットを **個人用 Signal アカウント**で実行すると、自分自身のメッセージを無視します（ループ保護）。
- 「自分がボットにテキストを送り、ボットが返信する」には、**別のボット用番号**を使用します。

## インストール

```bash
openclaw plugins install @openclaw/signal
```

素の Plugin 仕様はまず ClawHub を試し、その後 npm にフォールバックします。`openclaw plugins install clawhub:@openclaw/signal` または `npm:@openclaw/signal` でソースを強制できます。`plugins install` は Plugin を登録して有効化します。別途 `enable` ステップは不要です。一般的なインストール規則については [Plugins](/ja-JP/tools/plugin) を参照してください。

## クイックセットアップ

<Steps>
  <Step title="番号を選ぶ">
    ボットには **別の Signal 番号**を使用します（推奨）。
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
    ウィザードは `signal-cli` が `PATH` 上にあるかを検出し、見つからない場合はインストールを提案します。Linux x86-64 では公式のネイティブ GraalVM ビルドをダウンロードし、macOS とその他のアーキテクチャでは Homebrew 経由でインストールします。その後、ボット番号と `signal-cli` のパスを入力するよう求めます。
  </Step>
  <Step title="アカウントをリンクまたは登録する">
    - **QR リンク（最速）:** `signal-cli link -n "OpenClaw"` を実行してから、Signal でスキャンします。[パス A](#setup-path-a-link-existing-signal-account-qr) を参照してください。
    - **SMS 登録:** 専用番号で captcha + SMS 検証を行います。[パス B](#setup-path-b-register-dedicated-bot-number-sms-linux) を参照してください。

  </Step>
  <Step title="検証してペアリングする">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    最初の DM を送信し、ペアリングを承認します: `openclaw pairing approve signal <CODE>`。
  </Step>
</Steps>

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

| フィールド        | 説明                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 形式のボット電話番号（`+15551234567`） |
| `cliPath`    | `signal-cli` へのパス（`PATH` 上にある場合は `signal-cli`）  |
| `configPath` | `--config` として渡される signal-cli 設定ディレクトリ        |
| `dmPolicy`   | DM アクセスポリシー（`pairing` 推奨）          |
| `allowFrom`  | DM を許可する電話番号または `uuid:<id>` 値 |

マルチアカウント対応: アカウントごとの構成と任意の `name` を指定して `channels.signal.accounts` を使用します。共通パターンについては [マルチアカウントチャンネル](/ja-JP/gateway/config-channels#multi-account-all-channels) を参照してください。

## 概要

- 決定的ルーティング: 返信は常に Signal に戻ります。
- DM はエージェントのメインセッションを共有します。グループは分離されます（`agent:<agentId>:signal:group:<groupId>`）。
- デフォルトでは、Signal は `/config set|unset` によってトリガーされた設定更新を書き込む場合があります（`commands.config: true` が必要）。`channels.signal.configWrites: false` で無効化します。

## セットアップパス A: 既存の Signal アカウントをリンクする（QR）

1. `signal-cli`（JVM またはネイティブビルド）をインストールするか、`openclaw channels add` にインストールさせます。
2. ボットアカウントをリンクします: `signal-cli link -n "OpenClaw"` を実行してから、Signal で QR をスキャンします。
3. Signal を構成し、Gateway を起動します。

## セットアップパス B: 専用ボット番号を登録する（SMS、Linux）

既存の Signal アプリアカウントをリンクする代わりに、専用ボット番号を使う場合はこれを使用します。以下のフローは Ubuntu 24 でテストされています。

1. SMS を受信できる番号（または固定電話向けの音声検証）を取得します。専用ボット番号により、アカウントやセッションの競合を避けられます。
2. Gateway ホストに `signal-cli` をインストールします:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM ビルド（`signal-cli-${VERSION}.tar.gz`）を使用する場合は、先に JRE をインストールしてください。`signal-cli` は最新に保ってください。上流では、Signal サーバー API の変更により古いリリースが壊れる可能性があると記されています。

3. 番号を登録して検証します:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha が必要な場合（このステップを完了するにはブラウザーアクセスが必要です）:

1. `https://signalcaptchas.org/registration/generate.html` を開きます。
2. captcha を完了し、「Open Signal」から `signalcaptcha://...` リンクターゲットをコピーします。
3. 可能な場合は、ブラウザーセッションと同じ外部 IP から実行します（captcha トークンはすぐに期限切れになります）。
4. すぐに登録して検証します:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw を構成し、Gateway を再起動して、チャンネルを検証します:

```bash
# Gateway をユーザー systemd サービスとして実行している場合:
systemctl --user restart openclaw-gateway.service

# その後、検証:
openclaw doctor
openclaw channels status --probe
```

5. DM 送信者をペアリングします:
   - ボット番号に任意のメッセージを送信します。
   - サーバーで承認します: `openclaw pairing approve signal <PAIRING_CODE>`。
   - 「Unknown contact」を避けるため、ボット番号を電話の連絡先として保存します。

<Warning>
`signal-cli` で電話番号アカウントを登録すると、その番号のメイン Signal アプリセッションが認証解除される可能性があります。専用ボット番号を推奨します。または、既存の電話アプリ設定を維持するには QR リンクモードを使用してください。
</Warning>

上流リファレンス:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha フロー: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- リンクフロー: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 外部デーモンモード（httpUrl）

`signal-cli` を自分で管理する場合（遅い JVM コールドスタート、コンテナ初期化、共有 CPU）は、デーモンを別途実行し、OpenClaw にその場所を指定します:

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

これにより、自動スポーンと OpenClaw の起動待機がスキップされます。自動スポーンの起動が遅い場合は、`channels.signal.startupTimeoutMs` を設定します。

## コンテナモード（bbernhard/signal-cli-rest-api）

`signal-cli` をネイティブに実行する代わりに、REST + WebSocket インターフェイスの背後で `signal-cli` をラップする [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker コンテナを使用します。

要件:

- リアルタイムのメッセージ受信には、コンテナを **必ず** `MODE=json-rpc` で実行する必要があります。
- OpenClaw に接続する前に、コンテナ内で Signal アカウントを登録またはリンクしてください。

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

OpenClaw 構成:

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

`apiMode` は OpenClaw が使用するプロトコルを制御します:

| 値         | 動作                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | （デフォルト）両方のトランスポートをプローブします。ストリーミングはコンテナ WebSocket 受信を検証します    |
| `"native"`    | ネイティブ signal-cli を強制します（`/api/v1/rpc` の JSON-RPC、`/api/v1/events` の SSE）         |
| `"container"` | bbernhard コンテナを強制します（`/v2/send` の REST、`/v1/receive/{account}` の WebSocket） |

`apiMode` が `"auto"` の場合、OpenClaw は繰り返しのプローブを避けるため、デーモン URL ごとに検出したモードを 30 秒間キャッシュします（両方のトランスポートが正常な場合は native が優先されます）。コンテナ受信は、`/v1/receive/{account}` が WebSocket にアップグレードされた後にのみストリーミング用として選択されます。これには `MODE=json-rpc` が必要です。

コンテナモードは、コンテナが対応する API を公開している場合、ネイティブモードと同じ Signal 操作をサポートします。送信、受信、添付ファイル、入力インジケーター、既読/表示済み受信確認、リアクション、グループ、スタイル付きテキストです。OpenClaw は、ネイティブ Signal RPC 呼び出しをコンテナの REST ペイロードに変換します。これには、`group.{base64(internal_id)}` グループ ID と、書式付きテキスト用の `text_mode: "styled"` が含まれます。

運用上の注意:

- コンテナモードでは `autoStart: false` を使用してください。`apiMode: "container"` が選択されている場合、OpenClaw はネイティブデーモンをスポーンすべきではありません。
- 受信には `MODE=json-rpc` を使用してください。`MODE=normal` では `/v1/about` が正常に見える場合がありますが、`/v1/receive/{account}` は WebSocket にアップグレードされないため、OpenClaw は `auto` モードでコンテナ受信ストリーミングを選択しません。
- `httpUrl` が bbernhard REST API を指す場合は `apiMode: "container"`、ネイティブ `signal-cli` JSON-RPC/SSE を指す場合は `"native"`、デプロイが変わる可能性がある場合は `"auto"` を設定します。
- コンテナの添付ファイルダウンロードは、ネイティブモードと同じメディアバイト制限に従います。サーバーが `Content-Length` を送信する場合、サイズ超過レスポンスは完全にバッファリングされる前に拒否され、それ以外の場合はストリーミング中に拒否されます。

## アクセス制御（DM + グループ）

DM:

- デフォルト: `channels.signal.dmPolicy = "pairing"`。
- 不明な送信者にはペアリングコードが送信されます。承認されるまでメッセージは無視されます（コードは 1 時間後に期限切れになります）。
- `openclaw pairing list signal` と `openclaw pairing approve signal <CODE>` で承認します。
- ペアリングは Signal DM のデフォルトのトークン交換です。詳細: [ペアリング](/ja-JP/channels/pairing)
- UUID のみの送信者（`sourceUuid` 由来）は、`channels.signal.allowFrom` に `uuid:<id>` として保存されます。

グループ:

- `channels.signal.groupPolicy = open | allowlist | disabled`。
- `channels.signal.groupAllowFrom` は、`allowlist` が設定されている場合にグループ返信をトリガーできるグループまたは送信者を制御します。エントリには、Signal グループ ID（raw、`group:<id>`、または `signal:group:<id>`）、送信者の電話番号、`uuid:<id>` 値、または `*` を使用できます。
- `channels.signal.groups["<group-id>" | "*"]` は、`requireMention`、`tools`、`toolsBySender` でグループ動作を上書きできます。
- マルチアカウントセットアップでアカウントごとの上書きを行うには、`channels.signal.accounts.<id>.groups` を使用します。
- `groupAllowFrom` でグループを許可リストに追加しても、それ自体ではメンションゲートは無効になりません。明示的に構成された `channels.signal.groups["<group-id>"]` エントリは、`requireMention: true` が明示的に設定されていない限り、すべてのグループメッセージを処理します。
- ランタイムメモ: `channels.signal` が完全に欠落している場合、ランタイムはグループチェックで `groupPolicy="allowlist"` にフォールバックします（`channels.defaults.groupPolicy` が設定されている場合でも）。

## 仕組み（動作）

- ネイティブモード: `signal-cli` はデーモンとして実行され、Gateway は SSE 経由でイベントを読み取ります。
- コンテナモード: Gateway は REST API 経由で送信し、WebSocket 経由で受信します。
- 受信メッセージは共有チャンネルエンベロープに正規化されます。
- 返信は常に同じ番号またはグループにルーティングされます。

## メディア + 制限

- 送信テキストは `channels.signal.textChunkLimit`（デフォルト 4000）に分割されます。
- 任意の改行分割: 長さによる分割の前に空行（段落境界）で分割するには、`channels.signal.chunkMode="newline"` を設定します。
- 添付ファイルに対応しています（`signal-cli` から base64 を取得）。
- ボイスメモの添付では、`contentType` がない場合に `signal-cli` のファイル名を MIME フォールバックとして使うため、音声文字起こしは AAC ボイスメモを引き続き分類できます。
- デフォルトのメディア上限: `channels.signal.mediaMaxMb`（デフォルト 8）。
- メディアのダウンロードをスキップするには `channels.signal.ignoreAttachments` を使います。
- グループ履歴コンテキストは `channels.signal.historyLimit`（または `channels.signal.accounts.*.historyLimit`）を使い、`messages.groupChat.historyLimit` にフォールバックします。無効にするには `0` を設定します（デフォルト 50）。

## 入力中表示 + 既読通知

- **入力中インジケーター**: OpenClaw は `signal-cli sendTyping` 経由で入力中シグナルを送信し、返信の実行中に更新します。
- **既読通知**: `channels.signal.sendReadReceipts` が true の場合、OpenClaw は許可された DM の既読通知を転送します。
- `signal-cli` はグループの既読通知を公開しません。

## ライフサイクルステータスのリアクション

Signal が受信ターンで共有のキュー投入中/思考中/ツール/Compaction/完了/エラーのリアクションライフサイクルを表示できるようにするには、`messages.statusReactions.enabled: true` を設定します。Signal は受信メッセージのタイムスタンプをリアクション対象として使います。グループリアクションは、Signal グループ ID と元の送信者を対象作成者として送信されます。

ステータスリアクションには、ack リアクションと一致する `messages.ackReactionScope`（`direct`、`group-all`、`group-mentions`、または `all`）も必要です。Signal のステータスリアクションを無効にするには、`channels.signal.reactionLevel: "off"` を設定します。

`messages.removeAckAfterReply: true` は、設定された保持時間後に最終ステータスリアクションを消去します。それ以外の場合、Signal は最終の完了/エラー状態後に最初の ack リアクションを復元します。

## リアクション（メッセージツール）

`channel=signal` で `message action=react` を使います。

- 対象: 送信者の E.164 または UUID（ペアリング出力の `uuid:<id>` を使います。裸の UUID も動作します）。
- `messageId` は、リアクションするメッセージの Signal タイムスタンプです。
- グループリアクションには `targetAuthor` または `targetAuthorUuid` が必要です。

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

設定:

- `channels.signal.actions.reactions`: リアクションアクションを有効化/無効化します（デフォルト true）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト `minimal`）。
  - `off`/`ack` はエージェントリアクションを無効にします（メッセージツールの `react` はエラーになります）。
  - `minimal`/`extensive` はエージェントリアクションを有効にし、ガイダンスレベルを設定します。
- アカウント単位の上書き: `channels.signal.accounts.<id>.actions.reactions`、`channels.signal.accounts.<id>.reactionLevel`。

## 承認リアクション

Signal の exec と Plugin 承認プロンプトは、トップレベルの `approvals.exec` と `approvals.plugin` ルーティングブロックを使います。Signal には `channels.signal.execApprovals` ブロックはありません。

- `👍` は 1 回だけ承認します。
- `👎` は拒否します。
- リクエストが永続的な承認を提供する場合は `/approve <id> allow-always` を使います。

承認リアクションの解決には、`channels.signal.allowFrom`、`channels.signal.defaultTo`、または一致するアカウントレベルのフィールドから明示的な Signal 承認者が必要です。同じチャット内の直接 exec 承認プロンプトでは、明示的な承認者がなくても重複するローカルの `/approve` フォールバックを抑制できます。承認者のないグループ承認では、ローカルフォールバックは表示されたままになります。

## 配信先（CLI/Cron）

- DM: `signal:+15551234567`（またはプレーンな E.164）。
- UUID DM: `uuid:<id>`（または裸の UUID）。
- グループ: `signal:group:<groupId>`。
- ユーザー名: `username:<name>`（Signal アカウントで対応している場合）。

## エイリアス

繰り返し使う Signal 対象に安定した名前を付けるエイリアスを設定します。エイリアスは OpenClaw 側の設定のみです。Signal の連絡先を作成または編集するものではありません。

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

Signal の配信先を受け付ける場所ならどこでもエイリアスを使えます。

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

アカウント単位のエイリアスはトップレベルのエイリアスを継承し、名前を追加または上書きできます。

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

`openclaw directory peers list --channel signal` と `openclaw directory groups list --channel signal` は、設定されたエイリアスを一覧表示します。Signal ディレクトリは設定に基づきます。Signal の連絡先をライブクエリしたり、Signal アカウントを変更したりしません。

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

- デーモンには到達できるが返信がない: アカウント/デーモン設定（`httpUrl`、`account`）と受信モードを確認します。
- DM が無視される: 送信者がペアリング承認待ちです。
- グループメッセージが無視される: グループ送信者/メンションのゲートが配信をブロックしています。
- 編集後に設定検証エラーが出る: `openclaw doctor --fix` を実行します。
- 診断に Signal がない: `channels.signal.enabled: true` を確認します。

追加チェック:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

トリアージフローについては、[チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting) を参照してください。

## セキュリティメモ

- `signal-cli` はアカウントキーをローカルに保存します（通常は `~/.local/share/signal-cli/data/`）。
- サーバー移行または再構築の前に、Signal アカウント状態をバックアップしてください。
- より広い DM アクセスを明示的に必要としない限り、`channels.signal.dmPolicy: "pairing"` のままにします。
- SMS 認証は登録またはリカバリーフローでのみ必要ですが、番号/アカウントの制御を失うと再登録が複雑になる可能性があります。

## 設定リファレンス（Signal）

完全な設定: [設定](/ja-JP/gateway/configuration)

プロバイダーオプション:

- `channels.signal.enabled`: チャンネル起動を有効化/無効化します。
- `channels.signal.apiMode`: `auto | native | container`（デフォルト: auto）。[コンテナモード](#container-mode-bbernhardsignal-cli-rest-api) を参照してください。
- `channels.signal.account`: bot アカウントの E.164。
- `channels.signal.cliPath`: `signal-cli` へのパス。
- `channels.signal.configPath`: 任意の `signal-cli --config` ディレクトリ。
- `channels.signal.httpUrl`: 完全なデーモン URL（host/port を上書きします）。
- `channels.signal.httpHost`、`channels.signal.httpPort`: デーモンのバインド（デフォルト `127.0.0.1:8080`）。
- `channels.signal.autoStart`: デーモンを自動起動します（`httpUrl` が未設定の場合、デフォルト true）。
- `channels.signal.startupTimeoutMs`: 起動待機タイムアウト（ミリ秒）（最小 1000、上限 120000、デフォルト 30000）。
- `channels.signal.receiveMode`: `on-start | manual`。
- `channels.signal.ignoreAttachments`: 添付ファイルのダウンロードをスキップします。
- `channels.signal.ignoreStories`: デーモンからのストーリーを無視します。
- `channels.signal.sendReadReceipts`: 既読通知を転送します。
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`（デフォルト: pairing）。
- `channels.signal.allowFrom`: DM 許可リスト（E.164 または `uuid:<id>`）。`open` には `"*"` が必要です。Signal にはユーザー名がありません。電話番号/UUID ID を使います。
- `channels.signal.aliases`: DM またはグループ配信先の OpenClaw 側エイリアス。
- `channels.signal.groupPolicy`: `open | allowlist | disabled`（デフォルト: allowlist）。
- `channels.signal.groupAllowFrom`: グループ許可リスト。Signal グループ ID（raw、`group:<id>`、または `signal:group:<id>`）、送信者の E.164 番号、または `uuid:<id>` 値を受け付けます。
- `channels.signal.groups`: Signal グループ ID（または `"*"`）をキーにしたグループ単位の上書き。対応フィールド: `requireMention`、`tools`、`toolsBySender`。
- `channels.signal.accounts.<id>.groups`: マルチアカウント設定向けの `channels.signal.groups` のアカウント単位版。
- `channels.signal.accounts.<id>.aliases`: アカウント単位のエイリアス。トップレベルのエイリアスとマージされます。
- `channels.signal.historyLimit`: コンテキストに含めるグループメッセージの最大数（0 で無効）。
- `channels.signal.dmHistoryLimit`: ユーザーターン単位の DM 履歴上限。ユーザー単位の上書き: `channels.signal.dms["<phone_or_uuid>"].historyLimit`。
- `channels.signal.textChunkLimit`: 送信チャンクサイズ（文字数）（デフォルト 4000）。
- `channels.signal.chunkMode`: `length`（デフォルト）または、長さによる分割の前に空行（段落境界）で分割する `newline`。
- `channels.signal.mediaMaxMb`: 受信/送信メディアの上限（MB）（デフォルト 8）。
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`（デフォルト `minimal`）。[リアクション](#reactions-message-tool) を参照してください。
- `channels.signal.reactionNotifications`: `off | own | all | allowlist`（デフォルト `own`）- 他者からの受信リアクションをエージェントに通知するタイミング。
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"` の場合に、リアクションでエージェントに通知する送信者。
- `channels.signal.blockStreaming`、`channels.signal.blockStreamingCoalesce`: チャンネル間で共有されるブロックモードのストリーミング制御。[ストリーミング](/ja-JP/concepts/streaming) を参照してください。

関連するグローバルオプション:

- `agents.list[].groupChat.mentionPatterns`（Signal はネイティブメンションに対応していません）。
- `messages.groupChat.mentionPatterns`（グローバルフォールバック）。
- `messages.responsePrefix`。

## 関連

- [チャンネル概要](/ja-JP/channels) - 対応するすべてのチャンネル
- [ペアリング](/ja-JP/channels/pairing) - DM 認証とペアリングフロー
- [グループ](/ja-JP/channels/groups) - グループチャットの動作とメンションゲート
- [チャンネルルーティング](/ja-JP/channels/channel-routing) - メッセージのセッションルーティング
- [セキュリティ](/ja-JP/gateway/security) - アクセスモデルと強化
