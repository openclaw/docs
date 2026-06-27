---
read_when:
    - 在同一台機器上執行多個閘道
    - 每個閘道都需要隔離的設定、狀態與連接埠
summary: 在一台主機上執行多個 OpenClaw 閘道（隔離、連接埠與設定檔）
title: 多個閘道
x-i18n:
    generated_at: "2026-06-27T19:19:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

大多數設定應使用一個閘道，因為單一閘道可以處理多個訊息連線與代理。如果你需要更強的隔離或備援（例如救援機器人），請使用隔離的設定檔/連接埠執行個別閘道。

## 最佳建議設定

對大多數使用者而言，最簡單的救援機器人設定是：

- 將主要機器人保留在預設設定檔
- 在 `--profile rescue` 上執行救援機器人
- 為救援帳號使用完全獨立的 Telegram 機器人
- 將救援機器人放在不同的基準連接埠，例如 `19789`

這會讓救援機器人與主要機器人隔離，因此若主要機器人停擺，它可以偵錯或套用設定變更。請在基準連接埠之間至少保留 20 個連接埠，讓衍生的瀏覽器/canvas/CDP 連接埠絕不會衝突。

## 救援機器人快速入門

除非你有很強的理由採用其他方式，否則請使用這個預設路徑：

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主要機器人已經在執行，這通常就是你所需要的全部設定。

在 `openclaw --profile rescue onboard` 期間：

- 使用獨立的 Telegram 機器人權杖
- 保留 `rescue` 設定檔
- 使用至少比主要機器人高 20 的基準連接埠
- 接受預設救援工作區，除非你已自行管理一個工作區

如果上線引導已為你安裝救援服務，最後的 `gateway install` 就不需要。

## 為什麼這樣可行

救援機器人會保持獨立，因為它有自己的：

- 設定檔/設定
- 狀態目錄
- 工作區
- 基準連接埠（以及衍生連接埠）
- Telegram 機器人權杖

對大多數設定而言，請為救援設定檔使用完全獨立的 Telegram 機器人：

- 容易維持僅限操作者使用
- 獨立的機器人權杖與身分
- 獨立於主要機器人的頻道/應用程式安裝
- 當主要機器人故障時，提供簡單的私訊復原路徑

## `--profile rescue onboard` 會變更什麼

`openclaw --profile rescue onboard` 使用一般上線引導流程，但會將所有內容寫入個別設定檔。

實際上，這表示救援機器人會取得自己的：

- 設定檔
- 狀態目錄
- 工作區（預設為 `~/.openclaw/workspace-rescue`）
- 受管理的服務名稱

除此之外，提示與一般上線引導相同。

## 一般多閘道設定

上述救援機器人配置是最簡單的預設方式，但相同的隔離模式也適用於同一主機上的任何一對或一組閘道。

若要進行更一般的設定，請為每個額外閘道提供自己的命名設定檔與自己的基準連接埠：

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果你希望兩個閘道都使用命名設定檔，也可以：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服務遵循相同模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

當你想要備援操作者通道時，請使用救援機器人快速入門。當你想要為不同頻道、租戶、工作區或營運角色使用多個長期執行的閘道時，請使用一般設定檔模式。

## 隔離檢查清單

每個閘道執行個體請保持這些項目唯一：

- `OPENCLAW_CONFIG_PATH` — 每個執行個體的設定檔
- `OPENCLAW_STATE_DIR` — 每個執行個體的工作階段、認證資料、快取
- `agents.defaults.workspace` — 每個執行個體的工作區根目錄
- `gateway.port`（或 `--port`）— 每個執行個體唯一
- 衍生的瀏覽器/canvas/CDP 連接埠

如果這些項目共用，你會遇到設定競爭與連接埠衝突。

## 連接埠對應（衍生）

基準連接埠 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 瀏覽器控制服務連接埠 = 基準 + 2（僅限本機迴環）
- canvas 主機由閘道 HTTP 伺服器提供服務（與 `gateway.port` 相同連接埠）
- 瀏覽器設定檔 CDP 連接埠會從 `browser.controlPort + 9 .. + 108` 自動配置

如果你在設定或環境變數中覆寫其中任何一項，必須確保每個執行個體都唯一。

## 瀏覽器/CDP 注意事項（常見陷阱）

- **不要**在多個執行個體上將 `browser.cdpUrl` 固定為相同值。
- 每個執行個體都需要自己的瀏覽器控制連接埠與 CDP 範圍（由其閘道連接埠衍生）。
- 如果你需要明確的 CDP 連接埠，請為每個執行個體設定 `browser.profiles.<name>.cdpPort`。
- 遠端 Chrome：使用 `browser.profiles.<name>.cdpUrl`（每個設定檔、每個執行個體）。

## 手動環境變數範例

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## 快速檢查

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

解讀：

- `gateway status --deep` 有助於找出舊安裝留下的過期 launchd/systemd/schtasks 服務。
- `gateway probe` 警告文字（例如 `multiple reachable gateway identities detected`）只有在你刻意執行多個隔離閘道，或 OpenClaw 無法證明可連線的探測目標是同一個閘道時才是預期情況。SSH 通道、代理 URL，或設定為指向同一閘道的遠端 URL，都是具有多個傳輸方式的一個閘道，即使傳輸連接埠不同也是如此。

## 相關

- [閘道執行手冊](/zh-TW/gateway)
- [閘道鎖定](/zh-TW/gateway/gateway-lock)
- [設定](/zh-TW/gateway/configuration)
