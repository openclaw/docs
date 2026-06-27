---
read_when:
    - 你想透過 Ollama 使用雲端或本機模型執行 OpenClaw
    - 您需要 Ollama 的安裝與設定指南
    - 你想使用 Ollama 視覺模型進行影像理解
summary: 搭配 Ollama 執行 OpenClaw（雲端與本機模型）
title: Ollama
x-i18n:
    generated_at: "2026-06-27T19:56:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw 會透過 Ollama 的原生 API (`/api/chat`) 整合託管雲端模型與本機/自行託管的 Ollama 伺服器。你可以用三種模式使用 Ollama：透過可連線的 Ollama 主機使用 `Cloud + Local`、針對 `https://ollama.com` 使用 `Cloud only`，或針對可連線的 Ollama 主機使用 `Local only`。

OpenClaw 也會將 `ollama-cloud` 註冊為第一級託管提供者 ID，供
直接使用 Ollama Cloud。當你想要僅雲端路由、且不共用本機 `ollama` 提供者 ID 時，請使用像
`ollama-cloud/kimi-k2.5:cloud` 這樣的參照。

如需專用的僅雲端設定頁面，請參閱 [Ollama Cloud](/zh-TW/providers/ollama-cloud)。

<Warning>
**遠端 Ollama 使用者**：請勿在 OpenClaw 中使用 `/v1` OpenAI 相容 URL (`http://host:11434/v1`)。這會破壞工具呼叫，且模型可能會將原始工具 JSON 當作純文字輸出。請改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（沒有 `/v1`）。
</Warning>

Ollama 提供者設定使用 `baseUrl` 作為標準鍵。OpenClaw 也接受 `baseURL` 以相容 OpenAI SDK 風格的範例，但新的設定應優先使用 `baseUrl`。

## 驗證規則

<AccordionGroup>
  <Accordion title="本機與 LAN 主機">
    本機與 LAN Ollama 主機不需要真正的 bearer token。OpenClaw 只會對 loopback、私人網路、`.local` 與裸主機名稱的 Ollama base URL 使用本機 `ollama-local` 標記。
  </Accordion>
  <Accordion title="遠端與 Ollama Cloud 主機">
    遠端公開主機與 Ollama Cloud (`https://ollama.com`) 需要透過 `OLLAMA_API_KEY`、驗證設定檔，或提供者的 `apiKey` 提供真正的憑證。若要直接使用託管服務，建議使用提供者 `ollama-cloud`。
  </Accordion>
  <Accordion title="自訂提供者 ID">
    設定 `api: "ollama"` 的自訂提供者 ID 會遵循相同規則。例如，指向私人 LAN Ollama 主機的 `ollama-remote` 提供者可以使用 `apiKey: "ollama-local"`，子代理會透過 Ollama 提供者 hook 解析該標記，而不是將它視為缺少憑證。記憶搜尋也可以將 `agents.defaults.memorySearch.provider` 設為該自訂提供者 ID，讓嵌入使用相符的 Ollama 端點。
  </Accordion>
  <Accordion title="驗證設定檔">
    `auth-profiles.json` 會儲存提供者 ID 的憑證。請將端點設定（`baseUrl`、`api`、模型 ID、標頭、逾時）放在 `models.providers.<id>`。較舊的扁平驗證設定檔檔案，例如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`，不是執行階段格式；請執行 `openclaw doctor --fix`，將它們重寫為標準的 `ollama-windows:default` API 金鑰設定檔，並建立備份。該檔案中的 `baseUrl` 是相容性雜訊，應移至提供者設定。
  </Accordion>
  <Accordion title="記憶嵌入範圍">
    當 Ollama 用於記憶嵌入時，bearer 驗證會限定在宣告它的主機：

    - 提供者層級的金鑰只會傳送到該提供者的 Ollama 主機。
    - `agents.*.memorySearch.remote.apiKey` 只會傳送到其遠端嵌入主機。
    - 純 `OLLAMA_API_KEY` 環境值會被視為 Ollama Cloud 慣例，預設不會傳送到本機或自行託管的主機。

  </Accordion>
</AccordionGroup>

## 開始使用

選擇你偏好的設定方法與模式。

<Tabs>
  <Tab title="Onboarding（建議）">
    **最適合：**最快完成可用 Ollama 雲端或本機設定的路徑。

    <Steps>
      <Step title="執行 onboarding">
        ```bash
        openclaw onboard
        ```

        從提供者清單選取 **Ollama**。
      </Step>
      <Step title="選擇你的模式">
        - **Cloud + Local** — 本機 Ollama 主機加上透過該主機路由的雲端模型
        - **Cloud only** — 透過 `https://ollama.com` 使用託管 Ollama 模型
        - **Local only** — 僅使用本機模型

      </Step>
      <Step title="選取模型">
        `Cloud only` 會提示輸入 `OLLAMA_API_KEY` 並建議託管雲端預設值。`Cloud + Local` 與 `Local only` 會要求提供 Ollama base URL、探索可用模型，並在所選本機模型尚不可用時自動 pull 該模型。當 Ollama 回報已安裝的 `:latest` 標籤（例如 `gemma4:latest`）時，設定流程只會顯示該已安裝模型一次，而不是同時顯示 `gemma4` 與 `gemma4:latest`，也不會再次 pull 裸別名。`Cloud + Local` 也會檢查該 Ollama 主機是否已登入以使用雲端存取。
      </Step>
      <Step title="確認模型可用">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非互動模式

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    可選擇指定自訂 base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手動設定">
    **最適合：**完整控制雲端或本機設定。

    <Steps>
      <Step title="選擇雲端或本機">
        - **Cloud + Local**：安裝 Ollama、使用 `ollama signin` 登入，並透過該主機路由雲端請求
        - **Cloud only**：搭配 `OLLAMA_API_KEY` 使用 `https://ollama.com`
        - **Local only**：從 [ollama.com/download](https://ollama.com/download) 安裝 Ollama

      </Step>
      <Step title="Pull 本機模型（僅本機）">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="為 OpenClaw 啟用 Ollama">
        對於 `Cloud only`，請使用你真正的 `OLLAMA_API_KEY`。對於由主機支援的設定，任何 placeholder 值都可使用：

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="檢查並設定你的模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在設定中設定預設值：

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 雲端模型

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` 會使用可連線的 Ollama 主機，作為本機與雲端模型的控制點。這是 Ollama 偏好的混合流程。

    在設定期間使用 **Cloud + Local**。OpenClaw 會提示輸入 Ollama base URL、從該主機探索本機模型，並檢查主機是否已透過 `ollama signin` 登入以使用雲端存取。當主機已登入時，OpenClaw 也會建議託管雲端預設值，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 與 `glm-5.1:cloud`。

    如果主機尚未登入，OpenClaw 會讓設定維持僅本機，直到你執行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 會針對位於 `https://ollama.com` 的 Ollama 託管 API 執行。

    在設定期間使用 **Cloud only**。OpenClaw 會提示輸入 `OLLAMA_API_KEY`、設定 `baseUrl: "https://ollama.com"`，並植入託管雲端模型清單。此路徑**不**需要本機 Ollama 伺服器或 `ollama signin`。

    `openclaw onboard` 期間顯示的雲端模型清單會即時從 `https://ollama.com/api/tags` 填入，上限為 500 筆，因此選擇器會反映目前的託管目錄，而不是靜態種子。如果 `ollama.com` 無法連線或在設定時未回傳模型，OpenClaw 會退回先前的硬編碼建議，讓 onboarding 仍可完成。

    你也可以直接設定第一級雲端提供者：

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    在僅本機模式中，OpenClaw 會從已設定的 Ollama 執行個體探索模型。此路徑適用於本機或自行託管的 Ollama 伺服器。

    OpenClaw 目前建議 `gemma4` 作為本機預設值。

  </Tab>
</Tabs>

## 模型探索（隱含提供者）

當你設定 `OLLAMA_API_KEY`（或驗證設定檔），且**未**定義 `models.providers.ollama` 或其他帶有 `api: "ollama"` 的自訂遠端提供者時，OpenClaw 會從位於 `http://127.0.0.1:11434` 的本機 Ollama 執行個體探索模型。

| 行為                 | 詳細資訊                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目錄查詢             | 查詢 `/api/tags`                                                                                                                                                     |
| 能力偵測             | 使用 best-effort `/api/show` 查詢來讀取 `contextWindow`、展開的 `num_ctx` Modelfile 參數，以及包含視覺/工具的能力                                                   |
| 視覺模型             | 由 `/api/show` 回報具備 `vision` 能力的模型會標記為可處理影像（`input: ["text", "image"]`），因此 OpenClaw 會自動將影像注入提示                                     |
| 推理偵測             | 可用時使用 `/api/show` 能力，包括 `thinking`；當 Ollama 省略能力時，退回模型名稱啟發式判斷（`r1`、`reasoning`、`think`）                                            |
| Token 限制           | 將 `maxTokens` 設為 OpenClaw 使用的預設 Ollama 最大 token 上限                                                                                                       |
| 成本                 | 將所有成本設為 `0`                                                                                                                                                   |

這可避免手動建立模型項目，同時讓目錄與本機 Ollama 執行個體保持一致。你可以在本機 `infer model run` 中使用完整參照，例如 `ollama/<pulled-model>:latest`；OpenClaw 會從 Ollama 的即時目錄解析該已安裝模型，不需要手寫 `models.json` 項目。

對於已登入的 Ollama 主機，某些 `:cloud` 模型可能會在出現在 `/api/tags` 之前，
就已可透過 `/api/chat` 與 `/api/show` 使用。當你明確選取完整
`ollama/<model>:cloud` 參照時，OpenClaw 會使用 `/api/show` 驗證該確切缺漏模型，
且只有在 Ollama 確認模型中繼資料時，才會將它加入執行階段目錄。
輸入錯誤仍會以未知模型失敗，而不是被自動建立。

```bash
# See what models are available
ollama list
openclaw models list
```

若要執行一個避開完整代理工具表面的窄範圍文字生成 smoke test，
請使用本機 `infer model run` 搭配完整 Ollama 模型參照：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

該路徑仍會使用 OpenClaw 已設定的提供者、驗證與原生 Ollama
傳輸，但不會啟動聊天代理回合，也不會載入 MCP/工具脈絡。如果
這個成功而一般代理回覆失敗，接著請排查模型的代理提示/工具容量。

若要在相同精簡路徑上對視覺模型執行窄範圍 smoke test，請將一個或多個
影像檔加入 `infer model run`。這會將提示與影像直接傳送到
所選的 Ollama 視覺模型，而不會載入聊天工具、記憶或先前
工作階段脈絡：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` 接受偵測為 `image/*` 的檔案，包括常見的 PNG、JPEG 和 WebP 輸入。非圖片檔案會在呼叫 Ollama 前被拒絕。若要進行語音辨識，請改用 `openclaw infer audio transcribe`。

當你使用 `/model ollama/<model>` 切換對話時，OpenClaw 會將其視為精確的使用者選擇。如果設定的 Ollama `baseUrl` 無法連線，下一次回覆會因提供者錯誤而失敗，而不是靜默改用另一個已設定的備援模型回答。

隔離的排程工作會在啟動代理回合前多做一次本機安全檢查。如果選取的模型解析為本機、私人網路或 `.local` Ollama 提供者，且 `/api/tags` 無法連線，OpenClaw 會將該次排程執行記錄為 `skipped`，並在錯誤文字中包含選取的 `ollama/<model>`。端點預檢會快取 5 分鐘，因此指向同一個已停止 Ollama 常駐程式的多個排程工作，不會全都啟動會失敗的模型請求。

使用以下指令針對本機 Ollama 即時驗證本機文字路徑、原生串流路徑和嵌入：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

若要進行 Ollama Cloud API 金鑰冒煙測試，請將即時測試指向 `https://ollama.com`，並從目前目錄選擇託管模型：

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

雲端冒煙測試會執行文字、原生串流和網頁搜尋。對於 `https://ollama.com`，它預設會略過嵌入，因為 Ollama Cloud API 金鑰可能未授權 `/api/embed`。當你明確希望即時測試在設定的雲端金鑰無法使用嵌入端點時失敗，請設定 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`。

若要新增模型，只要使用 Ollama 拉取即可：

```bash
ollama pull mistral
```

新模型會自動被探索並可供使用。

<Note>
如果你明確設定 `models.providers.ollama`，或設定自訂遠端提供者，例如使用 `api: "ollama"` 的 `models.providers.ollama-cloud`，系統會略過自動探索，你必須手動定義模型。像 `http://127.0.0.2:11434` 這類 loopback 自訂提供者仍會被視為本機。請參閱下方的明確設定章節。
</Note>

## 視覺與圖片描述

內建的 Ollama 外掛會將 Ollama 註冊為具圖片能力的媒體理解提供者。這讓 OpenClaw 能透過本機或託管的 Ollama 視覺模型，路由明確的圖片描述請求和已設定的圖片模型預設值。

若要使用本機視覺，請拉取支援圖片的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

接著使用 infer 命令列介面驗證：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必須是完整的 `<provider/model>` 參照。設定後，`openclaw infer image describe` 會直接執行該模型，而不是因為模型支援原生視覺而略過描述。

當你想使用 OpenClaw 的圖片理解提供者流程、已設定的 `agents.defaults.imageModel` 和圖片描述輸出形狀時，請使用 `infer image describe`。當你想用自訂提示和一張或多張圖片進行原始多模態模型探測時，請使用 `infer model run --file`。

若要讓 Ollama 成為傳入媒體的預設圖片理解模型，請設定 `agents.defaults.imageModel`：

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

建議使用完整的 `ollama/<model>` 參照。如果同一個模型列在 `models.providers.ollama.models` 下，並具有 `input: ["text", "image"]`，且沒有其他已設定的圖片提供者公開相同的裸模型 ID，OpenClaw 也會將像 `qwen2.5vl:7b` 這樣的裸 `imageModel` 參照正規化為 `ollama/qwen2.5vl:7b`。如果有多個已設定的圖片提供者具有相同的裸 ID，請明確使用提供者前綴。

較慢的本機視覺模型可能需要比雲端模型更長的圖片理解逾時。當 Ollama 嘗試在受限硬體上配置完整宣告的視覺內容時，它們也可能當機或停止。當你只需要一般圖片描述回合時，請設定能力逾時，並在模型項目上限制 `num_ctx`：

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

此逾時適用於傳入圖片理解，以及代理在回合期間可呼叫的明確 `image` 工具。提供者層級的 `models.providers.ollama.timeoutSeconds` 仍會控制一般模型呼叫底層 Ollama HTTP 請求的防護。

使用以下指令針對本機 Ollama 即時驗證明確圖片工具：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果你手動定義 `models.providers.ollama.models`，請將視覺模型標記為支援圖片輸入：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 會拒絕未標記為具圖片能力之模型的圖片描述請求。使用隱含探索時，當 `/api/show` 回報視覺能力，OpenClaw 會從 Ollama 讀取這項資訊。

## 設定

<Tabs>
  <Tab title="Basic (implicit discovery)">
    最簡單的僅本機啟用路徑是透過環境變數：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果已設定 `OLLAMA_API_KEY`，你可以在提供者項目中省略 `apiKey`，OpenClaw 會填入它以供可用性檢查使用。
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    當你需要託管雲端設定、Ollama 在另一個主機或連接埠上執行、想強制指定特定內容視窗或模型清單，或想完全手動定義模型時，請使用明確設定。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    如果 Ollama 在不同主機或連接埠上執行（明確設定會停用自動探索，因此請手動定義模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要將 `/v1` 加到 URL。`/v1` 路徑會使用 OpenAI 相容模式，工具呼叫在其中並不可靠。請使用不含路徑尾碼的 Ollama 基礎 URL。
    </Warning>

  </Tab>
</Tabs>

## 常見配方

請將這些作為起點，並把模型 ID 替換為 `ollama list` 或 `openclaw models list --provider ollama` 中的確切名稱。

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    當 Ollama 和閘道在同一台機器上執行，且你希望 OpenClaw 自動探索已安裝的模型時，請使用此方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    此路徑會讓設定保持最小化。除非你想手動定義模型，否則不要新增 `models.providers.ollama` 區塊。

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    對區域網路主機使用原生 Ollama URL。不要新增 `/v1`。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` 是 OpenClaw 端的內容預算。`params.num_ctx` 會隨請求傳送給 Ollama。當你的硬體無法執行模型完整宣告的內容時，請保持兩者一致。

  </Accordion>

  <Accordion title="Ollama Cloud only">
    當你不執行本機常駐程式，並想直接使用託管的 Ollama 模型時，請使用此方式。

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    當本機或區域網路 Ollama 常駐程式已使用 `ollama signin` 登入，並應同時提供本機模型和 `:cloud` 模型時，請使用此方式。

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Multiple Ollama hosts">
    當你有多個 Ollama 伺服器時，請使用自訂提供者 ID。每個提供者都有自己的主機、模型、驗證、逾時和模型參照。

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    當 OpenClaw 傳送請求時，會移除作用中的供應商前綴，因此 `ollama-large/qwen3.5:27b` 會以 `qwen3.5:27b` 的形式送達 Ollama。

  </Accordion>

  <Accordion title="精簡本機模型設定檔">
    有些本機模型可以回答簡單提示，但難以處理完整的代理工具介面。請先限制工具與上下文，再變更全域執行階段設定。

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    只有在模型或伺服器對工具結構描述穩定失敗時，才使用 `compat.supportsTools: false`。它會以代理能力換取穩定性。
    `localModelLean` 會從直接代理介面移除瀏覽器、排程與訊息工具，並預設將較大的目錄放在結構化工具搜尋控制項後方，除非某次執行必須保留直接訊息傳遞語意，但它不會變更 Ollama 的執行階段上下文或思考模式。對於會迴圈或把回應預算花在隱藏推理上的小型 Qwen 風格思考模型，請搭配明確的 `params.num_ctx` 與 `params.thinking: false`。

  </Accordion>
</AccordionGroup>

### 模型選擇

設定完成後，你所有的 Ollama 模型都可以使用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

也支援自訂 Ollama 供應商 ID。當模型參照使用作用中的
供應商前綴，例如 `ollama-spark/qwen3:32b`，OpenClaw 只會在呼叫
Ollama 前移除該前綴，因此伺服器會收到 `qwen3:32b`。

對於速度較慢的本機模型，請優先使用供應商範圍的請求調校，再提高
整個代理執行階段逾時：

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` 會套用到模型 HTTP 請求，包括連線設定、
標頭、主體串流，以及整體受保護擷取中止。`params.keep_alive`
會在原生 `/api/chat` 請求中作為頂層 `keep_alive` 轉送至 Ollama；
當首輪載入時間是瓶頸時，請依模型設定。

### 快速驗證

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

對於遠端主機，請將 `127.0.0.1` 替換為 `baseUrl` 中使用的主機。如果 `curl` 可用但 OpenClaw 不可用，請檢查閘道是否在不同機器、容器或服務帳戶上執行。

## Ollama 網頁搜尋

OpenClaw 支援 **Ollama 網頁搜尋** 作為內建的 `web_search` 供應商。

| 屬性        | 詳細資料                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主機        | 使用你設定的 Ollama 主機（設定時為 `models.providers.ollama.baseUrl`，否則為 `http://127.0.0.1:11434`）；`https://ollama.com` 會直接使用託管 API |
| 驗證        | 已登入的本機 Ollama 主機不需要金鑰；直接使用 `https://ollama.com` 搜尋或受驗證保護的主機時，使用 `OLLAMA_API_KEY` 或已設定的供應商驗證               |
| 要求 | 本機/自行託管主機必須正在執行並已透過 `ollama signin` 登入；直接託管搜尋需要 `baseUrl: "https://ollama.com"` 加上真正的 Ollama API 金鑰 |

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Ollama 網頁搜尋**，或設定：

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

若要透過 Ollama Cloud 直接託管搜尋：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

對於已登入的本機常駐程式，OpenClaw 會使用該常駐程式的 `/api/experimental/web_search` 代理。對於 `https://ollama.com`，它會直接呼叫託管的 `/api/web_search` 端點。

<Note>
如需完整設定與行為詳細資料，請參閱 [Ollama 網頁搜尋](/zh-TW/tools/ollama-search)。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="舊版 OpenAI 相容模式">
    <Warning>
    **工具呼叫在 OpenAI 相容模式下並不可靠。** 只有在你需要代理使用 OpenAI 格式，且不依賴原生工具呼叫行為時，才使用此模式。
    </Warning>

    如果你需要改用 OpenAI 相容端點（例如位於只支援 OpenAI 格式的代理後方），請明確設定 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    此模式可能無法同時支援串流與工具呼叫。你可能需要在模型設定中使用 `params: { streaming: false }` 停用串流。

    當 Ollama 使用 `api: "openai-completions"` 時，OpenClaw 預設會注入 `options.num_ctx`，讓 Ollama 不會靜默回退到 4096 上下文視窗。如果你的代理/上游拒絕未知的 `options` 欄位，請停用此行為：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="上下文視窗">
    對於自動探索的模型，OpenClaw 會在可用時使用 Ollama 回報的上下文視窗，包括自訂 Modelfile 中較大的 `PARAMETER num_ctx` 值。否則，它會回退到 OpenClaw 使用的預設 Ollama 上下文視窗。

    你可以為該 Ollama 供應商下的每個模型設定供應商層級的 `contextWindow`、`contextTokens` 與 `maxTokens` 預設值，然後在需要時依模型覆寫。`contextWindow` 是 OpenClaw 的提示與壓縮預算。原生 Ollama 請求會讓 `options.num_ctx` 保持未設定，除非你明確設定 `params.num_ctx`，因此 Ollama 可以套用自己的模型、`OLLAMA_CONTEXT_LENGTH` 或以 VRAM 為基礎的預設值。若要在不重建 Modelfile 的情況下限制或強制 Ollama 的每次請求執行階段上下文，請設定 `params.num_ctx`；無效、零、負數與非有限值會被忽略。如果你升級了只使用 `contextWindow` 或 `maxTokens` 來強制原生 Ollama 請求上下文的較舊設定，請執行 `openclaw doctor --fix`，將這些明確的供應商或模型預算複製到 `params.num_ctx`。OpenAI 相容 Ollama 配接器仍會預設從已設定的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果你的上游拒絕 `options`，請使用 `injectNumCtxForOpenAICompat: false` 停用。

    原生 Ollama 模型項目也接受 `params` 下的常見 Ollama 執行階段選項，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 與 `use_mmap`。OpenClaw 只會轉送 Ollama 請求鍵，因此 OpenClaw 執行階段參數（例如 `streaming`）不會洩漏給 Ollama。使用 `params.think` 或 `params.thinking` 傳送頂層 Ollama `think`；`false` 會停用 Qwen 風格思考模型的 API 層級思考。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    依模型設定的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也可使用。如果兩者都已設定，明確的供應商模型項目會優先於代理預設值。

  </Accordion>

  <Accordion title="思考控制">
    對於原生 Ollama 模型，OpenClaw 會依 Ollama 預期的方式轉送思考控制：頂層 `think`，而不是 `options.think`。自動探索且其 `/api/show` 回應包含 `thinking` 能力的模型，會公開 `/think low`、`/think medium`、`/think high` 與 `/think max`；非思考模型只會公開 `/think off`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    你也可以設定模型預設值：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    依模型設定的 `params.think` 或 `params.thinking` 可以為特定已設定模型停用或強制 Ollama API 思考。當作用中的執行只有隱含預設 `off` 時，OpenClaw 會保留這些明確模型參數；非 off 執行階段命令（例如 `/think medium`）仍會覆寫作用中的執行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 預設會將名稱如 `deepseek-r1`、`reasoning` 或 `think` 的模型視為具備推理能力。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    不需要額外設定。OpenClaw 會自動標記它們。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 免費且在本機執行，因此所有模型成本都設定為 $0。這同時適用於自動探索和手動定義的模型。
  </Accordion>

  <Accordion title="記憶嵌入">
    內建的 Ollama 外掛會為
    [記憶搜尋](/zh-TW/concepts/memory)註冊記憶嵌入提供者。它會使用已設定的 Ollama 基底 URL
    和 API 金鑰，呼叫 Ollama 目前的 `/api/embed` 端點，並在可行時將
    多個記憶區塊批次合併成一個 `input` 請求。

    當 `proxy.enabled=true` 時，傳送到由已設定 `baseUrl` 推導出的精確
    主機 local loopback 來源的 Ollama 記憶嵌入請求，會使用
    OpenClaw 受保護的直接路徑，而不是受管理的轉送代理。
    已設定的主機名稱本身必須是 `localhost` 或迴路 IP 字面值；
    只是解析到迴路的 DNS 名稱仍會使用受管理的代理路徑。
    LAN、tailnet、私有網路和公開 Ollama 主機也會留在
    受管理的代理路徑上。重新導向到另一個主機或連接埠不會繼承信任。
    操作者仍可設定全域 `proxy.loopbackMode: "proxy"` 設定，以
    透過代理傳送迴路流量，或設定 `proxy.loopbackMode: "block"`
    在開啟連線前拒絕迴路連線；請參閱
    [受管理的代理](/zh-TW/security/network-proxy#gateway-loopback-mode)，了解此設定在
    整個程序範圍內的效果。

    | 屬性      | 值               |
    | ------------- | ------------------- |
    | 預設模型 | `nomic-embed-text`  |
    | 自動拉取     | 是 — 如果嵌入模型不存在於本機，會自動拉取 |

    查詢時嵌入會對需要或建議使用檢索前綴的模型使用檢索前綴，包括 `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。記憶文件批次會保持原始格式，因此現有索引不需要格式遷移。

    若要選擇 Ollama 作為記憶搜尋嵌入提供者：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    對於遠端嵌入主機，請將驗證範圍限定在該主機：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="串流設定">
    OpenClaw 的 Ollama 整合預設使用 **原生 Ollama API**（`/api/chat`），可完整同時支援串流和工具呼叫。不需要特殊設定。

    對於原生 `/api/chat` 請求，OpenClaw 也會將思考控制直接轉送給 Ollama：`/think off` 和 `openclaw agent --thinking off` 會傳送頂層 `think: false`，除非已設定明確的模型 `params.think`/`params.thinking` 值；而 `/think low|medium|high` 會傳送相符的頂層 `think` effort 字串。`/think max` 會對應到 Ollama 最高的原生 effort，`think: "high"`。

    <Tip>
    如果你需要使用 OpenAI 相容端點，請參閱上方的「舊版 OpenAI 相容模式」一節。在該模式中，串流和工具呼叫可能無法同時運作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 疑難排解

<AccordionGroup>
  <Accordion title="WSL2 當機循環（重複重新啟動）">
    在搭配 NVIDIA/CUDA 的 WSL2 上，官方 Ollama Linux 安裝程式會建立一個 `ollama.service` systemd 單元，並設定 `Restart=always`。如果該服務自動啟動，並在 WSL2 開機期間載入 GPU 支援的模型，Ollama 可能會在模型載入時固定主機記憶體。Hyper-V 記憶體回收不一定能回收這些固定頁面，因此 Windows 可能會終止 WSL2 VM，systemd 再次啟動 Ollama，循環便會重複。

    常見證據：

    - 從 Windows 端看到 WSL2 重複重新啟動或終止
    - WSL2 啟動後不久，`app.slice` 或 `ollama.service` 的 CPU 使用率偏高
    - 來自 systemd 的 SIGTERM，而不是 Linux OOM-killer 事件

    當 OpenClaw 偵測到 WSL2、啟用且設定 `Restart=always` 的 `ollama.service`，以及可見的 CUDA 標記時，會記錄啟動警告。

    緩解方式：

    ```bash
    sudo systemctl disable ollama
    ```

    將以下內容新增到 Windows 端的 `%USERPROFILE%\.wslconfig`，然後執行 `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    在 Ollama 服務環境中設定較短的 keep-alive，或只在需要時手動啟動 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    請參閱 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="偵測不到 Ollama">
    請確認 Ollama 正在執行，且你已設定 `OLLAMA_API_KEY`（或驗證設定檔），並且你**沒有**定義明確的 `models.providers.ollama` 項目：

    ```bash
    ollama serve
    ```

    驗證 API 可存取：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="沒有可用模型">
    如果你的模型未列出，請在本機拉取模型，或在 `models.providers.ollama` 中明確定義它。

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="連線被拒">
    檢查 Ollama 是否在正確的連接埠上執行：

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="遠端主機可用 curl 連線，但 OpenClaw 無法連線">
    從執行閘道的同一台機器與執行環境驗證：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常見原因：

    - `baseUrl` 指向 `localhost`，但閘道在 Docker 中或另一台主機上執行。
    - URL 使用 `/v1`，這會選擇 OpenAI 相容行為，而不是原生 Ollama。
    - 遠端主機需要在 Ollama 端變更防火牆或 LAN 綁定。
    - 模型存在於你筆電的 daemon 上，但不存在於遠端 daemon 上。

  </Accordion>

  <Accordion title="模型將工具 JSON 輸出為文字">
    這通常表示提供者正在使用 OpenAI 相容模式，或模型無法處理工具結構描述。

    建議使用原生 Ollama 模式：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    如果小型本機模型仍無法處理工具結構描述，請在該模型項目上設定 `compat.supportsTools: false`，然後重新測試。

  </Accordion>

  <Accordion title="Kimi 或 GLM 回傳亂碼符號">
    Hosted Kimi/GLM 回應若是很長、非語言性的符號串，會被視為失敗的提供者輸出，而不是成功的助理回答。這可讓一般重試、備援或錯誤處理接手，而不會將損毀文字持久化到工作階段中。

    如果反覆發生，請擷取原始模型名稱、目前的工作階段檔案，以及該次執行是否使用 `Cloud + Local` 或 `Cloud only`，然後嘗試新的工作階段和備援模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷啟動本機模型逾時">
    大型本機模型在開始串流前，第一次載入可能需要很長時間。請將逾時範圍限定在 Ollama 提供者，並可選擇要求 Ollama 在輪次之間保持模型載入：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    如果主機本身接受連線很慢，`timeoutSeconds` 也會延長此提供者受保護的 Undici 連線逾時。

  </Accordion>

  <Accordion title="大型內容模型太慢或記憶體不足">
    許多 Ollama 模型宣告的內容長度超過你的硬體能舒適執行的範圍。原生 Ollama 會使用 Ollama 自身的執行階段內容預設值，除非你設定 `params.num_ctx`。若你想要可預測的首 token 延遲，請同時限制 OpenClaw 的預算和 Ollama 的請求內容：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    如果 OpenClaw 傳送了過多提示，請先降低 `contextWindow`。如果 Ollama 載入的執行階段內容對機器而言過大，請降低 `params.num_ctx`。如果生成時間太長，請降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多協助：[疑難排解](/zh-TW/help/troubleshooting)和[常見問題](/zh-TW/help/faq)。
</Note>

## 相關

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    所有提供者、模型參照和容錯移轉行為的概覽。
  </Card>
  <Card title="模型選擇" href="/zh-TW/concepts/models" icon="brain">
    如何選擇和設定模型。
  </Card>
  <Card title="Ollama 網頁搜尋" href="/zh-TW/tools/ollama-search" icon="magnifying-glass">
    Ollama 驅動的網頁搜尋完整設定與行為細節。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    完整設定參考。
  </Card>
</CardGroup>
