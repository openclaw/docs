---
read_when:
    - Hermesから移行し、モデル設定、プロンプト、メモリ、Skillsを維持したい場合
    - OpenClaw が自動的に何をインポートし、何がアーカイブ専用のまま残るのかを知りたい
    - クリーンでスクリプト化された移行パスが必要です（CI、新しいラップトップ、自動化）
summary: プレビュー可能で元に戻せるインポートで Hermes から OpenClaw に移行する
title: Hermes からの移行
x-i18n:
    generated_at: "2026-07-05T11:27:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

バンドルされた Hermes 移行プロバイダーは `~/.hermes` の状態を検出し、適用前にすべての変更をプレビューし、プランとレポート内のシークレットを編集し、何かに触れる前に検証済みの OpenClaw バックアップを書き込みます。

<Note>
インポートには新しい OpenClaw セットアップが必要です。すでにローカルの OpenClaw 状態がある場合は、まず設定、認証情報、セッション、ワークスペースをリセットするか、プランを確認した後に `--overwrite` を付けて `openclaw migrate apply hermes` を直接使用してください。
</Note>

## インポートする 2 つの方法

<Tabs>
  <Tab title="オンボーディングウィザード">
    `~/.hermes` で Hermes を検出し、適用前にプレビューを表示します。

    ```bash
    openclaw onboard --flow import
    ```

    または、特定のソースを指定します。

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="CLI">
    スクリプト化された実行や再現可能な実行には `openclaw migrate` を使用します。完全なリファレンスについては [`openclaw migrate`](/ja-JP/cli/migrate) を参照してください。

    ```bash
    openclaw migrate hermes --dry-run    # プレビューのみ
    openclaw migrate apply hermes --yes  # 確認をスキップして適用
    ```

    Hermes が `~/.hermes` の外にある場合は `--from <path>` を追加します。

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
    - `memories/MEMORY.md` と `memories/USER.md` は、上書きではなく、対応する OpenClaw メモリファイルに**追記**されます。

  </Accordion>
  <Accordion title="メモリ設定">
    OpenClaw ファイルメモリのメモリ設定デフォルト。Honcho などの外部メモリプロバイダーは、後で意図的に移動できるように、アーカイブまたは手動レビュー項目として記録されます。
  </Accordion>
  <Accordion title="Skills">
    `skills/<name>/` の下に `SKILL.md` ファイルがある Skills は、`skills.config` からの Skills ごとの設定値とともにコピーされます。
  </Accordion>
  <Accordion title="認証情報">
    対話型の `openclaw migrate` は、認証情報をインポートする前に確認し、デフォルトで yes が選択されています。受け入れると、OpenCode の `auth.json` から OpenCode OpenAI OAuth と GitHub Copilot のエントリ、および [サポートされている Hermes `.env` キー](/ja-JP/cli/migrate#supported-env-keys)がインポートされます。Hermes 自身の `auth.json` OAuth エントリはレガシー状態です。ライブ認証にインポートされる代わりに、手動の再認証/doctor 項目として表示されます。非対話型実行で認証情報をインポートするには `--include-secrets`、認証情報のインポートを完全にスキップするには `--no-auth-credentials`、またはオンボーディングウィザードの `--import-secrets` フラグを使用します。
  </Accordion>
</AccordionGroup>

## アーカイブ専用のまま残るもの

プロバイダーは手動レビュー用にこれらを移行レポートディレクトリにコピーしますが、ライブの OpenClaw 設定や認証情報には読み込み**ません**。

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

形式や信頼の前提はシステム間でずれる可能性があるため、OpenClaw はこの状態を自動的に実行または信頼することを拒否します。アーカイブを確認した後、必要なものを手動で移動してください。

## 推奨フロー

<Steps>
  <Step title="プランをプレビュー">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    プランには、競合、スキップされる項目、機密項目など、変更されるすべての内容が一覧表示されます。ネストされたシークレットらしいキーは出力内で編集されます。

  </Step>
  <Step title="バックアップ付きで適用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw は適用前にバックアップを作成して検証します。この非対話型の例では、非シークレット状態のみをインポートします。認証情報プロンプトに対話的に回答するには `--yes` なしで実行し、無人実行でサポートされる認証情報を含めるには `--include-secrets` を追加します。

  </Step>
  <Step title="doctor を実行">
    ```bash
    openclaw doctor
    ```

    [Doctor](/ja-JP/gateway/doctor) は保留中の設定移行を再適用し、インポート中に発生した問題を確認します。

  </Step>
  <Step title="再起動して検証">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    Gateway が正常で、インポートされたモデル、メモリ、Skills が読み込まれていることを確認します。

  </Step>
</Steps>

## 競合処理

プランが競合（ファイルまたは設定値がターゲットにすでに存在する）を報告した場合、適用は続行を拒否します。

<Warning>
既存のターゲットを置き換える意図がある場合にのみ、`--overwrite` を付けて再実行してください。プロバイダーは、上書きされたファイルについて移行レポートディレクトリに項目レベルのバックアップを書き込む場合があります。
</Warning>

新規インストールでは競合は通常発生しません。ユーザーによる編集がすでにあるセットアップに対してインポートを再実行すると、一般的に表示されます。

適用中に競合が発生した場合（たとえば、設定ファイルで予期しない競合が発生した場合）、Hermes は残りの依存設定項目を部分的に書き込む代わりに、理由 `blocked by earlier apply conflict` 付きの `skipped` としてマークします。移行レポートにはブロックされた各項目が記録されるため、元の競合を解決してインポートを再実行できます。

## シークレット

対話型の `openclaw migrate` は、検出された認証情報をインポートするかどうかを確認し、デフォルトで yes が選択されています。

- 受け入れると、OpenCode の `auth.json` から OpenCode OpenAI OAuth と GitHub Copilot のエントリ、および [サポートされている `.env` キー](/ja-JP/cli/migrate#supported-env-keys)がインポートされます。Hermes 自身の `auth.json` OAuth エントリは、代わりに手動の OpenAI 再認証または doctor 修復として報告されます。
- 非シークレット状態のみをインポートするには、`--no-auth-credentials` を使用するか、プロンプトで no と回答します。
- 無人の `--yes` 実行で認証情報をインポートするには `--include-secrets` を使用します。
- ウィザードから認証情報をインポートするには、オンボーディングウィザードの `--import-secrets` フラグを使用します。

## 自動化用の JSON 出力

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

`--json` を指定し、`--yes` を指定しない場合、apply はプランを出力し、状態を変更しません。これは CI と共有スクリプトにとって最も安全なモードです。

## トラブルシューティング

<AccordionGroup>
  <Accordion title="競合により適用が拒否される">
    プラン出力を確認します。各競合はソースパスと既存のターゲットを識別します。項目ごとに、スキップするか、ターゲットを編集するか、`--overwrite` で再実行するかを決めます。
  </Accordion>
  <Accordion title="Hermes が ~/.hermes の外にある">
    `--from /actual/path`（CLI）または `--import-source /actual/path`（オンボーディング）を渡します。
  </Accordion>
  <Accordion title="既存のセットアップでオンボーディングがインポートを拒否する">
    オンボーディングインポートには新しいセットアップが必要です。状態をリセットして再オンボーディングするか、`--overwrite` と明示的なバックアップ制御をサポートする `openclaw migrate apply hermes` を直接使用してください。
  </Accordion>
  <Accordion title="API キーがインポートされなかった">
    対話型の `openclaw migrate` は、認証情報プロンプトを受け入れた場合にのみ API キーをインポートします。非対話型の `--yes` 実行には `--include-secrets` が必要です。オンボーディングインポートには `--import-secrets` が必要です。[サポートされている `.env` キー](/ja-JP/cli/migrate#supported-env-keys)のみが認識され、その他の `.env` 変数は無視されます。
  </Accordion>
</AccordionGroup>

## 関連

- [`openclaw migrate`](/ja-JP/cli/migrate): 完全な CLI リファレンス、Plugin コントラクト、JSON 形状。
- [オンボーディング](/ja-JP/cli/onboard): ウィザードフローと非対話型フラグ。
- [移行](/ja-JP/install/migrating): OpenClaw インストールをマシン間で移動します。
- [Doctor](/ja-JP/gateway/doctor): 移行後の健全性チェック。
- [エージェントワークスペース](/ja-JP/concepts/agent-workspace): `SOUL.md`、`AGENTS.md`、メモリファイルが存在する場所。
