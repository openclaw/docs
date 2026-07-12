---
read_when:
    - OpenClaw のモデルまたは埋め込みプロバイダーが選択されている場合にのみ、ローカルモデルサーバーを起動するようにしたい場合
    - ds4、inferrs、vLLM、llama.cpp、MLX、またはその他のOpenAI互換ローカルサーバーを実行している場合
    - ローカルプロバイダーのコールドスタート、準備完了、アイドルシャットダウンを制御する必要があります
summary: OpenClaw のモデルおよび埋め込みリクエストの前に、必要に応じてローカルモデルサーバーを起動する
title: ローカルモデルサービス
x-i18n:
    generated_at: "2026-07-11T22:14:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` は、プロバイダーが所有するローカルモデルサーバーを必要に応じて起動します。モデルまたは埋め込みリクエストでそのプロバイダーが選択されると、OpenClaw はヘルスエンドポイントを確認し、停止していればプロセスを起動して、準備完了を待ってからリクエストを送信します。高コストなローカルサーバーを一日中稼働させ続けることを避けるために使用します。

## 動作の仕組み

1. モデルまたは埋め込みリクエストが、設定済みのプロバイダーに解決されます。
2. そのプロバイダーに `localService` がある場合、OpenClaw は `healthUrl` を確認します。
3. 確認に成功すると、OpenClaw はすでに稼働中のサーバーを使用します。
4. 確認に失敗すると、OpenClaw は `args` を指定して `command` を起動します。
5. OpenClaw は `readyTimeoutMs` が経過するまでヘルスエンドポイントをポーリングします。
6. リクエストは通常のモデルまたは埋め込みトランスポートを経由します。
7. OpenClaw がプロセスを起動し、`idleStopMs` が設定されている場合、最後の処理中リクエストがその時間だけアイドル状態になった後でプロセスを停止します。

OpenClaw はこのために launchd、systemd、Docker、その他のデーモンをインストールしません。サーバーは、最初にそれを必要とした OpenClaw プロセスの通常の子プロセスです。

起動処理は、設定済みのプロバイダーとコマンド、引数、環境変数の組み合わせごとに直列化されるため、同じサービスに対するチャットと埋め込みのリクエストが同時に発生しても、重複するサーバーは起動されません。各リクエストは応答処理が完了するまで個別のリースを保持するため、アイドル時の停止は、処理中のすべてのモデルおよび埋め込みリクエストが完了するまで待機します。設定済みのプロバイダーエイリアスは別々に扱われます。2 つのエイリアスで異なる GPU ホストを指定しても、同じ Ollama、LM Studio、または OpenAI 互換アダプター ID に統合されることはありません。

別の OpenClaw プロセスが同じ `healthUrl` ですでに正常なサーバーを稼働させている場合、このプロセスはそのサーバーを管理対象に取り込まずに再利用します（各プロセスが管理するのは、自身で起動した子プロセスだけです）。起動ログと終了ログには、長さを制限して機密情報を除去した子プロセス出力の末尾部分に加え、所要時間と終了の詳細が含まれます。設定された環境変数の値が出力されることはありません。

## 設定形式

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

低速なコールドスタートや長時間の生成が、モデルリクエストのデフォルトタイムアウトに達しないように、`timeoutSeconds` は（`localService` ではなく）プロバイダーのエントリに設定します。サーバーがベース URL の `/models` 以外の場所で準備状態を公開する場合は、必ず明示的な `healthUrl` を設定してください。

## フィールド

| フィールド         | 必須     | 説明                                                                                                                                 |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | はい     | 実行可能ファイルの絶対パス。シェルの PATH 検索は行いません。                                                                         |
| `args`           | いいえ   | プロセスの引数。シェル展開、パイプ、グロブ、引用符の処理は行いません。                                                               |
| `cwd`            | いいえ   | プロセスの作業ディレクトリ。                                                                                                         |
| `env`            | いいえ   | OpenClaw プロセスの環境に上書きマージされる環境変数。                                                                                |
| `healthUrl`      | いいえ   | 準備状態を確認する URL。デフォルトでは `baseUrl` に `/models` が追加されます（`http://127.0.0.1:8000/v1` は `http://127.0.0.1:8000/v1/models` になります）。 |
| `readyTimeoutMs` | いいえ   | 起動時の準備完了期限。デフォルト: `120000`。                                                                                          |
| `idleStopMs`     | いいえ   | OpenClaw が起動したプロセスをアイドル時に停止するまでの待機時間。`0` または省略した場合、OpenClaw が終了するまで稼働し続けます。       |

## Inferrs の例

Inferrs はカスタムの OpenAI 互換 `/v1` バックエンドであるため、同じ `localService` API を `inferrs` プロバイダーエントリで使用できます。

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

`command` を、OpenClaw を実行しているマシンでの `which inferrs` の結果に置き換えてください。Inferrs の完全なセットアップについては、[Inferrs](/ja-JP/providers/inferrs)を参照してください。

## ds4 の例

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

完全なセットアップ、コンテキストサイズの設定、検証コマンドについては、[ds4](/ja-JP/providers/ds4)を参照してください。

## 関連項目

<CardGroup cols={2}>
  <Card title="ローカルモデル" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルのセットアップ、プロバイダーの選択肢、安全性に関するガイダンス。
  </Card>
  <Card title="Inferrs" href="/ja-JP/providers/inferrs" icon="cpu">
    Inferrs の OpenAI 互換ローカルサーバーを介して OpenClaw を実行します。
  </Card>
</CardGroup>
