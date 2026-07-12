---
read_when:
    - 自前のGPUマシンからモデルを提供したい場合
    - LM Studio または OpenAI 互換プロキシを接続する場合
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカル LLM（LM Studio、vLLM、LiteLLM、カスタム OpenAI エンドポイント）で OpenClaw を実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-07-12T14:30:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは動作しますが、ハードウェア、コンテキストサイズ、プロンプトインジェクション対策への要求が高まります。小規模モデルや極端に量子化されたモデルはコンテキストを切り詰め、プロバイダー側の安全フィルターを適用しません。このページでは、ハイエンドのローカルスタックとカスタムの OpenAI 互換サーバーについて説明します。最も手軽な方法として、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

選択したモデルが必要とするときだけ起動するローカルサーバーについては、[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。

## 最低限必要なハードウェア

快適なエージェントループを実現するには、**最大構成の Mac Studio 2 台以上、または同等の GPU リグ（約 $30k 以上）**を目安にしてください。単一の **24 GB** GPU で処理できるのは、レイテンシが高くても比較的軽量なプロンプトに限られます。常に、ホストできる**最大／フルサイズのバリアント**を実行してください。小規模または高度に量子化されたチェックポイントは、プロンプトインジェクションのリスクを高めます（[セキュリティ](/ja-JP/gateway/security)を参照）。

## バックエンドの選択

| バックエンド                                         | 使用する状況                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [ds4](/ja-JP/providers/ds4)                                | OpenAI 互換ツール呼び出しを使用して、macOS Metal 上でローカルの DeepSeek V4 Flash を実行する場合 |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初めてローカル環境をセットアップする場合、GUI ローダー、ネイティブ Responses API |
| LiteLLM / OAI-proxy / カスタム OpenAI 互換プロキシ   | 別のモデル API のフロントに配置し、OpenClaw から OpenAI として扱う必要がある場合 |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントを使用して、高スループットのセルフホスト配信を行う場合 |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、管理不要の systemd サービス                |

バックエンドが対応している場合は、`api: "openai-responses"` を使用してください（LM Studio は対応しています）。それ以外の場合は、`api: "openai-completions"` を使用します。`baseUrl` を持つカスタムプロバイダーで `api` を省略すると、OpenClaw はデフォルトで `openai-completions` を使用します。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** 公式の Ollama Linux インストーラーは、`Restart=always` が設定された systemd サービスを有効にします。WSL2 の GPU 環境では、自動起動時に最後に使用したモデルが再読み込みされ、ホストメモリを占有することで、VM が繰り返し再起動する可能性があります。[WSL2 のクラッシュループ](/ja-JP/providers/ollama#troubleshooting)を参照してください。
</Warning>

## LM Studio + 大規模ローカルモデル（Responses API）

これは現在最良のローカルスタックです。LM Studio で大規模モデル（フルサイズの Qwen、DeepSeek、または Llama ビルド）を読み込み、ローカルサーバー（デフォルトは `http://127.0.0.1:1234`）を有効にして、推論を最終テキストから分離するために Responses API を使用します。

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

- LM Studio をインストールします: [https://lmstudio.ai](https://lmstudio.ai)
- **利用可能な最大のモデルビルド**をダウンロードし（「small」や高度に量子化されたバリアントは避けてください）、サーバーを起動して、`http://127.0.0.1:1234/v1/models` にそのモデルが表示されることを確認します。
- `my-local-model` を LM Studio に表示される実際のモデル ID に置き換えます。
- モデルを読み込んだままにします。コールドロードでは起動時のレイテンシが増加します。
- LM Studio のビルドと異なる場合は、`contextWindow`／`maxTokens` を調整します。
- WhatsApp では、最終テキストだけが送信されるように Responses API を使用してください。
- ホスト型モデルをフォールバックとして引き続き利用できるよう、`models.mode: "merge"` を維持します。

### ハイブリッド構成: ホスト型をプライマリ、ローカルをフォールバックにする

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

ローカルを優先しつつホスト型を安全策として使用するには、`primary`／`fallbacks` の順序を入れ替え、同じ `providers` ブロックと `models.mode: "merge"` を維持します。

### リージョン別ホスティング／データルーティング

ホスト型の MiniMax／Kimi／GLM バリアントは、リージョンが固定されたエンドポイント（たとえば米国でホストされるもの）として OpenRouter でも提供されています。Anthropic／OpenAI のフォールバック用に `models.mode: "merge"` を維持しながら、選択した法域内にトラフィックを留めるには、該当するリージョンのバリアントを選択してください。プライバシーを最も強く保護できるのは依然としてローカルのみの構成です。プロバイダー機能が必要でありながらデータフローを制御したい場合、ホスト型のリージョン別ルーティングが中間的な選択肢になります。

## その他の OpenAI 互換ローカルプロキシ

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、または任意のカスタム Gateway は、OpenAI 形式の `/v1/chat/completions` エンドポイントを公開していれば動作します。バックエンドが `/v1/responses` への対応を明示的に文書化していない限り、`openai-completions` を使用してください。

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

カスタム／ローカルプロバイダーのエントリでは、local loopback、LAN、tailnet、プライベート DNS ホストを含め、設定された正確な `baseUrl` オリジンが、保護されたモデルリクエストに対して信頼されます。メタデータ／リンクローカルのオリジンは、設定にかかわらず常にブロックされます。その他のプライベートオリジンへのリクエストには、引き続き `models.providers.<id>.request.allowPrivateNetwork: true` が必要です。正確なオリジンの信頼を無効にするには、信頼フラグを `false` に設定します。

`models.providers.<id>.models[].id` はプロバイダー内でローカルな値です。プロバイダーのプレフィックスを含めないでください。`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーの場合:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ローカルまたはプロキシ経由のビジョンモデルでは、画像添付がエージェントターンに挿入されるように、`input: ["text", "image"]` を設定します。対話型のカスタムプロバイダーのオンボーディングでは、一般的なビジョンモデル ID を推測し、不明な名前についてのみ確認します。非対話型のオンボーディングでも同じ推測を使用し、`--custom-image-input`／`--custom-text-input` で上書きできます。

低速なローカル／リモートモデルサーバーでは、`agents.defaults.timeoutSeconds` を引き上げる前に `models.providers.<id>.timeoutSeconds` を使用してください。プロバイダーのタイムアウトは、接続、ヘッダー、本文のストリーミング、およびモデルの HTTP リクエストだけに適用される保護付き fetch の全体的な中止を対象とします。エージェント／実行のタイムアウトのほうが短い場合は、プロバイダーのタイムアウトでは実行全体を延長できないため、そちらも引き上げてください。

<Note>
カスタム OpenAI 互換プロバイダーでは、`baseUrl` が local loopback、プライベート LAN、`.local`、またはドットを含まないホスト名に解決される場合、`apiKey: "ollama-local"` のような秘密ではないローカルマーカーが受け入れられます。OpenClaw は、キーがないと報告する代わりに、これを有効なローカル認証情報として扱います。公開ホスト名を受け入れるプロバイダーでは、実際の値を使用してください。
</Note>

ローカル／プロキシ経由の `/v1` バックエンドに関する動作上の注意:

- OpenClaw は、これらをネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います。
- ネイティブ OpenAI 専用のリクエスト整形は適用されません。`service_tier`、Responses の `store`、OpenAI の推論互換ペイロード整形、プロンプトキャッシュのヒントはいずれも使用されません。
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、カスタムプロキシ URL には挿入されません。

より厳格な OpenAI 互換バックエンド向けの互換性オーバーライド:

- **文字列のみのコンテンツ**: 一部のサーバーは、構造化されたコンテンツパートの配列ではなく、文字列の `messages[].content` のみを受け入れます。`models.providers.<provider>.models[].compat.requiresStringContent: true` を設定してください。
- **厳格なメッセージキー**: サーバーが `role`／`content` 以外を含むメッセージエントリを拒否する場合は、`compat.strictMessageKeys: true` を設定してください。
- **角括弧で囲まれたツールテキスト**: 一部のローカルモデルは、`[tool_name]` に続いて JSON と `[END_TOOL_REQUEST]` を出力するなど、独立した角括弧形式のツールリクエストをテキストとして生成します。OpenClaw は、名前がそのターンに登録されたツールと完全に一致する場合に限り、それらを実際のツール呼び出しに昇格させます。それ以外の場合は、非表示の未対応テキストとして残ります。
- **構造化されていないツール呼び出し風テキスト**: モデルが、ツール呼び出しのように見えるものの構造化された呼び出しではない JSON／XML／ReAct 形式のテキストを出力した場合、OpenClaw はそれをテキストのまま残し、実行 ID、プロバイダー／モデル、検出されたパターン、および利用可能な場合はツール名を含む警告を記録します。これはプロバイダー／モデルの非互換性であり、完了したツール実行ではありません。
- **ツール使用の強制**: ツールがアシスタントテキストとして表示される場合（生の JSON／XML／ReAct、または空の `tool_calls` 配列）、まずサーバーのチャットテンプレート／パーサーがツール呼び出しに対応していることを確認してください。ツール使用を強制した場合にのみパーサーが動作する場合は、モデルごとにプロキシのデフォルト値 `tool_choice: "auto"` を上書きします。

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

  通常のすべてのターンでツールを呼び出す必要がある場合にのみ、これを使用してください。`local/my-local-model` を `openclaw models list` に表示される正確な参照に置き換えるか、CLI で設定します。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **追加の推論エフォート**: カスタム OpenAI 互換モデルが組み込みプロファイル以外の OpenAI 推論エフォートを受け入れる場合は、モデルの compat ブロックで宣言します。`"xhigh"` を追加すると、そのモデル参照で `/think xhigh`、セッションピッカー、Gateway の検証、および `llm-task` の検証から使用できるようになります。

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

## 小規模または厳格なバックエンド

モデル自体は問題なく読み込めても、完全なエージェントターンが正しく動作しない場合は、上から順に確認します。まずトランスポートを確認し、その後で対象範囲を絞り込んでください。

1. **ローカルモデルが応答することを確認する** - ツールなし、エージェントコンテキストなし:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "正確に次のように応答してください: pong" --json
   ```

2. **Gateway ルーティングを確認** - トランスクリプト、AGENTS ブートストラップ、コンテキストエンジンの組み立て、ツール、同梱 MCP サーバーを省略してプロンプトのみを送信しますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行します。

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "正確に次のように応答してください: pong" --json
   ```

3. 両方のプローブが成功しても、実際のエージェントターンで不正なツール呼び出しや過大なプロンプトが原因で失敗する場合は、**リーンモードを試してください**。`agents.defaults.experimental.localModelLean: true` を設定します。明示的に必要とされない限り、負荷の高いブラウザー、cron、メッセージ、メディア生成、音声、PDF ツールを除外し、`exec` を直接表示したまま、より大きなツールカタログを構造化されたツール検索コントロールの背後に配置することをデフォルトにします。詳細と有効になっていることを確認する方法については、[実験的機能 -> ローカルモデルのリーンモード](/ja-JP/concepts/experimental-features#local-model-lean-mode)を参照してください。

4. **最後の手段としてツールを完全に無効化**するには、そのモデルに `models.providers.<provider>.models[].compat.supportsTools: false` を設定します。これにより、エージェントはツール呼び出しなしで実行されます。

5. **それでも解決しない場合、ボトルネックはアップストリームにあります。** リーンモードと `supportsTools: false` を使用しても、より大きな OpenClaw 実行でのみバックエンドが失敗する場合、残る問題は通常 OpenClaw のトランスポート層ではなく、モデルまたはサーバー自体（コンテキストウィンドウ、GPU メモリ、kv-cache の退避、バックエンドのバグ）にあります。

## トラブルシューティング

- **Gateway からプロキシに到達できませんか？** `curl http://127.0.0.1:1234/v1/models`。
- **LM Studio のモデルがアンロードされていますか？** 再読み込みしてください。コールドスタートは「ハング」の一般的な原因です。
- **ローカルサーバーが `terminated`、`ECONNRESET` を報告する、またはターンの途中でストリームを閉じますか？** OpenClaw は、低カーディナリティの `model.call.error.failureKind` と OpenClaw プロセスの RSS/ヒープスナップショットを診断情報に記録します。LM Studio/Ollama のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ/jetsam ログと照合し、モデルサーバーが強制終了されたかどうかを確認してください。
- **コンテキストエラーですか？** OpenClaw は、検出されたモデルウィンドウ（または `agents.defaults.contextTokens` によって縮小された場合は上限適用後のウィンドウ）からコンテキストウィンドウの事前チェックしきい値を導出します。20% 未満では **8k** を下限として警告し、10% 未満では **4k** を下限としてハードブロックします（過大なモデルメタデータによって有効なユーザー上限が拒否されないよう、有効なコンテキストウィンドウを上限とします）。`contextWindow` を下げるか、サーバー/モデルのコンテキスト上限を引き上げてください。
- **`messages[].content ... expected a string` ですか？** そのモデルエントリに `compat.requiresStringContent: true` を追加してください。
- **`validation.keys`、または「メッセージエントリでは `role` と `content` のみ許可される」というエラーですか？** そのモデルエントリに `compat.strictMessageKeys: true` を追加してください。
- **`/v1/chat/completions` の直接呼び出しは動作するものの、Gemma または別のローカルモデルで `openclaw infer model run --local` が失敗しますか？** まずプロバイダー URL、モデル参照、認証マーカー、サーバーログを確認してください。`model run` はエージェントツールを完全に省略します。`model run` が成功しても、より大きなエージェントターンが失敗する場合は、`localModelLean` または `compat.supportsTools: false` を使用してツール範囲を縮小してください。
- **ツール呼び出しが生の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが空の `tool_calls` 配列を返しますか？** アシスタントのテキストを無条件にツール実行へ変換するプロキシを追加しないでください。まずサーバーのチャットテンプレート/パーサーを修正してください。ツール使用を強制した場合にのみモデルが動作する場合は、上記の `params.extra_body.tool_choice: "required"` オーバーライドを追加し、毎ターンツール呼び出しが想定されるセッションでのみ、そのモデルエントリを使用してください。
- **安全性**：ローカルモデルはプロバイダー側のフィルターを省略します。プロンプトインジェクションの影響範囲を限定するため、エージェントの範囲を狭く保ち、Compaction を有効にしてください。

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)
