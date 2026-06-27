---
read_when:
    - 你想在 OpenClaw 中使用注重隱私的推論
    - 你想要 Venice AI 設定指南
summary: 在 OpenClaw 中使用 Venice AI 注重隱私的模型
title: Venice AI
x-i18n:
    generated_at: "2026-06-27T19:57:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f02885dd7d8dc06fb6a923f504ad515c4b9345507d784bff290d3fcc483ed45
    source_path: providers/venice.md
    workflow: 16
---

Venice AI 提供**注重隱私的 AI 推論**，支援無審查模型，並可透過其匿名化代理存取主要專有模型。所有推論預設都是私密的，不會使用你的資料訓練，也不會記錄日誌。

## 為什麼在 OpenClaw 中使用 Venice

- 開源模型的**私密推論**（無日誌記錄）。
- 在需要時使用**無審查模型**。
- 在品質重要時，**匿名化存取**專有模型（Opus/GPT/Gemini）。
- OpenAI 相容的 `/v1` 端點。

## 隱私模式

Venice 提供兩種隱私層級，理解這一點是選擇模型的關鍵：

| 模式           | 說明                                                                                                                       | 模型                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **私密**    | 完全私密。提示詞/回應**絕不會被儲存或記錄**。暫時性。                                                       | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensored 等。 |
| **匿名化** | 透過 Venice 代理並移除中繼資料。底層提供者（OpenAI、Anthropic、Google、xAI）會看到匿名化請求。 | Claude、GPT、Gemini、Grok                                     |

<Warning>
匿名化模型**並非**完全私密。Venice 會在轉送前移除中繼資料，但底層提供者（OpenAI、Anthropic、Google、xAI）仍會處理該請求。需要完整隱私時，請選擇**私密**模型。
</Warning>

## 功能

- **注重隱私**：可在「私密」（完全私密）與「匿名化」（代理）模式之間選擇
- **無審查模型**：存取沒有內容限制的模型
- **主要模型存取**：透過 Venice 的匿名化代理使用 Claude、GPT、Gemini 和 Grok
- **OpenAI 相容 API**：標準 `/v1` 端點，便於整合
- **串流**：所有模型皆支援
- **函式呼叫**：特定模型支援（請檢查模型能力）
- **視覺**：具備視覺能力的模型支援
- **無硬性速率限制**：極端使用量可能套用合理使用節流

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="取得你的 API 金鑰">
    1. 在 [venice.ai](https://venice.ai) 註冊
    2. 前往**設定 > API 金鑰 > 建立新金鑰**
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
        1. 提示輸入你的 API 金鑰（或使用既有的 `VENICE_API_KEY`）
        2. 顯示所有可用的 Venice 模型
        3. 讓你選擇預設模型
        4. 自動設定提供者
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

設定完成後，OpenClaw 會顯示所有可用的 Venice 模型。請依需求選擇：

- **預設模型**：`venice/kimi-k2-5`，提供強大的私密推理加上視覺能力。
- **高能力選項**：`venice/claude-opus-4-6`，使用最強的匿名化 Venice 路徑。
- **隱私**：選擇「私密」模型以取得完全私密的推論。
- **能力**：選擇「匿名化」模型，透過 Venice 的代理存取 Claude、GPT、Gemini。

隨時變更你的預設模型：

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

列出所有可用模型：

```bash
openclaw models list --all --provider venice
```

你也可以執行 `openclaw configure`，選取**模型/驗證**，再選擇 **Venice AI**。

<Tip>
使用下表為你的使用情境選擇合適的模型。

| 使用情境                   | 建議模型                | 原因                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **一般聊天（預設）** | `kimi-k2-5`                      | 強大的私密推理加上視覺能力         |
| **整體最佳品質**   | `claude-opus-4-6`                | 最強的匿名化 Venice 選項           |
| **隱私 + 程式碼撰寫**       | `qwen3-coder-480b-a35b-instruct` | 具備大型脈絡的私密程式碼模型      |
| **私密視覺**         | `kimi-k2-5`                      | 不離開私密模式即可支援視覺  |
| **快速 + 便宜**           | `qwen3-4b`                       | 輕量推理模型                  |
| **複雜私密任務**  | `deepseek-v3.2`                  | 強大推理，但不支援 Venice 工具 |
| **無審查**             | `venice-uncensored`              | 無內容限制                      |

</Tip>

## DeepSeek V4 重放行為

如果 Venice 暴露 DeepSeek V4 模型，例如 `venice/deepseek-v4-pro` 或
`venice/deepseek-v4-flash`，OpenClaw 會在代理
省略必要的 DeepSeek V4 `reasoning_content` 重放佔位符時，將其填入助理訊息。
Venice 會拒絕 DeepSeek 原生頂層 `thinking` 控制，因此
OpenClaw 會將該提供者特定的重放修正，與原生
DeepSeek 提供者的思考控制分開處理。

## 內建目錄（共 41 個）

<AccordionGroup>
  <Accordion title="私密模型（26）— 完全私密，無日誌記錄">
    | 模型 ID                               | 名稱                                | 脈絡 | 功能                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | 預設、推理、視覺 |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | 推理                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | 一般                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | 一般                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | 一般，工具已停用    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | 推理                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | 一般                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | 程式碼撰寫                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | 程式碼撰寫                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | 推理、視覺          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | 一般                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | 視覺                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | 快速、推理            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | 推理，工具已停用  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | 無審查，工具已停用 |
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

  <Accordion title="匿名化模型（12）— 透過 Venice 代理">
    | 模型 ID                        | 名稱                           | 脈絡 | 功能                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | 推理、視覺         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | 推理、視覺         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | 推理、視覺         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | 推理、視覺、程式碼撰寫 |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | 推理                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | 推理、視覺、程式碼撰寫 |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | 視覺                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | 視覺                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | 推理、視覺         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | 推理、視覺         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | 推理、視覺         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | 推理、視覺         |
  </Accordion>
</AccordionGroup>

## 模型探索

OpenClaw 隨附由資訊清單支援的 Venice 種子目錄，用於唯讀模型列表。執行階段重新整理仍可從 Venice API 探索模型，若 API 無法連線，則會回退到資訊清單目錄。

`/models` 端點是公開的（列出模型不需要驗證），但推論需要有效的 API 金鑰。

## 串流與工具支援

| 功能                 | 支援                                                 |
| -------------------- | ---------------------------------------------------- |
| **串流**             | 所有模型                                             |
| **函式呼叫**         | 大多數模型（請檢查 API 中的 `supportsFunctionCalling`） |
| **視覺/圖片**        | 標示有「視覺」功能的模型                             |
| **JSON 模式**        | 透過 `response_format` 支援                          |

## 定價

Venice 使用點數制。請查看 [venice.ai/pricing](https://venice.ai/pricing) 以取得目前費率：

- **私有模型**：通常成本較低
- **匿名化模型**：類似直接 API 定價，加上少量 Venice 費用

### Venice（匿名化）與直接 API 比較

| 面向         | Venice（匿名化）              | 直接 API           |
| ------------ | ----------------------------- | ------------------ |
| **隱私**     | 移除中繼資料並匿名化           | 連結你的帳戶       |
| **延遲**     | +10-50ms（代理）              | 直接               |
| **功能**     | 支援大多數功能                 | 完整功能           |
| **計費**     | Venice 點數                    | 供應商計費         |

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

  <Accordion title="模型不可用">
    Venice 模型目錄會動態更新。請執行 `openclaw models list` 查看目前可用的模型。部分模型可能暫時離線。
  </Accordion>

  <Accordion title="連線問題">
    Venice API 位於 `https://api.venice.ai/api/v1`。請確認你的網路允許 HTTPS 連線。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting) 和 [FAQ](/zh-TW/help/faq)。
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
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 首頁與帳戶註冊。
  </Card>
  <Card title="API 文件" href="https://docs.venice.ai" icon="book">
    Venice API 參考與開發者文件。
  </Card>
  <Card title="定價" href="https://venice.ai/pricing" icon="credit-card">
    目前的 Venice 點數費率與方案。
  </Card>
</CardGroup>
