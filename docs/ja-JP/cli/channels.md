---
read_when:
    - チャネルアカウント（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（Plugin）/Signal/iMessage/Matrix）を追加/削除したい
    - チャンネルのステータスを確認する、またはチャンネルログを追跡表示する場合
summary: '`openclaw channels` の CLI リファレンス (アカウント、状態、ログイン/ログアウト、ログ)'
title: チャンネル
x-i18n:
    generated_at: "2026-04-30T05:03:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc3c5983114c17e0e7284450aa161b658312c05864db65e09d6d764e357cd1f
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway 上のチャットチャネルアカウントとその実行時ステータスを管理します。

関連ドキュメント:

- チャネルガイド: [チャネル](/ja-JP/channels)
- Gateway 設定: [設定](/ja-JP/gateway/configuration)

## 一般的なコマンド

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
`probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポートの
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が含まれる場合があります。
Gateway に到達できない場合、`channels status` はライブプローブ出力の代わりに設定のみの要約へフォールバックします。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` はチャネルごとのフラグ (トークン、秘密鍵、アプリトークン、signal-cli パスなど) を表示します。
</Tip>

一般的な非対話型の追加サーフェスは次のとおりです。

- bot-token チャネル: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage トランスポートフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat フィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix フィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr フィールド: `--private-key`, `--relay-urls`
- Tlon フィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- 対応している場合、既定アカウントの環境変数ベース認証に使用する `--use-env`

フラグ駆動の追加コマンド中にチャネル Plugin のインストールが必要な場合、OpenClaw は対話型 Plugin インストールプロンプトを開かずに、そのチャネルの既定のインストールソースを使用します。

フラグなしで `openclaw channels add` を実行すると、対話型ウィザードは次の入力を求める場合があります。

- 選択したチャネルごとのアカウント ID
- それらのアカウントの任意の表示名
- `Bind configured channel accounts to agents now?`

ここでバインドを確認すると、ウィザードは設定済みの各チャネルアカウントをどのエージェントが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後から `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます ([agents](/ja-JP/cli/agents) を参照)。

単一アカウントのトップレベル設定をまだ使用しているチャネルに非既定アカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、アカウントスコープのトップレベル値をそのチャネルのアカウントマップへ昇格します。ほとんどのチャネルでは、それらの値は `channels.<channel>.accounts.default` に配置されますが、バンドル済みチャネルでは、既存の一致する昇格済みアカウントを保持できる場合があります。現在の例は Matrix です。名前付きアカウントが 1 つすでに存在する場合、または `defaultAccount` が既存の名前付きアカウントを指している場合、昇格では新しい `accounts.default` を作成せずにそのアカウントを保持します。

ルーティング動作は一貫したままです。

- 既存のチャネルのみのバインディング (`accountId` なし) は、引き続き既定アカウントに一致します。
- `channels add` は非対話モードでバインディングを自動作成または書き換えません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態 (名前付きアカウントが存在し、トップレベルの単一アカウント値もまだ設定されている状態) の場合は、`openclaw doctor --fix` を実行して、アカウントスコープの値をそのチャネル用に選択された昇格済みアカウントへ移動してください。ほとんどのチャネルは `accounts.default` へ昇格しますが、Matrix は既存の名前付き/既定ターゲットを代わりに保持できます。

## ログインとログアウト (対話型)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` は `--verbose` をサポートします。
- `channels login` と `logout` は、対応するログインターゲットが 1 つだけ設定されている場合、チャネルを推定できます。
- `channels login` は Gateway ホスト上のターミナルから実行します。エージェントの `exec` はこの対話型ログインフローをブロックします。`whatsapp_login` などのチャネルネイティブなエージェントログインツールが利用可能な場合は、チャットから使用してください。

## トラブルシューティング

- 広範なプローブには `openclaw status --deep` を実行します。
- ガイド付き修正には `openclaw doctor` を使用します。
- `openclaw channels list` が `Claude: HTTP 403 ... user:profile` を出力する場合、使用状況スナップショットには `user:profile` スコープが必要です。`--no-usage` を使用するか、claude.ai セッションキー (`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`) を指定するか、Claude CLI で再認証してください。
- `openclaw channels status` は、Gateway に到達できない場合、設定のみの要約へフォールバックします。対応チャネルの資格情報が SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、そのアカウントは未設定として表示されるのではなく、劣化状態の注記付きで設定済みとして報告されます。

## 機能プローブ

プロバイダーの機能ヒント (利用可能な場合はインテント/スコープ) と静的な機能サポートを取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注記:

- `--channel` は任意です。省略すると、すべてのチャネル (拡張を含む) が一覧表示されます。
- `--account` は `--channel` と併用する場合にのみ有効です。
- `--target` は `channel:<id>` または生の数値チャネル ID を受け入れ、Discord にのみ適用されます。
- プローブはプロバイダー固有です。Discord のインテントと任意のチャネル権限、Slack のボットとユーザースコープ、Telegram のボットフラグと Webhook、Signal デーモンバージョン、Microsoft Teams のアプリトークンと Graph ロール/スコープ (既知の場合は注釈付き) です。プローブのないチャネルは `Probe: unavailable` を報告します。

## 名前を ID に解決

プロバイダーディレクトリを使用して、チャネル名/ユーザー名を ID に解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注記:

- ターゲット種別を強制するには `--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有している場合、解決ではアクティブな一致が優先されます。
- `channels resolve` は読み取り専用です。選択されたアカウントが SecretRef 経由で設定されているものの、その資格情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中止する代わりに、注記付きの劣化状態の未解決結果を返します。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャネル概要](/ja-JP/channels)
