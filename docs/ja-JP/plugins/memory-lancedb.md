---
read_when:
    - memory-lancedb Pluginを設定しています
    - 自動想起または自動取り込みに対応した LanceDB ベースの長期記憶が必要な場合
    - Ollama などのローカルな OpenAI 互換埋め込みを使用しています
sidebarTitle: Memory LanceDB
summary: ローカルの Ollama 互換埋め込みを含む、公式の外部 LanceDB メモリ Plugin を設定する
title: メモリ LanceDB
x-i18n:
    generated_at: "2026-07-11T22:27:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` は、ベクトル検索に対応した LanceDB に長期記憶を保存する公式の外部 Plugin です。モデルのターン前に関連する記憶を自動的に呼び出し、応答後に重要な事実を自動的に保存できます。

ローカルのベクトルデータベース、OpenAI 互換の埋め込みエンドポイント、またはデフォルトの組み込みメモリバックエンド以外のメモリストアが必要な場合に使用します。

## インストール

```bash
openclaw plugins install @openclaw/memory-lancedb
```

この Plugin は npm で公開されており、OpenClaw ランタイムイメージには同梱されていません。インストールすると Plugin エントリが書き込まれて有効化され、`plugins.slots.memory` が `memory-lancedb` に切り替わります。現在ほかの Plugin がメモリスロットを所有している場合、その Plugin は警告付きで無効化されます。

<Note>
`memory-wiki` などの関連 Plugin は `memory-lancedb` と併用できますが、アクティブなメモリスロットを同時に所有できる Plugin は 1 つだけです。
</Note>

## クイックスタート

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Plugin 設定を変更した後に Gateway を再起動し、読み込まれたことを確認します。

```bash
openclaw gateway restart
openclaw plugins list
```

## 埋め込み設定

`embedding` は必須で、少なくとも 1 つのフィールドを含める必要があります。`provider` のデフォルトは `openai`、`model` のデフォルトは `text-embedding-3-small` です。

| フィールド             | 型            | 注記                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | 文字列        | アダプター ID（例: `openai`、`github-copilot`、`ollama`）。デフォルトは `openai`。 |
| `embedding.model`      | 文字列        | デフォルトは `text-embedding-3-small`。                                  |
| `embedding.apiKey`     | 文字列        | 任意。`${ENV_VAR}` の展開に対応。                                        |
| `embedding.baseUrl`    | 文字列        | 任意。`${ENV_VAR}` の展開に対応。                                        |
| `embedding.dimensions` | 整数（>=1）   | 組み込みテーブルにないモデルでは必須（後述）。                           |

リクエストには 2 つの経路があります。

- **プロバイダーアダプター経路**（デフォルト）: `embedding.provider` を設定し、
  `embedding.apiKey`/`embedding.baseUrl` は省略します。この Plugin は、
  `memory-core` が使用するものと同じメモリ埋め込みアダプターを通じて、
  プロバイダーに設定された認証プロファイル、環境変数、または
  `models.providers.<provider>.apiKey` を解決します。これは `github-copilot`、
  `ollama`、および埋め込みをサポートするその他の同梱プロバイダー向けの経路です。
- **OpenAI 互換クライアントへの直接接続経路**: `embedding.provider` を未設定
  （または `"openai"`）のままにし、`embedding.apiKey` と `embedding.baseUrl`
  を設定します。同梱のプロバイダーアダプターがない、生の OpenAI 互換埋め込み
  エンドポイントに使用します。

OpenAI Codex / ChatGPT OAuth は、OpenAI Platform の埋め込み認証情報ではありません。
OpenAI の埋め込みには、OpenAI API キー認証プロファイル、`OPENAI_API_KEY`、または
`models.providers.openai.apiKey` を使用してください。OAuth のみを使用する場合は、
`github-copilot` や `ollama` など、埋め込みに対応する別のプロバイダーを選択してください。

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI 互換の埋め込みエンドポイントには、`encoding_format` パラメーターを拒否するものがあります。また、このパラメーターを無視して常に `number[]` を返すものもあります。`memory-lancedb` はリクエストで `encoding_format` を省略し、浮動小数点数配列または base64 でエンコードされた float32 の応答を受け付けるため、どちらの応答形式でも設定なしで動作します。

### 次元数

OpenClaw が組み込みの次元数を持つのは、`text-embedding-3-small`（1536）と
`text-embedding-3-large`（3072）のみです。その他のモデルでは、LanceDB が
ベクトル列を作成できるように `embedding.dimensions` を明示的に指定する必要があります。
たとえば、ZhiPu の `embedding-3` は 2048 次元です。

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Ollama の埋め込み

同梱の Ollama プロバイダーアダプター経路（`embedding.provider: "ollama"`）を使用します。
これは Ollama のネイティブ `/api/embed` エンドポイントを呼び出し、
[Ollama](/ja-JP/providers/ollama) プロバイダーと同じ認証およびベース URL の規則に従います。

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` は組み込みの次元数テーブルにないため、`dimensions` が必須です。
小規模なローカル埋め込みモデルでローカルサーバーからコンテキスト長エラーが返される場合は、`recallMaxChars` を小さくしてください。

## 呼び出しと保存の制限

| 設定              | デフォルト | 範囲                         | 適用対象                                                   |
| ----------------- | ---------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`     | 100～10000                   | 呼び出し時に埋め込み API へ送信されるテキスト。            |
| `captureMaxChars` | `500`      | 100～10000                   | 自動保存の対象にできるメッセージの長さ。                   |
| `customTriggers`  | `[]`       | 0～50 項目、各 100 文字以下  | 自動保存でメッセージを検討対象にするリテラルフレーズ。     |

`recallMaxChars` は、`before_prompt_build` の自動呼び出しクエリ、
`memory_recall` ツール、`memory_forget` のクエリ経路、および `openclaw ltm
search` に適用されます。自動呼び出しでは、そのターンの最新のユーザーメッセージを
埋め込み対象とし、ユーザーメッセージがない場合にのみプロンプト全体へフォールバックします。
これにより、チャンネルメタデータや大きなプロンプトブロックが埋め込みリクエストに
含まれないようにします。

`captureMaxChars` は、ターンの `agent_end` イベントに含まれるユーザーメッセージが、
自動保存の検討対象として十分に短いかどうかを判定します。呼び出しクエリには影響しません。

`customTriggers` は、正規表現を使わずに自動保存用のリテラルフレーズを追加します。
組み込みトリガーは、英語、チェコ語、中国語、日本語、韓国語の一般的な記憶フレーズ
（`remember`、`prefer`、`记住`、`覚えて`、`기억해` など）に対応しています。

自動保存では、エンベロープやトランスポートのメタデータ、プロンプトインジェクションの
ペイロード、またはすでに注入済みの `<relevant-memories>` コンテキストに見えるテキストも拒否し、
エージェントの 1 ターンあたり最大 3 件の記憶に制限します。

## コマンド

`memory-lancedb` は、アクティブなメモリスロットを所有している場合だけでなく、
インストールされている限り `ltm` CLI 名前空間を登録します。

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` は、LanceDB テーブルに対して非ベクトルクエリを直接実行します。

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| フラグ                            | デフォルト                              | 注記                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | カンマ区切りの列許可リスト。                                                                                                             |
| `--filter <condition>`            | なし                                    | SQL 形式の WHERE 句。最大 200 文字。英数字、`_-`、空白、および `='"<>!.,()%*` のみ使用可能。                                             |
| `--limit <n>`                     | `10`                                    | 正の整数。                                                                                                                               |
| `--order-by <column>:<asc\|desc>` | なし                                    | フィルター実行後にメモリ内で並べ替えます。並べ替え列は射影に自動追加され、要求されていなかった場合は出力から除外されます。                |

エージェントは、アクティブなメモリ Plugin から 3 つのツールを取得します。

- `memory_recall`: 保存された記憶をベクトル検索します。
- `memory_store`: 事実、好み、決定、またはエンティティを保存します
  （プロンプトインジェクションのペイロードに見えるテキストは拒否し、
  ほぼ重複する保存はスキップします）。
- `memory_forget`: `memoryId`、または `query` で削除します（スコアが 90% を超える
  一意の一致は自動削除し、それ以外の場合は候補 ID を一覧表示して曖昧さを解消します）。

## ストレージ

LanceDB データのデフォルト保存先は `~/.openclaw/memory/lancedb` です。
`dbPath` で上書きできます。

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` は、LanceDB ストレージバックエンド
（S3 互換オブジェクトストレージなど）用の文字列のキーと値のペアを受け付け、
`${ENV_VAR}` の展開に対応します。

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## ランタイム依存関係とプラットフォーム対応

`memory-lancedb` は、Plugin パッケージが所有するネイティブの `@lancedb/lancedb`
パッケージに依存します（OpenClaw のコア配布物が所有するものではありません）。
Gateway の起動時に Plugin の依存関係は修復されません。ネイティブ依存関係が
見つからない場合や読み込みに失敗する場合は、Plugin パッケージを再インストールまたは
更新してから Gateway を再起動してください。

`@lancedb/lancedb` は `darwin-x64`（Intel Mac）向けのネイティブビルドを公開していません。
このプラットフォームでは、Plugin の読み込み時に LanceDB が利用できないことがログに記録されます。
デフォルトのメモリバックエンドを使用するか、対応するプラットフォームまたはアーキテクチャで
Gateway を実行するか、`memory-lancedb` を無効化してください。

## トラブルシューティング

### 入力長がコンテキスト長を超える

埋め込みモデルが呼び出しクエリを拒否しました。

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` を小さくしてから、Gateway を再起動します。

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

Ollama の場合は、ネイティブの埋め込みエンドポイントを使用して、Gateway ホストから
埋め込みサーバーに到達できることも確認してください。

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 対応していない埋め込みモデル

`embedding.dimensions` を指定しない場合、既知の次元数は組み込みの OpenAI 埋め込みモデル
（`text-embedding-3-small`、`text-embedding-3-large`）のみです。その他のモデルでは、
`embedding.dimensions` にそのモデルが返すベクトルサイズを設定してください。

### Plugin は読み込まれるが記憶が表示されない

`plugins.slots.memory` が `memory-lancedb` を指していることを確認してから、次を実行します。

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` が無効でも、Plugin は既存のメモリを呼び出しますが、
新しいメモリを自動的には保存しません。`memory_store` ツールを使用するか、
`autoCapture` を有効にしてください。

## 関連項目

- [メモリの概要](/ja-JP/concepts/memory)
- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [メモリ Wiki](/ja-JP/plugins/memory-wiki)
- [Ollama](/ja-JP/providers/ollama)
