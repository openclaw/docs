---
read_when:
    - チャンネルの健全性 + 最近のセッションの宛先をすばやく診断したい場合
    - デバッグ用に貼り付け可能な「all」ステータスが必要な場合
summary: '`openclaw status` のCLI リファレンス（診断、プローブ、使用状況スナップショット）'
title: ステータス
x-i18n:
    generated_at: "2026-05-05T06:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5025ed99d351a43adc60b6896349366b225fd7ecb8ab422dba376f2d157f0033
    source_path: cli/status.md
    workflow: 16
---

# `openclaw status`

チャンネル + セッションの診断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注記:

- `--deep` はライブプローブ（WhatsApp Web + Telegram + Discord + Slack + Signal）を実行します。
- 通常の `openclaw status` は高速な読み取り専用パスにとどまり、メモリ検査をスキップした場合はメモリを利用不可ではなく `not checked` としてマークします。重いセキュリティ監査、Plugin 互換性、メモリベクタープローブは `openclaw status --all`、`openclaw status --deep`、`openclaw security audit`、`openclaw memory status --deep` に委ねられます。
- `status --json --all` は、`plugins.slots.memory` で選択されたアクティブなメモリ Plugin ランタイムからメモリ詳細を報告します。カスタムメモリ Plugin は、組み込みの `agents.defaults.memorySearch.enabled` を無効のままにしても、独自のファイル、チャンク、ベクター、FTS の状態を報告できます。
- `--usage` は、正規化されたプロバイダー使用量ウィンドウを `X% left` として出力します。
- セッションステータス出力は `Execution:` と `Runtime:` を分けます。`Execution` はサンドボックスパス（`direct`、`docker/*`）であり、`Runtime` はセッションが `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または `codex (acp/acpx)` のような ACP バックエンドのどれを使用しているかを示します。プロバイダー、モデル、ランタイムの違いについては [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータを表すため、OpenClaw は表示前にそれらを反転します。カウントベースのフィールドが存在する場合はそちらが優先されます。`model_remains` レスポンスではチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のセッションスナップショットがまばらな場合、`/status` は直近のトランスクリプト使用量ログからトークンとキャッシュのカウンターを補完できます。既存のゼロでないライブ値は、引き続きトランスクリプトのフォールバック値より優先されます。
- `/status` には、簡潔な Gateway プロセス稼働時間とホストシステム稼働時間が含まれます。
- ライブセッションエントリにアクティブなランタイムモデルラベルがない場合、トランスクリプトのフォールバックでそれを復元することもできます。そのトランスクリプトのモデルが選択済みモデルと異なる場合、status は選択済みモデルではなく復元されたランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズの計上では、セッションメタデータがない、または小さい場合、トランスクリプトのフォールバックはプロンプト指向の大きい合計を優先します。そのため、カスタムプロバイダーのセッションが `0` トークン表示に潰れることはありません。
- 複数のエージェントが構成されている場合、出力にはエージェントごとのセッションストアが含まれます。
- 概要には、利用可能な場合、Gateway + ノードホストサービスのインストールおよびランタイムステータスが含まれます。
- 概要には、更新チャンネル + git SHA（ソースチェックアウトの場合）が含まれます。
- 更新情報は概要に表示されます。更新が利用可能な場合、status は `openclaw update` を実行するヒントを出力します（[更新](/ja-JP/install/updating) を参照）。
- 読み取り専用の status サーフェス（`status`、`status --json`、`status --all`）は、可能な場合、対象の設定パスに対応するサポート済み SecretRef を解決します。
- サポート済みチャンネル SecretRef が構成されているものの現在のコマンドパスで利用できない場合、status は読み取り専用のまま、クラッシュする代わりに劣化した出力を報告します。人間向け出力では「configured token unavailable in this command path」のような警告が表示され、JSON 出力には `secretDiagnostics` が含まれます。
- コマンドローカルの SecretRef 解決に成功した場合、status は解決済みスナップショットを優先し、最終出力から一時的な「secret unavailable」チャンネルマーカーを消去します。
- `status --all` には Secrets の概要行と、レポート生成を止めずにシークレット診断を要約する診断セクション（読みやすさのため切り詰め）が含まれます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
