---
read_when:
    - Ollama 経由でクラウドモデルまたはローカルモデルを使用して OpenClaw を実行する場合
    - Ollama のセットアップと設定に関するガイダンスが必要です
    - 画像理解に Ollama のビジョンモデルを使用する場合
summary: Ollama（クラウドモデルとローカルモデル）でOpenClawを実行する
title: Ollama
x-i18n:
    generated_at: "2026-07-16T12:13:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9cde30d5b713be4c51e8a98fb7a380f856dca8a611b4b0adfe8e40cd738105fa
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw は OpenAI 互換の
`/v1` エンドポイントではなく、Ollama のネイティブ API（`/api/chat`）と通信します。次の 3 つのモードがサポートされています。

| モード          | 使用するもの                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| クラウド + ローカル | 到達可能な Ollama ホスト。ローカルモデルと、（サインイン済みの場合は）`:cloud` モデルを提供 |
| クラウドのみ    | `https://ollama.com` を直接使用し、ローカルデーモンは不要                                   |
| ローカルのみ    | 到達可能な Ollama ホスト、ローカルモデルのみ                                       |

専用の `ollama-cloud` プロバイダー ID を使用するクラウドのみのセットアップについては、
[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。クラウドルーティングをローカルの `ollama` プロバイダーから
分離しておきたい場合は、`ollama-cloud/<model>` 参照を使用してください。

<Warning>
`/v1` OpenAI 互換 URL（`http://host:11434/v1`）は使用しないでください。ツール呼び出しが機能しなくなり、モデルが未加工のツール呼び出し JSON をプレーンテキストとして出力する場合があります。ネイティブ URL の `baseUrl: "http://host:11434"`（`/v1` なし）を使用してください。
</Warning>

標準の設定キーは `baseUrl` です。OpenAI SDK 形式の例では `baseURL` も使用できますが、
新しい設定では `baseUrl` を使用してください。

## 認証ルール

<AccordionGroup>
  <Accordion title="ローカルおよび LAN ホスト">
    ループバック、プライベートネットワーク、`.local`、およびホスト名のみの Ollama URL には、実際のベアラートークンは必要ありません。OpenClaw はこれらに `ollama-local` マーカーを使用します。
  </Accordion>
  <Accordion title="リモートおよび Ollama Cloud ホスト">
    公開リモートホストおよび `https://ollama.com` には、実際の認証情報（`OLLAMA_API_KEY`、認証プロファイル、またはプロバイダーの `apiKey`）が必要です。ホスト型サービスを直接使用する場合は、`ollama-cloud` プロバイダーを推奨します。
  </Accordion>
  <Accordion title="カスタムプロバイダー ID">
    `api: "ollama"` を持つカスタムプロバイダーにも同じルールが適用されます。たとえば、プライベート LAN ホストを指す `ollama-remote` プロバイダーでは `apiKey: "ollama-local"` を使用できます。サブエージェントは、これを認証情報の欠落として扱わず、Ollama プロバイダーフックを通じてこのマーカーを解決します。埋め込みでその Ollama エンドポイントを使用するように、`agents.defaults.memorySearch.provider` でカスタムプロバイダー ID を指定することもできます。
  </Accordion>
  <Accordion title="認証プロファイル">
    `auth-profiles.json` にはプロバイダー ID の認証情報を保存し、エンドポイント設定（`baseUrl`、`api`、モデル、ヘッダー、タイムアウト）は `models.providers.<id>` に配置します。`{ "ollama-windows": { "apiKey": "ollama-local" } }` などの古いフラットファイルはランタイム形式ではありません。`openclaw doctor --fix` はバックアップを作成し、それらを標準の `ollama-windows:default` API キープロファイルに書き換えます。そのレガシーファイル内の `baseUrl` 値は不要であり、プロバイダー設定に移す必要があります。
  </Accordion>
  <Accordion title="メモリ埋め込みのスコープ">
    Ollama メモリ埋め込みのベアラー認証は、宣言されたホストのみに適用されます。

    - プロバイダーレベルのキーは、そのプロバイダーのホストだけに送信されます。
    - `agents.*.memorySearch.remote.apiKey` は、そのリモート埋め込みホストだけに送信されます。
    - `OLLAMA_API_KEY` 環境変数の値だけが設定されている場合、それは Ollama Cloud の規約として扱われ、デフォルトではローカルまたはセルフホストのホストに送信されません。

  </Accordion>
</AccordionGroup>

## はじめに

<Tabs>
  <Tab title="オンボーディング（推奨）">
    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard
        ```

        **Ollama** を選択してから、**クラウド + ローカル**、**クラウドのみ**、または **ローカルのみ** のいずれかのモードを選択します。

        新規のガイド付きセットアップでは、OpenClaw は最初にデフォルトまたは設定済みの
        Ollama ホストを確認します。インストール済みモデルがツール対応を通知している場合、共通の
        CLI/macOS セットアップ手順がそのモデルを直ちに提示し、実際の
        補完で検証します。この自動確認でモデルがプルされることはありません。適切な
        インストール済みモデルが存在しない場合、オンボーディングは通常の Ollama 選択画面に進みます。
      </Step>
      <Step title="モデルを選択">
        `Cloud only` は `OLLAMA_API_KEY` の入力を求め、ホスト型クラウドのデフォルトを提案します。`Cloud + Local` と `Local only` は Ollama のベース URL の入力を求め、利用可能なモデルを検出し、選択したローカルモデルが存在しない場合は自動的にプルします。`gemma4:latest` など、インストール済みの `:latest` タグは、`gemma4` と重複せず一度だけ表示されます。`Cloud + Local` は、ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
      </Step>
      <Step title="検証">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    非対話形式:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` と `--custom-model-id` は省略可能です。省略すると、ローカルのデフォルトホストと `gemma4` の推奨モデルが使用されます。

  </Tab>

  <Tab title="手動セットアップ">
    <Steps>
      <Step title="Ollama をインストールして起動">
        [ollama.com/download](https://ollama.com/download) から入手し、モデルをプルします。

        ```bash
        ollama pull gemma4
        ```

        ハイブリッドクラウドアクセスを使用するには、同じホストで `ollama signin` を実行します。
      </Step>
      <Step title="認証情報を設定">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # ローカル/LAN ホストでは任意の値を使用可能
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com のみ
        ```

        または設定内で `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"` を指定します。
      </Step>
      <Step title="モデルを選択">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        または設定内で指定します。

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

`Cloud + Local` は、到達可能な 1 つの Ollama ホストを通じてローカルモデルと `:cloud` モデルの両方を
ルーティングします。これは Ollama のハイブリッドフローであり、両方を使用する場合にセットアップ中に選択する
モードです。

OpenClaw はベース URL の入力を求め、ローカルモデルを検出し、
`ollama signin` の状態を確認します。サインイン済みの場合は、ホスト型のデフォルト
（`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`）を提案します。
サインインしていない場合、`ollama signin` を実行するまでセットアップはローカルのみのままです。

ローカルデーモンを使用せずにクラウドのみにアクセスするには、`openclaw onboard --auth-choice ollama-cloud` を使用し、[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。この方法では `ollama signin` も実行中のサーバーも必要ありません。

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 中に表示されるクラウドモデル一覧は、
`https://ollama.com/api/tags` からリアルタイムで取得され、最大 500 件に制限されるため、選択画面には
現在のホスト型カタログが反映されます。セットアップ時に `ollama.com` に到達できないか、モデルが
返されない場合、OpenClaw はハードコードされた推奨リストにフォールバックするため、
オンボーディングは引き続き完了できます。

## モデル検出（暗黙的プロバイダー）

`OLLAMA_API_KEY`（または認証プロファイル）が設定されており、
`models.providers.ollama` も、`api: "ollama"` を持つ別のカスタムプロバイダーも
定義されていない場合、OpenClaw は `http://127.0.0.1:11434` からモデルを検出します。

| 動作             | 詳細                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログの照会        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 機能の検出 | ベストエフォートの `/api/show` が `contextWindow`、`num_ctx` Modelfile パラメーター、および機能（ビジョン/ツール/思考）を読み取ります                                                                                                                                                                       |
| ビジョンモデル        | `/api/show` の `vision` 機能により、モデルが画像対応（`input: ["text", "image"]`）としてマークされます                                                                                                                                                                                             |
| 推論の検出  | 利用可能な場合は `/api/show` の `thinking` 機能を使用します。Ollama が機能情報を省略した場合は、名前によるヒューリスティック（`r1`、`reason`、`reasoning`、`think`）にフォールバックします。`glm-5.2:cloud` と `deepseek-v4-flash\|pro:cloud` は、報告された機能にかかわらず常に推論モデルとして扱われます。 |
| トークン制限         | `maxTokens` のデフォルトは OpenClaw の Ollama 最大トークン上限です                                                                                                                                                                                                                                       |
| コスト                | すべてのコストは `0` です                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

明示的な `models` 配列を持つ `models.providers.ollama`、または
`api: "ollama"` と非ループバックの `baseUrl` を持つカスタムプロバイダーを設定すると、
自動検出は無効になります。その場合、モデルは手動で定義する必要があります
（[設定](#configuration) を参照）。ホスト型の `https://ollama.com` を指す
`models.providers.ollama` エントリも検出をスキップします。Ollama Cloud モデルは
プロバイダーによって管理されるためです。`http://127.0.0.2:11434` などのループバックのカスタムプロバイダーは
引き続きローカルとして扱われ、自動検出が維持されます。

手書きの `models.json` エントリがなくても、
`ollama/<pulled-model>:latest` のような完全な参照を使用できます。OpenClaw がリアルタイムで解決します。サインイン済みの
ホストでは、一覧にない `ollama/<model>:cloud` 参照を選択すると、`/api/show` を使用してその
モデルを厳密に検証し、Ollama がメタデータを確認した場合にのみランタイムカタログへ
追加します。入力ミスは引き続き不明なモデルとして失敗します。

### スモークテスト

エージェントのツールサーフェス全体を省略する限定的なテキストプローブ:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

簡易的なビジョンモデルのプローブには、画像とともに `--file` を追加します（PNG/JPEG/WebP に対応。
画像以外のファイルは Ollama が呼び出される前に拒否されます。音声には
`openclaw infer audio transcribe` を使用してください）。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

どちらの方法でも、チャットツール、メモリ、セッションコンテキストは読み込まれません。これらが成功する一方で
通常のエージェント応答が失敗する場合、問題はエンドポイントではなく、モデルのツールまたはエージェント
能力にある可能性が高いです。

`/model ollama/<model>` によるモデルの選択は、ユーザーによる厳密な選択です。設定された
`baseUrl` に到達できない場合、別の設定済みモデルへ暗黙的にフォールバックせず、
次の応答はプロバイダーエラーで失敗します。

分離された cron ジョブは、エージェントターンを開始する前にローカルの安全性チェックを 1 つ追加します。
選択されたモデルが local/private-network/`.local` の Ollama
プロバイダーに解決され、`/api/tags` に到達できない場合、OpenClaw はその実行を
エラーテキストにモデルを含む `skipped` として記録します。このエンドポイントチェックは
ホストごとに 5 分間キャッシュされるため、停止したデーモンに対する cron ジョブが繰り返されても、
失敗するリクエストがすべて起動されることはありません。

ライブ検証:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud の場合は、同じライブテストをホストされたエンドポイントに向けます（デフォルトでは
埋め込みをスキップします。クラウドキーでは `/api/embed` が許可されていない可能性があるため、
`OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` で強制します）:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

モデルを追加するには、そのモデルを pull すると自動的に検出されます:

```bash
ollama pull mistral
```

## Node ローカル推論

エージェントは、ペアリング済みのデスクトップまたはサーバー Node 上の Ollama モデルに
短いタスクを委任できます。プロンプトと応答は、既存の認証済み
Gateway/Node 接続を通過します。リクエストは Node 自身の loopback Ollama
エンドポイント（`http://127.0.0.1:11434`）で実行されます。

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

    Gateway ホストでデバイスとその Node コマンドを承認してから、確認します:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    初回接続、または Ollama コマンドを追加するアップグレードでは、
    Node コマンドの承認が必要になる場合があります。Node が
    `ollama.models` と `ollama.chat` を通知せずに接続する場合は、
    `openclaw nodes pending` をもう一度確認してください。

  </Step>
  <Step title="エージェントから使用する">
    同梱の Ollama Plugin は `node_inference` ツールを公開します。エージェントは
    まず `action: "discover"` を呼び出し、次にその結果に含まれる Node とモデルを指定して
    `action: "run"` を呼び出します（対応可能な Node が 1 つだけ接続されている場合、
    `run` では Node を省略できます）。例: 「Node 上の Ollama モデルを検出し、
    読み込み済みで最速のモデルを使用してこのテキストを要約してください。」
  </Step>
</Steps>

検出処理は `/api/tags` を読み取り、`/api/show` の機能を確認し、
利用可能な場合は `/api/ps` を使用して、読み込み済みのモデルを優先的に順位付けします。
Ollama がチャット対応（`completion` 機能）として報告するローカルモデルのみを返し、
Ollama Cloud の行と埋め込み専用モデルは除外されます。各実行ではモデルの思考を無効にし、
ツール呼び出しで別の `maxTokens` が要求されない限り、出力はデフォルトで 512 トークン
（上限 8192）です。一部のモデル（GPT-OSS など）は思考の無効化に対応しておらず、
推論トークンを出力する場合があります。

エージェントに公開せずに Node 上で Ollama を実行し続けるには:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node を再起動します（`openclaw node restart`、またはフォアグラウンドセッションの場合は
`openclaw node run` を停止して再実行します）。Node は `ollama.models` と
`ollama.chat` の通知を停止します。Ollama 自体と Gateway の Ollama プロバイダーには
影響しません。再度有効にするには、値を `true` に戻して再起動します。
コマンドサーフェスが変更された場合、再接続後に `openclaw nodes pending` の承認が再び必要になることがあります。

エージェントターンを介さずに、Node コマンドを直接確認します:

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

`--invoke-timeout` は Node がコマンドを実行できる時間の上限を定めます。
`--timeout` は Gateway 呼び出し全体の上限を定めるため、より大きな値にする必要があります。

Node ローカル推論では常に Node 自身の loopback エンドポイントを使用し、
設定済みのリモート/クラウド `models.providers.ollama.baseUrl` は再利用しません。
Node コマンドは macOS、Linux、Windows の Node ホストでデフォルトで利用でき、
通常の Node ペアリング/コマンドポリシーが引き続き適用されます。

## ビジョンと画像の説明

同梱の Ollama Plugin は、Ollama を画像対応の
メディア理解プロバイダーとして登録します。これにより OpenClaw は、明示的な画像説明
リクエストと設定済みの画像モデルのデフォルトを、ローカルまたはホストされた Ollama
ビジョンモデルにルーティングできます。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` は完全な `<provider/model>` 参照である必要があります。設定されている場合、
`infer image
describe` は、ネイティブビジョンにすでに対応しているモデルの説明をスキップせず、
まずそのモデルを試行します。呼び出しが失敗した場合、OpenClaw は
`agents.defaults.imageModel.fallbacks` を通じて処理を続行できます。ファイル/URL の準備エラーは、
フォールバックが試行される前に失敗します。OpenClaw の画像理解フローと設定済みの
`imageModel` には `infer image describe` を使用し、カスタムプロンプトによる未加工の
マルチモーダルプローブには `infer model run
--file` を使用します。

Ollama を受信メディアのデフォルトの画像理解プロバイダーにするには:

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

完全な `ollama/<model>` 参照を推奨します。`qwen2.5vl:7b` のような
プロバイダーなしの `imageModel` 参照が `ollama/qwen2.5vl:7b` に正規化されるのは、
その完全一致するモデルが `models.providers.ollama.models` に
`input: ["text", "image"]` とともに記載され、同じプロバイダーなし ID を公開する他の設定済み
画像プロバイダーがない場合のみです。それ以外の場合は、プロバイダープレフィックスを明示的に使用します。

低速なローカルビジョンモデルでは、クラウドモデルよりも長い画像理解タイムアウトが
必要になる場合があります。また、Ollama がモデルで通知されているビジョンコンテキスト全体を
割り当てようとすると、リソースが限られたハードウェアでクラッシュする可能性があります。
機能タイムアウトを設定し、`num_ctx` に上限を設定します:

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

このタイムアウトは、受信画像の理解と明示的な
`image` ツールに適用されます。通常のモデル呼び出しに対する基盤の Ollama HTTP
リクエストガードは、引き続き `models.providers.ollama.timeoutSeconds` が制御します。

ライブ検証:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` を手動で定義する場合は、ビジョンモデルを
明示的にマークします:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw は、画像対応としてマークされていないモデルへの画像説明リクエストを拒否します。
暗黙的な検出では、これは `/api/show` のビジョン機能から取得されます。

## 設定

<Tabs>
  <Tab title="基本（暗黙的な検出）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されている場合、プロバイダーエントリで `apiKey` を省略できます。OpenClaw が可用性チェック用に補完します。
    </Tip>

  </Tab>

  <Tab title="明示的（手動モデル）">
    ホストされたクラウドのセットアップ、デフォルト以外のホスト/ポート、コンテキストウィンドウの強制、
    または完全に手動のモデルリストには、明示的な設定を使用します:

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
    明示的な設定では自動検出が無効になるため、モデルを列挙する必要があります:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 なし - ネイティブ Ollama API URL
            api: "ollama", // 明示的: ネイティブのツール呼び出し動作を保証
            timeoutSeconds: 300, // 任意: コールド状態のローカルモデル向けに接続/ストリーム時間枠を延長
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 任意: ターン間でモデルを読み込み済みに保つ
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    `/v1` を追加しないでください。このパスでは OpenAI 互換モードが選択され、ツール呼び出しの信頼性が確保されません。
    </Warning>

  </Tab>
</Tabs>

## 一般的なレシピ

モデル ID は、`ollama list` または
`openclaw models list --provider ollama` にある正確な名前に置き換えてください。

<AccordionGroup>
  <Accordion title="自動検出を使用するローカルモデル">
    Gateway と同じマシン上の Ollama が自動的に検出されます:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    手動モデルが必要でない限り、`models.providers.ollama` ブロックを追加しないでください。

  </Accordion>

  <Accordion title="手動モデルを使用する LAN Ollama ホスト">
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

    `contextWindow` は OpenClaw のコンテキスト割り当てです。`params.num_ctx` は
    Ollama に送信されます。ハードウェアでモデルが通知するコンテキスト全体を実行できない場合は、
    両者を一致させてください。

  </Accordion>

  <Accordion title="Ollama Cloud のみ">
    ローカルデーモンを使用せず、ホストされたモデルを直接使用します:

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

    専用の `ollama-cloud` プロバイダー ID をこの形式の代わりに使用する場合は、
    [Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。

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

  <Accordion title="複数の Ollama ホスト">
    複数の Ollama サーバーを実行する場合はカスタムプロバイダー ID を使用します。それぞれに
    独自のホスト、モデル、認証、タイムアウトが割り当てられます。

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

    OpenClaw は Ollama を呼び出す前に、アクティブなプロバイダーのプレフィックスを削除します
    （プレフィックスがない場合は `ollama/` プレフィックスにフォールバックします）。そのため、`ollama-large/qwen3.5:27b` は
    Ollama に `qwen3.5:27b` として渡されます。

  </Accordion>

  <Accordion title="軽量なローカルモデルプロファイル">
    一部のローカルモデルは単純なプロンプトには対応できますが、エージェントの
    ツールサーフェス全体の処理には苦戦します。グローバルなランタイム設定を変更する前に、
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

    モデルまたはサーバーがツールスキーマで確実に
    失敗する場合にのみ `compat.supportsTools: false` を使用してください。安定性と引き換えにエージェントの機能が低下します。
    `localModelLean` は、明示的に必要とされない限り、負荷の高いブラウザー、Cron、メッセージ、メディア生成、
    音声、PDF の各ツールをエージェントの直接的なサーフェスから除外し、
    より大きなカタログをツール検索の背後に配置します。Ollama の
    ランタイムコンテキストや思考モードは変更しません。ループしたり、
    隠れた推論に予算を費やしたりする小規模な Qwen 系思考モデルでは、`params.num_ctx` および
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

カスタムプロバイダー ID も同様に機能します。`ollama-spark/qwen3:32b` のように、アクティブなプロバイダーの
プレフィックスを使用する参照では、OpenClaw は Ollama を
呼び出す前にそのプレフィックスを削除し、`qwen3:32b` を送信します。

低速なローカルモデルでは、エージェントランタイム全体のタイムアウトを延長する前に、
プロバイダー単位のチューニングを優先してください。

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

`timeoutSeconds` は、接続の確立、ヘッダー、
本文のストリーミング、保護付き fetch の全体的な中止を含む、モデルへの HTTP リクエストを対象とします。`params.keep_alive` は
ネイティブの `/api/chat` リクエストでトップレベルの `keep_alive` として転送されます。最初のターンの
読み込み時間がボトルネックとなる場合は、モデルごとに設定してください。

### クイック検証

```bash
# このマシンから参照できる Ollama デーモン
curl http://127.0.0.1:11434/api/tags

# OpenClaw のカタログと選択されたモデル
openclaw models list --provider ollama
openclaw models status

# モデルを直接スモークテスト
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "正確に次のように応答してください: ok"
```

リモートホストの場合は、`127.0.0.1` を `baseUrl` ホストに置き換えてください。`curl` は
動作するのに OpenClaw が動作しない場合は、Gateway が別の
マシン、コンテナ、またはサービスアカウントで実行されていないか確認してください。

## Ollama Web Search

OpenClaw には、`web_search` プロバイダーとして **Ollama Web Search** がバンドルされています。

| プロパティ  | 詳細                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ホスト      | 設定されている場合は `models.providers.ollama.baseUrl`、それ以外は `http://127.0.0.1:11434`。`https://ollama.com` はホスト型 API を直接使用します                          |
| 認証        | サインイン済みのローカルホストではキー不要。`OLLAMA_API_KEY` の直接検索または認証で保護されたホストでは、`https://ollama.com` または設定済みのプロバイダー認証を使用します           |
| 要件        | ローカルまたはセルフホストのホストが実行中で、`ollama signin` でサインインしている必要があります。ホスト型検索を直接利用するには、`baseUrl: "https://ollama.com"` と実際の API キーが必要です |

`openclaw onboard` または `openclaw configure --section web` の実行中に選択するか、次のように設定します。

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

Ollama Cloud 経由でホスト型検索を直接利用する場合:

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

セルフホストのホストの場合、OpenClaw はまずローカルの `/api/experimental/web_search`
プロキシを試し、その後、同じホスト上のホスト型 `/api/web_search` パスにフォールバックします。
通常、サインイン済みのローカルデーモンはローカルプロキシ経由で応答します。`https://ollama.com` の
直接呼び出しでは、常にホスト型の `/api/web_search` エンドポイントを使用します。

<Note>
完全なセットアップと動作については、[Ollama Web Search](/ja-JP/tools/ollama-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="従来の OpenAI 互換モード">
    <Warning>
    **このモードではツール呼び出しの信頼性が低くなります。** プロキシで OpenAI 形式が必要で、ネイティブのツール呼び出しに依存しない場合にのみ使用してください。
    </Warning>

    `/v1/chat/completions` の背後にあるプロキシでは、`api: "openai-completions"` を
    明示的に設定します。

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

    このモードではストリーミングとツール呼び出しを同時にサポートしていない場合があります。
    モデルで `params: { streaming: false }` が必要になることがあります。

    このモードでは、Ollama が暗黙的に 4096 トークンのコンテキストへ
    フォールバックしないように、OpenClaw がデフォルトで `options.num_ctx` を挿入します。プロキシが
    不明な `options` フィールドを拒否する場合は、無効にしてください。

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
    自動検出されたモデルでは、OpenClaw はカスタム
    Modelfile のより大きな `PARAMETER num_ctx` 値を含め、`/api/show` が報告するコンテキストウィンドウを
    使用します。それ以外の場合は、OpenClaw のデフォルトの Ollama コンテキストウィンドウに
    フォールバックします。

    プロバイダーレベルの `contextWindow`、`contextTokens`、`maxTokens` は、
    そのプロバイダー配下のすべてのモデルのデフォルトを設定し、モデルごとに
    オーバーライドできます。`contextWindow` は OpenClaw 独自のプロンプトおよび Compaction の予算です。ネイティブの
    `/api/chat` リクエストでは、`params.num_ctx` を明示的に設定しない限り
    `options.num_ctx` は未設定のままとなり、Ollama は独自のモデル、
    `OLLAMA_CONTEXT_LENGTH`、または VRAM ベースのデフォルトを適用します。無効、ゼロ、負数、
    または有限でない `params.num_ctx` 値は無視されます。古い設定でネイティブリクエストのコンテキストを強制するために
    `contextWindow`/`maxTokens` のみを使用していた場合は、`openclaw doctor --fix` を実行して
    それらを `params.num_ctx` にコピーしてください。OpenAI 互換アダプターは、設定された
    `params.num_ctx` または `contextWindow` から、引き続きデフォルトで `options.num_ctx` を挿入します。
    アップストリームが `options` を拒否する場合は、`injectNumCtxForOpenAICompat: false` で無効にしてください。

    ネイティブモデルのエントリでは、`params` 配下に一般的な Ollama ランタイムオプションも指定できます。
    これらはネイティブの `/api/chat` `options` として転送されます: `num_keep`、`seed`、
    `num_predict`、`top_k`、`top_p`、`min_p`、`typical_p`、`repeat_last_n`、
    `temperature`、`repeat_penalty`、`presence_penalty`、`frequency_penalty`、
    `stop`、`num_batch`、`num_gpu`、`main_gpu`、`use_mmap`、`num_thread`。
    一部のキー（`format`、`keep_alive`、`truncate`、`shift`）は、
    ネストされた `options` ではなく、トップレベルのリクエストフィールドとして転送されます。OpenClaw が
    転送するのはこれらの Ollama リクエストキーのみであるため、`streaming` などの
    ランタイム専用パラメーターが Ollama に送信されることはありません。トップレベルの `think` を設定するには、
    `params.think`（または `params.thinking`）を使用します。`false` は、
    Qwen 系思考モデルの API レベルの思考を無効にします。

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

    モデルごとの `agents.defaults.models["ollama/<model>"].params.num_ctx` も
    機能します。両方が設定されている場合は、明示的なプロバイダーモデルのエントリが優先されます。

  </Accordion>

  <Accordion title="思考の制御">
    OpenClaw は Ollama が期待する形式で思考を転送します。`options.think` ではなく、トップレベルの `think` です。
    `/api/show` が `thinking` 機能を報告する自動検出モデルでは、
    `/think low`、`/think medium`、`/think high`、`/think max` を使用できます。
    思考モデルでないモデルでは、`/think off` のみを使用できます。

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

    モデルごとの `params.think`/`params.thinking` で、特定のモデルについて API の
    thinking を無効化または強制できます。アクティブな実行に暗黙の
    `off` デフォルトしかない場合、OpenClaw はその明示的な設定を維持します。
    `/think medium` などのオフ以外のランタイムコマンドは、引き続きその設定を上書きします。
    明示的に `reasoning: false` と指定されたモデルには、真と評価される thinking
    リクエストは送信されません。`think: false` リクエストは常に送信されます。

  </Accordion>

  <Accordion title="推論モデル">
    `deepseek-r1`、`reasoning`、`reason`、または `think` という名前のモデルは、
    デフォルトで推論対応として扱われます。追加設定は不要です。

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="モデルのコスト">
    Ollama はローカルで実行され、無料であるため、自動検出されたモデルと
    手動定義されたモデルの両方で、すべてのモデルコストは `0` です。
  </Accordion>

  <Accordion title="メモリ埋め込み">
    バンドルされた Ollama Plugin は、[メモリ検索](/ja-JP/concepts/memory)用のメモリ埋め込みプロバイダーを登録します。
    設定された Ollama のベース URL と API キーを使用し、`/api/embed` を呼び出します。
    可能な場合は、複数のメモリチャンクを 1 つの `input` リクエストにまとめます。

    `proxy.enabled=true` の場合、設定された `baseUrl` から導出された完全一致のホストローカル
    local loopback オリジンへの埋め込みリクエストでは、管理対象のフォワードプロキシではなく、
    OpenClaw の保護された直接パスが使用されます。設定されたホスト名自体が
    `localhost` またはループバック IP リテラルである必要があります。単にループバックへ解決される
    DNS 名では、引き続き管理対象プロキシのパスが使用されます。LAN、tailnet、プライベートネットワーク、
    および公開 Ollama ホストでは常に管理対象プロキシのパスが使用され、別のホストやポートへの
    リダイレクトに信頼は引き継がれません。`proxy.loopbackMode: "proxy"` ではループバックトラフィックも
    プロキシ経由でルーティングされます。`proxy.loopbackMode: "block"` では接続前に拒否されます。
    [管理対象プロキシ](/ja-JP/security/network-proxy#gateway-loopback-mode)を参照してください。

    | プロパティ | 値 |
    | --- | --- |
    | デフォルトモデル | `nomic-embed-text` |
    | 自動プル | ローカルに存在しない場合は有効 |
    | デフォルトのインライン同時実行数 | 1（他のプロバイダーではデフォルト値がより高くなります。ホストに余裕がある場合は `nonBatchConcurrency` で増やしてください） |

    クエリ時の埋め込みでは、それを必要または推奨するモデル向けに検索プレフィックスを使用します。
    対象は `nomic-embed-text`、`qwen3-embedding`、および
    `mxbai-embed-large` です。ドキュメントのバッチは未加工のままなので、既存のインデックスに
    形式移行は不要です。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Ollama のデフォルトです。再インデックスが遅すぎる場合は、大規模なホストで増やしてください。
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
    Ollama はデフォルトで **ネイティブ API**（`/api/chat`）を使用します。
    ストリーミングとツール呼び出しを同時にサポートするため、特別な設定は不要です。

    ネイティブリクエストでは、thinking の制御が直接転送されます。明示的な
    `params.think`/`params.thinking` が設定されていない限り、`/think off`
    と `openclaw agent --thinking off` はトップレベルの `think: false` を送信します。
    `/think
    low|medium|high` は対応する effort 文字列を送信します。`/think max` は
    Ollama の最高 effort である `think: "high"` にマッピングされます。

    <Tip>
    代わりに OpenAI 互換エンドポイントを使用する場合は、前述の「従来の OpenAI 互換モード」を参照してください。そこではストリーミングとツール呼び出しが同時に動作しない場合があります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="WSL2 のクラッシュループ（再起動の繰り返し）">
    NVIDIA/CUDA を使用する WSL2 では、公式 Ollama Linux インストーラーによって
    `Restart=always` を指定した `ollama.service` systemd ユニットが作成されます。
    そのサービスが自動起動し、WSL2 の起動中に GPU 対応モデルを読み込むと、
    Ollama は読み込み中にホストメモリを固定することがあります。Hyper-V のメモリ回収では
    それらのページを常に回収できるとは限らないため、Windows が WSL2 VM を終了し、
    systemd が Ollama を再起動して、このループが繰り返される場合があります。

    根拠となる兆候は、WSL2 の再起動や終了が繰り返されること、WSL2 の起動直後に
    `app.slice` または `ollama.service` の CPU 使用率が高くなること、
    および Linux の OOM killer ではなく systemd から SIGTERM が送られることです。

    OpenClaw は、WSL2、`Restart=always` を指定して有効化された
    `ollama.service`、および可視の CUDA マーカーを検出すると、起動時に警告を記録します。

    対処方法：

    ```bash
    sudo systemctl disable ollama
    ```

    Windows 側では、次の内容を `%USERPROFILE%\.wslconfig` に追加してから、
    `wsl --shutdown` を実行します。

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    または、keep-alive を短くするか、必要な場合にのみ Ollama を手動で起動します。

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)を参照してください。

  </Accordion>

  <Accordion title="Ollama が検出されない">
    Ollama が実行中であり、`OLLAMA_API_KEY`（または認証プロファイル）が設定され、
    `models.providers.ollama` が明示的に定義されて**いない**ことを確認します。

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="利用可能なモデルがない">
    モデルをローカルにプルするか、`models.providers.ollama` で明示的に定義します。

    ```bash
    ollama list  # インストール済みのものを確認
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # または別のモデル
    ```

  </Accordion>

  <Accordion title="接続が拒否される">
    ```bash
    # Ollama が実行中か確認
    ps aux | grep ollama

    # または Ollama を再起動
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

    - `baseUrl` が `localhost` を指しているものの、Gateway が Docker 内または別のホストで実行されている。
    - URL が `/v1` を使用しており、ネイティブ Ollama ではなく OpenAI 互換の動作が選択されている。
    - リモートホストでファイアウォールまたは LAN バインドの変更が必要である。
    - モデルがノート PC のデーモンには存在するが、リモート側には存在しない。

  </Accordion>

  <Accordion title="モデルがツール JSON をテキストとして出力する">
    通常、プロバイダーが OpenAI 互換モードになっているか、モデルが
    ツールスキーマを処理できないことが原因です。ネイティブモードを推奨します。

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

    小規模なローカルモデルが依然としてツールスキーマで失敗する場合は、
    そのモデルエントリに `compat.supportsTools: false` を設定して再テストしてください。

  </Accordion>

  <Accordion title="Kimi または GLM が文字化けした記号を返す">
    ホスト型 Kimi/GLM の応答が言語として意味をなさない長い記号列である場合、
    成功した応答ではなく、失敗したプロバイダー呼び出しとして扱われます。
    これにより、破損したテキストをセッションへ永続化する代わりに、通常の
    再試行、フォールバック、エラー処理が実行されます。

    再発する場合は、モデル名、現在のセッションファイル、および実行で
    `Cloud + Local` と `Cloud only` のどちらを使用したかを記録し、
    新しいセッションとフォールバックモデルを試してください。

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="コールド状態のローカルモデルがタイムアウトする">
    大規模なローカルモデルでは、初回読み込みに時間がかかる場合があります。
    タイムアウトのスコープを Ollama プロバイダーに限定し、必要に応じて
    ターン間もモデルを読み込んだ状態に保ちます。

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

    ホスト自体が接続を受け付けるまでに時間がかかる場合、`timeoutSeconds` により、
    このプロバイダーの保護された接続タイムアウトも延長されます。

  </Accordion>

  <Accordion title="大コンテキストモデルが遅すぎる、またはメモリ不足になる">
    多くのモデルは、ハードウェアで無理なく実行できるサイズを超えるコンテキストを
    公称値として提示しています。`params.num_ctx` が設定されていない限り、
    ネイティブ Ollama は独自のランタイムデフォルトを使用します。最初のトークンまでの
    レイテンシーを予測可能にするため、OpenClaw の予算と Ollama のリクエストコンテキストの
    両方に上限を設定します。

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

    OpenClaw が送信するプロンプトが多すぎる場合は、`contextWindow` を小さくします。
    Ollama のランタイムコンテキストがマシンに対して大きすぎる場合は、
    `params.num_ctx` を小さくします。生成に時間がかかりすぎる場合は、
    `maxTokens` を小さくします。

  </Accordion>
</AccordionGroup>

<Note>
詳細なヘルプについては、[トラブルシューティング](/ja-JP/help/troubleshooting)と[よくある質問](/ja-JP/help/faq)を参照してください。
</Note>

## 関連項目

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ja-JP/providers/ollama-cloud" icon="cloud">
    専用の `ollama-cloud` プロバイダーを使用するクラウド専用セットアップ。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/models" icon="brain">
    モデルを選択して設定する方法。
  </Card>
  <Card title="Ollama Web 検索" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollama を利用した Web 検索の完全なセットアップと動作の詳細。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
