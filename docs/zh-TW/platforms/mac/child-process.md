---
read_when:
    - 整合 Mac 應用程式與閘道生命週期
summary: macOS 上的閘道生命週期（launchd）
title: macOS 上的閘道生命週期
x-i18n:
    generated_at: "2026-07-11T21:29:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS App 預設透過 **launchd** 管理閘道，且不會將閘道作為子程序啟動。它會先嘗試連接設定連接埠上已在執行的閘道；如果無法連線，則會透過外部 `openclaw` 命令列介面啟用 launchd 服務（不含嵌入式執行環境）。如此可確保登入時可靠地自動啟動，並在當機後重新啟動。

目前**未使用**子程序模式（由 App 直接啟動閘道）。如果需要與 UI 更緊密地整合，請在終端機中手動執行閘道。

## 預設行為（launchd）

- App 會安裝標示為 `ai.openclaw.gateway` 的個別使用者 LaunchAgent（使用 `--profile`/`OPENCLAW_PROFILE` 時則為 `ai.openclaw.<profile>`）。
- 啟用本機模式時，App 會確保 LaunchAgent 已載入，並在需要時啟動閘道。
- 記錄會寫入 launchd 閘道記錄路徑（可在偵錯設定中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

執行具名設定檔時，請將標籤替換為 `ai.openclaw.<profile>`。

## 未簽署的開發版本

`scripts/restart-mac.sh --no-sign` 用於在沒有簽署金鑰的情況下快速進行本機建置。為避免 launchd 指向未簽署的轉送二進位檔，它會寫入 `~/.openclaw/disable-launchagent`。

已簽署執行的 `scripts/restart-mac.sh` 會在標記存在時清除此覆寫設定。若要手動重設：

```bash
rm ~/.openclaw/disable-launchagent
```

## 僅連接模式

若要強制 macOS App 永不安裝或管理 launchd，請使用 `--attach-only`（或 `--no-launchd`）啟動。這會設定 `~/.openclaw/disable-launchagent`，使 App 僅連接至已在執行的閘道。也可在偵錯設定中切換相同行為。

## 遠端模式

遠端模式絕不會啟動本機閘道。App 會使用通往遠端主機的 SSH 通道，並透過該通道連線。

## 為何偏好 launchd

- 登入時自動啟動。
- 內建重新啟動/KeepAlive 語意。
- 可預期的記錄與監督機制。

如果未來再次需要真正的子程序模式，應將其記錄為獨立且明確的僅限開發模式。

## 相關內容

- [macOS App](/zh-TW/platforms/macos)
- [閘道操作手冊](/zh-TW/gateway)
