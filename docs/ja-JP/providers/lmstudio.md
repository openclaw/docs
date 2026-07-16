---
read_when:
    - LM Studio 経由でオープンソースモデルを使用して OpenClaw を実行する場合
    - LM Studio をセットアップして設定する場合
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T12:05:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio は、GUI アプリまたはヘッドレス `llmster`
デーモンとして、llama.cpp（GGUF）または MLX モデルをローカルで実行します。インストール方法と製品ドキュメントについては、[lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

<Steps>
  <Step title="インストールしてサーバーを起動する">
    LM Studio（デスクトップ）または `llmster`（ヘッドレス）をインストールしてから、サーバーを起動します。

    ```bash
    lms server start --port 1234
    ```

    または、ヘッドレスデーモンを実行します。

    ```bash
    lms daemon up
    ```

    デスクトップアプリを使用する場合は、モデルをスムーズに読み込めるように JIT を有効にします。詳細は
    [LM Studio の JIT と TTL ガイド](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)を参照してください。

  </Step>
  <Step title="認証が有効な場合は API キーを設定する">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    LM Studio の認証が無効な場合は、セットアップ時に API キーを空欄のままにします。詳細は
    [LM Studio の認証](https://lmstudio.ai/docs/developer/core/authentication)を参照してください。

  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard
    ```

    `LM Studio` を選択し、`Default model` プロンプトでモデルを選びます。

    新規のガイド付きセットアップでは、OpenClaw はまず、デフォルトまたは設定済みの
    LM Studio ホストにある `/api/v1/models` を照会します。既存の LLM は、同じ
    CLI/macOS セットアップ手順で提示され、設定を保存する前に実際の補完で検証されます。
    自動チェックによってモデルがダウンロードされることはなく、埋め込み専用のカタログ項目は
    無視されます。

  </Step>
</Steps>

後からデフォルトモデルを変更するには、次を実行します。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式（例: `qwen/qwen3.5-9b`）を使用し、OpenClaw のモデル参照では
プロバイダーを先頭に付けます: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーを確認するには、以下の
コマンドを実行し、`key` フィールドを確認します。

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

`--custom-model-id` には、LM Studio が返すモデルキー（例: `qwen/qwen3.5-9b`）を、
`lmstudio/` プロバイダープレフィックスなしで指定します。認証済みサーバーでは `--lmstudio-api-key` を渡す（または `LM_API_TOKEN` を設定する）必要があります。
認証なしのサーバーでは省略すると、OpenClaw は代わりにローカルの非シークレットマーカーを保存します。
互換性のため `--custom-api-key` も引き続き使用できますが、`--lmstudio-api-key` が推奨されます。

これにより `models.providers.lmstudio` が書き込まれ、デフォルトモデルが `lmstudio/<custom-model-id>` に設定されます。
API キーを指定すると、`lmstudio:default` 認証プロファイルも書き込まれます。

対話型セットアップでは、希望する読み込みコンテキスト長の入力を追加で求め、それを検出して
設定に保存するすべてのモデルに適用できます。

## 設定

### ストリーミング使用量の互換性

LM Studio は、ストリーミング応答で OpenAI 形式の `usage` オブジェクトを常に出力するとは限りません。OpenClaw は
代わりに、llama.cpp 形式の `timings.prompt_n` / `timings.predicted_n` メタデータから
トークン数を復元します。ローカルエンドポイント（ループバックホスト）として解決される OpenAI 互換エンドポイントには、
同じフォールバックが適用されます。これには、vLLM、SGLang、llama.cpp、LocalAI、Jan、TabbyAPI、
text-generation-webui などの他のローカルバックエンドも含まれます。

### 思考の互換性

LM Studio の `/api/v1/models` 検出でモデル固有の推論オプションが報告されると、OpenClaw は
モデルの互換性メタデータで、対応する `reasoning_effort` 値（`none`、`minimal`、`low`、`medium`、`high`、`xhigh`）を
公開します。一部の LM Studio ビルドは、バイナリ UI オプション（`allowed_options: ["off",
"on"]`）を提示する一方で、`/v1/chat/completions` ではそれらのリテラル値を拒否します。OpenClaw は、
リクエスト送信前にそのバイナリ形式を 6 段階のスケールへ正規化します。これは、`off`/`on` 推論マップが
残っている古い保存済み設定にも適用されます。

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

LM Studio は、最初のリクエスト時にモデルを読み込むジャストインタイム（JIT）モデル読み込みをサポートしています。OpenClaw は
デフォルトで LM Studio のネイティブ読み込みエンドポイントを通じてモデルをプリロードします。これは JIT が
無効な場合に役立ちます。代わりに、LM Studio の JIT、アイドル TTL、自動退避動作にモデルのライフサイクルを
管理させるには、OpenClaw のプリロード手順を無効にします。

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

LM Studio ホストの到達可能なアドレスを使用し、`/v1` を維持したうえで、そのマシン上の LM Studio が
ループバック以外にもバインドされていることを確認します。

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

`lmstudio` は、ループバック、LAN、tailnet ホストを含め、設定されたエンドポイントをモデルリクエスト用として
自動的に信頼します（メタデータオリジンとリンクローカルオリジンを除く）。カスタムまたはローカルの OpenAI 互換
プロバイダーエントリにも、同じ完全一致オリジンの信頼が適用されます。別のプライベートホストまたはポートへのリクエストには、
引き続き `models.providers.<id>.request.allowPrivateNetwork: true` が必要です。デフォルトの信頼を無効にするには、これを `false` に設定します。

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
