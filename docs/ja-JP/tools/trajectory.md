---
read_when:
    - エージェントが特定の方法で回答した、失敗した、またはツールを呼び出した理由をデバッグする
    - OpenClaw セッションのサポートバンドルをエクスポートする
    - プロンプトコンテキスト、ツール呼び出し、ランタイムエラー、または使用状況メタデータの調査
    - 軌跡キャプチャの無効化または移動
summary: OpenClaw エージェントセッションのデバッグ用に、編集済みの軌跡バンドルをエクスポートする
title: 軌跡バンドル
x-i18n:
    generated_at: "2026-07-05T11:53:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08cd5d28c203d5b50212be917507fe9b5a1f5eefd31d6a84dbdc9dfd8d9ed0e1
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture は、OpenClaw のセッションごとのフライトレコーダーです。各エージェント実行の
構造化されたタイムラインを記録し、その後 `/export-trajectory` が現在のセッションを、
以下を含む墨消し済みサポートバンドルとしてパッケージ化します。

- モデルに送信されたプロンプト、システムプロンプト、ツール
- どのトランスクリプトメッセージとツール呼び出しが回答につながったか
- 実行がタイムアウト、中断、compacted、またはプロバイダーエラーに達したかどうか
- どのモデル、Plugin、Skills、ランタイム設定が有効だったか
- プロバイダーが返した使用量とプロンプトキャッシュのメタデータ

広範な Gateway サポートレポートには、代わりに
[`/diagnostics`](/ja-JP/gateway/diagnostics#chat-command) から始めてください。これは
サニタイズ済み Gateway バンドルを収集し、OpenAI Codex ハーネスセッションでは、承認後に Codex
フィードバックを OpenAI に送信できます。セッションごとの詳細なプロンプト、ツール、トランスクリプトのタイムラインが必要な場合は、`/export-trajectory` を使用してください。

## クイックスタート

アクティブなセッションで送信します（エイリアス `/trajectory`）。

```text
/export-trajectory
```

OpenClaw はワークスペース配下にバンドルを書き込みます。

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

上書きするには、相対出力ディレクトリ名を渡します。

```text
/export-trajectory bug-1234
```

名前は `.openclaw/trajectory-exports/` 内で解決されます。絶対パスと
`~` パスは拒否されます。

Trajectory バンドルには、プロンプト、モデルメッセージ、ツールスキーマ、ツール結果、ランタイムイベント、ローカルパスが含まれる可能性があるため、チャットコマンドは常に
exec 承認を通ります。バンドルを作成する意図がある場合に一度だけエクスポートを承認してください。allow-all は使用しないでください。グループチャットでは、OpenClaw は trajectory
の詳細を共有ルームに投稿し返すのではなく、承認プロンプトとエクスポート結果を所有者に非公開で送信します。

ローカルでの確認やサポートワークフローでは、基盤となる CLI コマンドを直接実行します。

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

その他のフラグ: `--output <path>`（`.openclaw/trajectory-exports`
内のディレクトリ名）、`--store <path>`（セッションストアの上書き）、
`--agent <id>`（ストア解決用のエージェント ID）、`--json`（構造化出力）。

## アクセス

Trajectory export は所有者コマンドです。送信者は通常のコマンド認可チェックに加えて、そのチャンネルの所有者チェックを通過する必要があります。

## 記録される内容

Trajectory capture は、OpenClaw エージェント実行でデフォルトで有効です。

ランタイムイベントには以下が含まれます。

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- ソースモデル、次のモデル、失敗理由/詳細、チェーン内の位置、チェーンが進んだか、成功したか、使い尽くされたかを含む `model.fallback_step`
- `model.completed`
- `trace.artifacts`
- `session.ended`

トランスクリプトイベントは、アクティブなセッションブランチから再構築されます。ユーザーメッセージ、アシスタントメッセージ、ツール呼び出し、ツール結果、compactions、モデル変更、ラベル、カスタムセッションエントリが含まれます。

イベントは、次のスキーママーカーを持つ JSON Lines として書き込まれます。

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## バンドルファイル

| ファイル              | 内容                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | バンドルスキーマ、ソースファイル、イベント数、生成されたファイル一覧                           |
| `events.jsonl`        | 順序付けられたランタイムとトランスクリプトのタイムライン                                       |
| `session-branch.json` | 墨消し済みのアクティブなトランスクリプトブランチとセッションヘッダー                           |
| `metadata.json`       | OpenClaw バージョン、OS/ランタイム、モデル、設定スナップショット、Plugin、Skills、プロンプトメタデータ |
| `artifacts.json`      | 最終ステータス、エラー、使用量、プロンプトキャッシュ、compaction 数、アシスタントテキスト、ツールメタデータ |
| `prompts.json`        | 送信されたプロンプトと、選択されたプロンプト構築の詳細                                         |
| `system-prompt.txt`   | キャプチャされた場合の、最新のコンパイル済みシステムプロンプト                                 |
| `tools.json`          | キャプチャされた場合の、モデルに送信されたツール定義                                           |

`manifest.json` は、指定されたバンドルに存在するファイルを一覧表示します。セッションが対応するランタイムデータをキャプチャしていない場合、一部のファイルは省略されます。

## キャプチャ場所

デフォルトでは、ランタイム trajectory イベントはセッションファイルの横に書き込まれます。

```text
<session>.trajectory.jsonl
```

OpenClaw は、セッションの横にベストエフォートのポインターファイルも書き込みます。

```text
<session>.trajectory-path.json
```

代わりに専用ディレクトリへランタイム trajectory サイドカーを保存するには、`OPENCLAW_TRAJECTORY_DIR` を設定します。セッション ID ごとに 1 つの JSONL ファイルが作成されます。

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

セッションメンテナンスは、所有元のセッションエントリがセッションのディスク予算によって prune、cap、または evict されたときに trajectory サイドカーを削除します。セッションディレクトリ外のランタイムファイルは、ポインターターゲットがそのセッションに属することをまだ証明できる場合にのみ削除されます。

## キャプチャを無効化する

```bash
export OPENCLAW_TRAJECTORY=0
```

これは OpenClaw を起動する前に、ランタイム trajectory capture を無効にします。
`/export-trajectory` は引き続きトランスクリプトブランチをエクスポートできますが、コンパイル済みコンテキスト、プロバイダー artifacts、プロンプトメタデータなどのランタイム専用ファイルは欠落する可能性があります。

## フラッシュタイムアウトを調整する

OpenClaw はエージェントのクリーンアップ中にランタイム trajectory サイドカーをフラッシュします。デフォルトのクリーンアップタイムアウトは 10,000 ms です。低速なディスクや大きなストアでは、OpenClaw を起動する前に
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` を設定します。

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

これは、OpenClaw が `openclaw-trajectory-flush` タイムアウトをログに記録して続行するタイミングを制御します。trajectory サイズ上限は変更しません。明示的なタイムアウトを渡さないすべてのエージェントクリーンアップ手順を調整するには、
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS` を設定します。

## プライバシーと制限

Trajectory バンドルはサポートとデバッグ用であり、公開投稿用ではありません。OpenClaw はエクスポートファイルを書き込む前に機密値を墨消しします。

- 認証情報と既知のシークレットらしいペイロードフィールド
- 画像データ
- ローカル状態パス
- `$WORKSPACE_DIR` に置き換えられたワークスペースパス
- 検出された場合のホームディレクトリパス

エクスポーターは入力サイズも制限します。

- ランタイムサイドカーファイル: ライブキャプチャファイルは 10 MiB を上限とするローリングウィンドウで、新しいイベントの領域を確保するため最も古いイベントを削除します。エクスポートは既存のランタイムサイドカーファイルを最大 50 MiB まで受け付けます
- セッションファイル: 50 MiB
- エクスポートごとのランタイムイベント: 200,000
- エクスポートされるイベント合計: 250,000
- 個別のランタイムイベント行は 256 KiB を超えると切り詰められます

チーム外へ共有する前にバンドルを確認してください。墨消しはベストエフォートであり、アプリケーション固有のすべてのシークレットを把握することはできません。

## トラブルシューティング

エクスポートにランタイムイベントがない場合:

- OpenClaw が `OPENCLAW_TRAJECTORY=0` なしで起動されたことを確認する
- `OPENCLAW_TRAJECTORY_DIR` が書き込み可能なディレクトリを指しているか確認する
- セッションで別のメッセージを実行してから、再度エクスポートする
- `manifest.json` の `runtimeEventCount` を確認する

コマンドが出力パスを拒否する場合:

- `bug-1234` のような相対名を使用する
- `/tmp/...` や `~/...` を渡さない
- エクスポートを `.openclaw/trajectory-exports/` 内に保つ

サイズエラーでエクスポートが失敗する場合、セッションまたはサイドカーが上記のエクスポート安全上限を超えています。新しいセッションを開始するか、より小さい再現をエクスポートしてください。

## 関連

- [差分](/ja-JP/tools/diffs)
- [セッション管理](/ja-JP/concepts/session)
- [Exec ツール](/ja-JP/tools/exec)
