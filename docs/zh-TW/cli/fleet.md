---
read_when:
    - 你在一台機器上託管多個租用戶信任網域
    - 你需要建立、檢查、升級或移除機群單元
summary: 用於佈建及管理隔離式每租戶 OpenClaw 單元的命令列介面參考指南
title: 機群
x-i18n:
    generated_at: "2026-07-14T13:31:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: be589500e4715541f175caf0d5135a96baee4874e64c60c8b6f188ff1f70bc9f
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

`openclaw fleet` 管理稱為 **cells** 的完整 OpenClaw 執行個體。每個 cell 都有自己的閘道、狀態、認證資訊、頻道帳號、容器，以及僅限回送介面的主機連接埠。每個租用戶信任邊界應使用一個 cell；請勿將單一共用閘道用作惡意多租用戶邊界。

Fleet 是**實驗性**功能。命令名稱、旗標、輸出格式和容器設定檔可能在不同版本間變更，且不提供棄用期。

Fleet 支援 Docker 和 Podman。預設映像檔為 `ghcr.io/openclaw/openclaw:latest`。

Fleet 已在 Linux 和 macOS 主機上測試。Windows 主機目前尚未經過測試。

## 快速開始

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

`fleet create` 會將產生的閘道權杖與 cell URL 一併顯示一次。請立即儲存權杖，然後在各租用戶自己的 cell 中設定其頻道帳號。

## 租用戶 ID

租用戶 ID 必須符合：

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

允許使用 1 到 40 個小寫字母、數字和內部連字號。ID 的開頭和結尾必須是字母或數字。不接受大寫字母、底線、斜線、句點、空白字元，以及 `../acme` 之類的路徑遍歷字串。

此 ID 會成為容器名稱的一部分：`openclaw-cell-<tenant>`。

## `fleet create`

建立並啟動 cell：

```bash
openclaw fleet create acme
```

在固定連接埠建立 Podman cell，但不啟動：

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

重複使用 `--env` 來傳遞租用戶專屬的環境變數：

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

環境變數鍵可使用字母、數字和底線，且不能以數字開頭。值必須是單行，因為 Fleet 會透過受保護的執行階段環境檔案傳遞這些值。Fleet 會拒絕覆寫[儲存空間與容器配置](#storage-and-container-layout)中列出的受管理容器路徑和閘道權杖變數。

### 建立選項

| 選項                    | 預設值                               | 說明                                                                                    |
| ------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`    | cell 的容器映像檔。                                                                  |
| `--runtime <runtime>`     | `docker`                              | 容器命令列介面：`docker` 或 `podman`。                                                           |
| `--port <number>`         | 從 `19100` 自動配置  | 回送介面主機連接埠。明確選取的連接埠不得屬於另一個已註冊的 cell。    |
| `--memory <value>`        | `2g`                                  | 使用 Docker/Podman 語法指定的容器記憶體限制。                                                |
| `--cpus <value>`          | `2`                                   | 容器 CPU 限制。                                                                           |
| `--disk <size>`           | 無                                  | 當儲存後端支援配額時，限制容器的可寫層。                     |
| `--network <mode>`        | `bridge`                              | 輸出網路模式：`bridge` 或 `internal`。                                                 |
| `--pids-limit <number>`   | `512`                                 | 容器中的處理程序數量上限。                                                  |
| `--env <KEY=VALUE>`       | 無                                  | 將環境變數傳遞給 cell。可重複指定多個值。                          |
| `--gateway-token <value>` | 隨機 32 字元十六進位權杖 | 使用提供的閘道權杖，而不產生新權杖。請參閱[權杖處理](#token-handling)。 |
| `--no-start`              | 啟動 cell                           | 建立容器但不啟動。                                                      |
| `--json`                  | 人類可讀的輸出                 | 顯示機器可讀的輸出。                                                                 |

自動配置會選取第一個未使用且大於或等於 `19100` 的登錄連接埠。Fleet 會拒絕重複的租用戶 ID，以及已指派給其他 cell 的明確連接埠。

映像檔參照會作為單一容器執行階段引數傳遞。不接受空白參照和以 `-` 開頭的值，以免映像檔被解讀為 Docker 或 Podman 選項。

選取的 Docker 或 Podman 端點必須位於本機。Fleet 會在保留連接埠或建立本機狀態之前，拒絕遠端 Docker context、`DOCKER_HOST` 端點和遠端 Podman 服務。不支援遠端 cell 主機。

當 Fleet 啟動新的 cell 時，create 最多會等待約一分鐘，讓其閘道回應 `/healthz`。若 cell 未恢復正常運作，Fleet 會保留其容器和登錄資料列，以供 `fleet status`、`fleet logs` 或明確移除。`--no-start` 會略過此健康狀態閘門。健康狀態異常的新 cell 所產生的閘道權杖不會遺失，它仍保留在容器環境中（`docker|podman inspect`）；而且由於該 cell 尚未處理任何流量，因此先執行 `fleet rm --force`，再重新建立，始終是安全的替代方案。

### 依摘要固定

create 和 upgrade 接受摘要固定的映像檔參照，例如 `--image ghcr.io/openclaw/openclaw@sha256:<digest>`。Fleet 會將映像檔參照原封不動地傳遞給 Docker 或 Podman，讓操作者能將 cell 保持在不可變的映像檔位元組上，而非使用會變動的標籤。

建立結果包含租用戶 ID、容器名稱、主機連接埠、閘道權杖和本機 URL。即使使用 JSON 輸出，也應將結果視為包含機密，因為其中含有權杖。

### 磁碟限制

`--disk` 僅限制容器的可寫層。以繫結掛載方式掛載的各租用戶狀態和驗證目錄仍使用主機儲存空間；若這些目錄也需要硬性限制，請使用主機檔案系統的專案配額。

| 執行階段／儲存後端 | `--disk` 支援                                                             |
| ----------------------- | ---------------------------------------------------------------------------- |
| XFS 上的 Docker overlay2  | 需要 XFS 的 `pquota` 掛載選項。                                      |
| Docker btrfs 或 zfs     | 由儲存驅動程式支援。                                             |
| Podman overlay          | 需要 XFS 後端儲存空間。                                                |
| 其他後端          | 容器建立會失敗，並顯示常駐程式錯誤及 Fleet 的後端指引。 |

### 輸出政策

| 模式       | Docker                                                                                                | Podman                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bridge`   | 支援；預設不限制輸出流量。                                                | 支援；預設不限制輸出流量。                              |
| `internal` | 不接受，因為 Docker 不會在內部網路上保留已發布的回送介面閘道連接埠。 | 支援；在封鎖輸出流量時，回送介面閘道仍會保持發布狀態。 |

若使用 Docker，請保留 bridge 模式，並使用 `DOCKER-USER` 鏈結等主機防火牆規則來強制執行輸出政策。

## `fleet list`

依租用戶 ID 順序列出 cell：

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

表格包含：

| 欄位    | 含義                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | 租用戶 ID。                                                                                                                                                                                                                                                                            |
| `state`   | 透過 Docker 或 Podman 檢查取得的即時容器狀態。`unknown` 表示執行階段無法使用，或存在一個名稱與 cell 相同的容器，但其 Fleet 擁有權標籤與登錄記錄不符（表示發生衝突或竄改，請在採取行動前手動檢查）。 |
| `port`    | 對應至 cell 閘道的回送介面主機連接埠。                                                                                                                                                                                                                                        |
| `image`   | 已記錄的容器映像檔。                                                                                                                                                                                                                                                             |
| `created` | cell 建立時間。                                                                                                                                                                                                                                                                   |

Docker 或 Podman 無法使用時，登錄資料列仍會顯示；只有即時狀態會變成 `unknown`。

## `fleet status`

檢查單一 cell：

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

狀態會結合 Fleet 登錄資料列、即時容器檢查，以及對下列位置發出的簡短盡力而為請求：

```text
http://127.0.0.1:<host-port>/healthz
```

健康狀態結果為 `ok`、`failed` 或 `skipped`。`/healthz` 可證明閘道仍在運作，但不代表每個已設定的頻道或外掛都已完全就緒。若沒有可供檢查的本機端點，便會略過探測。

## `fleet logs`

將 cell 的容器日誌直接串流至終端機：

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

Fleet 會在讀取任何日誌前驗證已註冊容器的擁有權標籤，因此會拒絕使用預期 cell 名稱的外來容器。串流會固定至該已檢查容器的 ID，因此並行替換無法將其重新導向較新的世代。按 Ctrl-C 可結束 `--follow`，且不會將操作者停止視為命令失敗。日誌輸出會經過遮蔽篩選器，先將 cell 目前的閘道權杖取代為 `<redacted>`，再將任何內容送達終端機。

`fleet logs` 沒有 `--json` 模式，因為容器日誌是原始 stdout/stderr 串流。若用於指令碼，請使用 `--tail` 限制輸出，並使用一般的 shell 重新導向或管線。

## `fleet start`、`fleet stop` 和 `fleet restart`

使用已記錄的執行階段控制現有單元：

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

這些命令會對已註冊的容器名稱執行操作。如果租戶未知，或已記錄的執行階段無法執行該操作，命令就會失敗。

## `fleet upgrade`

重新拉取已記錄的映像，並取代單元容器：

```bash
openclaw fleet upgrade acme
```

將單元移至另一個映像：

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

升級會拉取目標映像、檢查現有容器和每個單元的網路、停止並移除容器，然後重新建立並啟動容器。替代容器會保留相同的主機連接埠、資料目錄、每個單元的橋接網路、執行階段設定檔、資源限制、重新啟動原則、由 Fleet 管理的環境，以及最初透過 `--env` 提供的值。掛載的狀態會在容器取代後保留；映像預設的環境可能會隨目標映像而變更。

只有在其閘道於單元的回送連接埠上回應 `/healthz`，符合官方 Compose 檔案所使用的健康狀態合約後，替代容器才會正式生效。如果替代容器結束、反覆當機，或未能在約一分鐘內進入健康狀態，就會將其移除並還原先前的容器，因此損壞的映像不會讓正常運作的單元停止服務。

閘道權杖刻意不儲存在 Fleet 登錄中。移除舊容器之前，Fleet 會讀取其環境，並將 `OPENCLAW_GATEWAY_TOKEN` 帶入替代容器。如果權杖未存在於你控制的其他位置，請勿在升級前手動移除舊容器。

## `fleet backup` 和 `fleet restore`

備份一個已停止的單元：

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

將該封存檔還原至已註冊的單元：

```bash
openclaw fleet restore acme --from ./acme.tgz
```

這些命令需要主機操作員權限。封存檔包含租戶狀態和驗證密鑰，建立時使用模式 `0600`，且必須像認證資訊一樣妥善儲存。備份會拒絕正在執行的單元，以確保一致地擷取 SQLite 狀態。除非提供 `--force`，否則還原會拒絕正在執行的單元；還原僅會取代該租戶的狀態、輪替閘道權杖，並只顯示一次新權杖。Fleet 一次只會備份一個租戶；備份所有租戶是另一項獨立的操作員動作。

還原需要現有且已停止的容器，因為從該容器檢查出的執行階段設定檔會提供替代容器的限制、使用者對應、環境來源和映像。如果已註冊的容器遭到外部移除，請先執行不含 `--purge-data` 的 `fleet rm <tenant> --force`，使用預期的映像和 `--no-start` 重新建立單元，然後重試還原。第一次移除會完整保留兩個租戶資料目錄。

這兩個命令都接受 `--max-bytes <bytes>`，用於限制封存或解壓縮的檔案資料量，並套用相同的固定一百萬個封存路徑區段預算，因此僅含中繼資料的封存炸彈無法耗盡主機 inode，且每個接受的備份都可還原。備份接受 `--out <path>`，這兩個命令也都支援 `--json`。

封存檔只能包含一般檔案和目錄。備份絕不會追蹤或儲存符號連結、硬連結、通訊端或裝置節點；結果中會報告略過的數量。還原會拒絕包含任何其他項目類型的封存檔。還原後，必須在單元內重新安裝可重新建立的符號連結樹狀結構，例如工作區 `node_modules`。

## `fleet doctor`

稽核所有單元或單一租戶，而不變更執行階段或檔案系統狀態：

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

Doctor 會檢查執行階段是否位於本機、擁有權標籤、健康狀態、強化設定、資源限制、回送連接埠繫結、權杖是否存在、網路擁有權與輸出模式，以及私有狀態目錄權限。警告會說明已停止的單元或擁有權差異；任何失敗的檢查結果都會讓程序以非零結束代碼結束。

## `fleet rm`

從執行階段和登錄中移除已停止的單元，同時保留租戶資料：

```bash
openclaw fleet rm acme
```

執行中的容器需要 `--force`：

```bash
openclaw fleet rm acme --force
```

同時永久移除單元資料：

```bash
openclaw fleet rm acme --purge-data --force
```

Fleet 會先移除單元容器，再移除其專用橋接網路。`--purge-data` 需要 `--force`。在遞迴刪除之前，Fleet 會解析兩個 Fleet 擁有的根目錄和兩個每租戶目錄。每個目標都必須是完全符合預期的租戶葉節點、嚴格位於其根目錄內，且不能是符號連結。這些範圍檢查可防止損毀的登錄路徑或跨租戶符號連結將刪除操作重新導向至其他位置。

如果完全符合預期的租戶目錄已不存在，可以重試清除。如此一來，後續呼叫可在檔案系統部分失敗後完成清理，同時不會放寬對仍然存在之目錄的路徑檢查。

## 儲存空間和容器配置

單元狀態和驗證設定檔加密金鑰會使用作用中 OpenClaw 狀態目錄下不同的每租戶主機路徑：

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

第一個目錄掛載於 `/home/node/.openclaw`。第二個目錄掛載於 `/home/node/.config/openclaw`，與官方 Docker 設定的加密金鑰掛載位置一致。因此，加密金鑰不會暴露在一般狀態掛載位置下，也不會在僅備份或共用單元狀態目錄時納入其中。這兩個目錄都會在一般移除和升級後保留；`fleet rm --purge-data --force` 會在分別進行範圍檢查後將兩者刪除。

第一次啟動之前，Fleet 會使用 `gateway.mode=local`、權杖驗證、LAN 容器繫結，以及已配置主機連接埠的 Control UI 來源來初始化單元設定。權杖值不會寫入該設定；它會保留在容器環境中。

Fleet 使用下列環境值固定官方映像的容器路徑：

| 變數                 | 容器值                      |
| ------------------------ | ------------------------------------ |
| `HOME`                   | `/home/node`                         |
| `OPENCLAW_HOME`          | `/home/node`                         |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`               |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json` |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`     |
| `OPENCLAW_GATEWAY_TOKEN` | 產生或提供的單元權杖     |

官方映像預設使用 UID 1000 的非 root `node` 使用者。Fleet 會讓私有 `0700` 繫結掛載保持可寫入，但不會讓所有人都能存取。Rootful Docker 會以呼叫者的非 root UID 和 GID 執行單元；rootless Docker 會使用容器 UID 0，此 UID 會在常駐程式的使用者命名空間內對應至呼叫者的非特權主機使用者。Podman 會使用 `keep-id` 搭配呼叫者的 UID 和 GID。當 Fleet 本身以 root 身分對 rootful 執行階段執行時，會保留映像使用者，並將初始掛載檔案指派給 UID/GID 1000。

在 SELinux 主機上，Docker 和 Podman 掛載會套用私有 `:Z` 重新標記。如果你還原或重新放置單元資料，請讓繫結掛載路徑可由有效的容器使用者寫入。此設定檔適合 rootless 環境，但 Docker 或 Podman 必須已在主機上設定為 rootless 操作；Fleet 不會將 rootful 常駐程式轉換成 rootless 常駐程式。

## 安全性設定檔

Fleet 會將下列設定檔套用至每個單元：

| 控制項              | 套用的設定檔                                      | 原因                                                                                    |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Linux 權能   | `--cap-drop=ALL`                                     | 閘道是 Node.js 程序，不需要新增任何 Linux 權能。                |
| 權限提升 | `--security-opt no-new-privileges`                   | 防止程序透過 setuid 或 setgid 二進位檔取得權限。          |
| Init 程序         | `--init`                                             | 回收子代程序並轉送容器生命週期訊號。                   |
| 程序限制        | 預設為 `--pids-limit 512`                        | 限制分叉和程序耗盡。                                                    |
| 記憶體限制         | 預設為 `--memory 2g`                             | 限制單元的記憶體使用量。                                                                |
| CPU 限制            | 預設為 `--cpus 2`                                | 限制單元的 CPU 使用量。                                                                   |
| 可寫入層磁碟  | 選用的 `--disk`                                    | 當執行階段儲存後端支援配額時，限制容器層。           |
| 重新啟動原則       | `--restart unless-stopped`                           | 重新啟動失敗的單元，但不會覆寫刻意停止的狀態。                         |
| 主機發布      | 僅限 `127.0.0.1:<host-port>:18789`                   | 讓閘道不會暴露於萬用字元主機介面。                                        |
| 單元網路         | 每個單元使用一個橋接網路或 Podman 內部網路       | 隔離容器 IP 流量，並可選擇封鎖 Podman 的對外流量。           |
| 容器身分   | 與主機相符的使用者對應                            | 讓私有繫結掛載保持可寫入，而不授予所有人存取權。                      |
| 持久狀態     | 每個單元各自掛載；不共用狀態掛載               | 將租戶設定、認證資訊、工作階段和工作區保留在該租戶的資料樹狀結構中。 |
| 容器命令    | `node dist/index.js gateway --bind lan --port 18789` | 在容器網路上監聽，讓僅限回送介面的主機連接埠對應可以連線。  |

Fleet 絕不會掛載 `/var/run/docker.sock`、使用 `--privileged` 或主機網路，也不會新增權能。每個單元的橋接網路是跨單元的隔離邊界，而非對外防火牆：單元會保留提供者和通道所需的網路輸出能力。請在回送連接埠前配置符合部署需求的 Proxy、SSH 通道或 tailnet 設定。`http://127.0.0.1:<port>` 只能直接從 Fleet 主機存取。

此設定檔會隔離租戶容器，但無法保護租戶免受 Fleet 操作員、容器執行階段管理員或遭入侵主機的影響。完整的信任模型和更強的隔離選項，請參閱[多租戶託管](/zh-TW/gateway/multi-tenant-hosting)。

## 權杖處理

預設情況下，`fleet create` 會產生具密碼學隨機性的 32 字元十六進位閘道權杖，並在建立結果中顯示一次。請將其儲存在核准的密鑰管理工具中，並避免將建立輸出記錄到日誌。

`--gateway-token` 會將自訂權杖放入本機程序引數中，這些引數可能保留在 Shell 歷程記錄中，或顯示於程序清單。除非現有的密鑰管理工作流程要求提供指定值，否則請優先使用產生的權杖。

權杖以及透過 `--env` 傳入的每個值都存在於容器環境中。Fleet 會將這些值寫入短期存在、模式為 `0600` 的環境檔案，只將該檔案的路徑傳遞給 Docker 或 Podman，並在執行階段命令完成後將其移除。明確輸入 `openclaw fleet create --gateway-token ...` 或 `--env KEY=VALUE` 的值仍可能顯示於外層 `openclaw` 程序引數和 Shell 歷程記錄中。

受信任的主機管理員仍可看見容器環境值：Docker 或 Podman 管理員可透過檢查容器讀取這些值。Fleet 的「僅顯示一次」註記描述的是一般命令列介面輸出，而非用來防止主機管理員存取。

## 相關內容

- [多租戶託管](/zh-TW/gateway/multi-tenant-hosting)
- [Docker](/zh-TW/install/docker)
- [Podman](/zh-TW/install/podman)
- [閘道安全性](/zh-TW/gateway/security)
