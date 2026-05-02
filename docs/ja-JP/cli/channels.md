---
read_when:
    - WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix のチャネルアカウントを追加/削除したい場合
    - チャンネルの状態を確認する、またはチャンネルログを追跡表示する場合
summary: '`openclaw channels` の CLI リファレンス（アカウント、ステータス、ログイン/ログアウト、ログ）'
title: チャンネル
x-i18n:
    generated_at: "2026-05-02T20:43:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3aff374e81e0845805b9baf09d6b63dfe8270cb48606f74f3f1f2dcd56b552c4
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway 上のチャットチャネルアカウントとその実行時ステータスを管理します。

関連ドキュメント:

- チャネルガイド: [Channels](/ja-JP/channels)
- Gateway設定: [Configuration](/ja-JP/gateway/configuration)

## よく使うコマンド

```bash
openclaw channels list
openclaw channels status
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels logs --channel all
```

## ステータス / 機能 / 解決 / ログ

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel` と併用する場合のみ), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` はライブパスです。到達可能な Gateway では、アカウントごとに
`probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポート
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が含まれる場合があります。
Gateway に到達できない場合、`channels status` はライブプローブ出力ではなく、設定のみの要約にフォールバックします。

チャネルのソケット健全性シグナルとして、`openclaw sessions`、Gateway の `sessions.list`、またはエージェントの
`sessions_list` ツールを使用しないでください。これらのサーフェスは、
プロバイダーの実行時状態ではなく、保存済みの会話行を報告します。Discord プロバイダーの
再起動後、接続済みだが静かなアカウントは健全な場合がありますが、次の受信または送信の会話イベントが発生するまで Discord セッション行は表示されません。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` はチャネルごとのフラグ (トークン、秘密鍵、アプリトークン、signal-cli パスなど) を表示します。
</Tip>

`channels remove` は、インストール済みまたは設定済みのチャネル Plugin に対してのみ動作します。インストール可能なカタログチャネルには、先に `channels add` を使用してください。
実行時バックエンド付きのチャネル Plugin では、`channels remove` は設定を更新する前に、実行中の Gateway に対して選択したアカウントの停止も要求するため、アカウントを無効化または削除しても、再起動まで古いリスナーがアクティブなまま残ることはありません。

一般的な非対話型の追加サーフェスには次が含まれます:

- bot-token チャネル: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage トランスポートフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat フィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix フィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr フィールド: `--private-key`, `--relay-urls`
- Tlon フィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- サポートされている場合、デフォルトアカウントの env バックエンド認証に使う `--use-env`

フラグ駆動の追加コマンド中にチャネル Plugin のインストールが必要な場合、OpenClaw は対話型の Plugin インストールプロンプトを開かずに、そのチャネルのデフォルトインストールソースを使用します。

フラグなしで `openclaw channels add` を実行すると、対話型ウィザードは次を求めることがあります:

- 選択したチャネルごとのアカウント ID
- それらのアカウントの任意の表示名
- `Bind configured channel accounts to agents now?`

今すぐバインドすることを確認すると、ウィザードは、設定済みの各チャネルアカウントをどのエージェントが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後で `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます ([agents](/ja-JP/cli/agents) を参照)。

単一アカウントのトップレベル設定をまだ使用しているチャネルにデフォルト以外のアカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、アカウントスコープのトップレベル値をそのチャネルのアカウントマップへ昇格します。ほとんどのチャネルでは、これらの値は `channels.<channel>.accounts.default` に入りますが、バンドルされたチャネルは既存の一致する昇格済みアカウントを保持できます。Matrix が現在の例です。名前付きアカウントが 1 つすでに存在する場合、または `defaultAccount` が既存の名前付きアカウントを指している場合、昇格では新しい `accounts.default` を作成せず、そのアカウントを保持します。

ルーティング動作は一貫したままです:

- 既存のチャネルのみのバインディング (`accountId` なし) は、引き続きデフォルトアカウントに一致します。
- `channels add` は非対話型モードではバインディングを自動作成または書き換えません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態 (名前付きアカウントが存在し、トップレベルの単一アカウント値もまだ設定されている状態) だった場合は、`openclaw doctor --fix` を実行して、アカウントスコープの値をそのチャネル用に選ばれた昇格先アカウントへ移動してください。ほとんどのチャネルは `accounts.default` に昇格します。Matrix は代わりに既存の名前付きターゲットまたはデフォルトターゲットを保持できます。

## ログインとログアウト (対話型)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` は `--verbose` をサポートします。
- `channels login` と `logout` は、サポートされているログイン対象が 1 つだけ設定されている場合、チャネルを推測できます。
- `channels logout` は、到達可能な場合はライブ Gateway パスを優先するため、チャネル認証状態をクリアする前にアクティブなリスナーを停止します。ローカル Gateway に到達できない場合は、ローカル認証クリーンアップにフォールバックします。
- `channels login` は Gateway ホスト上のターミナルから実行してください。エージェントの `exec` はこの対話型ログインフローをブロックします。`whatsapp_login` などのチャネルネイティブなエージェントログインツールが利用可能な場合は、チャットから使用してください。

## トラブルシューティング

- 広範なプローブには `openclaw status --deep` を実行します。
- ガイド付きの修正には `openclaw doctor` を使用します。
- `openclaw channels list` が `Claude: HTTP 403 ... user:profile` を表示する → 使用状況スナップショットには `user:profile` スコープが必要です。`--no-usage` を使用するか、claude.ai セッションキー (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) を指定するか、Claude CLI で再認証してください。
- `openclaw channels status` は、Gateway に到達できない場合、設定のみの要約にフォールバックします。サポート対象チャネルの認証情報が SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、そのアカウントを未設定として表示するのではなく、劣化状態の注記付きで設定済みとして報告します。

## 機能プローブ

プロバイダーの機能ヒント (利用可能な場合は intents/scopes) と静的な機能サポートを取得します:

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注記:

- `--channel` は任意です。省略すると、すべてのチャネル (extensions を含む) が一覧表示されます。
- `--account` は `--channel` と併用する場合のみ有効です。
- `--target` は `channel:<id>` または生の数値チャネル ID を受け付け、Discord にのみ適用されます。
- プローブはプロバイダー固有です: Discord intents + 任意のチャネル権限、Slack bot + user scopes、Telegram bot flags + webhook、Signal daemon version、Microsoft Teams app token + Graph roles/scopes (既知の場合は注釈付き)。プローブのないチャネルは `Probe: unavailable` を報告します。

## 名前を ID に解決する

プロバイダーディレクトリを使用して、チャネル名やユーザー名を ID に解決します:

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注記:

- ターゲットタイプを強制するには `--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有している場合、解決ではアクティブな一致が優先されます。
- `channels resolve` は読み取り専用です。選択したアカウントが SecretRef 経由で設定されているものの、その認証情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中止するのではなく、注記付きの劣化した未解決結果を返します。
- `channels resolve` はチャネル Plugin をインストールしません。インストール可能なカタログチャネルの名前を解決する前に、`channels add --channel <name>` を使用してください。

## 関連

- [CLI reference](/ja-JP/cli)
- [Channels overview](/ja-JP/channels)
