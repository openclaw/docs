---
read_when:
    - チャネルの健全性と最近のセッション受信者をすばやく診断したい
    - デバッグ用に貼り付け可能な「all」ステータスが必要な場合
summary: '`openclaw status` の CLI リファレンス（診断、プローブ、使用状況スナップショット）'
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T11:03:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
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
- 通常の `openclaw status` は高速な読み取り専用パスに留まり、メモリ検査をスキップした場合はメモリを利用不可ではなく `not checked` としてマークします。重いセキュリティ監査、Plugin 互換性、メモリベクタープローブは、`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`、`openclaw memory status --deep` に任せます。
- `status --json --all` は、`plugins.slots.memory` で選択されたアクティブメモリPluginランタイムからメモリ詳細を報告します。カスタムメモリPluginは、組み込みの `agents.defaults.memorySearch.enabled` を無効のままにしても、独自のファイル、チャンク、ベクター、FTS 状態を報告できます。
- `--usage` は、正規化されたプロバイダー使用量ウィンドウを `X% left` として表示します。
- セッションステータス出力は `Execution:` と `Runtime:` を分けて表示します。`Execution` はサンドボックスパス (`direct`、`docker/*`) であり、`Runtime` はセッションが `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または `codex (acp/acpx)` のような ACP バックエンドのどれを使用しているかを示します。プロバイダー/モデル/ランタイムの違いについては、[エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータを表すため、OpenClaw は表示前に反転します。count ベースのフィールドがある場合はそれが優先されます。`model_remains` レスポンスではチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のセッションスナップショットが疎な場合、`/status` は直近のトランスクリプト使用量ログからトークンとキャッシュのカウンターをバックフィルできます。既存の非ゼロのライブ値は、引き続きトランスクリプトのフォールバック値より優先されます。
- `/status` には、コンパクトな Gateway プロセス稼働時間とホストシステム稼働時間が含まれます。
- ライブセッションエントリにアクティブなランタイムモデルラベルがない場合、トランスクリプトフォールバックでそれを復元することもできます。そのトランスクリプトモデルが選択されたモデルと異なる場合、status は選択されたモデルではなく復元されたランタイムモデルに対してコンテキストウィンドウを解決します。
- セッションが設定済みのプライマリとは異なるモデルに固定されている場合、status は両方の値、理由 (`session override`)、明確なヒント (`/model default`) を表示します。設定済みのプライマリは新規または未固定のセッションに適用されます。既存の固定セッションは、解除されるまでセッションの選択を保持します。
- プロンプトサイズの計算では、セッションメタデータが欠落しているか小さい場合、トランスクリプトフォールバックはプロンプト向けの大きい合計を優先するため、カスタムプロバイダーのセッションでトークン表示が `0` に潰れることはありません。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。
- 概要には、利用可能な場合、Gateway + ノードホストサービスのインストール/ランタイムステータスが含まれます。
- 概要には、更新チャネル + git SHA (ソースチェックアウトの場合) が含まれます。
- 更新情報は概要に表示されます。更新が利用可能な場合、status は `openclaw update` を実行するヒントを表示します ([更新](/ja-JP/install/updating) を参照)。
- モデル価格更新の失敗は、任意の価格警告として表示されます。これは
  Gateway やチャネルが異常であることを意味しません。
- 読み取り専用の status サーフェス (`status`、`status --json`、`status --all`) は、可能な場合、対象の設定パスに対してサポートされている SecretRef を解決します。
- サポートされているチャネル SecretRef が設定されているが現在のコマンドパスで利用できない場合、status は読み取り専用のまま、クラッシュする代わりに縮退した出力を報告します。人間向け出力には「設定済みトークンはこのコマンドパスでは利用できません」のような警告が表示され、JSON 出力には `secretDiagnostics` が含まれます。
- コマンドローカルの SecretRef 解決に成功した場合、status は解決済みスナップショットを優先し、最終出力から一時的な「シークレット利用不可」のチャネルマーカーをクリアします。
- `status --all` には Secrets 概要行と、レポート生成を停止せずにシークレット診断を要約する診断セクション (読みやすさのために切り詰め) が含まれます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
