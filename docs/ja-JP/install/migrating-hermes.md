---
read_when:
    - Hermes から移行し、モデル設定、プロンプト、メモリ、Skills を保持したい場合
    - OpenClaw が自動的にインポートするものと、アーカイブ専用のまま残るものを知りたい
    - クリーンでスクリプト化された移行パスが必要です（CI、新しいラップトップ、自動化）
summary: プレビュー済みで取り消し可能なインポートで Hermes から OpenClaw に移行する
title: Hermesからの移行
x-i18n:
    generated_at: "2026-04-30T05:21:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f8a71e524b31c85864be63e54fc8a2057ecb06a73aac9e6fb107fc0c49757d
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw は、同梱の移行プロバイダーを通じて Hermes の状態をインポートします。このプロバイダーは状態を変更する前にすべてをプレビューし、計画とレポート内のシークレットを伏せ字にし、適用前に検証済みバックアップを作成します。

<Note>
インポートには新しい OpenClaw セットアップが必要です。すでにローカルの OpenClaw 状態がある場合は、まず設定、認証情報、セッション、ワークスペースをリセットするか、計画を確認した後に `--overwrite` を付けて `openclaw migrate` を直接使用してください。
</Note>

## インポートする 2 つの方法

<Tabs>
  <Tab title="オンボーディング ウィザード">
    最短の方法です。ウィザードは `~/.hermes` にある Hermes を検出し、適用前にプレビューを表示します。

    ```bash
    openclaw onboard --flow import
    ```

    または、特定のソースを指定します。

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    スクリプト化された実行や反復可能な実行には `openclaw migrate` を使用します。完全なリファレンスは [`openclaw migrate`](/ja-JP/cli/migrate) を参照してください。

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Hermes が `~/.hermes` 以外にある場合は `--from <path>` を追加します。

  </Tab>
</Tabs>

## インポートされる内容

<AccordionGroup>
  <Accordion title="モデル設定">
    - Hermes の `config.yaml` からのデフォルトモデル選択。
    - `providers` と `custom_providers` からの、設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。

  </Accordion>
  <Accordion title="MCP サーバー">
    `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
  </Accordion>
  <Accordion title="ワークスペースファイル">
    - `SOUL.md` と `AGENTS.md` は OpenClaw エージェントワークスペースにコピーされます。
    - `memories/MEMORY.md` と `memories/USER.md` は、上書きされるのではなく、対応する OpenClaw メモリファイルに**追記**されます。

  </Accordion>
  <Accordion title="メモリ設定">
    OpenClaw ファイルメモリ用のメモリ設定のデフォルトです。Honcho などの外部メモリプロバイダーは、意図的に移動できるようにアーカイブまたは手動レビュー項目として記録されます。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 配下に `SKILL.md` ファイルがある Skills は、`skills.config` からの Skill ごとの設定値とともにコピーされます。
  </Accordion>
  <Accordion title="API キー (オプトイン)">
    対応する `.env` キーをインポートするには `--include-secrets` を設定します: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`。このフラグがない場合、シークレットは一切コピーされません。
  </Accordion>
</AccordionGroup>

## アーカイブ専用として残る内容

プロバイダーは手動レビュー用にこれらを移行レポートディレクトリへコピーしますが、稼働中の OpenClaw 設定や認証情報には読み込みません。

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

形式や信頼の前提がシステム間でずれる可能性があるため、OpenClaw はこの状態を自動的に実行したり信頼したりすることを拒否します。アーカイブを確認した後、必要なものを手動で移動してください。

## 推奨フロー

<Steps>
  <Step title="計画をプレビューする">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    計画には、競合、スキップされた項目、機密項目を含め、変更されるすべての内容が一覧表示されます。計画出力では、ネストされたシークレットらしいキーが伏せ字になります。

  </Step>
  <Step title="バックアップ付きで適用する">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw は適用前にバックアップを作成し、検証します。API キーもインポートする必要がある場合は、`--include-secrets` を追加します。

  </Step>
  <Step title="doctor を実行する">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ja-JP/gateway/doctor) は、保留中の設定移行を再適用し、インポート中に発生した問題がないか確認します。

  </Step>
  <Step title="再起動して検証する">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway が正常で、インポートしたモデル、メモリ、Skills が読み込まれていることを確認します。

  </Step>
</Steps>

## 競合の処理

計画で競合 (ファイルまたは設定値がターゲットにすでに存在すること) が報告された場合、適用は続行を拒否します。

<Warning>
既存のターゲットを置き換えることが意図的な場合にのみ、`--overwrite` を付けて再実行してください。プロバイダーは、上書きされたファイルについて移行レポートディレクトリ内に項目単位のバックアップを引き続き書き込む場合があります。
</Warning>

新しい OpenClaw インストールでは、競合は通常発生しません。通常は、すでにユーザー編集があるセットアップでインポートを再実行したときに現れます。

適用の途中で競合が発生した場合 (たとえば、設定ファイル上の予期しない競合状態)、Hermes は依存する残りの設定項目を部分的に書き込む代わりに、理由 `blocked by earlier apply conflict` 付きで `skipped` としてマークします。移行レポートにはブロックされた各項目が記録されるため、元の競合を解決してインポートを再実行できます。

## シークレット

シークレットはデフォルトでは一切インポートされません。

- まず `openclaw migrate apply hermes --yes` を実行して、シークレット以外の状態をインポートします。
- 対応する `.env` キーもコピーしたい場合は、`--include-secrets` を付けて再実行します。
- SecretRef 管理の認証情報については、インポート完了後に SecretRef ソースを設定してください。

## 自動化向け JSON 出力

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` を指定し、`--yes` を指定しない場合、適用は計画を出力し、状態を変更しません。これは CI と共有スクリプトにとって最も安全なモードです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="適用が競合で拒否される">
    計画出力を確認してください。各競合には、ソースパスと既存のターゲットが示されます。項目ごとに、スキップするか、ターゲットを編集するか、`--overwrite` を付けて再実行するかを決めてください。
  </Accordion>
  <Accordion title="Hermes が ~/.hermes 以外にある">
    `--from /actual/path` (CLI) または `--import-source /actual/path` (オンボーディング) を渡します。
  </Accordion>
  <Accordion title="既存のセットアップでオンボーディングがインポートを拒否する">
    オンボーディングによるインポートには新しいセットアップが必要です。状態をリセットして再度オンボーディングするか、`--overwrite` と明示的なバックアップ制御をサポートする `openclaw migrate apply hermes` を直接使用してください。
  </Accordion>
  <Accordion title="API キーがインポートされなかった">
    `--include-secrets` が必要で、上記に一覧されたキーのみが認識されます。`.env` 内のその他の変数は無視されます。
  </Accordion>
</AccordionGroup>

## 関連

- [`openclaw migrate`](/ja-JP/cli/migrate): 完全な CLI リファレンス、Plugin コントラクト、JSON 形状。
- [オンボーディング](/ja-JP/cli/onboard): ウィザードフローと非対話フラグ。
- [移行](/ja-JP/install/migrating): OpenClaw インストールをマシン間で移動する。
- [Doctor](/ja-JP/gateway/doctor): 移行後のヘルスチェック。
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace): `SOUL.md`、`AGENTS.md`、メモリファイルが配置される場所。
