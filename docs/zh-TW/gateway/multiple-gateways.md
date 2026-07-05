---
read_when:
    - 在同一台機器上執行多個閘道
    - 每個閘道都需要隔離的設定、狀態與連接埠
summary: 在單一主機上執行多個 OpenClaw 閘道（隔離、連接埠與設定檔）
title: 多個閘道
x-i18n:
    generated_at: "2026-07-05T11:19:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

大多數設定只需要一個閘道 - 單一閘道可處理多個訊息連線與代理程式。只有在需要更強隔離或備援時，才使用隔離的設定檔/連接埠執行個別閘道（例如救援機器人）。

## 救援機器人快速開始

最簡單的救援機器人設定：

- 將主要機器人保留在預設設定檔。
- 使用 `--profile rescue` 執行救援機器人，並搭配自己的 Telegram 機器人權杖。
- 將救援機器人放在不同的基底連接埠，例如 `19789`。

這可讓主要機器人停機時，救援機器人仍能偵錯或套用設定變更。基底連接埠之間至少保留 20 個連接埠，讓衍生的瀏覽器/CDP 連接埠永遠不會衝突。

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果你的主要機器人已經在執行，通常這樣就足夠了。如果入門設定已經安裝救援服務，請略過最後的 `gateway install`。

在 `openclaw --profile rescue onboard` 期間：

- 使用獨立的 Telegram 機器人權杖，專供救援帳號使用（容易維持僅限操作員使用、獨立於主要機器人的頻道/應用程式安裝，並提供簡單的私訊式復原路徑）。
- 保留 `rescue` 設定檔名稱。
- 使用至少比主要機器人高 20 的基底連接埠。
- 接受預設救援工作區，除非你已經自行管理一個工作區。

### `--profile rescue onboard` 會變更什麼

`--profile rescue onboard` 會執行一般入門設定流程，但將所有內容寫入個別設定檔，因此救援機器人會取得自己的：

- 設定檔/設定檔案
- 狀態目錄
- 工作區（預設：`~/.openclaw/workspace-rescue`）
- 受管理的服務名稱
- 基底連接埠（加上衍生連接埠）
- Telegram 機器人權杖

提示除此之外都與一般入門設定相同。

## 一般多閘道設定

相同的隔離模式適用於同一台主機上的任何一組或多組閘道 - 為每個額外閘道指定自己的具名設定檔和基底連接埠：

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

兩邊都使用具名設定檔也可行：

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

針對備援操作員通道使用救援機器人快速開始；針對跨不同頻道、租戶、工作區或營運角色的多個長期執行閘道，使用一般設定檔模式。

## 隔離檢查清單

每個閘道執行個體都要保持以下項目唯一：

| 設定                         | 用途                                 |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | 每個執行個體的設定檔案              |
| `OPENCLAW_STATE_DIR`         | 每個執行個體的工作階段、認證、快取  |
| `agents.defaults.workspace`  | 每個執行個體的工作區根目錄          |
| `gateway.port`（或 `--port`） | 每個執行個體唯一                    |
| 衍生的瀏覽器/CDP 連接埠     | 見下方                               |

共用其中任何項目都會造成設定競爭與連接埠衝突。

## 連接埠對應（衍生）

基底連接埠 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）。

- 瀏覽器控制服務連接埠 = 基底 + 2（僅限 loopback）。
- Canvas 主機由閘道 HTTP 伺服器本身提供（與 `gateway.port` 相同連接埠）。
- 瀏覽器設定檔 CDP 連接埠會從 `browser control port + 9` 到 `+ 108` 自動配置。

如果在設定或環境變數中覆寫其中任何項目，必須確保每個執行個體都唯一。

## 瀏覽器/CDP 注意事項（常見踩坑）

- **不要**在多個執行個體上將 `browser.cdpUrl` 固定為相同值。
- 每個執行個體都需要自己的瀏覽器控制連接埠與 CDP 範圍（由其閘道連接埠衍生）。
- 若使用明確的 CDP 連接埠，請為每個執行個體設定 `browser.profiles.<name>.cdpPort`。
- 若使用遠端 Chrome，請使用 `browser.profiles.<name>.cdpUrl`（每個設定檔、每個執行個體）。

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

- `gateway status --deep` 會偵測舊版安裝留下的過時 launchd/systemd/schtasks 服務。
- `gateway probe` 警告文字（例如 `multiple reachable gateway identities detected`）只應在你刻意執行多個隔離閘道，或 OpenClaw 無法證明可到達的探測目標是同一個閘道時出現。指向同一閘道的 SSH 通道、代理 URL 或已設定的遠端 URL，即使傳輸連接埠不同，也都算是一個具有多個傳輸方式的閘道。

## 相關

- [閘道操作手冊](/zh-TW/gateway)
- [閘道鎖定](/zh-TW/gateway/gateway-lock)
- [設定](/zh-TW/gateway/configuration)
