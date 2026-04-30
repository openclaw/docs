---
read_when:
    - 自動Compactionと /compact について理解したい
    - コンテキスト上限に達する長時間セッションをデバッグしている
summary: OpenClaw が長い会話を要約してモデルの制限内に収める仕組み
title: Compaction
x-i18n:
    generated_at: "2026-04-30T05:07:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

すべてのモデルにはコンテキストウィンドウがあります。これは、処理できるトークン数の上限です。会話がその上限に近づくと、OpenClaw は古いメッセージを要約へ **compacts** し、チャットを継続できるようにします。

## 仕組み

1. 古い会話ターンがコンパクトなエントリに要約されます。
2. 要約はセッショントランスクリプトに保存されます。
3. 最近のメッセージはそのまま保持されます。

OpenClaw が履歴を Compaction チャンクに分割するとき、アシスタントのツール呼び出しは対応する `toolResult` エントリとペアのまま保持されます。分割点がツールブロック内に来た場合、OpenClaw は境界を移動してペアを一緒に保ち、現在の未要約の末尾を保持します。

完全な会話履歴はディスク上に残ります。Compaction が変更するのは、次のターンでモデルが見る内容だけです。

## 自動 Compaction

自動 Compaction はデフォルトで有効です。セッションがコンテキスト上限に近づいたとき、またはモデルがコンテキストオーバーフローエラーを返したときに実行されます。この場合、OpenClaw は Compaction を行って再試行します。

次の表示が見えます。

- 詳細モードで `🧹 Auto-compaction complete`。
- `/status` に `🧹 Compactions: <count>`。

<Info>
Compaction の前に、OpenClaw は重要なメモを [memory](/ja-JP/concepts/memory) ファイルへ保存するようエージェントに自動でリマインドします。これによりコンテキストの損失を防ぎます。
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

任意のチャットで `/compact` と入力すると、Compaction を強制できます。要約の方向付けをするには指示を追加します。

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` が設定されている場合、手動 Compaction はその Pi カットポイントを尊重し、再構築されたコンテキスト内に最近の末尾を保持します。明示的な保持バジェットがない場合、手動 Compaction はハードチェックポイントとして動作し、新しい要約だけから継続します。

## 設定

`openclaw.json` の `agents.defaults.compaction` で Compaction を設定します。よく使うノブを以下に示します。完全なリファレンスは [セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

### 別のモデルを使う

デフォルトでは、Compaction はエージェントのプライマリモデルを使用します。`agents.defaults.compaction.model` を設定すると、要約をより高性能なモデルや専用モデルへ委任できます。このオーバーライドは任意の `provider/model-id` 文字列を受け付けます。

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

未設定の場合、Compaction はエージェントのプライマリモデルを使用します。

### 識別子の保持

Compaction 要約は、デフォルトで不透明な識別子を保持します（`identifierPolicy: "strict"`）。無効にするには `identifierPolicy: "off"` で上書きし、カスタムのガイダンスを使うには `identifierPolicy: "custom"` と `identifierInstructions` を併用します。

### アクティブトランスクリプトのバイトガード

`agents.defaults.compaction.maxActiveTranscriptBytes` が設定されている場合、アクティブな JSONL がそのサイズに達すると、OpenClaw は実行前に通常のローカル Compaction をトリガーします。これは、プロバイダー側のコンテキスト管理によりモデルコンテキストは健全に保たれていても、ローカルトランスクリプトが増え続ける長時間実行セッションで役立ちます。生の JSONL バイトを分割するのではなく、通常の Compaction パイプラインにセマンティックな要約を作成させます。

<Warning>
バイトガードには `truncateAfterCompaction: true` が必要です。トランスクリプトローテーションがない場合、アクティブファイルは縮小せず、ガードは非アクティブのままです。
</Warning>

### 後続トランスクリプト

`agents.defaults.compaction.truncateAfterCompaction` が有効な場合、OpenClaw は既存のトランスクリプトをその場で書き換えません。Compaction 要約、保持された状態、未要約の末尾から新しいアクティブな後続トランスクリプトを作成し、以前の JSONL はアーカイブ済みチェックポイントソースとして保持します。
後続トランスクリプトでは、短い再試行ウィンドウ内に到着した完全に重複する長いユーザーターンも削除されるため、チャネルの再試行ストームが Compaction 後の次のアクティブトランスクリプトへ持ち越されません。

Compaction 前のチェックポイントは、OpenClaw のチェックポイントサイズ上限を下回っている間だけ保持されます。サイズが大きすぎるアクティブトランスクリプトも Compaction されますが、OpenClaw はディスク使用量を倍増させる代わりに、大きなデバッグスナップショットをスキップします。

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

Compaction の前に、OpenClaw は **サイレントメモリフラッシュ** ターンを実行して、永続的なメモをディスクへ保存できます。この保守用ターンでアクティブな会話モデルではなくローカルモデルを使う必要がある場合は、`agents.defaults.compaction.memoryFlush.model` を設定します。

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

メモリフラッシュモデルのオーバーライドは厳密であり、アクティブセッションのフォールバックチェーンを継承しません。詳細と設定については [メモリ](/ja-JP/concepts/memory) を参照してください。

## プラグ可能な Compaction プロバイダー

Plugins は、Plugin API の `registerCompactionProvider()` を通じてカスタム Compaction プロバイダーを登録できます。プロバイダーが登録され設定されている場合、OpenClaw は組み込みの LLM パイプラインではなく、そのプロバイダーへ要約を委任します。

登録済みプロバイダーを使うには、設定でその id を指定します。

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

`provider` を設定すると、自動的に `mode: "safeguard"` が強制されます。プロバイダーは組み込みパスと同じ Compaction 指示と識別子保持ポリシーを受け取り、OpenClaw はプロバイダー出力後も最近ターンと分割ターンのサフィックスコンテキストを保持します。

<Note>
プロバイダーが失敗した場合、または空の結果を返した場合、OpenClaw は組み込みの LLM 要約にフォールバックします。
</Note>

## Compaction と枝刈り

|                  | Compaction                    | 枝刈り                           |
| ---------------- | ----------------------------- | -------------------------------- |
| **行うこと** | 古い会話を要約します | 古いツール結果を切り詰めます           |
| **保存されるか**       | はい（セッショントランスクリプト内）   | いいえ（リクエストごとのメモリ内のみ） |
| **範囲**        | 会話全体           | ツール結果のみ                |

[セッション枝刈り](/ja-JP/concepts/session-pruning) は、要約せずにツール出力を切り詰める、より軽量な補完機能です。

## トラブルシューティング

**Compaction が頻繁すぎる場合** モデルのコンテキストウィンドウが小さいか、ツール出力が大きい可能性があります。[セッション枝刈り](/ja-JP/concepts/session-pruning) の有効化を試してください。

**Compaction 後にコンテキストが古く感じる場合** `/compact Focus on <topic>` を使って要約を方向付けるか、[メモリフラッシュ](/ja-JP/concepts/memory) を有効にしてメモが残るようにします。

**白紙の状態が必要な場合** `/new` は Compaction せずに新しいセッションを開始します。

高度な設定（予約トークン、識別子保持、カスタムコンテキストエンジン、OpenAI サーバー側 Compaction）については、[セッション管理の詳細](/ja-JP/reference/session-management-compaction) を参照してください。

## 関連

- [セッション](/ja-JP/concepts/session): セッション管理とライフサイクル。
- [セッション枝刈り](/ja-JP/concepts/session-pruning): ツール結果の切り詰め。
- [コンテキスト](/ja-JP/concepts/context): エージェントターン用にコンテキストがどのように構築されるか。
- [Hooks](/ja-JP/automation/hooks): Compaction ライフサイクルフック（`before_compaction`、`after_compaction`）。
