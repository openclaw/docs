---
read_when:
    - 你想要搭配 OpenClaw 使用 Together AI
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: Together AI 設定（身分驗證 + 模型選擇）
title: Together AI
x-i18n:
    generated_at: "2026-06-27T19:57:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) 透過統一 API 提供對 Llama、DeepSeek、Kimi 等領先開放原始碼模型的存取。

| 屬性 | 值                            |
| -------- | ----------------------------- |
| 提供者 | `together`                    |
| 驗證     | `TOGETHER_API_KEY`            |
| API      | 與 OpenAI 相容             |
| 基礎 URL | `https://api.together.xyz/v1` |

## 開始使用

<Steps>
  <Step title="Get an API key">
    在
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
    建立 API 金鑰。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### 非互動範例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
入門設定預設組會將
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` 設為預設模型。
</Note>

## 內建目錄

OpenClaw 隨附這份內建 Together 目錄：

| 模型參照                                           | 名稱                         | 輸入       | 情境 | 備註                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 文字        | 131,072 | 預設模型        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | 文字, 圖片 | 262,144 | Kimi 推理模型 |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | 文字        | 512,000 | 推理文字模型 |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | 文字        | 32,768  | 快速文字模型      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | 文字        | 202,752 | 推理文字模型 |

## 影片生成

內建的 `together` 外掛也會透過共用的
`video_generate` 工具註冊影片生成。

| 屬性             | 值                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| 預設影片模型  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| 模式                | 文字轉影片；僅搭配 `Wan-AI/Wan2.2-I2V-A14B` 使用單張圖片參照 |
| 支援的參數 | `aspectRatio`, `resolution`                                              |

若要使用 Together 作為預設影片提供者：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
請參閱[影片生成](/zh-TW/tools/video-generation)，了解共用工具參數、提供者選擇和容錯移轉行為。
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    如果閘道以常駐程式執行（launchd/systemd），請確認
    `TOGETHER_API_KEY` 可供該程序使用（例如放在
    `~/.openclaw/.env` 中，或透過 `env.shellEnv`）。

    <Warning>
    只在互動式 shell 中設定的金鑰，對由常駐程式管理的閘道程序不可見。請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定，以確保持續可用。
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 驗證你的金鑰可用：`openclaw models list --provider together`
    - 如果模型未出現，請確認 API 金鑰已設定在 Gateway 程序的正確環境中。
    - 模型參照使用 `together/<model-id>` 格式。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-TW/concepts/model-providers" icon="layers">
    提供者規則、模型參照和容錯移轉行為。
  </Card>
  <Card title="Video generation" href="/zh-TW/tools/video-generation" icon="video">
    共用影片生成工具參數和提供者選擇。
  </Card>
  <Card title="Configuration reference" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定結構描述，包含提供者設定。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 儀表板、API 文件和定價。
  </Card>
</CardGroup>
