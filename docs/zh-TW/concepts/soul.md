---
read_when:
    - 你希望你的代理聽起來不要那麼制式
    - 你正在編輯 SOUL.md
    - 你想要更鮮明的個性，同時不破壞安全性或簡潔性
summary: 使用 SOUL.md 賦予你的 OpenClaw 代理真正的聲音，而不是泛泛的助理套話
title: SOUL.md 人格指南
x-i18n:
    generated_at: "2026-07-05T11:16:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` 是你的代理聲音所在的地方。OpenClaw 會把它注入一般
工作階段，所以它有實際分量：如果你的代理聽起來平淡、閃爍其詞或
官腔，通常就是要修這個檔案。

## SOUL.md 應該放什麼

放入會改變與代理對話感受的內容：語氣、觀點、簡潔度、幽默、界線、
預設直率程度。

**不要**把它變成人生故事、變更記錄、安全政策傾倒，或一堵沒有行為效果的
氛圍牆。短勝於長。銳利勝於模糊。

## 為什麼這有效

這符合 OpenAI 的提示指引：高階行為、語氣、目標和範例應該放在高優先級指令層，
而不是埋在使用者回合中；提示也應該反覆迭代、固定版本並評估，而不是寫一次就忘記。
對 OpenClaw 來說，`SOUL.md` 就是那一層：寫出更有力的指令來塑造更好的個性，
並保持精簡且版本化，以維持穩定的個性。

OpenAI 參考資料：

- [提示工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [訊息角色與指令遵循](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示

把這段貼進你的代理，讓它重寫 `SOUL.md`。

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

## 好的樣子

好的規則：有立場、跳過填充語、合適時幽默、及早指出糟糕想法，
除非深度真的有用，否則保持簡潔。

糟糕的規則：「隨時保持專業」、「提供全面且周到的協助」、
「確保正向且支持性的體驗」。這就是你得到一團糊的方式。

## 一個警告

有個性不等於可以草率。把 `AGENTS.md` 用於操作規則；
把 `SOUL.md` 用於聲音、立場與風格。如果你的代理在共享頻道、
公開回覆或客戶介面中工作，請確保語氣仍然符合場合。
銳利是好事。惹人厭不是。

## 相關

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/zh-TW/concepts/agent-workspace" icon="folder-open">
    OpenClaw 注入模型脈絡的工作區檔案。
  </Card>
  <Card title="System prompt" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    `SOUL.md` 如何組合進 OpenClaw 和 Codex 執行階段脈絡。
  </Card>
  <Card title="SOUL.md template" href="/zh-TW/reference/templates/SOUL" icon="file-lines">
    個性檔案的入門範本。
  </Card>
</CardGroup>
