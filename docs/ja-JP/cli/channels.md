---
read_when:
    - チャネルアカウント（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp など）を追加または削除したい場合
    - チャンネルの状態を確認するか、チャンネルのログを追跡したい場合
summary: '`openclaw channels` の CLI リファレンス（アカウント、ステータス、機能、解決、ログ、ログイン／ログアウト）'
title: チャンネル
x-i18n:
    generated_at: "2026-07-11T22:05:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

チャットチャネルのアカウントと、Gateway 上での実行時ステータスを管理します。

関連ドキュメント:

- チャネルガイド: [チャネル](/ja-JP/channels)
- Gateway の設定: [設定](/ja-JP/gateway/configuration)

## 一般的なコマンド

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` はチャットチャネルのみを表示します。デフォルトでは設定済みのアカウントを、アカウントごとの `installed`、`configured`、`enabled` ステータスタグとともに表示します（機械処理用の出力には `--json` を使用します）。`--all` を指定すると、まだ設定済みアカウントがない同梱チャネルと、まだディスク上にないインストール可能なカタログチャネルも表示されます。プロバイダー認証とモデル使用量は別の場所で管理します。プロバイダー認証プロファイルには `openclaw models auth list`、使用量とクォータには `openclaw status` または `openclaw models list` を使用します。

## ステータス / 機能 / 解決 / ログ

- `channels status`: `--channel <name>`、`--probe`、`--timeout <ms>`（デフォルトは `10000`）、`--json`
- `channels capabilities`: `--channel <name>`、`--account <id>`（`--channel` が必要）、`--target <dest>`（`--channel` が必要）、`--timeout <ms>`（デフォルトは `10000`、上限は `30000`）、`--json`
- `channels resolve <entries...>`: `--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（デフォルトは `auto`）、`--json`
- `channels logs`: `--channel <name|all>`（デフォルトは `all`）、`--lines <n>`（デフォルトは `200`）、`--json`

`channels status --probe` はライブパスです。到達可能な Gateway では、アカウントごとに
`probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポートの
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が
含まれる場合があります。Gateway に到達できない場合、`channels status` はライブプローブ出力の
代わりに、設定のみの概要へフォールバックします。

チャネルソケットの健全性を示すシグナルとして、`openclaw sessions`、Gateway の `sessions.list`、
またはエージェントの `sessions_list` ツールを使用しないでください。これらのサーフェスが報告するのは、
プロバイダーの実行時状態ではなく、保存済みの会話行です。Discord プロバイダーの再起動後、
接続済みでも通信のないアカウントは正常である可能性がありますが、次の受信または送信の会話イベントが
発生するまで Discord のセッション行は表示されない場合があります。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` はチャネルごとのフラグ（トークン、秘密鍵、アプリトークン、signal-cli のパスなど）を表示します。
</Tip>

`channels remove` は、インストール済みまたは設定済みのチャネル Plugin のみを対象とします。インストール可能なカタログチャネルでは、最初に `channels add` を使用してください。`--delete` を指定しない場合は、アカウントを無効にするか確認し、その設定を保持します。`--delete` を指定すると、確認せずに設定エントリを削除します。
実行時バックエンドを持つチャネル Plugin では、`channels remove` は設定を更新する前に、選択したアカウントを停止するよう実行中の Gateway にも要求します。そのため、アカウントを無効化または削除しても、再起動まで古いリスナーが動作し続けることはありません。

チャネル間で共通する非対話型追加フラグは、`--account <id>`、`--name <name>`、`--token`、`--token-file`、`--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--http-url`、`--auth-dir`、`--use-env`（環境変数ベースの認証。サポートされている場合にデフォルトアカウントのみ）です。チャネル固有のフラグには次のものがあります。

| チャネル    | フラグ                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`、`--webhook-url`、`--audience-type`、`--audience`                                   |
| iMessage    | `--cli-path`、`--db-path`、`--service`、`--region`                                                   |
| Matrix      | `--homeserver`、`--user-id`、`--access-token`、`--password`、`--device-name`、`--initial-sync-limit` |
| Nostr       | `--private-key`、`--relay-urls`                                                                      |
| Signal      | `--signal-number`、`--cli-path`、`--http-url`、`--http-host`、`--http-port`                          |
| Tlon        | `--ship`、`--url`、`--code`、`--group-channels`、`--dm-allowlist`、`--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

フラグを使用した追加コマンドの実行中にチャネル Plugin のインストールが必要な場合、OpenClaw は対話型の Plugin インストールプロンプトを開かずに、そのチャネルのデフォルトのインストール元を使用します。

フラグなしで `openclaw channels add` を実行すると、対話型ウィザードで次の入力を求められる場合があります。

- 選択したチャネルごとのアカウント ID
- それらのアカウントの任意の表示名
- `Route these channel accounts to agents now?`

ここでバインドを確定すると、ウィザードは設定済みの各チャネルアカウントをどのエージェントが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後から `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます（[エージェント](/ja-JP/cli/agents)を参照）。

単一アカウント用のトップレベル設定を引き続き使用しているチャネルに、デフォルトではないアカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、それらのトップレベル値をチャネルのアカウントマップへ昇格させます。チャネルに名前付きアカウントがちょうど 1 つある場合、または `defaultAccount` がいずれかの名前付きアカウントを指している場合、昇格時にその既存アカウントを再利用します。それ以外の場合、値は `channels.<channel>.accounts.default` に格納されます。

ルーティング動作の一貫性は維持されます。

- 既存のチャネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。
- 非対話モードでは、`channels add` はバインディングを自動作成または書き換えしません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態（名前付きアカウントが存在し、トップレベルの単一アカウント値も引き続き設定されている状態）だった場合は、`openclaw doctor --fix` を実行して、アカウントスコープの値をそのチャネルで選択された昇格先アカウントへ移動してください。

## ログインとログアウト（対話型）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` は `--account <id>` と `--verbose` をサポートし、`channels logout` は `--account <id>` をサポートします。
- 設定済みチャネルのうち、その操作をサポートするものが 1 つだけの場合、`channels login` と `logout` はチャネルを推測できます。複数ある場合は `--channel` を指定してください。
- `channels logout` は Gateway に到達できる場合、ライブ Gateway パスを優先するため、チャネルの認証状態を消去する前に、アクティブなリスナーを停止します。ローカル Gateway に到達できない場合は、ローカルでの認証クリーンアップへフォールバックします。`gateway.mode: "remote"` の場合は、代わりに Gateway エラーによってコマンドが失敗します。
- ログインに成功すると、CLI は到達可能なローカル Gateway にアカウントの起動を要求します。リモートモードでは、認証をローカルに保存し、リモートランタイムが再起動されなかったことを通知します。
- `channels login` は Gateway ホスト上のターミナルから実行してください。エージェントの `exec` はこの対話型ログインフローをブロックします。利用可能な場合、`whatsapp_login` などのチャネルネイティブなエージェントログインツールをチャットから使用してください。

## トラブルシューティング

- 広範なプローブを実行するには `openclaw status --deep` を使用します。
- ガイド付きの修正には `openclaw doctor` を使用します。
- Gateway に到達できない場合、`openclaw channels status` は設定のみの概要へフォールバックします。サポート対象チャネルの認証情報が SecretRef 経由で設定されていても、現在のコマンドパスでは利用できない場合、そのアカウントを未設定として表示する代わりに、劣化状態を示す注記付きで設定済みとして報告します。

## 機能プローブ

プロバイダーの機能ヒント（利用可能な場合はインテントやスコープ）と、静的な機能サポートを取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注記:

- `--channel` は任意です。省略すると、Plugin が提供するチャネルを含むすべてのチャネルを一覧表示します。
- `--account` は `--channel` と併用する場合のみ有効です。
- `--target` は `channel:<id>` または生の数値チャネル ID を受け付け、Discord にのみ適用されます。Discord の音声チャネルでは、権限チェックによって不足している `ViewChannel`、`Connect`、`Speak`、`SendMessages`、`ReadMessageHistory` が示されます。
- プローブはプロバイダー固有です。Discord ではボットの ID とインテント、および任意のチャネル権限、Slack ではボットとユーザーのスコープ、Telegram ではボットフラグと Webhook、Signal ではデーモンのバージョン、Microsoft Teams ではアプリトークンと Graph のロールやスコープ（判明している場合は注記付き）を確認します。プローブがないチャネルでは `Probe: unavailable` と報告されます。

## 名前から ID への解決

プロバイダーのディレクトリを使用して、チャネル名やユーザー名を ID に解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注記:

- ターゲットの種類を強制するには、`--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有している場合、解決ではアクティブな一致が優先されます。
- `channels resolve` は読み取り専用です。選択したアカウントが SecretRef 経由で設定されていても、その認証情報が現在のコマンドパスでは利用できない場合、実行全体を中止する代わりに、注記付きの劣化した未解決結果を返します。
- `channels resolve` はチャネル Plugin をインストールしません。インストール可能なカタログチャネルの名前を解決する前に、`channels add --channel <name>` を使用してください。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [チャネルの概要](/ja-JP/channels)
