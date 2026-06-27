---
read_when:
    - OpenClaw のモデルが選択されたときだけ、OpenClaw にローカルモデルサーバーを起動させたい場合
    - ds4、inferrs、vLLM、llama.cpp、MLX、または別の OpenAI互換ローカルサーバーを実行する
    - ローカルプロバイダーのコールドスタート、準備完了状態、アイドル時シャットダウンを制御する必要がある
summary: OpenClaw のモデルリクエストの前に、必要に応じてローカルモデルサーバーを起動する
title: ローカルモデルサービス
x-i18n:
    generated_at: "2026-06-27T11:30:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` により、OpenClaw はプロバイダー所有のローカルモデルサーバーを必要に応じて起動できます。これはプロバイダーレベルの設定です。選択されたモデルがそのプロバイダーに属している場合、OpenClaw はサービスをプローブし、エンドポイントが停止していればプロセスを起動し、準備完了を待ってからモデルリクエストを送信します。

一日中起動し続けるにはコストが高いローカルサーバーや、モデル選択だけでバックエンドを起動できるようにしたい手動セットアップに使用します。

## 仕組み

1. モデルリクエストが、設定済みプロバイダーに解決されます。
2. そのプロバイダーに `localService` がある場合、OpenClaw は `healthUrl` をプローブします。
3. プローブが成功した場合、OpenClaw は既存のサーバーを使用します。
4. プローブが失敗した場合、OpenClaw は `args` を付けて `command` を起動します。
5. OpenClaw は `readyTimeoutMs` が期限切れになるまで準備完了をポーリングします。
6. モデルリクエストは通常のプロバイダートランスポートを通じて送信されます。
7. OpenClaw がプロセスを起動し、`idleStopMs` が正の値の場合、最後の処理中リクエストがその時間だけアイドル状態になった後にプロセスを停止します。

OpenClaw はこのために launchd、systemd、Docker、またはデーモンをインストールしません。サーバーは、それを最初に必要とした OpenClaw プロセスの子プロセスです。

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

- `command`: 実行ファイルの絶対パス。シェルの検索は使用されません。
- `args`: プロセス引数。シェル展開、パイプ、グロブ、引用符の規則は適用されません。
- `cwd`: プロセス用の任意の作業ディレクトリ。
- `env`: OpenClaw プロセスの環境にマージされる任意の環境変数。
- `healthUrl`: 準備完了 URL。省略した場合、OpenClaw は `baseUrl` に `/models` を追加するため、`http://127.0.0.1:8000/v1` は `http://127.0.0.1:8000/v1/models` になります。
- `readyTimeoutMs`: 起動時の準備完了期限。デフォルト: `120000`。
- `idleStopMs`: OpenClaw が起動したプロセスのアイドル時シャットダウン遅延。`0` または省略した場合、OpenClaw が終了するまでプロセスを起動したままにします。

## Inferrs の例

Inferrs はカスタムの OpenAI 互換 `/v1` バックエンドであるため、同じローカルサービス API を `inferrs` プロバイダーエントリで使用できます。

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

OpenClaw を実行しているマシンで `which inferrs` を実行した結果に `command` を置き換えます。

## ds4 の例

完全なセットアップ、コンテキストサイズの指針、検証コマンドについては、[ds4](/ja-JP/providers/ds4) を参照してください。

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

## 運用上の注意

- 1 つの OpenClaw プロセスが、自身で起動した子プロセスを管理します。同じヘルス URL がすでに稼働していることを別の OpenClaw プロセスが確認した場合、それを引き継がずに再利用します。
- 起動はプロバイダーのコマンドと引数セットごとに直列化されるため、同時リクエストによって同じ設定の重複サーバーが生成されることはありません。
- アクティブなストリーミングレスポンスはリースを保持します。アイドル時シャットダウンは、レスポンスボディの処理が完了するまで待機します。
- 低速なローカルプロバイダーでは `timeoutSeconds` を使用し、コールドスタートや長い生成がデフォルトのモデルリクエストタイムアウトに達しないようにします。
- サーバーが `/v1/models` 以外の場所で準備完了を公開している場合は、明示的な `healthUrl` を使用します。

## 関連

<CardGroup cols={2}>
  <Card title="Local models" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルのセットアップ、プロバイダーの選択肢、安全性の指針。
  </Card>
  <Card title="Inferrs" href="/ja-JP/providers/inferrs" icon="cpu">
    inferrs の OpenAI 互換ローカルサーバーを通じて OpenClaw を実行します。
  </Card>
</CardGroup>
