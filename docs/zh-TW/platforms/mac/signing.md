---
read_when:
    - 建置或簽署 Mac 偵錯版本
summary: 由封裝指令碼產生的 macOS 偵錯組建之簽署步驟
title: macOS 簽署
x-i18n:
    generated_at: "2026-07-11T21:29:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac 簽署（偵錯版本）

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 會建置應用程式並封裝至固定路徑（`dist/OpenClaw.app`），接著呼叫 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 進行簽署。TCC 權限與套件識別碼及程式碼簽章綁定；在每次重新建置時保持兩者穩定（並將應用程式維持在固定路徑），可避免 macOS 忘記已授予的 TCC 權限（通知、輔助使用、螢幕錄製、麥克風、語音）。

- 偵錯套件識別碼預設為 `ai.openclaw.mac.debug`（可使用 `BUNDLE_ID=...` 覆寫）。
- 節點：`>=22.19.0 <23` 或 `>=23.11.0`（儲存庫 `package.json` 的 `engines`）。封裝程式也會建置控制介面（`pnpm ui:build`）。
- 預設需要有效的簽署身分；若找不到簽署身分且未設定 `ALLOW_ADHOC_SIGNING`，程式碼簽署指令稿會以錯誤結束。臨時簽署（`SIGN_IDENTITY="-"`）必須明確選用，且無法在重新建置後保留 TCC 權限。請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。
- 從環境讀取 `SIGN_IDENTITY`（例如 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`，或 Developer ID Application 憑證）。若未設定，`codesign-mac-app.sh` 會依下列順序自動選取身分：Developer ID Application、Apple Distribution、Apple Development，最後是找到的第一個有效程式碼簽署身分。
- `CODESIGN_TIMESTAMP=auto`（預設值）只會為 Developer ID Application 簽章啟用受信任的時間戳記。設為 `on`/`off` 可強制啟用或停用。
- 在 Info.plist 中寫入 `OpenClawBuildTimestamp`（ISO8601 UTC）與 `OpenClawGitCommit`（短雜湊；若無法取得則為 `unknown`），讓「關於」分頁顯示建置資訊、Git 資訊，以及偵錯／發行通道。
- 簽署後執行 Team ID 稽核；若套件內任何 Mach-O 的 Team ID 不同，則操作失敗。設定 `SKIP_TEAM_ID_CHECK=1` 可略過此檢查。

## 使用方式

```bash
# 從儲存庫根目錄執行
scripts/package-mac-app.sh                                                      # 自動選取身分；若找不到則報錯
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # 有效憑證
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # 臨時簽署（權限不會保留）
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # 明確使用臨時簽署（限制相同）
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # 僅供開發使用的 Sparkle Team ID 不相符因應措施
```

### 臨時簽署注意事項

`SIGN_IDENTITY="-"` 會停用強化執行階段（`--options runtime`），以避免應用程式載入 Team ID 不相同的內嵌框架（例如 Sparkle）時當機。臨時簽章也會破壞 TCC 權限的持續保留；復原步驟請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 「關於」的建置中繼資料

「關於」分頁會從 Info.plist 讀取 `OpenClawBuildTimestamp` 與 `OpenClawGitCommit`，以顯示版本、建置日期、Git 提交，以及該建置是否為 DEBUG（透過 `#if DEBUG`）。程式碼變更後請重新執行封裝程式，以更新這些值。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)
