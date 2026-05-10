---
read_when:
    - チャンネルアカウント（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（Plugin）/Signal/iMessage/Matrix）を追加/削除したい
    - チャンネルの状態を確認するか、チャンネルログを追跡表示したい
summary: '`openclaw channels` の CLI リファレンス（accounts、status、login/logout、logs）'
title: チャネル
x-i18n:
    generated_at: "2026-05-10T19:27:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: e860f2863e148a46b9beb7f855eb9f30addc1b012f1430bf33c544c5e321821d
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway 上のチャットチャネルアカウントとそのランタイム状態を管理します。

関連ドキュメント:

- チャネルガイド: [チャネル](/ja-JP/channels)
- Gateway 設定: [設定](/ja-JP/gateway/configuration)

## よく使うコマンド

```bash
openclaw channels list
openclaw channels list --all
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

`channels list` はチャットチャネルのみを表示します。デフォルトでは設定済みアカウントが表示され、アカウントごとに `installed`、`configured`、`enabled` の状態タグが付きます。`--all` を渡すと、まだ設定済みアカウントがないバンドル済みチャネルと、まだディスク上にないインストール可能なカタログチャネルも表示されます。認証プロバイダー（OAuth + API キー）とモデルプロバイダーの使用量/クォータのスナップショットは、ここには出力されなくなりました。プロバイダー認証プロファイルには `openclaw models auth list` を、使用量には `openclaw status` または `openclaw models list` を使用してください。

## 状態 / 機能 / 解決 / ログ

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`（`--channel` と併用する場合のみ）、`--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` はライブパスです。到達可能な gateway では、アカウントごとに
`probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポートの
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が含まれることがあります。
gateway に到達できない場合、`channels status` はライブプローブ出力ではなく、設定のみの要約にフォールバックします。

チャネルのソケット健全性シグナルとして、`openclaw sessions`、Gateway `sessions.list`、またはエージェントの
`sessions_list` ツールを使用しないでください。これらのサーフェスが報告するのは保存済みの会話行であり、プロバイダーのランタイム状態ではありません。Discord プロバイダーの再起動後、接続済みだが静かなアカウントは健全な場合がありますが、次の受信または送信の会話イベントまで Discord のセッション行は表示されないことがあります。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` はチャネルごとのフラグ（トークン、秘密鍵、アプリトークン、signal-cli パスなど）を表示します。
</Tip>

`channels remove` は、インストール済み/設定済みのチャネル Plugin に対してのみ動作します。インストール可能なカタログチャネルには、先に `channels add` を使用してください。
ランタイムに裏付けられたチャネル Plugin では、`channels remove` は設定を更新する前に、実行中の Gateway に選択したアカウントの停止も要求するため、アカウントを無効化または削除しても、再起動まで古いリスナーがアクティブなまま残ることはありません。

一般的な非対話型の追加サーフェスには次が含まれます。

- bot-token チャネル: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage トランスポートフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat フィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix フィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr フィールド: `--private-key`, `--relay-urls`
- Tlon フィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- サポートされている場合、デフォルトアカウントの env 裏付け認証には `--use-env`

フラグ駆動の追加コマンド中にチャネル Plugin のインストールが必要になった場合、OpenClaw は対話型の Plugin インストールプロンプトを開かずに、そのチャネルのデフォルトインストールソースを使用します。

フラグなしで `openclaw channels add` を実行すると、対話型ウィザードは次を尋ねることがあります。

- 選択したチャネルごとのアカウント ID
- それらのアカウントの任意の表示名
- `Route these channel accounts to agents now?`

ここで今すぐバインドすることを確認すると、ウィザードは設定済みの各チャネルアカウントをどのエージェントが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後から `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます（[agents](/ja-JP/cli/agents) を参照）。

単一アカウントのトップレベル設定をまだ使用しているチャネルにデフォルト以外のアカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、アカウントスコープのトップレベル値をそのチャネルのアカウントマップへ昇格します。ほとんどのチャネルではそれらの値は `channels.<channel>.accounts.default` に入りますが、バンドル済みチャネルでは、既存の一致する昇格先アカウントを保持できる場合があります。Matrix が現在の例です。名前付きアカウントが 1 つすでに存在する場合、または `defaultAccount` が既存の名前付きアカウントを指している場合、昇格では新しい `accounts.default` を作成せずにそのアカウントを保持します。

ルーティング動作は一貫したままです。

- 既存のチャネルのみのバインディング（`accountId` なし）は、引き続きデフォルトアカウントに一致します。
- `channels add` は非対話モードではバインディングを自動作成または書き換えません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態（名前付きアカウントが存在し、トップレベルの単一アカウント値もまだ設定されている状態）だった場合は、`openclaw doctor --fix` を実行して、そのチャネルで選択された昇格先アカウントへアカウントスコープ値を移動してください。ほとんどのチャネルは `accounts.default` へ昇格します。Matrix では、代わりに既存の名前付き/デフォルトターゲットを保持できます。

## ログインとログアウト（対話型）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` は `--verbose` をサポートします。
- `channels login` と `logout` は、サポートされているログインターゲットが 1 つだけ設定されている場合、チャネルを推論できます。
- `channels logout` は到達可能な場合、ライブ Gateway パスを優先するため、チャネル認証状態を消去する前にアクティブなリスナーを停止します。ローカル Gateway に到達できない場合は、ローカル認証のクリーンアップにフォールバックします。
- `channels login` は gateway ホスト上のターミナルから実行してください。エージェントの `exec` はこの対話型ログインフローをブロックします。`whatsapp_login` などのチャネルネイティブなエージェントログインツールが利用できる場合は、チャットから使用してください。

## トラブルシューティング

- 広範なプローブには `openclaw status --deep` を実行します。
- ガイド付き修正には `openclaw doctor` を使用します。
- `openclaw channels list` はモデルプロバイダーの使用量/クォータのスナップショットを出力しなくなりました。それらには `openclaw status`（概要）または `openclaw models list`（プロバイダーごと）を使用してください。
- gateway に到達できない場合、`openclaw channels status` は設定のみの要約にフォールバックします。サポートされているチャネル資格情報が SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、そのアカウントを未設定として表示するのではなく、劣化メモ付きの設定済みアカウントとして報告します。

## 機能プローブ

プロバイダーの機能ヒント（利用可能な場合は intent/scope）に加えて、静的な機能サポートを取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

メモ:

- `--channel` は任意です。すべてのチャネル（extensions を含む）を一覧表示するには省略します。
- `--account` は `--channel` と併用する場合のみ有効です。
- `--target` は `channel:<id>` または生の数値チャネル ID を受け付け、Discord にのみ適用されます。Discord ボイスチャネルでは、権限チェックが不足している `ViewChannel`、`Connect`、`Speak`、`SendMessages`、`ReadMessageHistory` をフラグします。
- プローブはプロバイダー固有です。Discord intent + 任意のチャネル権限、Slack bot + user scope、Telegram bot フラグ + Webhook、Signal daemon バージョン、Microsoft Teams アプリトークン + Graph ロール/scope（既知の場合は注記）。プローブのないチャネルは `Probe: unavailable` を報告します。

## 名前を ID に解決する

プロバイダーディレクトリを使用して、チャネル名/ユーザー名を ID に解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

メモ:

- ターゲット種別を強制するには `--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有する場合、解決ではアクティブな一致が優先されます。
- `channels resolve` は読み取り専用です。選択したアカウントが SecretRef 経由で設定されているものの、その資格情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中止せず、メモ付きの劣化した未解決結果を返します。
- `channels resolve` はチャネル Plugin をインストールしません。インストール可能なカタログチャネルの名前を解決する前に、`channels add --channel <name>` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネル概要](/ja-JP/channels)
