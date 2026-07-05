---
read_when:
    - LM Studio 経由でオープンソースモデルを使って OpenClaw を実行したい
    - LM Studio をセットアップして構成したい
summary: LM Studio で OpenClaw を実行する
title: LM Studio
x-i18n:
    generated_at: "2026-07-05T11:44:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio は、llama.cpp (GGUF) または MLX モデルを GUI アプリ、またはヘッドレスの `llmster`
デーモンとしてローカルで実行します。インストールと製品ドキュメントについては、[lmstudio.ai](https://lmstudio.ai/) を参照してください。

## クイックスタート

<Steps>
  <Step title="インストールしてサーバーを起動する">
    LM Studio (デスクトップ) または `llmster` (ヘッドレス) をインストールし、サーバーを起動します。

    ```bash
    lms server start --port 1234
    ```

    または、ヘッドレスデーモンを実行します。

    ```bash
    lms daemon up
    ```

    デスクトップアプリを使用する場合は、モデルの読み込みをスムーズにするために JIT を有効にしてください。
    [LM Studio JIT and TTL guide](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) を参照してください。

  </Step>
  <Step title="認証が有効な場合は API キーを設定する">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    LM Studio 認証が無効な場合は、セットアップ中に API キーを空のままにします。
    [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。

  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard
    ```

    `LM Studio` を選択し、`Default model` プロンプトでモデルを選びます。

  </Step>
</Steps>

後でデフォルトモデルを変更します。

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio のモデルキーは `author/model-name` 形式を使用します (例: `qwen/qwen3.5-9b`)。OpenClaw のモデル参照では
プロバイダーを前に付けます: `lmstudio/qwen/qwen3.5-9b`。モデルの正確なキーは、以下のコマンドを実行し、
`key` フィールドを確認して見つけます。

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

`--custom-model-id` は、LM Studio から返されるモデルキー (例: `qwen/qwen3.5-9b`) を受け取ります。
`lmstudio/` プロバイダープレフィックスは付けません。認証ありのサーバーでは `--lmstudio-api-key` を渡すか、`LM_API_TOKEN` を設定します。
認証なしのサーバーでは省略すると、OpenClaw は代わりにローカルの非シークレットマーカーを保存します。
`--custom-api-key` は互換性のため引き続き受け付けますが、`--lmstudio-api-key` が推奨されます。

これは `models.providers.lmstudio` を書き込み、デフォルトモデルを `lmstudio/<custom-model-id>` に設定します。
API キーを指定すると、`lmstudio:default` 認証プロファイルも書き込まれます。

対話型セットアップでは、優先するロードコンテキスト長の入力を追加で求め、それを検出して設定に保存する
モデル全体に適用できます。

## 設定

### ストリーミング使用量の互換性

LM Studio は、ストリーミング応答で OpenAI 形式の `usage` オブジェクトを常に出力するとは限りません。OpenClaw は
代わりに、llama.cpp 形式の `timings.prompt_n` / `timings.predicted_n` メタデータからトークン数を復元します。
ローカルエンドポイント (ループバックホスト) として解決される OpenAI 互換エンドポイントには、同じ
フォールバックが適用されます。これにより、vLLM、SGLang、llama.cpp、LocalAI、Jan、TabbyAPI、
text-generation-webui など、他のローカルバックエンドもカバーされます。

### Thinking の互換性

LM Studio の `/api/v1/models` 検出がモデル固有の推論オプションを報告する場合、OpenClaw は
対応する `reasoning_effort` 値 (`none`、`minimal`、`low`、`medium`、`high`、`xhigh`) を
モデル互換メタデータで公開します。一部の LM Studio ビルドはバイナリ UI オプション (`allowed_options: ["off",
"on"]`) を通知しますが、`/v1/chat/completions` ではそれらのリテラル値を拒否します。OpenClaw は、リクエスト送信前に
そのバイナリ形状を 6 段階スケールへ正規化します。これには、まだ `off`/`on` 推論マップを持つ古い保存済み設定も含まれます。

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

LM Studio は、最初のリクエスト時にモデルを読み込むジャストインタイム (JIT) モデル読み込みをサポートしています。OpenClaw は
デフォルトで LM Studio のネイティブ読み込みエンドポイントを通じてモデルをプリロードします。これは JIT が
無効な場合に役立ちます。代わりに、LM Studio の JIT、アイドル TTL、自動退避動作にモデルライフサイクルを任せるには、
OpenClaw のプリロード手順を無効にします。

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

LM Studio ホストの到達可能なアドレスを使用し、`/v1` を維持し、そのマシン上の LM Studio が
ループバック以外にもバインドされていることを確認してください。

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

`lmstudio` は、ループバック、LAN、tailnet ホスト (メタデータ/リンクローカルのオリジンを除く) を含め、
モデルリクエスト用に設定済みエンドポイントを自動的に信頼します。カスタムまたはローカルの OpenAI 互換
プロバイダーエントリにも、同じ厳密なオリジン信頼が適用されます。別のプライベートホストまたはポートへのリクエストには、引き続き
`models.providers.<id>.request.allowPrivateNetwork: true` が必要です。デフォルトの信頼をオプトアウトするには、`false` に設定します。

## トラブルシューティング

### LM Studio が検出されない

LM Studio が実行中であることを確認してください。

```bash
lms server start --port 1234
```

認証が有効な場合は、`LM_API_TOKEN` も設定します。API に到達できることを確認します。

```bash
curl http://localhost:1234/api/v1/models
```

### 認証エラー (HTTP 401)

- `LM_API_TOKEN` が LM Studio で設定されたキーと一致していることを確認します。
- [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication) を参照してください。
- サーバーが認証を必要としない場合は、セットアップ中にキーを空のままにします。

## 関連

- [モデル選択](/ja-JP/concepts/model-providers)
- [Ollama](/ja-JP/providers/ollama)
- [ローカルモデル](/ja-JP/gateway/local-models)
