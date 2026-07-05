---
read_when:
    - グループチャットを専用エージェントにルーティングする
    - 1つの長いタスクがすべてのチャットをブロックすることなく、並列作業を進めたい
    - マルチエージェント運用セットアップを設計している
sidebarTitle: Specialist lanes
status: active
summary: 共有モデルとツールのキャパシティを圧迫せずに、専門エージェントを並列実行する
title: 並列専門レーン
x-i18n:
    generated_at: "2026-07-05T11:17:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

並列の専門レーンを使うと、1つの Gateway が異なるチャットやルームを
異なるエージェントへルーティングしながら、ユーザー体験を高速に保てます。並列化は
単なる「エージェントを増やす」ことではなく、希少なリソースの設計問題として扱ってください。

## 基本原則

専門レーンがスループットを改善するのは、実際のボトルネックに対する
競合を減らす場合だけです。

- **セッションロック**: あるセッションを変更する実行は、一度に1つだけにする必要があります。
- **グローバルなモデル容量**: 表示されるすべてのチャット実行は、引き続きプロバイダーの制限を共有します。
- **ツール容量**: シェル、ブラウザー、ネットワーク、リポジトリ作業は、モデルのターン自体より遅くなることがあります。
- **コンテキスト予算**: 長いトランスクリプトは、以後のすべてのターンを遅くし、焦点を絞りにくくします。
- **所有権の曖昧さ**: 同じ仕事をする重複エージェントは容量を浪費します。

OpenClaw はすでにセッションごとに実行を直列化し、[コマンドキュー](/ja-JP/concepts/queue)を通じて
グローバルな並列性に上限を設けています。専門レーンはその上にポリシーを追加します。
どのエージェントがどの作業を所有するか、何をチャット内に残すか、何を
バックグラウンド作業にするかを定めます。

## 推奨ロールアウト

### フェーズ1: レーン契約 + 重い作業のバックグラウンド化

各レーンのワークスペースとシステムプロンプトに、書面の契約を用意します。

- **目的**: このレーンが所有する作業。
- **非目標**: 試みるのではなく引き継ぐべき作業。
- **チャット予算**: 素早い回答はチャット内に残し、長いタスクは短く確認してから
  バックグラウンドのサブエージェントまたはタスクで実行します。
- **引き継ぎルール**: 別のレーンが作業を所有している場合、どこへ送るべきかを伝え、
  簡潔な引き継ぎ要約を提供します。
- **ツールリスクルール**: 仕事をこなせる最小のツールサーフェスを優先します。

これは最も低コストなフェーズであり、詰まりの大半を解消します。1つのコーディング作業が
リサーチレーンを重く遅くすることはなくなり、各チャットは自身のコンテキストを
整理された状態に保てます。

### フェーズ2: 優先度と同時実行制御

各レーンのビジネス価値に合わせて、キューとモデル容量を調整します。

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

優先度の高い作業には、直接/個人チャットと production-ops エージェントを使います。
システムが混雑しているときは、リサーチ、下書き、バッチコーディングを
バックグラウンドタスクへ移します。

### フェーズ3: コーディネーター / トラフィックコントローラー

複数のレーンがアクティブになったら、小さなコーディネーターパターンを追加します。

- アクティブなレーンタスクと所有者を追跡します。
- グループ間の重複リクエストを検出します。
- レーン間で引き継ぎ要約をルーティングします。
- ブロッカー、完了した結果、人間が下す必要のある決定だけを表示します。

ここから始めないでください。レーン契約のないコーディネーターは、混乱を調整するだけです。

## 最小レーン契約テンプレート

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## 関連

- [マルチエージェントルーティング](/ja-JP/concepts/multi-agent)
- [コマンドキュー](/ja-JP/concepts/queue)
- [サブエージェント](/ja-JP/tools/subagents)
