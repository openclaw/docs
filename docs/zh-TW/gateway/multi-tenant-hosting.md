---
read_when:
    - 你正在為多位使用者或多個組織託管 OpenClaw
    - 你需要為租戶工作負載選擇隔離邊界
summary: 為每個租戶建立一個隔離的 OpenClaw 閘道單元，藉此託管多個租戶信任網域
title: 多租戶託管
x-i18n:
    generated_at: "2026-07-12T14:34:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ffb873c7b9e7e463d932ad35eb009c34218447a051ac065c151ba57dc71b799
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# 多租戶託管

OpenClaw 的預設安全模型是每個閘道各有一個受信任的操作員邊界，而不是在單一共用閘道內提供可抵禦惡意行為的多租戶隔離。因此，若要託管不共用信任邊界的使用者或組織，就必須為每個租戶執行一個獨立且完整的 OpenClaw 執行個體。

`openclaw fleet` 將每個隔離的執行個體稱為一個 **cell**。cell 是在強化容器中執行的完整閘道，擁有自己的狀態、認證資訊、工作區、頻道帳號、權杖，以及僅限回送介面的主機連接埠。

Fleet 目前為**實驗性功能**：在此介面趨於穩定前，其命令、旗標和容器設定檔可能在不同版本間變更，且不會提供淘汰通知期。

Fleet 已在 Linux 和 macOS 主機上測試。目前尚未測試 Windows 主機。

## 為何每個租戶都需要一個 cell

在單一閘道內，經過驗證的操作員具有受信任的控制平面角色。工作階段 ID 用於選擇路由；它們不會授權某個租戶存取另一個租戶。代理程式沙箱可以降低不受信任內容和工具執行所造成的影響，但無法將單一共用閘道轉變為租戶授權邊界。

每個租戶應使用一個 cell，讓每個信任網域都有獨立的閘道程序、容器、持久狀態樹和閘道認證資訊。這符合[閘道安全模型](/zh-TW/gateway/security)：請勿在同一個 OpenClaw 程序或同一個作業系統使用者下共同託管彼此不信任的使用者。

## 架構

Fleet 命令列介面是主機端的生命週期監督程式。它會將 cell 記錄在 OpenClaw 狀態資料庫中，並要求本機 Docker 或 Podman 執行階段建立、檢查、啟動、停止、替換及移除其容器。Fleet 會拒絕遠端執行階段端點，因為 Fleet 的繫結路徑和回送 URL 屬於本機主機；在遠端 cell 主機具備明確的儲存空間與端點契約前，不會支援此功能。Fleet 不會代理租戶訊息，也不會在 cell 之間新增共用的應用程式層級資料路徑。

每個 cell 都會在自己的使用者定義橋接網路上執行官方 `ghcr.io/openclaw/openclaw` 映像。各自獨立的橋接網路可防止 cell 之間透過容器 IP 直接傳輸流量，同時保留供應商和頻道所需的對外 NAT 存取。預設不限制對外流量。Podman cell 可以使用 `--network internal` 阻擋對外流量，同時保留已發布的回送閘道連接埠。Docker 內部網路會導致該已發布連接埠無法運作，因此 Fleet 會拒絕這種組合；請改用主機防火牆規則（例如 `DOCKER-USER` 鏈）來強制執行 Docker 對外流量政策。cell 閘道在容器內監聽連接埠 `18789`，而執行階段只會將其發布至主機上的 `127.0.0.1:<allocated-port>`。需要遠端存取時，操作員可以在該回送端點前方放置經核准的反向 Proxy、SSH 通道或 tailnet。

持久閘道狀態來自 `<state-dir>/fleet/cells/<tenant>/`，並掛載至 `/home/node/.openclaw`。驗證設定檔加密金鑰來自獨立的 `<state-dir>/fleet/auth-profile-secrets/<tenant>/` 主機路徑，並掛載至 `/home/node/.config/openclaw`，與官方的 [Docker 持久化配置](/zh-TW/install/docker#storage-and-persistence)一致。金鑰不會巢狀存放於一般狀態掛載點下。各租戶的頻道帳號會在擁有該帳號的 cell 內終止連線，因此 Fleet MVP 中沒有共用的頻道帳號或共用的輸入訊息路由器。

官方映像預設使用 UID 1000 的非 root `node` 使用者。Fleet 使用與主機相容的使用者對應，讓私有繫結掛載點保持可寫入：Podman 使用 `keep-id`，以 root 執行的 Docker 使用叫用命令之非 root 使用者的身分，而無 root 權限的 Docker 則將容器 root 對應至不具特殊權限的常駐程式使用者。主機啟用 SELinux 時，Docker 和 Podman 會套用私有的 `:Z` 重新標記。容器設定檔會避開具特殊權限的主機功能，並適合無 root 權限的環境，但無 root 權限運作是主機執行階段的選擇與先決條件，Fleet 不會自動啟用此功能。

## 信任邊界

多租戶架構可保護各租戶不受其他租戶影響。每個租戶都信任 Fleet 操作員和主機。抵禦主機遭入侵不在設計目標之內。

這表示主機管理員可以檢查容器設定與環境、讀取已掛載的 cell 資料、替換映像或進入容器。管理員可透過 Docker 或 Podman 檢查功能查看閘道權杖和以 `--env` 傳入的值。因此，請搭配使用主機控制措施、管理存取政策、監控、備份及經核准的秘密管理工具。

基準設定可防止意外的萬用字元網路暴露，並移除常見的容器權限提升機制，但無法使不受信任的主機變得安全。

## 隔離層級

請選擇符合所託管租戶需求的邊界：

1. **強化容器基準。** Fleet 會移除所有 Linux 權能、啟用 `no-new-privileges`、套用 PID、記憶體、CPU，以及選用的可寫入層磁碟限制、使用獨立的持久掛載點和各 cell 專屬網路，並且只發布至主機回送介面。橋接網路不會限制對外流量；當 cell 不得主動建立對外連線時，請使用 Podman 的 `--network internal` 或 Docker 主機防火牆政策。這是適用於信任操作員和主機之租戶的 MVP 設定檔。
2. **更強的容器或 VM 隔離。** 對於風險較高的工作負載，請設定 Docker 或 Podman 使用更強的 OCI 隔離執行階段，例如 gVisor 或 Kata Containers，或將 cell 放入 microVM。這是執行階段或基礎架構設定；Fleet 的 `--runtime docker|podman` 選項只會選擇容器命令列介面，而不會選擇 OCI 隔離後端。請參閱 Docker 的[替代容器執行階段](https://docs.docker.com/engine/daemon/alternative-runtimes/)和 [Docker VM 執行階段指南](/zh-TW/install/docker-vm-runtime)。
3. **為惡意租戶使用獨立機器。** 請勿在同一個 OpenClaw 程序或作業系統使用者下共同託管彼此敵對的租戶。若租戶不信任同一位主機操作員，或需要更強的管理邊界，請使用具備獨立執行階段管理的不同 VM 或實體主機。

此隔離層級中的任何一層都不會改變 OpenClaw 應用程式的信任模型：一個閘道仍然是一個受信任的操作員網域。

## 快速開始

建立一個 cell。此命令只會顯示產生的閘道權杖一次，因此請立即儲存：

```bash
openclaw fleet create acme
```

在 Fleet 主機上開啟回報的 `http://127.0.0.1:<port>` URL，使用該租戶的權杖進行驗證，並在 cell 內設定供應商認證資訊和頻道帳號。

檢查容器狀態和閘道是否正常運作：

```bash
openclaw fleet status acme
```

升級時保留主機連接埠、已掛載資料、資源設定檔、使用者提供的環境和閘道權杖：

```bash
openclaw fleet upgrade acme
```

移除容器和登錄資料列，但保留租戶資料：

```bash
openclaw fleet rm acme --force
```

若也要刪除持久租戶資料，請加上 `--purge-data`。清除操作需要 `--force`、無法復原，且在刪除任何內容前會執行解析路徑的包含範圍檢查：

```bash
openclaw fleet rm acme --purge-data --force
```

請參閱 [`openclaw fleet` 命令列介面參考](/cli/fleet)，以瞭解所有命令和選項。

## MVP 暫緩項目

Fleet 的第一個版本刻意將下列介面留待後續設計：

- 共用頻道帳號或共用輸入路由器
- 使用精簡的各租戶主機程序，而非完整的 OpenClaw 執行個體
- 由單一監督程式管理的遠端 cell 主機
- 租戶自助服務入口網站、計費平面或委派管理使用者介面

這些功能需要明確的身分、路由、授權和故障網域契約。不應透過讓租戶共用單一閘道或其認證資訊來模擬這些功能。這些功能也不屬於 Fleet 的範疇：Fleet 會維持為單一主機的生命週期監督程式，而多機器且受身分控管的 Fleet 應由其上層的專用控制平面負責。

## 相關內容

- [`openclaw fleet`](/cli/fleet)
- [閘道安全性](/zh-TW/gateway/security)
- [多個閘道](/zh-TW/gateway/multiple-gateways)
- [Docker](/zh-TW/install/docker)
- [Podman](/zh-TW/install/podman)
