---
read_when:
    - 認領組織、品牌、套件範圍、擁有者代號、skill slug 或套件命名空間
    - 解析已被占用或保留的命名空間
    - 決定要使用回報、申訴或命名空間聲明
sidebarTitle: Org and Namespace Claims
summary: 如何針對組織、品牌、擁有者帳號、套件範圍、技能代稱或命名空間的所有權爭議請求 ClawHub 審查。
title: 組織與命名空間聲明
x-i18n:
    generated_at: "2026-06-28T05:04:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# 組織與命名空間申請

ClawHub 使用擁有者代號、組織代號、skill slug、外掛套件名稱和
套件 scope 作為公開命名空間。如果某個命名空間看似屬於
真實世界的專案、品牌、套件生態系或組織，但在 ClawHub 上已被
申請、保留、造成誤導或存在爭議，請透過
[組織 / 命名空間申請問題表單](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
請工作人員審查。

此流程用於公開、非敏感的所有權審查。請勿將產品內回報
或帳號申訴表單用於命名空間申請。

## 何時提出申請

當你認為 ClawHub 工作人員應審查某個命名空間是否因真實世界的所有權而
需要被保留、轉移、重新命名、隱藏、隔離、加入別名，
或以其他方式變更時，請提出命名空間申請。

範例包括：

- 與你的 GitHub 組織、專案、公司或社群相符的組織代號
- 像 `@example-org/*` 這樣的套件 scope，應只由相符的
  ClawHub 擁有者發布
- 看似冒充某個專案的 skill slug 或外掛套件名稱
- 品牌、商標、專案重新命名或套件歷史爭議
- 已刪除、停用或無法聯絡的擁有者，阻擋了合法的命名空間
  擁有者

如果該清單除了所有權爭議之外還不安全、惡意或具誤導性，
也請遵循相關的審核或安全指引。命名空間申請表單用於所有權審查，
不是緊急漏洞揭露管道。

## 提交前

請先確認你是使用與命名空間相符的擁有者發布。
對於外掛套件，像 `@example-org/example-plugin` 這樣的 scoped 名稱必須
以相符的 `example-org` 擁有者發布。

如果你可以管理目前的擁有者，請直接透過發布、重新命名、轉移、隱藏
或刪除受影響的資源來修正命名空間。當你無法管理目前的擁有者，
或需要工作人員解決爭議時，才使用申請。

## 應包含的證據

請使用公開、非敏感的證據。有幫助的證明包括：

- GitHub 組織、repo、release 或維護者歷史
- 指明該命名空間的官方專案文件
- 網域或官方電子郵件網域證明
- npm、PyPI、crates.io 或其他套件登錄檔的 scope 控制權
- 可公開討論的商標、品牌或專案所有權證據
- 原始碼儲存庫歷史、套件歷史或公開重新命名通知
- 指向有爭議的 ClawHub 擁有者、skill、外掛、套件或 issue 的連結

請說明每個連結證明了什麼。工作人員應能在不需要私人憑證或秘密的情況下
理解其關係。

## 不應包含的內容

請勿在公開 GitHub issue 中放入秘密或私人證明。請勿包含：

- API token、簽署金鑰或憑證
- DNS challenge token
- 私人法律文件或合約
- 個人身分文件
- 私人電子郵件、私人安全報告或機密客戶資料

申請表單會詢問敏感證據是否需要私人工作人員管道。
請使用該選項，而不是公開張貼敏感資料。

## 可能結果

根據證據和風險，ClawHub 工作人員可能會保留某個命名空間、
轉移所有權、重新命名資源、隱藏或隔離現有清單、
新增別名或重新導向、要求更多證明，或拒絕請求。

命名空間審查不保證每個相符名稱都會被轉移。
工作人員會權衡公開證據、既有使用情況、安全風險和使用者影響。

## 相關文件

- [發布](/zh-TW/clawhub/publishing)
- [疑難排解](/zh-TW/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [審核與帳號安全](/zh-TW/clawhub/moderation)
- [安全性](/zh-TW/clawhub/security)
