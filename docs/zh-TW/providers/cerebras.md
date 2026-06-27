---
read_when:
    - 你想搭配 OpenClaw 使用 Cerebras
    - 你需要 Cerebras API 金鑰環境變數或命令列介面驗證選項
summary: Cerebras 設定（驗證 + 模型選擇）
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T19:52:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) 在自訂推論硬體上提供高速、與 OpenAI 相容的推論。Cerebras 供應商外掛包含一個靜態的四模型目錄。

| 屬性            | 值                                       |
| --------------- | ---------------------------------------- |
| 供應商 ID       | `cerebras`                               |
| 外掛            | 官方外部套件                             |
| 驗證環境變數    | `CEREBRAS_API_KEY`                       |
| 入門設定旗標    | `--auth-choice cerebras-api-key`         |
| 直接命令列介面旗標 | `--cerebras-api-key <key>`               |
| API             | 與 OpenAI 相容 (`openai-completions`)    |
| 基底 URL        | `https://api.cerebras.ai/v1`             |
| 預設模型        | `cerebras/zai-glm-4.7`                   |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

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

    清單應包含全部四個靜態模型。如果 `CEREBRAS_API_KEY` 無法解析，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少的憑證。

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

OpenClaw 隨附一個靜態 Cerebras 目錄，對應公開的 OpenAI 相容端點。全部四個模型都共用 128k 上下文與 8,192 個最大輸出 token。

| 模型參照                                  | 名稱                 | 推理 | 備註                                   |
| ----------------------------------------- | -------------------- | ---- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 是   | 預設模型；預覽推理模型                 |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 是   | 生產用推理模型                         |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 否   | 預覽非推理模型                         |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 否   | 生產用速度導向模型                     |

<Warning>
  Cerebras 將 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 標記為預覽模型，且文件指出 `llama3.1-8b` 以及 `qwen-3-235b-a22b-instruct-2507` 將於 2026 年 5 月 27 日淘汰。將它們用於生產工作負載前，請先查看 Cerebras 的支援模型頁面。
</Warning>

## 手動設定

此外掛通常表示你只需要 API 金鑰。當你想覆寫模型中繼資料，或以 `mode: "merge"` 搭配靜態目錄執行時，請使用明確的 `models.providers.cerebras` 設定：

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
  如果閘道以常駐程式執行（launchd、systemd、Docker），請確保 `CEREBRAS_API_KEY` 可供該程序使用，例如放在 `~/.openclaw/.env` 中，或透過 `env.shellEnv` 提供。除非另外匯入環境變數，否則只在互動式 shell 中匯出的金鑰，對受管理的服務沒有幫助。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型供應商" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇供應商、模型參照與容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    適用於兩個具備推理能力的 Cerebras 模型的推理努力等級。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理預設值與模型設定。
  </Card>
  <Card title="模型常見問題" href="/zh-TW/help/faq-models" icon="circle-question">
    驗證設定檔、切換模型，以及解決「no profile」錯誤。
  </Card>
</CardGroup>
