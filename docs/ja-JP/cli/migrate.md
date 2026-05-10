---
read_when:
    - Hermes または別のエージェントシステムから OpenClaw へ移行したい場合
    - Plugin 所有のマイグレーションプロバイダーを追加している
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-05-10T19:28:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。バンドルされたプロバイダーは Codex CLI の状態、[Claude](/ja-JP/install/migrating-claude)、[Hermes](/ja-JP/install/migrating-hermes) に対応しています。サードパーティ Plugin は追加のプロバイダーを登録できます。

<Tip>
ユーザー向けの手順は、[Claude から移行](/ja-JP/install/migrating-claude) と [Hermes から移行](/ja-JP/install/migrating-hermes) を参照してください。[移行ハブ](/ja-JP/install/migrating) にはすべての経路が一覧されています。
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
  登録済み移行プロバイダーの名前です。例: `hermes`。インストール済みプロバイダーを確認するには `openclaw migrate list` を実行してください。
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
  プランが競合を報告したときに、apply が既存のターゲットを置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  skill 名または項目 ID で、1 つの skill コピー項目を選択します。複数の Skills を移行するには、このフラグを繰り返します。省略した場合、対話型の Codex 移行ではチェックボックス選択が表示され、非対話型の移行では計画されたすべての Skills が保持されます。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 名または項目 ID で、1 つの Codex Plugin インストール項目を選択します。複数の Codex plugins を移行するには、このフラグを繰り返します。省略した場合、対話型の Codex 移行ではネイティブ Codex Plugin のチェックボックス選択が表示され、非対話型の移行では計画されたすべての plugins が保持されます。これは、Codex app-server インベントリによって検出された、ソースにインストール済みの `openai-curated` Codex plugins にのみ適用されます。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  apply 前のバックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  apply が通常ならバックアップのスキップを拒否する場合に、`--no-backup` と併用する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  プランまたは apply 結果を JSON として出力します。`--json` を指定し、`--yes` を指定しない場合、apply はプランを出力し、状態を変更しません。
</ParamField>

## 安全モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="apply 前のプレビュー">
    プロバイダーは、変更が行われる前に、競合、スキップされた項目、機密項目を含む項目別プランを返します。JSON プラン、apply 出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、secret に見えるネストされたキーが編集されます。

    `openclaw migrate apply <provider>` は、`--yes` が設定されていない限り、状態を変更する前にプランをプレビューして確認を求めます。非対話モードでは、apply に `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    apply は移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行を続行できます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="競合">
    プランに競合がある場合、apply は続行を拒否します。プランを確認し、既存ターゲットの置き換えが意図したものであれば `--overwrite` を付けて再実行してください。プロバイダーは、上書きされたファイルについて、移行レポートディレクトリに項目レベルのバックアップを書き込む場合があります。
  </Accordion>
  <Accordion title="Secrets">
    Secrets はデフォルトでは決してインポートされません。対応している認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドルされた Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude から移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートするもの

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペースに取り込みます。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記します。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義を取り込みます。
- `SKILL.md` を含む Claude skill ディレクトリ。
- Claude コマンド Markdown ファイルを、手動呼び出し専用の OpenClaw Skills に変換します。

### アーカイブおよび手動レビュー状態

Claude のフック、権限、環境デフォルト、ローカルメモリ、パススコープのルール、サブエージェント、キャッシュ、プラン、プロジェクト履歴は、移行レポートに保持されるか、手動レビュー項目として報告されます。OpenClaw は、フックを実行したり、広範な許可リストをコピーしたり、OAuth/Desktop 認証情報状態を自動的にインポートしたりしません。

## Codex プロバイダー

バンドルされた Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI の状態を検出します。また、その環境変数が設定されている場合は `CODEX_HOME` にある状態を検出します。特定の Codex ホームをインベントリ化するには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI 資産を意図的に昇格させたい場合は、このプロバイダーを使用してください。ローカルの Codex app-server 起動では、エージェントごとの `CODEX_HOME` と `HOME` ディレクトリが使用されるため、デフォルトでは個人用 Codex CLI 状態は読み取られません。

対話型ターミナルで `openclaw migrate codex` を実行すると、完全なプランがプレビューされ、その後、最終的な apply 確認の前にチェックボックス選択が開きます。skill コピー項目が最初にプロンプトされます。一括選択には `Toggle all on` または `Toggle all off` を使用します。計画済みの Skills はチェック済みで開始し、競合している Skills は未チェックで開始します。また、`Skip for now` は、この実行では skill コピーをスキップしつつ、Plugin 選択へ進みます。ソースにインストール済みの curated Codex plugins が移行可能で、`--plugin` が指定されていない場合、移行は続けて、Plugin 名によるネイティブ Codex Plugin の有効化を求めます。Plugin 項目は、ターゲットの OpenClaw Codex Plugin 設定にその Plugin がすでに存在しない限り、チェック済みで開始します。既存のターゲット plugins は未チェックで開始し、`conflict: plugin exists` のような競合ヒントを表示します。その実行でネイティブ Codex plugins を移行しない場合は `Toggle all off` を選択し、適用前に停止する場合は `Skip for now` を選択します。スクリプト化された実行または厳密な実行では、次のように skill ごとに `--skill <name>` を 1 回渡します。

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

ネイティブ Codex Plugin の移行を、ソースにインストール済みの 1 つ以上の curated plugins に非対話的に限定するには、`--plugin <name>` を使用します。

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex がインポートするもの

- Codex の `.system` キャッシュを除く、`$CODEX_HOME/skills` 配下の Codex CLI skill ディレクトリ。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとの所有権が必要な場合に、現在の OpenClaw エージェントワークスペースへコピーされます。
- Codex app-server `plugin/list` を通じて検出された、ソースにインストール済みの `openai-curated` Codex plugins。apply は、ターゲット app-server がその Plugin をインストール済みかつ有効化済みとすでに報告している場合でも、選択された各 Plugin について app-server `plugin/install` を呼び出します。移行された Codex plugins は、ネイティブ Codex ハーネスを選択するセッションでのみ使用できます。Pi、通常の OpenAI プロバイダー実行、ACP 会話バインディング、その他のハーネスには公開されません。

### 手動レビュー対象の Codex 状態

Codex `config.toml`、ネイティブ `hooks/hooks.json`、curated ではないマーケットプレイス、ソースにインストール済みの curated plugins ではないキャッシュ済み Plugin バンドルは、自動的には有効化されません。これらは手動レビュー用に移行レポートへコピーまたは報告されます。

移行された、ソースにインストール済みの curated plugins について、apply は次を書き込みます。

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- 選択された各 Plugin について、`marketplaceName: "openai-curated"` と `pluginName` を持つ明示的な Plugin エントリを 1 つ

移行は `plugins["*"]` を書き込むことはなく、ローカルマーケットプレイスキャッシュパスを保存することもありません。認証が必要なインストールは、影響を受ける Plugin 項目で `status: "skipped"`、`reason: "auth_required"`、サニタイズ済みアプリ識別子とともに報告されます。それらの明示的な設定エントリは、再認可して有効化するまで無効として書き込まれます。その他のインストール失敗は、項目スコープの `error` 結果になります。

計画中に Codex app-server Plugin インベントリを利用できない場合、移行全体を失敗させるのではなく、キャッシュ済みバンドルの助言項目にフォールバックします。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは、デフォルトで `~/.hermes` にある状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` からのデフォルトモデル設定。
- `providers` と `custom_providers` からの、設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ取り込みます。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースメモリファイルへ追記します。
- OpenClaw ファイルメモリ向けのメモリ設定デフォルト。加えて、Honcho などの外部メモリプロバイダー向けのアーカイブまたは手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からの skill ごとの設定値。
- `.env` からの対応 API キー。`--include-secrets` が指定された場合のみ。

### 対応する `.env` キー

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### アーカイブのみの状態

OpenClaw が安全に解釈できない Hermes 状態は、手動レビュー用に移行レポートへコピーされますが、ライブの OpenClaw 設定や認証情報には読み込まれません。これにより、OpenClaw が自動的に実行または信頼できるふりをすることなく、不透明または安全でない状態を保持できます。

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

実行時に Plugin は `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。Core は CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前確認を所有します。Core はレビュー済みプランを `apply(ctx, plan)` に渡し、プロバイダーは互換性のため、その引数がない場合にのみプランを再構築できます。

プロバイダー Plugin は、項目構築とサマリー件数に `openclaw/plugin-sdk/migration` を使用できます。また、競合を考慮したファイルコピー、アーカイブのみのレポートコピー、キャッシュ済み config-runtime ラッパー、移行レポートには `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング統合

プロバイダーが既知のソースを検出した場合、オンボーディングは移行を提供できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じ Plugin 移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングのインポートには、新規の OpenClaw セットアップが必要です。すでにローカル状態がある場合は、まず設定、認証情報、セッション、ワークスペースをリセットしてください。バックアップして上書きするインポートやマージインポートは、既存セットアップ向けには機能フラグで制御されています。
</Note>

## 関連

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向けの手順。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向けの手順。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンへ移動する。
- [Doctor](/ja-JP/gateway/doctor): 移行適用後の健全性チェック。
- [Plugins](/ja-JP/tools/plugin): plugin のインストールと登録。
