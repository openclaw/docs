---
read_when:
    - 自動Compactionと/compactについて理解したい
    - 長時間セッションがコンテキスト制限に達する問題をデバッグしている
summary: OpenClaw がモデル制限内に収まるよう長い会話を要約する方法
title: Compaction
x-i18n:
    generated_at: "2026-07-06T10:48:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cfa0d3aec36ae38c04b76f37a2ddf9d6bf81ac6598296096a4c24b349738aaa
    source_path: concepts/compaction.md
    workflow: 16
---

すべてのモデルにはコンテキストウィンドウがあります。これは、処理できるトークンの最大数です。会話がその上限に近づくと、OpenClaw はチャットを続けられるように、古いメッセージを要約へ **Compaction** します。

## 仕組み

1. 古い会話ターンがコンパクトなエントリに要約されます。
2. 要約はセッショントランスクリプトに保存されます。
3. 直近のメッセージはそのまま保持されます。

OpenClaw は、Compaction の分割点を選ぶとき、assistant のツール呼び出しを対応する `toolResult` エントリとペアのまま保持します。分割点がツールブロック内に入る場合、OpenClaw は境界を移動してペアを一緒に保ち、現在の未要約の末尾を保持します。

完全な会話履歴はディスク上に残ります。Compaction が変更するのは、次のターンでモデルに見える内容だけです。

<Note>
新しい設定では、`agents.defaults.compaction.mode` のデフォルトは `"safeguard"` です（より厳格なガードレール、要約品質監査）。オプトアウトするには、`mode: "default"` を明示的に設定します。
</Note>

## 自動 Compaction

自動 Compaction はデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（その場合、OpenClaw は Compaction して再試行します）。

次のように表示されます。

- 通常の Gateway ログに `embedded run auto-compaction start` / `complete`。
- 詳細モードに `🧹 Auto-compaction complete`。
- `/status` に `🧹 Compactions: <count>`。

<Info>
Compaction の前に、OpenClaw は重要なメモを [memory](/ja-JP/concepts/memory) ファイルに保存するようエージェントへ自動的に通知します。これによりコンテキストの損失を防ぎます。
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw が認識するオーバーフローエラーパターン">
    OpenClaw は、プロバイダー固有の多数のオーバーフローエラー文字列（Anthropic、OpenAI、Bedrock、Gemini、Ollama、OpenRouter など）に一致します。一般的な例:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`（Bedrock）
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 手動 Compaction

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約を誘導する指示を追加できます。

```text
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` が設定されている場合（デフォルト: 20,000）、手動 Compaction はその切断点を尊重し、再構築されたコンテキスト内に直近の末尾を保持します。明示的な保持予算がない場合、手動 Compaction はハードチェックポイントとして動作し、新しい要約のみから続行します。

## 設定

`openclaw.json` の `agents.defaults.compaction` で Compaction を設定します。最も一般的な調整項目を以下に示します。完全なリファレンスについては、[セッション管理の詳細](/ja-JP/reference/session-management-compaction)を参照してください。

### 別のモデルを使う

デフォルトでは、Compaction はエージェントの主要モデルを使用します。`agents.defaults.compaction.model` を設定すると、より高性能または専用のモデルに要約を委任できます。オーバーライドは、`provider/model-id` 文字列、または `agents.defaults.models` で設定された裸のエイリアスを受け付けます。

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

設定済みの裸のエイリアスは、Compaction の開始前に正規のプロバイダーとモデルへ解決されます。裸の値がエイリアスと設定済みのリテラルモデル ID の両方に一致する場合、リテラルモデル ID が優先されます。一致しない裸の値は、アクティブなプロバイダー上のモデル ID のままです。

これはローカルモデルでも機能します。たとえば、要約専用の 2 つ目の Ollama モデルを指定できます。

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

未設定の場合、Compaction はアクティブなセッションモデルで開始されます。要約がモデルフォールバック対象のプロバイダーエラーで失敗した場合、OpenClaw はその Compaction 試行を、セッション既存のモデルフォールバックチェーンを通じて再試行します。フォールバックの選択は一時的であり、セッション状態には書き戻されません。明示的な `agents.defaults.compaction.model` オーバーライドは厳密にそのまま使われ、セッションのフォールバックチェーンを継承しません。

### 識別子の保持

Compaction 要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。無効にするには `identifierPolicy: "off"` でオーバーライドし、カスタムガイダンスには `identifierPolicy: "custom"` と `identifierInstructions` を使います。

### アクティブトランスクリプトのバイトガード

`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されている場合、アクティブな JSONL がそのサイズに達すると、OpenClaw は実行前に通常のローカル Compaction をトリガーします。これは、プロバイダー側のコンテキスト管理でモデルコンテキストは健全に保たれる一方、ローカルトランスクリプトが増え続ける長時間実行セッションに役立ちます。生の JSONL バイトを分割するのではなく、通常の Compaction パイプラインに意味的な要約の作成を依頼します。

<Warning>
バイトガードには `truncateAfterCompaction: true` が必要です。トランスクリプトのローテーションがない場合、アクティブファイルは縮小されず、ガードは非アクティブのままです。
</Warning>

### 後続トランスクリプト

`agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は既存のトランスクリプトをその場で書き換えません。Compaction 要約、保持された状態、未要約の末尾から新しいアクティブな後続トランスクリプトを作成し、その後、ブランチ/復元フローをその Compaction 済み後続へ向けるチェックポイントメタデータを記録します。
後続トランスクリプトは、短い再試行ウィンドウ内に届く完全に重複した長いユーザーターンも削除するため、チャンネルの再試行ストームが Compaction 後の次のアクティブトランスクリプトに持ち越されません。

OpenClaw は、新しい Compaction について個別の `.checkpoint.*.jsonl` コピーをもう書き込みません。既存のレガシーチェックポイントファイルは、参照されている間は引き続き使用でき、通常のセッションクリーンアップによって削除されます。

### Compaction 通知

デフォルトでは、Compaction は静かに実行されます。Compaction の開始時と完了時に短いステータスメッセージを表示し、Compaction 前のメモリフラッシュが使い切られても返信は続行される場合に低下通知を表示するには、`notifyUser` を設定します。

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

Compaction の前に、OpenClaw は **サイレントメモリフラッシュ** ターンを実行して、永続的なメモをディスクに保存できます。この保守ターンでアクティブな会話モデルではなくローカルモデルを使う必要がある場合は、`agents.defaults.compaction.memoryFlush.model` を設定します。

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

メモリフラッシュモデルのオーバーライドは厳密であり、アクティブなセッションのフォールバックチェーンを継承しません。詳細と設定については、[メモリ](/ja-JP/concepts/memory)を参照してください。

## プラグイン可能な Compaction プロバイダー

Plugins は、Plugin API の `registerCompactionProvider()` を通じてカスタム Compaction プロバイダーを登録できます。プロバイダーが登録および設定されている場合、OpenClaw は組み込みの LLM パイプラインではなく、そのプロバイダーに要約を委任します。

登録済みプロバイダーを使うには、設定でその ID を指定します。

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
プロバイダーが失敗した場合、または空の結果を返した場合、OpenClaw は組み込みの LLM 要約へフォールバックします。
</Note>

## Compaction とプルーニング

|                  | Compaction                    | プルーニング                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **何をするか** | 古い会話を要約します | 古いツール結果を削ります           |
| **保存されるか**       | はい（セッショントランスクリプト内）   | いいえ（リクエストごとのメモリ内のみ） |
| **範囲**        | 会話全体           | ツール結果のみ                |

[セッションプルーニング](/ja-JP/concepts/session-pruning) は、要約せずにツール出力を削る、より軽量な補完機能です。

## トラブルシューティング

**Compaction の頻度が高すぎますか？** モデルのコンテキストウィンドウが小さいか、ツール出力が大きい可能性があります。[セッションプルーニング](/ja-JP/concepts/session-pruning) を有効にしてみてください。

**Compaction 後にコンテキストが古く感じますか？** `/compact Focus on <topic>` を使って要約を誘導するか、メモが残るように [メモリフラッシュ](/ja-JP/concepts/memory) を有効にします。

**まっさらな状態が必要ですか？** `/new` は Compaction せずに新しいセッションを開始します。

高度な設定（予約トークン、識別子の保持、カスタムコンテキストエンジン、OpenAI サーバー側 Compaction）については、[セッション管理の詳細](/ja-JP/reference/session-management-compaction)を参照してください。

## 関連

- [セッション](/ja-JP/concepts/session): セッション管理とライフサイクル。
- [セッションプルーニング](/ja-JP/concepts/session-pruning): ツール結果の削減。
- [コンテキスト](/ja-JP/concepts/context): エージェントターン用のコンテキストが構築される仕組み。
- [フック](/ja-JP/automation/hooks): Compaction ライフサイクルフック（`before_compaction`, `after_compaction`）。
