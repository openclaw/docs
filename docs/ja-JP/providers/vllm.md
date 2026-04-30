---
read_when:
    - OpenClaw をローカルの vLLM サーバーに対して実行したい場合
    - 独自モデルで OpenAI 互換の /v1 エンドポイントを使いたい場合
summary: vLLM（OpenAI 互換のローカルサーバー）で OpenClaw を実行する
title: vLLM
x-i18n:
    generated_at: "2026-04-30T05:32:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 16
---

vLLM は **OpenAI互換** の HTTP API 経由で、オープンソースモデル（一部のカスタムモデルを含む）を提供できます。OpenClaw は `openai-completions` API を使って vLLM に接続します。

`VLLM_API_KEY` を指定してオプトインし（サーバーが認証を強制しない場合は任意の値で動作します）、明示的な `models.providers.vllm` エントリーを定義していない場合、OpenClaw は vLLM から利用可能なモデルを **自動検出** することもできます。

OpenClaw は `vllm` を、ストリーミングされた使用量集計に対応するローカルの OpenAI互換プロバイダーとして扱うため、ステータスやコンテキストのトークン数を `stream_options.include_usage` レスポンスから更新できます。

| プロパティ         | 値                                    |
| ---------------- | ---------------------------------------- |
| プロバイダー ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI互換) |
| 認証             | `VLLM_API_KEY` 環境変数      |
| デフォルトベース URL | `http://127.0.0.1:8000/v1`               |

## はじめに

<Steps>
  <Step title="OpenAI互換サーバーで vLLM を起動する">
    ベース URL は `/v1` エンドポイント（例: `/v1/models`, `/v1/chat/completions`）を公開している必要があります。vLLM は一般的に次で動作します。

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API キー環境変数を設定する">
    サーバーが認証を強制しない場合は、任意の値で動作します。

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="モデルを選択する">
    使用する vLLM モデル ID のいずれかに置き換えます。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="モデルが利用可能であることを確認する">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## モデル検出（暗黙的プロバイダー）

`VLLM_API_KEY` が設定されている（または認証プロファイルが存在する）かつ `models.providers.vllm` を定義して**いない**場合、OpenClaw は次を照会します。

```
GET http://127.0.0.1:8000/v1/models
```

そして、返された ID をモデルエントリーに変換します。

<Note>
`models.providers.vllm` を明示的に設定した場合、自動検出はスキップされ、モデルを手動で定義する必要があります。
</Note>

## 明示的な設定（手動モデル）

次の場合は明示的な設定を使用します。

- vLLM が別のホストまたはポートで動作している
- `contextWindow` または `maxTokens` の値を固定したい
- サーバーが実際の API キーを要求する（またはヘッダーを制御したい）
- 信頼済みのループバック、LAN、または Tailscale の vLLM エンドポイントに接続する

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

## 高度な設定

<AccordionGroup>
  <Accordion title="プロキシ形式の動作">
    vLLM はネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI互換 `/v1` バックエンドとして扱われます。これは次を意味します。

    | 動作 | 適用されるか |
    |----------|----------|
    | ネイティブ OpenAI リクエスト整形 | いいえ |
    | `service_tier` | 送信されない |
    | Responses `store` | 送信されない |
    | プロンプトキャッシュヒント | 送信されない |
    | OpenAI reasoning 互換ペイロード整形 | 適用されない |
    | 隠し OpenClaw 帰属ヘッダー | カスタムベース URL では注入されない |

  </Accordion>

  <Accordion title="Qwen thinking 制御">
    vLLM 経由で提供される Qwen モデルでは、サーバーが Qwen chat-template kwargs を想定している場合、モデルエントリーに `params.qwenThinkingFormat: "chat-template"` を設定します。OpenClaw は `/think off` を次にマッピングします。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off` 以外の thinking レベルでは `enable_thinking: true` が送信されます。エンドポイントが代わりに DashScope 形式のトップレベルフラグを想定している場合は、`params.qwenThinkingFormat: "top-level"` を使用して、リクエストルートに `enable_thinking` を送信します。スネークケースの `params.qwen_thinking_format` も使用できます。

  </Accordion>

  <Accordion title="Nemotron 3 thinking 制御">
    vLLM/Nemotron 3 では、reasoning を隠し reasoning として返すか、表示される回答テキストとして返すかを制御するために、chat-template kwargs を使用できます。OpenClaw セッションが thinking off で `vllm/nemotron-3-*` を使用する場合、同梱の vLLM Plugin は次を送信します。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    これらの値をカスタマイズするには、モデルパラメーターの下に `chat_template_kwargs` を設定します。`params.extra_body.chat_template_kwargs` も設定した場合は、`extra_body` が最後のリクエストボディ上書きであるため、その値が最終的に優先されます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen ツール呼び出しがテキストとして表示される">
    まず、vLLM がそのモデルに適したツール呼び出しパーサーとチャットテンプレートで起動されていることを確認します。たとえば、vLLM は Qwen2.5 モデル向けに `hermes`、Qwen3-Coder モデル向けに `qwen3_xml` をドキュメント化しています。

    症状:

    - skills またはツールが実行されない
    - アシスタントが `{"name":"read","arguments":...}` のような生の JSON/XML を出力する
    - OpenClaw が `tool_choice: "auto"` を送信したときに、vLLM が空の `tool_calls` 配列を返す

    一部の Qwen/vLLM の組み合わせでは、リクエストが `tool_choice: "required"` を使用した場合にのみ、構造化されたツール呼び出しを返します。該当するモデルエントリーでは、`params.extra_body` を使って OpenAI互換リクエストフィールドを強制します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    `Qwen-Qwen2.5-Coder-32B-Instruct` は、次で返される正確な ID に置き換えます。

    ```bash
    openclaw models list --provider vllm
    ```

    CLI から同じ上書きを適用できます。

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    これはオプトインの互換性回避策です。ツールを伴うすべてのモデルターンでツール呼び出しが必須になるため、その動作が許容される専用のローカルモデルエントリーでのみ使用してください。すべての vLLM モデルのグローバルデフォルトとして使用しないでください。また、任意のアシスタントテキストを実行可能なツール呼び出しへ無差別に変換するプロキシを使用しないでください。

  </Accordion>

  <Accordion title="カスタムベース URL">
    vLLM サーバーがデフォルト以外のホストまたはポートで動作している場合は、明示的なプロバイダー設定で `baseUrl` を設定します。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="最初のレスポンスが遅い、またはリモートサーバーがタイムアウトする">
    大きなローカルモデル、リモート LAN ホスト、または tailnet リンクでは、プロバイダースコープのリクエストタイムアウトを設定します。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` は、接続セットアップ、レスポンスヘッダー、ボディストリーミング、および保護された fetch 全体の中断を含む、vLLM モデルの HTTP リクエストにのみ適用されます。エージェント実行全体を制御する `agents.defaults.timeoutSeconds` を増やす前に、こちらを優先してください。

  </Accordion>

  <Accordion title="サーバーに到達できない">
    vLLM サーバーが実行中で、アクセス可能であることを確認します。

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    接続エラーが表示される場合は、ホスト、ポート、および vLLM が OpenAI互換サーバーモードで起動されたことを確認してください。
    明示的なループバック、LAN、または Tailscale エンドポイントでは、`models.providers.vllm.request.allowPrivateNetwork: true` も設定します。プロバイダーリクエストは、プロバイダーが明示的に信頼されていない限り、デフォルトでプライベートネットワーク URL をブロックします。

  </Accordion>

  <Accordion title="リクエストで認証エラーが発生する">
    リクエストが認証エラーで失敗する場合は、サーバー設定に一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` の下でプロバイダーを明示的に設定します。

    <Tip>
    vLLM サーバーが認証を強制しない場合、`VLLM_API_KEY` には空でない任意の値を設定すれば、OpenClaw へのオプトイン信号として機能します。
    </Tip>

  </Accordion>

  <Accordion title="モデルが検出されない">
    自動検出には、`VLLM_API_KEY` が設定されていて、かつ明示的な `models.providers.vllm` 設定エントリーが存在しないことが必要です。プロバイダーを手動で定義している場合、OpenClaw は検出をスキップし、宣言されたモデルのみを使用します。
  </Accordion>

  <Accordion title="ツールが生テキストとしてレンダリングされる">
    Qwen モデルが skill を実行せずに JSON/XML ツール構文を出力する場合は、上記の高度な設定にある Qwen のガイダンスを確認してください。通常の修正は次のとおりです。

    - そのモデルに適したパーサー/テンプレートで vLLM を起動する
    - `openclaw models list --provider vllm` で正確なモデル ID を確認する
    - `tool_choice: "auto"` が依然として空またはテキストのみのツール呼び出しを返す場合にのみ、専用のモデル単位の `params.extra_body.tool_choice: "required"` 上書きを追加する

  </Accordion>
</AccordionGroup>

<Warning>
詳しいヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OpenAI" href="/ja-JP/providers/openai" icon="bolt">
    ネイティブ OpenAI プロバイダーと OpenAI互換ルートの動作。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とその解決方法。
  </Card>
</CardGroup>
