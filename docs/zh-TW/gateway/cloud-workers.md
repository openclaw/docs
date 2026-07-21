---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 將工作階段派送至拋棄式雲端機器：佈建、工作執行環境、代理推論與串流結果
title: 雲端工作程序
x-i18n:
    generated_at: "2026-07-21T08:59:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4e81fb50512639b3b0e00522dea914533b596574f35baf304c932c2962ac103c
    source_path: gateway/cloud-workers.md
    workflow: 16
---

雲端工作器可讓工作階段在可拋棄的雲端機器上執行其代理程式迴圈，同時工作階段的所有資訊仍留在原本的位置：顯示於側邊欄、即時串流，且逐字稿由閘道擁有。閘道會租用一台機器、在其上安裝固定版本的 OpenClaw、同步工作階段的工作區，並將回合迴圈交給受限制的 `openclaw worker` 程序。模型呼叫會透過閘道代理回傳，因此供應商認證資訊絕不會離開你的機器；此外，由於供應商看到的是單一連續串流，提示快取也能繼續運作。

工作完成後（或機器故障時），該機器會被丟棄。持久狀態——逐字稿、工作區提交、配置記錄——會與閘道一起保存。

<Note>
雲端工作器採選用制，且在你設定設定檔之前不會顯示。未設定的安裝不會看到任何新的 RPC、設定或使用者介面。
</Note>

## 各項功能在哪裡執行

| 項目                                                    | 位置                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 代理程式迴圈 + 工具（`exec`、`read`、`write`、`edit`、…） | 雲端工作器機器                                                                   |
| 模型推論與供應商認證資訊                                | 閘道（由 `{provider, model}` 參照代理）                                          |
| 逐字稿（持久、工作階段儲存區）                          | 閘道                                                                             |
| 即時串流至側邊欄                                        | 閘道扇出，由工作器可重播的事件串流提供資料                                       |
| 工作區 Git 歷史                                         | 在機器上無認證資訊地建立；閘道接管提交並負責推送／PR                             |

除了 `sshd` 之外，機器不需要任何連入連接埠：閘道會透過固定的 SSH 主動連線，而反向通道會將工作器的 WebSocket 傳回。隨附的 Crabbox 供應商會強制使用公用 SSH 路由，並停用受管理的 Tailscale 註冊。連出網際網路存取權由供應商政策決定；除非你限制其網路或安全群組，否則預設 AWS 設定檔可以存取網際網路。

## 需求

- 工作器供應商外掛。隨附的 `crabbox` 外掛會驅動 [Crabbox](https://github.com/openclaw/crabbox) 命令列介面，由其代理跨雲端後端（AWS、Hetzner 等）的租用作業。`crabbox` 二進位檔必須位於 `PATH`（或設定 `settings.binary`），且供應商認證資訊必須已設定。AWS 准入需要 Crabbox 0.38.1 或更新版本。
- 對於 Crabbox AWS 工作器，有效的 `aws.instanceProfile` 必須為空。供應商會在配置前檢查 `crabbox config show --json`，接著要求 `crabbox inspect --json` 回報 EC2 `DescribeInstances` 中的 `providerMetadata.instanceProfileAttached: false`。具有執行個體角色或缺少權威中繼資料的租用會遭停止並拒絕。
- 租用機器上的 Node.js。基本雲端映像通常不包含它——請在設定檔的 `setup` 命令中安裝。
- 具有工作階段專屬受管理工作樹的工作階段（使用 `worktree: true` 建立）。派送會移動該工作樹的內容；一般目錄則會以資訊清單鏡像方式同步。

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

| 鍵         | 含義                                                                                                                                                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | 由外掛註冊的工作器供應商 ID（隨附外掛使用 `crabbox`）。                                                                                                                                                                      |
| `install`  | `bundle`（預設值）會傳送執行中閘道的建置；`npm` 會以固定完整性安裝與閘道完全相同的發行版本。`npm` 要求閘道從封裝發行版本執行。                                                        |
| `settings` | 由供應商擁有的 JSON。對 crabbox 而言：`provider`（後端）、`class`（機器類別）、`ttl`、`idleTimeout`（Go 時間長度），以及選用的 `setup` 和絕對 `binary` 路徑。OpenClaw 會強制這些租用使用公用 SSH，並停用受管理的 Tailscale。 |
| `lifetime` | 選用的已儲存政策（`idleTimeoutMinutes`、`maxLifetimeMinutes`）。                                                                                                                                                                          |

### 設定命令

`settings.setup` 會在租用機器已可透過 SSH 連線之後、安裝 OpenClaw 之前執行。它會在**每次**配置嘗試時執行（包括派送中斷後的重播），因此必須具備冪等性——請如範例所示，使用 `command -v`/`test -x` 檢查來防護安裝。如果設定失敗，供應商會停止租用，且派送會以封閉方式失敗；不會留下任何僅完成部分設定且仍在執行的機器。

### 安裝管道

- **`bundle`** 會封裝執行中閘道的 `dist`、經裁剪的 `package.json`，以及建置所參照的任何工作區套件，且全部由內容雜湊涵蓋。機器會依據該雜湊驗證原始套件組合，然後安裝正式環境 npm 相依套件（停用指令碼）。這是你在工作器上執行開發建置的方式。
- **`npm`** 會確認公用登錄檔中存在該發行版本、固定其 SHA-512 完整性，並安裝與閘道完全相符的 `openclaw@<version>`。

## 派送工作階段

在控制介面中開啟 **New Session**，選擇已將執行階段設定為 OpenClaw 的代理程式，從 **Where** 選單選取已設定的 **Cloud · profile** 目標，然後開始工作。選擇雲端會自動啟用必要的受管理工作樹；閘道會建立工作階段、完成派送，之後才傳送第一個回合。工作階段側邊欄中的伺服器徽章會顯示持久配置狀態。外部命令列介面工作階段目錄不會提供雲端目標。

對應的 RPC 流程如下：

建立具有受管理工作樹的工作階段，然後派送該工作階段（RPC 需要 `operator.admin`，且只有在已設定設定檔時才會存在）：

雲端工作器會執行 OpenClaw 代理程式執行階段。請選擇可解析至該執行階段的 `openai/*` 或其他模型；設定為外部命令列介面執行階段（例如 `claude-cli`）的工作階段無法派送。

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` 會關閉本機回合准入、排空進行中的工作、配置租用、執行設定、啟動 OpenClaw、同步工作區，並在配置達到由 `active` 工作器擁有的狀態後返回。首次派送請預留數分鐘；供應商支援時會快取租用與安裝。之後，照常與工作階段互動即可——回合會自動路由至工作器。

已完成的工作器回合會在釋放回合宣告之前，將符合資格且大小受限的工作區檔案協調回工作階段的受管理工作樹。終止工作器事件會先建立持久的待處理結果屏障，之後才確認該事件。接著，閘道會先將完整的雲端結果暫存為 `refs/openclaw/worker-results/` 下的 Git 參照，再套用該結果，因此即使閘道在套用期間停止，仍可復原雲端版本。工作區結果採用 Git 檔案語意：一般檔案、可執行位元、符號連結、新增、變更及刪除都會保留，但空目錄和其他目錄模式不會保留。產生的檔案變更會留在受管理工作樹中，以供正常審查與提交。

套用作業會使用派送時的資訊清單作為合併基底。只存在於雲端的變更會套用，只存在於本機的變更會保留，而雙方皆有變更的路徑則採用三方保留本機政策。即使發生衝突，回合仍會完成：逐字稿會回報範圍受限的路徑摘要與暫存結果參照，配置會向控制介面揭露相同的衝突，且沒有衝突的雲端變更仍會套用。通知包含 `git show <ref>:<path>`，可用來檢查目前存在的雲端檔案，並包含頂層常值路徑規格 `git checkout <ref> -- <path>` 命令，可從任何工作區目錄取得該檔案。請在 Bash 或 zsh（Windows 上使用 Git Bash）中執行這些命令。如果檢查結果指出路徑不存在，表示雲端結果已將其刪除；請確認後手動移除保留的本機路徑。如果簽出回報檔案／目錄阻礙，請移動或移除造成阻礙的本機路徑，然後重試。如果暫存參照本身已不存在，請將通知視為過期，且不要變更本機路徑。發生衝突的暫存參照在正常回合屏障釋放後仍可使用；後續的無衝突結果會清除通知並淘汰舊參照，而明確移除屏障則是最終清理邊界。

當受屏障保護的結果仍在協調時，新回合會等待最多 15 秒，讓先前的宣告釋放。如果仍處於忙碌狀態，該回合會失敗並顯示可採取行動的「前一個雲端回合的工作區結果仍在協調」訊息，稍後即可重試。重新啟動時，復原程序會在清理過期宣告之前找出待處理和暫存的結果、完成或重試其本機套用，並且僅在保留結果後才回收已失效的環境。範圍受限的 SQLite 復原日誌可讓中斷的檔案系統套用作業復原，而不必重播已接受的異動。

工作完成且沒有回合正在執行時，請開啟工作階段選單並選擇 **Stop cloud worker…**。閘道會在銷毀環境前執行最後一次工作區協調。已處於 `draining` 或 `reconciling` 的配置正在完成拆除；請等到其徽章變為 `reclaimed` 後，再刪除工作階段。

對於故障或失控且仍附加的工作器，操作員可呼叫 `environments.destroy` 並搭配 `{ "force": true }`，作為最後手段。強制拆除會以持久方式將配置標示為失敗，並在銷毀環境前放棄任何尚未協調的遠端結果。

對應的管理 RPC 如下：

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

放置流程會透過持久化狀態機（`local → requested → provisioning → syncing → starting → active`）推進，因此若閘道在分派途中重新啟動，系統會進行協調，而不會造成機器洩漏。模型回合失敗時，會保留作用中的放置配置以供重試。工作區路徑衝突會保留本機版本、套用雲端結果的其餘部分，並保留已暫存的雲端 ref 以供檢查；其他協調或生命週期失敗則會保留其持久化復原柵欄與診斷尾端，直到復原程序能安全地重試或回收環境。

## 安全性模型

- **封閉的工作節點輸入通道。** 工作節點透過隧道通訊端上的專用通訊協定通訊，且方法允許清單採封閉式設計——工作節點無法呼叫操作員 RPC。
- **即時產生的認證資訊，以雜湊形式靜態儲存。** 每次分派都會產生一組工作節點認證資訊；閘道僅儲存其雜湊。認證資訊輪替與擁有者 epoch 柵欄可確保每個工作階段最多只有一個有效擁有者——過時的工作節點重新連線時會被隔離，絕不合併。
- **主機金鑰釘選。** 供應商必須在佈建時提供機器的 SSH 主機金鑰；啟動程序會使用嚴格釘選進行連線，若無此金鑰則採失敗即關閉。
- **機器上不留存模型、程式碼代管平台或雲端認證資訊。** 模型驗證會保留在閘道上（推論透過 `{provider, model}` 參照傳輸），工作區 git 提交的建立不使用程式碼代管平台認證資訊，而且在設定前，系統會以權威方式檢查 Crabbox AWS 租用中繼資料是否存在執行個體角色。設定命令也必須不含認證資訊。
- **由供應商控管的輸出流量。** 反向隧道讓 OpenClaw 不需要直接存取模型，但 OpenClaw 不會重寫供應商的防火牆。當任務需要時，請在工作節點供應商中限制輸出流量。
- **持久化且恰好一次的逐字稿。** 工作節點會針對工作階段的葉節點，透過比較並交換通訊協定提交逐字稿批次；若基準版本過時，執行會立即停止，而不會複製或重定基底已付費的輸出。

## 疑難排解

- **`sessions.dispatch` 是未知方法**——未設定任何 `cloudWorkers.profiles`，或呼叫端缺少 `operator.admin`。
- **“雲端工作節點回合需要 OpenClaw 執行階段”**——請選擇已設定使用 OpenClaw 執行階段的模型。`claude-cli` 等外部命令列介面執行階段不支援工作節點推論。
- **“工作節點啟動程序要求租用主機上安裝 Node.js”**——請在 `settings.setup` 中加入 Node 安裝步驟（請見上文）。
- **AWS 執行個體角色證明失敗**——清除 `aws.instanceProfile`（以及 `CRABBOX_AWS_INSTANCE_PROFILE`，若有設定）。請安裝 Crabbox 0.38.1 或更新版本；較舊的二進位檔不會公開 AWS 准入所需的權威 `providerMetadata.instanceProfileAttached` 合約。
- **分派因供應商錯誤而失敗**——放置記錄與 `environments.list` 會保留最後一項錯誤，包括設定／啟動程序的 stderr 尾端。發生失敗時機器會被銷毀，因此該尾端是主要的鑑識資訊。
- **分派時用戶端逾時**——`openclaw gateway call` 預設逾時為 10 秒；請為 `--timeout` 提供充裕的值（無論如何，分派都會繼續在伺服器端執行，而在佈建期間重試會遭到拒絕並回傳 `session cannot dispatch from placement provisioning`）。
- **雲端工作區衝突通知**——該回合已完成，並保留每個列出路徑的本機版本。使用通知中的暫存 ref 命令檢查或採用雲端版本；非衝突變更已經套用，無須重試。
- **“上一個雲端回合的工作區結果仍在協調中”**——閘道已短暫等待先前結果的持久化柵欄，但無法取得工作階段宣告。請等待協調完成後再重試該回合；重新啟動閘道是安全的，因為復原程序會先保留暫存結果，再回收已停止運作的工作節點。
- **租用環境維護**——`crabbox list --provider <backend>` 會顯示有效租用；`crabbox stop --provider <backend> --id <lease>` 可手動釋放一個租用。閒置租用會依設定檔的 `idleTimeout` 到期。

## 相關內容

- [沙箱化](/zh-TW/gateway/sandboxing)——縮小本機工具執行的影響範圍
- [工作階段命令列介面](/zh-TW/cli/sessions)——檢查已儲存的工作階段
- [設定參考](/zh-TW/gateway/configuration-reference)
