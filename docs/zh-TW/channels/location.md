---
read_when:
    - 新增或修改頻道位置解析
    - 在代理提示詞或工具中使用位置情境欄位
summary: 傳入頻道位置解析（Telegram/WhatsApp/Matrix）和上下文欄位
title: 通道位置解析
x-i18n:
    generated_at: "2026-04-30T02:47:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 16
---

OpenClaw 會將聊天頻道分享的位置正規化為：

- 附加到傳入本文的簡短座標文字，以及
- 自動回覆情境承載中的結構化欄位。頻道提供的標籤、地址和說明/留言會透過共用的不受信任中繼資料 JSON 區塊轉譯到提示中，而不是內嵌在使用者本文裡。

目前支援：

- **Telegram**（位置圖釘 + 場所 + 即時位置）
- **WhatsApp**（locationMessage + liveLocationMessage）
- **Matrix**（含有 `geo_uri` 的 `m.location`）

## 文字格式

位置會轉譯為不含括號的友善行：

- 圖釘：
  - `📍 48.858844, 2.294351 ±12m`
- 具名地點：
  - `📍 48.858844, 2.294351 ±12m`
- 即時分享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果頻道包含標籤、地址或說明/留言，會保留在情境承載中，並以加上圍欄的不受信任 JSON 顯示在提示中：

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## 情境欄位

當存在位置時，這些欄位會加入 `ctx`：

- `LocationLat`（數字）
- `LocationLon`（數字）
- `LocationAccuracy`（數字，公尺；選用）
- `LocationName`（字串；選用）
- `LocationAddress`（字串；選用）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布林值）
- `LocationCaption`（字串；選用）

提示轉譯器會將 `LocationName`、`LocationAddress` 和 `LocationCaption` 視為不受信任的中繼資料，並透過與其他頻道情境相同的有界 JSON 路徑將它們序列化。

## 頻道附註

- **Telegram**：場所會對應到 `LocationName/LocationAddress`；即時位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 會填入 `LocationCaption`。
- **Matrix**：`geo_uri` 會剖析為圖釘位置；高度會被忽略，且 `LocationIsLive` 一律為 false。

## 相關

- [位置命令（節點）](/zh-TW/nodes/location-command)
- [相機擷取](/zh-TW/nodes/camera)
- [媒體理解](/zh-TW/nodes/media-understanding)
