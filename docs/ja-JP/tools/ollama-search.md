---
read_when:
    - web_search に Ollama を使いたい場合
    - キー不要の web_search プロバイダーが必要な場合
    - OLLAMA_API_KEY を使ってホスト型 Ollama ウェブ検索を使用したい場合
    - Ollama Web Search のセットアップガイダンスが必要です
summary: ローカルの Ollama ホストまたはホスト型 Ollama API を介した Ollama ウェブ検索
title: Ollama ウェブ検索
x-i18n:
    generated_at: "2026-04-30T05:39:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw は、バンドル済みの `web_search` プロバイダーとして **Ollama Web Search** をサポートしています。これは Ollama の web-search API を使用し、タイトル、URL、スニペットを含む構造化された結果を返します。

ローカルまたはセルフホストの Ollama の場合、このセットアップではデフォルトで API キーは不要です。必要なのは次のものです。

- OpenClaw から到達可能な Ollama ホスト
- `ollama signin`

直接ホスト型検索を使う場合は、Ollama プロバイダーのベース URL を `https://ollama.com` に設定し、実際の `OLLAMA_API_KEY` を指定します。

## セットアップ

<Steps>
  <Step title="Ollama を起動する">
    Ollama がインストールされ、実行中であることを確認します。
  </Step>
  <Step title="サインインする">
    実行します。

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Search を選択する">
    実行します。

    ```bash
    openclaw configure --section web
    ```

    次に、プロバイダーとして **Ollama Web Search** を選択します。

  </Step>
</Steps>

すでにモデル用に Ollama を使用している場合、Ollama Web Search は同じ設定済みホストを再利用します。

## 設定

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

任意の Ollama ホストのオーバーライド:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

すでに Ollama をモデルプロバイダーとして設定している場合、web-search プロバイダーは代わりにそのホストを再利用できます。

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Ollama モデルプロバイダーは、正規キーとして `baseUrl` を使用します。web-search プロバイダーは、OpenAI SDK スタイルの設定例との互換性のために、`models.providers.ollama` の `baseURL` も尊重します。

明示的な Ollama ベース URL が設定されていない場合、OpenClaw は `http://127.0.0.1:11434` を使用します。

Ollama ホストがベアラー認証を想定している場合、OpenClaw はその設定済みホストへのリクエストに `models.providers.ollama.apiKey`（または対応する環境変数ベースのプロバイダー認証）を再利用します。

直接ホスト型 Ollama Web Search:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## 注意事項

- このプロバイダーには、web-search 専用の API キーフィールドは不要です。
- Ollama ホストが認証で保護されている場合、OpenClaw は通常の Ollama プロバイダー API キーが存在するときにそれを再利用します。
- `baseUrl` が `https://ollama.com` の場合、OpenClaw は `https://ollama.com/api/web_search` を直接呼び出し、設定済みの Ollama API キーをベアラー認証として送信します。
- 設定済みホストが web search を公開しておらず、`OLLAMA_API_KEY` が設定されている場合、OpenClaw はその環境変数キーをローカルホストに送信せずに `https://ollama.com/api/web_search` へフォールバックできます。
- Ollama に到達できない、またはサインインしていない場合、OpenClaw はセットアップ中に警告しますが、選択はブロックしません。
- 実行時の自動検出は、優先度の高い認証済みプロバイダーが設定されていない場合、Ollama Web Search にフォールバックできます。
- ローカル Ollama デーモンホストはローカルプロキシエンドポイント `/api/experimental/web_search` を使用し、これが署名して Ollama Cloud に転送します。
- `https://ollama.com` ホストは、パブリックなホスト型エンドポイント `/api/web_search` をベアラー API キー認証で直接使用します。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Ollama](/ja-JP/providers/ollama) -- Ollama モデルのセットアップとクラウド/ローカルモード
