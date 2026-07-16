---
doc-schema-version: 1
read_when:
    - 你正在為多位使用者或多個組織託管 OpenClaw
    - 你需要為租戶工作負載選擇隔離邊界
summary: 將多個租戶信任網域託管為每個租戶一個隔離的 OpenClaw 閘道單元
title: 多租戶託管
x-i18n:
    generated_at: "2026-07-16T11:39:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# 多租戶託管

OpenClaw 的預設安全模型是每個閘道各自具有一個受信任的操作者邊界，而不是在單一共用閘道內提供對抗性多租戶隔離。因此，若要託管不共用信任邊界的使用者或組織，就必須為每個租戶分別執行一套完整的 OpenClaw 執行個體。

`openclaw fleet` 將每個隔離的執行個體稱為一個**單元**。單元是在強化容器中執行的完整閘道，具有自己的狀態、認證資訊、工作區、頻道帳號、權杖，以及僅限迴路介面的主機連接埠。

Fleet 為**實驗性功能**：其命令、旗標與容器設定檔可能在不同版本之間變更，且不提供棄用過渡期。

Fleet 已在 Linux 與 macOS 主機上測試。目前尚未測試 Windows 主機。

## 為何每個租戶都需要一個單元

單一閘道內經過驗證的操作者具有受信任的控制平面角色。工作階段 ID 用於選擇路由；它們不會授權租戶彼此存取。代理程式沙箱可降低不受信任內容與工具執行所造成的影響，但無法將單一共用閘道轉變為租戶授權邊界。

每個租戶應使用一個單元，讓每個信任網域都有各自獨立的閘道程序、容器、持久狀態樹與閘道認證資訊。這遵循[閘道安全模型](/zh-TW/gateway/security)：請勿將互不信任的使用者共同置於同一個 OpenClaw 程序或同一個作業系統使用者下。

## 架構

Fleet 命令列介面是主機端的生命週期監督程式。它會將單元記錄在 OpenClaw 狀態資料庫中，並要求本機 Docker 或 Podman 執行階段建立、檢查、啟動、停止、取代及移除其容器。不支援遠端執行階段端點，因為 Fleet 的繫結路徑與迴路 URL 屬於本機主機。Fleet 不會代理租戶訊息，也不會在單元之間新增共用的應用程式層級資料路徑。

每個單元都會在自己的使用者定義橋接網路上執行官方 `ghcr.io/openclaw/openclaw` 映像。獨立橋接網路可防止單元之間透過容器 IP 直接傳輸流量，同時保留供應商與頻道所需的輸出 NAT 存取。預設不限制輸出流量。Podman 單元可使用 `--network internal` 封鎖輸出流量，同時保留已發布的迴路閘道連接埠。Docker 內部網路會使該已發布連接埠失效，因此 Fleet 會拒絕此組合；請改用主機防火牆規則（例如 `DOCKER-USER` 鏈）強制執行 Docker 輸出流量政策。單元閘道會在容器內的連接埠 `18789` 上接聽，而執行階段只會將其發布至主機上的 `127.0.0.1:<allocated-port>`。需要遠端存取時，操作者可在該迴路端點前方設定經核准的反向 Proxy、SSH 通道或 tailnet。

持久閘道狀態來自 `<state-dir>/fleet/cells/<tenant>/`，並掛載於 `/home/node/.openclaw`。驗證設定檔加密金鑰來自獨立的 `<state-dir>/fleet/auth-profile-secrets/<tenant>/` 主機路徑，並掛載於 `/home/node/.config/openclaw`，以符合官方的 [Docker 持久性配置](/zh-TW/install/docker#storage-and-persistence)。該金鑰不會巢狀置於一般狀態掛載點之下。各租戶的頻道帳號會在其所屬單元內終止連線；Fleet 不提供共用頻道帳號或輸入訊息路由器。

官方映像預設使用 UID 1000 的非 root `node` 使用者。Fleet 使用與主機相容的使用者對應，讓私有繫結掛載點維持可寫入：Podman 使用 `keep-id`，以 root 模式執行的 Docker 使用呼叫命令的非 root 身分，而無 root 權限的 Docker 則將容器 root 對應至無特殊權限的常駐程式使用者。主機啟用 SELinux 時，Docker 與 Podman 會套用私有的 `:Z` 重新標記。此容器設定檔避免使用具特殊權限的主機功能，且適合無 root 權限環境，但無 root 權限操作是主機執行階段的選擇與先決條件，Fleet 不會自動啟用。

## 信任邊界

多租戶機制可保護租戶免受其他租戶影響。每個租戶都信任 Fleet 操作者與主機。抵禦遭入侵的主機並非其設計目標。

這表示主機管理員可以檢查容器設定與環境、讀取已掛載的單元資料、取代映像，或進入容器。管理員可透過 Docker 或 Podman 的檢查功能查看閘道權杖及使用 `--env` 傳入的值。因此，請適當使用主機控制、管理存取政策、監控、備份及經核准的機密管理工具。

基準設定可防止意外暴露萬用字元網路，並移除常見的容器權限提升機制，但無法使不受信任的主機變得安全。

## 隔離層級

請選擇符合所託管租戶需求的邊界：

1. **強化容器基準。** Fleet 會捨棄所有 Linux 權能、啟用 `no-new-privileges`、套用 PID、記憶體、CPU 與選用的可寫入層磁碟限制、使用獨立的持久掛載點與各單元專屬網路，並且只發布至主機迴路介面。橋接網路不會限制輸出流量；當單元不得主動建立輸出連線時，請使用 Podman `--network internal` 或 Docker 主機防火牆政策。這是適用於信任操作者與主機之租戶的預設設定檔。
2. **更強的容器或虛擬機器隔離。** 對於風險較高的工作負載，請設定 Docker 或 Podman 使用更強的 OCI 隔離執行階段，例如 gVisor 或 Kata Containers，或將單元置於 microVM 中。這屬於執行階段或基礎架構設定；Fleet 的 `--runtime docker|podman` 選項用於選擇容器命令列介面，而非 OCI 隔離後端。請參閱 Docker 的[替代容器執行階段](https://docs.docker.com/engine/daemon/alternative-runtimes/)及 [Docker 虛擬機器執行階段指南](/zh-TW/install/docker-vm-runtime)。
3. **為對抗性租戶使用獨立機器。** 請勿將互為對抗關係的租戶共同置於同一個 OpenClaw 程序或作業系統使用者下。若租戶不信任相同的主機操作者，或需要更強的管理邊界，請使用具有獨立執行階段管理的不同虛擬機器或實體主機。

此隔離層級中的任何一層都不會改變 OpenClaw 應用程式的信任模型：一個閘道仍代表一個受信任的操作者網域。

## 快速開始

建立一個單元。此命令只會顯示產生的閘道權杖一次，因此請立即儲存：

```bash
openclaw fleet create acme
```

在 Fleet 主機上開啟回報的 `http://127.0.0.1:<port>` URL，使用該租戶的權杖進行驗證，並在單元內設定供應商認證資訊與頻道帳號。

檢查容器狀態與閘道存活狀態：

```bash
openclaw fleet status acme
```

升級時保留主機連接埠、已掛載資料、資源設定檔、使用者提供的環境及閘道權杖：

```bash
openclaw fleet upgrade acme
```

移除容器及登錄項目，但保留租戶資料：

```bash
openclaw fleet rm acme --force
```

若也要刪除持久租戶資料，請加入 `--purge-data`。清除作業需要 `--force`、無法復原，且會在刪除任何內容前執行已解析路徑的範圍檢查：

```bash
openclaw fleet rm acme --purge-data --force
```

請參閱 [`openclaw fleet` 命令列介面參考](/zh-TW/cli/fleet)，以了解所有命令與選項。

## 目前範圍

Fleet 不提供下列介面：

- 共用頻道帳號或共用輸入路由器
- 以精簡的各租戶主機程序取代完整的 OpenClaw 執行個體
- 由單一監督程式管理的遠端單元主機
- 租戶自助服務入口網站、計費平面或委派管理使用者介面

這些功能需要明確的身分、路由、授權及故障網域合約。請勿透過在租戶之間共用單一閘道或其認證資訊來近似實作這些功能。Fleet 是單一主機的生命週期監督程式；跨多台機器且受身分治理的 Fleet 需要獨立的控制平面層。

## 相關內容

- [`openclaw fleet`](/zh-TW/cli/fleet)
- [閘道安全性](/zh-TW/gateway/security)
- [多個閘道](/zh-TW/gateway/multiple-gateways)
- [Docker](/zh-TW/install/docker)
- [Podman](/zh-TW/install/podman)
