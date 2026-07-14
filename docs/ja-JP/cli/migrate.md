---
read_when:
    - Hermes または別のエージェントシステムから OpenClaw に移行する場合
    - Plugin 所有の移行プロバイダーを追加する場合
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行する
x-i18n:
    generated_at: "2026-07-14T13:35:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a4129b176ae2ca6b73eb9ddba618baccade9da19fe168db290b60e9a088b22fb
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。バンドルされたプロバイダーは Claude、Codex CLI、[Hermes](/ja-JP/install/migrating-hermes) に対応しており、Plugin は追加のプロバイダーを登録できます。

<Tip>
ユーザー向けの手順については、[Claude からの移行](/ja-JP/install/migrating-claude)および[Hermes からの移行](/ja-JP/install/migrating-hermes)を参照してください。[移行ハブ](/ja-JP/install/migrating)にはすべての移行パスが掲載されています。
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

ほかのフラグを指定せずに `openclaw migrate <provider>` を実行すると、計画とプレビューが行われ、（TTY では）適用前に確認を求められます。`openclaw migrate plan <provider>` と `openclaw migrate apply <provider>` は、同じフラグを使用してプレビューと適用を別々のサブコマンドに分けます。

<ParamField path="<provider>" type="string">
  登録済みの移行プロバイダー名（例: `hermes`）。インストール済みのプロバイダーを確認するには `openclaw migrate list` を実行します。
</ParamField>
<ParamField path="--dry-run" type="boolean">
  計画を作成し、状態を変更せずに終了します。
</ParamField>
<ParamField path="--from <path>" type="string">
  ソース状態ディレクトリを上書きします。Hermes は `$HERMES_HOME` とアクティブなプロファイルに従い、その後プラットフォームのデフォルト（`~/.hermes` または `%LOCALAPPDATA%\hermes`）を使用します。Codex のデフォルトは `~/.codex`（または `$CODEX_HOME`）、Claude のデフォルトは `~/.claude` です。
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  対応している認証情報を確認なしでインポートします。対話的な適用では、検出された認証用の認証情報をインポートする前に確認し、デフォルトで yes が選択されています。非対話型の `--yes` でインポートするには `--include-secrets` が必要です。
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  対話的な確認を含め、認証用の認証情報のインポートをスキップします。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  計画で競合が報告された場合に、適用による既存ターゲットの置き換えを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
</ParamField>
<ParamField path="--skill <name>" type="string">
  スキル名または項目 ID で、コピーするスキル項目を 1 つ選択します。複数のスキルを移行するには、このフラグを繰り返し指定します。省略した場合、対話型の Codex 移行ではチェックボックスの選択画面が表示され、非対話型の移行では計画されたすべてのスキルが維持されます。
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Plugin 名または項目 ID で、インストールする Codex Plugin 項目を 1 つ選択します。複数の Codex Plugin を移行するには、このフラグを繰り返し指定します。省略した場合、対話型の Codex 移行では Codex ネイティブ Plugin のチェックボックス選択画面が表示され、非対話型の移行では計画されたすべての Plugin が維持されます。Codex app-server のインベントリで検出された、ソースにインストール済みの `openai-curated` Codex Plugin にのみ適用されます。
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Codex 専用です。ネイティブ Plugin の有効化を計画する前に、ソース Codex app-server の `app/list` を新たに走査するよう強制します。移行計画を高速に保つため、デフォルトでは無効です。
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  移行前のバックアップアーカイブのパスまたはディレクトリです。`openclaw backup create` にそのまま渡されます。
</ParamField>
<ParamField path="--no-backup" type="boolean">
  適用前のバックアップをスキップします。ローカルの OpenClaw 状態が存在する場合は `--force` が必要です。
</ParamField>
<ParamField path="--force" type="boolean">
  適用時にバックアップのスキップが拒否される場合、`--no-backup` と併せて指定する必要があります。
</ParamField>
<ParamField path="--json" type="boolean">
  計画または適用結果を JSON として出力します。`--json` を指定し、`--yes` を指定しない場合、適用では計画を出力し、状態を変更しません。
</ParamField>

## 安全性モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="適用前のプレビュー">
    プロバイダーは、何かを変更する前に、競合、スキップされた項目、機密項目を含む項目別の計画を返します。JSON 計画、適用出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、ネストされたシークレットらしいキーがマスキングされます。

    `openclaw migrate apply <provider>` は計画をプレビューし、`--yes` が設定されていない限り、状態を変更する前に確認を求めます。非対話モードでは、適用に `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    適用では、移行を適用する前に OpenClaw のバックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行が続行されます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を指定します。
  </Accordion>
  <Accordion title="競合">
    計画に競合がある場合、適用は続行を拒否します。計画を確認し、既存ターゲットを意図的に置き換える場合は `--overwrite` を指定して再実行します。プロバイダーは、上書きされたファイルについて、移行レポートディレクトリに項目単位のバックアップを書き込むことがあります。
  </Accordion>
  <Accordion title="シークレット">
    対話的な適用では、検出された認証用の認証情報をインポートするか確認し、デフォルトで yes が選択されています。スキップするには `--no-auth-credentials` を使用し、無人で認証情報をインポートするには `--yes` とともに `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドルされた Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順については、[Claude からの移行](/ja-JP/install/migrating-claude)を参照してください。
</Tip>

### Claude がインポートするもの

- `~/.claude/projects/*/memory` にある Claude Code の自動メモリ Markdown、および
  ユーザーが設定した `autoMemoryDirectory`。インデックス付きの参照用として
  `memory/imports/claude-code/` 配下にコピーされます。
- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md`。OpenClaw エージェントワークスペース（`AGENTS.md`）に取り込まれます。
- ユーザーの `~/.claude/CLAUDE.md`。ワークスペースの `USER.md` に追記されます。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`（プロジェクトごとのエントリを含む）、Claude Desktop の `claude_desktop_config.json` にある MCP サーバー定義。
- `SKILL.md` を含む Claude スキルディレクトリ（ユーザーの `~/.claude/skills` およびプロジェクトの `.claude/skills`）。
- Claude コマンドの Markdown ファイル（ユーザーの `~/.claude/commands` およびプロジェクトの `.claude/commands`）。手動呼び出し専用の OpenClaw スキルに変換されます。

### アーカイブおよび手動確認が必要な状態

Claude のフック、権限、環境のデフォルト、プロジェクトの `CLAUDE.local.md`、`.claude/rules`、ユーザーおよびプロジェクトの `agents/` ディレクトリ、プロジェクト履歴（`~/.claude` 配下の `projects`、`cache`、`plans`）は、移行レポートに保存されるか、手動確認項目として報告されます。OpenClaw は、フックの実行、広範な許可リストのコピー、OAuth/Desktop の認証情報状態の自動インポートを行いません。

## Codex プロバイダー

バンドルされた Codex プロバイダーは、デフォルトで `~/.codex` にある Codex CLI の状態を検出し、その環境変数が設定されている場合は `CODEX_HOME` を使用します。特定の Codex ホームをインベントリ化するには `--from <path>` を使用します。

OpenClaw Codex ハーネスへ移行し、有用な個人用 Codex CLI アセットを意図的に昇格させる場合は、このプロバイダーを使用します。ローカルの Codex app-server はエージェントごとの `CODEX_HOME` を使用して起動するため、デフォルトでは個人用の `~/.codex` を読み取りません。通常のプロセスの `HOME` は引き続き継承されるため、Codex は共有の `$HOME/.agents/*` スキル／Plugin マーケットプレイスのエントリを認識でき、サブプロセスはユーザーホームの設定とトークンを検出できます。

対話型ターミナルで `openclaw migrate codex` を実行すると、完全な計画がプレビューされ、最終的な適用確認の前にチェックボックス選択画面が開きます。最初にスキルのコピー項目が表示されます。一括選択には `Toggle all on` または `Toggle all off` を使用します。Space を押すと行の選択状態が切り替わり、Enter を押すと強調表示された行が有効化されて続行します。計画されたスキルは選択済み、競合するスキルは未選択で開始し、`Skip for now` を選ぶと、その実行ではスキルのコピーをスキップしたまま Plugin の選択に進みます。ソースにインストール済みのキュレーションされた Codex Plugin が移行可能で、`--plugin` が指定されていない場合、続いて Plugin 名ごとに Codex ネイティブ Plugin を有効化するか確認されます。ターゲットの OpenClaw Codex Plugin 設定にその Plugin がすでに存在しない限り、Plugin 項目は選択済みで開始します。既存のターゲット Plugin は未選択で開始し、`conflict: plugin exists` のような競合のヒントが表示されます。その実行で Codex ネイティブ Plugin を移行しない場合は `Toggle all off` を選択し、適用前に停止する場合は `Skip for now` を選択します。

スクリプトによる実行や厳密な実行では、1 つ以上のスキルまたは Plugin を明示的に選択します。

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### Codex がインポートするもの

- `$CODEX_HOME/memories` にある、統合された Codex の `MEMORY.md` と `memory_summary.md`。
  インデックス付きの参照用として `memory/imports/codex/` 配下にコピーされます。
  未加工のロールアウトメモリはインポートされません。
- `$CODEX_HOME/skills` 配下の Codex CLI スキルディレクトリ。ただし、Codex の `.system` キャッシュは除外されます。
- `$HOME/.agents/skills` 配下の個人用 AgentSkills。エージェントごとに所有できるよう、現在の OpenClaw エージェントワークスペースへコピーされます。
- Codex app-server の `plugin/list` を通じて検出された、ソースにインストール済みの `openai-curated` Codex Plugin。計画時には、有効化された各インストール済み Plugin の `plugin/read` が読み取られます。

アプリ連携 Plugin の移行には追加の条件があります。

- アプリ連携 Plugin では、ソース Codex app-server のアカウントが ChatGPT サブスクリプションアカウントである必要があります。ChatGPT 以外のアカウントまたはアカウント情報がない応答は、`codex_subscription_required` としてスキップされます。
- デフォルトでは、移行時にソースの `app/list` を呼び出しません。そのため、アカウント条件を満たすアプリ連携 Plugin は、ソース側でアプリへのアクセス可否を検証せずに計画され、アカウント検索時の転送エラーは `codex_account_unavailable` としてスキップされます。
- `--verify-plugin-apps` を指定すると、ソースの `app/list` の新しいスナップショットを強制的に取得し、ネイティブ有効化を計画する前に、所有するすべてのアプリが存在し、有効で、アクセス可能であることを必須とします。このモードでは、アカウント検索時の転送エラーが発生すると、ソースのアプリインベントリによる検証に移行します。スナップショットは現在のプロセスのメモリ内にのみ保持され、移行出力やターゲット設定に書き込まれることはありません。

無効な Plugin、読み取れない Plugin 詳細、サブスクリプション制限のあるソースアカウント、および（`--verify-plugin-apps` が設定されている場合の）存在しない、無効な、またはアクセス不能なアプリは、ターゲット設定のエントリにはならず、型付きの理由を伴う手動スキップ項目になります。適用時には、ターゲットの app-server がその Plugin をインストール済みかつ有効と報告している場合でも、選択された対象 Plugin ごとに app-server の `plugin/install` が呼び出されます。移行された Codex Plugin は、Codex ネイティブハーネスを選択したセッションでのみ使用できます。OpenClaw プロバイダーの実行、ACP 会話バインディング、その他のハーネスには公開されません。

### 手動確認が必要な Codex の状態

Codex `config.toml`、ネイティブ `hooks/hooks.json`、厳選されていないマーケットプレイス、ソースからインストールされた厳選 Plugin ではないキャッシュ済み Plugin バンドル、およびソースサブスクリプションゲートを通過できないソースインストール済み Plugin は、自動的に有効化されません。`--verify-plugin-apps` が設定されている場合、ソースアプリインベントリゲートを通過できない Plugin もスキップされます。これらはすべて、手動確認用として移行レポートにコピーまたは報告されます。

移行されたソースインストール済みの厳選 Plugin には、次の書き込みを適用します。

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- 選択した各 Plugin に対して、`marketplaceName: "openai-curated"` と `pluginName` を含む明示的な Plugin エントリを1つ

移行では `plugins["*"]` を書き込まず、ローカルマーケットプレイスのキャッシュパスも保存しません。

スキップされた Plugin はターゲット設定に書き込まれません。ソース側のサブスクリプション失敗は、`codex_subscription_required`、`codex_account_unavailable`、`plugin_disabled`、または `plugin_read_unavailable` という型付き理由とともに手動対応項目として報告されます。`--verify-plugin-apps` を使用すると、ソースアプリインベントリの失敗も `app_inaccessible`、`app_disabled`、`app_missing`、または `app_inventory_unavailable` として表示される場合があります。ターゲット側で認証が必要なインストールは、影響を受ける Plugin 項目に `status: "skipped"`、`reason: "auth_required"`、およびサニタイズ済みアプリ識別子とともに報告されます。それらの明示的な設定エントリは、再認証して有効化するまで無効状態で書き込まれます。その他のインストール失敗は、項目単位の `error` 結果になります。

計画時に Codex app-server の Plugin インベントリを利用できない場合、移行全体を失敗させる代わりに、キャッシュ済みバンドルの勧告項目へフォールバックします。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは `$HERMES_HOME` とアクティブなプロファイルに従い、その後プラットフォームのデフォルト（`~/.hermes` または `%LOCALAPPDATA%\hermes`）を使用します。検出を上書きするには `--from <path>` を使用します。

### Hermes がインポートする内容

- `config.yaml` のデフォルトモデル設定。
- `model`、`providers`、および `custom_providers` の設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` の MCP サーバー定義。OpenClaw の正確なマッピングは、デフォルトの Streamable HTTP ルーティング、OAuth スコープ、真偽値の TLS 検証、個別のクライアント証明書／キーパス、および Hermes のネイティブ／リソース／プロンプトツールポリシーに対応します。サポートされていない Hermes 固有のランタイムフィールドまたは認証情報フィールドは、手動確認用として報告されます。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースのメモリファイルに追記。
- OpenClaw ファイルメモリ用のメモリ設定デフォルト、および Honcho などの外部メモリプロバイダー向けのアーカイブ項目または手動確認項目。
- `skills/` 配下の任意の場所に `SKILL.md` ファイルを含む Skills。ネストされた Skills はワークスペースの Skills ディレクトリにフラット化されます。
- `skills.config` の Skills ごとの設定値。
- 対話型の認証情報移行が承認された場合、または `--include-secrets` が設定されている場合の、現在の Hermes OpenAI Codex OAuth 認証情報および OpenCode OpenAI OAuth 認証情報。Hermes と OpenClaw で、インポートした同じリフレッシュグラントを使用し続けないでください。
- 対話型の認証情報移行が承認された場合、または `--include-secrets` が設定されている場合の、Hermes `.env` および OpenCode `auth.json` のサポート対象 API キーとトークン。

### サポートされる `.env` キー

`AI_GATEWAY_API_KEY`、`ALIBABA_API_KEY`、`ANTHROPIC_API_KEY`、`ARCEEAI_API_KEY`、`CEREBRAS_API_KEY`、`CHUTES_API_KEY`、`CLOUDFLARE_AI_GATEWAY_API_KEY`、`COPILOT_GITHUB_TOKEN`、`DASHSCOPE_API_KEY`、`DEEPINFRA_API_KEY`、`DEEPSEEK_API_KEY`、`FIREWORKS_API_KEY`、`GEMINI_API_KEY`、`GH_TOKEN`、`GITHUB_TOKEN`、`GLM_API_KEY`、`GOOGLE_API_KEY`、`GROQ_API_KEY`、`HF_TOKEN`、`HUGGINGFACE_HUB_TOKEN`、`KILOCODE_API_KEY`、`KIMICODE_API_KEY`、`KIMI_API_KEY`、`KIMI_CODING_API_KEY`、`MINIMAX_API_KEY`、`MINIMAX_CODING_API_KEY`、`MISTRAL_API_KEY`、`MODELSTUDIO_API_KEY`、`MOONSHOT_API_KEY`、`NVIDIA_API_KEY`、`OPENAI_API_KEY`、`OPENCODE_API_KEY`、`OPENCODE_GO_API_KEY`、`OPENCODE_ZEN_API_KEY`、`OPENROUTER_API_KEY`、`QIANFAN_API_KEY`、`QWEN_API_KEY`、`TOGETHER_API_KEY`、`VENICE_API_KEY`、`XAI_API_KEY`、`XIAOMI_API_KEY`、`ZAI_API_KEY`、`Z_AI_API_KEY`。

### アーカイブ専用の状態

OpenClaw が安全に解釈できない Hermes の状態は、手動確認用として移行レポートにコピーされますが、稼働中の OpenClaw 設定や認証情報には読み込まれません。これには、`plugins/`、`sessions/`、`logs/`、`cron/`、`mcp-tokens/`、`plans/`、`workspace/`、`skins/`、`kanban/`、ペアリング／プラットフォームの状態、Gateway のルーティング／プロセス状態、および検出された Hermes SQLite データベースが含まれます。

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

実行時に Plugin は `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、および `apply` を実装します。コアは CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、および競合の事前チェックを担います。コアは確認済みの計画を `apply(ctx, plan)` に渡します。互換性のため、その引数がない場合に限り、プロバイダーは計画を再構築できます。

プロバイダー Plugin は、項目の構築と集計数に `openclaw/plugin-sdk/migration` を使用できるほか、競合を考慮したファイルコピー、アーカイブ専用のレポートコピー、キャッシュ済み設定ランタイムラッパー、および移行レポートに `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング統合

プロバイダーが既知の移行元を検出した場合、オンボーディングで移行を提示できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じ Plugin 移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングによるインポートには、新規の OpenClaw セットアップが必要です。ローカル状態がすでに存在する場合は、最初に設定、認証情報、セッション、およびワークスペースをリセットしてください。既存のセットアップに対するバックアップ後の上書きインポートまたはマージインポートは、機能ゲートの対象です。
</Note>

## 関連項目

- [Hermes からの移行](/ja-JP/install/migrating-hermes)：ユーザー向けの手順。
- [Claude からの移行](/ja-JP/install/migrating-claude)：ユーザー向けの手順。
- [移行](/ja-JP/install/migrating)：OpenClaw を新しいマシンに移動します。
- [Doctor](/ja-JP/gateway/doctor)：移行適用後の健全性チェック。
- [Plugin](/ja-JP/tools/plugin)：Plugin のインストールと登録。
