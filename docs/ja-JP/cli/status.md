---
read_when:
    - チャンネルの健全性と最近のセッション受信者をすばやく診断したい場合
    - デバッグ用に貼り付け可能な「all」ステータスが欲しい場合
summary: '`openclaw status` のCLIリファレンス（診断、probe、使用状況スナップショット）'
title: ステータス
x-i18n:
    generated_at: "2026-04-24T04:52:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 369de48e283766ec23ef87f79df39893957101954c4a351e46ef24104d78ec1d
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

チャンネルとセッションの診断です。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注:

- `--deep` はライブ probe を実行します（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- `--usage` は正規化されたプロバイダー使用量ウィンドウを `X% left` として表示します。
- セッションの status 出力では、`Runtime:` と `Runner:` が分離されました。`Runtime` は実行経路と sandbox 状態（`direct`, `docker/*`）を示し、`Runner` はそのセッションが組み込み Pi、CLI バックのプロバイダー、または `codex (acp/acpx)` のような ACP ハーネスバックエンドを使っているかを示します。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータを表すため、OpenClaw は表示前にそれらを反転します。カウントベースのフィールドがある場合はそちらが優先されます。`model_remains` レスポンスは chat-model エントリーを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、plan ラベルにモデル名を含めます。
- 現在のセッションスナップショットが疎な場合、`/status` は最新の transcript 使用量ログからトークンとキャッシュカウンターを補完できます。既存のゼロ以外のライブ値は、引き続き transcript フォールバック値より優先されます。
- transcript フォールバックは、ライブセッションエントリーに欠けている場合、アクティブなランタイムモデルラベルも回復できます。その transcript モデルが選択されたモデルと異なる場合、status は選択モデルではなく回復したランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズ集計では、セッションメタデータが欠けているか小さい場合、transcript フォールバックはより大きいプロンプト指向の合計を優先するため、カスタムプロバイダーセッションでトークン表示が `0` に潰れません。
- 複数エージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。
- 利用可能な場合、概要には Gateway + node host のサービスインストール/ランタイム status が含まれます。
- 概要には更新チャンネル + git SHA（ソースチェックアウト時）が含まれます。
- 更新情報は Overview に表示されます。更新が利用可能な場合、status は `openclaw update` の実行ヒントを表示します（[Updating](/ja-JP/install/updating) を参照）。
- 読み取り専用の status サーフェス（`status`, `status --json`, `status --all`）は、可能な場合、対象 config パスに対してサポートされている SecretRef を解決します。
- サポートされるチャンネル SecretRef が設定されているが、現在のコマンドパスでは利用できない場合、status は読み取り専用のままクラッシュせず、劣化した出力を報告します。人間向け出力では「configured token unavailable in this command path」のような警告を表示し、JSON 出力には `secretDiagnostics` が含まれます。
- コマンドローカルな SecretRef 解決に成功した場合、status は解決済みスナップショットを優先し、最終出力から一時的な「secret unavailable」チャンネルマーカーをクリアします。
- `status --all` には Secrets 概要行と、レポート生成を止めることなく secret diagnostics を要約する diagnosis セクション（可読性のために短縮）が含まれます。

## 関連

- [CLI reference](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
