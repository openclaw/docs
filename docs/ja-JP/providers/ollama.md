---
read_when:
    - Ollama 経由で OpenClaw をクラウドモデルまたはローカルモデルと一緒に実行したい場合
    - Ollama のセットアップと設定ガイダンスが必要な場合
    - 画像理解向けに Ollama の vision モデルを使いたい場合
summary: Ollama で OpenClaw を実行する（クラウドモデルとローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-04-24T05:16:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw は、ホスト型クラウドモデルおよびローカル / セルフホスト型 Ollama サーバー向けに、Ollama のネイティブ API（`/api/chat`）と統合します。Ollama は 3 つのモードで使えます: 到達可能な Ollama ホスト経由の `Cloud + Local`、`https://ollama.com` に対する `Cloud only`、および到達可能な Ollama ホストに対する `Local only`。

<Warning>
**リモート Ollama 利用者向け**: OpenClaw では `/v1` の OpenAI 互換 URL（`http://host:11434/v1`）を使わないでください。これを使うと tool calling が壊れ、モデルが生のツール JSON をプレーンテキストとして出力することがあります。代わりに、ネイティブ Ollama API URL を使ってください: `baseUrl: "http://host:11434"`（`/v1` なし）。
</Warning>

## はじめに

好みのセットアップ方法とモードを選んでください。

<Tabs>
  <Tab title="オンボーディング（推奨）">
    **最適な用途:** 動作する Ollama クラウド / ローカルセットアップへの最短経路。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard
        ```

        プロバイダ一覧から **Ollama** を選択します。
      </Step>
      <Step title="モードを選ぶ">
        - **Cloud + Local** — ローカル Ollama ホスト + そのホスト経由でルーティングされるクラウドモデル
        - **Cloud only** — `https://ollama.com` 経由のホスト型 Ollama モデル
        - **Local only** — ローカルモデルのみ

      </Step>
      <Step title="モデルを選択">
        `Cloud only` では `OLLAMA_API_KEY` を求められ、ホスト型クラウドのデフォルト候補が提示されます。`Cloud + Local` と `Local only` では Ollama base URL を求められ、利用可能なモデルを検出し、選択したローカルモデルがまだ存在しない場合は自動で pull します。`Cloud + Local` では、その Ollama ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
      </Step>
      <Step title="モデルが利用可能か確認">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非対話モード

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    必要に応じてカスタム base URL やモデルも指定できます:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手動セットアップ">
    **最適な用途:** クラウドまたはローカルセットアップを完全に制御したい場合。

    <Steps>
      <Step title="クラウドかローカルかを選ぶ">
        - **Cloud + Local**: Ollama をインストールし、`ollama signin` でサインインして、そのホスト経由でクラウドリクエストをルーティングする
        - **Cloud only**: `OLLAMA_API_KEY` とともに `https://ollama.com` を使う
        - **Local only**: [ollama.com/download](https://ollama.com/download) から Ollama をインストールする

      </Step>
      <Step title="ローカルモデルを pull する（local only）">
        ```bash
        ollama pull gemma4
        # または
        ollama pull gpt-oss:20b
        # または
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw で Ollama を有効にする">
        `Cloud only` では実際の `OLLAMA_API_KEY` を使ってください。ホストバックエンドのセットアップでは、プレースホルダー値でも動作します:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # または config file で設定
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="モデルを確認して設定">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        または config でデフォルトを設定:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## クラウドモデル

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` は、ローカルモデルとクラウドモデルの両方に対する制御点として、到達可能な Ollama ホストを使います。これは Ollama が推奨するハイブリッドフローです。

    セットアップ中に **Cloud + Local** を使ってください。OpenClaw は Ollama base URL を求め、そのホストからローカルモデルを検出し、`ollama signin` によってホストがクラウドアクセス用にサインイン済みかを確認します。ホストがサインイン済みであれば、OpenClaw は `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` のようなホスト型クラウドのデフォルト候補も提示します。

    ホストがまだサインインしていない場合、`ollama signin` を実行するまでは、OpenClaw はセットアップを local-only のままにします。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` は `https://ollama.com` 上の Ollama ホスト型 API に対して実行されます。

    セットアップ中に **Cloud only** を使ってください。OpenClaw は `OLLAMA_API_KEY` を求め、`baseUrl: "https://ollama.com"` を設定し、ホスト型クラウドモデル一覧を初期投入します。この経路ではローカル Ollama サーバーも `ollama signin` も不要です。

    `openclaw onboard` 中に表示されるクラウドモデル一覧は、`https://ollama.com/api/tags` からライブで取得され、最大 500 エントリに制限されるため、picker には静的シードではなく現在のホスト型カタログが反映されます。セットアップ時に `ollama.com` に到達できない、またはモデルを返さない場合、オンボーディングを完了できるよう、OpenClaw は以前のハードコードされた候補にフォールバックします。

  </Tab>

  <Tab title="Local only">
    local-only モードでは、OpenClaw は設定された Ollama インスタンスからモデルを検出します。この経路は、ローカルまたはセルフホスト型 Ollama サーバー向けです。

    OpenClaw は現在、ローカルのデフォルトとして `gemma4` を提案します。

  </Tab>
</Tabs>

## モデル検出（暗黙 provider）

`OLLAMA_API_KEY`（または auth profile）を設定し、**`models.providers.ollama` を定義していない** 場合、OpenClaw は `http://127.0.0.1:11434` のローカル Ollama インスタンスからモデルを検出します。

| 動作                 | 詳細                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログ問い合わせ   | `/api/tags` を問い合わせる                                                                                                                                         |
| 機能検出             | `contextWindow` の読み取りと機能（vision を含む）検出のため、ベストエフォートで `/api/show` を参照する                                                          |
| Vision モデル        | `/api/show` が `vision` 機能を報告したモデルは、画像対応（`input: ["text", "image"]`）としてマークされるため、OpenClaw は自動的に画像をプロンプトへ注入する |
| Reasoning 検出       | モデル名ヒューリスティック（`r1`, `reasoning`, `think`）で `reasoning` をマークする                                                                              |
| トークン上限         | `maxTokens` は OpenClaw が使うデフォルト Ollama max-token 上限に設定される                                                                                       |
| コスト               | すべてのコストを `0` に設定する                                                                                                                                   |

これにより、カタログをローカル Ollama インスタンスと同期させつつ、手動モデルエントリを不要にできます。

```bash
# 利用可能なモデルを確認
ollama list
openclaw models list
```

新しいモデルを追加するには、Ollama で pull するだけです:

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、利用可能になります。

<Note>
`models.providers.ollama` を明示的に設定した場合、自動検出はスキップされるため、モデルを手動定義する必要があります。下の explicit config セクションを参照してください。
</Note>

## Vision と画像説明

同梱の Ollama Plugin は、Ollama を画像対応の media-understanding provider として登録します。これにより OpenClaw は、明示的な画像説明リクエストや、設定された画像モデルデフォルトを、ローカルまたはホスト型の Ollama vision モデルへルーティングできます。

ローカルで vision を使うには、画像対応モデルを pull してください:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

その後、infer CLI で確認します:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` は完全な `<provider/model>` 参照である必要があります。これが設定されている場合、`openclaw infer image describe` は、そのモデルがネイティブ vision をサポートしているため、説明をスキップせずに直接そのモデルを実行します。

受信メディア向けのデフォルト画像理解モデルとして Ollama を使うには、`agents.defaults.imageModel` を設定します:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

`models.providers.ollama.models` を手動で定義する場合は、vision モデルを画像入力対応としてマークしてください:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw は、画像対応としてマークされていないモデルへの画像説明リクエストを拒否します。暗黙の検出では、`/api/show` が vision 機能を報告した場合、その情報を Ollama から読み取ります。

## 設定

<Tabs>
  <Tab title="Basic（暗黙の自動検出）">
    もっとも簡単な local-only 有効化経路は環境変数です:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されていれば、provider エントリ内の `apiKey` は省略可能で、OpenClaw が可用性確認用に補います。
    </Tip>

  </Tab>

  <Tab title="Explicit（手動モデル定義）">
    ホスト型クラウドセットアップ、別ホスト / ポートで動く Ollama、特定の contextWindow やモデル一覧を強制したい場合、または完全に手動のモデル定義をしたい場合は explicit config を使います。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    Ollama が別のホストやポートで動いている場合（explicit config では自動検出が無効になるため、モデルは手動定義してください）:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 なし - ネイティブ Ollama API URL を使う
            api: "ollama", // ネイティブ tool-calling 動作を確実にするため明示設定
          },
        },
      },
    }
    ```

    <Warning>
    URL に `/v1` を付けないでください。`/v1` パスは OpenAI 互換モードになり、tool calling が安定しません。パスサフィックスなしのベース Ollama URL を使ってください。
    </Warning>

  </Tab>
</Tabs>

### モデル選択

設定が完了すると、すべての Ollama モデルが利用可能になります:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

## Ollama Web Search

OpenClaw は、同梱の `web_search` provider として **Ollama Web Search** をサポートします。

| 項目        | 詳細                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| ホスト      | 設定された Ollama ホストを使う（`models.providers.ollama.baseUrl` が設定されていればそれ、そうでなければ `http://127.0.0.1:11434`） |
| 認証        | キー不要                                                                                                          |
| 要件        | Ollama が動作しており、`ollama signin` でサインイン済みであること                                                 |

`openclaw onboard` または `openclaw configure --section web` 中に **Ollama Web Search** を選ぶか、次を設定してください:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
完全なセットアップと動作詳細は [Ollama Web Search](/ja-JP/tools/ollama-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="旧来の OpenAI 互換モード">
    <Warning>
    **OpenAI 互換モードでは tool calling は安定しません。** このモードは、プロキシのために OpenAI 形式が必要で、かつネイティブな tool calling 動作に依存しない場合にのみ使ってください。
    </Warning>

    代わりに OpenAI 互換エンドポイントを使う必要がある場合（たとえば OpenAI 形式だけをサポートするプロキシの背後など）は、`api: "openai-completions"` を明示的に設定します:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // デフォルト: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    このモードでは、ストリーミングと tool calling の同時利用がサポートされない場合があります。モデル config の `params: { streaming: false }` でストリーミングを無効化する必要があるかもしれません。

    Ollama で `api: "openai-completions"` を使う場合、OpenClaw はデフォルトで `options.num_ctx` を注入し、Ollama が黙って 4096 のコンテキストウィンドウにフォールバックするのを防ぎます。プロキシ / 上流が未知の `options` フィールドを拒否する場合は、この動作を無効にしてください:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="コンテキストウィンドウ">
    自動検出されたモデルでは、利用可能な場合は Ollama が報告するコンテキストウィンドウを使い、そうでなければ OpenClaw が使うデフォルト Ollama コンテキストウィンドウへフォールバックします。

    明示的な provider config では `contextWindow` と `maxTokens` を上書きできます:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Reasoning モデル">
    OpenClaw は、`deepseek-r1`, `reasoning`, `think` のような名前を持つモデルを、デフォルトで reasoning 対応として扱います。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    追加設定は不要です -- OpenClaw が自動的にマークします。

  </Accordion>

  <Accordion title="モデルコスト">
    Ollama は無料でローカル実行されるため、すべてのモデルコストは $0 に設定されます。これは自動検出モデルにも手動定義モデルにも適用されます。
  </Accordion>

  <Accordion title="Memory embeddings">
    同梱 Ollama Plugin は
    [memory search](/ja-JP/concepts/memory) 用の memory embedding provider を登録します。設定済み Ollama base URL
    と API キーを使います。

    | 項目             | 値                  |
    | ---------------- | ------------------- |
    | デフォルトモデル | `nomic-embed-text`  |
    | 自動 pull        | Yes — 埋め込みモデルがローカルに存在しない場合は自動的に pull される |

    memory search の埋め込みプロバイダとして Ollama を選ぶには:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ストリーミング設定">
    OpenClaw の Ollama 統合はデフォルトで **ネイティブ Ollama API**（`/api/chat`）を使い、ストリーミングと tool calling を同時に完全サポートします。特別な設定は不要です。

    ネイティブ `/api/chat` リクエストでは、OpenClaw は thinking 制御も直接 Ollama に渡します: `/think off` と `openclaw agent --thinking off` はトップレベル `think: false` を送信し、`off` 以外の thinking level は `think: true` を送信します。

    <Tip>
    OpenAI 互換エンドポイントを使う必要がある場合は、上記の「旧来の OpenAI 互換モード」セクションを参照してください。そのモードでは、ストリーミングと tool calling は同時に動かないことがあります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="Ollama が検出されない">
    Ollama が動作していること、`OLLAMA_API_KEY`（または auth profile）を設定していること、さらに **明示的な `models.providers.ollama` エントリを定義していない** ことを確認してください:

    ```bash
    ollama serve
    ```

    API にアクセスできることを確認します:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルが一覧にない場合、そのモデルをローカルに pull するか、`models.providers.ollama` に明示的に定義してください。

    ```bash
    ollama list  # インストール済みモデルを確認
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # または別のモデル
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Ollama が正しいポートで動作していることを確認してください:

    ```bash
    # Ollama が動作中か確認
    ps aux | grep ollama

    # または Ollama を再起動
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
さらに支援が必要なら: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダ、モデル参照、failover 動作の概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
  <Card title="Ollama Web Search" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollama ベースの web search に関する完全なセットアップと動作詳細。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
