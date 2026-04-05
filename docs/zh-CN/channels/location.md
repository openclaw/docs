---
read_when:
    - 添加或修改渠道位置解析
    - 在智能体提示或工具中使用位置上下文字段
summary: 入站渠道位置解析（Telegram/WhatsApp/Matrix）和上下文字段
title: 渠道位置解析
x-i18n:
    generated_at: "2026-04-05T08:15:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 10061f0c109240a9e0bcab649b17f03b674e8bdf410debf3669b7b6da8189d96
    source_path: channels/location.md
    workflow: 15
---

# 渠道位置解析

OpenClaw 会将来自聊天渠道的共享位置标准化为：

- 附加到入站正文中的人类可读文本，以及
- 自动回复上下文负载中的结构化字段。

当前支持：

- **Telegram**（位置图钉 + 地点 + 实时位置）
- **WhatsApp**（`locationMessage` + `liveLocationMessage`）
- **Matrix**（带 `geo_uri` 的 `m.location`）

## 文本格式

位置会渲染为不带括号的友好行：

- 图钉：
  - `📍 48.858844, 2.294351 ±12m`
- 命名地点：
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- 实时共享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果渠道包含说明/评论，它会附加在下一行：

```
📍 48.858844, 2.294351 ±12m
Meet here
```

## 上下文字段

当存在位置时，会向 `ctx` 添加以下字段：

- `LocationLat`（number）
- `LocationLon`（number）
- `LocationAccuracy`（number，米；可选）
- `LocationName`（string；可选）
- `LocationAddress`（string；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（boolean）

## 渠道说明

- **Telegram**：地点会映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 会作为说明行附加。
- **Matrix**：`geo_uri` 会被解析为图钉位置；海拔会被忽略，且 `LocationIsLive` 始终为 false。
