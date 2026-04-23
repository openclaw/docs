---
read_when:
    - LM Studio 経由でオープンソースモデルを使って OpenClaw を実行したい場合
    - LM Studio をセットアップして設定したい場合
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T14:07:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio は、自分のハードウェア上で open-weight モデルを実行するための、使いやすく高機能なアプリです。llama.cpp（GGUF）または MLX モデル（Apple Silicon）を実行できます。GUI パッケージまたはヘッドレスデーモン（`llmster`）として利用できます。製品とセットアップのドキュメントは [lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

1. LM Studio（デスクトップ）または `llmster`（ヘッドレス）をインストールし、ローカルサーバーを起動します。

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. サーバーを起動します

デスクトップアプリを起動するか、次のコマンドでデーモンを実行してください。

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

アプリを使っている場合は、スムーズな体験のため JIT を有効にしてください。詳細は [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) を参照してください。

3. OpenClaw には LM Studio のトークン値が必要です。`LM_API_TOKEN` を設定してください。

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studio の認証が無効な場合は、空でない任意のトークン値を使ってください。

```bash
export LM_API_TOKEN="placeholder-key"
```

LM Studio の認証設定の詳細は [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。

4. オンボーディングを実行し、`LM Studio` を選びます。

```bash
openclaw onboard
```

5. オンボーディングでは、`Default model` プロンプトで LM Studio モデルを選択します。

後から設定または変更することもできます。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式（例: `qwen/qwen3.5-9b`）に従います。OpenClaw のモデル ref では provider 名が前に付きます: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーは、`curl http://localhost:1234/api/v1/models` を実行して `key` フィールドを見ると確認できます。

## 非対話オンボーディング

セットアップをスクリプト化したい場合（CI、プロビジョニング、リモート bootstrap）は、非対話オンボーディングを使ってください。

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

または、API キー付きで base URL やモデルを指定します。

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` は、LM Studio が返すモデルキー（例: `qwen/qwen3.5-9b`）を受け取り、`lmstudio/` provider プレフィックスは付けません。

非対話オンボーディングには `--lmstudio-api-key`（または環境変数の `LM_API_TOKEN`）が必要です。
認証なしの LM Studio サーバーでは、空でない任意のトークン値で動作します。

`--custom-api-key` も互換性のため引き続きサポートされますが、LM Studio では `--lmstudio-api-key` が推奨されます。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトモデルが
`lmstudio/<custom-model-id>` に設定され、`lmstudio:default` 認証プロファイルが書き込まれます。

対話セットアップでは、任意の preferred load context length を質問し、保存した検出済み LM Studio モデル全体にそれを適用できます。

## 設定

### ストリーミング使用量互換性

LM Studio はストリーミング使用量互換です。OpenAI 形式の
`usage` オブジェクトを出力しない場合、OpenClaw は llama.cpp 形式の
`timings.prompt_n` / `timings.predicted_n` メタデータからトークン数を復元します。

同じ動作は、以下の OpenAI 互換 local バックエンドにも適用されます。

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

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

LM Studio が実行中であり、`LM_API_TOKEN` を設定していることを確認してください（認証なしサーバーでは、空でない任意のトークン値で動作します）。

```bash
# デスクトップアプリ経由、またはヘッドレスで起動:
lms server start --port 1234
```

API にアクセスできることを確認します。

```bash
curl http://localhost:1234/api/v1/models
```

### 認証エラー（HTTP 401）

セットアップで HTTP 401 が報告される場合は、API キーを確認してください。

- `LM_API_TOKEN` が LM Studio に設定したキーと一致していることを確認してください。
- LM Studio の認証設定の詳細は [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。
- サーバーが認証を必要としない場合は、`LM_API_TOKEN` に空でない任意のトークン値を使ってください。

### Just-in-time モデル読み込み

LM Studio は just-in-time（JIT）モデル読み込みをサポートしており、モデルは最初のリクエスト時に読み込まれます。`Model not loaded` エラーを避けるため、これが有効になっていることを確認してください。
