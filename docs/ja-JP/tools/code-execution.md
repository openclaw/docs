---
read_when:
    - code_execution を有効化または設定したい場合
    - ローカルシェルアクセスなしでリモート分析を行いたい
    - x_search または web_search とリモート Python 分析を組み合わせたい場合
summary: 'code_execution: xAI でサンドボックス化されたリモート Python 解析を実行する'
title: コード実行
x-i18n:
    generated_at: "2026-05-10T19:54:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` は、xAI の Responses API でサンドボックス化されたリモート Python 解析を実行します。同梱の `xai` Plugin（`tools` コントラクト配下）によって登録され、`x_search` が使用するものと同じ `https://api.x.ai/v1/responses` エンドポイントにディスパッチします。

| プロパティ       | 値                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| ツール名          | `code_execution`                                                                  |
| プロバイダーPlugin | `xai`（同梱、`enabledByDefault: true`）                                           |
| 認証               | xAI 認証プロファイル、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey` |
| 既定のモデル      | `grok-4-1-fast`                                                                   |
| 既定のタイムアウト | 30 秒                                                                             |
| 既定の `maxTurns` | 未設定（xAI が独自の内部制限を適用）                                              |

これはローカルの [`exec`](/ja-JP/tools/exec) とは異なります。

- `exec` は、自分のマシンまたはペアリングされたノードでシェルコマンドを実行します。
- `code_execution` は、xAI のリモートサンドボックスで Python を実行します。

`code_execution` は次の用途に使います。

- 計算。
- 表形式化。
- 簡単な統計。
- グラフ形式の解析。
- `x_search` または `web_search` から返されたデータの解析。

ローカルファイル、シェル、リポジトリ、またはペアリングされたデバイスが必要な場合は使用**しないでください**。その場合は [`exec`](/ja-JP/tools/exec) を使います。

## セットアップ

<Steps>
  <Step title="xAI API キーを指定する">
    `code_execution` と `x_search` 用に `openclaw onboard --auth-choice xai-api-key` を実行するか、
    Grok Web 検索でも同じ認証情報を使いたい場合は `XAI_API_KEY` を設定するか、
    xAI Plugin 配下でキーを構成します。

    ```bash
    export XAI_API_KEY=xai-...
    ```

    または設定経由:

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
    このツールは `plugins.entries.xai.config.codeExecution.enabled` で制御されます。既定ではオフです。

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // 既定の xAI コード実行モデルを上書き
                maxTurns: 2,            // 内部ツールターンの任意の上限
                timeoutSeconds: 30,     // リクエストタイムアウト（既定: 30）
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

## 使い方

自然に依頼し、解析の意図を明確にします。

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

このツールは内部的に単一の `task` パラメーターを受け取るため、エージェントは完全な解析リクエストとインラインデータを 1 つのプロンプトで送る必要があります。

## エラー

ツールが認証なしで実行されると、認証プロファイル、環境変数、設定オプションを指す構造化された `missing_xai_api_key` エラーを返します。このエラーは JSON であり、スローされた例外ではないため、エージェントは自己修正できます。

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 制限

- これはリモートの xAI 実行であり、ローカルプロセス実行ではありません。
- 結果は永続的なノートブックセッションではなく、一時的な解析として扱ってください。
- ローカルファイルやワークスペースへのアクセスを前提にしないでください。
- 新しい X データについては、まず [`x_search`](/ja-JP/tools/web#x_search) を使い、その結果を `code_execution` に渡してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    自分のマシンまたはペアリングされたノードでのローカルシェル実行。
  </Card>
  <Card title="Exec 承認" href="/ja-JP/tools/exec-approvals" icon="shield">
    シェル実行の許可/拒否ポリシー。
  </Card>
  <Card title="Web ツール" href="/ja-JP/tools/web" icon="globe">
    `web_search`、`x_search`、`web_fetch`。
  </Card>
  <Card title="xAI プロバイダー" href="/ja-JP/providers/xai" icon="microchip">
    Grok モデル、Web/X 検索、コード実行設定。
  </Card>
</CardGroup>
