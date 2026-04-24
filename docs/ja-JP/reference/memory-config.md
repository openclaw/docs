---
read_when:
    - メモリ検索プロバイダーや埋め込みモデルを設定したい場合
    - QMD バックエンドをセットアップしたい場合
    - ハイブリッド検索、MMR、または時間減衰を調整したい場合
    - マルチモーダルメモリインデックス作成を有効にしたい場合
summary: メモリ検索、埋め込みプロバイダー、QMD、ハイブリッド検索、マルチモーダルインデックス作成に関するすべての設定項目
title: メモリ設定リファレンス
x-i18n:
    generated_at: "2026-04-24T05:18:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

このページでは、OpenClaw メモリ検索のすべての設定項目を一覧します。
概念的な概要については、次を参照してください。

- [Memory Overview](/ja-JP/concepts/memory) -- メモリの仕組み
- [Builtin Engine](/ja-JP/concepts/memory-builtin) -- デフォルトの SQLite バックエンド
- [QMD Engine](/ja-JP/concepts/memory-qmd) -- ローカルファーストの sidecar
- [Memory Search](/ja-JP/concepts/memory-search) -- 検索パイプラインと調整
- [Active Memory](/ja-JP/concepts/active-memory) -- 対話セッション向け memory sub-agent の有効化

特記がない限り、すべてのメモリ検索設定は
`openclaw.json` の `agents.defaults.memorySearch` 配下にあります。

**active memory** 機能トグルと sub-agent 設定を探している場合は、
`memorySearch` ではなく `plugins.entries.active-memory` 配下にあります。

active memory は 2 段階ゲートモデルを使います。

1. plugin が有効で、現在の agent id を対象にしていること
2. リクエストが、対象となる対話型の永続チャットセッションであること

有効化モデル、plugin 所有 config、transcript 永続化、
安全なロールアウトパターンについては [Active Memory](/ja-JP/concepts/active-memory) を参照してください。

---

## プロバイダー選択

| Key | Type | Default | 説明 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | 自動検出 | 埋め込みアダプター ID: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model` | `string` | provider デフォルト | 埋め込みモデル名 |
| `fallback` | `string` | `"none"` | primary が失敗したときの fallback アダプター ID |
| `enabled` | `boolean` | `true` | メモリ検索を有効/無効化 |

### 自動検出順序

`provider` が設定されていない場合、OpenClaw は最初に利用可能なものを選びます。

1. `local` -- `memorySearch.local.modelPath` が設定され、ファイルが存在する場合。
2. `github-copilot` -- GitHub Copilot token を解決できる場合（env var または auth profile）。
3. `openai` -- OpenAI key を解決できる場合。
4. `gemini` -- Gemini key を解決できる場合。
5. `voyage` -- Voyage key を解決できる場合。
6. `mistral` -- Mistral key を解決できる場合。
7. `bedrock` -- AWS SDK credential chain が解決できる場合（instance role、access key、profile、SSO、web identity、または shared config）。

`ollama` はサポートされていますが、自動検出はされません（明示的に設定してください）。

### API key 解決

リモート埋め込みには API key が必要です。代わりに Bedrock は AWS SDK のデフォルト
credential chain を使います（instance role、SSO、access key）。

| Provider | Env var | Config key |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock | AWS credential chain | API key 不要 |
| Gemini | `GEMINI_API_KEY` | `models.providers.google.apiKey` |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | device login 経由の auth profile |
| Mistral | `MISTRAL_API_KEY` | `models.providers.mistral.apiKey` |
| Ollama | `OLLAMA_API_KEY`（プレースホルダー） | -- |
| OpenAI | `OPENAI_API_KEY` | `models.providers.openai.apiKey` |
| Voyage | `VOYAGE_API_KEY` | `models.providers.voyage.apiKey` |

Codex OAuth は chat/completions のみを対象とし、embedding
request は満たしません。

---

## リモート endpoint 設定

custom OpenAI-compatible endpoint を使う場合、または provider デフォルトを上書きする場合:

| Key | Type | 説明 |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | custom API base URL |
| `remote.apiKey` | `string` | API key の上書き |
| `remote.headers` | `object` | 追加 HTTP ヘッダー（provider デフォルトとマージ） |

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

## Gemini 固有設定

| Key | Type | Default | 説明 |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model` | `string` | `gemini-embedding-001` | `gemini-embedding-2-preview` もサポート |
| `outputDimensionality` | `number` | `3072` | Embedding 2 では 768、1536、または 3072 |

<Warning>
`model` または `outputDimensionality` を変更すると、自動で完全再インデックスが走ります。
</Warning>

---

## Bedrock 埋め込み設定

Bedrock は AWS SDK のデフォルト credential chain を使います。API key は不要です。
OpenClaw が Bedrock 有効化済み instance role を持つ EC2 上で動作している場合は、
provider と model を設定するだけです。

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

| Key | Type | Default | 説明 |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model` | `string` | `amazon.titan-embed-text-v2:0` | 任意の Bedrock 埋め込み model ID |
| `outputDimensionality` | `number` | model デフォルト | Titan V2 では 256、512、または 1024 |

### サポートモデル

次のモデルがサポートされています（family 判定と dimension
デフォルト付き）。

| Model ID | Provider | Default Dims | Configurable Dims |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0` | Amazon | 1024 | 256, 512, 1024 |
| `amazon.titan-embed-text-v1` | Amazon | 1536 | -- |
| `amazon.titan-embed-g1-text-02` | Amazon | 1536 | -- |
| `amazon.titan-embed-image-v1` | Amazon | 1024 | -- |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon | 1024 | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3` | Cohere | 1024 | -- |
| `cohere.embed-multilingual-v3` | Cohere | 1024 | -- |
| `cohere.embed-v4:0` | Cohere | 1536 | 256-1536 |
| `twelvelabs.marengo-embed-3-0-v1:0` | TwelveLabs | 512 | -- |
| `twelvelabs.marengo-embed-2-7-v1:0` | TwelveLabs | 1024 | -- |

スループット接尾辞付きバリアント（例: `amazon.titan-embed-text-v1:2:8k`）は、
ベースモデルの設定を継承します。

### 認証

Bedrock auth は、標準の AWS SDK 認証情報解決順序を使います。

1. 環境変数（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
2. SSO token キャッシュ
3. Web identity token 認証情報
4. Shared credentials と config ファイル
5. ECS または EC2 メタデータ認証情報

リージョンは `AWS_REGION`, `AWS_DEFAULT_REGION`, 
`amazon-bedrock` provider の `baseUrl` から解決され、なければ `us-east-1` が使われます。

### IAM 権限

IAM role または user には次が必要です。

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

最小権限にするには、`InvokeModel` を特定モデルに絞ってください。

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## ローカル埋め込み設定

| Key | Type | Default | 説明 |
| --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath` | `string` | 自動ダウンロード | GGUF model ファイルへのパス |
| `local.modelCacheDir` | `string` | node-llama-cpp デフォルト | ダウンロード済みモデル用 cache dir |
| `local.contextSize` | `number \| "auto"` | `4096` | 埋め込みコンテキストのコンテキストウィンドウサイズ。4096 は典型的な chunk（128〜512 token）をカバーしつつ、weight 以外の VRAM を抑えます。制約のあるホストでは 1024〜2048 に下げてください。`"auto"` は model の学習済み最大値を使います。8B 以上のモデルには非推奨です（Qwen3-Embedding-8B: 40,960 token → 約 32 GB VRAM。4096 なら約 8.8 GB）。 |

デフォルトモデル: `embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB、自動ダウンロード）。
ネイティブ build が必要です: `pnpm approve-builds` してから `pnpm rebuild node-llama-cpp` を実行してください。

Gateway が使うのと同じ provider path を確認するには、スタンドアロン CLI を使ってください。

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

`provider` が `auto` の場合、`local` が選ばれるのは `local.modelPath` が
既存のローカルファイルを指しているときだけです。`hf:` や HTTP(S) の model ref も、
`provider: "local"` を明示すれば引き続き使えますが、model がディスク上に利用可能になるまでは、
`auto` が local を選ぶ理由にはなりません。

---

## ハイブリッド検索設定

すべて `memorySearch.query.hybrid` 配下:

| Key | Type | Default | 説明 |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled` | `boolean` | `true` | ハイブリッド BM25 + ベクトル検索を有効化 |
| `vectorWeight` | `number` | `0.7` | ベクトルスコアの重み（0-1） |
| `textWeight` | `number` | `0.3` | BM25 スコアの重み（0-1） |
| `candidateMultiplier` | `number` | `4` | 候補プールサイズ倍率 |

### MMR（多様性）

| Key | Type | Default | 説明 |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | MMR 再ランキングを有効化 |
| `mmr.lambda` | `number` | `0.7` | 0 = 最大多様性、1 = 最大関連性 |

### 時間減衰（新しさ）

| Key | Type | Default | 説明 |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled` | `boolean` | `false` | 新しさブーストを有効化 |
| `temporalDecay.halfLifeDays` | `number` | `30` | N 日ごとにスコアが半減 |

Evergreen ファイル（`MEMORY.md`、`memory/` 内の日付なしファイル）は時間減衰しません。

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

## 追加メモリパス

| Key | Type | 説明 |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | インデックス対象にする追加ディレクトリまたはファイル |

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

パスは絶対パスでも workspace 相対パスでも使えます。ディレクトリは
`.md` ファイルを再帰的にスキャンします。symlink の扱いはアクティブな backend に依存します。
builtin engine は symlink を無視し、QMD は基盤となる QMD
scanner の動作に従います。

agent スコープのクロスエージェント transcript 検索には、
`memory.qmd.paths` ではなく
`agents.list[].memorySearch.qmd.extraCollections` を使ってください。
これらの extra collection も同じ `{ path, name, pattern? }` 形状に従いますが、
agent ごとにマージされ、パスが現在の workspace 外を指す場合でも
明示的な共有名を維持できます。
同じ解決済みパスが `memory.qmd.paths` と
`memorySearch.qmd.extraCollections` の両方に現れる場合、QMD は最初のエントリーを保持し、
重複をスキップします。

---

## マルチモーダルメモリ（Gemini）

Gemini Embedding 2 を使って、Markdown と一緒に画像や音声をインデックスします。

| Key | Type | Default | 説明 |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled` | `boolean` | `false` | マルチモーダルインデックス作成を有効化 |
| `multimodal.modalities` | `string[]` | -- | `["image"]`, `["audio"]`, または `["all"]` |
| `multimodal.maxFileBytes` | `number` | `10000000` | インデックス対象ファイルの最大サイズ |

適用されるのは `extraPaths` 内のファイルだけです。デフォルトのメモリルートは Markdown のみです。
`gemini-embedding-2-preview` が必要です。`fallback` は `"none"` でなければなりません。

サポート形式: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
（画像）、`.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`（音声）。

---

## 埋め込みキャッシュ

| Key | Type | Default | 説明 |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled` | `boolean` | `false` | chunk 埋め込みを SQLite にキャッシュ |
| `cache.maxEntries` | `number` | `50000` | キャッシュする埋め込みの最大数 |

再インデックスや transcript 更新時に、変更されていないテキストを再埋め込みするのを防ぎます。

---

## バッチインデックス作成

| Key | Type | Default | 説明 |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled` | `boolean` | `false` | batch 埋め込み API を有効化 |
| `remote.batch.concurrency` | `number` | `2` | 並列 batch ジョブ数 |
| `remote.batch.wait` | `boolean` | `true` | batch 完了を待機 |
| `remote.batch.pollIntervalMs` | `number` | -- | polling 間隔 |
| `remote.batch.timeoutMinutes` | `number` | -- | batch timeout |

`openai`, `gemini`, `voyage` で利用可能です。大規模なバックフィルでは、OpenAI batch が通常
最も高速かつ低コストです。

---

## セッションメモリ検索（実験的）

セッション transcript をインデックスし、`memory_search` 経由で公開します。

| Key | Type | Default | 説明 |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory` | `boolean` | `false` | セッションインデックス作成を有効化 |
| `sources` | `string[]` | `["memory"]` | transcript を含めるには `"sessions"` を追加 |
| `sync.sessions.deltaBytes` | `number` | `100000` | 再インデックスするバイト閾値 |
| `sync.sessions.deltaMessages` | `number` | `50` | 再インデックスするメッセージ閾値 |

セッションインデックス作成はオプトインで、非同期に実行されます。結果は若干
古いことがあります。セッションログはディスク上にあるため、ファイルシステムアクセスを信頼境界として扱ってください。

---

## SQLite ベクトル高速化（sqlite-vec）

| Key | Type | Default | 説明 |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled` | `boolean` | `true` | ベクトルクエリに sqlite-vec を使用 |
| `store.vector.extensionPath` | `string` | bundled | sqlite-vec パスを上書き |

sqlite-vec が利用できない場合、OpenClaw は自動的に in-process cosine
similarity にフォールバックします。

---

## インデックス保存

| Key | Type | Default | 説明 |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path` | `string` | `~/.openclaw/memory/{agentId}.sqlite` | インデックス保存場所（`{agentId}` トークン対応） |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 tokenizer（`unicode61` または `trigram`） |

---

## QMD バックエンド設定

有効にするには `memory.backend = "qmd"` を設定します。QMD 設定はすべて
`memory.qmd` 配下にあります。

| Key | Type | Default | 説明 |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command` | `string` | `qmd` | QMD 実行ファイルパス |
| `searchMode` | `string` | `search` | 検索コマンド: `search`, `vsearch`, `query` |
| `includeDefaultMemory` | `boolean` | `true` | `MEMORY.md` + `memory/**/*.md` を自動インデックス |
| `paths[]` | `array` | -- | 追加パス: `{ name, path, pattern? }` |
| `sessions.enabled` | `boolean` | `false` | セッショントランスクリプトをインデックス |
| `sessions.retentionDays` | `number` | -- | transcript 保持期間 |
| `sessions.exportDir` | `string` | -- | エクスポートディレクトリ |

OpenClaw は現在の QMD collection と MCP query 形状を優先しますが、
必要に応じて旧式の `--mask` collection flag
や古い MCP tool 名にフォールバックすることで、古い QMD リリースも動作させ続けます。

QMD モデル上書きは OpenClaw config 側ではなく、QMD 側に残ります。QMD のモデルを
グローバルに上書きしたい場合は、gateway
ランタイム環境で `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL`, `QMD_GENERATE_MODEL` のような環境変数を設定してください。

### 更新スケジュール

| Key | Type | Default | 説明 |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval` | `string` | `5m` | 更新間隔 |
| `update.debounceMs` | `number` | `15000` | ファイル変更のデバウンス |
| `update.onBoot` | `boolean` | `true` | 起動時に更新 |
| `update.waitForBootSync` | `boolean` | `false` | 更新完了まで起動をブロック |
| `update.embedInterval` | `string` | -- | 別個の埋め込み cadence |
| `update.commandTimeoutMs` | `number` | -- | QMD コマンドの timeout |
| `update.updateTimeoutMs` | `number` | -- | QMD 更新操作の timeout |
| `update.embedTimeoutMs` | `number` | -- | QMD 埋め込み操作の timeout |

### 制限

| Key | Type | Default | 説明 |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults` | `number` | `6` | 最大検索結果数 |
| `limits.maxSnippetChars` | `number` | -- | snippet 長の制限 |
| `limits.maxInjectedChars` | `number` | -- | 注入される総文字数の制限 |
| `limits.timeoutMs` | `number` | `4000` | 検索 timeout |

### スコープ

どのセッションが QMD 検索結果を受け取れるかを制御します。schema は
[`session.sendPolicy`](/ja-JP/gateway/config-agents#session) と同じです。

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

出荷時デフォルトでは、group は拒否しつつ、
ダイレクトとチャンネルセッションを許可します。

デフォルトは DM のみです。`match.keyPrefix` は正規化された session key に一致し、
`match.rawKeyPrefix` は `agent:<id>:` を含む raw key に一致します。

### 引用

`memory.citations` はすべての backend に適用されます。

| Value | 動作 |
| ---------------- | --------------------------------------------------- |
| `auto`（デフォルト） | snippet に `Source: <path#line>` フッターを含める |
| `on` | 常にフッターを含める |
| `off` | フッターを省略する（path は内部的には引き続きエージェントへ渡される） |

### 完全な QMD 例

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

Dreaming は `agents.defaults.memorySearch` ではなく、
`plugins.entries.memory-core.config.dreaming` 配下で設定します。

Dreaming は 1 回のスケジュールされた sweep として実行され、
内部的な light/deep/REM phase を実装詳細として使用します。

概念的な動作とスラッシュコマンドについては [Dreaming](/ja-JP/concepts/dreaming) を参照してください。

### ユーザー設定

| Key | Type | Default | 説明 |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled` | `boolean` | `false` | Dreaming 全体を有効/無効化 |
| `frequency` | `string` | `0 3 * * *` | 完全な Dreaming sweep 向けの任意の Cron 間隔 |

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

注:

- Dreaming は機械状態を `memory/.dreams/` に書き込みます。
- Dreaming は人間可読の narrative 出力を `DREAMS.md`（または既存の `dreams.md`）に書き込みます。
- light/deep/REM phase のポリシーと閾値は内部動作であり、ユーザー向け config ではありません。

## 関連

- [Memory overview](/ja-JP/concepts/memory)
- [Memory search](/ja-JP/concepts/memory-search)
- [Configuration reference](/ja-JP/gateway/configuration-reference)
