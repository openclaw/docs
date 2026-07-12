---
read_when:
    - 新增或修改頻道位置解析
    - 在代理提示詞或工具中使用位置情境欄位
summary: 頻道位置解析與可攜式出站位置承載資料
title: 頻道位置解析
x-i18n:
    generated_at: "2026-07-12T14:18:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw 會將聊天頻道分享的位置正規化為：

- 附加至傳入本文的簡短座標文字，以及
- 自動回覆上下文承載資料中的結構化欄位。頻道提供的標籤、地址及說明文字／留言會透過共用的不受信任中繼資料 JSON 區塊呈現在提示詞中，而不會直接內嵌於使用者本文。

目前支援：

- **LINE**（含標題／地址的位置訊息）
- **Matrix**（含 `geo_uri` 的 `m.location`）
- **Telegram**（位置圖釘、地點及即時位置）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）

## 文字格式

位置會呈現為不含括號且易於閱讀的文字行。座標使用六位小數；精確度則四捨五入至整公尺：

- 圖釘：
  - `📍 48.858844, 2.294351 ±12m`
- 已命名地點（位於同一行；名稱／地址僅會放入中繼資料區塊）：
  - `📍 48.858844, 2.294351 ±12m`
- 即時分享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果頻道包含標籤、地址或說明文字／留言，這些資訊會保留在上下文承載資料中，並在提示詞裡顯示為以程式碼圍欄框住的不受信任 JSON（缺少的欄位會省略）：

````text
位置（不受信任的中繼資料）：
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "艾菲爾鐵塔",
  "address": "巴黎戰神廣場",
  "caption": "在這裡碰面"
}
```
````

## 上下文欄位

當訊息包含位置時，以下欄位會新增至 `ctx`：

- `LocationLat`（數字）
- `LocationLon`（數字）
- `LocationAccuracy`（數字，單位為公尺；選填）
- `LocationName`（字串；選填）
- `LocationAddress`（字串；選填）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布林值）
- `LocationCaption`（字串；選填）

當頻道未明確設定來源時，OpenClaw 會進行推斷：即時分享會設為 `live`，包含名稱或地址的位置會設為 `place`，其他情況則設為 `pin`。

提示詞轉譯器會將 `LocationName`、`LocationAddress` 和 `LocationCaption` 視為不受信任的中繼資料，並透過與其他頻道上下文相同的受限 JSON 路徑進行序列化。

## 傳出承載資料

訊息工具和外掛 SDK 使用相同的 `NormalizedLocation` 結構，提供可攜式的傳出位置資料。僅包含座標的承載資料代表一個圖釘位置。具備原生地點支援的頻道可以將 `name` 加上 `address` 對應至地點卡片。

Telegram 目前透過 `message(action="send")` 提供此功能。其初始實作刻意保持獨立：位置承載資料不能與文字或媒體混合，且地點名稱與地址若不完整，操作會失敗，而不會無聲地捨棄名稱或地址。不支援的頻道不會公開位置參數。

## 頻道注意事項

- **LINE**：位置訊息的 `title`/`address` 會對應至 `LocationName`/`LocationAddress`；不支援即時位置。
- **Matrix**：`geo_uri` 會解析為圖釘位置；`u`（不確定度）參數會對應至 `LocationAccuracy`，事件本文會填入 `LocationCaption`，高度會被忽略，且 `LocationIsLive` 一律為 false。
- **Telegram**：地點會對應至 `LocationName`/`LocationAddress`；即時位置透過 `live_period` 偵測。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 會填入 `LocationCaption`。

## 相關內容

- [位置命令（節點）](/zh-TW/nodes/location-command)
- [相機擷取](/zh-TW/nodes/camera)
- [媒體理解](/zh-TW/nodes/media-understanding)
