---
read_when:
    - agent がなぜそのように応答したのか、失敗したのか、またはそのように tool を呼び出したのかをデバッグする場合
    - OpenClaw セッション用のサポート bundle をエクスポートする場合
    - prompt コンテキスト、tool call、ランタイムエラー、または使用量 metadata を調査する場合
    - trajectory capture を無効化または移動する場合
summary: OpenClaw agent セッションをデバッグするために秘匿化済み trajectory bundle をエクスポートする
title: Trajectory Bundles
x-i18n:
    generated_at: "2026-04-23T14:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Trajectory Bundles

trajectory capture は、OpenClaw のセッション単位フライトレコーダーです。各 agent 実行の
構造化タイムラインを記録し、その後 `/export-trajectory` が現在のセッションを
秘匿化済みサポート bundle としてパッケージ化します。

これは次のような疑問に答えたいときに使います:

- どの prompt、system prompt、tools が model に送られたのか？
- どの transcript メッセージと tool call がこの応答につながったのか？
- 実行は timeout、abort、Compaction、または provider error に達したのか？
- どの model、plugins、Skills、ランタイム設定が有効だったのか？
- provider はどの usage と prompt-cache metadata を返したのか？

## クイックスタート

アクティブなセッションでこれを送信します:

```text
/export-trajectory
```

エイリアス:

```text
/trajectory
```

OpenClaw は bundle を workspace 配下に書き出します:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

相対出力ディレクトリ名を選ぶこともできます:

```text
/export-trajectory bug-1234
```

カスタム path は `.openclaw/trajectory-exports/` 内で解決されます。絶対
path と `~` path は拒否されます。

## アクセス

trajectory export は owner コマンドです。送信者は、そのチャンネルに対する通常のコマンド
認可チェックと owner チェックに通る必要があります。

## 記録されるもの

trajectory capture は、OpenClaw agent 実行でデフォルト有効です。

ランタイム event には次が含まれます:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

transcript event も、アクティブなセッション branch から再構築されます:

- user メッセージ
- assistant メッセージ
- tool calls
- tool results
- Compaction
- model 変更
- labels とカスタムセッションエントリ

event は、次の schema marker を持つ JSON Lines として書き込まれます:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## bundle ファイル

エクスポートされた bundle には次が含まれる場合があります:

| ファイル | 内容 |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json` | bundle schema、source files、event 件数、生成ファイル一覧 |
| `events.jsonl` | 順序付きのランタイムおよび transcript タイムライン |
| `session-branch.json` | 秘匿化済みのアクティブ transcript branch と session header |
| `metadata.json` | OpenClaw version、OS/runtime、model、config snapshot、plugins、Skills、prompt metadata |
| `artifacts.json` | 最終 status、errors、usage、prompt cache、Compaction 回数、assistant text、tool metadata |
| `prompts.json` | 送信された prompt と選択された prompt-building 詳細 |
| `system-prompt.txt` | capture されている場合の最新コンパイル済み system prompt |
| `tools.json` | capture されている場合の model に送られた tool 定義 |

`manifest.json` には、その bundle に存在するファイルが一覧化されます。セッションが
対応するランタイムデータを capture していない場合、一部ファイルは省略されます。

## capture の保存場所

デフォルトでは、ランタイム trajectory event は session file の隣に書き込まれます:

```text
<session>.trajectory.jsonl
```

OpenClaw は、session の隣にベストエフォートの pointer file も書き込みます:

```text
<session>.trajectory-path.json
```

ランタイム trajectory sidecar を専用ディレクトリに保存するには、
`OPENCLAW_TRAJECTORY_DIR` を設定します:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

この変数が設定されている場合、OpenClaw はその
ディレクトリ内に session id ごとに 1 つの JSONL file を書き込みます。

## capture を無効化する

OpenClaw 起動前に `OPENCLAW_TRAJECTORY=0` を設定します:

```bash
export OPENCLAW_TRAJECTORY=0
```

これによりランタイム trajectory capture は無効になります。`/export-trajectory` は引き続き
transcript branch をエクスポートできますが、コンパイル済み context、
provider artifacts、prompt metadata のようなランタイム専用ファイルは欠ける場合があります。

## プライバシーと制限

trajectory bundle は、公開投稿用ではなくサポートとデバッグ用に設計されています。
OpenClaw は export file を書く前に機密値を秘匿化します:

- 認証情報と既知の secret らしい payload field
- 画像データ
- ローカル state path
- workspace path（`$WORKSPACE_DIR` に置換）
- 検出された home directory path

exporter は入力サイズにも制限を設けます:

- ランタイム sidecar file: 50 MiB
- session file: 50 MiB
- ランタイム event: 200,000
- 総エクスポート event: 250,000
- 個々のランタイム event 行は 256 KiB を超えると切り詰められる

team 外に共有する前に bundle を確認してください。秘匿化はベストエフォートであり、
アプリケーション固有の secret をすべて把握できるわけではありません。

## トラブルシューティング

export にランタイム event がない場合:

- OpenClaw が `OPENCLAW_TRAJECTORY=0` なしで起動されていることを確認する
- `OPENCLAW_TRAJECTORY_DIR` が書き込み可能ディレクトリを指しているか確認する
- そのセッションで別のメッセージを実行してから、もう一度 export する
- `manifest.json` の `runtimeEventCount` を確認する

コマンドが出力 path を拒否する場合:

- `bug-1234` のような相対名を使用する
- `/tmp/...` や `~/...` は渡さない
- export は `.openclaw/trajectory-exports/` 内に保持する

export がサイズエラーで失敗する場合、そのセッションまたは sidecar が
export 安全制限を超えています。新しいセッションを開始するか、より小さい再現ケースを export してください。
