---
read_when:
    - 您正在安裝、設定或稽核政策外掛
summary: 新增由政策支援的 doctor 檢查，以確認工作區符合規範。
title: 政策外掛
x-i18n:
    generated_at: "2026-06-27T19:45:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f01de4816a191a175367c06ff69e4ebf6032ee1a105d1d9a48a74093e5e6f774
    source_path: plugins/reference/policy.md
    workflow: 16
---

# Policy 外掛

新增由政策支援的 doctor 檢查，以確認工作區符合規範。

## 發佈

- 套件：`@openclaw/policy`
- 安裝路徑：包含於 OpenClaw

## 介面

外掛

<!-- openclaw-plugin-reference:manual-start -->

## 行為

Policy 外掛會為受政策管理的 OpenClaw
設定與受治理的工作區宣告提供 doctor 健全狀態檢查。Policy 目前涵蓋頻道
符合性、受治理的工具中繼資料、MCP 伺服器態勢、模型供應商態勢、
私有網路存取態勢、閘道暴露態勢、代理工作區/工具
態勢、已設定的全域/每代理工具態勢、已設定的沙箱執行階段
態勢、入口/頻道存取態勢、資料處理態勢，以及 OpenClaw 設定祕密
供應商/驗證設定檔態勢。

Policy 會將作者定義的要求儲存在 `policy.jsonc`，觀察既有的
OpenClaw 設定與工作區宣告作為證據，並透過
`openclaw policy check` 與 `openclaw doctor --lint` 回報偏移。乾淨的政策
檢查會輸出政策、證據、發現項目與證明雜湊，供操作人員
記錄以利稽核。

`openclaw policy compare --baseline <file>` 會將一個政策檔與另一個
政策檔比較。這只檢查設定層級的符合性：它使用政策規則中繼資料
驗證被檢查的政策沒有缺少作者定義的基準，且不比基準更弱，
並且不會檢查執行階段狀態、憑證或祕密值。

工具態勢規則可要求已核准的設定檔、僅限工作區的檔案系統
工具、受限的 exec 安全性/詢問/主機設定、停用提升模式、精確的
`alsoAllow` 項目，以及必要的工具拒絕項目。證據記錄會包含
新增的 `alsoAllow` 項目，因為它們可能擴大有效的工具態勢。
這些檢查只觀察設定符合性；它們不會讀取執行階段核准
狀態，也不會新增執行階段強制執行。

沙箱態勢規則可要求已核准的沙箱模式/後端、拒絕主機
容器網路、拒絕加入容器命名空間、要求唯讀容器
掛載、拒絕容器執行階段 socket 掛載與未受限制的容器設定檔，
並要求沙箱瀏覽器 CDP 來源範圍。
這些檢查只觀察設定符合性；它們不會讀取執行階段核准
狀態、檢查即時容器，或新增執行階段強制執行。

資料處理規則可要求敏感記錄遮蔽、拒絕遙測
內容擷取、要求工作階段保留維護，並拒絕工作階段
逐字稿記憶索引。這些檢查只觀察設定符合性；它們
不會檢查原始記錄、遙測匯出、逐字稿、記憶檔案、祕密
或個人資料。

`scopes.<scopeName>` 下的具名政策範圍，可為其列出的選擇器
新增更嚴格的一般政策區段。`agentIds` 支援 `tools`、
`agents.workspace`、`sandbox` 與 `dataHandling.memory`；`channelIds` 支援
`ingress.channels`。
未明確列於 `agents.list[]` 的執行階段代理 ID，會依照繼承的
全域/預設態勢檢查，而不是在沒有證據的情況下默默通過。
`policy.jsonc` 中存在的每個範圍，都必須對其選擇器有效且可強制執行。
覆疊規則是額外聲明，因此它們不會削弱頂層政策，且當同一個
已觀察到的設定同時違反兩個範圍時，可能產生自己的發現項目。

<!-- openclaw-plugin-reference:manual-end -->

## 相關文件

- [policy](/zh-TW/cli/policy)
