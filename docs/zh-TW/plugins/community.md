---
doc-schema-version: 1
read_when:
    - 你想尋找第三方 OpenClaw 外掛
    - 你想在 ClawHub 發布或列出自己的外掛
summary: 尋找並發布社群維護的 OpenClaw 外掛
title: 社群外掛
x-i18n:
    generated_at: "2026-07-05T11:30:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

社群外掛是擴充 OpenClaw 的第三方套件，可加入
通道、工具、供應商、鉤子或其他功能。請使用
[ClawHub](/clawhub) 作為公開社群外掛的主要探索介面。

## 尋找外掛

從命令列介面搜尋 ClawHub：

```bash
openclaw plugins search "calendar"
```

使用明確的來源前綴安裝 ClawHub 外掛：

```bash
openclaw plugins install clawhub:<package-name>
```

在推出切換期間，npm 仍然是受支援的直接安裝路徑：

```bash
openclaw plugins install npm:<package-name>
```

請參閱[管理外掛](/zh-TW/plugins/manage-plugins)取得常見的安裝、更新、
檢查與解除安裝範例。請參閱[`openclaw plugins`](/zh-TW/cli/plugins)取得
完整的命令參考與來源選擇規則。

## 發佈外掛

在 ClawHub 上發佈公開社群外掛，讓 OpenClaw 使用者可以探索
並安裝它們。ClawHub 負責即時套件清單、版本歷史、
掃描狀態與安裝提示；文件不維護靜態的第三方外掛目錄。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

發佈前，請確保外掛具備套件中繼資料、外掛
資訊清單、設定文件，以及明確的維護負責人。ClawHub 會先驗證擁有者
範圍、套件名稱、版本、檔案限制與來源中繼資料，然後才
建立版本，並在審查與驗證完成前，將新版本從一般安裝與
下載介面中隱藏。

發佈前檢查清單：

| 要求                 | 原因                                                |
| -------------------- | --------------------------------------------------- |
| 已在 ClawHub 發佈 | 使用者需要 `openclaw plugins install` 提示可用 |
| 公開 GitHub 儲存庫   | 原始碼審查、問題追蹤、透明度         |
| 設定與使用文件 | 使用者需要知道如何設定它              |
| 主動維護   | 近期更新或回應迅速的問題處理         |

完整發佈契約：

- [ClawHub 發佈](/zh-TW/clawhub/publishing) - 擁有者、範圍、版本、
  審查、套件驗證與套件轉移
- [建置外掛](/zh-TW/plugins/building-plugins) - 外掛套件形狀
  與首次發佈工作流程
- [外掛資訊清單](/zh-TW/plugins/manifest) - 原生外掛資訊清單欄位

## 相關

- [外掛](/zh-TW/tools/plugin) - 安裝、設定、重新啟動與疑難排解
- [管理外掛](/zh-TW/plugins/manage-plugins) - 命令範例
- [ClawHub 發佈](/zh-TW/clawhub/publishing) - 發佈與版本規則
