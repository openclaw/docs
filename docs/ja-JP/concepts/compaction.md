---
read_when:
    - 自動 Compaction と /compact について理解したい場合
    - 長時間のセッションがコンテキスト上限に達する問題をデバッグしている場合
summary: モデルの制限内に収まるようにOpenClawが長い会話を要約する仕組み
title: Compaction
x-i18n:
    generated_at: "2026-07-12T14:24:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

すべてのモデルにはコンテキストウィンドウ、つまり処理できるトークン数の上限があります。会話がその上限に近づくと、OpenClaw はチャットを継続できるように、古いメッセージを要約へと **圧縮** します。

## 仕組み

1. 古い会話ターンが簡潔なエントリに要約されます。
2. 要約がセッショントランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClaw は、圧縮の分割点を選ぶ際、アシスタントのツール呼び出しと対応する `toolResult` エントリの組を維持します。分割点がツールブロック内に入る場合、OpenClaw はその組が分離されず、現在の未要約の末尾部分が保持されるように境界を移動します。

完全な会話履歴はディスク上に残ります。圧縮によって変わるのは、次のターンでモデルに表示される内容だけです。

<Note>
新しい設定では、`agents.defaults.compaction.mode` のデフォルトは `"safeguard"`（より厳格なガードレール、要約品質の監査）です。オプトアウトするには、`mode: "default"` を明示的に設定します。
</Note>

## 自動圧縮

自動圧縮はデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（後者の場合、OpenClaw は圧縮して再試行します）。

次の表示を確認できます。

- 通常の Gateway ログの `embedded run auto-compaction start` / `complete`。
- 詳細モードの `🧹 Auto-compaction complete`。
- `/status` に表示される `🧹 Compactions: <count>`。

<Info>
圧縮前に、OpenClaw は重要なメモを [メモリ](/ja-JP/concepts/memory) ファイルへ保存するようエージェントに自動的に促します。これにより、コンテキストの喪失を防ぎます。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw が認識するオーバーフローエラーのパターン">
    OpenClaw は、プロバイダー固有の数十種類のオーバーフローエラー文字列（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter など）に一致するかを確認します。一般的な例を次に示します。

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動圧縮

任意のチャットで `/compact` と入力すると、圧縮を強制実行できます。要約の方針を指定するには、指示を追加します。

```text
/compact API 設計上の決定事項に重点を置く
```

`agents.defaults.compaction.keepRecentTokens` が設定されている場合（デフォルト: 20,000）、手動圧縮ではその切断点が尊重され、再構築されたコンテキストに最近の末尾部分が保持されます。明示的な保持予算がない場合、手動圧縮は厳密なチェックポイントとして動作し、新しい要約のみを使用して続行します。

## 設定

`openclaw.json` の `agents.defaults.compaction` で圧縮を設定します。最も一般的な設定項目を以下に示します。完全なリファレンスについては、[セッション管理の詳細](/ja-JP/reference/session-management-compaction)を参照してください。

### 別のモデルの使用

デフォルトでは、圧縮にはエージェントのプライマリモデルが使用されます。要約をより高性能なモデルまたは特化したモデルに委任するには、`agents.defaults.compaction.model` を設定します。オーバーライドには、`provider/model-id` 文字列、または `agents.defaults.models` で設定された単独のエイリアスを指定できます。

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

設定済みの単独エイリアスは、圧縮の開始前に正規のプロバイダーとモデルへ解決されます。単独の値がエイリアスと設定済みのリテラルモデル ID の両方に一致する場合、リテラルモデル ID が優先されます。一致しない単独の値は、アクティブなプロバイダー上のモデル ID として扱われます。

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

未設定の場合、圧縮はアクティブなセッションモデルで開始されます。モデルのフォールバック対象となるプロバイダーエラーによって要約が失敗した場合、OpenClaw はセッションの既存のモデルフォールバックチェーンを使用して、その圧縮処理を再試行します。フォールバックの選択は一時的なものであり、セッション状態には書き戻されません。明示的な `agents.defaults.compaction.model` オーバーライドは厳密に適用され、セッションのフォールバックチェーンを継承しません。

### 識別子の保持

圧縮時の要約では、デフォルトで不透明な識別子が保持されます（`identifierPolicy: "strict"`）。無効にするには `identifierPolicy: "off"` を指定し、カスタム指示を使用するには `identifierPolicy: "custom"` と `identifierInstructions` を指定します。

### アクティブトランスクリプトのバイト数ガード

`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されている場合、トランスクリプト履歴がそのサイズに達すると、OpenClaw は実行前に通常のローカル圧縮を開始します。これは、プロバイダー側のコンテキスト管理によってモデルのコンテキストが健全に保たれていても、永続化されたトランスクリプト履歴が増え続ける長時間実行セッションに役立ちます。生のバイト列を分割するのではなく、通常の圧縮パイプラインに意味的な要約の作成を要求します。

<Warning>
バイト数ガードは、アクティブな SQLite トランスクリプト履歴に適用されます。レガシー JSONL チェックポイント成果物は、アクティブな圧縮対象ではありません。
</Warning>

### 後継トランスクリプト

`agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は既存のトランスクリプトをその場で書き換えません。圧縮要約、保持された状態、未要約の末尾部分から、新しいアクティブな後継トランスクリプトを作成し、分岐および復元フローがその圧縮済みの後継を参照するチェックポイントメタデータを記録します。
後継トランスクリプトでは、短い再試行期間内に到着した、完全に重複する長いユーザーターンも除外されます。これにより、チャネルの再試行ストームが圧縮後の次のアクティブトランスクリプトへ引き継がれません。

OpenClaw は、新しい圧縮に対して個別の `.checkpoint.*.jsonl` コピーを作成しなくなりました。既存のレガシーチェックポイントファイルは、参照されている間は引き続き使用でき、通常のセッションクリーンアップによって削除されます。

### 圧縮通知

デフォルトでは、圧縮は通知なしで実行されます。圧縮の開始時と完了時に短いステータスメッセージを表示し、圧縮前のメモリフラッシュを使い果たしても応答が続行される場合に縮退通知を表示するには、`notifyUser` を設定します。

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

OpenClaw は圧縮前に、永続的なメモをディスクへ保存するための **サイレントメモリフラッシュ** ターンを実行できます。この保守ターンでアクティブな会話モデルの代わりにローカルモデルを使用する場合は、`agents.defaults.compaction.memoryFlush.model` を設定します。

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

メモリフラッシュのモデルオーバーライドは厳密に適用され、アクティブなセッションのフォールバックチェーンを継承しません。詳細と設定については、[メモリ](/ja-JP/concepts/memory)を参照してください。

## 差し替え可能な圧縮プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を介してカスタム圧縮プロバイダーを登録できます。プロバイダーが登録および設定されると、OpenClaw は組み込みの LLM パイプラインではなく、そのプロバイダーに要約を委任します。

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

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは組み込み経路と同じ圧縮指示および識別子保持ポリシーを受け取り、OpenClaw はプロバイダーの出力後も、最近のターンと分割されたターンの接尾コンテキストを保持します。

<Note>
プロバイダーが失敗するか空の結果を返した場合、OpenClaw は組み込みの LLM 要約へフォールバックします。
</Note>

## 圧縮とプルーニングの比較

|                  | 圧縮                            | プルーニング                         |
| ---------------- | ------------------------------- | ------------------------------------ |
| **処理内容**     | 古い会話を要約                  | 古いツール結果を切り詰める           |
| **保存されるか** | はい（セッショントランスクリプト内） | いいえ（リクエストごとにメモリ内のみ） |
| **対象範囲**     | 会話全体                        | ツール結果のみ                       |

[セッションプルーニング](/ja-JP/concepts/session-pruning)は、要約を行わずにツール出力を切り詰める、より軽量な補完機能です。

## トラブルシューティング

**圧縮の頻度が高すぎますか？** モデルのコンテキストウィンドウが小さいか、ツール出力が大きい可能性があります。[セッションプルーニング](/ja-JP/concepts/session-pruning)を有効にしてみてください。

**圧縮後にコンテキストが古く感じられますか？** `/compact Focus on <topic>` を使用して要約の方針を指定するか、メモが保持されるように[メモリフラッシュ](/ja-JP/concepts/memory)を有効にしてください。

**白紙の状態から始める必要がありますか？** `/new` を使用すると、圧縮せずに新しいセッションを開始できます。

高度な設定（予約トークン、識別子の保持、カスタムコンテキストエンジン、OpenAI サーバー側圧縮）については、[セッション管理の詳細](/ja-JP/reference/session-management-compaction)を参照してください。

## 関連項目

- [セッション](/ja-JP/concepts/session): セッションの管理とライフサイクル。
- [セッションプルーニング](/ja-JP/concepts/session-pruning): ツール結果の切り詰め。
- [コンテキスト](/ja-JP/concepts/context): エージェントターン用のコンテキストが構築される仕組み。
- [フック](/ja-JP/automation/hooks): 圧縮のライフサイクルフック（`before_compaction`、`after_compaction`）。
