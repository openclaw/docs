---
read_when:
    - Ollama を web_search に使用したい
    - キー不要の web_search プロバイダーが必要な場合
    - OLLAMA_API_KEY でホスト型 Ollama Web Search を使用したい
    - Ollama Web Search のセットアップガイダンスが必要です
summary: local Ollama ホストまたはホスト型 Ollama API 経由の Ollama Web Search
title: Ollamaウェブ検索
x-i18n:
    generated_at: "2026-07-05T11:56:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw はバンドル済みの `web_search` プロバイダーとして **Ollama Web Search** をサポートし、
Ollama の web-search API からタイトル、URL、スニペットを返します。

ローカル/セルフホストの Ollama はデフォルトで API キーを必要としません。到達可能な
Ollama ホストと `ollama signin` が必要です。直接ホスト型検索（ローカル Ollama なし）には
`baseUrl: "https://ollama.com"` と実際の `OLLAMA_API_KEY` が必要です。

## セットアップ

<Steps>
  <Step title="Start Ollama">
    Ollama がインストールされ、実行中であることを確認します。
  </Step>
  <Step title="Sign in">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Choose Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    プロバイダーとして **Ollama Web Search** を選択します。

  </Step>
</Steps>

すでにモデルで Ollama を使用している場合、Ollama Web Search は同じ
設定済みホストを再利用します。

<Note>
  OpenClaw が、優先度の高い認証情報付きプロバイダーよりも Ollama Web Search を
  自動選択することはありません。`tools.web.search.provider: "ollama"` で
  明示的に選択する必要があります。
</Note>

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

ウェブ検索のみにスコープされた任意のホスト上書き:

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

または、Ollama モデルプロバイダー向けにすでに設定されているホストを再利用します。

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

`models.providers.ollama.baseUrl` は正規のキーです。web-search
プロバイダーは、OpenAI SDK 形式の設定例との互換性のため、そこで `baseURL` も受け付けます。
何も設定されていない場合、OpenClaw はデフォルトで
`http://127.0.0.1:11434` を使用します。

直接ホスト型 Ollama Web Search（ローカル Ollama なし）:

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

## 認証とリクエストルーティング

- ウェブ検索専用の API キーフィールドはありません。設定済みホストが認証で保護されている場合、
  プロバイダーは `models.providers.ollama.apiKey`（または一致する環境変数ベースのプロバイダー認証）を
  再利用します。
- ホスト解決順序: `plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl`（または `baseURL`）→ `http://127.0.0.1:11434`。
- 解決されたホストが `https://ollama.com` の場合、OpenClaw は
  `https://ollama.com/api/web_search` を API キーによる bearer
  認証付きで直接呼び出します。
- それ以外の場合、OpenClaw はまずローカルプロキシエンドポイント
  `/api/experimental/web_search` を呼び出します（これは署名して Ollama
  Cloud に転送します）。その後、同じホストの `/api/web_search` にフォールバックします。両方が失敗し、
  `OLLAMA_API_KEY` が設定されている場合、そのキーを使って
  `https://ollama.com/api/web_search` に対して 1 回だけ再試行します。そのキーは
  ローカルホストには送信しません。
- Ollama に到達できない、またはサインインしていない場合、OpenClaw はセットアップ中に警告しますが、
  プロバイダーの選択はブロックしません。

## 関連

- [ウェブ検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Ollama](/ja-JP/providers/ollama) -- Ollama モデルのセットアップとクラウド/ローカルモード
