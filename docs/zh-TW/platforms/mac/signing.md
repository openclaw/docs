---
read_when:
    - 建置或簽署 Mac 偵錯建置版本
summary: 封裝腳本產生的 macOS 偵錯建置簽署步驟
title: macOS 簽署
x-i18n:
    generated_at: "2026-04-30T03:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac 簽署（偵錯建置）

此應用程式通常透過 [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 建置，現在會：

- 設定穩定的偵錯 bundle 識別碼：`ai.openclaw.mac.debug`
- 使用該 bundle id 寫入 Info.plist（可透過 `BUNDLE_ID=...` 覆寫）
- 呼叫 [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) 簽署主二進位檔與 app bundle，讓 macOS 將每次重建視為同一個已簽署的 bundle，並保留 TCC 權限（通知、輔助使用、螢幕錄製、麥克風、語音）。若要穩定保留權限，請使用真正的簽署身分；ad-hoc 需要明確選用且不穩定（請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)）。
- 預設使用 `CODESIGN_TIMESTAMP=auto`；它會為 Developer ID 簽章啟用受信任時間戳。設定 `CODESIGN_TIMESTAMP=off` 可略過時間戳（離線偵錯建置）。
- 將建置中繼資料注入 Info.plist：`OpenClawBuildTimestamp`（UTC）與 `OpenClawGitCommit`（短雜湊），讓「關於」窗格能顯示建置、git，以及偵錯/發行通道。
- **封裝預設使用 Node 24**：此腳本會執行 TS 建置與 Control UI 建置。Node 22 LTS（目前為 `22.14+`）仍支援相容性。
- 從環境讀取 `SIGN_IDENTITY`。將 `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`（或你的 Developer ID Application 憑證）新增至 shell rc，即可一律使用你的憑證簽署。Ad-hoc 簽署需要透過 `ALLOW_ADHOC_SIGNING=1` 或 `SIGN_IDENTITY="-"` 明確選用（不建議用於權限測試）。
- 簽署後執行 Team ID 稽核，若 app bundle 內任何 Mach-O 由不同的 Team ID 簽署，則會失敗。設定 `SKIP_TEAM_ID_CHECK=1` 可略過。

## 使用方式

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Ad-hoc 簽署注意事項

使用 `SIGN_IDENTITY="-"`（ad-hoc）簽署時，腳本會自動停用 **Hardened Runtime**（`--options runtime`）。這是必要的，避免 app 嘗試載入未共用相同 Team ID 的嵌入式 framework（例如 Sparkle）時發生當機。Ad-hoc 簽章也會破壞 TCC 權限持續性；復原步驟請參閱 [macOS 權限](/zh-TW/platforms/mac/permissions)。

## 「關於」的建置中繼資料

`package-mac-app.sh` 會在 bundle 上標記：

- `OpenClawBuildTimestamp`：封裝時間的 ISO8601 UTC
- `OpenClawGitCommit`：短 git 雜湊（若無法取得則為 `unknown`）

「關於」分頁會讀取這些鍵，以顯示版本、建置日期、git commit，以及它是否為偵錯建置（透過 `#if DEBUG`）。程式碼變更後，請執行封裝器以重新整理這些值。

## 原因

TCC 權限會綁定 bundle 識別碼_以及_程式碼簽章。UUID 變動的未簽署偵錯建置會導致 macOS 在每次重建後忘記授權。簽署二進位檔（預設為 ad-hoc）並維持固定 bundle id/路徑（`dist/OpenClaw.app`），即可在建置之間保留授權，與 VibeTunnel 方法一致。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [macOS 權限](/zh-TW/platforms/mac/permissions)
