---
read_when:
    - 音声ウェイクワードの動作またはデフォルトの変更
    - ウェイクワード同期が必要な新しいノードプラットフォームの追加
summary: グローバル音声ウェイクワード（Gateway 所有）とノード間での同期方法
title: 音声ウェイク
x-i18n:
    generated_at: "2026-05-06T09:06:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw は **ウェイクワードを Gateway が所有する単一のグローバルリスト**として扱います。

- **ノードごとのカスタムウェイクワードはありません**。
- **どのノード/アプリ UI でも**リストを編集できます。変更は Gateway によって永続化され、全員にブロードキャストされます。
- macOS と iOS はローカルの **Voice Wake の有効/無効**トグルを保持します（ローカル UX と権限が異なるため）。
- Android は現在 Voice Wake をオフのままにしており、音声タブで手動マイクフローを使用します。

## ストレージ（Gateway ホスト）

ウェイクワードは Gateway マシン上の次の場所に保存されます。

- `~/.openclaw/settings/voicewake.json`

形式:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## プロトコル

### メソッド

- `voicewake.get` → `{ triggers: string[] }`
- params `{ triggers: string[] }` を指定した `voicewake.set` → `{ triggers: string[] }`

注:

- トリガーは正規化されます（トリムされ、空は削除されます）。空のリストはデフォルトにフォールバックします。
- 安全のため制限が適用されます（数/長さの上限）。

### ルーティングメソッド（トリガー → ターゲット）

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- params `{ config: VoiceWakeRoutingConfig }` を指定した `voicewake.routing.set` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` の形式:

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
- 接続中のすべてのノード（iOS/Android）。また、ノード接続時にも初期の「現在の状態」プッシュとして送信されます。

## クライアントの動作

### macOS アプリ

- グローバルリストを使用して `VoiceWakeRuntime` トリガーを制御します。
- Voice Wake 設定で「トリガーワード」を編集すると `voicewake.set` が呼び出され、その後ブロードキャストによって他のクライアントとの同期が保たれます。

### iOS ノード

- グローバルリストを `VoiceWakeManager` のトリガー検出に使用します。
- 設定でウェイクワードを編集すると（Gateway WS 経由で）`voicewake.set` が呼び出され、ローカルのウェイクワード検出も応答性を保ちます。

### Android ノード

- Voice Wake は現在 Android ランタイム/設定で無効です。
- Android の音声機能は、ウェイクワードトリガーの代わりに音声タブの手動マイクキャプチャを使用します。

## 関連

- [トークモード](/ja-JP/nodes/talk)
- [音声とボイスメモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)
