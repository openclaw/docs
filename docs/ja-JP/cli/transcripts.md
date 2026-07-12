---
read_when:
    - ターミナルから保存済みのトランスクリプト要約を読みたい場合
    - トランスクリプトの Markdown サマリーへのパスが必要です
    - コアのトランスクリプト保存レイアウトをデバッグしています
summary: '`openclaw transcripts` の CLI リファレンス（保存済みトランスクリプトの一覧表示、詳細表示、保存場所の特定）'
title: トランスクリプト CLI
x-i18n:
    generated_at: "2026-07-11T22:08:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

`transcripts` エージェントツールによって書き込まれた文字起こしを参照するための読み取り専用インスペクターです。
キャプチャ、インポート、要約は、この CLI ではなく、そのツールを通じて実行します。

成果物は状態ディレクトリの下に保存されます。

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

デフォルトの状態ディレクトリは `~/.openclaw` です。`OPENCLAW_STATE_DIR` で上書きできます。
日付ディレクトリはセッションの開始時刻に基づきます。セッションディレクトリは、
セッション ID から生成された、ファイルシステムで安全に使用できるスラッグです。

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
| `list`                        | 保存されているセッションを一覧表示します。      |
| `show <session>`              | 保存されている `summary.md` を出力します。       |
| `path <session>`              | `summary.md` のパスを出力します。                |
| `path <session> --dir`        | セッションディレクトリを出力します。             |
| `path <session> --metadata`   | `metadata.json` を出力します。                   |
| `path <session> --transcript` | `transcript.jsonl` を出力します。                |
| `--json`                      | 機械可読形式の出力を表示します（全サブコマンド）。 |

`<session>` には、単独のセッション ID または日付付きセレクター
（`YYYY-MM-DD/<session>`）を指定できます。同じセッション ID が複数の日に
存在する場合は、日付付き形式を使用してください。たとえば、`openclaw transcripts show
2026-05-22/standup` のように指定します。デフォルトのセッション ID にはタイムスタンプと
ランダムなサフィックスが含まれます。固定 ID をセッションに指定するのは、その ID が
同じ日付内で一意である場合に限ってください。

## 出力

`list` は、セッションごとにタブ区切りの 1 行を出力します。内容は、セレクター、開始時刻、タイトル、
要約のパスです。

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  週次スタンドアップ  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

`show` または `path` に再度渡す値としては、セレクターが最も安全です。

`list --json` は、`sessionId`、`selector`、`date`、`title`、
`startedAt`、`stoppedAt`、`source`、`path`、`summaryPath`、`hasSummary` を持つオブジェクトを返します。

`show --json` は、保存されているセッションメタデータ、セレクター、セッション
ディレクトリ、要約のパス、および要約の Markdown テキストを返します。

`path --json` は、選択されたパスと、そのファイルが存在するかどうかを返します。

## 1 日あたり複数のセッション

セッションは日付、次にセッション ID でグループ化されます。1 日に 10 件の会議がある場合、
10 個の同階層フォルダーになります。

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

自動化には、デフォルトで生成される ID を使用してください。`standup` のような固定 ID は、
同じ日付に繰り返されない場合に限って使用してください。

## 要約がない場合

ライブセッションは、セッションの停止時に `summary.md` を書き込みます。インポートされた文字起こしは、
インポート直後に書き込みます。キャプチャがまだアクティブな場合、停止中にプロバイダーで障害が発生した場合、
または発話が到着する前にメタデータが書き込まれた場合、セッションが要約なしで `list` に表示されることがあります。

`path <session> --transcript` を使用して、生の追記専用文字起こしを確認するか、
`transcripts` ツールの `summarize` アクションを実行して Markdown
要約を再生成してください。

## 設定

キャプチャはオプトインです（ライブソースが参加して会議の音声を録音できます）。次の設定で
有効にします。

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled`（デフォルトは `false`）：ツールを有効にします。
- `maxUtterances`（デフォルトは `2000`、1～10000 の範囲に制限）：セッションごとの
  発話バッファーサイズです。

自動開始するソースは `transcripts.autoStart` で設定します。各エントリは
存在することで有効になります。そのソースを無効にするには、エントリを省略してください。`discord-voice`
は同梱の自動開始対応ソースであり、`guildId` と
`channelId` が必要です。

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
