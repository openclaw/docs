---
read_when:
    - 自分のGPUマシンでモデルを提供したい場合
    - LM Studio または OpenAI 互換プロキシを接続している
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカルLLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-04-30T09:35:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルでも実行可能ですが、OpenClaw は大きなコンテキストとプロンプトインジェクションへの強力な防御を前提にしています。小容量のカードではコンテキストが切り詰められ、安全性が損なわれます。高めを目指してください: **フル構成の Mac Studio 2 台以上、または同等の GPU リグ (約 $30k 以上)**。単一の **24 GB** GPU は、より軽いプロンプトを高いレイテンシで扱う場合にのみ機能します。**実行できる最大 / フルサイズのモデルバリアント**を使用してください。過度に量子化されたチェックポイントや「小型」チェックポイントは、プロンプトインジェクションのリスクを高めます ([Security](/ja-JP/gateway/security) を参照)。

最も手間の少ないローカルセットアップが必要な場合は、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。このページは、上位ローカルスタックとカスタム OpenAI 互換ローカルサーバー向けの、方針を明確にしたガイドです。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA ユーザー:** 公式の Ollama Linux インストーラーは、`Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動によって起動時に最後のモデルが再読み込みされ、ホストメモリを固定することがあります。Ollama を有効にした後、WSL2 VM が繰り返し再起動する場合は、[WSL2 crash loop](/ja-JP/providers/ollama#wsl2-crash-loop-repeated-reboots) を参照してください。
</Warning>

## 推奨: LM Studio + 大規模ローカルモデル (Responses API)

現時点で最適なローカルスタックです。LM Studio で大規模モデル (たとえばフルサイズの Qwen、DeepSeek、または Llama ビルド) を読み込み、ローカルサーバー (既定値 `http://127.0.0.1:1234`) を有効にし、Responses API を使用して推論を最終テキストから分離します。

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

- LM Studio をインストール: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio で **利用可能な最大のモデルビルド** をダウンロードし (「小型」/ 過度に量子化されたバリアントは避ける)、サーバーを起動して、`http://127.0.0.1:1234/v1/models` に表示されることを確認します。
- `my-local-model` を、LM Studio に表示される実際のモデル ID に置き換えます。
- モデルは読み込んだままにします。コールドロードでは起動レイテンシが増えます。
- LM Studio ビルドが異なる場合は、`contextWindow`/`maxTokens` を調整します。
- WhatsApp では、最終テキストだけが送信されるよう Responses API を使い続けます。

ローカル実行時でもホスト型モデルは設定しておいてください。`models.mode: "merge"` を使用すると、フォールバックを利用し続けられます。

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

### ローカル優先、ホスト型のセーフティネット付き

プライマリとフォールバックの順序を入れ替えます。ローカル機が停止しているときに Sonnet または Opus にフォールバックできるよう、同じ providers ブロックと `models.mode: "merge"` を維持してください。

### リージョナルホスティング / データルーティング

- ホスト型の MiniMax/Kimi/GLM バリアントは、OpenRouter 上にもリージョン固定エンドポイント (例: 米国ホスト) 付きで存在します。選択した法域内にトラフィックを維持しつつ、Anthropic/OpenAI フォールバック用に `models.mode: "merge"` を使い続けるには、そこでリージョナルバリアントを選択します。
- ローカルのみが最も強力なプライバシー経路です。ホスト型のリージョナルルーティングは、プロバイダー機能が必要だがデータフローを制御したい場合の中間案です。

## その他の OpenAI 互換ローカルプロキシ

MLX (`mlx_lm.server`)、vLLM、SGLang、LiteLLM、OAI-proxy、またはカスタム Gateway は、OpenAI 形式の `/v1/chat/completions` エンドポイントを公開していれば機能します。バックエンドが `/v1/responses` のサポートを明示的に文書化していない限り、Chat Completions アダプターを使用してください。上の provider ブロックを、自分のエンドポイントとモデル ID に置き換えます。

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

`baseUrl` を持つカスタムプロバイダーで `api` が省略された場合、OpenClaw は既定で `openai-completions` を使用します。`127.0.0.1` などの loopback エンドポイントは自動的に信頼されます。LAN、tailnet、プライベート DNS エンドポイントでは、引き続き `request.allowPrivateNetwork: true` が必要です。

`models.providers.<id>.models[].id` の値はプロバイダー内ローカルです。そこにプロバイダープレフィックスを含めないでください。たとえば、`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーでは、次のカタログ ID とモデル参照を使用します。

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

画像添付がエージェントターンに注入されるように、ローカルまたはプロキシ経由の vision モデルでは `input: ["text", "image"]` を設定します。対話型のカスタムプロバイダーオンボーディングは、一般的な vision モデル ID を推測し、不明な名前についてのみ確認します。非対話型オンボーディングでも同じ推測を使用します。不明な vision ID には `--custom-image-input` を、既知のように見えるモデルがエンドポイント背後ではテキスト専用の場合は `--custom-text-input` を使用してください。

ホスト型モデルをフォールバックとして利用し続けられるよう、`models.mode: "merge"` を維持します。遅いローカルまたはリモートモデルサーバーには、`agents.defaults.timeoutSeconds` を上げる前に `models.providers.<id>.timeoutSeconds` を使用してください。プロバイダータイムアウトは、接続、ヘッダー、本文ストリーミング、ガードされた fetch 全体の中断を含むモデル HTTP リクエストにのみ適用されます。

<Note>
カスタム OpenAI 互換プロバイダーでは、`baseUrl` が loopback、プライベート LAN、`.local`、または裸のホスト名に解決される場合、`apiKey: "ollama-local"` のような非シークレットのローカルマーカーを永続化できます。OpenClaw はこれを、キー不足として報告するのではなく、有効なローカル認証情報として扱います。公開ホスト名を受け入れるプロバイダーには実際の値を使用してください。
</Note>

ローカル / プロキシ経由の `/v1` バックエンドに関する動作メモ:

- OpenClaw はこれらをネイティブ OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います
- ネイティブ OpenAI 専用のリクエスト整形はここでは適用されません: `service_tier` なし、Responses `store` なし、OpenAI reasoning 互換ペイロード整形なし、プロンプトキャッシュヒントなしです
- 隠し OpenClaw 帰属ヘッダー (`originator`、`version`、`User-Agent`) は、これらのカスタムプロキシ URL には注入されません

より厳密な OpenAI 互換バックエンド向けの互換性メモ:

- 一部のサーバーは、Chat Completions の `messages[].content` として、構造化された content-part 配列ではなく文字列のみを受け入れます。そのようなエンドポイントには `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
- 一部のローカルモデルは、`[tool_name]` に続く JSON と `[END_TOOL_REQUEST]` のように、単独の角括弧付きツールリクエストをテキストとして出力します。OpenClaw は、その名前がそのターンに登録されたツールと完全に一致する場合にのみ、それらを実際のツール呼び出しに昇格します。それ以外の場合、そのブロックは未対応のテキストとして扱われ、ユーザーに表示される返信からは非表示になります。
- モデルが JSON、XML、または ReAct 形式のテキストを出力し、それがツール呼び出しのように見えても、プロバイダーが構造化 invocation を出力しなかった場合、OpenClaw はそれをテキストのままにし、利用可能な場合は run id、プロバイダー / モデル、検出されたパターン、ツール名とともに警告をログに記録します。これは完了したツール実行ではなく、プロバイダー / モデルのツール呼び出し非互換性として扱ってください。
- ツールが実行されず assistant テキストとして表示される場合、たとえば生の JSON、XML、ReAct 構文、またはプロバイダー応答内の空の `tool_calls` 配列がある場合は、まずサーバーがツール呼び出し対応のチャットテンプレート / パーサーを使用していることを確認します。ツール使用を強制した場合にのみパーサーが機能する OpenAI 互換 Chat Completions バックエンドでは、テキスト解析に頼るのではなく、モデルごとのリクエストオーバーライドを設定します。

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

  これは、すべての通常ターンでツールを呼び出す必要があるモデル / セッションにのみ使用してください。OpenClaw の既定のプロキシ値 `tool_choice: "auto"` を上書きします。`local/my-local-model` は、`openclaw models list` に表示される正確なプロバイダー / モデル参照に置き換えてください。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- カスタム OpenAI 互換モデルが、組み込みプロファイルを超える OpenAI reasoning efforts を受け入れる場合は、モデルの compat ブロックで宣言します。ここに `"xhigh"` を追加すると、設定済みのプロバイダー / モデル参照について、`/think xhigh`、セッションピッカー、Gateway 検証、`llm-task` 検証がそのレベルを公開します。

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

- 一部の小規模または厳密なローカルバックエンドは、特にツールスキーマが含まれる場合、OpenClaw の完全なエージェントランタイムプロンプト形状では不安定です。まず、軽量なローカルプローブでプロバイダー経路を確認します。

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  完全なエージェントプロンプト形状なしで Gateway ルートを確認するには、代わりに Gateway モデルプローブを使用します。

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  ローカルモデルプローブと Gateway モデルプローブは、どちらも指定されたプロンプトのみを送信します。Gateway プローブは引き続き Gateway ルーティング、認証、プロバイダー選択を検証しますが、過去のセッショントランスクリプト、AGENTS/bootstrap コンテキスト、context-engine アセンブリ、ツール、バンドルされた MCP サーバーは意図的にスキップします。

  それが成功しても通常の OpenClaw エージェントターンが失敗する場合は、まず
  `agents.defaults.experimental.localModelLean: true` を試して、`browser`、`cron`、`message` などの重量級の
  既定ツールを外してください。これは実験的な
  フラグであり、安定した既定モード設定ではありません。
  [実験的機能](/ja-JP/concepts/experimental-features)を参照してください。それでも失敗する場合は、
  `models.providers.<provider>.models[].compat.supportsTools: false` を試してください。

- バックエンドがより大きな OpenClaw 実行でだけ失敗し続ける場合、残っている問題は
  通常、OpenClaw のトランスポート層ではなく、上流のモデル/サーバー容量またはバックエンドのバグです。

## トラブルシューティング

- Gateway はプロキシに到達できますか？ `curl http://127.0.0.1:1234/v1/models`。
- LM Studio モデルがアンロードされていますか？ 再読み込みしてください。コールドスタートは「ハング」の一般的な原因です。
- ローカルサーバーが `terminated`、`ECONNRESET` と表示する、またはターンの途中でストリームを閉じますか？
  OpenClaw は低カーディナリティの `model.call.error.failureKind` に加えて、
  OpenClaw プロセスの RSS/ヒープスナップショットを診断情報に記録します。LM Studio/Ollama
  のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ /
  jetsam ログと照合し、モデルサーバーが終了させられたかどうかを確認してください。
- OpenClaw は、検出されたモデルウィンドウ、または `agents.defaults.contextTokens` が有効ウィンドウを下げている場合は上限なしのモデルウィンドウから、コンテキストウィンドウの事前チェックしきい値を導出します。20% 未満では **8k** の下限付きで警告します。ハードブロックは **4k** の下限付きで 10% のしきい値を使い、有効なコンテキストウィンドウまでに制限されるため、過大なモデルメタデータによって本来有効なユーザー上限が拒否されることはありません。この事前チェックに引っかかった場合は、サーバー/モデルのコンテキスト上限を引き上げるか、より大きなモデルを選択してください。
- コンテキストエラーですか？ `contextWindow` を下げるか、サーバー上限を引き上げてください。
- OpenAI 互換サーバーが `messages[].content ... expected a string` を返しますか？
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- 小さな直接の `/v1/chat/completions` 呼び出しは動作するのに、`openclaw infer model run --local`
  が Gemma または別のローカルモデルで失敗しますか？ まずプロバイダー URL、モデル参照、認証
  マーカー、サーバーログを確認してください。ローカルの `model run` にはエージェントツールは含まれません。
  ローカルの `model run` は成功するのに、より大きなエージェントターンが失敗する場合は、`localModelLean`
  または `compat.supportsTools: false` でエージェントの
  ツール範囲を減らしてください。
- ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが
  空の `tool_calls` 配列を返しますか？ アシスタントの
  テキストをツール実行に盲目的に変換するプロキシを追加しないでください。先にサーバーのチャットテンプレート/パーサーを修正してください。
  ツール使用を強制した場合にのみモデルが動作する場合は、上記のモデル単位の
  `params.extra_body.tool_choice: "required"` オーバーライドを追加し、すべてのターンでツール呼び出しが期待されるセッションに限ってそのモデル
  エントリを使用してください。
- 安全性: ローカルモデルはプロバイダー側のフィルターをスキップします。プロンプトインジェクションの影響範囲を制限するため、エージェントは狭く保ち、Compaction を有効にしてください。

## 関連項目

- [構成リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
