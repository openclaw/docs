---
read_when:
    - OpenClaw に、そのモデルが選択された場合にのみローカルモデルサーバーを起動させたい場合
    - ds4、inferrs、vLLM、llama.cpp、MLX、またはその他の OpenAI 互換ローカルサーバーを実行する
    - ローカルプロバイダーのコールドスタート、準備状態、アイドルシャットダウンを制御する必要があります
summary: OpenClaw のモデルリクエスト前に、必要に応じてローカルモデルサーバーを起動する
title: ローカルモデルサービス
x-i18n:
    generated_at: "2026-07-05T11:22:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9098fe9245a98987e7c58edb8395ae67e7d2ee5ec2215cc7d3ae880a62073372
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` は、プロバイダー所有のローカルモデルサーバーをオンデマンドで起動します。リクエストがそのプロバイダーのモデルを選択すると、OpenClaw はヘルスエンドポイントをプローブし、プロセスが停止していれば起動し、準備完了を待ってからリクエストを送信します。高コストなローカルサーバーを一日中起動したままにしないために使用します。

## 仕組み

1. モデルリクエストは設定済みプロバイダーに解決されます。
2. そのプロバイダーに `localService` がある場合、OpenClaw は `healthUrl` をプローブします。
3. プローブが成功すると、OpenClaw はすでに実行中のサーバーを使用します。
4. プローブが失敗すると、OpenClaw は `command` を `args` 付きで起動します。
5. OpenClaw は `readyTimeoutMs` が期限切れになるまでヘルスエンドポイントをポーリングします。
6. モデルリクエストは通常のプロバイダートランスポートを通ります。
7. OpenClaw がプロセスを起動し、`idleStopMs` が設定されている場合、最後の処理中リクエストがその時間だけアイドルになった後にプロセスを停止します。

OpenClaw は、このために launchd、systemd、Docker、またはデーモンをインストールしません。サーバーは、それを最初に必要とした OpenClaw プロセスの通常の子プロセスです。

起動はプロバイダーのコマンド/引数/env セットごとに直列化されるため、同じサービスへの同時リクエストで重複したサーバーが起動されることはありません。別の OpenClaw プロセスが同じ `healthUrl` にすでに正常なサーバーを持っている場合、このプロセスはそれを採用せずに再利用します（各プロセスは自分が開始した子プロセスだけを管理します）。アクティブなストリーミングレスポンスはリースを保持するため、アイドル時のシャットダウンはレスポンス処理が完了するまで待機します。

## 設定の形

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

低速なコールドスタートや長い生成がデフォルトのモデルリクエストタイムアウトに達しないように、`timeoutSeconds` は（`localService` ではなく）プロバイダーエントリに設定します。サーバーがベース URL の `/models` 以外の場所で準備状態を公開する場合は、明示的な `healthUrl` を設定してください。

## フィールド

| フィールド       | 必須 | 説明                                                                                                                               |
| ---------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | はい | 実行可能ファイルの絶対パス。シェルの PATH 検索はありません。                                                                       |
| `args`           | いいえ | プロセス引数。シェル展開、パイプ、グロブ、引用符処理はありません。                                                              |
| `cwd`            | いいえ | プロセスの作業ディレクトリ。                                                                                                      |
| `env`            | いいえ | OpenClaw プロセス環境に上書きマージされる環境変数。                                                                               |
| `healthUrl`      | いいえ | 準備状態 URL。デフォルトでは `baseUrl` に `/models` を追加します（`http://127.0.0.1:8000/v1` は `http://127.0.0.1:8000/v1/models` になります）。 |
| `readyTimeoutMs` | いいえ | 起動時の準備完了期限。デフォルト: `120000`。                                                                                      |
| `idleStopMs`     | いいえ | OpenClaw が起動したプロセスのアイドルシャットダウン遅延。`0` または省略時は OpenClaw が終了するまで起動したままにします。        |

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

OpenClaw を実行しているマシンでの `which inferrs` の結果に `command` を置き換えてください。inferrs の完全なセットアップ: [Inferrs](/ja-JP/providers/inferrs)。

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

完全なセットアップ、コンテキストサイズ設定、検証コマンド: [ds4](/ja-JP/providers/ds4)。

## 関連

<CardGroup cols={2}>
  <Card title="ローカルモデル" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルのセットアップ、プロバイダーの選択肢、安全性ガイダンス。
  </Card>
  <Card title="Inferrs" href="/ja-JP/providers/inferrs" icon="cpu">
    inferrs の OpenAI 互換ローカルサーバー経由で OpenClaw を実行します。
  </Card>
</CardGroup>
