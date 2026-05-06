---
read_when:
    - 你想使用 Podman 而不是 Docker 來執行容器化 Gateway
summary: 在無 root 權限的 Podman 容器中執行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-05-06T02:51:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

在 rootless Podman 容器中執行 OpenClaw Gateway，並由你目前的非 root 使用者管理。

預期模型如下：

- Podman 執行 Gateway 容器。
- 主機上的 `openclaw` CLI 是控制平面。
- 預設情況下，持久狀態位於主機的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或獨立的服務使用者。

## 先決條件

- rootless 模式的 **Podman**
- 主機上已安裝 **OpenClaw CLI**
- **選用：** 如果你想要由 Quadlet 管理自動啟動，需使用 `systemd --user`
- **選用：** 只有在 headless 主機上想要執行 `loginctl enable-linger "$(whoami)"` 以維持開機持久性時，才需要 `sudo`

## 快速開始

<Steps>
  <Step title="一次性設定">
    從 repo 根目錄執行 `./scripts/podman/setup.sh`。
  </Step>

  <Step title="啟動 Gateway 容器">
    使用 `./scripts/run-openclaw-podman.sh launch` 啟動容器。
  </Step>

  <Step title="在容器內執行 onboarding">
    執行 `./scripts/run-openclaw-podman.sh launch setup`，然後開啟 `http://127.0.0.1:18789/`。
  </Step>

  <Step title="從主機 CLI 管理正在執行的容器">
    設定 `OPENCLAW_CONTAINER=openclaw`，然後從主機使用一般的 `openclaw` 命令。
  </Step>
</Steps>

設定詳細資訊：

- `./scripts/podman/setup.sh` 預設會在你的 rootless Podman 儲存區中建置 `openclaw:local`，如果你有設定 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，則會使用該映像。
- 如果缺少 `~/.openclaw/openclaw.json`，它會建立該檔案並設定 `gateway.mode: "local"`。
- 如果缺少 `~/.openclaw/.env`，它會建立該檔案並設定 `OPENCLAW_GATEWAY_TOKEN`。
- 對於手動啟動，輔助工具只會從 `~/.openclaw/.env` 讀取一小組 Podman 相關鍵的 allowlist，並將明確的 runtime env vars 傳給容器；它不會把完整 env 檔案交給 Podman。

由 Quadlet 管理的設定：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 是僅限 Linux 的選項，因為它依賴 systemd 使用者服務。

你也可以設定 `OPENCLAW_PODMAN_QUADLET=1`。

選用的建置/設定 env vars：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` -- 使用既有/已拉取的映像，而不是建置 `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- 在映像建置期間安裝額外的 apt 套件
- `OPENCLAW_EXTENSIONS` -- 在建置時預先安裝 Plugin 相依項
- `OPENCLAW_INSTALL_BROWSER` -- 為瀏覽器自動化預先安裝 Chromium 和 Xvfb（設為 `1` 以啟用）

容器啟動：

```bash
./scripts/run-openclaw-podman.sh launch
```

此指令碼會以你目前的 uid/gid 搭配 `--userns=keep-id` 啟動容器，並將你的 OpenClaw 狀態 bind-mount 到容器中。

Onboarding：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然後開啟 `http://127.0.0.1:18789/`，並使用 `~/.openclaw/.env` 中的 token。

主機 CLI 預設值：

```bash
export OPENCLAW_CONTAINER=openclaw
```

接著，像這樣的命令會自動在該容器內執行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能會讓瀏覽器對 Gateway 而言看起來不是本機。
如果控制 UI 在啟動後回報裝置驗證錯誤，請使用
[Podman 與 Tailscale](#podman--tailscale) 中的 Tailscale 指引。

<a id="podman--tailscale"></a>

## Podman 與 Tailscale

若要使用 HTTPS 或遠端瀏覽器存取，請遵循主要的 Tailscale 文件。

Podman 專屬注意事項：

- 將 Podman 發布主機保持在 `127.0.0.1`。
- 優先使用由主機管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本機瀏覽器裝置驗證內容不可靠，請改用 Tailscale 存取，而不是臨時的本機通道因應方式。

請參閱：

- [Tailscale](/zh-TW/gateway/tailscale)
- [控制 UI](/zh-TW/web/control-ui)

## Systemd（Quadlet，選用）

如果你執行了 `./scripts/podman/setup.sh --quadlet`，設定會在以下位置安裝 Quadlet 檔案：

```bash
~/.config/containers/systemd/openclaw.container
```

實用命令：

- **啟動：** `systemctl --user start openclaw.service`
- **停止：** `systemctl --user stop openclaw.service`
- **狀態：** `systemctl --user status openclaw.service`
- **記錄：** `journalctl --user -u openclaw.service -f`

編輯 Quadlet 檔案後：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

若要在 SSH/headless 主機上維持開機持久性，請為目前使用者啟用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 設定、env 與儲存空間

- **設定目錄：** `~/.openclaw`
- **工作區目錄：** `~/.openclaw/workspace`
- **Token 檔案：** `~/.openclaw/.env`
- **啟動輔助工具：** `./scripts/run-openclaw-podman.sh`

啟動指令碼和 Quadlet 會將主機狀態 bind-mount 到容器中：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

預設情況下，這些是主機目錄，而不是匿名容器狀態，因此
`openclaw.json`、每個 agent 的 `auth-profiles.json`、channel/provider 狀態、
sessions 和工作區會在容器替換後保留下來。
Podman 設定也會為已發布 Gateway 連接埠上的 `127.0.0.1` 和 `localhost` 種子設定 `gateway.controlUi.allowedOrigins`，讓本機 dashboard 可搭配容器的非 loopback 綁定運作。

手動啟動器的實用 env vars：

- `OPENCLAW_PODMAN_CONTAINER` -- 容器名稱（預設為 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 要執行的映像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- 對應到容器 `18789` 的主機連接埠
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- 對應到容器 `18790` 的主機連接埠
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 發布連接埠的主機介面；預設為 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- 容器內的 Gateway 綁定模式；預設為 `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（預設）、`auto` 或 `host`

手動啟動器會在最終確定容器/映像預設值之前讀取 `~/.openclaw/.env`，因此你可以將這些值持久化在其中。

如果你使用非預設的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，請為 `./scripts/podman/setup.sh` 和後續的 `./scripts/run-openclaw-podman.sh launch` 命令設定相同變數。repo-local 啟動器不會跨 shell 保留自訂路徑覆寫。

Quadlet 注意事項：

- 產生的 Quadlet 服務會刻意保持固定且強化的預設形狀：`127.0.0.1` 發布連接埠、容器內 `--bind lan`，以及 `keep-id` 使用者命名空間。
- 它會固定 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。
- 它會發布 `127.0.0.1:18789:18789`（Gateway）和 `127.0.0.1:18790:18790`（bridge）。
- 它會將 `~/.openclaw/.env` 作為 runtime `EnvironmentFile` 讀取，用於 `OPENCLAW_GATEWAY_TOKEN` 等值，但不會使用手動啟動器的 Podman 專屬覆寫 allowlist。
- 如果你需要自訂發布連接埠、發布主機或其他 container-run 旗標，請使用手動啟動器，或直接編輯 `~/.config/containers/systemd/openclaw.container`，然後重新載入並重新啟動服務。

## 實用命令

- **容器記錄：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **從主機 CLI 開啟 dashboard URL：** `openclaw dashboard --no-open`
- **透過主機 CLI 取得健康狀態/狀態：** `openclaw gateway status --deep`（RPC probe + 額外
  服務掃描）

## 疑難排解

- **設定或工作區發生權限遭拒（EACCES）：** 容器預設會使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 執行。請確認主機設定/工作區路徑由你目前的使用者擁有。
- **Gateway 啟動遭阻擋（缺少 `gateway.mode=local`）：** 請確認 `~/.openclaw/openclaw.json` 存在，且設定了 `gateway.mode="local"`。若缺少此檔案，`scripts/podman/setup.sh` 會建立它。
- **容器 CLI 命令命中錯誤目標：** 明確使用 `openclaw --container <name> ...`，或在 shell 中匯出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 搭配 `--container` 失敗：** 這是預期行為。重新建置/拉取映像，然後重新啟動容器或 Quadlet 服務。
- **Quadlet 服務未啟動：** 執行 `systemctl --user daemon-reload`，然後執行 `systemctl --user start openclaw.service`。在 headless 系統上，你可能也需要執行 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻擋 bind mounts：** 保留預設掛載行為；當 SELinux 為 enforcing 或 permissive 時，啟動器會在 Linux 上自動加入 `:Z`。

## 相關內容

- [Docker](/zh-TW/install/docker)
- [Gateway 背景程序](/zh-TW/gateway/background-process)
- [Gateway 疑難排解](/zh-TW/gateway/troubleshooting)
