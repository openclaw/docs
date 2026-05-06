---
read_when:
    - 你希望你的智能体听起来不那么模板化
    - 你正在编辑 SOUL.md
    - 你希望个性更鲜明，同时不损害安全性或简洁性
summary: 使用 SOUL.md，让你的 OpenClaw 智能体拥有真正的声音，而不是泛泛的助手式套话
title: SOUL.md 人格指南
x-i18n:
    generated_at: "2026-05-06T01:42:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` 是你的 agent 声音所在的地方。

OpenClaw 会在普通会话中注入它，所以它有真实的权重。如果你的 agent
听起来平淡、犹豫，或者莫名像公司公文，通常就该修这个文件。

## `SOUL.md` 里应该放什么

放那些会改变和 agent 对话感受的内容：

- 语气
- 观点
- 简洁程度
- 幽默
- 边界
- 默认直率程度

**不要**把它变成：

- 人生故事
- changelog
- 安全策略堆砌
- 一堵没有行为效果的巨大氛围文字墙

短胜过长。鲜明胜过含糊。

## 为什么这有效

这符合 OpenAI 的提示词指南：

- 提示工程指南说，高层行为、语气、目标和
  示例应该放在高优先级指令层，而不是埋在
  用户轮次里。
- 同一份指南建议把提示词当作需要迭代、
  固定和评估的东西，而不是写一次就忘的魔法散文。

对 OpenClaw 来说，`SOUL.md` 就是这一层。

如果你想要更好的个性，就写更强的指令。如果你想要稳定的
个性，就保持它们简洁并版本化。

OpenAI 引用：

- [提示工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [消息角色和指令遵循](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示词

把这段粘贴到你的 agent 里，让它重写 `SOUL.md`。

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

## 好的规则是什么样

好的 `SOUL.md` 规则听起来像这样：

- 有明确观点
- 跳过填充话
- 合适的时候幽默
- 尽早指出糟糕想法
- 保持简洁，除非深度确实有用

糟糕的 `SOUL.md` 规则听起来像这样：

- 始终保持专业
- 提供全面且周到的协助
- 确保积极且支持性的体验

第二个列表就是你得到一团糊的方式。

## 一个警告

有个性不等于可以草率。

把 `AGENTS.md` 用于操作规则。把 `SOUL.md` 用于声音、立场和
风格。如果你的 agent 在共享渠道、公开回复或客户
界面中工作，确保语气仍然适合那个场合。

鲜明是好事。烦人不是。

## 相关

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/zh-CN/concepts/agent-workspace" icon="folder-open">
    OpenClaw 注入到系统提示词中的工作区文件。
  </Card>
  <Card title="System prompt" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    `SOUL.md` 如何被组合进每轮系统提示词。
  </Card>
  <Card title="SOUL.md template" href="/zh-CN/reference/templates/SOUL" icon="file-lines">
    个性文件的起始模板。
  </Card>
</CardGroup>
