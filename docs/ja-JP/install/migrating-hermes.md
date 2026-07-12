---
read_when:
    - Hermes から移行し、モデル設定、プロンプト、メモリ、スキルを維持したい場合
    - OpenClaw が自動的にインポートするものと、アーカイブ専用のまま保持されるものを確認する場合
    - クリーンでスクリプト化された移行手順が必要な場合（CI、新しいノートPC、自動化）
summary: プレビュー可能で元に戻せるインポートを使用して、Hermes から OpenClaw に移行する
title: Hermes からの移行
x-i18n:
    generated_at: "2026-07-11T22:19:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

バンドルされている Hermes 移行プロバイダーは、`~/.hermes` の状態を検出し、適用前にすべての変更をプレビューし、計画とレポート内のシークレットを秘匿し、何かに変更を加える前に検証済みの OpenClaw バックアップを書き込みます。

<Note>
インポートには新規の OpenClaw セットアップが必要です。ローカルに OpenClaw の状態がすでに存在する場合は、まず設定、認証情報、セッション、ワークスペースをリセットするか、計画を確認した後に `--overwrite` を指定して `openclaw migrate apply hermes` を直接使用してください。
</Note>

## 2 つのインポート方法

<Tabs>
  <Tab title="オンボーディングウィザード">
    `~/.hermes` の Hermes を検出し、適用前にプレビューを表示します。

    ```bash
    openclaw onboard --flow import
    ```

    または、特定のソースを指定します。

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    スクリプト化された実行や反復可能な実行には `openclaw migrate` を使用します。完全なリファレンスについては、[`openclaw migrate`](/ja-JP/cli/migrate) を参照してください。

    ```bash
    openclaw migrate hermes --dry-run    # プレビューのみ
    openclaw migrate apply hermes --yes  # 確認を省略して適用
    ```

    Hermes が `~/.hermes` 以外にある場合は、`--from <path>` を追加します。

  </Tab>
</Tabs>

## インポートされるもの

<AccordionGroup>
  <Accordion title="モデル設定">
    - Hermes の `config.yaml` から取得したデフォルトモデルの選択。
    - `providers` と `custom_providers` から取得した、設定済みモデルプロバイダーとカスタム OpenAI 互換エンドポイント。

  </Accordion>
  <Accordion title="MCP サーバー">
    `mcp_servers` または `mcp.servers` の MCP サーバー定義。
  </Accordion>
  <Accordion title="ワークスペースファイル">
    - `SOUL.md` と `AGENTS.md` は OpenClaw エージェントのワークスペースにコピーされます。
    - `memories/MEMORY.md` と `memories/USER.md` は上書きされず、対応する OpenClaw メモリファイルに**追記**されます。

  </Accordion>
  <Accordion title="メモリ設定">
    OpenClaw ファイルメモリ用のメモリ設定のデフォルト値。Honcho などの外部メモリプロバイダーは、意図的に移行できるよう、アーカイブ項目または手動確認項目として記録されます。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` 配下に `SKILL.md` ファイルがある Skills は、`skills.config` の Skills ごとの設定値とともにコピーされます。
  </Accordion>
  <Accordion title="認証情報">
    対話型の `openclaw migrate` では、認証情報をインポートする前に確認を求め、デフォルトでは「はい」が選択されています。承認すると、OpenCode の `auth.json` から OpenCode OpenAI OAuth と GitHub Copilot のエントリ、および[サポート対象の Hermes `.env` キー](/ja-JP/cli/migrate#supported-env-keys)がインポートされます。Hermes 自体の `auth.json` にある OAuth エントリはレガシー状態です。稼働中の認証へインポートされる代わりに、手動での再認証または doctor の項目として表示されます。非対話型実行で認証情報をインポートするには `--include-secrets`、認証情報のインポートを完全に省略するには `--no-auth-credentials`、オンボーディングウィザードでは `--import-secrets` フラグを使用します。
  </Accordion>
</AccordionGroup>

## アーカイブのみに保持されるもの

プロバイダーは手動確認用として以下を移行レポートディレクトリにコピーしますが、稼働中の OpenClaw の設定や認証情報には読み込みません。

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

システム間で形式や信頼の前提が変化する可能性があるため、OpenClaw はこの状態を自動的に実行したり信頼したりしません。アーカイブを確認した後、必要なものを手動で移動してください。

## 推奨フロー

<Steps>
  <Step title="計画をプレビューする">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    計画には、競合、スキップされる項目、機密項目を含め、変更されるすべての内容が一覧表示されます。シークレットのように見えるネストされたキーは、出力内で秘匿されます。

  </Step>
  <Step title="バックアップを作成して適用する">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw は適用前にバックアップを作成して検証します。この非対話型の例では、シークレットではない状態のみをインポートします。認証情報に関する確認へ対話形式で回答するには `--yes` を付けずに実行し、無人実行でサポート対象の認証情報を含めるには `--include-secrets` を追加します。

  </Step>
  <Step title="doctor を実行する">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ja-JP/gateway/doctor) は保留中の設定移行を再適用し、インポート中に発生した問題がないか確認します。

  </Step>
  <Step title="再起動して確認する">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway が正常であり、インポートしたモデル、メモリ、Skills が読み込まれていることを確認します。

  </Step>
</Steps>

## 競合の処理

計画で競合（対象にファイルまたは設定値がすでに存在すること）が報告されると、適用は続行を拒否します。

<Warning>
既存の対象を意図的に置き換える場合にのみ、`--overwrite` を指定して再実行してください。プロバイダーは、上書きされるファイルについて、移行レポートディレクトリに項目単位のバックアップを引き続き書き込む場合があります。
</Warning>

新規インストールで競合が発生することはまれです。通常は、ユーザーによる編集がすでに存在するセットアップに対してインポートを再実行した場合に発生します。

適用の途中で競合が発生した場合（たとえば、設定ファイルで予期しない競合状態が発生した場合）、Hermes は依存する残りの設定項目を部分的に書き込まず、理由を `blocked by earlier apply conflict` として `skipped` に設定します。移行レポートにはブロックされた各項目が記録されるため、元の競合を解決してインポートを再実行できます。

## シークレット

対話型の `openclaw migrate` では、検出された認証情報をインポートするか確認を求め、デフォルトでは「はい」が選択されています。

- 承認すると、OpenCode の `auth.json` から OpenCode OpenAI OAuth と GitHub Copilot のエントリ、および[サポート対象の `.env` キー](/ja-JP/cli/migrate#supported-env-keys)がインポートされます。Hermes 自体の `auth.json` にある OAuth エントリは、代わりに OpenAI の手動再認証または doctor による修復の対象として報告されます。
- シークレットではない状態のみをインポートするには、`--no-auth-credentials` を使用するか、確認プロンプトで「いいえ」と回答します。
- 無人の `--yes` 実行で認証情報をインポートするには、`--include-secrets` を使用します。
- ウィザードから認証情報をインポートするには、オンボーディングウィザードの `--import-secrets` フラグを使用します。

## 自動化用の JSON 出力

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` を指定し、`--yes` を指定しない場合、適用は計画を出力するだけで状態を変更しません。これは CI と共有スクリプトにとって最も安全なモードです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="競合により適用が拒否される">
    計画の出力を確認してください。各競合にはソースパスと既存の対象が示されます。項目ごとに、スキップするか、対象を編集するか、`--overwrite` を指定して再実行するかを判断してください。
  </Accordion>
  <Accordion title="Hermes が ~/.hermes 以外にある">
    `--from /actual/path`（CLI）または `--import-source /actual/path`（オンボーディング）を渡します。
  </Accordion>
  <Accordion title="既存のセットアップではオンボーディングによるインポートが拒否される">
    オンボーディングによるインポートには新規セットアップが必要です。状態をリセットしてオンボーディングをやり直すか、`--overwrite` と明示的なバックアップ制御をサポートする `openclaw migrate apply hermes` を直接使用してください。
  </Accordion>
  <Accordion title="API キーがインポートされなかった">
    対話型の `openclaw migrate` は、認証情報の確認プロンプトで承認した場合にのみ API キーをインポートします。非対話型の `--yes` 実行では `--include-secrets` が必要で、オンボーディングによるインポートでは `--import-secrets` が必要です。[サポート対象の `.env` キー](/ja-JP/cli/migrate#supported-env-keys)のみが認識され、その他の `.env` 変数は無視されます。
  </Accordion>
</AccordionGroup>

## 関連項目

- [`openclaw migrate`](/ja-JP/cli/migrate): CLI の完全なリファレンス、Plugin コントラクト、JSON 形式。
- [オンボーディング](/ja-JP/cli/onboard): ウィザードのフローと非対話型フラグ。
- [移行](/ja-JP/install/migrating): OpenClaw のインストールをマシン間で移動する方法。
- [Doctor](/ja-JP/gateway/doctor): 移行後の健全性チェック。
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace): `SOUL.md`、`AGENTS.md`、メモリファイルの保存場所。
