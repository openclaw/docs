---
read_when:
    - Moonshot K2（Moonshot Open Platform）と Kimi Coding のセットアップが必要な場合
    - 別々の endpoint、key、model ref を理解する必要がある場合
    - どちらの provider に対してもコピー＆ペースト可能な設定が必要な場合
summary: Moonshot K2 と Kimi Coding を設定する（別 provider + 別 key）
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T14:08:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e143632de7aff050f32917e379e21ace5f4a5f9857618ef720f885f2f298ca72
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI（Kimi）

Moonshot は OpenAI 互換 endpoint を持つ Kimi API を提供しています。provider を設定し、
デフォルト model を `moonshot/kimi-k2.6` に設定するか、
`kimi/kimi-code` で Kimi Coding を使用してください。

<Warning>
Moonshot と Kimi Coding は**別々の provider** です。key に互換性はなく、endpoint も異なり、model ref も異なります（`moonshot/...` と `kimi/...`）。
</Warning>

## 組み込み model カタログ

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | 名前                   | Reasoning | 入力        | コンテキスト | 最大出力 |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | いいえ    | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | いいえ    | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | はい      | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | はい      | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | いいえ    | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

現在の Moonshot ホスト K2 models に対するバンドル済みコスト見積もりは、Moonshot が公開している
従量課金レートを使用します: Kimi K2.6 はキャッシュヒットが $0.16/MTok、
入力が $0.95/MTok、出力が $4.00/MTok、Kimi K2.5 はキャッシュヒットが $0.10/MTok、
入力が $0.60/MTok、出力が $3.00/MTok です。その他のレガシーカタログ項目は、
config で上書きしない限り 0 コストのプレースホルダーのままです。

## はじめに

使いたい provider を選び、セットアップ手順に従ってください。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform 経由の Kimi K2 models。

    <Steps>
      <Step title="endpoint リージョンを選ぶ">
        | Auth choice            | Endpoint                       | リージョン    |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | International |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        または中国向け endpoint の場合:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="デフォルト model を設定する">
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
      <Step title="models が利用可能であることを確認する">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="ライブ smoke テストを実行する">
        通常のセッションに触れずに model アクセスとコスト
        トラッキングを確認したい場合は、分離した state dir を使用します:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 応答では `provider: "moonshot"` と
        `model: "kimi-k2.6"` が報告されるはずです。assistant transcript エントリには、
        Moonshot が使用量 metadata を返した場合、正規化された
        token 使用量と見積もりコストが `usage.cost` に保存されます。
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
    **最適な用途:** Kimi Coding endpoint 経由のコード重視タスク。

    <Note>
    Kimi Coding は、Moonshot（`moonshot/...`）とは異なる API key と provider 接頭辞（`kimi/...`）を使用します。従来の model ref `kimi/k2p5` は互換性 ID として引き続き受け付けられます。
    </Note>

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="デフォルト model を設定する">
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
      <Step title="model が利用可能であることを確認する">
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

## Kimi web search

OpenClaw には、Moonshot web
search をバックエンドとする `web_search` provider として **Kimi** も同梱されています。

<Steps>
  <Step title="対話式 web search セットアップを実行する">
    ```bash
    openclaw configure --section web
    ```

    web-search セクションで **Kimi** を選択すると、
    `plugins.entries.moonshot.config.webSearch.*` が保存されます。

  </Step>
  <Step title="web search のリージョンと model を設定する">
    対話セットアップでは次の内容を尋ねます:

    | 設定 | 選択肢 |
    | ------------------- | -------------------------------------------------------------------- |
    | API リージョン | `https://api.moonshot.ai/v1`（International）または `https://api.moonshot.cn/v1`（China） |
    | Web search model | デフォルトは `kimi-k2.6` |

  </Step>
</Steps>

config は `plugins.entries.moonshot.config.webSearch` 配下に保存されます:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // または KIMI_API_KEY / MOONSHOT_API_KEY を使用
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
  <Accordion title="ネイティブ thinking モード">
    Moonshot Kimi は 2 値のネイティブ thinking をサポートします:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    model ごとに `agents.defaults.models.<provider/model>.params` で設定します:

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

    OpenClaw は、実行時の `/think` level も Moonshot にマッピングします:

    | `/think` level       | Moonshot の動作           |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | off 以外の任意の level | `thinking.type=enabled`    |

    <Warning>
    Moonshot thinking が有効な場合、`tool_choice` は `auto` または `none` でなければなりません。OpenClaw は、互換性のために非互換な `tool_choice` 値を `auto` に正規化します。
    </Warning>

    Kimi K2.6 は、`reasoning_content` の複数 turn にわたる保持を制御する
    任意の `thinking.keep` フィールドも受け付けます。全 reasoning を turn 間で保持するには `"all"` に設定し、
    サーバーのデフォルト戦略を使用するには省略するか（または `null` のままにする）してください。OpenClaw は
    `thinking.keep` を `moonshot/kimi-k2.6` に対してのみ転送し、その他の models からは削除します。

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
    Moonshot Kimi は `functions.<name>:<index>` 形式の `tool_call id` を返します。OpenClaw は、複数 turn の tool call が動作し続けるよう、それらを変更せずに保持します。

    カスタム OpenAI 互換 provider で厳密なサニタイズを強制するには、`sanitizeToolCallIds: true` を設定してください:

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
    ネイティブ Moonshot endpoint（`https://api.moonshot.ai/v1` と
    `https://api.moonshot.cn/v1`）は、共有の `openai-completions` トランスポート上で
    ストリーミング使用量互換性を提供します。OpenClaw は endpoint capability に基づいてそれを判定するため、
    同じネイティブ Moonshot host を対象とする互換カスタム provider ID も同じ
    ストリーミング使用量動作を継承します。

    バンドル済みの K2.6 価格設定では、入力、出力、
    cache-read token を含むストリーミング使用量は、`/status`、`/usage full`、`/usage cost`、および transcript ベースのセッション
    会計向けに、ローカルの推定 USD コストにも変換されます。

  </Accordion>

  <Accordion title="endpoint と model ref のリファレンス">
    | Provider | Model ref 接頭辞 | Endpoint | 認証 env var |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot | `moonshot/` | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY` |
    | Moonshot CN| `moonshot/` | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` |
    | Kimi Coding| `kimi/` | Kimi Coding endpoint | `KIMI_API_KEY` |
    | Web search | N/A | Moonshot API リージョンと同じ | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi web search は `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使用し、デフォルトでは `https://api.moonshot.ai/v1` と model `kimi-k2.6` を使います。
    - 必要に応じて `models.providers` で価格設定とコンテキスト metadata を上書きしてください。
    - Moonshot が model に対して異なるコンテキスト制限を公開している場合は、`contextWindow` を適宜調整してください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    provider、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Web search" href="/ja-JP/tools/web" icon="magnifying-glass">
    Kimi を含む web search provider の設定。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    provider、models、plugins の完全な設定 schema。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API key 管理とドキュメント。
  </Card>
</CardGroup>
