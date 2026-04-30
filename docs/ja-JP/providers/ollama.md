---
read_when:
    - OpenClaw を Ollama 経由でクラウドまたはローカルのモデルを使って実行したい
    - Ollama のセットアップと設定に関するガイダンスが必要です
    - 画像理解に Ollama のビジョンモデルを使いたい場合
summary: OpenClaw を Ollama で実行する（クラウドモデルとローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-04-30T05:31:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eeaebc0ba72f72a0dee842f7d983a552c86cfa23271322d4740641124f57cfb
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw は、ホストされたクラウドモデルとローカル/セルフホストの Ollama サーバー向けに、Ollama のネイティブ API（`/api/chat`）と統合します。Ollama は、到達可能な Ollama ホスト経由の `Cloud + Local`、`https://ollama.com` に対する `Cloud only`、到達可能な Ollama ホストに対する `Local only` の 3 つのモードで使用できます。

<Warning>
**リモート Ollama ユーザー**: OpenClaw で `/v1` OpenAI 互換 URL（`http://host:11434/v1`）を使用しないでください。これによりツール呼び出しが壊れ、モデルが生のツール JSON をプレーンテキストとして出力することがあります。代わりにネイティブ Ollama API URL を使用してください: `baseUrl: "http://host:11434"`（`/v1` なし）。
</Warning>

Ollama プロバイダー設定では、`baseUrl` を正規キーとして使用します。OpenClaw は OpenAI SDK 形式の例との互換性のために `baseURL` も受け付けますが、新しい設定では `baseUrl` を優先してください。

## 認証ルール

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    ローカルおよび LAN の Ollama ホストには、実際の bearer トークンは不要です。OpenClaw は、loopback、プライベートネットワーク、`.local`、および素のホスト名の Ollama ベース URL に対してのみ、ローカルの `ollama-local` マーカーを使用します。
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    リモートの公開ホストおよび Ollama Cloud（`https://ollama.com`）では、`OLLAMA_API_KEY`、認証プロファイル、またはプロバイダーの `apiKey` を通じた実際の認証情報が必要です。
  </Accordion>
  <Accordion title="Custom provider ids">
    `api: "ollama"` を設定するカスタムプロバイダー ID も同じルールに従います。たとえば、プライベート LAN の Ollama ホストを指す `ollama-remote` プロバイダーは `apiKey: "ollama-local"` を使用でき、サブエージェントはそれを認証情報の欠落として扱うのではなく、Ollama プロバイダーフックを通じてそのマーカーを解決します。メモリ検索でも `agents.defaults.memorySearch.provider` をそのカスタムプロバイダー ID に設定して、埋め込みが対応する Ollama エンドポイントを使用するようにできます。
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` はプロバイダー ID の認証情報を保存します。エンドポイント設定（`baseUrl`、`api`、モデル ID、ヘッダー、タイムアウト）は `models.providers.<id>` に配置してください。`{ "ollama-windows": { "apiKey": "ollama-local" } }` のような古いフラットな認証プロファイルファイルはランタイム形式ではありません。`openclaw doctor --fix` を実行して、バックアップ付きで正規の `ollama-windows:default` API キープロファイルに書き換えてください。そのファイル内の `baseUrl` は互換性のためのノイズであり、プロバイダー設定に移動する必要があります。
  </Accordion>
  <Accordion title="Memory embedding scope">
    Ollama がメモリ埋め込みに使用される場合、bearer 認証は宣言されたホストにスコープされます。

    - プロバイダーレベルのキーは、そのプロバイダーの Ollama ホストにのみ送信されます。
    - `agents.*.memorySearch.remote.apiKey` は、そのリモート埋め込みホストにのみ送信されます。
    - 純粋な `OLLAMA_API_KEY` 環境値は Ollama Cloud の慣例として扱われ、デフォルトではローカルまたはセルフホストのホストには送信されません。

  </Accordion>
</AccordionGroup>

## はじめに

好みのセットアップ方法とモードを選択します。

<Tabs>
  <Tab title="Onboarding (recommended)">
    **最適な用途:** 動作する Ollama クラウドまたはローカルセットアップへの最速経路。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        プロバイダー一覧から **Ollama** を選択します。
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — ローカル Ollama ホストと、そのホスト経由でルーティングされるクラウドモデル
        - **Cloud only** — `https://ollama.com` 経由のホストされた Ollama モデル
        - **Local only** — ローカルモデルのみ

      </Step>
      <Step title="Select a model">
        `Cloud only` は `OLLAMA_API_KEY` の入力を求め、ホストされたクラウドのデフォルトを提案します。`Cloud + Local` と `Local only` は Ollama ベース URL を求め、利用可能なモデルを検出し、選択されたローカルモデルがまだ利用できない場合は自動的に pull します。Ollama が `gemma4:latest` のようなインストール済みの `:latest` タグを報告した場合、セットアップは `gemma4` と `gemma4:latest` の両方を表示したり、素のエイリアスを再度 pull したりせず、そのインストール済みモデルを一度だけ表示します。`Cloud + Local` は、その Ollama ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
      </Step>
      <Step title="Verify the model is available">
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

    任意でカスタムベース URL またはモデルを指定します。

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **最適な用途:** クラウドまたはローカルセットアップを完全に制御したい場合。

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: Ollama をインストールし、`ollama signin` でサインインして、そのホスト経由でクラウドリクエストをルーティングします
        - **Cloud only**: `OLLAMA_API_KEY` とともに `https://ollama.com` を使用します
        - **Local only**: [ollama.com/download](https://ollama.com/download) から Ollama をインストールします

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        `Cloud only` では、実際の `OLLAMA_API_KEY` を使用します。ホストベースのセットアップでは、任意のプレースホルダー値が機能します。

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        または、設定でデフォルトを設定します。

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
    `Cloud + Local` は、ローカルモデルとクラウドモデルの両方の制御点として、到達可能な Ollama ホストを使用します。これは Ollama が推奨するハイブリッドフローです。

    セットアップ中に **Cloud + Local** を使用します。OpenClaw は Ollama ベース URL の入力を求め、そのホストからローカルモデルを検出し、`ollama signin` によるクラウドアクセス用のサインイン状態を確認します。ホストがサインイン済みの場合、OpenClaw は `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` などのホストされたクラウドのデフォルトも提案します。

    ホストがまだサインインしていない場合、`ollama signin` を実行するまで OpenClaw はセットアップをローカル専用のままにします。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` は `https://ollama.com` の Ollama ホスト API に対して実行されます。

    セットアップ中に **Cloud only** を使用します。OpenClaw は `OLLAMA_API_KEY` の入力を求め、`baseUrl: "https://ollama.com"` を設定し、ホストされたクラウドモデル一覧を初期投入します。この経路ではローカル Ollama サーバーや `ollama signin` は不要です。

    `openclaw onboard` 中に表示されるクラウドモデル一覧は `https://ollama.com/api/tags` からライブで取得され、500 件に制限されます。そのため、ピッカーには静的な初期候補ではなく、現在のホスト済みカタログが反映されます。セットアップ時に `ollama.com` に到達できない、またはモデルが返されない場合、OpenClaw は以前のハードコードされた候補にフォールバックするため、オンボーディングは完了できます。

  </Tab>

  <Tab title="Local only">
    ローカル専用モードでは、OpenClaw は設定済みの Ollama インスタンスからモデルを検出します。この経路はローカルまたはセルフホストの Ollama サーバー向けです。

    OpenClaw は現在、ローカルのデフォルトとして `gemma4` を提案します。

  </Tab>
</Tabs>

## モデル検出（暗黙のプロバイダー）

`OLLAMA_API_KEY`（または認証プロファイル）を設定し、かつ `models.providers.ollama` や `api: "ollama"` を持つ別のカスタムリモートプロバイダーを定義していない場合、OpenClaw は `http://127.0.0.1:11434` のローカル Ollama インスタンスからモデルを検出します。

| 動作                 | 詳細                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログクエリ       | `/api/tags` をクエリします                                                                                                                                           |
| 機能検出             | ベストエフォートの `/api/show` 参照を使用して、`contextWindow`、展開された `num_ctx` Modelfile パラメーター、vision/tools を含む機能を読み取ります                   |
| Vision モデル        | `/api/show` が報告する `vision` 機能を持つモデルは画像対応（`input: ["text", "image"]`）としてマークされるため、OpenClaw は画像をプロンプトに自動挿入します          |
| 推論検出             | 利用可能な場合は `thinking` を含む `/api/show` の機能を使用します。Ollama が機能を省略した場合は、モデル名ヒューリスティック（`r1`、`reasoning`、`think`）にフォールバックします |
| トークン制限         | `maxTokens` を、OpenClaw が使用するデフォルトの Ollama 最大トークン上限に設定します                                                                                   |
| コスト               | すべてのコストを `0` に設定します                                                                                                                                    |

これにより、カタログをローカル Ollama インスタンスと整合させつつ、手動のモデルエントリを避けられます。ローカルの `infer model run` では `ollama/<pulled-model>:latest` のような完全な参照を使用できます。OpenClaw は、手書きの `models.json` エントリを要求せずに、Ollama のライブカタログからそのインストール済みモデルを解決します。

サインイン済みの Ollama ホストでは、一部の `:cloud` モデルが `/api/tags` に現れる前に `/api/chat`
および `/api/show` 経由で利用できる場合があります。完全な `ollama/<model>:cloud` 参照を明示的に選択すると、OpenClaw はその正確な欠落モデルを
`/api/show` で検証し、Ollama がモデルメタデータを確認した場合にのみランタイムカタログへ追加します。入力ミスは自動作成されず、不明なモデルとして失敗します。

```bash
# See what models are available
ollama list
openclaw models list
```

完全なエージェントツールサーフェスを避ける、狭いテキスト生成スモークテストには、
完全な Ollama モデル参照を指定してローカルの `infer model run` を使用します。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

この経路でも OpenClaw の設定済みプロバイダー、認証、ネイティブ Ollama
トランスポートを使用しますが、チャットエージェントのターンを開始せず、MCP/ツールコンテキストも読み込みません。通常のエージェント応答が失敗する一方で
これが成功する場合は、次にモデルのエージェント
プロンプト/ツール容量をトラブルシュートしてください。

同じ軽量経路で狭い vision モデルのスモークテストを行うには、1 つ以上の
画像ファイルを `infer model run` に追加します。これにより、チャットツール、メモリ、以前の
セッションコンテキストを読み込まずに、プロンプトと画像を選択した Ollama vision モデルへ直接送信します。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` は、一般的な PNG、
JPEG、WebP 入力を含む、`image/*` として検出されたファイルを受け付けます。画像以外のファイルは Ollama が呼び出される前に拒否されます。
音声認識には、代わりに `openclaw infer audio transcribe` を使用してください。

`/model ollama/<model>` で会話を切り替えると、OpenClaw はそれを正確なユーザー選択として扱います。設定された Ollama `baseUrl` に
到達できない場合、次の応答は、別の設定済みフォールバックモデルから黙って
回答するのではなく、プロバイダーエラーで失敗します。

隔離された cron ジョブは、agent turn を開始する前に追加のローカル安全性チェックを 1 つ実行します。選択されたモデルがローカル、プライベートネットワーク、または `.local` の Ollama provider に解決され、`/api/tags` に到達できない場合、OpenClaw はその cron 実行を、エラーテキスト内の選択された `ollama/<model>` とともに `skipped` として記録します。エンドポイントの事前チェックは 5 分間キャッシュされるため、停止中の同じ Ollama デーモンを指す複数の cron ジョブが、失敗するモデルリクエストをすべて起動することはありません。

ローカルのテキストパス、ネイティブストリームパス、埋め込みを、ローカル Ollama に対してライブ検証するには次を使います。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

新しいモデルを追加するには、Ollama で単に pull します。

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、使用可能になります。

<Note>
`models.providers.ollama` を明示的に設定した場合、または `api: "ollama"` を指定して `models.providers.ollama-cloud` のようなカスタムリモート provider を構成した場合、自動検出はスキップされ、モデルを手動で定義する必要があります。`http://127.0.0.2:11434` のようなループバックカスタム provider は引き続きローカルとして扱われます。下記の明示的な設定セクションを参照してください。
</Note>

## Vision と画像説明

バンドルされた Ollama Plugin は、Ollama を画像対応のメディア理解 provider として登録します。これにより、OpenClaw は明示的な画像説明リクエストと、構成済みの画像モデル default を、ローカルまたはホストされた Ollama vision モデルにルーティングできます。

ローカル vision では、画像をサポートするモデルを pull します。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

次に infer CLI で検証します。

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` は完全な `<provider/model>` ref である必要があります。設定されている場合、`openclaw infer image describe` は、モデルがネイティブ vision をサポートしているために説明をスキップするのではなく、そのモデルを直接実行します。

OpenClaw の画像理解 provider フロー、構成済みの `agents.defaults.imageModel`、および画像説明の出力形状を使いたい場合は、`infer image describe` を使用します。カスタムプロンプトと 1 つ以上の画像を使って、生のマルチモーダルモデルを調べたい場合は、`infer model run --file` を使用します。

Ollama を受信メディアのデフォルト画像理解モデルにするには、`agents.defaults.imageModel` を構成します。

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

完全な `ollama/<model>` ref を推奨します。同じモデルが `models.providers.ollama.models` の下に `input: ["text", "image"]` として列挙されており、同じ bare model ID を公開する他の構成済み画像 provider がない場合、OpenClaw は `qwen2.5vl:7b` のような bare `imageModel` ref も `ollama/qwen2.5vl:7b` に正規化します。複数の構成済み画像 provider が同じ bare ID を持つ場合は、provider prefix を明示的に使用してください。

遅いローカル vision モデルでは、クラウドモデルよりも長い画像理解タイムアウトが必要になる場合があります。また、制約のあるハードウェアで Ollama が公開されている完全な vision context を割り当てようとすると、クラッシュまたは停止することがあります。通常の画像説明 turn だけが必要な場合は、capability timeout を設定し、モデルエントリで `num_ctx` を制限します。

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

このタイムアウトは、受信画像理解と、agent が turn 中に呼び出せる明示的な `image` tool に適用されます。provider レベルの `models.providers.ollama.timeoutSeconds` は、通常のモデル呼び出しに対する基盤の Ollama HTTP リクエストガードを引き続き制御します。

明示的な image tool をローカル Ollama に対してライブ検証するには次を使います。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` を手動で定義する場合は、vision モデルに画像入力サポートをマークします。

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw は、画像対応としてマークされていないモデルに対する画像説明リクエストを拒否します。暗黙的な検出では、`/api/show` が vision capability を報告したときに、OpenClaw はこれを Ollama から読み取ります。

## 設定

<Tabs>
  <Tab title="基本（暗黙的な検出）">
    最も単純なローカル専用の有効化パスは環境変数を使う方法です。

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されている場合、provider エントリの `apiKey` は省略でき、OpenClaw が可用性チェック用にそれを補完します。
    </Tip>

  </Tab>

  <Tab title="明示的（手動モデル）">
    ホストされたクラウド設定、別のホストやポートで実行される Ollama、特定の context window やモデルリストの強制、または完全に手動のモデル定義が必要な場合は、明示的な設定を使用します。

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

  <Tab title="カスタム base URL">
    Ollama が別のホストまたはポートで実行されている場合（明示的な設定では自動検出が無効になるため、モデルを手動で定義します）。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    URL に `/v1` を追加しないでください。`/v1` パスは OpenAI 互換モードを使用し、このモードでは tool calling の信頼性がありません。パスサフィックスなしのベース Ollama URL を使用してください。
    </Warning>

  </Tab>
</Tabs>

## 一般的なレシピ

これらを出発点として使い、モデル ID を `ollama list` または `openclaw models list --provider ollama` の正確な名前に置き換えてください。

<AccordionGroup>
  <Accordion title="自動検出付きローカルモデル">
    Ollama が Gateway と同じマシンで実行されており、インストール済みモデルを OpenClaw に自動検出させたい場合に使用します。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    このパスでは設定を最小限に保てます。モデルを手動で定義したい場合を除き、`models.providers.ollama` ブロックを追加しないでください。

  </Accordion>

  <Accordion title="手動モデルを使う LAN Ollama ホスト">
    LAN ホストにはネイティブ Ollama URL を使用します。`/v1` は追加しないでください。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` は OpenClaw 側の context budget です。`params.num_ctx` はリクエストで Ollama に送信されます。ハードウェアがモデルの公開されている完全な context を実行できない場合は、これらを揃えてください。

  </Accordion>

  <Accordion title="Ollama Cloud のみ">
    ローカルデーモンを実行せず、ホストされた Ollama モデルを直接使いたい場合に使用します。

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

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
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="サインイン済みデーモン経由のクラウドとローカルの併用">
    ローカルまたは LAN の Ollama デーモンが `ollama signin` でサインイン済みで、ローカルモデルと `:cloud` モデルの両方を提供する必要がある場合に使用します。

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="複数の Ollama ホスト">
    複数の Ollama server がある場合は、カスタム provider ID を使用します。各 provider は独自のホスト、モデル、認証、タイムアウト、モデル ref を持ちます。

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw がリクエストを送信するとき、アクティブな provider prefix は削除されるため、`ollama-large/qwen3.5:27b` は `qwen3.5:27b` として Ollama に到達します。

  </Accordion>

  <Accordion title="軽量なローカルモデルプロファイル">
    一部のローカルモデルは単純なプロンプトには回答できますが、完全な agent tool surface では苦戦することがあります。グローバルランタイム設定を変更する前に、まず tools と context を制限してください。

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    `compat.supportsTools: false` は、モデルまたはサーバーがツールスキーマで確実に失敗する場合にのみ使用します。これは安定性と引き換えにエージェント機能を制限します。
    `localModelLean` はエージェントの表面からブラウザー、cron、メッセージツールを削除しますが、Ollama のランタイムコンテキストや思考モードは変更しません。ループしたり、応答予算を隠れた推論に費やしたりする小さな Qwen スタイルの思考モデルでは、明示的な `params.num_ctx` と `params.thinking: false` を組み合わせてください。

  </Accordion>
</AccordionGroup>

### モデル選択

設定後、すべての Ollama モデルが利用できます。

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

カスタム Ollama プロバイダー ID もサポートされています。モデル参照が `ollama-spark/qwen3:32b` のようにアクティブなプロバイダープレフィックスを使用する場合、OpenClaw は Ollama を呼び出す前にそのプレフィックスだけを取り除くため、サーバーは `qwen3:32b` を受け取ります。

遅いローカルモデルでは、エージェントランタイム全体のタイムアウトを引き上げる前に、プロバイダー単位のリクエスト調整を優先してください。

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` は、接続セットアップ、ヘッダー、本文ストリーミング、保護された fetch の中断全体を含むモデル HTTP リクエストに適用されます。`params.keep_alive` はネイティブの `/api/chat` リクエストでトップレベルの `keep_alive` として Ollama に転送されます。初回ターンの読み込み時間がボトルネックの場合はモデルごとに設定してください。

### クイック検証

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

リモートホストでは、`127.0.0.1` を `baseUrl` で使用しているホストに置き換えてください。`curl` は動作するのに OpenClaw が動作しない場合は、Gateway が別のマシン、コンテナー、またはサービスアカウントで実行されていないか確認してください。

## Ollama Web Search

OpenClaw は、バンドルされた `web_search` プロバイダーとして **Ollama Web Search** をサポートします。

| プロパティ | 詳細                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ホスト        | 設定済みの Ollama ホストを使用します（設定されている場合は `models.providers.ollama.baseUrl`、それ以外は `http://127.0.0.1:11434`）。`https://ollama.com` はホスト型 API を直接使用します |
| 認証        | サインイン済みのローカル Ollama ホストではキー不要です。直接の `https://ollama.com` 検索または認証で保護されたホストでは `OLLAMA_API_KEY` または設定済みプロバイダー認証を使用します               |
| 要件 | ローカル/セルフホストのホストは実行中で、`ollama signin` でサインイン済みである必要があります。直接のホスト型検索には `baseUrl: "https://ollama.com"` と実際の Ollama API キーが必要です |

`openclaw onboard` または `openclaw configure --section web` で **Ollama Web Search** を選択するか、次を設定します。

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

Ollama Cloud 経由の直接ホスト型検索の場合:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

サインイン済みのローカルデーモンでは、OpenClaw はデーモンの `/api/experimental/web_search` プロキシを使用します。`https://ollama.com` の場合は、ホスト型の `/api/web_search` エンドポイントを直接呼び出します。

<Note>
完全なセットアップと挙動の詳細については、[Ollama Web Search](/ja-JP/tools/ollama-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="レガシー OpenAI 互換モード">
    <Warning>
    **OpenAI 互換モードではツール呼び出しは信頼できません。** このモードは、プロキシで OpenAI 形式が必要で、ネイティブのツール呼び出し挙動に依存しない場合にのみ使用してください。
    </Warning>

    代わりに OpenAI 互換エンドポイントを使用する必要がある場合（たとえば、OpenAI 形式のみをサポートするプロキシの背後にある場合）は、`api: "openai-completions"` を明示的に設定します。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    このモードでは、ストリーミングとツール呼び出しを同時にサポートしない場合があります。モデル設定で `params: { streaming: false }` を使ってストリーミングを無効にする必要があるかもしれません。

    Ollama で `api: "openai-completions"` が使用される場合、OpenClaw はデフォルトで `options.num_ctx` を注入し、Ollama が暗黙的に 4096 のコンテキストウィンドウへフォールバックしないようにします。プロキシまたはアップストリームが未知の `options` フィールドを拒否する場合は、この挙動を無効にしてください。

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
    自動検出されたモデルでは、OpenClaw は利用可能な場合、カスタム Modelfile のより大きな `PARAMETER num_ctx` 値を含め、Ollama が報告するコンテキストウィンドウを使用します。それ以外の場合は、OpenClaw が使用するデフォルトの Ollama コンテキストウィンドウにフォールバックします。

    その Ollama プロバイダー配下のすべてのモデルに対して、プロバイダーレベルの `contextWindow`、`contextTokens`、`maxTokens` のデフォルトを設定し、必要に応じてモデルごとに上書きできます。`contextWindow` は OpenClaw のプロンプトと Compaction の予算です。ネイティブの Ollama リクエストでは、`params.num_ctx` を明示的に設定しない限り `options.num_ctx` は未設定のままになるため、Ollama は独自のモデル、`OLLAMA_CONTEXT_LENGTH`、または VRAM ベースのデフォルトを適用できます。Modelfile を再ビルドせずに Ollama のリクエストごとのランタイムコンテキストを上限設定または強制するには、`params.num_ctx` を設定します。無効、ゼロ、負数、非有限の値は無視されます。OpenAI 互換 Ollama アダプターは、設定された `params.num_ctx` または `contextWindow` からデフォルトで引き続き `options.num_ctx` を注入します。アップストリームが `options` を拒否する場合は、`injectNumCtxForOpenAICompat: false` で無効にしてください。

    ネイティブ Ollama モデルエントリは、`temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread`、`use_mmap` など、一般的な Ollama ランタイムオプションも `params` 配下で受け付けます。OpenClaw は Ollama リクエストキーだけを転送するため、`streaming` のような OpenClaw ランタイムパラメーターが Ollama に漏れることはありません。トップレベルの Ollama `think` を送信するには `params.think` または `params.thinking` を使用します。`false` は Qwen スタイルの思考モデルで API レベルの思考を無効にします。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    モデルごとの `agents.defaults.models["ollama/<model>"].params.num_ctx` も機能します。両方が設定されている場合は、明示的なプロバイダーモデルエントリがエージェントデフォルトより優先されます。

  </Accordion>

  <Accordion title="思考制御">
    ネイティブ Ollama モデルでは、OpenClaw は Ollama が期待する形式で思考制御を転送します。つまり `options.think` ではなく、トップレベルの `think` です。`/api/show` レスポンスに `thinking` 機能が含まれる自動検出モデルは、`/think low`、`/think medium`、`/think high`、`/think max` を公開します。思考非対応モデルは `/think off` のみを公開します。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    モデルデフォルトも設定できます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    モデルごとの `params.think` または `params.thinking` は、特定の設定済みモデルに対して Ollama API の思考を無効化または強制できます。アクティブな実行に暗黙的なデフォルト `off` しかない場合、OpenClaw はそれらの明示的なモデルパラメーターを保持します。`/think medium` のような off 以外のランタイムコマンドは、引き続きアクティブな実行を上書きします。

  </Accordion>

  <Accordion title="推論モデル">
    OpenClaw は、`deepseek-r1`、`reasoning`、`think` のような名前のモデルをデフォルトで推論対応として扱います。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    追加設定は不要です。OpenClaw が自動的にマークします。

  </Accordion>

  <Accordion title="モデルコスト">
    Ollama は無料でローカル実行されるため、すべてのモデルコストは $0 に設定されます。これは自動検出モデルと手動定義モデルの両方に適用されます。
  </Accordion>

  <Accordion title="メモリエンベディング">
    バンドルされた Ollama Plugin は、[メモリ検索](/ja-JP/concepts/memory) 用のメモリエンベディングプロバイダーを登録します。設定済みの Ollama ベース URL と API キーを使用し、Ollama の現在の `/api/embed` エンドポイントを呼び出し、可能な場合は複数のメモリチャンクを 1 つの `input` リクエストにバッチ化します。

    | プロパティ      | 値               |
    | ------------- | ------------------- |
    | デフォルトモデル | `nomic-embed-text`  |
    | 自動 pull     | はい — エンベディングモデルがローカルに存在しない場合、自動的に pull されます |

    クエリ時のエンベディングは、`nomic-embed-text`、`qwen3-embedding`、`mxbai-embed-large` など、それを必要とする、または推奨するモデル向けに検索プレフィックスを使用します。メモリドキュメントのバッチは生のままに保たれるため、既存のインデックスで形式移行は不要です。

    メモリ検索エンベディングプロバイダーとして Ollama を選択するには:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    リモートエンベディングホストでは、認証をそのホストに限定してください。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ストリーミング設定">
    OpenClaw の Ollama 連携は、デフォルトで **ネイティブ Ollama API** (`/api/chat`) を使用します。これはストリーミングとツール呼び出しの同時利用を完全にサポートしています。特別な設定は不要です。

    ネイティブ `/api/chat` リクエストでは、OpenClaw は thinking 制御も Ollama に直接転送します。`/think off` と `openclaw agent --thinking off` は、明示的なモデル `params.think`/`params.thinking` 値が設定されていない限り、トップレベルの `think: false` を送信します。一方、`/think low|medium|high` は対応するトップレベルの `think` effort 文字列を送信します。`/think max` は Ollama のネイティブの最大 effort である `think: "high"` に対応します。

    <Tip>
    OpenAI 互換エンドポイントを使用する必要がある場合は、上の「従来の OpenAI 互換モード」セクションを参照してください。そのモードでは、ストリーミングとツール呼び出しが同時に動作しない場合があります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="WSL2 クラッシュループ（繰り返し再起動）">
    NVIDIA/CUDA を使用する WSL2 では、公式の Ollama Linux インストーラーが `Restart=always` を持つ `ollama.service` systemd ユニットを作成します。そのサービスが自動起動し、WSL2 の起動中に GPU 対応モデルを読み込むと、モデルの読み込み中に Ollama がホストメモリを固定することがあります。Hyper-V のメモリ回収では、それらの固定ページを常に回収できるとは限らないため、Windows が WSL2 VM を終了し、systemd が再び Ollama を起動して、ループが繰り返されます。

    よくある証拠:

    - Windows 側からの WSL2 の繰り返し再起動または終了
    - WSL2 起動直後の `app.slice` または `ollama.service` での高い CPU 使用率
    - Linux OOM-killer イベントではなく systemd からの SIGTERM

    OpenClaw は、WSL2、`Restart=always` が有効な `ollama.service`、および可視の CUDA マーカーを検出すると、起動時警告をログに記録します。

    緩和策:

    ```bash
    sudo systemctl disable ollama
    ```

    これを Windows 側の `%USERPROFILE%\.wslconfig` に追加し、その後 `wsl --shutdown` を実行します。

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama サービス環境でより短い keep-alive を設定するか、必要なときだけ Ollama を手動で起動します。

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) を参照してください。

  </Accordion>

  <Accordion title="Ollama が検出されない">
    Ollama が実行中であり、`OLLAMA_API_KEY`（または認証プロファイル）を設定していて、明示的な `models.providers.ollama` エントリを定義して**いない**ことを確認してください。

    ```bash
    ollama serve
    ```

    API にアクセスできることを確認します。

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルが一覧にない場合は、そのモデルをローカルに pull するか、`models.providers.ollama` で明示的に定義してください。

    ```bash
    ollama list  # インストール済みのものを確認
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # または別のモデル
    ```

  </Accordion>

  <Accordion title="接続が拒否される">
    Ollama が正しいポートで実行されていることを確認してください。

    ```bash
    # Ollama が実行中か確認
    ps aux | grep ollama

    # または Ollama を再起動
    ollama serve
    ```

  </Accordion>

  <Accordion title="リモートホストは curl では動作するが OpenClaw では動作しない">
    Gateway を実行している同じマシンとランタイムから確認してください。

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    よくある原因:

    - `baseUrl` が `localhost` を指しているが、Gateway は Docker 内または別のホストで実行されている。
    - URL が `/v1` を使用しており、ネイティブ Ollama ではなく OpenAI 互換の動作が選択されている。
    - リモートホスト側で、Ollama 側のファイアウォールまたは LAN バインドの変更が必要。
    - モデルがノート PC のデーモンには存在するが、リモートデーモンには存在しない。

  </Accordion>

  <Accordion title="モデルがツール JSON をテキストとして出力する">
    これは通常、プロバイダーが OpenAI 互換モードを使用しているか、モデルがツールスキーマを扱えないことを意味します。

    ネイティブ Ollama モードを優先してください。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    小さなローカルモデルがツールスキーマでまだ失敗する場合は、そのモデルエントリで `compat.supportsTools: false` を設定して再テストしてください。

  </Accordion>

  <Accordion title="Kimi または GLM が文字化けした記号を返す">
    長い非言語的な記号列であるホスト型 Kimi/GLM レスポンスは、成功したアシスタント回答ではなく、失敗したプロバイダー出力として扱われます。これにより、破損したテキストをセッションに永続化せずに、通常の再試行、フォールバック、またはエラー処理へ移行できます。

    繰り返し発生する場合は、生のモデル名、現在のセッションファイル、実行が `Cloud + Local` と `Cloud only` のどちらを使用したかを記録し、その後、新しいセッションとフォールバックモデルを試してください。

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="コールドなローカルモデルがタイムアウトする">
    大規模なローカルモデルでは、ストリーミングが始まる前に最初の読み込みに長い時間が必要な場合があります。タイムアウトは Ollama プロバイダーに限定し、必要に応じてターン間でモデルを読み込んだままにするよう Ollama に依頼します。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    ホスト自体が接続の受け付けに時間がかかる場合、`timeoutSeconds` はこのプロバイダーに対して保護された Undici 接続タイムアウトも延長します。

  </Accordion>

  <Accordion title="大きなコンテキストのモデルが遅すぎる、またはメモリ不足になる">
    多くの Ollama モデルは、ハードウェアで快適に実行できる範囲を超えるコンテキストを advertised しています。ネイティブ Ollama は、`params.num_ctx` を設定しない限り、Ollama 独自のランタイムコンテキスト既定値を使用します。予測可能な初回トークンレイテンシが必要な場合は、OpenClaw のバジェットと Ollama のリクエストコンテキストの両方を上限設定してください。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw が送信するプロンプトが多すぎる場合は、まず `contextWindow` を下げてください。Ollama がマシンに対して大きすぎるランタイムコンテキストを読み込んでいる場合は、`params.num_ctx` を下げてください。生成が長すぎる場合は、`maxTokens` を下げてください。

  </Accordion>
</AccordionGroup>

<Note>
さらにヘルプが必要な場合: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選択と設定方法。
  </Card>
  <Card title="Ollama Web Search" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollama を利用した Web 検索の完全なセットアップと動作詳細。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
