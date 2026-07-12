---
read_when:
    - 你想搭配 OpenClaw 使用 Featherless AI
    - 你需要 Featherless API 金鑰環境變數或模型參照格式
summary: Featherless AI 設定、模型選擇與工具呼叫
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T14:48:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) 透過與 OpenAI 相容的 API 提供開放模型。OpenClaw 會將 Featherless 安裝為官方外部供應商外掛，在維持內建目錄精簡的同時，也會在執行階段接受 Featherless 的確切模型 ID。

| 屬性 | 值 |
| --------------- | ---------------------------------------- |
| 供應商 ID | `featherless` |
| 套件 | `@openclaw/featherless-provider` |
| 驗證環境變數 | `FEATHERLESS_API_KEY` |
| 初始設定旗標 | `--auth-choice featherless-api-key` |
| 直接命令列介面旗標 | `--featherless-api-key <key>` |
| API | 與 OpenAI 相容（`openai-completions`） |
| 基礎 URL | `https://api.featherless.ai/v1` |
| 預設模型 | `featherless/Qwen/Qwen3-32B` |

## 設定

安裝外掛並重新啟動閘道：

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

執行初始設定：

```bash
openclaw onboard --auth-choice featherless-api-key
```

若要進行非互動式設定：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

或將金鑰提供給閘道程序：

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

驗證供應商：

```bash
openclaw models list --provider featherless
```

## 預設模型

此外掛使用 `Qwen/Qwen3-32B` 作為設定時的預設模型，因為 Featherless 文件指出 Qwen 3 系列支援原生工具呼叫。OpenClaw 會為其設定 32,768 個權杖的上下文視窗、保守的 4,096 個權杖輸出上限，以及 Qwen 聊天範本的思考控制選項。

目錄中的成本欄位為零，因為 Featherless 支援多種計費模式，且 OpenClaw 不會內嵌帳戶特定方案或單次請求定價費率。

## 其他 Featherless 模型

在 `featherless/` 供應商前綴後使用確切的 Featherless 模型 ID：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw 刻意不將 Featherless 的完整公開模型索引複製到選擇器中。該索引規模龐大，且未提供足夠的結構化能力中繼資料，無法安全地分類每個文字、視覺、嵌入和推理模型。因此，未知 ID 會使用保守的純文字、非推理預設值解析：4,096 個權杖的上下文視窗和 1,024 個權杖的輸出上限。

當模型需要不同的中繼資料時，請新增明確的供應商模型項目：

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

新增自訂中繼資料前，請查看 Featherless 的模型目錄，確認目前的模型可用性與能力標籤。

## 疑難排解

- `401` 或 `403`：確認閘道程序可存取 `FEATHERLESS_API_KEY`，或再次執行初始設定。
- 未知模型：在 `featherless/` 前綴後使用 Featherless 提供的確切區分大小寫 ID。
- 工具呼叫以文字形式傳回：選擇 Featherless 文件中標示支援原生函式呼叫的模型系列，例如 Qwen 3。
- 受管理的閘道無法存取金鑰：將其放入 `~/.openclaw/.env` 或服務載入的其他環境來源，然後重新啟動閘道。

## 相關內容

- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)
- [思考模式](/zh-TW/tools/thinking)
