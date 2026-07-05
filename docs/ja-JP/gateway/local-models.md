---
read_when:
    - 自分のGPUボックスからモデルを提供したい
    - LM StudioまたはOpenAI互換プロキシを接続している
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-07-05T11:22:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 850bbd6db1cf3da8719edec37cc271d9ea36dd5adf3722a555ded0823ec022ea
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは動作しますが、ハードウェア、コンテキストサイズ、プロンプトインジェクション防御の要件が高くなります。小型モデルや強く量子化されたモデルはコンテキストを切り詰め、プロバイダー側の安全フィルターを省略します。このページでは、上位のローカルスタックとカスタムの OpenAI 互換サーバーを扱います。最も手間の少ない経路として、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

選択されたモデルが必要とするときだけ起動するローカルサーバーについては、[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。

## ハードウェアの下限

快適なエージェントループには、**最大構成の Mac Studio 2台以上、または同等の GPU リグ（約 $30k 以上）**を目安にしてください。単一の **24 GB** GPU では、軽めのプロンプトを高いレイテンシで処理できる程度です。常に**ホストできる最大 / フルサイズのバリアント**を実行してください。小型または大きく量子化されたチェックポイントは、プロンプトインジェクションのリスクを高めます（[セキュリティ](/ja-JP/gateway/security) を参照）。

## バックエンドを選ぶ

| バックエンド                                         | 使用する場面                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/ja-JP/providers/ds4)                                | macOS Metal 上のローカル DeepSeek V4 Flash で OpenAI 互換のツール呼び出しを使う |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初回のローカルセットアップ、GUI ローダー、ネイティブ Responses API          |
| LiteLLM / OAI-proxy / カスタム OpenAI 互換プロキシ   | 別のモデル API を前段に置き、OpenClaw に OpenAI として扱わせる必要がある     |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントで高スループットなセルフホスト配信を行う     |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、手放しの systemd サービス               |

バックエンドが対応している場合は `api: "openai-responses"` を使用してください（LM Studio は対応しています）。それ以外の場合は `api: "openai-completions"` を使用してください。`baseUrl` を持つカスタムプロバイダーで `api` を省略した場合、OpenClaw は既定で `openai-completions` を使用します。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** 公式の Ollama Linux インストーラーは `Restart=always` の systemd サービスを有効にします。WSL2 GPU セットアップでは、自動起動によって起動中に最後のモデルが再読み込みされ、ホストメモリを固定して、VM の再起動が繰り返されることがあります。[WSL2 クラッシュループ](/ja-JP/providers/ollama#troubleshooting) を参照してください。
</Warning>

## LM Studio + 大規模ローカルモデル（Responses API）

これは現時点で最良のローカルスタックです。LM Studio で大規模モデル（フルサイズの Qwen、DeepSeek、または Llama ビルド）を読み込み、ローカルサーバー（既定 `http://127.0.0.1:1234`）を有効化し、Responses API を使って推論を最終テキストから分離します。

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

- LM Studio をインストールする: [https://lmstudio.ai](https://lmstudio.ai)
- **利用可能な最大のモデルビルド**をダウンロードし（"small"/大きく量子化されたバリアントは避ける）、サーバーを起動して、`http://127.0.0.1:1234/v1/models` にそのモデルが表示されることを確認します。
- `my-local-model` を LM Studio に表示される実際のモデル ID に置き換えます。
- モデルを読み込んだままにします。コールドロードは起動レイテンシを追加します。
- LM Studio のビルドが異なる場合は、`contextWindow`/`maxTokens` を調整します。
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

ホスト型の安全網を備えたローカル優先にするには、`primary`/`fallbacks` の順序を入れ替え、同じ `providers` ブロックと `models.mode: "merge"` を維持します。

### リージョン別ホスティング / データルーティング

ホスト型の MiniMax/Kimi/GLM バリアントは、リージョン固定のエンドポイント（例: 米国ホスト）付きで OpenRouter にも存在します。Anthropic/OpenAI フォールバック用に `models.mode: "merge"` を維持しつつ、選択した法域内にトラフィックを保つにはリージョン別バリアントを選択してください。ローカルのみが今でも最も強力なプライバシー経路です。ホスト型リージョンルーティングは、プロバイダー機能が必要だがデータフローを制御したい場合の中間策です。

## その他の OpenAI 互換ローカルプロキシ

MLX (`mlx_lm.server`)、vLLM、SGLang、LiteLLM、OAI-proxy、または任意のカスタム Gateway は、OpenAI スタイルの `/v1/chat/completions` エンドポイントを公開していれば動作します。バックエンドが `/v1/responses` 対応を明示的に文書化していない限り、`openai-completions` を使用してください。

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

カスタム/ローカルプロバイダーのエントリは、local loopback、LAN、tailnet、プライベート DNS ホストを含め、ガード付きモデルリクエストについて正確に設定された `baseUrl` のオリジンを信頼します。メタデータ/リンクローカルのオリジンは常にブロックされます。他のプライベートオリジンへのリクエストには、引き続き `models.providers.<id>.request.allowPrivateNetwork: true` が必要です。正確なオリジン信頼をオプトアウトするには、信頼フラグを `false` に設定します。

`models.providers.<id>.models[].id` はプロバイダーローカルです。プロバイダープレフィックスを含めないでください。`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーの場合:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ローカルまたはプロキシ経由のビジョンモデルでは、画像添付がエージェントターンに注入されるように `input: ["text", "image"]` を設定します。対話型のカスタムプロバイダーオンボーディングは一般的なビジョンモデル ID を推論し、不明な名前についてのみ確認します。非対話型オンボーディングでも同じ推論を使用し、`--custom-image-input` / `--custom-text-input` で上書きできます。

低速なローカル/リモートモデルサーバーには、`agents.defaults.timeoutSeconds` を上げる前に `models.providers.<id>.timeoutSeconds` を使用してください。プロバイダータイムアウトは、モデル HTTP リクエストのみについて、接続、ヘッダー、ボディストリーミング、およびガード付き fetch の総アボートを対象にします。エージェント/実行タイムアウトの方が低い場合は、プロバイダータイムアウトでは実行全体を延長できないため、そちらも上げてください。

<Note>
カスタム OpenAI 互換プロバイダーでは、`apiKey: "ollama-local"` のような非シークレットのローカルマーカーは、`baseUrl` が local loopback、プライベート LAN、`.local`、またはベアホスト名に解決される場合に受け入れられます。OpenClaw は、キー不足として報告する代わりに、それを有効なローカル認証情報として扱います。公開ホスト名を受け入れるプロバイダーには実際の値を使用してください。
</Note>

ローカル/プロキシ経由の `/v1` バックエンドに関する動作メモ:

- OpenClaw はこれらをネイティブ OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います。
- ネイティブ OpenAI 専用のリクエスト整形は適用されません。`service_tier` なし、Responses の `store` なし、OpenAI 推論互換ペイロード整形なし、プロンプトキャッシュヒントなしです。
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）はカスタムプロキシ URL に注入されません。

より厳格な OpenAI 互換バックエンド向けの互換オーバーライド:

- **文字列のみのコンテンツ**: 一部のサーバーは、構造化されたコンテンツパート配列ではなく、文字列の `messages[].content` のみを受け入れます。`models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- **厳格なメッセージキー**: サーバーが `role`/`content` より多いキーを持つメッセージエントリを拒否する場合は、`compat.strictMessageKeys: true` を設定してください。
- **角括弧付きツールテキスト**: 一部のローカルモデルは、`[tool_name]` の後に JSON と `[END_TOOL_REQUEST]` が続くような、独立した角括弧付きツールリクエストをテキストとして出力します。OpenClaw は、その名前がターンに登録されたツールと完全に一致する場合にのみ、それらを実際のツール呼び出しに昇格します。それ以外の場合は、非表示の未対応テキストのままです。
- **構造化されていないツール呼び出し風テキスト**: モデルがツール呼び出しのように見える JSON/XML/ReAct スタイルのテキストを出力したものの、それが構造化された呼び出しではなかった場合、OpenClaw はそれをテキストのまま残し、利用可能な場合は実行 ID、プロバイダー/モデル、検出されたパターン、ツール名とともに警告をログに記録します。これはプロバイダー/モデルの非互換であり、完了したツール実行ではありません。
- **ツール使用の強制**: ツールがアシスタントテキスト（生の JSON/XML/ReAct、または空の `tool_calls` 配列）として表示される場合は、まずサーバーのチャットテンプレート/パーサーがツール呼び出しに対応していることを確認してください。パーサーがツール使用を強制した場合にのみ動作するなら、モデルごとに既定のプロキシ値 `tool_choice: "auto"` を上書きします。

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

  すべての通常ターンでツールを呼び出すべき場合にのみ、これを使用してください。`local/my-local-model` を `openclaw models list` の正確な参照に置き換えるか、CLI 経由で設定します。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **追加の推論エフォート**: カスタム OpenAI 互換モデルが組み込みプロファイルを超える OpenAI 推論エフォートを受け入れる場合は、モデルの互換ブロックで宣言してください。`"xhigh"` を追加すると、そのモデル参照について `/think xhigh`、セッションピッカー、Gateway 検証、`llm-task` 検証で使用できるようになります。

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

## より小規模または厳格なバックエンド

モデルが正常に読み込まれるものの、完全なエージェントターンがうまく動作しない場合は、上から順に確認してください。まずトランスポートを確認し、その後で対象範囲を絞ります。

1. **ローカルモデルが応答することを確認する** - ツールなし、エージェントコンテキストなし:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway ルーティングを確認する** - プロンプトのみを送信し、トランスクリプト、AGENTS ブートストラップ、コンテキストエンジンの組み立て、ツール、同梱 MCP サーバーを省略しますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行します。

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. 両方のプローブは通るが、実際のエージェントターンが不正な形式のツール呼び出しや大きすぎるプロンプトで失敗する場合は、**リーンモードを試す**: `agents.defaults.experimental.localModelLean: true` を設定します。最も重い 3 つの既定ツール (`browser`、`cron`、`message` - 実行で直接の `message` 配信セマンティクスを維持する必要がある場合を除く) を削除し、より大きなツールカタログは既定で構造化された Tool Search コントロールの背後に置きます。詳細と有効化の確認方法については、[実験的機能 -> ローカルモデルのリーンモード](/ja-JP/concepts/experimental-features#local-model-lean-mode) を参照してください。

4. **最後の手段としてツールを完全に無効化する**には、そのモデルに `models.providers.<provider>.models[].compat.supportsTools: false` を設定します。するとエージェントはツール呼び出しなしで実行されます。

5. **それでも解決しない場合、ボトルネックは上流にあります。** リーンモードと `supportsTools: false` の後でも、大きめの OpenClaw 実行でのみバックエンドが失敗する場合、残る問題は通常 OpenClaw のトランスポート層ではなく、モデルまたはサーバー自体、つまりコンテキストウィンドウ、GPU メモリ、kv-cache 退避、またはバックエンドのバグです。

## トラブルシューティング

- **Gateway がプロキシに到達できませんか？** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio モデルがアンロードされていますか？** 再読み込みしてください。コールドスタートは一般的な「ハング」の原因です。
- **ローカルサーバーが `terminated`、`ECONNRESET` と言う、またはターンの途中でストリームを閉じますか？** OpenClaw は、低カーディナリティの `model.call.error.failureKind` と OpenClaw プロセスの RSS/heap スナップショットを診断に記録します。LM Studio/Ollama のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ/jetsam ログと照合し、モデルサーバーが kill されたかどうかを確認してください。
- **コンテキストエラーですか？** OpenClaw は、検出されたモデルウィンドウ (または `agents.defaults.contextTokens` で下げられた場合は上限付きウィンドウ) からコンテキストウィンドウのプリフライトしきい値を導出し、20% 未満では **8k** を下限として警告し、10% 未満では **4k** を下限としてハードブロックします (有効なコンテキストウィンドウに上限を合わせるため、大きすぎるモデルメタデータが有効なユーザー上限を拒否することはありません)。`contextWindow` を下げるか、サーバー/モデルのコンテキスト制限を上げてください。
- **`messages[].content ... expected a string` ですか？** そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- **`validation.keys`、または「メッセージエントリでは `role` と `content` のみが許可されます」ですか？** そのモデルエントリに `compat.strictMessageKeys: true` を追加してください。
- **直接の `/v1/chat/completions` 呼び出しは動作するのに、Gemma または別のローカルモデルで `openclaw infer model run --local` が失敗しますか？** まずプロバイダー URL、モデル参照、認証マーカー、サーバーログを確認してください。`model run` はエージェントツールを完全に省略します。`model run` は成功するが、より大きなエージェントターンが失敗する場合は、`localModelLean` または `compat.supportsTools: false` でツール面を減らしてください。
- **ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが空の `tool_calls` 配列を返しますか？** アシスタントのテキストを盲目的にツール実行へ変換するプロキシを追加しないでください。まずサーバーのチャットテンプレート/パーサーを修正してください。ツール使用を強制した場合にのみモデルが動作するなら、上記の `params.extra_body.tool_choice: "required"` オーバーライドを追加し、各ターンでツール呼び出しが想定されるセッションでのみそのモデルエントリを使用してください。
- **安全性**: ローカルモデルはプロバイダー側フィルターを省略します。プロンプトインジェクションの影響範囲を抑えるため、エージェントを絞り込み、Compaction を有効にしてください。

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルフェイルオーバー](/ja-JP/concepts/model-failover)
