---
read_when:
    - 自分のGPUマシンからモデルを提供したい
    - LM Studio または OpenAI 互換プロキシを接続している
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-07-06T10:49:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0cb81958fb70660a6eee290171102d68b520a0498bd3f3333cf646c9aea00f41
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは動作しますが、ハードウェア、コンテキストサイズ、プロンプトインジェクション防御の要件が高くなります。小型モデルや積極的に量子化されたモデルは、コンテキストを切り詰め、プロバイダー側の安全フィルターをスキップします。このページでは、より上位のローカルスタックとカスタム OpenAI 互換サーバーを扱います。最も手間の少ない経路として、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

選択されたモデルが必要とするときだけ起動すべきローカルサーバーについては、[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。

## ハードウェアの下限

快適なエージェントループには、**最大構成の Mac Studio 2台以上、または同等の GPU リグ（約 $30k+）**を目安にしてください。単一の **24 GB** GPU では、より軽いプロンプトを高いレイテンシで処理できる程度です。常に**ホストできる最大 / フルサイズのバリアント**を実行してください - 小型または強く量子化されたチェックポイントはプロンプトインジェクションのリスクを高めます（[セキュリティ](/ja-JP/gateway/security) を参照）。

## バックエンドを選ぶ

| バックエンド                                         | 使用する場面                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/ja-JP/providers/ds4)                                | macOS Metal 上のローカル DeepSeek V4 Flash で OpenAI 互換ツール呼び出しを使う場合 |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初回のローカルセットアップ、GUI ローダー、ネイティブ Responses API            |
| LiteLLM / OAI-proxy / カスタム OpenAI 互換プロキシ | 別のモデル API の前段に置き、OpenClaw に OpenAI として扱わせたい場合          |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントを使った高スループットのセルフホスト配信       |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、手放しで動く systemd サービス            |

バックエンドが対応している場合（LM Studio は対応）、`api: "openai-responses"` を使います。それ以外は `api: "openai-completions"` を使います。`baseUrl` を持つカスタムプロバイダーで `api` を省略すると、OpenClaw はデフォルトで `openai-completions` を使います。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** 公式の Ollama Linux インストーラーは、`Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動により起動時に最後のモデルが再読み込みされ、ホストメモリを固定して VM の再起動が繰り返されることがあります。[WSL2 クラッシュループ](/ja-JP/providers/ollama#troubleshooting) を参照してください。
</Warning>

## LM Studio + 大規模ローカルモデル（Responses API）

これは現時点で最良のローカルスタックです。LM Studio で大規模モデル（フルサイズの Qwen、DeepSeek、または Llama ビルド）を読み込み、ローカルサーバー（デフォルト `http://127.0.0.1:1234`）を有効にし、Responses API を使って推論を最終テキストから分離します。

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

セットアップチェックリスト:

- LM Studio をインストール: [https://lmstudio.ai](https://lmstudio.ai)
- **利用可能な最大のモデルビルド**をダウンロードし（「small」や強く量子化されたバリアントは避ける）、サーバーを起動して、`http://127.0.0.1:1234/v1/models` に表示されることを確認します。
- `my-local-model` を LM Studio に表示される実際のモデル ID に置き換えます。
- モデルを読み込んだままにしてください。コールドロードは起動レイテンシを増やします。
- LM Studio ビルドが異なる場合は、`contextWindow`/`maxTokens` を調整します。
- WhatsApp では、最終テキストだけが送信されるように Responses API を使い続けます。
- ホスト型モデルをフォールバックとして利用できるように、`models.mode: "merge"` を維持します。

### ハイブリッド設定: ホスト型プライマリ、ローカルフォールバック

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

ローカル優先でホスト型の安全網を使う場合は、`primary`/`fallbacks` の順序を入れ替え、同じ `providers` ブロックと `models.mode: "merge"` を維持します。

### リージョナルホスティング / データルーティング

ホスト型の MiniMax/Kimi/GLM バリアントは、OpenRouter 上にもリージョン固定エンドポイント（例: 米国ホスト）として存在します。選択した管轄内にトラフィックを保ちながら Anthropic/OpenAI フォールバック用に `models.mode: "merge"` を維持するには、リージョナルバリアントを選びます。ローカルのみが依然として最も強いプライバシー経路です。プロバイダー機能が必要だがデータフローを制御したい場合、ホスト型のリージョナルルーティングが中間の選択肢です。

## その他の OpenAI 互換ローカルプロキシ

OpenAI 形式の `/v1/chat/completions` エンドポイントを公開していれば、MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、または任意のカスタムゲートウェイが動作します。バックエンドが `/v1/responses` 対応を明示的に文書化していない限り、`openai-completions` を使います。

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

カスタム / ローカルプロバイダーのエントリは、保護されたモデルリクエストについて、構成された正確な `baseUrl` オリジンを信頼します。これにはループバック、LAN、tailnet、プライベート DNS ホストが含まれます。メタデータ / リンクローカルのオリジンは常にブロックされます。それ以外のプライベートオリジンへのリクエストには、引き続き `models.providers.<id>.request.allowPrivateNetwork: true` が必要です。正確なオリジン信頼を無効にするには、信頼フラグを `false` に設定します。

`models.providers.<id>.models[].id` はプロバイダー内ローカルです - プロバイダープレフィックスを含めないでください。`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーの場合:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ローカルまたはプロキシされた vision モデルでは、画像添付がエージェントターンに注入されるように `input: ["text", "image"]` を設定します。対話型のカスタムプロバイダーオンボーディングは一般的な vision モデル ID を推定し、不明な名前についてのみ質問します。非対話型オンボーディングも同じ推定を使い、`--custom-image-input` / `--custom-text-input` で上書きできます。

遅いローカル / リモートモデルサーバーには、`agents.defaults.timeoutSeconds` を上げる前に `models.providers.<id>.timeoutSeconds` を使います。プロバイダータイムアウトは、モデル HTTP リクエストに限り、接続、ヘッダー、本文ストリーミング、保護された fetch 全体の中止を対象にします - エージェント / 実行タイムアウトのほうが低い場合は、それも上げてください。プロバイダータイムアウトでは実行全体を延長できないためです。

<Note>
カスタム OpenAI 互換プロバイダーでは、`baseUrl` がループバック、プライベート LAN、`.local`、またはベアホスト名に解決される場合、`apiKey: "ollama-local"` のようなシークレットではないローカルマーカーが受け入れられます。OpenClaw はキー不足として報告するのではなく、有効なローカル資格情報として扱います。公開ホスト名を受け付けるプロバイダーには実際の値を使ってください。
</Note>

ローカル / プロキシされた `/v1` バックエンドの挙動メモ:

- OpenClaw はこれらをネイティブ OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います。
- ネイティブ OpenAI 専用のリクエスト整形は適用されません。`service_tier` なし、Responses の `store` なし、OpenAI 推論互換ペイロード整形なし、プロンプトキャッシュヒントなしです。
- 隠し OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）はカスタムプロキシ URL には注入されません。

より厳密な OpenAI 互換バックエンド向けの互換オーバーライド:

- **文字列のみのコンテンツ**: 一部のサーバーは、構造化されたコンテンツパート配列ではなく、文字列の `messages[].content` のみを受け付けます。`models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
- **厳密なメッセージキー**: サーバーが `role`/`content` 以外を持つメッセージエントリを拒否する場合は、`compat.strictMessageKeys: true` を設定します。
- **角括弧付きツールテキスト**: 一部のローカルモデルは、`[tool_name]` に JSON と `[END_TOOL_REQUEST]` が続くような、単独の角括弧付きツールリクエストをテキストとして出力します。OpenClaw は、その名前がそのターンに登録されたツールと完全一致する場合にのみ、実際のツール呼び出しへ昇格します。それ以外の場合は、非表示の未対応テキストのままです。
- **ツール呼び出しらしく見える非構造化テキスト**: モデルがツール呼び出しのように見える JSON/XML/ReAct 形式のテキストを出力したものの、構造化された呼び出しではなかった場合、OpenClaw はそれをテキストのままにし、実行 ID、プロバイダー / モデル、検出されたパターン、利用可能な場合はツール名を含む警告をログに記録します。これはプロバイダー / モデルの非互換であり、完了したツール実行ではありません。
- **ツール使用の強制**: ツールがアシスタントテキスト（生の JSON/XML/ReAct、または空の `tool_calls` 配列）として現れる場合、まずサーバーのチャットテンプレート / パーサーがツール呼び出しに対応していることを確認してください。ツール使用を強制した場合にのみパーサーが動作するなら、モデルごとにデフォルトのプロキシ値 `tool_choice: "auto"` を上書きします。

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

  これは通常のすべてのターンでツールを呼ぶべき場合にのみ使ってください。`local/my-local-model` を `openclaw models list` の正確な参照に置き換えるか、CLI で設定します。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **追加の推論 effort**: カスタム OpenAI 互換モデルが組み込みプロファイルを超える OpenAI 推論 effort を受け付ける場合は、モデルの compat ブロックで宣言します。`"xhigh"` を追加すると、そのモデル参照について `/think xhigh`、セッションピッカー、Gateway 検証、`llm-task` 検証で利用可能になります。

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

## 小型またはより厳密なバックエンド

モデルは正常に読み込まれるものの、完全なエージェントターンが誤動作する場合は、上から順に確認します。まずトランスポートを確認し、その後に対象範囲を狭めます。

1. **ローカルモデルが応答することを確認** - ツールなし、エージェントコンテキストなし:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway ルーティングを確認する** - transcript、AGENTS bootstrap、context-engine assembly、tools、バンドル済み MCP servers をスキップしてプロンプトのみを送信しますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行します。

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **リーンモードを試す** 両方のプローブが成功しても、実際のエージェントターンが不正な形式のツール呼び出しや過大なプロンプトで失敗する場合は、`agents.defaults.experimental.localModelLean: true` を設定します。明示的に必要でない限り、重量級のブラウザー、Cron、メッセージ、メディア生成、音声、PDF ツールを除外し、より大きなツールカタログはデフォルトで構造化されたツール検索コントロールの背後に置きます。詳細と有効化の確認方法は、[実験的機能 -> ローカルモデルリーンモード](/ja-JP/concepts/experimental-features#local-model-lean-mode) を参照してください。

4. **最後の手段としてツールを完全に無効化する** そのモデルに `models.providers.<provider>.models[].compat.supportsTools: false` を設定します。これにより、エージェントはツール呼び出しなしで実行されます。

5. **そこから先のボトルネックはアップストリームです。** リーンモードと `supportsTools: false` の後でも、より大きな OpenClaw 実行でのみバックエンドが失敗する場合、残っている問題は通常、OpenClaw のトランスポート層ではなく、モデルまたはサーバー自体、つまりコンテキストウィンドウ、GPU メモリ、kv-cache の退避、またはバックエンドのバグです。

## トラブルシューティング

- **Gateway がプロキシに到達できない場合** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio モデルがアンロードされている場合** 再読み込みしてください。コールドスタートは「ハング」の一般的な原因です。
- **ローカルサーバーが `terminated`、`ECONNRESET` を返す、またはターン中にストリームを閉じる場合** OpenClaw は低カーディナリティの `model.call.error.failureKind` と OpenClaw プロセスの RSS/heap スナップショットを診断に記録します。LM Studio/Ollama のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ/jetsam ログと照合し、モデルサーバーが強制終了されたかどうかを確認してください。
- **コンテキストエラーの場合** OpenClaw は検出されたモデルウィンドウ（または `agents.defaults.contextTokens` によって下げられた上限付きウィンドウ）からコンテキストウィンドウのプリフライトしきい値を導出し、20% 未満では **8k** を下限として警告し、10% 未満では **4k** を下限としてハードブロックします（有効なコンテキストウィンドウに上限設定されるため、過大なモデルメタデータによって有効なユーザー上限が拒否されることはありません）。`contextWindow` を下げるか、サーバー/モデルのコンテキスト上限を上げてください。
- **`messages[].content ... expected a string` の場合** そのモデルエントリに `compat.requiresStringContent: true` を追加します。
- **`validation.keys`、または「メッセージエントリは `role` と `content` のみを許可する」の場合** そのモデルエントリに `compat.strictMessageKeys: true` を追加します。
- **直接の `/v1/chat/completions` 呼び出しは動作するが、Gemma または別のローカルモデルで `openclaw infer model run --local` が失敗する場合** まずプロバイダー URL、モデル参照、認証マーカー、サーバーログを確認してください。`model run` はエージェントツールを完全にスキップします。`model run` が成功しても、より大きなエージェントターンが失敗する場合は、`localModelLean` または `compat.supportsTools: false` でツール面を減らしてください。
- **ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが空の `tool_calls` 配列を返す場合** アシスタントテキストを盲目的にツール実行へ変換するプロキシを追加しないでください。まずサーバーのチャットテンプレート/パーサーを修正してください。ツール使用を強制した場合にのみモデルが動作するなら、上記の `params.extra_body.tool_choice: "required"` オーバーライドを追加し、毎ターンでツール呼び出しが想定されるセッションにのみそのモデルエントリを使用してください。
- **安全性**: ローカルモデルはプロバイダー側のフィルターをスキップします。プロンプトインジェクションの影響範囲を抑えるため、エージェントは狭く保ち、Compaction を有効にしてください。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
