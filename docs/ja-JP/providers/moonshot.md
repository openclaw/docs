---
read_when:
    - Moonshot K2（Moonshot Open Platform）と Kimi Coding のセットアップの違い
    - 別々のエンドポイント、キー、モデル参照を理解する必要があります
    - どちらのプロバイダーでも使えるコピー＆ペースト用設定が必要な場合
summary: Moonshot K2 と Kimi Coding を構成する（別々のプロバイダー + キー）
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T12:45:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot は OpenAI 互換エンドポイントで Kimi API を提供します。provider を設定し、
デフォルトモデルを `moonshot/kimi-k2.6` に設定するか、
`kimi/kimi-for-coding` で Kimi Coding を使用します。

<Warning>
Moonshot と Kimi Coding は**別々の providers**です。キーに互換性はなく、エンドポイントは異なり、モデル refs も異なります（`moonshot/...` と `kimi/...`）。
</Warning>

## 組み込みモデルカタログ

[//]: # "moonshot-kimi-k2-ids:start"

| モデル ref                         | 名前                   | 推論 | 入力       | コンテキスト | 最大出力 |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | いいえ        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 常時オン | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | いいえ        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | はい       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | はい       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | いいえ        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

現在の Moonshot ホスト型 K2 モデルのカタログコスト見積もりは、Moonshot が公開している従量課金レートを使用します。Kimi K2.7 Code はキャッシュヒットが $0.19/MTok、
入力が $0.95/MTok、出力が $4.00/MTok です。Kimi K2.6 はキャッシュヒットが $0.16/MTok、
入力が $0.95/MTok、出力が $4.00/MTok です。Kimi K2.5 はキャッシュヒットが $0.10/MTok、
入力が $0.60/MTok、出力が $3.00/MTok です。他のレガシーカタログエントリは、config で上書きしない限り、
ゼロコストのプレースホルダーを維持します。

Kimi K2.7 Code は常にネイティブ思考を使用します。OpenClaw はこのモデルについて `on`
の思考状態だけを公開し、Moonshot の要件に従って送信時の `thinking` と
`reasoning_effort` の制御を省略します。OpenClaw はまた、
K2.7 が provider デフォルトに固定するサンプリング上書きも省略します。Kimi K2.6 は引き続き
オンボーディングのデフォルトです。

## はじめに

provider を選び、セットアップ手順に従います。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform 経由の Kimi K2 モデル。

    <Steps>
      <Step title="エンドポイントリージョンを選択">
        | 認証の選択            | エンドポイント                       | リージョン        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国際 |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国         |
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        または中国エンドポイントの場合:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="デフォルトモデルを設定">
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
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="ライブスモークテストを実行">
        通常のセッションに触れずにモデルアクセスとコスト追跡を確認したい場合は、
        分離した状態ディレクトリを使用します。

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON レスポンスでは `provider: "moonshot"` と
        `model: "kimi-k2.6"` が報告されるはずです。Moonshot が使用量メタデータを返す場合、
        assistant transcript エントリには正規化されたトークン使用量と推定コストが
        `usage.cost` の下に保存されます。
      </Step>
    </Steps>

    ### Config の例

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    公式 Plugin をインストールしてから、Gateway を再起動します。

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **最適な用途:** Kimi Coding エンドポイント経由のコード重視タスク。

    <Note>
    Kimi Coding は Moonshot（`moonshot/...`）とは異なる API キーと provider プレフィックス（`kimi/...`）を使用します。安定版 API モデル ref は `kimi/kimi-for-coding` です。レガシー refs の `kimi/kimi-code` と `kimi/k2p5` は引き続き受け付けられ、その API モデル id に正規化されます。
    </Note>

    <Steps>
      <Step title="Plugin をインストール">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="オンボーディングを実行">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="デフォルトモデルを設定">
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
      <Step title="モデルが利用可能であることを確認">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Config の例

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

Moonshot Plugin は、Moonshot Web 検索を基盤とする `web_search` provider として **Kimi** も登録します。

<Steps>
  <Step title="対話型 Web 検索セットアップを実行">
    ```bash
    openclaw configure --section web
    ```

    web-search セクションで **Kimi** を選択し、
    `plugins.entries.moonshot.config.webSearch.*` を保存します。

  </Step>
  <Step title="Web 検索リージョンとモデルを設定">
    対話型セットアップでは次の入力を求められます。

    | 設定             | オプション                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API リージョン          | `https://api.moonshot.ai/v1`（国際）または `https://api.moonshot.cn/v1`（中国） |
    | Web 検索モデル    | デフォルトは `kimi-k2.6`                                             |

  </Step>
</Steps>

Config は `plugins.entries.moonshot.config.webSearch` の下にあります。

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

## 高度な構成

<AccordionGroup>
  <Accordion title="ネイティブ思考モード">
    Kimi K2.7 Code は常にネイティブ思考を使用します。Moonshot はこのモデルについてクライアントに
    `thinking` フィールドの省略を要求するため、OpenClaw は `on` だけを公開し、
    古い `off` 設定は無視します。K2.7 は `temperature`、`top_p`、`n`、
    `presence_penalty`、`frequency_penalty` も固定します。OpenClaw はこれらのフィールドに対して設定された
    上書きを省略します。

    他の Moonshot Kimi モデルはバイナリのネイティブ思考をサポートします。

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

    OpenClaw はそれらのモデルに対し、実行時の `/think` レベルを次のようにマッピングします。

    | `/think` レベル       | Moonshot の動作          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | off 以外の任意のレベル    | `thinking.type=enabled`    |

    <Warning>
    Moonshot の思考が有効な場合、`tool_choice` は `auto` または `none` である必要があります。OpenClaw は互換性のない値を `auto` に正規化します。これには Kimi K2.7 Code も含まれます。このモデルの思考モードは、固定された tool choice を維持するために無効化できません。
    </Warning>

    Kimi K2.6 は、`reasoning_content` の複数ターン保持を制御する任意の `thinking.keep` フィールドも受け付けます。ターンをまたいで完全な推論を保持するには `"all"` に設定します。省略するか `null` のままにすると、サーバーのデフォルト戦略が使用されます。OpenClaw は `moonshot/kimi-k2.6` に対してのみ `thinking.keep` を転送し、他のモデルからは削除します。Kimi K2.7 Code はデフォルトで完全な推論履歴を保持し、OpenClaw は `thinking` フィールド全体を省略します。

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
    Moonshot Kimi は `functions.<name>:<index>` の形式のネイティブ tool_call ID を提供します。OpenAI-completions トランスポートでは、OpenClaw は各ネイティブ Kimi ID の最初の出現を保持し、後続の重複を決定的な OpenAI スタイルの `call_*` ID に書き換えます。一致するツール結果も同じ ID で再マッピングされるため、Kimi の最初のネイティブ ID を削除せずに、リプレイの一意性を保てます。

    カスタムの OpenAI 互換プロバイダーで厳密なサニタイズを強制するには、`sanitizeToolCallIds: true` を設定します。

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

  <Accordion title="ストリーミング usage の互換性">
    ネイティブ Moonshot エンドポイント（`https://api.moonshot.ai/v1` と
    `https://api.moonshot.cn/v1`）は、共有 `openai-completions` トランスポート上でストリーミング usage の互換性を公開します。OpenClaw はこれをエンドポイントの機能に基づいて判定するため、同じネイティブ Moonshot ホストを対象とする互換カスタムプロバイダー ID は、同じ streaming-usage 動作を継承します。

    カタログの K2.6 料金では、入力、出力、cache-read トークンを含むストリーミング usage も、`/status`、`/usage full`、`/usage cost`、およびトランスクリプトに裏付けられたセッション会計向けに、ローカルの推定 USD コストへ変換されます。

  </Accordion>

  <Accordion title="エンドポイントとモデル参照リファレンス">
    | プロバイダー   | モデル参照プレフィックス | エンドポイント                      | 認証環境変数        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding エンドポイント          | `KIMI_API_KEY`      |
    | Web search | N/A              | Moonshot API リージョンと同じ   | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi web search は `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使用し、デフォルトではモデル `kimi-k2.6` で `https://api.moonshot.ai/v1` を使用します。
    - 必要に応じて、`models.providers` で料金とコンテキストメタデータを上書きします。
    - Moonshot がモデルに対して異なるコンテキスト上限を公開している場合は、それに応じて `contextWindow` を調整します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="Web search" href="/ja-JP/tools/web" icon="magnifying-glass">
    Kimi を含む web search プロバイダーの設定。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、plugins の完全な設定スキーマ。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API キー管理とドキュメント。
  </Card>
</CardGroup>
