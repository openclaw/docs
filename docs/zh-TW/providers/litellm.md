---
read_when:
    - 你想要將 OpenClaw 透過 LiteLLM 代理進行路由
    - 你需要透過 LiteLLM 進行成本追蹤、日誌記錄或模型路由
summary: 透過 LiteLLM Proxy 執行 OpenClaw，以統一模型存取與成本追蹤
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T03:31:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) 是一個開源 LLM Gateway，提供統一 API，可連接 100 多個模型供應商。透過 LiteLLM 路由 OpenClaw，即可取得集中式成本追蹤、記錄功能，以及在不變更 OpenClaw 設定的情況下切換後端的彈性。

<Tip>
**為什麼要搭配 OpenClaw 使用 LiteLLM？**

- **成本追蹤** — 精確查看 OpenClaw 在所有模型上的花費
- **模型路由** — 在不變更設定的情況下，在 Claude、GPT-4、Gemini、Bedrock 之間切換
- **虛擬金鑰** — 為 OpenClaw 建立具有花費上限的金鑰
- **記錄** — 完整的請求/回應記錄，方便除錯
- **備援** — 主要供應商停機時自動故障轉移

</Tip>

## 快速開始

<Tabs>
  <Tab title="Onboarding (recommended)">
    **最適合：**最快完成可用 LiteLLM 設定的路徑。

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        若要針對遠端 Proxy 進行非互動式設定，請明確傳入 Proxy URL：

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manual setup">
    **最適合：**完整掌控安裝與設定。

    <Steps>
      <Step title="Start LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="Point OpenClaw to LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        就這樣。OpenClaw 現在會透過 LiteLLM 路由。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 設定

### 環境變數

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 設定檔

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

## 進階設定

### 圖片生成

LiteLLM 也可以透過 OpenAI 相容的
`/images/generations` 和 `/images/edits` 路由，支援 OpenClaw 的 `image_generate` 工具。請在 `agents.defaults.imageGenerationModel` 下設定 LiteLLM 圖片模型：

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

像 `http://localhost:4000` 這類 Loopback LiteLLM URL 無需全域
私有網路覆寫即可運作。若是 LAN 託管的 Proxy，請設定
`models.providers.litellm.request.allowPrivateNetwork: true`，因為 API 金鑰
會被送到已設定的 Proxy 主機。

<AccordionGroup>
  <Accordion title="Virtual keys">
    為 OpenClaw 建立具有花費上限的專用金鑰：

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

    將產生的金鑰用作 `LITELLM_API_KEY`。

  </Accordion>

  <Accordion title="Model routing">
    LiteLLM 可以將模型請求路由到不同後端。請在你的 LiteLLM `config.yaml` 中設定：

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

    OpenClaw 會持續請求 `claude-opus-4-6` — LiteLLM 負責處理路由。

  </Accordion>

  <Accordion title="Viewing usage">
    查看 LiteLLM 的儀表板或 API：

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy behavior notes">
    - LiteLLM 預設在 `http://localhost:4000` 上執行
    - OpenClaw 會透過 LiteLLM Proxy 風格、OpenAI 相容的 `/v1`
      端點連線
    - 原生 OpenAI 專用的請求塑形不會透過 LiteLLM 套用：
      沒有 `service_tier`、沒有 Responses `store`、沒有提示快取提示，也沒有
      OpenAI reasoning 相容酬載塑形
    - 自訂 LiteLLM base URL 不會注入隱藏的 OpenClaw 歸因標頭（`originator`、`version`、`User-Agent`）

  </Accordion>
</AccordionGroup>

<Note>
如需一般供應商設定與故障轉移行為，請參閱[模型供應商](/zh-TW/concepts/model-providers)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="LiteLLM Docs" href="https://docs.litellm.ai" icon="book">
    官方 LiteLLM 文件與 API 參考。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    所有供應商、模型參照與故障轉移行為的概覽。
  </Card>
  <Card title="Configuration" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
  <Card title="Model selection" href="/zh-TW/concepts/models" icon="brain">
    如何選擇並設定模型。
  </Card>
</CardGroup>
