---
read_when:
    - Ollama 経由でクラウドモデルまたはローカルモデルを使って OpenClaw を実行したい
    - Ollama のセットアップと設定ガイダンスが必要です
    - 画像理解に Ollama のビジョンモデルを使いたい
summary: Ollama で OpenClaw を実行する（クラウドモデルとローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-07-01T05:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e047ee6c0531d1d0231d5ccad00f9af0889039d527cd1247c9b802bc406eadf
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw は、ホストされたクラウドモデルとローカル/セルフホストの Ollama サーバー向けに、Ollama のネイティブ API (`/api/chat`) と統合します。Ollama は 3 つのモードで使用できます。到達可能な Ollama ホスト経由の `Cloud + Local`、`https://ollama.com` に対する `Cloud only`、または到達可能な Ollama ホストに対する `Local only` です。

OpenClaw は、Ollama Cloud を直接使用するための第一級のホスト型プロバイダー id として `ollama-cloud` も登録します。ローカルの `ollama` プロバイダー id を共有せずにクラウド専用ルーティングを使いたい場合は、`ollama-cloud/kimi-k2.5:cloud` のような参照を使用します。

専用のクラウド専用セットアップページについては、[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。

<Warning>
**リモート Ollama ユーザー**: OpenClaw で `/v1` の OpenAI 互換 URL (`http://host:11434/v1`) を使用しないでください。これによりツール呼び出しが壊れ、モデルが生のツール JSON をプレーンテキストとして出力する場合があります。代わりにネイティブ Ollama API URL を使用してください: `baseUrl: "http://host:11434"` (`/v1` なし)。
</Warning>

Ollama プロバイダー設定では、正規キーとして `baseUrl` を使用します。OpenClaw は OpenAI SDK 形式の例との互換性のために `baseURL` も受け付けますが、新しい設定では `baseUrl` を優先してください。

## 認証ルール

<AccordionGroup>
  <Accordion title="ローカルおよび LAN ホスト">
    ローカルおよび LAN の Ollama ホストには、実際の bearer token は不要です。OpenClaw は、ループバック、プライベートネットワーク、`.local`、およびベアホスト名の Ollama ベース URL に対してのみ、ローカルの `ollama-local` マーカーを使用します。
  </Accordion>
  <Accordion title="リモートおよび Ollama Cloud ホスト">
    リモートのパブリックホストと Ollama Cloud (`https://ollama.com`) では、`OLLAMA_API_KEY`、認証プロファイル、またはプロバイダーの `apiKey` を通じた実際の認証情報が必要です。直接ホスト型で使用する場合は、プロバイダー `ollama-cloud` を優先してください。
  </Accordion>
  <Accordion title="カスタムプロバイダー id">
    `api: "ollama"` を設定するカスタムプロバイダー id は同じルールに従います。たとえば、プライベート LAN の Ollama ホストを指す `ollama-remote` プロバイダーは `apiKey: "ollama-local"` を使用でき、サブエージェントはそれを欠落した認証情報として扱うのではなく、Ollama プロバイダーフックを通じてそのマーカーを解決します。メモリ検索では `agents.defaults.memorySearch.provider` をそのカスタムプロバイダー id に設定することもでき、埋め込みが一致する Ollama エンドポイントを使用します。
  </Accordion>
  <Accordion title="認証プロファイル">
    `auth-profiles.json` はプロバイダー id の認証情報を保存します。エンドポイント設定 (`baseUrl`、`api`、モデル id、ヘッダー、タイムアウト) は `models.providers.<id>` に配置します。`{ "ollama-windows": { "apiKey": "ollama-local" } }` のような古いフラットな auth-profile ファイルはランタイム形式ではありません。`openclaw doctor --fix` を実行して、バックアップ付きの正規の `ollama-windows:default` API キープロファイルに書き換えてください。そのファイル内の `baseUrl` は互換性由来のノイズであり、プロバイダー設定へ移動する必要があります。
  </Accordion>
  <Accordion title="メモリ埋め込みのスコープ">
    Ollama がメモリ埋め込みに使用される場合、bearer 認証は宣言されたホストにスコープされます。

    - プロバイダーレベルのキーは、そのプロバイダーの Ollama ホストにのみ送信されます。
    - `agents.*.memorySearch.remote.apiKey` は、そのリモート埋め込みホストにのみ送信されます。
    - 純粋な `OLLAMA_API_KEY` env 値は Ollama Cloud の慣例として扱われ、デフォルトではローカルまたはセルフホストのホストには送信されません。

  </Accordion>
</AccordionGroup>

## はじめに

希望するセットアップ方法とモードを選択します。

<Tabs>
  <Tab title="オンボーディング (推奨)">
    **最適な用途:** 動作する Ollama クラウドまたはローカルセットアップへの最短経路。

    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard
        ```

        プロバイダー一覧から **Ollama** を選択します。
      </Step>
      <Step title="モードを選択">
        - **Cloud + Local** — ローカル Ollama ホストと、そのホスト経由でルーティングされるクラウドモデル
        - **Cloud only** — `https://ollama.com` 経由のホスト型 Ollama モデル
        - **Local only** — ローカルモデルのみ

      </Step>
      <Step title="モデルを選択">
        `Cloud only` は `OLLAMA_API_KEY` の入力を求め、ホスト型クラウドのデフォルトを提案します。`Cloud + Local` と `Local only` は Ollama ベース URL を求め、利用可能なモデルを検出し、選択したローカルモデルがまだ利用できない場合は自動で pull します。Ollama が `gemma4:latest` のようなインストール済み `:latest` タグを報告した場合、セットアップは `gemma4` と `gemma4:latest` の両方を表示したり、ベアエイリアスを再度 pull したりせず、そのインストール済みモデルを 1 回だけ表示します。`Cloud + Local` は、その Ollama ホストがクラウドアクセスにサインイン済みかどうかも確認します。
      </Step>
      <Step title="モデルが利用可能であることを確認">
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

  <Tab title="手動セットアップ">
    **最適な用途:** クラウドまたはローカルセットアップを完全に制御したい場合。

    <Steps>
      <Step title="クラウドまたはローカルを選択">
        - **Cloud + Local**: Ollama をインストールし、`ollama signin` でサインインして、そのホスト経由でクラウドリクエストをルーティングします
        - **Cloud only**: `OLLAMA_API_KEY` とともに `https://ollama.com` を使用します
        - **Local only**: [ollama.com/download](https://ollama.com/download) から Ollama をインストールします

      </Step>
      <Step title="ローカルモデルを pull (ローカルのみ)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="OpenClaw で Ollama を有効化">
        `Cloud only` では、実際の `OLLAMA_API_KEY` を使用します。ホストをバックエンドとするセットアップでは、任意のプレースホルダー値を使用できます。

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="モデルを確認して設定">
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
    `Cloud + Local` は、到達可能な Ollama ホストを、ローカルモデルとクラウドモデルの両方の制御点として使用します。これは Ollama が推奨するハイブリッドフローです。

    セットアップ中に **Cloud + Local** を使用します。OpenClaw は Ollama ベース URL の入力を求め、そのホストからローカルモデルを検出し、`ollama signin` によるクラウドアクセスにホストがサインイン済みかどうかを確認します。ホストがサインイン済みの場合、OpenClaw は `kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud` などのホスト型クラウドのデフォルトも提案します。

    ホストがまだサインインしていない場合、`ollama signin` を実行するまで OpenClaw はセットアップをローカル専用のままにします。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` は `https://ollama.com` の Ollama ホスト型 API に対して実行されます。

    セットアップ中に **Cloud only** を使用します。OpenClaw は `OLLAMA_API_KEY` の入力を求め、`baseUrl: "https://ollama.com"` を設定し、ホスト型クラウドモデル一覧をシードします。この経路では、ローカル Ollama サーバーや `ollama signin` は不要です。

    `openclaw onboard` 中に表示されるクラウドモデル一覧は `https://ollama.com/api/tags` からライブで入力され、500 件に制限されるため、ピッカーは静的なシードではなく現在のホスト型カタログを反映します。セットアップ時に `ollama.com` に到達できない、またはモデルが返されない場合、OpenClaw は以前のハードコードされた候補にフォールバックするため、オンボーディングは完了できます。

    第一級のクラウドプロバイダーを直接設定することもできます。

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    ローカル専用モードでは、OpenClaw は設定された Ollama インスタンスからモデルを検出します。この経路はローカルまたはセルフホストの Ollama サーバー向けです。

    OpenClaw は現在、ローカルのデフォルトとして `gemma4` を提案します。

  </Tab>
</Tabs>

## モデル検出 (暗黙のプロバイダー)

`OLLAMA_API_KEY` (または認証プロファイル) を設定し、**かつ** `models.providers.ollama` または `api: "ollama"` を持つ別のカスタムリモートプロバイダーを定義していない場合、OpenClaw は `http://127.0.0.1:11434` のローカル Ollama インスタンスからモデルを検出します。

| 動作                 | 詳細                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログクエリ       | `/api/tags` をクエリします                                                                                                                                          |
| 機能検出             | ベストエフォートの `/api/show` ルックアップを使用して、`contextWindow`、展開された `num_ctx` Modelfile パラメーター、および vision/tools を含む機能を読み取ります |
| ビジョンモデル       | `/api/show` によって `vision` 機能が報告されたモデルは画像対応 (`input: ["text", "image"]`) としてマークされるため、OpenClaw はプロンプトに画像を自動挿入します  |
| Reasoning 検出       | 利用可能な場合は `thinking` を含む `/api/show` 機能を使用します。Ollama が機能を省略する場合はモデル名ヒューリスティック (`r1`、`reasoning`、`think`) にフォールバックします |
| トークン制限         | `maxTokens` を OpenClaw が使用するデフォルトの Ollama 最大トークン上限に設定します                                                                                  |
| コスト               | すべてのコストを `0` に設定します                                                                                                                                   |

これにより、カタログをローカル Ollama インスタンスと一致させたまま、手動のモデルエントリを避けられます。ローカルの `infer model run` では、`ollama/<pulled-model>:latest` のような完全な参照を使用できます。OpenClaw は手書きの `models.json` エントリを必要とせず、Ollama のライブカタログからそのインストール済みモデルを解決します。

サインイン済みの Ollama ホストでは、一部の `:cloud` モデルが `/api/tags` に表示される前に `/api/chat` と `/api/show` 経由で使用できる場合があります。完全な `ollama/<model>:cloud` 参照を明示的に選択すると、OpenClaw はその正確な欠落モデルを `/api/show` で検証し、Ollama がモデルメタデータを確認した場合にのみランタイムカタログへ追加します。タイプミスは自動作成されるのではなく、不明なモデルとして失敗します。

```bash
# See what models are available
ollama list
openclaw models list
```

完全なエージェントツールサーフェスを避ける狭いテキスト生成のスモークテストには、完全な Ollama モデル参照を指定してローカルの `infer model run` を使用します。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

この経路でも OpenClaw の設定済みプロバイダー、認証、およびネイティブ Ollama トランスポートを使用しますが、チャットエージェントターンを開始したり、MCP/ツールコンテキストをロードしたりしません。通常のエージェント応答が失敗する一方でこれが成功する場合は、次にモデルのエージェントプロンプト/ツール容量をトラブルシュートしてください。

同じ軽量な経路で狭いビジョンモデルのスモークテストを行うには、1 つ以上の画像ファイルを `infer model run` に追加します。これにより、チャットツール、メモリ、または以前のセッションコンテキストをロードせずに、選択した Ollama ビジョンモデルへプロンプトと画像を直接送信します。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` は、一般的な PNG、JPEG、WebP 入力を含む、`image/*` として検出されたファイルを受け付けます。画像以外のファイルは、Ollama が呼び出される前に拒否されます。音声認識には、代わりに `openclaw infer audio transcribe` を使用してください。

`/model ollama/<model>` で会話を切り替えると、OpenClaw はそれをユーザーによる厳密な選択として扱います。設定済みの Ollama `baseUrl` に到達できない場合、次の返信は、別の設定済みフォールバックモデルから黙って回答するのではなく、プロバイダーエラーで失敗します。

分離された cron ジョブは、エージェントターンを開始する前に、追加のローカル安全性チェックを 1 つ実行します。選択されたモデルが、ローカル、プライベートネットワーク、または `.local` の Ollama プロバイダーに解決され、`/api/tags` に到達できない場合、OpenClaw はその cron 実行を `skipped` として記録し、エラーテキストに選択された `ollama/<model>` を含めます。エンドポイントの事前チェックは 5 分間キャッシュされるため、停止中の同じ Ollama デーモンを指す複数の cron ジョブが、すべて失敗するモデルリクエストを起動することはありません。

ローカル Ollama に対して、ローカルテキストパス、ネイティブストリームパス、埋め込みをライブ検証します。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud API キーのスモークテストでは、ライブテストを `https://ollama.com` に向け、現在のカタログからホスト型モデルを選択します。

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

クラウドスモークは、テキスト、ネイティブストリーム、Web 検索を実行します。Ollama Cloud API キーが `/api/embed` を認可しない場合があるため、`https://ollama.com` ではデフォルトで埋め込みをスキップします。設定済みのクラウドキーで埋め込みエンドポイントを使用できない場合にライブテストを失敗させたいと明示的に望む場合は、`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` を設定してください。

新しいモデルを追加するには、Ollama で単に pull します。

```bash
ollama pull mistral
```

新しいモデルは自動的に検出され、使用可能になります。

<Note>
`models.providers.ollama` を明示的に設定した場合、または `api: "ollama"` を持つ `models.providers.ollama-cloud` などのカスタムリモートプロバイダーを設定した場合、自動検出はスキップされ、モデルを手動で定義する必要があります。`http://127.0.0.2:11434` などのループバックカスタムプロバイダーは、引き続きローカルとして扱われます。下の明示的な設定セクションを参照してください。
</Note>

## ビジョンと画像説明

同梱の Ollama Plugin は、Ollama を画像対応のメディア理解プロバイダーとして登録します。これにより、OpenClaw は明示的な画像説明リクエストと、設定済みの画像モデルデフォルトを、ローカルまたはホスト型の Ollama ビジョンモデルにルーティングできます。

ローカルビジョンでは、画像をサポートするモデルを pull します。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

次に、infer CLI で検証します。

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` は完全な `<provider/model>` 参照でなければなりません。設定されている場合、`openclaw infer image describe` は、モデルがネイティブビジョンをサポートしているため説明をスキップするのではなく、そのモデルを最初に試します。モデル呼び出しが失敗した場合、OpenClaw は設定済みの `agents.defaults.imageModel.fallbacks` を通じて続行できます。ファイルまたは URL の準備エラーは、フォールバック試行の前に引き続き失敗します。

OpenClaw の画像理解プロバイダーフロー、設定済みの `agents.defaults.imageModel`、画像説明の出力形状を使いたい場合は、`infer image describe` を使用します。カスタムプロンプトと 1 つ以上の画像で生のマルチモーダルモデル調査を行いたい場合は、`infer model run --file` を使用します。

受信メディア用のデフォルト画像理解モデルとして Ollama を使用するには、`agents.defaults.imageModel` を設定します。

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

完全な `ollama/<model>` 参照を推奨します。同じモデルが `models.providers.ollama.models` の下に `input: ["text", "image"]` 付きで一覧され、他の設定済み画像プロバイダーがその裸のモデル ID を公開していない場合、OpenClaw は `qwen2.5vl:7b` のような裸の `imageModel` 参照も `ollama/qwen2.5vl:7b` に正規化します。複数の設定済み画像プロバイダーが同じ裸の ID を持つ場合は、プロバイダープレフィックスを明示的に使用してください。

遅いローカルビジョンモデルでは、クラウドモデルより長い画像理解タイムアウトが必要になることがあります。また、制約のあるハードウェアで Ollama が公称の全ビジョンコンテキストを割り当てようとすると、クラッシュまたは停止することがあります。通常の画像説明ターンだけが必要な場合は、ケイパビリティタイムアウトを設定し、モデルエントリで `num_ctx` に上限を設定します。

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

ローカル Ollama に対して、明示的な画像ツールをライブ検証します。

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` を手動で定義する場合は、ビジョンモデルに画像入力サポートをマークします。

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw は、画像対応としてマークされていないモデルへの画像説明リクエストを拒否します。暗黙的な検出では、`/api/show` がビジョンケイパビリティを報告すると、OpenClaw はこれを Ollama から読み取ります。

## 設定

<Tabs>
  <Tab title="基本（暗黙的な検出）">
    最も単純なローカル専用の有効化パスは、環境変数を使う方法です。

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されている場合、プロバイダーエントリの `apiKey` は省略でき、OpenClaw が可用性チェック用に補完します。
    </Tip>

  </Tab>

  <Tab title="明示的（手動モデル）">
    ホスト型クラウド設定を使いたい場合、Ollama が別のホストまたはポートで実行されている場合、特定のコンテキストウィンドウやモデル一覧を強制したい場合、または完全に手動のモデル定義が必要な場合は、明示的な設定を使用します。

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

  <Tab title="カスタムベース URL">
    Ollama が別のホストまたはポートで実行されている場合（明示的な設定は自動検出を無効にするため、モデルを手動で定義してください）。

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
    URL に `/v1` を追加しないでください。`/v1` パスは OpenAI 互換モードを使用し、このモードではツール呼び出しの信頼性が高くありません。パスサフィックスのないベース Ollama URL を使用してください。
    </Warning>

  </Tab>
</Tabs>

## 一般的なレシピ

これらを出発点として使用し、モデル ID を `ollama list` または `openclaw models list --provider ollama` から得られる正確な名前に置き換えてください。

<AccordionGroup>
  <Accordion title="自動検出を使うローカルモデル">
    Ollama が Gateway と同じマシンで実行されており、OpenClaw にインストール済みモデルを自動検出させたい場合に使用します。

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
    LAN ホストにはネイティブ Ollama URL を使用します。`/v1` を追加しないでください。

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

    `contextWindow` は OpenClaw 側のコンテキスト予算です。`params.num_ctx` はリクエストで Ollama に送信されます。ハードウェアでモデルの公称の全コンテキストを実行できない場合は、両者を揃えてください。

  </Accordion>

  <Accordion title="Ollama Cloud のみ">
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

  <Accordion title="サインイン済みデーモン経由のクラウドとローカル">
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

    OpenClaw がリクエストを送信するとき、アクティブなプロバイダープレフィックスは取り除かれるため、`ollama-large/qwen3.5:27b` は `qwen3.5:27b` として Ollama に届きます。

  </Accordion>

  <Accordion title="軽量なローカルモデルプロファイル">
    一部のローカルモデルは単純なプロンプトには回答できますが、エージェントツールサーフェス全体ではうまく動作しないことがあります。グローバルなランタイム設定を変更する前に、ツールとコンテキストを制限することから始めてください。

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

    `compat.supportsTools: false` は、モデルまたはサーバーがツールスキーマで安定して失敗する場合にのみ使用します。これは安定性と引き換えにエージェント機能を制限します。
    `localModelLean` は、直接のエージェントサーフェスからブラウザー、cron、メッセージツールを削除し、実行で直接メッセージ配信のセマンティクスを維持する必要がある場合を除き、より大きなカタログを構造化された Tool Search コントロールの背後に置きます。ただし、Ollama のランタイムコンテキストや思考モードは変更しません。ループしたり、応答予算を隠れた推論に費やしたりする小さな Qwen スタイルの思考モデルには、明示的な `params.num_ctx` と `params.thinking: false` を組み合わせてください。

  </Accordion>
</AccordionGroup>

### モデル選択

設定が完了すると、すべての Ollama モデルを使用できます。

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
`ollama-spark/qwen3:32b` のようにアクティブなプロバイダー
プレフィックスを使用する場合、OpenClaw は Ollama を呼び出す前にその
プレフィックスだけを取り除くため、サーバーは `qwen3:32b` を受け取ります。

低速なローカルモデルでは、エージェントランタイム全体のタイムアウトを引き上げる前に、
プロバイダースコープのリクエスト調整を優先してください。

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

`timeoutSeconds` は、接続設定、ヘッダー、本文ストリーミング、保護された fetch の合計中断時間を含む、モデル HTTP リクエストに適用されます。`params.keep_alive`
は、ネイティブ `/api/chat` リクエストのトップレベル `keep_alive` として Ollama に転送されます。初回ターンのロード時間がボトルネックの場合は、モデルごとに設定してください。

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

リモートホストの場合は、`127.0.0.1` を `baseUrl` で使用しているホストに置き換えます。`curl` は動作するのに OpenClaw が動作しない場合は、Gateway が別のマシン、コンテナ、またはサービスアカウントで実行されていないか確認してください。

## Ollama Web Search

OpenClaw は、バンドルされた `web_search` プロバイダーとして **Ollama Web Search** をサポートしています。

| プロパティ | 詳細                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ホスト        | 設定済みの Ollama ホストを使用します（設定されている場合は `models.providers.ollama.baseUrl`、それ以外は `http://127.0.0.1:11434`）。`https://ollama.com` はホスト型 API を直接使用します |
| 認証        | サインイン済みのローカル Ollama ホストではキー不要です。直接の `https://ollama.com` 検索または認証で保護されたホストでは、`OLLAMA_API_KEY` または設定済みのプロバイダー認証を使用します               |
| 要件 | ローカルまたはセルフホストのホストは実行中で、`ollama signin` でサインイン済みである必要があります。直接のホスト型検索には、`baseUrl: "https://ollama.com"` と実際の Ollama API キーが必要です |

`openclaw onboard` または `openclaw configure --section web` 中に **Ollama Web Search** を選択するか、次のように設定します。

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

サインイン済みのローカルデーモンでは、OpenClaw はデーモンの `/api/experimental/web_search` プロキシを使用します。`https://ollama.com` では、ホスト型の `/api/web_search` エンドポイントを直接呼び出します。

<Note>
完全なセットアップと動作の詳細については、[Ollama Web Search](/ja-JP/tools/ollama-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="レガシー OpenAI 互換モード">
    <Warning>
    **OpenAI 互換モードではツール呼び出しは信頼できません。** プロキシのために OpenAI 形式が必要で、ネイティブのツール呼び出し動作に依存しない場合にのみ、このモードを使用してください。
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

    このモードでは、ストリーミングとツール呼び出しを同時にサポートしない場合があります。モデル設定で `params: { streaming: false }` を使用して、ストリーミングを無効にする必要があるかもしれません。

    `api: "openai-completions"` が Ollama とともに使用される場合、Ollama が暗黙的に 4096 のコンテキストウィンドウへフォールバックしないように、OpenClaw はデフォルトで `options.num_ctx` を注入します。プロキシまたは上流が不明な `options` フィールドを拒否する場合は、この動作を無効にしてください。

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
    自動検出されたモデルでは、OpenClaw は利用可能な場合、カスタム Modelfile のより大きな `PARAMETER num_ctx` 値を含め、Ollama が報告したコンテキストウィンドウを使用します。それ以外の場合は、OpenClaw が使用するデフォルトの Ollama コンテキストウィンドウへフォールバックします。

    その Ollama プロバイダー配下のすべてのモデルに対して、プロバイダーレベルの `contextWindow`、`contextTokens`、`maxTokens` のデフォルトを設定し、必要に応じてモデルごとに上書きできます。`contextWindow` は OpenClaw のプロンプトおよび Compaction 予算です。ネイティブ Ollama リクエストでは、`params.num_ctx` を明示的に設定しない限り `options.num_ctx` は未設定のままになるため、Ollama は独自のモデル、`OLLAMA_CONTEXT_LENGTH`、または VRAM ベースのデフォルトを適用できます。Modelfile を再構築せずに Ollama のリクエストごとのランタイムコンテキストを制限または強制するには、`params.num_ctx` を設定します。無効な値、ゼロ、負の値、有限でない値は無視されます。ネイティブ Ollama リクエストコンテキストを強制するために `contextWindow` または `maxTokens` のみを使用していた古い設定をアップグレードした場合は、`openclaw doctor --fix` を実行して、明示的なプロバイダーまたはモデルの予算を `params.num_ctx` にコピーしてください。OpenAI 互換 Ollama アダプターは、設定された `params.num_ctx` または `contextWindow` から、デフォルトで引き続き `options.num_ctx` を注入します。上流が `options` を拒否する場合は、`injectNumCtxForOpenAICompat: false` で無効にしてください。

    ネイティブ Ollama モデルエントリは、`temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread`、`use_mmap` など、一般的な Ollama ランタイムオプションも `params` 配下で受け付けます。OpenClaw は Ollama リクエストキーのみを転送するため、`streaming` などの OpenClaw ランタイムパラメーターは Ollama に漏れません。トップレベルの Ollama `think` を送信するには `params.think` または `params.thinking` を使用します。`false` は、Qwen スタイルの思考モデルで API レベルの思考を無効にします。

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

    モデルごとの `agents.defaults.models["ollama/<model>"].params.num_ctx` も機能します。両方が設定されている場合、明示的なプロバイダーモデルエントリがエージェントデフォルトより優先されます。

  </Accordion>

  <Accordion title="思考制御">
    ネイティブ Ollama モデルでは、OpenClaw は Ollama が期待する形式で思考制御を転送します。つまり `options.think` ではなく、トップレベルの `think` です。`/api/show` 応答に `thinking` 機能が含まれる自動検出モデルは、`/think low`、`/think medium`、`/think high`、`/think max` を公開します。非思考モデルは `/think off` のみを公開します。

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

    モデルごとの `params.think` または `params.thinking` は、特定の設定済みモデルに対して Ollama API の思考を無効化または強制できます。アクティブな実行が暗黙のデフォルト `off` のみを持つ場合、OpenClaw はそれらの明示的なモデルパラメーターを保持します。`/think medium` などの off 以外のランタイムコマンドは、引き続きアクティブな実行を上書きします。

  </Accordion>

  <Accordion title="推論モデル">
    OpenClaw は、`deepseek-r1`、`reasoning`、`think` などの名前を持つモデルを、デフォルトで推論対応として扱います。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    追加設定は不要です。OpenClaw が自動的にマークします。

  </Accordion>

  <Accordion title="モデルコスト">
    Ollama は無料でローカル実行されるため、すべてのモデルコストは $0 に設定されます。これは、自動検出されたモデルと手動で定義されたモデルの両方に適用されます。
  </Accordion>

  <Accordion title="メモリエンベディング">
    バンドルされた Ollama Plugin は、[メモリ検索](/ja-JP/concepts/memory) 用のメモリエンベディングプロバイダーを登録します。設定済みの Ollama ベース URL と API キーを使用し、Ollama の現在の `/api/embed` エンドポイントを呼び出し、可能な場合は複数のメモリチャンクを 1 つの `input` リクエストにバッチ化します。

    `proxy.enabled=true` の場合、設定済みの `baseUrl` から導出された正確なホスト local loopback オリジンへの Ollama メモリエンベディングリクエストは、管理対象の転送プロキシではなく、OpenClaw の保護された直接パスを使用します。設定済みのホスト名自体が `localhost` または loopback IP リテラルである必要があります。単に loopback に解決される DNS 名は、引き続き管理対象プロキシパスを使用します。LAN、tailnet、プライベートネットワーク、公開 Ollama ホストも管理対象プロキシパスのままです。別のホストまたはポートへのリダイレクトは信頼を継承しません。オペレーターは引き続き、グローバルな `proxy.loopbackMode: "proxy"` 設定を指定して loopback トラフィックをプロキシ経由で送信することも、`proxy.loopbackMode: "block"` を指定して接続を開く前に loopback 接続を拒否することもできます。この設定のプロセス全体への効果については、[管理対象プロキシ](/ja-JP/security/network-proxy#gateway-loopback-mode) を参照してください。

    | プロパティ      | 値               |
    | ------------- | ------------------- |
    | デフォルトモデル | `nomic-embed-text`  |
    | 自動 pull     | はい — エンベディングモデルがローカルに存在しない場合、自動的に pull されます |

    クエリ時のエンベディングは、`nomic-embed-text`、`qwen3-embedding`、`mxbai-embed-large` など、検索プレフィックスを必要または推奨するモデルに対して検索プレフィックスを使用します。既存のインデックスで形式移行が不要になるよう、メモリドキュメントバッチは未加工のまま維持されます。

    Ollama をメモリ検索エンベディングプロバイダーとして選択するには:

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

    リモートエンベディングホストでは、認証をそのホストに限定してください:

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
    OpenClaw の Ollama 連携は、デフォルトで **ネイティブ Ollama API**（`/api/chat`）を使用し、ストリーミングとツール呼び出しの同時使用を完全にサポートします。特別な設定は不要です。

    ネイティブ `/api/chat` リクエストでは、OpenClaw は思考制御も Ollama に直接転送します。明示的なモデル `params.think`/`params.thinking` 値が設定されていない限り、`/think off` と `openclaw agent --thinking off` はトップレベルの `think: false` を送信し、`/think low|medium|high` は一致するトップレベルの `think` effort 文字列を送信します。`/think max` は Ollama の最上位のネイティブ effort である `think: "high"` にマッピングされます。

    <Tip>
    OpenAI 互換エンドポイントを使用する必要がある場合は、上記の「レガシー OpenAI 互換モード」セクションを参照してください。そのモードでは、ストリーミングとツール呼び出しが同時に動作しない場合があります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="WSL2 クラッシュループ（繰り返し再起動）">
    NVIDIA/CUDA を使用する WSL2 では、公式 Ollama Linux インストーラーが `Restart=always` を持つ `ollama.service` systemd ユニットを作成します。そのサービスが自動起動し、WSL2 起動中に GPU バックのモデルを読み込むと、モデルの読み込み中に Ollama がホストメモリを固定することがあります。Hyper-V のメモリ回収は、固定されたページを常に回収できるとは限らないため、Windows が WSL2 VM を終了し、systemd が Ollama を再び開始し、ループが繰り返される可能性があります。

    一般的な証拠:

    - Windows 側からの WSL2 の繰り返し再起動または終了
    - WSL2 起動直後の `app.slice` または `ollama.service` の高い CPU 使用率
    - Linux OOM-killer イベントではなく systemd からの SIGTERM

    OpenClaw は、WSL2、`Restart=always` で有効化された `ollama.service`、および可視の CUDA マーカーを検出した場合、起動時警告をログに記録します。

    緩和策:

    ```bash
    sudo systemctl disable ollama
    ```

    これを Windows 側の `%USERPROFILE%\.wslconfig` に追加し、その後 `wsl --shutdown` を実行します:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Ollama サービス環境で短めの keep-alive を設定するか、必要なときだけ Ollama を手動で起動します:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) を参照してください。

  </Accordion>

  <Accordion title="Ollama が検出されない">
    Ollama が実行中であり、`OLLAMA_API_KEY`（または認証プロファイル）を設定していること、さらに明示的な `models.providers.ollama` エントリを定義して**いない**ことを確認してください:

    ```bash
    ollama serve
    ```

    API にアクセスできることを確認します:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルが一覧にない場合は、モデルをローカルに pull するか、`models.providers.ollama` で明示的に定義してください。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="接続が拒否される">
    Ollama が正しいポートで実行されていることを確認します:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="リモートホストは curl では動作するが OpenClaw では動作しない">
    Gateway を実行している同じマシンとランタイムから確認してください:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    一般的な原因:

    - `baseUrl` が `localhost` を指しているが、Gateway が Docker 内または別のホスト上で実行されている。
    - URL が `/v1` を使用しており、ネイティブ Ollama ではなく OpenAI 互換の挙動が選択されている。
    - リモートホストで Ollama 側のファイアウォールまたは LAN バインディングの変更が必要。
    - モデルがノート PC のデーモンには存在するが、リモートデーモンには存在しない。

  </Accordion>

  <Accordion title="モデルがツール JSON をテキストとして出力する">
    これは通常、プロバイダーが OpenAI 互換モードを使用しているか、モデルがツールスキーマを処理できないことを意味します。

    ネイティブ Ollama モードを推奨します:

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

    小さなローカルモデルがツールスキーマで引き続き失敗する場合は、そのモデルエントリで `compat.supportsTools: false` を設定して再テストしてください。

  </Accordion>

  <Accordion title="Kimi または GLM が文字化けした記号を返す">
    長い非言語的な記号列であるホスト型 Kimi/GLM の応答は、成功したアシスタント回答ではなく、失敗したプロバイダー出力として扱われます。これにより、破損したテキストをセッションに永続化せずに、通常の再試行、フォールバック、またはエラー処理に引き継がせることができます。

    繰り返し発生する場合は、生のモデル名、現在のセッションファイル、実行で `Cloud + Local` または `Cloud only` のどちらを使用したかを取得し、その後、新しいセッションとフォールバックモデルを試してください:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="コールドローカルモデルがタイムアウトする">
    大きなローカルモデルでは、ストリーミングが開始されるまでの初回読み込みに長い時間が必要になることがあります。タイムアウトは Ollama プロバイダーに限定し、必要に応じて Ollama にターン間でモデルを読み込んだままにするよう要求します:

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

    ホスト自体が接続の受け入れに時間がかかる場合、`timeoutSeconds` はこのプロバイダーの保護された Undici 接続タイムアウトも延長します。

  </Accordion>

  <Accordion title="大きなコンテキストのモデルが遅すぎる、またはメモリ不足になる">
    多くの Ollama モデルは、ハードウェアで快適に実行できるより大きいコンテキストを advertise します。ネイティブ Ollama は、`params.num_ctx` を設定しない限り、Ollama 独自のランタイムコンテキストデフォルトを使用します。予測可能な初回トークンレイテンシが必要な場合は、OpenClaw の予算と Ollama のリクエストコンテキストの両方に上限を設定します:

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

    OpenClaw が送信するプロンプトが多すぎる場合は、まず `contextWindow` を下げます。Ollama がマシンに対して大きすぎるランタイムコンテキストを読み込んでいる場合は、`params.num_ctx` を下げます。生成が長すぎる場合は `maxTokens` を下げます。

  </Accordion>
</AccordionGroup>

<Note>
その他のヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー挙動の概要。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選択と設定方法。
  </Card>
  <Card title="Ollama Web Search" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollama 搭載 Web 検索の完全なセットアップと挙動の詳細。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
