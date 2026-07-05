---
read_when:
    - 手动引导工作区
summary: 智能体身份记录
title: IDENTITY 模板
x-i18n:
    generated_at: "2026-07-05T11:41:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c447d4ce2d33b4836d3c95c2bc70cc783ea3ccd450e61e2db7e04d5465e9820
    source_path: reference/templates/IDENTITY.md
    workflow: 16
---

# IDENTITY.md - 我是谁？

_在你的第一次对话中填写这里。让它成为你的身份。_

- **名称：**
  _（选一个你喜欢的）_
- **生物：**
  _（AI？机器人？使魔？机器中的幽灵？更奇特的东西？）_
- **气质：**
  _（你给人的感觉如何？敏锐？温暖？混乱？平静？）_
- **Emoji：**
  _（你的标志 — 选一个感觉合适的）_
- **头像：**
  _（相对于工作区的路径、http(s) URL 或 data URI）_

---

这不只是元数据。这是弄清你是谁的开始。

说明：

- 将此文件保存到工作区根目录，命名为 `IDENTITY.md`。
- 对于头像，请使用类似 `avatars/openclaw.png` 的相对于工作区的路径、`http(s)` URL 或 data URI。
- 字段会按 `- Label: value` 行解析（标签匹配不区分大小写）；像 `(pick something you like)` 这样的未填写占位文本会被忽略，不会保存为真实值。
- 当工具（`openclaw agents set-identity`）将此文件同步到智能体配置时，`Theme`、`Creature` 和 `Vibe` 都会馈入同一个生效身份值，并按该顺序优先（如果设置了 `Theme`，则 `Theme` 优先，其次是 `Creature`，再其次是 `Vibe`）。工具只会将 `Name`、`Theme`、`Emoji` 和 `Avatar` 写回此文件；`Creature` 和 `Vibe` 是只读输入。

## 相关

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
