---
read_when:
    - ローカル vLLM サーバーに対して OpenClaw を実行したい場合
    - 独自のモデルで OpenAI 互換の /v1 エンドポイントを使いたい場合
summary: vLLM（OpenAI 互換ローカルサーバー）で OpenClaw を実行する
title: vLLM
x-i18n:
    generated_at: "2026-06-27T12:52:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM は **OpenAI 互換** HTTP API を通じて、オープンソース（および一部のカスタム）モデルを提供できます。OpenClaw は `openai-completions` API を使用して vLLM に接続します。

OpenClaw は、`VLLM_API_KEY` でオプトインすると、vLLM から利用可能なモデルを **自動検出** することもできます（サーバーが認証を強制しない場合は任意の値で動作します）。カスタム vLLM ベース URL も設定する場合に検出を動的なままにするには、`agents.defaults.models` で `vllm/*` を使用します。

OpenClaw は `vllm` を、ストリーミングされた使用量アカウンティングをサポートするローカルの OpenAI 互換プロバイダーとして扱うため、ステータス/コンテキストのトークン数は `stream_options.include_usage` レスポンスから更新できます。

| プロパティ       | 値                                       |
| ---------------- | ---------------------------------------- |
| プロバイダー ID  | `vllm`                                   |
| API              | `openai-completions`（OpenAI 互換）      |
| 認証             | `VLLM_API_KEY` 環境変数                 |
| デフォルトのベース URL | `http://127.0.0.1:8000/v1`               |

## はじめに

<Steps>
  <Step title="OpenAI 互換サーバーで vLLM を起動する">
    ベース URL は `/v1` エンドポイント（例: `/v1/models`、`/v1/chat/completions`）を公開している必要があります。vLLM は一般的に次で実行されます。

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API キー環境変数を設定する">
    サーバーが認証を強制しない場合は任意の値で動作します。

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="モデルを選択する">
    自分の vLLM モデル ID のいずれかに置き換えます。

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

`VLLM_API_KEY` が設定されている（または認証プロファイルが存在する）状態で、`models.providers.vllm` を定義して **いない** 場合、OpenClaw は次を照会します。

```
GET http://127.0.0.1:8000/v1/models
```

そして返された ID をモデルエントリに変換します。

<Note>
`models.providers.vllm` を明示的に設定した場合、OpenClaw はデフォルトで宣言済みモデルを使用します。OpenClaw にその設定済みプロバイダーの `/models` エンドポイントを照会させ、公開されているすべての vLLM モデルを含めたい場合は、`agents.defaults.models` に `"vllm/*": {}` を追加します。
</Note>

## 明示的な設定（手動モデル）

次の場合は明示的な設定を使用します。

- vLLM が別のホストまたはポートで動作している
- `contextWindow` または `maxTokens` の値を固定したい
- サーバーが実際の API キーを必要とする（またはヘッダーを制御したい）
- 信頼されたループバック、LAN、または Tailscale の vLLM エンドポイントに接続する

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

すべてのモデルを手動で列挙せずにこのプロバイダーを動的に保つには、表示されるモデルカタログにプロバイダーのワイルドカードを追加します。

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="プロキシ形式の動作">
    vLLM は、ネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換 `/v1` バックエンドとして扱われます。つまり、次のようになります。

    | 動作 | 適用されるか |
    |----------|----------|
    | ネイティブ OpenAI リクエスト整形 | いいえ |
    | `service_tier` | 送信されない |
    | Responses `store` | 送信されない |
    | プロンプトキャッシュヒント | 送信されない |
    | OpenAI 推論互換ペイロード整形 | 適用されない |
    | 非表示の OpenClaw 帰属ヘッダー | カスタムベース URL では注入されない |

  </Accordion>

  <Accordion title="Qwen thinking コントロール">
    vLLM 経由で提供される Qwen モデルでは、サーバーが Qwen chat-template kwargs を想定している場合、設定済みプロバイダーのモデル行に `compat.thinkingFormat: "qwen-chat-template"` を設定します。この方法で設定されたモデルは、バイナリの `/think` プロファイル（`off`、`on`）を公開します。これは、Qwen テンプレート thinking が OpenAI 形式の effort ラダーではなく、オン/オフのリクエストフラグであるためです。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw は `/think off` を次にマッピングします。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off` 以外の thinking レベルでは `enable_thinking: true` が送信されます。エンドポイントが代わりに DashScope 形式のトップレベルフラグを想定している場合は、リクエストルートに `enable_thinking` を送信するために `compat.thinkingFormat: "qwen"` を使用します。

  </Accordion>

  <Accordion title="Nemotron 3 thinking コントロール">
    vLLM/Nemotron 3 は、推論を非表示の推論として返すか、表示される回答テキストとして返すかを制御するために chat-template kwargs を使用できます。OpenClaw セッションが thinking オフで `vllm/nemotron-3-*` を使用する場合、バンドルされた vLLM Plugin は次を送信します。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    これらの値をカスタマイズするには、モデル params の下に `chat_template_kwargs` を設定します。`params.extra_body.chat_template_kwargs` も設定した場合、`extra_body` が最後のリクエストボディ上書きであるため、その値が最終的に優先されます。

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

  <Accordion title="Qwen のツール呼び出しがテキストとして表示される">
    まず、vLLM がそのモデルに適したツール呼び出しパーサーとチャットテンプレートで起動されていることを確認します。たとえば、vLLM は Qwen2.5 モデルには `hermes`、Qwen3-Coder モデルには `qwen3_xml` を文書化しています。

    症状:

    - skill またはツールが実行されない
    - アシスタントが `{"name":"read","arguments":...}` のような生の JSON/XML を出力する
    - OpenClaw が `tool_choice: "auto"` を送信したとき、vLLM が空の `tool_calls` 配列を返す

    一部の Qwen/vLLM の組み合わせでは、リクエストが `tool_choice: "required"` を使用した場合にのみ構造化ツール呼び出しを返します。そのようなモデルエントリでは、`params.extra_body` で OpenAI 互換リクエストフィールドを強制します。

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

    `Qwen-Qwen2.5-Coder-32B-Instruct` を、次で返される正確な id に置き換えます。

    ```bash
    openclaw models list --provider vllm
    ```

    CLI から同じ上書きを適用できます。

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    これはオプトインの互換性回避策です。ツールを伴うそのモデルのすべてのターンでツール呼び出しを要求するため、その動作が許容される専用のローカルモデルエントリにのみ使用してください。すべての vLLM モデルのグローバルデフォルトとして使用しないでください。また、任意のアシスタントテキストを実行可能なツール呼び出しへ盲目的に変換するプロキシを使用しないでください。

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
    大規模なローカルモデル、リモート LAN ホスト、または tailnet リンクでは、プロバイダー単位のリクエストタイムアウトを設定します。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` は、接続セットアップ、レスポンスヘッダー、ボディストリーミング、保護された fetch 全体の中断を含む、vLLM モデル HTTP リクエストのみに適用されます。エージェント実行全体を制御する `agents.defaults.timeoutSeconds` を増やす前に、こちらを優先してください。

  </Accordion>

  <Accordion title="サーバーに到達できない">
    vLLM サーバーが実行中でアクセス可能であることを確認します。

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    接続エラーが表示される場合は、ホスト、ポート、および vLLM が OpenAI 互換サーバーモードで起動されたことを確認してください。
    明示的なループバック、LAN、または Tailscale エンドポイントでは、OpenClaw は保護されたモデルリクエストに対して、設定された正確な `models.providers.vllm.baseUrl` オリジンを信頼します。メタデータ/link-local オリジンは、明示的にオプトインしない限り引き続きブロックされます。vLLM リクエストが別のプライベートオリジンに到達する必要がある場合にのみ `models.providers.vllm.request.allowPrivateNetwork: true` を設定し、正確なオリジンの信頼からオプトアウトするには `false` に設定します。

  </Accordion>

  <Accordion title="リクエストで認証エラーが発生する">
    リクエストが認証エラーで失敗する場合は、サーバー設定と一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` の下でプロバイダーを明示的に設定します。

    <Tip>
    vLLM サーバーが認証を強制しない場合、`VLLM_API_KEY` の空でない任意の値が OpenClaw へのオプトインシグナルとして機能します。
    </Tip>

  </Accordion>

  <Accordion title="モデルが検出されない">
    自動検出には `VLLM_API_KEY` が設定されている必要があります。`models.providers.vllm` を定義している場合、`agents.defaults.models` に `"vllm/*": {}` が含まれていない限り、OpenClaw は宣言済みモデルのみを使用します。
  </Accordion>

  <Accordion title="ツールが生テキストとして表示される">
    Qwen モデルが skill を実行する代わりに JSON/XML ツール構文を出力する場合は、上記の高度な設定にある Qwen のガイダンスを確認してください。通常の修正は次のとおりです。

    - そのモデルに適したパーサー/テンプレートで vLLM を起動する
    - `openclaw models list --provider vllm` で正確なモデル id を確認する
    - `tool_choice: "auto"` がまだ空またはテキストのみのツール呼び出しを返す場合にのみ、専用のモデル単位の `params.extra_body.tool_choice: "required"` 上書きを追加する

  </Accordion>
</AccordionGroup>

<Warning>
さらにヘルプが必要な場合: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="OpenAI" href="/ja-JP/providers/openai" icon="bolt">
    ネイティブの OpenAI プロバイダーと OpenAI 互換ルートの動作。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とその解決方法。
  </Card>
</CardGroup>
