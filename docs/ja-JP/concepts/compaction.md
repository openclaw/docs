---
read_when:
    - 自動 Compaction と `/compact` を理解したい場合
    - コンテキスト上限に達する長いセッションをデバッグしている場合
summary: 長い会話をモデルの上限内に収めるために OpenClaw がどのように要約するか
title: Compaction
x-i18n:
    generated_at: "2026-04-24T04:52:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

すべてのモデルにはコンテキストウィンドウがあります。これは、処理できるトークン数の上限です。
会話がその上限に近づくと、OpenClaw は古いメッセージを要約して
チャットを継続できるように**Compaction**します。

## 仕組み

1. 古い会話ターンはコンパクトなエントリーに要約されます。
2. その要約はセッショントランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClaw が履歴を Compaction チャンクに分割するとき、アシスタントの tool
call は対応する `toolResult` エントリーと対になるよう保持されます。分割点が
tool ブロックの途中に来た場合、OpenClaw はその対が一緒に保たれ、
現在の未要約の末尾が保持されるように境界を移動します。

会話の完全な履歴はディスク上に残ります。Compaction が変更するのは、次のターンでモデルが見る内容だけです。

## 自動 Compaction

自動 Compaction はデフォルトでオンです。セッションがコンテキスト上限に
近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（この場合、
OpenClaw は Compaction を行って再試行します）。典型的なオーバーフローのシグネチャには
`request_too_large`、`context length exceeded`、`input exceeds the maximum
number of tokens`、`input token count exceeds the maximum number of input
tokens`、`input is too long for the model`、`ollama error: context length
exceeded` があります。

<Info>
Compaction の前に、OpenClaw は重要な
メモを [memory](/ja-JP/concepts/memory) ファイルに保存するようエージェントに自動で通知します。これによりコンテキスト喪失を防ぎます。
</Info>

Compaction の動作（モード、対象トークン数など）を設定するには、`openclaw.json` の `agents.defaults.compaction` 設定を使用します。
Compaction 要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。これは `identifierPolicy: "off"` で上書きするか、`identifierPolicy: "custom"` と `identifierInstructions` でカスタムテキストを指定できます。

必要に応じて、`agents.defaults.compaction.model` で Compaction 要約用に別のモデルを指定することもできます。これは、主モデルがローカルモデルや小型モデルで、より高性能なモデルに Compaction 要約を生成させたい場合に便利です。この上書きは任意の `provider/model-id` 文字列を受け取ります。

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

これはローカルモデルでも機能します。たとえば、要約専用の 2 つ目の Ollama モデルや、Compaction 専用にファインチューニングされたモデルなどです。

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

未設定の場合、Compaction はエージェントの主モデルを使用します。

## プラグ可能な Compaction プロバイダー

Plugin は、plugin API 上の `registerCompactionProvider()` を通じてカスタム Compaction プロバイダーを登録できます。プロバイダーが登録され設定されている場合、OpenClaw は組み込みの LLM パイプラインの代わりに、そのプロバイダーに要約を委譲します。

登録済みプロバイダーを使うには、config でプロバイダー ID を設定します。

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

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは、組み込みパスと同じ Compaction 命令および識別子保持ポリシーを受け取り、プロバイダー出力の後も OpenClaw は最近のターンと分割ターンのサフィックスコンテキストを保持します。プロバイダーが失敗した場合、または空の結果を返した場合、OpenClaw は組み込みの LLM 要約にフォールバックします。

## 自動 Compaction（デフォルトでオン）

セッションがモデルのコンテキストウィンドウに近づくか超過すると、OpenClaw は自動 Compaction をトリガーし、Compaction 後のコンテキストで元のリクエストを再試行することがあります。

表示される内容:

- 詳細モードでは `🧹 Auto-compaction complete`
- `/status` では `🧹 Compactions: <count>`

Compaction の前に、OpenClaw は永続メモをディスクに保存するための**サイレント memory flush** ターンを実行できます。詳細と設定については [Memory](/ja-JP/concepts/memory) を参照してください。

## 手動 Compaction

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約を導くために指示を追加できます。

```
/compact API の設計判断に焦点を当てて
```

## 別のモデルを使う

デフォルトでは、Compaction はエージェントの主モデルを使用します。より良い要約のために、
より高性能なモデルを使うこともできます。

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

デフォルトでは、Compaction は静かに実行されます。Compaction の開始時と完了時に
短い通知を表示するには、`notifyUser` を有効にしてください。

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

有効にすると、ユーザーには各 Compaction 実行の前後で短いステータスメッセージが表示されます
（たとえば「コンテキストを Compaction 中...」や「Compaction 完了」など）。

## Compaction と pruning の違い

|                  | Compaction                   | pruning                         |
| ---------------- | ---------------------------- | ------------------------------- |
| **何をするか**   | 古い会話を要約する           | 古い tool result を削減する     |
| **保存されるか** | はい（セッショントランスクリプト内） | いいえ（メモリ内のみ、リクエストごと） |
| **対象範囲**     | 会話全体                     | tool result のみ                |

[Session pruning](/ja-JP/concepts/session-pruning) は、要約せずに tool 出力を
削減する、より軽量な補完機能です。

## トラブルシューティング

**Compaction が頻繁すぎる？** モデルのコンテキストウィンドウが小さいか、tool
出力が大きい可能性があります。[session pruning](/ja-JP/concepts/session-pruning) を
有効にしてみてください。

**Compaction 後にコンテキストが古く感じる？** `/compact Focus on <topic>` を使って
要約を導くか、[memory flush](/ja-JP/concepts/memory) を有効にして
メモが残るようにしてください。

**まっさらな状態が必要？** `/new` は Compaction せずに新しいセッションを開始します。

高度な設定（予約トークン、識別子保持、カスタム
コンテキストエンジン、OpenAI サーバー側 Compaction）については、
[Session Management Deep Dive](/ja-JP/reference/session-management-compaction) を参照してください。

## 関連

- [Session](/ja-JP/concepts/session) — セッション管理とライフサイクル
- [Session Pruning](/ja-JP/concepts/session-pruning) — tool result の削減
- [Context](/ja-JP/concepts/context) — エージェントターン用コンテキストの構築方法
- [フック](/ja-JP/automation/hooks) — Compaction ライフサイクルフック（before_compaction, after_compaction）
