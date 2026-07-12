---
read_when:
    - 音声ウェイクワードの動作またはデフォルトの変更
    - ウェイクワードの同期が必要な新しい Node プラットフォームの追加
summary: グローバル音声ウェイクワード（Gateway が管理）と Node 間での同期方法
title: 音声ウェイクアップ
x-i18n:
    generated_at: "2026-07-12T14:40:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

ウェイクワードは、**Gateway が所有する単一のグローバルリスト**です。Node ごとのカスタムリストはありません。どの Node またはアプリ UI からでもリストを編集できます。Gateway は変更を永続化し、接続されているすべてのクライアントへブロードキャストします。

- **macOS**: ローカルの Voice Wake 有効化/無効化トグル。macOS 26+ が必要です。ランタイム/PTT の詳細については、[Voice Wake（macOS）](/ja-JP/platforms/mac/voicewake)を参照してください。
- **iOS**: Settings にあるローカルの Voice Wake 有効化/無効化トグル。
- **Android**: Voice Wake を実装していません。Voice タブでは、ウェイクワードによるトリガーの代わりに手動のマイクキャプチャを使用します。

## ストレージ

ウェイクワードとルーティングルールは Gateway の状態データベースに保存されます。デフォルトは `~/.openclaw/state/openclaw.sqlite`（`OPENCLAW_STATE_DIR` で上書き可能）で、テーブルは `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes` です。従来の `settings/voicewake.json` と `settings/voicewake-routing.json` は、`openclaw doctor --fix` の移行入力としてのみ使用され、ランタイムが読み取ることはありません。

## プロトコル

### トリガーリスト

| メソッド        | パラメーター             | 結果                     |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | なし                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` は入力を正規化します。空白を除去し、空の項目を削除し、トリガーを最大 32 個に制限し、サロゲートペアを分割せずに各トリガーを 64 UTF-16 コード単位に切り詰めます。結果が空の場合は、組み込みのデフォルト（`openclaw`、`claude`、`computer`）にフォールバックします。

### ルーティング（トリガーからターゲットへ）

| メソッド                | パラメーター                         | 結果                                 |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | なし                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

各ルートの `target` は、次のいずれか 1 つだけをサポートします。

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

制限: ルートは最大 32 個、トリガーテキストは最大 64 文字です。ルートのトリガーは、照合と重複検出のために、小文字化、各単語の先頭と末尾にある句読点の除去、空白の集約によって正規化されます（`"Hey, Bot!!"` と `"hey bot"` は一致し、重複として数えられます）。これは、前述のグローバルトリガーリストで使用される単純な空白除去よりも厳格な正規化です。

### イベント

| イベント                    | ペイロード                         |
| --------------------------- | ---------------------------------- |
| `voicewake.changed`         | `{ triggers: string[] }`           |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

どちらも、読み取りスコープを持つすべての WebSocket クライアント（macOS アプリ、WebChat など）と、接続されているすべての Node にブロードキャストされます。また、Node は接続直後に、両方を初期スナップショットとしてプッシュ受信します。

## クライアントの動作

- **macOS**: `voicewake.set`/`voicewake.get` を呼び出し、`voicewake.changed` を監視して他のクライアントとの同期を維持します。
- **iOS**: `voicewake.set`/`voicewake.get` を呼び出し、`voicewake.changed` を監視してローカルのウェイクワード検出の応答性を維持します。
- **Android**: `voiceWake` 機能を公開せず、ウェイクワードの更新も使用しません。

## 関連項目

- [トークモード](/ja-JP/nodes/talk)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)
