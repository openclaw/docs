---
read_when:
    - 你想搭配 OpenClaw 使用 Groq
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
    - 你正在 Groq 上設定 Whisper 音訊轉錄功能
summary: Groq 設定（驗證 + 模型選擇 + Whisper 轉錄）
title: Groq
x-i18n:
    generated_at: "2026-07-11T21:42:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自訂 LPU 硬體，為開放權重模型（Llama、Gemma、Kimi、Qwen、GPT OSS 等）提供超高速推論。Groq 外掛同時註冊了相容 OpenAI 的聊天提供者，以及音訊媒體理解提供者。

| 屬性                   | 值                                       |
| ---------------------- | ---------------------------------------- |
| 提供者 ID              | `groq`                                   |
| 外掛                   | 官方外部套件                             |
| 驗證環境變數           | `GROQ_API_KEY`                           |
| API                    | 相容 OpenAI（`openai-completions`）      |
| 基礎 URL               | `https://api.groq.com/openai/v1`         |
| 音訊轉錄               | `whisper-large-v3-turbo`（預設）         |
| 建議的預設聊天模型     | `groq/llama-3.3-70b-versatile`           |

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
  <Step title="驗證目錄是否可存取">
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

OpenClaw 隨附由資訊清單支援的 Groq 目錄，其中包含推理與非推理項目。執行 `openclaw models list --provider groq` 可查看已安裝版本的靜態項目，或查閱 [console.groq.com/docs/models](https://console.groq.com/docs/models) 取得 Groq 的權威清單。

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
  此目錄會隨每個 OpenClaw 版本演進。`openclaw models list --provider groq` 會顯示已安裝版本所知的項目；請與 [console.groq.com/docs/models](https://console.groq.com/docs/models) 交叉比對，以確認新增或已棄用的模型。
</Tip>

## 推理模型

Groq 推理模型（上表中的 `reasoning: true`）會將 OpenClaw 共用的 `/think` 層級對應至 `low`、`medium` 或 `high` 的 `reasoning_effort` 值。`/think off` 或 `/think none` 會從請求中省略 `reasoning_effort`，而不是傳送停用值。

請參閱[思考模式](/zh-TW/tools/thinking)，瞭解共用的 `/think` 層級，以及 OpenClaw 如何針對各提供者進行轉換。

## 音訊轉錄

Groq 外掛也會註冊一個**音訊媒體理解提供者**，讓語音訊息可透過共用的 `tools.media.audio` 介面進行轉錄。

| 屬性             | 值                                        |
| ---------------- | ----------------------------------------- |
| 共用設定路徑     | `tools.media.audio`                       |
| 預設基礎 URL     | `https://api.groq.com/openai/v1`          |
| 預設模型         | `whisper-large-v3-turbo`                  |
| 自動優先順序     | 20                                        |
| API 端點         | 相容 OpenAI 的 `/audio/transcriptions`    |

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
  <Accordion title="常駐程式的環境可用性">
    如果閘道以受管理服務執行（launchd、systemd、Docker），該程序必須能存取 `GROQ_API_KEY`，而不能只有互動式殼層能存取。

    <Warning>
      僅在互動式殼層中匯出的金鑰無法供 launchd 或 systemd 常駐程式使用，除非該環境也匯入至其中。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，讓閘道程序可以讀取。
    </Warning>

  </Accordion>

  <Accordion title="自訂 Groq 模型 ID">
    OpenClaw 在執行階段接受任何 Groq 模型 ID。請使用 Groq 顯示的確切 ID，並在前面加上 `groq/`。靜態目錄涵蓋常見情況；未列入目錄的 ID 會改用預設的相容 OpenAI 範本。

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
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    推理強度層級，以及與提供者政策的互動。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的設定結構描述，包括提供者與音訊設定。
  </Card>
  <Card title="Groq 控制台" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 儀表板、API 文件與定價。
  </Card>
</CardGroup>
