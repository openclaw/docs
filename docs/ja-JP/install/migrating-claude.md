---
read_when:
    - Claude Code または Claude Desktop から移行し、指示、MCP サーバー、Skills を引き続き利用したい場合
    - OpenClaw が自動的にインポートするものと、アーカイブにのみ保持されるものを理解する必要があります
summary: プレビュー付きインポートで Claude Code と Claude Desktop のローカル状態を OpenClaw に移行する
title: Claude からの移行
x-i18n:
    generated_at: "2026-07-11T22:21:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw は、同梱の Claude 移行プロバイダーを通じてローカルの Claude 状態をインポートします。プロバイダーは状態を変更する前にすべての項目をプレビューし、計画とレポート内のシークレットを墨消しし、適用前に検証済みのバックアップを作成します。

<Note>
オンボーディングによるインポートには、新規の OpenClaw セットアップが必要です。ローカルに OpenClaw の状態がすでに存在する場合は、まず設定、認証情報、セッション、ワークスペースをリセットするか、計画を確認した後に `--overwrite` を指定して `openclaw migrate` を直接使用してください。
</Note>

## 2つのインポート方法

<Tabs>
  <Tab title="オンボーディングウィザード">
    ローカルの Claude 状態を検出すると、ウィザードに Claude が表示されます。

    ```bash
    openclaw onboard --flow import
    ```

    または、特定のソースを指定します。

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    スクリプト化された実行や反復可能な実行には `openclaw migrate` を使用します。完全なリファレンスについては、[`openclaw migrate`](/ja-JP/cli/migrate) を参照してください。

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    特定の Claude Code ホームまたはプロジェクトルートをインポートするには、`--from <path>` を追加します。

  </Tab>
</Tabs>

## インポートされるもの

<AccordionGroup>
  <Accordion title="指示とメモリ">
    - プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` の内容は、OpenClaw エージェントワークスペースの `AGENTS.md` にコピーまたは追記されます。
    - ユーザーの `~/.claude/CLAUDE.md` の内容は、ワークスペースの `USER.md` に追記されます。

  </Accordion>
  <Accordion title="MCP サーバー">
    MCP サーバー定義は、存在する場合、プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` からインポートされます。
  </Accordion>
  <Accordion title="Skills とコマンド">
    - `SKILL.md` ファイルを持つ Claude の Skills は、OpenClaw ワークスペースの Skills ディレクトリにコピーされます。
    - `.claude/commands/` または `~/.claude/commands/` 配下の Claude コマンドの Markdown ファイルは、`disable-model-invocation: true` が設定された OpenClaw の Skills に変換されます。

  </Accordion>
</AccordionGroup>

## アーカイブのみに保持されるもの

プロバイダーは手動確認のために以下を移行レポートへコピーしますが、稼働中の OpenClaw 設定には読み込み**ません**。

- Claude フック
- Claude の権限と広範なツール許可リスト
- Claude の環境デフォルト
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` または `~/.claude/agents/` 配下の Claude サブエージェント
- Claude Code のキャッシュ、計画、プロジェクト履歴ディレクトリ
- Claude Desktop の拡張機能と OS に保存された認証情報

OpenClaw は、フックの実行、権限許可リストの信頼、不透明な OAuth および Desktop の認証情報状態の自動デコードを拒否します。アーカイブを確認した後、必要なものを手動で移動してください。

## ソースの選択

`--from` を指定しない場合、OpenClaw はデフォルトの Claude Code ホームである `~/.claude`、Claude Code の状態ファイル `~/.claude.json` から抽出された状態、および macOS 上の Claude Desktop MCP 設定を調べます。

`--from` でプロジェクトルートを指定すると、OpenClaw は `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/`、`.mcp.json` など、そのプロジェクトの Claude ファイルのみをインポートします。プロジェクトルートのインポート中に、グローバルな Claude ホームは読み取りません。

## 推奨フロー

<Steps>
  <Step title="計画をプレビューする">
    ```bash
    openclaw migrate claude --dry-run
    ```

    計画には、競合、スキップされた項目、ネストされた MCP の `env` または `headers` フィールドから墨消しされた機密値を含め、変更されるすべての内容が一覧表示されます。

  </Step>
  <Step title="バックアップ付きで適用する">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw は適用前にバックアップを作成して検証します。

  </Step>
  <Step title="Doctor を実行する">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ja-JP/gateway/doctor) は、インポート後に設定または状態の問題がないか確認します。

  </Step>
  <Step title="再起動して確認する">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway が正常であり、インポートした指示、MCP サーバー、Skills が読み込まれていることを確認します。

  </Step>
</Steps>

## 競合の処理

計画で競合（ターゲットにファイルまたは設定値がすでに存在すること）が報告されると、適用は続行を拒否します。

<Warning>
既存のターゲットを意図的に置き換える場合にのみ、`--overwrite` を指定して再実行してください。プロバイダーは、上書きされるファイルについて、移行レポートディレクトリ内に項目単位のバックアップを引き続き作成する場合があります。
</Warning>

新規の OpenClaw インストールでは、競合はまれです。通常は、ユーザーによる編集がすでに存在するセットアップでインポートを再実行した場合に発生します。

## 自動化向けの JSON 出力

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

対話型ターミナル以外で `migrate apply` を実行する場合は `--yes` が必須です。指定しないと、OpenClaw は適用せずにエラーを返すため、スクリプトと CI では `--yes` を明示的に渡す必要があります。まず `--dry-run --json` でプレビューし、計画に問題がなければ `--json --yes` で適用してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Claude の状態が ~/.claude 以外にある">
    `--from /actual/path`（CLI）または `--import-source /actual/path`（オンボーディング）を渡します。
  </Accordion>
  <Accordion title="既存のセットアップではオンボーディングがインポートを拒否する">
    オンボーディングによるインポートには新規セットアップが必要です。状態をリセットして再度オンボーディングを行うか、`--overwrite` と明示的なバックアップ制御をサポートする `openclaw migrate apply claude` を直接使用してください。
  </Accordion>
  <Accordion title="Claude Desktop の MCP サーバーがインポートされなかった">
    Claude Desktop はプラットフォーム固有のパスから `claude_desktop_config.json` を読み取ります。OpenClaw が自動検出しなかった場合は、`--from` でそのファイルのディレクトリを指定してください。
  </Accordion>
  <Accordion title="Claude コマンドがモデル呼び出し無効の Skills になった">
    これは仕様です。Claude コマンドはユーザーによって起動されるため、OpenClaw は `disable-model-invocation: true` を設定した Skills としてインポートします。エージェントから自動的に呼び出せるようにする場合は、各 Skill の frontmatter を編集してください。
  </Accordion>
</AccordionGroup>

## 関連項目

- [`openclaw migrate`](/ja-JP/cli/migrate)：完全な CLI リファレンス、Plugin コントラクト、JSON 形式。
- [移行ガイド](/ja-JP/install/migrating)：すべての移行パス。
- [Hermes からの移行](/ja-JP/install/migrating-hermes)：もう一つのシステム間インポートパス。
- [オンボーディング](/ja-JP/cli/onboard)：ウィザードのフローと非対話型フラグ。
- [Doctor](/ja-JP/gateway/doctor)：移行後の正常性チェック。
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace)：`AGENTS.md`、`USER.md`、Skills が配置される場所。
