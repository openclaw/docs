---
read_when:
    - Ollama 経由でクラウドまたはローカルモデルを使って OpenClaw を実行したい
    - Ollama のセットアップと構成のガイダンスが必要です
    - 画像理解には Ollama のビジョンモデルを使いたい
summary: OllamaでOpenClawを実行する（クラウドとローカルモデル）
title: Ollama
x-i18n:
    generated_at: "2026-07-05T11:45:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11984ebca98d7b98f1c89e6820fd29524ec41a38ca4a403260e322dbf55a75e2
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw は OpenAI 互換の `/v1` エンドポイントではなく、Ollama のネイティブ API (`/api/chat`) と通信します。3 つのモードがサポートされています。

| モード          | 使用するもの                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| クラウド + ローカル | 到達可能な Ollama ホスト。ローカルモデルと、サインイン済みの場合は `:cloud` モデルを提供 |
| クラウドのみ    | ローカルデーモンなしで `https://ollama.com` に直接接続                                   |
| ローカルのみ    | 到達可能な Ollama ホスト。ローカルモデルのみ                                       |

専用の `ollama-cloud` プロバイダー ID を使うクラウドのみのセットアップについては、
[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。クラウドのルーティングを
ローカルの `ollama` プロバイダーと分けておきたい場合は、`ollama-cloud/<model>` 参照を使用します。

<Warning>
`/v1` OpenAI 互換 URL (`http://host:11434/v1`) は使用しないでください。ツール呼び出しが壊れ、モデルが生のツール呼び出し JSON をプレーンテキストとして出力することがあります。ネイティブ URL を使用してください: `baseUrl: "http://host:11434"` (`/v1` なし)。
</Warning>

正規の設定キーは `baseUrl` です。OpenAI SDK 形式の例向けに `baseURL` も受け付けますが、新しい設定では `baseUrl` を使用してください。

## 認証ルール

<AccordionGroup>
  <Accordion title="ローカルおよび LAN ホスト">
    ループバック、プライベートネットワーク、`.local`、ベアホスト名の Ollama URL には、実際の bearer トークンは不要です。OpenClaw はこれらに `ollama-local` マーカーを使用します。
  </Accordion>
  <Accordion title="リモートおよび Ollama Cloud ホスト">
    公開リモートホストと `https://ollama.com` には、実際の認証情報が必要です: `OLLAMA_API_KEY`、認証プロファイル、またはプロバイダーの `apiKey`。直接ホスト型として使う場合は、`ollama-cloud` プロバイダーを推奨します。
  </Accordion>
  <Accordion title="カスタムプロバイダー ID">
    `api: "ollama"` を持つカスタムプロバイダーは同じルールに従います。たとえば、プライベート LAN ホストを指す `ollama-remote` プロバイダーでは `apiKey: "ollama-local"` を使用できます。サブエージェントは、そのマーカーを認証情報の欠落として扱うのではなく、Ollama プロバイダーフックを通じて解決します。`agents.defaults.memorySearch.provider` もカスタムプロバイダー ID を指せるため、埋め込みでその Ollama エンドポイントを使用できます。
  </Accordion>
  <Accordion title="認証プロファイル">
    `auth-profiles.json` はプロバイダー ID の認証情報を保存します。エンドポイント設定 (`baseUrl`、`api`、モデル、ヘッダー、タイムアウト) は `models.providers.<id>` に入れてください。`{ "ollama-windows": { "apiKey": "ollama-local" } }` のような古いフラットファイルはランタイム形式ではありません。`openclaw doctor --fix` は、それらをバックアップ付きの正規の `ollama-windows:default` API キープロファイルへ書き換えます。そのレガシーファイル内の `baseUrl` 値はノイズであり、プロバイダー設定へ移す必要があります。
  </Accordion>
  <Accordion title="メモリ埋め込みのスコープ">
    Ollama メモリ埋め込みの bearer 認証は、それが宣言されたホストに限定されます。

    - プロバイダーレベルのキーは、そのプロバイダーのホストにのみ送信されます。
    - `agents.*.memorySearch.remote.apiKey` は、そのリモート埋め込みホストにのみ送信されます。
    - 純粋な `OLLAMA_API_KEY` env 値は Ollama Cloud の慣例として扱われ、デフォルトではローカル/セルフホスト型ホストには送信されません。

  </Accordion>
</AccordionGroup>

## はじめに

<Tabs>
  <Tab title="オンボーディング (推奨)">
    <Steps>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard
        ```

        **Ollama** を選択し、モードを選びます: **クラウド + ローカル**、**クラウドのみ**、または **ローカルのみ**。
      </Step>
      <Step title="モデルを選択">
        `Cloud only` は `OLLAMA_API_KEY` の入力を促し、ホスト型クラウドのデフォルトを提案します。`Cloud + Local` と `Local only` は Ollama ベース URL の入力を促し、利用可能なモデルを検出し、選択されたローカルモデルが存在しない場合は自動で pull します。`gemma4:latest` のようなインストール済みの `:latest` タグは、`gemma4` を重複表示せず 1 回だけ表示されます。`Cloud + Local` は、ホストがクラウドアクセス用にサインイン済みかどうかも確認します。
      </Step>
      <Step title="検証">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    非対話型:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url` と `--custom-model-id` は任意です。省略すると、ローカルのデフォルトホストと `gemma4` の推奨モデルが使用されます。

  </Tab>

  <Tab title="手動セットアップ">
    <Steps>
      <Step title="Ollama をインストールして起動">
        [ollama.com/download](https://ollama.com/download) から入手し、モデルを pull します。

        ```bash
        ollama pull gemma4
        ```

        ハイブリッドクラウドアクセスでは、同じホストで `ollama signin` を実行します。
      </Step>
      <Step title="認証情報を設定">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # local/LAN host, any value works
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com only
        ```

        または設定で: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`。
      </Step>
      <Step title="モデルを選択">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        または設定で:

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

`Cloud + Local` は、ローカルモデルと `:cloud` モデルの両方を、到達可能な 1 つの Ollama ホスト経由でルーティングします。これは Ollama のハイブリッドフローであり、両方を使いたい場合にセットアップ中に選ぶモードです。

OpenClaw はベース URL の入力を促し、ローカルモデルを検出し、`ollama signin` の状態を確認します。サインイン済みの場合、ホスト型のデフォルト (`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`、`glm-5.2:cloud`) を提案します。サインインしていない場合、`ollama signin` を実行するまでセットアップはローカルのみのままです。

ローカルデーモンなしでクラウドのみのアクセスを行うには、`openclaw onboard --auth-choice ollama-cloud` を使用し、[Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。この経路では `ollama signin` も実行中のサーバーも不要です。

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 中に表示されるクラウドモデルリストは、`https://ollama.com/api/tags` からライブで取得され、500 件に制限されます。そのため、ピッカーには現在のホスト型カタログが反映されます。セットアップ時に `ollama.com` に到達できない、またはモデルが返されない場合、OpenClaw はハードコードされた推奨リストにフォールバックするため、オンボーディングは完了できます。

## モデル検出 (暗黙のプロバイダー)

`OLLAMA_API_KEY` (または認証プロファイル) が設定されており、`models.providers.ollama` も `api: "ollama"` を持つ別のカスタムプロバイダーも定義されていない場合、OpenClaw は `http://127.0.0.1:11434` からモデルを検出します。

| 動作             | 詳細                                                                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| カタログクエリ        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 機能検出 | ベストエフォートで `/api/show` が `contextWindow`、`num_ctx` Modelfile パラメーター、機能 (vision/tools/thinking) を読み取ります                                                                                                                                                                       |
| Vision モデル        | `/api/show` からの `vision` 機能により、そのモデルは画像対応 (`input: ["text", "image"]`) とマークされます                                                                                                                                                                                             |
| 推論検出  | 利用可能な場合は `/api/show` からの `thinking` 機能を使用します。Ollama が機能を省略した場合は、名前のヒューリスティック (`r1`、`reason`、`reasoning`、`think`) にフォールバックします。`glm-5.2:cloud` と `deepseek-v4-flash\|pro:cloud` は、報告された機能に関係なく常に推論モデルとして扱われます。 |
| トークン制限         | `maxTokens` のデフォルトは OpenClaw の Ollama 最大トークン上限です                                                                                                                                                                                                                                       |
| コスト                | すべてのコストは `0` です                                                                                                                                                                                                                                                                             |

```bash
ollama list
openclaw models list
```

明示的な `models` 配列を持つ `models.providers.ollama`、または `api: "ollama"` と非ループバックの `baseUrl` を持つカスタムプロバイダーを設定すると、自動検出は無効になります。その場合、モデルは手動で定義する必要があります ([設定](#configuration) を参照)。ホスト型の `https://ollama.com` を指す `models.providers.ollama` エントリも、Ollama Cloud モデルはプロバイダー管理のため、検出をスキップします。`http://127.0.0.2:11434` のようなループバックのカスタムプロバイダーは引き続きローカルとして扱われ、自動検出を維持します。

手書きの `models.json` エントリなしで、`ollama/<pulled-model>:latest` のような完全な参照を使用できます。OpenClaw はそれをライブで解決します。サインイン済みホストでは、一覧にない `ollama/<model>:cloud` 参照を選択すると、`/api/show` でその正確なモデルを検証し、Ollama がメタデータを確認した場合にのみランタイムカタログへ追加します。タイプミスは引き続き不明なモデルとして失敗します。

### スモークテスト

完全なエージェントツールサーフェスをスキップする狭いテキストプローブ:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

軽量な vision モデルプローブには画像付きで `--file` を追加します (PNG/JPEG/WebP を受け付けます。非画像ファイルは Ollama が呼び出される前に拒否されます。音声には `openclaw infer audio transcribe` を使用してください)。

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

どちらの経路も、チャットツール、メモリ、セッションコンテキストを読み込みません。これが成功する一方で通常のエージェント応答が失敗する場合、問題はエンドポイントではなく、モデルのツール/エージェント能力である可能性が高いです。

`/model ollama/<model>` でモデルを選択することは、ユーザーの厳密な選択です。設定された `baseUrl` に到達できない場合、次の応答は別の設定済みモデルへ黙ってフォールバックするのではなく、プロバイダーエラーで失敗します。

分離された cron ジョブは、エージェントターンを開始する前に 1 つのローカル安全チェックを追加します。選択されたモデルがローカル/プライベートネットワーク/`.local` の Ollama プロバイダーに解決され、`/api/tags` に到達できない場合、OpenClaw はその実行をエラーテキスト内のモデル付きで `skipped` として記録します。このエンドポイントチェックはホストごとに 5 分間キャッシュされるため、停止したデーモンに対する繰り返しの cron ジョブがすべて失敗リクエストを起動することはありません。

ライブ検証:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud では、同じライブテストをホストされたエンドポイントに向けます（デフォルトでは
embeddings をスキップします。クラウドキーでは `/api/embed` が許可されない場合があるため、
強制するには `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1` を指定します）。

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

モデルを追加するには、pull すると自動的に検出されます。

```bash
ollama pull mistral
```

## Node ローカル推論

エージェントは、短いタスクをペアリング済みのデスクトップまたは
サーバーノード上の Ollama モデルに委任できます。プロンプトと応答は、既存の認証済み
Gateway/ノード接続を通過します。リクエストはノード自身の loopback Ollama
エンドポイント（`http://127.0.0.1:11434`）で実行されます。

<Steps>
  <Step title="ノードで Ollama を起動する">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="ノードホストを接続する">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Gateway ホストでデバイスとそのノードコマンドを承認し、次に確認します。

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    初回接続、または Ollama コマンドを追加するアップグレードでは、
    ノードコマンドの承認が必要になる場合があります。ノードが
    `ollama.models` と `ollama.chat` を広告せずに接続された場合は、
    `openclaw nodes pending` をもう一度確認してください。

  </Step>
  <Step title="エージェントから使用する">
    バンドル済みの Ollama Plugin は `node_inference` ツールを公開します。エージェントは
    最初に `action: "discover"` を呼び出し、次にその結果のノードとモデルを使って
    `action: "run"` を呼び出します（対応ノードが 1 つだけ接続されている場合、`run` はノードを省略できます）。
    例: 「ノード上の Ollama モデルを検出し、読み込み済みで最速のモデルを使ってこのテキストを要約してください。」
  </Step>
</Steps>

検出では `/api/tags` を読み取り、`/api/show` の機能を確認し、利用可能な場合は
`/api/ps` を使って、すでに読み込まれているモデルを優先的に順位付けします。返されるのは、
Ollama がチャット対応（`completion` capability）として報告するローカルモデルのみです。
Ollama Cloud の行と embedding 専用モデルは除外されます。各実行ではモデルの thinking を無効化し、
ツール呼び出しが別の `maxTokens` を要求しない限り、出力はデフォルトで 512 tokens
（ハード上限 8192）になります。一部のモデル（たとえば GPT-OSS）は thinking の無効化に対応しておらず、
reasoning tokens を出力する場合があります。

エージェントに公開せずにノード上で Ollama を実行し続けるには、次のようにします。

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

ノードを再起動します（`openclaw node restart`、またはフォアグラウンドセッションでは
`openclaw node run` を停止して再実行します）。ノードは `ollama.models` と
`ollama.chat` の広告を停止します。Ollama 自体と Gateway の Ollama provider には影響しません。
再有効化するには値を `true` に戻して再起動します。コマンドサーフェスが変更された場合、
再接続後に再び `openclaw nodes pending` の承認が必要になることがあります。

エージェントターンなしでノードコマンドを直接確認します。

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

`--invoke-timeout` は、ノードがコマンドを実行できる時間を制限します。
`--timeout` は Gateway 呼び出し全体を制限し、より大きい値にする必要があります。

Node ローカル推論は常にノード自身の loopback エンドポイントを使用します。
設定済みのリモート/クラウド `models.providers.ollama.baseUrl` は再利用しません。
ノードコマンドは macOS、Linux、Windows のノードホストでデフォルトで利用可能で、
通常のノードペアリング/コマンドポリシーの対象のままです。

## Vision と画像説明

バンドル済みの Ollama Plugin は、Ollama を画像対応の
メディア理解 provider として登録するため、OpenClaw は明示的な画像説明リクエストと、
設定済みの画像モデルデフォルトをローカルまたはホストされた Ollama vision モデルにルーティングできます。

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` は完全な `<provider/model>` ref である必要があります。設定された場合、
`infer image describe` は、すでにネイティブ vision に対応しているモデルの説明をスキップする代わりに、
そのモデルを最初に試します。呼び出しが失敗した場合、OpenClaw は
`agents.defaults.imageModel.fallbacks` を通じて続行できます。ファイル/URL の準備エラーは、
fallback が試行される前に失敗します。OpenClaw の画像理解フローと設定済みの `imageModel` には
`infer image describe` を使用します。カスタムプロンプトによる生のマルチモーダル検査には
`infer model run --file` を使用します。

インバウンドメディア用のデフォルト画像理解 provider として Ollama を使用するには、次のようにします。

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

完全な `ollama/<model>` ref を推奨します。`qwen2.5vl:7b` のような裸の `imageModel` ref は、
その正確なモデルが `models.providers.ollama.models` の下に
`input: ["text", "image"]` として一覧表示され、同じ裸の id を公開する他の設定済み画像 provider がない場合にのみ
`ollama/qwen2.5vl:7b` に正規化されます。それ以外の場合は provider prefix を明示的に使用してください。

遅いローカル vision モデルでは、クラウドモデルより長い画像理解タイムアウトが必要になることがあります。
また、Ollama がモデルの広告された vision context 全体を割り当てようとすると、
制約のあるハードウェアでクラッシュする可能性があります。capability timeout を設定し、`num_ctx` を制限します。

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

このタイムアウトは、インバウンド画像理解と明示的な `image` ツールに適用されます。
`models.providers.ollama.timeoutSeconds` は引き続き、通常のモデル呼び出しに対する
基礎となる Ollama HTTP リクエストガードを制御します。

ライブ検証:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models` を手動で定義する場合は、vision モデルを明示的にマークしてください。

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
暗黙的検出では、これは `/api/show` の vision capability から取得されます。

## 設定

<Tabs>
  <Tab title="基本（暗黙的検出）">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY` が設定されている場合、provider entry の `apiKey` は省略できます。OpenClaw は可用性チェック用にそれを補完します。
    </Tip>

  </Tab>

  <Tab title="明示的（手動モデル）">
    ホストされたクラウド設定、デフォルト以外のホスト/ポート、強制的な
    context window、または完全に手動のモデル一覧には、明示的な設定を使用します。

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
    明示的な設定では自動検出が無効になるため、モデルを一覧表示する必要があります。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
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
    `/v1` を追加しないでください。そのパスは OpenAI 互換モードを選択し、tool calling が信頼できなくなります。
    </Warning>

  </Tab>
</Tabs>

## よく使うレシピ

モデル ID は、`ollama list` または
`openclaw models list --provider ollama` の正確な名前に置き換えてください。

<AccordionGroup>
  <Accordion title="自動検出を使うローカルモデル">
    Gateway と同じマシン上の Ollama は、自動的に検出されます。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    手動モデルが必要な場合を除き、`models.providers.ollama` ブロックを追加しないでください。

  </Accordion>

  <Accordion title="手動モデルを使う LAN Ollama ホスト">
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

    `contextWindow` は OpenClaw の context 予算です。`params.num_ctx` は
    Ollama に送信されます。ハードウェアがモデルの広告された context 全体を実行できない場合は、
    これらを揃えてください。

  </Accordion>

  <Accordion title="Ollama Cloud のみ">
    ローカルデーモンなしで、ホストされたモデルを直接使用します。

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

    この形ではなく専用の `ollama-cloud` provider id を使う場合は、
    [Ollama Cloud](/ja-JP/providers/ollama-cloud) を参照してください。

  </Accordion>

  <Accordion title="サインイン済みデーモン経由のクラウドとローカル">
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
    複数の Ollama サーバーを実行する場合のカスタムプロバイダー ID。それぞれが独自の
    ホスト、モデル、認証、タイムアウトを持ちます。

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

    OpenClaw は Ollama を呼び出す前にアクティブなプロバイダープレフィックスを取り除きます
    （ベアな `ollama/` プレフィックスにフォールバックします）。そのため `ollama-large/qwen3.5:27b`
    は Ollama には `qwen3.5:27b` として届きます。

  </Accordion>

  <Accordion title="軽量なローカルモデルプロファイル">
    一部のローカルモデルは単純なプロンプトを処理できますが、完全なエージェントの
    ツールサーフェスでは苦戦します。グローバルなランタイム設定に触れる前に、
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

    `compat.supportsTools: false` は、モデルまたはサーバーがツールスキーマで確実に
    失敗する場合にのみ使用してください。安定性と引き換えにエージェント機能が制限されます。
    `localModelLean` は、ブラウザー、cron、メッセージツールを
    直接のエージェントサーフェスから取り除きます（実行に直接メッセージ配信の
    セマンティクスが必要な場合、message は残ります）。また、より大きなカタログを Tool Search の背後に置きますが、
    Ollama のランタイムコンテキストや思考モードは変更しません。ループしたり隠れた推論に予算を費やしたりする小さな Qwen スタイルの
    思考モデルでは、`params.num_ctx` と `params.thinking: false` を組み合わせてください。

  </Accordion>
</AccordionGroup>

### モデル選択

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

カスタムプロバイダー ID も同じように動作します。`ollama-spark/qwen3:32b` のように
アクティブなプロバイダープレフィックスを使う参照では、OpenClaw は Ollama を
呼び出す前にそのプレフィックスを取り除き、`qwen3:32b` を送信します。

遅いローカルモデルでは、エージェントランタイム全体のタイムアウトを引き上げる前に、
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

`timeoutSeconds` はモデルの HTTP リクエストを対象にします。接続のセットアップ、ヘッダー、
ボディストリーミング、保護された fetch の合計中断時間が含まれます。`params.keep_alive` は
ネイティブの `/api/chat` リクエストでトップレベルの `keep_alive` として
転送されます。初回ターンのロード時間がボトルネックの場合はモデルごとに設定してください。

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

リモートホストでは、`127.0.0.1` を `baseUrl` のホストに置き換えてください。`curl`
は動作するのに OpenClaw が動作しない場合は、Gateway が別の
マシン、コンテナー、またはサービスアカウントで実行されていないか確認してください。

## Ollama Web Search

OpenClaw は **Ollama Web Search** を `web_search` プロバイダーとしてバンドルしています。

| プロパティ  | 詳細                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ホスト      | 設定されている場合は `models.providers.ollama.baseUrl`、それ以外は `http://127.0.0.1:11434`。`https://ollama.com` はホスト型 API を直接使用します                          |
| 認証        | サインイン済みのローカルホストではキー不要。直接の `https://ollama.com` 検索または認証保護されたホストでは `OLLAMA_API_KEY` または設定済みのプロバイダー認証           |
| 要件        | ローカル/セルフホスト型ホストは実行中で、`ollama signin` でサインイン済みである必要があります。直接ホスト型検索には `baseUrl: "https://ollama.com"` と実際の API キーが必要です |

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

セルフホスト型ホストの場合、OpenClaw はまずローカルの `/api/experimental/web_search`
プロキシを試し、その後、同じホスト上のホスト型 `/api/web_search` パスにフォールバックします。
サインイン済みのローカルデーモンは通常、ローカルプロキシ経由で応答します。直接の
`https://ollama.com` 呼び出しは常にホスト型の `/api/web_search` エンドポイントを使用します。

<Note>
完全なセットアップと動作については、[Ollama Web Search](/ja-JP/tools/ollama-search) を参照してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="レガシー OpenAI 互換モード">
    <Warning>
    **このモードではツール呼び出しは信頼できません。** プロキシが OpenAI 形式を必要とし、ネイティブのツール呼び出しに依存しない場合にのみ使用してください。
    </Warning>

    `/v1/chat/completions` の背後にあるプロキシでは、`api: "openai-completions"` を明示的に設定します。

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

    このモードでは、ストリーミングとツール呼び出しを同時にサポートしない場合があります。
    モデルに `params: { streaming: false }` が必要になることがあります。

    OpenClaw はこのモードでデフォルトで `options.num_ctx` を挿入するため、Ollama が
    4096 トークンのコンテキストへ暗黙にフォールバックすることを防ぎます。プロキシが
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
    自動検出されたモデルでは、OpenClaw は `/api/show` が報告するコンテキストウィンドウを使用します。
    これには、カスタム Modelfile からのより大きな `PARAMETER num_ctx` 値も含まれます。
    それ以外の場合は、OpenClaw のデフォルトの Ollama コンテキストウィンドウにフォールバックします。

    プロバイダーレベルの `contextWindow`、`contextTokens`、`maxTokens` は、
    そのプロバイダー配下のすべてのモデルのデフォルトを設定し、モデルごとに上書きできます。
    `contextWindow` は OpenClaw 独自のプロンプト/Compaction 予算です。ネイティブの
    `/api/chat` リクエストでは、`params.num_ctx` を明示的に設定しない限り
    `options.num_ctx` は未設定のままになるため、Ollama は独自のモデル、
    `OLLAMA_CONTEXT_LENGTH`、または VRAM ベースのデフォルトを適用します。無効、ゼロ、負、
    または有限でない `params.num_ctx` 値は無視されます。古い設定で
    `contextWindow`/`maxTokens` のみを使ってネイティブリクエストのコンテキストを強制していた場合は、
    `openclaw doctor --fix` を実行して、それらを `params.num_ctx` にコピーしてください。
    OpenAI 互換アダプターは、設定された `params.num_ctx` または `contextWindow` から
    デフォルトで引き続き `options.num_ctx` を挿入します。アップストリームが `options` を拒否する場合は、
    `injectNumCtxForOpenAICompat: false` で無効にしてください。

    ネイティブモデルエントリは、`params` 配下で一般的な Ollama ランタイムオプションも受け入れます。
    これらはネイティブの `/api/chat` の `options` として転送されます: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap`, `num_thread`。
    いくつかのキー（`format`, `keep_alive`, `truncate`, `shift`）は、ネストされた
    `options` ではなくトップレベルのリクエストフィールドとして転送されます。OpenClaw は
    これらの Ollama リクエストキーのみを転送するため、`streaming` のようなランタイム専用の params は
    Ollama に送信されません。トップレベルの `think` を設定するには `params.think`（または
    `params.thinking`）を使用します。`false` は Qwen スタイルの思考モデルで API レベルの
    思考を無効にします。

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
    動作します。両方が設定されている場合は、明示的なプロバイダーモデルエントリが優先されます。

  </Accordion>

  <Accordion title="思考制御">
    OpenClaw は Ollama が期待する形式で思考を転送します。`options.think` ではなく、
    トップレベルの `think` です。`/api/show` が `thinking` 機能を報告する
    自動検出モデルは、`/think low`、`/think medium`、`/think high`、
    `/think max` を公開します。非思考モデルは `/think off` のみを公開します。

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

    モデルごとの `params.think`/`params.thinking` で、特定のモデルについて API
    の思考を無効化または強制できます。OpenClaw は、アクティブな実行に暗黙の
    `off` デフォルトしかない場合、その明示的な設定を保持します。`/think medium`
    のような `off` 以外のランタイムコマンドは引き続きそれを上書きします。明示的に
    `reasoning: false` とマークされたモデルには、truthy な thinking リクエストは送信されません。
    `think: false` リクエストは常に送信されます。

  </Accordion>

  <Accordion title="Reasoning models">
    `deepseek-r1`、`reasoning`、`reason`、または `think` という名前のモデルは、
    デフォルトで reasoning 対応として扱われます。追加設定は不要です。

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model costs">
    Ollama はローカルで実行され無料なので、自動検出されたモデルと手動定義されたモデルの
    どちらも、すべてのモデルコストは `0` です。
  </Accordion>

  <Accordion title="Memory embeddings">
    同梱の Ollama Plugin は、[メモリ検索](/ja-JP/concepts/memory) 用のメモリ埋め込みプロバイダーを登録します。
    設定された Ollama ベース URL と API キーを使用し、`/api/embed` を呼び出し、
    可能な場合は複数のメモリチャンクを 1 つの `input` リクエストにバッチ化します。

    `proxy.enabled=true` の場合、設定された `baseUrl` から導出される正確なホストローカル
    ループバックオリジンへの埋め込みリクエストは、管理対象の転送プロキシではなく、
    OpenClaw の保護された直接パスを使用します。設定されたホスト名自体が `localhost`
    またはループバック IP リテラルである必要があります。単にループバックに解決される DNS 名は、
    引き続き管理対象プロキシパスを使用します。LAN、tailnet、プライベートネットワーク、
    パブリックな Ollama ホストは常に管理対象プロキシパスに留まり、別のホスト/ポートへのリダイレクトは
    信頼を継承しません。`proxy.loopbackMode: "proxy"` はループバックトラフィックもプロキシ経由でルーティングします。
    `proxy.loopbackMode: "block"` は接続前に拒否します。
    [管理対象プロキシ](/ja-JP/security/network-proxy#gateway-loopback-mode) を参照してください。

    | プロパティ | 値 |
    | --- | --- |
    | デフォルトモデル | `nomic-embed-text` |
    | 自動プル | はい、ローカルに存在しない場合 |
    | デフォルトのインライン並行数 | 1（他のプロバイダーはデフォルトが高めです。ホストが処理できる場合は `nonBatchConcurrency` で増やしてください） |

    クエリ時の埋め込みでは、必要または推奨されるモデルに retrieval プレフィックスを使用します:
    `nomic-embed-text`、`qwen3-embedding`、および
    `mxbai-embed-large`。ドキュメントバッチは未加工のままなので、既存のインデックスに
    フォーマット移行は不要です。

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

    リモート埋め込みホストでは、認証をそのホストに限定してください。

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

  <Accordion title="Streaming configuration">
    Ollama はデフォルトで **ネイティブ API**（`/api/chat`）を使用します。これは
    ストリーミングとツール呼び出しを同時にサポートします。特別な設定は不要です。

    ネイティブリクエストでは、thinking 制御が直接転送されます。`/think off`
    と `openclaw agent --thinking off` は、明示的な `params.think`/`params.thinking`
    が設定されていない限り、トップレベルの `think: false` を送信します。`/think
    low|medium|high` は対応する effort 文字列を送信します。`/think max` は
    Ollama の最高 effort である `think: "high"` にマッピングされます。

    <Tip>
    代わりに OpenAI 互換エンドポイントを使う場合は、上記の「レガシー OpenAI 互換モード」を参照してください。そこではストリーミングとツール呼び出しが同時に動作しない場合があります。
    </Tip>

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    NVIDIA/CUDA を使用する WSL2 では、公式の Ollama Linux インストーラーが
    `Restart=always` を持つ `ollama.service` systemd ユニットを作成します。
    そのサービスが自動起動し、WSL2 起動中に GPU-backed モデルをロードすると、
    Ollama がロード中にホストメモリを占有することがあります。Hyper-V のメモリ回収では
    それらのページを常に回収できるとは限らないため、Windows が WSL2 VM を終了し、
    systemd が Ollama を再起動し、ループが繰り返されます。

    証拠: WSL2 の再起動/終了の反復、WSL2 起動直後の `app.slice` または
    `ollama.service` での高い CPU 使用率、Linux OOM killer ではなく systemd からの SIGTERM。

    OpenClaw は、WSL2、`Restart=always` で有効化された `ollama.service`、
    および可視の CUDA マーカーを検出すると、起動時警告をログに出力します。

    緩和策:

    ```bash
    sudo systemctl disable ollama
    ```

    Windows 側で、これを `%USERPROFILE%\.wslconfig` に追加し、その後
    `wsl --shutdown` を実行します。

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    または、keep-alive を短くする / 必要なときだけ Ollama を手動で起動します。

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317) を参照してください。

  </Accordion>

  <Accordion title="Ollama not detected">
    Ollama が実行中であり、`OLLAMA_API_KEY`（または認証プロファイル）が設定され、
    `models.providers.ollama` が明示的に定義されて**いない**ことを確認します。

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    モデルをローカルにプルするか、`models.providers.ollama` で明示的に定義します。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    Gateway を実行している同じマシンとランタイムから確認します。

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    一般的な原因:

    - `baseUrl` が `localhost` を指しているが、Gateway が Docker 内または別のホストで実行されている。
    - URL が `/v1` を使用しており、ネイティブ Ollama ではなく OpenAI 互換動作を選択している。
    - リモートホストでファイアウォールまたは LAN バインドの変更が必要。
    - モデルがノートパソコンのデーモン上にあり、リモート側にはない。

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    通常、プロバイダーが OpenAI 互換モードになっているか、モデルがツールスキーマを処理できません。
    ネイティブモードを優先してください。

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

    小さなローカルモデルがツールスキーマでまだ失敗する場合は、そのモデルエントリに
    `compat.supportsTools: false` を設定して再テストしてください。

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    長く非言語的な記号列であるホスト型 Kimi/GLM の応答は、成功した返信ではなく
    失敗したプロバイダー呼び出しとして扱われます。そのため、破損したテキストをセッションに永続化する代わりに、
    通常のリトライ/フォールバック/エラー処理に移行します。

    再発する場合は、モデル名、現在のセッションファイル、および実行が
    `Cloud + Local` と `Cloud only` のどちらを使用したかを記録し、その後、新しい
    セッションとフォールバックモデルを試してください。

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    大きなローカルモデルでは、初回ロードに長い時間が必要になることがあります。タイムアウトを
    Ollama プロバイダーに限定し、必要に応じてターン間でモデルをロード済みに保ちます。

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

    ホスト自体の接続受け入れが遅い場合、`timeoutSeconds` はこのプロバイダーの
    保護された接続タイムアウトも延長します。

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    多くのモデルは、ハードウェアが快適に実行できる範囲を超えるコンテキストを公称しています。
    ネイティブ Ollama は、`params.num_ctx` が設定されていない限り独自のランタイムデフォルトを使用します。
    予測可能な初回トークンレイテンシのために、OpenClaw の予算と Ollama のリクエストコンテキストの両方を制限します。

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

    OpenClaw が送信するプロンプトが多すぎる場合は `contextWindow` を下げます。
    Ollama のランタイムコンテキストがマシンに対して大きすぎる場合は
    `params.num_ctx` を下げます。生成が長すぎる場合は `maxTokens` を下げます。

  </Accordion>
</AccordionGroup>

<Note>
さらにヘルプが必要な場合: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ja-JP/providers/ollama-cloud" icon="cloud">
    専用の `ollama-cloud` プロバイダーを使用するクラウド専用セットアップ。
  </Card>
  <Card title="Model providers" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、およびフェイルオーバー動作の概要。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/models" icon="brain">
    モデルの選択と設定方法。
  </Card>
  <Card title="Ollama Web Search" href="/ja-JP/tools/ollama-search" icon="magnifying-glass">
    Ollama を利用した Web 検索の完全なセットアップと動作詳細。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
</CardGroup>
