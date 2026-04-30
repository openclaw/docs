---
read_when:
    - 自分の GPU マシンからモデルを提供したい
    - LM Studio または OpenAI 互換プロキシを接続設定している
    - 最も安全なローカルモデルのガイダンスが必要な場合
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-04-30T05:13:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルでも実行できますが、OpenClaw は大きなコンテキストと、プロンプトインジェクションに対する強力な防御を前提にしています。小型カードではコンテキストが切り詰められ、安全性が低下します。高い水準を目指してください: **最大構成の Mac Studio 2 台以上、または同等の GPU リグ（約 $30k+）**。単一の **24 GB** GPU は、より軽いプロンプトを高めのレイテンシで扱う場合にのみ有効です。**実行できる最大 / フルサイズのモデルバリアント**を使ってください。過度に量子化された、または「小型」のチェックポイントはプロンプトインジェクションのリスクを高めます（[Security](/ja-JP/gateway/security) を参照）。

最も手間の少ないローカルセットアップにしたい場合は、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。このページは、より高性能なローカルスタックとカスタムの OpenAI 互換ローカルサーバー向けの、意見を反映したガイドです。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA ユーザー:** 公式の Ollama Linux インストーラーは、`Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動により起動中に最後のモデルが再読み込みされ、ホストメモリを占有し続けることがあります。Ollama を有効にした後に WSL2 VM が繰り返し再起動する場合は、[WSL2 クラッシュループ](/ja-JP/providers/ollama#wsl2-crash-loop-repeated-reboots) を参照してください。
</Warning>

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最良のローカルスタックです。LM Studio で大規模モデル（例: フルサイズの Qwen、DeepSeek、Llama ビルド）を読み込み、ローカルサーバー（デフォルト `http://127.0.0.1:1234`）を有効にし、Responses API を使って推論を最終テキストから分離します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**セットアップチェックリスト**

- LM Studio をインストールする: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio で**利用可能な最大のモデルビルド**をダウンロードし（「小型」/大幅に量子化されたバリアントは避ける）、サーバーを起動して、`http://127.0.0.1:1234/v1/models` にそれが一覧表示されることを確認する。
- `my-local-model` を、LM Studio に表示される実際のモデル ID に置き換える。
- モデルを読み込んだままにする。コールドロードは起動レイテンシを増やします。
- LM Studio ビルドが異なる場合は、`contextWindow`/`maxTokens` を調整する。
- WhatsApp では、最終テキストだけが送信されるよう Responses API を使い続ける。

ローカル実行時でもホスト型モデルを設定したままにしてください。`models.mode: "merge"` を使うとフォールバックを利用できます。

### ハイブリッド設定: ホスト型をプライマリ、ローカルをフォールバック

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

### ローカル優先、ホスト型の安全網付き

プライマリとフォールバックの順序を入れ替えます。ローカルマシンが停止しているときに Sonnet または Opus へフォールバックできるよう、同じ providers ブロックと `models.mode: "merge"` を維持してください。

### リージョナルホスティング / データルーティング

- ホスト型の MiniMax/Kimi/GLM バリアントは、リージョン固定エンドポイント（例: 米国ホスト）付きで OpenRouter にも存在します。Anthropic/OpenAI フォールバック用に `models.mode: "merge"` を使い続けながら、選択した法域内にトラフィックを保つには、そこでリージョナルバリアントを選択してください。
- ローカルのみの構成は、最も強いプライバシー経路です。プロバイダー機能が必要だがデータフローを制御したい場合、ホスト型のリージョナルルーティングは中間的な選択肢です。

## その他の OpenAI 互換ローカルプロキシ

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、またはカスタム Gateway は、OpenAI 形式の `/v1/chat/completions` エンドポイントを公開していれば動作します。バックエンドが `/v1/responses` サポートを明示的に文書化していない限り、Chat Completions アダプターを使用してください。上記の provider ブロックを、自分のエンドポイントとモデル ID に置き換えます。

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
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

`baseUrl` を持つカスタムプロバイダーで `api` が省略された場合、OpenClaw はデフォルトで `openai-completions` を使います。`127.0.0.1` などのループバックエンドポイントは自動的に信頼されます。LAN、tailnet、プライベート DNS エンドポイントでは、引き続き `request.allowPrivateNetwork: true` が必要です。

`models.providers.<id>.models[].id` の値はプロバイダー内ローカルです。そこにプロバイダー接頭辞を含めないでください。たとえば、`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーでは、次のカタログ ID とモデル参照を使用します。

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

画像添付がエージェントターンに注入されるよう、ローカルまたはプロキシ経由のビジョンモデルには `input: ["text", "image"]` を設定してください。対話型のカスタムプロバイダーオンボーディングは、一般的なビジョンモデル ID を推測し、不明な名前についてのみ質問します。非対話型オンボーディングも同じ推測を使います。不明なビジョン ID には `--custom-image-input` を、見た目は既知のモデルだがエンドポイントの背後ではテキスト専用の場合は `--custom-text-input` を使ってください。

ホスト型モデルをフォールバックとして利用できるよう、`models.mode: "merge"` を維持してください。低速なローカルまたはリモートのモデルサーバーでは、`agents.defaults.timeoutSeconds` を上げる前に `models.providers.<id>.timeoutSeconds` を使います。プロバイダータイムアウトはモデル HTTP リクエストにのみ適用され、接続、ヘッダー、本文ストリーミング、保護された fetch 全体の中断を含みます。

<Note>
カスタム OpenAI 互換プロバイダーでは、`baseUrl` がループバック、プライベート LAN、`.local`、または裸のホスト名に解決される場合、`apiKey: "ollama-local"` のような非シークレットのローカルマーカーを永続化することが許容されます。OpenClaw はこれを、キー不足として報告するのではなく、有効なローカル認証情報として扱います。公開ホスト名を受け入れるプロバイダーには実際の値を使用してください。
</Note>

ローカル / プロキシ経由の `/v1` バックエンドに関する動作メモ:

- OpenClaw はこれらを、ネイティブ OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います
- ネイティブ OpenAI 専用のリクエスト整形はここでは適用されません: `service_tier` なし、Responses の `store` なし、OpenAI reasoning 互換ペイロード整形なし、プロンプトキャッシュヒントなし
- 隠し OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、これらのカスタムプロキシ URL には注入されません

より厳格な OpenAI 互換バックエンド向けの互換性メモ:

- 一部のサーバーは、Chat Completions で構造化された content-part 配列ではなく、文字列の `messages[].content` のみを受け入れます。そのようなエンドポイントには `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- 一部のローカルモデルは、`[tool_name]` に続く JSON と `[END_TOOL_REQUEST]` のような、単独の角括弧付きツールリクエストをテキストとして出力します。OpenClaw は、その名前がそのターンに登録されたツールと完全に一致する場合にのみ、それらを実際のツール呼び出しに昇格します。それ以外の場合、そのブロックは未サポートのテキストとして扱われ、ユーザーに表示される返信からは隠されます。
- モデルがツール呼び出しのように見える JSON、XML、または ReAct 形式のテキストを出力しても、プロバイダーが構造化された呼び出しを出力しなかった場合、OpenClaw はそれをテキストのまま残し、実行 ID、プロバイダー / モデル、検出されたパターン、および利用可能な場合はツール名を含む警告をログに記録します。これは完了したツール実行ではなく、プロバイダー / モデルのツール呼び出し非互換性として扱ってください。
- ツールが実行されず、たとえば生の JSON、XML、ReAct 構文、またはプロバイダー応答内の空の `tool_calls` 配列として assistant テキストに現れる場合は、まずサーバーがツール呼び出し対応のチャットテンプレート / パーサーを使用していることを確認してください。ツール使用が強制された場合にのみパーサーが機能する OpenAI 互換 Chat Completions バックエンドでは、テキスト解析に依存せず、モデルごとのリクエストオーバーライドを設定します。

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  これは、通常のすべてのターンでツールを呼び出す必要があるモデル / セッションにのみ使用してください。OpenClaw のデフォルトプロキシ値である `tool_choice: "auto"` を上書きします。`local/my-local-model` は、`openclaw models list` に表示される正確なプロバイダー / モデル参照に置き換えてください。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- カスタム OpenAI 互換モデルが、組み込みプロファイルを超える OpenAI reasoning effort を受け入れる場合は、モデルの compat ブロックで宣言してください。ここに `"xhigh"` を追加すると、その設定済みプロバイダー / モデル参照に対して、`/think xhigh`、セッションピッカー、Gateway 検証、および `llm-task` 検証がそのレベルを公開します。

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- 一部の小規模または厳格なローカルバックエンドは、特にツールスキーマが含まれる場合、OpenClaw の完全なエージェントランタイムプロンプト形状では不安定です。まず、軽量なローカルプローブでプロバイダー経路を確認してください。

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  完全なエージェントプロンプト形状を使わずに Gateway ルートを確認するには、代わりに Gateway モデルプローブを使用します。

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  ローカルモデルプローブと Gateway モデルプローブは、どちらも指定されたプロンプトのみを送信します。Gateway プローブは Gateway ルーティング、認証、プロバイダー選択を引き続き検証しますが、以前のセッショントランスクリプト、AGENTS / ブートストラップコンテキスト、コンテキストエンジンの組み立て、ツール、および同梱 MCP サーバーは意図的にスキップします。

  それが成功しても通常の OpenClaw エージェントターンが失敗する場合は、まず
  `agents.defaults.experimental.localModelLean: true` を試して、`browser`、`cron`、`message` などの重量級のデフォルトツールを外してください。これは実験的な
  フラグであり、安定したデフォルトモード設定ではありません。詳しくは
  [実験的機能](/ja-JP/concepts/experimental-features) を参照してください。それでも失敗する場合は、
  `models.providers.<provider>.models[].compat.supportsTools: false` を試してください。

- 大きめの OpenClaw 実行でだけバックエンドがまだ失敗する場合、残っている問題は通常、OpenClaw の
  トランスポート層ではなく、上流のモデル/サーバー容量またはバックエンドのバグです。

## トラブルシューティング

- Gateway からプロキシに到達できますか? `curl http://127.0.0.1:1234/v1/models`。
- LM Studio モデルがアンロードされていますか? 再読み込みしてください。コールドスタートは一般的な「ハング」の原因です。
- ローカルサーバーが `terminated`、`ECONNRESET` と表示する、またはターンの途中でストリームを閉じますか?
  OpenClaw は、低カーディナリティの `model.call.error.failureKind` に加えて、
  OpenClaw プロセスの RSS/heap スナップショットを診断情報に記録します。LM Studio/Ollama
  のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ /
  jetsam ログと照合し、モデルサーバーが強制終了されたかどうかを確認してください。
- OpenClaw は、検出されたコンテキストウィンドウが **32k** 未満の場合に警告し、**16k** 未満の場合にブロックします。その事前チェックに当たった場合は、サーバー/モデルのコンテキスト上限を上げるか、より大きなモデルを選択してください。
- コンテキストエラーですか? `contextWindow` を下げるか、サーバー上限を上げてください。
- OpenAI 互換サーバーが `messages[].content ... expected a string` を返しますか?
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- 直接の小さな `/v1/chat/completions` 呼び出しは動作するのに、Gemma や別のローカルモデルで `openclaw infer model run --local`
  が失敗しますか? まずプロバイダー URL、モデル参照、認証
  マーカー、サーバーログを確認してください。ローカルの `model run` にはエージェントツールは含まれません。
  ローカルの `model run` は成功するが大きめのエージェントターンが失敗する場合は、`localModelLean` または `compat.supportsTools: false` でエージェントの
  ツール範囲を減らしてください。
- ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが空の
  `tool_calls` 配列を返しますか? アシスタントの
  テキストを無差別にツール実行へ変換するプロキシを追加しないでください。まずサーバーのチャットテンプレート/パーサーを修正してください。
  ツール使用を強制した場合にのみモデルが動作するなら、上記のモデル単位の
  `params.extra_body.tool_choice: "required"` オーバーライドを追加し、毎ターンでツール呼び出しが期待されるセッションにのみそのモデル
  エントリを使用してください。
- 安全性: ローカルモデルはプロバイダー側のフィルターをスキップします。プロンプトインジェクションの影響範囲を制限するため、エージェントを狭く保ち、compaction を有効にしてください。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
