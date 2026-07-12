---
doc-schema-version: 1
read_when:
    - 你想尋找第三方 OpenClaw 外掛
    - 你想要在 ClawHub 發布或上架自己的外掛
summary: 尋找並發布由社群維護的 OpenClaw 外掛
title: 社群外掛
x-i18n:
    generated_at: "2026-07-11T21:33:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

社群外掛是第三方套件，可透過頻道、工具、供應商、鉤子或其他功能擴充 OpenClaw。請使用 [ClawHub](/clawhub) 作為探索公開社群外掛的主要介面。

## 尋找外掛

從命令列介面搜尋 ClawHub：

```bash
openclaw plugins search "calendar"
```

使用明確的來源前綴安裝 ClawHub 外掛：

```bash
openclaw plugins install clawhub:<package-name>
```

在推出階段的轉換期間，npm 仍是受支援的直接安裝途徑：

```bash
openclaw plugins install npm:<package-name>
```

如需常見的安裝、更新、檢查與解除安裝範例，請參閱[管理外掛](/zh-TW/plugins/manage-plugins)。如需完整的命令參考與來源選擇規則，請參閱 [`openclaw plugins`](/zh-TW/cli/plugins)。

## 發布外掛

請在 ClawHub 上發布公開社群外掛，讓 OpenClaw 使用者能夠探索並安裝。ClawHub 負責即時套件清單、版本歷程、掃描狀態與安裝提示；文件不維護靜態的第三方外掛目錄。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

發布前，請確保外掛具備套件中繼資料、外掛資訊清單、設定文件，以及明確的維護負責人。ClawHub 會先驗證擁有者範圍、套件名稱、版本、檔案限制與來源中繼資料，再建立版本；之後會在審查與驗證完成前，讓新版本不顯示於一般安裝與下載介面。

發布前檢查清單：

| 要求                 | 原因                                                |
| -------------------- | --------------------------------------------------- |
| 已發布至 ClawHub     | 使用者需要可用的 `openclaw plugins install` 提示   |
| 公開的 GitHub 儲存庫 | 便於原始碼審查、問題追蹤與提升透明度                |
| 設定與使用文件       | 使用者需要瞭解如何進行設定                          |
| 持續維護             | 近期有更新或能及時回應問題                          |

完整發布規範：

- [ClawHub 發布](/zh-TW/clawhub/publishing) - 擁有者、範圍、版本、
  審查、套件驗證與套件移轉
- [建置外掛](/zh-TW/plugins/building-plugins) - 外掛套件結構
  與首次發布工作流程
- [外掛資訊清單](/zh-TW/plugins/manifest) - 原生外掛資訊清單欄位

## 相關內容

- [外掛](/zh-TW/tools/plugin) - 安裝、設定、重新啟動與疑難排解
- [管理外掛](/zh-TW/plugins/manage-plugins) - 命令範例
- [ClawHub 發布](/zh-TW/clawhub/publishing) - 發布與版本規則
