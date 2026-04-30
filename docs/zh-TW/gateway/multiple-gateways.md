---
read_when:
    - 在同一台機器上執行多個 Gateway
    - 每個 Gateway 都需要隔離的設定/狀態/連接埠
summary: 在一台主機上執行多個 OpenClaw Gateway（隔離、連接埠與設定檔）
title: 多個 Gateway
x-i18n:
    generated_at: "2026-04-30T03:07:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

多數設定應使用一個 Gateway，因為單一 Gateway 可以處理多個訊息連線和代理程式。如果你需要更強的隔離或備援能力（例如救援機器人），請使用隔離的設定檔/連接埠執行個別的 Gateway。

## 最佳建議設定

對多數使用者而言，最簡單的救援機器人設定是：

- 將主要機器人保留在預設設定檔
- 使用 `--profile rescue` 執行救援機器人
- 為救援帳號使用完全獨立的 Telegram 機器人
- 將救援機器人放在不同的基礎連接埠，例如 `19789`

這會讓救援機器人與主要機器人隔離，因此當主要機器人停擺時，它可以除錯或套用
設定變更。基礎連接埠之間至少保留 20 個連接埠，
讓衍生的瀏覽器/canvas/CDP 連接埠永遠不會衝突。

## 救援機器人快速入門

除非你有充分理由採用其他做法，否則請將此作為預設路徑：

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主要機器人已在執行，通常這就是你需要做的全部。

在 `openclaw --profile rescue onboard` 期間：

- 使用獨立的 Telegram 機器人權杖
- 保留 `rescue` 設定檔
- 使用比主要機器人至少高 20 的基礎連接埠
- 除非你已自行管理工作區，否則接受預設的救援工作區

如果入門流程已為你安裝救援服務，就不需要最後的
`gateway install`。

## 為什麼這樣可行

救援機器人會保持獨立，因為它有自己的：

- 設定檔/設定
- 狀態目錄
- 工作區
- 基礎連接埠（加上衍生連接埠）
- Telegram 機器人權杖

對多數設定而言，請為救援設定檔使用完全獨立的 Telegram 機器人：

- 容易維持為僅供操作員使用
- 獨立的機器人權杖和身分
- 獨立於主要機器人的通道/應用程式安裝
- 當主要機器人故障時，提供簡單的私訊式復原路徑

## `--profile rescue onboard` 會變更什麼

`openclaw --profile rescue onboard` 會使用一般入門流程，但會將所有內容
寫入個別的設定檔。

實際上，這表示救援機器人會取得自己的：

- 設定檔案
- 狀態目錄
- 工作區（預設為 `~/.openclaw/workspace-rescue`）
- 受管理的服務名稱

除此之外，提示與一般入門流程相同。

## 一般多 Gateway 設定

上述救援機器人配置是最簡單的預設方式，但同樣的隔離
模式也適用於單一主機上的任兩個或多個 Gateway。

若要使用更一般的設定，請為每個額外的 Gateway 指定自己的命名設定檔和
自己的基礎連接埠：

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

如果你希望兩個 Gateway 都使用命名設定檔，也可以這樣做：

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

服務也遵循相同模式：

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

當你想要一條備用操作員通道時，請使用救援機器人快速入門。當你想要多個長期執行的 Gateway，
分別用於不同通道、租戶、工作區或操作角色時，請使用
一般設定檔模式。

## 隔離檢查清單

讓每個 Gateway 執行個體都擁有唯一的這些項目：

- `OPENCLAW_CONFIG_PATH` — 每個執行個體的設定檔案
- `OPENCLAW_STATE_DIR` — 每個執行個體的工作階段、憑證、快取
- `agents.defaults.workspace` — 每個執行個體的工作區根目錄
- `gateway.port`（或 `--port`）— 每個執行個體唯一
- 衍生的瀏覽器/canvas/CDP 連接埠

如果共用這些項目，你會遇到設定競態和連接埠衝突。

## 連接埠對應（衍生）

基礎連接埠 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 瀏覽器控制服務連接埠 = 基礎 + 2（僅限 local loopback）
- canvas 主機由 Gateway HTTP 伺服器提供服務（與 `gateway.port` 相同連接埠）
- 瀏覽器設定檔 CDP 連接埠會從 `browser.controlPort + 9 .. + 108` 自動配置

如果你在設定或環境變數中覆寫其中任何項目，必須讓它們在每個執行個體中保持唯一。

## 瀏覽器/CDP 注意事項（常見陷阱）

- **不要**在多個執行個體上將 `browser.cdpUrl` 固定為相同值。
- 每個執行個體都需要自己的瀏覽器控制連接埠和 CDP 範圍（由其 Gateway 連接埠衍生）。
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

- `gateway status --deep` 有助於偵測舊版安裝留下的過期 launchd/systemd/schtasks 服務。
- `gateway probe` 警告文字（例如 `multiple reachable gateways detected`）只有在你刻意執行多個隔離 Gateway 時才是預期行為。

## 相關

- [Gateway 操作手冊](/zh-TW/gateway)
- [Gateway 鎖定](/zh-TW/gateway/gateway-lock)
- [設定](/zh-TW/gateway/configuration)
