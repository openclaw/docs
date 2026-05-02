---
read_when:
    - チャネルアカウント (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix) を追加/削除したい
    - チャネルの状態を確認するか、チャネルログを追尾したい場合
summary: '`openclaw channels` の CLI リファレンス（accounts、status、login/logout、logs）'
title: チャンネル
x-i18n:
    generated_at: "2026-05-02T04:50:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9cfde99d49d63397756b182a20ae3936a6b23f2455616dc86ceb3f16a205c06
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway 上のチャットチャネルアカウントとその実行時ステータスを管理します。

関連ドキュメント:

- チャネルガイド: [チャネル](/ja-JP/channels)
- Gateway 設定: [設定](/ja-JP/gateway/configuration)

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

`channels status --probe` はライブパスです。到達可能な Gateway では、アカウントごとの
`probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポート
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が含まれることがあります。
Gateway に到達できない場合、`channels status` はライブプローブ出力ではなく設定のみの要約にフォールバックします。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` には、チャネルごとのフラグ (トークン、秘密鍵、アプリトークン、signal-cli パスなど) が表示されます。
</Tip>

`channels remove` は、インストール済みまたは設定済みのチャネル Plugin に対してのみ動作します。インストール可能なカタログチャネルには、先に `channels add` を使用してください。
実行時バックエンド付きのチャネル Plugin では、`channels remove` は設定を更新する前に、実行中の Gateway に選択したアカウントを停止するよう依頼します。そのため、アカウントを無効化または削除しても、再起動まで古いリスナーが有効なまま残ることはありません。

一般的な非対話型の追加サーフェスは次のとおりです。

- bot-token チャネル: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage トランスポートフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat フィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix フィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr フィールド: `--private-key`, `--relay-urls`
- Tlon フィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- 対応している場合、デフォルトアカウントの env バックエンド認証用の `--use-env`

フラグ駆動の追加コマンド中にチャネル Plugin のインストールが必要な場合、OpenClaw は対話型の Plugin インストールプロンプトを開かずに、そのチャネルのデフォルトインストール元を使用します。

フラグなしで `openclaw channels add` を実行すると、対話型ウィザードは次の入力を求める場合があります。

- 選択したチャネルごとのアカウント ID
- それらのアカウントの任意の表示名
- `Bind configured channel accounts to agents now?`

ここでバインドを確定すると、ウィザードは設定済みの各チャネルアカウントをどのエージェントが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後から `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます ([agents](/ja-JP/cli/agents) を参照)。

単一アカウントのトップレベル設定をまだ使用しているチャネルに非デフォルトアカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、アカウントスコープのトップレベル値をそのチャネルのアカウントマップへ昇格します。ほとんどのチャネルでは、それらの値は `channels.<channel>.accounts.default` に配置されますが、バンドル済みチャネルでは、既存の一致する昇格先アカウントを保持できる場合があります。Matrix が現在の例です。名前付きアカウントが 1 つすでに存在する場合、または `defaultAccount` が既存の名前付きアカウントを指している場合、昇格では新しい `accounts.default` を作成せず、そのアカウントを保持します。

ルーティング動作は一貫しています。

- 既存のチャネルのみのバインディング (`accountId` なし) は、引き続きデフォルトアカウントに一致します。
- `channels add` は、非対話型モードではバインディングを自動作成または書き換えません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態 (名前付きアカウントが存在し、トップレベルの単一アカウント値もまだ設定されている状態) だった場合は、`openclaw doctor --fix` を実行して、そのチャネル用に選択された昇格先アカウントへアカウントスコープ値を移動してください。ほとんどのチャネルは `accounts.default` に昇格しますが、Matrix は代わりに既存の名前付き/デフォルトターゲットを保持できます。

## ログインとログアウト (対話型)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` は `--verbose` に対応しています。
- `channels login` と `logout` は、対応しているログイン対象が 1 つだけ設定されている場合、チャネルを推論できます。
- `channels logout` は、到達可能な場合はライブ Gateway パスを優先するため、チャネル認証状態をクリアする前にアクティブなリスナーを停止します。ローカル Gateway に到達できない場合は、ローカル認証クリーンアップにフォールバックします。
- `channels login` は Gateway ホスト上のターミナルから実行してください。エージェントの `exec` はこの対話型ログインフローをブロックします。`whatsapp_login` など、チャネルネイティブのエージェントログインツールが利用できる場合は、チャットから使用してください。

## トラブルシューティング

- 広範なプローブには `openclaw status --deep` を実行します。
- ガイド付き修正には `openclaw doctor` を使用します。
- `openclaw channels list` が `Claude: HTTP 403 ... user:profile` を出力する → 使用状況スナップショットには `user:profile` スコープが必要です。`--no-usage` を使用するか、claude.ai セッションキー (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) を指定するか、Claude CLI で再認証してください。
- `openclaw channels status` は、Gateway に到達できない場合、設定のみの要約にフォールバックします。対応しているチャネル認証情報が SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、そのアカウントは未設定として表示されるのではなく、低下状態の注記付きで設定済みとして報告されます。

## 機能プローブ

プロバイダーの機能ヒント (利用可能な場合はインテント/スコープ) と静的な機能対応状況を取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注記:

- `--channel` は任意です。省略すると、すべてのチャネル (拡張を含む) が一覧表示されます。
- `--account` は `--channel` と併用する場合のみ有効です。
- `--target` は `channel:<id>` または生の数値チャネル ID を受け付け、Discord にのみ適用されます。
- プローブはプロバイダー固有です。Discord のインテントと任意のチャネル権限、Slack のボットとユーザースコープ、Telegram のボットフラグと Webhook、Signal デーモンバージョン、Microsoft Teams のアプリトークンと Graph ロール/スコープ (既知の場合は注記付き) です。プローブのないチャネルは `Probe: unavailable` を報告します。

## 名前を ID に解決する

プロバイダーディレクトリを使用して、チャネル名/ユーザー名を ID に解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注記:

- 対象タイプを強制するには `--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有している場合、解決はアクティブな一致を優先します。
- `channels resolve` は読み取り専用です。選択されたアカウントが SecretRef 経由で設定されているものの、その認証情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中止せず、注記付きの低下状態の未解決結果を返します。
- `channels resolve` はチャネル Plugin をインストールしません。インストール可能なカタログチャネルの名前を解決する前に、`channels add --channel <name>` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネル概要](/ja-JP/channels)
