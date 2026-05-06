---
read_when:
    - エージェントの口調をより汎用的でないものにしたい場合
    - SOUL.mdを編集しています
    - 安全性や簡潔さを損なわずに、より強い個性を持たせたい場合
summary: SOUL.md を使って、OpenClaw エージェントにありがちな汎用アシスタントの文体ではなく、実際の口調を持たせる
title: SOUL.md パーソナリティガイド
x-i18n:
    generated_at: "2026-05-06T05:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2101c0c7a22ab1fe5acfd0d2d413a002326dca380fc6e020a7d77a242d13c3d7
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` は、エージェントの声が宿る場所です。

OpenClaw は通常セッションでこれを注入するため、実際に大きな重みがあります。エージェントの
話し方が平板だったり、曖昧すぎたり、妙に企業的だったりするなら、たいてい修正すべきファイルはこれです。

## SOUL.md に入れるべきもの

エージェントと話したときの感触を変えるものを入れます。

- トーン
- 意見
- 簡潔さ
- ユーモア
- 境界線
- デフォルトの率直さの度合い

これを次のようなものにしてはいけません。

- 人生の物語
- 変更履歴
- セキュリティポリシーの羅列
- 行動への影響がない雰囲気だけの巨大な壁

短いものは長いものに勝ちます。鋭いものは曖昧なものに勝ちます。

## なぜこれが機能するのか

これは OpenAI のプロンプト指針と一致しています。

- プロンプトエンジニアリングガイドでは、高レベルの振る舞い、トーン、目標、例は、
  ユーザーターンに埋めるのではなく、高優先度の指示レイヤーに置くべきだとされています。
- 同じガイドでは、プロンプトを、一度書いて忘れる魔法の文章ではなく、
  反復し、固定し、評価するものとして扱うことを推奨しています。

OpenClaw では、`SOUL.md` がそのレイヤーです。

よりよい人格が欲しいなら、より強い指示を書きます。安定した人格が欲しいなら、
簡潔でバージョン管理された状態を保ちます。

OpenAI 参照:

- [プロンプトエンジニアリング](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [メッセージロールと指示追従](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Moltyプロンプト

これをエージェントに貼り付けて、`SOUL.md` を書き換えさせます。

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

## よい状態とは

よい `SOUL.md` のルールは次のように聞こえます。

- 見解を持つ
- 埋め草を省く
- 合うときは面白くする
- 悪いアイデアは早めに指摘する
- 深さが本当に有用な場合を除き、簡潔に保つ

悪い `SOUL.md` のルールは次のように聞こえます。

- 常にプロフェッショナリズムを維持する
- 包括的で思慮深い支援を提供する
- 前向きで支援的な体験を確保する

2つ目のリストは、ぼんやりしたものを生む方法です。

## 1つの警告

人格は、雑にやってよい許可ではありません。

運用ルールは `AGENTS.md` に置きます。声、姿勢、スタイルは `SOUL.md` に置きます。
エージェントが共有チャンネル、公開返信、顧客向けの場で動作するなら、
そのトーンが場に合っていることを確認します。

鋭いのはよいことです。うっとうしいのは違います。

## 関連

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/ja-JP/concepts/agent-workspace" icon="folder-open">
    OpenClaw がシステムプロンプトに注入するワークスペースファイル。
  </Card>
  <Card title="System prompt" href="/ja-JP/concepts/system-prompt" icon="message-lines">
    `SOUL.md` がターンごとのシステムプロンプトに合成される仕組み。
  </Card>
  <Card title="SOUL.md template" href="/ja-JP/reference/templates/SOUL" icon="file-lines">
    人格ファイルのスターターテンプレート。
  </Card>
</CardGroup>
