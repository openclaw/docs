---
read_when:
    - 宣告組織、品牌、套件範圍、擁有者帳號、skill slug 或套件命名空間
    - 解析已被宣告或保留的命名空間
    - 決定要使用檢舉、申訴或命名空間聲明
sidebarTitle: Org and Namespace Claims
summary: 如何針對組織、品牌、擁有者帳號、套件範圍、skill-slug 或命名空間所有權爭議申請 ClawHub 審查。
title: 組織與命名空間宣告
x-i18n:
    generated_at: "2026-07-01T12:47:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# 組織與命名空間申請

ClawHub 使用擁有者代稱、組織代稱、技能 slug、外掛套件名稱，以及
套件 scope 作為公開命名空間。如果某個命名空間看似屬於
現實世界的專案、品牌、套件生態系或組織，但在 ClawHub 上已被
申請、保留、具有誤導性或存在爭議，請要求工作人員透過
[組織／命名空間申請問題表單](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
審查。

此路徑適用於公開、非敏感的所有權審查。請勿將產品內
回報或帳號申訴表單用於命名空間申請。

## 何時開啟申請

當你認為 ClawHub 工作人員應審查某個命名空間是否應因
現實世界的所有權而被保留、移轉、重新命名、隱藏、隔離、設為別名，
或以其他方式變更時，請開啟命名空間申請。

範例包括：

- 與你的 GitHub 組織、專案、公司或社群相符的組織代稱
- 像 `@example-org/*` 這樣的套件 scope，應只允許相符的
  ClawHub 擁有者發布
- 看似冒充某個專案的技能 slug 或外掛套件名稱
- 品牌、商標、專案重新命名或套件歷史爭議
- 已刪除、不活躍或無法聯繫的擁有者，阻礙了正當的命名空間
  擁有者

如果清單除了所有權爭議外還不安全、惡意或具有誤導性，
也請遵循相關的審核或安全指引。命名空間申請
表單用於所有權審查，而非緊急漏洞揭露。

## 提交前

請先確認你是使用與命名空間相符的擁有者發布。
對於外掛套件，像 `@example-org/example-plugin` 這樣的 scoped 名稱必須
以相符的 `example-org` 擁有者發布。

如果你可以管理目前的擁有者，請直接透過發布、
重新命名、移轉、隱藏或刪除受影響資源來修正命名空間。當你無法管理
目前的擁有者，或工作人員需要解決
爭議時，才使用申請。

## 應包含的證據

請使用公開、非敏感的證據。有幫助的證明包括：

- GitHub 組織、儲存庫、發布版本或維護者歷史
- 指名該命名空間的官方專案文件
- 網域或官方電子郵件網域證明
- npm、PyPI、crates.io 或其他套件登錄的 scope 控制權
- 可公開討論的商標、品牌或專案所有權證據
- 來源儲存庫歷史、套件歷史或公開重新命名公告
- 指向有爭議的 ClawHub 擁有者、技能、外掛、套件或問題的連結

請說明每個連結證明了什麼。工作人員應能在不需要
私人憑證或機密的情況下理解其關係。

## 不應包含的內容

請勿在公開 GitHub 問題中放入機密或私人證明。請勿包含：

- API 權杖、簽署金鑰或憑證
- DNS challenge 權杖
- 私人法律文件或合約
- 個人身分文件
- 私人電子郵件、私人安全報告或機密客戶資料

申請表單會詢問敏感證據是否需要私人工作人員管道。
請使用該選項，而不是公開張貼敏感資料。

## 可能結果

視證據與風險而定，ClawHub 工作人員可能會保留命名空間、
移轉所有權、重新命名資源、隱藏或隔離現有清單、
新增別名或重新導向、要求更多證明，或拒絕請求。

命名空間審查不保證每個相符名稱都會被移轉。
工作人員會權衡公開證據、既有使用情況、安全風險與使用者影響。

## 相關文件

- [發布](/zh-TW/clawhub/publishing)
- [疑難排解](/zh-TW/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [審核與帳號安全](/zh-TW/clawhub/moderation)
- [安全](/zh-TW/clawhub/security)
