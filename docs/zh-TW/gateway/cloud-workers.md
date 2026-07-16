---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 將工作階段分派至拋棄式雲端機器：佈建、工作程序執行環境、代理推論與串流結果
title: 雲端工作節點
x-i18n:
    generated_at: "2026-07-16T11:33:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

雲端工作器可讓工作階段在可拋棄的雲端機器上執行其代理程式迴圈，同時工作階段的一切仍維持原狀：顯示於側邊欄、即時串流，且逐字稿由閘道擁有。閘道會租用一台機器、在其上安裝固定版本的 OpenClaw、同步工作階段的工作區，並將回合迴圈交給受限的 `openclaw worker` 處理程序。模型呼叫會透過閘道代理傳回，因此供應商認證資訊絕不會離開你的機器；由於供應商看到的是單一連續串流，提示快取也能持續運作。

工作完成後（或機器故障時），該機器會被丟棄。持久狀態（逐字稿、工作區提交、配置記錄）則由閘道保存。

<Note>
雲端工作器採選用方式，且在你設定設定檔之前不會顯示。未設定的安裝不會看到任何新的 RPC、設定或 UI。
</Note>

## 各項作業的執行位置

| 關注項目                                                 | 位置                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 代理程式迴圈 + 工具（`exec`、`read`、`write`、`edit`、…） | 雲端工作器機器                                                                 |
| 模型推論與供應商認證資訊                | 閘道（透過 `{provider, model}` 參照代理）                               |
| 逐字稿（持久、工作階段儲存區）                     | 閘道                                                                          |
| 即時串流至側邊欄                         | 閘道扇出，由工作器的可重播事件串流提供                      |
| 工作區 Git 歷史                                   | 在機器上不使用認證資訊撰寫；閘道接管提交並負責推送／PR |

除了 `sshd` 之外，機器不需要任何輸入連接埠：閘道會透過固定的 SSH 向外連線，並由反向通道將工作器的 WebSocket 傳回。內附的 Crabbox 供應商會強制使用公用 SSH 路由，並停用受管理的 Tailscale 註冊。輸出網際網路存取由供應商政策決定；除非你限制其網路或安全性群組，否則預設 AWS 設定檔可存取網際網路。

## 需求

- 工作器供應商外掛。內附的 `crabbox` 外掛會驅動 [Crabbox](https://github.com/openclaw/crabbox) 命令列介面，由其代理跨雲端後端（AWS、Hetzner 等）租用機器。`crabbox` 二進位檔必須位於 `PATH`（或設定 `settings.binary`），且供應商認證資訊須已設定完成。AWS 准入需要 Crabbox 0.38.1 或更新版本。
- 對於 Crabbox AWS 工作器，有效的 `aws.instanceProfile` 必須為空。供應商會在配置前檢查 `crabbox config show --json`，然後要求 `crabbox inspect --json` 回報 EC2 `DescribeInstances` 中的 `providerMetadata.instanceProfileAttached: false`。具有執行個體角色或缺少權威中繼資料的租用項目會遭停止並拒絕。
- 租用機器上的 Node.js。裸雲端映像通常未安裝它——請在設定檔的 `setup` 命令中安裝。
- 具有工作階段所擁有之受管理工作樹的工作階段（可使用 `worktree: true` 建立）。分派會移動該工作樹的內容；一般目錄則會以資訊清單鏡像方式同步。

## 設定

在 `openclaw.json` 的 `cloudWorkers.profiles` 下新增設定檔：

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

設定檔欄位：

| 鍵        | 含義                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | 由外掛註冊的工作器供應商 ID（內附外掛為 `crabbox`）。                                                                                                                                                                  |
| `install`  | `bundle`（預設）會傳送執行中閘道的組建；`npm` 會使用固定的完整性值，安裝與閘道完全相同的發行版本。`npm` 要求閘道從封裝的發行版本執行。                                                      |
| `settings` | 供應商擁有的 JSON。對 crabbox 而言：`provider`（後端）、`class`（機器類別）、`ttl`、`idleTimeout`（Go 持續時間），以及選用的 `setup` 和絕對 `binary` 路徑。OpenClaw 會對這些租用項目強制使用公用 SSH，並停用受管理的 Tailscale。 |
| `lifetime` | 選用的已儲存政策（`idleTimeoutMinutes`、`maxLifetimeMinutes`）。                                                                                                                                                                           |

### 設定命令

`settings.setup` 會在租用機器已可透過 SSH 連線後、安裝 OpenClaw 前執行。它會在**每次**配置嘗試時執行（包括分派中斷後的重播），因此必須具備冪等性——請如範例所示，以 `command -v`/`test -x` 檢查來防護安裝。若設定失敗，供應商會停止租用項目，且分派會以關閉方式失敗；不會留下設定到一半且仍在執行的機器。

### 安裝管道

- **`bundle`** 會封裝執行中閘道的 `dist`、經過裁剪的 `package.json`，以及該組建參照的所有工作區套件，並以內容雜湊涵蓋全部內容。機器會依該雜湊驗證未修改的套件組合，然後安裝正式環境 npm 相依套件（停用指令碼）。這可讓你在工作器上執行開發組建。
- **`npm`** 會證明該發行版本存在於公用登錄檔、固定其 SHA-512 完整性，並安裝與閘道完全相符的 `openclaw@<version>`。

## 分派工作階段

在 Control UI 中開啟 **New Session**，選擇已設定執行階段為 OpenClaw 的代理程式，從 **Where** 選單選取已設定的 **Cloud · profile** 目標，然後啟動工作。選取雲端會自動啟用必要的受管理工作樹；閘道會建立工作階段、完成分派，之後才傳送第一個回合。工作階段側邊欄中的伺服器徽章會顯示持久配置狀態。外部命令列介面工作階段目錄不會提供雲端目標。

對應的 RPC 流程如下：

建立具有受管理工作樹的工作階段，然後分派它（RPC 需要 `operator.admin`，且僅在已設定設定檔時存在）：

雲端工作器會執行 OpenClaw 代理程式執行階段。請選擇會解析至該執行階段的 `openai/*` 或其他模型；針對 `claude-cli` 等外部命令列介面執行階段設定的工作階段無法分派。

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` 會關閉本機回合准入、排空進行中的工作、配置租用項目、執行設定、啟動 OpenClaw、同步工作區，並在配置達到 `active` 工作器擁有權時傳回。首次分派請預留數分鐘；供應商支援時會快取租用項目與安裝。之後照常與工作階段互動即可——回合會自動路由至工作器。

完成的工作器回合會在釋放回合宣告之前，將符合資格且大小受限的工作區檔案協調回工作階段的受管理工作樹。終端工作器事件會先建立持久的待處理結果柵欄，之後才予以確認，因此閘道重新啟動後的復原會先拉回遠端工作區，再由過期回合清理摧毀其擁有者。協調會驗證工作器資訊清單，並在本機發生分歧時停止，而不覆寫任一方。在變更檔案之前，閘道會將大小受限的回復日誌儲存至其 SQLite 狀態資料庫；若閘道處理程序中斷，重試會復原該日誌。工作區結果採用 Git 檔案語意：一般檔案、可執行位元、符號連結、新增、變更及刪除都會保留，而空目錄與其他目錄模式則不會。遠端提交物件不會保留；產生的檔案變更會留在受管理工作樹中，供一般檢閱與提交。

工作完成且沒有回合正在執行時，開啟工作階段選單並選擇 **Stop cloud worker…**。閘道會在摧毀環境之前執行最後一次工作區協調。若配置已處於 `draining` 或 `reconciling`，表示正在完成拆除；請等到其徽章變為 `reclaimed` 後，再刪除工作階段。

對於故障或失控的已連接工作器，操作人員可在不得已時使用 `{ "force": true }` 呼叫 `environments.destroy`。強制拆除會以持久方式將配置標記為失敗，並在摧毀環境之前放棄所有尚未協調的遠端結果。

對應的管理 RPC 如下：

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

配置會經過持久狀態機（`local → requested → provisioning → syncing → starting → active`），因此閘道在分派期間重新啟動時會執行協調，而不會洩漏機器。模型回合失敗後，使用中的配置會維持可用，以供重試。若輸入工作區協調失敗，工作器也會保持使用中，讓操作人員解決本機衝突並重試，而不遺失遠端結果；生命週期失敗則會將配置移至錯誤或已回收狀態，並保留其診斷尾端。

## 安全性模型

- **封閉的工作器輸入。** 工作器會透過通道化通訊端上的專用通訊協定通訊，並使用封閉的方法允許清單——工作器無法呼叫操作人員 RPC。
- **鑄發的認證資訊，以雜湊形式靜態儲存。** 每次分派都會鑄發一份工作器認證資訊；閘道只儲存其雜湊。認證資訊輪替與擁有者世代柵欄可確保每個工作階段最多只有一個有效擁有者——過期工作器重新連線時會遭隔離，絕不合併。
- **主機金鑰固定。** 供應商必須在配置時提供機器的 SSH 主機金鑰；啟動程序會使用嚴格固定機制連線，缺少金鑰時會以關閉方式失敗。
- **機器上不存放常駐的模型、程式碼代管服務或雲端認證資訊。** 模型驗證會留在閘道上（推論透過 `{provider, model}` 參照傳輸），工作區 Git 提交不使用程式碼代管服務認證資訊撰寫，且在執行設定前，會以權威方式檢查 Crabbox AWS 租用中繼資料是否具有執行個體角色。設定命令也應避免使用認證資訊。
- **供應商擁有的輸出流量。** 反向通道可讓 OpenClaw 無須直接存取模型，但 OpenClaw 不會改寫供應商防火牆。當工作需要時，請在工作器供應商中限制輸出流量。
- **持久、恰好一次的逐字稿。** 工作器會依據工作階段的葉節點，透過比較並交換通訊協定提交逐字稿批次；若基底已過期，執行會立即停止，而不會複製或重定基底已付費的輸出。

## 疑難排解

- **`sessions.dispatch` 是未知的方法** — 未設定任何 `cloudWorkers.profiles`，或呼叫端缺少 `operator.admin`。
- **“雲端工作節點回合需要 OpenClaw 執行環境”** — 請選擇所設定執行環境為 OpenClaw 的模型。`claude-cli` 等外部命令列介面執行環境不支援工作節點推論。
- **“工作節點啟動程序需要租用主機具備 Node.js”** — 將 Node 安裝步驟加入 `settings.setup`（請參閱上文）。
- **AWS 執行個體角色證明失敗** — 清除 `aws.instanceProfile`（若已設定，也請清除 `CRABBOX_AWS_INSTANCE_PROFILE`）。安裝 Crabbox 0.38.1 或更新版本；較舊的二進位檔不會公開 AWS 准入所需的權威 `providerMetadata.instanceProfileAttached` 合約。
- **分派因提供者錯誤而失敗** — 放置記錄和 `environments.list` 會保留最後一次錯誤，包括設定／啟動程序的 stderr 尾端內容。Box 會在失敗時銷毀，因此該尾端內容是主要的鑑識依據。
- **分派時用戶端逾時** — `openclaw gateway call` 預設逾時時間為 10 秒；請為 `--timeout` 提供充裕的值（無論如何，分派都會繼續在伺服器端執行，而在佈建期間重試會遭到拒絕並回傳 `session cannot dispatch from placement provisioning`）。
- **租約維護** — `crabbox list --provider <backend>` 會顯示有效租約；`crabbox stop --provider <backend> --id <lease>` 可手動釋放一筆租約。閒置租約會依設定檔的 `idleTimeout` 到期。

## 相關內容

- [沙箱化](/zh-TW/gateway/sandboxing) — 降低本機工具執行的影響範圍
- [工作階段命令列介面](/zh-TW/cli/sessions) — 檢查已儲存的工作階段
- [設定參考](/zh-TW/gateway/configuration-reference)
