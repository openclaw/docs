---
read_when:
    - 自動 Compaction と /compact を理解したい場合
    - 長いセッションがコンテキスト制限に達する問題をデバッグしている場合
summary: OpenClaw がモデルの制限内に収まるよう長い会話を要約する方法
title: Compaction
x-i18n:
    generated_at: "2026-04-21T04:44:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

すべてのモデルにはコンテキストウィンドウ、つまり処理できるトークン数の上限があります。
会話がその上限に近づくと、OpenClaw は古いメッセージを要約して **Compaction** し、チャットを継続できるようにします。

## 仕組み

1. 古い会話ターンが compact エントリに要約されます。
2. 要約はセッショントランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClaw が履歴を compaction チャンクに分割するとき、assistant のツール呼び出しと対応する `toolResult` エントリを組にしたまま保持します。分割点がツールブロックの途中に来た場合、OpenClaw はその組が一緒に保たれ、現在の未要約の末尾が保持されるように境界を移動します。

会話履歴全体はディスク上に保持されます。Compaction が変更するのは、次のターンでモデルが見る内容だけです。

## 自動 Compaction

自動 Compaction はデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（この場合、OpenClaw は Compaction を実行して再試行します）。典型的なオーバーフローのシグネチャには、`request_too_large`、`context length exceeded`、`input exceeds the maximum number of tokens`、`input token count exceeds the maximum number of input tokens`、`input is too long for the model`、`ollama error: context length exceeded` があります。

<Info>
Compaction の前に、OpenClaw は重要なメモを [memory](/ja-JP/concepts/memory) ファイルに保存するようエージェントに自動でリマインドします。これによりコンテキストの損失を防ぎます。
</Info>

Compaction の動作（モード、対象トークン数など）を設定するには、`openclaw.json` の `agents.defaults.compaction` 設定を使用します。
Compaction の要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。これは `identifierPolicy: "off"` で上書きするか、`identifierPolicy: "custom"` と `identifierInstructions` を使ってカスタムテキストを指定できます。

必要に応じて、`agents.defaults.compaction.model` により Compaction 要約用に別のモデルを指定できます。これは、メインモデルがローカルモデルまたは小型モデルで、Compaction 要約をより高性能なモデルで生成したい場合に便利です。この上書きには任意の `provider/model-id` 文字列を指定できます。

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

これはローカルモデルでも機能します。たとえば、要約専用の 2 つ目の Ollama モデルや、ファインチューニングされた compaction 専門モデルなどです。

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

未設定の場合、Compaction はエージェントのメインモデルを使用します。

## プラグイン可能な compaction プロバイダー

Plugin は plugin API の `registerCompactionProvider()` を通じてカスタム compaction プロバイダーを登録できます。プロバイダーが登録され設定されている場合、OpenClaw は組み込みの LLM パイプラインではなく、そのプロバイダーに要約を委譲します。

登録済みプロバイダーを使用するには、設定でプロバイダー ID を指定します。

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは組み込み経路と同じ compaction 指示および識別子保持ポリシーを受け取り、OpenClaw はプロバイダー出力後も最近のターンおよび分割ターンのサフィックスコンテキストを保持します。プロバイダーが失敗した場合や空の結果を返した場合、OpenClaw は組み込みの LLM 要約にフォールバックします。

## 自動 Compaction（デフォルトでオン）

セッションがモデルのコンテキストウィンドウに近づいた、または超えたとき、OpenClaw は自動 Compaction をトリガーし、compact 化されたコンテキストを使って元のリクエストを再試行することがあります。

表示される内容:

- 詳細モードでは `🧹 Auto-compaction complete`
- `/status` では `🧹 Compactions: <count>`

Compaction の前に、OpenClaw は **silent memory flush** ターンを実行して、永続的なメモをディスクに保存できる場合があります。詳細と設定は [Memory](/ja-JP/concepts/memory) を参照してください。

## 手動 Compaction

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約を誘導する指示を追加することもできます。

```
/compact Focus on the API design decisions
```

## 別のモデルを使用する

デフォルトでは、Compaction はエージェントのメインモデルを使用します。より良い要約のために、より高性能なモデルを使用できます。

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Compaction 通知

デフォルトでは、Compaction は静かに実行されます。Compaction の開始時と完了時に短い通知を表示するには、`notifyUser` を有効にします。

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

有効にすると、各 Compaction 実行の前後でユーザーに短いステータスメッセージが表示されます
（たとえば、「Compacting context...」や「Compaction complete」）。

## Compaction と pruning の違い

|                  | Compaction                    | pruning                         |
| ---------------- | ----------------------------- | -------------------------------- |
| **何をするか**   | 古い会話を要約する            | 古いツール結果を削減する         |
| **保存されるか** | はい（セッショントランスクリプト内） | いいえ（メモリ内のみ、リクエストごと） |
| **対象範囲**     | 会話全体                      | ツール結果のみ                   |

[Session pruning](/ja-JP/concepts/session-pruning) は、要約せずにツール出力を削減する、より軽量な補完機能です。

## トラブルシューティング

**Compaction が頻繁すぎますか？** モデルのコンテキストウィンドウが小さいか、ツール出力が大きい可能性があります。[session pruning](/ja-JP/concepts/session-pruning) を有効にしてみてください。

**Compaction 後にコンテキストが古く感じますか？** `/compact Focus on <topic>` を使って要約を誘導するか、メモが残るよう [memory flush](/ja-JP/concepts/memory) を有効にしてください。

**まっさらな状態から始めたいですか？** `/new` は Compaction を行わずに新しいセッションを開始します。

高度な設定（予約トークン、識別子保持、カスタムコンテキストエンジン、OpenAI サーバー側 Compaction）については、[Session Management Deep Dive](/ja-JP/reference/session-management-compaction) を参照してください。

## 関連

- [Session](/ja-JP/concepts/session) — セッション管理とライフサイクル
- [Session Pruning](/ja-JP/concepts/session-pruning) — ツール結果の削減
- [Context](/ja-JP/concepts/context) — エージェントターン用コンテキストの構築方法
- [Hooks](/ja-JP/automation/hooks) — Compaction ライフサイクルフック（before_compaction、after_compaction）
