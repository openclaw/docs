---
read_when:
    - code_execution を有効化または設定したい
    - ローカルシェルアクセスなしでリモート分析を行いたい
    - x_search または web_search とリモートの Python 分析を組み合わせたい場合
summary: 'code_execution: xAI でサンドボックス化されたリモート Python 分析を実行'
title: コード実行
x-i18n:
    generated_at: "2026-06-27T13:10:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fe174e2c2ae9989ae651e0694c12158ba460f0f1a35786d0ac628e0ff8f741
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` は、xAI の Responses API 上でサンドボックス化されたリモート Python 分析を実行します。これはバンドルされた `xai` Plugin（`tools` コントラクト配下）によって登録され、`x_search` と同じ `https://api.x.ai/v1/responses` エンドポイントへディスパッチします。

| プロパティ       | 値                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| ツール名          | `code_execution`                                                                  |
| プロバイダー Plugin | `xai`（バンドル、`enabledByDefault: true`）                                       |
| 認証               | xAI 認証プロファイル、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey` |
| 既定のモデル      | `grok-4-1-fast`                                                                   |
| 既定のタイムアウト | 30 秒                                                                             |
| 既定の `maxTurns` | 未設定（xAI が独自の内部制限を適用）                                              |

これはローカルの [`exec`](/ja-JP/tools/exec) とは異なります。

- `exec` は、自分のマシンまたはペアリング済みノードでシェルコマンドを実行します。
- `code_execution` は、xAI のリモートサンドボックスで Python を実行します。

`code_execution` は次の用途に使用します。

- 計算。
- 表の作成。
- 簡単な統計。
- グラフ形式の分析。
- `x_search` または `web_search` から返されたデータの分析。

ローカルファイル、シェル、リポジトリ、またはペアリング済みデバイスが必要な場合は使用**しないでください**。その場合は [`exec`](/ja-JP/tools/exec) を使用してください。

## セットアップ

<Steps>
  <Step title="Provide xAI credentials">
    対象の SuperGrok または X Premium サブスクリプションを使用して Grok OAuth でサインインするか、
    リモート向きのデバイスコードフローを使用するか、API キーを保存します。OAuth は
    `code_execution` と `x_search` で機能します。`XAI_API_KEY` または Plugin の web-search
    設定でも Grok `web_search` を利用できます。

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw models auth login --provider xai --device-code
    ```

    新規インストール時には、同じ認証の選択肢をオンボーディング内でも利用できます。

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-device-code
    ```

    または API キーを使用します。

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    または設定経由で指定します。

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

  <Step title="Enable and tune code_execution">
    `code_execution` は xAI 認証情報が利用可能な場合に使用できます。無効化するには
    `plugins.entries.xai.config.codeExecution.enabled` を `false` に設定し、
    同じブロックでモデルとタイムアウトを調整できます。

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin が `enabled: true` で再登録されると、`code_execution` がエージェントのツール一覧に表示されます。

  </Step>
</Steps>

## 使い方

自然な表現で依頼し、分析の意図を明示します。

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

このツールは内部的に単一の `task` パラメーターを受け取るため、エージェントは完全な分析リクエストとインラインデータを 1 つのプロンプトで送信する必要があります。

## エラー

認証なしでツールを実行すると、認証プロファイル、環境変数、設定オプションを示す構造化された `missing_xai_api_key` エラーが返されます。このエラーはスローされる例外ではなく JSON なので、エージェントは自己修正できます。

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 制限

- これはリモート xAI 実行であり、ローカルプロセス実行ではありません。
- 結果は永続的なノートブックセッションではなく、一時的な分析として扱ってください。
- ローカルファイルやワークスペースへのアクセスを前提にしないでください。
- 新しい X データについては、まず [`x_search`](/ja-JP/tools/web#x_search) を使用し、その結果を `code_execution` に渡してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec tool" href="/ja-JP/tools/exec" icon="terminal">
    自分のマシンまたはペアリング済みノードでのローカルシェル実行。
  </Card>
  <Card title="Exec approvals" href="/ja-JP/tools/exec-approvals" icon="shield">
    シェル実行の許可/拒否ポリシー。
  </Card>
  <Card title="Web tools" href="/ja-JP/tools/web" icon="globe">
    `web_search`、`x_search`、`web_fetch`。
  </Card>
  <Card title="xAI provider" href="/ja-JP/providers/xai" icon="microchip">
    Grok モデル、web/x 検索、コード実行設定。
  </Card>
</CardGroup>
