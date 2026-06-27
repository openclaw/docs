---
read_when:
    - 你想要使用 Podman 而非 Docker 的容器化閘道
summary: 在 rootless Podman 容器中執行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-06-27T19:28:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f6950956551dc3c274db33712cf66632fb5facbca4954bf67c30a8bff740c2f
    source_path: install/podman.md
    workflow: 16
---

在由目前非 root 使用者管理的無 root Podman 容器中執行 OpenClaw 閘道。

預期模型為：

- Podman 執行閘道容器。
- 你的主機 `openclaw` 命令列介面是控制平面。
- 永續狀態預設存放在主機的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或獨立的服務使用者。

## 先決條件

- **Podman** 無 root 模式
- 主機已安裝 **OpenClaw 命令列介面**
- **選用：** 如果你想要 Quadlet 管理的自動啟動，需有 `systemd --user`
- **選用：** 如果你想在無頭主機上保留開機持續性，才需要 `sudo` 來執行 `loginctl enable-linger "$(whoami)"`

## 快速開始

<Steps>
  <Step title="一次性設定">
    從 repo 根目錄執行 `./scripts/podman/setup.sh`。
  </Step>

  <Step title="啟動閘道容器">
    使用 `./scripts/run-openclaw-podman.sh launch` 啟動容器。
  </Step>

  <Step title="在容器內執行初始設定">
    執行 `./scripts/run-openclaw-podman.sh launch setup`，然後開啟 `http://127.0.0.1:18789/`。
  </Step>

  <Step title="從主機命令列介面管理執行中的容器">
    設定 `OPENCLAW_CONTAINER=openclaw`，然後從主機使用一般的 `openclaw` 命令。
  </Step>
</Steps>

設定細節：

- `./scripts/podman/setup.sh` 預設會在你的無 root Podman 儲存區中建置 `openclaw:local`，或在你有設定時使用 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`。
- 如果缺少 `~/.openclaw/openclaw.json`，它會建立該檔案並設定 `gateway.mode: "local"`。
- 如果缺少 `~/.openclaw/.env`，它會建立該檔案並設定 `OPENCLAW_GATEWAY_TOKEN`。
- 對於手動啟動，輔助程式只會從 `~/.openclaw/.env` 讀取少量 Podman 相關鍵的允許清單，並將明確的執行階段環境變數傳給容器；它不會把完整 env 檔交給 Podman。

Quadlet 管理的設定：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 是僅限 Linux 的選項，因為它依賴 systemd 使用者服務。

你也可以設定 `OPENCLAW_PODMAN_QUADLET=1`。

選用的建置/設定環境變數：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` -- 使用既有/已拉取的映像，而不是建置 `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- 在映像建置期間安裝額外的 apt 套件（也接受舊版 `OPENCLAW_DOCKER_APT_PACKAGES`）
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- 在映像建置期間安裝額外的 Python 套件；請釘選版本，且只使用你信任的套件索引
- `OPENCLAW_EXTENSIONS` -- 在建置時預先安裝外掛相依項
- `OPENCLAW_INSTALL_BROWSER` -- 預先安裝 Chromium 和 Xvfb 供瀏覽器自動化使用（設為 `1` 以啟用）

容器啟動：

```bash
./scripts/run-openclaw-podman.sh launch
```

此指令稿會以你目前的 uid/gid 搭配 `--userns=keep-id` 啟動容器，並將你的 OpenClaw 狀態 bind mount 到容器內。

初始設定：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然後開啟 `http://127.0.0.1:18789/`，並使用 `~/.openclaw/.env` 中的 token。

Podman 中的模型驗證：

- 在設定期間使用 OpenClaw 管理的驗證：Anthropic 使用 Anthropic API 金鑰，或 Codex 支援的 OpenAI 使用 OpenAI Codex 瀏覽器 OAuth/device-code 驗證。
- Podman 啟動器不會將主機命令列介面認證家目錄（例如 `~/.claude` 或 `~/.codex`）掛載到設定或閘道容器中。
- 既有主機命令列介面登入是同一主機上的便利路徑。對於容器安裝，請將提供者驗證保留在設定所管理、已掛載的 `~/.openclaw` 狀態中。

主機命令列介面預設值：

```bash
export OPENCLAW_CONTAINER=openclaw
```

然後這類命令會自動在該容器內執行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能會讓瀏覽器對閘道而言看起來不是本機。
如果控制介面在啟動後回報裝置驗證錯誤，請使用
[Podman 和 Tailscale](#podman--tailscale) 中的 Tailscale 指引。

<a id="podman--tailscale"></a>

## Podman 和 Tailscale

若要使用 HTTPS 或遠端瀏覽器存取，請遵循主要 Tailscale 文件。

Podman 特定注意事項：

- 將 Podman 發布主機維持在 `127.0.0.1`。
- 偏好使用主機管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本機瀏覽器裝置驗證內容不可靠，請改用 Tailscale 存取，而不是臨時的本機通道變通方法。

參見：

- [Tailscale](/zh-TW/gateway/tailscale)
- [控制介面](/zh-TW/web/control-ui)

## Systemd（Quadlet，選用）

如果你執行了 `./scripts/podman/setup.sh --quadlet`，設定會在以下位置安裝 Quadlet 檔案：

```bash
~/.config/containers/systemd/openclaw.container
```

實用命令：

- **啟動：** `systemctl --user start openclaw.service`
- **停止：** `systemctl --user stop openclaw.service`
- **狀態：** `systemctl --user status openclaw.service`
- **日誌：** `journalctl --user -u openclaw.service -f`

編輯 Quadlet 檔案後：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

若要在 SSH/無頭主機上保留開機持續性，請為目前使用者啟用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 設定、環境與儲存

- **設定目錄：** `~/.openclaw`
- **工作區目錄：** `~/.openclaw/workspace`
- **Token 檔案：** `~/.openclaw/.env`
- **啟動輔助程式：** `./scripts/run-openclaw-podman.sh`

啟動指令稿和 Quadlet 會將主機狀態 bind mount 到容器中：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

預設情況下，這些是主機目錄，而不是匿名容器狀態，因此
`openclaw.json`、每個 agent 的 `auth-profiles.json`、通道/提供者狀態、
工作階段和工作區會在容器替換後保留下來。
Podman 設定也會為已發布的閘道連接埠上的 `127.0.0.1` 和 `localhost` 預先填入 `gateway.controlUi.allowedOrigins`，讓本機儀表板可搭配容器的非 local loopback 繫結運作。

手動啟動器的實用環境變數：

- `OPENCLAW_PODMAN_CONTAINER` -- 容器名稱（預設為 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 要執行的映像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- 對應到容器 `18789` 的主機連接埠
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- 對應到容器 `18790` 的主機連接埠
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 已發布連接埠的主機介面；預設為 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- 容器內的閘道繫結模式；預設為 `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（預設）、`auto` 或 `host`

手動啟動器會在完成容器/映像預設值前讀取 `~/.openclaw/.env`，因此你可以將這些設定保存在該檔案中。

如果你使用非預設的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，請為 `./scripts/podman/setup.sh` 和之後的 `./scripts/run-openclaw-podman.sh launch` 命令設定相同變數。Repo 本機啟動器不會跨 shell 保留自訂路徑覆寫。

Quadlet 注意事項：

- 產生的 Quadlet 服務刻意維持固定且強化的預設形狀：`127.0.0.1` 發布連接埠、容器內 `--bind lan`，以及 `keep-id` 使用者命名空間。
- 它會固定設定 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。
- 它會同時發布 `127.0.0.1:18789:18789`（閘道）和 `127.0.0.1:18790:18790`（bridge）。
- 它會將 `~/.openclaw/.env` 作為執行階段 `EnvironmentFile` 讀取，用於 `OPENCLAW_GATEWAY_TOKEN` 等值，但不會使用手動啟動器的 Podman 特定覆寫允許清單。
- 如果你需要自訂發布連接埠、發布主機或其他容器執行旗標，請使用手動啟動器，或直接編輯 `~/.config/containers/systemd/openclaw.container`，然後重新載入並重新啟動服務。

## 實用命令

- **容器日誌：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **從主機命令列介面開啟儀表板 URL：** `openclaw dashboard --no-open`
- **透過主機命令列介面檢查健康/狀態：** `openclaw gateway status --deep`（RPC 探測 + 額外
  服務掃描）

## 疑難排解

- **設定或工作區發生權限遭拒（EACCES）：** 容器預設會以 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 執行。請確保主機設定/工作區路徑由目前使用者擁有。
- **閘道啟動受阻（缺少 `gateway.mode=local`）：** 請確保 `~/.openclaw/openclaw.json` 存在且設定 `gateway.mode="local"`。`scripts/podman/setup.sh` 會在缺少時建立它。
- **容器命令列介面命令打到錯誤目標：** 明確使用 `openclaw --container <name> ...`，或在 shell 中匯出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 搭配 `--container` 失敗：** 這是預期行為。請重新建置/拉取映像，然後重新啟動容器或 Quadlet 服務。
- **Quadlet 服務未啟動：** 執行 `systemctl --user daemon-reload`，然後執行 `systemctl --user start openclaw.service`。在無頭系統上，你可能也需要 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻擋 bind mount：** 保持預設掛載行為；當 Linux 上 SELinux 處於 enforcing 或 permissive 時，啟動器會自動加入 `:Z`。

## 相關

- [Docker](/zh-TW/install/docker)
- [閘道背景程序](/zh-TW/gateway/background-process)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
