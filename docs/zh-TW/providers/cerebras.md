---
read_when:
    - 你想要將 Cerebras 與 OpenClaw 搭配使用
    - 你需要 Cerebras API 金鑰環境變數或 CLI 驗證選項
summary: Cerebras 設定（身分驗證 + 模型選擇）
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T03:29:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) 提供高速的 OpenAI 相容推論。

| 屬性     | 值                           |
| -------- | ---------------------------- |
| 提供者   | `cerebras`                   |
| 驗證     | `CEREBRAS_API_KEY`           |
| API      | OpenAI 相容                  |
| 基底 URL | `https://api.cerebras.ai/v1` |

## 入門

<Steps>
  <Step title="取得 API 金鑰">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 建立 API 金鑰。
  </Step>
  <Step title="執行 onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### 非互動式設定

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 內建目錄

OpenClaw 為公開的 OpenAI 相容端點隨附靜態 Cerebras 目錄：

| 模型參照                                  | 名稱                 | 備註                               |
| ----------------------------------------- | -------------------- | ---------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 預設模型；預覽推理模型             |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 生產環境推理模型                   |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 預覽非推理模型                     |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 生產環境速度導向模型               |

<Warning>
Cerebras 將 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 標示為預覽模型，而 `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` 文件記載將於 2026 年 5 月 27 日淘汰。在生產環境依賴它們之前，請先查看 Cerebras 的支援模型頁面。
</Warning>

## 手動設定

內建 Plugin 通常表示你只需要 API 金鑰。當你想覆寫模型中繼資料時，請使用明確的
`models.providers.cerebras` 設定：

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
如果 Gateway 以守護程式（launchd/systemd）執行，請確保 `CEREBRAS_API_KEY`
可供該程序使用，例如放在 `~/.openclaw/.env` 中，或透過
`env.shellEnv`。
</Note>
