---
read_when:
    - チャネルの健全性と最近のセッション受信者をすばやく診断したい
    - デバッグ用に貼り付け可能な「all」ステータスが必要な場合
summary: '`openclaw status` の CLI リファレンス（診断、プローブ、使用状況スナップショット）'
title: openclaw status
x-i18n:
    generated_at: "2026-07-05T11:11:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37b8a3297adbef855b468466ec1001d0721eef066899eb20d94c18933a8f257e
    source_path: cli/status.md
    workflow: 16
---

チャンネルとセッションの診断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

| フラグ                  | 説明                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--all`                 | 完全な診断（読み取り専用、貼り付け可能）。セキュリティ監査、plugin 互換性、メモリベクタープローブを含みます。 |
| `--deep`                | ライブプローブ（WhatsApp Web + Telegram + Discord + Slack + Signal）を実行します。セキュリティ監査も有効にします。 |
| `--usage`               | 正規化されたプロバイダー使用量ウィンドウを `X% left` として出力します。                                         |
| `--json`                | 機械可読な出力。                                                                                               |
| `--verbose` / `--debug` | レポートの前に、生の Gateway ターゲット解決も出力します。                                                      |

通常の `openclaw status` は高速な読み取り専用パスのままで、メモリ検査をスキップした場合は、メモリを利用不可ではなく
`not checked` としてマークします。重いセキュリティ監査、plugin 互換性、メモリベクタープローブは、
`openclaw status --all`、`openclaw status --deep`、`openclaw security audit`、
`openclaw memory status --deep` に委ねられます。

## セッションとモデルの解決

- セッションステータス出力は `Execution:` と `Runtime:` を分けて表示します。`Execution`
  はサンドボックスパス（`direct`、`docker/*`）で、`Runtime` はそのセッションが
  `OpenClaw Default`、`OpenAI Codex`、CLI バックエンド、または `codex (acp/acpx)` のような ACP バックエンドのいずれを使用しているかを示します。プロバイダー、モデル、ランタイムの違いについては
  [エージェントランタイム](/ja-JP/concepts/agent-runtimes) を参照してください。
- 現在のセッションスナップショットが疎な場合、`/status` は直近のトランスクリプト使用量ログからトークンとキャッシュのカウンターを補完できます。既存の非ゼロのライブ値は、引き続きトランスクリプトのフォールバック値より優先されます。
- ライブセッションエントリにアクティブなランタイムモデルラベルがない場合、トランスクリプトフォールバックでそれを復元することもできます。そのトランスクリプトモデルが選択済みモデルと異なる場合、status は選択済みモデルではなく、復元されたランタイムモデルに対してコンテキストウィンドウを解決します。
- プロンプトサイズの計上では、セッションメタデータがないか小さい場合、トランスクリプトフォールバックはプロンプト向けのより大きい合計を優先するため、カスタムプロバイダーセッションのトークン表示が `0` に潰れません。
- セッションが設定済みのプライマリとは異なるモデルに固定されている場合、status は両方の値、理由（`session override`）、およびヒント `/model default` を出力します。設定済みのプライマリは新規セッションまたは固定されていないセッションに適用されます。既存の固定セッションは、解除されるまでそのセッション選択を維持します。
- 複数のエージェントが設定されている場合、出力にはエージェントごとのセッションストアが含まれます。

## 使用量とクォータ

- `--usage` は正規化されたプロバイダー使用量ウィンドウを `X% left` として出力します。
- MiniMax の生の `usage_percent` / `usagePercent` フィールドは残りクォータであるため、OpenClaw は表示前にそれらを反転します。件数ベースのフィールドがある場合はそれが優先されます。`model_remains` レスポンスはチャットモデルのエントリを優先し、必要に応じてタイムスタンプからウィンドウラベルを導出し、プランラベルにモデル名を含めます。
- モデル価格の更新失敗は、任意の価格警告として表示されます。これは Gateway やチャンネルが異常であることを意味しません。

## 概要と更新ステータス

- 概要には、利用可能な場合、Gateway + node ホストサービスのインストールおよびランタイムステータスに加えて、簡潔な Gateway プロセス稼働時間とホストシステム稼働時間が含まれます。
- 概要には、更新チャンネル + git SHA（ソースチェックアウトの場合）が含まれます。
- 更新情報は概要に表示されます。更新が利用可能な場合、status は `openclaw update` を実行するヒントを出力します（[更新](/ja-JP/install/updating) を参照）。

## シークレット

- 読み取り専用の status サーフェス（`status`、`status --json`、`status --all`）は、可能な場合、対象の設定パスについてサポート対象の SecretRefs を解決します。
- サポート対象チャンネルの SecretRef が設定されているものの、現在のコマンドパスでは利用できない場合、status は読み取り専用のまま、クラッシュする代わりに縮退した出力を報告します。人間向け出力には "configured token unavailable in this command path" のような警告が表示され、JSON 出力には
  `secretDiagnostics` が含まれます。
- コマンドローカルの SecretRef 解決が成功した場合、status は解決済みスナップショットを優先し、最終出力から一時的な「secret unavailable」チャンネルマーカーを消去します。
- `status --all` には、Secrets 概要行と、レポート生成を停止せずにシークレット診断を要約する診断セクション（読みやすさのため切り詰められます）が含まれます。

## メモリ

`status --json --all` は、`plugins.slots.memory` によって選択されたアクティブなメモリ plugin ランタイムからメモリ詳細を報告します。カスタムメモリ plugin は、組み込みの `agents.defaults.memorySearch.enabled` を無効のままにしても、独自のファイル、チャンク、ベクター、FTS 状態を報告できます。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Doctor](/ja-JP/gateway/doctor)
