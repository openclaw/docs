---
read_when:
    - 同梱の memory-lancedb Plugin を設定しています
    - LanceDB をバックエンドにした、自動リコールまたは自動キャプチャ付きの長期メモリを使いたい場合
    - Ollama などのローカルの OpenAI 互換埋め込みを使用しています
sidebarTitle: Memory LanceDB
summary: ローカルの Ollama 互換埋め込みを含む同梱の LanceDB メモリ Plugin を設定する
title: メモリ LanceDB
x-i18n:
    generated_at: "2026-05-02T05:02:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` は、長期記憶を LanceDB に保存し、想起に埋め込みを使用する同梱メモリ Plugin です。モデルのターン前に関連する記憶を自動的に想起し、応答後に重要な事実を取り込めます。

メモリ用のローカルベクトルデータベースが必要な場合、OpenAI 互換の埋め込みエンドポイントが必要な場合、または既定の組み込みメモリストアの外にメモリデータベースを保持したい場合に使用します。

<Note>
`memory-lancedb` は Active Memory Plugin です。`plugins.slots.memory = "memory-lancedb"` でメモリスロットを選択して有効にします。`memory-wiki` などのコンパニオン Plugin は併用できますが、アクティブなメモリスロットを所有できる Plugin は 1 つだけです。
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

`memory-lancedb` は、`memory-core` と同じメモリ埋め込みプロバイダーアダプターを使用できます。`embedding.provider` を設定し、`embedding.apiKey` を省略すると、プロバイダーに設定済みの認証プロファイル、環境変数、または `models.providers.<provider>.apiKey` が使用されます。

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

この経路は、埋め込み認証情報を公開するプロバイダー認証プロファイルで機能します。たとえば、Copilot のプロファイルまたはプランが埋め込みをサポートしている場合、GitHub Copilot を使用できます。

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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) は OpenAI Platform の埋め込み認証情報ではありません。OpenAI 埋め込みには、OpenAI API キー認証プロファイル、`OPENAI_API_KEY`、または `models.providers.openai.apiKey` を使用します。OAuth のみのユーザーは、GitHub Copilot や Ollama など、埋め込みに対応した別のプロバイダーを使用できます。

## Ollama 埋め込み

Ollama 埋め込みでは、同梱の Ollama 埋め込みプロバイダーを優先してください。これはネイティブの Ollama `/api/embed` エンドポイントを使用し、[Ollama](/ja-JP/providers/ollama) に記載されている Ollama プロバイダーと同じ認証およびベース URL ルールに従います。

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

非標準の埋め込みモデルには `dimensions` を設定します。OpenClaw は `text-embedding-3-small` と `text-embedding-3-large` の次元数を認識しています。カスタムモデルでは、LanceDB がベクトル列を作成できるように設定内で値を指定する必要があります。

小さなローカル埋め込みモデルでは、ローカルサーバーからコンテキスト長エラーが出る場合、`recallMaxChars` を下げてください。

## OpenAI 互換プロバイダー

OpenAI 互換の埋め込みプロバイダーの中には、`encoding_format` パラメーターを拒否するものがあります。一方で、それを無視して常に `number[]` ベクトルを返すものもあります。そのため、`memory-lancedb` は埋め込みリクエストで `encoding_format` を省略し、float 配列の応答または base64 エンコードされた float32 応答のどちらも受け入れます。

同梱のプロバイダーアダプターがない素の OpenAI 互換埋め込みエンドポイントがある場合は、`embedding.provider` を省略するか `openai` のままにし、`embedding.apiKey` と `embedding.baseUrl` を設定します。これにより、直接の OpenAI 互換クライアント経路が維持されます。

モデル次元が組み込まれていないプロバイダーでは、`embedding.dimensions` を設定します。たとえば、ZhiPu `embedding-3` は `2048` 次元を使用します。

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

## 想起と取り込みの制限

`memory-lancedb` には 2 つの個別のテキスト制限があります。

| 設定              | 既定値  | 範囲      | 適用対象                                      |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 想起のために埋め込み API へ送信されるテキスト |
| `captureMaxChars` | `500`   | 100-10000 | 取り込み対象になり得るアシスタントメッセージの長さ |

`recallMaxChars` は、自動想起、`memory_recall` ツール、`memory_forget` クエリ経路、および `openclaw ltm search` を制御します。自動想起はターン内の最新のユーザーメッセージを優先し、ユーザーメッセージがない場合にのみ完全なプロンプトにフォールバックします。これにより、チャネルメタデータや大きなプロンプトブロックが埋め込みリクエストに入らないようになります。

`captureMaxChars` は、応答が自動取り込みの検討対象になるほど短いかどうかを制御します。想起クエリの埋め込みを制限するものではありません。

## コマンド

`memory-lancedb` がアクティブなメモリ Plugin の場合、`ltm` CLI 名前空間を登録します。

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin はさらに、LanceDB テーブルに対して直接実行される非ベクトルの `query` サブコマンドで `openclaw memory` を拡張します。

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: カンマ区切りの列許可リストです。既定は `id`、`text`、`importance`、`category`、`createdAt` です。
- `--filter <condition>`: SQL 形式の WHERE 句です。200 文字に制限され、英数字、比較演算子、引用符、丸括弧、および少数の安全な句読点に制限されます。
- `--limit <n>`: 正の整数です。既定は `10` です。
- `--order-by <column>:<asc|desc>`: フィルター後に適用されるメモリ内ソートです。ソート列はプロジェクションに自動的に含まれます。

エージェントも、アクティブなメモリ Plugin から LanceDB メモリツールを取得します。

- LanceDB に基づく想起用の `memory_recall`
- 重要な事実、設定、決定、エンティティを保存するための `memory_store`
- 一致する記憶を削除するための `memory_forget`

## ストレージ

既定では、LanceDB データは `~/.openclaw/memory/lancedb` 配下に置かれます。`dbPath` でパスを上書きできます。

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

`storageOptions` は LanceDB ストレージバックエンド用の文字列キー/値ペアを受け入れ、`${ENV_VAR}` 展開をサポートします。

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

`memory-lancedb` はネイティブの `@lancedb/lancedb` パッケージに依存します。パッケージ化された OpenClaw は、そのパッケージを Plugin パッケージの一部として扱います。Gateway 起動時に Plugin 依存関係は修復されません。依存関係が欠落している場合は、Plugin パッケージを再インストールまたは更新し、Gateway を再起動してください。

古いインストールで、Plugin 読み込み中に `dist/package.json` の欠落や `@lancedb/lancedb` の欠落エラーがログに記録される場合は、OpenClaw をアップグレードして Gateway を再起動してください。

Plugin が `darwin-x64` で LanceDB を利用できないとログに記録する場合は、そのマシンで既定のメモリバックエンドを使用するか、Gateway をサポートされているプラットフォームへ移動するか、`memory-lancedb` を無効にしてください。

## トラブルシューティング

### 入力長がコンテキスト長を超えています

これは通常、埋め込みモデルが想起クエリを拒否したことを意味します。

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` を低く設定し、Gateway を再起動します。

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

Ollama の場合は、Gateway ホストから埋め込みサーバーに到達できることも確認します。

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### サポートされていない埋め込みモデル

`dimensions` がない場合、組み込みの OpenAI 埋め込み次元のみが既知です。ローカルまたはカスタムの埋め込みモデルでは、そのモデルが報告するベクトルサイズに `embedding.dimensions` を設定します。

### Plugin は読み込まれるが記憶が表示されない

`plugins.slots.memory` が `memory-lancedb` を指していることを確認し、次を実行します。

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` が無効な場合、Plugin は既存の記憶を想起しますが、新しい記憶を自動的には保存しません。自動取り込みが必要な場合は、`memory_store` ツールを使用するか、`autoCapture` を有効にしてください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Memory Wiki](/ja-JP/plugins/memory-wiki)
- [Ollama](/ja-JP/providers/ollama)
