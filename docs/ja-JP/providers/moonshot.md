---
read_when:
    - Moonshot K2（Moonshot Open Platform）と Kimi Coding の設定が必要です
    - 別々のエンドポイント、キー、モデル参照を理解する必要があります
    - どちらのプロバイダでも、そのままコピー/貼り付けできる設定が欲しいです
summary: Moonshot K2 と Kimi Coding の設定（別々のプロバイダ + キー）
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-21T04:50:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a04b0c45d55dbf8d56a04a1811f0850b800842ea501b212d44b53ff0680b5a2
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI（Kimi）

Moonshotは、OpenAI互換エンドポイントでKimi APIを提供します。プロバイダを設定し、デフォルトモデルを `moonshot/kimi-k2.6` に設定するか、`kimi/kimi-code` を使ってKimi Codingを利用できます。

<Warning>
MoonshotとKimi Codingは**別々のプロバイダ**です。キーは相互利用できず、エンドポイントも異なり、モデル参照も異なります（`moonshot/...` と `kimi/...`）。
</Warning>

## 組み込みモデルカタログ

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref | 名前 | Reasoning | 入力 | コンテキスト | 最大出力 |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6` | Kimi K2.6 | いいえ | text, image | 262,144 | 262,144 |
| `moonshot/kimi-k2.5` | Kimi K2.5 | いいえ | text, image | 262,144 | 262,144 |
| `moonshot/kimi-k2-thinking` | Kimi K2 Thinking | はい | text | 262,144 | 262,144 |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | はい | text | 262,144 | 262,144 |
| `moonshot/kimi-k2-turbo` | Kimi K2 Turbo | いいえ | text | 256,000 | 16,384 |

[//]: # "moonshot-kimi-k2-ids:end"

現在のMoonshotホストK2モデル向けのバンドル済みコスト見積もりは、Moonshotが公開している従量課金レートを使います。Kimi K2.6はキャッシュヒットが $0.16/MTok、入力が $0.95/MTok、出力が $4.00/MTok です。Kimi K2.5はキャッシュヒットが $0.10/MTok、入力が $0.60/MTok、出力が $3.00/MTok です。その他のレガシーカタログ項目は、設定で上書きしない限り、ゼロコストのプレースホルダのままです。

## はじめに

利用するプロバイダを選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform経由のKimi K2モデル。

    <Steps>
      <Step title="エンドポイントのリージョンを選ぶ">
        | 認証選択 | エンドポイント | リージョン |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key` | `https://api.moonshot.ai/v1` | International |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1` | China |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        中国向けエンドポイントを使う場合:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
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
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="liveスモークテストを実行する">
        通常のセッションに触れずにモデルアクセスとコスト追跡を確認したい場合は、分離された状態ディレクトリを使ってください:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON応答では `provider: "moonshot"` と `model: "kimi-k2.6"` が報告されるはずです。Moonshotが使用量メタデータを返す場合、アシスタントのトランスクリプト項目には、正規化されたトークン使用量と推定コストが `usage.cost` の下に保存されます。
      </Step>
    </Steps>

    ### 設定例

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
    **最適な用途:** Kimi Codingエンドポイント経由のコード重視タスク。

    <Note>
    Kimi Codingは、Moonshot（`moonshot/...`）とは異なるAPIキーとプロバイダ接頭辞（`kimi/...`）を使います。レガシーモデル参照 `kimi/k2p5` は、互換IDとして引き続き受け付けられます。
    </Note>

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを設定する">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="モデルが利用可能か確認する">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### 設定例

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## KimiのWeb検索

OpenClawには、Moonshot Web検索をバックエンドにした `web_search` プロバイダとして **Kimi** も同梱されています。

<Steps>
  <Step title="対話式Web検索セットアップを実行する">
    ```bash
    openclaw configure --section web
    ```

    Web検索セクションで **Kimi** を選ぶと、`plugins.entries.moonshot.config.webSearch.*` が保存されます。

  </Step>
  <Step title="Web検索のリージョンとモデルを設定する">
    対話式セットアップでは次を確認されます:

    | 設定 | 選択肢 |
    | ------------------- | -------------------------------------------------------------------- |
    | APIリージョン | `https://api.moonshot.ai/v1`（International）または `https://api.moonshot.cn/v1`（China） |
    | Web検索モデル | デフォルトは `kimi-k2.6` |

  </Step>
</Steps>

設定は `plugins.entries.moonshot.config.webSearch` の下に保存されます:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // または KIMI_API_KEY / MOONSHOT_API_KEY を使う
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

## 高度な内容

<AccordionGroup>
  <Accordion title="ネイティブthinking mode">
    Moonshot Kimiは二値のネイティブthinkingをサポートします:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    モデルごとの設定は `agents.defaults.models.<provider/model>.params` で行います:

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

    OpenClawは、Moonshot向け実行時 `/think` レベルも次のように対応付けます:

    | `/think` レベル | Moonshotの動作 |
    | -------------------- | -------------------------- |
    | `/think off` | `thinking.type=disabled` |
    | off以外の任意レベル | `thinking.type=enabled` |

    <Warning>
    Moonshotのthinkingが有効な場合、`tool_choice` は `auto` または `none` でなければなりません。OpenClawは、互換性のため非互換な `tool_choice` 値を `auto` に正規化します。
    </Warning>

    Kimi K2.6は、`reasoning_content` の複数ターン保持を制御する任意の `thinking.keep` フィールドも受け付けます。複数ターンで完全な推論を保持するには `"all"` に設定してください。サーバーデフォルト戦略を使うには省略するか（または `null` のままに）してください。OpenClawは、`thinking.keep` を `moonshot/kimi-k2.6` に対してのみ転送し、他のモデルからは取り除きます。

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

  <Accordion title="ストリーミング使用量互換性">
    ネイティブMoonshotエンドポイント（`https://api.moonshot.ai/v1` と `https://api.moonshot.cn/v1`）は、共有 `openai-completions` トランスポート上でストリーミング使用量互換性を公開します。OpenClawはこれをエンドポイントcapabilityに基づいて判定するため、同じネイティブMoonshotホストを対象にする互換カスタムプロバイダIDも同じストリーミング使用量動作を継承します。

    バンドル版K2.6価格設定では、入力、出力、キャッシュ読み取りトークンを含むストリーミング使用量も、`/status`、`/usage full`、`/usage cost`、およびトランスクリプトを基盤にしたセッション会計向けに、ローカル推定USDコストへ変換されます。

  </Accordion>

  <Accordion title="エンドポイントとモデル参照リファレンス">
    | プロバイダ | モデル参照接頭辞 | エンドポイント | 認証env var |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot | `moonshot/` | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY` |
    | Moonshot CN| `moonshot/` | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` |
    | Kimi Coding| `kimi/` | Kimi Coding endpoint | `KIMI_API_KEY` |
    | Web検索 | N/A | Moonshot APIリージョンと同じ | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi Web検索は `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使い、デフォルトでは `https://api.moonshot.ai/v1` とモデル `kimi-k2.6` を使います。
    - 必要に応じて、価格設定とコンテキストメタデータを `models.providers` で上書きしてください。
    - Moonshotがあるモデルについて異なるコンテキスト上限を公開した場合は、それに応じて `contextWindow` を調整してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダ、モデル参照、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Web検索" href="/tools/web-search" icon="magnifying-glass">
    Kimiを含むWeb検索プロバイダの設定。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダ、モデル、Plugin向けの完全な設定スキーマ。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot APIキー管理とドキュメント。
  </Card>
</CardGroup>
