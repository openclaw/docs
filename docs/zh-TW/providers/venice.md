---
read_when:
    - 你想在 OpenClaw 中使用注重隱私的推論
    - 你想取得 Venice AI 的設定指南
summary: 在 OpenClaw 中使用注重隱私的 Venice AI 模型
title: Venice AI
x-i18n:
    generated_at: "2026-07-19T14:03:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 13c32b783394eb3092ff94a532b69e34c00624127b0e76e4e2812751d39073a1
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) 提供以隱私為重點的推論服務：開放模型在
不記錄任何內容的情況下執行，並提供對 Claude、GPT、Gemini 和 Grok 的匿名化代理存取。
所有端點皆與 OpenAI 相容（`/v1`）。

## 隱私模式

| 模式           | 行為                                                         | 模型                                                        |
| -------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| **私密**    | 提示詞／回應絕不儲存或記錄，且僅短暫存在。         | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensored 等。 |
| **匿名化** | 透過 Venice 代理，並在轉送前移除中繼資料。 | Claude、GPT、Gemini、Grok                                     |

<Warning>
匿名化模型並非完全私密。Venice 會在轉送前移除中繼資料，但底層供應商（OpenAI、Anthropic、Google、xAI）仍會處理該請求。需要完全隱私時，請使用私密模型。
</Warning>

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="取得你的 API 金鑰">
    1. 前往 [venice.ai](https://venice.ai) 註冊
    2. 前往 **Settings > API Keys > Create new key**
    3. 複製你的 API 金鑰（格式：`vapi_xxxxxxxxxxxx`）
  </Step>
  <Step title="設定 OpenClaw">
    <Tabs>
      <Tab title="互動式（建議）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        系統會提示輸入 API 金鑰（或重複使用現有的 `VENICE_API_KEY`）、列出可用的 Venice 模型，並設定你的預設模型。
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
    openclaw agent --model venice/kimi-k2-5 --message "你好，可以正常運作嗎？"
    ```
  </Step>
</Steps>

## 模型選擇

- **預設**：`venice/kimi-k2-5`（私密、推理、視覺）。
- **最強的匿名化選項**：`venice/claude-opus-4-6`。

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

你也可以執行 `openclaw configure`，然後選擇 **Model/auth provider > Venice AI**。

<Tip>
| 使用情境              | 模型                                        | 原因                                    |
| --------------------- | -------------------------------------------- | -------------------------------------- |
| 一般聊天（預設） | `kimi-k2-5`                                  | 強大的私密推理與視覺能力   |
| 最佳整體品質   | `claude-opus-4-6`                            | Venice 最強的匿名化選項     |
| 隱私＋程式設計       | `qwen3-coder-480b-a35b-instruct-turbo`       | 具備大型上下文的私密程式設計模型 |
| 快速且便宜           | `llama-3.2-3b`                               | 精簡的私密模型                  |
| 複雜的私密任務  | `deepseek-v3.2`                              | 強大的推理能力；已停用工具呼叫 |
| 無審查             | `venice-uncensored-1-2`                      | Venice 目前的無審查模型        |
</Tip>

## 內建目錄（30 個模型）

<AccordionGroup>
  <Accordion title="私密模型（20 個）— 完全私密，不記錄">
    | 模型 ID                               | 名稱                                 | 上下文 | 備註                      |
    | -------------------------------------- | ------------------------------------- | ------- | --------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k    | 預設、推理、視覺  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k    | 通用                     |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k    | 通用                     |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k    | 通用、已停用工具     |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k    | 推理                   |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k    | 通用                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k    | 程式設計                      |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k    | 推理、視覺           |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k    | 通用                     |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B（視覺）                | 256k    | 視覺                      |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k    | 推理、已停用工具    |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k    | 視覺                       |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k    | 通用                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k    | 通用                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k    | 推理                    |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k    | 通用                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k    | 推理                    |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k    | 推理                    |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k    | 推理                    |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k    | 推理                    |
  </Accordion>

  <Accordion title="匿名化模型（10 個）— 透過 Venice 代理">
    | 模型 ID                        | 名稱                           | 上下文 | 備註                      |
    | -------------------------------- | -------------------------------- | ------- | ---------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6（透過 Venice）    | 1M      | 推理、視覺            |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6（透過 Venice）  | 1M      | 推理、視覺            |
    | `openai-gpt-54`                 | GPT-5.4（透過 Venice）            | 1M      | 推理、視覺            |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex（透過 Venice）      | 400k    | 推理、視覺、程式設計     |
    | `openai-gpt-52`                 | GPT-5.2（透過 Venice）            | 256k    | 推理                    |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex（透過 Venice）      | 256k    | 推理、視覺、程式設計     |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o（透過 Venice）             | 128k    | 視覺                        |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini（透過 Venice）        | 128k    | 視覺                        |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro（透過 Venice）     | 1M      | 推理、視覺             |
    | `gemini-3-flash-preview`        | Gemini 3 Flash（透過 Venice）     | 256k    | 推理、視覺             |
  </Accordion>
</AccordionGroup>

由 Grok 支援的 Venice 模型（`grok-4-3` 及類似模型）會套用與原生 xAI 供應商相同的工具結構描述
相容性修補，因為它們使用相同的上游
工具呼叫格式。

## 模型探索

上述隨附目錄是由資訊清單支援的種子清單。OpenClaw 會在執行階段
從 Venice 的 `/models` API 重新整理該目錄，若
API 無法連線，則回復使用種子清單。`/models` 端點是公開的（列出模型不需要驗證），
但推論需要有效的 API 金鑰。

Venice 可能會繼續接受已淘汰的模型 ID，將其視為供應商所擁有的別名。
OpenClaw 目錄僅公布 `/models` 傳回的標準模型 ID。

## DeepSeek V4 重播行為

如果 Venice 公開 DeepSeek V4 模型，例如 `deepseek-v4-pro` 或
`deepseek-v4-flash`，當 Venice 省略必要的 `reasoning_content` 重播
欄位時，OpenClaw 會在助理訊息中填入該欄位，並從請求承載資料中移除 `thinking`／
`reasoning`／`reasoning_effort`（Venice 會拒絕這些模型上的
DeepSeek 原生 `thinking` 控制項）。這項重播修正
與原生 DeepSeek 供應商本身的思考控制項彼此獨立。

## 串流與工具支援

| 功能          | 支援                                           |
| ---------------- | ------------------------------------------------- |
| 串流        | 所有模型                                        |
| 函式呼叫 | 大多數模型；上述註明者會依模型停用 |
| 視覺／影像    | 上述標示為「視覺」的模型                      |
| JSON 模式        | 透過 `response_format`                             |

## 定價

Venice 採用點數制。匿名化模型的費用大致等同於
直接 API 定價加上少量 Venice 費用。最新費率請參閱
[venice.ai/pricing](https://venice.ai/pricing)。

## 使用範例

```bash
# 預設私密模型
openclaw agent --model venice/kimi-k2-5 --message "快速健康檢查"

# 透過 Venice 使用 Claude Opus（匿名化）
openclaw agent --model venice/claude-opus-4-6 --message "摘要此任務"

# 無審查模型
openclaw agent --model venice/venice-uncensored-1-2 --message "草擬選項"

# 搭配影像的視覺模型
openclaw agent --model venice/qwen3-vl-235b-a22b --message "檢閱附加的影像"

# 程式設計模型
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct-turbo --message "重構此函式"
```

## 疑難排解

<AccordionGroup>
  <Accordion title="無法辨識 API 金鑰">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    確認金鑰以 `vapi_` 開頭。

  </Accordion>

  <Accordion title="模型無法使用">
    執行 `openclaw models list --all --provider venice` 以查看目前
    可用的模型；目錄會隨 Venice 新增或淘汰模型而變更。
  </Accordion>

  <Accordion title="連線問題">
    Venice API 位於 `https://api.venice.ai/api/v1`。確認你的網路允許透過 HTTPS 連線至該主機。
  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
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

## 相關內容

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 首頁與帳戶註冊。
  </Card>
  <Card title="API 文件" href="https://docs.venice.ai" icon="book">
    Venice API 參考資料與開發者文件。
  </Card>
  <Card title="定價" href="https://venice.ai/pricing" icon="credit-card">
    Venice 目前的點數費率與方案。
  </Card>
</CardGroup>
