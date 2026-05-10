---
read_when:
    - OpenClaw に、そのモデルが選択されたときだけローカルモデルサーバーを起動させたい場合
    - ds4、inferrs、vLLM、llama.cpp、MLX、またはその他の OpenAI 互換ローカルサーバーを実行している
    - ローカルプロバイダーのコールドスタート、準備完了状態、アイドル時のシャットダウンを制御する必要があります。
summary: OpenClaw のモデルリクエストの前に、必要に応じてローカルモデルサーバーを起動する
title: ローカルモデルサービス
x-i18n:
    generated_at: "2026-05-10T19:35:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` により、OpenClaw は必要に応じてプロバイダー所有のローカル
モデルサーバーを起動できます。これはプロバイダーレベルの設定です。選択されたモデルが
そのプロバイダーに属している場合、OpenClaw はサービスをプローブし、エンドポイントが
停止していればプロセスを起動し、準備完了を待ってからモデルリクエストを送信します。

一日中稼働させておくにはコストが高いローカルサーバーや、モデル選択だけでバックエンドを
起動できるようにしたい手動セットアップに使用します。

## 仕組み

1. モデルリクエストは設定済みのプロバイダーに解決されます。
2. そのプロバイダーに `localService` がある場合、OpenClaw は `healthUrl` をプローブします。
3. プローブが成功すると、OpenClaw は既存のサーバーを使用します。
4. プローブが失敗すると、OpenClaw は `command` を `args` とともに起動します。
5. OpenClaw は `readyTimeoutMs` が期限切れになるまで準備完了をポーリングします。
6. モデルリクエストは通常のプロバイダートランスポート経由で送信されます。
7. OpenClaw がプロセスを起動していて、`idleStopMs` が正の値の場合、最後の実行中リクエストが
   その時間だけアイドル状態になった後にプロセスを停止します。

OpenClaw は、このために launchd、systemd、Docker、またはデーモンをインストールしません。
サーバーは、それを最初に必要とした OpenClaw プロセスの子プロセスです。

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

## フィールド

- `command`: 絶対実行可能パス。シェル検索は使用されません。
- `args`: プロセス引数。シェル展開、パイプ、グロブ、引用符の
  ルールは適用されません。
- `cwd`: プロセスの任意の作業ディレクトリ。
- `env`: OpenClaw プロセス環境の上にマージされる任意の環境変数。
- `healthUrl`: 準備完了 URL。省略した場合、OpenClaw は `baseUrl` に `/models` を追加するため、
  `http://127.0.0.1:8000/v1` は
  `http://127.0.0.1:8000/v1/models` になります。
- `readyTimeoutMs`: 起動時の準備完了期限。デフォルト: `120000`。
- `idleStopMs`: OpenClaw が起動したプロセスのアイドルシャットダウン遅延。`0` または
  省略時は、OpenClaw が終了するまでプロセスを実行したままにします。

## Inferrs の例

Inferrs はカスタムの OpenAI 互換 `/v1` バックエンドであるため、同じローカルサービス
API を `inferrs` プロバイダーエントリで使用できます。

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

OpenClaw を実行しているマシンでの `which inferrs` の結果に `command` を置き換えます。

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

## 運用上の注意

- 1つの OpenClaw プロセスが、自身の起動した子プロセスを管理します。同じヘルス URL が
  すでに稼働中であることを確認した別の OpenClaw プロセスは、それを引き継がずに再利用します。
- 起動はプロバイダーのコマンドと引数の組み合わせごとに直列化されるため、同時リクエストで
  同じ設定の重複サーバーは生成されません。
- アクティブなストリーミングレスポンスはリースを保持します。アイドルシャットダウンはレスポンス
  本文の処理が完了するまで待機します。
- 低速なローカルプロバイダーでは `timeoutSeconds` を使用し、コールドスタートや長い生成が
  デフォルトのモデルリクエストタイムアウトに達しないようにします。
- サーバーが `/v1/models` 以外の場所で準備完了を公開している場合は、明示的な `healthUrl` を使用します。

## 関連

<CardGroup cols={2}>
  <Card title="Local models" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルのセットアップ、プロバイダーの選択肢、安全性のガイダンス。
  </Card>
  <Card title="Inferrs" href="/ja-JP/providers/inferrs" icon="cpu">
    inferrs の OpenAI 互換ローカルサーバー経由で OpenClaw を実行します。
  </Card>
</CardGroup>
