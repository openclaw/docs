---
read_when:
    - '`web_search` で Kimi を使いたい場合'
    - '`KIMI_API_KEY` または `MOONSHOT_API_KEY` が必要な場合'
summary: Moonshot web search 経由の Kimi web search
title: Kimi search
x-i18n:
    generated_at: "2026-04-24T05:25:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

OpenClaw は Kimi を `web_search` provider としてサポートしており、Moonshot web search
を使って、出典付きの AI 合成回答を生成します。

## API キーを取得する

<Steps>
  <Step title="キーを作成する">
    [Moonshot AI](https://platform.moonshot.cn/) で API キーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定するか、
    次で設定します:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` または
`openclaw configure --section web` 中に **Kimi** を選ぶと、OpenClaw は次も確認できます:

- Moonshot API リージョン:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- デフォルトの Kimi web-search model（デフォルトは `kimi-k2.6`）

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

チャット用に China API host（`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`）を使っている場合、OpenClaw は Kimi
`web_search` でも、`tools.web.search.kimi.baseUrl` が省略されていれば同じ host を再利用します。これにより、
[platform.moonshot.cn](https://platform.moonshot.cn/) のキーが
誤って international endpoint に送られることを防ぎます（その場合はしばしば HTTP 401 を返します）。別の search base URL が必要な場合は、
`tools.web.search.kimi.baseUrl` で override してください。

**環境変数の代替方法:** Gateway 環境で `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定します。
gateway インストールでは、`~/.openclaw/.env` に置いてください。

`baseUrl` を省略した場合、OpenClaw はデフォルトで `https://api.moonshot.ai/v1` を使います。
`model` を省略した場合、OpenClaw はデフォルトで `kimi-k2.6` を使います。

## 仕組み

Kimi は Moonshot web search を使って、Gemini や Grok の grounded response アプローチに似た、
インライン引用付きの合成回答を生成します。

## サポートされるパラメータ

Kimi search は `query` をサポートします。

共有 `web_search` 互換性のため `count` も受け付けますが、Kimi は依然として
N 件の結果リストではなく、引用付きの 1 つの合成回答を返します。

provider 固有のフィルタは現在サポートされていません。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべての provider と自動検出
- [Moonshot AI](/ja-JP/providers/moonshot) -- Moonshot model + Kimi Coding provider docs
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google grounding 経由の AI 合成回答
- [Grok Search](/ja-JP/tools/grok-search) -- xAI grounding 経由の AI 合成回答
