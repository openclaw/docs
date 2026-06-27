---
read_when:
    - web_search に Ollama を使用したい
    - キー不要の web_search プロバイダーが必要です
    - OLLAMA_API_KEY でホスト型 Ollama Web Search を使用したい
    - Ollama Web Search のセットアップガイダンスが必要です
summary: ローカル Ollama ホストまたはホスト型 Ollama API 経由の Ollama Web Search
title: Ollama Web検索
x-i18n:
    generated_at: "2026-06-27T13:15:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw は、バンドルされた `web_search` プロバイダーとして **Ollama Web Search** をサポートします。これは Ollama の web-search API を使用し、タイトル、URL、スニペットを含む構造化された結果を返します。

ローカルまたはセルフホストの Ollama では、この設定はデフォルトで API キーを必要としません。必要なものは次のとおりです。

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

すでにモデルで Ollama を使用している場合、Ollama Web Search は同じ設定済みホストを再利用します。

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

任意の Ollama ホスト上書き:

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

Ollama モデルプロバイダーは `baseUrl` を正規キーとして使用します。web-search プロバイダーは、OpenAI SDK スタイルの設定例との互換性のために、`models.providers.ollama` の `baseURL` も尊重します。

明示的な Ollama ベース URL が設定されていない場合、OpenClaw は `http://127.0.0.1:11434` を使用します。

Ollama ホストが bearer 認証を想定している場合、OpenClaw はその設定済みホストへのリクエストに `models.providers.ollama.apiKey`（または対応する環境変数ベースのプロバイダー認証）を再利用します。

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

## 注記

- このプロバイダーには、web-search 専用の API キーフィールドは不要です。
- Ollama ホストが認証で保護されている場合、OpenClaw は通常の Ollama プロバイダー API キーが存在するときにそれを再利用します。
- `baseUrl` が `https://ollama.com` の場合、OpenClaw は `https://ollama.com/api/web_search` を直接呼び出し、設定済みの Ollama API キーを bearer 認証として送信します。
- 設定済みホストが web search を公開しておらず、`OLLAMA_API_KEY` が設定されている場合、OpenClaw はその環境変数キーをローカルホストへ送信せずに `https://ollama.com/api/web_search` へフォールバックできます。
- Ollama に到達できない、またはサインインしていない場合、OpenClaw はセットアップ中に警告しますが、選択はブロックしません。
- OpenClaw は、より優先度の高い認証情報付きプロバイダーが設定されていない場合でも、Ollama Web Search を自動選択しません。`tools.web.search.provider: "ollama"` で明示的に選択してください。
- ローカルの Ollama デーモンホストは、Ollama Cloud に署名して転送する local proxy エンドポイント `/api/experimental/web_search` を使用します。
- `https://ollama.com` ホストは、bearer API-key 認証で公開ホスト型エンドポイント `/api/web_search` を直接使用します。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Ollama](/ja-JP/providers/ollama) -- Ollama モデルのセットアップとクラウド/ローカルモード
