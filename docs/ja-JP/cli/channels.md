---
read_when:
    - チャネルアカウント（WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（Plugin）/Signal/iMessage/Matrix）を追加/削除したい場合
    - チャネルの状態を確認したり、チャネルログを追跡したい場合
summary: '`openclaw channels` のCLIリファレンス（accounts、status、login/logout、logs）'
title: チャネル
x-i18n:
    generated_at: "2026-04-24T04:49:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31c0f3b830f12e8561ba52f70a599d8b572fcb0a9f9c25e5608860bb7e8661de
    source_path: cli/channels.md
    workflow: 15
---

# `openclaw channels`

Gateway上のチャネルアカウントとその実行時ステータスを管理します。

関連ドキュメント:

- チャネルガイド: [Channels](/ja-JP/channels/index)
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

## status / capabilities / resolve / logs

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>`（`--channel`指定時のみ）, `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe`はライブパスです。到達可能なgatewayでは、アカウントごとの
`probeAccount`および任意の`auditAccount`チェックを実行するため、出力にはトランスポート
状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed`などのプローブ結果が含まれる場合があります。
gatewayに到達できない場合、`channels status`はライブプローブ出力の代わりに設定のみの要約へフォールバックします。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

ヒント: `openclaw channels add --help`には、チャネルごとのフラグ（token、private key、app token、signal-cliパスなど）が表示されます。

よく使われる非対話型のadd指定には次が含まれます。

- bot-tokenチャネル: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessageのトランスポートフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chatフィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrixフィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostrフィールド: `--private-key`, `--relay-urls`
- Tlonフィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- 対応している場合、デフォルトアカウントの環境変数ベース認証には`--use-env`

フラグなしで`openclaw channels add`を実行すると、対話型ウィザードでは次を尋ねることがあります。

- 選択した各チャネルのアカウントID
- それらのアカウントの任意の表示名
- `Bind configured channel accounts to agents now?`

今すぐbindすることを確認すると、ウィザードは各設定済みチャネルアカウントをどのエージェントに割り当てるかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後から`openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind`でも管理できます（[agents](/ja-JP/cli/agents)を参照）。

単一アカウント用のトップレベル設定をまだ使用しているチャネルに対して、非デフォルトアカウントを追加すると、OpenClawは新しいアカウントを書き込む前に、アカウントスコープのトップレベル値をそのチャネルのアカウントマップへ昇格させます。ほとんどのチャネルではそれらの値は`channels.<channel>.accounts.default`に入りますが、バンドルチャネルでは、既存の一致する昇格済みアカウントを代わりに保持できます。現在の例はMatrixです。名前付きアカウントがすでに1つ存在する場合、または`defaultAccount`が既存の名前付きアカウントを指している場合、昇格では新しい`accounts.default`を作成せず、そのアカウントを保持します。

ルーティング動作は一貫したままです。

- 既存のチャネルのみのバインディング（`accountId`なし）は、引き続きデフォルトアカウントに一致します。
- `channels add`は、非対話モードではバインディングを自動作成または書き換えしません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態（名前付きアカウントが存在し、なおかつトップレベルの単一アカウント値も設定されている）である場合は、`openclaw doctor --fix`を実行して、アカウントスコープの値をそのチャネル用に選ばれた昇格済みアカウントへ移動してください。ほとんどのチャネルは`accounts.default`へ昇格しますが、Matrixでは既存の名前付き/デフォルト対象を保持できます。

## ログイン / ログアウト（対話型）

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

注意:

- `channels login`は`--verbose`をサポートします。
- `channels login` / `logout`は、サポートされるログイン対象が1つだけ設定されている場合、チャネルを推測できます。

## トラブルシューティング

- 幅広いプローブには`openclaw status --deep`を実行してください。
- ガイド付き修正には`openclaw doctor`を使用してください。
- `openclaw channels list`に`Claude: HTTP 403 ... user:profile`と表示される場合 → 使用状況スナップショットには`user:profile`スコープが必要です。`--no-usage`を使うか、claude.aiセッションキー（`CLAUDE_WEB_SESSION_KEY` / `CLAUDE_WEB_COOKIE`）を指定するか、Claude CLIで再認証してください。
- `openclaw channels status`は、gatewayに到達できない場合に設定のみの要約へフォールバックします。サポートされるチャネル資格情報がSecretRef経由で設定されていても、現在のコマンドパスで利用できない場合、そのアカウントは未設定として表示されるのではなく、劣化状態の注記付きで設定済みとして報告されます。

## 機能プローブ

利用可能な場合はプロバイダーの機能ヒント（intents/scopes）に加えて、静的な機能サポートを取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注意:

- `--channel`は任意です。省略すると、すべてのチャネル（拡張機能を含む）を一覧表示します。
- `--account`は`--channel`と一緒の場合のみ有効です。
- `--target`は`channel:<id>`または生の数値チャネルIDを受け取り、Discordにのみ適用されます。
- プローブはプロバイダー固有です。Discordのintents + 任意のチャネル権限、Slackのbot + user scopes、Telegramのbotフラグ + Webhook、Signalのデーモンバージョン、Microsoft Teamsのapp token + Graph roles/scopes（既知の場合は注記付き）などです。プローブのないチャネルは`Probe: unavailable`を報告します。

## 名前をIDに解決する

プロバイダーディレクトリを使用して、チャネル名/ユーザー名をIDへ解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注意:

- ターゲット種別を強制するには`--kind user|group|auto`を使用します。
- 同じ名前の複数エントリがある場合、解決ではアクティブな一致を優先します。
- `channels resolve`は読み取り専用です。選択したアカウントがSecretRef経由で設定されていても、その資格情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中断する代わりに、注記付きの劣化した未解決結果を返します。

## 関連

- [CLI reference](/ja-JP/cli)
- [Channels overview](/ja-JP/channels)
