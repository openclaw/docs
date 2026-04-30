---
read_when:
    - Claude Code または Claude Desktop から移行し、指示、MCP サーバー、スキルを維持したい
    - OpenClaw が自動的にインポートするものと、アーカイブ専用のまま残るものを理解しておく必要があります
summary: プレビュー付きインポートで Claude Code と Claude Desktop のローカル状態を OpenClaw に移行する
title: Claude からの移行
x-i18n:
    generated_at: "2026-04-30T05:20:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw は、同梱の Claude 移行プロバイダーを通じてローカルの Claude 状態をインポートします。このプロバイダーは状態を変更する前にすべての項目をプレビューし、計画とレポート内のシークレットを秘匿し、適用前に検証済みバックアップを作成します。

<Note>
オンボーディングでのインポートには、新規の OpenClaw セットアップが必要です。すでにローカルの OpenClaw 状態がある場合は、先に config、credentials、sessions、workspace をリセットするか、計画を確認したうえで `--overwrite` を指定して `openclaw migrate` を直接使用してください。
</Note>

## インポートする2つの方法

<Tabs>
  <Tab title="オンボーディングウィザード">
    ウィザードはローカルの Claude 状態を検出すると Claude を提示します。

    ```bash
    openclaw onboard --flow import
    ```

    または、特定のソースを指定します。

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    スクリプト化された実行や反復可能な実行には `openclaw migrate` を使用します。完全なリファレンスは [`openclaw migrate`](/ja-JP/cli/migrate) を参照してください。

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
    - `SKILL.md` ファイルを持つ Claude skills は、OpenClaw ワークスペースの skills ディレクトリにコピーされます。
    - `.claude/commands/` または `~/.claude/commands/` 配下の Claude コマンド Markdown ファイルは、`disable-model-invocation: true` を持つ OpenClaw skills に変換されます。

  </Accordion>
</AccordionGroup>

## アーカイブ専用として残るもの

プロバイダーは手動確認用にこれらを移行レポートへコピーしますが、ライブの OpenClaw config にはロード**しません**。

- Claude hooks
- Claude 権限と広範なツール許可リスト
- Claude 環境デフォルト
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` または `~/.claude/agents/` 配下の Claude サブエージェント
- Claude Code のキャッシュ、計画、プロジェクト履歴ディレクトリ
- Claude Desktop 拡張機能と OS に保存された認証情報

OpenClaw は、hooks の実行、権限許可リストの信頼、不透明な OAuth と Desktop 認証情報状態の自動デコードを拒否します。アーカイブを確認した後、必要なものを手動で移動してください。

## ソースの選択

`--from` がない場合、OpenClaw はデフォルトの Claude Code ホームである `~/.claude`、サンプリングされた Claude Code の `~/.claude.json` 状態ファイル、macOS 上の Claude Desktop MCP config を検査します。

`--from` がプロジェクトルートを指す場合、OpenClaw は `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/`、`.mcp.json` など、そのプロジェクトの Claude ファイルのみをインポートします。プロジェクトルートのインポート中に、グローバルな Claude ホームは読み取りません。

## 推奨フロー

<Steps>
  <Step title="計画をプレビューする">
    ```bash
    openclaw migrate claude --dry-run
    ```

    計画には、競合、スキップされた項目、ネストされた MCP `env` または `headers` フィールドから秘匿された機密値を含め、変更されるすべての内容が一覧表示されます。

  </Step>
  <Step title="バックアップ付きで適用する">
    ```bash
    openclaw migrate apply claude --yes
    ```

    OpenClaw は適用前にバックアップを作成して検証します。

  </Step>
  <Step title="doctor を実行する">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ja-JP/gateway/doctor) は、インポート後の config または状態の問題を確認します。

  </Step>
  <Step title="再起動して確認する">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway が正常であり、インポートされた指示、MCP サーバー、skills がロードされていることを確認します。

  </Step>
</Steps>

## 競合の処理

計画が競合を報告する場合、適用は続行を拒否します（ファイルまたは config 値がターゲットにすでに存在します）。

<Warning>
既存のターゲットを置き換えることが意図した操作である場合にのみ、`--overwrite` を指定して再実行してください。プロバイダーは、上書きされたファイルに対しても、移行レポートディレクトリ内に項目レベルのバックアップを書き込むことがあります。
</Warning>

新規の OpenClaw インストールでは、競合はまれです。通常は、すでにユーザー編集があるセットアップでインポートを再実行した場合に発生します。

## 自動化向けの JSON 出力

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

`--json` を指定し、`--yes` を指定しない場合、apply は計画を出力し、状態を変更しません。これは CI と共有スクリプトにとって最も安全なモードです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Claude 状態が ~/.claude の外にある">
    `--from /actual/path`（CLI）または `--import-source /actual/path`（オンボーディング）を渡します。
  </Accordion>
  <Accordion title="オンボーディングが既存セットアップへのインポートを拒否する">
    オンボーディングでのインポートには新規セットアップが必要です。状態をリセットして再オンボーディングするか、`--overwrite` と明示的なバックアップ制御をサポートする `openclaw migrate apply claude` を直接使用してください。
  </Accordion>
  <Accordion title="Claude Desktop の MCP サーバーがインポートされなかった">
    Claude Desktop はプラットフォーム固有のパスから `claude_desktop_config.json` を読み取ります。OpenClaw が自動検出しなかった場合は、そのファイルのディレクトリを `--from` に指定してください。
  </Accordion>
  <Accordion title="Claude コマンドがモデル呼び出し無効の skills になった">
    これは設計どおりです。Claude コマンドはユーザーがトリガーするため、OpenClaw はそれらを `disable-model-invocation: true` を持つ skills としてインポートします。エージェントに自動で呼び出させたい場合は、各 skill の frontmatter を編集してください。
  </Accordion>
</AccordionGroup>

## 関連

- [`openclaw migrate`](/ja-JP/cli/migrate): 完全な CLI リファレンス、plugin コントラクト、JSON 形式。
- [移行ガイド](/ja-JP/install/migrating): すべての移行パス。
- [Hermes からの移行](/ja-JP/install/migrating-hermes): もう一つのクロスシステムインポートパス。
- [オンボーディング](/ja-JP/cli/onboard): ウィザードフローと非対話フラグ。
- [Doctor](/ja-JP/gateway/doctor): 移行後のヘルスチェック。
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace): `AGENTS.md`、`USER.md`、skills が存在する場所。
