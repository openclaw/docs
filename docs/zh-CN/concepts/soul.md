---
read_when:
    - 你希望你的智能体听起来不那么千篇一律
    - 你正在编辑 SOUL.md
    - 你希望个性更鲜明，同时不牺牲安全性或简洁性
summary: 使用 SOUL.md 赋予你的 OpenClaw 智能体真正的个性化表达，而不是千篇一律的助手套话
title: SOUL.md 个性指南
x-i18n:
    generated_at: "2026-07-11T20:29:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` 是你的智能体声音所在之处。OpenClaw 会将它注入普通会话，因此它确实举足轻重：如果你的智能体听起来平淡、含糊或官腔十足，通常就该修改这个文件。

## `SOUL.md` 中应该包含什么

放入那些会改变与智能体交谈感受的内容：语气、观点、简洁程度、幽默感、边界，以及默认的直率程度。

**不要**把它写成人生故事、变更日志、安全策略汇总，或一堵对行为毫无影响的氛围文字墙。短胜于长，明确胜于含糊。

## 为什么这样有效

这与 OpenAI 的提示词指南一致：高层级的行为、语气、目标和示例应放在高优先级指令层中，而不是埋在用户消息里；提示词也应该持续迭代、固定版本并接受评估，而不是写完一次便抛诸脑后。对 OpenClaw 而言，`SOUL.md` 就是这一层：用更有力的指令塑造更鲜明的个性，同时保持简洁并进行版本管理，以维持稳定的个性。

OpenAI 参考资料：

- [提示工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [消息角色与指令遵循](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示词

将以下内容粘贴给你的智能体，让它重写 `SOUL.md`。

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

## 好的效果是什么样的

好的规则：有明确立场、省去废话、适合时展现幽默、尽早指出糟糕的想法，并且保持简洁，除非深入说明确实有用。

糟糕的规则：“始终保持专业”“提供全面且周到的帮助”“确保积极且支持性的体验”。这样只会得到一团软绵绵的废话。

## 一项警告

有个性并不意味着可以马虎。将操作规则放在 `AGENTS.md` 中；将声音、立场和风格放在 `SOUL.md` 中。如果你的智能体会在共享渠道、公开回复或面向客户的界面中工作，请确保语气仍然符合场合。犀利很好，惹人厌则不然。

## 相关内容

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/zh-CN/concepts/agent-workspace" icon="folder-open">
    OpenClaw 注入模型上下文的工作区文件。
  </Card>
  <Card title="System prompt" href="/zh-CN/concepts/system-prompt" icon="message-lines">
    `SOUL.md` 如何被组合进 OpenClaw 和 Codex 运行时上下文。
  </Card>
  <Card title="SOUL.md template" href="/zh-CN/reference/templates/SOUL" icon="file-lines">
    个性文件的入门模板。
  </Card>
</CardGroup>
