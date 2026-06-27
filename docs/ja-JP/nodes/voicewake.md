---
read_when:
    - 音声ウェイクワードの動作またはデフォルトの変更
    - ウェイクワード同期が必要な新しいノードプラットフォームの追加
summary: グローバル音声ウェイクワード（Gateway 管理）と、それがノード間で同期される仕組み
title: 音声ウェイク
x-i18n:
    generated_at: "2026-06-27T11:56:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw は、**ウェイクワードを Gateway が所有する単一のグローバルリスト**として扱います。

- **ノードごとのカスタムウェイクワードはありません**。
- **どのノード/アプリ UI でも**リストを編集できます。変更は Gateway によって永続化され、全員へブロードキャストされます。
- macOS と iOS は、ローカルの **Voice Wake 有効/無効**トグルを保持します（ローカル UX と権限が異なるため）。
- Android は現在 Voice Wake をオフのままにし、Voice タブで手動マイクフローを使用します。

## ストレージ（Gateway ホスト）

ウェイクワードとルーティングルールは、Gateway 状態データベースに保存されます。

- `~/.openclaw/state/openclaw.sqlite`

有効なテーブルは次のとおりです。

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

レガシーの `settings/voicewake.json` と `settings/voicewake-routing.json` ファイルは
doctor 移行入力専用です。ランタイムは SQLite テーブルを読み書きします。

## プロトコル

### メソッド

- `voicewake.get` → `{ triggers: string[] }`
- params `{ triggers: string[] }` を指定した `voicewake.set` → `{ triggers: string[] }`

注記:

- トリガーは正規化されます（トリムされ、空値は削除されます）。空のリストはデフォルトにフォールバックします。
- 安全のため、上限（数/長さの上限）が適用されます。

### ルーティングメソッド（トリガー → ターゲット）

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- params `{ config: VoiceWakeRoutingConfig }` を指定した `voicewake.routing.set` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` の形状:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

ルートターゲットは、次のいずれか 1 つだけをサポートします。

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### イベント

- `voicewake.changed` ペイロード `{ triggers: string[] }`
- `voicewake.routing.changed` ペイロード `{ config: VoiceWakeRoutingConfig }`

受信者:

- すべての WebSocket クライアント（macOS アプリ、WebChat など）
- すべての接続済みノード（iOS/Android）。また、ノード接続時には初期の「現在の状態」プッシュとしても送信されます。

## クライアントの挙動

### macOS アプリ

- グローバルリストを使って `VoiceWakeRuntime` トリガーを制御します。
- Voice Wake 設定で「トリガーワード」を編集すると `voicewake.set` が呼び出され、その後はブロードキャストに依存して他のクライアントとの同期を維持します。

### iOS ノード

- グローバルリストを `VoiceWakeManager` のトリガー検出に使用します。
- 設定でウェイクワードを編集すると（Gateway WS 経由で）`voicewake.set` が呼び出され、ローカルのウェイクワード検出の応答性も維持されます。

### Android ノード

- Voice Wake は現在 Android ランタイム/設定で無効化されています。
- Android の音声は、ウェイクワードトリガーの代わりに Voice タブで手動マイクキャプチャを使用します。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)
