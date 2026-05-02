---
read_when:
    - 自分の GPU マシンでモデルを提供したい場合
    - LM Studio または OpenAI 互換プロキシを接続している
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-05-02T22:19:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは実現可能です。ただし、ハードウェア、コンテキストサイズ、プロンプトインジェクション防御の要求水準も上がります。小型または過度に量子化されたカードはコンテキストを切り詰め、安全性を損ないます。このページは、上位のローカルスタックとカスタムの OpenAI 互換ローカルサーバー向けの、意見を明確にしたガイドです。最も手間の少ないオンボーディングには、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

## ハードウェアの下限

高めを狙ってください。快適なエージェントループには **フルスペックの Mac Studio 2台以上、または同等の GPU リグ（約$30k+）** が目安です。単一の **24 GB** GPU は、軽めのプロンプトを高いレイテンシで扱う場合に限って機能します。常に **ホストできる最大 / フルサイズのバリアント** を実行してください。小型または大幅に量子化されたチェックポイントは、プロンプトインジェクションのリスクを高めます（[セキュリティ](/ja-JP/gateway/security) を参照）。

## バックエンドを選ぶ

| バックエンド                                         | 使用する場面                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初めてのローカルセットアップ、GUI ローダー、ネイティブ Responses API           |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、手間のかからない systemd サービス          |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントを使った高スループットのセルフホスト配信        |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | 別のモデル API を前段に置き、OpenClaw に OpenAI として扱わせる必要がある場合    |

バックエンドが対応している場合は Responses API（`api: "openai-responses"`）を使用します（LM Studio は対応しています）。それ以外の場合は Chat Completions（`api: "openai-completions"`）を使ってください。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA ユーザー:** 公式 Ollama Linux インストーラーは `Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動がブート中に最後のモデルを再読み込みし、ホストメモリを固定することがあります。Ollama を有効にした後に WSL2 VM が繰り返し再起動する場合は、[WSL2 クラッシュループ](/ja-JP/providers/ollama#wsl2-crash-loop-repeated-reboots) を参照してください。
</Warning>

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最適なローカルスタックです。LM Studio に大規模モデル（たとえば、フルサイズの Qwen、DeepSeek、Llama ビルド）を読み込み、ローカルサーバー（デフォルトは `http://127.0.0.1:1234`）を有効にし、Responses API を使用して推論を最終テキストから分離します。

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
- LM Studio で **利用可能な最大のモデルビルド** をダウンロードし（「small」/大幅に量子化されたバリアントは避ける）、サーバーを起動し、`http://127.0.0.1:1234/v1/models` に表示されることを確認します。
- `my-local-model` を LM Studio に表示される実際のモデル ID に置き換えます。
- モデルを読み込んだままにします。コールドロードは起動レイテンシを追加します。
- LM Studio のビルドが異なる場合は `contextWindow`/`maxTokens` を調整します。
- WhatsApp では、最終テキストだけが送信されるよう Responses API を使ってください。

ローカル実行時でもホスト型モデルは設定したままにしてください。`models.mode: "merge"` を使用してフォールバックを利用可能な状態に保ちます。

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

### ホスト型のセーフティネット付きローカル優先

プライマリとフォールバックの順序を入れ替えます。同じ providers ブロックと `models.mode: "merge"` を維持すれば、ローカルボックスが停止しているときに Sonnet または Opus へフォールバックできます。

### リージョナルホスティング / データルーティング

- ホスト型 MiniMax/Kimi/GLM バリアントは、リージョン固定エンドポイント（例: 米国ホスト）付きで OpenRouter にも存在します。選択した管轄内にトラフィックを維持しつつ、Anthropic/OpenAI フォールバック用に `models.mode: "merge"` を引き続き使用するには、そこでリージョナルバリアントを選んでください。
- ローカルのみが最も強いプライバシー経路です。ホスト型のリージョナルルーティングは、プロバイダー機能が必要だがデータフローも制御したい場合の中間案です。

## その他の OpenAI 互換ローカルプロキシ

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、またはカスタム
Gateway は、OpenAI 形式の `/v1/chat/completions`
エンドポイントを公開していれば動作します。バックエンドが `/v1/responses`
対応を明示的に文書化していない限り、Chat Completions アダプターを使用してください。上の provider ブロックを、あなたの
エンドポイントとモデル ID に置き換えます。

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

`baseUrl` を持つカスタム provider で `api` を省略した場合、OpenClaw はデフォルトで
`openai-completions` を使用します。`127.0.0.1` などのループバックエンドポイントは自動的に信頼されます。LAN、tailnet、プライベート DNS エンドポイントには引き続き
`request.allowPrivateNetwork: true` が必要です。

`models.providers.<id>.models[].id` の値は provider ローカルです。そこに provider プレフィックスを
含めないでください。たとえば、
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーは、次の
カタログ ID とモデル参照を使用する必要があります。

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

画像添付がエージェントターンに注入されるよう、ローカルまたはプロキシされたビジョンモデルでは `input: ["text", "image"]` を設定します。対話型カスタム provider
オンボーディングは一般的なビジョンモデル ID を推測し、不明な名前に対してのみ質問します。
非対話型オンボーディングも同じ推測を使用します。不明なビジョン ID には `--custom-image-input` を使用し、既知に見えるモデルがエンドポイントの背後で
テキスト専用の場合は `--custom-text-input` を使用してください。

ホスト型モデルをフォールバックとして利用可能に保つため、`models.mode: "merge"` を維持してください。
遅いローカルまたはリモートモデルサーバーには、`agents.defaults.timeoutSeconds` を上げる前に
`models.providers.<id>.timeoutSeconds` を使用します。provider タイムアウトはモデル HTTP リクエストにのみ適用され、接続、ヘッダー、本文ストリーミング、
および保護された fetch の合計中断時間を含みます。

<Note>
カスタム OpenAI 互換 provider では、`baseUrl` がループバック、プライベート LAN、`.local`、または裸のホスト名に解決される場合、`apiKey: "ollama-local"` のような非シークレットのローカルマーカーの永続化が受け入れられます。OpenClaw はそれをキー不足として報告するのではなく、有効なローカル認証情報として扱います。公開ホスト名を受け入れる provider には実際の値を使用してください。
</Note>

ローカル/プロキシされた `/v1` バックエンドの動作メモ:

- OpenClaw はこれらをネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います
- ここではネイティブ OpenAI 専用のリクエスト整形は適用されません。つまり
  `service_tier` なし、Responses の `store` なし、OpenAI 推論互換ペイロードの
  整形なし、プロンプトキャッシュヒントなしです
- これらのカスタムプロキシ URL には、隠し OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）
  は注入されません

より厳格な OpenAI 互換バックエンド向けの互換性メモ:

- 一部のサーバーは Chat Completions で、構造化された content-part 配列ではなく、文字列の `messages[].content` のみを受け入れます。そのような
  エンドポイントには
  `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
- 一部のローカルモデルは、`[tool_name]` の後に JSON と `[END_TOOL_REQUEST]` が続くような、単独の角括弧付きツールリクエストをテキストとして出力します。OpenClaw は、その名前がターンに登録された
  ツールと完全一致する場合にのみ、それらを実際のツール呼び出しに昇格します。それ以外の場合、そのブロックは未対応テキストとして扱われ、
  ユーザーに表示される返信からは隠されます。
- モデルが JSON、XML、または ReAct 形式のテキストを出力し、それがツール呼び出しに見えても、
  provider が構造化された invocation を出力していない場合、OpenClaw はそれを
  テキストのままにし、run id、provider/model、検出されたパターン、利用可能な場合は
  ツール名を含む警告をログに記録します。これは完了したツール実行ではなく、provider/model のツール呼び出し
  非互換性として扱ってください。
- ツールが実行されず、raw JSON、
  XML、ReAct 構文、または provider レスポンス内の空の `tool_calls` 配列のように assistant テキストとして表示される場合は、
  まずサーバーがツール呼び出し対応の chat template/parser を使用していることを確認してください。
  parser がツール使用の強制時にのみ動作する OpenAI 互換 Chat Completions バックエンドでは、テキスト
  解析に依存するのではなく、モデル単位のリクエスト override を設定します。

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

  これは、通常のすべてのターンでツールを呼び出すべきモデル/セッションにのみ使用してください。
  OpenClaw のデフォルトプロキシ値 `tool_choice: "auto"` を上書きします。
  `local/my-local-model` は
  `openclaw models list` に表示される正確な provider/model 参照に置き換えてください。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- カスタム OpenAI 互換モデルが組み込みプロファイルを超える OpenAI reasoning efforts を受け入れる場合は、
  モデルの compat ブロックで宣言します。ここに `"xhigh"` を追加すると、
  `/think xhigh`、セッションピッカー、Gateway 検証、`llm-task`
  検証で、その設定済み provider/model 参照に対してそのレベルが公開されます。

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

## 小型または厳格なバックエンド

モデルが正常に読み込まれるものの完全なエージェントターンが誤動作する場合は、上から順に進めます。まずトランスポートを確認し、その後に対象範囲を絞り込んでください。

1. **ローカルモデル自体が応答することを確認する。** ツールなし、エージェントコンテキストなし:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway ルーティングを確認する。** 指定したプロンプトのみを送信します。トランスクリプト、AGENTS ブートストラップ、コンテキストエンジンの組み立て、ツール、同梱 MCP サーバーはスキップしますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行します:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **リーンモードを試す。** 両方のプローブが成功しても、実際のエージェントターンで不正なツール呼び出しや過大なプロンプトにより失敗する場合は、`agents.defaults.experimental.localModelLean: true` を有効にします。最も重い 3 つのデフォルトツール (`browser`, `cron`, `message`) を除外するため、プロンプトの形が小さくなり、壊れにくくなります。完全な説明、使用するタイミング、有効になっていることを確認する方法については、[実験的機能 → ローカルモデルのリーンモード](/ja-JP/concepts/experimental-features#local-model-lean-mode) を参照してください。

4. **最後の手段としてツールを完全に無効化する。** リーンモードで不十分な場合は、そのモデルエントリに `models.providers.<provider>.models[].compat.supportsTools: false` を設定します。その後、そのモデルではエージェントはツール呼び出しなしで動作します。

5. **それ以上は、ボトルネックは上流にあります。** リーンモードと `supportsTools: false` の後でも、大きな OpenClaw 実行でのみバックエンドが失敗する場合、残る問題は通常、上流のモデルまたはサーバー容量です。コンテキストウィンドウ、GPU メモリ、kv-cache のエビクション、またはバックエンドのバグが考えられます。その時点では、OpenClaw のトランスポート層の問題ではありません。

## トラブルシューティング

- Gateway はプロキシに到達できますか? `curl http://127.0.0.1:1234/v1/models`。
- LM Studio モデルがアンロードされていますか? 再読み込みしてください。コールドスタートは「ハング」する一般的な原因です。
- ローカルサーバーが `terminated`、`ECONNRESET` と表示する、またはターンの途中でストリームを閉じますか?
  OpenClaw は低カーディナリティの `model.call.error.failureKind` と、
  OpenClaw プロセスの RSS/ヒープスナップショットを診断情報に記録します。LM Studio/Ollama
  のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS クラッシュ /
  jetsam ログと照合し、モデルサーバーが強制終了されたかどうかを確認してください。
- OpenClaw は、検出されたモデルウィンドウ、または `agents.defaults.contextTokens` が実効ウィンドウを下げている場合は上限なしのモデルウィンドウから、コンテキストウィンドウのプリフライトしきい値を導出します。20% 未満で警告し、下限は **8k** です。ハードブロックは 10% しきい値を使用し、下限は **4k** で、実効コンテキストウィンドウに上限設定されます。そのため、過大なモデルメタデータが、そうでなければ有効なユーザー上限を拒否することはありません。このプリフライトに当たった場合は、サーバー/モデルのコンテキスト制限を引き上げるか、より大きなモデルを選択してください。
- コンテキストエラーですか? `contextWindow` を下げるか、サーバー制限を引き上げてください。
- OpenAI 互換サーバーが `messages[].content ... expected a string` を返しますか?
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- 直接の小さな `/v1/chat/completions` 呼び出しは動作するが、`openclaw infer model run --local`
  が Gemma または別のローカルモデルで失敗しますか? まずプロバイダー URL、モデル参照、認証
  マーカー、サーバーログを確認してください。ローカルの `model run` にはエージェントツールは含まれません。
  ローカルの `model run` が成功しても、より大きなエージェントターンが失敗する場合は、
  `localModelLean` または `compat.supportsTools: false` でエージェントの
  ツール面を減らしてください。
- ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが空の
  `tool_calls` 配列を返しますか? アシスタントのテキストを盲目的にツール実行へ変換するプロキシは追加しないでください。
  まずサーバーのチャットテンプレート/パーサーを修正してください。
  ツール使用を強制した場合にのみモデルが動作するなら、上記のモデル単位の
  `params.extra_body.tool_choice: "required"` オーバーライドを追加し、そのモデル
  エントリは各ターンでツール呼び出しが期待されるセッションにのみ使用してください。
- 安全性: ローカルモデルはプロバイダー側のフィルターをスキップします。プロンプトインジェクションの影響範囲を制限するため、エージェントは絞り込み、Compaction はオンにしてください。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
