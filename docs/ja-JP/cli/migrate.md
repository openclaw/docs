---
read_when:
    - Hermes または別のエージェントシステムから OpenClaw に移行したい場合
    - Plugin 所有の移行プロバイダーを追加しています
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-05-06T04:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。バンドルされたプロバイダーは Codex CLI の状態、[Claude](/ja-JP/install/migrating-claude)、[Hermes](/ja-JP/install/migrating-hermes) に対応しています。サードパーティ Plugin は追加のプロバイダーを登録できます。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) と [Hermes からの移行](/ja-JP/install/migrating-hermes) を参照してください。[移行ハブ](/ja-JP/install/migrating) にはすべての経路が一覧表示されています。
</Tip>

## コマンド

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  登録済みの移行プロバイダー名。たとえば `hermes` です。インストール済みのプロバイダーを確認するには `openclaw migrate list` を実行します。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  プランを作成し、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  ソース状態ディレクトリを上書きします。Hermes のデフォルトは `~/.hermes` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  サポートされている認証情報をインポートします。デフォルトではオフです。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  プランが競合を報告したときに、適用処理が既存のターゲットを置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  スキル名または項目 ID で 1 つのスキルコピー項目を選択します。複数のスキルを移行するには、このフラグを繰り返します。省略した場合、対話型の Codex 移行ではチェックボックスセレクターが表示され、非対話型の移行では計画済みのすべてのスキルが保持されます。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  適用前のバックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  バックアップのスキップを通常なら拒否する適用処理で、`--no-backup` と併用する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  プランまたは適用結果を JSON として出力します。`--json` を指定し、`--yes` を指定しない場合、適用処理はプランを出力し、状態は変更しません。
</ParamField>

## 安全モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="Preview before apply">
    プロバイダーは、何かが変更される前に項目別のプランを返します。これには競合、スキップされた項目、機密性の高い項目が含まれます。JSON プラン、適用出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットらしく見えるネストされたキーがマスクされます。

    `openclaw migrate apply <provider>` はプランをプレビューし、`--yes` が設定されていない限り、状態を変更する前に確認を求めます。非対話モードでは、適用処理に `--yes` が必要です。

  </Accordion>
  <Accordion title="Backups">
    適用処理は、移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行を続行できます。状態が存在するときにバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="Conflicts">
    プランに競合がある場合、適用処理は続行を拒否します。プランを確認し、既存のターゲットを置き換えることが意図した操作であれば `--overwrite` を指定して再実行します。プロバイダーは、上書きされたファイルについて移行レポートディレクトリに項目単位のバックアップを書き込む場合があります。
  </Accordion>
  <Accordion title="Secrets">
    シークレットはデフォルトではインポートされません。サポートされている認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドルされた Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートするもの

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペースに取り込みます。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記します。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義を取り込みます。
- `SKILL.md` を含む Claude スキルディレクトリ。
- Claude コマンドの Markdown ファイルを、手動呼び出し専用の OpenClaw スキルに変換します。

### アーカイブと手動レビュー状態

Claude のフック、権限、環境デフォルト、ローカルメモリ、パススコープのルール、サブエージェント、キャッシュ、プラン、プロジェクト履歴は、移行レポートに保存されるか、手動レビュー項目として報告されます。OpenClaw はフックを実行せず、広範な許可リストをコピーせず、OAuth/Desktop 認証情報の状態を自動的にインポートしません。

## Codex プロバイダー

バンドルされた Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI の状態を検出します。また、その環境変数が設定されている場合は `CODEX_HOME` を使用します。特定の Codex ホームをインベントリするには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI アセットを意図的に昇格したい場合に、このプロバイダーを使用します。ローカルの Codex アプリサーバー起動では、エージェントごとの `CODEX_HOME` と `HOME` ディレクトリが使用されるため、デフォルトでは個人用 Codex CLI 状態は読み取られません。

対話型ターミナルで `openclaw migrate codex` を実行すると、完全なプランがプレビューされ、その後、最終的な適用確認の前にスキルコピー項目用のチェックボックスセレクターが開きます。一括選択には `Toggle all on` または `Toggle all off` を使用します。計画済みスキルはチェック済みで開始し、競合しているスキルは未チェックで開始し、`Skip for now` は適用せずにスキルを変更しないままにします。スクリプト化された実行や厳密な実行では、スキルごとに `--skill <name>` を 1 回渡します。例:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex がインポートするもの

- `$CODEX_HOME/skills` 配下の Codex CLI スキルディレクトリ。ただし Codex の `.system` キャッシュは除外されます。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとの所有にしたい場合、現在の OpenClaw エージェントワークスペースにコピーされます。

### 手動レビューの Codex 状態

Codex ネイティブ Plugin、`config.toml`、ネイティブの `hooks/hooks.json` は自動的には有効化されません。Plugin は MCP サーバー、アプリ、フック、その他の実行可能な動作を公開する場合があるため、プロバイダーはそれらを OpenClaw に読み込む代わりにレビュー対象として報告します。設定ファイルとフックファイルは、手動レビュー用に移行レポートへコピーされます。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは、デフォルトで `~/.hermes` にある状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` からのデフォルトモデル設定。
- `providers` と `custom_providers` からの設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースに取り込みます。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースのメモリファイルに追記します。
- OpenClaw ファイルメモリ用のメモリ設定デフォルト、および Honcho などの外部メモリプロバイダー向けのアーカイブ項目または手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からのスキルごとの設定値。
- `.env` からのサポート対象 API キー。ただし `--include-secrets` を指定した場合のみ。

### サポート対象の `.env` キー

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### アーカイブ専用状態

OpenClaw が安全に解釈できない Hermes の状態は、手動レビュー用に移行レポートへコピーされますが、ライブの OpenClaw 設定や認証情報には読み込まれません。これにより、OpenClaw が自動的に実行または信頼できると見なすことなく、不透明または安全でない状態を保持できます。

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

## Plugin 契約

移行ソースは Plugin です。Plugin は `openclaw.plugin.json` でプロバイダー ID を宣言します。

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

実行時に Plugin は `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。コアは CLI のオーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前確認を所有します。コアはレビュー済みのプランを `apply(ctx, plan)` に渡します。プロバイダーは互換性のため、その引数が存在しない場合にのみプランを再構築できます。

プロバイダー Plugin は、項目の構築とサマリー件数に `openclaw/plugin-sdk/migration` を使用でき、競合を考慮したファイルコピー、アーカイブ専用のレポートコピー、キャッシュ済み config-runtime ラッパー、移行レポートには `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング統合

オンボーディングでは、プロバイダーが既知のソースを検出したときに移行を提示できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じ Plugin 移行プロバイダーを使用し、適用前には引き続きプレビューを表示します。

<Note>
オンボーディングのインポートには、新規の OpenClaw セットアップが必要です。すでにローカル状態がある場合は、まず設定、認証情報、セッション、ワークスペースをリセットしてください。既存セットアップ向けのバックアップ付き上書きまたはマージインポートは、機能ゲートされています。
</Note>

## 関連

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向け手順。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向け手順。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンへ移動します。
- [Doctor](/ja-JP/gateway/doctor): 移行適用後のヘルスチェック。
- [Plugins](/ja-JP/tools/plugin): Plugin のインストールと登録。
