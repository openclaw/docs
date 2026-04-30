---
read_when:
    - LM Studio 経由でオープンソースモデルを使って OpenClaw を実行したい
    - LM Studio をセットアップして構成したい
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T05:30:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio は、自分のハードウェアでオープンウェイトモデルを実行するための、親しみやすく強力なアプリです。llama.cpp（GGUF）または MLX モデル（Apple Silicon）を実行できます。GUI パッケージまたはヘッドレスデーモン（`llmster`）として提供されます。製品とセットアップのドキュメントについては、[lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

1. LM Studio（デスクトップ）または `llmster`（ヘッドレス）をインストールし、ローカルサーバーを起動します。

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. サーバーを起動します

デスクトップアプリを起動するか、次のコマンドでデーモンを実行していることを確認してください。

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

アプリを使用している場合は、スムーズな体験のために JIT が有効になっていることを確認してください。詳しくは [LM Studio JIT と TTL ガイド](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) を参照してください。

3. LM Studio 認証が有効な場合は、`LM_API_TOKEN` を設定します。

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio 認証が無効な場合は、対話型の OpenClaw セットアップ中に API キーを空のままにできます。

LM Studio 認証セットアップの詳細については、[LM Studio 認証](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。

4. オンボーディングを実行し、`LM Studio` を選択します。

```bash
openclaw onboard
```

5. オンボーディングで、`Default model` プロンプトを使用して LM Studio モデルを選択します。

後で設定または変更することもできます。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式に従います（例: `qwen/qwen3.5-9b`）。OpenClaw
のモデル参照ではプロバイダー名が前に付きます: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーは、
`curl http://localhost:1234/api/v1/models` を実行し、`key` フィールドを確認することで取得できます。

## 非対話型オンボーディング

セットアップをスクリプト化したい場合（CI、プロビジョニング、リモートブートストラップ）は、非対話型オンボーディングを使用します。

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

または、ベース URL、モデル、任意の API キーを指定します。

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` は、`lmstudio/` プロバイダープレフィックスなしで、LM Studio から返されるモデルキー（例: `qwen/qwen3.5-9b`）を受け取ります。

認証済みの LM Studio サーバーでは、`--lmstudio-api-key` を渡すか、`LM_API_TOKEN` を設定します。
未認証の LM Studio サーバーではキーを省略します。OpenClaw はローカルの非シークレットマーカーを保存します。

`--custom-api-key` は互換性のため引き続きサポートされますが、LM Studio では `--lmstudio-api-key` が推奨されます。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトモデルが
`lmstudio/<custom-model-id>` に設定されます。API キーを指定した場合、セットアップは
`lmstudio:default` 認証プロファイルも書き込みます。

対話型セットアップでは、任意の優先ロードコンテキスト長を入力するよう促され、それを設定に保存される検出済みの LM Studio モデル全体に適用します。
LM Studio Plugin 設定は、モデルリクエストについて、loopback、LAN、tailnet ホストを含む設定済みの LM Studio エンドポイントを信頼します。`models.providers.lmstudio.request.allowPrivateNetwork: false` を設定することでオプトアウトできます。

## 設定

### ストリーミング使用量の互換性

LM Studio はストリーミング使用量に対応しています。OpenAI 形式の
`usage` オブジェクトを送信しない場合、OpenClaw は代わりに llama.cpp 形式の
`timings.prompt_n` / `timings.predicted_n` メタデータからトークン数を復元します。

同じストリーミング使用量の動作は、次の OpenAI 互換ローカルバックエンドにも適用されます。

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### thinking の互換性

LM Studio の `/api/v1/models` 検出がモデル固有の reasoning
オプションを報告する場合、OpenClaw はそれらのネイティブ値をモデル互換メタデータに保持します。
`allowed_options: ["off", "on"]` を公開するバイナリ thinking モデルについては、
OpenClaw は無効な thinking を `off` に、有効な `/think` レベルを `on` にマッピングします。
`low` や `medium` のような OpenAI 専用値は送信しません。

### 明示的な設定

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## トラブルシューティング

### LM Studio が検出されない

LM Studio が実行中であることを確認してください。認証が有効な場合は、`LM_API_TOKEN` も設定します。

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API にアクセスできることを確認します。

```bash
curl http://localhost:1234/api/v1/models
```

### 認証エラー（HTTP 401）

セットアップで HTTP 401 が報告される場合は、API キーを確認してください。

- `LM_API_TOKEN` が LM Studio で設定されたキーと一致することを確認します。
- LM Studio 認証セットアップの詳細については、[LM Studio 認証](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。
- サーバーが認証を必要としない場合は、セットアップ中にキーを空のままにします。

### Just-in-time モデル読み込み

LM Studio は just-in-time（JIT）モデル読み込みをサポートしています。これは、モデルが最初のリクエスト時に読み込まれる仕組みです。「Model not loaded」エラーを避けるため、これが有効になっていることを確認してください。

### LAN または tailnet 上の LM Studio ホスト

LM Studio ホストの到達可能なアドレスを使用し、`/v1` を維持し、そのマシン上で LM Studio が loopback を超えてバインドされていることを確認してください。

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

一般的な OpenAI 互換プロバイダーとは異なり、`lmstudio` は保護されたモデルリクエストについて、設定済みのローカルまたはプライベートエンドポイントを自動的に信頼します。`localhost` や `127.0.0.1` などのカスタム loopback プロバイダー ID も自動的に信頼されます。LAN、tailnet、またはプライベート DNS のカスタムプロバイダー ID については、`models.providers.<id>.request.allowPrivateNetwork: true` を明示的に設定してください。

## 関連

- [モデル選択](/ja-JP/concepts/model-providers)
- [Ollama](/ja-JP/providers/ollama)
- [ローカルモデル](/ja-JP/gateway/local-models)
