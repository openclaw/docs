---
read_when:
    - チャネルの健全性と最近のセッション受信先をすばやく診断したい場合
    - デバッグ用にそのまま貼り付けられる「all」ステータスが欲しい場合
summary: '`openclaw status`のCLIリファレンス（診断、プローブ、使用状況スナップショット）'
title: ステータス
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:44:56Z"
  model: gpt-5.4
  provider: openai
  source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
  source_path: cli/status.md
  workflow: 15
---

# `openclaw status`

チャネル + セッションの診断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注:

- `--deep`はライブプローブを実行します（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- `--usage`は、正規化されたプロバイダー使用状況ウィンドウを`X% left`として表示します。
- セッションステータス出力では、`Execution:`と`Runtime:`を分けて表示します。`Execution`はサンドボックスパス（`direct`、`docker/*`）で、`Runtime`はそのセッションが`OpenClaw Pi Default`、`OpenAI Codex`、CLIバックエンド、または`codex (acp/acpx)`のようなACPバックエンドを使っているかを示します。プロバイダー/モデル/ランタイムの違いについては[Agent runtimes](/ja-JP/concepts/agent-runtimes)を参照してください。
- MiniMaxのraw `usage_percent` / `usagePercent`フィールドは残りクォータなので、OpenClawは表示前にそれらを反転します。件数ベースのフィールドが存在する場合はそちらが優先されます。`model_remains`レスポンスではチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のセッションスナップショットが疎な場合、`/status`は直近のトランスクリプト使用状況ログからトークン数とキャッシュカウンターを補完できます。既存のゼロ以外のライブ値がある場合は、引き続きトランスクリプトのフォールバック値より優先されます。
- トランスクリプトフォールバックは、ライブセッションエントリに欠けている場合、アクティブなランタイムモデルラベルの復元にも使えます。そのトランスクリプトモデルが選択中モデルと異なる場合、ステータスは選択中モデルではなく復元したランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズの集計では、セッションメタデータが存在しないかより小さい場合、トランスクリプトフォールバックはより大きいプロンプト指向の合計値を優先するため、カスタムプロバイダーセッションでトークン表示が`0`に潰れることを防ぎます。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアも含まれます。
- 利用可能な場合、概要にはGateway + node hostサービスのインストール/実行ステータスが含まれます。
- 概要には、更新チャネル + git SHA（ソースチェックアウト時）も含まれます。
- 更新情報はOverviewに表示されます。更新が利用可能な場合、ステータスは`openclaw update`を実行するヒントを表示します（[Updating](/ja-JP/install/updating)を参照）。
- 読み取り専用のステータスサーフェス（`status`、`status --json`、`status --all`）は、可能な場合、対象設定パスに対してサポートされたSecretRefを解決します。
- サポートされたチャネルSecretRefが設定されていても現在のコマンド経路では利用できない場合、ステータスは読み取り専用のまま、クラッシュせずに劣化した出力を報告します。人間向け出力には「configured token unavailable in this command path」のような警告が表示され、JSON出力には`secretDiagnostics`が含まれます。
- コマンドローカルのSecretRef解決が成功した場合、ステータスは解決済みスナップショットを優先し、最終出力から一時的な「secret unavailable」チャネルマーカーをクリアします。
- `status --all`にはSecretsの概要行と、レポート生成を止めずにsecret診断を要約する診断セクション（読みやすさのために切り詰めあり）が含まれます。

## 関連

- [CLI reference](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
