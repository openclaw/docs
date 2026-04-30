---
read_when:
    - 您想將 Groq 與 OpenClaw 搭配使用
    - 你需要 API 金鑰環境變數或 CLI 身分驗證選項
summary: Groq 設定（身分驗證 + 模型選擇）
title: Groq
x-i18n:
    generated_at: "2026-04-30T03:31:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自訂 LPU 硬體，為開放原始碼模型
（Llama、Gemma、Mistral 等）提供超高速推論。OpenClaw 透過其與 OpenAI 相容的 API
連接到 Groq。

| 屬性 | 值             |
| -------- | ----------------- |
| 提供者 | `groq`            |
| 驗證     | `GROQ_API_KEY`    |
| API      | 與 OpenAI 相容 |

## 開始使用

<Steps>
  <Step title="Get an API key">
    在 [console.groq.com/keys](https://console.groq.com/keys) 建立 API 金鑰。
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Set a default model">
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

Groq 的模型型錄經常變更。執行 `openclaw models list | grep groq`
查看目前可用的模型，或查看
[console.groq.com/docs/models](https://console.groq.com/docs/models)。

| 模型                       | 備註                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 通用，大型上下文     |
| **Llama 3.1 8B Instant**    | 快速，輕量                  |
| **Gemma 2 9B**              | 精簡，高效                 |
| **Mixtral 8x7B**            | MoE 架構，強推理能力 |

<Tip>
使用 `openclaw models list --provider groq` 查看你帳戶可用模型的最新清單。
</Tip>

## 推理模型

OpenClaw 會將其共用的 `/think` 等級對應到 Groq 模型專屬的
`reasoning_effort` 值。對於 `qwen/qwen3-32b`，停用思考會傳送
`none`，啟用思考會傳送 `default`。對於 Groq GPT-OSS 推理模型，
OpenClaw 會傳送 `low`、`medium` 或 `high`；停用思考時會省略
`reasoning_effort`，因為這些模型不支援停用值。

## 音訊轉錄

Groq 也提供快速的 Whisper 音訊轉錄。當設定為媒體理解提供者時，
OpenClaw 會使用 Groq 的 `whisper-large-v3-turbo`
模型，透過共用的 `tools.media.audio`
介面轉錄語音訊息。

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
  <Accordion title="Audio transcription details">
    | 屬性 | 值 |
    |----------|-------|
    | 共用設定路徑 | `tools.media.audio` |
    | 預設基底 URL   | `https://api.groq.com/openai/v1` |
    | 預設模型      | `whisper-large-v3-turbo` |
    | API 端點       | 與 OpenAI 相容的 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Environment note">
    如果 Gateway 以 daemon（launchd/systemd）方式執行，請確保 `GROQ_API_KEY`
    可供該程序使用（例如，在 `~/.openclaw/.env` 中，或透過
    `env.shellEnv`）。

    <Warning>
    只在互動式 shell 中設定的金鑰，daemon 管理的
    Gateway 程序無法看見。請使用 `~/.openclaw/.env` 或 `env.shellEnv`
    設定，以便持續可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定結構描述，包含提供者和音訊設定。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 儀表板、API 文件和定價。
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    官方 Groq 模型型錄。
  </Card>
</CardGroup>
