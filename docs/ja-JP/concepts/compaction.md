---
read_when:
    - auto-compaction と /compact を理解したい
    - コンテキスト制限に達する長時間セッションをデバッグしている
summary: OpenClaw がモデル制限内に収まるよう長い会話を要約する仕組み
title: Compaction
x-i18n:
    generated_at: "2026-07-05T11:16:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c28a6b7c34872d23fa302ca42310928b862637ce7af4d742411a26dd868637fa
    source_path: concepts/compaction.md
    workflow: 16
---

すべてのモデルにはコンテキストウィンドウがあります。これは、そのモデルが処理できるトークンの最大数です。会話がその上限に近づくと、OpenClaw は古いメッセージを要約に **Compaction** して、チャットを継続できるようにします。

## 仕組み

1. 古い会話ターンがコンパクトなエントリに要約されます。
2. 要約がセッショントランスクリプトに保存されます。
3. 直近のメッセージはそのまま保持されます。

OpenClaw は、Compaction の分割点を選ぶとき、アシスタントのツール呼び出しを対応する `toolResult` エントリと対にしたまま保持します。分割点がツールブロックの内側に入る場合、OpenClaw は境界を移動してその対をまとめて保持し、現在の未要約の末尾を維持します。

会話履歴全体はディスク上に残ります。Compaction が変更するのは、次のターンでモデルに見える内容だけです。

<Note>
新しい設定では、`agents.defaults.compaction.mode` のデフォルトは `"safeguard"` です（より厳格なガードレール、要約品質監査）。オプトアウトするには `mode: "default"` を明示的に設定してください。
</Note>

## 自動 Compaction

自動 Compaction はデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（その場合、OpenClaw は Compaction して再試行します）。

表示される内容:

- 通常の Gateway ログに `embedded run auto-compaction start` / `complete`。
- 詳細モードに `🧹 Auto-compaction complete`。
- `/status` に `🧹 Compactions: <count>`。

<Info>
Compaction の前に、OpenClaw は重要なメモを [memory](/ja-JP/concepts/memory) ファイルへ保存するようエージェントに自動で促します。これによりコンテキストの喪失を防ぎます。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw が認識するオーバーフローエラーのパターン">
    OpenClaw は、プロバイダー固有のオーバーフローエラー文字列（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter など）を多数照合します。一般的な例:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動 Compaction

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約を導く指示を追加できます。

```text
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` が設定されている場合（デフォルト: 20,000）、手動 Compaction はその切断点を尊重し、再構築されたコンテキスト内に直近の末尾を保持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントとして動作し、新しい要約だけから継続します。

## 設定

`openclaw.json` の `agents.defaults.compaction` で Compaction を設定します。最も一般的な調整項目を以下に示します。完全なリファレンスは [セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

### 別のモデルを使用する

デフォルトでは、Compaction はエージェントのプライマリモデルを使用します。`agents.defaults.compaction.model` を設定すると、要約をより高性能または特化したモデルに委任できます。この上書きは、`provider/model-id` 文字列、または `agents.defaults.models` で設定された裸のエイリアスを受け付けます。

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

設定済みの裸のエイリアスは、Compaction の開始前に正規のプロバイダーとモデルへ解決されます。裸の値がエイリアスと設定済みのリテラルモデル ID の両方に一致する場合、リテラルモデル ID が優先されます。一致しない裸の値は、アクティブなプロバイダー上のモデル ID として残ります。

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

未設定の場合、Compaction はアクティブなセッションモデルで開始します。モデルフォールバックの対象となるプロバイダーエラーで要約に失敗した場合、OpenClaw はその Compaction 試行をセッションの既存モデルフォールバックチェーン経由で再試行します。フォールバックの選択は一時的なもので、セッション状態には書き戻されません。明示的な `agents.defaults.compaction.model` 上書きは厳密に扱われ、セッションのフォールバックチェーンを継承しません。

### 識別子の保持

Compaction の要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。無効にするには `identifierPolicy: "off"`、カスタムの指針を使うには `identifierPolicy: "custom"` と `identifierInstructions` で上書きします。

### アクティブトランスクリプトのバイトガード

`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されている場合、アクティブな JSONL がそのサイズに達すると、OpenClaw は実行前に通常のローカル Compaction をトリガーします。これは、プロバイダー側のコンテキスト管理によりモデルコンテキストが健全に保たれている一方で、ローカルトランスクリプトが増え続ける長時間実行セッションに役立ちます。生の JSONL バイトを分割するのではなく、通常の Compaction パイプラインにセマンティックな要約の作成を依頼します。

<Warning>
バイトガードには `truncateAfterCompaction: true` が必要です。トランスクリプトのローテーションがない場合、アクティブファイルは縮小せず、ガードは非アクティブのままになります。
</Warning>

### 後継トランスクリプト

`agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は既存のトランスクリプトをインプレースで書き換えません。Compaction 要約、保持された状態、未要約の末尾から新しいアクティブな後継トランスクリプトを作成し、その後、ブランチ/復元フローがその Compaction 済み後継を指すようにするチェックポイントメタデータを記録します。
後継トランスクリプトは、短い再試行ウィンドウ内に到着した完全に重複する長いユーザーターンも削除するため、チャネルの再試行の嵐が Compaction 後の次のアクティブトランスクリプトへ持ち越されることはありません。

OpenClaw は、新しい Compaction について個別の `.checkpoint.*.jsonl` コピーをもう書き込みません。既存のレガシーチェックポイントファイルは、参照されている間は引き続き使用でき、通常のセッションクリーンアップによって削除されます。

### Compaction 通知

デフォルトでは、Compaction はサイレントに実行されます。Compaction の開始時と完了時に短いステータスメッセージを表示するには、`notifyUser` を設定します。

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

Compaction の前に、OpenClaw は **サイレントメモリフラッシュ** ターンを実行して、永続的なメモをディスクへ保存できます。このハウスキーピングターンで、アクティブな会話モデルではなくローカルモデルを使用する必要がある場合は、`agents.defaults.compaction.memoryFlush.model` を設定します。

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

メモリフラッシュのモデル上書きは厳密であり、アクティブセッションのフォールバックチェーンを継承しません。詳細と設定については [Memory](/ja-JP/concepts/memory) を参照してください。

## プラグ可能な Compaction プロバイダー

Plugins は、Plugin API の `registerCompactionProvider()` を介してカスタム Compaction プロバイダーを登録できます。プロバイダーが登録および設定されている場合、OpenClaw は組み込みの LLM パイプラインではなく、そのプロバイダーに要約を委任します。

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

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは、組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、OpenClaw はプロバイダー出力後も直近ターンと分割ターンの接尾コンテキストを保持します。

<Note>
プロバイダーが失敗するか空の結果を返した場合、OpenClaw は組み込みの LLM 要約にフォールバックします。
</Note>

## Compaction とプルーニングの違い

|                  | Compaction                    | プルーニング                     |
| ---------------- | ----------------------------- | -------------------------------- |
| **実行内容**     | 古い会話を要約する            | 古いツール結果を切り詰める       |
| **保存されるか** | はい（セッショントランスクリプト内） | いいえ（リクエストごとのメモリ内のみ） |
| **範囲**         | 会話全体                      | ツール結果のみ                   |

[セッションプルーニング](/ja-JP/concepts/session-pruning) は、要約せずにツール出力を切り詰める軽量な補完機能です。

## トラブルシューティング

**Compaction が頻繁すぎる場合** モデルのコンテキストウィンドウが小さいか、ツール出力が大きい可能性があります。[セッションプルーニング](/ja-JP/concepts/session-pruning) の有効化を試してください。

**Compaction 後にコンテキストが古く感じる場合** `/compact Focus on <topic>` を使用して要約を導くか、[メモリフラッシュ](/ja-JP/concepts/memory) を有効にしてメモを残してください。

**まっさらな状態が必要な場合** `/new` は Compaction せずに新しいセッションを開始します。

高度な設定（予約トークン、識別子保持、カスタムコンテキストエンジン、OpenAI サーバー側 Compaction）については、[セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

## 関連

- [セッション](/ja-JP/concepts/session): セッション管理とライフサイクル。
- [セッションプルーニング](/ja-JP/concepts/session-pruning): ツール結果の切り詰め。
- [コンテキスト](/ja-JP/concepts/context): エージェントターンのコンテキストがどのように構築されるか。
- [Hooks](/ja-JP/automation/hooks): Compaction ライフサイクルフック（`before_compaction`、`after_compaction`）。
