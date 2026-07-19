---
read_when:
    - 你想搭配 OpenClaw 使用 Together AI
    - 你需要 API 金鑰環境變數或命令列介面驗證選項
summary: Together AI 設定（驗證 + 模型選擇）
title: Together AI
x-i18n:
    generated_at: "2026-07-19T14:05:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9b08cae93c1ea7df46e1d2fbe78692f73bb3e56809122f70a56eec8b3dc5d8a4
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) 透過統一的 API 提供 Llama、DeepSeek、Kimi 等領先的開放原始碼模型。
OpenClaw 將其內建為 `together` 提供者。

| 屬性     | 值                            |
| -------- | ----------------------------- |
| 提供者   | `together`            |
| 驗證     | `TOGETHER_API_KEY`            |
| API      | 與 OpenAI 相容                |
| 基底 URL | `https://api.together.xyz/v1`            |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) 建立 API 金鑰。
  </Step>
  <Step title="執行新手引導">
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
新手引導會將 `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` 設為
預設模型。
</Note>

## 內建目錄

費用單位為每百萬個權杖的美元金額。

| 模型參照                                           | 名稱                         | 輸入         | 上下文  | 最大輸出   | 費用（輸入／輸出） | 備註             |
| -------------------------------------------------- | ---------------------------- | ------------ | ------- | ---------- | ------------------ | ---------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 文字         | 131,072 | 8,192      | 0.88 / 0.88        | 預設模型         |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | 文字、圖片   | 262,144 | 32,768     | 1.20 / 4.50        | 推理模型         |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | 文字         | 512,000 | 8,192      | 2.10 / 4.40        | 推理模型         |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | 文字         | 32,768  | 8,192      | 0.30 / 0.30        | 快速、非推理模型 |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | 文字         | 202,752 | 8,192      | 1.40 / 4.40        | 推理模型         |

## 影片生成

內建的 `together` 外掛也會透過共用的
`video_generate` 工具註冊影片生成功能。

| 屬性             | 值                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------- |
| 預設影片模型     | `Wan-AI/Wan2.2-T2V-A14B`                                                                        |
| 其他模型         | `Wan-AI/Wan2.2-I2V-A14B`、`minimax/hailuo-02`、`kwaivgI/kling-2.1-master`                               |
| 模式             | 文字轉影片；僅 `Wan-AI/Wan2.2-I2V-A14B` 支援圖片轉影片（單張參考圖片）                         |
| 時長             | 1-10 秒                                                                                   |
| 支援的參數       | `size`（解析為 `<width>x<height>`）；不會讀取 `aspectRatio`/`resolution` |

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
請參閱[影片生成](/zh-TW/tools/video-generation)，瞭解共用工具參數、
提供者選擇與容錯移轉行為。
</Tip>

<AccordionGroup>
  <Accordion title="環境注意事項">
    如果閘道以常駐程式（launchd/systemd）方式執行，請確保該程序可存取
    `TOGETHER_API_KEY`（例如放在
    `~/.openclaw/.env` 中，或透過 `env.shellEnv` 提供）。

    <Warning>
    僅在互動式 shell 中設定的金鑰，對由常駐程式管理的
    閘道程序不可見。請使用 `~/.openclaw/.env` 或 `env.shellEnv` 設定，
    以確保持續可用。
    </Warning>

  </Accordion>

  <Accordion title="疑難排解">
    - 確認你的金鑰可用：`openclaw models list --provider together`
    - 如果模型未顯示，請確認 API 金鑰已設定在閘道程序的正確
      環境中。
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
    完整的設定結構描述，包含提供者設定。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 儀表板、API 文件與定價。
  </Card>
</CardGroup>
