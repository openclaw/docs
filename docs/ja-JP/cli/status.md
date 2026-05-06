---
read_when:
    - チャンネルの健全性 + 最近のセッション受信者をすばやく診断したい場合
    - デバッグ用に貼り付け可能な「all」ステータスが必要な場合
summary: '`openclaw status` の CLI リファレンス（診断、プローブ、使用状況スナップショット）'
title: openclaw status
x-i18n:
    generated_at: "2026-05-06T09:04:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1929db64f09e9494736f09d0d9c1ae1fb72d7308a7124e616e8247ff32aa3185
    source_path: cli/status.md
    workflow: 16
---

チャネル + セッションの診断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注記:

- `--deep` はライブプローブ (WhatsApp Web + Telegram + Discord + Slack + Signal) を実行します。
- 通常の `openclaw status` は高速な読み取り専用パスのままで、メモリ検査をスキップする場合はメモリを利用不可ではなく `not checked` としてマークします。重いセキュリティ監査、Plugin 互換性、メモリベクトルプローブは `openclaw status --all`、`openclaw status --deep`、`openclaw security audit`、`openclaw memory status --deep` に任せます。
- `status --json --all` は、`plugins.slots.memory` で選択されたアクティブなメモリ Plugin ランタイムからメモリの詳細を報告します。カスタムメモリ Plugin は、組み込みの `agents.defaults.memorySearch.enabled` を無効のままにしても、独自のファイル、チャンク、ベクトル、FTS 状態を報告できます。
- `--usage` は、正規化されたプロバイダー使用量ウィンドウを `X% left` として出力します。
- セッション状態の出力では `Execution:` と `Runtime:` が分離されています。`Execution` はサンドボックスパス (`direct`、`docker/*`) で、`Runtime` はセッションが `OpenClaw Pi Default`、`OpenAI Codex`、CLI バックエンド、または `codex (acp/acpx)` のような ACP バックエンドのどれを使用しているかを示します。プロバイダー/モデル/ランタイムの区別については、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータを表すため、OpenClaw は表示前に反転します。カウントベースのフィールドが存在する場合はそれが優先されます。`model_remains` レスポンスはチャットモデルエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のセッションスナップショットが疎な場合、`/status` は最新のトランスクリプト使用量ログからトークンとキャッシュのカウンターを補完できます。既存のゼロでないライブ値は、トランスクリプトのフォールバック値より引き続き優先されます。
- `/status` には、簡潔な Gateway プロセス稼働時間とホストシステム稼働時間が含まれます。
- ライブセッションエントリにアクティブなランタイムモデルラベルがない場合、トランスクリプトフォールバックでそれを復元することもできます。そのトランスクリプトモデルが選択済みモデルと異なる場合、状態は選択済みモデルではなく、復元されたランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズの集計では、セッションメタデータが欠落しているか小さい場合、トランスクリプトフォールバックはプロンプト指向の大きい合計を優先するため、カスタムプロバイダーのセッションが `0` トークン表示に落ち込むことはありません。
- 複数のエージェントが構成されている場合、出力にはエージェントごとのセッションストアが含まれます。
- 概要には、利用可能な場合に Gateway + Node ホストサービスのインストール/ランタイム状態が含まれます。
- 概要には、更新チャネル + git SHA (ソースチェックアウトの場合) が含まれます。
- 更新情報は概要に表示されます。更新が利用可能な場合、状態は `openclaw update` の実行を促すヒントを出力します ([更新](/ja-JP/install/updating) を参照)。
- 読み取り専用の状態サーフェス (`status`、`status --json`、`status --all`) は、可能な場合、対象の構成パスに対応するサポート済み SecretRef を解決します。
- サポート済みチャネル SecretRef が構成されているものの現在のコマンドパスで利用できない場合、状態は読み取り専用のままになり、クラッシュせずに劣化した出力を報告します。人間向け出力には「このコマンドパスでは構成済みトークンを利用できません」のような警告が表示され、JSON 出力には `secretDiagnostics` が含まれます。
- コマンドローカルの SecretRef 解決に成功した場合、状態は解決済みスナップショットを優先し、最終出力から一時的な「シークレット利用不可」チャネルマーカーをクリアします。
- `status --all` には、シークレットの概要行と、レポート生成を停止せずにシークレット診断を要約する診断セクション (可読性のため切り詰め) が含まれます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
