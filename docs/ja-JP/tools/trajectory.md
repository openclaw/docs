---
read_when:
    - agent が特定の応答をした理由、失敗した理由、またはそのようにツールを呼び出した理由をデバッグする場合
    - OpenClaw セッションのサポート bundle をエクスポートする場合
    - prompt context、tool call、runtime error、または使用量 metadata を調査する場合
    - trajectory capture を無効化または移動する場合
summary: OpenClaw agent セッションをデバッグするために、秘匿化済み trajectory bundle をエクスポートする。
title: Trajectory bundle
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:27:00Z"
  model: gpt-5.4
  provider: openai
  source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
  source_path: tools/trajectory.md
  workflow: 15
---

Trajectory capture は OpenClaw のセッションごとのフライトレコーダーです。各 agent 実行の構造化タイムラインを記録し、その後 `/export-trajectory` が現在のセッションを秘匿化済みサポート bundle にまとめます。

次のような問いに答える必要があるときに使ってください:

- どの prompt、system prompt、ツールがモデルに送られたのか？
- どの transcript メッセージと tool call がこの応答につながったのか？
- 実行は timeout、abort、Compaction、または provider error に当たったのか？
- どの model、plugins、Skills、runtime 設定が有効だったのか？
- provider はどの usage と prompt-cache metadata を返したのか？

## クイックスタート

アクティブセッションでこれを送信します:

```text
/export-trajectory
```

エイリアス:

```text
/trajectory
```

OpenClaw は workspace 配下に bundle を書き出します:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

相対出力ディレクトリ名を選ぶこともできます:

```text
/export-trajectory bug-1234
```

custom path は `.openclaw/trajectory-exports/` 内で解決されます。絶対
path と `~` path は拒否されます。

## アクセス

trajectory export は owner command です。送信者は通常の command
認可チェックと、そのチャネルの owner チェックを通過する必要があります。

## 記録される内容

Trajectory capture は OpenClaw agent 実行でデフォルト有効です。

runtime event には次が含まれます:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

transcript event も、アクティブなセッション branch から再構築されます:

- user message
- assistant message
- tool call
- tool result
- compactions
- model changes
- labels と custom session entry

event は JSON Lines で、この schema marker とともに書き出されます:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## bundle ファイル

エクスポートされた bundle には次が含まれる場合があります:

| ファイル              | 内容                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `manifest.json`       | bundle schema、ソースファイル、event 数、生成ファイル一覧                                    |
| `events.jsonl`        | 順序付き runtime / transcript タイムライン                                                   |
| `session-branch.json` | 秘匿化済みアクティブ transcript branch とセッションヘッダー                                  |
| `metadata.json`       | OpenClaw バージョン、OS / runtime、model、config snapshot、plugins、Skills、prompt metadata |
| `artifacts.json`      | 最終 status、errors、usage、prompt cache、Compaction 回数、assistant text、tool metadata    |
| `prompts.json`        | 送信された prompt と選択された prompt 構築詳細                                               |
| `system-prompt.txt`   | キャプチャされている場合、最新のコンパイル済み system prompt                                 |
| `tools.json`          | キャプチャされている場合、モデルに送られた tool 定義                                         |

`manifest.json` には、その bundle に存在するファイルが一覧されます。セッションが対応する runtime データをキャプチャしていない場合、一部ファイルは省略されます。

## capture の場所

デフォルトでは、runtime trajectory event はセッションファイルの隣に書かれます:

```text
<session>.trajectory.jsonl
```

OpenClaw はベストエフォートで、セッションの隣にポインタファイルも書きます:

```text
<session>.trajectory-path.json
```

`OPENCLAW_TRAJECTORY_DIR` を設定すると、runtime trajectory sidecar を
専用ディレクトリに保存できます:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

この変数が設定されている場合、OpenClaw はその
ディレクトリ内に session id ごとに 1 つの JSONL ファイルを書きます。

## capture を無効にする

OpenClaw 起動前に `OPENCLAW_TRAJECTORY=0` を設定します:

```bash
export OPENCLAW_TRAJECTORY=0
```

これにより runtime trajectory capture は無効になります。`/export-trajectory` では
transcript branch は引き続きエクスポートできますが、compiled context、
provider artifacts、prompt metadata のような runtime 専用ファイルは欠ける可能性があります。

## プライバシーと制限

Trajectory bundle はサポートとデバッグ向けに設計されており、公開投稿向けではありません。
OpenClaw は export ファイルを書き出す前に機微な値を秘匿化します:

- 認証情報と、既知の secret らしい payload field
- 画像データ
- ローカル state path
- workspace path（`$WORKSPACE_DIR` に置換）
- 検出できた home directory path

exporter は入力サイズにも上限を設けます:

- runtime sidecar ファイル: 50 MiB
- session ファイル: 50 MiB
- runtime event: 200,000
- エクスポートされる event 総数: 250,000
- 個々の runtime event 行は 256 KiB を超えると切り詰められる

チーム外に共有する前に bundle を確認してください。秘匿化はベストエフォートであり、
アプリケーション固有の secret をすべて把握できるわけではありません。

## トラブルシューティング

`export` に runtime event がない場合:

- OpenClaw が `OPENCLAW_TRAJECTORY=0` なしで起動されていたことを確認する
- `OPENCLAW_TRAJECTORY_DIR` が書き込み可能ディレクトリを指しているか確認する
- セッションでもう 1 通メッセージを実行し、その後もう一度 export する
- `manifest.json` の `runtimeEventCount` を確認する

コマンドが出力 path を拒否する場合:

- `bug-1234` のような相対名を使う
- `/tmp/...` や `~/...` は渡さない
- export は `.openclaw/trajectory-exports/` 内に保つ

サイズエラーで export が失敗する場合は、セッションまたは sidecar が
`export` の安全上限を超えています。新しいセッションを開始するか、より小さい再現例を export してください。

## 関連

- [Diffs](/ja-JP/tools/diffs)
- [Session management](/ja-JP/concepts/session)
- [Exec tool](/ja-JP/tools/exec)
