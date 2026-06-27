---
read_when:
    - Ollama 経由でクラウドモデルまたはローカルモデルを使って OpenClaw を実行したい
    - Ollama のセットアップと設定のガイダンスが必要です
    - 画像理解に Ollama のビジョンモデルを使いたい
summary: Ollama で OpenClaw を実行する（クラウドモデルとローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-06-27T12:46:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw は、ホスト型クラウドモデルとローカル/セルフホストの Ollama サーバー向けに、Ollama のネイティブ API (`/api/chat`) と統合します。Ollama は 3 つのモードで使用できます。到達可能な Ollama ホスト経由の `Cloud + Local`、`https://ollama.com` に対する `Cloud only`、または到達可能な Ollama ホストに対する `Local only` です。

OpenClaw は、Ollama Cloud を直接使用するための第一級のホスト型プロバイダー ID として `ollama-cloud` も登録します。ローカルの `ollama` プロバイダー ID を共有せずにクラウド専用ルーティングを使いたい場合は、`ollama-cloud/kimi-k2.5:cloud` のような参照を使用します。

専用のクラウド専用セットアップページについては、[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。

<Warning>
**リモート Ollama ユーザー**: OpenClaw で `/v1` OpenAI 互換 URL (`http://host:11434/v1`) を使用しないでください。これによりツール呼び出しが壊れ、モデルが生のツール JSON をプレーンテキストとして出力する場合があります。代わりにネイティブ Ollama API URL を使用してください: `baseUrl: "http://host:11434"` (`/v1` なし)。
</Warning>

Ollama プロバイダー設定では、正規キーとして `baseUrl` を使用します。OpenClaw は OpenAI SDK スタイルの例との互換性のために `baseURL` も受け付けますが、新しい設定では `baseUrl` を優先してください。

## 認証ルール

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    ローカルおよび LAN の Ollama ホストには、実際の bearer token は不要です。OpenClaw は、local loopback、プライベートネットワーク、`.local`、およびベアホスト名の Ollama ベース URL にのみ、ローカルの `ollama-local` マーカーを使用します。
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    リモートの公開ホストと Ollama Cloud (`https://ollama.com`) には、`OLLAMA_API_KEY`、認証プロファイル、またはプロバイダーの `apiKey` を通じた実際の認証情報が必要です。直接ホスト型で使用する場合は、プロバイダー `ollama-cloud` を優先してください。
  </Accordion>
  <Accordion title="Custom provider ids">
    `api: "ollama"` を設定するカスタムプロバイダー ID は同じルールに従います。たとえば、プライベート LAN の Ollama ホストを指す `ollama-remote` プロバイダーは、`apiKey: "ollama-local"` を使用でき、サブエージェントはそれを認証情報の欠落として扱うのではなく、Ollama プロバイダーフックを通じてそのマーカーを解決します。メモリ検索でも、埋め込みが対応する Ollama エンドポイントを使用するように、`agents.defaults.memorySearch.provider` をそのカスタムプロバイダー ID に設定できます。
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` は、プロバイダー ID の認証情報を保存します。エンドポイント設定 (`baseUrl`、`api`、モデル ID、ヘッダー、タイムアウト) は `models.providers.<id>` に置いてください。`{ "ollama-windows": { "apiKey": "ollama-local" } }` のような古いフラットな認証プロファイルファイルは実行時形式ではありません。`openclaw doctor --fix` を実行して、バックアップ付きの正規 `ollama-windows:default` API キープロファイルに書き換えてください。そのファイル内の `baseUrl` は互換性のためのノイズであり、プロバイダー設定に移動する必要があります。
  </Accordion>
  <Accordion title="Memory embedding scope">
    Ollama をメモリ埋め込みに使用する場合、bearer 認証は宣言されたホストにスコープされます。

    - プロバイダーレベルのキーは、そのプロバイダーの Ollama ホストにのみ送信されます。
    - `agents.*.memorySearch.remote.apiKey` は、そのリモート埋め込みホストにのみ送信されます。
    - 純粋な `OLLAMA_API_KEY` 環境値は Ollama Cloud の慣例として扱われ、デフォルトではローカルまたはセルフホストのホストには送信されません。

  </Accordion>
</AccordionGroup>

## はじめに

好みのセットアップ方法とモードを選択します。

<Tabs>
  <Tab title="Onboarding (recommended)">
    **最適な用途:** 動作する Ollama クラウドまたはローカルセットアップへの最短経路。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        プロバイダー一覧から **Ollama** を選択します。
      </Step>
      <Step title="Choose your mode">
        - **クラウド + ローカル** — ローカル Ollama ホストに加え、そのホスト経由でルーティングされるクラウドモデル
        - **クラウドのみ** — `https://ollama.com` 経由のホスト型 Ollama モデル
        - **ローカルのみ** — ローカルモデルのみ

      </Step>
      <Step title="Select a model">
        `Cloud only` は `OLLAMA_API_KEY` の入力を求め、ホスト型クラウドのデフォルトを提案します。`Cloud + Local` と `Local only` は Ollama ベース URL の入力を求め、利用可能なモデルを検出し、選択したローカルモデルがまだ利用できない場合は自動的に pull します。Ollama が `gemma4:latest` のようなインストール済みの `:latest` タグを報告した場合、セットアップでは `gemma4` と `gemma4:latest` の両方を表示したり、ベアエイリアスを再度 pull したりせず、そのインストール済みモデルを 1 回だけ表示します。`Cloud + Local` は、その Ollama ホストがクラウドアクセスにサインイン済みかどうかも確認します。
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

    必要に応じて、カスタムベース URL またはモデルを指定します。

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **最適な用途:** クラウドまたはローカルセットアップを完全に制御する場合。

    <Steps>
      <Step title="Choose cloud or local">
        - **クラウド + ローカル**: Ollama をインストールし、`ollama signin` でサインインして、そのホスト経由でクラウドリクエストをルーティングします
        - **クラウドのみ**: `OLLAMA_API_KEY` とともに `https://ollama.com` を使用します
        - **ローカルのみ**: [ollama.com/download](https://ollama.com/download) から Ollama をインストールします

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
        `Cloud only` では、実際の `OLLAMA_API_KEY` を使用します。ホストをバックエンドにするセットアップでは、任意のプレースホルダー値を使用できます。

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
    `Cloud + Local` は、到達可能な Ollama ホストをローカルモデルとクラウドモデルの両方の制御点として使用します。これは Ollama が推奨するハイブリッドフローです。

    セットアップ中に **クラウド + ローカル** を使用します。OpenClaw は Ollama ベース URL の入力を求め、そのホストからローカルモデルを検出し、`ollama signin` でそのホストがクラウドアクセスにサインイン済みかどうかを確認します。ホストがサインイン済みの場合、OpenClaw は `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` などのホスト型クラウドのデフォルトも提案します。

    ホストがまだサインインしていない場合、`ollama signin` を実行するまで OpenClaw はセットアップをローカル専用のままにします。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` は、`https://ollama.com` にある Ollama のホスト型 API に対して実行されます。

    セットアップ中に **クラウドのみ** を使用します。OpenClaw は `OLLAMA_API_KEY` の入力を求め、`baseUrl: "https://ollama.com"` を設定し、ホスト型クラウドモデル一覧をシードします。このパスでは、ローカル Ollama サーバーや `ollama signin` は不要です。

    `openclaw onboard` 中に表示されるクラウドモデル一覧は、`https://ollama.com/api/tags` からライブで入力され、上限は 500 件です。そのため、ピッカーは静的シードではなく現在のホスト型カタログを反映します。セットアップ時に `ollama.com` に到達できない、またはモデルが返されない場合でも、OpenClaw は以前のハードコードされた提案にフォールバックするため、オンボーディングは完了します。

    第一級のクラウドプロバイダーを直接設定することもできます。

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    ローカル専用モードでは、OpenClaw は設定された Ollama インスタンスからモデルを検出します。このパスは、ローカルまたはセルフホストの Ollama サーバー向けです。

    OpenClaw は現在、ローカルのデフォルトとして `gemma4` を提案します。

  </Tab>
</Tabs>

## モデル検出 (暗黙のプロバイダー)

`OLLAMA_API_KEY` (または認証プロファイル) を設定し、かつ `models.providers.ollama` または `api: "ollama"` を持つ別のカスタムリモートプロバイダーを定義していない場合、OpenClaw は `http://127.0.0.1:11434` のローカル Ollama インスタンスからモデルを検出します。

| 動作                 | 詳細                                                                                                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログクエリ       | `/api/tags` をクエリします                                                                                                                                           |
| 機能検出             | ベストエフォートの `/api/show` ルックアップを使用して、`contextWindow`、展開された `num_ctx` Modelfile パラメーター、および vision/tools を含む機能を読み取ります     |
| ビジョンモデル       | `/api/show` によって `vision` 機能が報告されたモデルは画像対応 (`input: ["text", "image"]`) としてマークされるため、OpenClaw は画像をプロンプトに自動注入します       |
| 推論検出             | 利用可能な場合は `thinking` を含む `/api/show` の機能を使用します。Ollama が機能を省略した場合は、モデル名のヒューリスティック (`r1`、`reasoning`、`think`) にフォールバックします |
| トークン制限         | `maxTokens` を OpenClaw が使用するデフォルトの Ollama 最大トークン上限に設定します                                                                                    |
| コスト               | すべてのコストを `0` に設定します                                                                                                                                    |

これにより、カタログをローカル Ollama インスタンスと整合させながら、手動のモデルエントリを避けられます。ローカルの `infer model run` では、`ollama/<pulled-model>:latest` のような完全な参照を使用できます。OpenClaw は、手書きの `models.json` エントリを必要とせず、Ollama のライブカタログからそのインストール済みモデルを解決します。

サインイン済みの Ollama ホストでは、一部の `:cloud` モデルが `/api/tags` に表示される前に、`/api/chat` と `/api/show` 経由で使用できる場合があります。完全な `ollama/<model>:cloud` 参照を明示的に選択すると、OpenClaw は `/api/show` でその欠落している正確なモデルを検証し、Ollama がモデルメタデータを確認した場合にのみ実行時カタログに追加します。入力ミスは、自動作成されるのではなく、不明なモデルとして引き続き失敗します。

```bash
# See what models are available
ollama list
openclaw models list
```

完全なエージェントツールサーフェスを避ける狭いテキスト生成スモークテストには、完全な Ollama モデル参照を指定してローカルの `infer model run` を使用します。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

このパスは引き続き OpenClaw の設定済みプロバイダー、認証、およびネイティブ Ollama トランスポートを使用しますが、チャットエージェントのターンを開始せず、MCP/ツールコンテキストも読み込みません。これが成功し、通常のエージェント返信が失敗する場合は、次にモデルのエージェントプロンプト/ツール容量をトラブルシュートしてください。

同じ軽量パスで狭いビジョンモデルのスモークテストを行うには、`infer model run` に 1 つ以上の画像ファイルを追加します。これにより、チャットツール、メモリ、または以前のセッションコンテキストを読み込まずに、プロンプトと画像が選択した Ollama ビジョンモデルへ直接送信されます。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` は、一般的な PNG、JPEG、WebP 入力を含む、`image/*`
として検出されたファイルを受け付けます。画像以外のファイルは、Ollama が呼び出される前に拒否されます。
音声認識には、代わりに `openclaw infer audio transcribe` を使用します。

`/model ollama/<model>` で会話を切り替えると、OpenClaw は
それをユーザーによる厳密な選択として扱います。設定済みの Ollama `baseUrl` に
到達できない場合、次の返信は別の設定済みフォールバックモデルから暗黙に
回答するのではなく、プロバイダーエラーで失敗します。

分離された Cron ジョブは、エージェントターンを開始する前に、追加のローカル安全性チェックを 1 つ実行します。
選択されたモデルが、ローカル、プライベートネットワーク、または `.local`
の Ollama プロバイダーに解決され、`/api/tags` に到達できない場合、OpenClaw はその Cron 実行を
エラーテキスト内の選択済み `ollama/<model>` とともに `skipped` として記録します。エンドポイントの
事前チェックは 5 分間キャッシュされるため、同じ停止中の Ollama デーモンを指す複数の Cron ジョブが
すべて失敗するモデルリクエストを起動することはありません。

ローカル Ollama に対して、ローカルテキストパス、ネイティブストリームパス、埋め込みをライブ検証するには、次を実行します。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud API キーのスモークテストでは、ライブテストを `https://ollama.com`
に向け、現在のカタログからホスト型モデルを選択します。

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

クラウドスモークは、テキスト、ネイティブストリーム、Web 検索を実行します。`https://ollama.com` では、
Ollama Cloud API キーが `/api/embed` を認可しない場合があるため、既定では埋め込みを
スキップします。設定済みクラウドキーが埋め込みエンドポイントを使用できない場合に
ライブテストを明示的に失敗させたいときは、`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` を設定します。

新しいモデルを追加するには、Ollama で単に取得します。

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、使用可能になります。

<Note>
`models.providers.ollama` を明示的に設定するか、`api: "ollama"` を持つ `models.providers.ollama-cloud` のようなカスタムリモートプロバイダーを設定すると、自動検出はスキップされ、モデルを手動で定義する必要があります。`http://127.0.0.2:11434` のようなループバックカスタムプロバイダーは、引き続きローカルとして扱われます。下の明示的な設定セクションを参照してください。
</Note>

## ビジョンと画像説明

同梱の Ollama Plugin は、Ollama を画像対応のメディア理解プロバイダーとして登録します。これにより、OpenClaw は明示的な画像説明リクエストと、設定済みの画像モデル既定値を、ローカルまたはホスト型の Ollama ビジョンモデルにルーティングできます。

ローカルビジョンでは、画像をサポートするモデルを取得します。

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

`--model` は完全な `<provider/model>` 参照である必要があります。設定されている場合、`openclaw infer image describe` は、そのモデルがネイティブビジョンをサポートしていることを理由に説明をスキップするのではなく、そのモデルを直接実行します。

OpenClaw の画像理解プロバイダーフロー、設定済みの `agents.defaults.imageModel`、画像説明の出力形状を使いたい場合は、`infer image describe` を使用します。カスタムプロンプトと 1 つ以上の画像を使って、生のマルチモーダルモデルを調べたい場合は、`infer model run --file` を使用します。

受信メディアの既定の画像理解モデルを Ollama にするには、`agents.defaults.imageModel` を設定します。

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

完全な `ollama/<model>` 参照を推奨します。同じモデルが `models.providers.ollama.models` の下に `input: ["text", "image"]` 付きで列挙され、他の設定済み画像プロバイダーがその素のモデル ID を公開していない場合、OpenClaw は `qwen2.5vl:7b` のような素の `imageModel` 参照も `ollama/qwen2.5vl:7b` に正規化します。複数の設定済み画像プロバイダーが同じ素の ID を持つ場合は、プロバイダープレフィックスを明示的に使用します。

低速なローカルビジョンモデルでは、クラウドモデルより長い画像理解タイムアウトが必要になる場合があります。また、制約のあるハードウェアで Ollama が公称の完全なビジョンコンテキストを割り当てようとすると、クラッシュまたは停止することもあります。通常の画像説明ターンだけが必要な場合は、機能タイムアウトを設定し、モデルエントリで `num_ctx` を制限します。

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

このタイムアウトは、受信画像理解と、エージェントがターン中に呼び出せる明示的な `image` ツールに適用されます。プロバイダーレベルの `models.providers.ollama.timeoutSeconds` は、通常のモデル呼び出しに対する基盤の Ollama HTTP リクエストガードを引き続き制御します。

ローカル Ollama に対して明示的な画像ツールをライブ検証するには、次を実行します。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` を手動で定義する場合は、ビジョンモデルに画像入力サポートを付けます。

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw は、画像対応としてマークされていないモデルへの画像説明リクエストを拒否します。暗黙的な検出では、`/api/show` がビジョン機能を報告すると、OpenClaw はこれを Ollama から読み取ります。

## 設定

<Tabs>
  <Tab title="Basic (implicit discovery)">
    最もシンプルなローカル専用の有効化パスは、環境変数を使う方法です。

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されている場合、プロバイダーエントリの `apiKey` は省略でき、OpenClaw が可用性チェックのために補完します。
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    ホスト型クラウド設定を使いたい場合、Ollama が別のホストまたはポートで動作している場合、特定のコンテキストウィンドウやモデルリストを強制したい場合、または完全に手動のモデル定義を使いたい場合は、明示的な設定を使用します。

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
    Ollama が別のホストまたはポートで動作している場合（明示的な設定では自動検出が無効になるため、モデルを手動で定義します）:

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
    URL に `/v1` を追加しないでください。`/v1` パスは OpenAI 互換モードを使用し、ツール呼び出しの信頼性がありません。パスサフィックスなしのベース Ollama URL を使用してください。
    </Warning>

  </Tab>
</Tabs>

## 一般的なレシピ

これらを出発点として使用し、モデル ID を `ollama list` または `openclaw models list --provider ollama` の正確な名前に置き換えます。

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Ollama が Gateway と同じマシンで動作しており、OpenClaw にインストール済みモデルを自動検出させたい場合に使用します。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    このパスでは設定を最小限に保てます。モデルを手動で定義したい場合を除き、`models.providers.ollama` ブロックを追加しないでください。

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
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

    `contextWindow` は OpenClaw 側のコンテキスト予算です。`params.num_ctx` はリクエストのために Ollama に送信されます。ハードウェアがモデルの公称の完全なコンテキストを実行できない場合は、それらを揃えてください。

  </Accordion>

  <Accordion title="Ollama Cloud only">
    ローカルデーモンを実行せず、ホスト型 Ollama モデルを直接使いたい場合に使用します。

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

  <Accordion title="Cloud plus local through a signed-in daemon">
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

  <Accordion title="Multiple Ollama hosts">
    複数の Ollama サーバーがある場合は、カスタムプロバイダー ID を使用します。各プロバイダーは、それぞれ独自のホスト、モデル、認証、タイムアウト、モデル参照を持ちます。

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

    OpenClaw がリクエストを送信するとき、アクティブなプロバイダープレフィックスが取り除かれるため、`ollama-large/qwen3.5:27b` は `qwen3.5:27b` として Ollama に届きます。

  </Accordion>

  <Accordion title="軽量ローカルモデルプロファイル">
    一部のローカルモデルは単純なプロンプトには回答できますが、エージェントツール全体のサーフェスではうまく動作しないことがあります。グローバルなランタイム設定を変更する前に、まずツールとコンテキストを制限してください。

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
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

    `compat.supportsTools: false` は、モデルまたはサーバーがツールスキーマで確実に失敗する場合にのみ使用してください。これは安定性と引き換えにエージェント機能を制限します。
    `localModelLean` は、ブラウザー、cron、メッセージツールを直接のエージェントサーフェスから削除し、実行で直接メッセージ配信セマンティクスを維持する必要がある場合を除き、より大きなカタログを構造化されたツール検索コントロールの背後に置くようにします。ただし、Ollama のランタイムコンテキストや思考モードは変更しません。ループしたり、応答予算を隠れた推論に費やしたりする小規模な Qwen 風の思考モデルでは、明示的な `params.num_ctx` と `params.thinking: false` を組み合わせてください。

  </Accordion>
</AccordionGroup>

### モデル選択

設定が完了すると、すべての Ollama モデルを利用できます。

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

カスタム Ollama プロバイダー ID もサポートされています。モデル参照が
`ollama-spark/qwen3:32b` のようにアクティブなプロバイダープレフィックスを使用する場合、OpenClaw は Ollama を呼び出す前にその
プレフィックスだけを取り除くため、サーバーは `qwen3:32b` を受け取ります。

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

`timeoutSeconds` は、接続のセットアップ、ヘッダー、本文ストリーミング、保護されたフェッチ全体の中止を含むモデル HTTP リクエストに適用されます。
`params.keep_alive` は、ネイティブ `/api/chat` リクエストでトップレベルの `keep_alive` として Ollama に転送されます。初回ターンのロード時間がボトルネックの場合は、モデルごとに設定してください。

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

リモートホストでは、`127.0.0.1` を `baseUrl` で使用しているホストに置き換えてください。`curl` は動作するのに OpenClaw が動作しない場合は、Gateway が別のマシン、コンテナ、またはサービスアカウントで実行されていないか確認してください。

## Ollama Web Search

OpenClaw は、バンドルされた `web_search` プロバイダーとして **Ollama Web Search** をサポートしています。

| プロパティ | 詳細                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ホスト        | 設定済みの Ollama ホストを使用します（`models.providers.ollama.baseUrl` が設定されている場合はそれを使用し、それ以外は `http://127.0.0.1:11434`）。`https://ollama.com` はホスト型 API を直接使用します |
| 認証        | サインイン済みのローカル Ollama ホストではキー不要です。直接の `https://ollama.com` 検索または認証で保護されたホストでは、`OLLAMA_API_KEY` または設定済みプロバイダー認証を使用します               |
| 要件 | ローカル/セルフホスト型ホストは実行中で、`ollama signin` でサインイン済みである必要があります。直接のホスト型検索には、`baseUrl: "https://ollama.com"` と実際の Ollama API キーが必要です |

`openclaw onboard` または `openclaw configure --section web` 中に **Ollama Web Search** を選択するか、次を設定してください。

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

Ollama Cloud 経由の直接ホスト型検索では、次を使用します。

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

サインイン済みのローカルデーモンでは、OpenClaw はそのデーモンの `/api/experimental/web_search` プロキシを使用します。`https://ollama.com` では、ホスト型の `/api/web_search` エンドポイントを直接呼び出します。

<Note>
完全なセットアップと動作の詳細については、[Ollama Web Search](/ja-JP/tools/ollama-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="従来の OpenAI 互換モード">
    <Warning>
    **OpenAI 互換モードではツール呼び出しは信頼できません。** プロキシのために OpenAI 形式が必要で、ネイティブのツール呼び出し動作に依存しない場合にのみ、このモードを使用してください。
    </Warning>

    代わりに OpenAI 互換エンドポイントを使用する必要がある場合（たとえば、OpenAI 形式のみをサポートするプロキシの背後にある場合）は、`api: "openai-completions"` を明示的に設定してください。

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

    このモードは、ストリーミングとツール呼び出しを同時にサポートしない場合があります。モデル設定で `params: { streaming: false }` を指定してストリーミングを無効にする必要があるかもしれません。

    Ollama で `api: "openai-completions"` を使用する場合、OpenClaw はデフォルトで `options.num_ctx` を注入し、Ollama が暗黙的に 4096 コンテキストウィンドウへフォールバックしないようにします。プロキシまたはアップストリームが未知の `options` フィールドを拒否する場合は、この動作を無効にしてください。

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
    自動検出されたモデルについて、Ollama がコンテキストウィンドウを報告している場合、OpenClaw はカスタム Modelfile の大きな `PARAMETER num_ctx` 値を含め、その値を使用します。それ以外の場合は、OpenClaw が使用するデフォルトの Ollama コンテキストウィンドウにフォールバックします。

    その Ollama プロバイダー配下のすべてのモデルに対して、プロバイダーレベルの `contextWindow`、`contextTokens`、`maxTokens` のデフォルトを設定し、必要に応じてモデルごとに上書きできます。`contextWindow` は OpenClaw のプロンプトと Compaction の予算です。ネイティブ Ollama リクエストでは、`params.num_ctx` を明示的に設定しない限り `options.num_ctx` は未設定のままになるため、Ollama は独自のモデル、`OLLAMA_CONTEXT_LENGTH`、または VRAM ベースのデフォルトを適用できます。Modelfile を再構築せずに Ollama のリクエストごとのランタイムコンテキストを制限または強制するには、`params.num_ctx` を設定してください。無効、ゼロ、負、有限でない値は無視されます。ネイティブ Ollama リクエストコンテキストを強制するために `contextWindow` または `maxTokens` だけを使用していた古い設定をアップグレードした場合は、`openclaw doctor --fix` を実行して、明示的なプロバイダーまたはモデルの予算を `params.num_ctx` にコピーしてください。OpenAI 互換の Ollama アダプターは、設定された `params.num_ctx` または `contextWindow` から、引き続きデフォルトで `options.num_ctx` を注入します。アップストリームが `options` を拒否する場合は、`injectNumCtxForOpenAICompat: false` で無効にしてください。

    ネイティブ Ollama モデルエントリは、`temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread`、`use_mmap` など、一般的な Ollama ランタイムオプションを `params` 配下でも受け付けます。OpenClaw は Ollama リクエストキーのみを転送するため、`streaming` などの OpenClaw ランタイムパラメーターが Ollama に漏れることはありません。トップレベルの Ollama `think` を送信するには、`params.think` または `params.thinking` を使用してください。`false` は Qwen 風の思考モデルで API レベルの思考を無効にします。

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
    ネイティブ Ollama モデルでは、OpenClaw は Ollama が期待する形式で思考制御を転送します。つまり、`options.think` ではなくトップレベルの `think` です。`/api/show` レスポンスに `thinking` 機能が含まれる自動検出モデルは、`/think low`、`/think medium`、`/think high`、`/think max` を公開します。思考非対応モデルは `/think off` のみを公開します。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    モデルデフォルトを設定することもできます。

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

    モデルごとの `params.think` または `params.thinking` は、特定の設定済みモデルについて Ollama API の思考を無効化または強制できます。アクティブな実行に暗黙のデフォルト `off` だけがある場合、OpenClaw はそれらの明示的なモデルパラメーターを保持します。`/think medium` などの off 以外のランタイムコマンドは、引き続きアクティブな実行を上書きします。

  </Accordion>

  <Accordion title="推論モデル">
    OpenClaw は、`deepseek-r1`、`reasoning`、`think` などの名前を持つモデルをデフォルトで推論対応として扱います。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    追加の設定は不要です。OpenClaw が自動的にマークします。

  </Accordion>

  <Accordion title="モデルコスト">
    Ollama は無料でローカルに実行されるため、すべてのモデルコストは $0 に設定されます。これは、自動検出されたモデルと手動で定義したモデルの両方に適用されます。
  </Accordion>

  <Accordion title="メモリエンベディング">
    バンドルされた Ollama Plugin は
    [メモリ検索](/ja-JP/concepts/memory) 用のメモリエンベディングプロバイダーを登録します。設定された Ollama ベース URL
    と API キーを使用し、Ollama の現在の `/api/embed` エンドポイントを呼び出し、可能な場合は
    複数のメモリチャンクを 1 つの `input` リクエストにバッチ化します。

    `proxy.enabled=true` の場合、設定された `baseUrl` から派生した正確な
    ホスト local loopback オリジンへの Ollama メモリエンベディングリクエストは、
    管理対象の転送プロキシではなく OpenClaw のガード付き直接パスを使用します。
    設定されたホスト名自体が `localhost` またはループバック IP リテラルである必要があります。
    単にループバックに解決される DNS 名は、引き続き管理対象プロキシパスを使用します。
    LAN、tailnet、プライベートネットワーク、公開 Ollama ホストも管理対象プロキシパスのままです。
    別のホストまたはポートへのリダイレクトは信頼を継承しません。
    オペレーターは引き続き、グローバルな `proxy.loopbackMode: "proxy"` 設定で
    ループバックトラフィックをプロキシ経由で送信したり、`proxy.loopbackMode: "block"`
    で接続を開く前にループバック接続を拒否したりできます。この設定のプロセス全体への効果については
    [管理対象プロキシ](/ja-JP/security/network-proxy#gateway-loopback-mode) を参照してください。

    | プロパティ      | 値               |
    | ------------- | ------------------- |
    | デフォルトモデル | `nomic-embed-text`  |
    | 自動プル     | はい — エンベディングモデルがローカルに存在しない場合は自動的にプルされます |

    クエリ時のエンベディングは、`nomic-embed-text`、`qwen3-embedding`、`mxbai-embed-large` など、必要または推奨されるモデルに検索プレフィックスを使用します。既存のインデックスで形式移行が不要になるように、メモリドキュメントバッチは生のまま維持されます。

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

    リモートエンベディングホストでは、認証をそのホストにスコープしてください:

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
    OpenClaw の Ollama 統合はデフォルトで **ネイティブ Ollama API** (`/api/chat`) を使用し、ストリーミングとツール呼び出しの同時利用を完全にサポートします。特別な設定は不要です。

    ネイティブ `/api/chat` リクエストでは、OpenClaw は思考制御も Ollama に直接転送します。明示的なモデル `params.think`/`params.thinking` 値が設定されていない限り、`/think off` と `openclaw agent --thinking off` はトップレベルの `think: false` を送信し、`/think low|medium|high` は一致するトップレベルの `think` effort 文字列を送信します。`/think max` は Ollama の最高ネイティブ effort である `think: "high"` にマップされます。

    <Tip>
    OpenAI 互換エンドポイントを使用する必要がある場合は、上の「レガシー OpenAI 互換モード」セクションを参照してください。そのモードでは、ストリーミングとツール呼び出しが同時に動作しない場合があります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="WSL2 クラッシュループ（繰り返し再起動）">
    NVIDIA/CUDA を使用する WSL2 では、公式 Ollama Linux インストーラーが `Restart=always` の `ollama.service` systemd ユニットを作成します。そのサービスが自動起動し、WSL2 起動中に GPU バックエンドのモデルを読み込むと、モデルの読み込み中に Ollama がホストメモリを固定することがあります。Hyper-V のメモリ回収では、これらの固定ページを常に回収できるとは限らないため、Windows が WSL2 VM を終了し、systemd が Ollama を再び起動して、ループが繰り返されることがあります。

    一般的な証拠:

    - Windows 側から WSL2 が繰り返し再起動または終了される
    - WSL2 起動直後に `app.slice` または `ollama.service` の CPU 使用率が高い
    - Linux OOM-killer イベントではなく systemd からの SIGTERM

    OpenClaw は、WSL2、`Restart=always` で有効化された `ollama.service`、および可視の CUDA マーカーを検出すると、起動時警告をログに記録します。

    緩和策:

    ```bash
    sudo systemctl disable ollama
    ```

    これを Windows 側の `%USERPROFILE%\.wslconfig` に追加し、その後 `wsl --shutdown` を実行します:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama サービス環境でより短い keep-alive を設定するか、必要なときだけ Ollama を手動で起動します:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) を参照してください。

  </Accordion>

  <Accordion title="Ollama が検出されない">
    Ollama が実行中であり、`OLLAMA_API_KEY`（または認証プロファイル）を設定済みで、明示的な `models.providers.ollama` エントリを定義して**いない**ことを確認してください:

    ```bash
    ollama serve
    ```

    API にアクセスできることを確認します:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルが一覧にない場合は、モデルをローカルにプルするか、`models.providers.ollama` で明示的に定義してください。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="接続が拒否される">
    Ollama が正しいポートで実行されていることを確認してください:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="リモートホストは curl では動作するが OpenClaw では動作しない">
    Gateway を実行している同じマシンおよびランタイムから確認します:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    一般的な原因:

    - `baseUrl` が `localhost` を指しているが、Gateway が Docker 内または別のホスト上で実行されている。
    - URL が `/v1` を使用しており、ネイティブ Ollama ではなく OpenAI 互換の動作を選択している。
    - リモートホストで Ollama 側のファイアウォールまたは LAN バインドの変更が必要。
    - モデルがノート PC のデーモンには存在するが、リモートデーモンには存在しない。

  </Accordion>

  <Accordion title="モデルがツール JSON をテキストとして出力する">
    これは通常、プロバイダーが OpenAI 互換モードを使用しているか、モデルがツールスキーマを処理できないことを意味します。

    ネイティブ Ollama モードを優先してください:

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
    長く非言語的な記号の連続であるホスト型 Kimi/GLM 応答は、成功したアシスタント回答ではなく、失敗したプロバイダー出力として扱われます。これにより、破損したテキストをセッションに永続化せずに、通常の再試行、フォールバック、またはエラー処理に引き継げます。

    繰り返し発生する場合は、生のモデル名、現在のセッションファイル、実行が `Cloud + Local` か `Cloud only` のどちらを使用したかを取得し、その後新しいセッションとフォールバックモデルを試してください:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="コールドローカルモデルがタイムアウトする">
    大きなローカルモデルでは、ストリーミングが始まる前に初回読み込みに長い時間が必要な場合があります。タイムアウトは Ollama プロバイダーにスコープしたままにし、必要に応じて Ollama にターン間でモデルを読み込んだままにするよう依頼します:

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

    ホスト自体が接続の受け入れに時間がかかる場合、`timeoutSeconds` はこのプロバイダーのガード付き Undici 接続タイムアウトも延長します。

  </Accordion>

  <Accordion title="大きなコンテキストのモデルが遅すぎる、またはメモリ不足になる">
    多くの Ollama モデルは、ハードウェアで快適に実行できるサイズを超えるコンテキストを公表しています。ネイティブ Ollama は、`params.num_ctx` を設定しない限り、Ollama 独自のランタイムコンテキストデフォルトを使用します。予測可能な初回トークンレイテンシが必要な場合は、OpenClaw のバジェットと Ollama のリクエストコンテキストの両方に上限を設定してください:

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
    Ollama を利用した Web 検索の完全なセットアップと動作の詳細。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
