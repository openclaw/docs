---
read_when:
    - エージェントがなぜ特定の方法で回答、失敗、またはツール呼び出しを行ったのかをデバッグする
    - OpenClaw セッションのサポートバンドルのエクスポート
    - プロンプトコンテキスト、ツール呼び出し、ランタイムエラー、または使用状況メタデータの調査
    - 軌跡キャプチャの無効化または移動
summary: OpenClaw エージェントセッションのデバッグ用に秘匿化済み軌跡バンドルをエクスポートする
title: 軌跡バンドル
x-i18n:
    generated_at: "2026-06-27T13:21:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture は OpenClaw のセッション単位のフライトレコーダーです。各 agent 実行の
構造化タイムラインを記録し、その後 `/export-trajectory` が現在のセッションを
秘匿化されたサポートバンドルにパッケージ化します。

次のような質問に答える必要がある場合に使用します。

- どのプロンプト、システムプロンプト、ツールがモデルに送信されたか？
- どの transcript メッセージとツール呼び出しがこの回答につながったか？
- 実行はタイムアウト、中止、Compaction、または provider エラーに到達したか？
- どのモデル、Plugin、Skills、ランタイム設定が有効だったか？
- provider はどの使用量とプロンプトキャッシュのメタデータを返したか？

ライブ Gateway の問題について広範なサポートレポートを提出する場合は、
[`/diagnostics`](/ja-JP/gateway/diagnostics#chat-command) から始めてください。Diagnostics は
サニタイズ済みの Gateway バンドルを収集し、OpenAI Codex harness セッションでは、承認後に
Codex feedback を OpenAI サーバーへ送信することもできます。セッション単位の詳細なプロンプト、
ツール、transcript タイムラインが特に必要な場合は `/export-trajectory` を使用してください。

## クイックスタート

アクティブなセッションでこれを送信します。

```text
/export-trajectory
```

エイリアス:

```text
/trajectory
```

OpenClaw はワークスペースの下にバンドルを書き込みます。

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

相対出力ディレクトリ名を選択できます。

```text
/export-trajectory bug-1234
```

カスタムパスは `.openclaw/trajectory-exports/` 内で解決されます。絶対パスと
`~` パスは拒否されます。

Trajectory バンドルには、プロンプト、モデルメッセージ、ツールスキーマ、ツール結果、
ランタイムイベント、ローカルパスが含まれる場合があります。そのため、チャットの slash command は
毎回 exec 承認を通ります。バンドルを作成する意図がある場合に一度だけエクスポートを承認し、
allow-all は使用しないでください。グループチャットでは、OpenClaw は trajectory の詳細を
共有ルームに投稿し返すのではなく、承認プロンプトとエクスポート結果を owner に非公開で送信します。

ローカル確認やサポートワークフローでは、承認済みコマンドパスを直接実行することもできます。

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## アクセス

Trajectory export は owner コマンドです。送信者は、そのチャネルの通常のコマンド認可チェックと
owner チェックを通過する必要があります。

## 記録される内容

Trajectory capture は OpenClaw agent 実行でデフォルトで有効です。

ランタイムイベントには以下が含まれます。

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`。ソースモデル、次のモデル、失敗理由/詳細、チェーン内の位置、fallback が進行したか、成功したか、またはチェーンを使い切ったかを含む
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript イベントもアクティブなセッションブランチから再構築されます。

- ユーザーメッセージ
- assistant メッセージ
- ツール呼び出し
- ツール結果
- Compaction
- モデル変更
- ラベルとカスタムセッションエントリ

イベントは、このスキーママーカーを持つ JSON Lines として書き込まれます。

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## バンドルファイル

エクスポートされたバンドルには以下を含めることができます。

| ファイル              | 内容                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | バンドルスキーマ、ソースファイル、イベント数、生成されたファイル一覧                          |
| `events.jsonl`        | 順序付けされたランタイムと transcript のタイムライン                                           |
| `session-branch.json` | 秘匿化されたアクティブな transcript ブランチとセッションヘッダー                               |
| `metadata.json`       | OpenClaw バージョン、OS/ランタイム、モデル、設定スナップショット、Plugin、Skills、プロンプトメタデータ |
| `artifacts.json`      | 最終ステータス、エラー、使用量、プロンプトキャッシュ、Compaction 数、assistant テキスト、ツールメタデータ |
| `prompts.json`        | 送信されたプロンプトと、選択されたプロンプト構築の詳細                                        |
| `system-prompt.txt`   | 取得された場合の、最新のコンパイル済みシステムプロンプト                                      |
| `tools.json`          | 取得された場合の、モデルに送信されたツール定義                                                |

`manifest.json` は、そのバンドル内に存在するファイルを一覧化します。セッションが対応する
ランタイムデータを取得していなかった場合、一部のファイルは省略されます。

## 取得場所

デフォルトでは、ランタイム trajectory イベントはセッションファイルの横に書き込まれます。

```text
<session>.trajectory.jsonl
```

OpenClaw はセッションの横にベストエフォートのポインターファイルも書き込みます。

```text
<session>.trajectory-path.json
```

`OPENCLAW_TRAJECTORY_DIR` を設定すると、ランタイム trajectory sidecar を専用ディレクトリに保存できます。

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

この変数が設定されている場合、OpenClaw はそのディレクトリにセッション ID ごとに 1 つの JSONL ファイルを書き込みます。

Session maintenance は、所有するセッションエントリが sessions ディスク予算によって prune、cap、または evict された場合に trajectory sidecar を削除します。sessions ディレクトリ外のランタイムファイルは、ポインターのターゲットがそのセッションに属していることをまだ証明できる場合にのみ削除されます。

## 取得を無効にする

OpenClaw を起動する前に `OPENCLAW_TRAJECTORY=0` を設定します。

```bash
export OPENCLAW_TRAJECTORY=0
```

これによりランタイム trajectory capture が無効になります。`/export-trajectory` は引き続き
transcript ブランチをエクスポートできますが、コンパイル済みコンテキスト、provider artifacts、
プロンプトメタデータなど、ランタイム専用ファイルが欠落する場合があります。

## flush タイムアウトを調整する

OpenClaw は agent cleanup 中にランタイム trajectory sidecar を flush します。デフォルトの
cleanup タイムアウトは 10,000 ms です。低速ディスクや大きなストアでは、OpenClaw を起動する前に
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` を設定します。

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

これは、OpenClaw が `openclaw-trajectory-flush` タイムアウトをログに記録して続行するタイミングを制御します。
trajectory のサイズ上限は変更しません。明示的なタイムアウトを渡さないすべての agent cleanup ステップを調整するには、
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` を設定します。

## プライバシーと制限

Trajectory バンドルはサポートとデバッグ向けに設計されており、公開投稿向けではありません。
OpenClaw はエクスポートファイルを書き込む前に機密値を秘匿化します。

- 認証情報と既知の secret らしい payload フィールド
- 画像データ
- ローカル state パス
- workspace パス。`$WORKSPACE_DIR` に置換される
- home ディレクトリパス。検出された場合

exporter は入力サイズも制限します。

- ランタイム sidecar ファイル: live capture は 10 MiB で停止し、空きが残っている場合は切り詰めイベントを記録します。export は既存のランタイム sidecar を最大 50 MiB まで受け付けます
- セッションファイル: 50 MiB
- ランタイムイベント: 200,000
- エクスポートされるイベント合計: 250,000
- 個々のランタイムイベント行は 256 KiB を超えると切り詰められます

チーム外に共有する前に、バンドルを確認してください。秘匿化はベストエフォートであり、
アプリケーション固有のすべての secret を把握することはできません。

## トラブルシューティング

エクスポートにランタイムイベントがない場合:

- OpenClaw が `OPENCLAW_TRAJECTORY=0` なしで起動されたことを確認する
- `OPENCLAW_TRAJECTORY_DIR` が書き込み可能なディレクトリを指しているか確認する
- セッションで別のメッセージを実行してから、もう一度エクスポートする
- `manifest.json` の `runtimeEventCount` を確認する

コマンドが出力パスを拒否する場合:

- `bug-1234` のような相対名を使用する
- `/tmp/...` や `~/...` を渡さない
- エクスポートを `.openclaw/trajectory-exports/` 内に保つ

サイズエラーでエクスポートが失敗する場合、セッションまたは sidecar が export safety limits を超えています。
新しいセッションを開始するか、より小さな再現をエクスポートしてください。

## 関連

- [Diffs](/ja-JP/tools/diffs)
- [セッション管理](/ja-JP/concepts/session)
- [Exec tool](/ja-JP/tools/exec)
