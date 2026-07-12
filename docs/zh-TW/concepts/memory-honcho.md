---
read_when:
    - 您想要能跨工作階段與頻道運作的持久記憶。
    - 你想要由 AI 驅動的記憶回溯與使用者建模
summary: 透過 Honcho 外掛實現 AI 原生的跨工作階段記憶體
title: Honcho 記憶體
x-i18n:
    generated_at: "2026-07-11T21:15:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) 透過外部外掛為 OpenClaw 加入 AI 原生記憶功能。它會將對話持久儲存至專用服務，並隨時間建立使用者與代理程式模型，讓代理程式獲得跨工作階段的脈絡，突破工作區 Markdown 檔案的限制。

## 提供的功能

- **跨工作階段記憶** - 每一輪對話後都會持久儲存，因此即使重設工作階段、進行壓縮或切換頻道，脈絡仍會延續。
- **使用者建模** - Honcho 會為每位使用者維護設定檔（偏好、事實、溝通風格），也會為代理程式維護設定檔（人格、習得行為）。
- **語意搜尋** - 搜尋過往對話中的觀察結果，而不僅限於目前工作階段。
- **多代理程式感知** - 父代理程式會自動追蹤所衍生的子代理程式，並在子工作階段中將父代理程式加入為觀察者。

## 可用工具

Honcho 會註冊代理程式可在對話期間使用的工具：

**資料擷取（快速，不呼叫 LLM）：**

| 工具                        | 功能                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 跨工作階段的完整使用者表徵                             |
| `honcho_search_conclusions` | 對已儲存的結論進行語意搜尋                             |
| `honcho_search_messages`    | 跨工作階段尋找訊息（依傳送者、日期篩選）               |
| `honcho_session`            | 目前工作階段的歷史記錄與摘要                           |

**問答（由 LLM 驅動）：**

| 工具         | 功能                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| `honcho_ask` | 詢問使用者相關資訊。使用 `depth='quick'` 查詢事實，使用 `'thorough'` 進行綜合分析 |

## 開始使用

安裝外掛並執行設定：

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

設定命令會提示輸入 API 憑證、寫入設定，並可選擇遷移現有的工作區記憶檔案。

<Info>
Honcho 可以完全在本機執行（自行託管），也可以透過位於 `api.honcho.dev` 的代管 API 執行。自行託管選項不需要任何外部相依項目。
</Info>

## 設定

設定位於 `plugins.entries["openclaw-honcho"].config`：

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // 自行託管時省略
          workspaceId: "openclaw", // 記憶隔離
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

若使用自行託管的執行個體，請將 `baseUrl` 指向本機伺服器（例如 `http://localhost:8000`），並省略 API 金鑰。

## 遷移現有記憶

如果已有工作區記憶檔案（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`），`openclaw honcho setup` 會偵測這些檔案並提供遷移選項。

<Info>
遷移不會破壞原始資料——檔案會上傳至 Honcho，原始檔案絕不會遭到刪除或移動。
</Info>

## 運作方式

每一輪 AI 回覆後，對話都會持久儲存至 Honcho。系統會同時觀察使用者與代理程式訊息，讓 Honcho 能夠隨時間建立並改善其模型。

在對話期間，Honcho 工具會透過 OpenClaw 的 `before_prompt_build` 外掛掛鉤查詢服務，在模型看到提示詞之前注入相關脈絡。

## Honcho 與內建記憶的比較

|                   | 內建 / QMD                  | Honcho                              |
| ----------------- | --------------------------- | ----------------------------------- |
| **儲存方式**      | 工作區 Markdown 檔案        | 專用服務（本機或代管）              |
| **跨工作階段**    | 透過記憶檔案                | 自動且內建                          |
| **使用者建模**    | 手動（寫入 MEMORY.md）      | 自動建立設定檔                      |
| **搜尋**          | 向量 + 關鍵字（混合）       | 對觀察結果進行語意搜尋              |
| **多代理程式**    | 不追蹤                      | 感知父子關係                        |
| **相依項目**      | 無（內建）或 QMD 二進位檔案 | 安裝外掛                            |

Honcho 與內建記憶系統可以搭配運作。設定 QMD 後，會提供額外工具，可在使用 Honcho 跨工作階段記憶的同時搜尋本機 Markdown 檔案。

## 命令列介面命令

```bash
openclaw honcho setup                        # 設定 API 金鑰並遷移檔案
openclaw honcho status                       # 檢查連線狀態
openclaw honcho ask <question>               # 向 Honcho 查詢使用者相關資訊
openclaw honcho search <query> [-k N] [-d D] # 對記憶進行語意搜尋
```

## 延伸閱讀

- [外掛原始碼](https://github.com/plastic-labs/openclaw-honcho)
- [Honcho 文件](https://docs.honcho.dev)
- [Honcho OpenClaw 整合指南](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## 相關內容

- [記憶概覽](/zh-TW/concepts/memory)
- [內建記憶引擎](/zh-TW/concepts/memory-builtin)
- [QMD 記憶引擎](/zh-TW/concepts/memory-qmd)
- [脈絡引擎](/zh-TW/concepts/context-engine)
