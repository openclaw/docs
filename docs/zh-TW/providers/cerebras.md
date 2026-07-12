---
read_when:
    - 你想在 OpenClaw 中使用 Cerebras
    - 你需要設定 Cerebras API 金鑰環境變數，或選擇命令列介面的驗證方式
summary: Cerebras 設定（驗證 + 模型選擇）
title: Cerebras
x-i18n:
    generated_at: "2026-07-11T21:42:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) 在自訂推論硬體上提供高速且相容 OpenAI 的推論服務。此外掛隨附靜態的四模型目錄（不進行即時探索）。

| 屬性            | 值                                                        |
| --------------- | --------------------------------------------------------- |
| 提供者 ID       | `cerebras`                                                |
| 外掛            | 官方外部套件（`@openclaw/cerebras-provider`）             |
| 驗證環境變數    | `CEREBRAS_API_KEY`                                        |
| 初始設定旗標    | `--auth-choice cerebras-api-key`                          |
| 直接命令列旗標  | `--cerebras-api-key <key>`                                |
| API             | 相容 OpenAI（`openai-completions`）                       |
| 基礎 URL        | `https://api.cerebras.ai/v1`                              |
| 預設模型        | `cerebras/zai-glm-4.7`                                    |

## 安裝外掛

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 中建立 API 金鑰。
  </Step>
  <Step title="執行初始設定">
    <CodeGroup>

```bash 初始設定
openclaw onboard --auth-choice cerebras-api-key
```

```bash 直接旗標
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash 僅使用環境變數
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="確認模型可用">
    ```bash
    openclaw models list --provider cerebras
    ```

    列出全部四個靜態模型。如果無法解析 `CEREBRAS_API_KEY`，`openclaw models status --json` 會在 `auth.unusableProfiles` 下回報缺少憑證。

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

全部四個模型都具有 128k 的上下文視窗，以及最多 8,192 個輸出權杖。

| 模型參照                                  | 名稱                 | 推理 | 備註                         |
| ----------------------------------------- | -------------------- | ---- | ---------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 是   | 預設模型；預覽版推理模型     |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 是   | 正式環境推理模型             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 否   | 預覽版非推理模型             |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 否   | 著重速度的正式環境模型       |

<Warning>
Cerebras 將 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 標示為預覽版模型，且文件指出 `llama3.1-8b` 與 `qwen-3-235b-a22b-instruct-2507` 將於 2026 年 5 月 27 日淘汰。在正式環境工作負載中採用這些模型前，請先查看 Cerebras 的[支援模型頁面](https://inference-docs.cerebras.ai/models/overview)。
</Warning>

## 手動設定

大多數設定只需要 API 金鑰。若要覆寫模型中繼資料，或以 `mode: "merge"` 搭配靜態目錄執行，請使用明確的 `models.providers.cerebras` 設定：

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
如果閘道以常駐程式執行（launchd、systemd、Docker），請確保該處理程序可取得 `CEREBRAS_API_KEY`，例如將其放在 `~/.openclaw/.env` 中，或透過 `env.shellEnv` 提供。除非另行匯入環境變數，否則只在互動式 shell 中匯出的金鑰無法供受管理的服務使用。
</Note>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    選擇提供者、模型參照及容錯移轉行為。
  </Card>
  <Card title="思考模式" href="/zh-TW/tools/thinking" icon="brain">
    兩個具推理能力的 Cerebras 模型所支援的推理投入程度。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/config-agents#agent-defaults" icon="gear">
    代理程式預設值與模型設定。
  </Card>
  <Card title="模型常見問題" href="/zh-TW/help/faq-models" icon="circle-question">
    驗證設定檔、切換模型，以及解決「無設定檔」錯誤。
  </Card>
</CardGroup>
