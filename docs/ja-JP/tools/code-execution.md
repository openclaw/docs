---
read_when:
    - code_execution を有効化または設定したい
    - ローカルシェルアクセスなしでリモート分析を行いたい
    - x_search または web_search をリモート Python 分析と組み合わせたい場合
summary: 'code_execution: サンドボックス化されたリモート Python 分析を xAI で実行'
title: コード実行
x-i18n:
    generated_at: "2026-07-05T11:52:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a35d585a6b1b53d3ea50085459e4f180da1e91b7c72ef51f98786e4e5226f8ad
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` は、xAI の Responses API
(`https://api.x.ai/v1/responses`、`x_search` が使うものと同じエンドポイント) で、サンドボックス化されたリモート Python 解析を実行します。これは
バンドル済みの `xai` plugin により、`tools` contract の下で登録されます。

| プロパティ       | 値                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| ツール名          | `code_execution`                                                                  |
| Provider plugin    | `xai` (バンドル済み、`enabledByDefault: true`)                                    |
| 認証               | xAI 認証プロファイル、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey` |
| デフォルトモデル  | `grok-4-1-fast`                                                                   |
| デフォルトタイムアウト | 30 秒                                                                        |
| デフォルト `maxTurns` | 未設定 (xAI が独自の内部制限を適用)                                        |

計算、表作成、簡単な統計、チャート形式の解析に使用します。これには
`x_search` や `web_search` から返されたデータも含まれます。ローカルファイル、シェル、リポジトリ、ペアリング済みデバイスには
アクセスできず、呼び出し間で状態を永続化しません。そのため、各呼び出しはノートブックセッションではなく、一時的な解析として扱います。新しい X データには、まず [`x_search`](/ja-JP/tools/web#x_search)
を実行し、その結果を渡してください。

ローカル実行には、代わりに [`exec`](/ja-JP/tools/exec) を使用します。

## セットアップ

<Steps>
  <Step title="xAI 認証情報を提供する">
    OAuth には対象となる SuperGrok または X Premium サブスクリプションが必要です
    (device-code 検証のため、localhost callback なしでリモートホストから動作します):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    新規インストール時には、オンボーディングでも同じ選択肢を利用できます:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    または API キー:

    ```bash
    openclaw models auth login --provider xai --method api-key
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

    これら 3 つはいずれも `x_search` と Grok `web_search` も動作させます。

  </Step>

  <Step title="code_execution を有効化して調整する">
    `code_execution` は、xAI 認証情報が解決できる場合に利用できます。無効化するには
    `plugins.entries.xai.config.codeExecution.enabled` を `false` に設定します。
    または同じブロックを使って、モデル、turn 上限、タイムアウトを上書きします:

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

  <Step title="Gateway を再起動する">
    ```bash
    openclaw gateway restart
    ```

    xAI plugin が `enabled: true` で再登録されると、`code_execution` が agent のツール一覧に表示されます。

  </Step>
</Steps>

## 使用方法

解析の意図を明示します。このツールは単一の `task` パラメータを取るため、
リクエスト全体とインラインデータを 1 つのプロンプトで送信します:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## エラー

認証がない場合、このツールは thrown exception ではなく構造化された JSON エラーを返すため、
agent は自己修正できます:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 関連

<CardGroup cols={2}>
  <Card title="Exec ツール" href="/ja-JP/tools/exec" icon="terminal">
    自分のマシンまたはペアリング済み node でのローカルシェル実行。
  </Card>
  <Card title="Exec 承認" href="/ja-JP/tools/exec-approvals" icon="shield">
    シェル実行の許可/拒否ポリシー。
  </Card>
  <Card title="Web ツール" href="/ja-JP/tools/web" icon="globe">
    `web_search`、`x_search`、`web_fetch`。
  </Card>
  <Card title="xAI provider" href="/ja-JP/providers/xai" icon="microchip">
    Grok モデル、web/x search、code execution config。
  </Card>
</CardGroup>
