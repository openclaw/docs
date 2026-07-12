---
read_when:
    - 你想在 OpenClaw 中使用 DeepSeek
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: DeepSeek 設定（驗證 + 模型選擇）
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T14:45:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) 提供強大的 AI 模型，並具備與 OpenAI 相容的 API。

| 屬性 | 值                         |
| ---- | -------------------------- |
| 提供者 | `deepseek`                 |
| 驗證 | `DEEPSEEK_API_KEY`         |
| API | 與 OpenAI 相容             |
| 基礎 URL | `https://api.deepseek.com` |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 建立 API 金鑰。
  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    系統會提示你輸入 API 金鑰，並將 `deepseek/deepseek-v4-flash` 設為預設模型。

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    若要在未執行閘道的情況下檢視外掛的靜態目錄：

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非互動式設定">
    若為指令碼或無介面安裝，請直接傳入所有旗標：

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
如果閘道以常駐程式（launchd/systemd）執行，請確保該程序可取得
`DEEPSEEK_API_KEY`（例如放在 `~/.openclaw/.env` 中，或透過
`env.shellEnv` 提供）。
</Warning>

## 內建目錄

| 模型參照                     | 名稱              | 輸入 | 上下文    | 最大輸出 | 備註                                               |
| ---------------------------- | ----------------- | ---- | --------- | -------- | -------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | 文字 | 1,000,000 | 384,000  | 預設模型；支援思考功能的 V4 介面                   |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | 文字 | 1,000,000 | 384,000  | 支援思考功能的 V4 介面                             |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | 文字 | 1,000,000 | 384,000  | 已棄用的 V4 Flash 非思考模式相容名稱               |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | 文字 | 1,000,000 | 384,000  | 已棄用的 V4 Flash 思考模式相容名稱                 |

<Warning>
DeepSeek 將於 2026 年 7 月 24 日 15:59 UTC 停用 `deepseek-chat` 和
`deepseek-reasoner`。目前兩者分別路由至 DeepSeek V4 Flash 的非思考模式和
思考模式。請在截止時間前，將已設定的模型參照改為
`deepseek/deepseek-v4-flash` 或 `deepseek/deepseek-v4-pro`。
</Warning>

OpenClaw 的本機成本估算遵循 DeepSeek 公布的快取命中、快取未命中及輸出費率。
DeepSeek 可能會變更這些費率；計費應以其
[模型與定價](https://api-docs.deepseek.com/quick_start/pricing/)頁面為準。

<Tip>
V4 模型支援 DeepSeek 的 `thinking` 控制項。OpenClaw 也會在後續輪次重播
DeepSeek 的 `reasoning_content`，讓包含工具呼叫的思考工作階段可以繼續。
搭配 DeepSeek V4 模型使用 `/think xhigh` 或 `/think max`，即可要求 DeepSeek
使用最高的 `reasoning_effort`；兩者都會對應至 `"max"`。
</Tip>

## 思考與工具

DeepSeek V4 思考工作階段要求：後續請求中，從已啟用思考功能的輪次重播之助理訊息
必須包含 `reasoning_content`。OpenClaw 的 DeepSeek 外掛會自動補上該欄位，
因此即使歷史記錄來自其他與 OpenAI 相容的提供者（沒有原生
`reasoning_content`），或來自一般助理訊息，在
`deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro` 上仍可正常使用
多輪工具。工作階段途中切換提供者後，不需要執行 `/new`。

停用思考功能時（包括 UI 中選取 **None**），OpenClaw 會傳送
`thinking: { type: "disabled" }`，並從送出的歷史記錄中移除重播的
`reasoning_content`，使工作階段維持在 DeepSeek 的非思考路徑。

預設快速路徑請使用 `deepseek/deepseek-v4-flash`。若可接受較高成本或延遲，
並需要功能更強的模型，請使用 `deepseek/deepseek-v4-pro`。

## 即時測試

若只要執行新版模型即時測試套件中的 DeepSeek V4 直接模型檢查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

此測試會確認兩個 V4 模型都能完成作業，且思考／工具的後續輪次會保留 DeepSeek
所需的重播承載資料。

## 設定範例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    助理、模型和提供者的完整設定參考。
  </Card>
</CardGroup>
