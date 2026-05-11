---
read_when:
    - 自動Compactionと /compact を理解したい
    - コンテキスト制限に達する長いセッションをデバッグしている
summary: OpenClaw がモデルの制限内に収まるよう長い会話を要約する方法
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

すべてのモデルにはコンテキストウィンドウがあります。これは、モデルが処理できるトークンの最大数です。会話がその上限に近づくと、OpenClaw は古いメッセージを要約へ **Compaction** し、チャットを継続できるようにします。

## 仕組み

1. 古い会話ターンがコンパクトなエントリに要約されます。
2. 要約はセッションのトランスクリプトに保存されます。
3. 直近のメッセージはそのまま保持されます。

OpenClaw が履歴を Compaction チャンクに分割するときは、アシスタントのツール呼び出しを対応する `toolResult` エントリとペアのまま保持します。分割点がツールブロック内にある場合、OpenClaw は境界を移動してペアを一緒に保ち、現在の未要約の末尾を保持します。

完全な会話履歴はディスク上に残ります。Compaction が変更するのは、次のターンでモデルに見える内容だけです。

## 自動Compaction

自動Compaction はデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（その場合、OpenClaw は Compaction して再試行します）。

次の表示が確認できます。

- 通常の Gateway ログ内の `embedded run auto-compaction start` / `complete`。
- 詳細モード内の `🧹 Auto-compaction complete`。
- `/status` に表示される `🧹 Compactions: <count>`。

<Info>
Compaction の前に、OpenClaw は重要なメモを [メモリ](/ja-JP/concepts/memory) ファイルへ保存するようエージェントに自動で促します。これによりコンテキストの損失を防ぎます。
</Info>

<AccordionGroup>
  <Accordion title="認識されるオーバーフローシグネチャ">
    OpenClaw は、次のプロバイダーエラーパターンからコンテキストオーバーフローを検出します。

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動Compaction

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約を誘導するための指示を追加できます。

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` が設定されている場合、手動Compaction はその Pi の切断点を尊重し、再構築されたコンテキスト内に直近の末尾を保持します。明示的な保持予算がない場合、手動Compaction はハードチェックポイントとして動作し、新しい要約のみから継続します。

## 設定

`openclaw.json` の `agents.defaults.compaction` で Compaction を設定します。最も一般的な調整項目を以下に示します。完全なリファレンスは [セッション管理の詳細解説](/ja-JP/reference/session-management-compaction) を参照してください。

### 別のモデルを使用する

デフォルトでは、Compaction はエージェントのプライマリモデルを使用します。要約をより高性能または専門的なモデルへ委任するには、`agents.defaults.compaction.model` を設定します。この上書きは任意の `provider/model-id` 文字列を受け付けます。

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

これはローカルモデルでも機能します。たとえば、要約専用の 2 つ目の Ollama モデルを使用できます。

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

未設定の場合、Compaction はアクティブなセッションモデルから開始します。モデルフォールバック対象のプロバイダーエラーで要約に失敗した場合、OpenClaw はその Compaction 試行をセッションの既存のモデルフォールバックチェーン経由で再試行します。フォールバックの選択は一時的なもので、セッション状態には書き戻されません。明示的な `agents.defaults.compaction.model` 上書きは厳密に適用され、セッションのフォールバックチェーンを継承しません。

### 識別子の保持

Compaction の要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。無効にするには `identifierPolicy: "off"` で上書きし、カスタムガイダンスには `identifierPolicy: "custom"` と `identifierInstructions` を使用します。

### アクティブトランスクリプトのバイトガード

`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されている場合、アクティブな JSONL がそのサイズに達すると、OpenClaw は実行前に通常のローカル Compaction をトリガーします。これは、プロバイダー側のコンテキスト管理がモデルコンテキストを健全に保っていても、ローカルトランスクリプトが増え続ける長時間実行セッションで便利です。これは生の JSONL バイトを分割するものではありません。通常の Compaction パイプラインに意味的な要約の作成を依頼します。

<Warning>
バイトガードには `truncateAfterCompaction: true` が必要です。トランスクリプトのローテーションがない場合、アクティブファイルは縮小せず、ガードは非アクティブのままになります。
</Warning>

### 後続トランスクリプト

`agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は既存のトランスクリプトをその場で書き換えません。Compaction 要約、保持された状態、未要約の末尾から新しいアクティブな後続トランスクリプトを作成し、その後、以前の JSONL をアーカイブ済みチェックポイントソースとして保持します。
後続トランスクリプトでは、短い再試行ウィンドウ内に到着した完全に重複する長いユーザーターンも削除されるため、チャネルの再試行の集中が Compaction 後の次のアクティブトランスクリプトへ持ち込まれません。

Compaction 前のチェックポイントは、OpenClaw のチェックポイントサイズ上限を下回っている間だけ保持されます。サイズが大きすぎるアクティブトランスクリプトも Compaction されますが、OpenClaw はディスク使用量を倍増させる代わりに、大きなデバッグスナップショットをスキップします。

### Compaction 通知

デフォルトでは、Compaction は静かに実行されます。Compaction の開始時と完了時に短いステータスメッセージを表示するには、`notifyUser` を設定します。

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

Compaction の前に、OpenClaw は耐久的なメモをディスクへ保存するために **サイレントメモリフラッシュ** ターンを実行できます。この保守ターンで、アクティブな会話モデルではなくローカルモデルを使用する必要がある場合は、`agents.defaults.compaction.memoryFlush.model` を設定します。

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

メモリフラッシュモデルの上書きは厳密に適用され、アクティブなセッションのフォールバックチェーンを継承しません。詳細と設定については [メモリ](/ja-JP/concepts/memory) を参照してください。

## プラグ可能な Compaction プロバイダー

Plugin は、プラグイン API の `registerCompactionProvider()` を通じてカスタム Compaction プロバイダーを登録できます。プロバイダーが登録され設定されている場合、OpenClaw は組み込みの LLM パイプラインの代わりに、そのプロバイダーへ要約を委任します。

登録済みプロバイダーを使用するには、設定でその ID を指定します。

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

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは組み込みパスと同じ Compaction 指示と識別子保持ポリシーを受け取り、OpenClaw はプロバイダー出力後も直近ターンと分割ターンのサフィックスコンテキストを保持します。

<Note>
プロバイダーが失敗するか空の結果を返した場合、OpenClaw は組み込みの LLM 要約にフォールバックします。
</Note>

## Compaction とプルーニング

|                  | Compaction                    | プルーニング                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **動作** | 古い会話を要約します | 古いツール結果を切り詰めます           |
| **保存されるか**       | はい（セッションのトランスクリプト内）   | いいえ（メモリ内のみ、リクエストごと） |
| **スコープ**        | 会話全体           | ツール結果のみ                |

[セッションプルーニング](/ja-JP/concepts/session-pruning) は、要約せずにツール出力を切り詰める、より軽量な補完機能です。

## トラブルシューティング

**Compaction が頻繁すぎる場合** モデルのコンテキストウィンドウが小さい、またはツール出力が大きい可能性があります。[セッションプルーニング](/ja-JP/concepts/session-pruning) の有効化を試してください。

**Compaction 後にコンテキストが古く感じる場合** `/compact Focus on <topic>` を使用して要約を誘導するか、メモが残るように [メモリフラッシュ](/ja-JP/concepts/memory) を有効にしてください。

**クリーンな状態が必要な場合** `/new` は Compaction せずに新しいセッションを開始します。

高度な設定（予約トークン、識別子の保持、カスタムコンテキストエンジン、OpenAI サーバー側 Compaction）については、[セッション管理の詳細解説](/ja-JP/reference/session-management-compaction) を参照してください。

## 関連

- [セッション](/ja-JP/concepts/session): セッション管理とライフサイクル。
- [セッションプルーニング](/ja-JP/concepts/session-pruning): ツール結果の切り詰め。
- [コンテキスト](/ja-JP/concepts/context): エージェントターンのためにコンテキストがどのように構築されるか。
- [フック](/ja-JP/automation/hooks): Compaction ライフサイクルフック（`before_compaction`, `after_compaction`）。
