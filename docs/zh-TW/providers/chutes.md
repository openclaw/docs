---
read_when:
    - 你想要搭配 OpenClaw 使用 Chutes
    - 你需要 OAuth 或 API 金鑰設定路徑
    - 你想要預設模型、別名或探索行為
summary: Chutes 設定（OAuth 或 API 金鑰、模型探索、別名）
title: Chutes
x-i18n:
    generated_at: "2026-07-11T21:41:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) 透過與 OpenAI 相容的 API 提供開放原始碼模型目錄。OpenClaw 同時支援瀏覽器 OAuth 與 API 金鑰驗證。

| 屬性             | 值                                                      |
| ---------------- | ------------------------------------------------------- |
| 供應商           | `chutes`                                                |
| 外掛             | 官方外部套件（`@openclaw/chutes-provider`）             |
| API              | 與 OpenAI 相容                                          |
| 基礎 URL         | `https://llm.chutes.ai/v1`                              |
| 驗證             | OAuth 或 API 金鑰（見下文）                             |
| 執行階段環境變數 | `CHUTES_API_KEY`、`CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` 可直接提供已取得的 OAuth 存取權杖（例如用於 CI），從而略過下方的互動式瀏覽器流程。

## 安裝外掛

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## 開始使用

兩種方式都會將預設模型設為 `chutes/zai-org/GLM-4.7-TEE`，並註冊 Chutes 目錄。

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="執行 OAuth 新手設定流程">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw 會在本機啟動瀏覽器流程；若在遠端或無頭主機上執行，則會顯示 URL 與貼上重新導向結果的流程。OAuth 權杖會透過 OpenClaw 驗證設定檔自動重新整理。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API 金鑰">
    <Steps>
      <Step title="取得 API 金鑰">
        請前往
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
        建立金鑰。
      </Step>
      <Step title="執行 API 金鑰新手設定流程">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 探索行為

當 Chutes 驗證資訊可用時，OpenClaw 會使用該憑證查詢 `GET /v1/models`，並採用探索到的模型；每組憑證的結果會快取 5 分鐘。若金鑰已過期或未獲授權（HTTP 401），OpenClaw 會在不使用憑證的情況下重試一次。如果探索仍未傳回任何資料列、發生失敗，或傳回其他非 2xx 狀態，則會回退至隨附的靜態目錄（API 金鑰與 OAuth 探索都使用相同路徑）。若啟動時探索失敗，系統會自動使用靜態目錄。

## 預設別名

OpenClaw 為 Chutes 目錄註冊三個便利別名：

| 別名            | 目標模型                                              |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 內建入門目錄

隨附的備援目錄包含 47 個模型。以下是目前參照的代表性範例：

| 模型參照                                              |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

執行 `openclaw models list --all --provider chutes` 以查看完整清單。

## 設定範例

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth 覆寫設定">
    使用選用的環境變數自訂 OAuth 流程：

    | 變數 | 用途 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth 用戶端 ID（若未設定則提示輸入） |
    | `CHUTES_CLIENT_SECRET` | OAuth 用戶端密鑰 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 重新導向 URI（預設為 `http://127.0.0.1:1456/oauth-callback`） |
    | `CHUTES_OAUTH_SCOPES` | 以空格分隔的範圍（預設為 `openid profile chutes:invoke`） |

    如需重新導向應用程式的需求與說明，請參閱 [Chutes OAuth 文件](https://chutes.ai/docs/sign-in-with-chutes/overview)。

  </Accordion>

  <Accordion title="注意事項">
    - Chutes 模型會註冊為 `chutes/<model-id>`。
    - Chutes 在串流期間不會回報權杖用量（`supportsUsageInStreaming: false`）；串流完成後仍會顯示用量總計。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商規則、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的設定結構描述，包括供應商設定。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 儀表板與 API 文件。
  </Card>
  <Card title="Chutes API 金鑰" href="https://chutes.ai/settings/api-keys" icon="key">
    建立及管理 Chutes API 金鑰。
  </Card>
</CardGroup>
