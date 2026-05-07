---
read_when:
    - チャンネルアカウントを追加/削除したい (WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix)
    - チャンネルの状態を確認するか、チャンネルログを追跡表示したい場合
summary: '`openclaw channels` の CLI リファレンス（アカウント、ステータス、ログイン/ログアウト、ログ）'
title: チャンネル
x-i18n:
    generated_at: "2026-05-07T13:13:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: a78d7a5306c822314052151e0a9aa8bed347481f59d9a19f92240dfa562e4b23
    source_path: cli/channels.md
    workflow: 16
---

# `openclaw channels`

Gateway 上のチャットチャンネルアカウントとそのランタイムステータスを管理します。

関連ドキュメント:

- チャンネルガイド: [チャンネル](/ja-JP/channels)
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

`channels list` はチャットチャンネルのみを表示します。既定では設定済みアカウントを表示し、アカウントごとに `installed`、`configured`、`enabled` のステータスタグを表示します。`--all` を渡すと、まだ設定済みアカウントがないバンドル済みチャンネルと、まだディスク上にないインストール可能なカタログチャンネルも表示します。認証プロバイダー (OAuth + API キー) とモデルプロバイダーの使用量/クォータのスナップショットは、ここには表示されなくなりました。プロバイダー認証プロファイルには `openclaw models auth list` を、使用量には `openclaw status` または `openclaw models list` を使用してください。

## ステータス / 機能 / 解決 / ログ

- `channels status`: `--probe`, `--timeout <ms>`, `--json`
- `channels capabilities`: `--channel <name>`, `--account <id>` (`--channel` と併用する場合のみ), `--target <dest>`, `--timeout <ms>`, `--json`
- `channels resolve`: `<entries...>`, `--channel <name>`, `--account <id>`, `--kind <auto|user|group>`, `--json`
- `channels logs`: `--channel <name|all>`, `--lines <n>`, `--json`

`channels status --probe` はライブパスです。到達可能な Gateway 上では、アカウントごとの `probeAccount` と任意の `auditAccount` チェックを実行するため、出力にはトランスポート状態に加えて、`works`、`probe failed`、`audit ok`、`audit failed` などのプローブ結果が含まれることがあります。Gateway に到達できない場合、`channels status` はライブプローブ出力ではなく、設定のみの要約にフォールバックします。

チャンネルソケットのヘルスシグナルとして、`openclaw sessions`、Gateway の `sessions.list`、またはエージェントの `sessions_list` ツールを使用しないでください。これらのサーフェスは、プロバイダーのランタイム状態ではなく、保存された会話行を報告します。Discord プロバイダーの再起動後、接続済みでも静かなアカウントは正常な場合がありますが、次の受信または送信会話イベントまで Discord セッション行は表示されません。

## アカウントの追加 / 削除

```bash
openclaw channels add --channel telegram --token <bot-token>
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels remove --channel telegram --delete
```

<Tip>
`openclaw channels add --help` はチャンネルごとのフラグ (トークン、秘密鍵、アプリトークン、signal-cli パスなど) を表示します。
</Tip>

`channels remove` は、インストール済み/設定済みのチャンネルPluginに対してのみ動作します。インストール可能なカタログチャンネルには、先に `channels add` を使用してください。
ランタイムに裏付けられたチャンネルPluginでは、`channels remove` は設定を更新する前に、選択したアカウントの停止を実行中の Gateway にも要求します。そのため、アカウントを無効化または削除しても、再起動まで古いリスナーがアクティブなまま残ることはありません。

一般的な非対話型の追加サーフェスには次があります。

- bot-token チャンネル: `--token`, `--bot-token`, `--app-token`, `--token-file`
- Signal/iMessage トランスポートフィールド: `--signal-number`, `--cli-path`, `--http-url`, `--http-host`, `--http-port`, `--db-path`, `--service`, `--region`
- Google Chat フィールド: `--webhook-path`, `--webhook-url`, `--audience-type`, `--audience`
- Matrix フィールド: `--homeserver`, `--user-id`, `--access-token`, `--password`, `--device-name`, `--initial-sync-limit`
- Nostr フィールド: `--private-key`, `--relay-urls`
- Tlon フィールド: `--ship`, `--url`, `--code`, `--group-channels`, `--dm-allowlist`, `--auto-discover-channels`
- サポートされている場合、既定アカウントの環境変数ベース認証には `--use-env`

フラグ駆動の追加コマンド中にチャンネルPluginをインストールする必要がある場合、OpenClaw は対話型のPluginインストールプロンプトを開かずに、そのチャンネルの既定のインストールソースを使用します。

フラグなしで `openclaw channels add` を実行すると、対話型ウィザードが次を尋ねることがあります。

- 選択したチャンネルごとのアカウント ID
- それらのアカウントの任意の表示名
- `Bind configured channel accounts to agents now?`

今すぐバインドすることを確定すると、ウィザードは設定済みの各チャンネルアカウントをどのエージェントが所有するかを尋ね、アカウントスコープのルーティングバインディングを書き込みます。

同じルーティングルールは、後から `openclaw agents bindings`、`openclaw agents bind`、`openclaw agents unbind` でも管理できます ([agents](/ja-JP/cli/agents) を参照)。

単一アカウントのトップレベル設定をまだ使用しているチャンネルに非既定アカウントを追加すると、OpenClaw は新しいアカウントを書き込む前に、アカウントスコープのトップレベル値をそのチャンネルのアカウントマップに昇格します。ほとんどのチャンネルでは、それらの値は `channels.<channel>.accounts.default` に配置されますが、バンドル済みチャンネルでは、既存の一致する昇格済みアカウントを保持できる場合があります。Matrix が現在の例です。名前付きアカウントが 1 つすでに存在する場合、または `defaultAccount` が既存の名前付きアカウントを指している場合、昇格は新しい `accounts.default` を作成せず、そのアカウントを保持します。

ルーティング動作は一貫したままです。

- 既存のチャンネルのみのバインディング (`accountId` なし) は、既定アカウントに引き続き一致します。
- `channels add` は、非対話モードではバインディングを自動作成または書き換えません。
- 対話型セットアップでは、任意でアカウントスコープのバインディングを追加できます。

設定がすでに混在状態 (名前付きアカウントが存在し、トップレベルの単一アカウント値もまだ設定されている状態) にある場合は、`openclaw doctor --fix` を実行して、アカウントスコープの値をそのチャンネル向けに選ばれた昇格済みアカウントへ移動してください。ほとんどのチャンネルは `accounts.default` に昇格します。Matrix は、代わりに既存の名前付き/既定ターゲットを保持できます。

## ログインとログアウト (対話型)

```bash
openclaw channels login --channel whatsapp
openclaw channels logout --channel whatsapp
```

- `channels login` は `--verbose` をサポートします。
- `channels login` と `logout` は、サポートされているログイン対象が 1 つだけ設定されている場合、チャンネルを推論できます。
- `channels logout` は、到達可能な場合はライブ Gateway パスを優先するため、チャンネル認証状態をクリアする前にアクティブなリスナーを停止します。ローカル Gateway に到達できない場合は、ローカル認証クリーンアップにフォールバックします。
- `channels login` は Gateway ホスト上のターミナルから実行してください。エージェントの `exec` はこの対話型ログインフローをブロックします。利用可能な場合は、`whatsapp_login` などのチャンネルネイティブなエージェントログインツールをチャットから使用してください。

## トラブルシューティング

- 広範なプローブには `openclaw status --deep` を実行します。
- ガイド付き修正には `openclaw doctor` を使用します。
- `openclaw channels list` は、モデルプロバイダーの使用量/クォータのスナップショットを表示しなくなりました。それらには、`openclaw status` (概要) または `openclaw models list` (プロバイダーごと) を使用してください。
- Gateway に到達できない場合、`openclaw channels status` は設定のみの要約にフォールバックします。サポートされているチャンネル認証情報が SecretRef 経由で設定されているものの、現在のコマンドパスで利用できない場合、そのアカウントは未設定として表示されるのではなく、劣化状態の注記付きで設定済みとして報告されます。

## 機能プローブ

プロバイダーの機能ヒント (利用可能な場合はインテント/スコープ) と静的な機能サポートを取得します。

```bash
openclaw channels capabilities
openclaw channels capabilities --channel discord --target channel:123
```

注記:

- `--channel` は任意です。すべてのチャンネル (拡張機能を含む) を一覧表示するには省略します。
- `--account` は `--channel` と併用する場合のみ有効です。
- `--target` は `channel:<id>` または生の数値チャンネル ID を受け取り、Discord にのみ適用されます。Discord 音声チャンネルでは、権限チェックが不足している `ViewChannel`、`Connect`、`Speak`、`SendMessages`、`ReadMessageHistory` をフラグします。
- プローブはプロバイダー固有です。Discord インテント + 任意のチャンネル権限、Slack ボット + ユーザースコープ、Telegram ボットフラグ + Webhook、Signal デーモンバージョン、Microsoft Teams アプリトークン + Graph ロール/スコープ (判明している場合は注記付き)。プローブがないチャンネルは `Probe: unavailable` を報告します。

## 名前を ID に解決する

プロバイダーディレクトリを使用して、チャンネル名/ユーザー名を ID に解決します。

```bash
openclaw channels resolve --channel slack "#general" "@jane"
openclaw channels resolve --channel discord "My Server/#support" "@someone"
openclaw channels resolve --channel matrix "Project Room"
```

注記:

- ターゲット種別を強制するには `--kind user|group|auto` を使用します。
- 複数のエントリが同じ名前を共有している場合、解決はアクティブな一致を優先します。
- `channels resolve` は読み取り専用です。選択したアカウントが SecretRef 経由で設定されているものの、その認証情報が現在のコマンドパスで利用できない場合、コマンドは実行全体を中止せず、注記付きの劣化状態の未解決結果を返します。
- `channels resolve` はチャンネルPluginをインストールしません。インストール可能なカタログチャンネルの名前を解決する前に、`channels add --channel <name>` を使用してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [チャンネル概要](/ja-JP/channels)
