---
read_when:
    - 宣告組織、品牌、套件範圍、擁有者帳號、skill slug 或套件命名空間
    - 解析已被宣告或保留的命名空間
    - 決定是否使用檢舉、申訴或命名空間聲明
sidebarTitle: Org and Namespace Claims
summary: 如何針對組織、品牌、擁有者帳號代稱、套件範圍、skill-slug 或命名空間所有權爭議請求 ClawHub 審查。
title: 組織與命名空間聲明
x-i18n:
    generated_at: "2026-06-27T19:01:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# 組織與命名空間申請

ClawHub 使用擁有者控制代碼、組織控制代碼、Skills slug、外掛套件名稱，以及
套件作用域作為公開命名空間。如果某個命名空間看起來屬於
現實世界的專案、品牌、套件生態系或組織，但在 ClawHub 上已被
申請、保留、具誤導性或存在爭議，請透過
[組織／命名空間申請 issue 表單](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
請工作人員審查。

此路徑適用於公開、非敏感的所有權審查。不要將產品內
回報或帳號申訴表單用於命名空間申請。

## 何時開啟申請

當你認為 ClawHub 工作人員應審查某個
命名空間是否因現實世界所有權而應被保留、轉移、重新命名、隱藏、隔離、加上別名，
或以其他方式變更時，請開啟命名空間申請。

範例包括：

- 與你的 GitHub 組織、專案、公司或社群相符的組織控制代碼
- 像 `@example-org/*` 這類套件作用域，應只允許由相符的
  ClawHub 擁有者發布
- 看起來冒充某個專案的 Skills slug 或外掛套件名稱
- 品牌、商標、專案重新命名或套件歷史爭議
- 已刪除、不活躍或無法聯絡的擁有者，阻擋了合法命名空間
  擁有者

如果該清單除了所有權爭議之外還不安全、惡意或具誤導性，
也請遵循相關的審核或安全指引。命名空間申請
表單用於所有權審查，而不是緊急漏洞揭露。

## 提交前

請先確認你是使用與命名空間相符的擁有者來發布。
對於外掛套件，像 `@example-org/example-plugin` 這類作用域名稱必須
以相符的 `example-org` 擁有者發布。

如果你可以管理目前的擁有者，請直接透過發布、
重新命名、轉移、隱藏或刪除受影響的資源來修正命名空間。當你無法管理目前的擁有者，
或需要工作人員解決
爭議時，才使用申請。

## 應包含的證據

請使用公開、非敏感的證據。有幫助的證明包括：

- GitHub 組織、儲存庫、版本發布或維護者歷史
- 提及該命名空間的官方專案文件
- 網域或官方電子郵件網域證明
- npm、PyPI、crates.io 或其他套件登錄檔的作用域控制權
- 可公開討論的商標、品牌或專案所有權證據
- 原始碼儲存庫歷史、套件歷史或公開重新命名通知
- 指向存在爭議的 ClawHub 擁有者、Skills、外掛、套件或 issue 的連結

請說明每個連結能證明什麼。工作人員應能在不需要私人憑證或秘密的情況下理解
其中的關係。

## 不應包含的內容

不要在公開 GitHub issue 中放入秘密或私人證明。不要包含：

- API 權杖、簽署金鑰或憑證
- DNS 驗證權杖
- 私人法律文件或合約
- 個人身分證明文件
- 私人電子郵件、私人安全回報或機密客戶資料

申請表單會詢問敏感證據是否需要私人工作人員管道。
請使用該選項，而不是公開張貼敏感資料。

## 可能結果

視證據與風險而定，ClawHub 工作人員可能會保留命名空間、
轉移所有權、重新命名資源、隱藏或隔離現有清單、
新增別名或重新導向、要求更多證明，或拒絕請求。

命名空間審查不保證每個相符名稱都會被轉移。
工作人員會權衡公開證據、現有使用情況、安全風險與使用者影響。

## 相關文件

- [發布](/zh-TW/clawhub/publishing)
- [疑難排解](/zh-TW/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [審核與帳號安全](/zh-TW/clawhub/moderation)
- [安全](/zh-TW/clawhub/security)
