---
read_when:
    - グループチャットを専用エージェントにルーティングします
    - 1つの長いタスクがすべてのチャットをブロックすることなく、並行作業を進めたい
    - マルチエージェントの運用構成を設計している
sidebarTitle: Specialist lanes
status: active
summary: 共有モデルとツールのキャパシティを圧迫せずに、専門エージェントを並列実行する
title: 並列の専門レーン
x-i18n:
    generated_at: "2026-05-10T19:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

並列の専門レーンにより、1つの Gateway がさまざまなチャットやルームを別々のエージェントへルーティングしながら、ユーザー体験を高速に保てます。要点は、並列性を単なる「エージェントを増やすこと」としてではなく、希少リソースの設計問題として扱うことです。

## 基本原則

専門レーンがスループットを改善するのは、実際のボトルネックに対する競合を減らす場合だけです。

- **セッションロック**: 特定のセッションを変更する実行は、一度に1つだけにする必要があります。
- **グローバルなモデル容量**: 表示されるすべてのチャット実行は、依然としてプロバイダーの制限を共有します。
- **ツール容量**: シェル、ブラウザー、ネットワーク、リポジトリ作業は、モデルターン自体より遅くなることがあります。
- **コンテキスト予算**: 長いトランスクリプトは、以後のすべてのターンを遅くし、焦点をぼやけさせます。
- **所有権の曖昧さ**: 同じ仕事をする重複エージェントは容量を浪費します。

OpenClaw はすでにセッションごとに実行を直列化し、[コマンドキュー](/ja-JP/concepts/queue)を通じてグローバルな並列性を制限しています。専門レーンはその上にポリシーを追加します。どのエージェントがどの作業を所有するか、何をチャットに残すか、何をバックグラウンド作業にするかです。

## 推奨ロールアウト

### フェーズ1: レーン契約 + バックグラウンドの重い作業

すべてのレーンに、ワークスペースとシステムプロンプト内で書面の契約を与えます。

- **目的**: このレーンが所有する作業。
- **非目標**: 試みるのではなく引き継ぐべき作業。
- **チャット予算**: すばやい回答はチャットに残し、長いタスクは短く確認してからバックグラウンドのサブエージェントまたはタスクで実行します。
- **引き継ぎルール**: 別のレーンが作業を所有している場合は、移動先を示し、コンパクトな引き継ぎ要約を提供します。
- **ツールリスクルール**: ジョブを完了できる最小のツールサーフェスを優先します。

これは最も安価なフェーズであり、詰まりの大半を解消します。1つのコーディングジョブがリサーチレーンを極端に遅くすることはなくなり、各チャットは自身のコンテキストをクリーンに保てます。

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

高優先度の作業には、直接/個人チャットと本番運用エージェントを使用します。システムが混雑しているときは、リサーチ、ドラフト作成、バッチコーディングをバックグラウンドタスクへ移します。

### フェーズ3: コーディネーター / トラフィックコントローラー

複数のレーンがアクティブになったら、小さなコーディネーターパターンを追加します。

- アクティブなレーンタスクと所有者を追跡します。
- グループ間の重複リクエストを検出します。
- レーン間で引き継ぎ要約をルーティングします。
- ブロッカー、完了した結果、人間が判断すべき決定だけを表面化します。

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
