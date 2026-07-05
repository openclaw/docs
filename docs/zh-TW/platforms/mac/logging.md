---
read_when:
    - 擷取 macOS 日誌或調查私人資料記錄
    - 偵錯語音喚醒/工作階段生命週期問題
summary: OpenClaw 日誌記錄：輪替式診斷檔案日誌 + 統一日誌隱私旗標
title: macOS 日誌記錄
x-i18n:
    generated_at: "2026-07-05T11:26:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# 記錄（macOS）

## 輪替診斷檔案記錄（除錯窗格）

macOS app 透過 swift-log 記錄（預設使用統一記錄），也可以寫入輪替的本機檔案記錄，以便持久擷取（`DiagnosticsFileLog`）。

- 啟用：**除錯窗格 -> 記錄 -> App logging -> "Write rolling diagnostics log (JSONL)"**（預設關閉）。
- 詳細程度：**除錯窗格 -> 記錄 -> App logging -> Verbosity** 選擇器。
- 位置：`~/Library/Logs/OpenClaw/diagnostics.jsonl`。
- 輪替：達到 5 MB 時輪替；最多 5 份備份，後綴為 `.1`...`.5`（最舊的會被丟棄）。
- 清除：**除錯窗格 -> 記錄 -> App logging -> "Clear"** 會刪除作用中的檔案和所有備份。

請將此檔案視為敏感資料；未經審閱請勿分享。

## macOS 上統一記錄的私密資料

除非子系統選擇加入 `privacy -off`，否則統一記錄會遮蔽大多數酬載。這是由 `/Library/Preferences/Logging/Subsystems/` 中的 plist 控制，並以子系統名稱作為鍵。只有新的記錄項目會套用此旗標，因此請在重現問題前啟用。背景：[macOS logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)。

## 為 OpenClaw 啟用（`ai.openclaw`）

先將 plist 寫入暫存檔，然後以 root 身分原子式安裝：

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

不需要重新開機；logd 會很快讀取該檔案，但只有新的記錄列會包含私密酬載。使用 `./scripts/clawlog.sh --category WebChat --last 5m` 查看更豐富的輸出（`--last`/`-l` 設定時間範圍，預設為 `5m`；`--category`/`-c` 依類別篩選）。

## 除錯後停用

- 移除覆寫：`sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 可選擇執行 `sudo log config --reload`，強制 logd 立即捨棄覆寫。
- 這個介面可能包含電話號碼和訊息內文；只有在主動需要時才保留 plist。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [閘道記錄](/zh-TW/gateway/logging)
