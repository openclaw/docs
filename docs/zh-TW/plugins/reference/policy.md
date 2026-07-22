---
read_when:
    - 你正在安裝、設定或稽核原則外掛
summary: 新增以政策為依據的 doctor 工作區合規性檢查。
title: 政策外掛
x-i18n:
    generated_at: "2026-07-22T10:40:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 440f2f46e4149fdd5e65bf0140d4981c6d840e8e8c8a85d05eeb23a0839a61ac
    source_path: plugins/reference/policy.md
    workflow: 16
---

# 政策外掛

新增以政策為依據的 doctor 檢查，以確認工作區符合規範。

## 發佈方式

- 套件：`@openclaw/policy`
- 安裝方式：隨附於 OpenClaw

## 介面

外掛

<!-- openclaw-plugin-reference:manual-start -->

## 行為

政策外掛會為政策管理的 OpenClaw 設定及受管控的工作區宣告提供 doctor 健全狀態檢查。目前政策涵蓋頻道合規性、受管控的工具中繼資料、MCP 伺服器態勢、模型供應商態勢、私人網路存取態勢、閘道暴露態勢、代理程式工作區／工具態勢、已設定的全域／個別代理程式工具態勢、已設定的沙箱執行階段態勢、入口／頻道存取態勢、資料處理態勢，以及 OpenClaw 設定的祕密供應商／驗證設定檔態勢。

政策會將編寫的要求儲存在 `policy.jsonc` 中，觀察既有的 OpenClaw 設定與工作區宣告作為證據，並透過 `openclaw policy check` 和 `openclaw doctor --lint` 回報偏移。政策檢查無異常時，會輸出政策、證據、發現項目及證明雜湊，供操作人員記錄以進行稽核。

`openclaw policy compare --baseline <file>` 會將一個政策檔案與另一個政策檔案進行比較。這僅檢查設定層級的合規性：它會使用政策規則中繼資料，確認受檢查的政策沒有缺少編寫基準中的要求，且不比該基準寬鬆；它不會檢查執行階段狀態、認證資訊或祕密值。

工具態勢規則可要求使用核准的設定檔、僅限工作區的檔案系統工具、受限的 exec 安全性／詢問／主機設定、停用提升權限模式、完全相符的 `alsoAllow` 項目，以及必要的工具拒絕項目。由於額外的 `alsoAllow` 項目可能擴大有效的工具態勢，因此證據記錄會包含這些項目。這些檢查只觀察設定合規性；不會讀取執行階段核准狀態，也不會新增執行階段強制措施。

沙箱態勢規則可要求使用核准的沙箱模式／後端、禁止主機容器網路、禁止加入容器命名空間、要求唯讀容器掛載、禁止掛載容器執行階段通訊端及使用不受限制的容器設定檔，並要求沙箱瀏覽器的 CDP 來源範圍。
這些檢查只觀察設定合規性；不會讀取執行階段核准狀態、檢查即時容器，或新增執行階段強制措施。

資料處理規則可要求對敏感記錄進行遮蔽、禁止遙測內容擷取、要求維護工作階段保留期限，以及禁止對工作階段文字記錄建立記憶索引。這些檢查只觀察設定合規性；不會檢查原始記錄、遙測匯出資料、文字記錄、記憶檔案、祕密或個人資料。

`scopes.<scopeName>` 下的具名政策範圍，可針對其列出的選擇器新增更嚴格的一般政策區段。`agentIds` 支援 `tools`、`agents.workspace`、`sandbox` 和 `dataHandling.memory`；`channelIds` 支援 `ingress.channels`。
未明確列於 `agents.entries.*` 中的執行階段代理程式 ID，會依據繼承的全域／預設態勢接受檢查，而不會因沒有證據就直接通過。`policy.jsonc` 中的每個範圍都必須有效，且能針對其選擇器強制執行。覆疊規則是額外的宣告，因此不會削弱頂層政策；當同一份觀察到的設定同時違反兩個範圍時，也可產生各自的發現項目。

<!-- openclaw-plugin-reference:manual-end -->

## 相關文件

- [政策](/zh-TW/cli/policy)
