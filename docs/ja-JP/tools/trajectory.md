---
read_when:
    - エージェントが特定の方法で回答した、失敗した、またはツールを呼び出した理由をデバッグする
    - OpenClaw セッションのサポートバンドルをエクスポートする
    - プロンプトコンテキスト、ツール呼び出し、ランタイムエラー、または使用状況メタデータの調査
    - 軌跡キャプチャの無効化または移動
summary: OpenClaw エージェントセッションのデバッグ用に、機密情報を除去した軌跡バンドルをエクスポートする
title: 軌跡バンドル
x-i18n:
    generated_at: "2026-04-30T05:40:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory キャプチャは、OpenClaw のセッションごとのフライトレコーダーです。各エージェント実行の
構造化されたタイムラインを記録し、その後 `/export-trajectory` が
現在のセッションを編集済みサポートバンドルにパッケージ化します。

次のような質問に答える必要があるときに使用します。

- モデルに送信されたプロンプト、システムプロンプト、ツールは何か。
- どのトランスクリプトメッセージとツール呼び出しがこの回答につながったか。
- 実行はタイムアウト、abort、compact、またはプロバイダーエラーに到達したか。
- どのモデル、plugins、skills、ランタイム設定が有効だったか。
- プロバイダーはどの使用量メタデータとプロンプトキャッシュメタデータを返したか。

ライブ Gateway 問題について広範なサポートレポートを提出する場合は、
[`/diagnostics`](/ja-JP/gateway/diagnostics#chat-command) から開始します。Diagnostics は
サニタイズ済み Gateway バンドルを収集し、OpenAI Codex ハーネスセッションでは、承認後に
Codex フィードバックを OpenAI サーバーへ送信することもできます。セッションごとの詳細なプロンプト、ツール、トランスクリプトの
タイムラインが特に必要な場合は `/export-trajectory` を使用します。

## クイックスタート

アクティブなセッションでこれを送信します。

```text
/export-trajectory
```

エイリアス:

```text
/trajectory
```

OpenClaw はバンドルをワークスペース配下に書き込みます。

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

相対出力ディレクトリ名を選択できます。

```text
/export-trajectory bug-1234
```

カスタムパスは `.openclaw/trajectory-exports/` 内で解決されます。絶対
パスと `~` パスは拒否されます。

Trajectory バンドルには、プロンプト、モデルメッセージ、ツールスキーマ、ツール
結果、ランタイムイベント、ローカルパスが含まれる場合があります。そのため、チャットスラッシュコマンドは
毎回 exec 承認を経由します。バンドルを作成する意図がある場合に一度だけエクスポートを承認し、
allow-all は使用しないでください。グループチャットでは、OpenClaw は
承認プロンプトとエクスポート結果を共有ルームへ trajectory 詳細として投稿する代わりに、オーナーへ非公開で送信します。

ローカル検査やサポートワークフローでは、承認済みコマンド
パスを直接実行することもできます。

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## アクセス

Trajectory エクスポートはオーナーコマンドです。送信者は、そのチャネルの通常のコマンド
認可チェックとオーナーチェックに合格する必要があります。

## 記録される内容

Trajectory キャプチャは、OpenClaw エージェント実行でデフォルトで有効です。

ランタイムイベントには次が含まれます。

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`: ソースモデル、次のモデル、失敗理由/詳細、チェーン位置、fallback が進行したか、成功したか、またはチェーンを使い切ったかを含む
- `model.completed`
- `trace.artifacts`
- `session.ended`

トランスクリプトイベントも、アクティブなセッションブランチから再構築されます。

- ユーザーメッセージ
- アシスタントメッセージ
- ツール呼び出し
- ツール結果
- compactions
- モデル変更
- ラベルとカスタムセッションエントリ

イベントは、次のスキーママーカー付きで JSON Lines として書き込まれます。

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## バンドルファイル

エクスポートされたバンドルには次が含まれる場合があります。

| ファイル              | 内容                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | バンドルスキーマ、ソースファイル、イベント数、生成されたファイル一覧                           |
| `events.jsonl`        | 順序付けられたランタイムとトランスクリプトのタイムライン                                       |
| `session-branch.json` | 編集済みのアクティブなトランスクリプトブランチとセッションヘッダー                             |
| `metadata.json`       | OpenClaw バージョン、OS/ランタイム、モデル、config スナップショット、plugins、skills、プロンプトメタデータ |
| `artifacts.json`      | 最終ステータス、エラー、使用量、プロンプトキャッシュ、compaction 数、アシスタントテキスト、ツールメタデータ |
| `prompts.json`        | 送信されたプロンプトと選択されたプロンプト構築の詳細                                           |
| `system-prompt.txt`   | キャプチャされた場合の最新のコンパイル済みシステムプロンプト                                   |
| `tools.json`          | キャプチャされた場合にモデルへ送信されたツール定義                                             |

`manifest.json` は、そのバンドルに存在するファイルを一覧表示します。セッションが対応するランタイムデータを
キャプチャしていない場合、一部のファイルは省略されます。

## キャプチャ場所

デフォルトでは、ランタイム trajectory イベントはセッションファイルの横に書き込まれます。

```text
<session>.trajectory.jsonl
```

OpenClaw は、セッションの横にベストエフォートのポインターファイルも書き込みます。

```text
<session>.trajectory-path.json
```

`OPENCLAW_TRAJECTORY_DIR` を設定すると、ランタイム trajectory サイドカーを専用
ディレクトリに保存できます。

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

この変数が設定されている場合、OpenClaw はそのディレクトリにセッション id ごとに 1 つの JSONL ファイルを書き込みます。

セッションメンテナンスは、所有するセッションエントリが prune、cap、またはセッションディスク容量によって evict されたときに、
trajectory サイドカーを削除します。セッションディレクトリ外のランタイムファイルは、
ポインターターゲットがそのセッションに属することをまだ証明できる場合にのみ削除されます。

## キャプチャを無効にする

OpenClaw を起動する前に `OPENCLAW_TRAJECTORY=0` を設定します。

```bash
export OPENCLAW_TRAJECTORY=0
```

これにより、ランタイム trajectory キャプチャが無効になります。`/export-trajectory` は引き続き
トランスクリプトブランチをエクスポートできますが、コンパイル済みコンテキスト、
プロバイダー artifacts、プロンプトメタデータなどのランタイム専用ファイルが欠落する場合があります。

## プライバシーと制限

Trajectory バンドルはサポートとデバッグ用に設計されており、公開投稿用ではありません。
OpenClaw はエクスポートファイルを書き込む前に機密値を編集します。

- 認証情報と既知のシークレットに似たペイロードフィールド
- 画像データ
- ローカル状態パス
- `$WORKSPACE_DIR` に置換されたワークスペースパス
- 検出された場合のホームディレクトリパス

エクスポーターは入力サイズも制限します。

- ランタイムサイドカーファイル: 50 MiB
- セッションファイル: 50 MiB
- ランタイムイベント: 200,000
- エクスポートされるイベント合計: 250,000
- 個別のランタイムイベント行は 256 KiB を超えると切り詰められます

チーム外で共有する前にバンドルを確認してください。編集はベストエフォートであり、
すべてのアプリケーション固有シークレットを把握することはできません。

## トラブルシューティング

エクスポートにランタイムイベントがない場合:

- OpenClaw が `OPENCLAW_TRAJECTORY=0` なしで起動されたことを確認する
- `OPENCLAW_TRAJECTORY_DIR` が書き込み可能なディレクトリを指しているか確認する
- セッションで別のメッセージを実行してから、再度エクスポートする
- `manifest.json` の `runtimeEventCount` を検査する

コマンドが出力パスを拒否する場合:

- `bug-1234` のような相対名を使用する
- `/tmp/...` または `~/...` を渡さない
- エクスポートを `.openclaw/trajectory-exports/` 内に保持する

サイズエラーでエクスポートが失敗する場合、セッションまたはサイドカーが
エクスポート安全制限を超えています。新しいセッションを開始するか、より小さな再現をエクスポートしてください。

## 関連

- [Diffs](/ja-JP/tools/diffs)
- [セッション管理](/ja-JP/concepts/session)
- [Exec ツール](/ja-JP/tools/exec)
