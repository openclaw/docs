---
read_when:
    - 音声ウェイクワードの動作またはデフォルトを変更する
    - ウェイクワード同期が必要な新しいnodeプラットフォームを追加する
summary: Gateway所有のグローバル音声ウェイクワードと、それらがNodes間でどのように同期されるか
title: |-
    音声ウェイクակերպuser to=functions.read in commentary  天天中彩票一等奖 彩票平台招商  彩神争霸电脑版  高频彩大发快三json
    {"path":"docs/help/faq-first-run.md","offset":1,"limit":200}
x-i18n:
    generated_at: "2026-04-24T05:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClawは、**ウェイクワードをGatewayが所有する単一のグローバルリスト**として扱います。

- **nodeごとのカスタムウェイクワードはありません**。
- **任意のnode/アプリUIが** そのリストを編集できます。変更はGatewayによって永続化され、全員にブロードキャストされます。
- macOSとiOSは、ローカルの **Voice Wake 有効/無効** トグルを保持します（ローカルUXと権限が異なるため）。
- Androidは現在、Voice Wakeをオフのままにしており、Voiceタブの手動マイクフローを使います。

## 保存場所（Gateway host）

ウェイクワードはgatewayマシン上の次の場所に保存されます:

- `~/.openclaw/settings/voicewake.json`

形式:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## プロトコル

### メソッド

- `voicewake.get` → `{ triggers: string[] }`
- パラメータ `{ triggers: string[] }` を持つ `voicewake.set` → `{ triggers: string[] }`

注記:

- トリガーは正規化されます（前後空白を除去し、空要素を削除）。空リストはデフォルトにフォールバックします。
- 安全性のため制限が適用されます（件数/長さの上限）。

### イベント

- `voicewake.changed` ペイロード `{ triggers: string[] }`

受信者:

- すべてのWebSocketクライアント（macOSアプリ、WebChat など）
- すべての接続済みnode（iOS/Android）、およびnode接続時の初期「現在状態」プッシュでも送信されます

## クライアント動作

### macOSアプリ

- グローバルリストを使って `VoiceWakeRuntime` のトリガーを制御します。
- Voice Wake設定で「Trigger words」を編集すると `voicewake.set` を呼び出し、その後ブロードキャストにより他のクライアントとの同期を維持します。

### iOS node

- `VoiceWakeManager` のトリガー検出にグローバルリストを使います。
- SettingsでWake Wordsを編集すると、`voicewake.set` を呼び出し（Gateway WS経由）、同時にローカルのウェイクワード検出の応答性も維持します。

### Android node

- Androidランタイム/Settingsでは、Voice Wakeは現在無効です。
- Androidの音声は、ウェイクワードトリガーの代わりにVoiceタブの手動マイクキャプチャを使います。

## 関連

- [Talk mode](/ja-JP/nodes/talk)
- [音声と音声メモ](/ja-JP/nodes/audio)
- [メディア理解](/ja-JP/nodes/media-understanding)
