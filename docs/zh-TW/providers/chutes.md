---
read_when:
    - 您想要將 Chutes 與 OpenClaw 搭配使用
    - 你需要 OAuth 或 API 金鑰設定路徑
    - 你想要預設模型、別名或探索行為
summary: Chutes 設定（OAuth 或 API 金鑰、模型探索、別名）
title: Chutes
x-i18n:
    generated_at: "2026-04-30T03:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) 透過 OpenAI 相容 API 提供開放原始碼模型目錄。OpenClaw 支援綑綁的 `chutes` 提供者使用瀏覽器 OAuth 與直接 API 金鑰驗證。

| 屬性 | 值                           |
| ---- | ---------------------------- |
| 提供者 | `chutes`                     |
| API  | OpenAI 相容                  |
| 基礎 URL | `https://llm.chutes.ai/v1`   |
| 驗證 | OAuth 或 API 金鑰（見下方） |

## 開始使用

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="執行 OAuth 初始設定流程">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw 會在本機啟動瀏覽器流程，或在遠端/無頭主機上顯示 URL + 重新導向貼上流程。OAuth 權杖會透過 OpenClaw 驗證設定檔自動重新整理。
      </Step>
      <Step title="驗證預設模型">
        初始設定完成後，預設模型會設為
        `chutes/zai-org/GLM-4.7-TEE`，並註冊綑綁的 Chutes 目錄。
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
      <Step title="執行 API 金鑰初始設定流程">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="驗證預設模型">
        初始設定完成後，預設模型會設為
        `chutes/zai-org/GLM-4.7-TEE`，並註冊綑綁的 Chutes 目錄。
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
兩種驗證路徑都會註冊綑綁的 Chutes 目錄，並將預設模型設為
`chutes/zai-org/GLM-4.7-TEE`。執行階段環境變數：`CHUTES_API_KEY`、
`CHUTES_OAUTH_TOKEN`。
</Note>

## 探索行為

當 Chutes 驗證可用時，OpenClaw 會使用該憑證查詢 Chutes 目錄，並使用探索到的模型。如果探索失敗，OpenClaw 會退回綑綁的靜態目錄，讓初始設定與啟動仍可運作。

## 預設別名

OpenClaw 會為綑綁的 Chutes 目錄註冊三個便利別名：

| 別名            | 目標模型                                              |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 內建入門目錄

綑綁的備援目錄包含目前的 Chutes 參照：

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
    你可以使用選用的環境變數自訂 OAuth 流程：

    | 變數 | 用途 |
    | ---- | ---- |
    | `CHUTES_CLIENT_ID` | 自訂 OAuth 用戶端 ID |
    | `CHUTES_CLIENT_SECRET` | 自訂 OAuth 用戶端密鑰 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 自訂重新導向 URI |
    | `CHUTES_OAUTH_SCOPES` | 自訂 OAuth 範圍 |

    請參閱 [Chutes OAuth 文件](https://chutes.ai/docs/sign-in-with-chutes/overview)，了解重新導向應用程式需求與協助。

  </Accordion>

  <Accordion title="備註">
    - API 金鑰與 OAuth 探索都使用相同的 `chutes` 提供者 ID。
    - Chutes 模型會註冊為 `chutes/<model-id>`。
    - 如果啟動時探索失敗，會自動使用綑綁的靜態目錄。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    提供者規則、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    包含提供者設定的完整設定結構描述。
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 控制台與 API 文件。
  </Card>
  <Card title="Chutes API 金鑰" href="https://chutes.ai/settings/api-keys" icon="key">
    建立與管理 Chutes API 金鑰。
  </Card>
</CardGroup>
