---
read_when:
    - 在同一台機器上執行多個閘道
    - 每個閘道都需要獨立的設定、狀態與連接埠
summary: 在單一主機上執行多個 OpenClaw 閘道（隔離、連接埠與設定檔）
title: 多個閘道
x-i18n:
    generated_at: "2026-07-11T21:21:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

大多數設定只需要一個閘道——單一閘道即可處理多個訊息連線與代理程式。只有在需要更強的隔離或備援時（例如救援機器人），才應使用彼此隔離的設定檔／連接埠來執行獨立閘道。

## 救援機器人快速入門

最簡單的救援機器人設定：

- 讓主要機器人使用預設設定檔。
- 使用 `--profile rescue` 執行救援機器人，並為其配置專屬的 Telegram 機器人權杖。
- 為救援機器人使用不同的基礎連接埠，例如 `19789`。

如此一來，即使主要機器人停止運作，救援機器人仍可進行偵錯或套用設定變更。基礎連接埠之間至少保留 20 個連接埠的間距，以確保衍生的瀏覽器／CDP 連接埠不會發生衝突。

```bash
# 救援機器人（獨立的 Telegram 機器人、獨立設定檔、連接埠 19789）
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

如果主要機器人已經在執行，通常只需完成上述步驟。如果初始設定已經安裝救援服務，請略過最後的 `gateway install`。

執行 `openclaw --profile rescue onboard` 期間：

- 使用獨立的 Telegram 機器人權杖，並將其專門用於救援帳號（可輕鬆限制為僅供操作員使用、不受主要機器人的頻道／應用程式安裝影響，並提供簡單的私訊式復原途徑）。
- 保留 `rescue` 設定檔名稱。
- 使用至少比主要機器人高 20 的基礎連接埠。
- 除非你已自行管理救援工作區，否則接受預設的救援工作區。

### `--profile rescue onboard` 會變更的內容

`--profile rescue onboard` 會執行一般的初始設定流程，但將所有內容寫入獨立的設定檔，因此救援機器人會擁有自己的：

- 設定檔／設定檔案
- 狀態目錄
- 工作區（預設：`~/.openclaw/workspace-rescue`）
- 受管理的服務名稱
- 基礎連接埠（以及衍生連接埠）
- Telegram 機器人權杖

除此之外，提示內容與一般初始設定完全相同。

## 一般多閘道設定

同一套隔離模式適用於單一主機上的任意一組閘道——為每個額外閘道指定各自的命名設定檔與基礎連接埠：

```bash
# 主要閘道（預設設定檔）
openclaw setup
openclaw gateway --port 18789

# 額外閘道
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

兩邊都使用命名設定檔也可行：

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

若需要備用操作員管道，請使用救援機器人快速入門；若要在不同頻道、租戶、工作區或操作角色之間執行多個長期運作的閘道，請使用一般設定檔模式。

## 隔離檢查清單

每個閘道執行個體都必須使用唯一的下列設定：

| 設定                         | 用途                                 |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | 每個執行個體專屬的設定檔案           |
| `OPENCLAW_STATE_DIR`         | 每個執行個體專屬的工作階段、憑證、快取 |
| `agents.defaults.workspace`  | 每個執行個體專屬的工作區根目錄       |
| `gateway.port`（或 `--port`） | 每個執行個體皆須唯一                 |
| 衍生的瀏覽器／CDP 連接埠    | 請參閱下文                           |

共用上述任何項目都會造成設定競爭與連接埠衝突。

## 連接埠對應（衍生）

基礎連接埠 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT`／`--port`）。

- 瀏覽器控制服務連接埠 = 基礎連接埠 + 2（僅限 local loopback）。
- Canvas 主機由閘道 HTTP 伺服器本身提供服務（與 `gateway.port` 使用相同連接埠）。
- 瀏覽器設定檔的 CDP 連接埠會從「瀏覽器控制連接埠 + 9」至「+ 108」的範圍內自動分配。

如果在設定或環境變數中覆寫其中任何項目，就必須確保每個執行個體使用的值皆不相同。

## 瀏覽器／CDP 注意事項（常見陷阱）

- **不要**在多個執行個體中將 `browser.cdpUrl` 固定為相同值。
- 每個執行個體都需要自己的瀏覽器控制連接埠與 CDP 範圍（由其閘道連接埠衍生）。
- 若要明確指定 CDP 連接埠，請為每個執行個體設定 `browser.profiles.<name>.cdpPort`。
- 若使用遠端 Chrome，請使用 `browser.profiles.<name>.cdpUrl`（每個設定檔、每個執行個體各自設定）。

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

- `gateway status --deep` 可偵測舊版安裝所遺留的 launchd／systemd／schtasks 服務。
- 只有在你刻意執行多個彼此隔離的閘道，或 OpenClaw 無法證明可連線的探測目標屬於同一個閘道時，才應預期看到 `gateway probe` 的 `multiple reachable gateway identities detected` 等警告文字。指向同一個閘道的 SSH 通道、代理 URL 或已設定的遠端 URL，仍是透過多種傳輸方式連線至單一閘道，即使各傳輸方式使用的連接埠不同亦然。

## 相關內容

- [閘道操作手冊](/zh-TW/gateway)
- [閘道鎖定](/zh-TW/gateway/gateway-lock)
- [設定](/zh-TW/gateway/configuration)
