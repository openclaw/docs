---
read_when:
    - 自動Compaction と /compact について理解する
    - 長時間セッションがコンテキスト制限に達する問題をデバッグしている
summary: OpenClawが長い会話を要約し、モデル制限内に収める方法
title: Compaction
x-i18n:
    generated_at: "2026-06-27T11:06:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

すべてのモデルにはコンテキストウィンドウがあります。これは、そのモデルが処理できるトークン数の上限です。会話がその上限に近づくと、OpenClaw は古いメッセージを要約へ **Compaction** し、チャットを続けられるようにします。

## 仕組み

1. 古い会話ターンはコンパクトなエントリに要約されます。
2. 要約はセッションのトランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClaw が履歴を Compaction チャンクに分割するとき、アシスタントのツール呼び出しは対応する `toolResult` エントリとペアのまま保持されます。分割点がツールブロックの中に入る場合、OpenClaw は境界を移動してペアを一緒に保ち、現在の未要約の末尾を維持します。

完全な会話履歴はディスク上に残ります。Compaction が変更するのは、次のターンでモデルに見える内容だけです。

## 自動 Compaction

自動 Compaction はデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます（その場合、OpenClaw は Compaction して再試行します）。

表示される内容は次のとおりです。

- 通常の Gateway ログの `embedded run auto-compaction start` / `complete`。
- 詳細モードの `🧹 Auto-compaction complete`。
- `/status` に表示される `🧹 Compactions: <count>`。

<Info>
Compaction の前に、OpenClaw は重要なメモを [memory](/ja-JP/concepts/memory) ファイルへ保存するようエージェントに自動で通知します。これによりコンテキストの損失を防ぎます。
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

## 手動 Compaction

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約を誘導する指示を追加できます。

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` が設定されている場合、手動 Compaction はその OpenClaw の切断点を尊重し、再構築されたコンテキスト内に最近の末尾を保持します。明示的な保持予算がない場合、手動 Compaction は厳密なチェックポイントとして動作し、新しい要約のみから続行します。

## 設定

`openclaw.json` の `agents.defaults.compaction` で Compaction を設定します。最も一般的な調整項目を以下に示します。完全なリファレンスは [セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

### 別のモデルを使用する

デフォルトでは、Compaction はエージェントの主モデルを使用します。`agents.defaults.compaction.model` を設定すると、要約をより高性能または特化したモデルに委任できます。この上書きは、`provider/model-id` 文字列、または `agents.defaults.models` に設定された単独のエイリアスを受け付けます。

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

設定済みの単独エイリアスは、Compaction の開始前に正規のプロバイダーとモデルへ解決されます。単独の値がエイリアスと設定済みのリテラルモデル ID の両方に一致する場合、リテラルモデル ID が優先されます。一致しない単独の値は、アクティブなプロバイダー上のモデル ID として残ります。

これはローカルモデルでも機能します。たとえば、要約専用の 2 つ目の Ollama モデルを使えます。

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

未設定の場合、Compaction はアクティブなセッションモデルで開始されます。要約がモデルフォールバック対象のプロバイダーエラーで失敗した場合、OpenClaw はその Compaction 試行をセッションの既存モデルフォールバックチェーン経由で再試行します。フォールバックの選択は一時的なもので、セッション状態には書き戻されません。明示的な `agents.defaults.compaction.model` の上書きは厳密に適用され、セッションのフォールバックチェーンを継承しません。

### 識別子の保持

Compaction の要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。無効にするには `identifierPolicy: "off"` で上書きし、独自のガイダンスには `identifierPolicy: "custom"` と `identifierInstructions` を使います。

### アクティブトランスクリプトのバイトガード

`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されている場合、アクティブな JSONL がそのサイズに達すると、OpenClaw は実行前に通常のローカル Compaction をトリガーします。これは、プロバイダー側のコンテキスト管理によってモデルのコンテキストが健全に保たれていても、ローカルトランスクリプトが増え続ける長時間実行セッションで便利です。これは生の JSONL バイトを分割するのではなく、通常の Compaction パイプラインに意味的な要約を作成させます。

<Warning>
バイトガードには `truncateAfterCompaction: true` が必要です。トランスクリプトのローテーションがないと、アクティブファイルは縮小せず、ガードは非アクティブのままになります。
</Warning>

### 後続トランスクリプト

`agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は既存のトランスクリプトをその場で書き換えません。Compaction 要約、保持された状態、未要約の末尾から新しいアクティブな後続トランスクリプトを作成し、そのコンパクト化された後続をブランチ/復元フローが参照するためのチェックポイントメタデータを記録します。
後続トランスクリプトは、短い再試行ウィンドウ内に到着した完全に重複する長いユーザーターンも削除するため、チャネルの再試行ストームは Compaction 後の次のアクティブトランスクリプトへ持ち越されません。

OpenClaw は新しい Compaction に対して、個別の `.checkpoint.*.jsonl` コピーをもう書き込みません。既存のレガシーチェックポイントファイルは、参照されている間は引き続き使用でき、通常のセッション cleanup によって削除されます。

### Compaction 通知

デフォルトでは、Compaction は通知なしで実行されます。Compaction の開始時と完了時に短いステータスメッセージを表示するには、`notifyUser` を設定します。

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

Compaction の前に、OpenClaw は **サイレントメモリフラッシュ** ターンを実行して、永続的なメモをディスクに保存できます。この保守用ターンでアクティブな会話モデルではなくローカルモデルを使う場合は、`agents.defaults.compaction.memoryFlush.model` を設定します。

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

メモリフラッシュモデルの上書きは厳密に適用され、アクティブセッションのフォールバックチェーンを継承しません。詳細と設定については [Memory](/ja-JP/concepts/memory) を参照してください。

## プラグ可能な Compaction プロバイダー

Plugin は、Plugin API の `registerCompactionProvider()` を介してカスタム Compaction プロバイダーを登録できます。プロバイダーが登録および設定されている場合、OpenClaw は組み込み LLM パイプラインではなく、そのプロバイダーに要約を委任します。

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

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは組み込みパスと同じ Compaction 指示および識別子保持ポリシーを受け取り、OpenClaw はプロバイダー出力後も最近ターンと分割ターンのサフィックスコンテキストを保持します。

<Note>
プロバイダーが失敗するか空の結果を返した場合、OpenClaw は組み込み LLM 要約にフォールバックします。
</Note>

## Compaction とプルーニング

|                  | Compaction                    | プルーニング                     |
| ---------------- | ----------------------------- | -------------------------------- |
| **行うこと**     | 古い会話を要約する            | 古いツール結果を切り詰める       |
| **保存されるか** | はい（セッショントランスクリプト内） | いいえ（リクエストごとのメモリ内のみ） |
| **範囲**         | 会話全体                      | ツール結果のみ                   |

[セッションプルーニング](/ja-JP/concepts/session-pruning) は、要約せずにツール出力を切り詰める軽量な補完機能です。

## トラブルシューティング

**Compaction が頻繁すぎますか？** モデルのコンテキストウィンドウが小さいか、ツール出力が大きい可能性があります。[セッションプルーニング](/ja-JP/concepts/session-pruning) の有効化を試してください。

**Compaction 後にコンテキストが古く感じますか？** 要約を誘導するには `/compact Focus on <topic>` を使うか、メモが残るように [メモリフラッシュ](/ja-JP/concepts/memory) を有効にしてください。

**クリーンな状態から始める必要がありますか？** `/new` は Compaction せずに新しいセッションを開始します。

高度な設定（予約トークン、識別子の保持、カスタムコンテキストエンジン、OpenAI サーバー側 Compaction）については、[セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

## 関連

- [セッション](/ja-JP/concepts/session): セッション管理とライフサイクル。
- [セッションプルーニング](/ja-JP/concepts/session-pruning): ツール結果の切り詰め。
- [コンテキスト](/ja-JP/concepts/context): エージェントターン向けにコンテキストが構築される仕組み。
- [Hooks](/ja-JP/automation/hooks): Compaction ライフサイクルフック（`before_compaction`, `after_compaction`）。
