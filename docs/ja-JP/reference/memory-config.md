---
read_when:
    - メモリ検索プロバイダーまたは埋め込みモデルを設定したい場合
    - QMDバックエンドを設定したい場合
    - ハイブリッド検索、MMR、または時間減衰を調整したい場合
    - マルチモーダルメモリのインデックス作成を有効にしたい場合
summary: メモリ検索、埋め込みプロバイダー、QMD、ハイブリッド検索、マルチモーダルインデックス作成に関するすべての設定項目
title: メモリ設定リファレンス
x-i18n:
    generated_at: "2026-04-10T04:43:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f9076bdfad95b87bd70625821bf401326f8eaeb53842b70823881419dbe43cb
    source_path: reference/memory-config.md
    workflow: 15
---

# メモリ設定リファレンス

このページでは、OpenClawのメモリ検索に関するすべての設定項目を一覧で紹介します。  
概念的な概要については、以下を参照してください。

- [メモリの概要](/ja-JP/concepts/memory) -- メモリの仕組み
- [組み込みエンジン](/ja-JP/concepts/memory-builtin) -- デフォルトのSQLiteバックエンド
- [QMDエンジン](/ja-JP/concepts/memory-qmd) -- ローカルファーストのサイドカー
- [メモリ検索](/ja-JP/concepts/memory-search) -- 検索パイプラインとチューニング
- [アクティブメモリ](/ja-JP/concepts/active-memory) -- 対話セッション向けにメモリサブエージェントを有効化する方法

特記がない限り、メモリ検索の設定はすべて`openclaw.json`の
`agents.defaults.memorySearch`配下にあります。

**アクティブメモリ**の機能トグルとサブエージェント設定を探している場合は、
`memorySearch`ではなく`plugins.entries.active-memory`配下にあります。

アクティブメモリは2段階のゲートモデルを使用します。

1. プラグインが有効であり、現在のエージェントIDを対象にしていること
2. リクエストが対象となる対話型の永続チャットセッションであること

有効化モデル、プラグイン側で管理される設定、トランスクリプトの永続化、
安全な段階的ロールアウトのパターンについては、
[アクティブメモリ](/ja-JP/concepts/active-memory)を参照してください。

---

## プロバイダーの選択

| Key        | Type      | Default          | 説明                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------ |
| `provider` | `string`  | 自動検出         | 埋め込みアダプターID: `openai`, `gemini`, `voyage`, `mistral`, `bedrock`, `ollama`, `local` |
| `model`    | `string`  | プロバイダーのデフォルト | 埋め込みモデル名                                                                  |
| `fallback` | `string`  | `"none"`         | プライマリが失敗したときのフォールバックアダプターID                                |
| `enabled`  | `boolean` | `true`           | メモリ検索を有効または無効にする                                                    |

### 自動検出の順序

`provider`が設定されていない場合、OpenClawは最初に利用可能なものを選択します。

1. `local` -- `memorySearch.local.modelPath`が設定されていて、そのファイルが存在する場合。
2. `openai` -- OpenAIキーを解決できる場合。
3. `gemini` -- Geminiキーを解決できる場合。
4. `voyage` -- Voyageキーを解決できる場合。
5. `mistral` -- Mistralキーを解決できる場合。
6. `bedrock` -- AWS SDKの認証情報チェーンが解決できる場合（インスタンスロール、アクセスキー、プロファイル、SSO、Web ID、共有設定）。

`ollama`はサポートされていますが、自動検出はされません（明示的に設定してください）。

### APIキーの解決

リモート埋め込みにはAPIキーが必要です。Bedrockは代わりにAWS SDKのデフォルト認証情報チェーン
（インスタンスロール、SSO、アクセスキー）を使用します。

| Provider | Env var                        | Config key                        |
| -------- | ------------------------------ | --------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`  |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`  |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`  |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey` |
| Bedrock  | AWS認証情報チェーン           | APIキー不要                       |
| Ollama   | `OLLAMA_API_KEY`（プレースホルダー） | --                           |

Codex OAuthはチャット/コンプリーションのみを対象としており、埋め込みリクエストには対応しません。

---

## リモートエンドポイント設定

カスタムのOpenAI互換エンドポイントを使用する場合や、プロバイダーのデフォルトを上書きする場合:

| Key              | Type     | 説明                                           |
| ---------------- | -------- | ---------------------------------------------- |
| `remote.baseUrl` | `string` | カスタムAPIベースURL                           |
| `remote.apiKey`  | `string` | APIキーを上書き                                |
| `remote.headers` | `object` | 追加のHTTPヘッダー（プロバイダーのデフォルトとマージされます） |

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

## Gemini固有の設定

| Key                    | Type     | Default                | 説明                                       |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview`もサポート     |
| `outputDimensionality` | `number` | `3072`                 | Embedding 2では768、1536、または3072       |

<Warning>
`model`または`outputDimensionality`を変更すると、自動的に完全な再インデックスが実行されます。
</Warning>

---

## Bedrock埋め込み設定

BedrockはAWS SDKのデフォルト認証情報チェーンを使用します -- APIキーは不要です。  
OpenClawがBedrock対応のインスタンスロールを持つEC2上で実行されている場合は、
プロバイダーとモデルを設定するだけです。

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

| Key                    | Type     | Default                        | 説明                           |
| ---------------------- | -------- | ------------------------------ | ------------------------------ |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任意のBedrock埋め込みモデルID  |
| `outputDimensionality` | `number` | モデルのデフォルト             | Titan V2では256、512、または1024 |

### サポートされているモデル

以下のモデルがサポートされています（ファミリー検出と次元数のデフォルト付き）。

| Model ID                                   | Provider   | Default Dims | Configurable Dims    |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024         | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536         | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                   |

スループット接尾辞付きのバリアント（例: `amazon.titan-embed-text-v1:2:8k`）は、
ベースモデルの設定を引き継ぎます。

### 認証

Bedrock認証は、標準のAWS SDK認証情報解決順序を使用します。

1. 環境変数（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
2. SSOトークンキャッシュ
3. Web IDトークン認証情報
4. 共有認証情報ファイルと設定ファイル
5. ECSまたはEC2メタデータ認証情報

リージョンは`AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock`
プロバイダーの`baseUrl`から解決され、どれもない場合は`us-east-1`が使われます。

### IAM権限

IAMロールまたはユーザーには次の権限が必要です。

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

最小権限にするには、`InvokeModel`を特定のモデルに限定してください。

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## ローカル埋め込み設定

| Key                   | Type     | Default                | 説明                               |
| --------------------- | -------- | ---------------------- | ---------------------------------- |
| `local.modelPath`     | `string` | 自動ダウンロード       | GGUFモデルファイルへのパス         |
| `local.modelCacheDir` | `string` | node-llama-cppのデフォルト | ダウンロードしたモデルのキャッシュディレクトリ |

デフォルトモデル: `embeddinggemma-300m-qat-Q8_0.gguf`（約0.6 GB、自動ダウンロード）。
ネイティブビルドが必要です: `pnpm approve-builds` を実行し、その後 `pnpm rebuild node-llama-cpp` を実行してください。

---

## ハイブリッド検索設定

すべて`memorySearch.query.hybrid`配下にあります。

| Key                   | Type      | Default | 説明                               |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`  | ハイブリッドBM25 + ベクトル検索を有効化 |
| `vectorWeight`        | `number`  | `0.7`   | ベクトルスコアの重み（0-1）        |
| `textWeight`          | `number`  | `0.3`   | BM25スコアの重み（0-1）            |
| `candidateMultiplier` | `number`  | `4`     | 候補プールサイズの倍率             |

### MMR（多様性）

| Key           | Type      | Default | 説明                                 |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | MMR再ランキングを有効化              |
| `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大の多様性、1 = 最大の関連性   |

### 時間減衰（新しさ）

| Key                          | Type      | Default | 説明                          |
| ---------------------------- | --------- | ------- | ----------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | 新しさブーストを有効化        |
| `temporalDecay.halfLifeDays` | `number`  | `30`    | N日ごとにスコアが半減         |

エバーグリーンファイル（`MEMORY.md`、`memory/`内の日付なしファイル）には時間減衰は適用されません。

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

| Key          | Type       | 説明                                       |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | インデックス対象に追加するディレクトリまたはファイル |

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

パスには絶対パスまたはワークスペース相対パスを指定できます。ディレクトリは
`.md`ファイルを再帰的にスキャンします。シンボリックリンクの扱いは有効なバックエンドに依存します。
組み込みエンジンはシンボリックリンクを無視しますが、QMDは基盤となるQMD
スキャナーの動作に従います。

エージェント単位のクロスエージェントトランスクリプト検索には、
`memory.qmd.paths`ではなく
`agents.list[].memorySearch.qmd.extraCollections`を使用してください。
これらの追加コレクションは同じ`{ path, name, pattern? }`形式に従いますが、
エージェントごとにマージされ、パスが現在のワークスペース外を指している場合でも
明示的な共有名を維持できます。
同じ解決済みパスが`memory.qmd.paths`と
`memorySearch.qmd.extraCollections`の両方に現れた場合、
QMDは最初のエントリーを保持し、重複をスキップします。

---

## マルチモーダルメモリ（Gemini）

Gemini Embedding 2を使用して、Markdownと一緒に画像と音声をインデックスします。

| Key                       | Type       | Default    | 説明                                 |
| ------------------------- | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | マルチモーダルインデックス作成を有効化 |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]`、または`["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | インデックス作成対象の最大ファイルサイズ |

`extraPaths`内のファイルにのみ適用されます。デフォルトのメモリルートは引き続きMarkdownのみです。
`gemini-embedding-2-preview`が必要です。`fallback`は`"none"`でなければなりません。

サポートされる形式: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
（画像）、`.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`（音声）。

---

## 埋め込みキャッシュ

| Key                | Type      | Default | 説明                             |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled`    | `boolean` | `false` | SQLiteにチャンク埋め込みをキャッシュする |
| `cache.maxEntries` | `number`  | `50000` | キャッシュする埋め込みの最大数   |

再インデックス時やトランスクリプト更新時に、変更されていないテキストの再埋め込みを防ぎます。

---

## バッチインデックス作成

| Key                           | Type      | Default | 説明                     |
| ----------------------------- | --------- | ------- | ------------------------ |
| `remote.batch.enabled`        | `boolean` | `false` | バッチ埋め込みAPIを有効化 |
| `remote.batch.concurrency`    | `number`  | `2`     | 並列バッチジョブ数       |
| `remote.batch.wait`           | `boolean` | `true`  | バッチ完了を待機         |
| `remote.batch.pollIntervalMs` | `number`  | --      | ポーリング間隔           |
| `remote.batch.timeoutMinutes` | `number`  | --      | バッチのタイムアウト     |

`openai`、`gemini`、`voyage`で利用できます。OpenAIのバッチは通常、
大規模なバックフィルで最も高速かつ低コストです。

---

## セッションメモリ検索（実験的）

セッショントランスクリプトをインデックスし、`memory_search`経由で表示します。

| Key                           | Type       | Default      | 説明                                      |
| ----------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | セッションインデックス作成を有効化        |
| `sources`                     | `string[]` | `["memory"]` | トランスクリプトを含めるには`"sessions"`を追加 |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 再インデックスのバイトしきい値            |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 再インデックスのメッセージしきい値        |

セッションインデックス作成はオプトイン方式で、非同期に実行されます。結果は
少し古い可能性があります。セッションログはディスク上に保存されるため、
ファイルシステムアクセスを信頼境界として扱ってください。

---

## SQLiteベクトル高速化（sqlite-vec）

| Key                          | Type      | Default | 説明                                |
| ---------------------------- | --------- | ------- | ----------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | ベクトルクエリにsqlite-vecを使用する |
| `store.vector.extensionPath` | `string`  | bundled | sqlite-vecのパスを上書きする        |

sqlite-vecが利用できない場合、OpenClawは自動的にプロセス内コサイン類似度へフォールバックします。

---

## インデックスストレージ

| Key                   | Type     | Default                               | 説明                                       |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | インデックスの保存場所（`{agentId}`トークン対応） |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5トークナイザー（`unicode61`または`trigram`） |

---

## QMDバックエンド設定

有効にするには`memory.backend = "qmd"`を設定します。QMDの設定はすべて
`memory.qmd`配下にあります。

| Key                      | Type      | Default  | 説明                                        |
| ------------------------ | --------- | -------- | ------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD実行ファイルのパス                       |
| `searchMode`             | `string`  | `search` | 検索コマンド: `search`、`vsearch`、`query`  |
| `includeDefaultMemory`   | `boolean` | `true`   | `MEMORY.md` + `memory/**/*.md`を自動インデックス |
| `paths[]`                | `array`   | --       | 追加パス: `{ name, path, pattern? }`        |
| `sessions.enabled`       | `boolean` | `false`  | セッショントランスクリプトをインデックス    |
| `sessions.retentionDays` | `number`  | --       | トランスクリプトの保持期間                  |
| `sessions.exportDir`     | `string`  | --       | エクスポートディレクトリ                    |

OpenClawは現在のQMDコレクションおよびMCPクエリ形式を優先しますが、
必要に応じて従来の`--mask`コレクションフラグや古いMCPツール名へフォールバックし、
旧バージョンのQMDも動作するようにしています。

QMDモデルの上書きはOpenClaw設定ではなくQMD側にあります。QMDのモデルを
グローバルに上書きする必要がある場合は、Gatewayランタイム環境で
`QMD_EMBED_MODEL`、`QMD_RERANK_MODEL`、`QMD_GENERATE_MODEL`などの環境変数を設定してください。

### 更新スケジュール

| Key                       | Type      | Default | 説明                                 |
| ------------------------- | --------- | ------- | ------------------------------------ |
| `update.interval`         | `string`  | `5m`    | 更新間隔                             |
| `update.debounceMs`       | `number`  | `15000` | ファイル変更のデバウンス             |
| `update.onBoot`           | `boolean` | `true`  | 起動時に更新                         |
| `update.waitForBootSync`  | `boolean` | `false` | 更新完了まで起動をブロックする       |
| `update.embedInterval`    | `string`  | --      | 埋め込み専用の別個の実行間隔         |
| `update.commandTimeoutMs` | `number`  | --      | QMDコマンドのタイムアウト            |
| `update.updateTimeoutMs`  | `number`  | --      | QMD更新処理のタイムアウト            |
| `update.embedTimeoutMs`   | `number`  | --      | QMD埋め込み処理のタイムアウト        |

### 制限

| Key                       | Type     | Default | 説明                         |
| ------------------------- | -------- | ------- | ---------------------------- |
| `limits.maxResults`       | `number` | `6`     | 最大検索結果数               |
| `limits.maxSnippetChars`  | `number` | --      | スニペット長の上限制限       |
| `limits.maxInjectedChars` | `number` | --      | 注入する総文字数の上限制限   |
| `limits.timeoutMs`        | `number` | `4000`  | 検索タイムアウト             |

### スコープ

どのセッションがQMD検索結果を受け取れるかを制御します。
スキーマは[`session.sendPolicy`](/ja-JP/gateway/configuration-reference#session)と同じです。

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

デフォルトはDMのみです。`match.keyPrefix`は正規化されたセッションキーに一致し、
`match.rawKeyPrefix`は`agent:<id>:`を含む生のキーに一致します。

### 引用

`memory.citations`はすべてのバックエンドに適用されます。

| Value            | 挙動                                                 |
| ---------------- | ---------------------------------------------------- |
| `auto`（デフォルト） | スニペットに`Source: <path#line>`フッターを含める    |
| `on`             | 常にフッターを含める                                 |
| `off`            | フッターを省略する（パスは引き続き内部的にエージェントへ渡されます） |

### 完全なQMDの例

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

## Dreaming（実験的）

Dreamingは`agents.defaults.memorySearch`ではなく、
`plugins.entries.memory-core.config.dreaming`配下で設定します。

Dreamingは1回のスケジュール済みスイープとして実行され、内部のlight/deep/REMフェーズを
実装上の詳細として使用します。

概念的な挙動とスラッシュコマンドについては、[Dreaming](/ja-JP/concepts/dreaming)を参照してください。

### ユーザー設定

| Key         | Type      | Default     | 説明                                   |
| ----------- | --------- | ----------- | -------------------------------------- |
| `enabled`   | `boolean` | `false`     | Dreaming全体を有効または無効にする     |
| `frequency` | `string`  | `0 3 * * *` | 完全なDreamingスイープの任意のcron頻度 |

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

注意:

- Dreamingはマシン状態を`memory/.dreams/`に書き込みます。
- Dreamingは人が読める物語形式の出力を`DREAMS.md`（または既存の`dreams.md`）に書き込みます。
- light/deep/REMフェーズのポリシーとしきい値は内部動作であり、ユーザー向け設定ではありません。
