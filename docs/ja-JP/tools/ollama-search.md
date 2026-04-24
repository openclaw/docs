---
read_when:
    - web_search にOllamaを使いたい
    - API key不要の web_search プロバイダが欲しい
    - Ollama Web Search のセットアップガイダンスが必要です
summary: 設定済みのOllama host経由のOllama Web Search
title: Ollama web search
x-i18n:
    generated_at: "2026-04-24T05:26:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClawは、バンドル済みの `web_search` プロバイダとして **Ollama Web Search** をサポートしています。
これはOllamaのexperimentalなweb-search APIを使い、タイトル、URL、snippetを含む構造化結果を返します。

Ollamaモデルプロバイダとは異なり、このセットアップではデフォルトでAPI keyは
不要です。ただし、次が必要です:

- OpenClawから到達可能なOllama host
- `ollama signin`

## セットアップ

<Steps>
  <Step title="Ollamaを起動する">
    Ollamaがインストール済みで、実行中であることを確認してください。
  </Step>
  <Step title="サインインする">
    次を実行します:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Ollama Web Searchを選ぶ">
    次を実行します:

    ```bash
    openclaw configure --section web
    ```

    その後、プロバイダとして **Ollama Web Search** を選択します。

  </Step>
</Steps>

すでにモデル用にOllamaを使っている場合、Ollama Web Searchは
同じ設定済みhostを再利用します。

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

任意のOllama host override:

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

明示的なOllama base URLが設定されていない場合、OpenClawは `http://127.0.0.1:11434` を使います。

Ollama hostがbearer authを期待する場合、OpenClawは
`models.providers.ollama.apiKey`（または一致するenvバックエンドprovider auth）
をweb-searchリクエストにも再利用します。

## 注記

- このプロバイダには、web-search固有のAPI keyフィールドは不要です。
- Ollama hostがauth保護されている場合、OpenClawは存在すれば通常のOllama
  プロバイダAPI keyを再利用します。
- セットアップ中、Ollamaに到達できない、またはサインインしていない場合、OpenClawは警告しますが、
  選択自体はブロックしません。
- ランタイムauto-detectは、より優先度の高い
  credentialed providerが設定されていない場合、Ollama Web Searchへfallbackできます。
- このプロバイダはOllamaのexperimentalな `/api/experimental/web_search`
  endpointを使います。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべてのプロバイダとauto-detection
- [Ollama](/ja-JP/providers/ollama) -- Ollamaモデルのセットアップとcloud/localモード
