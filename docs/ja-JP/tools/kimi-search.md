---
read_when:
    - web_search に Kimi を使用したい場合
    - KIMI_API_KEY または MOONSHOT_API_KEY が必要です
summary: Moonshot Web 検索経由の Kimi Web 検索
title: Kimi 検索
x-i18n:
    generated_at: "2026-05-02T21:08:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw は Kimi を `web_search` プロバイダーとしてサポートし、Moonshot の Web 検索を使用して、引用付きの AI 合成回答を生成します。

## API キーを取得する

<Steps>
  <Step title="キーを作成する">
    [Moonshot AI](https://platform.moonshot.cn/) から API キーを取得します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定するか、次の方法で構成します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

`openclaw onboard` または `openclaw configure --section web` で **Kimi** を選択すると、OpenClaw は次の項目も確認できます。

- Moonshot API リージョン:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- デフォルトの Kimi Web 検索モデル（デフォルトは `kimi-k2.6`）

## 構成

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

チャット用に中国 API ホスト（`models.providers.moonshot.baseUrl`: `https://api.moonshot.cn/v1`）を使用している場合、`tools.web.search.kimi.baseUrl` が省略されると、OpenClaw は Kimi `web_search` に同じホストを再利用します。そのため、[platform.moonshot.cn](https://platform.moonshot.cn/) のキーが誤って国際エンドポイントに到達することはありません（多くの場合 HTTP 401 が返されます）。別の検索ベース URL が必要な場合は、`tools.web.search.kimi.baseUrl` で上書きしてください。

**環境変数の代替:** Gateway 環境で `KIMI_API_KEY` または `MOONSHOT_API_KEY` を設定します。Gateway インストールの場合は、`~/.openclaw/.env` に配置します。

`baseUrl` を省略すると、OpenClaw はデフォルトで `https://api.moonshot.ai/v1` を使用します。
`model` を省略すると、OpenClaw はデフォルトで `kimi-k2.6` を使用します。

## 仕組み

Kimi は Moonshot の Web 検索を使用して、Gemini や Grok の根拠付き応答アプローチと同様に、インライン引用付きの回答を合成します。

OpenClaw は、リプレイ可能な `$web_search` ツールペイロード、`search_results`、引用 URL など、Moonshot がネイティブの Web 検索根拠情報を返した場合にのみ、Kimi `web_search` を成功として扱います。Kimi が「I cannot browse the internet」のような通常のチャット回答だけで即座に停止し、根拠情報がない場合、OpenClaw はそのテキストを検索結果としてラップせず、構造化された `kimi_web_search_ungrounded` エラーを返します。クエリを再試行するか、Brave のような構造化プロバイダーに切り替えるか、ターゲット URL がすでにある場合は `web_fetch` / ブラウザーツールを使用してください。

## サポートされるパラメーター

Kimi 検索は `query` をサポートします。

`count` は共有 `web_search` 互換性のために受け付けられますが、Kimi は N 件の結果リストではなく、引用付きの合成回答を 1 件返します。

プロバイダー固有のフィルターは現在サポートされていません。

## 関連

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Moonshot AI](/ja-JP/providers/moonshot) -- Moonshot モデル + Kimi Coding プロバイダードキュメント
- [Gemini Search](/ja-JP/tools/gemini-search) -- Google grounding による AI 合成回答
- [Grok Search](/ja-JP/tools/grok-search) -- xAI grounding による AI 合成回答
