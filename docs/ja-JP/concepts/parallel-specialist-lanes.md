---
read_when:
    - グループチャットを専用エージェントにルーティングする
    - 1つの長いタスクですべてのチャットがブロックされることなく、並列作業を行いたい場合
    - マルチエージェント運用構成を設計している
sidebarTitle: Specialist lanes
status: active
summary: 共有モデルとツールのキャパシティを圧迫せずに、専門エージェントを並列実行する
title: 並列の専門レーン
x-i18n:
    generated_at: "2026-05-02T20:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

並列の専門レーンにより、1つの Gateway がユーザー体験の速さを保ちながら、異なるチャットやルームを異なるエージェントへルーティングできる。要点は、並列化を単なる「エージェントを増やすこと」ではなく、希少リソースの設計問題として扱うこと。

## 基本原則

専門レーンがスループットを改善するのは、実際のボトルネックの競合を減らす場合だけ。

- **セッションロック**: 特定のセッションを変更する実行は、一度に1つだけにするべき。
- **グローバルモデル容量**: 表示されるすべてのチャット実行は、依然としてプロバイダーの制限を共有する。
- **ツール容量**: シェル、ブラウザー、ネットワーク、リポジトリ作業は、モデルターン自体より遅くなることがある。
- **コンテキスト予算**: 長いトランスクリプトは、以後のすべてのターンを遅くし、焦点をぼやけさせる。
- **所有権の曖昧さ**: 同じ作業をする重複エージェントは容量を浪費する。

OpenClaw はすでにセッションごとに実行を直列化し、[コマンドキュー](/ja-JP/concepts/queue)を通じてグローバルな並列性を制限している。専門レーンはその上にポリシーを追加する。どのエージェントがどの作業を所有するか、何をチャット内に残すか、何をバックグラウンド作業にするかを決める。

## 推奨ロールアウト

### フェーズ1: レーン契約 + バックグラウンドの重い作業

各レーンのワークスペースとシステムプロンプトに、書面の契約を用意する。

- **目的**: このレーンが所有する作業。
- **非目標**: 試行せずに引き継ぐべき作業。
- **チャット予算**: 短い回答はチャット内に残す。長いタスクは簡潔に受け付けたうえで、バックグラウンドのサブエージェントまたはタスクで実行する。
- **引き継ぎルール**: 別のレーンがその作業を所有している場合、どこへ送るべきかを伝え、コンパクトな引き継ぎ要約を提供する。
- **ツールリスクルール**: その作業を実行できる最小のツール面を優先する。

これは最も低コストなフェーズであり、大半の詰まりを解消する。1つのコーディング作業が研究レーンを極端に遅くすることがなくなり、各チャットは自身のコンテキストをきれいに保てる。

### フェーズ2: 優先度と同時実行の制御

各レーンのビジネス価値に合わせて、キューとモデル容量を調整する。

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
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

優先度の高い作業には、直接/個人チャットと本番運用エージェントを使う。システムが混雑しているときは、調査、下書き、バッチコーディングをバックグラウンドタスクへ移す。

### フェーズ3: コーディネーター / トラフィックコントローラー

複数のレーンがアクティブになったら、小さなコーディネーターパターンを追加する。

- アクティブなレーンタスクと所有者を追跡する。
- グループ間の重複リクエストを検出する。
- レーン間で引き継ぎ要約をルーティングする。
- ブロッカー、完了した結果、人間が行う必要のある判断だけを表面化する。

ここから始めてはいけない。レーン契約のないコーディネーターは、混乱を調整するだけになる。

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
