---
read_when:
    - LM Studio 経由でオープンソースモデルを使って OpenClaw を実行したい場合
    - LM Studio をセットアップして構成したい
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T21:04:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio は、自分のハードウェア上でオープンウェイトモデルを実行するための、親しみやすく強力なアプリです。llama.cpp (GGUF) または MLX モデル (Apple Silicon) を実行できます。GUI パッケージまたはヘッドレスデーモン (`llmster`) として提供されます。製品とセットアップのドキュメントについては、[lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

1. LM Studio (デスクトップ) または `llmster` (ヘッドレス) をインストールし、ローカルサーバーを起動します。

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. サーバーを起動する

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

LM Studio 認証が無効な場合、対話型の OpenClaw セットアップ中に API キーを空のままにできます。

LM Studio の認証セットアップの詳細については、[LM Studio 認証](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。

4. オンボーディングを実行し、`LM Studio` を選択します。

```bash
openclaw onboard
```

5. オンボーディングで、`Default model` プロンプトを使用して LM Studio モデルを選択します。

後で設定または変更することもできます。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式に従います (例: `qwen/qwen3.5-9b`)。OpenClaw
のモデル参照ではプロバイダー名を前置します: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーは、`curl http://localhost:1234/api/v1/models` を実行して `key` フィールドを確認すると見つけられます。

## 非対話型オンボーディング

セットアップをスクリプト化したい場合 (CI、プロビジョニング、リモートブートストラップ) は、非対話型オンボーディングを使用します。

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

`--custom-model-id` は、`lmstudio/` プロバイダープレフィックスを付けずに、LM Studio が返すモデルキー (例: `qwen/qwen3.5-9b`) を受け取ります。

認証付きの LM Studio サーバーでは、`--lmstudio-api-key` を渡すか、`LM_API_TOKEN` を設定してください。
認証なしの LM Studio サーバーでは、キーを省略してください。OpenClaw はローカルの非シークレットマーカーを保存します。

`--custom-api-key` は互換性のため引き続きサポートされますが、LM Studio では `--lmstudio-api-key` が推奨されます。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトモデルが
`lmstudio/<custom-model-id>` に設定されます。API キーを指定した場合、セットアップでは
`lmstudio:default` 認証プロファイルも書き込まれます。

対話型セットアップでは、任意の推奨ロードコンテキスト長を入力でき、それを検出済みで設定に保存する LM Studio モデル全体に適用します。
LM Studio Plugin 設定は、loopback、LAN、tailnet ホストを含む、設定済みの LM Studio エンドポイントをモデルリクエストに対して信頼します。`models.providers.lmstudio.request.allowPrivateNetwork: false` を設定するとオプトアウトできます。

## 設定

### ストリーミング使用量の互換性

LM Studio はストリーミング使用量に対応しています。OpenAI 形式の
`usage` オブジェクトを出力しない場合、OpenClaw は代わりに llama.cpp 形式の
`timings.prompt_n` / `timings.predicted_n` メタデータからトークン数を復元します。

同じストリーミング使用量の挙動は、次の OpenAI 互換ローカルバックエンドにも適用されます。

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 思考互換性

LM Studio の `/api/v1/models` 検出がモデル固有の推論
オプションを報告する場合、OpenClaw はそれらのネイティブ値をモデル互換メタデータに保持します。
`allowed_options: ["off", "on"]` を宣伝するバイナリ思考モデルでは、
OpenClaw は無効な思考を `off` に、有効な `/think` レベルを `on` にマップし、
`low` や `medium` などの OpenAI 専用値は送信しません。

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

LM Studio が実行中であることを確認してください。認証が有効な場合は、`LM_API_TOKEN` も設定してください。

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

API にアクセスできることを確認します。

```bash
curl http://localhost:1234/api/v1/models
```

### 認証エラー (HTTP 401)

セットアップが HTTP 401 を報告する場合は、API キーを確認してください。

- `LM_API_TOKEN` が LM Studio で設定されているキーと一致していることを確認します。
- LM Studio の認証セットアップの詳細については、[LM Studio 認証](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。
- サーバーが認証を必要としない場合、セットアップ中にキーを空のままにしてください。

### Just-in-time モデルロード

LM Studio は、最初のリクエスト時にモデルをロードする Just-in-time (JIT) モデルロードをサポートしています。OpenClaw はデフォルトで LM Studio のネイティブロードエンドポイントを通じてモデルをプリロードするため、JIT が無効な場合に役立ちます。LM Studio の JIT、アイドル TTL、自動退避の挙動にモデルのライフサイクルを任せるには、OpenClaw のプリロード手順を無効にします。

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN または tailnet の LM Studio ホスト

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

汎用の OpenAI 互換プロバイダーとは異なり、`lmstudio` はガード付きモデルリクエストに対して、設定されたローカル/プライベートエンドポイントを自動的に信頼します。`localhost` や `127.0.0.1` などのカスタム loopback プロバイダー ID も自動的に信頼されます。LAN、tailnet、またはプライベート DNS のカスタムプロバイダー ID では、`models.providers.<id>.request.allowPrivateNetwork: true` を明示的に設定してください。

## 関連

- [モデル選択](/ja-JP/concepts/model-providers)
- [Ollama](/ja-JP/providers/ollama)
- [ローカルモデル](/ja-JP/gateway/local-models)
