---
read_when:
    - 將 Mac 應用程式與閘道生命週期整合
summary: macOS 上的閘道生命週期（launchd）
title: macOS 上的閘道生命週期
x-i18n:
    generated_at: "2026-07-05T11:28:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS 應用程式預設透過 **launchd** 管理閘道，且不會將閘道
作為子程序產生。它會先嘗試連接到設定連接埠上
已在執行的閘道；如果沒有可連線的閘道，則會透過外部 `openclaw` 命令列介面
啟用 launchd 服務（沒有嵌入式
執行階段）。這能在登入時提供可靠的自動啟動，並在當機時重新啟動。

子程序模式（由應用程式直接產生閘道）目前**未使用**。
如果你需要與 UI 更緊密耦合，請在
終端機中手動執行閘道。

## 預設行為（launchd）

- 應用程式會安裝一個每位使用者專屬的 LaunchAgent，標籤為 `ai.openclaw.gateway`（或
  使用 `--profile`/`OPENCLAW_PROFILE` 時為 `ai.openclaw.<profile>`）。
- 啟用本機模式時，應用程式會確保 LaunchAgent 已載入，並
  視需要啟動閘道。
- 記錄會寫入 launchd 閘道記錄路徑（可在「偵錯設定」中查看）。

常用命令：

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

執行具名設定檔時，請將標籤替換為 `ai.openclaw.<profile>`。

## 未簽署的開發建置

`scripts/restart-mac.sh --no-sign` 用於沒有簽署
金鑰的快速本機建置。為了避免 launchd 指向未簽署的 relay binary，它會寫入
`~/.openclaw/disable-launchagent`。

如果標記存在，已簽署執行的 `scripts/restart-mac.sh` 會清除此覆寫。
若要手動重設：

```bash
rm ~/.openclaw/disable-launchagent
```

## 僅連接模式

若要強制 macOS 應用程式永不安裝或管理 launchd，請使用
`--attach-only`（或 `--no-launchd`）啟動。這會設定
`~/.openclaw/disable-launchagent`，因此應用程式只會連接到已在
執行的閘道。可在「偵錯設定」中切換相同行為。

## 遠端模式

遠端模式永遠不會啟動本機閘道。應用程式會使用 SSH 通道連到
遠端主機，並透過該通道連線。

## 為什麼我們偏好 launchd

- 登入時自動啟動。
- 內建重新啟動/KeepAlive 語意。
- 可預測的記錄與監督。

如果未來再次需要真正的子程序模式，應將其記錄為
獨立、明確的僅限開發模式。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [閘道操作手冊](/zh-TW/gateway)
