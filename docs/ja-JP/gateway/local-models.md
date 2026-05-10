---
read_when:
    - 自分の GPU マシンからモデルを提供したい場合
    - LM Studio または OpenAI 互換プロキシを接続設定している
    - 最も安全なローカルモデルのガイダンスが必要な場合
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-05-10T19:36:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは実現可能です。ただし、ハードウェア、コンテキストサイズ、プロンプトインジェクション防御の要求水準も上がります。小型または極端に量子化されたカードではコンテキストが切り詰められ、安全性が漏れやすくなります。このページは、より高性能なローカルスタックとカスタムの OpenAI 互換ローカルサーバー向けの、意見を明確にしたガイドです。最も手間の少ないオンボーディングには、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

選択したモデルが必要とするときだけ起動すべきローカルサーバーについては、
[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。

## ハードウェアの下限

高めを目指してください。快適なエージェントループには **最大構成の Mac Studio 2台以上、または同等の GPU リグ（約$30k+）** が目安です。単一の **24 GB** GPU は、軽いプロンプトを高めのレイテンシで扱う場合にのみ機能します。常に **ホストできる最大 / フルサイズのバリアント** を実行してください。小型または大幅に量子化されたチェックポイントはプロンプトインジェクションのリスクを高めます（[セキュリティ](/ja-JP/gateway/security) を参照）。

## バックエンドを選ぶ

| バックエンド                                         | 使用する場合                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初回のローカルセットアップ、GUI ローダー、ネイティブ Responses API            |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、手放しで使える systemd サービス           |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントでの高スループットなセルフホスト配信           |
| LiteLLM / OAI-proxy / カスタム OpenAI 互換プロキシ   | 別のモデル API を前段に置き、OpenClaw に OpenAI として扱わせる必要がある場合 |

バックエンドが対応している場合（LM Studio は対応）、Responses API（`api: "openai-responses"`）を使用してください。それ以外は Chat Completions（`api: "openai-completions"`）を使い続けます。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA ユーザー:** 公式の Ollama Linux インストーラーは、`Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動によって起動時に最後のモデルが再読み込みされ、ホストメモリを固定してしまうことがあります。Ollama を有効にした後に WSL2 VM が繰り返し再起動する場合は、[WSL2 クラッシュループ](/ja-JP/providers/ollama#wsl2-crash-loop-repeated-reboots) を参照してください。
</Warning>

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最良のローカルスタックです。LM Studio で大規模モデル（たとえば、フルサイズの Qwen、DeepSeek、または Llama ビルド）を読み込み、ローカルサーバー（デフォルト `http://127.0.0.1:1234`）を有効にし、Responses API を使って推論を最終テキストから分離します。

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

- LM Studio をインストールします: [https://lmstudio.ai](https://lmstudio.ai)
- LM Studio で **利用可能な最大のモデルビルド** をダウンロードし（「small」や大幅に量子化されたバリアントは避ける）、サーバーを起動し、`http://127.0.0.1:1234/v1/models` にそれが一覧表示されることを確認します。
- `my-local-model` を、LM Studio に表示される実際のモデル ID に置き換えます。
- モデルを読み込んだままにします。コールドロードは起動レイテンシを追加します。
- LM Studio ビルドが異なる場合は、`contextWindow`/`maxTokens` を調整します。
- WhatsApp では、最終テキストだけが送信されるように Responses API を使い続けます。

ローカル実行中でもホスト型モデルを設定したままにしてください。フォールバックを利用可能にしておくため、`models.mode: "merge"` を使用します。

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

プライマリとフォールバックの順序を入れ替えます。ローカルマシンがダウンしているときに Sonnet または Opus にフォールバックできるよう、同じ providers ブロックと `models.mode: "merge"` を維持します。

### リージョン別ホスティング / データルーティング

- ホスト型の MiniMax/Kimi/GLM バリアントは、OpenRouter にもリージョン固定エンドポイント（例: 米国ホスト）付きで存在します。選択した法域内にトラフィックを維持しつつ、Anthropic/OpenAI フォールバックのために `models.mode: "merge"` を使い続けるには、そこでリージョン別バリアントを選びます。
- ローカル専用が最も強力なプライバシー経路です。ホスト型リージョナルルーティングは、プロバイダー機能が必要だがデータフローを制御したい場合の中間策です。

## その他の OpenAI 互換ローカルプロキシ

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、またはカスタム
Gateway は、OpenAI 形式の `/v1/chat/completions`
エンドポイントを公開していれば機能します。バックエンドが `/v1/responses` 対応を明示的に
文書化していない限り、Chat Completions アダプターを使用してください。上の provider ブロックを
自分のエンドポイントとモデル ID に置き換えます。

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

`baseUrl` を持つカスタム provider で `api` が省略された場合、OpenClaw はデフォルトで
`openai-completions` を使用します。`127.0.0.1` などのループバックエンドポイントは自動的に
信頼されます。LAN、tailnet、プライベート DNS エンドポイントでは、引き続き
`request.allowPrivateNetwork: true` が必要です。

`models.providers.<id>.models[].id` の値は provider ローカルです。そこに
provider プレフィックスを含めないでください。たとえば、
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーでは、
次のカタログ ID とモデル参照を使用します。

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

画像添付がエージェントターンに注入されるよう、ローカルまたはプロキシされたビジョンモデルでは
`input: ["text", "image"]` を設定します。対話型のカスタム provider
オンボーディングは一般的なビジョンモデル ID を推論し、不明な名前についてのみ質問します。
非対話型オンボーディングも同じ推論を使用します。不明なビジョン ID には `--custom-image-input` を、
エンドポイントの背後ではテキスト専用である既知に見えるモデルには `--custom-text-input` を使用してください。

ホスト型モデルをフォールバックとして利用可能にしておくため、`models.mode: "merge"` を維持します。
低速なローカルまたはリモートモデルサーバーには、`agents.defaults.timeoutSeconds` を上げる前に
`models.providers.<id>.timeoutSeconds` を使用してください。provider タイムアウトは、
接続、ヘッダー、本文ストリーミング、保護された fetch 全体の中断を含むモデル HTTP リクエストにのみ適用されます。

<Note>
カスタム OpenAI 互換 provider では、`baseUrl` がループバック、プライベート LAN、`.local`、またはベアホスト名に解決される場合、`apiKey: "ollama-local"` のような非シークレットのローカルマーカーを永続化することが許容されます。OpenClaw はそれを、キー不足として報告する代わりに有効なローカル認証情報として扱います。公開ホスト名を受け入れる provider には実際の値を使用してください。
</Note>

ローカル / プロキシされた `/v1` バックエンドの挙動メモ:

- OpenClaw はこれらを、ネイティブ
  OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います
- ここではネイティブ OpenAI 専用のリクエスト整形は適用されません。つまり、
  `service_tier` なし、Responses の `store` なし、OpenAI 推論互換ペイロード
  整形なし、プロンプトキャッシュヒントなしです
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、
  これらのカスタムプロキシ URL には注入されません

より厳格な OpenAI 互換バックエンド向けの互換性メモ:

- 一部のサーバーは、Chat Completions で構造化された content-part 配列ではなく、
  文字列の `messages[].content` のみを受け入れます。そのようなエンドポイントには
  `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- 一部のローカルモデルは、`[tool_name]` に続く JSON と `[END_TOOL_REQUEST]` のような、
  独立した角括弧付きツールリクエストをテキストとして出力します。OpenClaw は、
  その名前がそのターンに登録済みのツールと完全に一致する場合にのみ、
  それらを実際のツール呼び出しに昇格します。一致しない場合、そのブロックは未対応のテキストとして扱われ、
  ユーザーに表示される返信からは隠されます。
- モデルが JSON、XML、またはツール呼び出しのように見える ReAct 形式のテキストを出力したが、
  provider が構造化 invocation を出力しなかった場合、OpenClaw はそれをテキストのまま残し、
  実行 ID、provider/model、検出されたパターン、利用可能な場合はツール名を含む警告をログに記録します。
  これは完了したツール実行ではなく、provider/model のツール呼び出し
  非互換性として扱ってください。
- ツールが実行されず、たとえば生の JSON、
  XML、ReAct 構文、または provider レスポンス内の空の `tool_calls` 配列のように、assistant テキストとして表示される場合は、
  まずサーバーがツール呼び出し対応のチャットテンプレート / パーサーを使用していることを確認してください。
  ツール使用が強制された場合にのみパーサーが動作する OpenAI 互換 Chat Completions バックエンドでは、
  テキスト解析に頼る代わりに、モデルごとのリクエスト上書きを設定します。

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

  これは、すべての通常ターンでツールを呼び出すべきモデル / セッションにのみ使用してください。
  OpenClaw のデフォルトのプロキシ値 `tool_choice: "auto"` を上書きします。
  `local/my-local-model` は、`openclaw models list` に表示される正確な provider/model 参照に置き換えてください。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- カスタム OpenAI 互換モデルが、組み込みプロファイルを超える OpenAI 推論 effort を受け入れる場合は、
  モデルの compat ブロックで宣言してください。ここに `"xhigh"` を追加すると、
  `/think xhigh`、セッションピッカー、Gateway 検証、`llm-task`
  検証で、その設定済み provider/model 参照のレベルが公開されます。

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

## 小型またはより厳格なバックエンド

モデルが問題なく読み込まれるのに完全なエージェントターンが誤動作する場合は、トップダウンで作業します。まずトランスポートを確認し、その後に対象範囲を絞り込みます。

1. **ローカルモデル自体が応答することを確認します。** ツールもエージェントコンテキストも使いません。

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway ルーティングを確認します。** 指定したプロンプトのみを送信します。トランスクリプト、AGENTS ブートストラップ、コンテキストエンジンの組み立て、ツール、同梱 MCP サーバーはスキップしますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行されます。

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **軽量モードを試します。** 両方のプローブが通るのに実際のエージェントターンが不正なツール呼び出しや過大なプロンプトで失敗する場合は、`agents.defaults.experimental.localModelLean: true` を有効にします。これにより、最も重い 3 つのデフォルトツール（`browser`、`cron`、`message`）が削除され、プロンプトの形が小さくなり、壊れにくくなります。詳しい説明、使用するタイミング、有効化されていることの確認方法については、[実験的機能 → ローカルモデル軽量モード](/ja-JP/concepts/experimental-features#local-model-lean-mode)を参照してください。

4. **最後の手段としてツールを完全に無効化します。** 軽量モードでも不十分な場合は、そのモデルエントリに `models.providers.<provider>.models[].compat.supportsTools: false` を設定します。すると、そのモデルではエージェントがツール呼び出しなしで動作します。

5. **それ以降のボトルネックはアップストリームです。** 軽量モードと `supportsTools: false` の後でも、大きめの OpenClaw 実行でのみバックエンドが失敗する場合、残る問題は通常、アップストリームのモデルまたはサーバー容量です。コンテキストウィンドウ、GPU メモリ、kv-cache の退避、またはバックエンドのバグが原因です。その時点では OpenClaw のトランスポート層の問題ではありません。

## トラブルシューティング

- Gateway はプロキシに到達できますか？ `curl http://127.0.0.1:1234/v1/models`。
- LM Studio モデルがアンロードされていますか？ 再読み込みしてください。コールドスタートは「ハング」の一般的な原因です。
- ローカルサーバーが `terminated`、`ECONNRESET` と表示する、またはターンの途中でストリームを閉じますか？
  OpenClaw は、低カーディナリティの `model.call.error.failureKind` と
  OpenClaw プロセスの RSS/ヒープスナップショットを診断に記録します。LM Studio/Ollama の
  メモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ /
  jetsam ログと照合し、モデルサーバーが強制終了されたかどうかを確認してください。
- OpenClaw は、検出されたモデルウィンドウ、または `agents.defaults.contextTokens` が有効ウィンドウを下げている場合は上限なしのモデルウィンドウから、コンテキストウィンドウのプリフライトしきい値を導出します。20% 未満では **8k** の下限で警告します。ハードブロックは **4k** の下限で 10% のしきい値を使用し、有効コンテキストウィンドウまでに制限されるため、過大なモデルメタデータによって本来有効なユーザー上限が拒否されることはありません。このプリフライトに当たる場合は、サーバー/モデルのコンテキスト上限を引き上げるか、より大きなモデルを選択してください。
- コンテキストエラーですか？ `contextWindow` を下げるか、サーバー上限を引き上げてください。
- OpenAI 互換サーバーが `messages[].content ... expected a string` を返しますか？
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- OpenAI 互換サーバーが `validation.keys` を返す、またはメッセージエントリでは `role` と `content` のみが許可されると言いますか？
  そのモデルエントリに `compat.strictMessageKeys: true` を追加してください。
- 小さな直接の `/v1/chat/completions` 呼び出しは動作するのに、`openclaw infer model run --local`
  が Gemma または別のローカルモデルで失敗しますか？ まずプロバイダー URL、モデル参照、認証
  マーカー、サーバーログを確認してください。ローカルの `model run` にはエージェントツールは含まれません。
  ローカルの `model run` が成功するのに大きめのエージェントターンが失敗する場合は、
  `localModelLean` または `compat.supportsTools: false` でエージェントの
  ツール対象範囲を減らしてください。
- ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが
  空の `tool_calls` 配列を返しますか？ アシスタントテキストを盲目的に
  ツール実行へ変換するプロキシを追加しないでください。先にサーバーのチャットテンプレート/パーサーを修正してください。
  ツール使用を強制した場合にのみモデルが動作するなら、上記のモデル単位の
  `params.extra_body.tool_choice: "required"` オーバーライドを追加し、毎ターンでツール呼び出しが期待される
  セッションにのみそのモデルエントリを使用してください。
- 安全性: ローカルモデルはプロバイダー側フィルターをスキップします。プロンプトインジェクションの影響範囲を制限するため、エージェントは狭く保ち、Compaction を有効にしてください。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
