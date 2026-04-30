---
read_when:
    - 擷取 macOS 日誌或調查私密資料記錄行為
    - 偵錯語音喚醒／工作階段生命週期問題
summary: OpenClaw 記錄：輪替式診斷檔案日誌 + 統一日誌隱私旗標
title: macOS 日誌記錄
x-i18n:
    generated_at: "2026-04-30T03:20:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 16
---

# 日誌記錄 (macOS)

## 輪替診斷檔案日誌（偵錯窗格）

OpenClaw 會透過 swift-log 路由 macOS App 日誌（預設為統一日誌記錄），並且可在你需要持久擷取時，將本機輪替檔案日誌寫入磁碟。

- 詳細程度：**偵錯窗格 → 日誌 → App 日誌記錄 → 詳細程度**
- 啟用：**偵錯窗格 → 日誌 → App 日誌記錄 →「寫入輪替診斷日誌 (JSONL)」**
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`（自動輪替；舊檔案會加上 `.1`、`.2`、… 後綴）
- 清除：**偵錯窗格 → 日誌 → App 日誌記錄 →「清除」**

注意：

- 這項功能**預設為關閉**。只在主動偵錯時啟用。
- 請將此檔案視為敏感資料；未經檢閱請勿分享。

## macOS 上的統一日誌私人資料

除非子系統選擇加入 `privacy -off`，否則統一日誌記錄會遮蔽大多數承載內容。根據 Peter 在 2025 年關於 macOS [日誌隱私權問題](https://steipete.me/posts/2025/logging-privacy-shenanigans) 的文章，這是由 `/Library/Preferences/Logging/Subsystems/` 中以子系統名稱為索引鍵的 plist 控制。只有新的日誌項目會套用此旗標，因此請在重現問題前先啟用它。

## 為 OpenClaw 啟用 (`ai.openclaw`)

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

- 不需要重新開機；logd 會很快注意到此檔案，但只有新的日誌行會包含私人承載內容。
- 使用現有輔助工具檢視更豐富的輸出，例如 `./scripts/clawlog.sh --category WebChat --last 5m`。

## 偵錯後停用

- 移除覆寫設定：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 可選擇執行 `sudo log config --reload`，強制 logd 立即捨棄覆寫設定。
- 請記住，這個介面可能包含電話號碼與訊息正文；只有在你主動需要額外詳細資料時，才保留此 plist。

## 相關

- [macOS App](/zh-TW/platforms/macos)
- [Gateway 日誌記錄](/zh-TW/gateway/logging)
