---
read_when:
    - memory-lancedb プラグインを設定しています
    - LanceDB ベースの長期記憶を自動リコールまたは自動キャプチャ付きで使用したい
    - Ollama などのローカル OpenAI 互換 embeddings を使用しています
sidebarTitle: Memory LanceDB
summary: 公式外部 LanceDB メモリ Plugin の設定（ローカルの Ollama 互換埋め込みを含む）
title: メモリ LanceDB
x-i18n:
    generated_at: "2026-06-27T12:17:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` は、長期メモリを LanceDB に保存し、想起に埋め込みを使用する公式の外部メモリプラグインです。モデルターンの前に関連するメモリを自動的に想起し、応答後に重要な事実を取得できます。

メモリ用のローカルベクトルデータベースが必要な場合、OpenAI 互換の埋め込みエンドポイントが必要な場合、またはデフォルトの組み込みメモリストアの外部にメモリデータベースを保持したい場合に使用します。

## インストール

`plugins.slots.memory = "memory-lancedb"` を設定する前に `memory-lancedb` をインストールします。

```bash
openclaw plugins install @openclaw/memory-lancedb
```

このプラグインは npm に公開されており、OpenClaw ランタイムイメージにはバンドルされていません。インストーラーはプラグインエントリを書き込み、他のプラグインが所有していない場合にメモリスロットを切り替えます。

<Note>
`memory-lancedb` はアクティブメモリプラグインです。`plugins.slots.memory = "memory-lancedb"` でメモリスロットを選択して有効にします。`memory-wiki` などのコンパニオンプラグインは並行して実行できますが、アクティブメモリスロットを所有できるプラグインは 1 つだけです。
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

プラグイン設定を変更した後、Gateway を再起動します。

```bash
openclaw gateway restart
```

次に、プラグインが読み込まれていることを確認します。

```bash
openclaw plugins list
```

## プロバイダーを利用する埋め込み

`memory-lancedb` は `memory-core` と同じメモリ埋め込みプロバイダーアダプターを使用できます。プロバイダーの設定済み認証プロファイル、環境変数、または `models.providers.<provider>.apiKey` を使用するには、`embedding.provider` を設定し、`embedding.apiKey` を省略します。

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

このパスは、埋め込み認証情報を公開するプロバイダー認証プロファイルで動作します。たとえば、Copilot のプロファイル/プランが埋め込みをサポートしている場合、GitHub Copilot を使用できます。

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

OpenAI Codex / ChatGPT OAuth は OpenAI Platform の埋め込み認証情報ではありません。OpenAI の埋め込みには、OpenAI API キー認証プロファイル、`OPENAI_API_KEY`、または `models.providers.openai.apiKey` を使用します。OAuth のみのユーザーは、GitHub Copilot や Ollama などの別の埋め込み対応プロバイダーを使用できます。

## Ollama 埋め込み

Ollama 埋め込みには、バンドルされた Ollama 埋め込みプロバイダーを推奨します。これはネイティブの Ollama `/api/embed` エンドポイントを使用し、[Ollama](/ja-JP/providers/ollama) に記載されている Ollama プロバイダーと同じ認証/base URL ルールに従います。

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

標準ではない埋め込みモデルには `dimensions` を設定します。OpenClaw は `text-embedding-3-small` と `text-embedding-3-large` の次元数を把握しています。カスタムモデルでは、LanceDB がベクトル列を作成できるように設定で値を指定する必要があります。

小さなローカル埋め込みモデルでは、ローカルサーバーからコンテキスト長エラーが出る場合、`recallMaxChars` を下げます。

## OpenAI 互換プロバイダー

OpenAI 互換の埋め込みプロバイダーの中には `encoding_format` パラメーターを拒否するものがある一方、これを無視して常に `number[]` ベクトルを返すものもあります。そのため `memory-lancedb` は埋め込みリクエストで `encoding_format` を省略し、float 配列のレスポンスと base64 エンコードされた float32 レスポンスのどちらも受け付けます。

バンドルされたプロバイダーアダプターがない生の OpenAI 互換埋め込みエンドポイントがある場合は、`embedding.provider` を省略し（または `openai` のままにし）、`embedding.apiKey` と `embedding.baseUrl` を設定します。これにより、直接の OpenAI 互換クライアントパスが維持されます。

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

## 想起と取得の制限

`memory-lancedb` には 2 つの独立したテキスト制限があります。

| 設定              | デフォルト | 範囲      | 適用先                                                    |
| ----------------- | ---------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`     | 100-10000 | 想起のために埋め込み API に送信されるテキスト             |
| `captureMaxChars` | `500`      | 100-10000 | 自動取得の対象になるメッセージ長                          |
| `customTriggers`  | `[]`       | 0-50      | 自動取得がメッセージを検討するきっかけになるリテラルフレーズ |

`recallMaxChars` は、自動想起、`memory_recall` ツール、`memory_forget` クエリパス、`openclaw ltm search` を制御します。自動想起はターン内の最新のユーザーメッセージを優先し、ユーザーメッセージがない場合にのみプロンプト全体へフォールバックします。これにより、チャンネルメタデータや大きなプロンプトブロックが埋め込みリクエストに入らないようにします。

`captureMaxChars` は、応答が自動取得の候補として十分短いかどうかを制御します。想起クエリの埋め込みは制限しません。

`customTriggers` を使うと、正規表現を書かずにリテラルの自動取得フレーズを追加できます。組み込みトリガーには、一般的な英語、チェコ語、中国語、日本語、韓国語のメモリフレーズが含まれます。

## コマンド

`memory-lancedb` がアクティブなメモリプラグインである場合、`ltm` CLI 名前空間を登録します。

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

`query` サブコマンドは、LanceDB テーブルに対して非ベクトルクエリを直接実行します。

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: カンマ区切りの列許可リスト（デフォルトは `id`, `text`, `importance`, `category`, `createdAt`）。
- `--filter <condition>`: SQL 形式の WHERE 句。200 文字に制限され、英数字、比較演算子、引用符、括弧、および少数の安全な句読点に制限されます。
- `--limit <n>`: 正の整数。デフォルトは `10`。
- `--order-by <column>:<asc|desc>`: フィルター後に適用されるメモリ内ソート。ソート列は投影に自動的に含まれます。

エージェントは、アクティブなメモリプラグインから LanceDB メモリツールも取得します。

- LanceDB による想起用の `memory_recall`
- 重要な事実、設定、決定、エンティティを保存するための `memory_store`
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

`storageOptions` は LanceDB ストレージバックエンド用の文字列 key/value ペアを受け付け、`${ENV_VAR}` 展開をサポートします。

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

`memory-lancedb` はネイティブの `@lancedb/lancedb` パッケージに依存します。パッケージ化された OpenClaw は、そのパッケージをプラグインパッケージの一部として扱います。Gateway 起動時にプラグイン依存関係は修復されません。依存関係がない場合は、プラグインパッケージを再インストールまたは更新し、Gateway を再起動してください。

古いインストールでプラグイン読み込み中に `dist/package.json` がない、または `@lancedb/lancedb` がないというエラーがログに出る場合は、OpenClaw をアップグレードして Gateway を再起動します。

プラグインが `darwin-x64` で LanceDB を利用できないとログに出す場合は、そのマシンでデフォルトのメモリバックエンドを使用するか、Gateway をサポート対象プラットフォームへ移すか、`memory-lancedb` を無効にします。

## トラブルシューティング

### 入力長がコンテキスト長を超えています

これは通常、埋め込みモデルが想起クエリを拒否したことを意味します。

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` を低めに設定し、Gateway を再起動します。

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

Ollama の場合は、埋め込みサーバーが Gateway ホストから到達可能であることも確認します。

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### サポートされていない埋め込みモデル

`dimensions` がない場合、組み込みの OpenAI 埋め込み次元のみが既知です。ローカルまたはカスタムの埋め込みモデルでは、そのモデルが報告するベクトルサイズに `embedding.dimensions` を設定します。

### プラグインは読み込まれるがメモリが表示されない

`plugins.slots.memory` が `memory-lancedb` を指していることを確認してから、次を実行します。

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

`autoCapture` が無効な場合、プラグインは既存のメモリを想起しますが、新しいメモリは自動的に保存しません。自動取得したい場合は、`memory_store` ツールを使用するか、`autoCapture` を有効にします。

## 関連

- [メモリの概要](/ja-JP/concepts/memory)
- [Active Memory](/ja-JP/concepts/active-memory)
- [メモリ検索](/ja-JP/concepts/memory-search)
- [Memory Wiki](/ja-JP/plugins/memory-wiki)
- [Ollama](/ja-JP/providers/ollama)
