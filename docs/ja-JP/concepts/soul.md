---
read_when:
    - エージェントの表現をより汎用的でないものにしたい
    - SOUL.md を編集中です
    - より強い個性を持たせつつ、安全性や簡潔さを損ないたくない
summary: SOUL.md を使用して、OpenClaw エージェントに汎用アシスタントの粗雑な文言ではなく、実際の声を持たせる
title: SOUL.md パーソナリティガイド
x-i18n:
    generated_at: "2026-06-27T11:17:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` は、エージェントの声が宿る場所です。

OpenClaw は通常のセッションでこれを注入するため、実際に大きな重みがあります。エージェントの話し方が味気ない、歯切れが悪い、妙に企業的に聞こえるなら、たいてい直すべきファイルはこれです。

## SOUL.md に入れるべきもの

エージェントと話したときの感触を変えるものを入れます。

- トーン
- 意見
- 簡潔さ
- ユーモア
- 境界線
- デフォルトの率直さの度合い

次のようなものにはしないでください。

- 人生史
- 変更履歴
- セキュリティポリシーの投げ込み
- 行動に影響しない雰囲気だけの巨大な壁

短いものは長いものに勝ちます。鋭いものは曖昧なものに勝ちます。

## なぜこれが機能するのか

これは OpenAI のプロンプト指針と一致しています。

- プロンプトエンジニアリングガイドでは、高レベルの振る舞い、トーン、目標、例は高優先度の指示レイヤーに置くべきであり、ユーザーターンに埋もれさせるべきではないとしています。
- 同じガイドでは、プロンプトを一度書いて忘れる魔法の文章ではなく、反復し、固定し、評価するものとして扱うことを推奨しています。

OpenClaw にとって、`SOUL.md` がそのレイヤーです。

より良い個性が欲しいなら、より強い指示を書いてください。安定した個性が欲しいなら、簡潔に保ち、バージョン管理してください。

OpenAI 参照:

- [プロンプトエンジニアリング](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [メッセージロールと指示への追従](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty プロンプト

これをエージェントに貼り付け、`SOUL.md` を書き直させます。

OpenClaw ワークスペースではパスは固定です。`http://SOUL.md` ではなく `SOUL.md` を使います。

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

良い `SOUL.md` のルールは次のように聞こえます。

- 見解を持つ
- つなぎ言葉を省く
- 合うときは面白くする
- 悪いアイデアは早めに指摘する
- 深さが本当に役立つ場合を除き、簡潔に保つ

悪い `SOUL.md` のルールは次のように聞こえます。

- 常にプロフェッショナリズムを維持する
- 包括的で思慮深い支援を提供する
- 前向きで支援的な体験を確保する

その2つ目のリストこそが、ぐずぐずの応答を生みます。

## 1つの警告

個性は雑でよいという許可ではありません。

運用ルールは `AGENTS.md` に置いてください。声、姿勢、スタイルは `SOUL.md` に置いてください。エージェントが共有チャンネル、公開返信、顧客向けの場所で動作するなら、そのトーンが場に合っていることを確認してください。

鋭いのは良いことです。うっとうしいのは違います。

## 関連

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/ja-JP/concepts/agent-workspace" icon="folder-open">
    OpenClaw がモデルコンテキストに注入するワークスペースファイル。
  </Card>
  <Card title="System prompt" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    `SOUL.md` が OpenClaw と Codex のランタイムコンテキストにどのように組み込まれるか。
  </Card>
  <Card title="SOUL.md template" href="/ja-JP/reference/templates/SOUL" icon="file-lines">
    個性ファイルのスターターテンプレート。
  </Card>
</CardGroup>
