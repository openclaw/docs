---
read_when:
    - LM Studio経由でopen sourceモデルを使ってOpenClawを実行したい場合
    - LM Studioをセットアップして設定したい場合
summary: LM StudioでOpenClawを実行する
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T05:15:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studioは、自分のハードウェア上でopen-weightモデルを実行するための、親しみやすく強力なアプリです。llama.cpp（GGUF）またはMLXモデル（Apple Silicon）を実行できます。GUIパッケージ版とheadless daemon（`llmster`）があります。製品情報とセットアップドキュメントは [lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

1. LM Studio（desktop）または `llmster`（headless）をインストールし、ローカルサーバーを起動します:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. サーバーを起動します

desktop appを起動するか、次のコマンドでdaemonを実行していることを確認してください:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

アプリを使う場合は、スムーズな体験のためにJITを有効にしてください。詳細は [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) を参照してください。

3. OpenClawはLM Studio token値を必要とします。`LM_API_TOKEN` を設定してください:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

LM Studioの認証が無効なら、空でない任意のtoken値を使ってください:

```bash
export LM_API_TOKEN="placeholder-key"
```

LM Studio auth設定の詳細は [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。

4. オンボーディングを実行し、`LM Studio` を選びます:

```bash
openclaw onboard
```

5. オンボーディングでは、`Default model` プロンプトでLM Studio modelを選んでください。

後から設定または変更することもできます:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio model keyは `author/model-name` 形式に従います（例: `qwen/qwen3.5-9b`）。OpenClawの
model refではprovider名を前置します: `lmstudio/qwen/qwen3.5-9b`。正確なkeyは、
`curl http://localhost:1234/api/v1/models` を実行して `key` fieldを確認すると見つかります。

## 非対話オンボーディング

セットアップをscript化したい場合（CI、provisioning、remote bootstrap）には、非対話オンボーディングを使ってください:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

または、API key付きでbase URLやmodelを指定します:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` には、LM Studioが返すmodel key（例: `qwen/qwen3.5-9b`）を、
`lmstudio/` provider prefixなしで渡します。

非対話オンボーディングには `--lmstudio-api-key`（またはenv内の `LM_API_TOKEN`）が必要です。
認証なしのLM Studio serverでは、空でない任意のtoken値で動作します。

`--custom-api-key` も互換性のため引き続きサポートされますが、LM Studioでは `--lmstudio-api-key` を推奨します。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトmodelが
`lmstudio/<custom-model-id>` に設定され、`lmstudio:default` auth profileが書き込まれます。

対話セットアップでは、任意のpreferred load context lengthを尋ねることができ、保存する設定内の検出済みLM Studio model全体にそれを適用します。

## 設定

### Streaming usage互換性

LM Studioはstreaming-usage互換です。OpenAI形式の
`usage` オブジェクトを出さない場合、OpenClawはllama.cppスタイルの
`timings.prompt_n` / `timings.predicted_n` metadataからtoken数を復元します。

同じ動作は、次のOpenAI互換ローカルbackendにも適用されます:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 明示的設定

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

### LM Studioが検出されない

LM Studioが実行中であり、`LM_API_TOKEN` を設定していることを確認してください（認証なしserverでは空でない任意のtoken値で動作します）:

```bash
# desktop app経由で起動、またはheadlessで:
lms server start --port 1234
```

APIに到達できることを確認します:

```bash
curl http://localhost:1234/api/v1/models
```

### 認証エラー（HTTP 401）

セットアップでHTTP 401が出る場合は、API keyを確認してください:

- `LM_API_TOKEN` がLM Studioで設定されたkeyと一致していることを確認する。
- LM Studio auth設定の詳細は [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。
- serverが認証を必要としない場合は、`LM_API_TOKEN` に空でない任意のtoken値を使ってください。

### Just-in-time model loading

LM Studioはjust-in-time（JIT）model loadingをサポートしており、モデルは最初のrequest時にロードされます。`Model not loaded` エラーを避けるため、これが有効になっていることを確認してください。

## 関連

- [Model selection](/ja-JP/concepts/model-providers)
- [Ollama](/ja-JP/providers/ollama)
- [Local models](/ja-JP/gateway/local-models)
