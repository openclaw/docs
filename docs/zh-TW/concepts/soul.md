---
read_when:
    - 你希望你的代理程式聽起來不那麼制式
    - 您正在編輯 SOUL.md
    - 你想要更鮮明的個性，同時不破壞安全性或簡潔性
summary: 使用 SOUL.md 讓你的 OpenClaw 代理程式擁有真正的語氣，而不是一般助理式的含糊內容
title: SOUL.md 人格指南
x-i18n:
    generated_at: "2026-06-27T19:15:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` 是你的 agent 聲音所在之處。

OpenClaw 會在一般工作階段注入它，所以它確實有分量。如果你的 agent
聽起來乏味、含糊，或莫名其妙地像企業公文，通常該修的就是這個檔案。

## SOUL.md 應該放什麼

放入會改變與 agent 對話感受的東西：

- 語氣
- 觀點
- 簡潔程度
- 幽默
- 界線
- 預設直白程度

**不要**把它變成：

- 人生故事
- 變更日誌
- 安全政策傾倒
- 一大堵沒有行為效果的氛圍文字

短勝過長。銳利勝過模糊。

## 為什麼這有效

這與 OpenAI 的提示指南一致：

- 提示工程指南指出，高層次行為、語氣、目標與範例應放在高優先級指令層，而不是埋在使用者回合中。
- 同一份指南建議把提示當作需要反覆迭代、固定版本並評估的東西，而不是寫一次就忘掉的神奇文字。

對 OpenClaw 來說，`SOUL.md` 就是那一層。

如果你想要更好的個性，就寫更有力的指令。如果你想要穩定的個性，就讓它們保持精簡並版本化。

OpenAI 參考資料：

- [提示工程](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [訊息角色與指令遵循](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示

把這段貼進你的 agent，讓它改寫 `SOUL.md`。

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

- 有立場
- 跳過填充語
- 在合適時幽默
- 及早指出壞主意
- 保持精簡，除非深入內容真的有用

糟糕的 `SOUL.md` 規則聽起來像這樣：

- 始終保持專業
- 提供全面且周到的協助
- 確保正向且支持性的體驗

第二份清單就是讓你得到糊成一團回應的方式。

## 一個警告

個性不是草率的許可。

把 `AGENTS.md` 用於操作規則。把 `SOUL.md` 用於聲音、立場與風格。如果你的 agent
在共享頻道、公開回覆或客戶接觸面工作，請確保語氣仍然適合場合。

銳利是好的。惹人厭不是。

## 相關

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/zh-TW/concepts/agent-workspace" icon="folder-open">
    OpenClaw 注入模型脈絡的工作區檔案。
  </Card>
  <Card title="System prompt" href="/zh-TW/concepts/system-prompt" icon="message-lines">
    `SOUL.md` 如何被組合進 OpenClaw 與 Codex 執行階段脈絡。
  </Card>
  <Card title="SOUL.md template" href="/zh-TW/reference/templates/SOUL" icon="file-lines">
    個性檔案的入門範本。
  </Card>
</CardGroup>
