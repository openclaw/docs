---
read_when:
    - channelの健全性と最近のセッション受信者をすばやく診断したい。
    - デバッグ用に貼り付け可能な「all」statusが欲しい。
summary: '`openclaw status` のCLIリファレンス（診断、プローブ、使用状況スナップショット）'
title: status
x-i18n:
    generated_at: "2026-04-23T14:02:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

channels + sessionsの診断です。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注記:

- `--deep` はライブプローブを実行します（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- `--usage` は正規化されたprovider使用量ウィンドウを `X% left` として表示します。
- Session status出力は、`Runtime:` と `Runner:` を分離して表示するようになりました。`Runtime` は実行パスとsandbox状態（`direct`、`docker/*`）であり、`Runner` はそのsessionが組み込みPi、CLIバックエンドprovider、または `codex (acp/acpx)` のようなACP harness backendを使用しているかを示します。
- MiniMaxの生の `usage_percent` / `usagePercent` フィールドは残りクォータを意味するため、OpenClawは表示前にそれを反転します。件数ベースのフィールドが存在する場合はそちらが優先されます。`model_remains` レスポンスはチャットモデルのエントリーを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- 現在のsessionスナップショットが疎な場合、`/status` は最新のtranscript usage logからトークン数とキャッシュカウンターを補完できます。既存のゼロ以外のライブ値がある場合は、引き続きそれがtranscriptフォールバックより優先されます。
- Transcriptフォールバックは、ライブsessionエントリーにそれが存在しない場合、アクティブなruntime modelラベルも復元できます。そのtranscript modelが選択されたmodelと異なる場合、statusは選択されたものではなく、復元されたruntime modelに対してコンテキストウィンドウを解決します。
- プロンプトサイズの計上では、session metadataが存在しないかそれより小さい場合、transcriptフォールバックはより大きいプロンプト指向の合計値を優先するため、custom-provider sessionsがトークン表示で `0` に潰れることはありません。
- 複数のagentが設定されている場合、出力にはagentごとのsession storesが含まれます。
- 可能な場合、overviewにはGateway + node host serviceのインストール/ランタイムstatusが含まれます。
- overviewには更新チャネル + git SHA（ソースチェックアウト用）が含まれます。
- 更新情報はOverviewに表示されます。更新が利用可能な場合、statusは `openclaw update` を実行するヒントを表示します（[Updating](/ja-JP/install/updating) を参照）。
- 読み取り専用のstatus surface（`status`、`status --json`、`status --all`）は、可能な場合、対象config pathに対してサポートされているSecretRefsを解決します。
- サポートされているchannel SecretRefが設定されていても、現在のコマンドパスで利用できない場合、statusは読み取り専用を維持し、クラッシュする代わりに劣化した出力を報告します。人間向け出力では「configured token unavailable in this command path」のような警告が表示され、JSON出力には `secretDiagnostics` が含まれます。
- コマンドローカルのSecretRef解決に成功した場合、statusは解決済みスナップショットを優先し、最終出力から一時的な「secret unavailable」channelマーカーを取り除きます。
- `status --all` にはSecrets overview行と、secret diagnosticsを要約した診断セクション（読みやすさのために省略あり）が含まれ、レポート生成は停止しません。
