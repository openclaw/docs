---
read_when:
    - メモリ検索プロバイダーまたは埋め込みモデルを構成したい
    - QMD バックエンドを設定する
    - ハイブリッド検索、MMR、または時間減衰を調整したい
    - マルチモーダルメモリインデックス作成を有効にする場合
sidebarTitle: Memory config
summary: メモリ検索、埋め込みプロバイダー、QMD、ハイブリッド検索、マルチモーダルインデックス作成のすべての設定項目
title: メモリ設定リファレンス
x-i18n:
    generated_at: "2026-07-05T11:48:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a31a8f3a77b994ca394612f39c2134527a4c7b25baec9ab280c6e3ee7ac0b0f1
    source_path: reference/memory-config.md
    workflow: 16
---

このページでは、OpenClaw のメモリ検索に関するすべての設定項目を一覧にしています。概念的な概要については、次を参照してください。

<CardGroup cols={2}>
  <Card title="メモリ概要" href="/ja-JP/concepts/memory">
    メモリの仕組み。
  </Card>
  <Card title="組み込みエンジン" href="/ja-JP/concepts/memory-builtin">
    デフォルトの SQLite バックエンド。
  </Card>
  <Card title="QMD エンジン" href="/ja-JP/concepts/memory-qmd">
    ローカル優先のサイドカー。
  </Card>
  <Card title="メモリ検索" href="/ja-JP/concepts/memory-search">
    検索パイプラインとチューニング。
  </Card>
  <Card title="Active Memory" href="/ja-JP/concepts/active-memory">
    対話型セッション用のメモリサブエージェント。
  </Card>
</CardGroup>

特に記載がない限り、すべてのメモリ検索設定は `openclaw.json` の `agents.defaults.memorySearch`（またはエージェントごとの `agents.list[].memorySearch` オーバーライド）配下にあります。

<Note>
**Active Memory** 機能トグルとサブエージェント設定を探している場合、それは `memorySearch` ではなく `plugins.entries.active-memory` 配下にあります。

Active Memory は 2 つのゲートモデルを使用します。

1. Plugin が有効で、現在のエージェント ID を対象にしている必要がある
2. リクエストが対象となる対話型の永続チャットセッションである必要がある

有効化モデル、Plugin 所有の設定、トランスクリプトの永続化、安全なロールアウトパターンについては、[Active Memory](/ja-JP/concepts/active-memory) を参照してください。
</Note>

---

## プロバイダー選択

| キー        | 型      | デフォルト          | 説明                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | メモリ検索を有効または無効にする                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible`、`voyage` などの埋め込みアダプター ID。`api` がメモリ埋め込みアダプターまたは OpenAI 互換モデル API を指す、設定済みの `models.providers.<id>` にすることもできます |
| `model`    | `string`  | プロバイダーのデフォルト | 埋め込みモデル名                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | プライマリが失敗した場合のフォールバックアダプター ID                                                                                                                                                                                                                                                  |

`provider` が設定されていない場合、OpenClaw は OpenAI 埋め込みを使用します。Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、Voyage、ローカル GGUF モデル、または OpenAI 互換の `/v1/embeddings` エンドポイントを使用するには、`provider` を明示的に設定してください。まだ `provider: "auto"` と記述されているレガシー設定は `openai` に解決されます。

<Warning>
埋め込みプロバイダー、モデル、プロバイダー設定、ソース、スコープ、チャンク化、またはトークナイザーを変更すると、既存の SQLite ベクトルインデックスと互換性がなくなる可能性があります。OpenClaw はすべてを自動的に再埋め込みするのではなく、ベクトル検索を一時停止してインデックス ID 警告を報告します。準備ができたら、`openclaw memory status --index --agent <id>` または `openclaw memory index --force --agent <id>` で再構築してください。
</Warning>

`provider` が未設定の場合、レガシーの `provider: "auto"` が存在する場合、または `provider: "none"` が意図的に FTS のみのモードを選択している場合、埋め込みが利用できなくても、メモリ呼び出しは語彙的な FTS ランキングを使用できます。

明示的な非ローカルプロバイダーはフェイルクローズします。`memorySearch.provider` を Bedrock、DeepInfra、Gemini、GitHub Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage、または OpenAI 互換のカスタムプロバイダーなど、具体的なリモートバックエンド付きプロバイダーに設定し、そのプロバイダーが実行時に利用できない場合、`memory_search` は FTS のみの呼び出しを暗黙に使用するのではなく、利用不可の結果を返します。プロバイダーや認証の設定を修正するか、到達可能なプロバイダーに切り替えるか、意図的に FTS のみの呼び出しを行いたい場合は `provider: "none"` を設定してください。

### カスタムプロバイダー ID

`memorySearch.provider` は、`ollama` などのメモリ固有プロバイダーアダプターや、`openai-responses` / `openai-completions` などの OpenAI 互換モデル API 用に、カスタム `models.providers.<id>` エントリを指すことができます。OpenClaw は埋め込みアダプター用にそのプロバイダーの `api` 所有者を解決しつつ、エンドポイント、認証、モデルプレフィックス処理のためにカスタムプロバイダー ID を保持します。これにより、マルチ GPU またはマルチホスト構成で、メモリ埋め込みを特定のローカルエンドポイント専用にできます。

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

### API キー解決

リモート埋め込みには API キーが必要です。Bedrock は代わりに AWS SDK のデフォルト認証情報チェーン（インスタンスロール、SSO、アクセスキー、または Bedrock API キー）を使用します。

| プロバイダー       | 環境変数                                             | 設定キー                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 認証情報チェーン、または `AWS_BEARER_TOKEN_BEDROCK` | API キーは不要                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | デバイスログイン経由の認証プロファイル       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（プレースホルダー）                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth はチャット/補完のみを対象としており、埋め込みリクエストには使用できません。
</Note>

---

## リモートエンドポイント設定

グローバルな OpenAI チャット認証情報を継承すべきではない、汎用の OpenAI 互換 `/v1/embeddings` サーバーには `provider: "openai-compatible"` を使用します。

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
    | キー                    | 型     | デフォルト                | 説明                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` もサポートします |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 の場合: 768、1536、または 3072        |

    <Warning>
    モデルまたは `outputDimensionality` を変更すると、インデックス ID が変わります。OpenClaw は、メモリインデックスを明示的に再構築するまでベクトル検索を一時停止します。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 互換入力タイプ">
    OpenAI 互換の埋め込みエンドポイントは、プロバイダー固有の `input_type` リクエストフィールドをオプトインで使用できます。これは、クエリ埋め込みとドキュメント埋め込みに異なるラベルを必要とする非対称埋め込みモデルに便利です。

    | キー                 | 型     | デフォルト | 説明                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | 未設定   | クエリ埋め込みとドキュメント埋め込みで共有する `input_type`   |
    | `queryInputType`    | `string` | 未設定   | クエリ時の `input_type`; `inputType` をオーバーライド          |
    | `documentInputType` | `string` | 未設定   | インデックス/ドキュメントの `input_type`; `inputType` をオーバーライド      |

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

    これらの値を変更すると、プロバイダーのバッチインデックス作成における埋め込みキャッシュ ID に影響します。上流モデルがラベルを異なるものとして扱う場合は、メモリの再インデックスを行ってください。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 埋め込み設定

    Bedrock は AWS SDK のデフォルト認証情報チェーンに加えて OpenClaw が確認するベアラートークンを使用するため、設定に API キーは保存されません。OpenClaw が Bedrock 対応のインスタンスロールを持つ EC2 で実行されている場合は、プロバイダーとモデルを設定するだけです。

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
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意の Bedrock 埋め込みモデル ID  |
    | `outputDimensionality` | `number` | モデルのデフォルト                  | Titan V2 の場合: 256、512、または 1024 |

    **サポートされているモデル**（ファミリー検出と次元数のデフォルトを含む）:

    | モデル ID                                   | プロバイダー   | デフォルト次元 | 設定可能な次元          |
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

    スループット接尾辞付きのバリアント（例: `amazon.titan-embed-text-v1:2:8k`）と、リージョン接頭辞付きの推論プロファイル ID（例: `us.amazon.titan-embed-text-v2:0`）は、ベースモデルの設定を継承します。

    **リージョン:** 次の順序で解決されます: `memorySearch.remote.baseUrl` オーバーライド、`models.providers.amazon-bedrock.baseUrl` 設定、`AWS_REGION`、`AWS_DEFAULT_REGION`、その後デフォルトの `us-east-1`。

    **認証:** OpenClaw はまず `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` または `AWS_BEARER_TOKEN_BEDROCK` を確認し、その後、標準の AWS SDK デフォルト認証情報プロバイダーチェーンにフォールスルーします。

    1. 環境変数（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）。ただし `AWS_PROFILE` も設定されている場合を除く
    2. SSO（SSO フィールドが設定されている場合のみ）
    3. 共有認証情報ファイルと設定ファイル（`fromIni`、`AWS_PROFILE` を含む）
    4. 認証情報プロセス（AWS 設定ファイル内の `credential_process`）
    5. Web ID トークン認証情報
    6. ECS または EC2 インスタンスメタデータ認証情報

    **IAM 権限:** IAM ロールまたはユーザーには次が必要です。

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    最小権限にするには、`InvokeModel` を特定のモデルにスコープします。

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="ローカル（GGUF + llama.cpp）">
    | キー                   | 型               | デフォルト                | 説明                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動ダウンロード        | GGUF モデルファイルへのパス                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp デフォルト | ダウンロードしたモデル用のキャッシュディレクトリ                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 埋め込みコンテキストのコンテキストウィンドウサイズ。4096 は典型的なチャンク（128-512 トークン）をカバーしつつ、重み以外の VRAM を制限します。制約のあるホストでは 1024-2048 に下げてください。`"auto"` はモデルの学習済み最大値を使用します。8B+ モデルには推奨されません（Qwen3-Embedding-8B: 最大 40 960 トークンで VRAM が約 32 GB まで増える可能性があります）。 |

    まず公式 llama.cpp プロバイダーをインストールします: `openclaw plugins install @openclaw/llama-cpp-provider`。
    デフォルトモデル: `embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB、自動ダウンロード）。ソースチェックアウトでは引き続きネイティブビルドの承認が必要です: `pnpm approve-builds` の後に `pnpm rebuild node-llama-cpp`。

    Gateway が使用するものと同じプロバイダーパスを検証するには、スタンドアロン CLI を使用します。

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    ローカル GGUF 埋め込みには `provider: "local"` を明示的に設定します。`hf:` と HTTP(S) モデル参照は、明示的なローカル設定でサポートされます（node-llama-cpp のモデル解決経由）が、デフォルトプロバイダーは変更されません。

  </Accordion>
</AccordionGroup>

### インライン埋め込みタイムアウト

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  メモリインデックス作成中のインライン埋め込みバッチのタイムアウトを上書きします。

未設定の場合はプロバイダーのデフォルトを使用します。`local`、`ollama`、`lmstudio` などのローカル/セルフホスト型プロバイダーでは 600 秒、ホスト型プロバイダーでは 120 秒です。ローカルの CPU バウンドな埋め込みバッチが正常だが遅い場合は、この値を増やしてください。
</ParamField>

---

## インデックス作成の動作

特記がない限り、すべて `memorySearch.sync` 配下です。

| キー                            | 型      | デフォルト | 説明                                                           |
| ------------------------------ | --------- | ------- | --------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`  | セッション開始時にメモリインデックスを同期する                           |
| `onSearch`                     | `boolean` | `true`  | コンテンツ変更を検出した後、検索時に遅延同期する                 |
| `watch`                        | `boolean` | `true`  | メモリファイルを監視（chokidar）し、変更時に再インデックスをスケジュールする         |
| `watchDebounceMs`              | `number`  | `1500`  | 急速なファイル監視イベントをまとめるためのデバウンスウィンドウ                |
| `intervalMinutes`              | `number`  | `0`     | 分単位の定期再インデックス間隔（`0` で無効）                   |
| `sessions.postCompactionForce` | `boolean` | `true`  | Compaction によってトリガーされたトランスクリプト更新後に、セッションの再インデックスを強制する |

<ParamField path="chunking.tokens" type="number">
  埋め込み前にメモリソースを分割するときに使用する、トークン単位のチャンクサイズ（デフォルト: 400）。
</ParamField>
<ParamField path="chunking.overlap" type="number">
  分割境界付近のコンテキストを保持するための隣接チャンク間のトークン重複（デフォルト: 80）。
</ParamField>

<Note>
`chunking.tokens` または `chunking.overlap` を変更すると、チャンク境界が変わり、既存のインデックス ID が無効になります（プロバイダー選択の下にある警告を参照）。
</Note>

---

## ハイブリッド検索設定

すべて `memorySearch.query` 配下です。

| キー          | 型     | デフォルト | 説明                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | 注入前に返されるメモリヒットの最大数 |
| `minScore`   | `number` | `0.35`  | ヒットを含めるための最小関連度スコア  |

そして `memorySearch.query.hybrid` 配下です。

| キー                   | 型      | デフォルト | 説明                        |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | ハイブリッド BM25 + ベクトル検索を有効にする |
| `vectorWeight`        | `number`  | `0.7`   | ベクトルスコアの重み（0-1）     |
| `textWeight`          | `number`  | `0.3`   | BM25 スコアの重み（0-1）       |
| `candidateMultiplier` | `number`  | `4`     | 候補プールサイズの乗数     |

<Tabs>
  <Tab title="MMR（多様性）">
    | キー           | 型      | デフォルト | 説明                          |
    | ------------- | --------- | ------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | MMR 再ランキングを有効にする                |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多様性、1 = 最大関連性 |
  </Tab>
  <Tab title="時間的減衰（新しさ）">
    | キー                          | 型      | デフォルト | 説明               |
    | ---------------------------- | --------- | ------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 新しさブーストを有効にする      |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | N 日ごとにスコアが半減する |

    エバーグリーンファイル（`MEMORY.md`、`memory/` 内の日付なしファイル）は減衰されません。

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

| キー          | 型       | 説明                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | インデックス対象にする追加のディレクトリまたはファイル |

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

パスは絶対パスまたはワークスペース相対にできます。ディレクトリは `.md` ファイルを対象に再帰的にスキャンされます。シンボリックリンクの扱いはアクティブなバックエンドに依存します。組み込みエンジンはシンボリックリンクをスキップし、QMD は基盤となる QMD スキャナーの動作に従います。

エージェントスコープのクロスエージェントトランスクリプト検索には、`memory.qmd.paths` の代わりに `agents.list[].memorySearch.qmd.extraCollections` を使用します。これらの追加コレクションは同じ `{ path, name, pattern? }` 形状に従いますが、エージェントごとにマージされ、パスが現在のワークスペース外を指している場合は明示的な共有名を保持できます。同じ解決済みパスが `memory.qmd.paths` と `memorySearch.qmd.extraCollections` の両方に現れる場合、QMD は最初のエントリを保持し、重複をスキップします。

---

## マルチモーダルメモリ（Gemini）

Gemini Embedding 2 を使用して、Markdown と一緒に画像と音声をインデックス化します。

| キー                       | 型       | デフォルト    | 説明                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | マルチモーダルインデックス作成を有効にする             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]`、または `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | インデックス対象の最大ファイルサイズ（10 MiB）    |

<Note>
`extraPaths` 内のファイルにのみ適用されます。デフォルトのメモリルートは Markdown のみに留まります。`gemini-embedding-2-preview` が必要です。`fallback` は `"none"` でなければなりません。
</Note>

対応形式: `.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（画像）; `.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音声）。

---

## 埋め込みキャッシュ

| キー                | 型      | デフォルト | 説明                                  |
| ------------------ | --------- | ------- | -------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | チャンクの埋め込みを SQLite にキャッシュする             |
| `cache.maxEntries` | `number`  | 未設定   | キャッシュ済み埋め込み数の努力目標としての上限 |

再インデックスやトランスクリプト更新時に、変更されていないテキストを再埋め込みしないようにします。無制限キャッシュにする場合は `maxEntries` を未設定のままにします。ピーク時の再インデックス速度よりもディスク増加を重視する場合に設定します。設定すると、キャッシュが上限を超えた時点で、最終更新時刻が古いエントリから先に削除されます。

---

## バッチインデックス作成

| キー                           | 型      | デフォルト | 説明                |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 並列インライン埋め込み |
| `remote.batch.enabled`        | `boolean` | `false` | バッチ埋め込み API を有効化 |
| `remote.batch.concurrency`    | `number`  | `2`     | 並列バッチジョブ        |
| `remote.batch.wait`           | `boolean` | `true`  | バッチ完了を待機  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`  | ポーリング間隔              |
| `remote.batch.timeoutMinutes` | `number`  | `60`    | バッチタイムアウト              |

`gemini`、`openai`、`voyage` で利用できます。OpenAI のバッチは、大規模なバックフィルでは通常最速かつ最安です。

`remote.nonBatchConcurrency` は、ローカル/セルフホストプロバイダー、およびプロバイダーのバッチ API が有効でない場合のホスト型プロバイダーで使われるインライン埋め込み呼び出しを制御します。Ollama は、小規模なローカルホストに負荷をかけすぎないよう、非バッチインデックス作成ではデフォルトで `1` になります。より大きなマシンでは高い値を設定してください。

これは、インライン埋め込み呼び出しのタイムアウトを制御する `sync.embeddingBatchTimeoutSeconds` とは別です。

---

## セッションメモリ検索（実験的）

セッションのトランスクリプトをインデックス化し、`memory_search` 経由で表示します。

| キー                           | 型       | デフォルト      | 説明                             |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | セッションインデックス作成を有効化                 |
| `sources`                     | `string[]` | `["memory"]` | トランスクリプトを含めるには `"sessions"` を追加 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 再インデックスのバイトしきい値              |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 再インデックスのメッセージしきい値           |

<Warning>
セッションインデックス作成はオプトインで、非同期に実行されます。結果は少し古い場合があります。セッションログはディスク上に保存されるため、ファイルシステムアクセスを信頼境界として扱ってください。
</Warning>

セッショントランスクリプトのヒットも
[`tools.sessions.visibility`](/ja-JP/gateway/config-tools#toolssessions) に従います。デフォルトの
`tree` 可視性では、現在のセッションと、それが生成したセッションだけが公開されます。DM など、別の
セッションから、同じエージェントの無関係な Gateway ディスパッチセッションを
思い出すには、意図的に可視性を `agent` に広げてください（エージェント間の想起も
必要で、エージェント間ポリシーが許可する場合に限り `all`）。

以下の例では、これらの設定を `agents.defaults` の下に配置しています。1 つの
エージェントだけがセッショントランスクリプトをインデックス化して検索すべき場合は、
エージェントごとのオーバーライドで同等の `memorySearch` 設定を適用することもできます。

同じエージェントの Gateway から DM への想起の場合:

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
`sources: ["sessions"]` だけでは、トランスクリプトは QMD にエクスポートされません。あわせて
`memory.qmd.sessions.enabled: true` も設定してください。

---

## SQLite ベクトル高速化（sqlite-vec）

| キー                          | 型      | デフォルト | 説明                       |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ベクトルクエリに sqlite-vec を使用 |
| `store.vector.extensionPath` | `string`  | 同梱 | sqlite-vec パスを上書きする          |

  sqlite-vec が利用できない場合、OpenClaw は自動的にプロセス内のコサイン類似度にフォールバックします。

  ---

  ## インデックスストレージ

  組み込みメモリインデックスは、各エージェントの OpenClaw SQLite データベース
  `agents/<agentId>/agent/openclaw-agent.sqlite` にあります。

  | キー                  | 型       | デフォルト | 説明                                      |
  | --------------------- | -------- | ----------- | ----------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | FTS5 トークナイザー（`unicode61` または `trigram`） |

  ---

  ## QMD バックエンド設定

  有効にするには `memory.backend = "qmd"` を設定します。すべての QMD 設定は `memory.qmd` 配下にあります。

  | キー                     | 型        | デフォルト | 説明                                                                                           |
  | ------------------------ | --------- | -------- | ---------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`    | QMD 実行可能ファイルのパス。サービスの `PATH` がシェルと異なる場合は絶対パスを設定します |
  | `searchMode`             | `string`  | `search` | 検索コマンド: `search`、`vsearch`、`query`                                                     |
  | `rerank`                 | `boolean` | --       | QMD の再ランキングをスキップするには、`searchMode: "query"` および QMD 2.1+ で `false` に設定します |
  | `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` を自動インデックス化します                                      |
  | `paths[]`                | `array`   | --       | 追加パス: `{ name, path, pattern? }`                                                           |
  | `sessions.enabled`       | `boolean` | `false`  | セッショントランスクリプトを QMD にエクスポートします                                         |
  | `sessions.retentionDays` | `number`  | --       | トランスクリプト保持期間                                                                       |
  | `sessions.exportDir`     | `string`  | --       | エクスポートディレクトリ                                                                       |

  `searchMode: "search"` は字句/BM25 のみです。OpenClaw は、そのモードでは `memory status --deep` の実行中も含め、セマンティックベクトルの準備状況プローブや QMD 埋め込みメンテナンスを実行しません。`vsearch` と `query` は引き続き QMD ベクトルの準備状況と埋め込みを必要とします。

  `rerank: false` は QMD の `query` モードのみを変更し、QMD 2.1 以降が必要です。直接 CLI モードでは OpenClaw は `--no-rerank` を渡します。mcporter ベースの MCP モードでは、QMD の統合クエリツールに `rerank: false` を渡します。QMD のデフォルトのクエリ再ランキング動作を使用するには未設定のままにします。

  OpenClaw は現在の QMD コレクションと MCP クエリ形式を優先しますが、必要に応じて互換性のあるコレクションパターンフラグや古い MCP ツール名を試すことで、古い QMD リリースも動作するようにしています。QMD が複数のコレクションフィルターのサポートを通知する場合、同一ソースのコレクションは 1 つの QMD プロセスで検索されます。古い QMD ビルドではコレクションごとの互換性パスが維持されます。同一ソースとは、永続メモリコレクション（デフォルトのメモリファイルとカスタムパス）がまとめてグループ化されることを意味します。一方、セッショントランスクリプトコレクションは別のグループのままなので、ソースの多様化では引き続き両方の入力を利用できます。

  <Note>
  QMD モデルのオーバーライドは OpenClaw 設定ではなく、QMD 側に残ります。QMD のモデルをグローバルにオーバーライドする必要がある場合は、Gateway ランタイム環境で `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL`、`QMD_GENERATE_MODEL` などの環境変数を設定します。
  </Note>

  ### mcporter 連携

  すべて `memory.qmd.mcporter` 配下です。クエリごとに `qmd` を起動する代わりに、長時間稼働する `mcporter` MCP デーモン経由で QMD 検索をルーティングし、大きなモデルでのコールドスタートのオーバーヘッドを削減します。

  | キー          | 型        | デフォルト | 説明                                                                           |
  | ------------- | --------- | ------- | ------------------------------------------------------------------------------ |
  | `enabled`     | `boolean` | `false` | リクエストごとに `qmd` を起動する代わりに、QMD 呼び出しを mcporter 経由でルーティングします |
  | `serverName`  | `string`  | `qmd`   | `lifecycle: keep-alive` で `qmd mcp` を実行する mcporter サーバー名            |
  | `startDaemon` | `boolean` | `true`  | `enabled` が true の場合、mcporter デーモンを自動的に起動します                |

  `mcporter` がインストールされ PATH 上にあり、さらに `qmd mcp` を実行する mcporter サーバーが設定されている必要があります。クエリごとのプロセス起動コストが許容できる、より単純なローカルセットアップでは無効のままにします。

  <AccordionGroup>
  <Accordion title="更新スケジュール">
    | キー                      | 型        | デフォルト | 説明                                                                            |
    | --------------------------- | --------- | -------- | ------------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | 更新間隔                                                                        |
    | `update.debounceMs`       | `number`  | `15000` | ファイル変更をデバウンスします                                                  |
    | `update.onBoot`           | `boolean` | `true`  | 長時間稼働する QMD マネージャーが開いたときに更新します。即時の起動時更新をスキップするには false に設定します |
    | `update.startup`          | `string`  | `off`   | 任意の Gateway 起動時 QMD 初期化: `off`、`idle`、または `immediate`             |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` の更新が実行されるまでの遅延                                  |
    | `update.waitForBootSync`  | `boolean` | `false` | 初回更新が完了するまでマネージャーの起動をブロックします                       |
    | `update.embedInterval`    | `string`  | `60m`   | 個別の埋め込み頻度                                                              |
    | `update.commandTimeoutMs` | `number`  | `30000` | QMD メンテナンスコマンド（コレクション一覧/追加）のタイムアウト                 |
    | `update.updateTimeoutMs`  | `number`  | `120000` | 各 `qmd update` サイクルのタイムアウト                                          |
    | `update.embedTimeoutMs`   | `number`  | `120000` | 各 `qmd embed` サイクルのタイムアウト                                           |
  </Accordion>
  <Accordion title="制限">
    | キー                      | 型       | デフォルト | 説明                             |
    | --------------------------- | -------- | ------- | -------------------------------- |
    | `limits.maxResults`       | `number` | `4`     | 最大検索結果数                   |
    | `limits.maxSnippetChars`  | `number` | `450`   | スニペット長を制限します         |
    | `limits.maxInjectedChars` | `number` | `2200`  | 挿入される合計文字数を制限します |
    | `limits.timeoutMs`        | `number` | `4000`  | 検索タイムアウト                 |
  </Accordion>
  <Accordion title="スコープ">
    どのセッションが QMD 検索結果を受け取れるかを制御します。[`session.sendPolicy`](/ja-JP/gateway/config-agents#session) と同じスキーマです。

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

    出荷時のデフォルトは DM/ダイレクトのみで、グループやその他のチャネルタイプは拒否されます。`match.keyPrefix` は正規化されたセッションキーに一致します。`match.rawKeyPrefix` は `agent:<id>:` を含む生キーに一致します。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` はすべてのバックエンドに適用されます:

    | 値            | 動作                                            |
    | ------------------ | ------------------------------------------------------ |
    | `auto` (デフォルト) | スニペットに `Source: <path#line>` フッターを含める    |
    | `on`             | 常にフッターを含める                               |
    | `off`            | フッターを省略する（パスは内部的にはエージェントに渡される） |

  </Accordion>
</AccordionGroup>

gateway-start QMD 初期化が有効な場合、OpenClaw は対象エージェントに対してのみ QMD を起動します。`update.onBoot` が true で、interval/embed メンテナンスが設定されていない場合、起動時はブート更新用のワンショットマネージャーを使用し、それを閉じます。update または embed interval が設定されている場合、起動時に長寿命の QMD マネージャーを開き、ウォッチャーと interval タイマーを所有できるようにします。`update.onBoot: false` は、即時のブート更新のみをスキップします。

### 完全な QMD の例

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

Dreaming は `agents.defaults.memorySearch` ではなく、`plugins.entries.memory-core.config.dreaming` の下で設定します。

Dreaming は 1 つのスケジュールされたスイープとして実行され、内部の light/deep/REM フェーズは実装詳細として使用します。

概念上の動作とスラッシュコマンドについては、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

### ユーザー設定

| キー                                    | 型      | デフォルト       | 説明                                                                                                                      |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | dreaming 全体を有効または無効にする                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | 完全な dreaming スイープの任意の cron 間隔                                                                                |
| `model`                                | `string`  | デフォルトモデル | 任意の Dream Diary サブエージェントモデルオーバーライド                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | `MEMORY.md` に昇格された各短期リコールスニペットから保持する推定トークンの最大数。来歴メタデータは引き続き表示される |

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
- Dreaming は人間が読めるナラティブ出力を `DREAMS.md`（または既存の `dreams.md`）に書き込みます。
- `dreaming.model` は既存の Plugin サブエージェントの信頼ゲートを使用します。有効にする前に `plugins.entries.memory-core.subagent.allowModelOverride: true` を設定してください。
- 設定されたモデルが利用できない場合、Dream Diary はセッションのデフォルトモデルで 1 回再試行します。信頼または許可リストの失敗はログに記録され、暗黙的に再試行されることはありません。
- light/deep/REM フェーズのポリシーとしきい値は内部動作であり、ユーザー向け設定ではありません。

</Note>

## 関連

- [設定リファレンス](/ja-JP/gateway/configuration-reference)
- [Memory 概要](/ja-JP/concepts/memory)
- [Memory 検索](/ja-JP/concepts/memory-search)
