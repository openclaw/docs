---
read_when:
    - チャネルの健全性 + 最近のセッション受信者の簡易診断が必要な場合
    - デバッグ用に貼り付け可能な「all」ステータスが必要
summary: '`openclaw status` の CLI リファレンス（診断、プローブ、使用状況スナップショット）'
title: openclaw status
x-i18n:
    generated_at: "2026-05-11T20:27:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c887878a62c88ebdd81947a23ae4d3ea1f78b1654175b65469ccc4cba2ecdff
    source_path: cli/status.md
    workflow: 16
---

チャンネル + セッションの診断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注記:

- `--deep` はライブプローブを実行します (WhatsApp Web + Telegram + Discord + Slack + Signal)。
- 通常の `openclaw status` は高速な読み取り専用パスにとどまり、メモリ検査をスキップする場合はメモリを利用不可ではなく `not checked` と表示します。重いセキュリティ監査、Plugin 互換性、メモリベクトルのプローブは `openclaw status --all`、`openclaw status --deep`、`openclaw security audit`、`openclaw memory status --deep` に任されます。
- `status --json --all` は、`plugins.slots.memory` で選択されたアクティブなメモリ Plugin ランタイムからメモリ詳細を報告します。カスタムメモリ Plugin は、組み込みの `agents.defaults.memorySearch.enabled` を無効のままにしていても、独自のファイル、チャンク、ベクトル、FTS の状態を報告できます。
- `--usage` は、正規化されたプロバイダー使用量ウィンドウを `X% left` として出力します。
- セッション状態の出力は `Execution:` と `Runtime:` を分けて表示します。`Execution` はサンドボックスパス (`direct`, `docker/*`) で、`Runtime` はセッションが `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または `codex (acp/acpx)` のような ACP バックエンドのどれを使用しているかを示します。プロバイダー/モデル/ランタイムの違いについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータなので、OpenClaw は表示前に反転します。カウントベースのフィールドが存在する場合はそちらが優先されます。`model_remains` レスポンスはチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のセッションスナップショットが疎な場合、`/status` は直近のトランスクリプト使用量ログからトークンとキャッシュのカウンターを補完できます。既存のゼロでないライブ値は、引き続きトランスクリプトのフォールバック値より優先されます。
- `/status` には、簡潔な Gateway プロセス稼働時間とホストシステム稼働時間が含まれます。
- トランスクリプトのフォールバックは、ライブセッションエントリにアクティブなランタイムモデルラベルが欠けている場合にも、それを復元できます。そのトランスクリプトモデルが選択中のモデルと異なる場合、status は選択中のモデルではなく、復元されたランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズの計算では、セッションメタデータが欠落している、または小さい場合、トランスクリプトのフォールバックはプロンプト指向のより大きな合計を優先するため、カスタムプロバイダーセッションのトークン表示が `0` に潰れません。
- 複数のエージェントが構成されている場合、出力にはエージェントごとのセッションストアが含まれます。
- 概要には、利用可能な場合、Gateway + Node ホストサービスのインストール/ランタイム状態が含まれます。
- 概要には、更新チャンネル + git SHA (ソースチェックアウトの場合) が含まれます。
- 更新情報は概要に表示されます。更新が利用可能な場合、status は `openclaw update` を実行するヒントを出力します ([更新](/ja-JP/install/updating) を参照)。
- モデル価格の更新失敗は、任意の価格警告として表示されます。これは
  Gateway やチャンネルが異常であることを意味しません。
- 読み取り専用の状態サーフェス (`status`, `status --json`, `status --all`) は、可能な場合、対象の設定パスでサポートされている SecretRefs を解決します。
- サポートされているチャンネル SecretRef が構成されているものの、現在のコマンドパスで利用できない場合、status は読み取り専用のまま、クラッシュせずに低下状態の出力を報告します。人間向け出力には「configured token unavailable in this command path」のような警告が表示され、JSON 出力には `secretDiagnostics` が含まれます。
- コマンドローカルの SecretRef 解決が成功した場合、status は解決済みスナップショットを優先し、最終出力から一時的な「secret unavailable」チャンネルマーカーをクリアします。
- `status --all` には Secrets 概要行と、レポート生成を停止せずにシークレット診断を要約する診断セクション (読みやすさのため切り詰め) が含まれます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
