---
read_when:
    - チャネルの場所解析の追加または変更
    - エージェントのプロンプトやツールで位置情報コンテキストフィールドを使用する
summary: 受信チャネルの場所解析（Telegram、WhatsApp、Matrix、LINE）とコンテキストフィールド
title: チャネル位置解析
x-i18n:
    generated_at: "2026-07-05T11:04:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3388739af0514238453aefbbf32de9ccdd19240367907a045bfe5e48e95a2ae6
    source_path: channels/location.md
    workflow: 16
---

OpenClaw はチャットチャンネルから共有された場所を次の形式に正規化します。

- 受信本文に追加される簡潔な座標テキスト、および
- 自動返信コンテキストペイロード内の構造化フィールド。チャンネルから提供されるラベル、住所、キャプション/コメントは、ユーザー本文にインラインではなく、共有の信頼されないメタデータ JSON ブロックによってプロンプトにレンダリングされます。

現在サポートされているもの:

- **LINE**（タイトル/住所付きの位置情報メッセージ）
- **Matrix**（`geo_uri` 付きの `m.location`）
- **Telegram**（位置情報ピン + 会場 + ライブ位置情報）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）

## テキスト書式

場所は、角括弧なしの読みやすい行としてレンダリングされます。座標は小数点以下 6 桁を使用し、精度はメートル単位の整数に丸められます。

- ピン:
  - `📍 48.858844, 2.294351 ±12m`
- 名前付きの場所（同じ行。名前/住所はメタデータブロックのみに入ります）:
  - `📍 48.858844, 2.294351 ±12m`
- ライブ共有:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

チャンネルにラベル、住所、キャプション/コメントが含まれる場合、それはコンテキストペイロードに保持され、プロンプト内ではフェンス付きの信頼されない JSON として表示されます（存在しないフィールドは省略されます）。

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## コンテキストフィールド

場所が存在する場合、次のフィールドが `ctx` に追加されます。

- `LocationLat`（数値）
- `LocationLon`（数値）
- `LocationAccuracy`（数値、メートル。任意）
- `LocationName`（文字列。任意）
- `LocationAddress`（文字列。任意）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（真偽値）
- `LocationCaption`（文字列。任意）

チャンネルが明示的なソースを設定しない場合、OpenClaw が推論します。ライブ共有は `live`、名前または住所がある場所は `place`、それ以外はすべて `pin` になります。

プロンプトレンダラーは、`LocationName`、`LocationAddress`、`LocationCaption` を信頼されないメタデータとして扱い、他のチャンネルコンテキストに使用されるものと同じ、境界付き JSON パスを通じてシリアライズします。

## チャンネルの注記

- **LINE**: 位置情報メッセージの `title`/`address` は `LocationName`/`LocationAddress` に対応します。ライブ位置情報はありません。
- **Matrix**: `geo_uri` はピン位置情報として解析されます。`u`（不確実性）パラメーターは `LocationAccuracy` に対応し、イベント本文は `LocationCaption` に設定されます。高度は無視され、`LocationIsLive` は常に false です。
- **Telegram**: 会場は `LocationName`/`LocationAddress` に対応します。ライブ位置情報は `live_period` によって検出されます。
- **WhatsApp**: `locationMessage.comment` と `liveLocationMessage.caption` は `LocationCaption` に設定されます。

## 関連

- [位置情報コマンド（ノード）](/ja-JP/nodes/location-command)
- [カメラキャプチャ](/ja-JP/nodes/camera)
- [メディア理解](/ja-JP/nodes/media-understanding)
