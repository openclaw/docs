---
read_when:
    - 您想要搭配 OpenClaw 使用 Together AI
    - 你需要設定 API 金鑰環境變數，或選擇使用命令列介面驗證
summary: Together AI 設定（驗證 + 模型選擇）
title: Together AI
x-i18n:
    generated_at: "2026-07-11T21:44:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) 透過統一的 API，提供對 Llama、DeepSeek、Kimi 等頂尖開源模型的存取。
OpenClaw 將其內建為 `together` 提供者。

| 屬性     | 值                            |
| -------- | ----------------------------- |
| 提供者   | `together`                    |
| 驗證     | `TOGETHER_API_KEY`            |
| API      | 相容於 OpenAI                 |
| 基礎 URL | `https://api.together.xyz/v1` |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
    建立 API 金鑰。
  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="設定預設模型">
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

### 非互動式範例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
初始設定會將 `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` 設為預設模型。
</Note>

## 內建目錄

費用以每百萬個權杖的美元價格計算。

| 模型參照                                           | 名稱                         | 輸入         | 上下文  | 最大輸出 | 費用（輸入／輸出） | 備註             |
| -------------------------------------------------- | ---------------------------- | ------------ | ------- | -------- | ------------------ | ---------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 文字         | 131,072 | 8,192    | 0.88 / 0.88        | 預設模型         |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | 文字、圖片   | 262,144 | 32,768   | 1.20 / 4.50        | 推理模型         |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | 文字         | 512,000 | 8,192    | 2.10 / 4.40        | 推理模型         |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | 文字         | 32,768  | 8,192    | 0.30 / 0.30        | 快速、非推理模型 |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | 文字         | 202,752 | 8,192    | 1.40 / 4.40        | 推理模型         |

## 影片生成

內建的 `together` 外掛也會透過共用的 `video_generate` 工具註冊影片生成功能。

| 屬性         | 值                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------- |
| 預設影片模型 | `Wan-AI/Wan2.2-T2V-A14B`                                                                           |
| 其他模型     | `Wan-AI/Wan2.2-I2V-A14B`、`minimax/Hailuo-02`、`Kwai/Kling-2.1-Master`                              |
| 模式         | 文字轉影片；僅 `Wan-AI/Wan2.2-I2V-A14B` 支援圖片轉影片（單張參考圖片）                              |
| 時長         | 1 至 10 秒                                                                                          |
| 支援的參數   | `size`（解析為 `<width>x<height>`）；不會讀取 `aspectRatio`／`resolution`                           |

若要將 Together 設為預設影片提供者：

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
共用工具參數、提供者選擇與容錯移轉行為，請參閱[影片生成](/zh-TW/tools/video-generation)。
</Tip>

<AccordionGroup>
  <Accordion title="環境注意事項">
    如果閘道以背景服務（launchd/systemd）執行，請確認該程序可存取
    `TOGETHER_API_KEY`（例如在 `~/.openclaw/.env` 中設定，或透過
    `env.shellEnv` 提供）。

    <Warning>
    僅在互動式 shell 中設定的金鑰，對由背景服務管理的閘道程序不可見。
    請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定，確保金鑰持續可用。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 驗證金鑰是否有效：`openclaw models list --provider together`
    - 如果模型未顯示，請確認 API 金鑰已設定於閘道程序所使用的正確環境中。
    - 模型參照採用 `together/<model-id>` 格式。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    提供者規則、模型參照與容錯移轉行為。
  </Card>
  <Card title="影片生成" href="/zh-TW/tools/video-generation" icon="video">
    共用影片生成工具的參數與提供者選擇。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    包含提供者設定的完整設定結構描述。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 控制台、API 文件與定價。
  </Card>
</CardGroup>
