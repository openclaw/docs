---
read_when:
    - code_execution を有効化または設定したい
    - ローカルシェルアクセスなしでリモート分析を行いたい場合
    - x_search または web_search をリモート Python 分析と組み合わせたい場合
summary: code_execution -- xAI でサンドボックス化されたリモート Python 解析を実行
title: コード実行
x-i18n:
    generated_at: "2026-04-30T05:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` は、xAI の Responses API でサンドボックス化されたリモート Python 分析を実行します。
これはローカルの [`exec`](/ja-JP/tools/exec) とは異なります。

- `exec` はあなたのマシンまたはノードでシェルコマンドを実行します
- `code_execution` は xAI のリモートサンドボックスで Python を実行します

`code_execution` は次の場合に使用します。

- 計算
- 表作成
- 簡単な統計
- グラフ形式の分析
- `x_search` または `web_search` が返したデータの分析

ローカルファイル、シェル、リポジトリ、またはペアリング済み
デバイスが必要な場合は使用**しないで**ください。その場合は [`exec`](/ja-JP/tools/exec) を使用します。

## セットアップ

xAI API キーが必要です。次のいずれでも使用できます。

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

自然に依頼し、分析の意図を明示します。

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

このツールは内部的に単一の `task` パラメータを取るため、エージェントは
完全な分析リクエストとインラインデータを 1 つのプロンプトで送信する必要があります。

## 制限

- これはリモートの xAI 実行であり、ローカルプロセスの実行ではありません。
- 永続的なノートブックではなく、一時的な分析として扱う必要があります。
- ローカルファイルやワークスペースへアクセスできると想定しないでください。
- 新しい X データには、先に [`x_search`](/ja-JP/tools/web#x_search) を使用します。

## 関連

- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)
- [apply_patch ツール](/ja-JP/tools/apply-patch)
- [Web ツール](/ja-JP/tools/web)
- [xAI](/ja-JP/providers/xai)
