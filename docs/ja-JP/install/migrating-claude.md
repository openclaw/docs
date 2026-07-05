---
read_when:
    - Claude Code または Claude Desktop から移行していて、指示、MCP サーバー、Skills を維持したい場合
    - OpenClaw が自動的にインポートするものと、アーカイブ専用のまま残るものを理解する必要があります
summary: プレビュー付きインポートで Claude Code と Claude Desktop のローカル状態を OpenClaw に移動する
title: Claude からの移行
x-i18n:
    generated_at: "2026-07-05T11:32:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

OpenClaw は、バンドルされた Claude 移行プロバイダーを通じてローカルの Claude 状態をインポートします。プロバイダーは状態を変更する前にすべての項目をプレビューし、計画とレポート内のシークレットを伏せ字にし、適用前に検証済みバックアップを作成します。

<Note>
オンボーディングでのインポートには、新規の OpenClaw セットアップが必要です。すでにローカルの OpenClaw 状態がある場合は、先に config、credentials、sessions、workspace をリセットするか、計画を確認したうえで `--overwrite` を付けて `openclaw migrate` を直接使用してください。
</Note>

## インポートする 2 つの方法

<Tabs>
  <Tab title="オンボーディングウィザード">
    ウィザードはローカルの Claude 状態を検出すると Claude を提示します。

    ```bash
    openclaw onboard --flow import
    ```

    または特定のソースを指定します。

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
    - プロジェクトの `CLAUDE.md` と `.claude/CLAUDE.md` の内容は、OpenClaw エージェント workspace の `AGENTS.md` にコピーまたは追記されます。
    - ユーザーの `~/.claude/CLAUDE.md` の内容は、workspace の `USER.md` に追記されます。

  </Accordion>
  <Accordion title="MCP サーバー">
    MCP サーバー定義は、存在する場合、プロジェクトの `.mcp.json`、Claude Code の `~/.claude.json`、Claude Desktop の `claude_desktop_config.json` からインポートされます。
  </Accordion>
  <Accordion title="Skills とコマンド">
    - `SKILL.md` ファイルを持つ Claude skills は、OpenClaw workspace の skills ディレクトリにコピーされます。
    - `.claude/commands/` または `~/.claude/commands/` 配下の Claude コマンド Markdown ファイルは、`disable-model-invocation: true` を持つ OpenClaw skills に変換されます。

  </Accordion>
</AccordionGroup>

## アーカイブ専用のまま残るもの

プロバイダーは手動確認用にこれらを移行レポートへコピーしますが、ライブの OpenClaw config にはロード**しません**。

- Claude hooks
- Claude permissions と広範な tool allowlists
- Claude environment defaults
- `CLAUDE.local.md`
- `.claude/rules/`
- `.claude/agents/` または `~/.claude/agents/` 配下の Claude subagents
- Claude Code の caches、plans、project history directories
- Claude Desktop extensions と OS に保存された credentials

OpenClaw は、hooks の実行、permission allowlists の信頼、または不透明な OAuth と Desktop credential state の自動デコードを拒否します。必要なものは、アーカイブを確認したあと手動で移してください。

## ソース選択

`--from` がない場合、OpenClaw はデフォルトの Claude Code ホーム `~/.claude`、サンプリングされた Claude Code の `~/.claude.json` 状態ファイル、macOS 上の Claude Desktop MCP config を検査します。

`--from` がプロジェクトルートを指している場合、OpenClaw は `CLAUDE.md`、`.claude/settings.json`、`.claude/commands/`、`.claude/skills/`、`.mcp.json` など、そのプロジェクトの Claude ファイルのみをインポートします。プロジェクトルートのインポート中に、グローバルな Claude ホームは読み取りません。

## 推奨フロー

<Steps>
  <Step title="計画をプレビューする">
    ```bash
    openclaw migrate claude --dry-run
    ```

    計画には、競合、スキップされた項目、ネストされた MCP の `env` または `headers` フィールドから伏せ字にされた機密値を含め、変更されるすべての内容が一覧表示されます。

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

    [Doctor](/ja-JP/gateway/doctor) はインポート後の config または state の問題を確認します。

  </Step>
  <Step title="再起動して確認する">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    gateway が正常で、インポートした指示、MCP サーバー、skills がロードされていることを確認します。

  </Step>
</Steps>

## 競合処理

計画が競合を報告している場合、適用は続行を拒否します（ターゲットにファイルまたは config 値がすでに存在します）。

<Warning>
既存のターゲットを置き換える意図がある場合にのみ、`--overwrite` を付けて再実行してください。プロバイダーは、上書きされたファイルについても、移行レポートディレクトリに項目レベルのバックアップを書き込む場合があります。
</Warning>

新規の OpenClaw インストールでは、競合は通常発生しません。すでにユーザー編集があるセットアップでインポートを再実行した場合によく発生します。

## 自動化向け JSON 出力

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

対話型ターミナル外で `migrate apply` を実行するには `--yes` が必要です。指定しない場合、OpenClaw は適用せずにエラーにするため、スクリプトと CI は `--yes` を明示的に渡す必要があります。まず `--dry-run --json` でプレビューし、計画が正しいことを確認してから `--json --yes` で適用してください。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Claude 状態が ~/.claude の外にある">
    `--from /actual/path`（CLI）または `--import-source /actual/path`（オンボーディング）を渡します。
  </Accordion>
  <Accordion title="既存セットアップでオンボーディングがインポートを拒否する">
    オンボーディングでのインポートには新規セットアップが必要です。状態をリセットして再度オンボーディングするか、`--overwrite` と明示的なバックアップ制御をサポートする `openclaw migrate apply claude` を直接使用してください。
  </Accordion>
  <Accordion title="Claude Desktop の MCP サーバーがインポートされなかった">
    Claude Desktop はプラットフォーム固有のパスから `claude_desktop_config.json` を読み取ります。OpenClaw が自動検出しなかった場合は、そのファイルのディレクトリを `--from` に指定してください。
  </Accordion>
  <Accordion title="Claude コマンドがモデル呼び出し無効の skills になった">
    これは設計どおりです。Claude コマンドはユーザーが起動するものなので、OpenClaw はそれらを `disable-model-invocation: true` を持つ skills としてインポートします。エージェントに自動で呼び出させたい場合は、各 skill の frontmatter を編集してください。
  </Accordion>
</AccordionGroup>

## 関連

- [`openclaw migrate`](/ja-JP/cli/migrate): 完全な CLI リファレンス、plugin contract、JSON shapes。
- [移行ガイド](/ja-JP/install/migrating): すべての移行パス。
- [Hermes からの移行](/ja-JP/install/migrating-hermes): もう一つのクロスシステムインポートパス。
- [オンボーディング](/ja-JP/cli/onboard): ウィザードフローと非対話型フラグ。
- [Doctor](/ja-JP/gateway/doctor): 移行後のヘルスチェック。
- [エージェント workspace](/ja-JP/concepts/agent-workspace): `AGENTS.md`、`USER.md`、skills が存在する場所。
