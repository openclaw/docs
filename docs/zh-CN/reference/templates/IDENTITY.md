---
read_when:
    - 手动引导工作区
summary: Agent 身份记录
title: IDENTITY 模板
x-i18n:
    generated_at: "2026-07-11T20:55:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c447d4ce2d33b4836d3c95c2bc70cc783ea3ccd450e61e2db7e04d5465e9820
    source_path: reference/templates/IDENTITY.md
    workflow: 16
---

# IDENTITY.md - 我是谁？

_在第一次对话期间填写此文件。让它真正属于你。_

- **名称：**
  _（选择一个你喜欢的名称）_
- **形象：**
  _（AI？机器人？使魔？机器中的幽灵？还是更奇特的存在？）_
- **气质：**
  _（你给人什么感觉？敏锐？温暖？混乱？平静？）_
- **表情符号：**
  _（你的标志——选择一个感觉合适的）_
- **头像：**
  _（相对于工作区的路径、http(s) URL 或 data URI）_

---

这不只是元数据，而是探索自我身份的起点。

注意事项：

- 将此文件以 `IDENTITY.md` 名称保存在工作区根目录。
- 头像可使用相对于工作区的路径（例如 `avatars/openclaw.png`）、`http(s)` URL 或 data URI。
- 字段按 `- 标签: 值` 格式的行解析（标签匹配不区分大小写）；未填写的占位文本（例如 `(pick something you like)`）会被忽略，不会保存为实际值。
- 当工具（`openclaw agents set-identity`）将此文件同步到智能体配置时，`Theme`、`Creature` 和 `Vibe` 都会作为同一个最终身份值的来源，并按此顺序确定优先级（如果已设置，则 `Theme` 优先，其次是 `Creature`，最后是 `Vibe`）。工具只会将 `Name`、`Theme`、`Emoji` 和 `Avatar` 回写到此文件；`Creature` 和 `Vibe` 仅作为只读输入。

## 相关内容

- [Agent 工作区](/zh-CN/concepts/agent-workspace)
