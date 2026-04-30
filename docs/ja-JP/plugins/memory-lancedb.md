---
read_when:
    - 同梱の memory-lancedb Plugin を設定しています
    - 自動想起または自動キャプチャに対応した、LanceDB をバックエンドにした長期メモリが必要な場合
    - Ollama などのローカルの OpenAI 互換埋め込みを使用しています
sidebarTitle: Memory LanceDB
summary: ローカルの Ollama 互換埋め込みを含め、バンドルされた LanceDB メモリ Plugin を設定する
title: メモリ LanceDB
x-i18n:
    generated_at: "2026-04-30T05:25:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` は、長期メモリを LanceDB に保存し、リコールに埋め込みを使用するバンドル済みメモリ Plugin です。モデルターンの前に関連するメモリを自動的にリコールし、応答後に重要な事実をキャプチャできます。

メモリ用のローカルベクトルデータベースが必要な場合、OpenAI 互換の埋め込みエンドポイントが必要な場合、またはデフォルトの組み込みメモリストアの外部にメモリデータベースを保持したい場合に使用します。

<Note>
`memory-lancedb` は Active Memory Plugin です。`plugins.slots.memory = "memory-lancedb"` でメモリスロットを選択して有効化します。`memory-wiki` などのコンパニオン Plugin は並行して実行できますが、Active Memory スロットを所有できる Plugin は 1 つだけです。
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

Plugin 設定を変更した後は Gateway を再起動します。

```bash
openclaw gateway restart
```

次に、Plugin が読み込まれていることを確認します。

```bash
openclaw plugins list
```

## プロバイダーに基づく埋め込み

`memory-lancedb` は `memory-core` と同じメモリ埋め込みプロバイダーアダプターを使用できます。プロバイダーの設定済み認証プロファイル、環境変数、または `models.providers.<provider>.apiKey` を使用するには、`embedding.provider` を設定し、`embedding.apiKey` は省略します。

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
        },
      },
    },
  },
}
```

この経路は、埋め込み認証情報を公開するプロバイダー認証プロファイルで動作します。たとえば、Copilot のプロファイル/プランが埋め込みをサポートしている場合は、GitHub Copilot を使用できます。

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth (`openai-codex`) は OpenAI Platform の埋め込み認証情報ではありません。OpenAI の埋め込みには、OpenAI API キー認証プロファイル、`OPENAI_API_KEY`、または `models.providers.openai.apiKey` を使用します。OAuth のみのユーザーは、GitHub Copilot や Ollama など、埋め込みに対応した別のプロバイダーを使用できます。

## Ollama 埋め込み

Ollama 埋め込みには、バンドル済みの Ollama 埋め込みプロバイダーを推奨します。これはネイティブの Ollama `/api/embed` エンドポイントを使用し、[Ollama](/ja-JP/providers/ollama) に記載されている Ollama プロバイダーと同じ認証/base URL ルールに従います。

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

標準ではない埋め込みモデルには `dimensions` を設定します。OpenClaw は `text-embedding-3-small` と `text-embedding-3-large` の次元数を把握しています。カスタムモデルでは、LanceDB がベクトル列を作成できるように、設定でこの値が必要です。

小規模なローカル埋め込みモデルでは、ローカルサーバーからコンテキスト長エラーが出る場合、`recallMaxChars` を下げます。

## OpenAI 互換プロバイダー

一部の OpenAI 互換埋め込みプロバイダーは `encoding_format` パラメーターを拒否しますが、他のプロバイダーはそれを無視し、常に `number[]` ベクトルを返します。そのため、`memory-lancedb` は埋め込みリクエストで `encoding_format` を省略し、浮動小数点数配列のレスポンスまたは base64 エンコードされた float32 レスポンスのどちらも受け付けます。

バンドル済みのプロバイダーアダプターがない生の OpenAI 互換埋め込みエンドポイントがある場合は、`embedding.provider` を省略し（または `openai` のままにし）、`embedding.apiKey` と `embedding.baseUrl` を設定します。これにより、直接の OpenAI 互換クライアント経路が維持されます。

モデルの次元数が組み込まれていないプロバイダーには `embedding.dimensions` を設定します。たとえば、ZhiPu `embedding-3` は `2048` 次元を使用します。

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

## リコールとキャプチャの制限

`memory-lancedb` には 2 つの別々のテキスト制限があります。

| 設定              | デフォルト | 範囲      | 適用対象                                      |
| ----------------- | ---------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`     | 100-10000 | リコール用に埋め込み API へ送信されるテキスト |
| `captureMaxChars` | `500`      | 100-10000 | キャプチャ対象になり得るアシスタントメッセージ長 |

`recallMaxChars` は、自動リコール、`memory_recall` ツール、`memory_forget` クエリ経路、`openclaw ltm search` を制御します。自動リコールはターン内の最新ユーザーメッセージを優先し、ユーザーメッセージがない場合にのみプロンプト全体にフォールバックします。これにより、チャネルメタデータや大きなプロンプトブロックが埋め込みリクエストに含まれないようになります。

`captureMaxChars` は、応答が自動キャプチャの候補になるのに十分短いかどうかを制御します。リコールクエリの埋め込みを上限設定するものではありません。

## コマンド

`memory-lancedb` が Active Memory Plugin の場合、`ltm` CLI 名前空間を登録します。

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

この Plugin は、LanceDB テーブルに対して直接実行される非ベクトルの `query` サブコマンドで `openclaw memory` も拡張します。

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: カンマ区切りの列許可リスト（デフォルトは `id`, `text`, `importance`, `category`, `createdAt`）。
- `--filter <condition>`: SQL 風の WHERE 句。200 文字に制限され、英数字、比較演算子、引用符、括弧、および少数の安全な句読点に限定されます。
- `--limit <n>`: 正の整数。デフォルトは `10`。
- `--order-by <column>:<asc|desc>`: フィルター後に適用されるメモリ内ソート。ソート列は投影に自動的に含まれます。

エージェントも、Active Memory Plugin から LanceDB メモリツールを取得します。

- LanceDB に基づくリコール用の `memory_recall`
- 重要な事実、好み、決定、エンティティを保存するための `memory_store`
- 一致するメモリを削除するための `memory_forget`

## ストレージ

デフォルトでは、LanceDB データは `~/.openclaw/memory/lancedb` 配下に置かれます。`dbPath` でパスを上書きできます。

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

`storageOptions` は LanceDB ストレージバックエンド用の文字列キー/値ペアを受け付け、`${ENV_VAR}` 展開をサポートします。

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

## ランタイム依存関係

`memory-lancedb` はネイティブの `@lancedb/lancedb` パッケージに依存しています。パッケージ化された OpenClaw インストールは、まずバンドル済みのランタイム依存関係を試し、バンドル済みインポートが利用できない場合は OpenClaw 状態の下で Plugin ランタイム依存関係を修復できます。

古いインストールで、Plugin 読み込み中に `dist/package.json` が見つからない、または `@lancedb/lancedb` が見つからないというエラーがログに記録される場合は、OpenClaw をアップグレードして Gateway を再起動します。

Plugin が `darwin-x64` で LanceDB を利用できないとログに記録する場合は、そのマシンでデフォルトのメモリバックエンドを使用するか、Gateway をサポート対象プラットフォームへ移動するか、`memory-lancedb` を無効化します。

## トラブルシューティング

### 入力長がコンテキスト長を超えています

これは通常、埋め込みモデルがリコールクエリを拒否したことを意味します。

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` を低く設定してから、Gateway を再起動します。

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

Ollama の場合は、埋め込みサーバーに Gateway ホストから到達できることも確認します。

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### サポートされていない埋め込みモデル

`dimensions` がない場合、認識されるのは組み込みの OpenAI 埋め込み次元数だけです。ローカルまたはカスタムの埋め込みモデルでは、`embedding.dimensions` をそのモデルが報告するベクトルサイズに設定します。

### Plugin は読み込まれるがメモリが表示されない

`plugins.slots.memory` が `memory-lancedb` を指していることを確認してから、次を実行します。

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` が無効な場合、Plugin は既存のメモリをリコールしますが、新しいメモリを自動的には保存しません。自動キャプチャが必要な場合は、`memory_store` ツールを使用するか、`autoCapture` を有効にします。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Memory Wiki](/ja-JP/plugins/memory-wiki)
- [Ollama](/ja-JP/providers/ollama)
