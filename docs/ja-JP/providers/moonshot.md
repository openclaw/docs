---
read_when:
    - Moonshot K2（Moonshot Open Platform）と Kimi Coding のセットアップの違いを確認したい場合
    - 個別のエンドポイント、キー、モデル参照を理解する必要があります
    - どちらのプロバイダーについてもコピー＆ペーストできる設定が必要な場合
summary: Moonshot K2 と Kimi Coding の設定（プロバイダーとキーは別々）
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-11T22:38:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot は、OpenAI 互換エンドポイントを備えた Kimi API を提供します。Moonshot Open Platform ではデフォルトモデルを `moonshot/kimi-k2.6` に、Kimi Coding では `kimi/kimi-for-coding` に設定します。

<Warning>
Moonshot と Kimi Coding は**別々のプロバイダー**であり、それぞれ個別の外部 Plugin として提供されます。キーに互換性はなく、エンドポイントもモデル参照も異なります（`moonshot/...` と `kimi/...`）。
</Warning>

## 組み込みモデルカタログ

[//]: # "moonshot-kimi-k2-ids:start"

| モデル参照                        | 名前                   | 推論       | 入力             | コンテキスト | 最大出力 |
| --------------------------------- | ---------------------- | ---------- | ---------------- | -------------- | -------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | なし       | テキスト、画像   | 262,144        | 262,144  |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 常時有効   | テキスト、画像   | 262,144        | 262,144  |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | なし       | テキスト、画像   | 262,144        | 262,144  |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | あり       | テキスト         | 262,144        | 262,144  |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | あり       | テキスト         | 262,144        | 262,144  |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | なし       | テキスト         | 256,000        | 16,384   |

[//]: # "moonshot-kimi-k2-ids:end"

カタログのコスト見積もりには、Moonshot が公開している従量課金レートを使用します。Kimi K2.7 Code はキャッシュヒットが $0.19/MTok、入力が $0.95/MTok、出力が $4.00/MTok、Kimi K2.6 はキャッシュヒットが $0.16/MTok、入力が $0.95/MTok、出力が $4.00/MTok、Kimi K2.5 はキャッシュヒットが $0.10/MTok、入力が $0.60/MTok、出力が $3.00/MTok です。その他のカタログ項目では、設定で上書きしない限り、コスト 0 のプレースホルダーが維持されます。

Kimi K2.7 Code は常にネイティブ推論を使用します。Moonshot の要件に従い、OpenClaw はこのモデルに対して `on` の推論状態のみを公開し、送信する `thinking` および `reasoning_effort` フィールドを省略します。また、K2.7 ではプロバイダーのデフォルト値に固定されるため、サンプリングの上書き（`temperature`、`top_p`、`n`、`presence_penalty`、`frequency_penalty`）も省略します。Kimi K2.6 は引き続きオンボーディングのデフォルトです。

## はじめに

Moonshot と Kimi Coding はどちらも外部 Plugin です。オンボーディングの前に、いずれかをインストールしてください。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform 経由での Kimi K2 モデルの利用。

    <Steps>
      <Step title="Plugin をインストールする">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="エンドポイントのリージョンを選択する">
        | 認証方式               | エンドポイント                 | リージョン |
        | ---------------------- | ------------------------------ | ---------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国際       |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国       |
      </Step>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        中国向けエンドポイントを使用する場合:

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
      <Step title="ライブスモークテストを実行する">
        通常のセッションに影響を与えず、モデルへのアクセスとコスト追跡を確認する場合は、分離した状態ディレクトリを使用します。

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 応答には `provider: "moonshot"` と `model: "kimi-k2.6"` が含まれる必要があります。Moonshot が使用量メタデータを返した場合、アシスタントのトランスクリプト項目には、正規化されたトークン使用量と推定コストが `usage.cost` の下に保存されます。
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
    **最適な用途:** Kimi Coding エンドポイントを使用する、コードに特化したタスク。

    <Note>
    Kimi Coding は、Moonshot（`moonshot/...`）とは異なる API キーとプロバイダープレフィックス（`kimi/...`）を使用します。安定版のモデル参照は `kimi/kimi-for-coding` です。従来の参照 `kimi/kimi-code` と `kimi/k2p5` も引き続き受け付けられ、このモデル ID に正規化されます。
    </Note>

    <Steps>
      <Step title="Plugin をインストールする">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
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
              model: { primary: "kimi/kimi-for-coding" },
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

## Kimi ウェブ検索

Moonshot Plugin は、Moonshot ウェブ検索を基盤とする `web_search` プロバイダーとして **Kimi** も登録します。

<Steps>
  <Step title="対話型のウェブ検索セットアップを実行する">
    ```bash
    openclaw configure --section web
    ```

    ウェブ検索セクションで **Kimi** を選択し、`plugins.entries.moonshot.config.webSearch.*` を保存します。

  </Step>
  <Step title="ウェブ検索のリージョンとモデルを設定する">
    対話型セットアップでは、次の項目の入力を求められます。

    | 設定                 | 選択肢                                                               |
    | -------------------- | -------------------------------------------------------------------- |
    | API リージョン       | `https://api.moonshot.ai/v1`（国際）または `https://api.moonshot.cn/v1`（中国） |
    | ウェブ検索モデル     | デフォルトは `kimi-k2.6`                                             |

  </Step>
</Steps>

設定は `plugins.entries.moonshot.config.webSearch` の下に保存されます。

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
  <Accordion title="ネイティブ推論モード">
    Kimi K2.7 Code は常にネイティブ推論を使用します。Moonshot は、このモデルについてクライアントが `thinking` フィールドを省略することを要求するため、OpenClaw は `on` のみを公開し、古い `off` 設定を無視します。K2.7 では `temperature`、`top_p`、`n`、`presence_penalty`、`frequency_penalty` も固定されます。そのため、OpenClaw はこれらのフィールドに設定された上書きを省略します。

    その他の Moonshot Kimi モデルでは、二値のネイティブ推論をサポートします。

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    `agents.defaults.models.<provider/model>.params` を使用して、モデルごとに設定します。

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

    OpenClaw は、これらのモデルに対する実行時の `/think` レベルを次のように対応付けます。

    | `/think` レベル      | Moonshot の動作             |
    | -------------------- | --------------------------- |
    | `/think off`         | `thinking.type=disabled`    |
    | `off` 以外のレベル   | `thinking.type=enabled`     |

    <Warning>
    Moonshot の推論が有効な場合、`tool_choice` は `auto` または `none` でなければなりません。固定されたツール選択（`type: "tool"` または `type: "function"`）では、要求されたツールを引き続き実行できるよう、代わりに推論が強制的に `disabled` に戻されます。`tool_choice: "required"` は、代わりに `auto` に正規化されます。これは、推論モードを無効にできない Kimi K2.7 Code を除くすべての Moonshot モデルに適用されます。Kimi K2.7 Code の `tool_choice` は、互換性がない場合に `auto` に正規化されます。
    </Warning>

    Kimi K2.6 は、`reasoning_content` の複数ターンにわたる保持を制御するオプションの `thinking.keep` フィールドにも対応しています。ターン間ですべての推論を保持するには `"all"` に設定します。サーバーのデフォルト戦略を使用するには、このフィールドを省略する（または `null` のままにする）ようにしてください。OpenClaw は `moonshot/kimi-k2.6` に対してのみ `thinking.keep` を転送し、他のモデルではこれを削除します。Kimi K2.7 Code はデフォルトですべての推論履歴を保持し、その場合 OpenClaw は `thinking` フィールド全体を省略します。

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
    Moonshot Kimi は、`functions.<name>:<index>` 形式のネイティブ `tool_call` ID を返します。OpenClaw は、各ネイティブ Kimi ID の最初の出現を保持し、後続の重複を決定的な OpenAI 形式の `call_*` ID に書き換えます。対応するツール結果も同じ ID に再マッピングされるため、Kimi の最初のネイティブ ID を削除することなく、リプレイ時の一意性が維持されます。この動作は同梱の Moonshot プロバイダーに組み込まれており、ユーザーが設定できる項目ではありません。
  </Accordion>

  <Accordion title="ストリーミング使用量の互換性">
    Moonshot のネイティブエンドポイント（`https://api.moonshot.ai/v1` および
    `https://api.moonshot.cn/v1`）は、ストリーミング使用量との互換性を明示しています。
    OpenClaw はこれをプロバイダー ID ではなくエンドポイントのホストに基づいて判定するため、同じ
    Moonshot ネイティブホストを指すカスタムプロバイダー ID にも、同じ
    ストリーミング使用量の動作が適用されます。

    カタログの K2.6 料金設定では、入力、出力、
    キャッシュ読み取りトークンを含むストリーミング使用量も、`/status`、`/usage full`、
    `/usage cost`、およびトランスクリプトに基づくセッション会計向けに、ローカルで推定される米ドルコストへ
    換算されます。

  </Accordion>

  <Accordion title="エンドポイントとモデル参照のリファレンス">
    | プロバイダー | モデル参照のプレフィックス | エンドポイント                 | 認証環境変数        |
    | ------------ | -------------------------- | ------------------------------ | ------------------- |
    | Moonshot     | `moonshot/`                | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN  | `moonshot/`                | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding  | `kimi/`                    | Kimi Coding エンドポイント     | `KIMI_API_KEY`      |
    | ウェブ検索   | 該当なし                   | Moonshot API と同じリージョン   | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi ウェブ検索は `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使用し、デフォルトではモデル `kimi-k2.6` と `https://api.moonshot.ai/v1` を使用します。
    - 必要に応じて、`models.providers` で料金とコンテキストのメタデータを上書きします。
    - Moonshot がモデルについて異なるコンテキスト制限を公開している場合は、それに応じて `contextWindow` を調整します。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択方法。
  </Card>
  <Card title="ウェブ検索" href="/ja-JP/tools/web" icon="magnifying-glass">
    Kimi を含むウェブ検索プロバイダーの設定方法。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、Plugin の完全な設定スキーマ。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API キーの管理とドキュメント。
  </Card>
</CardGroup>
