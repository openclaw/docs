---
read_when:
    - 您想將 Groq 與 OpenClaw 搭配使用
    - 你需要 API 金鑰環境變數或 CLI 認證選項
    - 你正在 Groq 上設定 Whisper 音訊轉錄
summary: Groq 設定（驗證 + 模型選擇 + Whisper 轉錄）
title: Groq
x-i18n:
    generated_at: "2026-05-06T02:56:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自訂 LPU 硬體，為開放權重模型（Llama、Gemma、Kimi、Qwen、GPT OSS 等）提供超快速推論。OpenClaw 內建 Groq Plugin，會註冊 OpenAI 相容的聊天提供者與音訊媒體理解提供者。

| 屬性                   | 值                                       |
| ---------------------- | ---------------------------------------- |
| 提供者 id              | `groq`                                   |
| Plugin                 | 內建，`enabledByDefault: true`           |
| 驗證環境變數           | `GROQ_API_KEY`                           |
| Onboarding 旗標        | `--auth-choice groq-api-key`             |
| API                    | OpenAI 相容 (`openai-completions`)       |
| 基礎 URL               | `https://api.groq.com/openai/v1`         |
| 音訊轉錄               | `whisper-large-v3-turbo`（預設）         |
| 建議的聊天預設值       | `groq/llama-3.3-70b-versatile`           |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [console.groq.com/keys](https://console.groq.com/keys) 建立 API 金鑰。
  </Step>
  <Step title="設定 API 金鑰">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Env only
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

  </Step>
  <Step title="設定預設模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="確認目錄可連線">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### 設定檔範例

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 內建目錄

OpenClaw 隨附以 manifest 支援的 Groq 目錄，包含推理與非推理項目。執行 `openclaw models list --provider groq` 查看你安裝版本內建的列，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models) 取得 Groq 的權威清單。

| 模型參照                                             | 名稱                          | 推理 | 輸入         | 上下文  |
| ---------------------------------------------------- | ----------------------------- | ---- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | 否   | 文字         | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | 否   | 文字         | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | 否   | 文字 + 圖片  | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | 否   | 文字 + 圖片  | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | 否   | 文字         | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | 否   | 文字         | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | 否   | 文字         | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | 否   | 文字         | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | 否   | 文字         | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | 否   | 文字         | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | 是   | 文字         | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | 是   | 文字         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | 是   | 文字         | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | 是   | 文字         | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | 是   | 文字         | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | 是   | 文字         | 131,072 |
| `groq/groq/compound`                                 | Compound                      | 是   | 文字         | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | 是   | 文字         | 131,072 |

<Tip>
  目錄會隨每個 OpenClaw 版本演進。`openclaw models list --provider groq` 會顯示你安裝版本已知的列；若要查看新增或已棄用的模型，請與 [console.groq.com/docs/models](https://console.groq.com/docs/models) 交叉比對。
</Tip>

## 推理模型

OpenClaw 會將共用的 `/think` 等級對應到 Groq 模型特定的 `reasoning_effort` 值：

- 對於 `qwen/qwen3-32b`，停用思考時會傳送 `none`，啟用思考時會傳送 `default`。
- 對於 Groq GPT OSS 推理模型 (`openai/gpt-oss-*`)，OpenClaw 會根據 `/think` 等級傳送 `low`、`medium` 或 `high`。停用思考時會省略 `reasoning_effort`，因為這些模型不支援停用值。
- DeepSeek R1 Distill、Qwen QwQ 與 Compound 使用 Groq 原生推理介面；`/think` 控制可見性，但模型始終會推理。

請參閱 [思考模式](/zh-TW/tools/thinking)，了解共用的 `/think` 等級，以及 OpenClaw 如何依提供者轉譯它們。

## 音訊轉錄

Groq 的內建 Plugin 也會註冊**音訊媒體理解提供者**，讓語音訊息可以透過共用的 `tools.media.audio` 介面進行轉錄。

| 屬性             | 值                                        |
| ---------------- | ----------------------------------------- |
| 共用設定路徑     | `tools.media.audio`                       |
| 預設基礎 URL     | `https://api.groq.com/openai/v1`          |
| 預設模型         | `whisper-large-v3-turbo`                  |
| 自動優先順序     | 20                                        |
| API 端點         | OpenAI 相容 `/audio/transcriptions`       |

若要將 Groq 設為預設音訊後端：

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="daemon 的環境可用性">
    如果 Gateway 以受管理服務（launchd、systemd、Docker）執行，`GROQ_API_KEY` 必須對該行程可見，而不只是對你的互動式 shell 可見。

    <Warning>
      只存在於 `~/.profile` 的金鑰無法幫助 launchd 或 systemd daemon，除非該環境也匯入到那裡。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，讓 Gateway 行程可以讀取。
    </Warning>

  </Accordion>

  <Accordion title="自訂 Groq 模型 id">
    OpenClaw 在執行階段接受任何 Groq 模型 id。使用 Groq 顯示的確切 id，並加上 `groq/` 前綴。內建目錄涵蓋常見情境；未收錄於目錄的 id 會退回使用預設的 OpenAI 相容範本。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照與故障轉移行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    推理投入等級與提供者政策互動。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定 schema，包含提供者與音訊設定。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 儀表板、API 文件與定價。
  </Card>
</CardGroup>
