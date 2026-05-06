---
read_when:
    - code_execution を有効化または設定したい
    - ローカルのシェルアクセスなしでリモート分析を行いたい
    - x_search または web_search をリモート Python 分析と組み合わせたい場合
summary: 'code_execution: xAI でサンドボックス化されたリモート Python 分析を実行'
title: コード実行
x-i18n:
    generated_at: "2026-05-06T05:20:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` は、xAI の Responses API 上でサンドボックス化されたリモート Python 分析を実行します。これはバンドルされた `xai` Plugin（`tools` contract の下）によって登録され、`x_search` が使用するものと同じ `https://api.x.ai/v1/responses` endpoint にディスパッチされます。

| プロパティ       | 値                                                             |
| ---------------- | -------------------------------------------------------------- |
| ツール名         | `code_execution`                                               |
| プロバイダー Plugin | `xai`（バンドル済み、`enabledByDefault: true`）                |
| 認証             | `XAI_API_KEY` または `plugins.entries.xai.config.webSearch.apiKey` |
| デフォルトモデル | `grok-4-1-fast`                                                |
| デフォルトタイムアウト | 30 秒                                                         |
| デフォルト `maxTurns` | 未設定（xAI が独自の内部制限を適用）                         |

これはローカルの [`exec`](/ja-JP/tools/exec) とは異なります。

- `exec` は、あなたのマシンまたはペアリングされたノードで shell commands を実行します。
- `code_execution` は、xAI のリモートサンドボックス内で Python を実行します。

`code_execution` は次の用途に使用します。

- 計算。
- 表作成。
- 簡単な統計。
- チャート形式の分析。
- `x_search` または `web_search` から返されたデータの分析。

ローカルファイル、shell、repo、またはペアリングされたデバイスが必要な場合は使用**しないでください**。その場合は [`exec`](/ja-JP/tools/exec) を使用します。

## セットアップ

<Steps>
  <Step title="xAI API キーを提供する">
    Gateway 環境に `XAI_API_KEY` を設定するか、xAI Plugin 配下でキーを設定して、同じ認証情報で `code_execution`、`x_search`、web search、およびその他の xAI ツールをカバーできるようにします。

    ```bash
    export XAI_API_KEY=xai-...
    ```

    または config 経由:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="code_execution を有効化して調整する">
    このツールは `plugins.entries.xai.config.codeExecution.enabled` でゲートされています。デフォルトはオフです。

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // デフォルトの xAI code-execution モデルを上書き
                maxTurns: 2,            // 内部ツールターンの任意の上限
                timeoutSeconds: 30,     // リクエストタイムアウト（デフォルト: 30）
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin が `enabled: true` で再登録されると、`code_execution` がエージェントのツール一覧に表示されます。

  </Step>
</Steps>

## 使用方法

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

このツールは内部的に単一の `task` パラメーターを受け取るため、エージェントは完全な分析リクエストと任意のインラインデータを 1 つのプロンプトで送信する必要があります。

## エラー

このツールが認証なしで実行されると、env var と config path を指す構造化された `missing_xai_api_key` エラーを返します。このエラーは JSON であり、throw された例外ではないため、エージェントは自己修正できます。

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 制限

- これはリモート xAI 実行であり、ローカルプロセス実行ではありません。
- 結果は永続的なノートブックセッションではなく、一時的な分析として扱います。
- ローカルファイルや workspace へのアクセスを前提にしないでください。
- 新しい X データには、まず [`x_search`](/ja-JP/tools/web#x_search) を使用し、その結果を `code_execution` に渡します。

## 関連

<CardGroup cols={2}>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    あなたのマシンまたはペアリングされたノードでのローカル shell execution。
  </Card>
  <Card title="Exec 承認" href="/ja-JP/tools/exec-approvals" icon="shield">
    shell execution の許可/拒否ポリシー。
  </Card>
  <Card title="Web ツール" href="/ja-JP/tools/web" icon="globe">
    `web_search`、`x_search`、および `web_fetch`。
  </Card>
  <Card title="xAI プロバイダー" href="/ja-JP/providers/xai" icon="microchip">
    Grok モデル、web/x search、および code execution config。
  </Card>
</CardGroup>
