---
read_when:
    - 你希望你的智能体听起来不那么泛泛而谈
    - 你正在编辑 SOUL.md
    - 你想要更鲜明的个性，同时不破坏安全性或简洁性
summary: 使用 SOUL.md 让你的 OpenClaw 智能体拥有真正的声音，而不是泛泛的助手式废话
title: SOUL.md 人格指南
x-i18n:
    generated_at: "2026-07-05T11:16:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` 是你的智能体声音所在的位置。OpenClaw 会把它注入普通会话，
所以它确实有分量：如果你的智能体听起来乏味、闪烁其词或像公司话术，
通常就该修这个文件。

## SOUL.md 里应该放什么

放那些会改变智能体对话感受的内容：语气、观点、简洁程度、幽默感、
边界、默认直率程度。

**不要**把它写成人生故事、变更日志、安全政策堆叠，或一整墙没有行为效果的
氛围描述。短胜过长。锐利胜过含糊。

## 为什么这有效

这与 OpenAI 的提示词指导一致：高层行为、语气、目标和示例应该放在高优先级指令层，
而不是埋在用户轮次里；提示词也应该迭代、固定版本并评估，而不是写一次就遗忘。
对于 OpenClaw，`SOUL.md` 就是这一层：写出更强的指令来获得更好的个性，
保持简洁并做版本化，以获得稳定的个性。

OpenAI 参考：

- [提示词工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [消息角色和指令遵循](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示词

把下面内容粘贴给你的智能体，让它重写 `SOUL.md`。

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

## 好的效果是什么样

好的规则：有立场、跳过废话、合适时幽默、尽早指出坏主意，
保持简洁，除非深度真的有用。

坏的规则：“始终保持专业”、“提供全面且周到的帮助”、“确保积极且支持性的体验”。
这就是你得到一团糊的方式。

## 一个警告

个性不是允许马虎。把 `AGENTS.md` 用于操作规则；
把 `SOUL.md` 用于声音、立场和风格。如果你的智能体在共享频道、公开回复或客户界面工作，
确保语气仍然适合场合。锐利是好的。惹人烦不是。

## 相关

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/zh-CN/concepts/agent-workspace" icon="folder-open">
    OpenClaw 注入模型上下文的工作区文件。
  </Card>
  <Card title="System prompt" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    `SOUL.md` 如何被组合进 OpenClaw 和 Codex 运行时上下文。
  </Card>
  <Card title="SOUL.md template" href="/zh-CN/reference/templates/SOUL" icon="file-lines">
    个性文件的起始模板。
  </Card>
</CardGroup>
