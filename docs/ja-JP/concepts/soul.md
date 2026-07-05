---
read_when:
    - エージェントの表現をもっと汎用的でないものにしたい
    - SOUL.md を編集しています
    - 安全性や簡潔さを損なわずに、より強い個性を出したい
summary: SOUL.mdを使って、汎用アシスタントの曖昧な文体ではなく、OpenClawエージェントに実際の声を持たせる
title: SOUL.md パーソナリティガイド
x-i18n:
    generated_at: "2026-07-05T11:18:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` はエージェントの声が宿る場所です。OpenClaw はこれを通常のセッションに注入するため、実際に大きな意味を持ちます。エージェントの話し方が平板、曖昧、企業的に聞こえるなら、たいてい修正すべきなのはこのファイルです。

## SOUL.md に含めるべきもの

エージェントと話したときの印象を変えるものを入れます。トーン、意見、簡潔さ、ユーモア、境界線、デフォルトの率直さの度合いです。

これを人生の物語、変更履歴、セキュリティポリシーの垂れ流し、または行動に影響しない雰囲気だけの壁にしてはいけません。短いほうが長いより優れています。鋭いほうが曖昧より優れています。

## なぜこれが機能するのか

これは OpenAI のプロンプト指針と一致しています。高レベルの振る舞い、トーン、目標、例は、ユーザーターンに埋もれさせるのではなく、優先度の高い指示レイヤーに置くべきであり、プロンプトは一度書いて忘れるのではなく、反復し、固定し、評価するべきです。OpenClaw にとって `SOUL.md` がそのレイヤーです。より良い個性のために強い指示を書き、安定した個性のために簡潔でバージョン管理された状態を保ちます。

OpenAI 参考資料:

- [プロンプトエンジニアリング](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [メッセージロールと指示追従](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty プロンプト

これをエージェントに貼り付けて、`SOUL.md` を書き直させます。

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

## 良い例

良いルール: 立場を持つ、余計な前置きを省く、合うときは面白くする、悪いアイデアは早めに指摘する、深さが本当に役立つ場合を除いて簡潔にする。

悪いルール: 「常にプロフェッショナルさを維持する」、「包括的で思慮深い支援を提供する」、「前向きで支援的な体験を確保する」。それで生まれるのは、ぼんやりした文章です。

## ひとつの警告

個性は雑でよいという許可ではありません。運用ルールは `AGENTS.md` に置き、声、立場、スタイルは `SOUL.md` に置きます。エージェントが共有チャンネル、公開返信、または顧客向けの場で動作する場合、その場に合ったトーンであることを確認してください。鋭いのは良いことです。うっとうしいのは違います。

## 関連

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/ja-JP/concepts/agent-workspace" icon="folder-open">
    OpenClaw がモデルコンテキストに注入するワークスペースファイル。
  </Card>
  <Card title="System prompt" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    `SOUL.md` が OpenClaw と Codex のランタイムコンテキストにどのように合成されるか。
  </Card>
  <Card title="SOUL.md template" href="/ja-JP/reference/templates/SOUL" icon="file-lines">
    個性ファイルのスターターテンプレート。
  </Card>
</CardGroup>
