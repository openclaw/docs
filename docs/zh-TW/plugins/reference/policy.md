---
read_when:
    - 您正在安裝、設定或稽核原則外掛
summary: 新增以政策為依據的 doctor 檢查，以確認工作區符合規範。
title: 政策外掛
x-i18n:
    generated_at: "2026-07-11T21:40:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# 政策外掛

新增以政策為基礎的 doctor 檢查，以確認工作區符合規範。

## 發布方式

- 套件：`@openclaw/policy`
- 安裝途徑：隨 OpenClaw 內附

## 介面

外掛

<!-- openclaw-plugin-reference:manual-start -->

## 行為

政策外掛會為政策管理的 OpenClaw 設定與受管控的工作區宣告提供 doctor 健康狀態檢查。政策目前涵蓋頻道合規性、受管控的工具中繼資料、MCP 伺服器安全態勢、模型供應商安全態勢、私人網路存取安全態勢、閘道暴露安全態勢、代理程式工作區／工具安全態勢、已設定的全域／各代理程式工具安全態勢、已設定的沙箱執行階段安全態勢、入口／頻道存取安全態勢、資料處理安全態勢，以及 OpenClaw 設定中的秘密供應商／驗證設定檔安全態勢。

政策會將編寫的要求儲存在 `policy.jsonc`，以現有的 OpenClaw 設定和工作區宣告作為證據，並透過 `openclaw policy check` 和 `openclaw doctor --lint` 回報偏差。通過政策檢查時，會輸出政策、證據、發現事項及證明雜湊，供操作人員記錄以備稽核。

`openclaw policy compare --baseline <file>` 會將一個政策檔案與另一個政策檔案進行比較。此功能僅檢查設定層級的合規性：它使用政策規則中繼資料，確認受檢查的政策相較於編寫的基準政策沒有缺漏或較寬鬆，且不會檢查執行階段狀態、憑證或秘密值。

工具安全態勢規則可以要求使用核准的設定檔、僅限工作區的檔案系統工具、受限制的執行安全性／詢問／主機設定、停用提升權限模式、精確的 `alsoAllow` 項目，以及必要的工具拒絕項目。證據會記錄附加的 `alsoAllow` 項目，因為這些項目可能擴大實際的工具安全態勢。這些檢查僅觀察設定的合規性；不會讀取執行階段核准狀態，也不會新增執行階段強制措施。

沙箱安全態勢規則可以要求使用核准的沙箱模式／後端、禁止主機容器網路、禁止加入容器命名空間、要求容器掛載為唯讀、禁止掛載容器執行階段通訊端與使用不受限制的容器設定檔，並要求設定沙箱瀏覽器 CDP 來源範圍。
這些檢查僅觀察設定的合規性；不會讀取執行階段核准狀態、檢查即時容器，或新增執行階段強制措施。

資料處理規則可以要求對敏感記錄進行遮蔽、禁止擷取遙測內容、要求進行工作階段保留維護，並禁止為工作階段逐字稿建立記憶索引。這些檢查僅觀察設定的合規性；不會檢查原始記錄、遙測匯出、逐字稿、記憶檔案、秘密或個人資料。

`scopes.<scopeName>` 下的具名政策範圍，可以針對其列出的選取條件加入更嚴格的一般政策區段。`agentIds` 支援 `tools`、`agents.workspace`、`sandbox` 和 `dataHandling.memory`；`channelIds` 支援 `ingress.channels`。
未明確列於 `agents.list[]` 的執行階段代理程式 ID，會依照繼承的全域／預設安全態勢進行檢查，而不會在沒有證據的情況下直接通過。`policy.jsonc` 中的每個範圍都必須對其選取條件有效且可執行。疊加規則是額外的宣告，因此不會削弱頂層政策；當同一份觀察到的設定同時違反兩個範圍時，也可能產生各自的發現事項。

<!-- openclaw-plugin-reference:manual-end -->

## 相關文件

- [政策](/zh-TW/cli/policy)
