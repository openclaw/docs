---
read_when:
    - 添加或修改渠道位置解析
    - 在智能体提示词或工具中使用位置上下文字段
summary: 入站渠道位置解析（Telegram/WhatsApp/Matrix）和上下文字段
title: 渠道位置解析
x-i18n:
    generated_at: "2026-04-23T22:55:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw 会将来自聊天渠道的共享位置标准化为：

- 追加到入站消息正文中的简洁坐标文本，以及
- 自动回复上下文载荷中的结构化字段。渠道提供的标签、地址以及标题/评论会通过共享的“不受信任元数据 JSON 块”渲染到提示词中，而不会内联到用户消息正文里。

当前支持：

- **Telegram**（位置图钉 + 地点 + 实时位置）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）
- **Matrix**（带有 `geo_uri` 的 `m.location`）

## 文本格式

位置信息会被渲染为不带括号的友好文本行：

- 图钉：
  - `📍 48.858844, 2.294351 ±12m`
- 命名地点：
  - `📍 48.858844, 2.294351 ±12m`
- 实时共享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果渠道包含标签、地址或标题/评论，它会保留在上下文载荷中，并在提示词里以带围栏的不受信任 JSON 显示：

````text
位置（不受信任元数据）：
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

当存在位置信息时，这些字段会添加到 `ctx` 中：

- `LocationLat`（number）
- `LocationLon`（number）
- `LocationAccuracy`（number，单位为米；可选）
- `LocationName`（string；可选）
- `LocationAddress`（string；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（boolean）
- `LocationCaption`（string；可选）

提示词渲染器会将 `LocationName`、`LocationAddress` 和 `LocationCaption` 视为不受信任元数据，并通过与其他渠道上下文相同的有界 JSON 路径对其进行序列化。

## 渠道说明

- **Telegram**：地点会映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 会填充到 `LocationCaption`。
- **Matrix**：`geo_uri` 会被解析为图钉位置；海拔会被忽略，且 `LocationIsLive` 始终为 false。

## 相关内容

- [位置命令（节点）](/zh-CN/nodes/location-command)
- [相机捕获](/zh-CN/nodes/camera)
- [媒体理解](/zh-CN/nodes/media-understanding)
