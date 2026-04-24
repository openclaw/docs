---
read_when:
    - 自分の GPU マシンからモデルを提供したい場合
    - LM Studio または OpenAI 互換プロキシを接続している場合
    - もっとも安全なローカルモデル運用ガイダンスが必要な場合
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-04-24T04:58:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

ローカル運用は可能ですが、OpenClaw は大きなコンテキストと強力なプロンプトインジェクション耐性を前提にしています。小さい GPU ではコンテキストが切り詰められ、安全性も落ちます。目標は高く設定してください: **最大構成の Mac Studio 2 台以上、または同等の GPU リグ（約 $30k 以上）**。単体の **24 GB** GPU は、軽めのプロンプトを高レイテンシで処理する用途にしか向きません。実行できる中で **最大 / フルサイズのモデルバリアント** を使ってください。強く量子化された、または「small」なチェックポイントはプロンプトインジェクションのリスクを高めます（[Security](/ja-JP/gateway/security) を参照）。

もっとも手間の少ないローカルセットアップを望むなら、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。このページは、より高性能なローカルスタックとカスタム OpenAI 互換ローカルサーバー向けの、方針を明確にしたガイドです。

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点でもっとも良いローカルスタックです。LM Studio に大規模モデル（たとえばフルサイズの Qwen、DeepSeek、Llama ビルド）を読み込み、ローカルサーバー（デフォルト `http://127.0.0.1:1234`）を有効にし、Responses API を使って reasoning を最終テキストから分離します。

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**セットアップチェックリスト**

- LM Studio をインストール: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio で、**利用可能な中で最大のモデルビルド** をダウンロードし（「small」や強い量子化バリアントは避ける）、サーバーを起動し、`http://127.0.0.1:1234/v1/models` に一覧表示されることを確認します。
- `my-local-model` を、LM Studio に表示される実際のモデル ID に置き換えます。
- モデルはロードしたままにしてください。コールドロードは起動レイテンシを増やします。
- LM Studio ビルドが異なる場合は `contextWindow` / `maxTokens` を調整してください。
- WhatsApp では、最終テキストだけが送られるよう Responses API を使い続けてください。

ローカル実行時でもホスト型モデルは設定しておいてください。`models.mode: "merge"` を使うと、フォールバックを利用可能なまま保てます。

### ハイブリッド設定: ホスト型を primary、ローカルを fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### ローカル優先 + ホスト型セーフティネット

primary と fallback の順序を入れ替えてください。providers ブロックと `models.mode: "merge"` は同じままにしておけば、ローカルマシンが落ちたときに Sonnet や Opus へフォールバックできます。

### リージョン指定ホスティング / データルーティング

- ホスト型の MiniMax / Kimi / GLM バリアントは、リージョン固定エンドポイント（たとえば米国内ホスト）付きで OpenRouter 上にも存在します。選んだ法域内にトラフィックを留めつつ、Anthropic / OpenAI フォールバックのために `models.mode: "merge"` を維持したい場合は、そこでリージョンバリアントを選んでください。
- ローカル専用がもっとも強いプライバシー経路です。ホスト型リージョンルーティングは、プロバイダ機能が必要だがデータフローは制御したい場合の中間案です。

## その他の OpenAI 互換ローカルプロキシ

vLLM、LiteLLM、OAI-proxy、またはカスタム gateway は、OpenAI 形式の `/v1` エンドポイントを公開していれば動作します。上記の provider ブロックを、あなたのエンドポイントとモデル ID で置き換えてください:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

`models.mode: "merge"` を維持し、ホスト型モデルをフォールバックとして引き続き利用可能にしてください。

ローカル / プロキシ化された `/v1` バックエンドに関する動作メモ:

- OpenClaw はこれらを、ネイティブ OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います
- ここでは OpenAI ネイティブ専用のリクエスト整形は適用されません: `service_tier` なし、Responses `store` なし、OpenAI reasoning 互換ペイロード整形なし、プロンプトキャッシュヒントなし
- 隠し OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、これらのカスタムプロキシ URL には注入されません

より厳格な OpenAI 互換バックエンド向けの互換性メモ:

- 一部のサーバーは Chat Completions で構造化 content-part 配列ではなく、文字列の `messages[].content` しか受け付けません。そのようなエンドポイントには `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- 小型または厳格なローカルバックエンドの一部は、特にツールスキーマが含まれる場合、OpenClaw の完全な agent-runtime プロンプト形状では不安定になります。バックエンドが小さな直接 `/v1/chat/completions` 呼び出しでは動作しても、通常の OpenClaw エージェントターンでは失敗する場合は、まず `agents.defaults.experimental.localModelLean: true` を試して、`browser`、`cron`、`message` のような重いデフォルトツールを外してください。これは実験的フラグであり、安定したデフォルトモード設定ではありません。[Experimental Features](/ja-JP/concepts/experimental-features) を参照してください。それでも失敗する場合は、`models.providers.<provider>.models[].compat.supportsTools: false` を試してください。
- より大きな OpenClaw 実行でのみバックエンドが失敗する場合、残っている問題は通常、OpenClaw のトランスポート層ではなく、上流のモデル / サーバー容量かバックエンドのバグです。

## トラブルシューティング

- Gateway からプロキシへ到達できますか？ `curl http://127.0.0.1:1234/v1/models`
- LM Studio のモデルがアンロードされていませんか？ 再ロードしてください。コールドスタートは「ハングしている」ように見える一般的な原因です。
- OpenClaw は、検出されたコンテキストウィンドウが **32k** 未満だと警告し、**16k** 未満ではブロックします。その事前チェックに引っかかった場合は、サーバー / モデルのコンテキスト上限を上げるか、より大きなモデルを選んでください。
- コンテキストエラーですか？ `contextWindow` を下げるか、サーバー上限を上げてください。
- OpenAI 互換サーバーが `messages[].content ... expected a string` を返しますか？
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- 小さな直接 `/v1/chat/completions` 呼び出しは動くのに、`openclaw infer model run` が Gemma や別のローカルモデルで失敗しますか？ まず `compat.supportsTools: false` でツールスキーマを無効にして再テストしてください。それでも大きな OpenClaw プロンプトでのみサーバーがクラッシュするなら、上流サーバー / モデルの制限として扱ってください。
- 安全性: ローカルモデルはプロバイダ側フィルタをスキップします。プロンプトインジェクションの影響範囲を制限するため、エージェントは狭く保ち、Compaction は有効にしておいてください。

## 関連

- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [Model failover](/ja-JP/concepts/model-failover)
