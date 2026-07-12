---
read_when:
    - LM Studio 経由でオープンソースモデルを使用して OpenClaw を実行したい場合
    - LM Studio をセットアップして設定する場合
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-07-11T22:37:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio は llama.cpp（GGUF）または MLX モデルをローカルで実行します。GUI アプリとしても、ヘッドレスの `llmster` デーモンとしても利用できます。インストールおよび製品ドキュメントについては、[lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

<Steps>
  <Step title="サーバーをインストールして起動する">
    LM Studio（デスクトップ）または `llmster`（ヘッドレス）をインストールし、サーバーを起動します。

    ```bash
    lms server start --port 1234
    ```

    または、ヘッドレスデーモンを実行します。

    ```bash
    lms daemon up
    ```

    デスクトップアプリを使用する場合は、モデルをスムーズに読み込むために JIT を有効にしてください。[LM Studio の JIT と TTL のガイド](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)を参照してください。

  </Step>
  <Step title="認証が有効な場合は API キーを設定する">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    LM Studio の認証が無効な場合は、セットアップ時に API キーを空欄のままにします。[LM Studio の認証](https://lmstudio.ai/docs/developer/core/authentication)を参照してください。

  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard
    ```

    `LM Studio` を選択し、`Default model` プロンプトでモデルを選択します。

  </Step>
</Steps>

後でデフォルトモデルを変更するには、次を実行します。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式（例: `qwen/qwen3.5-9b`）を使用します。OpenClaw のモデル参照では、先頭にプロバイダーを付けます: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーを確認するには、次のコマンドを実行して `key` フィールドを確認します。

```bash
curl http://localhost:1234/api/v1/models
```

## 非対話型オンボーディング

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

または、ベース URL、モデル、API キーを明示的に指定します。

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` には、LM Studio から返されたモデルキー（例: `qwen/qwen3.5-9b`）を、プロバイダー接頭辞 `lmstudio/` なしで指定します。認証済みサーバーの場合は `--lmstudio-api-key` を渡す（または `LM_API_TOKEN` を設定する）必要があります。認証なしのサーバーの場合は省略すると、OpenClaw は代わりにローカルの非シークレットマーカーを保存します。互換性のために `--custom-api-key` も引き続き使用できますが、`--lmstudio-api-key` を推奨します。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトモデルが `lmstudio/<custom-model-id>` に設定されます。API キーを指定すると、認証プロファイル `lmstudio:default` も書き込まれます。

対話型セットアップでは、希望する読み込みコンテキスト長の入力を追加で求め、検出して設定に保存するすべてのモデルに適用できます。

## 設定

### ストリーミング使用量の互換性

LM Studio は、ストリーミング応答で OpenAI 形式の `usage` オブジェクトを常に出力するとは限りません。代わりに OpenClaw は、llama.cpp 形式の `timings.prompt_n` / `timings.predicted_n` メタデータからトークン数を復元します。ローカルエンドポイント（ループバックホスト）として解決される OpenAI 互換エンドポイントには、同じフォールバックが適用されます。これには、vLLM、SGLang、llama.cpp、LocalAI、Jan、TabbyAPI、text-generation-webui など、ほかのローカルバックエンドも含まれます。

### 思考の互換性

LM Studio の `/api/v1/models` ディスカバリーがモデル固有の推論オプションを報告すると、OpenClaw はモデルの互換性メタデータで、対応する `reasoning_effort` 値（`none`、`minimal`、`low`、`medium`、`high`、`xhigh`）を公開します。一部の LM Studio ビルドは二値の UI オプション（`allowed_options: ["off", "on"]`）を提示しますが、`/v1/chat/completions` ではこれらのリテラル値を拒否します。OpenClaw はリクエストを送信する前に、この二値形式を 6 段階のスケールに正規化します。これは、推論マップに `off`/`on` が残っている古い保存済み設定にも適用されます。

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

### プリロードの無効化

LM Studio は、最初のリクエスト時にモデルを読み込むジャストインタイム（JIT）モデル読み込みをサポートしています。OpenClaw はデフォルトで LM Studio のネイティブ読み込みエンドポイントを通じてモデルをプリロードします。これは JIT が無効な場合に役立ちます。代わりに LM Studio の JIT、アイドル TTL、自動退避動作にモデルのライフサイクルを管理させるには、OpenClaw のプリロード手順を無効にします。

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

### LAN または tailnet ホスト

LM Studio ホストの到達可能なアドレスを使用し、`/v1` を維持したうえで、そのマシン上の LM Studio がループバック以外にもバインドされていることを確認します。

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

`lmstudio` は、ループバック、LAN、tailnet ホストを含め、設定されたエンドポイントをモデルリクエスト用として自動的に信頼します（メタデータまたはリンクローカルのオリジンを除く）。カスタムまたはローカルの OpenAI 互換プロバイダーエントリにも、同一オリジンに対する同じ信頼が適用されます。別のプライベートホストまたはポートへのリクエストには、引き続き `models.providers.<id>.request.allowPrivateNetwork: true` が必要です。デフォルトの信頼を無効にするには、これを `false` に設定します。

## トラブルシューティング

### LM Studio が検出されない

LM Studio が実行中であることを確認します。

```bash
lms server start --port 1234
```

認証が有効な場合は、`LM_API_TOKEN` も設定します。API に到達できることを確認します。

```bash
curl http://localhost:1234/api/v1/models
```

### 認証エラー（HTTP 401）

- `LM_API_TOKEN` が LM Studio で設定されたキーと一致することを確認します。
- [LM Studio の認証](https://lmstudio.ai/docs/developer/core/authentication)を参照してください。
- サーバーが認証を必要としない場合は、セットアップ時にキーを空欄のままにします。

## 関連項目

- [モデルの選択](/ja-JP/concepts/model-providers)
- [Ollama](/ja-JP/providers/ollama)
- [ローカルモデル](/ja-JP/gateway/local-models)
