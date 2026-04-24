---
read_when:
    - エージェントの話し方をもっと generic でなくしたい場合
    - SOUL.md を編集している場合
    - 安全性や簡潔さを損なわずに、より強い個性を持たせたい場合
summary: SOUL.md を使って、generic assistant sludge ではなく OpenClaw エージェントに本当の声を与える
title: SOUL.md パーソナリティガイド
x-i18n:
    generated_at: "2026-04-24T04:55:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0268ef086f272257c83e2147ec1f4fa7772645cdd93cdf59dd4e661a311830a
    source_path: concepts/soul.md
    workflow: 15
---

`SOUL.md` は、あなたのエージェントの声が宿る場所です。

OpenClaw は通常セッションでこれを注入するため、実際に強い影響があります。エージェントが平板だったり、煮え切らなかったり、妙に企業っぽく聞こえるなら、たいてい直すべきなのはこのファイルです。

## SOUL.md に入れるべきもの

エージェントと話したときの感じ方を変える要素を入れてください:

- トーン
- 意見
- 簡潔さ
- ユーモア
- 境界線
- デフォルトの率直さのレベル

次のようなものには **しないでください**:

- 生い立ちの物語
- 変更履歴
- セキュリティポリシーの羅列
- 行動への影響がない、雰囲気だけの巨大な壁

長いより短いほうがいい。曖昧より鋭いほうがいい。

## なぜこれが効くのか

これは OpenAI のプロンプトガイダンスと一致しています:

- プロンプトエンジニアリングガイドでは、高レベルの振る舞い、トーン、目標、例は、ユーザーターンに埋もれさせるのではなく、高優先度の指示レイヤーに置くべきだとされています。
- 同じガイドでは、プロンプトを「一度書いて忘れる魔法の文章」ではなく、反復し、固定し、評価するものとして扱うことも勧めています。

OpenClaw においては、`SOUL.md` がそのレイヤーです。

より良い個性が欲しいなら、より強い指示を書いてください。安定した個性が欲しいなら、簡潔にしてバージョン管理してください。

OpenAI 参考資料:

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty プロンプト

これをエージェントに貼り付けて、`SOUL.md` を書き直させてください。

OpenClaw workspace 用にパスを固定: `http://SOUL.md` ではなく `SOUL.md` を使います。

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

## 良い状態とは

良い `SOUL.md` のルールは次のように聞こえます:

- 自分の見解を持つ
- 無駄な前置きを省く
- 合うときには面白くする
- 悪いアイデアは早めに指摘する
- 本当に深さが役立つとき以外は簡潔にする

悪い `SOUL.md` のルールは次のように聞こえます:

- 常にプロフェッショナルであること
- 包括的で思慮深い支援を提供すること
- 前向きで支援的な体験を確実に提供すること

後者のリストが、どろどろの無味無臭を生みます。

## ひとつ注意

個性があることは、雑でいいという許可ではありません。

運用ルールは `AGENTS.md` に、声・スタンス・文体は `SOUL.md` に置いてください。エージェントが共有チャネル、公開返信、または顧客向けの場で動作するなら、そのトーンがその場に合っていることも確認してください。

鋭さはいい。でもうるささはよくない。

## 関連ドキュメント

- [Agent workspace](/ja-JP/concepts/agent-workspace)
- [System prompt](/ja-JP/concepts/system-prompt)
- [SOUL.md template](/ja-JP/reference/templates/SOUL)
