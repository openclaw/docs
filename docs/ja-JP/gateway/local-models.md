---
read_when:
    - 自分のGPUマシンからモデルを提供したい場合
    - LM StudioまたはOpenAI互換プロキシを接続している場合
    - 最も安全なローカルモデルのガイダンスが必要な場合
summary: OpenClawをローカルLLM（LM Studio、vLLM、LiteLLM、カスタムOpenAIエンドポイント）で実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-04-15T04:43:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8778cc1c623a356ff3cf306c494c046887f9417a70ec71e659e4a8aae912a780
    source_path: gateway/local-models.md
    workflow: 15
---

# ローカルモデル

ローカルでも運用は可能ですが、OpenClawは大きなコンテキストと、プロンプトインジェクションに対する強力な防御を前提としています。小規模なGPUカードではコンテキストが切り詰められ、安全性も低下します。目安としては、**最大構成のMac Studio 2台以上、または同等のGPUリグ（約3万ドル以上）** を推奨します。**24 GB** のGPU 1枚でも、より軽いプロンプトで高いレイテンシを許容すれば動作します。実行できる範囲で **最大級 / フルサイズのモデルバリアント** を使ってください。強く量子化されたものや「small」チェックポイントは、プロンプトインジェクションのリスクを高めます（[Security](/ja-JP/gateway/security)を参照）。

最も手間の少ないローカルセットアップを求めるなら、まずは [LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。このページは、より高性能なローカル構成や、カスタムのOpenAI互換ローカルサーバー向けの、方針を明確にしたガイドです。

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最良のローカル構成です。LM Studioで大規模モデル（たとえば、フルサイズのQwen、DeepSeek、Llamaビルド）を読み込み、ローカルサーバー（デフォルトでは `http://127.0.0.1:1234`）を有効にし、Responses APIを使って推論を最終テキストから分離します。

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

- LM Studioをインストール: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studioで、利用可能な **最大のモデルビルド** をダウンロードし（「small」や強い量子化バリアントは避ける）、サーバーを起動して、`http://127.0.0.1:1234/v1/models` に表示されることを確認します。
- `my-local-model` を、LM Studioに表示される実際のモデルIDに置き換えます。
- モデルは読み込んだままにしてください。コールドロードは起動時のレイテンシを増やします。
- LM Studioのビルドに合わせて `contextWindow` / `maxTokens` を調整します。
- WhatsAppでは、最終テキストのみが送信されるよう、Responses APIを使ってください。

ローカル実行時でもホスト型モデルは設定したままにしておき、フォールバックを利用できるよう `models.mode: "merge"` を使ってください。

### ハイブリッド構成: ホスト型を主、ローカルをフォールバック

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

### ローカル優先、ホスト型を安全網として利用

主とフォールバックの順序を入れ替えてください。providersブロックと `models.mode: "merge"` はそのままにしておけば、ローカルマシンが停止したときにSonnetやOpusへフォールバックできます。

### リージョナルホスティング / データルーティング

- ホスト型のMiniMax/Kimi/GLMバリアントは、地域固定エンドポイント（たとえば米国ホスト）付きでOpenRouter上にも存在します。そこでリージョナルバリアントを選べば、`models.mode: "merge"` によるAnthropic/OpenAIフォールバックを維持しつつ、トラフィックを希望する法域内にとどめられます。
- ローカル専用が最も強いプライバシー経路です。ホスト型のリージョナルルーティングは、プロバイダー機能は必要だがデータフローも制御したい場合の中間案です。

## その他のOpenAI互換ローカルプロキシ

vLLM、LiteLLM、OAI-proxy、またはカスタムGatewayは、OpenAI形式の `/v1` エンドポイントを公開していれば利用できます。上のproviderブロックを、あなたのエンドポイントとモデルIDに置き換えてください。

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

ホスト型モデルをフォールバックとして使い続けられるよう、`models.mode: "merge"` は維持してください。

ローカル / プロキシ経由の `/v1` バックエンドに関する動作メモ:

- OpenClawはこれらを、ネイティブな
  OpenAIエンドポイントではなく、プロキシ形式のOpenAI互換ルートとして扱います
- そのため、OpenAIネイティブ専用のリクエスト整形はここでは適用されません: `service_tier` なし、Responsesの `store` なし、OpenAI推論互換ペイロード整形なし、プロンプトキャッシュヒントなし
- 非表示のOpenClaw属性ヘッダー（`originator`、`version`、`User-Agent`）
  は、これらのカスタムプロキシURLには注入されません

より厳格なOpenAI互換バックエンド向けの互換性メモ:

- 一部のサーバーは、Chat Completionsで構造化されたcontent-part配列ではなく、文字列の `messages[].content` のみを受け付けます。そのようなエンドポイントでは、
  `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- より小規模または厳格なローカルバックエンドの中には、OpenClawの完全な
  エージェントランタイムのプロンプト形式、とくにツールスキーマが含まれる場合に不安定になるものがあります。バックエンドが小さな直接の `/v1/chat/completions` 呼び出しでは動作するのに、通常の
  OpenClawエージェントターンでは失敗する場合、まず
  `agents.defaults.localModelMode: "lean"` を試して、`browser`、`cron`、`message` のような重量級のデフォルトツールを外してください。それでも失敗するなら、
  `models.providers.<provider>.models[].compat.supportsTools: false` を試してください。
- それでも大きめのOpenClaw実行時だけバックエンドが失敗する場合、残る問題は通常、
  OpenClawのトランスポート層ではなく、上流のモデル / サーバー容量、またはバックエンドのバグです。

## トラブルシューティング

- Gatewayはそのプロキシに到達できますか？ `curl http://127.0.0.1:1234/v1/models`
- LM Studioのモデルがアンロードされていませんか？ 再読み込みしてください。コールドスタートは「停止しているように見える」一般的な原因です。
- OpenClawは、検出されたコンテキストウィンドウが **32k** 未満だと警告し、**16k** 未満だとブロックします。その事前チェックに引っかかった場合は、サーバー / モデルのコンテキスト制限を引き上げるか、より大きなモデルを選んでください。
- コンテキストエラーが出ますか？ `contextWindow` を下げるか、サーバー側の制限を引き上げてください。
- OpenAI互換サーバーが `messages[].content ... expected a string` を返しますか？
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- 小さな直接の `/v1/chat/completions` 呼び出しは動くのに、`openclaw infer model run`
  がGemmaなどのローカルモデルで失敗しますか？ まず
  `compat.supportsTools: false` でツールスキーマを無効化してから再テストしてください。それでもより大きなOpenClawプロンプトでのみサーバーがクラッシュするなら、上流のサーバー / モデルの制限として扱ってください。
- 安全性: ローカルモデルはプロバイダー側フィルターを通らないため、エージェントは狭い用途に絞り、Compactionを有効にして、プロンプトインジェクションの影響範囲を限定してください。
