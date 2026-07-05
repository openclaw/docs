---
read_when:
    - memory-lancedb Plugin を設定しています
    - LanceDB バックエンドの長期記憶を、自動リコールまたは自動キャプチャ付きで使いたい
    - Ollama などのローカル OpenAI 互換埋め込みを使用している
sidebarTitle: Memory LanceDB
summary: 公式外部 LanceDB メモリ Plugin を設定する（ローカルの Ollama 互換埋め込みを含む）
title: メモリ LanceDB
x-i18n:
    generated_at: "2026-07-05T11:34:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` は、長期メモリを LanceDB に保存し、ベクトル検索を提供する公式の外部 Plugin です。モデルのターン前に関連メモリを自動リコールし、応答後に重要な事実を自動キャプチャできます。

ローカルのベクトルデータベース、OpenAI 互換の埋め込みエンドポイント、またはデフォルトの組み込みメモリバックエンド外のメモリストアに使用します。

## インストール

```bash
openclaw plugins install @openclaw/memory-lancedb
```

この Plugin は npm に公開されています。OpenClaw ランタイムイメージにはバンドルされていません。インストールすると Plugin エントリが書き込まれ、有効化され、`plugins.slots.memory` が `memory-lancedb` に切り替わります。別の Plugin が現在メモリスロットを所有している場合、その Plugin は警告付きで無効化されます。

<Note>
`memory-wiki` などのコンパニオン Plugin は `memory-lancedb` と並行して実行できますが、アクティブなメモリスロットを所有できる Plugin は一度に 1 つだけです。
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

Plugin 設定を変更した後は Gateway を再起動し、読み込まれたことを確認します。

```bash
openclaw gateway restart
openclaw plugins list
```

## 埋め込み設定

`embedding` は必須で、少なくとも 1 つのフィールドを含める必要があります。`provider` のデフォルトは `openai`、`model` のデフォルトは `text-embedding-3-small` です。

| フィールド             | 型            | 備考                                                                     |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | string        | アダプター ID。例: `openai`、`github-copilot`、`ollama`。デフォルトは `openai`。 |
| `embedding.model`      | string        | デフォルトは `text-embedding-3-small`。                                  |
| `embedding.apiKey`     | string        | 任意。`${ENV_VAR}` 展開をサポートします。                                |
| `embedding.baseUrl`    | string        | 任意。`${ENV_VAR}` 展開をサポートします。                                |
| `embedding.dimensions` | integer (>=1) | 組み込みテーブルにないモデルでは必須です（下記参照）。                   |

2 つのリクエスト経路があります。

- **プロバイダーアダプター経路**（デフォルト）: `embedding.provider` を設定し、`embedding.apiKey`/`embedding.baseUrl` は省略します。この Plugin は、`memory-core` が使用する同じメモリ埋め込みアダプターを通じて、プロバイダーの設定済み認証プロファイル、環境変数、または `models.providers.<provider>.apiKey` を解決します。これは `github-copilot`、`ollama`、および埋め込みをサポートするその他のバンドル済みプロバイダー向けの経路です。
- **直接 OpenAI 互換クライアント経路**: `embedding.provider` を未設定のままにする（または `"openai"` にする）かつ、`embedding.apiKey` と `embedding.baseUrl` を設定します。バンドル済みプロバイダーアダプターを持たない、生の OpenAI 互換埋め込みエンドポイントに使用します。

OpenAI Codex / ChatGPT OAuth は OpenAI Platform 埋め込みの認証情報ではありません。OpenAI 埋め込みには OpenAI API キー認証プロファイル、`OPENAI_API_KEY`、または `models.providers.openai.apiKey` を使用します。OAuth のみのユーザーは、`github-copilot` や `ollama` など、埋め込み対応の別プロバイダーを選択してください。

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

一部の OpenAI 互換埋め込みエンドポイントは `encoding_format` パラメーターを拒否します。他のエンドポイントはそれを無視し、常に `number[]` を返します。`memory-lancedb` はリクエストで `encoding_format` を省略し、float 配列または base64 エンコードされた float32 応答のどちらも受け付けるため、どちらの応答形式も設定なしで動作します。

### 次元数

OpenClaw には `text-embedding-3-small`（1536）と `text-embedding-3-large`（3072）の組み込み次元数のみがあります。それ以外のモデルでは、LanceDB がベクトル列を作成できるように明示的な `embedding.dimensions` が必要です。たとえば ZhiPu `embedding-3` の 2048 次元は次のとおりです。

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

## Ollama 埋め込み

バンドル済みの Ollama プロバイダーアダプター経路（`embedding.provider: "ollama"`）を使用します。これは Ollama のネイティブ `/api/embed` エンドポイントを呼び出し、[Ollama](/ja-JP/providers/ollama) プロバイダーと同じ認証/base URL ルールに従います。

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

`mxbai-embed-large` は組み込み次元数テーブルにないため、`dimensions` が必須です。小さなローカル埋め込みモデルでは、ローカルサーバーがコンテキスト長エラーを返す場合、`recallMaxChars` を下げてください。

## リコールとキャプチャの制限

| 設定              | デフォルト | 範囲                         | 適用対象                                                   |
| ----------------- | ---------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`     | 100-10000                    | リコールのために埋め込み API に送信されるテキスト。       |
| `captureMaxChars` | `500`      | 100-10000                    | 自動キャプチャ対象になり得るメッセージ長。               |
| `customTriggers`  | `[]`       | 0-50 items, each <=100 chars | 自動キャプチャでメッセージを検討させるリテラルフレーズ。 |

`recallMaxChars` は、`before_prompt_build` 自動リコールクエリ、`memory_recall` ツール、`memory_forget` クエリ経路、および `openclaw ltm search` の上限を定めます。自動リコールはターン内の最新ユーザーメッセージを埋め込み、ユーザーメッセージがない場合にのみプロンプト全体へフォールバックするため、チャネルメタデータや大きなプロンプトブロックは埋め込みリクエストから除外されます。

`captureMaxChars` は、ターンの `agent_end` イベントに含まれるユーザーメッセージが自動キャプチャの検討対象として十分短いかどうかを制御します。リコールクエリには影響しません。

`customTriggers` は、正規表現なしでリテラルの自動キャプチャフレーズを追加します。組み込みトリガーは、英語、チェコ語、中国語、日本語、韓国語の一般的なメモリフレーズ（`remember`、`prefer`、`记住`、`覚えて`、`기억해` など）をカバーします。

自動キャプチャは、エンベロープ/トランスポートメタデータ、プロンプトインジェクションペイロード、またはすでに注入済みの `<relevant-memories>` コンテキストに見えるテキストも拒否し、エージェントターンごとにキャプチャされるメモリを最大 3 件に制限します。

## コマンド

`memory-lancedb` は、インストールされている場合に必ず `ltm` CLI 名前空間を登録します（アクティブなメモリスロットを所有している場合だけではありません）。

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

| フラグ                            | デフォルト                            | 備考                                                                                                                                      |
| --------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | カンマ区切りの列許可リスト。                                                                                                             |
| `--filter <condition>`            | none                                  | SQL スタイルの WHERE 句。最大 200 文字。英数字、`_-`、空白、および `='"<>!.,()%*` のみ許可されます。                                      |
| `--limit <n>`                     | `10`                                  | 正の整数。                                                                                                                               |
| `--order-by <column>:<asc\|desc>` | none                                  | フィルター実行後にメモリ内でソートされます。ソート列は projection に自動追加され、要求されていなかった場合は出力から取り除かれます。 |

エージェントは、アクティブなメモリ Plugin から 3 つのツールを取得します。

- `memory_recall`: 保存済みメモリに対するベクトル検索。
- `memory_store`: 事実、設定、決定、またはエンティティを保存します（プロンプトインジェクションペイロードに見えるテキストは拒否し、ほぼ重複する保存はスキップします）。
- `memory_forget`: `memoryId`、または `query` で削除します（90% を超えるスコアの単一一致は自動削除し、それ以外の場合は曖昧さ解消のため候補 ID を一覧表示します）。

## ストレージ

LanceDB データのデフォルトは `~/.openclaw/memory/lancedb` です。`dbPath` で上書きできます。

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

`storageOptions` は LanceDB ストレージバックエンド（例: S3 互換オブジェクトストレージ）向けの文字列キー/値ペアを受け付け、`${ENV_VAR}` 展開をサポートします。

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

## ランタイム依存関係とプラットフォームサポート

`memory-lancedb` はネイティブ `@lancedb/lancedb` パッケージに依存しており、これは Plugin パッケージが所有します（OpenClaw コア dist ではありません）。Gateway 起動時に Plugin 依存関係は修復されません。ネイティブ依存関係が見つからない、または読み込みに失敗する場合は、Plugin パッケージを再インストールまたは更新し、Gateway を再起動してください。

`@lancedb/lancedb` は `darwin-x64`（Intel Mac）向けのネイティブビルドを公開していません。そのプラットフォームでは、Plugin は読み込み時に LanceDB が利用できないことをログに記録します。デフォルトのメモリバックエンドを使用するか、サポート対象のプラットフォーム/アーキテクチャで Gateway を実行するか、`memory-lancedb` を無効化してください。

## トラブルシューティング

### 入力長がコンテキスト長を超えています

埋め込みモデルがリコールクエリを拒否しました。

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` を下げてから、Gateway を再起動します。

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

Ollama の場合は、ネイティブ embed エンドポイントを使用して、埋め込みサーバーに Gateway ホストから到達できることも確認してください。

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### サポートされていない埋め込みモデル

`embedding.dimensions` がない場合、認識されるのは組み込みの OpenAI 埋め込み次元数（`text-embedding-3-small`、`text-embedding-3-large`）のみです。それ以外のモデルでは、そのモデルが報告するベクトルサイズを `embedding.dimensions` に設定してください。

### Plugin は読み込まれるがメモリが表示されない

`plugins.slots.memory` が `memory-lancedb` を指していることを確認してから、次を実行します。

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` が無効な場合でも、Plugin は既存のメモリを想起しますが、
新しいメモリは自動的に保存しません。`memory_store` ツールを使用するか、
`autoCapture` を有効にしてください。

## 関連

- [メモリの概要](/ja-JP/concepts/memory)
- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [メモリ Wiki](/ja-JP/plugins/memory-wiki)
- [Ollama](/ja-JP/providers/ollama)
