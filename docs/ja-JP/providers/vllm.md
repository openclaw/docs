---
read_when:
    - ローカルの vLLM サーバーに対して OpenClaw を実行する場合
    - 独自のモデルで OpenAI 互換の /v1 エンドポイントを使用したい場合
summary: vLLM（OpenAI 互換ローカルサーバー）で OpenClaw を実行する
title: vLLM
x-i18n:
    generated_at: "2026-07-11T22:37:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM は、オープンソース（および一部のカスタム）モデルを **OpenAI 互換** HTTP API 経由で提供します。OpenClaw は `openai-completions` API を使用して接続し、`VLLM_API_KEY` でオプトインするとモデルを**自動検出**できます。

| プロパティ           | 値                                         |
| -------------------- | ------------------------------------------ |
| プロバイダー ID      | `vllm`                                     |
| API                  | `openai-completions`（OpenAI 互換）        |
| 認証                 | `VLLM_API_KEY` 環境変数                    |
| デフォルトのベース URL | `http://127.0.0.1:8000/v1`               |
| ストリーミング使用量 | 対応（`stream_options.include_usage`）     |

## はじめに

<Steps>
  <Step title="OpenAI 互換サーバーで vLLM を起動する">
    ベース URL は `/v1` エンドポイント（`/v1/models`、`/v1/chat/completions`）を公開する必要があります。vLLM は通常、次のアドレスで動作します。

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API キー環境変数を設定する">
    サーバーが認証を強制しない場合は、空でない任意の値を使用できます。

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="モデルを選択する">
    使用する vLLM モデル ID のいずれかに置き換えてください。

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
非対話型のセットアップ（CI、スクリプト処理）では、ベース URL、キー、モデルを直接渡します。

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## モデル検出（暗黙的なプロバイダー）

`VLLM_API_KEY` が設定されている（または認証プロファイルが存在する）状態で、`models.providers.vllm` が定義されて**いない**場合、OpenClaw は `GET http://127.0.0.1:8000/v1/models` を照会し、返された ID をモデルエントリに変換します。

<Note>
`models.providers.vllm` を明示的に設定した場合、OpenClaw は宣言されたモデルのみを使用します。`agents.defaults.models` に `"vllm/*": {}` を追加すると、OpenClaw は設定済みプロバイダーの `/models` エンドポイントも照会し、公開されているすべての vLLM モデルを含めます。
</Note>

## 明示的な設定

vLLM が別のホストまたはポートで動作している場合、`contextWindow`/`maxTokens` を固定したい場合、サーバーで実際の API キーが必要な場合、または信頼済みの loopback、LAN、Tailscale エンドポイントへ接続する場合は、明示的に設定します。

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

すべてのモデルを列挙せずにプロバイダーを動的な状態に保つには、表示されるモデルカタログにワイルドカードを追加します。

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
    vLLM はネイティブ OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換 `/v1` バックエンドとして扱われます。

    | 動作                                      | 適用されるか                           |
    | ----------------------------------------- | -------------------------------------- |
    | ネイティブ OpenAI リクエストの整形        | いいえ                                 |
    | `service_tier`                            | 送信されない                           |
    | Responses の `store`                      | 送信されない                           |
    | プロンプトキャッシュのヒント              | 送信されない                           |
    | OpenAI 推論互換ペイロードの整形           | 適用されない                           |
    | 非表示の OpenClaw 帰属ヘッダー            | カスタムベース URL には挿入されない    |

  </Accordion>

  <Accordion title="Qwen の思考制御">
    Qwen モデルでは、サーバーが Qwen チャットテンプレートのキーワード引数を期待する場合、モデル行に `compat.thinkingFormat: "qwen-chat-template"` を設定します。Qwen チャットテンプレートの思考は OpenAI 形式の労力レベルではなくオン／オフのフラグであるため、これらのモデルは二値の `/think` プロファイル（`off`、`on`）を公開します。

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

    OpenClaw は `/think off` を次のようにマッピングします。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off` 以外の思考レベルでは `enable_thinking: true` を送信します。エンドポイントが代わりに DashScope 形式のトップレベルフラグを期待する場合は、`compat.thinkingFormat: "qwen"` を使用してリクエストのルートに `enable_thinking` を送信します。

  </Accordion>

  <Accordion title="Nemotron 3 の思考制御">
    思考がオフの `vllm/nemotron-3-*` モデルでは、同梱の Plugin が次を送信します。

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    これらの値をカスタマイズするには、モデルパラメーターの下に `chat_template_kwargs` を設定します。`params.extra_body.chat_template_kwargs` も設定した場合、`extra_body` がリクエスト本文の最後のオーバーライドであるため、そちらの値が優先されます。

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
    まず、対象モデルに適したツール呼び出しパーサーとチャットテンプレートを使用して vLLM が起動されたことを確認してください。vLLM のドキュメントでは、Qwen2.5 モデルには `hermes`、Qwen3-Coder モデルには `qwen3_xml` が指定されています。

    症状としては、Skills／ツールがまったく実行されない、アシスタントが `{"name":"read","arguments":...}` のような未加工の JSON／XML を出力する、または OpenClaw が `tool_choice: "auto"` を送信したときに vLLM が空の `tool_calls` 配列を返す、といったものがあります。

    一部の Qwen／vLLM の組み合わせでは、リクエストが `tool_choice: "required"` を使用する場合にのみ、構造化されたツール呼び出しが返されます。`params.extra_body` を使用してモデルごとに強制できます。

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

    モデル ID を `openclaw models list --provider vllm` で得られる正確な ID に置き換えるか、CLI から同じオーバーライドを適用します。

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    これはオプトイン方式の回避策です。ツールを伴うすべてのターンでツール呼び出しを強制するため、それが許容される専用のモデルエントリにのみ使用してください。すべての vLLM モデルに対するグローバルデフォルトとして設定しないでください。また、任意のアシスタントテキストを実行可能なツール呼び出しに変換するプロキシと組み合わせないでください。

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
  <Accordion title="最初の応答が遅い、またはリモートサーバーがタイムアウトする">
    大規模なローカルモデル、リモート LAN ホスト、または tailnet 接続では、プロバイダー単位のリクエストタイムアウトを設定します。

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

    `timeoutSeconds` は vLLM モデルへの HTTP リクエスト（接続の確立、レスポンスヘッダー、本文のストリーミング、保護された fetch 全体の中断）にのみ適用されます。また、このプロバイダーに対する LLM のアイドル／ストリーム監視の上限を、暗黙的なデフォルトである約 120 秒より長くします。エージェント実行全体を制御する `agents.defaults.timeoutSeconds` を増やすより、こちらを優先してください。

  </Accordion>

  <Accordion title="サーバーに接続できない">
    vLLM サーバーが動作しており、アクセス可能であることを確認します。

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    接続エラーが表示される場合は、ホスト、ポート、および vLLM が OpenAI 互換サーバーモードで起動されていることを確認してください。OpenClaw は、loopback、LAN、Tailscale エンドポイントへの保護されたモデルリクエストについて、設定された正確な `models.providers.vllm.baseUrl` のオリジンを信頼します。メタデータ／リンクローカルのオリジンは、明示的にオプトインしない限り引き続きブロックされます。vLLM リクエストが別のプライベートオリジンへ到達する必要がある場合にのみ `models.providers.vllm.request.allowPrivateNetwork: true` を設定し、正確なオリジンへの信頼を無効にする場合は `false` を設定します。

  </Accordion>

  <Accordion title="リクエストの認証エラー">
    リクエストが認証エラーで失敗する場合は、サーバー設定と一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` でプロバイダーを明示的に設定してください。

    <Tip>
    vLLM サーバーが認証を強制しない場合は、空でない任意の `VLLM_API_KEY` 値が OpenClaw へのオプトインシグナルとして機能します。
    </Tip>

  </Accordion>

  <Accordion title="モデルが検出されない">
    自動検出には `VLLM_API_KEY` の設定が必要です。`models.providers.vllm` を定義している場合、`agents.defaults.models` に `"vllm/*": {}` が含まれていない限り、OpenClaw は宣言されたモデルのみを使用します。
  </Accordion>

  <Accordion title="ツールが未加工のテキストとして表示される">
    Qwen モデルが Skills を実行せず、JSON／XML のツール構文を出力する場合は、次を行います。

    - 対象モデルに適したパーサー／テンプレートを使用して vLLM を起動します。
    - `openclaw models list --provider vllm` で正確なモデル ID を確認します。
    - `tool_choice: "auto"` が引き続き空またはテキストのみのツール呼び出しを返す場合に限り、モデルごとに専用の `params.extra_body.tool_choice: "required"` オーバーライドを追加します。

  </Accordion>
</AccordionGroup>

<Warning>
詳しくは、[トラブルシューティング](/ja-JP/help/troubleshooting)および[よくある質問](/ja-JP/help/faq)を参照してください。
</Warning>

## 関連情報

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="OpenAI" href="/ja-JP/providers/openai" icon="bolt">
    ネイティブ OpenAI プロバイダーと OpenAI 互換ルートの動作。
  </Card>
  <Card title="OAuth と認証" href="/ja-JP/gateway/authentication" icon="key">
    認証の詳細と認証情報の再利用ルール。
  </Card>
  <Card title="トラブルシューティング" href="/ja-JP/help/troubleshooting" icon="wrench">
    一般的な問題とその解決方法。
  </Card>
</CardGroup>
