---
doc-schema-version: 1
read_when:
    - 您想尋找第三方 OpenClaw 外掛
    - 你想在 ClawHub 發布或上架自己的外掛
summary: 尋找並發布由社群維護的 OpenClaw 外掛
title: 社群外掛
x-i18n:
    generated_at: "2026-06-27T19:35:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

社群外掛是第三方套件，可透過頻道、工具、提供者、掛鉤或其他功能來擴充 OpenClaw。使用 [ClawHub](/zh-TW/clawhub) 作為公開社群外掛的主要探索介面。

## 尋找外掛

從命令列介面搜尋 ClawHub：

```bash
openclaw plugins search "calendar"
```

使用明確的來源前綴安裝 ClawHub 外掛：

```bash
openclaw plugins install clawhub:<package-name>
```

在上線切換期間，npm 仍然是受支援的直接安裝路徑：

```bash
openclaw plugins install npm:<package-name>
```

請參閱[管理外掛](/zh-TW/plugins/manage-plugins)，了解常見的安裝、更新、檢查和解除安裝範例。請參閱 [`openclaw plugins`](/zh-TW/cli/plugins)，取得完整的命令參考與來源選擇規則。

## 發佈外掛

當你希望 OpenClaw 使用者能探索並安裝公開社群外掛時，請將其發佈到 ClawHub。ClawHub 負責即時套件清單、發行歷史、掃描狀態和安裝提示；文件不維護靜態的第三方外掛目錄。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

發佈前，請確認外掛具備套件中繼資料、外掛資訊清單、設定文件，以及明確的維護負責人。ClawHub 會在建立發行版本前驗證擁有者範圍、套件名稱、版本、檔案限制和來源中繼資料，然後在審查與驗證完成前，讓新發行版本對一般安裝與下載介面保持隱藏。

發佈前請使用這份檢查清單：

| 需求                 | 原因                                                |
| -------------------- | --------------------------------------------------- |
| 已發佈到 ClawHub     | 使用者需要 `openclaw plugins install` 提示才能運作 |
| 公開 GitHub 儲存庫   | 原始碼審查、問題追蹤、透明度                        |
| 設定與使用文件       | 使用者需要知道如何設定它                            |
| 積極維護             | 近期更新或能回應問題處理                            |

請使用這些頁面了解完整的發佈合約：

- [ClawHub 發佈](/zh-TW/clawhub/publishing)說明擁有者、範圍、發行版本、審查、套件驗證和套件轉移。
- [建置外掛](/zh-TW/plugins/building-plugins)展示外掛套件形態與首次發佈工作流程。
- [外掛資訊清單](/zh-TW/plugins/manifest)定義原生外掛資訊清單欄位。

## 相關

- [外掛](/zh-TW/tools/plugin) - 安裝、設定、重新啟動與疑難排解
- [管理外掛](/zh-TW/plugins/manage-plugins) - 命令範例
- [ClawHub 發佈](/zh-TW/clawhub/publishing) - 發佈與發行規則
