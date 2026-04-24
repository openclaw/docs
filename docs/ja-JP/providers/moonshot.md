---
read_when:
    - Moonshot K2（Moonshot Open Platform）と Kimi Coding のセットアップを行いたい場合
    - 別々の endpoint、key、model ref を理解する必要がある場合
    - どちらのプロバイダー向けにもコピー＆ペーストできる config が欲しい場合
summary: Moonshot K2 と Kimi Coding を設定する（別プロバイダー + 別キー）
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-24T05:15:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f9b833110aebc47f9f1f832ade48a2f13b269abd72a7ea2766ffb3af449feb9
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI（Kimi）

Moonshot は OpenAI 互換 endpoint を持つ Kimi API を提供します。provider を設定し、
デフォルトモデルを `moonshot/kimi-k2.6` に設定するか、
`kimi/kimi-code` を使って Kimi Coding を利用してください。

<Warning>
Moonshot と Kimi Coding は**別の provider**です。key は相互互換ではなく、endpoint も異なり、model ref も異なります（`moonshot/...` と `kimi/...`）。
</Warning>

## 組み込みモデルカタログ

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref | Name | Reasoning | Input | Context | Max output |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6` | Kimi K2.6 | いいえ | text, image | 262,144 | 262,144 |
| `moonshot/kimi-k2.5` | Kimi K2.5 | いいえ | text, image | 262,144 | 262,144 |
| `moonshot/kimi-k2-thinking` | Kimi K2 Thinking | はい | text | 262,144 | 262,144 |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | はい | text | 262,144 | 262,144 |
| `moonshot/kimi-k2-turbo` | Kimi K2 Turbo | いいえ | text | 256,000 | 16,384 |

[//]: # "moonshot-kimi-k2-ids:end"

現在の Moonshot ホスト K2 モデルに対する同梱コスト見積もりは、Moonshot が公開している
従量課金レートを使用します。Kimi K2.6 は $0.16/MTok の cache hit、
$0.95/MTok の input、$4.00/MTok の output、Kimi K2.5 は $0.10/MTok の cache hit、
$0.60/MTok の input、$3.00/MTok の output です。その他の旧式カタログエントリーは、
config で上書きしない限り、ゼロコストのプレースホルダーのままです。

## はじめに

provider を選んで、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform 経由で Kimi K2 モデルを使う場合。

    <Steps>
      <Step title="endpoint のリージョンを選ぶ">
        | Auth choice | Endpoint | Region |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key` | `https://api.moonshot.ai/v1` | International |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1` | China |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        China endpoint を使う場合:

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
      <Step title="ライブ smoke test を実行する">
        通常のセッションに触れずにモデルアクセスとコスト
        追跡を確認したい場合は、分離された state dir を使ってください。

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 応答には `provider: "moonshot"` と
        `model: "kimi-k2.6"` が報告されるはずです。assistant transcript エントリーには、正規化された
        token 使用量と、Moonshot が usage メタデータを返した場合は `usage.cost` 配下の推定コストが保存されます。
      </Step>
    </Steps>

    ### config 例

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
    **最適な用途:** Kimi Coding endpoint 経由でコード中心のタスクを実行する場合。

    <Note>
    Kimi Coding は、Moonshot（`moonshot/...`）とは異なる API key と provider prefix（`kimi/...`）を使います。旧式 model ref `kimi/k2p5` は互換 ID として引き続き受け付けられます。
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

    ### config 例

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

## Kimi Web 検索

OpenClaw には、Moonshot Web
検索をバックエンドにした `web_search` provider として **Kimi** も同梱されています。

<Steps>
  <Step title="対話型 Web 検索セットアップを実行する">
    ```bash
    openclaw configure --section web
    ```

    Web 検索セクションで **Kimi** を選ぶと、
    `plugins.entries.moonshot.config.webSearch.*` が保存されます。

  </Step>
  <Step title="Web 検索のリージョンとモデルを設定する">
    対話型セットアップでは次を尋ねられます。

    | Setting | Options |
    | ------------------- | -------------------------------------------------------------------- |
    | API リージョン | `https://api.moonshot.ai/v1`（international）または `https://api.moonshot.cn/v1`（China） |
    | Web 検索モデル | デフォルトは `kimi-k2.6` |

  </Step>
</Steps>

config は `plugins.entries.moonshot.config.webSearch` 配下にあります。

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

## 高度な設定

<AccordionGroup>
  <Accordion title="ネイティブ thinking mode">
    Moonshot Kimi はバイナリのネイティブ thinking をサポートします。

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    `agents.defaults.models.<provider/model>.params` を使って、モデルごとに設定します。

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

    OpenClaw は Moonshot に対してランタイム `/think` レベルもマップします。

    | `/think` level | Moonshot の動作 |
    | -------------------- | -------------------------- |
    | `/think off` | `thinking.type=disabled` |
    | off 以外の任意のレベル | `thinking.type=enabled` |

    <Warning>
    Moonshot の thinking が有効な場合、`tool_choice` は `auto` または `none` でなければなりません。OpenClaw は互換性のため、互換性のない `tool_choice` 値を `auto` に正規化します。
    </Warning>

    Kimi K2.6 はさらに任意の `thinking.keep` フィールドを受け付けます。これは
    `reasoning_content` をマルチターンで保持するかを制御します。ターンをまたいで完全な
    reasoning を保持するには `"all"` に設定してください。省略する（または `null` のままにする）と、
    サーバーデフォルトの戦略が使われます。OpenClaw は `thinking.keep` を
    `moonshot/kimi-k2.6` に対してのみ転送し、他のモデルからは除去します。

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

  <Accordion title="tool call id のサニタイズ">
    Moonshot Kimi は `functions.<name>:<index>` 形式の tool_call id を返します。OpenClaw はそれらを変更せず保持するため、マルチターン tool call が引き続き動作します。

    custom OpenAI-compatible provider に対して厳格なサニタイズを強制するには、`sanitizeToolCallIds: true` を設定します。

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

  <Accordion title="ストリーミング usage 互換性">
    ネイティブ Moonshot endpoint（`https://api.moonshot.ai/v1` と
    `https://api.moonshot.cn/v1`）は、
    共有 `openai-completions` トランスポート上でストリーミング usage 互換性を公開します。OpenClaw はこれを endpoint
    capabilities に基づいて判断するため、同じネイティブ
    Moonshot host を対象とする互換 custom provider id も同じ streaming-usage 挙動を継承します。

    同梱の K2.6 価格設定では、input、output、
    cache-read token を含む streamed usage も、`/status`, `/usage full`, `/usage cost`、および transcript ベースのセッション
    集計用に、ローカル推定 USD コストへ変換されます。

  </Accordion>

  <Accordion title="endpoint と model ref リファレンス">
    | Provider | Model ref prefix | Endpoint | Auth env var |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot | `moonshot/` | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY` |
    | Moonshot CN| `moonshot/` | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` |
    | Kimi Coding| `kimi/` | Kimi Coding endpoint | `KIMI_API_KEY` |
    | Web search | N/A | Moonshot API リージョンと同じ | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi Web 検索は `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使い、デフォルトでは `https://api.moonshot.ai/v1` とモデル `kimi-k2.6` を使用します。
    - 必要に応じて `models.providers` で価格とコンテキストメタデータを上書きしてください。
    - Moonshot がモデルごとに異なるコンテキスト上限を公開している場合は、それに応じて `contextWindow` を調整してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Web search" href="/ja-JP/tools/web" icon="magnifying-glass">
    Kimi を含む Web 検索プロバイダーの設定。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、Plugins 向けの完全な config schema。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API key 管理とドキュメント。
  </Card>
</CardGroup>
