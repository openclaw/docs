---
read_when:
    - 你想將 Groq 與 OpenClaw 搭配使用
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
    - 你正在 Groq 上設定 Whisper 音訊轉錄
summary: Groq 設定（驗證 + 模型選擇 + Whisper 轉錄）
title: Groq
x-i18n:
    generated_at: "2026-07-05T11:41:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自訂 LPU 硬體，在開放權重模型（Llama、Gemma、Kimi、Qwen、GPT OSS 等）上提供超高速推論。Groq 外掛會同時註冊一個相容 OpenAI 的聊天提供者，以及一個音訊媒體理解提供者。

| 屬性                   | 值                                       |
| ---------------------- | ---------------------------------------- |
| 提供者 ID              | `groq`                                   |
| 外掛                   | 官方外部套件                             |
| 驗證環境變數           | `GROQ_API_KEY`                           |
| API                    | 相容 OpenAI（`openai-completions`）      |
| 基底 URL               | `https://api.groq.com/openai/v1`         |
| 音訊轉錄               | `whisper-large-v3-turbo`（預設）         |
| 建議聊天預設值         | `groq/llama-3.3-70b-versatile`           |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [console.groq.com/keys](https://console.groq.com/keys) 建立 API 金鑰。
  </Step>
  <Step title="設定 API 金鑰">
    ```bash
export GROQ_API_KEY=gsk_...
```
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
  <Step title="確認型錄可連線">
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

## 內建型錄

OpenClaw 會隨附以資訊清單支援的 Groq 型錄，其中包含推理與非推理項目。執行 `openclaw models list --provider groq` 來查看你已安裝版本的靜態列，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models) 取得 Groq 的權威清單。

| 模型參照                                         | 名稱                    | 推理 | 輸入         | 上下文  |
| ------------------------------------------------ | ----------------------- | ---- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | 否   | 文字         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | 否   | 文字         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | 否   | 文字 + 圖片  | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | 是   | 文字         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | 是   | 文字         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | 是   | 文字         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | 是   | 文字         | 131,072 |
| `groq/groq/compound`                             | Compound                | 是   | 文字         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | 是   | 文字         | 131,072 |

<Tip>
  型錄會隨每個 OpenClaw 發行版本演進。`openclaw models list --provider groq` 會顯示你已安裝版本已知的列；請與 [console.groq.com/docs/models](https://console.groq.com/docs/models) 交叉核對新加入或已棄用的模型。
</Tip>

## 推理模型

Groq 推理模型（上表中的 `reasoning: true`）會將 OpenClaw 共用的 `/think` 層級對應到 `low`、`medium` 或 `high` 的 `reasoning_effort` 值。`/think off` 或 `/think none` 會從請求中省略 `reasoning_effort`，而不是傳送停用值。

請參閱[思考模式](/zh-TW/tools/thinking)，了解共用的 `/think` 層級，以及 OpenClaw 如何依提供者轉譯它們。

## 音訊轉錄

Groq 的外掛也會註冊一個**音訊媒體理解提供者**，讓語音訊息可以透過共用的 `tools.media.audio` 介面轉錄。

| 屬性             | 值                                        |
| ---------------- | ----------------------------------------- |
| 共用設定路徑     | `tools.media.audio`                       |
| 預設基底 URL     | `https://api.groq.com/openai/v1`          |
| 預設模型         | `whisper-large-v3-turbo`                  |
| 自動優先順序     | 20                                        |
| API 端點         | 相容 OpenAI 的 `/audio/transcriptions`    |

若要讓 Groq 成為預設音訊後端：

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
  <Accordion title="常駐程式的環境可用性">
    如果閘道以受管理服務（launchd、systemd、Docker）執行，`GROQ_API_KEY` 必須對該程序可見，而不只是對你的互動式 shell 可見。

    <Warning>
      只在互動式 shell 中匯出的金鑰無法協助 launchd 或 systemd 常駐程式，除非該環境也匯入到那裡。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，讓閘道程序能夠讀取。
    </Warning>

  </Accordion>

  <Accordion title="自訂 Groq 模型 ID">
    OpenClaw 會在執行階段接受任何 Groq 模型 ID。使用 Groq 顯示的精確 ID，並加上 `groq/` 前綴。靜態型錄涵蓋常見案例；未列入型錄的 ID 會落回預設的相容 OpenAI 範本。

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
    選擇提供者、模型參照與容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    推理努力程度層級與提供者政策互動。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定結構描述，包含提供者與音訊設定。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 儀表板、API 文件與定價。
  </Card>
</CardGroup>
