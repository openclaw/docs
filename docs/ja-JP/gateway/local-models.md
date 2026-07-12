---
read_when:
    - 独自のGPUマシンからモデルを提供したい場合
    - LM Studio または OpenAI 互換プロキシを接続する場合
    - 最も安全なローカルモデルのガイダンスが必要です
summary: ローカルLLM（LM Studio、vLLM、LiteLLM、カスタムOpenAIエンドポイント）でOpenClawを実行する
title: ローカルモデル
x-i18n:
    generated_at: "2026-07-11T22:13:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

ローカルモデルは動作しますが、ハードウェア、コンテキストサイズ、プロンプトインジェクション防御に対する要件が高くなります。小規模なモデルや極端に量子化されたモデルはコンテキストを切り詰め、プロバイダー側の安全フィルターを省略します。このページでは、ハイエンドなローカルスタックとカスタムの OpenAI 互換サーバーについて説明します。最も手軽な方法としては、[LM Studio](/ja-JP/providers/lmstudio) または [Ollama](/ja-JP/providers/ollama) と `openclaw onboard` から始めてください。

選択したモデルが必要とする場合にのみ起動するローカルサーバーについては、[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。

## 最低ハードウェア要件

快適なエージェントループを実現するには、**最大構成の Mac Studio 2 台以上、または同等の GPU リグ（約 3 万ドル以上）**を目安にしてください。単一の **24 GB** GPU では、待ち時間を長くしても比較的軽いプロンプトしか処理できません。常に、**ホストできる最大／フルサイズのバリアント**を実行してください。小規模または高度に量子化されたチェックポイントは、プロンプトインジェクションのリスクを高めます（[セキュリティ](/ja-JP/gateway/security)を参照）。

## バックエンドの選択

| バックエンド                                         | 使用する場合                                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [ds4](/ja-JP/providers/ds4)                                | OpenAI 互換のツール呼び出しを使用し、macOS Metal 上でローカルの DeepSeek V4 Flash を実行する場合 |
| [LM Studio](/ja-JP/providers/lmstudio)                     | 初回のローカルセットアップ、GUI ローダー、ネイティブの Responses API が必要な場合 |
| LiteLLM / OAI-proxy / カスタム OpenAI 互換プロキシ   | 別のモデル API を前段に置き、OpenClaw に OpenAI として扱わせる必要がある場合 |
| MLX / vLLM / SGLang                                  | OpenAI 互換 HTTP エンドポイントで高スループットのセルフホスト配信を行う場合 |
| [Ollama](/ja-JP/providers/ollama)                          | CLI ワークフロー、モデルライブラリ、管理不要の systemd サービスが必要な場合 |

バックエンドが対応している場合は `api: "openai-responses"` を使用してください（LM Studio は対応しています）。それ以外の場合は `api: "openai-completions"` を使用します。`baseUrl` を持つカスタムプロバイダーで `api` を省略すると、OpenClaw はデフォルトで `openai-completions` を使用します。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA：**公式の Ollama Linux インストーラーは、`Restart=always` が設定された systemd サービスを有効にします。WSL2 の GPU セットアップでは、自動起動によってブート中に最後のモデルが再読み込みされ、ホストメモリを占有し続けることで、VM が繰り返し再起動する場合があります。[WSL2 のクラッシュループ](/ja-JP/providers/ollama#troubleshooting)を参照してください。
</Warning>

## LM Studio + 大規模ローカルモデル（Responses API）

これは現在最適なローカルスタックです。LM Studio に大規模モデル（フルサイズの Qwen、DeepSeek、または Llama ビルド）を読み込み、ローカルサーバー（デフォルトは `http://127.0.0.1:1234`）を有効にして、推論を最終テキストから分離するために Responses API を使用します。

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

セットアップチェックリスト：

- LM Studio をインストールします：[https://lmstudio.ai](https://lmstudio.ai)
- **利用可能な最大のモデルビルド**をダウンロードし（「small」や高度に量子化されたバリアントは避けます）、サーバーを起動して、`http://127.0.0.1:1234/v1/models` にそのモデルが一覧表示されることを確認します。
- `my-local-model` を LM Studio に表示される実際のモデル ID に置き換えます。
- モデルを読み込んだ状態に保ちます。コールドロードでは起動時の待ち時間が増加します。
- LM Studio のビルドが異なる場合は、`contextWindow`／`maxTokens` を調整します。
- WhatsApp では、最終テキストのみが送信されるように Responses API を使用してください。
- ホスト型モデルをフォールバックとして利用できるように、`models.mode: "merge"` を維持します。

### ハイブリッド設定：ホスト型をプライマリ、ローカルをフォールバックにする

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

ローカル優先でホスト型を安全網として使用するには、`primary`／`fallbacks` の順序を入れ替え、同じ `providers` ブロックと `models.mode: "merge"` を維持します。

### リージョン別ホスティング／データルーティング

ホスト型の MiniMax／Kimi／GLM バリアントは、リージョン固定エンドポイント（たとえば米国ホスト）を備えた OpenRouter 上でも提供されています。Anthropic／OpenAI のフォールバック用に `models.mode: "merge"` を維持しつつ、選択した法域内にトラフィックを留めるには、該当するリージョンバリアントを選択してください。プライバシーを最も重視する場合は、引き続きローカルのみの構成が最適です。プロバイダー機能が必要でありながらデータフローを制御したい場合、ホスト型のリージョンルーティングが中間的な選択肢となります。

## その他の OpenAI 互換ローカルプロキシ

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy、または任意のカスタム Gateway は、OpenAI 形式の `/v1/chat/completions` エンドポイントを公開していれば動作します。バックエンドのドキュメントに `/v1/responses` 対応が明記されていない限り、`openai-completions` を使用してください。

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

カスタム／ローカルプロバイダーのエントリでは、保護されたモデルリクエストに対して、設定された正確な `baseUrl` のオリジンを信頼します。これには、ループバック、LAN、tailnet、プライベート DNS ホストが含まれます。メタデータ／リンクローカルのオリジンは、設定にかかわらず常にブロックされます。その他のプライベートオリジンへのリクエストには、引き続き `models.providers.<id>.request.allowPrivateNetwork: true` が必要です。正確なオリジンの信頼を無効にするには、信頼フラグを `false` に設定します。

`models.providers.<id>.models[].id` はプロバイダー内でローカルな値です。プロバイダーのプレフィックスを含めないでください。`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` で起動した MLX サーバーの場合：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

ローカルまたはプロキシ経由のビジョンモデルでは、画像添付がエージェントターンに挿入されるように `input: ["text", "image"]` を設定します。対話式のカスタムプロバイダーのオンボーディングでは、一般的なビジョンモデル ID を推定し、不明な名前についてのみ確認します。非対話式のオンボーディングでも同じ推定を使用し、`--custom-image-input`／`--custom-text-input` で上書きできます。

低速なローカル／リモートモデルサーバーでは、`agents.defaults.timeoutSeconds` を増やす前に `models.providers.<id>.timeoutSeconds` を使用してください。プロバイダーのタイムアウトは、モデルの HTTP リクエストに限り、接続、ヘッダー、本文のストリーミング、および保護されたフェッチ全体の中断までを対象とします。エージェント／実行のタイムアウトの方が短い場合は、プロバイダーのタイムアウトでは実行全体を延長できないため、そちらも増やしてください。

<Note>
カスタムの OpenAI 互換プロバイダーでは、`baseUrl` がループバック、プライベート LAN、`.local`、またはドットを含まないホスト名に解決される場合、`apiKey: "ollama-local"` のような秘密ではないローカルマーカーが受け入れられます。OpenClaw は、キーが見つからないと報告する代わりに、これを有効なローカル認証情報として扱います。公開ホスト名を受け入れるプロバイダーには、実際の値を使用してください。
</Note>

ローカル／プロキシ経由の `/v1` バックエンドに関する動作上の注意：

- OpenClaw はこれらを、ネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換ルートとして扱います。
- ネイティブ OpenAI 専用のリクエスト整形は適用されません。`service_tier`、Responses の `store`、OpenAI の推論互換ペイロード整形、プロンプトキャッシュのヒントはいずれも使用されません。
- 非表示の OpenClaw 帰属ヘッダー（`originator`、`version`、`User-Agent`）は、カスタムプロキシ URL には挿入されません。

より厳格な OpenAI 互換バックエンド向けの互換性上書き：

- **文字列のみのコンテンツ**：一部のサーバーは、構造化されたコンテンツパートの配列ではなく、文字列の `messages[].content` のみを受け入れます。`models.providers.<provider>.models[].compat.requiresStringContent: true` を設定します。
- **厳格なメッセージキー**：サーバーが `role`／`content` 以外のキーを持つメッセージエントリを拒否する場合は、`compat.strictMessageKeys: true` を設定します。
- **角括弧付きのツールテキスト**：一部のローカルモデルは、`[tool_name]` に続けて JSON と `[END_TOOL_REQUEST]` を出力するような、独立した角括弧付きのツールリクエストをテキストとして生成します。OpenClaw は、その名前が当該ターンに登録されたツールと完全に一致する場合にのみ、これを実際のツール呼び出しに昇格させます。それ以外の場合は、非表示の未対応テキストとして残ります。
- **ツール呼び出しに見える非構造化テキスト**：モデルがツール呼び出しのように見える JSON／XML／ReAct 形式のテキストを生成しても、それが構造化された呼び出しでなければ、OpenClaw はテキストのまま保持し、実行 ID、プロバイダー／モデル、検出されたパターン、および取得できる場合はツール名を含む警告をログに記録します。これはプロバイダー／モデルの非互換性であり、完了したツール実行ではありません。
- **ツール使用の強制**：ツールがアシスタントテキスト（生の JSON／XML／ReAct、または空の `tool_calls` 配列）として現れる場合は、まずサーバーのチャットテンプレート／パーサーがツール呼び出しに対応していることを確認してください。ツール使用を強制した場合にのみパーサーが動作する場合は、モデルごとにプロキシのデフォルト値 `tool_choice: "auto"` を上書きします：

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

  これは、通常のすべてのターンでツールを呼び出す必要がある場合にのみ使用してください。`local/my-local-model` を `openclaw models list` に表示される正確な参照に置き換えるか、CLI で設定します：

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **追加の推論強度**：カスタムの OpenAI 互換モデルが、組み込みプロファイル以外の OpenAI 推論強度を受け入れる場合は、モデルの互換性ブロックで宣言します。`"xhigh"` を追加すると、そのモデル参照について、`/think xhigh`、セッション選択画面、Gateway 検証、および `llm-task` 検証で利用できるようになります：

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

モデル自体は正常に読み込まれるものの、エージェントターン全体が正しく動作しない場合は、上位から順に確認します。まずトランスポートを確認し、その後で対象範囲を絞り込みます。

1. **ローカルモデルが応答することを確認する** - ツールなし、エージェントコンテキストなし：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Gateway ルーティングを確認する** - トランスクリプト、AGENTS ブートストラップ、コンテキストエンジンの組み立て、ツール、同梱 MCP サーバーを省略してプロンプトだけを送信しますが、Gateway ルーティング、認証、プロバイダー選択は引き続き実行します。

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **リーンモードを試す** - 両方のプローブに成功しても、実際のエージェントターンが不正なツール呼び出しや過大なプロンプトで失敗する場合は、`agents.defaults.experimental.localModelLean: true` を設定します。明示的に必要とされない限り、重量級のブラウザー、Cron、メッセージ、メディア生成、音声、PDF ツールを除外し、`exec` は直接表示したまま、より大きなツールカタログを構造化されたツール検索コントロールの背後にデフォルトで配置します。詳細と有効になっていることの確認方法については、[実験的機能 -> ローカルモデルのリーンモード](/ja-JP/concepts/experimental-features#local-model-lean-mode)を参照してください。

4. **最後の手段としてツールを完全に無効化する** - そのモデルに `models.providers.<provider>.models[].compat.supportsTools: false` を設定すると、エージェントはツール呼び出しなしで実行されます。

5. **それでも失敗する場合、ボトルネックは上流にあります。** リーンモードと `supportsTools: false` の適用後も、より大きな OpenClaw 実行でのみバックエンドが失敗する場合、残る問題は通常、OpenClaw のトランスポート層ではなく、モデルまたはサーバー自体（コンテキストウィンドウ、GPU メモリ、kv-cache の退避、バックエンドのバグ）にあります。

## トラブルシューティング

- **Gateway からプロキシに到達できない場合** `curl http://127.0.0.1:1234/v1/models` を実行します。
- **LM Studio のモデルがアンロードされている場合** 再読み込みしてください。コールドスタートは「ハング」する一般的な原因です。
- **ローカルサーバーが `terminated`、`ECONNRESET` を報告する、またはターンの途中でストリームを閉じる場合** OpenClaw は、カーディナリティの低い `model.call.error.failureKind` と OpenClaw プロセスの RSS/ヒープスナップショットを診断情報に記録します。LM Studio/Ollama のメモリ圧迫については、そのタイムスタンプをサーバーログまたは macOS のクラッシュ/jetsam ログと照合し、モデルサーバーが強制終了されたかどうかを確認してください。
- **コンテキストエラーの場合** OpenClaw は、検出されたモデルウィンドウ（または `agents.defaults.contextTokens` で縮小された場合は上限適用後のウィンドウ）からコンテキストウィンドウの事前チェックしきい値を導出します。**8k** を下限として 20% 未満で警告し、**4k** を下限として 10% 未満で強制的にブロックします（過大なモデルメタデータによって有効なユーザー設定上限が拒否されないよう、有効なコンテキストウィンドウを上限とします）。`contextWindow` を小さくするか、サーバー/モデルのコンテキスト上限を引き上げてください。
- **`messages[].content ... expected a string` の場合** そのモデルエントリに `compat.requiresStringContent: true` を追加します。
- **`validation.keys`、または「メッセージエントリでは `role` と `content` のみ許可される」というエラーの場合** そのモデルエントリに `compat.strictMessageKeys: true` を追加します。
- **`/v1/chat/completions` の直接呼び出しは動作するが、Gemma または別のローカルモデルで `openclaw infer model run --local` が失敗する場合** まずプロバイダー URL、モデル参照、認証マーカー、サーバーログを確認してください。`model run` はエージェントツールを完全に省略します。`model run` は成功しても、より大きなエージェントターンが失敗する場合は、`localModelLean` または `compat.supportsTools: false` を使用してツール範囲を縮小してください。
- **ツール呼び出しが未加工の JSON/XML/ReAct テキストとして表示される、またはプロバイダーが空の `tool_calls` 配列を返す場合** アシスタントのテキストを無条件にツール実行へ変換するプロキシを追加しないでください。まずサーバーのチャットテンプレート/パーサーを修正してください。ツール使用を強制した場合にのみモデルが動作するなら、上記の `params.extra_body.tool_choice: "required"` オーバーライドを追加し、毎ターンのツール呼び出しが想定されるセッションでのみ、そのモデルエントリを使用してください。
- **安全性**：ローカルモデルではプロバイダー側のフィルターが適用されません。プロンプトインジェクションの影響範囲を抑えるため、エージェントの権限範囲を限定し、Compaction を有効にしてください。

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [モデルのフェイルオーバー](/ja-JP/concepts/model-failover)
