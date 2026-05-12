---
read_when:
    - Hermesまたは別のエージェントシステムからOpenClawへ移行したい
    - Plugin が所有する移行プロバイダーを追加している
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-05-12T00:58:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

別のエージェントシステムから、Plugin が所有する移行プロバイダーを通じて状態をインポートします。バンドル済みプロバイダーは Codex CLI の状態、[Claude](/ja-JP/install/migrating-claude)、[Hermes](/ja-JP/install/migrating-hermes) に対応しています。サードパーティ Plugin は追加のプロバイダーを登録できます。

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
  プランを作成し、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  ソース状態ディレクトリを上書きします。Hermes のデフォルトは `~/.hermes` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  対応している認証情報をインポートします。デフォルトではオフです。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  プランで競合が報告された場合に、apply が既存ターゲットを置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  スキル名または項目 ID で、コピーする Skills 項目を 1 つ選択します。複数の Skills を移行するには、このフラグを繰り返します。省略した場合、対話型 Codex 移行ではチェックボックスセレクターが表示され、非対話型移行では計画されたすべての Skills が保持されます。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 名または項目 ID で、インストールする Codex plugin 項目を 1 つ選択します。複数の Codex plugins を移行するには、このフラグを繰り返します。省略した場合、対話型 Codex 移行ではネイティブ Codex plugin のチェックボックスセレクターが表示され、非対話型移行では計画されたすべての plugins が保持されます。これは、Codex app-server インベントリで検出された、ソースにインストール済みの `openai-curated` Codex plugins にのみ適用されます。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  適用前バックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  バックアップのスキップを apply が通常は拒否する場合、`--no-backup` と併用する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  プランまたは適用結果を JSON として出力します。`--json` があり `--yes` がない場合、apply はプランを出力し、状態を変更しません。
</ParamField>

## 安全モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="適用前のプレビュー">
    何かが変更される前に、プロバイダーは項目別のプランを返します。これには競合、スキップされた項目、機密項目が含まれます。JSON プラン、適用出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットに見えるネストされたキーが秘匿されます。

    `openclaw migrate apply <provider>` はプランをプレビューし、`--yes` が設定されていない限り、状態を変更する前にプロンプトを表示します。非対話モードでは、apply に `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    Apply は移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行は続行できます。状態が存在するときにバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="競合">
    プランに競合がある場合、apply は続行を拒否します。プランを確認し、既存ターゲットを置き換える意図がある場合は `--overwrite` を付けて再実行します。プロバイダーは、上書きされたファイルの項目レベルのバックアップを移行レポートディレクトリに書き込む場合があります。
  </Accordion>
  <Accordion title="シークレット">
    シークレットはデフォルトでは決してインポートされません。対応している認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドル済み Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code 状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートするもの

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペースへ。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義。
- `SKILL.md` を含む Claude Skills ディレクトリ。
- Claude コマンド Markdown ファイルを、手動呼び出し専用の OpenClaw Skills に変換。

### アーカイブおよび手動レビュー状態

Claude の hooks、権限、環境デフォルト、ローカルメモリ、パススコープのルール、サブエージェント、キャッシュ、プラン、プロジェクト履歴は、移行レポートに保持されるか、手動レビュー項目として報告されます。OpenClaw は hooks の実行、広範な許可リストのコピー、OAuth/Desktop 認証情報状態の自動インポートを行いません。

## Codex プロバイダー

バンドル済み Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI 状態を検出します。または、その環境変数が設定されている場合は `CODEX_HOME` にある状態を検出します。特定の Codex ホームをインベントリ化するには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI アセットを意図的に昇格したい場合に、このプロバイダーを使用します。ローカル Codex app-server の起動では、エージェントごとの `CODEX_HOME` と `HOME` ディレクトリを使用するため、デフォルトでは個人用 Codex CLI 状態を読み取りません。

対話型ターミナルで `openclaw migrate codex` を実行すると、完全なプランをプレビューし、その後、最終的な適用確認の前にチェックボックスセレクターを開きます。Skills のコピー項目が最初に確認されます。一括選択には `Toggle all on` または `Toggle all off` を使用します。計画された Skills はチェック済みで開始し、競合している Skills は未チェックで開始し、`Skip for now` はこの実行での Skills コピーをスキップしつつ、Plugin 選択へ進みます。ソースにインストール済みのキュレーション済み Codex plugins が移行可能で、`--plugin` が指定されていない場合、移行は次に plugin 名によるネイティブ Codex plugin のアクティベーションを確認します。Plugin 項目は、ターゲットの OpenClaw Codex plugin 設定にその plugin がすでに存在する場合を除き、チェック済みで開始します。既存のターゲット plugins は未チェックで開始し、`conflict: plugin exists` のような競合ヒントを表示します。その実行でネイティブ Codex plugins を移行しない場合は `Toggle all off` を選択し、適用前に停止する場合は `Skip for now` を選択します。スクリプト実行または厳密な実行では、Skills ごとに `--skill <name>` を 1 回渡します。例:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

ネイティブ Codex plugin 移行を非対話的に、ソースにインストール済みの 1 つ以上のキュレーション済み plugins に限定するには `--plugin <name>` を使用します。

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex がインポートするもの

- `$CODEX_HOME/skills` 配下の Codex CLI Skills ディレクトリ。ただし Codex の `.system` キャッシュを除きます。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとの所有にしたい場合、現在の OpenClaw エージェントワークスペースにコピーされます。
- Codex app-server `plugin/list` を通じて検出された、ソースにインストール済みの `openai-curated` Codex plugins。Apply は、ターゲット app-server がその plugin をすでにインストール済みかつ有効として報告している場合でも、選択された各 plugin に対して app-server `plugin/install` を呼び出します。移行された Codex plugins は、ネイティブ Codex ハーネスを選択するセッションでのみ使用できます。Pi、通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他のハーネスには公開されません。

### 手動レビュー対象の Codex 状態

Codex `config.toml`、ネイティブ `hooks/hooks.json`、キュレーション対象外のマーケットプレイス、ソースにインストール済みのキュレーション済み plugins ではないキャッシュ済み plugin バンドルは、自動的には有効化されません。これらは手動レビュー用に移行レポートへコピーまたは報告されます。

移行された、ソースにインストール済みのキュレーション済み plugins について、apply は次を書き込みます。

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 選択された各 plugin について、`marketplaceName: "openai-curated"` と `pluginName` を持つ明示的な plugin エントリを 1 つ

移行は `plugins["*"]` を決して書き込まず、ローカルマーケットプレイスのキャッシュパスも保存しません。認証が必要なインストールは、影響を受ける plugin 項目で `status: "skipped"`、`reason: "auth_required"`、サニタイズ済みアプリ識別子とともに報告されます。それらの明示的な設定エントリは、再認可して有効化するまで無効として書き込まれます。その他のインストール失敗は、項目スコープの `error` 結果になります。

計画中に Codex app-server plugin インベントリを利用できない場合、移行全体を失敗させる代わりに、キャッシュ済みバンドルの助言項目へフォールバックします。

## Hermes プロバイダー

バンドル済み Hermes プロバイダーは、デフォルトで `~/.hermes` にある状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` からのデフォルトモデル設定。
- `providers` と `custom_providers` からの、設定済みモデルプロバイダーおよびカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースメモリファイルに追記。
- OpenClaw ファイルメモリ向けのメモリ設定デフォルト、および Honcho などの外部メモリプロバイダー向けのアーカイブまたは手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からの Skills ごとの設定値。
- `.env` からの対応 API キー。`--include-secrets` がある場合のみ。

### 対応している `.env` キー

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### アーカイブ専用状態

OpenClaw が安全に解釈できない Hermes 状態は、手動レビュー用に移行レポートへコピーされますが、ライブ OpenClaw 設定や認証情報には読み込まれません。これにより、OpenClaw が自動的に実行または信頼できるかのように扱うことなく、不透明または安全でない状態を保持できます。

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

移行ソースは plugins です。Plugin は `openclaw.plugin.json` でプロバイダー ID を宣言します。

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

実行時に Plugin は `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。Core は CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前確認を所有します。Core はレビュー済みプランを `apply(ctx, plan)` に渡します。プロバイダーは互換性のため、その引数がない場合にのみプランを再構築できます。

Provider plugins は、項目の構築とサマリー数に `openclaw/plugin-sdk/migration` を使用できます。また、競合を考慮したファイルコピー、アーカイブ専用レポートコピー、キャッシュ済み config-runtime ラッパー、移行レポートには `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング連携

プロバイダーが既知のソースを検出した場合、オンボーディングは移行を提示できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じ Plugin 移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングのインポートには、新しい OpenClaw セットアップが必要です。すでにローカル状態がある場合は、まず config、credentials、sessions、workspace をリセットしてください。既存のセットアップに対するバックアップ後の上書きまたはマージインポートは、機能ゲートされています。
</Note>

## 関連

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向けの手順。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向けの手順。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンに移動します。
- [診断](/ja-JP/gateway/doctor): 移行を適用した後のヘルスチェック。
- [Plugin](/ja-JP/tools/plugin): plugin のインストールと登録。
