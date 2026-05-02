---
read_when:
    - 自動 Compaction と /compact を理解したい場合
    - コンテキスト制限に達する長時間セッションをデバッグしている
summary: OpenClaw が長い会話を要約してモデルの制限内に収める方法
title: Compaction
x-i18n:
    generated_at: "2026-05-02T04:53:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

すべてのモデルにはコンテキストウィンドウがあります。これは処理できるトークン数の上限です。会話がその上限に近づくと、OpenClaw はチャットを継続できるように、古いメッセージを要約して **Compaction** します。

## 仕組み

1. 古い会話ターンが要約され、コンパクトなエントリになります。
2. 要約はセッショントランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClaw が履歴を Compaction チャンクに分割するとき、アシスタントのツール呼び出しは対応する `toolResult` エントリと組にしたまま保持されます。分割点がツールブロックの内側に入る場合、OpenClaw は境界を移動して組が分かれないようにし、現在の未要約の末尾を保持します。

完全な会話履歴はディスク上に残ります。Compaction は、次のターンでモデルに見える内容だけを変更します。

## 自動 Compaction

自動 Compaction はデフォルトでオンです。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（その場合、OpenClaw は Compaction して再試行します）。

表示される内容:

- 詳細モードでは `🧹 Auto-compaction complete`。
- `/status` では `🧹 Compactions: <count>`。

<Info>
Compaction の前に、OpenClaw は重要なメモを [メモリ](/ja-JP/concepts/memory) ファイルへ保存するようエージェントに自動でリマインドします。これによりコンテキストの損失を防ぎます。
</Info>

<AccordionGroup>
  <Accordion title="認識されるオーバーフローシグネチャ">
    OpenClaw は、以下のプロバイダーエラーパターンからコンテキストオーバーフローを検出します:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動 Compaction

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約の方向づけをするには指示を追加します:

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` が設定されている場合、手動 Compaction はその Pi カットポイントを尊重し、再構築されたコンテキスト内に最近の末尾を保持します。明示的な保持予算がない場合、手動 Compaction は強いチェックポイントとして動作し、新しい要約のみから続行します。

## 設定

`openclaw.json` の `agents.defaults.compaction` で Compaction を設定します。よく使うノブを以下に示します。完全なリファレンスは [セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

### 別のモデルを使う

デフォルトでは、Compaction はエージェントのプライマリモデルを使います。要約をより高性能なモデルまたは専用モデルに委任するには、`agents.defaults.compaction.model` を設定します。このオーバーライドは任意の `provider/model-id` 文字列を受け付けます:

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

これはローカルモデルでも機能します。たとえば、要約専用の 2 つ目の Ollama モデルを使えます:

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

未設定の場合、Compaction はアクティブなセッションモデルから開始します。モデルフォールバック対象のプロバイダーエラーで要約が失敗した場合、OpenClaw はその Compaction 試行をセッション既存のモデルフォールバックチェーンで再試行します。フォールバックの選択は一時的なもので、セッション状態には書き戻されません。明示的な `agents.defaults.compaction.model` オーバーライドは厳密に適用され、セッションのフォールバックチェーンを継承しません。

### 識別子の保持

Compaction の要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。無効にするには `identifierPolicy: "off"` でオーバーライドし、カスタムのガイダンスを指定するには `identifierPolicy: "custom"` と `identifierInstructions` を使います。

### アクティブトランスクリプトのバイトガード

`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されている場合、アクティブな JSONL がそのサイズに達すると、OpenClaw は実行前に通常のローカル Compaction をトリガーします。これは、プロバイダー側のコンテキスト管理によってモデルコンテキストが健全に保たれていても、ローカルトランスクリプトが増え続ける長時間実行セッションで便利です。生の JSONL バイトを分割するのではなく、通常の Compaction パイプラインに意味的な要約を作成させます。

<Warning>
バイトガードには `truncateAfterCompaction: true` が必要です。トランスクリプトのローテーションがないと、アクティブファイルは縮小せず、ガードは非アクティブのままになります。
</Warning>

### 後続トランスクリプト

`agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は既存のトランスクリプトをその場で書き換えません。Compaction の要約、保持された状態、未要約の末尾から新しいアクティブな後続トランスクリプトを作成し、前の JSONL はアーカイブされたチェックポイントソースとして保持します。
後続トランスクリプトでは、短い再試行ウィンドウ内に到着した完全に重複する長いユーザーターンも削除されるため、チャネルの再試行が集中しても、Compaction 後の次のアクティブトランスクリプトには引き継がれません。

Compaction 前のチェックポイントは、OpenClaw のチェックポイントサイズ上限を下回っている間だけ保持されます。サイズが大きすぎるアクティブトランスクリプトでも Compaction は行われますが、OpenClaw はディスク使用量を倍増させる代わりに、大きなデバッグスナップショットをスキップします。

### Compaction 通知

デフォルトでは、Compaction はサイレントに実行されます。Compaction の開始時と完了時に短いステータスメッセージを表示するには、`notifyUser` を設定します:

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

### メモリフラッシュ

Compaction の前に、OpenClaw は **サイレントメモリフラッシュ** ターンを実行して、永続的なメモをディスクに保存できます。このメンテナンスターンでアクティブな会話モデルではなくローカルモデルを使う場合は、`agents.defaults.compaction.memoryFlush.model` を設定します:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

メモリフラッシュのモデルオーバーライドは厳密で、アクティブセッションのフォールバックチェーンを継承しません。詳細と設定は [メモリ](/ja-JP/concepts/memory) を参照してください。

## プラグイン可能な Compaction プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を通じてカスタム Compaction プロバイダーを登録できます。プロバイダーが登録され設定されている場合、OpenClaw は組み込みの LLM パイプラインではなく、そのプロバイダーに要約を委任します。

登録済みプロバイダーを使うには、設定にその id を指定します:

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

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、OpenClaw はプロバイダーの出力後も、最近のターンと分割されたターンの接尾コンテキストを保持します。

<Note>
プロバイダーが失敗するか空の結果を返した場合、OpenClaw は組み込みの LLM 要約へフォールバックします。
</Note>

## Compaction と枝刈り

|                  | Compaction                    | 枝刈り                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **何をするか** | 古い会話を要約します | 古いツール結果を切り詰めます           |
| **保存されるか?**       | はい（セッショントランスクリプト内）   | いいえ（リクエストごとのメモリ内のみ） |
| **スコープ**        | 会話全体           | ツール結果のみ                |

[セッションの枝刈り](/ja-JP/concepts/session-pruning) は、要約せずにツール出力を切り詰める、より軽量な補完機能です。

## トラブルシューティング

**Compaction が頻繁すぎる場合** モデルのコンテキストウィンドウが小さいか、ツール出力が大きい可能性があります。[セッションの枝刈り](/ja-JP/concepts/session-pruning) を有効にしてみてください。

**Compaction 後にコンテキストが古く感じる場合** 要約を方向づけるには `/compact Focus on <topic>` を使うか、メモが残るように [メモリフラッシュ](/ja-JP/concepts/memory) を有効にします。

**まっさらな状態が必要な場合** `/new` は Compaction せずに新しいセッションを開始します。

高度な設定（予約トークン、識別子の保持、カスタムコンテキストエンジン、OpenAI サーバー側 Compaction）については、[セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

## 関連

- [セッション](/ja-JP/concepts/session): セッション管理とライフサイクル。
- [セッションの枝刈り](/ja-JP/concepts/session-pruning): ツール結果の切り詰め。
- [コンテキスト](/ja-JP/concepts/context): エージェントターン用にコンテキストが構築される仕組み。
- [フック](/ja-JP/automation/hooks): Compaction ライフサイクルフック（`before_compaction`, `after_compaction`）。
