---
read_when:
    - 保存されたトランスクリプト要約をターミナルから読みたい
    - トランスクリプトのMarkdown要約へのパスが必要です
    - コアのトランスクリプト保存レイアウトをデバッグしている
summary: '`openclaw transcripts` のCLIリファレンス（保存されたトランスクリプトの一覧表示、表示、場所の特定）'
title: Transcripts CLI
x-i18n:
    generated_at: "2026-07-05T11:11:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

`transcripts` agent ツールによって書き込まれた transcript 用の読み取り専用インスペクター。
キャプチャ、インポート、要約はこの CLI ではなく、そのツール経由で実行される。

アーティファクトは state ディレクトリ配下に置かれる。

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

デフォルトの state ディレクトリは `~/.openclaw`。`OPENCLAW_STATE_DIR` で上書きできる。
日付ディレクトリはセッション開始時刻から決まり、セッションディレクトリは
セッション ID から派生したファイルシステム安全な slug になる。

## コマンド

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| コマンド                      | 説明                                            |
| ----------------------------- | ----------------------------------------------- |
| `list`                        | 保存済みセッションを一覧表示する。              |
| `show <session>`              | 保存済みの `summary.md` を出力する。            |
| `path <session>`              | `summary.md` のパスを出力する。                 |
| `path <session> --dir`        | セッションディレクトリを出力する。              |
| `path <session> --metadata`   | `metadata.json` を出力する。                    |
| `path <session> --transcript` | `transcript.jsonl` を出力する。                 |
| `--json`                      | 機械可読な出力を表示する（任意のサブコマンド）。|

`<session>` には、裸のセッション ID または日付修飾セレクター
（`YYYY-MM-DD/<session>`）のいずれかを指定できる。同じセッション ID が
複数の日に現れる場合は、たとえば `openclaw transcripts show
2026-05-22/standup` のように修飾形式を使う。デフォルトのセッション ID には
タイムスタンプとランダムなサフィックスが含まれる。固定 ID をセッションに付けるのは、
その ID がその日内で一意になる場合だけにする。

## 出力

`list` はセッションごとに、セレクター、開始時刻、タイトル、
summary パスをタブ区切りで 1 行出力する。

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

セレクターは、`show` または `path` に渡し戻す値として最も安全である。

`list --json` は `sessionId`、`selector`、`date`、`title`、
`startedAt`、`stoppedAt`、`source`、`path`、`summaryPath`、`hasSummary`
を持つオブジェクトを返す。

`show --json` は保存済みのセッションメタデータ、セレクター、セッション
ディレクトリ、summary パス、summary Markdown テキストを返す。

`path --json` は選択されたパスと、そのファイルが存在するかどうかを返す。

## 1 日あたり複数のセッション

セッションは日付ごとにグループ化され、その下でセッション ID ごとに分かれる。1 日に 10 件のミーティングがある場合は、
10 個の兄弟フォルダーになる。

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

自動化にはデフォルトで生成される ID を使う。`standup` のような固定 ID は、
同じ日付で繰り返されない場合だけ使う。

## summary がない場合

ライブセッションは、セッション停止時に `summary.md` を書き込む。インポートされた transcript は、
インポート直後にそれを書き込む。キャプチャがまだアクティブな間、停止中にプロバイダーが失敗した場合、または
発話が届く前にメタデータが書き込まれた場合、summary なしでセッションが `list` に現れることがある。

raw の追記専用 transcript を調べるには `path <session> --transcript` を使うか、
Markdown summary を再生成するには `transcripts` ツールの `summarize` アクションを実行する。

## 設定

キャプチャはオプトインである（ライブソースはミーティング音声に参加して録音できる）。有効にするには、
次を使う。

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled`（デフォルト `false`）: ツールをオンにする。
- `maxUtterances`（デフォルト `2000`、1-10000 にクランプ）: セッションごとの
  発話バッファサイズ。

自動開始ソースは `transcripts.autoStart` で設定する。各エントリーは
存在することで有効になる。そのソースを無効にするにはエントリーを省略する。`discord-voice`
は同梱の自動開始対応ソースで、`guildId` と
`channelId` が必要である。

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
