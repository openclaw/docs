---
read_when:
    - 自分のGPUマシンからモデルを提供したい場合
    - LM StudioまたはOpenAI互換プロキシを接続設定している
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-06-27T11:30:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは実現可能です。ただし、ハードウェア、コンテキストサイズ、プロンプトインジェクション防御の要求水準も上がります。小型または極端に量子化されたカードではコンテキストが切り詰められ、安全性が損なわれます。このページは、上位のローカルスタックとカスタムの OpenAI 互換ローカルサーバー向けの、方針を明確にしたガイドです。最も手間の少ないオンボーディングには、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

選択されたモデルが必要とするときだけ起動すべきローカルサーバーについては、
[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。

## ハードウェアの下限

高めを目指してください。快適なエージェントループには **最大構成の Mac Studio 2 台以上、または同等の GPU リグ（約 $30k+）** が目安です。単一の **24 GB** GPU で動作するのは、より軽いプロンプトを高めのレイテンシで扱う場合に限られます。常に **ホストできる最大 / フルサイズのバリアント** を実行してください。小型または大きく量子化されたチェックポイントは、プロンプトインジェクションのリスクを高めます（[セキュリティ](/ja-JP/gateway/security) を参照）。

## バックエンドを選ぶ

| バックエンド                                         | 使用する場面                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/ja-JP/providers/ds4)                                | macOS Metal 上で OpenAI 互換ツール呼び出しを使ってローカル DeepSeek V4 Flash を実行する場合 |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初回のローカルセットアップ、GUI ローダー、ネイティブ Responses API を使う場合 |
| LiteLLM / OAI-proxy / カスタム OpenAI 互換プロキシ | 別のモデル API を前段に置き、OpenClaw に OpenAI として扱わせる必要がある場合 |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントで高スループットのセルフホスト配信を行う場合 |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、手離れのよい systemd サービスを使う場合 |

バックエンドが対応している場合（LM Studio は対応）、Responses API（`api: "openai-responses"`）を使用してください。それ以外は Chat Completions（`api: "openai-completions"`）を使います。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA ユーザー:** 公式の Ollama Linux インストーラーは、`Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動により起動中に最後のモデルが再読み込みされ、ホストメモリを固定することがあります。Ollama を有効にした後、WSL2 VM が繰り返し再起動する場合は、[WSL2 クラッシュループ](/ja-JP/providers/ollama#wsl2-crash-loop-repeated-reboots) を参照してください。
</Warning>

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最適なローカルスタックです。LM Studio で大規模モデル（たとえば、フルサイズの Qwen、DeepSeek、または Llama ビルド）を読み込み、ローカルサーバー（既定は `http://127.0.0.1:1234`）を有効にし、Responses API を使って推論を最終テキストから分離します。

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
- LM Studio で **利用可能な最大のモデルビルド** をダウンロードし（「small」や大きく量子化されたバリアントは避ける）、サーバーを起動し、`http://127.0.0.1:1234/v1/models` に表示されることを確認する。
- `my-local-model` を LM Studio に表示される実際のモデル ID に置き換える。
- モデルを読み込んだままにする。コールドロードは起動レイテンシを増やします。
- LM Studio のビルドが異なる場合は、`contextWindow`/`maxTokens` を調整する。
- WhatsApp では、最終テキストだけが送信されるように Responses API を使う。

ローカル実行時でもホスト型モデルを設定したままにしてください。フォールバックを利用可能に保つため、`models.mode: "merge"` を使用します。

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

### ローカル優先、ホスト型を安全網にする

プライマリとフォールバックの順序を入れ替えます。同じ providers ブロックと `models.mode: "merge"` を維持すれば、ローカルマシンが停止しているときに Sonnet または Opus にフォールバックできます。

### リージョナルホスティング / データルーティング

- ホスト型の MiniMax/Kimi/GLM バリアントは、OpenRouter 上にもリージョン固定エンドポイント（例: 米国ホスト）として存在します。Anthropic/OpenAI フォールバック用に `models.mode: "merge"` を使い続けながら、選択した管轄内にトラフィックを留めるには、そこでリージョナルバリアントを選びます。
- ローカルのみが最も強力なプライバシー経路です。プロバイダー機能が必要だがデータフローを制御したい場合、ホスト型のリージョナルルーティングは中間的な選択肢です。

## その他の OpenAI 互換ローカルプロキシ

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、またはカスタム
Gateway は、OpenAI 形式の `/v1/chat/completions`
エンドポイントを公開していれば動作します。バックエンドが明示的に
`/v1/responses` 対応を文書化していない限り、Chat Completions アダプターを使用します。
上記の provider ブロックを、自分のエンドポイントとモデル ID に置き換えてください。

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

`baseUrl` を持つカスタムプロバイダーで `api` が省略された場合、OpenClaw は既定で
`openai-completions` を使用します。カスタム / ローカルプロバイダーのエントリは、loopback、LAN、tailnet、
プライベート DNS ホストを含め、保護されたモデルリクエストに対して、正確に設定された
`baseUrl` のオリジンを信頼します。他のプライベートオリジンへのリクエストには、引き続き
`request.allowPrivateNetwork: true` が必要です。メタデータ / link-local オリジンは、
明示的なオプトインなしではブロックされたままです。正確なオリジンの信頼をオプトアウトするには、`false` に設定します。

`models.providers.<id>.models[].id` の値はプロバイダー内ローカルです。そこに
プロバイダーの接頭辞を含めないでください。たとえば、
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーでは、次の
カタログ ID とモデル参照を使用します。

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

画像添付がエージェントターンに挿入されるよう、ローカルまたはプロキシされたビジョンモデルでは
`input: ["text", "image"]` を設定します。対話式のカスタムプロバイダー
オンボーディングは一般的なビジョンモデル ID を推測し、不明な名前に対してのみ質問します。
非対話式オンボーディングでも同じ推測が使われます。不明なビジョン ID には `--custom-image-input` を、
エンドポイントの背後ではテキスト専用の、ビジョンモデルに見える既知のモデルには
`--custom-text-input` を使用します。

ホスト型モデルをフォールバックとして利用可能に保つため、`models.mode: "merge"` を維持してください。
低速なローカルまたはリモートモデルサーバーには、`agents.defaults.timeoutSeconds` を上げる前に
`models.providers.<id>.timeoutSeconds` を使用します。プロバイダータイムアウトは、
接続、ヘッダー、ボディストリーミング、保護された fetch 全体の中断を含むモデル HTTP リクエストにのみ適用されます。
エージェントまたは実行タイムアウトの方が低い場合は、その上限も引き上げてください。プロバイダータイムアウトでは
エージェント実行全体を延長できないためです。

<Note>
カスタム OpenAI 互換プロバイダーでは、`baseUrl` が loopback、プライベート LAN、`.local`、またはベアホスト名に解決される場合、`apiKey: "ollama-local"` のような非シークレットのローカルマーカーを永続化できます。OpenClaw は、それをキー欠落として報告するのではなく、有効なローカル資格情報として扱います。公開ホスト名を受け付けるプロバイダーには、実際の値を使用してください。
</Note>

ローカル / プロキシされた `/v1` バックエンドに関する動作メモ:

- OpenClaw はこれらをネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います
- ネイティブ OpenAI 専用のリクエスト整形はここでは適用されません: `service_tier` なし、Responses の `store` なし、OpenAI 推論互換ペイロード整形なし、プロンプトキャッシュヒントなし
- 隠し OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、これらのカスタムプロキシ URL には挿入されません

より厳格な OpenAI 互換バックエンド向けの互換性メモ:

- 一部のサーバーは、Chat Completions で構造化された content-part 配列ではなく、文字列の
  `messages[].content` のみを受け付けます。そのようなエンドポイントには
  `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- 一部のローカルモデルは、`[tool_name]` に続く JSON と `[END_TOOL_REQUEST]` のような、
  独立した角括弧付きツールリクエストをテキストとして出力します。OpenClaw は、その名前がそのターンに登録された
  ツールと完全に一致する場合にのみ、それらを実際のツール呼び出しに昇格します。それ以外の場合、そのブロックは未対応のテキストとして扱われ、
  ユーザーに見える返信からは非表示になります。
- モデルが JSON、XML、または ReAct 形式の、ツール呼び出しのように見えるテキストを出力したものの、
  プロバイダーが構造化された呼び出しを出力しなかった場合、OpenClaw はそれをテキストのままにし、実行 ID、プロバイダー / モデル、検出されたパターン、
  利用可能な場合はツール名を含む警告をログに記録します。これは完了したツール実行ではなく、
  プロバイダー / モデルのツール呼び出し非互換性として扱ってください。
- ツールが実行されず、たとえば生の JSON、XML、ReAct 構文、またはプロバイダー応答内の空の `tool_calls` 配列として
  アシスタントテキストに現れる場合、まずサーバーがツール呼び出し対応のチャットテンプレート / パーサーを使用していることを確認してください。
  OpenAI 互換 Chat Completions バックエンドで、ツール使用が強制されたときにのみパーサーが動作する場合は、
  テキスト解析に頼らず、モデルごとのリクエストオーバーライドを設定します。

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

  通常のすべてのターンでツールを呼び出すべきモデル / セッションにのみ、これを使用してください。
  これは OpenClaw の既定のプロキシ値である `tool_choice: "auto"` を上書きします。
  `local/my-local-model` は、`openclaw models list` に表示される正確なプロバイダー / モデル参照に置き換えてください。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- カスタム OpenAI 互換モデルが組み込みプロファイルを超える OpenAI 推論 effort を受け付ける場合は、
  モデルの compat ブロックで宣言します。ここに `"xhigh"` を追加すると、`/think xhigh`、
  セッションピッカー、Gateway 検証、`llm-task` 検証で、その設定済みプロバイダー / モデル参照に対して
  そのレベルが公開されます。

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

## より小さい、またはより厳格なバックエンド

モデルは正常に読み込まれるが、完全なエージェントターンが誤動作する場合は、上から順に進めます。まずトランスポートを確認し、その後で対象範囲を絞り込みます。

1. **ローカルモデル自体が応答することを確認します。** ツールなし、エージェントコンテキストなし:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway ルーティングを確認します。** 指定したプロンプトだけを送信します。トランスクリプト、AGENTS ブートストラップ、コンテキストエンジンの組み立て、ツール、同梱 MCP サーバーはスキップしますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行します:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **リーンモードを試します。** 両方のプローブが成功するのに、実際のエージェントターンが不正なツール呼び出しや大きすぎるプロンプトで失敗する場合は、`agents.defaults.experimental.localModelLean: true` を有効にします。直接の `message` 配信セマンティクスを維持する必要がある実行を除き、最も重い既定ツール 3 つ (`browser`, `cron`, `message`) を外し、より大きなツールカタログを構造化されたツール検索コントロールの背後で既定化します。詳しい説明、使用すべきタイミング、有効になっていることの確認方法については、[実験的機能 → ローカルモデル リーンモード](/ja-JP/concepts/experimental-features#local-model-lean-mode) を参照してください。

4. **最後の手段としてツールを完全に無効化します。** リーンモードで不十分な場合は、そのモデルエントリに `models.providers.<provider>.models[].compat.supportsTools: false` を設定します。そのモデルでは、エージェントはツール呼び出しなしで動作します。

5. **それでも先に進む場合、ボトルネックはアップストリームです。** リーンモードと `supportsTools: false` の後でも、より大きな OpenClaw 実行でのみバックエンドが失敗する場合、残る問題は通常、アップストリームのモデルまたはサーバー容量です。たとえば、コンテキストウィンドウ、GPU メモリ、kv-cache の退避、またはバックエンドのバグです。その時点では OpenClaw のトランスポート層ではありません。

## トラブルシューティング

- Gateway はプロキシに到達できますか? `curl http://127.0.0.1:1234/v1/models`。
- LM Studio のモデルがアンロードされていますか? 再読み込みしてください。コールドスタートは一般的な「ハング」原因です。
- ローカルサーバーが `terminated`、`ECONNRESET` を返す、またはターンの途中でストリームを閉じますか?
  OpenClaw は、低カーディナリティの `model.call.error.failureKind` と
  OpenClaw プロセスの RSS/ヒープスナップショットを診断情報に記録します。LM Studio/Ollama
  のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ /
  jetsam ログと照合し、モデルサーバーが強制終了されたかどうかを確認してください。
- OpenClaw は、検出されたモデルウィンドウ、または `agents.defaults.contextTokens` が有効ウィンドウを下げている場合は上限なしのモデルウィンドウから、コンテキストウィンドウのプリフライトしきい値を導出します。20% 未満では **8k** の下限で警告します。ハードブロックでは **4k** の下限を持つ 10% しきい値を使い、有効コンテキストウィンドウに上限をかけるため、大きすぎるモデルメタデータが、それ以外は有効なユーザー上限を拒否することはありません。このプリフライトに当たった場合は、サーバー/モデルのコンテキスト上限を上げるか、より大きなモデルを選んでください。
- コンテキストエラーですか? `contextWindow` を下げるか、サーバー上限を上げてください。
- OpenAI 互換サーバーが `messages[].content ... expected a string` を返しますか?
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- OpenAI 互換サーバーが `validation.keys` を返す、またはメッセージエントリでは `role` と `content` だけが許可されると言いますか?
  そのモデルエントリに `compat.strictMessageKeys: true` を追加してください。
- 直接の小さな `/v1/chat/completions` 呼び出しは動作するのに、`openclaw infer model run --local`
  が Gemma や別のローカルモデルで失敗しますか? まずプロバイダー URL、モデル参照、認証
  マーカー、サーバーログを確認してください。ローカルの `model run` にはエージェントツールは含まれません。
  ローカルの `model run` は成功するが、より大きなエージェントターンが失敗する場合は、
  `localModelLean` または `compat.supportsTools: false` でエージェントの
  ツール対象範囲を減らしてください。
- ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが
  空の `tool_calls` 配列を返しますか? アシスタントのテキストを盲目的に
  ツール実行へ変換するプロキシを追加しないでください。まずサーバーのチャットテンプレート/パーサーを修正してください。
  ツール使用を強制したときだけモデルが動作する場合は、上記のモデル単位の
  `params.extra_body.tool_choice: "required"` オーバーライドを追加し、すべてのターンでツール呼び出しが想定されるセッションにのみそのモデル
  エントリを使用してください。
- 安全性: ローカルモデルはプロバイダー側のフィルターをスキップします。プロンプトインジェクションの影響範囲を制限するため、エージェントは狭く保ち、Compaction を有効にしてください。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
