---
read_when:
    - 現在のセッションについて、ちょっとした横道の質問をしたい場合
    - クライアント間で BTW の動作を実装またはデバッグしている場合
summary: '`/btw` による一時的な横道の質問'
title: BTW 横道の質問
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:23:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8b74f82356a1ecc38b2a2104b3c4616ef4530d2ce804910b24666c4932169e
    source_path: tools/btw.md
    workflow: 15
---

`/btw` を使うと、**現在のセッション** についてのちょっとした横道の質問を、
その質問を通常の会話履歴にしないまま行えます。

これは Claude Code の `/btw` 挙動を参考にしていますが、OpenClaw の
Gateway とマルチチャンネルアーキテクチャ向けに調整されています。

## 何をするか

次のように送ると:

```text
/btw what changed?
```

OpenClaw は次を行います:

1. 現在のセッションコンテキストをスナップショットする
2. 別の **tool-less** モデル呼び出しを実行する
3. 横道の質問にだけ答える
4. メイン実行には手を触れない
5. BTW の質問や回答を session history に**書き込まない**
6. 回答を通常の assistant message ではなく **live side result** として出す

重要なメンタルモデルは次です:

- 同じセッションコンテキスト
- 別個のワンショット side query
- tool call なし
- 将来コンテキストを汚染しない
- transcript 永続化なし

## しないこと

`/btw` は**次を行いません**:

- 新しい durable session を作る
- 未完了のメインタスクを継続する
- tool や agent tool loop を実行する
- BTW の質問/回答データを transcript history に書き込む
- `chat.history` に現れる
- reload をまたいで残る

意図的に **ephemeral** です。

## コンテキストの仕組み

BTW は、現在のセッションを **背景コンテキストのみ** として使います。

メイン実行が現在アクティブな場合、OpenClaw は現在のメッセージ
状態をスナップショットし、進行中のメイン prompt を背景コンテキストとして含めつつ、
明示的にモデルへ次を伝えます:

- 横道の質問にだけ答えること
- 未完了のメインタスクを再開または完了しないこと
- tool call や擬似 tool call を出さないこと

これにより、BTW はメイン実行から分離されたまま、そのセッションが
何についてのものかを理解できます。

## 配信モデル

BTW は **通常の assistant transcript message としては配信されません**。

Gateway protocol レベルでは:

- 通常の assistant chat は `chat` event を使います
- BTW は `chat.side_result` event を使います

この分離は意図的です。もし BTW が通常の `chat` event 経路を再利用したら、
クライアントはそれを通常の会話履歴として扱ってしまいます。

BTW は別個の live event を使い、`chat.history` から replay もされないため、
reload 後には消えます。

## サーフェスごとの挙動

### TUI

TUI では、BTW は現在の session view 内に inline でレンダリングされますが、
引き続き ephemeral です:

- 通常の assistant reply とは視覚的に区別される
- `Enter` または `Esc` で dismiss できる
- reload 時に replay されない

### 外部チャンネル

Telegram、WhatsApp、Discord のようなチャンネルでは、BTW は
ローカルの ephemeral overlay 概念がないため、
明確にラベル付けされた単発の reply として配信されます。

それでも、回答は通常の session history ではなく side result として扱われます。

### Control UI / web

Gateway は BTW を `chat.side_result` として正しく出力し、BTW は `chat.history` に含まれないため、
永続化契約はすでに web 用としても正しいです。

現在の Control UI には、ブラウザで BTW を live 表示するための専用 `chat.side_result` consumer がまだ必要です。そのクライアント側サポートが入るまでは、BTW は Gateway レベルでは
完全な TUI と外部チャンネル挙動を持っていますが、ブラウザ UX はまだ完全ではありません。

## BTW を使うべきとき

次のような場合に `/btw` を使ってください:

- 現在の作業についての短い確認
- 長い実行がまだ進行中の間に欲しい事実ベースの横道回答
- 将来の session context の一部になってほしくない一時的な回答

例:

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## BTW を使うべきでないとき

回答を session の将来の作業コンテキストの一部にしたい場合は `/btw` を使わないでください。

その場合は BTW ではなく、メイン session で通常どおり質問してください。

## 関連

- [スラッシュコマンド](/ja-JP/tools/slash-commands)
- [Thinking Levels](/ja-JP/tools/thinking)
- [Session](/ja-JP/concepts/session)
