---
read_when:
    - Moonshot K2 (Moonshot Open Platform) と Kimi Coding セットアップの比較
    - 個別のエンドポイント、キー、モデル参照を理解する必要があります
    - どちらのプロバイダーにも使えるコピー＆ペースト用設定が必要な場合
summary: Moonshot K2 と Kimi Coding を設定する（別々のプロバイダー + キー）
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-05T11:40:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot は、OpenAI 互換エンドポイントを備えた Kimi API を提供します。Moonshot Open Platform ではデフォルトモデルを `moonshot/kimi-k2.6` に、Kimi Coding では `kimi/kimi-for-coding` に設定します。

<Warning>
Moonshot と Kimi Coding は**別々のプロバイダー**であり、それぞれ個別の外部 Plugin として出荷されます。キーは相互に使えず、エンドポイントも異なり、モデル参照も異なります（`moonshot/...` と `kimi/...`）。
</Warning>

## 組み込みモデルカタログ

[//]: # "moonshot-kimi-k2-ids:start"

| モデル参照                        | 名前                   | 推論      | 入力        | コンテキスト | 最大出力 |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | いいえ    | テキスト, 画像 | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 常時オン  | テキスト, 画像 | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | いいえ    | テキスト, 画像 | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | はい      | テキスト        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | はい      | テキスト        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | いいえ    | テキスト        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

カタログのコスト見積もりは、Moonshot が公開している従量課金料金を使用します。Kimi K2.7 Code はキャッシュヒットが $0.19/MTok、入力が $0.95/MTok、出力が $4.00/MTok です。Kimi K2.6 はキャッシュヒットが $0.16/MTok、入力が $0.95/MTok、出力が $4.00/MTok です。Kimi K2.5 はキャッシュヒットが $0.10/MTok、入力が $0.60/MTok、出力が $3.00/MTok です。その他のカタログ項目は、設定で上書きしない限りゼロコストのプレースホルダーのままです。

Kimi K2.7 Code は常にネイティブ思考を使用します。Moonshot の要件に従い、OpenClaw はこのモデルに対して `on` の思考状態のみを公開し、送信時の `thinking` フィールドと `reasoning_effort` フィールドを省略します。また、K2.7 がプロバイダーのデフォルトに固定するサンプリング上書き（`temperature`, `top_p`, `n`, `presence_penalty`, `frequency_penalty`）も省略します。Kimi K2.6 はオンボーディングのデフォルトのままです。

## はじめに

Moonshot と Kimi Coding はどちらも外部 Plugin です。オンボーディング前にいずれかをインストールしてください。

<Tabs>
  <Tab title="Moonshot API">
    **最適な用途:** Moonshot Open Platform 経由の Kimi K2 モデル。

    <Steps>
      <Step title="Plugin をインストールする">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="エンドポイントリージョンを選択する">
        | 認証の選択            | エンドポイント                 | リージョン    |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国際          |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国          |
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
      <Step title="モデルが利用可能であることを確認する">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="ライブスモークテストを実行する">
        通常のセッションに触れずにモデルアクセスとコスト追跡を検証したい場合は、分離された状態ディレクトリを使用します。

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON レスポンスでは `provider: "moonshot"` と `model: "kimi-k2.6"` が報告されるはずです。Moonshot が使用量メタデータを返す場合、アシスタントのトランスクリプトエントリには、正規化されたトークン使用量と推定コストが `usage.cost` の下に保存されます。
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
    **最適な用途:** Kimi Coding エンドポイント経由のコード重視タスク。

    <Note>
    Kimi Coding は Moonshot (`moonshot/...`) とは異なる API キーとプロバイダープレフィックス（`kimi/...`）を使用します。安定版のモデル参照は `kimi/kimi-for-coding` です。レガシー参照の `kimi/kimi-code` と `kimi/k2p5` は引き続き受け付けられ、そのモデル ID に正規化されます。
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
      <Step title="モデルが利用可能であることを確認する">
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

## Kimi Web 検索

Moonshot Plugin は、Moonshot Web 検索を基盤とする `web_search` プロバイダーとして **Kimi** も登録します。

<Steps>
  <Step title="対話型 Web 検索セットアップを実行する">
    ```bash
    openclaw configure --section web
    ```

    Web 検索セクションで **Kimi** を選択し、`plugins.entries.moonshot.config.webSearch.*` を保存します。

  </Step>
  <Step title="Web 検索リージョンとモデルを設定する">
    対話型セットアップでは次の入力を求められます。

    | 設定                | オプション                                                           |
    | ------------------- | -------------------------------------------------------------------- |
    | API リージョン      | `https://api.moonshot.ai/v1`（国際）または `https://api.moonshot.cn/v1`（中国） |
    | Web 検索モデル      | デフォルトは `kimi-k2.6`                                             |

  </Step>
</Steps>

設定は `plugins.entries.moonshot.config.webSearch` の下にあります。

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
    Kimi K2.7 Code は常にネイティブ思考を使用します。Moonshot は、このモデルでクライアントが `thinking` フィールドを省略することを要求するため、OpenClaw は `on` のみを公開し、古い `off` 設定を無視します。K2.7 は `temperature`, `top_p`, `n`, `presence_penalty`, `frequency_penalty` も固定します。OpenClaw はこれらのフィールドに対する設定済みの上書きを省略します。

    その他の Moonshot Kimi モデルは、二値のネイティブ思考をサポートします。

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    `agents.defaults.models.<provider/model>.params` を介してモデルごとに設定します。

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

    OpenClaw はこれらのモデルに対して、ランタイムの `/think` レベルを次のように対応付けます。

    | `/think` レベル     | Moonshot の動作          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | off 以外の任意のレベル | `thinking.type=enabled`    |

    <Warning>
    Moonshot の思考が有効な場合、`tool_choice` は `auto` または `none` でなければなりません。固定されたツール選択（`type: "tool"` または `type: "function"`）は、代わりに思考を `disabled` に戻すため、要求されたツールは引き続き実行されます。`tool_choice: "required"` は代わりに `auto` に正規化されます。これは、思考モードを無効にできない Kimi K2.7 Code を除くすべての Moonshot モデルに適用されます。Kimi K2.7 Code では、互換性がない場合に `tool_choice` が `auto` に正規化されます。
    </Warning>

    Kimi K2.6 は、`reasoning_content` の複数ターン保持を制御する任意の `thinking.keep` フィールドも受け付けます。ターン間で完全な推論を保持するには `"all"` に設定します。省略するか `null` のままにすると、サーバーのデフォルト戦略が使用されます。OpenClaw は `moonshot/kimi-k2.6` に対してのみ `thinking.keep` を転送し、他のモデルからは削除します。Kimi K2.7 Code はデフォルトで完全な推論履歴を保持し、OpenClaw は `thinking` フィールド全体を省略します。

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

  <Accordion title="ツール呼び出し id のサニタイズ">
    Moonshot Kimi は、`functions.<name>:<index>` の形をしたネイティブの tool_call id を提供します。OpenClaw は各ネイティブ Kimi id の最初の出現を保持し、以降の重複を決定的な OpenAI 形式の `call_*` id に書き換えます。対応するツール結果も同じ id で再マッピングされるため、Kimi の最初のネイティブ id を削除せずにリプレイの一意性が保たれます。この動作はバンドルされた Moonshot プロバイダーに組み込まれており、ユーザーが設定できる項目ではありません。
  </Accordion>

  <Accordion title="ストリーミング使用量の互換性">
    ネイティブの Moonshot エンドポイント（`https://api.moonshot.ai/v1` と
    `https://api.moonshot.cn/v1`）は、ストリーミング使用量の互換性を表明します。
    OpenClaw はこれをプロバイダー id ではなくエンドポイントホストに基づいて判定するため、同じネイティブ Moonshot ホストを指すカスタムプロバイダー id は同じストリーミング使用量の動作を継承します。

    カタログの K2.6 料金では、入力、出力、キャッシュ読み取りトークンを含むストリーミング使用量も、`/status`、`/usage full`、`/usage cost`、およびトランスクリプトに基づくセッション会計向けに、ローカル推定 USD コストへ変換されます。

  </Accordion>

  <Accordion title="エンドポイントとモデル参照のリファレンス">
    | プロバイダー | モデル参照プレフィックス | エンドポイント                 | 認証環境変数        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding エンドポイント     | `KIMI_API_KEY`      |
    | ウェブ検索 | N/A              | Moonshot API リージョンと同じ  | `KIMI_API_KEY` または `MOONSHOT_API_KEY` |

    - Kimi ウェブ検索は `KIMI_API_KEY` または `MOONSHOT_API_KEY` を使用し、デフォルトではモデル `kimi-k2.6` と `https://api.moonshot.ai/v1` を使用します。
    - 必要に応じて、`models.providers` で料金とコンテキストメタデータを上書きします。
    - Moonshot がモデルごとに異なるコンテキスト制限を公開している場合は、それに応じて `contextWindow` を調整します。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、モデル参照、フェイルオーバー動作の選択。
  </Card>
  <Card title="ウェブ検索" href="/ja-JP/tools/web" icon="magnifying-glass">
    Kimi を含むウェブ検索プロバイダーの設定。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー、モデル、plugins の完全な設定スキーマ。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API キー管理とドキュメント。
  </Card>
</CardGroup>
