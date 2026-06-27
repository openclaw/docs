---
read_when:
    - code_executionを有効化または設定する
    - ローカルシェルアクセスなしでリモート分析を行いたい
    - x_search または web_search をリモート Python 解析と組み合わせたい場合
summary: 'code_execution: xAI でサンドボックス化されたリモート Python 分析を実行'
title: コード実行
x-i18n:
    generated_at: "2026-06-27T17:10:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` は、xAI の Responses API でサンドボックス化されたリモート Python 分析を実行します。これはバンドル済みの `xai` plugin（`tools` contract 配下）によって登録され、`x_search` と同じ `https://api.x.ai/v1/responses` endpoint にディスパッチされます。

| プロパティ       | 値                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| ツール名          | `code_execution`                                                                  |
| Provider plugin    | `xai`（バンドル済み、`enabledByDefault: true`）                                      |
| 認証               | xAI 認証 profile、`XAI_API_KEY`、または `plugins.entries.xai.config.webSearch.apiKey` |
| デフォルト model   | `grok-4-1-fast`                                                                   |
| デフォルト timeout | 30 秒                                                                             |
| デフォルト `maxTurns` | 未設定（xAI が独自の内部制限を適用）                                               |

これはローカルの [`exec`](/ja-JP/tools/exec) とは異なります。

- `exec` は、あなたのマシンまたはペアリング済み node で shell コマンドを実行します。
- `code_execution` は、xAI のリモートサンドボックスで Python を実行します。

`code_execution` は次の場合に使用します。

- 計算。
- 表作成。
- 簡単な統計。
- グラフ形式の分析。
- `x_search` または `web_search` から返されたデータの分析。

ローカルファイル、shell、repo、またはペアリング済みデバイスが必要な場合は使用**しないでください**。その場合は [`exec`](/ja-JP/tools/exec) を使用してください。

## セットアップ

<Steps>
  <Step title="xAI 認証情報を提供する">
    対象の SuperGrok または X Premium サブスクリプションを使って Grok OAuth でサインインするか、
    API key を保存します。xAI OAuth は device-code verification を使用するため、localhost callback がない
    リモート host からでも動作します。OAuth は `code_execution` と `x_search` で動作します。
    `XAI_API_KEY` または plugin web-search config でも Grok `web_search` を動かせます。

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    新規インストール時は、オンボーディング内でも同じ認証の選択肢を利用できます。

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    または API key を使用します。

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    または config 経由で設定します。

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
    xAI 認証情報が利用可能な場合、`code_execution` を使用できます。無効化するには
    `plugins.entries.xai.config.codeExecution.enabled` を `false` に設定します。
    また、同じ block を使って model と timeout を調整できます。

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

この tool は内部的に単一の `task` parameter を取るため、agent は完全な分析リクエストと任意の inline data を 1 つの prompt で送る必要があります。

## エラー

tool が認証なしで実行されると、auth-profile、env var、config options を示す構造化された `missing_xai_api_key` エラーを返します。このエラーは JSON であり、throw された例外ではないため、agent は自己修正できます。

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 制限

- これはローカル process 実行ではなく、リモート xAI 実行です。
- 結果は永続的な notebook session ではなく、一時的な分析として扱ってください。
- ローカルファイルや workspace へのアクセスを想定しないでください。
- 新しい X データについては、まず [`x_search`](/ja-JP/tools/web#x_search) を使用し、その結果を `code_execution` に渡してください。

## 関連

<CardGroup cols={2}>
  <Card title="Exec tool" href="/ja-JP/tools/exec" icon="terminal">
    あなたのマシンまたはペアリング済み node でのローカル shell 実行。
  </Card>
  <Card title="Exec approvals" href="/ja-JP/tools/exec-approvals" icon="shield">
    shell 実行の許可/拒否 policy。
  </Card>
  <Card title="Web tools" href="/ja-JP/tools/web" icon="globe">
    `web_search`、`x_search`、および `web_fetch`。
  </Card>
  <Card title="xAI provider" href="/ja-JP/providers/xai" icon="microchip">
    Grok models、web/x search、および code execution config。
  </Card>
</CardGroup>
