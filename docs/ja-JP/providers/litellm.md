---
read_when:
    - OpenClawをLiteLLMプロキシ経由でルーティングしたい場合
    - LiteLLM経由でコスト追跡、ログ記録、またはモデルルーティングが必要な場合
summary: 統一されたモデルアクセスとコスト追跡のためにLiteLLM Proxy経由でOpenClawを実行する
title: LiteLLM
x-i18n:
    generated_at: "2026-04-24T05:15:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9da14e6ded4c9e0b54989898a982987c0a60f6f6170d10b6cd2eddcd5106630f
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai)は、100以上のモデルプロバイダーに統一APIを提供するオープンソースLLM gatewayです。OpenClawをLiteLLM経由でルーティングすると、集約されたコスト追跡、ログ記録、そしてOpenClaw設定を変えずにバックエンドを切り替える柔軟性が得られます。

<Tip>
**OpenClawでLiteLLMを使う理由**

- **コスト追跡** — すべてのモデルにわたるOpenClawの支出を正確に把握できる
- **モデルルーティング** — 設定変更なしでClaude、GPT-4、Gemini、Bedrockを切り替えられる
- **仮想key** — OpenClaw用に支出制限付きkeyを作成できる
- **ログ記録** — デバッグ用の完全なリクエスト/レスポンスログ
- **フォールバック** — 主要プロバイダーが落ちていても自動フェイルオーバー

</Tip>

## クイックスタート

<Tabs>
  <Tab title="Onboarding (recommended)">
    **向いている用途:** 最速で動作するLiteLLMセットアップに到達したい場合。

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **向いている用途:** インストールと設定を完全に制御したい場合。

    <Steps>
      <Step title="LiteLLM Proxyを起動する">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClawをLiteLLMへ向ける">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        これだけです。OpenClawは今後LiteLLM経由でルーティングされます。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

### 環境変数

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 設定ファイル

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="仮想key">
    OpenClaw専用の、支出制限付きkeyを作成します。

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    生成されたkeyを`LITELLM_API_KEY`として使用してください。

  </Accordion>

  <Accordion title="モデルルーティング">
    LiteLLMは、モデルリクエストを異なるバックエンドへルーティングできます。LiteLLMの`config.yaml`で設定します。

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClawは引き続き`claude-opus-4-6`を要求し、ルーティングはLiteLLMが処理します。

  </Accordion>

  <Accordion title="使用量を見る">
    LiteLLMのダッシュボードまたはAPIを確認します。

    ```bash
    # Key情報
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 支出ログ
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="プロキシ動作に関する注意">
    - LiteLLMはデフォルトで`http://localhost:4000`上で動作します
    - OpenClawは、LiteLLMのプロキシ型OpenAI互換`/v1`
      エンドポイント経由で接続します
    - LiteLLM経由ではネイティブOpenAI専用のリクエスト整形は適用されません:
      `service_tier`なし、Responsesの`store`なし、prompt-cacheヒントなし、
      OpenAI reasoning互換ペイロード整形なし
    - 隠されたOpenClaw attributionヘッダー（`originator`、`version`、`User-Agent`）
      はカスタムLiteLLM base URLには注入されません
  </Accordion>
</AccordionGroup>

<Note>
一般的なプロバイダー設定とフェイルオーバー動作については、[Model Providers](/ja-JP/concepts/model-providers)を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    LiteLLMの公式ドキュメントとAPIリファレンス。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、およびフェイルオーバー動作の概要。
  </Card>
  <Card title="Configuration" href="/ja-JP/gateway/configuration" icon="gear">
    完全な設定リファレンス。
  </Card>
  <Card title="Model selection" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
</CardGroup>
