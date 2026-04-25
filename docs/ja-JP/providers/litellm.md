---
read_when:
    - OpenClaw を LiteLLM proxy 経由でルーティングしたい
    - LiteLLM を通じたコスト追跡、ロギング、またはモデルルーティングが必要です
summary: 統一されたモデルアクセスとコスト追跡のために、LiteLLM Proxy 経由で OpenClaw を実行する
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:19:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) は、100 以上のモデルプロバイダーに統一 API を提供するオープンソースの LLM Gateway です。OpenClaw を LiteLLM 経由でルーティングすると、一元化されたコスト追跡、ロギング、そして OpenClaw の config を変更せずにバックエンドを切り替える柔軟性を得られます。

<Tip>
**OpenClaw で LiteLLM を使う理由**

- **コスト追跡** — すべてのモデルにわたる OpenClaw の支出を正確に把握できます
- **モデルルーティング** — config を変えずに Claude、GPT-4、Gemini、Bedrock を切り替えられます
- **仮想キー** — OpenClaw 用に支出上限付きのキーを作成できます
- **ロギング** — デバッグ用の完全な request/response ログ
- **フォールバック** — プライマリプロバイダーが停止していても自動フェイルオーバー

</Tip>

## クイックスタート

<Tabs>
  <Tab title="オンボーディング（推奨）">
    **最短で動作する LiteLLM セットアップにたどり着きたい場合に最適です。**

    <Steps>
      <Step title="オンボーディングを実行する">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="手動セットアップ">
    **インストールと config を完全に制御したい場合に最適です。**

    <Steps>
      <Step title="LiteLLM Proxy を起動する">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw を LiteLLM に向ける">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        これで完了です。OpenClaw は LiteLLM 経由でルーティングされます。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

### 環境変数

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### config ファイル

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

### 画像生成

LiteLLM は、OpenAI 互換の `/images/generations` および `/images/edits` ルートを通じて、OpenClaw の `image_generate` ツールのバックエンドにもなれます。LiteLLM の画像モデルを `agents.defaults.imageGenerationModel` に設定してください。

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

`http://localhost:4000` のようなループバック LiteLLM URL は、グローバルな private-network override なしで動作します。LAN 上でホストされた proxy の場合は、API キーが設定済み proxy ホストに送信されるため、`models.providers.litellm.request.allowPrivateNetwork: true` を設定してください。

<AccordionGroup>
  <Accordion title="仮想キー">
    支出上限付きの OpenClaw 専用キーを作成します。

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

    生成されたキーを `LITELLM_API_KEY` として使ってください。

  </Accordion>

  <Accordion title="モデルルーティング">
    LiteLLM はモデル request を異なるバックエンドにルーティングできます。LiteLLM の `config.yaml` で設定してください。

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

    OpenClaw は引き続き `claude-opus-4-6` を要求し、LiteLLM がルーティングを処理します。

  </Accordion>

  <Accordion title="使用状況を確認する">
    LiteLLM のダッシュボードまたは API を確認してください。

    ```bash
    # キー情報
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 支出ログ
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="proxy 動作の注記">
    - LiteLLM はデフォルトで `http://localhost:4000` で動作します
    - OpenClaw は LiteLLM の proxy スタイルの OpenAI 互換 `/v1`
      エンドポイント経由で接続します
    - OpenAI ネイティブ専用の request shaping は LiteLLM 経由では適用されません:
      `service_tier` なし、Responses の `store` なし、prompt-cache ヒントなし、
      OpenAI reasoning 互換 payload shaping もありません
    - 非表示の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）
      は、カスタム LiteLLM base URL には注入されません
  </Accordion>
</AccordionGroup>

<Note>
一般的なプロバイダー設定とフェイルオーバー動作については、[Model Providers](/ja-JP/concepts/model-providers) を参照してください。
</Note>

## 関連

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    LiteLLM の公式ドキュメントと API リファレンス。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    完全な config リファレンス。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/models" icon="brain">
    モデルの選び方と設定方法。
  </Card>
</CardGroup>
