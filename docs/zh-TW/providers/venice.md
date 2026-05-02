---
read_when:
    - 你想在 OpenClaw 中使用重視隱私的推論
    - 您想要 Venice AI 設定指南
summary: 在 OpenClaw 中使用 Venice AI 注重隱私的模型
title: Venice AI
x-i18n:
    generated_at: "2026-05-02T02:58:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9b3486dd319661ba27f952e1353fed4364064c2cfb1e5744c018ddbac9dae82
    source_path: providers/venice.md
    workflow: 16
---

Venice AI 提供**注重隱私的 AI 推論**，支援不受審查的模型，並可透過其匿名化代理存取主要專有模型。所有推論預設皆為私密，不會用你的資料進行訓練，也不會記錄日誌。

## 為什麼在 OpenClaw 使用 Venice

- 開源模型的**私密推論**（不記錄日誌）。
- 需要時可使用**不受審查的模型**。
- 當品質很重要時，可**匿名化存取**專有模型（Opus/GPT/Gemini）。
- OpenAI 相容的 `/v1` 端點。

## 隱私模式

Venice 提供兩種隱私層級，理解這點是選擇模型的關鍵：

| 模式           | 說明                                                                                                                       | 模型                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **私密**    | 完全私密。提示詞/回應**絕不儲存或記錄**。暫時性。                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, 等。 |
| **匿名化** | 透過 Venice 代理並移除中繼資料。底層供應商（OpenAI, Anthropic, Google, xAI）會看到匿名化的請求。 | Claude, GPT, Gemini, Grok                                     |

<Warning>
匿名化模型**並非**完全私密。Venice 會在轉送前移除中繼資料，但底層供應商（OpenAI, Anthropic, Google, xAI）仍會處理該請求。需要完整隱私時，請選擇**私密**模型。
</Warning>

## 功能

- **注重隱私**：可在「私密」（完全私密）與「匿名化」（代理）模式之間選擇
- **不受審查的模型**：存取沒有內容限制的模型
- **主要模型存取**：透過 Venice 的匿名化代理使用 Claude、GPT、Gemini 和 Grok
- **OpenAI 相容 API**：標準 `/v1` 端點，易於整合
- **串流**：所有模型皆支援
- **函式呼叫**：特定模型支援（請查看模型能力）
- **視覺**：具備視覺能力的模型支援
- **沒有硬性速率限制**：極端用量可能適用公平使用節流

## 開始使用

<Steps>
  <Step title="取得你的 API 金鑰">
    1. 在 [venice.ai](https://venice.ai) 註冊
    2. 前往 **設定 > API 金鑰 > 建立新金鑰**
    3. 複製你的 API 金鑰（格式：`vapi_xxxxxxxxxxxx`）
  </Step>
  <Step title="設定 OpenClaw">
    選擇你偏好的設定方式：

    <Tabs>
      <Tab title="互動式（建議）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        這會：
        1. 提示輸入你的 API 金鑰（或使用現有的 `VENICE_API_KEY`）
        2. 顯示所有可用的 Venice 模型
        3. 讓你挑選預設模型
        4. 自動設定供應商
      </Tab>
      <Tab title="環境變數">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="非互動式">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="驗證設定">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## 模型選擇

設定完成後，OpenClaw 會顯示所有可用的 Venice 模型。依你的需求挑選：

- **預設模型**：`venice/kimi-k2-5`，提供強大的私密推理與視覺能力。
- **高能力選項**：`venice/claude-opus-4-6`，提供最強的匿名化 Venice 路徑。
- **隱私**：選擇「私密」模型以進行完全私密的推論。
- **能力**：選擇「匿名化」模型，以透過 Venice 的代理存取 Claude、GPT、Gemini。

隨時變更你的預設模型：

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

列出所有可用模型：

```bash
openclaw models list --all --provider venice
```

你也可以執行 `openclaw configure`，選取 **模型/驗證**，然後選擇 **Venice AI**。

<Tip>
使用下表為你的使用案例挑選合適模型。

| 使用案例                   | 建議模型                | 原因                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **一般聊天（預設）** | `kimi-k2-5`                      | 強大的私密推理與視覺能力         |
| **整體最佳品質**   | `claude-opus-4-6`                | 最強的匿名化 Venice 選項           |
| **隱私 + 程式撰寫**       | `qwen3-coder-480b-a35b-instruct` | 具大型上下文的私密程式撰寫模型      |
| **私密視覺**         | `kimi-k2-5`                      | 不離開私密模式即可支援視覺  |
| **快速 + 便宜**           | `qwen3-4b`                       | 輕量級推理模型                  |
| **複雜私密任務**  | `deepseek-v3.2`                  | 推理能力強，但不支援 Venice 工具 |
| **不受審查**             | `venice-uncensored`              | 沒有內容限制                      |

</Tip>

## DeepSeek V4 重播行為

如果 Venice 公開 DeepSeek V4 模型，例如 `venice/deepseek-v4-pro` 或
`venice/deepseek-v4-flash`，當代理省略必要的 DeepSeek V4
`reasoning_content` 重播預留位置時，OpenClaw 會在助理訊息上補上它。Venice 會拒絕 DeepSeek 原生的頂層 `thinking` 控制，因此
OpenClaw 會將該供應商專屬的重播修正與原生
DeepSeek 供應商的思考控制分開處理。

## 內建目錄（共 41 個）

<AccordionGroup>
  <Accordion title="私密模型（26 個）— 完全私密，不記錄日誌">
    | 模型 ID                               | 名稱                                | 上下文 | 功能                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | 預設、推理、視覺 |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | 推理                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | 一般                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | 一般                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | 一般、工具已停用    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | 推理                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | 一般                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | 程式撰寫                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | 程式撰寫                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | 推理、視覺          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | 一般                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | 視覺                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | 快速、推理            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | 推理、工具已停用  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | 不受審查、工具已停用 |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | 視覺                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | 視覺                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | 一般                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | 一般                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | 推理                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | 一般                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | 推理                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | 推理                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | 推理                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | 推理                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | 推理                  |
  </Accordion>

  <Accordion title="匿名化模型（15 個）— 透過 Venice 代理">
    | 模型 ID                        | 名稱                           | 上下文 | 功能                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | 推理、視覺         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | 推理、視覺         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | 推理、視覺         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | 推理、視覺         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | 推理、視覺         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | 推理、視覺、程式撰寫 |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | 推理                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | 推理、視覺、程式撰寫 |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | 視覺                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | 視覺                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | 推理、視覺         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | 推理、視覺         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | 推理、視覺         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | 推理、視覺         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | 推理、程式撰寫         |
  </Accordion>
</AccordionGroup>

## 模型探索

OpenClaw 隨附以 manifest 支援的 Venice 種子目錄，用於唯讀模型列表。執行階段重新整理仍可從 Venice API 探索模型；若 API 無法連線，則會退回使用 manifest 目錄。

`/models` 端點是公開的（列出模型不需要驗證），但推論需要有效的 API 金鑰。

## 串流與工具支援

| 功能                 | 支援                                                 |
| -------------------- | ---------------------------------------------------- |
| **串流**             | 所有模型                                             |
| **函式呼叫**         | 多數模型（請在 API 中檢查 `supportsFunctionCalling`） |
| **視覺/圖片**        | 標示有「視覺」功能的模型                             |
| **JSON 模式**        | 透過 `response_format` 支援                          |

## 定價

Venice 使用點數制。請查看 [venice.ai/pricing](https://venice.ai/pricing) 了解目前費率：

- **私有模型**：通常成本較低
- **匿名化模型**：類似直接 API 定價 + 少量 Venice 費用

### Venice（匿名化）與直接 API 比較

| 面向         | Venice（匿名化）             | 直接 API          |
| ------------ | ----------------------------- | ------------------- |
| **隱私**     | 移除中繼資料並匿名化          | 連結至你的帳戶      |
| **延遲**     | +10-50ms（代理）              | 直接連線            |
| **功能**     | 支援大多數功能                | 完整功能            |
| **計費**     | Venice 點數                   | 供應商計費          |

## 使用範例

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## 疑難排解

<AccordionGroup>
  <Accordion title="無法辨識 API 金鑰">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    請確認金鑰以 `vapi_` 開頭。

  </Accordion>

  <Accordion title="模型無法使用">
    Venice 模型目錄會動態更新。執行 `openclaw models list` 查看目前可用的模型。某些模型可能暫時離線。
  </Accordion>

  <Accordion title="連線問題">
    Venice API 位於 `https://api.venice.ai/api/v1`。請確認你的網路允許 HTTPS 連線。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [常見問題](/zh-TW/help/faq)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="設定檔範例">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照和故障轉移行為。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 首頁和帳戶註冊。
  </Card>
  <Card title="API 文件" href="https://docs.venice.ai" icon="book">
    Venice API 參考和開發者文件。
  </Card>
  <Card title="定價" href="https://venice.ai/pricing" icon="credit-card">
    目前的 Venice 點數費率和方案。
  </Card>
</CardGroup>
