---
read_when:
    - 將 Mac 應用程式與 Gateway 生命週期整合
summary: macOS 上的 Gateway 生命週期（launchd）
title: macOS 上的 Gateway 生命週期
x-i18n:
    generated_at: "2026-05-06T09:13:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
    postprocess_version: locale-links-v1
---

macOS app 預設會**透過 launchd 管理 Gateway**，不會將 Gateway 生成為子行程。它會先嘗試連接到已在設定連接埠上執行的 Gateway；如果無法連線，則會透過外部 `openclaw` CLI 啟用 launchd 服務（沒有嵌入式執行階段）。這能提供可靠的登入時自動啟動，以及當機時重新啟動。

子行程模式（由 app 直接生成 Gateway）目前**未使用**。如果你需要與 UI 更緊密耦合，請在終端機中手動執行 Gateway。

## 預設行為（launchd）

- app 會安裝每位使用者專屬的 LaunchAgent，標籤為 `ai.openclaw.gateway`
  （或在使用 `--profile`/`OPENCLAW_PROFILE` 時為 `ai.openclaw.<profile>`；支援舊版 `com.openclaw.*`）。
- 啟用本機模式時，app 會確保 LaunchAgent 已載入，並在需要時啟動 Gateway。
- 記錄會寫入 launchd gateway 記錄路徑（可在偵錯設定中看到）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

執行具名設定檔時，請將標籤替換為 `ai.openclaw.<profile>`。

## 未簽署的開發建置

`scripts/restart-mac.sh --no-sign` 適用於沒有簽署金鑰時的快速本機建置。為防止 launchd 指向未簽署的中繼二進位檔，它會：

- 寫入 `~/.openclaw/disable-launchagent`。

如果標記存在，已簽署的 `scripts/restart-mac.sh` 執行會清除此覆寫。若要手動重設：

```bash
rm ~/.openclaw/disable-launchagent
```

## 僅連接模式

若要強制 macOS app **永不安裝或管理 launchd**，請使用 `--attach-only`（或 `--no-launchd`）啟動。這會設定 `~/.openclaw/disable-launchagent`，因此 app 只會連接到已在執行的 Gateway。你也可以在偵錯設定中切換相同行為。

## 遠端模式

遠端模式絕不會啟動本機 Gateway。app 會使用 SSH 通道連到遠端主機，並透過該通道連線。

## 為什麼我們偏好 launchd

- 登入時自動啟動。
- 內建重新啟動/KeepAlive 語意。
- 可預測的記錄與監督。

如果未來再次需要真正的子行程模式，應將其記錄為獨立且明確的開發專用模式。

## 相關

- [macOS app](/zh-TW/platforms/macos)
- [Gateway runbook](/zh-TW/gateway)
