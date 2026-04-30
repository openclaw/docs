---
read_when:
    - Hermes など別のエージェントシステムから OpenClaw へ移行したい場合
    - Plugin 所有のマイグレーションプロバイダーを追加する場合
summary: '`openclaw migrate` のCLIリファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-04-30T20:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。バンドルされたプロバイダーは Codex CLI の状態、[Claude](/ja-JP/install/migrating-claude)、[Hermes](/ja-JP/install/migrating-hermes) を扱います。サードパーティ Plugin は追加プロバイダーを登録できます。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) と [Hermes からの移行](/ja-JP/install/migrating-hermes) を参照してください。[移行ハブ](/ja-JP/install/migrating) にはすべてのパスが一覧表示されています。
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
  登録済み移行プロバイダーの名前。例: `hermes`。インストール済みプロバイダーを確認するには `openclaw migrate list` を実行します。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  計画を作成して、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  ソース状態ディレクトリを上書きします。Hermes のデフォルトは `~/.hermes` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  対応している認証情報をインポートします。デフォルトではオフです。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  計画が競合を報告した場合に、apply が既存のターゲットを置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  スキル名またはアイテム ID で、コピー対象のスキル項目を 1 つ選択します。複数のスキルを移行するには、このフラグを繰り返します。省略した場合、対話型 Codex 移行ではチェックボックス選択が表示され、非対話型移行では計画されたすべてのスキルが保持されます。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  apply 前のバックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  apply が通常ならバックアップのスキップを拒否する場合に、`--no-backup` とあわせて必要です。
</ParamField>
<ParamField path="--json" type="boolean">
  計画または apply 結果を JSON として出力します。`--json` を指定し、`--yes` を指定しない場合、apply は計画を出力し、状態を変更しません。
</ParamField>

## 安全モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="apply 前のプレビュー">
    プロバイダーは、何かが変更される前に、競合、スキップされた項目、機密項目を含む項目別の計画を返します。JSON 計画、apply 出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットらしいネストされたキーが伏せられます。

    `openclaw migrate apply <provider>` は、`--yes` が設定されていない限り、状態を変更する前に計画をプレビューして確認を求めます。非対話モードでは、apply に `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    apply は、移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行を続行できます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="競合">
    計画に競合がある場合、apply は続行を拒否します。計画を確認し、既存のターゲットを置き換える意図がある場合は `--overwrite` を付けて再実行します。プロバイダーは、上書きされたファイルについて、移行レポートディレクトリに項目単位のバックアップを書き込む場合があります。
  </Accordion>
  <Accordion title="シークレット">
    シークレットはデフォルトではインポートされません。対応している認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドルされた Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには、`--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートする内容

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペースへ。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義。
- `SKILL.md` を含む Claude スキルディレクトリ。
- Claude コマンド Markdown ファイルを、手動呼び出し専用の OpenClaw スキルに変換。

### アーカイブおよび手動レビュー状態

Claude のフック、権限、環境デフォルト、ローカルメモリ、パススコープのルール、サブエージェント、キャッシュ、計画、プロジェクト履歴は、移行レポートに保持されるか、手動レビュー項目として報告されます。OpenClaw は、フックの実行、広範な許可リストのコピー、OAuth/Desktop 認証情報状態の自動インポートを行いません。

## Codex プロバイダー

バンドルされた Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI の状態を検出します。または、その環境変数が設定されている場合は `CODEX_HOME` にある状態を検出します。特定の Codex ホームをインベントリするには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI アセットを意図的に昇格したい場合に、このプロバイダーを使用します。ローカルの Codex アプリサーバー起動では、エージェントごとの `CODEX_HOME` と `HOME` ディレクトリを使用するため、デフォルトでは個人用 Codex CLI 状態を読み取りません。

対話型ターミナルで `openclaw migrate codex` を実行すると、完全な計画をプレビューしたあと、最終的な apply 確認の前に、スキルコピー項目用のチェックボックス選択が開きます。すべてのスキルは選択済みで開始します。このエージェントへコピーしたくないスキルのチェックを外してください。スクリプト実行または厳密な実行では、スキルごとに `--skill <name>` を 1 回渡します。例:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### Codex がインポートする内容

- `$CODEX_HOME/skills` 配下の Codex CLI スキルディレクトリ。ただし Codex の `.system` キャッシュは除外します。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとの所有にしたい場合、現在の OpenClaw エージェントワークスペースへコピーされます。

### 手動レビュー対象の Codex 状態

Codex ネイティブ Plugin、`config.toml`、ネイティブ `hooks/hooks.json` は自動的には有効化されません。Plugin は MCP サーバー、アプリ、フック、その他の実行可能な動作を公開する場合があるため、プロバイダーはそれらを OpenClaw に読み込むのではなく、レビュー対象として報告します。設定ファイルとフックファイルは、手動レビューのために移行レポートへコピーされます。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは、デフォルトで `~/.hermes` にある状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートする内容

- `config.yaml` からのデフォルトモデル設定。
- `providers` と `custom_providers` からの設定済みモデルプロバイダーおよびカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースのメモリファイルへ追記。
- OpenClaw ファイルメモリ用のメモリ設定デフォルト、および Honcho などの外部メモリプロバイダー用のアーカイブ項目または手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からのスキルごとの設定値。
- `.env` からの対応 API キー。`--include-secrets` を指定した場合のみ。

### 対応している `.env` キー

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### アーカイブのみの状態

OpenClaw が安全に解釈できない Hermes 状態は、手動レビューのために移行レポートへコピーされますが、稼働中の OpenClaw 設定や認証情報には読み込まれません。これにより、OpenClaw が自動的に実行または信頼できると見せかけることなく、不透明または安全でない状態を保持できます。

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

実行時に Plugin は `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。コアは CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前確認を所有します。コアはレビュー済み計画を `apply(ctx, plan)` に渡し、互換性のためにその引数がない場合のみ、プロバイダーは計画を再構築できます。

プロバイダー Plugin は、項目構築とサマリー数に `openclaw/plugin-sdk/migration` を使用でき、競合を考慮したファイルコピー、アーカイブ専用レポートコピー、キャッシュされた config-runtime ラッパー、移行レポートに `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング連携

プロバイダーが既知のソースを検出した場合、オンボーディングは移行を提案できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じ Plugin 移行プロバイダーを使用し、適用前には引き続きプレビューを表示します。

<Note>
オンボーディングインポートには、新規の OpenClaw セットアップが必要です。ローカル状態がすでにある場合は、先に設定、認証情報、セッション、ワークスペースをリセットしてください。既存セットアップ向けのバックアップ付き上書きまたはマージインポートは、機能ゲートされています。
</Note>

## 関連項目

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向けの手順。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向けの手順。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンへ移動する。
- [Doctor](/ja-JP/gateway/doctor): 移行を適用した後のヘルスチェック。
- [Plugins](/ja-JP/tools/plugin): Plugin のインストールと登録。
