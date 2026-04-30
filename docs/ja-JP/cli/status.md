---
read_when:
    - チャンネルの健全性と最近のセッション受信者をすばやく診断したい場合
    - デバッグ用に貼り付け可能な「all」ステータスが必要な場合
summary: '`openclaw status` の CLI リファレンス（診断、プローブ、使用状況スナップショット）'
title: ステータス
x-i18n:
    generated_at: "2026-04-30T05:06:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a85613e1830dc24253847e6517d3e155c175bb39ff6b01031ac5cb4291e276fa
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

- `--deep` はライブプローブを実行します (WhatsApp Web + Telegram + Discord + Slack + Signal)。
- 通常の `openclaw status` は高速な読み取り専用パスに留まり、メモリ検査をスキップした場合はメモリを利用不可ではなく `not checked` としてマークします。負荷の高いセキュリティ監査、Plugin 互換性、メモリベクタープローブは、`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`、`openclaw memory status --deep` に任されます。
- `status --json --all` は、`plugins.slots.memory` で選択された Active Memory Plugin ランタイムからメモリ詳細を報告します。カスタムメモリ Plugin は、組み込みの `agents.defaults.memorySearch.enabled` を無効のままにしていても、自身のファイル、チャンク、ベクター、FTS 状態を報告できます。
- `--usage` は、正規化されたプロバイダー使用量ウィンドウを `X% left` として出力します。
- セッション状態の出力は `Execution:` と `Runtime:` を分離します。`Execution` はサンドボックスパス (`direct`, `docker/*`) で、`Runtime` はそのセッションが `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または `codex (acp/acpx)` のような ACP バックエンドのどれを使用しているかを示します。プロバイダー/モデル/ランタイムの違いについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータなので、OpenClaw は表示前にそれらを反転します。カウントベースのフィールドが存在する場合はそちらが優先されます。`model_remains` レスポンスはチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のセッションスナップショットが疎な場合、`/status` は直近のトランスクリプト使用量ログからトークンとキャッシュのカウンターを補完できます。既存のゼロでないライブ値は、引き続きトランスクリプトのフォールバック値より優先されます。
- トランスクリプトフォールバックは、ライブセッションエントリにアクティブランタイムのモデルラベルがない場合にもそれを復元できます。そのトランスクリプトモデルが選択されたモデルと異なる場合、status は選択されたモデルではなく、復元されたランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズの計算では、セッションメタデータが欠落しているか小さい場合、トランスクリプトフォールバックはプロンプト向けのより大きい合計を優先するため、カスタムプロバイダーのセッション表示が `0` トークンに縮退しません。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。
- 概要には、利用可能な場合、Gateway + ノードホストサービスのインストール/ランタイム状態が含まれます。
- 概要には、更新チャンネル + git SHA (ソースチェックアウトの場合) が含まれます。
- 更新情報は概要に表示されます。更新が利用可能な場合、status は `openclaw update` を実行するヒントを出力します ([更新](/ja-JP/install/updating) を参照)。
- 読み取り専用の状態サーフェス (`status`、`status --json`、`status --all`) は、可能な場合、対象の設定パスに対してサポートされている SecretRefs を解決します。
- サポートされているチャンネル SecretRef が設定されているものの、現在のコマンドパスで利用できない場合、status は読み取り専用のまま、クラッシュする代わりに劣化した出力を報告します。人間向けの出力には「このコマンドパスでは設定済みトークンを利用できません」のような警告が表示され、JSON 出力には `secretDiagnostics` が含まれます。
- コマンドローカルの SecretRef 解決に成功した場合、status は解決済みスナップショットを優先し、最終出力から一時的な「シークレット利用不可」のチャンネルマーカーを消去します。
- `status --all` には Secrets 概要行と、シークレット診断を要約する診断セクションが含まれます (読みやすさのため切り詰められます)。これはレポート生成を停止しません。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
