---
read_when:
    - Ollama 経由でクラウドモデルまたはローカルモデルを使用して OpenClaw を実行する場合
    - Ollama のセットアップと構成に関するガイダンスが必要です
    - 画像理解に Ollama のビジョンモデルを使用したい場合
summary: Ollama（クラウドモデルおよびローカルモデル）でOpenClawを実行する
title: Ollama
x-i18n:
    generated_at: "2026-07-11T22:37:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw は OpenAI 互換の `/v1` エンドポイントではなく、Ollama のネイティブ API（`/api/chat`）と通信します。次の3つのモードがサポートされています。

| モード          | 使用するもの                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| クラウド + ローカル | 到達可能な Ollama ホスト。ローカルモデルと、サインイン済みの場合は `:cloud` モデルを提供 |
| クラウドのみ    | ローカルデーモンを使用せず、`https://ollama.com` に直接接続                                   |
| ローカルのみ    | 到達可能な Ollama ホスト。ローカルモデルのみ                                       |

専用の `ollama-cloud` プロバイダー ID を使用するクラウドのみのセットアップについては、[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。クラウドルーティングをローカルの `ollama` プロバイダーから分離したい場合は、`ollama-cloud/<model>` 参照を使用します。

<Warning>
OpenAI 互換の `/v1` URL（`http://host:11434/v1`）は使用しないでください。ツール呼び出しが機能しなくなり、モデルがツール呼び出しの生の JSON をプレーンテキストとして出力することがあります。ネイティブ URL `baseUrl: "http://host:11434"`（`/v1` なし）を使用してください。
</Warning>

正規の設定キーは `baseUrl` です。OpenAI SDK 形式の例では `baseURL` も使用できますが、新しい設定では `baseUrl` を使用してください。

## 認証ルール

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    ループバック、プライベートネットワーク、`.local`、およびホスト名のみの Ollama URL には、実際のベアラートークンは必要ありません。OpenClaw はこれらに `ollama-local` マーカーを使用します。
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    公開リモートホストと `https://ollama.com` には、実際の認証情報（`OLLAMA_API_KEY`、認証プロファイル、またはプロバイダーの `apiKey`）が必要です。ホストされたサービスを直接使用する場合は、`ollama-cloud` プロバイダーを推奨します。
  </Accordion>
  <Accordion title="Custom provider ids">
    `api: "ollama"` を持つカスタムプロバイダーにも同じルールが適用されます。たとえば、プライベート LAN ホストを指す `ollama-remote` プロバイダーでは、`apiKey: "ollama-local"` を使用できます。サブエージェントは、これを認証情報の欠落として扱うのではなく、Ollama プロバイダーフックを通じてこのマーカーを解決します。`agents.defaults.memorySearch.provider` にカスタムプロバイダー ID を指定し、埋め込みにその Ollama エンドポイントを使用することもできます。
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` にはプロバイダー ID の認証情報を保存し、エンドポイント設定（`baseUrl`、`api`、モデル、ヘッダー、タイムアウト）は `models.providers.<id>` に配置します。`{ "ollama-windows": { "apiKey": "ollama-local" } }` のような古いフラットファイルはランタイム形式ではありません。`openclaw doctor --fix` はバックアップを作成し、それらを正規の `ollama-windows:default` API キープロファイルに書き換えます。そのレガシーファイル内の `baseUrl` 値は不要な情報であり、プロバイダー設定に移動してください。
  </Accordion>
  <Accordion title="Memory embedding scope">
    Ollama のメモリ埋め込みに使用するベアラー認証は、宣言されたホストにのみ適用されます。

    - プロバイダーレベルのキーは、そのプロバイダーのホストにのみ送信されます。
    - `agents.*.memorySearch.remote.apiKey` は、そのリモート埋め込みホストにのみ送信されます。
    - `OLLAMA_API_KEY` 環境変数の値だけが設定されている場合は Ollama Cloud の慣例として扱われ、デフォルトではローカルまたはセルフホストのホストには送信されません。

  </Accordion>
</AccordionGroup>

## はじめに

<Tabs>
  <Tab title="Onboarding (recommended)">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        **Ollama** を選択し、次にモードとして **クラウド + ローカル**、**クラウドのみ**、または **ローカルのみ** を選択します。
      </Step>
      <Step title="Select a model">
        `Cloud only` では `OLLAMA_API_KEY` の入力を求め、ホストされたクラウドの推奨デフォルトを提示します。`Cloud + Local` と `Local only` では Ollama のベース URL の入力を求め、利用可能なモデルを検出し、選択したローカルモデルがない場合は自動的に取得します。`gemma4:latest` のようにインストール済みの `:latest` タグは、`gemma4` と重複して表示されず、一度だけ表示されます。`Cloud + Local` では、ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    非対話モード：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` と `--custom-model-id` は省略可能です。省略すると、ローカルのデフォルトホストと推奨モデル `gemma4` が使用されます。

  </Tab>

  <Tab title="Manual setup">
    <Steps>
      <Step title="Install and start Ollama">
        [ollama.com/download](https://ollama.com/download) から入手し、モデルを取得します。

        ```bash
        ollama pull gemma4
        ```

        ハイブリッドクラウドアクセスを使用するには、同じホストで `ollama signin` を実行します。
      </Step>
      <Step title="Set a credential">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # ローカル/LAN ホストでは任意の値を使用可能
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com のみ
        ```

        または、設定で `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"` を実行します。
      </Step>
      <Step title="Select the model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        または、設定で次のように指定します。

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

## ローカルホスト経由のクラウドモデル

`Cloud + Local` は、ローカルモデルと `:cloud` モデルの両方を、到達可能な1つの Ollama ホスト経由でルーティングします。これは Ollama のハイブリッドフローであり、両方を使用したい場合にセットアップ時に選択するモードです。

OpenClaw はベース URL の入力を求め、ローカルモデルを検出し、`ollama signin` の状態を確認します。サインイン済みの場合は、ホストされたサービスの推奨デフォルト（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）を提示します。サインインしていない場合、`ollama signin` を実行するまでセットアップはローカルのみのままになります。

ローカルデーモンを使用せずにクラウドのみにアクセスするには、`openclaw onboard --auth-choice ollama-cloud` を使用し、[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。この方法では `ollama signin` も稼働中のサーバーも必要ありません。

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 中に表示されるクラウドモデル一覧は、`https://ollama.com/api/tags` からリアルタイムで取得され、最大500件に制限されます。そのため、選択画面には現在ホストされているカタログが反映されます。セットアップ時に `ollama.com` に到達できない場合、またはモデルが返されない場合、OpenClaw はハードコードされた推奨リストにフォールバックするため、オンボーディングは引き続き完了できます。

## モデル検出（暗黙的プロバイダー）

`OLLAMA_API_KEY`（または認証プロファイル）が設定され、`models.providers.ollama` も `api: "ollama"` を持つ別のカスタムプロバイダーも定義されていない場合、OpenClaw は `http://127.0.0.1:11434` からモデルを検出します。

| 動作             | 詳細                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログの問い合わせ        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 機能検出 | ベストエフォートの `/api/show` により、`contextWindow`、`num_ctx` Modelfile パラメーター、および機能（ビジョン、ツール、思考）を読み取ります                                                                                                                                                                       |
| ビジョンモデル        | `/api/show` の `vision` 機能により、モデルが画像対応（`input: ["text", "image"]`）としてマークされます                                                                                                                                                                                             |
| 推論検出  | 利用可能な場合は `/api/show` の `thinking` 機能を使用します。Ollama が機能情報を省略した場合は、名前によるヒューリスティック（`r1`、`reason`、`reasoning`、`think`）にフォールバックします。`glm-5.2:cloud` と `deepseek-v4-flash\|pro:cloud` は、報告された機能にかかわらず常に推論モデルとして扱われます。 |
| トークン上限         | `maxTokens` のデフォルトは OpenClaw の Ollama 最大トークン上限です                                                                                                                                                                                                                                       |
| コスト                | すべてのコストは `0` です                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

明示的な `models` 配列を持つ `models.providers.ollama`、または `api: "ollama"` とループバック以外の `baseUrl` を持つカスタムプロバイダーを設定すると、自動検出は無効になります。その場合、モデルを手動で定義する必要があります（[設定](#configuration)を参照）。ホストされた `https://ollama.com` を指す `models.providers.ollama` エントリでも、Ollama Cloud モデルはプロバイダーによって管理されるため検出をスキップします。`http://127.0.0.2:11434` のようなループバックのカスタムプロバイダーは引き続きローカルとして扱われ、自動検出が維持されます。

手書きの `models.json` エントリがなくても、`ollama/<pulled-model>:latest` のような完全な参照を使用できます。OpenClaw がリアルタイムで解決します。サインイン済みのホストでは、一覧にない `ollama/<model>:cloud` 参照を選択すると、そのモデルを `/api/show` で正確に検証し、Ollama がメタデータを確認した場合にのみランタイムカタログへ追加します。入力ミスは引き続き不明なモデルとして失敗します。

### スモークテスト

エージェントの完全なツールサーフェスを省略した、限定的なテキストプローブを実行するには、次を使用します。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

軽量なビジョンモデルのプローブを実行するには、`--file` で画像を追加します（PNG/JPEG/WebP に対応。画像以外のファイルは Ollama が呼び出される前に拒否されます。音声には `openclaw infer audio transcribe` を使用してください）。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

どちらの経路も、チャットツール、メモリ、セッションコンテキストを読み込みません。これが成功する一方で通常のエージェント応答が失敗する場合、問題はエンドポイントではなく、モデルのツールまたはエージェント処理能力にある可能性が高いです。

`/model ollama/<model>` でモデルを選択することは、ユーザーによる明示的な選択です。設定された `baseUrl` に到達できない場合、別の設定済みモデルへ暗黙的にフォールバックするのではなく、次の応答がプロバイダーエラーで失敗します。

分離された Cron ジョブは、エージェントターンを開始する前にローカルの安全確認を1つ追加します。選択したモデルがローカル、プライベートネットワーク、または `.local` の Ollama プロバイダーに解決され、`/api/tags` に到達できない場合、OpenClaw はその実行を `skipped` として記録し、エラーテキストにモデルを含めます。このエンドポイント確認はホストごとに5分間キャッシュされるため、停止したデーモンに対して繰り返される Cron ジョブがすべて失敗するリクエストを開始することはありません。

ライブ検証：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud の場合は、同じライブテストの接続先をホストされたエンドポイントにします（デフォルトでは埋め込みをスキップします。クラウドキーでは `/api/embed` が認可されない場合があるため、強制するには `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` を指定します）。

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

モデルを追加するには、そのモデルを取得します。取得後は自動的に検出されます。

```bash
ollama pull mistral
```

## Node ローカル推論

エージェントは、ペアリング済みのデスクトップまたはサーバー Node 上の Ollama モデルに短いタスクを委任できます。プロンプトと応答は、既存の認証済み Gateway/Node 接続を経由します。リクエストは、その Node 自身のループバック Ollama エンドポイント（`http://127.0.0.1:11434`）で実行されます。

<Steps>
  <Step title="Node で Ollama を起動する">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Node ホストを接続する">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Gateway ホストでデバイスとその Node コマンドを承認し、次に確認します。

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    初回接続時、または Ollama コマンドを追加するアップグレード後には、Node コマンドの承認が必要になる場合があります。Node が `ollama.models` と `ollama.chat` を公開せずに接続された場合は、`openclaw nodes pending` をもう一度確認してください。

  </Step>
  <Step title="エージェントから使用する">
    バンドルされた Ollama Plugin は `node_inference` ツールを公開します。エージェントは最初に `action: "discover"` を呼び出し、次にその結果に含まれる Node とモデルを指定して `action: "run"` を呼び出します（対応可能な Node がちょうど 1 台だけ接続されている場合、`run` では Node を省略できます）。例：「Node 上の Ollama モデルを検出し、読み込み済みの最速モデルを使ってこのテキストを要約してください。」
  </Step>
</Steps>

検出処理は `/api/tags` を読み取り、`/api/show` の機能を確認し、利用可能な場合は `/api/ps` を使用して、すでに読み込まれているモデルを上位に順位付けします。Ollama がチャット対応（`completion` 機能）として報告するローカルモデルのみを返します。Ollama Cloud の行と埋め込み専用モデルは除外されます。各実行ではモデルの思考を無効化し、ツール呼び出しで別の `maxTokens` が要求されない限り、出力はデフォルトで 512 トークン（上限 8192）になります。一部のモデル（GPT-OSS など）は思考の無効化に対応しておらず、推論トークンを出力する場合があります。

Ollama をエージェントに公開せず、Node 上で稼働させ続けるには、次のようにします。

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node を再起動します（`openclaw node restart`、またはフォアグラウンドセッションの場合は `openclaw node run` を停止して再実行します）。Node は `ollama.models` と `ollama.chat` の公開を停止しますが、Ollama 自体と Gateway の Ollama プロバイダーには影響しません。再度有効にするには値を `true` に戻して再起動します。コマンドサーフェスが変更された場合、再接続後に `openclaw nodes pending` で再承認が必要になることがあります。

エージェントのターンを介さずに、Node コマンドを直接確認します。

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` は、Node がコマンドを実行できる時間の上限を設定します。`--timeout` は Gateway 呼び出し全体の上限を設定するため、より大きい値にする必要があります。

Node ローカル推論では、常にその Node 自身のループバックエンドポイントを使用します。設定済みのリモートまたはクラウドの `models.providers.ollama.baseUrl` は再利用しません。Node コマンドは、macOS、Linux、Windows の Node ホストでデフォルトで利用でき、通常の Node ペアリングおよびコマンドポリシーが適用されます。

## ビジョンと画像の説明

バンドルされた Ollama Plugin は、Ollama を画像対応のメディア理解プロバイダーとして登録します。そのため OpenClaw は、明示的な画像説明リクエストと、設定済みの画像モデルのデフォルトを、ローカルまたはホストされた Ollama ビジョンモデルにルーティングできます。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` には完全な `<provider/model>` 参照を指定する必要があります。指定した場合、`infer image describe` は、ネイティブのビジョンにすでに対応しているモデルに対して説明をスキップする代わりに、まずそのモデルを試します。呼び出しに失敗した場合、OpenClaw は `agents.defaults.imageModel.fallbacks` の処理を続行できます。ファイルまたは URL の準備エラーは、フォールバックを試行する前に失敗します。OpenClaw の画像理解フローと設定済みの `imageModel` を使用する場合は `infer image describe` を使用し、カスタムプロンプトによる生のマルチモーダルプローブを実行する場合は `infer model run --file` を使用してください。

Ollama を受信メディアのデフォルト画像理解プロバイダーにするには、次のようにします。

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

完全な `ollama/<model>` 参照を推奨します。`qwen2.5vl:7b` のようにプロバイダーを含まない `imageModel` 参照が `ollama/qwen2.5vl:7b` に正規化されるのは、その完全一致するモデルが `models.providers.ollama.models` の下で `input: ["text", "image"]` とともに一覧化されており、同じプロバイダーなし ID を公開する設定済みの画像プロバイダーがほかにない場合だけです。それ以外の場合は、プロバイダー接頭辞を明示的に使用してください。

低速なローカルビジョンモデルでは、クラウドモデルよりも長い画像理解タイムアウトが必要になることがあります。また、Ollama がモデルで公開されているビジョンコンテキスト全体を割り当てようとすると、リソースが制限されたハードウェア上でクラッシュする場合があります。機能タイムアウトを設定し、`num_ctx` に上限を設けます。

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

このタイムアウトは、受信画像の理解と明示的な `image` ツールに適用されます。`models.providers.ollama.timeoutSeconds` は引き続き、通常のモデル呼び出しにおける基盤の Ollama HTTP リクエストの制限時間を制御します。

ライブ検証：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` を手動で定義する場合は、ビジョンモデルを明示的に指定します。

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw は、画像対応として指定されていないモデルに対する画像説明リクエストを拒否します。暗黙的な検出では、この情報は `/api/show` のビジョン機能から取得されます。

## 設定

<Tabs>
  <Tab title="基本（暗黙的な検出）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されている場合、プロバイダーエントリの `apiKey` は省略できます。OpenClaw が可用性チェック用に値を補完します。
    </Tip>

  </Tab>

  <Tab title="明示的（手動モデル）">
    ホストされたクラウド構成、デフォルト以外のホストまたはポート、強制的なコンテキストウィンドウ、または完全に手動のモデル一覧には、明示的な設定を使用します。

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
    明示的な設定では自動検出が無効になるため、モデルを一覧に指定する必要があります。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 なし - ネイティブ Ollama API URL
            api: "ollama", // 明示的：ネイティブのツール呼び出し動作を保証
            timeoutSeconds: 300, // 任意：コールド状態のローカルモデル向けに接続とストリームの制限時間を延長
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 任意：ターン間でモデルを読み込み済みの状態に維持
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    `/v1` を追加しないでください。このパスを指定すると OpenAI 互換モードが選択されますが、このモードではツール呼び出しの信頼性がありません。
    </Warning>

  </Tab>
</Tabs>

## 一般的なレシピ

モデル ID は、`ollama list` または `openclaw models list --provider ollama` に表示される正確な名前に置き換えてください。

<AccordionGroup>
  <Accordion title="自動検出を使用するローカルモデル">
    Gateway と同じマシン上の Ollama を自動的に検出します。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    手動モデルが必要な場合を除き、`models.providers.ollama` ブロックを追加しないでください。

  </Accordion>

  <Accordion title="手動モデルを使用する LAN 上の Ollama ホスト">
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

    `contextWindow` は OpenClaw のコンテキスト割り当て量です。`params.num_ctx` は Ollama に送信されます。ハードウェアでモデルが公開するコンテキスト全体を実行できない場合は、両者を一致させてください。

  </Accordion>

  <Accordion title="Ollama Cloud のみ">
    ローカルデーモンを使用せず、ホストされたモデルを直接使用します。

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

    この形式の代わりに専用の `ollama-cloud` プロバイダー ID を使用する場合は、[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。

  </Accordion>

  <Accordion title="サインイン済みデーモンを介したクラウドとローカルの併用">
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
    複数の Ollama サーバーを実行する場合は、カスタムプロバイダー ID を使用します。それぞれに
    独自のホスト、モデル、認証、タイムアウトを設定できます。

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

    OpenClaw は Ollama を呼び出す前に、アクティブなプロバイダーのプレフィックスを除去します
    （見つからない場合は単純な `ollama/` プレフィックスにフォールバックします）。そのため、
    `ollama-large/qwen3.5:27b` は `qwen3.5:27b` として Ollama に渡されます。

  </Accordion>

  <Accordion title="Lean local model profile">
    一部のローカルモデルは単純なプロンプトには対応できますが、エージェントの完全な
    ツールサーフェスではうまく動作しません。グローバルなランタイム設定を変更する前に、
    ツールとコンテキストを制限してください。

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

    モデルまたはサーバーがツールスキーマで確実に失敗する場合に限り、
    `compat.supportsTools: false` を使用してください。これは安定性と引き換えに
    エージェントの機能を制限します。
    `localModelLean` は、明示的に必要とされない限り、負荷の大きいブラウザー、Cron、
    メッセージ、メディア生成、音声、PDF の各ツールをエージェントの直接的なサーフェスから
    除外し、より大きなカタログをツール検索の背後に配置します。Ollama のランタイム
    コンテキストや思考モードは変更しません。ループしたり、隠れた推論に予算を費やしたりする
    小規模な Qwen 系思考モデルでは、`params.num_ctx` および
    `params.thinking: false` と組み合わせてください。

  </Accordion>
</AccordionGroup>

### モデルの選択

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

カスタムプロバイダー ID も同様に機能します。`ollama-spark/qwen3:32b` のように、
アクティブなプロバイダーのプレフィックスを使用する参照では、OpenClaw は Ollama を
呼び出す前にそのプレフィックスを除去し、`qwen3:32b` を送信します。

低速なローカルモデルでは、エージェントランタイム全体のタイムアウトを延長する前に、
プロバイダー単位の調整を優先してください。

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

`timeoutSeconds` は、接続の確立、ヘッダー、本文のストリーミング、および保護された
フェッチ全体の中止を含むモデルへの HTTP リクエストを対象とします。
`params.keep_alive` は、ネイティブの `/api/chat` リクエストでトップレベルの
`keep_alive` として転送されます。最初のターンでの読み込み時間がボトルネックになる場合は、
モデルごとに設定してください。

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

リモートホストでは、`127.0.0.1` を `baseUrl` のホストに置き換えてください。
`curl` は動作するのに OpenClaw が動作しない場合は、Gateway が別のマシン、
コンテナ、またはサービスアカウントで実行されていないか確認してください。

## Ollama ウェブ検索

OpenClaw には、`web_search` プロバイダーとして **Ollama ウェブ検索** が同梱されています。

| プロパティ | 詳細 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ホスト | 設定されている場合は `models.providers.ollama.baseUrl`、それ以外は `http://127.0.0.1:11434`。`https://ollama.com` はホスト型 API を直接使用します |
| 認証 | サインイン済みのローカルホストではキー不要。`https://ollama.com` を直接検索する場合、または認証で保護されたホストでは、`OLLAMA_API_KEY` または設定済みのプロバイダー認証を使用します |
| 要件 | ローカルまたはセルフホスト型のホストは、実行中であり、`ollama signin` でサインイン済みである必要があります。ホスト型検索を直接使用するには、`baseUrl: "https://ollama.com"` と実際の API キーが必要です |

`openclaw onboard` または `openclaw configure --section web` の実行中に選択するか、
次のように設定します。

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

Ollama Cloud を介してホスト型検索を直接使用する場合は、次のように設定します。

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

セルフホスト型のホストでは、OpenClaw はまずローカルの
`/api/experimental/web_search` プロキシを試し、その後、同じホスト上のホスト型
`/api/web_search` パスにフォールバックします。通常、サインイン済みのローカルデーモンは、
ローカルプロキシを介して応答します。`https://ollama.com` への直接呼び出しでは、
常にホスト型の `/api/web_search` エンドポイントを使用します。

<Note>
完全なセットアップと動作については、[Ollama ウェブ検索](/ja-JP/tools/ollama-search)を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **このモードではツール呼び出しの信頼性がありません。** プロキシで OpenAI 形式が必要であり、ネイティブのツール呼び出しに依存しない場合に限って使用してください。
    </Warning>

    `/v1/chat/completions` の背後にあるプロキシでは、
    `api: "openai-completions"` を明示的に設定します。

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

    このモードでは、ストリーミングとツール呼び出しを同時にサポートできない場合があります。
    モデルに `params: { streaming: false }` を設定する必要があることがあります。

    このモードでは、Ollama が暗黙に 4096 トークンのコンテキストへフォールバックしないよう、
    OpenClaw はデフォルトで `options.num_ctx` を注入します。プロキシが未知の
    `options` フィールドを拒否する場合は、無効にしてください。

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

  <Accordion title="Context windows">
    自動検出されたモデルでは、OpenClaw は `/api/show` が報告するコンテキストウィンドウを
    使用します。これには、カスタム Modelfile のより大きな `PARAMETER num_ctx` 値も
    含まれます。それ以外の場合は、OpenClaw のデフォルトの Ollama コンテキストウィンドウに
    フォールバックします。

    プロバイダーレベルの `contextWindow`、`contextTokens`、`maxTokens` は、
    そのプロバイダー配下のすべてのモデルにデフォルト値を設定し、モデルごとに
    オーバーライドできます。`contextWindow` は、OpenClaw 独自のプロンプトおよび
    Compaction の予算です。ネイティブの `/api/chat` リクエストでは、
    `params.num_ctx` を明示的に設定しない限り、`options.num_ctx` は未設定のままとなります。
    そのため、Ollama はモデル独自の値、`OLLAMA_CONTEXT_LENGTH`、または VRAM に基づく
    デフォルト値を適用します。無効、ゼロ、負数、または有限でない `params.num_ctx` の値は
    無視されます。古い設定で `contextWindow`/`maxTokens` のみを使用してネイティブ
    リクエストのコンテキストを強制していた場合は、`openclaw doctor --fix` を実行して、
    それらを `params.num_ctx` にコピーしてください。OpenAI 互換アダプターは引き続き、
    設定された `params.num_ctx` または `contextWindow` から、デフォルトで
    `options.num_ctx` を注入します。アップストリームが `options` を拒否する場合は、
    `injectNumCtxForOpenAICompat: false` で無効にしてください。

    ネイティブモデルのエントリでは、`params` 配下に一般的な Ollama ランタイムオプションも
    指定できます。これらはネイティブの `/api/chat` の `options` として転送されます。
    `num_keep`、`seed`、`num_predict`、`top_k`、`top_p`、`min_p`、`typical_p`、
    `repeat_last_n`、`temperature`、`repeat_penalty`、`presence_penalty`、
    `frequency_penalty`、`stop`、`num_batch`、`num_gpu`、`main_gpu`、`use_mmap`、
    `num_thread` が対象です。一部のキー（`format`、`keep_alive`、`truncate`、`shift`）は、
    ネストされた `options` ではなく、トップレベルのリクエストフィールドとして転送されます。
    OpenClaw が転送するのはこれらの Ollama リクエストキーのみであるため、`streaming` のような
    ランタイム専用パラメーターが Ollama に送信されることはありません。トップレベルの
    `think` を設定するには、`params.think`（または `params.thinking`）を使用します。
    `false` を指定すると、Qwen 系思考モデルの API レベルの思考が無効になります。

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

    モデル単位の `agents.defaults.models["ollama/<model>"].params.num_ctx` も
    機能します。両方が設定されている場合は、明示的なプロバイダーモデルのエントリが
    優先されます。

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw は、Ollama が期待する形式で思考設定を転送します。つまり、
    `options.think` ではなく、トップレベルの `think` を使用します。`/api/show` が
    `thinking` 機能を報告する自動検出モデルでは、`/think low`、`/think medium`、
    `/think high`、`/think max` を使用できます。思考機能のないモデルでは、
    `/think off` のみを使用できます。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    または、モデルのデフォルトを設定します。

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

    モデルごとの `params.think`/`params.thinking` では、特定のモデルについて API の思考を無効化または強制できます。OpenClaw は、アクティブな実行で暗黙のデフォルト値 `off` のみが指定されている場合、その明示的な設定を維持します。ただし、`/think medium` のような `off` 以外のランタイムコマンドは、引き続きその設定を上書きします。明示的に `reasoning: false` と指定されたモデルには、真と評価される思考リクエストが送信されることはありません。一方、`think: false` リクエストは常に送信されます。

  </Accordion>

  <Accordion title="推論モデル">
    `deepseek-r1`、`reasoning`、`reason`、または `think` という名前のモデルは、デフォルトで推論対応として扱われます。追加設定は不要です。

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="モデルのコスト">
    Ollama はローカルで実行され、無料であるため、自動検出されたモデルと手動定義されたモデルのどちらでも、すべてのモデルコストは `0` です。
  </Accordion>

  <Accordion title="メモリ埋め込み">
    バンドルされている Ollama plugin は、[メモリ検索](/ja-JP/concepts/memory)用のメモリ埋め込みプロバイダーを登録します。設定された Ollama のベース URL と API キーを使用して `/api/embed` を呼び出し、可能な場合は複数のメモリチャンクを 1 つの `input` リクエストにまとめます。

    `proxy.enabled=true` の場合、設定された `baseUrl` から導出された正確なホストローカルの local loopback オリジンへの埋め込みリクエストでは、管理対象のフォワードプロキシではなく、OpenClaw の保護された直接パスが使用されます。設定するホスト名自体が `localhost` またはループバック IP リテラルである必要があります。単にループバックへ解決される DNS 名では、引き続き管理対象プロキシのパスが使用されます。LAN、tailnet、プライベートネットワーク、および公開 Ollama ホストでは常に管理対象プロキシのパスが使用され、別のホストまたはポートへのリダイレクトに信頼は引き継がれません。`proxy.loopbackMode: "proxy"` ではループバックトラフィックもプロキシ経由でルーティングされ、`proxy.loopbackMode: "block"` では接続前に拒否されます。[管理対象プロキシ](/ja-JP/security/network-proxy#gateway-loopback-mode)を参照してください。

    | プロパティ | 値 |
    | --- | --- |
    | デフォルトモデル | `nomic-embed-text` |
    | 自動取得 | ローカルに存在しない場合は実行 |
    | デフォルトのインライン並行数 | 1（他のプロバイダーではデフォルト値がより高くなります。ホストに余裕がある場合は `nonBatchConcurrency` で増やしてください） |

    クエリ時の埋め込みでは、取得プレフィックスを必要または推奨するモデル（`nomic-embed-text`、`qwen3-embedding`、`mxbai-embed-large`）に対して、そのプレフィックスを使用します。ドキュメントのバッチは加工されないため、既存のインデックスに形式の移行は必要ありません。

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

    リモートの埋め込みホストでは、認証のスコープをそのホストに限定してください。

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
    Ollama はデフォルトで**ネイティブ API**（`/api/chat`）を使用します。これはストリーミングとツール呼び出しの併用に対応しており、特別な設定は不要です。

    ネイティブリクエストでは、思考制御が直接転送されます。明示的な `params.think`/`params.thinking` が設定されていない限り、`/think off` と `openclaw agent --thinking off` はトップレベルの `think: false` を送信します。`/think low|medium|high` は対応する労力レベルの文字列を送信します。`/think max` は Ollama の最高労力レベルである `think: "high"` に対応付けられます。

    <Tip>
    代わりに OpenAI 互換エンドポイントを使用する場合は、上記の「従来の OpenAI 互換モード」を参照してください。このモードでは、ストリーミングとツール呼び出しを併用できない場合があります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="WSL2 のクラッシュループ（再起動の繰り返し）">
    NVIDIA/CUDA を搭載した WSL2 では、公式の Ollama Linux インストーラーが `Restart=always` を指定した `ollama.service` systemd ユニットを作成します。そのサービスが自動起動し、WSL2 の起動中に GPU を使用するモデルを読み込むと、Ollama が読み込み中にホストメモリを固定する場合があります。Hyper-V のメモリ回収では、それらのページを常に回収できるとは限りません。その結果、Windows が WSL2 VM を終了し、systemd が Ollama を再起動して、このループが繰り返される可能性があります。

    判断材料としては、WSL2 の再起動や終了が繰り返されること、WSL2 の起動直後に `app.slice` または `ollama.service` の CPU 使用率が高くなること、Linux の OOM Killer ではなく systemd から SIGTERM が送られることが挙げられます。

    OpenClaw は、WSL2、`Restart=always` が指定された有効な `ollama.service`、および可視の CUDA マーカーを検出すると、起動時に警告を記録します。

    軽減策：

    ```bash
    sudo systemctl disable ollama
    ```

    Windows 側で、次の内容を `%USERPROFILE%\.wslconfig` に追加してから、`wsl --shutdown` を実行します。

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    または、キープアライブ時間を短縮するか、必要な場合にのみ Ollama を手動で起動します。

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)を参照してください。

  </Accordion>

  <Accordion title="Ollama が検出されない">
    Ollama が実行中であること、`OLLAMA_API_KEY`（または認証プロファイル）が設定されていること、および `models.providers.ollama` が明示的に定義されて**いない**ことを確認します。

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルをローカルに取得するか、`models.providers.ollama` で明示的に定義します。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="接続が拒否される">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="リモートホストは curl では動作するが OpenClaw では動作しない">
    Gateway を実行しているものと同じマシンおよびランタイムから確認します。

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    一般的な原因：

    - `baseUrl` が `localhost` を指しているが、Gateway は Docker 内または別のホストで実行されている。
    - URL に `/v1` が含まれており、ネイティブ Ollama ではなく OpenAI 互換動作が選択されている。
    - リモートホストでファイアウォールまたは LAN バインドの変更が必要である。
    - モデルがノートパソコン上のデーモンには存在するが、リモート側には存在しない。

  </Accordion>

  <Accordion title="モデルがツールの JSON をテキストとして出力する">
    通常は、プロバイダーが OpenAI 互換モードになっているか、モデルがツールスキーマを処理できないことが原因です。ネイティブモードを優先してください。

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

    小規模なローカルモデルが引き続きツールスキーマで失敗する場合は、そのモデルエントリに `compat.supportsTools: false` を設定し、再テストしてください。

  </Accordion>

  <Accordion title="Kimi または GLM が文字化けした記号を返す">
    ホストされている Kimi/GLM の応答が、言語として意味をなさない長い記号列である場合、正常な応答ではなくプロバイダー呼び出しの失敗として扱われます。そのため、破損したテキストをセッションに保存する代わりに、通常の再試行、フォールバック、またはエラー処理が実行されます。

    再発した場合は、モデル名、現在のセッションファイル、および実行で「クラウド + ローカル」と「クラウドのみ」のどちらを使用したかを記録し、新しいセッションとフォールバックモデルを試してください。

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="コールド状態のローカルモデルがタイムアウトする">
    大規模なローカルモデルでは、初回読み込みに時間がかかる場合があります。タイムアウトの適用範囲を Ollama プロバイダーに限定し、必要に応じてターン間もモデルを読み込み済みの状態に保ちます。

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

    ホスト自体が接続を受け付けるまでに時間がかかる場合、`timeoutSeconds` によって、このプロバイダーの保護された接続タイムアウトも延長されます。

  </Accordion>

  <Accordion title="大規模コンテキストモデルが遅すぎる、またはメモリ不足になる">
    多くのモデルは、使用しているハードウェアで快適に実行できるサイズを超えるコンテキストを公称値として示しています。ネイティブ Ollama では、`params.num_ctx` が設定されていない限り、独自のランタイムデフォルトが使用されます。最初のトークンが返るまでのレイテンシーを予測可能にするには、OpenClaw の予算と Ollama のリクエストコンテキストの両方に上限を設定します。

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

    OpenClaw が送信するプロンプトが多すぎる場合は、`contextWindow` を小さくします。Ollama のランタイムコンテキストがマシンに対して大きすぎる場合は、`params.num_ctx` を小さくします。生成に時間がかかりすぎる場合は、`maxTokens` を小さくします。

  </Accordion>
</AccordionGroup>

<Note>
さらにヘルプが必要な場合は、[トラブルシューティング](/ja-JP/help/troubleshooting)と[よくある質問](/ja-JP/help/faq)を参照してください。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ja-JP/providers/ollama-cloud" icon="cloud">
    専用の `ollama-cloud` プロバイダーを使用する、クラウド専用のセットアップです。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、およびフェイルオーバー動作の概要です。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/models" icon="brain">
    モデルを選択して設定する方法です。
  </Card>
  <Card title="Ollama Web Search" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollama を利用したウェブ検索の完全なセットアップ手順と動作の詳細です。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンスです。
  </Card>
</CardGroup>
