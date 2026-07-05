---
read_when:
    - 添加或修改渠道位置解析
    - 在智能体提示词或工具中使用位置上下文字段
summary: 入站渠道位置解析（Telegram、WhatsApp、Matrix、LINE）和上下文字段
title: 渠道位置解析
x-i18n:
    generated_at: "2026-07-05T11:03:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3388739af0514238453aefbbf32de9ccdd19240367907a045bfe5e48e95a2ae6
    source_path: channels/location.md
    workflow: 16
---

OpenClaw 会将聊天渠道中共享的位置规范化为：

- 追加到入站正文中的简短坐标文本，以及
- 自动回复上下文载荷中的结构化字段。渠道提供的标签、地址和标题/评论会由共享的不受信任元数据 JSON 块渲染到提示词中，而不是内联到用户正文中。

当前支持：

- **LINE**（带标题/地址的位置消息）
- **Matrix**（带 `geo_uri` 的 `m.location`）
- **Telegram**（位置图钉 + 场所 + 实时位置）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）

## 文本格式

位置会渲染为不带括号的友好行。坐标使用六位小数；精度四舍五入到整米：

- 固定位置：
  - `📍 48.858844, 2.294351 ±12m`
- 命名地点（同一行；名称/地址只进入元数据块）：
  - `📍 48.858844, 2.294351 ±12m`
- 实时共享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果渠道包含标签、地址或标题/评论，它会保留在上下文载荷中，并在提示词中显示为围栏包裹的不受信任 JSON（字段不存在时会省略）：

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

## 上下文字段

存在位置时，这些字段会添加到 `ctx`：

- `LocationLat`（数字）
- `LocationLon`（数字）
- `LocationAccuracy`（数字，米；可选）
- `LocationName`（字符串；可选）
- `LocationAddress`（字符串；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布尔值）
- `LocationCaption`（字符串；可选）

当渠道未设置显式来源时，OpenClaw 会进行推断：实时共享会变为 `live`，带名称或地址的位置会变为 `place`，其他所有位置都是 `pin`。

提示词渲染器会将 `LocationName`、`LocationAddress` 和 `LocationCaption` 视为不受信任元数据，并通过与其他渠道上下文相同的有界 JSON 路径对它们进行序列化。

## 渠道说明

- **LINE**：位置消息 `title`/`address` 会映射到 `LocationName`/`LocationAddress`；没有实时位置。
- **Matrix**：`geo_uri` 会解析为固定位置；`u`（不确定性）参数会映射到 `LocationAccuracy`，事件正文会填充 `LocationCaption`，海拔会被忽略，并且 `LocationIsLive` 始终为 false。
- **Telegram**：场所会映射到 `LocationName`/`LocationAddress`；实时位置通过 `live_period` 检测。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 会填充 `LocationCaption`。

## 相关内容

- [位置命令（节点）](/zh-CN/nodes/location-command)
- [相机拍摄](/zh-CN/nodes/camera)
- [媒体理解](/zh-CN/nodes/media-understanding)
