---
read_when:
    - 自分の GPU マシンからモデルを提供したい場合
    - LM Studio または OpenAI 互換プロキシを接続する
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカル LLM で OpenClaw を実行する（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）
title: ローカルモデル
x-i18n:
    generated_at: "2026-05-06T09:05:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは実用可能です。ただし、ハードウェア、コンテキストサイズ、プロンプトインジェクション防御の要求水準も上がります。小さいカードや極端に量子化されたカードはコンテキストを切り詰め、安全性を損ないます。このページは、上位ローカルスタックとカスタム OpenAI 互換ローカルサーバー向けの、方針を明確にしたガイドです。最小の手間でオンボーディングしたい場合は、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

## ハードウェアの最低ライン

高めを目指してください。快適なエージェントループには、**フル構成の Mac Studio 2台以上、または同等の GPU リグ（約$30k以上）**が目安です。単一の **24 GB** GPU は、軽めのプロンプトを高めのレイテンシで扱う場合にのみ有効です。常に**ホストできる最大 / フルサイズのバリアント**を実行してください。小さい、または大幅に量子化されたチェックポイントは、プロンプトインジェクションのリスクを高めます（[Security](/ja-JP/gateway/security) を参照）。

## バックエンドを選ぶ

| バックエンド                                         | 使う場面                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初回のローカルセットアップ、GUI ローダー、ネイティブ Responses API                    |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、手間のかからない systemd サービス                      |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントによる高スループットのセルフホスト配信 |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | 別のモデル API を前段に置き、OpenClaw には OpenAI として扱わせたい場合         |

バックエンドが対応している場合は Responses API（`api: "openai-responses"`）を使ってください（LM Studio は対応しています）。それ以外は Chat Completions（`api: "openai-completions"`）を使います。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA ユーザー:** 公式の Ollama Linux インストーラーは、`Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動によって起動中に最後のモデルが再読み込みされ、ホストメモリを占有することがあります。Ollama を有効にした後、WSL2 VM が繰り返し再起動する場合は、[WSL2 クラッシュループ](/ja-JP/providers/ollama#wsl2-crash-loop-repeated-reboots) を参照してください。
</Warning>

## 推奨: LM Studio + 大規模ローカルモデル（Responses API）

現時点で最良のローカルスタックです。LM Studio で大規模モデル（例: フルサイズの Qwen、DeepSeek、Llama ビルド）を読み込み、ローカルサーバー（既定値 `http://127.0.0.1:1234`）を有効にし、Responses API を使って推論を最終テキストから分離します。

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
- LM Studio で**利用可能な最大のモデルビルド**をダウンロードし（「small」や大幅に量子化されたバリアントは避ける）、サーバーを起動し、`http://127.0.0.1:1234/v1/models` にそれが表示されることを確認します。
- `my-local-model` を LM Studio に表示される実際のモデル ID に置き換えます。
- モデルを読み込んだままにします。コールドロードは起動レイテンシを増やします。
- LM Studio のビルドが異なる場合は、`contextWindow`/`maxTokens` を調整します。
- WhatsApp では、最終テキストだけが送信されるように Responses API を使い続けます。

ローカル実行中でもホスト型モデルを設定したままにしてください。フォールバックを利用可能に保つため、`models.mode: "merge"` を使います。

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

### ローカル優先、ホスト型セーフティネット付き

プライマリとフォールバックの順序を入れ替えます。同じ providers ブロックと `models.mode: "merge"` を維持して、ローカル環境が停止しているときに Sonnet または Opus にフォールバックできるようにします。

### リージョナルホスティング / データルーティング

- ホスト型 MiniMax/Kimi/GLM バリアントは、リージョン固定エンドポイント（例: 米国ホスト）付きで OpenRouter にも存在します。Anthropic/OpenAI フォールバック用に `models.mode: "merge"` を使い続けながら、選択した管轄内にトラフィックを留めるため、そこでリージョナルバリアントを選んでください。
- ローカルのみが最も強いプライバシー経路です。ホスト型リージョナルルーティングは、プロバイダー機能が必要だがデータフローを制御したい場合の中間策です。

## その他の OpenAI 互換ローカルプロキシ

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、またはカスタム
Gateway は、OpenAI 形式の `/v1/chat/completions`
エンドポイントを公開していれば動作します。バックエンドが `/v1/responses` 対応を明示的に
文書化していない限り、Chat Completions アダプターを使います。上記の provider ブロックを自分の
エンドポイントとモデル ID に置き換えてください。

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

`baseUrl` を持つカスタムプロバイダーで `api` を省略した場合、OpenClaw は既定で
`openai-completions` を使います。`127.0.0.1` のようなループバックエンドポイントは
自動的に信頼されます。LAN、tailnet、プライベート DNS エンドポイントには引き続き
`request.allowPrivateNetwork: true` が必要です。

`models.providers.<id>.models[].id` の値はプロバイダー内ローカルです。そこに
プロバイダープレフィックスを含めないでください。たとえば、
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーでは、次の
カタログ ID とモデル参照を使います。

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ローカルまたはプロキシされたビジョンモデルでは、画像添付がエージェントターンに注入されるように
`input: ["text", "image"]` を設定します。対話型のカスタムプロバイダー
オンボーディングは、一般的なビジョンモデル ID を推測し、不明な名前についてのみ確認します。
非対話型オンボーディングも同じ推測を使います。不明なビジョン ID には
`--custom-image-input` を、モデル名はそれらしく見えるがエンドポイントの裏側では
テキスト専用の場合は `--custom-text-input` を使ってください。

ホスト型モデルをフォールバックとして利用可能に保つため、`models.mode: "merge"` を維持します。
遅いローカルまたはリモートモデルサーバーには、`agents.defaults.timeoutSeconds` を上げる前に
`models.providers.<id>.timeoutSeconds` を使ってください。プロバイダーのタイムアウトは、
接続、ヘッダー、本文ストリーミング、保護された fetch 全体の中断を含むモデル HTTP リクエストにのみ
適用されます。

<Note>
カスタム OpenAI 互換プロバイダーでは、`baseUrl` がループバック、プライベート LAN、`.local`、または裸のホスト名に解決される場合、`apiKey: "ollama-local"` のような非シークレットのローカルマーカーの永続化が許可されます。OpenClaw はそれをキー不足として報告するのではなく、有効なローカル認証情報として扱います。公開ホスト名を受け付けるプロバイダーには実際の値を使ってください。
</Note>

ローカル / プロキシされた `/v1` バックエンドの動作メモ:

- OpenClaw はこれらをネイティブの
  OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います
- ネイティブ OpenAI 専用のリクエスト整形はここでは適用されません: 
  `service_tier` なし、Responses `store` なし、OpenAI reasoning 互換ペイロード
  整形なし、プロンプトキャッシュヒントなし
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、
  これらのカスタムプロキシ URL には注入されません

より厳密な OpenAI 互換バックエンド向けの互換性メモ:

- 一部のサーバーは、Chat Completions で構造化 content-part 配列ではなく、
  文字列の `messages[].content` のみを受け付けます。そのようなエンドポイントには
  `models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
- 一部のローカルモデルは、`[tool_name]` の後に JSON と `[END_TOOL_REQUEST]` が続くような、
  単独の括弧付きツールリクエストをテキストとして出力します。OpenClaw は、その名前がそのターンに登録された
  ツールと完全一致する場合にのみ、それらを実際のツール呼び出しに昇格します。それ以外の場合、そのブロックは
  未対応のテキストとして扱われ、ユーザーに表示される返信から隠されます。
- モデルがツール呼び出しのように見える JSON、XML、または ReAct 形式のテキストを出力したが、
  プロバイダーが構造化された呼び出しを出力しなかった場合、OpenClaw はそれをテキストのままにし、
  実行 ID、プロバイダー / モデル、検出されたパターン、利用可能な場合はツール名を含む警告を記録します。
  これは完了したツール実行ではなく、プロバイダー / モデルのツール呼び出し
  非互換性として扱ってください。
- ツールが実行されずにアシスタントテキストとして表示される場合、たとえば生の JSON、
  XML、ReAct 構文、またはプロバイダーレスポンス内の空の `tool_calls` 配列が出る場合は、
  まずサーバーがツール呼び出し対応のチャットテンプレート / パーサーを使っていることを確認してください。
  ツール使用を強制した場合にのみパーサーが機能する OpenAI 互換 Chat Completions バックエンドでは、
  テキスト解析に頼るのではなく、モデルごとのリクエスト上書きを設定します。

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

  これは、すべての通常ターンでツールを呼び出すべきモデル / セッションにのみ使ってください。
  OpenClaw の既定のプロキシ値である `tool_choice: "auto"` を上書きします。
  `local/my-local-model` は、`openclaw models list` に表示される正確なプロバイダー / モデル参照に
  置き換えてください。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- カスタム OpenAI 互換モデルが、組み込みプロファイルを超える OpenAI reasoning efforts を受け付ける場合は、
  モデルの compat ブロックで宣言します。ここに `"xhigh"` を追加すると、`/think xhigh`、
  セッションピッカー、Gateway 検証、`llm-task`
  検証で、その設定済みプロバイダー / モデル参照向けにそのレベルが公開されます。

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

## より小さい、またはより厳密なバックエンド

モデルが正常に読み込まれるものの、完全なエージェントターンが正しく動作しない場合は、上から順に確認してください。まずトランスポートを確認し、その後で対象範囲を絞ります。

1. **ローカルモデル自体が応答することを確認します。** ツールなし、エージェントコンテキストなし:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway ルーティングを確認します。** 指定したプロンプトだけを送信します — transcript、AGENTS ブートストラップ、context-engine アセンブリ、ツール、同梱 MCP サーバーはスキップしますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行します:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **lean mode を試します。** 両方のプローブは通るのに、実際のエージェントターンが不正な形式のツール呼び出しや過大なプロンプトで失敗する場合は、`agents.defaults.experimental.localModelLean: true` を有効にします。これにより、最も重いデフォルトツール 3 つ（`browser`、`cron`、`message`）が除外されるため、プロンプトの形が小さくなり、壊れにくくなります。詳しい説明、使用すべき場合、有効になっていることを確認する方法については、[Experimental Features → Local model lean mode](/ja-JP/concepts/experimental-features#local-model-lean-mode) を参照してください。

4. **最後の手段としてツールを完全に無効にします。** lean mode でも不十分な場合は、そのモデルエントリに `models.providers.<provider>.models[].compat.supportsTools: false` を設定します。そのモデルでは、エージェントはツール呼び出しなしで動作します。

5. **それ以降のボトルネックは upstream 側です。** lean mode と `supportsTools: false` の後も、より大きな OpenClaw 実行でのみバックエンドが失敗する場合、残る問題は通常、upstream のモデルまたはサーバー容量です — コンテキストウィンドウ、GPU メモリ、kv-cache エビクション、またはバックエンドのバグです。その時点では OpenClaw のトランスポート層の問題ではありません。

## トラブルシューティング

- Gateway はプロキシに到達できますか？ `curl http://127.0.0.1:1234/v1/models`。
- LM Studio モデルがアンロードされていますか？ 再読み込みしてください。コールドスタートは「ハング」のよくある原因です。
- ローカルサーバーが `terminated`、`ECONNRESET` と表示する、またはターンの途中でストリームを閉じますか？
  OpenClaw は、低カーディナリティの `model.call.error.failureKind` と
  OpenClaw プロセスの RSS/heap スナップショットを診断情報に記録します。LM Studio/Ollama の
  メモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ /
  jetsam ログと照合し、モデルサーバーが kill されたかどうかを確認してください。
- OpenClaw は、検出されたモデルウィンドウ、または `agents.defaults.contextTokens` によって実効ウィンドウが引き下げられている場合は上限なしのモデルウィンドウから、コンテキストウィンドウのプリフライトしきい値を導出します。20% 未満では **8k** の下限で警告します。ハードブロックは **4k** の下限を持つ 10% しきい値を使用し、実効コンテキストウィンドウで上限を設定するため、過大なモデルメタデータによって、本来有効なユーザー上限が拒否されることはありません。そのプリフライトに当たる場合は、サーバー/モデルのコンテキスト制限を引き上げるか、より大きなモデルを選択してください。
- コンテキストエラーですか？ `contextWindow` を下げるか、サーバー側の制限を引き上げてください。
- OpenAI 互換サーバーが `messages[].content ... expected a string` を返しますか？
  そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- 直接の小さな `/v1/chat/completions` 呼び出しは動作するのに、`openclaw infer model run --local`
  が Gemma または別のローカルモデルで失敗しますか？ まずプロバイダー URL、モデル参照、認証
  マーカー、サーバーログを確認してください。ローカルの `model run` にはエージェントツールは含まれません。
  ローカルの `model run` は成功するのに、より大きなエージェントターンが失敗する場合は、
  `localModelLean` または `compat.supportsTools: false` でエージェントの
  ツールサーフェスを減らしてください。
- ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが
  空の `tool_calls` 配列を返しますか？ アシスタントの
  テキストを盲目的にツール実行へ変換するプロキシを追加しないでください。まずサーバーのチャットテンプレート/パーサーを修正してください。
  ツール使用を強制した場合にのみモデルが動作する場合は、上記のモデル単位の
  `params.extra_body.tool_choice: "required"` オーバーライドを追加し、すべてのターンでツール呼び出しが想定されるセッションにのみ
  そのモデルエントリを使用してください。
- 安全性: ローカルモデルはプロバイダー側のフィルターをスキップします。プロンプトインジェクションの影響範囲を限定するため、エージェントを狭く保ち、compaction を有効にしてください。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
