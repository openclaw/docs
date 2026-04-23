---
read_when:
    - 添加或修改渠道位置解析
    - 在智能体提示或工具中使用位置上下文字段
summary: 入站渠道位置解析（Telegram/WhatsApp/Matrix）和上下文字段
title: 渠道位置解析
x-i18n:
    generated_at: "2026-04-23T17:06:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a2c9e031a668e8b8a6bd62b7c6b10d71c2192e741a38647e675e33e0f1394ed
    source_path: channels/location.md
    workflow: 15
---

# 渠道位置解析

OpenClaw 会将来自聊天渠道的共享位置信息规范化为：

- 追加到入站正文中的简洁坐标文本，以及
- 自动回复上下文负载中的结构化字段。渠道提供的标签、地址以及说明/评论会通过共享的非可信元数据 JSON 块渲染到提示中，而不是内联到用户正文中。

当前支持：

- **Telegram**（位置图钉 + 地点 + 实时位置）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）
- **Matrix**（带有 `geo_uri` 的 `m.location`）

## 文本格式

位置信息会渲染为不带括号的易读行：

- 图钉：
  - `📍 48.858844, 2.294351 ±12m`
- 已命名地点：
  - `📍 48.858844, 2.294351 ±12m`
- 实时共享：
  - `🛰 实时位置：48.858844, 2.294351 ±12m`

如果渠道包含标签、地址或说明/评论，它会保留在上下文负载中，并在提示中显示为带围栏的非可信 JSON：

````text
位置（非可信元数据）：
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

## 上下文字段

当存在位置信息时，会将以下字段添加到 `ctx` 中：

- `LocationLat`（数字）
- `LocationLon`（数字）
- `LocationAccuracy`（数字，单位为米；可选）
- `LocationName`（字符串；可选）
- `LocationAddress`（字符串；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布尔值）
- `LocationCaption`（字符串；可选）

提示渲染器会将 `LocationName`、`LocationAddress` 和 `LocationCaption` 视为非可信元数据，并通过与其他渠道上下文相同的有界 JSON 路径对其进行序列化。

## 渠道说明

- **Telegram**：地点会映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 会填充 `LocationCaption`。
- **Matrix**：`geo_uri` 会被解析为图钉位置；海拔会被忽略，且 `LocationIsLive` 始终为 false。
