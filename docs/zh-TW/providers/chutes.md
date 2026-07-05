---
read_when:
    - 你想將 Chutes 與 OpenClaw 搭配使用
    - 你需要 OAuth 或 API 金鑰設定路徑
    - 你想要預設模型、別名或探索行為
summary: Chutes 設定（OAuth 或 API 金鑰、模型探索、別名）
title: 滑槽
x-i18n:
    generated_at: "2026-07-05T11:36:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) 透過 OpenAI 相容 API 公開開放原始碼模型目錄。OpenClaw 支援瀏覽器 OAuth 與 API 金鑰驗證。

| 屬性             | 值                                                      |
| ---------------- | ------------------------------------------------------- |
| 供應商           | `chutes`                                                |
| 外掛             | 官方外部套件（`@openclaw/chutes-provider`）             |
| API              | OpenAI 相容                                            |
| 基礎 URL         | `https://llm.chutes.ai/v1`                              |
| 驗證             | OAuth 或 API 金鑰（見下方）                             |
| 執行階段環境變數 | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` 會直接提供已取得的 OAuth 存取權杖
（例如在 CI 中），略過下方的互動式瀏覽器流程。

## 安裝外掛

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## 開始使用

兩種路徑都會將預設模型設為 `chutes/zai-org/GLM-4.7-TEE`，並註冊
Chutes 目錄。

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="執行 OAuth onboarding 流程">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw 會在本機啟動瀏覽器流程，或在遠端／無介面主機上顯示 URL + 重新導向貼上
        流程。OAuth 權杖會透過 OpenClaw 驗證
        設定檔自動重新整理。
      </Step>
    </Steps>
  </Tab>
  <Tab title="API 金鑰">
    <Steps>
      <Step title="取得 API 金鑰">
        在
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
        建立金鑰。
      </Step>
      <Step title="執行 API 金鑰 onboarding 流程">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 探索行為

當 Chutes 驗證可用時，OpenClaw 會使用該認證查詢 `GET /v1/models`，
並使用探索到的模型；每個認證會快取 5 分鐘。若金鑰過期或未授權
（HTTP 401），OpenClaw 會在不帶認證的情況下重試一次。若探索仍未傳回任何列、失敗，
或傳回任何其他非 2xx 狀態，則會退回使用內建靜態目錄（API 金鑰
與 OAuth 探索都使用同一路徑）。若啟動時探索失敗，
會自動使用靜態目錄。

## 預設別名

OpenClaw 會為 Chutes 目錄註冊三個便利別名：

| 別名            | 目標模型                                              |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 內建入門目錄

內建後備目錄有 47 個模型。以下是目前 refs 的代表性範例：

| 模型 ref                                              |
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
  <Accordion title="OAuth 覆寫">
    使用選用環境變數自訂 OAuth 流程：

    | 變數 | 用途 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth 用戶端 id（若未設定則提示輸入） |
    | `CHUTES_CLIENT_SECRET` | OAuth 用戶端密鑰 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 重新導向 URI（預設 `http://127.0.0.1:1456/oauth-callback`） |
    | `CHUTES_OAUTH_SCOPES` | 以空格分隔的 scopes（預設 `openid profile chutes:invoke`） |

    請參閱 [Chutes OAuth 文件](https://chutes.ai/docs/sign-in-with-chutes/overview)
    了解重新導向應用程式需求與說明。

  </Accordion>

  <Accordion title="注意事項">
    - Chutes 模型會註冊為 `chutes/<model-id>`。
    - Chutes 在串流期間不會回報權杖用量（`supportsUsageInStreaming: false`）；串流完成後仍會顯示用量總計。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    供應商規則、模型 refs 與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定 schema，包含供應商設定。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 儀表板與 API 文件。
  </Card>
  <Card title="Chutes API 金鑰" href="https://chutes.ai/settings/api-keys" icon="key">
    建立並管理 Chutes API 金鑰。
  </Card>
</CardGroup>
