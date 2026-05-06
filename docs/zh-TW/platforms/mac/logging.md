---
read_when:
    - 擷取 macOS 日誌或調查私人資料寫入日誌的情況
    - 偵錯語音喚醒/工作階段生命週期問題
summary: OpenClaw 記錄：輪替診斷檔案日誌 + 統一日誌隱私旗標
title: macOS 日誌記錄
x-i18n:
    generated_at: "2026-05-06T09:14:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# 記錄（macOS）

## 輪替式診斷檔案記錄（偵錯窗格）

OpenClaw 會透過 swift-log 路由 macOS 應用程式記錄（預設為統一記錄），並可在你需要可保留擷取內容時，將本機輪替檔案記錄寫入磁碟。

- 詳細程度：**偵錯窗格 → 記錄 → 應用程式記錄 → 詳細程度**
- 啟用：**偵錯窗格 → 記錄 → 應用程式記錄 →「寫入輪替式診斷記錄（JSONL）」**
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`（會自動輪替；舊檔案會加上 `.1`、`.2`、… 後綴）
- 清除：**偵錯窗格 → 記錄 → 應用程式記錄 →「清除」**

注意事項：

- 這項功能**預設關閉**。只在主動偵錯時啟用。
- 請將此檔案視為敏感資料；未審閱前請勿分享。

## macOS 上統一記錄的私有資料

除非某個子系統選擇加入 `privacy -off`，否則統一記錄會遮蔽大多數酬載。根據 Peter 關於 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025）的文章，這是由 `/Library/Preferences/Logging/Subsystems/` 中以子系統名稱為鍵的 plist 控制。只有新的記錄項目會套用該旗標，因此請在重現問題之前啟用它。

## 為 OpenClaw 啟用（`ai.openclaw`）

- 先將 plist 寫入暫存檔，然後以 root 身分原子化安裝：

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- 不需要重新開機；logd 很快就會注意到該檔案，但只有新的記錄行會包含私有酬載。
- 使用現有輔助程式檢視更豐富的輸出，例如 `./scripts/clawlog.sh --category WebChat --last 5m`。

## 偵錯後停用

- 移除覆寫：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 也可以執行 `sudo log config --reload`，強制 logd 立即捨棄覆寫。
- 請記得此表面可能包含電話號碼和訊息本文；只有在你主動需要額外細節時，才保留該 plist。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [Gateway 記錄](/zh-TW/gateway/logging)
