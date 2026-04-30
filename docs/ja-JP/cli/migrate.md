---
read_when:
    - Hermes または別のエージェントシステムから OpenClaw に移行したい
    - Plugin が所有する移行プロバイダーを追加しています
summary: '`openclaw migrate` の CLI リファレンス（別のエージェントシステムから状態をインポート）'
title: 移行
x-i18n:
    generated_at: "2026-04-30T05:05:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Plugin が所有する移行プロバイダーを通じて、別のエージェントシステムから状態をインポートします。バンドルされたプロバイダーは [Claude](/ja-JP/install/migrating-claude) と [Hermes](/ja-JP/install/migrating-hermes) に対応しています。サードパーティのプラグインは追加プロバイダーを登録できます。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) と [Hermes からの移行](/ja-JP/install/migrating-hermes) を参照してください。[移行ハブ](/ja-JP/install/migrating) にはすべてのパスが一覧表示されています。
</Tip>

## コマンド

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  サポートされている認証情報をインポートします。デフォルトではオフです。
</ParamField>
<ParamField path="--overwrite" type="boolean">
  プランで競合が報告された場合に、apply が既存のターゲットを置き換えることを許可します。
</ParamField>
<ParamField path="--yes" type="boolean">
  確認プロンプトをスキップします。非対話モードでは必須です。
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

## 安全性モデル

`openclaw migrate` はプレビュー優先です。

<AccordionGroup>
  <Accordion title="適用前のプレビュー">
    プロバイダーは、変更が行われる前に、競合、スキップされた項目、機密項目を含む項目別プランを返します。JSON プラン、apply 出力、移行レポートでは、API キー、トークン、認可ヘッダー、Cookie、パスワードなど、シークレットのように見えるネストされたキーがマスクされます。

    `openclaw migrate apply <provider>` はプランをプレビューし、`--yes` が設定されていない限り、状態を変更する前に確認します。非対話モードでは、apply に `--yes` が必要です。

  </Accordion>
  <Accordion title="バックアップ">
    apply は移行を適用する前に OpenClaw バックアップを作成して検証します。ローカルの OpenClaw 状態がまだ存在しない場合、バックアップ手順はスキップされ、移行を続行できます。状態が存在する場合にバックアップをスキップするには、`--no-backup` と `--force` の両方を渡します。
  </Accordion>
  <Accordion title="競合">
    プランに競合がある場合、apply は続行を拒否します。プランを確認し、既存ターゲットを置き換える意図がある場合は `--overwrite` を付けて再実行します。プロバイダーは、上書きされたファイルについて、移行レポートディレクトリに項目レベルのバックアップを書き込む場合があります。
  </Accordion>
  <Accordion title="シークレット">
    シークレットはデフォルトではインポートされません。サポートされている認証情報をインポートするには `--include-secrets` を使用します。
  </Accordion>
</AccordionGroup>

## Claude プロバイダー

バンドルされた Claude プロバイダーは、デフォルトで `~/.claude` にある Claude Code の状態を検出します。特定の Claude Code ホームまたはプロジェクトルートをインポートするには `--from <path>` を使用します。

<Tip>
ユーザー向けの手順は、[Claude からの移行](/ja-JP/install/migrating-claude) を参照してください。
</Tip>

### Claude がインポートするもの

- プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` を OpenClaw エージェントワークスペースへ。
- ユーザーの `~/.claude/CLAUDE.md` をワークスペースの `USER.md` に追記。
- プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` から MCP サーバー定義。
- `SKILL.md` を含む Claude スキルディレクトリ。
- Claude コマンド Markdown ファイルを、手動呼び出し専用の OpenClaw スキルに変換。

### アーカイブと手動レビュー状態

Claude のフック、権限、環境デフォルト、ローカルメモリ、パススコープルール、サブエージェント、キャッシュ、プラン、プロジェクト履歴は、移行レポートに保存されるか、手動レビュー項目として報告されます。OpenClaw は、フックの実行、広範な許可リストのコピー、OAuth/Desktop 認証情報状態の自動インポートを行いません。

## Hermes プロバイダー

バンドルされた Hermes プロバイダーは、デフォルトで `~/.hermes` にある状態を検出します。Hermes が別の場所にある場合は `--from <path>` を使用します。

### Hermes がインポートするもの

- `config.yaml` からデフォルトモデル設定。
- `providers` と `custom_providers` から、設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。
- `mcp_servers` または `mcp.servers` から MCP サーバー定義。
- `SOUL.md` と `AGENTS.md` を OpenClaw エージェントワークスペースへ。
- `memories/MEMORY.md` と `memories/USER.md` をワークスペースメモリファイルに追記。
- OpenClaw ファイルメモリ用のメモリ設定デフォルト、および Honcho などの外部メモリプロバイダー用のアーカイブまたは手動レビュー項目。
- `skills/<name>/` 配下に `SKILL.md` ファイルを含む Skills。
- `skills.config` からスキルごとの設定値。
- `.env` からサポートされている API キー。`--include-secrets` を指定した場合のみ。

### サポートされている `.env` キー

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### アーカイブ専用状態

OpenClaw が安全に解釈できない Hermes の状態は、手動レビュー用に移行レポートへコピーされますが、ライブの OpenClaw 設定や認証情報には読み込まれません。これにより、不透明または安全でない状態を、OpenClaw が自動的に実行または信頼できるかのように扱うことなく保持できます。

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

移行ソースはプラグインです。プラグインは `openclaw.plugin.json` でプロバイダー ID を宣言します。

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

実行時にプラグインは `api.registerMigrationProvider(...)` を呼び出します。プロバイダーは `detect`、`plan`、`apply` を実装します。コアは CLI オーケストレーション、バックアップポリシー、プロンプト、JSON 出力、競合の事前確認を所有します。コアはレビュー済みプランを `apply(ctx, plan)` に渡し、プロバイダーは互換性のためにその引数がない場合のみプランを再構築できます。

プロバイダープラグインは、項目の構築とサマリー件数に `openclaw/plugin-sdk/migration` を使用でき、競合を認識するファイルコピー、アーカイブ専用レポートコピー、キャッシュされた設定ランタイムラッパー、移行レポートには `openclaw/plugin-sdk/migration-runtime` を使用できます。

## オンボーディング連携

プロバイダーが既知のソースを検出した場合、オンボーディングは移行を提示できます。`openclaw onboard --flow import` と `openclaw setup --wizard --import-from hermes` はどちらも同じプラグイン移行プロバイダーを使用し、適用前に引き続きプレビューを表示します。

<Note>
オンボーディングインポートには、新規の OpenClaw セットアップが必要です。すでにローカル状態がある場合は、まず設定、認証情報、セッション、ワークスペースをリセットしてください。既存セットアップ向けのバックアップと上書き、またはマージインポートは機能ゲートされています。
</Note>

## 関連

- [Hermes からの移行](/ja-JP/install/migrating-hermes): ユーザー向け手順。
- [Claude からの移行](/ja-JP/install/migrating-claude): ユーザー向け手順。
- [移行](/ja-JP/install/migrating): OpenClaw を新しいマシンへ移動します。
- [Doctor](/ja-JP/gateway/doctor): 移行適用後のヘルスチェック。
- [プラグイン](/ja-JP/tools/plugin): プラグインのインストールと登録。
