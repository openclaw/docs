---
read_when:
    - Hermes から移行してきて、モデル設定、プロンプト、メモリ、スキルを維持したい場合
    - OpenClaw が自動的にインポートするものと、アーカイブ専用のまま残るものを知りたい
    - クリーンでスクリプト化された移行パスが必要（CI、新しいノート PC、 automation）
summary: プレビュー済みで元に戻せるインポートを使って Hermes から OpenClaw に移行する
title: Hermes からの移行
x-i18n:
    generated_at: "2026-06-27T11:49:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f2a2bfea4fd276e3392261e8ecea09d147424636efb200ced1deb86ac0161b5
    source_path: install/migrating-hermes.md
    workflow: 16
---

OpenClaw は、バンドルされた移行プロバイダーを通じて Hermes の状態をインポートします。このプロバイダーは状態を変更する前にすべてをプレビューし、プランとレポート内のシークレットを秘匿し、適用前に検証済みバックアップを作成します。

<Note>
インポートには新しい OpenClaw セットアップが必要です。すでにローカルの OpenClaw 状態がある場合は、先に設定、認証情報、セッション、ワークスペースをリセットするか、プランを確認したうえで `--overwrite` を付けて `openclaw migrate` を直接使用してください。
</Note>

## インポートする 2 つの方法

<Tabs>
  <Tab title="オンボーディングウィザード">
    最速の方法です。ウィザードは `~/.hermes` にある Hermes を検出し、適用前にプレビューを表示します。

    ```bash
    openclaw onboard --flow import
    ```

    または、特定のソースを指定します。

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    スクリプト化された実行や繰り返し可能な実行には `openclaw migrate` を使用します。完全なリファレンスは [`openclaw migrate`](/ja-JP/cli/migrate) を参照してください。

    ```bash
    openclaw migrate hermes --dry-run    # preview only
    openclaw migrate apply hermes --yes  # apply with confirmation skipped
    ```

    Hermes が `~/.hermes` 以外にある場合は `--from <path>` を追加します。

  </Tab>
</Tabs>

## インポートされるもの

<AccordionGroup>
  <Accordion title="モデル設定">
    - Hermes `config.yaml` からのデフォルトモデル選択。
    - `providers` と `custom_providers` からの設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。

  </Accordion>
  <Accordion title="MCP サーバー">
    `mcp_servers` または `mcp.servers` からの MCP サーバー定義。
  </Accordion>
  <Accordion title="ワークスペースファイル">
    - `SOUL.md` と `AGENTS.md` は OpenClaw エージェントワークスペースにコピーされます。
    - `memories/MEMORY.md` と `memories/USER.md` は、上書きではなく対応する OpenClaw メモリファイルに**追記**されます。

  </Accordion>
  <Accordion title="メモリ設定">
    OpenClaw ファイルメモリ用のメモリ設定デフォルト。Honcho などの外部メモリプロバイダーは、意図的に移行できるようにアーカイブまたは手動レビュー項目として記録されます。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` の下に `SKILL.md` ファイルがある Skills は、`skills.config` からの Skill ごとの設定値とともにコピーされます。
  </Accordion>
  <Accordion title="認証情報">
    対話型の `openclaw migrate` は、認証情報をインポートする前に確認し、デフォルトで yes が選択されています。受け入れられるインポートには、OpenCode `auth.json` からの OpenCode OpenAI OAuth 認証情報、OpenCode `auth.json` からの OpenCode と GitHub Copilot のエントリ、および[サポートされている `.env` キー](/ja-JP/cli/migrate#supported-env-keys)が含まれます。Hermes `auth.json` の OAuth エントリはレガシー状態であり、ライブ認証にインポートされるのではなく、手動での再認証または doctor 作業として表示されます。非対話型の `openclaw migrate` 認証情報インポートには `--include-secrets`、スキップするには `--no-auth-credentials`、オンボーディングウィザードからインポートする場合はオンボーディングの `--import-secrets` を使用してください。
  </Accordion>
</AccordionGroup>

## アーカイブ専用のもの

プロバイダーは手動レビュー用にこれらを移行レポートディレクトリへコピーしますが、ライブの OpenClaw 設定や認証情報には**読み込みません**。

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

形式や信頼の前提がシステム間で変化する可能性があるため、OpenClaw はこの状態を自動的に実行したり信頼したりしません。アーカイブを確認した後、必要なものを手動で移動してください。

## 推奨フロー

<Steps>
  <Step title="プランをプレビューする">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    プランには、競合、スキップされた項目、機密項目を含め、変更されるすべてが一覧表示されます。プラン出力では、ネストされたシークレットらしいキーが秘匿されます。

  </Step>
  <Step title="バックアップ付きで適用する">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw は適用前にバックアップを作成して検証します。この非対話型の例では、シークレットではない状態をインポートします。認証情報プロンプトに回答するには `--yes` なしで実行し、無人実行でサポートされている認証情報を含めるには `--include-secrets` を追加します。

  </Step>
  <Step title="doctor を実行する">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ja-JP/gateway/doctor) は保留中の設定移行を再適用し、インポート中に発生した問題を確認します。

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

プランが競合（ファイルまたは設定値がターゲットにすでに存在する）を報告している場合、適用は続行を拒否します。

<Warning>
既存のターゲットを置き換えることが意図的な場合にのみ、`--overwrite` を付けて再実行してください。プロバイダーは、上書きされたファイルについても移行レポートディレクトリに項目単位のバックアップを書き込む場合があります。
</Warning>

新しい OpenClaw インストールでは、競合は通常発生しません。通常は、すでにユーザー編集があるセットアップでインポートを再実行した場合に表示されます。

適用の途中で競合が発生した場合（たとえば、設定ファイルで予期しない競合が発生した場合）、Hermes は残りの依存する設定項目を部分的に書き込むのではなく、理由 `blocked by earlier apply conflict` とともに `skipped` としてマークします。移行レポートには各ブロック項目が記録されるため、元の競合を解決してインポートを再実行できます。

## シークレット

対話型の `openclaw migrate` は、検出された認証情報をインポートするかどうかを確認し、デフォルトで yes が選択されています。

- プロンプトを受け入れると、OpenCode `auth.json` からの OpenCode OpenAI OAuth 認証情報、OpenCode `auth.json` からの OpenCode と GitHub Copilot のエントリ、および[サポートされている `.env` キー](/ja-JP/cli/migrate#supported-env-keys)がインポートされます。Hermes `auth.json` の OAuth エントリは、手動の OpenAI 再認証または doctor 修復用として報告されます。
- シークレットではない状態のみをインポートするには、`--no-auth-credentials` を使用するか、プロンプトで no を選択します。
- `--yes` を付けて無人実行する場合は `--include-secrets` を使用します。
- オンボーディングウィザードから認証情報をインポートする場合は、オンボーディングの `--import-secrets` を使用します。
- SecretRef 管理の認証情報については、インポート完了後に SecretRef ソースを設定してください。

## 自動化用の JSON 出力

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` があり `--yes` がない場合、apply はプランを出力し、状態を変更しません。これは CI や共有スクリプトにとって最も安全なモードです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="適用が競合で拒否される">
    プラン出力を確認してください。各競合では、ソースパスと既存のターゲットが示されます。項目ごとに、スキップするか、ターゲットを編集するか、`--overwrite` を付けて再実行するかを判断してください。
  </Accordion>
  <Accordion title="Hermes が ~/.hermes 以外にある">
    `--from /actual/path`（CLI）または `--import-source /actual/path`（オンボーディング）を渡します。
  </Accordion>
  <Accordion title="既存のセットアップでオンボーディングがインポートを拒否する">
    オンボーディングによるインポートには新しいセットアップが必要です。状態をリセットして再オンボーディングするか、`openclaw migrate apply hermes` を直接使用してください。こちらは `--overwrite` と明示的なバックアップ制御をサポートしています。
  </Accordion>
  <Accordion title="API キーがインポートされなかった">
    対話型の `openclaw migrate` は、認証情報プロンプトを受け入れた場合にのみ API キーをインポートします。非対話型の `--yes` 実行には `--include-secrets` が必要で、オンボーディングによるインポートには `--import-secrets` が必要です。認識されるのは[サポートされている `.env` キー](/ja-JP/cli/migrate#supported-env-keys)のみで、`.env` 内のその他の変数は無視されます。
  </Accordion>
</AccordionGroup>

## 関連

- [`openclaw migrate`](/ja-JP/cli/migrate): 完全な CLI リファレンス、Plugin コントラクト、JSON 形状。
- [オンボーディング](/ja-JP/cli/onboard): ウィザードフローと非対話型フラグ。
- [移行](/ja-JP/install/migrating): OpenClaw インストールをマシン間で移動します。
- [Doctor](/ja-JP/gateway/doctor): 移行後のヘルスチェック。
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace): `SOUL.md`、`AGENTS.md`、メモリファイルが存在する場所。
