---
read_when:
    - ローカル vLLM サーバーに対して OpenClaw を実行したい
    - 独自のモデルでOpenAI互換の /v1 エンドポイントを使いたい場合
summary: vLLM（OpenAI互換ローカルサーバー）で OpenClaw を実行する
title: vLLM
x-i18n:
    generated_at: "2026-07-05T11:47:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM は、**OpenAI互換** HTTP API を通じてオープンソース（および一部のカスタム）モデルを提供します。OpenClaw は `openai-completions` API を使用して接続し、`VLLM_API_KEY` でオプトインするとモデルを**自動検出**できます。

| プロパティ       | 値                                         |
| ---------------- | ------------------------------------------ |
| プロバイダー ID  | `vllm`                                     |
| API              | `openai-completions`（OpenAI互換）         |
| 認証             | `VLLM_API_KEY` 環境変数                    |
| デフォルト base URL | `http://127.0.0.1:8000/v1`              |
| ストリーミング使用量 | 対応（`stream_options.include_usage`） |

## はじめに

<Steps>
  <Step title="OpenAI互換サーバーで vLLM を起動する">
    base URL は `/v1` エンドポイント（`/v1/models`、`/v1/chat/completions`）を公開している必要があります。vLLM は一般的に次で実行されます。

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API キー環境変数を設定する">
    サーバーが認証を強制しない場合は、空でない任意の値で動作します。

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

<Tip>
非対話セットアップ（CI、スクリプト）では、base URL、キー、モデルを直接渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## モデル検出（暗黙的プロバイダー）

`VLLM_API_KEY` が設定されている（または認証プロファイルが存在する）かつ `models.providers.vllm` が定義されて**いない**場合、OpenClaw は `GET http://127.0.0.1:8000/v1/models` をクエリし、返された ID をモデルエントリに変換します。

<Note>
`models.providers.vllm` を明示的に設定した場合、OpenClaw は宣言済みのモデルのみを使用します。`agents.defaults.models` に `"vllm/*": {}` を追加すると、OpenClaw はその設定済みプロバイダーの `/models` エンドポイントもクエリし、公開されているすべての vLLM モデルを含めます。
</Note>

## 明示的な設定

vLLM が別のホストまたはポートで実行されている場合、`contextWindow`/`maxTokens` を固定したい場合、サーバーに実際の API キーが必要な場合、または信頼済みのループバック、LAN、Tailscale エンドポイントに接続する場合は、明示的に設定します。

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // 任意: 遅いローカルモデル向けにリクエストタイムアウトを延長
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

すべてのモデルを列挙せずにプロバイダーを動的に保つには、表示モデルカタログにワイルドカードを追加します。

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
    vLLM はネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI互換 `/v1` バックエンドとして扱われます。

    | 動作                                    | 適用されるか                     |
    | --------------------------------------- | -------------------------------- |
    | ネイティブ OpenAI リクエスト整形        | いいえ                           |
    | `service_tier`                          | 送信されません                   |
    | Responses `store`                       | 送信されません                   |
    | プロンプトキャッシュヒント              | 送信されません                   |
    | OpenAI reasoning 互換ペイロード整形     | 適用されません                   |
    | 非表示の OpenClaw 帰属ヘッダー          | カスタム base URL では注入されません |

  </Accordion>

  <Accordion title="Qwen thinking コントロール">
    Qwen モデルでは、サーバーが Qwen chat-template kwargs を期待する場合、モデル行に `compat.thinkingFormat: "qwen-chat-template"` を設定します。これらのモデルは、Qwen chat-template thinking が OpenAI 形式の effort 段階ではなくオン/オフフラグであるため、二値の `/think` プロファイル（`off`、`on`）を公開します。

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

    OpenClaw は `/think off` を次にマップします。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off` 以外の thinking レベルは `enable_thinking: true` を送信します。エンドポイントが代わりに DashScope 形式のトップレベルフラグを期待する場合は、`compat.thinkingFormat: "qwen"` を使用してリクエストルートに `enable_thinking` を送信します。

  </Accordion>

  <Accordion title="Nemotron 3 thinking コントロール">
    thinking オフの `vllm/nemotron-3-*` モデルでは、同梱 Plugin が次を送信します。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    これらの値をカスタマイズするには、モデル params の下に `chat_template_kwargs` を設定します。`params.extra_body.chat_template_kwargs` も設定した場合は、`extra_body` が最後のリクエストボディ上書きであるため、その値が優先されます。

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
    まず、vLLM がそのモデルに適したツール呼び出しパーサーとチャットテンプレートで起動されていることを確認します。vLLM は Qwen2.5 モデル向けに `hermes`、Qwen3-Coder モデル向けに `qwen3_xml` を文書化しています。

    症状: skills/tools が実行されない、アシスタントが `{"name":"read","arguments":...}` のような生の JSON/XML を出力する、または OpenClaw が `tool_choice: "auto"` を送信したときに vLLM が空の `tool_calls` 配列を返す。

    一部の Qwen/vLLM の組み合わせでは、リクエストが `tool_choice: "required"` を使用した場合にのみ構造化ツール呼び出しが返されます。モデルごとに `params.extra_body` で強制します。

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

    モデル ID は `openclaw models list --provider vllm` の正確な ID に置き換えるか、CLI から同じ上書きを適用します。

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    これはオプトインの回避策です。ツールを含むすべてのターンでツール呼び出しを強制するため、それが許容される専用モデルエントリにのみ使用してください。すべての vLLM モデルのグローバルデフォルトとして設定しないでください。また、任意のアシスタントテキストを実行可能なツール呼び出しに変換するプロキシと組み合わせないでください。

  </Accordion>

  <Accordion title="カスタム base URL">
    vLLM サーバーがデフォルト以外のホストまたはポートで実行されている場合は、明示的なプロバイダー設定で `baseUrl` を設定します。

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
  <Accordion title="初回応答が遅い、またはリモートサーバーがタイムアウトする">
    大きなローカルモデル、リモート LAN ホスト、または tailnet リンクでは、プロバイダー範囲のリクエストタイムアウトを設定します。

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

    `timeoutSeconds` は vLLM モデルの HTTP リクエストのみに適用されます。対象は、接続セットアップ、レスポンスヘッダー、ボディストリーミング、保護付き fetch 全体の中断です。また、このプロバイダーの暗黙の約 120 秒デフォルトより上に LLM アイドル/ストリーム watchdog の上限も引き上げます。エージェント実行全体を制御する `agents.defaults.timeoutSeconds` を増やすより、こちらを優先してください。

  </Accordion>

  <Accordion title="サーバーに到達できない">
    vLLM サーバーが実行中でアクセス可能であることを確認します。

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    接続エラーが表示される場合は、ホスト、ポート、および vLLM が OpenAI互換サーバーモードで起動していることを確認します。OpenClaw は、ループバック、LAN、Tailscale エンドポイント上の保護付きモデルリクエストについて、設定された正確な `models.providers.vllm.baseUrl` オリジンを信頼します。メタデータ/link-local オリジンは、明示的なオプトインなしでは引き続きブロックされます。vLLM リクエストが別のプライベートオリジンに到達する必要がある場合のみ `models.providers.vllm.request.allowPrivateNetwork: true` を設定し、正確なオリジン信頼をオプトアウトするには `false` を設定します。

  </Accordion>

  <Accordion title="リクエストで認証エラーが発生する">
    リクエストが認証エラーで失敗する場合は、サーバー設定に一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` の下でプロバイダーを明示的に設定します。

    <Tip>
    vLLM サーバーが認証を強制しない場合、`VLLM_API_KEY` の空でない任意の値が OpenClaw へのオプトインシグナルとして機能します。
    </Tip>

  </Accordion>

  <Accordion title="モデルが検出されない">
    自動検出には `VLLM_API_KEY` の設定が必要です。`models.providers.vllm` を定義している場合、`agents.defaults.models` に `"vllm/*": {}` が含まれていない限り、OpenClaw は宣言済みのモデルのみを使用します。
  </Accordion>

  <Accordion title="ツールが生テキストとしてレンダリングされる">
    Qwen モデルが skill を実行せずに JSON/XML ツール構文を出力する場合:

    - そのモデルに適したパーサー/テンプレートで vLLM を起動します。
    - `openclaw models list --provider vllm` で正確なモデル ID を確認します。
    - `tool_choice: "auto"` がまだ空またはテキストのみのツール呼び出しを返す場合にのみ、専用のモデルごとの `params.extra_body.tool_choice: "required"` 上書きを追加します。

  </Accordion>
</AccordionGroup>

<Warning>
詳細なヘルプ: [トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq)。
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
    認証の詳細と認証情報再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題とその解決方法。
  </Card>
</CardGroup>
