---
read_when:
    - メモリ検索プロバイダーまたは埋め込みモデルを設定したい場合
    - QMDバックエンドをセットアップする場合
    - ハイブリッド検索、MMR、または時間減衰を調整したい場合
    - マルチモーダルメモリのインデックス作成を有効にしたい場合
sidebarTitle: Memory config
summary: メモリ検索、埋め込みプロバイダー、QMD、ハイブリッド検索、マルチモーダルインデックス作成に関するすべての設定項目
title: メモリ設定リファレンス
x-i18n:
    generated_at: "2026-07-12T14:49:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

このページでは、OpenClaw のメモリ検索に関するすべての設定項目を一覧表示します。概念的な概要については、以下を参照してください。

<CardGroup cols={2}>
  <Card title="メモリの概要" href="/ja-JP/concepts/memory">
    メモリの仕組み。
  </Card>
  <Card title="組み込みエンジン" href="/ja-JP/concepts/memory-builtin">
    デフォルトの SQLite バックエンド。
  </Card>
  <Card title="QMD エンジン" href="/ja-JP/concepts/memory-qmd">
    ローカルファーストのサイドカー。
  </Card>
  <Card title="メモリ検索" href="/ja-JP/concepts/memory-search">
    検索パイプラインとチューニング。
  </Card>
  <Card title="Active Memory" href="/ja-JP/concepts/active-memory">
    対話型セッション用のメモリサブエージェント。
  </Card>
</CardGroup>

特に記載がない限り、メモリ検索のすべての設定は `openclaw.json` の `agents.defaults.memorySearch`（またはエージェントごとの `agents.list[].memorySearch` オーバーライド）に配置します。

<Note>
**Active Memory** 機能の切り替えとサブエージェント設定を探している場合、それらは `memorySearch` ではなく `plugins.entries.active-memory` にあります。

Active Memory は 2 段階のゲートモデルを使用します。

1. Plugin が有効で、現在のエージェント ID を対象としている必要がある
2. リクエストが対象となる対話型の永続チャットセッションである必要がある

有効化モデル、Plugin 所有の設定、トランスクリプトの永続化、安全なロールアウトパターンについては、[Active Memory](/ja-JP/concepts/active-memory)を参照してください。
</Note>

---

## プロバイダーの選択

| キー       | 型        | デフォルト       | 説明                                                                                                                                                                                                                                                                                        |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | メモリ検索を有効または無効にする                                                                                                                                                                                                                                                            |
| `provider` | `string`  | `"openai"`       | `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible`、`voyage` などの埋め込みアダプター ID。`api` がメモリ埋め込みアダプターまたは OpenAI 互換モデル API を指す、設定済みの `models.providers.<id>` も指定可能 |
| `model`    | `string`  | プロバイダーのデフォルト | 埋め込みモデル名                                                                                                                                                                                                                                                                             |
| `fallback` | `string`  | `"none"`         | プライマリが失敗した場合のフォールバックアダプター ID                                                                                                                                                                                                                                       |

`provider` が設定されていない場合、OpenClaw は OpenAI の埋め込みを使用します。Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、Voyage、ローカル GGUF モデル、または OpenAI 互換の `/v1/embeddings` エンドポイントを使用するには、`provider` を明示的に設定してください。`provider: "auto"` が残っているレガシー設定は `openai` として解決されます。

<Warning>
埋め込みプロバイダー、モデル、プロバイダー設定、ソース、スコープ、チャンク化、またはトークナイザーを変更すると、既存の SQLite ベクトルインデックスと互換性がなくなる場合があります。OpenClaw はすべてを自動的に再埋め込みする代わりに、ベクトル検索を一時停止してインデックス識別情報の警告を報告します。準備ができたら、`openclaw memory status --index --agent <id>` または `openclaw memory index --force --agent <id>` を使用して再構築してください。
</Warning>

`provider` が未設定の場合、レガシーの `provider: "auto"` が存在する場合、または `provider: "none"` によって意図的に FTS 専用モードを選択している場合、埋め込みを利用できなくても、メモリの想起で語彙ベースの FTS ランキングを引き続き使用できます。

明示的に指定された非ローカルプロバイダーは、利用できない場合に安全側へ失敗します。`memorySearch.provider` に Bedrock、DeepInfra、Gemini、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage、または OpenAI 互換のカスタムプロバイダーなど、リモートバックエンドを使用する具体的なプロバイダーを設定し、そのプロバイダーが実行時に利用できない場合、`memory_search` は暗黙的に FTS 専用の想起を使用するのではなく、利用不可の結果を返します。プロバイダーまたは認証の設定を修正するか、到達可能なプロバイダーに切り替えるか、意図的に FTS 専用の想起を使用する場合は `provider: "none"` を設定してください。

### カスタムプロバイダー ID

`memorySearch.provider` には、`ollama` などのメモリ固有プロバイダーアダプター、または `openai-responses` / `openai-completions` などの OpenAI 互換モデル API に対応するカスタム `models.providers.<id>` エントリを指定できます。OpenClaw は、エンドポイント、認証、モデルプレフィックスの処理ではカスタムプロバイダー ID を維持しながら、そのプロバイダーの `api` 所有者を埋め込みアダプターとして解決します。これにより、複数 GPU または複数ホストの構成で、メモリ埋め込み専用のローカルエンドポイントを指定できます。

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
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

リモート埋め込みには API キーが必要です。Bedrock は代わりに AWS SDK のデフォルト認証情報チェーン（インスタンスロール、SSO、アクセスキー、または Bedrock API キー）を使用します。

| プロバイダー   | 環境変数                                            | 設定キー                            |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 認証情報チェーン、または `AWS_BEARER_TOKEN_BEDROCK` | API キーは不要                      |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | デバイスログインによる認証プロファイル |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（プレースホルダー）                | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth はチャット／補完のみに対応し、埋め込みリクエストの要件は満たしません。
</Note>

---

## リモートエンドポイント設定

グローバルな OpenAI チャット認証情報を継承しない汎用の OpenAI 互換 `/v1/embeddings` サーバーには、`provider: "openai-compatible"` を使用します。

<ParamField path="remote.baseUrl" type="string">
  カスタム API ベース URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API キーをオーバーライドします。
</ParamField>
<ParamField path="remote.headers" type="object">
  追加の HTTP ヘッダー（プロバイダーのデフォルトとマージされます）。
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
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
    | キー                   | 型       | デフォルト             | 説明                                      |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` にも対応     |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 の場合：768、1536、または 3072 |

    <Warning>
    モデルまたは `outputDimensionality` を変更すると、インデックス識別情報が変わります。メモリインデックスを明示的に再構築するまで、OpenClaw はベクトル検索を一時停止します。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 互換の入力タイプ">
    OpenAI 互換の埋め込みエンドポイントでは、プロバイダー固有の `input_type` リクエストフィールドを任意で使用できます。これは、クエリとドキュメントの埋め込みに異なるラベルを必要とする非対称埋め込みモデルに便利です。

    | キー                | 型       | デフォルト | 説明                                                        |
    | ------------------- | -------- | ---------- | ----------------------------------------------------------- |
    | `inputType`         | `string` | 未設定     | クエリとドキュメントの埋め込みで共有する `input_type`      |
    | `queryInputType`    | `string` | 未設定     | クエリ時の `input_type`。`inputType` をオーバーライド       |
    | `documentInputType` | `string` | 未設定     | インデックス／ドキュメントの `input_type`。`inputType` をオーバーライド |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    これらの値を変更すると、プロバイダーのバッチインデックス作成における埋め込みキャッシュの識別情報に影響します。上流モデルがラベルを異なるものとして扱う場合は、変更後にメモリを再インデックス化してください。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 埋め込み設定

    Bedrock は AWS SDK のデフォルト認証情報チェーンと OpenClaw が確認するベアラートークンを使用するため、API キーは設定に保存されません。OpenClaw が Bedrock 対応のインスタンスロールを持つ EC2 上で実行されている場合は、プロバイダーとモデルを設定するだけです。

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

    | キー                   | 型       | デフォルト                      | 説明                               |
    | ---------------------- | -------- | ------------------------------- | ---------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意の Bedrock 埋め込みモデル ID   |
    | `outputDimensionality` | `number` | モデルのデフォルト              | Titan V2 の場合：256、512、または 1024 |

    **対応モデル**（ファミリー検出と次元数のデフォルトを含む）：

    | モデル ID                                   | プロバイダー   | デフォルト次元数 | 設定可能な次元数          |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    スループット接尾辞付きのバリアント（例: `amazon.titan-embed-text-v1:2:8k`）およびリージョン接頭辞付きの推論プロファイル ID（例: `us.amazon.titan-embed-text-v2:0`）は、ベースモデルの設定を継承します。

    **リージョン:** 次の順序で解決されます: `memorySearch.remote.baseUrl` のオーバーライド、`models.providers.amazon-bedrock.baseUrl` の設定、`AWS_REGION`、`AWS_DEFAULT_REGION`、最後にデフォルトの `us-east-1`。

    **認証:** OpenClaw は最初に `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` または `AWS_BEARER_TOKEN_BEDROCK` を確認し、その後、標準の AWS SDK デフォルト認証情報プロバイダーチェーンへフォールスルーします。

    1. 環境変数（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）。ただし、`AWS_PROFILE` も設定されている場合を除く
    2. SSO（SSO フィールドが設定されている場合のみ）
    3. 共有認証情報ファイルおよび設定ファイル（`fromIni`、`AWS_PROFILE` を含む）
    4. 認証情報プロセス（AWS 設定ファイル内の `credential_process`）
    5. Web ID トークン認証情報
    6. ECS または EC2 インスタンスメタデータ認証情報

    **IAM 権限:** IAM ロールまたはユーザーには次の権限が必要です。

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    最小権限にするには、`InvokeModel` のスコープを特定のモデルに限定します。

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="ローカル（GGUF + llama.cpp）">
    | キー                   | 型               | デフォルト                | 説明                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動ダウンロード        | GGUF モデルファイルへのパス                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp のデフォルト | ダウンロードしたモデルのキャッシュディレクトリ                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 埋め込みコンテキストのコンテキストウィンドウサイズ。4096 は一般的なチャンク（128～512 トークン）をカバーしながら、重み以外の VRAM 使用量を制限します。リソースが限られたホストでは 1024～2048 に下げてください。`"auto"` はモデルの学習済み最大値を使用しますが、8B 以上のモデルには推奨されません（Qwen3-Embedding-8B: 最大 40 960 トークンで VRAM 使用量が約 32 GB に達する可能性があります）。 |

    まず、公式の llama.cpp プロバイダーをインストールします: `openclaw plugins install @openclaw/llama-cpp-provider`。
    デフォルトモデル: `embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB、自動ダウンロード）。ソースチェックアウトでは、引き続きネイティブビルドの承認が必要です: `pnpm approve-builds`、続けて `pnpm rebuild node-llama-cpp`。

    スタンドアロン CLI を使用して、Gateway が使用するものと同じプロバイダーパスを検証します。

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    数値の `local.contextSize` 値は、node-llama-cpp の GPU レイヤー自動配置にも使用され、モデルの重みと要求された埋め込みコンテキストが収まるように調整されます。`openclaw memory status --deep` は、ランタイムが読み込まれた後の、最後に確認された llama.cpp のバックエンド、デバイス、オフロード、要求されたコンテキスト、およびタイムスタンプ付きのメモリ情報を報告します。受動的なステータス確認ではモデルを読み込みません。

    ローカル GGUF 埋め込みを使用するには、`provider: "local"` を明示的に設定します。明示的なローカル設定では、`hf:` および HTTP(S) モデル参照がサポートされています（node-llama-cpp のモデル解決を介して）が、デフォルトプロバイダーは変更されません。

  </Accordion>
</AccordionGroup>

### インライン埋め込みのタイムアウト

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  メモリのインデックス作成中に行われるインライン埋め込みバッチのタイムアウトを上書きします。

未設定の場合はプロバイダーのデフォルトを使用します。`local`、`ollama`、`lmstudio` などのローカルまたはセルフホスト型プロバイダーでは 600 秒、ホスト型プロバイダーでは 120 秒です。ローカルの CPU バウンドな埋め込みバッチが正常に動作しているものの遅い場合は、この値を増やしてください。
</ParamField>

---

## インデックス作成の動作

特記がない限り、すべて `memorySearch.sync` の配下です。

| キー                            | 型      | デフォルト | 説明                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | セッション開始時にメモリインデックスを同期する                           |
| `onSearch`                     | `boolean` | `true`  | コンテンツの変更を検出した後、検索時に遅延同期する                 |
| `watch`                        | `boolean` | `true`  | メモリファイルを監視（chokidar）し、変更時に再インデックス作成をスケジュールする         |
| `watchDebounceMs`              | `number`  | `1500`  | 短時間に連続するファイル監視イベントをまとめるためのデバウンス時間                |
| `intervalMinutes`              | `number`  | `0`     | 分単位の定期的な再インデックス作成間隔（`0` で無効）                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | Compaction によってトリガーされたトランスクリプト更新後に、セッションの再インデックス作成を強制する |

<ParamField path="chunking.tokens" type="number">
  埋め込み前にメモリソースを分割するときに使用する、トークン単位のチャンクサイズ（デフォルト: 400）。
</ParamField>
<ParamField path="chunking.overlap" type="number">
  分割境界付近のコンテキストを保持するための、隣接チャンク間のトークン重複数（デフォルト: 80）。
</ParamField>

<Note>
`chunking.tokens` または `chunking.overlap` を変更するとチャンク境界が変わり、既存のインデックス識別情報が無効になります（プロバイダー選択の「警告」を参照）。
</Note>

---

## ハイブリッド検索の設定

すべて `memorySearch.query` 配下:

| キー         | 型       | デフォルト | 説明                                         |
| ------------ | -------- | ---------- | -------------------------------------------- |
| `maxResults` | `number` | `6`        | 注入前に返されるメモリヒットの最大数         |
| `minScore`   | `number` | `0.35`     | ヒットを含めるための最小関連度スコア         |

また、`memorySearch.query.hybrid` 配下:

| キー                  | 型        | デフォルト | 説明                                         |
| --------------------- | --------- | ---------- | -------------------------------------------- |
| `enabled`             | `boolean` | `true`     | BM25 + ベクトルのハイブリッド検索を有効化    |
| `vectorWeight`        | `number`  | `0.7`      | ベクトルスコアの重み（0-1）                  |
| `textWeight`          | `number`  | `0.3`      | BM25 スコアの重み（0-1）                     |
| `candidateMultiplier` | `number`  | `4`        | 候補プールサイズの倍率                       |

<Tabs>
  <Tab title="MMR（多様性）">
    | キー          | 型        | デフォルト | 説明                                  |
    | ------------- | --------- | ---------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`    | MMR による再ランキングを有効化       |
    | `mmr.lambda`  | `number`  | `0.7`      | 0 = 多様性最大、1 = 関連度最大        |
  </Tab>
  <Tab title="時間減衰（新しさ）">
    | キー                         | 型        | デフォルト | 説明                         |
    | ---------------------------- | --------- | ---------- | ---------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`    | 新しさによるブーストを有効化 |
    | `temporalDecay.halfLifeDays` | `number`  | `30`       | N 日ごとにスコアが半減       |

    エバーグリーンファイル（`MEMORY.md`、`memory/` 内の日付なしファイル）は減衰しません。

  </Tab>
</Tabs>

### 完全な例

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
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

## 追加のメモリパス

| キー         | 型         | 説明                                     |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | インデックス化する追加のディレクトリまたはファイル |

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

パスには絶対パスまたはワークスペース相対パスを指定できます。ディレクトリ内の `.md` ファイルは再帰的にスキャンされます。シンボリックリンクの処理は有効なバックエンドによって異なります。組み込みエンジンはシンボリックリンクをスキップし、QMD は基盤となる QMD スキャナーの動作に従います。

エージェント単位のエージェント横断トランスクリプト検索には、`memory.qmd.paths` ではなく `agents.list[].memorySearch.qmd.extraCollections` を使用します。これらの追加コレクションは同じ `{ path, name, pattern? }` 形式に従いますが、エージェントごとにマージされ、パスが現在のワークスペース外を指している場合も、明示的に指定した共有名を保持できます。同じ解決済みパスが `memory.qmd.paths` と `memorySearch.qmd.extraCollections` の両方に存在する場合、QMD は最初のエントリを保持し、重複をスキップします。

---

## マルチモーダルメモリ（Gemini）

Gemini Embedding 2 を使用して、Markdown とともに画像や音声をインデックス化します:

| キー                      | 型         | デフォルト | 説明                                      |
| ------------------------- | ---------- | ---------- | ----------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | マルチモーダルインデックス化を有効化      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]`、または `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | インデックス化する最大ファイルサイズ（10 MiB） |

<Note>
`extraPaths` 内のファイルにのみ適用されます。デフォルトのメモリルートは引き続き Markdown のみに対応します。`gemini-embedding-2-preview` が必要です。`fallback` は `"none"` でなければなりません。
</Note>

サポートされる形式: `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（画像）、`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音声）。

---

## 埋め込みキャッシュ

| キー               | 型        | デフォルト | 説明                                       |
| ------------------ | --------- | ---------- | ------------------------------------------ |
| `cache.enabled`    | `boolean` | `true`     | チャンクの埋め込みを SQLite にキャッシュする |
| `cache.maxEntries` | `number`  | 未設定     | キャッシュする埋め込み数の概算上限         |

再インデックスまたはトランスクリプトの更新時に、変更されていないテキストが再度埋め込み処理されるのを防ぎます。無制限のキャッシュにするには `maxEntries` を未設定のままにします。再インデックスの最大速度よりもディスク使用量の増加が重要な場合は設定してください。設定した場合、キャッシュが上限を超えると、最終更新時刻が古いエントリから先に削除されます。

---

## バッチインデックス作成

| キー                          | 型        | デフォルト | 説明                         |
| ----------------------------- | --------- | ---------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`        | 並列インライン埋め込み       |
| `remote.batch.enabled`        | `boolean` | `false`    | バッチ埋め込み API を有効化  |
| `remote.batch.concurrency`    | `number`  | `2`        | 並列バッチジョブ             |
| `remote.batch.wait`           | `boolean` | `true`     | バッチの完了を待機           |
| `remote.batch.pollIntervalMs` | `number`  | `2000`     | ポーリング間隔               |
| `remote.batch.timeoutMinutes` | `number`  | `60`       | バッチのタイムアウト         |

`gemini`、`openai`、`voyage` で利用できます。大規模なバックフィルでは、通常 OpenAI のバッチが最も高速かつ低コストです。

`remote.nonBatchConcurrency` は、ローカル／セルフホスト型プロバイダー、およびプロバイダーのバッチ API が有効でない場合のホスト型プロバイダーで使用されるインライン埋め込み呼び出しを制御します。小規模なローカルホストへの過負荷を避けるため、Ollama の非バッチインデックス作成ではデフォルトが `1` です。より大規模なマシンでは、さらに大きい値を設定してください。

これは、インライン埋め込み呼び出しのタイムアウトを制御する `sync.embeddingBatchTimeoutSeconds` とは別の設定です。

---

## セッションメモリ検索（実験的）

セッションのトランスクリプトをインデックス化し、`memory_search` 経由で提示します。

| キー                          | 型         | デフォルト | 説明                                             |
| ----------------------------- | ---------- | ---------- | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`    | セッションのインデックス作成を有効化             |
| `sources`                     | `string[]` | `["memory"]` | トランスクリプトを含めるには `"sessions"` を追加 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`   | 再インデックスのバイト数しきい値                 |
| `sync.sessions.deltaMessages` | `number`   | `50`       | 再インデックスのメッセージ数しきい値             |

<Warning>
セッションのインデックス作成はオプトインで、非同期に実行されます。結果がわずかに古い場合があります。セッションログはディスク上に保存されるため、ファイルシステムへのアクセスを信頼境界として扱ってください。
</Warning>

セッショントランスクリプトの検索結果にも
[`tools.sessions.visibility`](/ja-JP/gateway/config-tools#toolssessions) が適用されます。デフォルトの
`tree` 可視性では、現在のセッションと、そのセッションから生成されたセッションのみが公開されます。DM など、別のセッションから、Gateway 経由でディスパッチされた同一エージェントの無関係なセッションを呼び出すには、可視性を意図的に `agent` へ拡張してください（エージェント間の呼び出しも必要で、かつエージェント間ポリシーで許可されている場合にのみ `all` を使用します）。

以下の例では、これらの設定を `agents.defaults` の配下に配置しています。1 つのエージェントだけがセッショントランスクリプトをインデックス化して検索する必要がある場合は、エージェントごとのオーバーライドに同等の `memorySearch` 設定を適用することもできます。

Gateway から同一エージェントの DM を呼び出す場合:

<Tabs>
  <Tab title="組み込みバックエンド">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD バックエンド">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

QMD を使用する場合、`agents.defaults.memorySearch.experimental.sessionMemory` と
`sources: ["sessions"]` だけでは、トランスクリプトは QMD にエクスポートされません。
`memory.qmd.sessions.enabled: true` も設定してください。

---

  ## SQLite ベクトル高速化（sqlite-vec）

  | キー                         | 型        | デフォルト | 説明                                 |
  | ---------------------------- | --------- | ---------- | ------------------------------------ |
  | `store.vector.enabled`       | `boolean` | `true`     | ベクトルクエリに sqlite-vec を使用する |
  | `store.vector.extensionPath` | `string`  | bundled    | sqlite-vec のパスを上書きする          |

  sqlite-vec が利用できない場合、OpenClaw は自動的にプロセス内のコサイン類似度へフォールバックします。

  ---

  ## インデックスストレージ

  組み込みのメモリインデックスは、各エージェントの OpenClaw SQLite データベース
  `agents/<agentId>/agent/openclaw-agent.sqlite` に保存されます。

  | キー                  | 型       | デフォルト  | 説明                                       |
  | --------------------- | -------- | ----------- | ------------------------------------------ |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5 トークナイザー（`unicode61` または `trigram`） |

  ---

  ## QMD バックエンド設定

  有効にするには `memory.backend = "qmd"` を設定します。すべての QMD 設定は `memory.qmd` 配下にあります。

  | キー                     | 型        | デフォルト | 説明                                                                                          |
  | ------------------------ | --------- | ---------- | --------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`      | QMD 実行ファイルのパス。サービスの `PATH` がシェルと異なる場合は絶対パスを設定します                |
  | `searchMode`             | `string`  | `search`   | 検索コマンド：`search`、`vsearch`、`query`                                                       |
  | `rerank`                 | `boolean` | --         | QMD 2.1+ で `searchMode: "query"` を使用する場合、QMD の再ランキングを省略するには `false` に設定します |
  | `includeDefaultMemory`   | `boolean` | `true`     | `MEMORY.md` + `memory/**/*.md` を自動的にインデックス化します                                    |
  | `paths[]`                | `array`   | --         | 追加パス：`{ name, path, pattern? }`                                                            |
  | `sessions.enabled`       | `boolean` | `false`    | セッショントランスクリプトを QMD にエクスポートします                                              |
  | `sessions.retentionDays` | `number`  | --         | トランスクリプトの保持期間                                                                        |
  | `sessions.exportDir`     | `string`  | --         | エクスポートディレクトリ                                                                          |

  `searchMode: "search"` は字句/BM25 のみです。このモードでは、`memory status --deep` の実行時を含め、OpenClaw はセマンティックベクトルの準備状況プローブや QMD 埋め込みのメンテナンスを実行しません。`vsearch` と `query` では引き続き QMD ベクトルの準備完了と埋め込みが必要です。

  `rerank: false` は QMD の `query` モードのみを変更し、QMD 2.1 以降が必要です。直接 CLI モードでは OpenClaw は `--no-rerank` を渡し、mcporter を使用する MCP モードでは QMD の統合クエリツールに `rerank: false` を渡します。QMD のデフォルトのクエリ再ランキング動作を使用するには、未設定のままにしてください。

  OpenClaw は現在の QMD コレクションおよび MCP クエリ形式を優先しますが、必要に応じて互換性のあるコレクションパターンフラグや旧 MCP ツール名を試すことで、古い QMD リリースも引き続き動作させます。QMD が複数のコレクションフィルターへの対応を通知する場合、同一ソースのコレクションは単一の QMD プロセスで検索されます。古い QMD ビルドでは、コレクションごとの互換パスが維持されます。同一ソースとは、永続メモリコレクション（デフォルトのメモリファイルとカスタムパス）がまとめてグループ化されることを意味します。一方、セッショントランスクリプトのコレクションは別のグループとして維持されるため、ソースの多様化では引き続き両方の入力が使用されます。

  <Note>
  QMD モデルの上書きは OpenClaw 設定ではなく、QMD 側で行います。QMD のモデルをグローバルに上書きする必要がある場合は、Gateway ランタイム環境で `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL`、`QMD_GENERATE_MODEL` などの環境変数を設定します。
  </Note>

  ### mcporter 連携

  すべて `memory.qmd.mcporter` 配下にあります。クエリごとに `qmd` を起動する代わりに、長時間稼働する `mcporter` MCP デーモンを介して QMD 検索をルーティングし、大規模モデルのコールドスタートによるオーバーヘッドを削減します。

  | キー          | 型        | デフォルト | 説明                                                                    |
  | ------------- | --------- | ---------- | ----------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`    | リクエストごとに `qmd` を起動する代わりに、QMD 呼び出しを mcporter 経由でルーティングします |
  | `serverName`  | `string`  | `qmd`      | `lifecycle: keep-alive` で `qmd mcp` を実行する mcporter サーバー名          |
  | `startDaemon` | `boolean` | `true`     | `enabled` が true の場合に mcporter デーモンを自動的に起動します               |

  `mcporter` がインストールされ、PATH 上に存在することに加え、`qmd mcp` を実行する mcporter サーバーが設定されている必要があります。クエリごとのプロセス起動コストを許容できる、より単純なローカルセットアップでは無効のままにしてください。

  <AccordionGroup>
  <Accordion title="更新スケジュール">
    | キー                      | 型        | デフォルト | 説明                                                                        |
    | ------------------------- | --------- | ---------- | --------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`       | 更新間隔                                                                    |
    | `update.debounceMs`       | `number`  | `15000`    | ファイル変更をデバウンスする                                                   |
    | `update.onBoot`           | `boolean` | `true`     | 長時間稼働する QMD マネージャーを開いたときに更新する。起動直後の更新を省略するには false に設定します |
    | `update.startup`          | `string`  | `off`      | オプションの Gateway 起動時 QMD 初期化：`off`、`idle`、または `immediate`              |
    | `update.startupDelayMs`   | `number`  | `120000`   | `startup: "idle"` の更新を実行するまでの遅延                                    |
    | `update.waitForBootSync`  | `boolean` | `false`    | 最初の更新が完了するまでマネージャーを開く処理をブロックする                            |
    | `update.embedInterval`    | `string`  | `60m`      | 個別の埋め込み実行間隔                                                         |
    | `update.commandTimeoutMs` | `number`  | `30000`    | QMD メンテナンスコマンド（コレクションの一覧表示/追加）のタイムアウト                    |
    | `update.updateTimeoutMs`  | `number`  | `120000`   | 各 `qmd update` サイクルのタイムアウト                                          |
    | `update.embedTimeoutMs`   | `number`  | `120000`   | 各 `qmd embed` サイクルのタイムアウト                                           |
  </Accordion>
  <Accordion title="制限">
    | キー                      | 型       | デフォルト | 説明                         |
    | ------------------------- | -------- | ---------- | ---------------------------- |
    | `limits.maxResults`       | `number` | `4`        | 検索結果の最大数               |
    | `limits.maxSnippetChars`  | `number` | `450`      | スニペットの長さを制限する        |
    | `limits.maxInjectedChars` | `number` | `2200`     | 挿入される合計文字数を制限する     |
    | `limits.timeoutMs`        | `number` | `4000`     | 検索タイムアウト                 |
  </Accordion>
  <Accordion title="スコープ">
    QMD の検索結果を受信できるセッションを制御します。[`session.sendPolicy`](/ja-JP/gateway/config-agents#session) と同じスキーマです。

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

    出荷時のデフォルトでは DM/ダイレクトのみに許可され、グループやその他のチャンネル種別は拒否されます。`match.keyPrefix` は正規化されたセッションキーに一致し、`match.rawKeyPrefix` は `agent:<id>:` を含む未加工のキーに一致します。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` はすべてのバックエンドに適用されます。

    | 値               | 動作                                                        |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（デフォルト） | スニペットに `Source: <path#line>` フッターを含める          |
    | `on`             | 常にフッターを含める                                         |
    | `off`            | フッターを省略する（パスは引き続き内部でエージェントに渡されます） |

  </Accordion>
</AccordionGroup>

Gateway 起動時の QMD 初期化が有効な場合、OpenClaw は対象となるエージェントに対してのみ QMD を起動します。`update.onBoot` が true で、間隔ベースまたは埋め込みのメンテナンスが設定されていない場合、起動時にはブート更新用のワンショットマネージャーを使用し、その後終了します。更新または埋め込みの間隔が設定されている場合、起動時に長時間稼働する QMD マネージャーを開き、ウォッチャーと間隔タイマーを管理させます。`update.onBoot: false` では、ブート直後の更新のみがスキップされます。

### QMD の完全な例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
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

Dreaming は `agents.defaults.memorySearch` ではなく、`plugins.entries.memory-core.config.dreaming` で設定します。

Dreaming は単一のスケジュールされたスイープとして実行され、内部の light/deep/REM フェーズを実装の詳細として使用します。

概念的な動作とスラッシュコマンドについては、[Dreaming](/ja-JP/concepts/dreaming)を参照してください。

### ユーザー設定

| キー                                   | 型        | デフォルト        | 説明                                                                                                                                    |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | Dreaming 全体を有効または無効にする                                                                                                      |
| `frequency`                            | `string`  | `0 3 * * *`   | Dreaming の完全なスイープを実行する任意の Cron スケジュール                                                                                 |
| `model`                                | `string`  | デフォルトモデル | 任意の Dream Diary サブエージェントモデルのオーバーライド                                                                                   |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | `MEMORY.md` に昇格される各短期リコールスニペットから保持する推定トークンの最大数。来歴メタデータは引き続き表示されます |

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
- Dreaming はマシン状態を `memory/.dreams/` に書き込みます。
- Dreaming は人が読めるナラティブ出力を `DREAMS.md`（または既存の `dreams.md`）に書き込みます。
- `dreaming.model` は既存の Plugin サブエージェント信頼ゲートを使用します。有効にする前に `plugins.entries.memory-core.subagent.allowModelOverride: true` を設定してください。
- 設定したモデルが利用できない場合、Dream Diary はセッションのデフォルトモデルを使用して一度再試行します。信頼または許可リストの失敗はログに記録され、暗黙には再試行されません。
- light/deep/REM フェーズのポリシーとしきい値は内部動作であり、ユーザー向け設定ではありません。

</Note>

## 関連項目

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [メモリの概要](/ja-JP/concepts/memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
