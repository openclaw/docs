---
read_when:
    - '`code_execution` を有効化または設定したい場合'
    - ローカル shell アクセスなしでリモート分析をしたい場合
    - '`x_search` または `web_search` をリモート Python 分析と組み合わせたい場合'
summary: code_execution -- xAI を使ってサンドボックス化されたリモート Python 分析を実行する
title: コード実行
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T05:24:43Z"
  model: gpt-5.4
  provider: openai
  source_hash: 332afbbef15eaa832d87f263eb095eff680e8f941b9e123add9b37f9b4fa5e00
  source_path: tools/code-execution.md
  workflow: 15
---

`code_execution` は xAI の Responses API 上で、サンドボックス化されたリモート Python 分析を実行します。
これはローカルの [`exec`](/ja-JP/tools/exec) とは異なります。

- `exec` はあなたのマシンまたは Node 上で shell command を実行します
- `code_execution` は xAI のリモート sandbox で Python を実行します

`code_execution` の用途:

- 計算
- 表の作成
- ちょっとした統計
- グラフ風の分析
- `x_search` または `web_search` が返したデータの分析

ローカルファイル、あなたの shell、あなたの repo、またはペアリング済み
デバイスが必要な場合には使わないでください。その場合は [`exec`](/ja-JP/tools/exec) を使ってください。

## セットアップ

xAI API key が必要です。次のどれでも使えます:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

例:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## 使い方

自然に依頼し、分析意図を明確にしてください:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

この tool は内部的には単一の `task` パラメータを受け取るため、agent は
完全な分析リクエストとインラインデータを 1 つの prompt で送る必要があります。

## 制限

- これはローカルプロセス実行ではなく、リモート xAI 実行です。
- これは永続的な notebook ではなく、一時的な分析として扱うべきです。
- ローカルファイルやあなたの workspace にアクセスできると想定しないでください。
- 新しい X データが必要な場合は、先に [`x_search`](/ja-JP/tools/web#x_search) を使ってください。

## 関連

- [Exec tool](/ja-JP/tools/exec)
- [Exec approvals](/ja-JP/tools/exec-approvals)
- [apply_patch tool](/ja-JP/tools/apply-patch)
- [Web tools](/ja-JP/tools/web)
- [xAI](/ja-JP/providers/xai)
