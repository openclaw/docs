---
read_when:
    - 新增或修改頻道位置解析
    - 在代理提示或工具中使用位置情境欄位
summary: 傳入頻道位置解析（Telegram、WhatsApp、Matrix、LINE）與上下文字段
title: 通道位置解析
x-i18n:
    generated_at: "2026-07-05T11:02:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3388739af0514238453aefbbf32de9ccdd19240367907a045bfe5e48e95a2ae6
    source_path: channels/location.md
    workflow: 16
---

OpenClaw 會將聊天頻道分享的位置標準化為：

- 附加在傳入本文後方的簡短座標文字，以及
- 自動回覆情境酬載中的結構化欄位。頻道提供的標籤、地址與說明文字/留言會由共用的不受信任中繼資料 JSON 區塊渲染到提示中，而不是內嵌在使用者本文中。

目前支援：

- **LINE**（含標題/地址的位置訊息）
- **Matrix**（含 `geo_uri` 的 `m.location`）
- **Telegram**（位置釘選 + 場所 + 即時位置）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）

## 文字格式

位置會渲染為不含括號的友善行。座標使用六位小數；準確度會四捨五入為整數公尺：

- 釘選：
  - `📍 48.858844, 2.294351 ±12m`
- 具名地點（同一行；名稱/地址只會進入中繼資料區塊）：
  - `📍 48.858844, 2.294351 ±12m`
- 即時分享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果頻道包含標籤、地址或說明文字/留言，會保留在情境酬載中，並在提示中顯示為圍欄式不受信任 JSON（缺少的欄位會省略）：

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

## 情境欄位

存在位置時，這些欄位會加入 `ctx`：

- `LocationLat`（數字）
- `LocationLon`（數字）
- `LocationAccuracy`（數字，公尺；選填）
- `LocationName`（字串；選填）
- `LocationAddress`（字串；選填）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布林值）
- `LocationCaption`（字串；選填）

當頻道未設定明確來源時，OpenClaw 會推斷來源：即時分享會成為 `live`，含名稱或地址的位置會成為 `place`，其他所有位置則為 `pin`。

提示渲染器會將 `LocationName`、`LocationAddress` 和 `LocationCaption` 視為不受信任的中繼資料，並透過與其他頻道情境相同的有界 JSON 路徑序列化。

## 頻道注意事項

- **LINE**：位置訊息 `title`/`address` 會對應到 `LocationName`/`LocationAddress`；沒有即時位置。
- **Matrix**：`geo_uri` 會解析為釘選位置；`u`（不確定性）參數會對應到 `LocationAccuracy`，事件本文會填入 `LocationCaption`，高度會被忽略，且 `LocationIsLive` 一律為 false。
- **Telegram**：場所會對應到 `LocationName`/`LocationAddress`；即時位置會透過 `live_period` 偵測。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 會填入 `LocationCaption`。

## 相關

- [位置命令（節點）](/zh-TW/nodes/location-command)
- [相機擷取](/zh-TW/nodes/camera)
- [媒體理解](/zh-TW/nodes/media-understanding)
