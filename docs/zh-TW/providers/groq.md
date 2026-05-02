---
read_when:
    - 您想要將 Groq 與 OpenClaw 搭配使用
    - 需要 API 金鑰環境變數或 CLI 驗證選項
summary: Groq 設定（認證 + 模型選擇）
title: Groq
x-i18n:
    generated_at: "2026-05-02T02:57:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) 使用自訂 LPU 硬體，在開源模型
（Llama、Gemma、Mistral 等）上提供超高速推論。OpenClaw 透過其與 OpenAI 相容的 API
連接到 Groq。

| 屬性 | 值                |
| ---- | ----------------- |
| 供應商 | `groq`            |
| 認證 | `GROQ_API_KEY`    |
| API  | 與 OpenAI 相容 |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [console.groq.com/keys](https://console.groq.com/keys) 建立 API 金鑰。
  </Step>
  <Step title="設定 API 金鑰">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

OpenClaw 隨附由 manifest 支援的 Groq 目錄，可快速列出依供應商篩選的模型。
執行 `openclaw models list --all --provider groq` 以查看隨附的
資料列，或查看
[console.groq.com/docs/models](https://console.groq.com/docs/models)。

| 模型                        | 備註                               |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 通用型，大型上下文                 |
| **Llama 3.1 8B Instant**    | 快速、輕量                         |
| **Gemma 2 9B**              | 精簡、高效率                       |
| **Mixtral 8x7B**            | MoE 架構，推理能力強               |

<Tip>
使用 `openclaw models list --all --provider groq` 查看此 OpenClaw 版本已知、由 manifest 支援的 Groq
資料列。
</Tip>

## 推理模型

OpenClaw 會將其共用的 `/think` 層級對應到 Groq 的模型專屬
`reasoning_effort` 值。對於 `qwen/qwen3-32b`，停用思考會傳送
`none`，啟用思考會傳送 `default`。對於 Groq GPT-OSS 推理模型，
OpenClaw 會傳送 `low`、`medium` 或 `high`；停用思考時會省略
`reasoning_effort`，因為這些模型不支援停用值。

## 音訊轉錄

Groq 也提供快速的 Whisper 音訊轉錄。設定為媒體理解供應商時，
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
  <Accordion title="音訊轉錄詳細資訊">
    | 屬性 | 值 |
    |----------|-------|
    | 共用設定路徑 | `tools.media.audio` |
    | 預設基礎 URL | `https://api.groq.com/openai/v1` |
    | 預設模型 | `whisper-large-v3-turbo` |
    | API 端點 | 與 OpenAI 相容的 `/audio/transcriptions` |
  </Accordion>

  <Accordion title="環境注意事項">
    如果 Gateway 以 daemon（launchd/systemd）形式執行，請確保該程序可使用 `GROQ_API_KEY`
    （例如放在 `~/.openclaw/.env` 中，或透過
    `env.shellEnv`）。

    <Warning>
    只在互動式 shell 中設定的金鑰，對由 daemon 管理的
    gateway 程序不可見。請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定，
    以確保持續可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定 schema，包含供應商與音訊設定。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 儀表板、API 文件與定價。
  </Card>
  <Card title="Groq 模型清單" href="https://console.groq.com/docs/models" icon="list">
    官方 Groq 模型目錄。
  </Card>
</CardGroup>
