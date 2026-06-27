---
read_when:
    - 你希望你的智能体听起来不那么泛泛而谈
    - 你正在编辑 SOUL.md
    - 你想要更鲜明的个性，同时不破坏安全性或简洁性
summary: 使用 SOUL.md 为你的 OpenClaw 智能体赋予真正的声音，而不是泛泛的助手式废话
title: SOUL.md 人格指南
x-i18n:
    generated_at: "2026-06-27T01:54:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` 是你的智能体声音所在的地方。

OpenClaw 会在普通会话中注入它，所以它有真实权重。如果你的智能体听起来平淡、含糊，或者莫名其妙地像企业话术，通常就该修这个文件。

## SOUL.md 里该放什么

放那些会改变和智能体对话感受的内容：

- 语气
- 观点
- 简洁程度
- 幽默感
- 边界
- 默认的直率程度

**不要**把它变成：

- 人生故事
- 更新日志
- 安全策略倾倒
- 一堵巨大但没有行为效果的氛围墙

短胜过长。明确胜过含糊。

## 为什么这有效

这与 OpenAI 的提示词指南一致：

- 提示词工程指南说明，高层级行为、语气、目标和示例应放在高优先级指令层，而不是埋在用户轮次里。
- 同一指南建议把提示词当作需要迭代、固定和评估的东西，而不是写一次就忘掉的神奇散文。

对 OpenClaw 来说，`SOUL.md` 就是这一层。

如果你想要更好的个性，就写更强的指令。如果你想要稳定的个性，就让它们简洁并版本化。

OpenAI 参考：

- [提示词工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [消息角色和指令遵循](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示词

把这段粘贴到你的智能体里，让它重写 `SOUL.md`。

OpenClaw 工作区的路径已固定：使用 `SOUL.md`，不要用 `http://SOUL.md`。

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

## 好的样子

好的 `SOUL.md` 规则听起来像这样：

- 要有立场
- 跳过废话
- 合适的时候保持有趣
- 尽早指出糟糕想法
- 除非深度真的有用，否则保持简洁

糟糕的 `SOUL.md` 规则听起来像这样：

- 始终保持专业
- 提供全面且周到的帮助
- 确保积极且支持性的体验

第二个列表就是你得到一团糊的方式。

## 一个警告

有个性不代表可以草率。

把 `AGENTS.md` 用于操作规则。把 `SOUL.md` 用于声音、立场和风格。如果你的智能体在共享频道、公开回复或客户界面中工作，确保语气仍然适合场合。

犀利是好事。惹人烦不是。

## 相关

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/zh-CN/concepts/agent-workspace" icon="folder-open">
    OpenClaw 注入到模型上下文中的工作区文件。
  </Card>
  <Card title="System prompt" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    `SOUL.md` 如何组合进 OpenClaw 和 Codex runtime 上下文。
  </Card>
  <Card title="SOUL.md template" href="/zh-CN/reference/templates/SOUL" icon="file-lines">
    个性文件的起始模板。
  </Card>
</CardGroup>
