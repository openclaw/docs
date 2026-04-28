---
read_when:
- 音声ウェイクワードの動作やデフォルトを変更する
- ウェイクワード同期が必要な新しいnodeプラットフォームを追加する
summary: グローバル音声ウェイクワード（Gateway管理）と、それらがnode間でどのように同期されるか
title: Voice wake
x-i18n:
  generated_at: '2026-04-26T11:35:02Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
  source_path: nodes/voicewake.md
  workflow: 15
---

OpenClawは、**ウェイクワードをGatewayが管理する単一のグローバルリスト** として扱います。

- **nodeごとのカスタムウェイクワードはありません**。
- **どのnode/app UIからでも** リストを編集できます。変更はGatewayに永続化され、全員にブロードキャストされます。
- macOSとiOSは、ローカルの **音声ウェイクの有効/無効** トグルを保持します（ローカルUXと権限が異なるため）。
- Androidは現在、音声ウェイクをオフにしており、Voiceタブで手動マイクフローを使用します。

## 保存場所（Gatewayホスト）

ウェイクワードはgatewayマシン上の次の場所に保存されます。

- `~/.openclaw/settings/voicewake.json`

形式:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## プロトコル

### メソッド

- `voicewake.get` → `{ triggers: string[] }`
- パラメータ `{ triggers: string[] }` を持つ `voicewake.set` → `{ triggers: string[] }`

注意:

- triggersは正規化されます（前後の空白を除去し、空要素を削除）。空リストはデフォルトにフォールバックします。
- 安全のため制限が適用されます（件数/長さの上限）。

### ルーティングメソッド（trigger → target）

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- パラメータ `{ config: VoiceWakeRoutingConfig }` を持つ `voicewake.routing.set` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` の形式:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

route targetは、次のいずれか1つだけをサポートします。

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### イベント

- `voicewake.changed` ペイロード `{ triggers: string[] }`
- `voicewake.routing.changed` ペイロード `{ config: VoiceWakeRoutingConfig }`

受信対象:

- すべてのWebSocketクライアント（macOSアプリ、WebChatなど）
- すべての接続済みnode（iOS/Android）、さらにnode接続時の初期「現在状態」プッシュでも送信されます。

## クライアントの動作

### macOSアプリ

- グローバルリストを使用して `VoiceWakeRuntime` トリガーを制御します。
- Voice Wake設定の「Trigger words」を編集すると `voicewake.set` を呼び出し、その後はブロードキャストに依存して他のクライアントとの同期を保ちます。

### iOS node

- `VoiceWakeManager` のトリガー検出にグローバルリストを使用します。
- SettingsでWake Wordsを編集すると `voicewake.set`（Gateway WS経由）を呼び出し、同時にローカルのウェイクワード検出の応答性も維持します。

### Android node

- 音声ウェイクは現在、Androidランタイム/Settingsでは無効です。
- Android音声は、ウェイクワードトリガーの代わりにVoiceタブで手動マイクキャプチャを使用します。

## 関連

- [Talk mode](/ja-JP/nodes/talk)
- [Audio and voice notes](/ja-JP/nodes/audio)
- [Media understanding](/ja-JP/nodes/media-understanding)
