---
read_when:
    - 建立或重新排列工作區分頁與小工具
    - 讓代理程式建立工作區
    - 檢視自訂小工具的核准與沙箱模型
summary: 控制介面中的代理可組合工作區
title: 工作區
x-i18n:
    generated_at: "2026-07-12T14:56:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

[Control UI](/zh-TW/web/control-ui) 中的 **工作區** 分頁，是由你和你的代理共同安排的介面。分頁、小工具、它們在 12 欄網格上的位置，以及它們的資料繫結，全都存放在同一份文件中。任何能編輯該文件的對象都可以編排工作區：你、`openclaw workspaces` 命令列介面，或呼叫 `workspace_*` 工具的代理。

每次寫入都會經過同一條經驗證的路徑，因此人員配置的版面與代理配置的版面不會產生分歧。每次接受寫入時都會遞增版本，並廣播 `plugin.workspaces.changed`，因此代理所做的編輯會直接顯示在已開啟的瀏覽器中，無須重新載入。

## 啟用工作區

內建的工作區外掛預設為停用。在 Control UI 中開啟 **Plugins**，找到 **Workspaces**，然後選取 **Enable**。你也可以透過命令列介面啟用：

```sh
openclaw plugins enable workspaces
```

啟用此外掛會新增 **工作區** 分頁，並提供 `openclaw workspaces` 命令列介面與 `workspace_*` 代理工具。停用此外掛會移除這些介面，但不會刪除工作區資料庫或小工具資產。

## 預設工作區

首次載入時，你會看到一個 **概覽** 工作區：費用與權杖卡片、執行個體健康狀態、工作階段、排程狀態，以及活動摘要。這些都是一般的工作區內容，你可以拖曳、收合、隱藏或刪除。

## 內建小工具

此外掛隨附九個受信任的小工具，並以第一方 UI 呈現：

`stat-card`、`markdown`、`table`、`iframe-embed`、`sessions`、`usage`、`cron`、
`instances`、`activity`。

小工具透過 **繫結** 宣告資料，絕不會自行擷取：

| 繫結     | 解析為                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `static` | 儲存在文件中的常值（上限 8 KB）。                                                                           |
| `file`   | `<stateDir>/workspaces/data/` 下的 JSON、Markdown 或 CSV 檔案，可選擇透過 JSON 指標縮小範圍。                |
| `rpc`    | 固定唯讀閘道方法允許清單中的其中一個方法，由受信任的 Control UI 解析。                                       |

`file` 繫結是將你自己的數值放入工作區最簡單的方式：將 JSON 檔案寫入資料目錄，並讓 `stat-card` 指向該檔案。

## 來源標記

分頁和小工具都帶有 `createdBy` 標記，其值為 `user`、`system` 或 `agent:<id>`，並根據執行寫入的對象設定。呼叫端無法提供此值，因此代理無法將其工作標示為由你建立，而代理編寫的小工具上顯示的「AI」晶片也必定名副其實。

## 自訂小工具

代理可以使用 `workspace_widget_scaffold` 編寫真正的 HTML 小工具（你也可以使用 `openclaw workspaces widget-scaffold <name>`）。代理編寫的程式碼會被視為不受信任：

- 建立骨架的小工具會以 **待核准** 狀態進入登錄檔。在操作員核准前，不會建立 iframe，且其檔案的資產路由會傳回 404。
- 核准與編輯版面是分開的決定：`workspaces.widget.approve` 需要 `operator.approvals` 範圍，這與保護執行核准的範圍相同。
- 已核准的小工具會在 `<iframe sandbox="allow-scripts">` 中呈現，絕不使用 `allow-same-origin`，因此其來源不透明，也無法存取父頁面的 DOM、儲存空間或 Cookie。
- 其資產使用 `connect-src 'none'` 提供，封鎖 `fetch`、XHR 和 WebSocket 等指令碼網路連線。它不持有任何認證資訊，也絕不與閘道通訊。
- 資料只能透過具版本控制的 `postMessage` 橋接傳入。自訂程式碼可以接收已宣告的 `static` 繫結，這些繫結本來就是由代理或操作員編寫的工作區值。RPC 與檔案繫結則保留在受信任的內建小工具中：瀏覽器允許沙箱化的子框架導覽自己的框架，因此具特殊權限的資料絕不會傳送至代理編寫的 HTML。

從小工具將提示傳送至聊天，還需要資訊清單功能、每次叫用時引述確切文字的確認，並會受到速率限制。

## 命令列介面

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve` 需要與具有 `operator.approvals` 範圍的裝置配對；從 Control UI 核准則不需要，因為瀏覽器已持有該範圍。

## 儲存空間

工作區文件、自訂小工具登錄檔，以及包含 20 個項目的復原環，皆位於 `<stateDir>/workspaces/workspaces.sqlite`。代理編寫的小工具資產會保留在磁碟上的 `<stateDir>/workspaces/widgets/<name>/` 下，而檔案繫結資料則位於 `<stateDir>/workspaces/data/` 下，因為代理會使用一般檔案工具編寫這些內容，而小工具路由會提供其位元組。
