---
read_when:
    - LM Studio 経由でオープンソースモデルを使って OpenClaw を実行したい場合
    - LM Studio をセットアップして構成したい
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T22:22:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 814117ecbdc52cf67e921d0f0d67c4219f8bdc15fb8cf34b983cda775cba9b9e
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio は、自分のハードウェア上でオープンウェイトモデルを実行するための、親しみやすく強力なアプリです。llama.cpp（GGUF）または MLX モデル（Apple Silicon）を実行できます。GUI パッケージまたはヘッドレスデーモン（`llmster`）として提供されます。製品とセットアップのドキュメントについては、[lmstudio.ai](https://lmstudio.ai/) を参照してください。

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

LM Studio 認証が無効な場合は、対話型の OpenClaw セットアップ中に API キーを空白のままにできます。

LM Studio 認証セットアップの詳細については、[LM Studio 認証](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。

4. オンボーディングを実行し、`LM Studio` を選択します。

```bash
openclaw onboard
```

5. オンボーディングでは、`Default model` プロンプトを使って LM Studio モデルを選択します。

後で設定または変更することもできます。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式（例: `qwen/qwen3.5-9b`）に従います。OpenClaw
のモデル参照ではプロバイダー名を前置します: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーは、
`curl http://localhost:1234/api/v1/models` を実行し、`key` フィールドを見ることで確認できます。

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

`--custom-model-id` は、LM Studio から返されるモデルキー（例: `qwen/qwen3.5-9b`）を受け取ります。
`lmstudio/` プロバイダープレフィックスは含めません。

認証済みの LM Studio サーバーでは、`--lmstudio-api-key` を渡すか、`LM_API_TOKEN` を設定します。
未認証の LM Studio サーバーでは、キーを省略します。OpenClaw はローカルの非シークレットマーカーを保存します。

`--custom-api-key` は互換性のため引き続きサポートされますが、LM Studio では `--lmstudio-api-key` が推奨されます。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトモデルが
`lmstudio/<custom-model-id>` に設定されます。API キーを指定した場合、セットアップは
`lmstudio:default` 認証プロファイルも書き込みます。

対話型セットアップでは、任意の優先ロードコンテキスト長を入力でき、保存された検出済み LM Studio モデル全体にそれを適用します。
LM Studio Plugin 設定は、loopback、LAN、tailnet ホストを含むモデルリクエストについて、設定済みの LM Studio エンドポイントを信頼します。`models.providers.lmstudio.request.allowPrivateNetwork: false` を設定するとオプトアウトできます。

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

### Thinking の互換性

LM Studio の `/api/v1/models` 検出がモデル固有の reasoning
オプションを報告する場合、OpenClaw は対応する OpenAI 互換の `reasoning_effort`
値をモデル互換メタデータとして公開します。現在の LM Studio ビルドは、
`allowed_options: ["off", "on"]` のようなバイナリの UI オプションを告知することがありますが、
`/v1/chat/completions` ではそれらの値を拒否します。OpenClaw はリクエスト送信前に、そのバイナリ検出形式を
`none`、`minimal`、`low`、`medium`、`high`、`xhigh` に正規化します。
`off`/`on` reasoning マップを含む古い保存済み LM Studio 設定も、
カタログの読み込み時に同じ方法で正規化されます。

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

セットアップが HTTP 401 を報告する場合は、API キーを確認してください。

- `LM_API_TOKEN` が LM Studio に設定されたキーと一致していることを確認します。
- LM Studio 認証セットアップの詳細については、[LM Studio 認証](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。
- サーバーが認証を必要としない場合は、セットアップ中にキーを空白のままにします。

### ジャストインタイムのモデル読み込み

LM Studio は、最初のリクエスト時にモデルを読み込むジャストインタイム（JIT）モデル読み込みをサポートしています。OpenClaw はデフォルトで LM Studio のネイティブ読み込みエンドポイントを通じてモデルをプリロードします。これは JIT が無効な場合に役立ちます。LM Studio の JIT、アイドル TTL、自動エビクト動作にモデルライフサイクルを任せるには、OpenClaw のプリロード手順を無効にします。

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

LM Studio ホストの到達可能なアドレスを使用し、`/v1` を維持し、そのマシン上で LM Studio がループバックを越えてバインドされていることを確認してください。

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

汎用の OpenAI 互換プロバイダーとは異なり、`lmstudio` は保護されたモデルリクエストに対して、設定済みのローカル/プライベートエンドポイントを自動的に信頼します。`localhost` や `127.0.0.1` のようなカスタムループバックプロバイダー ID も自動的に信頼されます。LAN、tailnet、またはプライベート DNS のカスタムプロバイダー ID では、`models.providers.<id>.request.allowPrivateNetwork: true` を明示的に設定してください。

## 関連

- [モデル選択](/ja-JP/concepts/model-providers)
- [Ollama](/ja-JP/providers/ollama)
- [ローカルモデル](/ja-JP/gateway/local-models)
