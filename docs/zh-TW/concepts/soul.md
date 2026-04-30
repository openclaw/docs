---
read_when:
    - 你想讓你的代理聽起來不那麼制式
    - 你正在編輯 SOUL.md
    - 你想要更鮮明的個性，同時不影響安全性或簡潔性
summary: 使用 SOUL.md，讓你的 OpenClaw 代理擁有真正的語氣，而不是泛泛的助手式套話
title: SOUL.md 個性指南
x-i18n:
    generated_at: "2026-04-30T03:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` 是你的代理程式聲音所在之處。

OpenClaw 會在一般工作階段注入它，所以它具有實際影響力。如果你的代理程式
聽起來平淡、閃爍其詞，或莫名像企業公關，通常該修的就是這個檔案。

## SOUL.md 裡該放什麼

放入會改變和代理程式對話感受的內容：

- 語氣
- 觀點
- 簡潔程度
- 幽默感
- 界線
- 預設直白程度

**不要**把它變成：

- 人生故事
- changelog
- 安全政策傾倒場
- 一大面沒有行為效果的氛圍文字牆

短勝過長。銳利勝過模糊。

## 為什麼這有效

這符合 OpenAI 的提示指南：

- 提示工程指南指出，高層級行為、語氣、目標和
  範例應放在高優先級指令層，而不是埋在
  使用者回合裡。
- 同一份指南建議把提示視為需要反覆調整、
  固定版本並評估的東西，而不是寫一次就忘的魔法散文。

對 OpenClaw 來說，`SOUL.md` 就是那一層。

如果你想要更好的個性，就寫更強的指令。如果你想要穩定的
個性，就保持精簡並納入版本管理。

OpenAI 參考：

- [提示工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [訊息角色與遵循指令](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示

把這段貼進你的代理程式，讓它重寫 `SOUL.md`。

OpenClaw 工作區的路徑已固定：使用 `SOUL.md`，不是 `http://SOUL.md`。

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

好的 `SOUL.md` 規則聽起來像這樣：

- 有自己的看法
- 省略填充語
- 合適時幽默
- 及早指出壞主意
- 除非深度確實有用，否則保持簡潔

不好的 `SOUL.md` 規則聽起來像這樣：

- 始終保持專業
- 提供全面且周到的協助
- 確保正向且支持性的體驗

第二份清單就是你得到一團糊的方式。

## 一個警告

有個性不代表可以草率。

把 `AGENTS.md` 用於操作規則。把 `SOUL.md` 用於聲音、立場和
風格。如果你的代理程式會在共享頻道、公開回覆或客戶
介面中工作，請確保語氣仍然符合場域。

銳利很好。惹人厭不行。

## 相關文件

- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [系統提示](/zh-TW/concepts/system-prompt)
- [SOUL.md 範本](/zh-TW/reference/templates/SOUL)
