---
read_when:
    - 你希望你的智能体听起来没那么模板化
    - 你正在编辑 SOUL.md
    - 你想要更强的人格风格，同时不破坏安全性或简洁性
summary: 使用 SOUL.md，让你的 OpenClaw 智能体拥有真正的声音，而不是千篇一律的助手腔
title: SOUL.md 人格指南
x-i18n:
    generated_at: "2026-04-05T08:22:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4f73d68bc8ded6b46497a2f63516f9b2753b111e6176ba40b200858a6938fba
    source_path: concepts/soul.md
    workflow: 15
---

# SOUL.md 人格指南

`SOUL.md` 是你智能体声音所在的地方。

OpenClaw 会在普通会话中注入它，所以它确实有分量。如果你的智能体
听起来平淡、过度保守，或者带着一种诡异的企业味，通常就是这个文件需要修。

## 什么内容适合放进 SOUL.md

把那些会改变与智能体对话感受的内容放进去：

- 语气
- 观点
- 简洁程度
- 幽默感
- 边界
- 默认的直接程度

**不要**把它写成：

- 人生故事
- 变更日志
- 一堆安全策略说明
- 一整面只有氛围、没有行为效果的废话墙

短，比长好。准，比空泛好。

## 为什么这有效

这和 OpenAI 的 prompt 指南一致：

- Prompt engineering 指南指出，高层级行为、语气、目标和
  示例应该放在高优先级指令层，而不是埋在用户轮次里。
- 同一份指南也建议把 prompt 当成需要持续迭代、
  固定版本并进行评估的东西，而不是写一次就忘的魔法 prose。

对 OpenClaw 来说，`SOUL.md` 就是这一层。

如果你想要更好的人格风格，就写更有力的指令。如果你想要稳定的
人格风格，就保持简洁并进行版本管理。

OpenAI 参考：

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty prompt

把下面这段粘贴给你的智能体，让它重写 `SOUL.md`。

OpenClaw 工作区的固定路径：使用 `SOUL.md`，不要用 `http://SOUL.md`。

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## 好的样子是什么

好的 `SOUL.md` 规则听起来像这样：

- 要有明确观点
- 跳过废话
- 合适时可以幽默
- 尽早指出糟糕想法
- 保持简洁，除非深入解释确实有用

糟糕的 `SOUL.md` 规则听起来像这样：

- 始终保持专业性
- 提供全面且周到的帮助
- 确保积极且支持性的体验

第二组就是把你带向一团糨糊的方式。

## 一个警告

人格风格不等于可以敷衍。

把操作规则放在 `AGENTS.md`。把声音、立场和
风格放在 `SOUL.md`。如果你的智能体工作在共享渠道、公开回复或面向客户的
场景中，请确保语气仍然适合那个环境。

锋利很好。烦人不行。

## 相关文档

- [智能体工作区](/concepts/agent-workspace)
- [系统 prompt](/concepts/system-prompt)
- [SOUL.md 模板](/reference/templates/SOUL)
