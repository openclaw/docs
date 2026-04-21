---
read_when:
    - '`web_search` に Kimi を使いたい'
    - '`KIMI_API_KEY` または `MOONSHOT_API_KEY` が必要です'
summary: Moonshot Web 検索経由の Kimi Web 検索
title: Kimi 検索
x-i18n:
    generated_at: "2026-04-21T04:51:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee0c8cd0e7c2edf8e05d22fbb5ef7338c9f68e7ac791eee024c73333936bb75a
    source_path: tools/kimi-search.md
    workflow: 15
---

# Kimi 検索

OpenClaw は、Moonshot Web 検索を使って引用付きの AI 合成回答を生成する `web_search` provider として Kimi をサポートしています。

## API キーを取得する

<Steps>
  <Step title="キーを作成する">
    [Moonshot AI](https://platform.moonshot.cn/) で API キーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定するか、次で構成します:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` または
`openclaw configure --section web` の実行中に **Kimi** を選択すると、
OpenClaw は次も確認できます:

- Moonshot API リージョン:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- デフォルトの Kimi Web 検索モデル（デフォルトは `kimi-k2.6`）

## 設定

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // KIMI_API_KEY または MOONSHOT_API_KEY が設定されている場合は任意
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

チャット用に中国 API host（`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`）を使用している場合、`tools.web.search.kimi.baseUrl` が省略されると、OpenClaw は Kimi
`web_search` にも同じ host を再利用します。これにより、
[platform.moonshot.cn](https://platform.moonshot.cn/) のキーが誤って
国際 endpoint に送られることを防げます（その場合、HTTP 401 が返ることがよくあります）。別の検索 base URL が必要な場合は、
`tools.web.search.kimi.baseUrl` で上書きしてください。

**環境変数の代替:** Gateway 環境に `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定してください。gateway をインストールしている場合は、`~/.openclaw/.env` に配置します。

`baseUrl` を省略した場合、OpenClaw はデフォルトで `https://api.moonshot.ai/v1` を使用します。  
`model` を省略した場合、OpenClaw はデフォルトで `kimi-k2.6` を使用します。

## 仕組み

Kimi は、Gemini や Grok の grounding response アプローチと同様に、Moonshot Web 検索を使ってインライン引用付きの回答を合成します。

## サポートされるパラメーター

Kimi 検索は `query` をサポートします。

`count` も共有 `web_search` 互換性のため受け付けられますが、Kimi は
N 件の結果リストではなく、引用付きの 1 つの合成回答を返します。

provider 固有のフィルターは現在サポートされていません。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべての provider と自動検出
- [Moonshot AI](/ja-JP/providers/moonshot) -- Moonshot model + Kimi Coding provider ドキュメント
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google grounding による AI 合成回答
- [Grok Search](/ja-JP/tools/grok-search) -- xAI grounding による AI 合成回答
