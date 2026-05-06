---
read_when:
    - 你想將 Cerebras 與 OpenClaw 搭配使用
    - 你需要 Cerebras API 金鑰環境變數或 CLI 認證選項
summary: Cerebras 設定（身分驗證 + 模型選擇）
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T02:55:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) 在自訂推論硬體上提供高速、與 OpenAI 相容的推論。OpenClaw 包含一個內建的 Cerebras 提供者 Plugin，並附有靜態四模型目錄。

| 屬性            | 值                                       |
| --------------- | ---------------------------------------- |
| 提供者 ID       | `cerebras`                               |
| Plugin          | 內建，`enabledByDefault: true`           |
| 驗證環境變數    | `CEREBRAS_API_KEY`                       |
| 入門設定旗標    | `--auth-choice cerebras-api-key`         |
| 直接 CLI 旗標   | `--cerebras-api-key <key>`               |
| API             | 與 OpenAI 相容 (`openai-completions`)    |
| 基底 URL        | `https://api.cerebras.ai/v1`             |
| 預設模型        | `cerebras/zai-glm-4.7`                   |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 建立 API 金鑰。
  </Step>
  <Step title="執行入門設定">
    <CodeGroup>

```bash 入門設定
openclaw onboard --auth-choice cerebras-api-key
```

```bash 直接旗標
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash 僅環境變數
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider cerebras
    ```

    清單應包含全部四個內建模型。如果無法解析 `CEREBRAS_API_KEY`，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的認證。

  </Step>
</Steps>

## 非互動式設定

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 內建目錄

OpenClaw 隨附靜態 Cerebras 目錄，對應公開的 OpenAI 相容端點。全部四個模型都共用 128k 上下文和 8,192 個最大輸出 Token。

| 模型參照                                  | 名稱                 | 推理 | 備註                               |
| ----------------------------------------- | -------------------- | ---- | ---------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 是   | 預設模型；預覽版推理模型           |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 是   | 生產用推理模型                     |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 否   | 預覽版非推理模型                   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 否   | 生產用速度導向模型                 |

<Warning>
  Cerebras 將 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 標示為預覽版模型，且文件記載 `llama3.1-8b` 與 `qwen-3-235b-a22b-instruct-2507` 將於 2026 年 5 月 27 日淘汰。在生產工作負載中依賴這些模型之前，請先查看 Cerebras 的支援模型頁面。
</Warning>

## 手動設定

內建 Plugin 通常表示你只需要 API 金鑰。當你想覆寫模型中繼資料，或在 `mode: "merge"` 下搭配靜態目錄執行時，請使用明確的 `models.providers.cerebras` 設定：

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
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
  如果 Gateway 以守護程式執行（launchd、systemd、Docker），請確認 `CEREBRAS_API_KEY` 可供該程序使用，例如放在 `~/.openclaw/.env` 中，或透過 `env.shellEnv` 提供。只放在 `~/.profile` 中的金鑰，除非另外匯入環境變數，否則對受管理的服務沒有幫助。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照和容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    適用於兩個支援推理的 Cerebras 模型的推理投入等級。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    Agent 預設值和模型設定。
  </Card>
  <Card title="模型常見問題" href="/zh-TW/help/faq-models" icon="circle-question">
    驗證設定檔、切換模型，以及解決「沒有設定檔」錯誤。
  </Card>
</CardGroup>
