---
read_when:
    - Moonshot K2 (Moonshot Open Platform) と Kimi Coding のセットアップを比較したい場合
    - 個別のエンドポイント、キー、モデル参照を理解する必要があります
    - どちらのプロバイダーでもコピー＆ペーストできる設定が必要な場合
summary: Moonshot K2 と Kimi Coding を設定する（プロバイダーとキーは別々）
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T19:50:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot は OpenAI 互換エンドポイントで Kimi API を提供します。
プロバイダーを構成して既定のモデルを `moonshot/kimi-k2.6` に設定するか、
`kimi/kimi-for-coding` で Kimi Coding を使用します。

<Warning>
Moonshot と Kimi Coding は**別々のプロバイダー**です。キーに互換性はなく、エンドポイントは異なり、モデル参照も異なります（`moonshot/...` と `kimi/...`）。
</Warning>

## 組み込みモデルカタログ

[//]: # "moonshot-kimi-k2-ids:start"

| モデル参照                        | 名前                   | 推論     | 入力             | コンテキスト | 最大出力   |
| --------------------------------- | ---------------------- | -------- | ---------------- | ------------ | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | いいえ   | テキスト、画像   | 262,144      | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | いいえ   | テキスト、画像   | 262,144      | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | はい     | テキスト         | 262,144      | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | はい     | テキスト         | 262,144      | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | いいえ   | テキスト         | 256,000      | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

現在の Moonshot ホスト型 K2 モデルに同梱されているコスト見積もりは、Moonshot が公開している従量課金レートを使用します。Kimi K2.6 はキャッシュヒットが $0.16/MTok、入力が $0.95/MTok、出力が $4.00/MTok です。Kimi K2.5 はキャッシュヒットが $0.10/MTok、入力が $0.60/MTok、出力が $3.00/MTok です。その他のレガシーカタログエントリは、config で上書きしない限り、ゼロコストのプレースホルダーを維持します。

## はじめに

プロバイダーを選択し、セットアップ手順に従います。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform 経由の Kimi K2 モデル。

    <Steps>
      <Step title="エンドポイントのリージョンを選択する">
        | 認証の選択             | エンドポイント                 | リージョン |
        | ---------------------- | ------------------------------ | ---------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国際       |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国       |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        中国エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="既定のモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="ライブスモークテストを実行する">
        通常のセッションに影響を与えずにモデルアクセスとコスト追跡を確認したい場合は、分離された状態ディレクトリを使用します。

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON レスポンスには `provider: "moonshot"` と `model: "kimi-k2.6"` が報告されるはずです。Moonshot が使用量メタデータを返す場合、アシスタントのトランスクリプトエントリには、正規化されたトークン使用量と推定コストが `usage.cost` の下に保存されます。
      </Step>
    </Steps>

    ### config の例

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **最適な用途:** Kimi Coding エンドポイント経由のコード重視タスク。

    <Note>
    Kimi Coding は、Moonshot（`moonshot/...`）とは異なる API キーとプロバイダープレフィックス（`kimi/...`）を使用します。安定版 API モデル参照は `kimi/kimi-for-coding` です。レガシー参照の `kimi/kimi-code` と `kimi/k2p5` も引き続き受け付けられ、その API モデル ID に正規化されます。
    </Note>

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="既定のモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### config の例

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi Web 検索

OpenClaw は Moonshot Web 検索を基盤とする `web_search` プロバイダーとして **Kimi** も同梱しています。

<Steps>
  <Step title="対話型の Web 検索セットアップを実行する">
    ```bash
    openclaw configure --section web
    ```

    Web 検索セクションで **Kimi** を選択し、
    `plugins.entries.moonshot.config.webSearch.*` を保存します。

  </Step>
  <Step title="Web 検索のリージョンとモデルを設定する">
    対話型セットアップでは次の入力を求められます。

    | 設定             | オプション                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API リージョン          | `https://api.moonshot.ai/v1` (国際) または `https://api.moonshot.cn/v1` (中国) |
    | Web 検索モデル    | デフォルトは `kimi-k2.6`                                             |

  </Step>
</Steps>

設定は `plugins.entries.moonshot.config.webSearch` 配下にあります。

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="ネイティブ思考モード">
    Moonshot Kimi はバイナリのネイティブ思考に対応しています。

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    モデルごとに `agents.defaults.models.<provider/model>.params` で設定します。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw は Moonshot 向けにランタイムの `/think` レベルもマッピングします。

    | `/think` レベル       | Moonshot の動作          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | off 以外の任意のレベル    | `thinking.type=enabled`    |

    <Warning>
    Moonshot の思考が有効な場合、`tool_choice` は `auto` または `none` である必要があります。OpenClaw は互換性のため、互換性のない `tool_choice` 値を `auto` に正規化します。
    </Warning>

    Kimi K2.6 は、`reasoning_content` の複数ターン保持を制御する任意の `thinking.keep` フィールドも受け付けます。ターンをまたいで完全な推論を保持するには `"all"` に設定します。サーバーのデフォルト戦略を使用するには、省略します（または `null` のままにします）。OpenClaw は `thinking.keep` を `moonshot/kimi-k2.6` に対してのみ転送し、他のモデルからは取り除きます。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ツール呼び出し ID のサニタイズ">
    Moonshot Kimi は `functions.<name>:<index>` の形をした tool_call ID を提供します。OpenClaw はそれらを変更せずに保持するため、複数ターンのツール呼び出しが動作し続けます。

    カスタム OpenAI 互換プロバイダーで厳密なサニタイズを強制するには、`sanitizeToolCallIds: true` を設定します。

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ストリーミング使用量の互換性">
    ネイティブの Moonshot エンドポイント（`https://api.moonshot.ai/v1` と
    `https://api.moonshot.cn/v1`）は、共有の `openai-completions` トランスポート上でストリーミング使用量の互換性を告知します。OpenClaw はこれをエンドポイント機能に基づいて判断するため、同じネイティブ Moonshot ホストを対象にする互換性のあるカスタムプロバイダー ID は、同じストリーミング使用量の動作を継承します。

    バンドルされた K2.6 の価格設定では、入力、出力、キャッシュ読み取りトークンを含むストリーミングされた使用量も、`/status`、`/usage full`、`/usage cost`、およびトランスクリプトに基づくセッション会計向けに、ローカルの推定 USD コストへ変換されます。

  </Accordion>

  <Accordion title="エンドポイントとモデル参照リファレンス">
    | プロバイダー   | モデル参照プレフィックス | エンドポイント                      | 認証環境変数        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding エンドポイント          | `KIMI_API_KEY`      |
    | Web 検索 | N/A              | Moonshot API リージョンと同じ   | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi Web 検索は `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使用し、デフォルトではモデル `kimi-k2.6` とともに `https://api.moonshot.ai/v1` を使用します。
    - 必要に応じて `models.providers` で料金とコンテキストメタデータを上書きします。
    - Moonshot がモデルに対して異なるコンテキスト制限を公開している場合は、それに応じて `contextWindow` を調整します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Web 検索" href="/ja-JP/tools/web" icon="magnifying-glass">
    Kimi を含む Web 検索プロバイダーの設定。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、plugins の完全な設定スキーマ。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API キー管理とドキュメント。
  </Card>
</CardGroup>
