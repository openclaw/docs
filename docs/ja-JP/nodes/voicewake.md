---
read_when:
    - 音声ウェイクワードの動作またはデフォルトを変更する
    - ウェイクワード同期が必要な新しい Node プラットフォームの追加
summary: グローバル音声ウェイクワード（Gateway 所有）とノード間での同期方法
title: 音声ウェイク
x-i18n:
    generated_at: "2026-07-05T11:34:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ec1980dd69a041e7dfeaa9d74e370e3279b22aa7ed19b72067ee56f3f696899
    source_path: nodes/voicewake.md
    workflow: 16
---

ウェイクワードは **Gateway が所有する 1 つのグローバルリスト** です。Nodeごとのカスタムリストはありません。任意の Node またはアプリ UI がリストを編集できます。Gateway は変更を永続化し、接続中のすべてのクライアントへブロードキャストします。

- **macOS**: ローカルの音声ウェイク有効/無効切り替え。macOS 26+ が必要です。ランタイム/PTT の詳細は [音声ウェイク (macOS)](/ja-JP/platforms/mac/voicewake) を参照してください。
- **iOS**: 設定内のローカル音声ウェイク有効/無効切り替え。
- **Android**: 音声ウェイクはランタイムで強制的に無効化されます。音声タブはウェイクワードトリガーの代わりに手動マイクキャプチャを使用します。

## ストレージ

ウェイクワードとルーティングルールは Gateway 状態データベースに保存されます。デフォルトは `~/.openclaw/state/openclaw.sqlite`（`OPENCLAW_STATE_DIR` で上書き可能）で、テーブルは `voicewake_triggers`、`voicewake_routing_config`、`voicewake_routing_routes` です。レガシーの `settings/voicewake.json` と `settings/voicewake-routing.json` は `openclaw doctor --fix` の移行入力専用です。ランタイムがそれらを読み取ることはありません。

## プロトコル

### トリガーリスト

| メソッド        | パラメーター             | 結果                     |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | なし                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` は入力を正規化します。空白をトリムし、空の項目を削除し、トリガーを最大 32 個まで保持し、それぞれを 64 文字に切り詰めます。結果が空の場合は組み込みのデフォルト（`openclaw`、`claude`、`computer`）にフォールバックします。

### ルーティング（トリガーからターゲットへ）

| メソッド                | パラメーター                       | 結果                                 |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| `voicewake.routing.get` | なし                               | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

各ルートの `target` は、次のうち正確に 1 つをサポートします。

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

制限: ルートは最大 32 個、トリガーテキストは最大 64 文字です。ルートトリガーは、照合と重複検出のために、小文字化、各単語の先頭/末尾の句読点の削除、空白の折りたたみによって正規化されます（`"Hey, Bot!!"` と `"hey bot"` は一致し、重複として数えられます）。これは、上記のグローバルトリガーリストで使われる単純なトリムよりも厳密な正規化です。

### イベント

| イベント                    | ペイロード                           |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

どちらも読み取りスコープを持つすべての WebSocket クライアント（macOS アプリ、WebChat など）と、接続中のすべての Node にブロードキャストされます。Node は接続直後にも、初期スナップショットのプッシュとして両方を受け取ります。

## クライアントの動作

- **macOS**: `voicewake.set`/`voicewake.get` を呼び出し、他のクライアントと同期を保つために `voicewake.changed` をリッスンします。
- **iOS**: `voicewake.set`/`voicewake.get` を呼び出し、ローカルのウェイクワード検出の応答性を保つために `voicewake.changed` をリッスンします。
- **Android**: `VoiceWakeMode`（`Off`/`Foreground`/`Always`）と Gateway 同期コードは存在しますが、アプリは起動時にモードを `Off` に強制します。音声ウェイクは現在 Android 設定から利用できません。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)
