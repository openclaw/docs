---
read_when:
    - チャンネルアカウント（Discord、Google Chat、iMessage、Matrix、Signal、Slack、Telegram、WhatsApp など）を追加または削除したい場合
    - チャンネルの状態を確認する、またはチャンネルログを tail する
summary: '`openclaw channels` の CLI リファレンス（アカウント、ステータス、機能、解決、ログ、ログイン/ログアウト）'
title: チャンネル
x-i18n:
    generated_at: "2026-07-05T11:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41220535917d645e87dca82bc5c27319eff0035fe14a8cb18f001192b3aad5bd
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway 上のチャットチャネルアカウントとそのランタイム状態を管理します。

関連ドキュメント:

- チャネルガイド: [チャネル](/ja-JP/channels)
- Gateway 設定: [設定](/ja-JP/gateway/configuration)

## 共通コマンド

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` はチャットチャネルのみを表示します。デフォルトでは設定済みアカウントを表示し、アカウントごとに `installed`、`configured`、`enabled` のステータスタグを付けます（機械出力には `--json`）。`--all` を渡すと、まだ設定済みアカウントがないバンドル済みチャネルと、まだディスク上にないインストール可能なカタログチャネルも表示されます。プロバイダー認証とモデル使用状況は別の場所にあります。プロバイダー認証プロファイルは `openclaw models auth list`、使用量/クォータは `openclaw status` または `openclaw models list` です。

## ステータス / capabilities / resolve / ログ

- `channels status`: `--channel <name>`、`--probe`、`--timeout <ms>`（デフォルト `10000`）、`--json`
- `channels capabilities`: `--channel <name>`、`--account <id>`（`--channel` が必要）、`--target <dest>`（`--channel` が必要）、`--timeout <ms>`（デフォルト `10000`、上限 `30000`）、`--json`
- `channels resolve <entries...>`: `--channel <name>`、`--account <id>`、`--kind <auto|user|group>`（デフォルト `auto`）、`--json`
- `channels logs`: `--channel <name|all>`（デフォルト `all`）、`--lines <n>`（デフォルト `200`）、`--json`

`channels status --probe` はライブパスです。到達可能な Gateway ではアカウントごとに
`probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポート
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が含まれる場合があります。
Gateway に到達できない場合、`channels status` はライブプローブ出力ではなく
設定のみの概要にフォールバックします。

チャネルのソケット正常性シグナルとして、`openclaw sessions`、Gateway の `sessions.list`、またはエージェントの
`sessions_list` ツールを使用しないでください。これらのサーフェスは
保存された会話行を報告するものであり、プロバイダーのランタイム状態ではありません。Discord プロバイダーの
再起動後、接続済みだが静かなアカウントは正常な場合がありますが、次の受信または送信の会話イベントまで Discord セッション
行は表示されないことがあります。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` はチャネルごとのフラグ（トークン、秘密鍵、アプリトークン、signal-cli パスなど）を表示します。
</Tip>

`channels remove` は、インストール済み/設定済みのチャネル Plugin に対してのみ動作します。インストール可能なカタログチャネルには、先に `channels add` を使用してください。`--delete` がない場合はアカウントを無効化するか確認し、その設定を保持します。`--delete` は確認なしで設定エントリを削除します。
ランタイムに支えられたチャネル Plugin では、`channels remove` は設定を更新する前に、実行中の Gateway に選択したアカウントを停止するよう要求するため、アカウントを無効化または削除しても、再起動まで古いリスナーがアクティブなまま残ることはありません。

チャネル間で共有される非対話型の追加フラグ: `--account <id>`、`--name <name>`、`--token`、`--token-file`、`--bot-token`、`--app-token`、`--secret`、`--secret-file`、`--password`、`--cli-path`、`--url`、`--base-url`、`--http-url`、`--auth-dir`、`--use-env`（env ベース認証、デフォルトアカウントのみ、対応している場合）。チャネル固有のフラグは次のとおりです。

| チャネル    | フラグ                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Google Chat | `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`                                   |
| iMessage    | `--cli-path`, `--db-path`, `--service`, `--region`                                                   |
| Matrix      | `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit` |
| Nostr       | `--private-key`, `--relay-urls`                                                                      |
| Signal      | `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`                          |
| Tlon        | `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`        |
| WhatsApp    | `--auth-dir`                                                                                         |

フラグ駆動の追加コマンド中にチャネル Plugin のインストールが必要な場合、OpenClaw は対話型 Plugin インストールプロンプトを開かずに、そのチャネルのデフォルトインストールソースを使用します。

フラグなしで `openclaw channels add` を実行すると、対話型ウィザードは次の入力を求めることがあります。

- 選択したチャネルごとのアカウント ID
- それらのアカウントの任意の表示名
- `Route these channel accounts to agents now?`

今すぐバインドすることを確認すると、ウィザードは設定済みの各チャネルアカウントをどのエージェントが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後から `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます（[agents](/ja-JP/cli/agents) を参照）。

単一アカウントのトップレベル設定をまだ使用しているチャネルにデフォルト以外のアカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、それらのトップレベル値をチャネルのアカウントマップに昇格します。チャネルに名前付きアカウントがちょうど 1 つある場合、または `defaultAccount` が 1 つを指している場合は、昇格で既存の名前付きアカウントを再利用します。それ以外の場合、値は `channels.<channel>.accounts.default` に入ります。

ルーティング動作は一貫したままです。

- 既存のチャネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。
- `channels add` は非対話モードでバインディングを自動作成または書き換えません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態（名前付きアカウントが存在し、トップレベルの単一アカウント値もまだ設定されている）だった場合は、`openclaw doctor --fix` を実行して、アカウントスコープの値をそのチャネル用に選択された昇格先アカウントへ移動してください。

## ログインとログアウト（対話型）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` は `--account <id>` と `--verbose` をサポートします。`channels logout` は `--account <id>` をサポートします。
- `channels login` と `logout` は、そのアクションに対応する設定済みチャネルが 1 つだけの場合、チャネルを推測できます。複数ある場合は `--channel` を渡してください。
- `channels logout` は到達可能な場合にライブ Gateway パスを優先するため、チャネル認証状態を消去する前にアクティブなリスナーを停止します。ローカル Gateway に到達できない場合は、ローカル認証クリーンアップにフォールバックします。`gateway.mode: "remote"` では、Gateway エラーによりコマンドは失敗します。
- ログインに成功すると、CLI は到達可能なローカル Gateway にアカウントの開始を要求します。リモートモードでは認証をローカルに保存し、リモートランタイムは再起動されなかったことを通知します。
- `channels login` は Gateway ホスト上のターミナルから実行してください。エージェントの `exec` はこの対話型ログインフローをブロックします。`whatsapp_login` などのチャネルネイティブなエージェントログインツールが利用できる場合は、チャットから使用してください。

## トラブルシューティング

- 広範なプローブには `openclaw status --deep` を実行します。
- ガイド付き修正には `openclaw doctor` を使用します。
- Gateway に到達できない場合、`openclaw channels status` は設定のみの概要にフォールバックします。対応チャネルの認証情報が SecretRef 経由で設定されているものの現在のコマンドパスで利用できない場合、そのアカウントを未設定として表示する代わりに、低下状態の注記付きで設定済みとして報告します。

## capabilities プローブ

静的な機能サポートに加えて、プロバイダーの capability ヒント（利用可能な場合は intents/scopes）を取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注記:

- `--channel` は任意です。すべてのチャネル（Plugin 提供のチャネルを含む）を一覧表示するには省略します。
- `--account` は `--channel` と一緒にのみ有効です。
- `--target` は `channel:<id>` または生の数値チャネル ID を受け付け、Discord にのみ適用されます。Discord ボイスチャネルでは、権限チェックが不足している `ViewChannel`、`Connect`、`Speak`、`SendMessages`、`ReadMessageHistory` をフラグします。
- プローブはプロバイダー固有です。Discord ボット ID + intents と任意のチャネル権限、Slack ボット + ユーザースコープ、Telegram ボットフラグ + Webhook、Signal デーモンバージョン、Microsoft Teams アプリトークン + Graph ロール/スコープ（判明している場合は注記付き）。プローブのないチャネルは `Probe: unavailable` を報告します。

## 名前を ID に解決する

プロバイダーディレクトリを使用して、チャネル/ユーザー名を ID に解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注記:

- ターゲットタイプを強制するには `--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有する場合、解決はアクティブな一致を優先します。
- `channels resolve` は読み取り専用です。選択されたアカウントが SecretRef 経由で設定されているものの、その認証情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中止する代わりに、注記付きの低下状態の未解決結果を返します。
- `channels resolve` はチャネル Plugin をインストールしません。インストール可能なカタログチャネルの名前を解決する前に、`channels add --channel <name>` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネル概要](/ja-JP/channels)
