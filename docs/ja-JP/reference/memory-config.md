---
read_when:
    - メモリ検索 provider または embedding モデルを設定したい場合
    - QMD バックエンドをセットアップしたい場合
    - hybrid search、MMR、または temporal decay を調整したい場合
    - マルチモーダルなメモリインデックス作成を有効にしたい場合
sidebarTitle: Memory config
summary: メモリ検索、embedding provider、QMD、hybrid search、およびマルチモーダルインデックス作成のすべての設定項目
title: メモリ設定リファレンス
x-i18n:
    generated_at: "2026-04-26T11:39:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

このページでは、OpenClaw メモリ検索のすべての設定項目を一覧します。概念的な概要については、以下を参照してください。

<CardGroup cols={2}>
  <Card title="Memory overview" href="/ja-JP/concepts/memory">
    メモリの仕組み。
  </Card>
  <Card title="Builtin engine" href="/ja-JP/concepts/memory-builtin">
    デフォルトの SQLite バックエンド。
  </Card>
  <Card title="QMD engine" href="/ja-JP/concepts/memory-qmd">
    ローカルファーストの sidecar。
  </Card>
  <Card title="Memory search" href="/ja-JP/concepts/memory-search">
    検索パイプラインとチューニング。
  </Card>
  <Card title="Active memory" href="/ja-JP/concepts/active-memory">
    インタラクティブセッション向けのメモリサブエージェント。
  </Card>
</CardGroup>

特記がない限り、すべてのメモリ検索設定は `openclaw.json` の `agents.defaults.memorySearch` 配下にあります。

<Note>
**Active Memory** の機能トグルとサブエージェント設定を探している場合、それらは `memorySearch` ではなく `plugins.entries.active-memory` 配下にあります。

Active Memory は2段階のゲートモデルを使用します。

1. Plugin が有効であり、現在の agent id を対象としていること
2. リクエストが対象となるインタラクティブな永続チャットセッションであること

有効化モデル、Plugin 管理の設定、transcript 永続化、および安全なロールアウトパターンについては、[Active Memory](/ja-JP/concepts/active-memory) を参照してください。
</Note>

---

## Provider の選択

| Key        | Type      | Default          | 説明                                                                                     |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自動検出         | Embedding adapter ID: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | provider デフォルト | Embedding モデル名                                                                       |
| `fallback` | `string`  | `"none"`         | プライマリが失敗したときの fallback adapter ID                                           |
| `enabled`  | `boolean` | `true`           | メモリ検索を有効または無効にする                                                         |

### 自動検出の順序

`provider` が設定されていない場合、OpenClaw は最初に利用可能なものを選択します。

<Steps>
  <Step title="local">
    `memorySearch.local.modelPath` が設定されており、そのファイルが存在する場合に選択されます。
  </Step>
  <Step title="github-copilot">
    GitHub Copilot トークンを解決できる場合（環境変数または認証プロファイル）に選択されます。
  </Step>
  <Step title="openai">
    OpenAI key を解決できる場合に選択されます。
  </Step>
  <Step title="gemini">
    Gemini key を解決できる場合に選択されます。
  </Step>
  <Step title="voyage">
    Voyage key を解決できる場合に選択されます。
  </Step>
  <Step title="mistral">
    Mistral key を解決できる場合に選択されます。
  </Step>
  <Step title="bedrock">
    AWS SDK の credential chain が解決される場合（instance role、access key、profile、SSO、web identity、または shared config）に選択されます。
  </Step>
</Steps>

`ollama` はサポートされていますが、自動検出はされません（明示的に設定してください）。

### API key の解決

リモート embedding には API key が必要です。Bedrock は代わりに AWS SDK のデフォルト credential chain を使用します（instance role、SSO、access key）。

| Provider       | Env var                                            | Config key                        |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | AWS credential chain                               | API key は不要                    |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | device login による認証プロファイル |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` （プレースホルダー）              | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth は chat/completions のみを対象としており、embedding リクエストは満たしません。
</Note>

---

## リモート endpoint 設定

カスタムの OpenAI 互換 endpoint や provider デフォルトの上書き用:

<ParamField path="remote.baseUrl" type="string">
  カスタム API base URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  API key を上書きします。
</ParamField>
<ParamField path="remote.headers" type="object">
  追加の HTTP header（provider デフォルトとマージされます）。
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

## Provider 固有の設定

<AccordionGroup>
  <Accordion title="Gemini">
    | Key                    | Type     | Default                | 説明                                       |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` もサポート     |
    | `outputDimensionality` | `number` | `3072`                 | Embedding 2 では 768、1536、3072           |

    <Warning>
    model または `outputDimensionality` を変更すると、自動的に完全な再インデックスが実行されます。
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock は AWS SDK のデフォルト credential chain を使用します。API key は不要です。OpenClaw が Bedrock 有効化済みの instance role を持つ EC2 上で動作している場合は、provider と model を設定するだけです。

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

    | Key                    | Type     | Default                        | 説明                             |
    | ---------------------- | -------- | ------------------------------ | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意の Bedrock embedding model ID |
    | `outputDimensionality` | `number` | model デフォルト               | Titan V2 では 256、512、1024      |

    **サポートされるモデル**（ファミリー検出と次元数デフォルト付き）:

    | Model ID                                   | Provider   | デフォルト次元 | 設定可能な次元       |
    | ------------------------------------------ | ---------- | ------------- | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024          | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536          | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536          | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024          | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024          | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024          | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024          | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536          | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512           | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024          | --                   |

    スループット接尾辞付きバリアント（例: `amazon.titan-embed-text-v1:2:8k`）は、ベースモデルの設定を継承します。

    **認証:** Bedrock 認証では、標準の AWS SDK credential 解決順序を使用します。

    1. 環境変数（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
    2. SSO token cache
    3. Web identity token credential
    4. Shared credential および config file
    5. ECS または EC2 metadata credential

    Region は、`AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock` provider の `baseUrl` から解決されるか、デフォルトで `us-east-1` になります。

    **IAM 権限:** IAM role または user には以下が必要です。

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    最小権限にするには、`InvokeModel` を特定の model に限定します。

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Key                   | Type               | Default                | 説明                                                                                                                                                                                                                                                                                       |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | 自動ダウンロード       | GGUF model file のパス                                                                                                                                                                                                                                                                     |
    | `local.modelCacheDir` | `string`           | node-llama-cpp デフォルト | ダウンロードされた model 用の cache dir                                                                                                                                                                                                                                                    |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Embedding context の context window size。4096 は一般的な chunk（128〜512 token）をカバーしつつ、weight 以外の VRAM を抑えます。制約のあるホストでは 1024〜2048 に下げてください。`"auto"` は model の学習済み最大値を使います。8B+ model には推奨されません（Qwen3-Embedding-8B: 40 960 token → 約32 GB VRAM、4096 では約8.8 GB）。 |

    デフォルト model: `embeddinggemma-300m-qat-Q8_0.gguf`（約0.6 GB、自動ダウンロード）。ネイティブビルドが必要です: `pnpm approve-builds` の後に `pnpm rebuild node-llama-cpp` を実行してください。

    Gateway が使用するのと同じ provider パスを確認するには、スタンドアロン CLI を使用してください。

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    `provider` が `auto` の場合、`local` が選択されるのは `local.modelPath` が既存のローカル file を指しているときだけです。`hf:` および HTTP(S) model ref は、`provider: "local"` として明示的に使用することはできますが、model がディスク上で利用可能になる前に `auto` が local を選ぶことはありません。

  </Accordion>
</AccordionGroup>

### インライン embedding timeout

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  メモリインデックス作成中のインライン embedding batch の timeout を上書きします。

未設定の場合は provider デフォルトを使用します: `local`、`ollama`、`lmstudio` などの local/self-hosted provider では 600 秒、hosted provider では 120 秒です。ローカルの CPU バウンド embedding batch が健全だが遅い場合は、この値を増やしてください。
</ParamField>

---

## Hybrid search 設定

すべて `memorySearch.query.hybrid` 配下です:

| Key                   | Type      | Default | 説明                               |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | hybrid BM25 + vector search を有効にする |
| `vectorWeight`        | `number`  | `0.7`   | vector score の重み（0-1）         |
| `textWeight`          | `number`  | `0.3`   | BM25 score の重み（0-1）           |
| `candidateMultiplier` | `number`  | `4`     | 候補プールサイズの倍率             |

<Tabs>
  <Tab title="MMR（多様性）">
    | Key           | Type      | Default | 説明                                 |
    | ------------- | --------- | ------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false` | MMR 再ランキングを有効にする         |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大の多様性、1 = 最大の関連性   |
  </Tab>
  <Tab title="Temporal decay（新しさ）">
    | Key                          | Type      | Default | 説明                          |
    | ---------------------------- | --------- | ------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 新しさブーストを有効にする    |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | N 日ごとに score が半減する   |

    Evergreen file（`MEMORY.md`、`memory/` 内の非日付 file）には decay は適用されません。

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

## 追加のメモリパス

| Key          | Type       | 説明                                  |
| ------------ | ---------- | ------------------------------------- |
| `extraPaths` | `string[]` | インデックス対象にする追加ディレクトリまたは file |

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

パスは絶対パスまたは workspace 相対パスを指定できます。ディレクトリは `.md` file を対象に再帰的にスキャンされます。symlink の扱いは有効なバックエンドに依存します。builtin engine は symlink を無視し、QMD は基盤となる QMD scanner の動作に従います。

agent スコープの cross-agent transcript search には、`memory.qmd.paths` の代わりに `agents.list[].memorySearch.qmd.extraCollections` を使用してください。これらの追加 collection は同じ `{ path, name, pattern? }` 形式に従いますが、agent ごとにマージされ、パスが現在の workspace の外を指している場合でも明示的な共有名を維持できます。同じ解決済みパスが `memory.qmd.paths` と `memorySearch.qmd.extraCollections` の両方に現れる場合、QMD は最初のエントリを保持し、重複をスキップします。

---

## マルチモーダルメモリ（Gemini）

Gemini Embedding 2 を使用して、Markdown と一緒に画像と音声もインデックスします。

| Key                       | Type       | Default    | 説明                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | マルチモーダルインデックス作成を有効にする |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]`、または `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | インデックス作成対象の最大 file サイズ |

<Note>
`extraPaths` 内の file にのみ適用されます。デフォルトのメモリ root は引き続き Markdown のみです。`gemini-embedding-2-preview` が必要です。`fallback` は `"none"` でなければなりません。
</Note>

サポートされる形式: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`（画像）; `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`（音声）。

---

## Embedding cache

| Key                | Type      | Default | 説明                                  |
| ------------------ | --------- | ------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | SQLite に chunk embedding をキャッシュする |
| `cache.maxEntries` | `number`  | `50000` | 最大キャッシュ embedding 数           |

再インデックスまたは transcript 更新時に、変更されていないテキストの再 embedding を防ぎます。

---

## バッチインデックス作成

| Key                           | Type      | Default | 説明                          |
| ----------------------------- | --------- | ------- | ----------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | batch embedding API を有効にする |
| `remote.batch.concurrency`    | `number`  | `2`     | 並列 batch job 数             |
| `remote.batch.wait`           | `boolean` | `true`  | batch 完了を待機する          |
| `remote.batch.pollIntervalMs` | `number`  | --      | poll 間隔                     |
| `remote.batch.timeoutMinutes` | `number`  | --      | batch timeout                 |

`openai`、`gemini`、`voyage` で利用可能です。大規模なバックフィルでは、OpenAI batch が通常もっとも高速かつ低コストです。

これは `sync.embeddingBatchTimeoutSeconds` とは別です。後者は、local/self-hosted provider で使用されるインライン embedding 呼び出し、および provider の batch API が有効でない場合の hosted provider を制御します。

---

## セッションメモリ検索（実験的）

セッショントランスクリプトをインデックスし、`memory_search` 経由で表示します。

| Key                           | Type       | Default      | 説明                                     |
| ----------------------------- | ---------- | ------------ | ---------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | セッションインデックス作成を有効にする   |
| `sources`                     | `string[]` | `["memory"]` | transcript を含めるには `"sessions"` を追加 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 再インデックス用のバイトしきい値         |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 再インデックス用のメッセージしきい値     |

<Warning>
セッションインデックス作成はオプトインであり、非同期で実行されます。結果がやや古い場合があります。セッションログはディスク上に保存されるため、ファイルシステムアクセスを信頼境界として扱ってください。
</Warning>

---

## SQLite vector 高速化（sqlite-vec）

| Key                          | Type      | Default | 説明                                  |
| ---------------------------- | --------- | ------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | vector query に sqlite-vec を使用する |
| `store.vector.extensionPath` | `string`  | bundled | sqlite-vec のパスを上書きする         |

sqlite-vec が利用できない場合、OpenClaw は自動的にインプロセスの cosine similarity にフォールバックします。

---

## インデックス保存先

| Key                   | Type     | Default                               | 説明                                         |
| --------------------- | -------- | ------------------------------------- | -------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | インデックス保存場所（`{agentId}` トークン対応） |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 tokenizer（`unicode61` または `trigram`）   |

---

## QMD バックエンド設定

有効にするには `memory.backend = "qmd"` を設定します。すべての QMD 設定は `memory.qmd` 配下にあります。

| Key                      | Type      | Default  | 説明                                         |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 実行ファイルのパス                       |
| `searchMode`             | `string`  | `search` | 検索コマンド: `search`, `vsearch`, `query`   |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md` を自動インデックス |
| `paths[]`                | `array`   | --       | 追加パス: `{ name, path, pattern? }`         |
| `sessions.enabled`       | `boolean` | `false`  | セッショントランスクリプトをインデックスする |
| `sessions.retentionDays` | `number`  | --       | transcript 保持期間                          |
| `sessions.exportDir`     | `string`  | --       | エクスポートディレクトリ                     |

OpenClaw は現在の QMD collection および MCP query 形式を優先しますが、必要に応じてレガシーな `--mask` collection フラグや古い MCP tool 名にフォールバックすることで、古い QMD リリースも動作するようにしています。

<Note>
QMD のモデル上書きは OpenClaw config 側ではなく、QMD 側に置かれます。QMD のモデルをグローバルに上書きする必要がある場合は、gateway ランタイム環境で `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL`、`QMD_GENERATE_MODEL` などの環境変数を設定してください。
</Note>

<AccordionGroup>
  <Accordion title="更新スケジュール">
    | Key                       | Type      | Default | 説明                                 |
    | ------------------------- | --------- | ------- | ------------------------------------ |
    | `update.interval`         | `string`  | `5m`    | 更新間隔                             |
    | `update.debounceMs`       | `number`  | `15000` | ファイル変更のデバウンス             |
    | `update.onBoot`           | `boolean` | `true`  | 起動時に更新する                     |
    | `update.waitForBootSync`  | `boolean` | `false` | 更新完了まで起動をブロックする       |
    | `update.embedInterval`    | `string`  | --      | 分離された embed 実行間隔            |
    | `update.commandTimeoutMs` | `number`  | --      | QMD コマンドの timeout               |
    | `update.updateTimeoutMs`  | `number`  | --      | QMD 更新処理の timeout               |
    | `update.embedTimeoutMs`   | `number`  | --      | QMD embed 処理の timeout             |
  </Accordion>
  <Accordion title="制限">
    | Key                       | Type     | Default | 説明                           |
    | ------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `6`     | 最大検索結果数                 |
    | `limits.maxSnippetChars`  | `number` | --      | snippet 長の上限              |
    | `limits.maxInjectedChars` | `number` | --      | 注入される総文字数の上限       |
    | `limits.timeoutMs`        | `number` | `4000`  | 検索 timeout                   |
  </Accordion>
  <Accordion title="スコープ">
    QMD 検索結果を受け取れるセッションを制御します。schema は [`session.sendPolicy`](/ja-JP/gateway/config-agents#session) と同じです。

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

    出荷時デフォルトでは、group を拒否したまま、direct と channel のセッションを許可します。

    デフォルトは DM のみです。`match.keyPrefix` は正規化された session key に一致し、`match.rawKeyPrefix` は `agent:<id>:` を含む生の key に一致します。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` はすべてのバックエンドに適用されます。

    | Value            | 動作                                                   |
    | ---------------- | ------------------------------------------------------ |
    | `auto`（デフォルト） | snippet に `Source: <path#line>` footer を含める     |
    | `on`             | 常に footer を含める                                   |
    | `off`            | footer を省略する（path は引き続き内部的に agent に渡される） |

  </Accordion>
</AccordionGroup>

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

Dreaming は `agents.defaults.memorySearch` ではなく、`plugins.entries.memory-core.config.dreaming` 配下で設定します。

Dreaming は1回のスケジュール済みスイープとして実行され、内部の light/deep/REM フェーズは実装上の詳細として扱われます。

概念的な動作とスラッシュコマンドについては、[Dreaming](/ja-JP/concepts/dreaming) を参照してください。

### ユーザー設定

| Key         | Type      | Default     | 説明                                         |
| ----------- | --------- | ----------- | -------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Dreaming を完全に有効または無効にする        |
| `frequency` | `string`  | `0 3 * * *` | 完全な Dreaming スイープの任意の Cron 実行間隔 |

### 例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
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
- light/deep/REM フェーズのポリシーとしきい値は内部動作であり、ユーザー向け設定ではありません。

</Note>

## 関連項目

- [Configuration reference](/ja-JP/gateway/configuration-reference)
- [Memory overview](/ja-JP/concepts/memory)
- [Memory search](/ja-JP/concepts/memory-search)
