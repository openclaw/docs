---
read_when:
    - 你正在升級使用推斷承諾的設定
    - 你想要檢查或捨棄先前儲存的後續追蹤記錄
sidebarTitle: Commitments
summary: 已淘汰的推斷式後續承諾之狀態與清理指南
title: 推斷出的承諾
x-i18n:
    generated_at: "2026-07-22T10:30:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cfaa8c44be4ffb8db48279dba5347d4f598a193bfc4e244aeaed7a93e00ffb79
    source_path: concepts/commitments.md
    workflow: 16
---

推斷承諾實驗已停止。OpenClaw 不再擷取新的
對話後續事項或透過心跳偵測傳送這些事項，而先前的
`commitments` 設定區塊會由 `openclaw doctor --fix` 移除。

精確提醒與排程工作會繼續使用
[排程任務](/zh-TW/automation/cron-jobs)。持久保存的對話事實應存放於
[記憶](/zh-TW/concepts/memory)。

## 現有記錄

先前儲存的承諾會保留在共用的 SQLite 狀態資料庫中，確保
升級不會破壞操作人員可見的歷史記錄。請使用舊版維護
命令列介面來檢查或解除這些資料列：

```bash
openclaw commitments --all
openclaw commitments dismiss cm_abc123
```

如需維護命令參考，請參閱
[`openclaw commitments`](/zh-TW/cli/commitments)。

## 相關內容

- [排程任務](/zh-TW/automation/cron-jobs)
- [記憶體概覽](/zh-TW/concepts/memory)
- [心跳偵測](/zh-TW/gateway/heartbeat)
