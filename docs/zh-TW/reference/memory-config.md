---
read_when:
    - 你想要設定記憶搜尋提供者或嵌入模型
    - 你想要設定 QMD 後端
    - 你想要啟用混合搜尋、MMR 或時間衰減
    - 你想要啟用多模態記憶索引功能
sidebarTitle: Memory config
summary: 記憶搜尋提供者、檢索模式、QMD 與多模態索引
title: 記憶設定參考資料
x-i18n:
    generated_at: "2026-07-22T10:50:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 91f843b1516093c49e18b3d659ab24ea9cb7be32aaaac722205eca8bc3f2ca5b
    source_path: reference/memory-config.md
    workflow: 16
---

此頁面列出 OpenClaw 記憶搜尋的所有設定選項。如需概念性概覽，請參閱：

<CardGroup cols={2}>
  <Card title="記憶概覽" href="/zh-TW/concepts/memory">
    記憶的運作方式。
  </Card>
  <Card title="內建引擎" href="/zh-TW/concepts/memory-builtin">
    預設的 SQLite 後端。
  </Card>
  <Card title="QMD 引擎" href="/zh-TW/concepts/memory-qmd">
    本機優先的輔助程序。
  </Card>
  <Card title="記憶搜尋" href="/zh-TW/concepts/memory-search">
    搜尋流程與調校。
  </Card>
  <Card title="主動記憶" href="/zh-TW/concepts/active-memory">
    用於互動式工作階段的記憶子代理程式。
  </Card>
</CardGroup>

所有共用記憶設定都位於 `openclaw.json` 的頂層 `memory` 下。搜尋預設值使用 `memory.search`；個別代理程式的搜尋覆寫使用 `agents.entries.*.memory.search`。

<Note>
針對建議的個人代理程式工作流程，請使用
`memory.search.rememberAcrossConversations`。進階主動記憶的目標、
模型、提示詞及延遲控制項位於 `plugins.entries.active-memory` 下。

請參閱[主動記憶](/zh-TW/concepts/active-memory)，瞭解兩種啟用路徑、
逐字稿持久化及安全推出指南。
</Note>

---

## 跨對話記憶

| 鍵                           | 類型      | 預設值                                                    | 說明                                                                    |
| ----------------------------- | --------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `rememberAcrossConversations` | `boolean` | 個人安裝時開啟；設定 DM 隔離時關閉 | 使用此代理程式其他已識別私人對話中的相關脈絡。 |

若只有受信任的個人代理程式應使用跨對話逐字稿回憶，請為個別代理程式進行設定：

```json5
{
  agents: {
    entries: {
      personal: {
        memory: {
          search: {
            rememberAcrossConversations: true,
          },
        },
      },
    },
  },
}
```

此值遵循一般 `memory.search` 繼承規則，並可由個別代理程式覆寫。未設定時，只有在全域
`session.dmScope` 未設定或為 `"main"`，且沒有任何繫結具有 `session.dmScope`
覆寫時，才會預設開啟。只要設定任何 DM 隔離，就會預設關閉。明確設定的 `true` 或
`false` 一律優先。啟用後即會啟用工作階段逐字稿索引，並將
`sessions` 新增至代理程式解析後的記憶來源。使用 QMD 時，也會啟用該代理程式的工作階段匯出；此模式不需要另外設定
`memory.qmd.sessions.enabled`。

OpenClaw 的內建記憶提供者透過內建與 QMD 後端支援此受保護路徑。其他記憶提供者仍可使用自己的回憶鉤子與進階主動記憶工具，但除非目前提供者支援受保護的私人逐字稿回憶，否則會略過此設定。
`openclaw doctor` 會回報不受支援的提供者，或回報明確的主動記憶
`toolsAllow` 清單未包含 `memory_search`。

擷取邊界比一般工作階段搜尋更窄：

- 只有同一代理程式已識別的私人對話符合資格
- 會排除正在回覆的對話
- 群組與頻道均不會作為來源或目的地
- 未知的對話種類會採取封閉失敗
- 沙箱化回憶無法使用特殊的跨對話授權

此設定不會變更 `tools.sessions.visibility`、工作階段金鑰、
逐字稿儲存、傳遞路由，或 `sessions_list`、
`sessions_history` 與 `sessions_send` 的權限。主動記憶會執行有界限的唯讀擷取流程；擷取無法使用或逾時時，不會阻擋回覆。

---

## 提供者選擇

| 鍵        | 類型      | 預設值          | 說明                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`           | 啟用或停用記憶搜尋                                                                                                                                                                                                                                                             |
| `provider` | `string`  | `"openai"`       | 嵌入轉接器 ID，例如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai`、`openai-compatible` 或 `voyage`；也可以是已設定的 `models.providers.<id>`，其 `api` 指向記憶嵌入轉接器或 OpenAI 相容模型 API |
| `model`    | `string`  | 提供者預設值 | 嵌入模型名稱                                                                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`         | 主要轉接器失敗時使用的備援轉接器 ID                                                                                                                                                                                                                                                  |

未設定 `provider` 時，OpenClaw 會使用 OpenAI 嵌入。若要使用 Bedrock、DeepInfra、Gemini、GitHub Copilot、Mistral、Ollama、
Voyage、本機 GGUF 模型或 OpenAI 相容的 `/v1/embeddings` 端點，請明確設定 `provider`。
仍使用 `provider: "auto"` 的舊版設定會解析為 `openai`。

<Warning>
變更嵌入提供者、模型、提供者設定、來源、範圍、
分塊方式或詞元化器，可能導致現有 SQLite 向量索引不相容。
OpenClaw 會暫停向量搜尋並回報索引識別警告，而不會自動重新嵌入所有內容。準備就緒後，請使用
`openclaw memory status --index --agent <id>` 或
`openclaw memory index --force --agent <id>` 重新建置。
</Warning>

未設定 `provider`、存在舊版 `provider: "auto"`，或
`provider: "none"` 刻意選擇僅使用 FTS 的模式時，即使嵌入無法使用，記憶回憶仍可使用詞彙 FTS 排名。

明確指定的非本機提供者會採取封閉失敗。如果將 `memory.search.provider` 設為具體的遠端後端提供者，例如 Bedrock、DeepInfra、Gemini、GitHub
Copilot、LM Studio、Mistral、Ollama、OpenAI、Voyage 或 OpenAI 相容的自訂提供者，而該提供者在執行階段無法使用，`memory_search`
會傳回無法使用的結果，而不會無提示地改用僅限 FTS 的回憶。請修正提供者／驗證設定、切換至可連線的提供者，或設定
`provider: "none"`，以刻意使用僅限 FTS 的回憶。

### 自訂提供者 ID

`memory.search.provider` 可以指向記憶專用提供者轉接器（例如 `ollama`）的自訂 `models.providers.<id>` 項目，或指向 OpenAI 相容的模型 API（例如 `openai-responses` / `openai-completions`）。OpenClaw 會解析該提供者的 `api` 擁有者以取得嵌入轉接器，同時保留自訂提供者 ID，以處理端點、驗證及模型前綴。如此一來，多 GPU 或多主機設定便能將記憶嵌入專門指派給特定的本機端點：

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
      },
    },
  },
  memory: {
    search: {
      provider: "ollama-5080",
      model: "qwen3-embedding:0.6b",
    },
  },
}
```

### API 金鑰解析

遠端嵌入需要 API 金鑰。Bedrock 則改用 AWS SDK 預設認證資訊鏈（執行個體角色、SSO、存取金鑰或 Bedrock API 金鑰）。

| 提供者       | 環境變數                                             | 設定鍵                          |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | AWS 認證資訊鏈，或 `AWS_BEARER_TOKEN_BEDROCK` | 不需要 API 金鑰                   |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`  | 透過裝置登入取得驗證設定檔       |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（預留位置）                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 僅涵蓋聊天／補全，無法滿足嵌入要求。
</Note>

---

## 遠端端點設定

針對不應繼承全域 OpenAI 聊天認證資訊的通用 OpenAI 相容
`/v1/embeddings` 伺服器，請使用 `provider: "openai-compatible"`。

<ParamField path="remote.baseUrl" type="string">
  自訂 API 基底 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆寫 API 金鑰。
</ParamField>
<ParamField path="remote.headers" type="object">
  額外的 HTTP 標頭（與提供者預設值合併）。
</ParamField>

```json5
{
  memory: {
    search: {
      provider: "openai-compatible",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_KEY",
      },
    },
  },
}
```

---

## 提供者專用設定

<AccordionGroup>
  <Accordion title="Gemini">
    | 鍵                    | 類型     | 預設值                | 說明                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 也支援 `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | 適用於 Embedding 2：768、1536 或 3072        |

    <Warning>
    變更模型或 `outputDimensionality` 會變更索引識別。OpenClaw
    會暫停向量搜尋，直到你明確重新建置記憶索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 相容輸入類型">
    OpenAI 相容的嵌入端點可選擇使用提供者專用的 `input_type` 要求欄位。這對於要求查詢嵌入與文件嵌入使用不同標籤的非對稱嵌入模型很有用。

    | 鍵                 | 類型     | 預設值 | 說明                                             |
    | ------------------- | -------- | ------- | -------------------------------------------------------- |
    | `inputType`         | `string` | 未設定   | 查詢與文件嵌入共用的 `input_type`   |
    | `queryInputType`    | `string` | 未設定   | 查詢時的 `input_type`；覆寫 `inputType`          |
    | `documentInputType` | `string` | 未設定   | 索引／文件的 `input_type`；覆寫 `inputType`      |

    ```json5
    {
      memory: {
        search: {
          provider: "openai-compatible",
          remote: {
            baseUrl: "https://embeddings.example/v1",
            apiKey: "${EMBEDDINGS_API_KEY}",
          },
          model: "asymmetric-embedder",
          queryInputType: "query",
          documentInputType: "passage",
        },
      },
    }
    ```

    變更這些值會影響提供者批次索引的嵌入快取識別；若上游模型以不同方式處理這些標籤，變更後應重新建立記憶索引。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入設定

    Bedrock 使用 AWS SDK 預設認證資訊鏈，以及經 OpenClaw 檢查的持有人權杖，因此設定中不會儲存任何 API 金鑰。若 OpenClaw 在 EC2 上執行，且執行個體角色已啟用 Bedrock，只需設定提供者與模型：

    ```json5
    {
      memory: {
        search: {
          provider: "bedrock",
          model: "amazon.titan-embed-text-v2:0",
        },
      },
    }
    ```

    | 鍵                    | 類型     | 預設值                        | 說明                     |
    | ---------------------- | -------- | ------------------------------- | -------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任何 Bedrock 嵌入模型 ID  |
    | `outputDimensionality` | `number` | 模型預設值                  | Titan V2 可用：256、512 或 1024 |

    **支援的模型**（含系列偵測與維度預設值）：

    | 模型 ID                                   | 提供者   | 預設維度 | 可設定維度          |
    | ------------------------------------------- | ---------- | ------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024         | 256、512、1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536         | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024         | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024         | 256、384、1024、3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024         | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024         | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536         | 256、384、512、768、1024、1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512          | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024         | --                          |

    帶有輸送量後綴的變體（例如 `amazon.titan-embed-text-v1:2:8k`）與帶有區域前綴的推論設定檔 ID（例如 `us.amazon.titan-embed-text-v2:0`）會繼承基礎模型的設定。

    **區域：**依下列順序解析：`memory.search.remote.baseUrl` 覆寫值、`models.providers.amazon-bedrock.baseUrl` 設定、`AWS_REGION`、`AWS_DEFAULT_REGION`，最後使用預設值 `us-east-1`。

    **驗證：**OpenClaw 會先檢查 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_BEARER_TOKEN_BEDROCK`，接著再依序使用標準 AWS SDK 預設認證資訊提供者鏈：

    1. 環境變數（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`），除非同時設定了 `AWS_PROFILE`
    2. SSO（僅限已設定 SSO 欄位時）
    3. 共用認證資訊與設定檔（`fromIni`，包括 `AWS_PROFILE`）
    4. 認證資訊程序（AWS 設定檔中的 `credential_process`）
    5. Web 身分權杖認證資訊
    6. ECS 或 EC2 執行個體中繼資料認證資訊

    **IAM 權限：**IAM 角色或使用者需要：

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    為遵循最小權限原則，請將 `InvokeModel` 的範圍限制為特定模型：

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本機（GGUF + llama.cpp）">
    | 鍵                   | 類型               | 預設值                | 說明                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | 自動下載        | GGUF 模型檔案的路徑                                                                                                                                                                                                                                                                                              |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 預設值 | 已下載模型的快取目錄                                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | 嵌入情境的情境視窗大小。4096 可涵蓋一般區塊（128-512 個權杖），同時限制非權重 VRAM 用量。在資源受限的主機上可降低至 1024-2048。`"auto"` 會使用模型訓練時的最大值——不建議用於 8B 以上的模型（Qwen3-Embedding-8B：最高 40 960 個權杖可能使 VRAM 用量升至約 32 GB）。 |

    請先安裝官方 llama.cpp 提供者：`openclaw plugins install @openclaw/llama-cpp-provider`。
    預設模型：`embeddinggemma-300m-qat-Q8_0.gguf`（約 0.6 GB，自動下載）。原始碼簽出仍需核准原生建置：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

    使用獨立命令列介面驗證閘道所使用的相同提供者路徑：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    數值型 `local.contextSize` 值也會提供給 node-llama-cpp 的自動 GPU 層配置，使模型權重與要求的嵌入情境能一併容納。執行階段載入後，`openclaw memory status --deep` 會回報最後已知的 llama.cpp 後端、裝置、卸載、要求的情境，以及帶有時間戳記的記憶體資訊；被動狀態檢查不會載入模型。

    若要使用本機 GGUF 嵌入，請明確設定 `provider: "local"`。明確的本機設定支援 `hf:` 與 HTTP(S) 模型參照（透過 node-llama-cpp 的模型解析），但不會變更預設提供者。

  </Accordion>
</AccordionGroup>

## 索引行為

記憶引擎負責同步、批次處理、監看，以及壓縮後的
索引啟發式規則。OpenClaw 會使用持續維護的預設值啟用這些行為，
而不提供個別安裝環境的時間控制開關。

## 混合搜尋設定

全部位於 `memory.search.query` 之下：

| 鍵          | 類型     | 預設值 | 說明                               |
| ------------ | -------- | ------- | ----------------------------------------- |
| `maxResults` | `number` | `6`     | 注入前傳回的記憶命中結果上限 |
| `minScore`   | `number` | `0.35`  | 納入命中結果所需的最低相關性分數  |

混合擷取會維持啟用；內建引擎政策會維持停用 MMR 與時間衰減。

### 完整範例

```json5
{
  memory: {
    search: {
      query: {
        maxResults: 6,
        minScore: 0.35,
      },
    },
  },
}
```

---

## 額外記憶路徑

| 鍵          | 類型       | 說明                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | 要建立索引的額外目錄或檔案 |

```json5
{
  memory: {
    search: {
      extraPaths: ["../team-docs", "/srv/shared-notes"],
    },
  },
}
```

路徑可以是絕對路徑或相對於工作區的路徑。系統會以遞迴方式掃描目錄中的 `.md` 檔案。符號連結的處理方式取決於使用中的後端：內建引擎會略過符號連結，而 QMD 則遵循底層 QMD 掃描器的行為。

若要進行限定於代理程式範圍的跨代理程式對話記錄搜尋，請使用 `agents.entries.*.memory.search.qmd.extraCollections`，而非 `memory.qmd.paths`。這些額外集合採用相同的 `{ path, name, pattern? }` 結構，但會依代理程式合併；當路徑指向目前工作區之外時，也可保留明確的共用名稱。如果相同的解析路徑同時出現在 `memory.qmd.paths` 與 `memory.search.qmd.extraCollections` 中，QMD 會保留第一個項目並略過重複項目。

---

## 多模態記憶（Gemini）

使用 Gemini Embedding 2 將圖片和音訊與 Markdown 一併建立索引：

| 鍵                       | 類型       | 預設值    | 說明                            |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 啟用多模態索引             |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10485760` | 建立索引的檔案大小上限（10 MiB）    |

<Note>
僅適用於 `extraPaths` 中的檔案。預設記憶根目錄仍僅支援 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必須為 `"none"`。
</Note>

支援的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（圖片）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音訊）。

---

## 嵌入快取

| 鍵             | 類型      | 預設值 | 說明                      |
| --------------- | --------- | ------- | -------------------------------- |
| `cache.enabled` | `boolean` | `true`  | 在 SQLite 中快取區塊嵌入 |

避免在重新建立索引或更新對話記錄時，再次嵌入未變更的文字。

---

## 批次索引

| 鍵                          | 類型      | 預設值 | 說明                |
| ---------------------------- | --------- | ------- | -------------------------- |
| `remote.nonBatchConcurrency` | `number`  | `4`     | 平行的行內嵌入 |
| `remote.batch.enabled`       | `boolean` | `false` | 啟用批次嵌入 API |

適用於 `gemini`、`openai` 與 `voyage`。對於大型回填，OpenAI 批次處理通常速度最快且成本最低。

並行處理、輪詢與逾時行為由提供者負責。

---

## 工作階段記憶搜尋

為工作階段對話記錄建立索引，並透過 `memory_search` 顯示：

| 鍵                           | 類型       | 預設值      | 說明                              |
| ----------------------------- | ---------- | ------------ | ---------------------------------------- |
| `rememberAcrossConversations` | `boolean`  | `false`      | 允許跨對話回想私人內容 |
| `sources`                     | `string[]` | `["memory"]` | 新增 `"sessions"` 以納入對話記錄  |

<Warning>
工作階段索引功能須選擇啟用，並以非同步方式執行。結果可能略有延遲。工作階段日誌儲存在磁碟上，因此請將檔案系統存取視為信任邊界。
</Warning>

一般由模型叫用的工作階段逐字稿搜尋遵循
[`tools.sessions.visibility`](/zh-TW/gateway/config-tools#toolssessions)。預設的
`tree` 可見性會公開目前工作階段、由其衍生的工作階段，以及
透過環境群組感知所監看、屬於同一代理程式的群組工作階段。其他
不相關的工作階段需要 `agent` 可見性（只有在也需要跨代理程式
回憶，且代理程式對代理程式政策允許時，才可使用 `all`）。

`rememberAcrossConversations` 不會擴大該設定。它提供一項
獨立且僅限執行階段的授權，在有界的主動記憶處理期間，僅限存取同一代理程式的私人
逐字稿。

下列範例將這些設定置於頂層 `memory.search` 之下。若只有一個
代理程式應索引及搜尋工作階段逐字稿，也可以在該代理程式專屬的 `memory.search` 覆寫中
套用等效設定。

若要讓同一代理程式從閘道回憶至私訊：

<Tabs>
  <Tab title="內建後端">
    ```json5
    {
      memory: {
        search: {
          experimental: { sessionMemory: true },
          sources: ["memory", "sessions"],
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="QMD 後端">
    ```json5
    {
      memory: {
        backend: "qmd",
        search: {
          experimental: { sessionMemory: true },
          sources: ["memory", "sessions"],
        },
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

使用 QMD 時，僅設定 `sources: ["sessions"]` 並不會將逐字稿匯出至 QMD。也請設定
`memory.qmd.sessions.enabled: true`。較高層級的
`rememberAcrossConversations: true` 設定是例外：它會隱含啟用該代理程式所需的
QMD 工作階段匯出。隱含匯出內容會保持私人：
一律使用預設的內部匯出位置（已設定的
`sessions.exportDir` 僅適用於明確匯出），只會在該代理程式進行跨對話回憶時
被搜尋，而且一般的 `memory_get`
無法讀取。明確設定
`memory.qmd.sessions.enabled: true` 會維持現有行為，並使
匯出的逐字稿成為一般記憶語料庫的一部分。

---

## SQLite 向量加速（sqlite-vec）

| 鍵                           | 類型      | 預設值 | 說明                          |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`  | 使用 sqlite-vec 執行向量查詢 |
| `store.vector.extensionPath` | `string`  | 內附 | 覆寫 sqlite-vec 路徑          |

當 sqlite-vec 無法使用時，OpenClaw 會自動改用程序內餘弦相似度。

---

## 索引儲存空間

內建記憶索引位於每個代理程式的 OpenClaw SQLite 資料庫中：
`agents/<agentId>/agent/openclaw-agent.sqlite`。

| 鍵                    | 類型     | 預設值      | 說明                                      |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | FTS5 詞元分析器（`unicode61` 或 `trigram`） |

---

## QMD 後端設定

設定 `memory.backend = "qmd"` 以啟用。所有 QMD 設定都位於 `memory.qmd` 之下：

| 鍵                       | 類型      | 預設值   | 說明                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 執行檔路徑；當服務的 `PATH` 與你的 shell 不同時，請設定絕對路徑 |
| `searchMode`             | `string`  | `search` | 搜尋命令：`search`、`vsearch`、`query`                                          |
| `rerank`                 | `boolean` | --       | 搭配 `searchMode: "query"` 與 QMD 2.1+ 設為 `false`，以略過 QMD 重新排序          |
| `includeDefaultMemory`   | `boolean` | `true`   | 自動索引 `MEMORY.md` + `memory/**/*.md`                                             |
| `paths[]`                | `array`   | --       | 額外路徑：`{ name, path, pattern? }`                                               |
| `sessions.enabled`       | `boolean` | `false`  | 將工作階段逐字稿匯出至 QMD                                                   |
| `sessions.retentionDays` | `number`  | --       | 逐字稿保留期限                                                                  |
| `sessions.exportDir`     | `string`  | --       | 匯出目錄                                                                      |

`searchMode: "search"` 僅使用詞彙／BM25。OpenClaw 在此模式下不會執行語意向量就緒探測或 QMD 嵌入維護，包括在 `memory status --deep` 期間；`vsearch` 和 `query` 仍需要 QMD 向量就緒及嵌入。

`rerank: false` 僅變更 QMD 的 `query` 模式，並需要 QMD 2.1 或更新版本。在直接命令列介面模式中，OpenClaw 會傳遞 `--no-rerank`；在由 mcporter 支援的 MCP 模式中，則會將 `rerank: false` 傳遞給 QMD 的統一查詢工具。若不設定，則使用 QMD 的預設查詢重新排序行為。

OpenClaw 優先採用目前的 QMD 集合與 MCP 查詢格式，但會在需要時嘗試相容的集合模式旗標及較舊的 MCP 工具名稱，讓舊版 QMD 仍可運作。當 QMD 宣告支援多個集合篩選條件時，同來源的集合會由單一 QMD 程序搜尋；較舊的 QMD 組建則繼續使用逐集合相容路徑。同來源是指耐久記憶集合（預設記憶檔案加上自訂路徑）會分為同一組，而工作階段逐字稿集合仍會是獨立群組，讓來源多樣化仍可同時取得兩種輸入。

<Note>
QMD 模型覆寫設定保留在 QMD 端，而非 OpenClaw 設定中。若需要全域覆寫 QMD 的模型，請在閘道執行階段環境中設定 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL` 等環境變數。
</Note>

<AccordionGroup>
  <Accordion title="限制">
    | 鍵                        | 類型     | 預設值 | 說明                           |
    | --------------------------- | -------- | ------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `4`     | 搜尋結果數量上限               |
    | `limits.maxSnippetChars`  | `number` | `450`   | 限制摘錄長度                   |
    | `limits.maxInjectedChars` | `number` | `2200`  | 限制注入的字元總數             |
    | `limits.timeoutMs`        | `number` | `4000`  | 使用 QMD 後端搜尋時的 QMD 命令逾時，包括 `memory_search`；設定、同步、內建備援及補充工作仍使用預設工具期限 |
  </Accordion>
  <Accordion title="範圍">
    控制哪些工作階段可以接收 QMD 搜尋結果。結構描述與 [`session.sendPolicy`](/zh-TW/gateway/config-agents#session) 相同：

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    隨附的預設值僅允許私訊／直接對話，並拒絕群組及其他頻道類型。`match.keyPrefix` 會比對正規化的工作階段鍵；`match.rawKeyPrefix` 會比對包含 `agent:<id>:` 的原始鍵。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 適用於所有後端：

    | 值               | 行為                                                   |
    | ------------------ | ------------------------------------------------------ |
    | `auto`（預設值） | 在摘錄中包含 `Source: <path#line>` 頁尾          |
    | `on`             | 一律包含頁尾                                  |
    | `off`            | 省略頁尾（路徑仍會在內部傳遞給代理程式）      |

  </Accordion>
</AccordionGroup>

QMD 會在首次使用記憶時延遲初始化；其配接器負責重新整理及嵌入排程。

### 完整 QMD 範例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## 夢境整理

夢境整理設定於 `plugins.entries.memory-core.config.dreaming` 之下，而不是 `memory.search` 之下。

夢境整理會以單次排程掃描執行，並將內部的淺層／深層／REM 階段作為實作細節。

如需概念行為與斜線命令，請參閱[夢境整理](/zh-TW/concepts/dreaming)。

### 使用者設定

| 鍵                                     | 類型      | 預設值        | 說明                                                                                                                           |
| -------------------------------------- | --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`       | 完整啟用或停用夢境整理                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`   | 完整夢境整理掃描的選用 Cron 頻率                                                                                |
| `model`                                | `string`  | 預設模型 | 選用的夢境日記子代理程式模型覆寫                                                                                     |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`         | 從每個提升至 `MEMORY.md` 的短期回憶摘錄中保留的預估權杖數上限；來源中繼資料仍然可見 |

### 範例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- 夢境整理會將機器狀態寫入 `memory/.dreams/`。
- 夢境整理會將人類可讀的敘事輸出寫入 `DREAMS.md`（或現有的 `dreams.md`）。
- `dreaming.model` 使用現有的外掛子代理程式信任閘門；啟用前請先設定 `plugins.entries.memory-core.subagent.allowModelOverride: true`。
- 當設定的模型無法使用時，夢境日記會使用工作階段預設模型重試一次。信任或允許清單失敗會記錄在日誌中，不會靜默重試。
- 淺層／深層／REM 階段的政策與門檻是內部行為，而非面向使用者的設定。

</Note>

## 相關資訊

- [設定參考](/zh-TW/gateway/configuration-reference)
- [記憶概覽](/zh-TW/concepts/memory)
- [記憶搜尋](/zh-TW/concepts/memory-search)
