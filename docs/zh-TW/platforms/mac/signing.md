---
read_when:
    - 建置或簽署 Mac 除錯建置版本
summary: 封裝腳本產生的 macOS 偵錯建置版本簽署步驟
title: macOS 簽章
x-i18n:
    generated_at: "2026-05-06T09:14:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 簽署（偵錯建置）

此應用程式通常是從 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 建置，該指令碼現在會：

- 設定穩定的偵錯 bundle identifier：`ai.openclaw.mac.debug`
- 使用該 bundle id 寫入 Info.plist（可透過 `BUNDLE_ID=...` 覆寫）
- 呼叫 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 來簽署主要二進位檔與應用程式套件，讓 macOS 將每次重建都視為同一個已簽署套件，並保留 TCC 權限（通知、輔助使用、螢幕錄製、麥克風、語音）。若要取得穩定權限，請使用真正的簽署身分；ad-hoc 是選擇性啟用且較脆弱（請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)）。
- 預設使用 `CODESIGN_TIMESTAMP=auto`；這會為 Developer ID 簽章啟用受信任的時間戳記。設定 `CODESIGN_TIMESTAMP=off` 可略過時間戳記（離線偵錯建置）。
- 將建置中繼資料注入 Info.plist：`OpenClawBuildTimestamp`（UTC）與 `OpenClawGitCommit`（短雜湊），讓「關於」窗格可以顯示建置、git，以及偵錯/發行通道。
- **封裝預設使用 Node 24**：此指令碼會執行 TS 建置與 Control UI 建置。Node 22 LTS，目前為 `22.14+`，仍支援相容性。
- 從環境讀取 `SIGN_IDENTITY`。將 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 憑證）加入 shell rc，即可一律使用你的憑證簽署。Ad-hoc 簽署需要透過 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 明確選擇啟用（不建議用於權限測試）。
- 簽署後執行 Team ID 稽核，若應用程式套件內任何 Mach-O 是由不同 Team ID 簽署，則會失敗。設定 `SKIP_TEAM_ID_CHECK=1` 可略過。

## 用法

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Ad-hoc 簽署注意事項

使用 `SIGN_IDENTITY="-"`（ad-hoc）簽署時，指令碼會自動停用 **Hardened Runtime**（`--options runtime`）。這是必要的，用來避免應用程式嘗試載入未共用相同 Team ID 的嵌入式 framework（例如 Sparkle）時發生當機。Ad-hoc 簽章也會破壞 TCC 權限持久性；請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions) 取得復原步驟。

## 「關於」的建置中繼資料

`package-mac-app.sh` 會在套件中標記：

- `OpenClawBuildTimestamp`：封裝時間的 ISO8601 UTC
- `OpenClawGitCommit`：短 git 雜湊（若無法取得則為 `unknown`）

「關於」分頁會讀取這些鍵，以顯示版本、建置日期、git commit，以及它是否為偵錯建置（透過 `#if DEBUG`）。程式碼變更後，請執行封裝器以重新整理這些值。

## 原因

TCC 權限會綁定 bundle identifier _和_ 程式碼簽章。帶有變動 UUID 的未簽署偵錯建置，會導致 macOS 在每次重建後忘記授權。簽署二進位檔（預設為 ad-hoc）並保持固定的 bundle id/路徑（`dist/OpenClaw.app`），可以在建置之間保留授權，與 VibeTunnel 的做法一致。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)
