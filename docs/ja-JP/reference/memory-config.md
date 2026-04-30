---
read_when:
    - メモリ検索プロバイダーまたは埋め込みモデルを設定したい場合
    - QMD バックエンドをセットアップしたい
    - ハイブリッド検索、MMR、または時間減衰を調整したい場合
    - マルチモーダルメモリのインデックス作成を有効にしたい場合
sidebarTitle: Memory config
summary: メモリ検索、埋め込みプロバイダー、QMD、ハイブリッド検索、マルチモーダルインデックス作成に関するすべての設定項目
title: メモリ設定リファレンス
x-i18n:
    generated_at: "2026-04-30T05:33:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

このページでは、OpenClaw のメモリ検索に関するすべての設定項目を一覧します。概念的な概要については、以下を参照してください。

<CardGroup cols={2}>
  <Card title="Memory overview" href="/ja-JP/concepts/memory">
    メモリの仕組み。
  </Card>
  <Card title="Builtin engine" href="/ja-JP/concepts/memory-builtin">
    デフォルトの SQLite バックエンド。
  </Card>
  <Card title="QMD engine" href="/ja-JP/concepts/memory-qmd">
    ローカルファーストのサイドカー。
  </Card>
  <Card title="Memory search" href="/ja-JP/concepts/memory-search">
    検索パイプラインとチューニング。
  </Card>
  <Card title="Active memory" href="/ja-JP/concepts/active-memory">
    対話型セッション向けのメモリサブエージェント。
  </Card>
</CardGroup>

特に明記されていない限り、すべてのメモリ検索設定は `openclaw.json` の `agents.defaults.memorySearch` にあります。

<Note>
**Active Memory** 機能の切り替えとサブエージェント設定を探している場合、それは `memorySearch` ではなく `plugins.entries.active-memory` にあります。

Active Memory は 2 段階のゲートモデルを使用します。

1. Plugin が有効化され、現在のエージェント ID を対象にしている必要がある
2. リクエストが対象となる対話型の永続チャットセッションである必要がある

有効化モデル、Plugin 所有の設定、トランスクリプトの永続化、安全なロールアウトパターンについては、[Active Memory](/ja-JP/concepts/active-memory) を参照してください。
</Note>

---

## プロバイダーの選択

| キー        | 型      | デフォルト          | 説明                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自動検出    | `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`voyage` などの埋め込みアダプター ID。`api` がこれらのアダプターのいずれかを指す、設定済みの `models.providers.<id>` も使用できます |
| `model`    | `string`  | プロバイダーのデフォルト | 埋め込みモデル名                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`         | プライマリが失敗した場合のフォールバックアダプター ID                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`           | メモリ検索を有効または無効にします                                                                                                                                                                                                    |

### 自動検出の順序

`provider` が設定されていない場合、OpenClaw は最初に利用可能なものを選択します。

<Steps>
  <Step title="local">
    `memorySearch.local.modelPath` が設定され、ファイルが存在する場合に選択されます。
  </Step>
  <Step title="github-copilot">
    GitHub Copilot トークンを解決できる場合（環境変数または認証プロファイル）に選択されます。
  </Step>
  <Step title="openai">
    OpenAI キーを解決できる場合に選択されます。
  </Step>
  <Step title="gemini">
    Gemini キーを解決できる場合に選択されます。
  </Step>
  <Step title="voyage">
    Voyage キーを解決できる場合に選択されます。
  </Step>
  <Step title="mistral">
    Mistral キーを解決できる場合に選択されます。
  </Step>
  <Step title="deepinfra">
    DeepInfra キーを解決できる場合に選択されます。
  </Step>
  <Step title="bedrock">
    AWS SDK 認証情報チェーンを解決できる場合（インスタンスロール、アクセスキー、プロファイル、SSO、ウェブ ID、共有設定）に選択されます。
  </Step>
</Steps>

`ollama` はサポートされていますが、自動検出されません（明示的に設定してください）。

### カスタムプロバイダー ID

`memorySearch.provider` はカスタムの `models.providers.<id>` エントリを指すことができます。OpenClaw は、そのプロバイダーの `api` 所有者を埋め込みアダプターとして解決しつつ、エンドポイント、認証、モデルプレフィックス処理にはカスタムプロバイダー ID を保持します。これにより、マルチ GPU またはマルチホスト構成で、特定のローカルエンドポイントをメモリ埋め込み専用にできます。

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### API キーの解決

リモート埋め込みには API キーが必要です。Bedrock は代わりに AWS SDK のデフォルト認証情報チェーン（インスタンスロール、SSO、アクセスキー）を使用します。

| プロバイダー       | 環境変数                                            | 設定キー                          |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 認証情報チェーン                               | API キーは不要                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | デバイスログイン経由の認証プロファイル       |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（プレースホルダー）                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth はチャット/補完のみを対象とし、埋め込みリクエストには対応しません。
</Note>

---

## リモートエンドポイント設定

カスタムの OpenAI 互換エンドポイント、またはプロバイダーのデフォルトを上書きする場合:

<ParamField path="remote.baseUrl" type="string">
  カスタム API ベース URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API キーを上書きします。
</ParamField>
<ParamField path="remote.headers" type="object">
  追加の HTTP ヘッダー（プロバイダーのデフォルトとマージされます）。
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## プロバイダー固有の設定

<AccordionGroup>
  <Accordion title="Gemini">
    | キー                    | 型     | デフォルト                | 説明                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` もサポートします |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 の場合: 768、1536、または 3072        |

    <Warning>
    モデルまたは `outputDimensionality` を変更すると、自動的に完全な再インデックスが実行されます。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    OpenAI 互換の埋め込みエンドポイントは、プロバイダー固有の `input_type` リクエストフィールドを有効化できます。これは、クエリ埋め込みとドキュメント埋め込みに異なるラベルを必要とする非対称埋め込みモデルに役立ちます。

    | キー                 | 型     | デフォルト | 説明                                             |
    | ------------------- | -------- | ------- | ------------------------------------------------------- |
    | `inputType`         | `string` | 未設定   | クエリ埋め込みとドキュメント埋め込みで共有される `input_type`   |
    | `queryInputType`    | `string` | 未設定   | クエリ時の `input_type`。`inputType` を上書きします          |
    | `documentInputType` | `string` | 未設定   | インデックス/ドキュメントの `input_type`。`inputType` を上書きします      |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    これらの値を変更すると、プロバイダーバッチインデックス作成用の埋め込みキャッシュ ID に影響します。アップストリームモデルがラベルを異なるものとして扱う場合は、メモリの再インデックスを実行してください。

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock は AWS SDK のデフォルト認証情報チェーンを使用します。API キーは不要です。OpenClaw が Bedrock 対応のインスタンスロールを持つ EC2 上で実行されている場合は、プロバイダーとモデルを設定するだけです。

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | キー                    | 型     | デフォルト                        | 説明                     |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意の Bedrock 埋め込みモデル ID  |
    | `outputDimensionality` | `number` | モデルのデフォルト                  | Titan V2 の場合: 256、512、または 1024 |

    **サポートされるモデル**（ファミリー検出とデフォルト次元数を含む）:

    | モデル ID                                   | プロバイダー   | デフォルト次元数 | 設定可能な次元数    |
    | ------------------------------------------ | ---------- | ------------ | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256、512、1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256、384、1024、3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

    スループットサフィックス付きのバリアント（例: `amazon.titan-embed-text-v1:2:8k`）は、ベースモデルの設定を継承します。

    **認証:** Bedrock 認証は、標準の AWS SDK 認証情報解決順序を使用します。

    1. 環境変数（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
    2. SSO トークンキャッシュ
    3. ウェブ ID トークン認証情報
    4. 共有認証情報ファイルと設定ファイル
    5. ECS または EC2 メタデータ認証情報

    リージョンは `AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock` プロバイダーの `baseUrl` から解決されるか、デフォルトで `us-east-1` になります。

    **IAM 権限:** IAM ロールまたはユーザーには以下が必要です。

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    最小権限にするには、`InvokeModel` を特定のモデルにスコープします。

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="ローカル (GGUF + node-llama-cpp)">
    | キー                  | 型                 | デフォルト             | 説明                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動ダウンロード       | GGUF モデルファイルへのパス                                                                                                                                                                                                                                                                                         |
    | `local.modelCacheDir` | `string`           | node-llama-cpp のデフォルト | ダウンロード済みモデルのキャッシュディレクトリ                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 埋め込みコンテキストのコンテキストウィンドウサイズ。4096 は典型的なチャンク (128–512 トークン) をカバーしつつ、重み以外の VRAM を抑えます。制約のあるホストでは 1024–2048 に下げてください。`"auto"` はモデルの学習時の最大値を使用します。8B+ モデルには推奨されません (Qwen3-Embedding-8B: 40 960 トークン → 4096 で約 8.8 GB に対して約 32 GB VRAM)。 |

    デフォルトモデル: `embeddinggemma-300m-qat-Q8_0.gguf` (約 0.6 GB、自動ダウンロード)。ネイティブビルドが必要です: `pnpm approve-builds` の後に `pnpm rebuild node-llama-cpp`。

    Gateway が使用するものと同じプロバイダーパスを検証するには、スタンドアロン CLI を使用します。

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    `provider` が `auto` の場合、`local.modelPath` が既存のローカルファイルを指している場合にのみ `local` が選択されます。`hf:` および HTTP(S) モデル参照は `provider: "local"` で明示的に引き続き使用できますが、モデルがディスク上で利用可能になる前に `auto` がローカルを選択する原因にはなりません。

  </Accordion>
</AccordionGroup>

### インライン埋め込みタイムアウト

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  メモリーインデックス作成中のインライン埋め込みバッチのタイムアウトを上書きします。

未設定の場合はプロバイダーのデフォルトを使用します。`local`、`ollama`、`lmstudio` などのローカル/セルフホストプロバイダーでは 600 秒、ホスト型プロバイダーでは 120 秒です。ローカルの CPU バウンドな埋め込みバッチが正常だが遅い場合は、この値を増やしてください。
</ParamField>

---

## ハイブリッド検索設定

すべて `memorySearch.query.hybrid` の下にあります。

| キー                  | 型        | デフォルト | 説明                                  |
| --------------------- | --------- | ---------- | ------------------------------------- |
| `enabled`             | `boolean` | `true`     | ハイブリッド BM25 + ベクトル検索を有効化 |
| `vectorWeight`        | `number`  | `0.7`      | ベクトルスコアの重み (0-1)            |
| `textWeight`          | `number`  | `0.3`      | BM25 スコアの重み (0-1)               |
| `candidateMultiplier` | `number`  | `4`        | 候補プールサイズの倍率                |

<Tabs>
  <Tab title="MMR (多様性)">
    | キー          | 型        | デフォルト | 説明                                      |
    | ------------- | --------- | ---------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | MMR 再ランキングを有効化                  |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = 最大の多様性、1 = 最大の関連性        |
  </Tab>
  <Tab title="時間減衰 (新しさ)">
    | キー                         | 型        | デフォルト | 説明                         |
    | ---------------------------- | --------- | ---------- | ---------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`    | 新しさによるブーストを有効化 |
    | `temporalDecay.halfLifeDays` | `number`  | `30`       | N 日ごとにスコアが半減       |

    Evergreen ファイル (`MEMORY.md`、`memory/` 内の日付なしファイル) は減衰されません。

  </Tab>
</Tabs>

### 完全な例

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## 追加メモリーパス

| キー         | 型         | 説明                                         |
| ------------ | ---------- | -------------------------------------------- |
| `extraPaths` | `string[]` | インデックス作成対象に追加するディレクトリまたはファイル |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

パスは絶対パスまたはワークスペース相対パスにできます。ディレクトリは `.md` ファイルを対象に再帰的にスキャンされます。シンボリックリンクの扱いは有効なバックエンドに依存します。組み込みエンジンはシンボリックリンクを無視しますが、QMD は基盤となる QMD スキャナーの動作に従います。

エージェントスコープのエージェント間トランスクリプト検索には、`memory.qmd.paths` ではなく `agents.list[].memorySearch.qmd.extraCollections` を使用します。これらの追加コレクションは同じ `{ path, name, pattern? }` 形状に従いますが、エージェントごとにマージされ、パスが現在のワークスペース外を指している場合に明示的な共有名を保持できます。同じ解決済みパスが `memory.qmd.paths` と `memorySearch.qmd.extraCollections` の両方に現れる場合、QMD は最初のエントリを保持し、重複をスキップします。

---

## マルチモーダルメモリー (Gemini)

Gemini Embedding 2 を使用して、Markdown と並行して画像と音声をインデックス作成します。

| キー                      | 型         | デフォルト | 説明                                 |
| ------------------------- | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | マルチモーダルインデックス作成を有効化 |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]`、または `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | インデックス作成対象の最大ファイルサイズ |

<Note>
`extraPaths` 内のファイルにのみ適用されます。既定のメモリルートは Markdown のみに維持されます。`gemini-embedding-2-preview` が必要です。`fallback` は `"none"` でなければなりません。
</Note>

対応形式: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (画像); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (音声)。

---

## 埋め込みキャッシュ

| キー               | 型        | 既定値  | 説明                                  |
| ------------------ | --------- | ------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | チャンク埋め込みを SQLite にキャッシュ |
| `cache.maxEntries` | `number`  | `50000` | キャッシュ済み埋め込みの最大数        |

再インデックスやトランスクリプト更新時に、変更されていないテキストを再埋め込みしないようにします。

---

## バッチインデックス作成

| キー                          | 型        | 既定値 | 説明                    |
| ----------------------------- | --------- | ------ | ----------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`    | 並列インライン埋め込み  |
| `remote.batch.enabled`        | `boolean` | `false` | バッチ埋め込み API を有効化 |
| `remote.batch.concurrency`    | `number`  | `2`    | 並列バッチジョブ        |
| `remote.batch.wait`           | `boolean` | `true` | バッチ完了を待機        |
| `remote.batch.pollIntervalMs` | `number`  | --     | ポーリング間隔          |
| `remote.batch.timeoutMinutes` | `number`  | --     | バッチタイムアウト      |

`openai`, `gemini`, `voyage` で利用できます。OpenAI バッチは通常、大規模なバックフィルで最速かつ最安です。

`remote.nonBatchConcurrency` は、プロバイダーのバッチ API が有効でない場合に、ローカル/セルフホストプロバイダーおよびホスト型プロバイダーで使用されるインライン埋め込み呼び出しを制御します。Ollama は、小規模なローカルホストに負荷をかけすぎないよう、非バッチインデックス作成では既定で `1` になります。より大きなマシンでは高い値を設定してください。

これは、インライン埋め込み呼び出しのタイムアウトを制御する `sync.embeddingBatchTimeoutSeconds` とは別です。

---

## セッションメモリ検索 (実験的)

セッショントランスクリプトをインデックス化し、`memory_search` 経由で表示します。

| キー                          | 型         | 既定値       | 説明                                      |
| ----------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | セッションインデックス作成を有効化        |
| `sources`                     | `string[]` | `["memory"]` | トランスクリプトを含めるには `"sessions"` を追加 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 再インデックス用のバイトしきい値          |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 再インデックス用のメッセージしきい値      |

<Warning>
セッションインデックス作成はオプトインで、非同期に実行されます。結果は少し古くなる場合があります。セッションログはディスク上に存在するため、ファイルシステムアクセスを信頼境界として扱ってください。
</Warning>

---

## SQLite ベクトル高速化 (sqlite-vec)

| キー                         | 型        | 既定値 | 説明                              |
| ---------------------------- | --------- | ------ | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | ベクトルクエリに sqlite-vec を使用 |
| `store.vector.extensionPath` | `string`  | 同梱   | sqlite-vec パスを上書き           |

sqlite-vec を利用できない場合、OpenClaw は自動的にプロセス内コサイン類似度へフォールバックします。

---

## インデックスストレージ

| キー                  | 型       | 既定値                                | 説明                                      |
| --------------------- | -------- | ------------------------------------- | ----------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | インデックスの場所 (`{agentId}` トークンをサポート) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 トークナイザー (`unicode61` または `trigram`) |

---

## QMD バックエンド設定

有効にするには `memory.backend = "qmd"` を設定します。すべての QMD 設定は `memory.qmd` 配下にあります。

| キー                     | 型        | 既定値   | 説明                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 実行可能ファイルのパス。サービスの `PATH` がシェルと異なる場合は絶対パスを設定 |
| `searchMode`             | `string`  | `search` | 検索コマンド: `search`, `vsearch`, `query`                                           |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` を自動インデックス化                                  |
| `paths[]`                | `array`   | --       | 追加パス: `{ name, path, pattern? }`                                                 |
| `sessions.enabled`       | `boolean` | `false`  | セッショントランスクリプトをインデックス化                                          |
| `sessions.retentionDays` | `number`  | --       | トランスクリプトの保持                                                               |
| `sessions.exportDir`     | `string`  | --       | エクスポートディレクトリ                                                             |

`searchMode: "search"` は語彙/BM25 のみです。OpenClaw は、そのモードでは `memory status --deep` の実行中も含めて、セマンティックベクトルの準備状況プローブや QMD 埋め込みメンテナンスを実行しません。`vsearch` と `query` は引き続き QMD ベクトルの準備状況と埋め込みを必要とします。

OpenClaw は現在の QMD コレクションと MCP クエリ形状を優先しますが、必要に応じて互換性のあるコレクションパターンフラグや古い MCP ツール名を試すことで、古い QMD リリースも動作し続けるようにしています。QMD が複数のコレクションフィルター対応を通知している場合、同一ソースのコレクションは 1 つの QMD プロセスで検索されます。古い QMD ビルドでは、コレクションごとの互換性パスが維持されます。同一ソースとは、永続メモリコレクションがまとめてグループ化される一方で、セッショントランスクリプトコレクションは別のグループのままになり、ソースの多様化で引き続き両方の入力を使えることを意味します。

<Note>
QMD モデルのオーバーライドは OpenClaw config ではなく QMD 側にあります。QMD のモデルをグローバルにオーバーライドする必要がある場合は、Gateway ランタイム環境で `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL`、`QMD_GENERATE_MODEL` などの環境変数を設定してください。
</Note>

<AccordionGroup>
  <Accordion title="更新スケジュール">
    | キー                       | 型      | デフォルト | 説明                           |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 更新間隔                      |
    | `update.debounceMs`       | `number`  | `15000` | ファイル変更をデバウンス                 |
    | `update.onBoot`           | `boolean` | `true`  | 長寿命の QMD マネージャーが開いたときに更新します。オプトインの起動時更新も制御します |
    | `update.startup`          | `string`  | `off`   | 任意の Gateway 起動時更新: `off`、`idle`、または `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` 更新が実行される前の遅延 |
    | `update.waitForBootSync`  | `boolean` | `false` | 初回更新が完了するまでマネージャーのオープンをブロック |
    | `update.embedInterval`    | `string`  | --      | 個別の埋め込み周期                |
    | `update.commandTimeoutMs` | `number`  | --      | QMD コマンドのタイムアウト              |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD 更新操作のタイムアウト     |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD 埋め込み操作のタイムアウト      |
  </Accordion>
  <Accordion title="制限">
    | キー                       | 型     | デフォルト | 説明                |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | 最大検索結果数         |
    | `limits.maxSnippetChars`  | `number` | --      | スニペット長を制限       |
    | `limits.maxInjectedChars` | `number` | --      | 注入される総文字数を制限 |
    | `limits.timeoutMs`        | `number` | `4000`  | 検索タイムアウト             |
  </Accordion>
  <Accordion title="スコープ">
    どのセッションが QMD 検索結果を受け取れるかを制御します。[`session.sendPolicy`](/ja-JP/gateway/config-agents#session) と同じスキーマです:

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    同梱のデフォルトでは、グループは拒否したまま、ダイレクトセッションとチャンネルセッションを許可します。

    デフォルトは DM のみです。`match.keyPrefix` は正規化されたセッションキーに一致します。`match.rawKeyPrefix` は `agent:<id>:` を含む raw キーに一致します。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` はすべてのバックエンドに適用されます:

    | 値            | 動作                                            |
    | ---------------- | --------------------------------------------------- |
    | `auto` (デフォルト) | スニペットに `Source: <path#line>` フッターを含める    |
    | `on`             | 常にフッターを含める                               |
    | `off`            | フッターを省略する (パスは内部的に agent に渡されます) |

  </Accordion>
</AccordionGroup>

QMD 起動時更新では、Gateway 起動中にワンショットのサブプロセスパスを使用します。長寿命の QMD マネージャーは、インタラクティブ利用のためにメモリ検索が開かれている場合、通常のファイルウォッチャーと間隔タイマーを引き続き所有します。

### 完全な QMD の例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming は `agents.defaults.memorySearch` ではなく、`plugins.entries.memory-core.config.dreaming` の下で設定します。

Dreaming は 1 つのスケジュールされたスイープとして実行され、実装の詳細として内部の light/deep/REM フェーズを使用します。

概念的な動作とスラッシュコマンドについては、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

### ユーザー設定

| キー         | 型      | デフォルト       | 説明                                       |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Dreaming 全体を有効または無効にする               |
| `frequency` | `string`  | `0 3 * * *`   | 完全な Dreaming スイープの任意の cron 周期 |
| `model`     | `string`  | デフォルトモデル | 任意の Dream Diary サブ agent モデルオーバーライド      |

### 例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming は機械状態を `memory/.dreams/` に書き込みます。
- Dreaming は人間が読めるナラティブ出力を `DREAMS.md` (または既存の `dreams.md`) に書き込みます。
- `dreaming.model` は既存の Plugin サブ agent 信頼ゲートを使用します。有効にする前に `plugins.entries.memory-core.subagent.allowModelOverride: true` を設定してください。
- Dream Diary は、設定されたモデルが利用できない場合、セッションのデフォルトモデルで 1 回再試行します。信頼または allowlist の失敗はログに記録され、暗黙的には再試行されません。
- light/deep/REM フェーズのポリシーとしきい値は内部動作であり、ユーザー向け config ではありません。

</Note>

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [メモリ概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
