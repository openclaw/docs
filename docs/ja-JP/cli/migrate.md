---
read_when:
    - Hermes や別のエージェントシステムから OpenClaw に移行したい
    - Plugin 所有の移行プロバイダーを追加する
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-05-12T23:30:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。同梱プロバイダーは Codex CLI の状態、[Claude](/ja-JP/install/migrating-claude)、[Hermes](/ja-JP/install/migrating-hermes) に対応しています。サードパーティ Plugin は追加のプロバイダーを登録できます。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) と [Hermes からの移行](/ja-JP/install/migrating-hermes) を参照してください。[移行ハブ](/ja-JP/install/migrating) にはすべてのパスが一覧表示されています。
</Tip>

## コマンド

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  登録済み移行プロバイダーの名前です。例: `hermes`。インストール済みプロバイダーを確認するには `openclaw migrate list` を実行します。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  計画を作成し、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  ソース状態ディレクトリを上書き指定します。Hermes のデフォルトは `~/.hermes` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  対応している認証情報をインポートします。デフォルトではオフです。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  計画が競合を報告した場合に、適用時に既存のターゲットを置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  skill 名または項目 ID で skill コピー項目を 1 つ選択します。複数の skills を移行するには、このフラグを繰り返します。省略した場合、対話型 Codex 移行ではチェックボックスセレクターが表示され、非対話型移行では計画されたすべての skills が保持されます。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 名または項目 ID で Codex Plugin インストール項目を 1 つ選択します。複数の Codex Plugin を移行するには、このフラグを繰り返します。省略した場合、対話型 Codex 移行ではネイティブ Codex Plugin のチェックボックスセレクターが表示され、非対話型移行では計画されたすべての Plugin が保持されます。これは Codex アプリサーバーインベントリによって検出された、ソースにインストール済みの `openai-curated` Codex Plugin にのみ適用されます。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex のみ。ネイティブ Plugin の有効化を計画する前に、ソース Codex アプリサーバーの `app/list` トラバーサルを新しく強制します。移行計画を高速に保つため、デフォルトではオフです。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  適用前バックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  適用時にバックアップのスキップが通常なら拒否される場合、`--no-backup` と併用する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  計画または適用結果を JSON として出力します。`--json` を指定し、`--yes` を指定しない場合、apply は計画を出力し、状態を変更しません。
</ParamField>

## 安全性モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="Preview before apply">
    プロバイダーは、何かが変更される前に項目別の計画を返します。これには競合、スキップされた項目、機密項目が含まれます。JSON 計画、適用出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットのように見えるネストされたキーが伏せられます。

    `openclaw migrate apply <provider>` は計画をプレビューし、`--yes` が設定されていない限り、状態を変更する前に確認を求めます。非対話モードでは、apply に `--yes` が必要です。

  </Accordion>
  <Accordion title="Backups">
    apply は移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行を続行できます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="Conflicts">
    計画に競合がある場合、apply は続行を拒否します。計画を確認し、既存ターゲットの置き換えが意図したものなら `--overwrite` を付けて再実行します。プロバイダーは、上書きされたファイルの項目レベルバックアップを移行レポートディレクトリに書き込む場合があります。
  </Accordion>
  <Accordion title="Secrets">
    シークレットはデフォルトでは決してインポートされません。対応している認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

同梱の Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートするもの

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペースへ。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` からの MCP サーバー定義。
- `SKILL.md` を含む Claude skill ディレクトリ。
- Claude コマンド Markdown ファイルを、手動呼び出し専用の OpenClaw skills に変換。

### アーカイブと手動レビュー状態

Claude のフック、権限、環境デフォルト、ローカルメモリ、パススコープ付きルール、サブエージェント、キャッシュ、計画、プロジェクト履歴は、移行レポートに保持されるか、手動レビュー項目として報告されます。OpenClaw はフックを実行せず、広範な許可リストをコピーせず、OAuth/Desktop の認証情報状態を自動的にはインポートしません。

## Codex プロバイダー

同梱の Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI の状態を検出します。また、その環境変数が設定されている場合は `CODEX_HOME` にある状態を検出します。特定の Codex ホームをインベントリ化するには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI 資産を意図的に昇格させたい場合に、このプロバイダーを使用します。ローカル Codex アプリサーバーの起動は、エージェントごとの `CODEX_HOME` および `HOME` ディレクトリを使用するため、デフォルトでは個人用 Codex CLI 状態を読み取りません。

対話型端末で `openclaw migrate codex` を実行すると、完全な計画をプレビューし、最終的な適用確認の前にチェックボックスセレクターを開きます。skill コピー項目が最初にプロンプトされます。一括選択には `Toggle all on` または `Toggle all off` を使用します。Space キーで行を切り替えるか、Enter キーでハイライトされた行を有効化して続行します。計画された skills はチェック済みで開始し、競合する skills は未チェックで開始します。`Skip for now` は、この実行の skill コピーをスキップしつつ、Plugin 選択へ進みます。ソースにインストール済みのキュレーション済み Codex Plugin が移行可能で、`--plugin` が指定されていない場合、移行は次に Plugin 名でネイティブ Codex Plugin の有効化を求めます。Plugin 項目は、ターゲット OpenClaw Codex Plugin 設定にその Plugin がすでに存在しない限り、チェック済みで開始します。既存のターゲット Plugin は未チェックで開始し、`conflict: plugin exists` のような競合ヒントを表示します。その実行でネイティブ Codex Plugin を移行しない場合は `Toggle all off` を選択し、適用前に停止する場合は `Skip for now` を選択します。スクリプト化された実行や厳密な実行では、skill ごとに `--skill <name>` を 1 回渡します。例:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

ネイティブ Codex Plugin 移行を、非対話で 1 つ以上のソースにインストール済みキュレーション済み Plugin に限定するには、`--plugin <name>` を使用します。

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex がインポートするもの

- `$CODEX_HOME/skills` 配下の Codex CLI skill ディレクトリ。ただし Codex の `.system` キャッシュは除きます。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとの所有にしたい場合、現在の OpenClaw エージェントワークスペースへコピーされます。
- Codex アプリサーバーの `plugin/list` を通じて検出された、ソースにインストール済みの `openai-curated` Codex Plugin。計画では、有効化されインストール済みの各 Plugin に対して `plugin/read` を読み取ります。アプリ連携 Plugin では、ソース Codex アプリサーバーのアカウント応答が ChatGPT サブスクリプションアカウントである必要があります。ChatGPT 以外、またはアカウント応答が欠落している場合は `codex_subscription_required` でスキップされます。デフォルトでは、移行はソース `app/list` を呼び出しません。そのため、アカウントゲートを通過したアプリ連携 Plugin は、ソースアプリのアクセシビリティ検証なしで計画され、アカウント検索のトランスポート失敗は `codex_account_unavailable` でスキップされます。移行で新しいソース `app/list` スナップショットを強制し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを要求したい場合は、`--verify-plugin-apps` を渡します。このモードでは、アカウント検索のトランスポート失敗はソースアプリインベントリ検証へフォールスルーします。ソースアプリインベントリのスナップショットは現在のプロセスのメモリに保持され、移行出力やターゲット設定には書き込まれません。無効化された Plugin、読み取り不能な Plugin 詳細、サブスクリプションで制限されたソースアカウント、および検証が要求された場合の欠落アプリ、無効アプリ、アクセス不能アプリ、またはソースアプリインベントリ失敗は、ターゲット設定エントリではなく、型付き理由を持つ手動スキップ項目になります。
  apply は、選択された各対象 Plugin に対してアプリサーバーの `plugin/install` を呼び出します。ターゲットアプリサーバーがその Plugin をすでにインストール済みかつ有効として報告している場合も同様です。移行された Codex Plugin は、ネイティブ Codex ハーネスを選択したセッションでのみ使用できます。Pi、通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他のハーネスには公開されません。

### 手動レビュー対象の Codex 状態

Codex の `config.toml`、ネイティブ `hooks/hooks.json`、キュレーション対象外のマーケットプレイス、ソースにインストール済みのキュレーション済み Plugin ではないキャッシュ済み Plugin バンドル、およびソースサブスクリプションゲートを通過できないソースにインストール済み Plugin は、自動的には有効化されません。`--verify-plugin-apps` が設定されている場合、ソースアプリインベントリゲートを通過できない Plugin もスキップされます。これらは手動レビュー用に移行レポートへコピーまたは報告されます。

移行された、ソースにインストール済みのキュレーション済み Plugin について、apply は次を書き込みます。

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 選択された各 Plugin について、`marketplaceName: "openai-curated"` と `pluginName` を持つ明示的な Plugin エントリを 1 つ

移行は `plugins["*"]` を決して書き込まず、ローカルマーケットプレイスキャッシュパスも保存しません。ソース側のサブスクリプション失敗は、`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled`、`plugin_read_unavailable` などの型付き理由とともに手動項目で報告されます。`--verify-plugin-apps` を指定した場合、ソースアプリインベントリ失敗は `app_inaccessible`、`app_disabled`、`app_missing`、`app_inventory_unavailable` としても表示されることがあります。スキップされた Plugin はターゲット設定に書き込まれません。
ターゲット側で認証が必要なインストールは、影響を受ける Plugin 項目に `status: "skipped"`、`reason: "auth_required"`、およびサニタイズされたアプリ識別子として報告されます。それらの明示的な設定エントリは、再認可して有効化するまで無効として書き込まれます。その他のインストール失敗は、項目スコープの `error` 結果です。

計画中に Codex アプリサーバーの Plugin インベントリを利用できない場合、移行全体を失敗させるのではなく、キャッシュ済みバンドルの助言項目へフォールバックします。

## Hermes プロバイダー

同梱の Hermes プロバイダーは、デフォルトで `~/.hermes` にある状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` からのデフォルトモデル構成。
- `providers` と `custom_providers` からの構成済みモデルプロバイダーとカスタム OpenAI互換エンドポイント。
- `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースのメモリファイルに追記。
- OpenClaw ファイルメモリ用のメモリ構成デフォルト、および Honcho などの外部メモリプロバイダー用のアーカイブ項目または手動レビュー項目。
- `skills/<name>/` の下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からの Skills ごとの構成値。
- `.env` からの対応 API キー。ただし `--include-secrets` 使用時のみ。

### 対応している `.env` キー

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### アーカイブのみの状態

OpenClaw が安全に解釈できない Hermes の状態は、手動レビュー用に移行レポートへコピーされますが、ライブの OpenClaw 構成や認証情報には読み込まれません。これにより、OpenClaw が自動的に実行または信頼できると見なすことなく、不透明または安全でない状態を保持します。

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### 適用後

```bash
openclaw doctor
```

## Plugin コントラクト

移行元は Plugin です。Plugin は `openclaw.plugin.json` でプロバイダー ID を宣言します。

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

実行時に Plugin は `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。コアは CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前チェックを所有します。コアはレビュー済みの計画を `apply(ctx, plan)` に渡し、プロバイダーは互換性のため、その引数がない場合にのみ計画を再構築できます。

プロバイダー Plugin は、項目の構築とサマリー件数に `openclaw/plugin-sdk/migration` を使用でき、競合を考慮したファイルコピー、アーカイブのみのレポートコピー、キャッシュされた config-runtime ラッパー、移行レポートには `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング連携

プロバイダーが既知の移行元を検出した場合、オンボーディングは移行を提示できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` は同じ Plugin 移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングでのインポートには、新規の OpenClaw セットアップが必要です。すでにローカル状態がある場合は、まず構成、認証情報、セッション、ワークスペースをリセットしてください。既存セットアップ向けのバックアップ付き上書きまたはマージインポートは、機能ゲートの対象です。
</Note>

## 関連

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向け手順。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向け手順。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンへ移動する。
- [Doctor](/ja-JP/gateway/doctor): 移行適用後のヘルスチェック。
- [Plugins](/ja-JP/tools/plugin): Plugin のインストールと登録。
