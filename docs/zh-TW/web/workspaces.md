---
read_when:
    - 建立或重新排列工作區分頁與小工具
    - 讓代理程式建立工作區
    - 檢視自訂小工具的核准與沙箱模型
summary: 控制介面中的代理程式可組合工作區
title: 工作區
x-i18n:
    generated_at: "2026-07-11T21:55:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

OpenClaw [控制介面](/zh-TW/web/control-ui)中的 **工作區** 分頁，是由你與代理共同安排的介面。分頁、小工具、它們在 12 欄網格上的位置，以及資料繫結，全都存放在同一份文件中。任何能編輯該文件的實體都能編排工作區：你、`openclaw workspaces` 命令列介面，或呼叫 `workspace_*` 工具的代理。

每次寫入都會經過相同的驗證流程，因此人員配置的版面與代理配置的版面不會產生分歧。每次接受寫入後都會遞增版本，並廣播 `plugin.workspaces.changed`，因此代理的編輯會直接顯示在已開啟的瀏覽器中，無須重新載入。

## 啟用工作區

隨附的工作區外掛預設為停用。在控制介面中開啟 **外掛**，找到 **工作區**，然後選取 **啟用**。你也可以透過命令列介面啟用：

```sh
openclaw plugins enable workspaces
```

啟用外掛會新增 **工作區** 分頁，並提供 `openclaw workspaces` 命令列介面與 `workspace_*` 代理工具。停用外掛會移除這些介面，但不會刪除工作區資料庫或小工具資產。

## 預設工作區

首次載入時，你會取得一個 **概覽** 工作區，其中包含成本與權杖卡片、執行個體健康狀態、工作階段、排程狀態及活動摘要。它只是一般的工作區內容，你可以拖曳、收合、隱藏或刪除它。

## 內建小工具

此外掛隨附九個受信任的小工具，並以第一方使用者介面的形式呈現：

`stat-card`、`markdown`、`table`、`iframe-embed`、`sessions`、`usage`、`cron`、
`instances`、`activity`。

小工具透過 **繫結** 宣告資料，絕不自行擷取：

| 繫結     | 解析結果                                                                                                  |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `static` | 儲存在文件中的常值（上限為 8 KB）。                                                                       |
| `file`   | `<stateDir>/workspaces/data/` 下的 JSON、Markdown 或 CSV 檔案，亦可選擇使用 JSON 指標縮小範圍。            |
| `rpc`    | 固定允許清單中的唯讀閘道方法之一，由受信任的控制介面解析。                                                |

`file` 繫結是將自己的數值放入工作區最簡單的方法：將 JSON 檔案寫入資料目錄，並讓 `stat-card` 指向該檔案。

## 來源資訊

分頁與小工具帶有 `createdBy` 標記，其值為 `user`、`system` 或 `agent:<id>`，會依實際執行寫入者設定。呼叫者無法自行提供此值，因此代理不能將自己的工作標示為你的工作，而代理建立的小工具上的「AI」標章也必然名實相符。

## 自訂小工具

代理可使用 `workspace_widget_scaffold` 建立真正的 HTML 小工具（你也可以使用 `openclaw workspaces widget-scaffold <name>` 建立）。代理撰寫的程式碼會被視為不受信任：

- 建立骨架的小工具會以 **待核准** 狀態進入登錄檔。在操作員核准之前，不會建立 iframe，且資產路由會針對其檔案傳回 404。
- 核准與編輯版面是兩項獨立的決策：`workspaces.widget.approve` 需要 `operator.approvals` 範圍，與保護執行核准所使用的範圍相同。
- 已核准的小工具會在 `<iframe sandbox="allow-scripts">` 中呈現，絕不使用 `allow-same-origin`，因此其來源不透明，且無法存取父頁面的 DOM、儲存空間或 Cookie。
- 其資產會使用 `connect-src 'none'` 提供，藉此封鎖 `fetch`、XHR 和 WebSocket 等指令碼網路連線。它不持有任何憑證，也絕不與閘道通訊。
- 資料只能透過具版本控制的 `postMessage` 橋接傳入。自訂程式碼可接收已宣告的 `static` 繫結，而這些值本來就是由代理或操作員撰寫的工作區值。RPC 與檔案繫結會保留在受信任的內建小工具中：瀏覽器允許沙箱子框架導覽自身框架，因此絕不會將具特殊權限的資料傳送至代理撰寫的 HTML。

若要從小工具將提示傳送至聊天，還需要資訊清單能力、每次叫用時引用確切文字的確認，並受到速率限制。

## 命令列介面

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` 需要與具備 `operator.approvals` 範圍的裝置配對；從控制介面核准則不需要，因為瀏覽器已持有該範圍。

## 儲存空間

工作區文件、自訂小工具登錄檔及包含 20 筆項目的復原環狀緩衝區，均位於 `<stateDir>/workspaces/workspaces.sqlite`。代理撰寫的小工具資產會保留在磁碟上的 `<stateDir>/workspaces/widgets/<name>/` 下，而檔案繫結資料則位於 `<stateDir>/workspaces/data/` 下，因為代理會使用一般檔案工具建立這些內容，且小工具路由會提供其位元組資料。
