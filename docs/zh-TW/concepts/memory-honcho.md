---
read_when:
    - 你需要可跨工作階段與頻道運作的持久記憶
    - 你想要 AI 驅動的回憶與使用者模型化
summary: 透過 Honcho 外掛實現 AI 原生的跨工作階段記憶
title: Honcho 記憶
x-i18n:
    generated_at: "2026-07-05T11:13:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) 透過外部外掛為 OpenClaw 加入 AI 原生記憶。它會將對話持久保存到專用服務，並隨時間建立使用者與代理程式模型，讓你的代理程式取得跨工作階段脈絡，超越工作區 Markdown 檔案。

## 它提供什麼

- **跨工作階段記憶** - 每一輪之後都會保留對話，因此脈絡會延續到工作階段重設、壓縮與渠道切換之後。
- **使用者建模** - Honcho 會為每位使用者維護個人檔案（偏好、事實、溝通風格），也會為代理程式維護個人檔案（個性、學到的行為）。
- **語意搜尋** - 搜尋過去對話中的觀察結果，而不只是目前工作階段。
- **多代理程式感知** - 父代理程式會自動追蹤衍生的子代理程式，並在子工作階段中將父代理程式加入為觀察者。

## 可用工具

Honcho 會註冊代理程式可在對話期間使用的工具：

**資料擷取（快速，無 LLM 呼叫）：**

| 工具                        | 功能                                                   |
| --------------------------- | ------------------------------------------------------ |
| `honcho_context`            | 跨工作階段的完整使用者表示法                           |
| `honcho_search_conclusions` | 對已儲存結論進行語意搜尋                               |
| `honcho_search_messages`    | 跨工作階段尋找訊息（依寄件者、日期篩選）               |
| `honcho_session`            | 目前工作階段歷史與摘要                                 |

**問答（由 LLM 驅動）：**

| 工具         | 功能                                                              |
| ------------ | ----------------------------------------------------------------- |
| `honcho_ask` | 詢問關於使用者的問題。`depth='quick'` 用於事實，`'thorough'` 用於綜合分析 |

## 開始使用

安裝外掛並執行設定：

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

設定命令會提示你輸入 API 憑證、寫入設定，並可選擇遷移現有的工作區記憶檔案。

<Info>
Honcho 可以完全在本機執行（自行託管），也可以透過 `api.honcho.dev` 的託管 API 執行。自行託管選項不需要任何外部依賴項。
</Info>

## 設定

設定位於 `plugins.entries["openclaw-honcho"].config` 底下：

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

對於自行託管執行個體，請將 `baseUrl` 指向你的本機伺服器（例如 `http://localhost:8000`），並省略 API 金鑰。

## 遷移現有記憶

如果你有現有的工作區記憶檔案（`USER.md`、`MEMORY.md`、`IDENTITY.md`、`memory/`、`canvas/`），`openclaw honcho setup` 會偵測並詢問是否遷移它們。

<Info>
遷移是非破壞性的 - 檔案會上傳到 Honcho。原始檔案絕不會被刪除或移動。
</Info>

## 運作方式

每次 AI 回合之後，對話都會持久保存到 Honcho。使用者與代理程式訊息都會被觀察，讓 Honcho 能隨時間建立並改善其模型。

在對話期間，Honcho 工具會在 OpenClaw 的 `before_prompt_build` 外掛鉤子期間查詢服務，在模型看到提示之前注入相關脈絡。

## Honcho 與內建記憶比較

|                   | 內建 / QMD                  | Honcho                              |
| ----------------- | --------------------------- | ----------------------------------- |
| **儲存**          | 工作區 Markdown 檔案        | 專用服務（本機或託管）              |
| **跨工作階段**    | 透過記憶檔案                | 自動、內建                          |
| **使用者建模**    | 手動（寫入 MEMORY.md）      | 自動個人檔案                        |
| **搜尋**          | 向量 + 關鍵字（混合）       | 對觀察結果進行語意搜尋              |
| **多代理程式**    | 未追蹤                      | 父/子感知                           |
| **依賴項**        | 無（內建）或 QMD 二進位檔   | 安裝外掛                            |

Honcho 與內建記憶系統可以一起運作。設定 QMD 時，會提供額外工具，可在 Honcho 的跨工作階段記憶旁一併搜尋本機 Markdown 檔案。

## 命令列介面命令

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
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
