---
read_when:
    - 建置或簽署 Mac 偵錯組建
summary: 封裝指令碼產生的 macOS 偵錯建置簽署步驟
title: macOS 簽署
x-i18n:
    generated_at: "2026-07-05T11:29:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 簽署（偵錯建置）

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 會將應用程式建置並封裝到固定路徑（`dist/OpenClaw.app`），接著呼叫 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 進行簽署。TCC 權限會繫結到套件組合 ID 與程式碼簽章；在重新建置之間保持兩者穩定（並讓應用程式位於固定路徑），可避免 macOS 遺忘 TCC 授權（通知、輔助使用、螢幕錄製、麥克風、語音）。

- 偵錯套件組合識別碼預設為 `ai.openclaw.mac.debug`（可用 `BUNDLE_ID=...` 覆寫）。
- 節點：`>=22.19.0 <23` 或 `>=23.11.0`（repo `package.json` `engines`）。封裝程式也會建置 Control UI（`pnpm ui:build`）。
- 預設需要真實簽署身分；如果找不到身分且未設定 `ALLOW_ADHOC_SIGNING`，codesign 腳本會以錯誤結束。臨時簽署（`SIGN_IDENTITY="-"`）是明確選擇啟用，且不會在重新建置之間保留 TCC 權限。請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。
- 從環境讀取 `SIGN_IDENTITY`（例如 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`，或 Developer ID Application 憑證）。若未設定，`codesign-mac-app.sh` 會依此順序自動選擇身分：Developer ID Application、Apple Distribution、Apple Development，接著是找到的第一個有效 codesigning 身分。
- `CODESIGN_TIMESTAMP=auto`（預設）只會為 Developer ID Application 簽章啟用可信時間戳記。設定為 `on`/`off` 可強制指定任一方式。
- 以 `OpenClawBuildTimestamp`（ISO8601 UTC）與 `OpenClawGitCommit`（短雜湊，若無法取得則為 `unknown`）標記 Info.plist，讓「關於」分頁能顯示建置、git，以及偵錯/發行通道。
- 簽署後會執行團隊 ID 稽核；若套件組合內任何 Mach-O 的團隊 ID 不同，就會失敗。設定 `SKIP_TEAM_ID_CHECK=1` 可略過。

## 用法

```bash
# from repo root
scripts/package-mac-app.sh                                                      # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # dev-only Sparkle Team ID mismatch workaround
```

### 臨時簽署注意事項

`SIGN_IDENTITY="-"` 會停用強化執行階段（`--options runtime`），以避免應用程式載入未共用相同團隊 ID 的嵌入式框架（例如 Sparkle）時發生當機。臨時簽章也會破壞 TCC 權限持續性；復原步驟請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 「關於」的建置中繼資料

「關於」分頁會從 Info.plist 讀取 `OpenClawBuildTimestamp` 與 `OpenClawGitCommit`，以顯示版本、建置日期、git commit，以及建置是否為 DEBUG（透過 `#if DEBUG`）。程式碼變更後請重新執行封裝程式，以重新整理這些值。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)
