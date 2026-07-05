---
read_when:
    - 你想要使用 Podman 而非 Docker 的容器化閘道
summary: 在無 root 權限的 Podman 容器中執行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-07-05T11:24:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70b35745eb2ecee734fe686d2f4eb19f462214fbf40fca19fc906ea73d5d28c0
    source_path: install/podman.md
    workflow: 16
---

在由目前非 root 使用者管理的 rootless Podman 容器中執行 OpenClaw 閘道。

模型：

- Podman 執行閘道容器。
- 主機上的 `openclaw` 命令列介面是控制平面。
- 永久狀態預設存放在主機的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或獨立的服務使用者。

## 先決條件

- **Podman**，採 rootless 模式
- 主機上已安裝 **OpenClaw 命令列介面**
- **選用：** 如果你想要由 Quadlet 管理自動啟動，需有 `systemd --user`
- **選用：** 只有在無頭主機上需要啟動後持續執行時，才需要 `sudo` 來執行 `loginctl enable-linger "$(whoami)"`

## 快速開始

<Steps>
  <Step title="一次性設定">
    從 repo 根目錄執行 `./scripts/podman/setup.sh`。

    這會在你的 rootless Podman 儲存區中建置 `openclaw:local`（或在已設定時拉取 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`），在缺少時建立含有 `gateway.mode: "local"` 的 `~/.openclaw/openclaw.json`，並在缺少時建立含有已產生 `OPENCLAW_GATEWAY_TOKEN` 的 `~/.openclaw/.env`。

    選用的建置時期環境變數：

    | 變數 | 效果 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | 使用既有或已拉取的映像，而不是建置 `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | 在映像建置期間安裝額外 apt 套件（也接受舊版 `OPENCLAW_DOCKER_APT_PACKAGES`） |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | 在映像建置期間安裝額外 Python 套件；請固定版本，且只使用你信任的套件索引 |
    | `OPENCLAW_EXTENSIONS` | 在建置時期預先安裝外掛相依項 |
    | `OPENCLAW_INSTALL_BROWSER` | 預先安裝 Chromium 與 Xvfb 以進行瀏覽器自動化（設為 `1`） |

    若要改用 Quadlet 管理的設定（僅限 Linux + systemd 使用者服務）：

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    或設定 `OPENCLAW_PODMAN_QUADLET=1`。

  </Step>

  <Step title="啟動閘道容器">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    以你目前的 uid/gid 搭配 `--userns=keep-id` 啟動容器，並將你的 OpenClaw 狀態 bind-mount 到容器中。

  </Step>

  <Step title="在容器內執行初始設定">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    接著開啟 `http://127.0.0.1:18789/`，並使用 `~/.openclaw/.env` 中的權杖。

    模型驗證：在設定期間使用 OpenClaw 管理的驗證（Anthropic API keys，或用於 Codex 支援 OpenAI 的 OpenAI Codex 瀏覽器 OAuth/裝置碼驗證）。Podman 啟動器不會將主機命令列介面的憑證家目錄（例如 `~/.claude` 或 `~/.codex`）掛載到設定或閘道容器中。既有主機命令列介面登入只是在同一主機上的便利路徑；對容器安裝而言，請將提供者驗證保留在設定流程管理、且已掛載的 `~/.openclaw` 狀態中。

  </Step>

  <Step title="從主機命令列介面管理執行中的容器">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    接著一般 `openclaw` 命令會自動在該容器內執行：

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # includes extra service scan
    openclaw doctor
    openclaw channels login
    ```

    在 macOS 上，Podman machine 可能會讓瀏覽器對閘道而言看起來不是本機。若控制介面在啟動後回報裝置驗證錯誤，請使用 [Podman 與 Tailscale](#podman-and-tailscale) 中的 Tailscale 指引。

  </Step>
</Steps>

手動啟動器只會從 `~/.openclaw/.env` 讀取少量 Podman 相關金鑰的允許清單，並將明確的執行時期環境變數傳給容器；它不會把完整的環境檔交給 Podman。

<a id="podman-and-tailscale"></a>

## Podman 與 Tailscale

若要使用 HTTPS 或遠端瀏覽器存取，請遵循主要的 Tailscale 文件。

Podman 特定注意事項：

- 將 Podman 發布主機維持在 `127.0.0.1`。
- 優先使用主機管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本機瀏覽器裝置驗證情境不可靠，請使用 Tailscale 存取，而不是臨時的本機通道替代方案。

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 與 [控制介面](/zh-TW/web/control-ui)。

## Systemd（Quadlet，選用）

如果你執行了 `./scripts/podman/setup.sh --quadlet`，設定流程會在 `~/.config/containers/systemd/openclaw.container` 安裝 Quadlet 檔案。

| 動作 | 命令                                    |
| ------ | ------------------------------------------ |
| 啟動  | `systemctl --user start openclaw.service`  |
| 停止   | `systemctl --user stop openclaw.service`   |
| 狀態 | `systemctl --user status openclaw.service` |
| 日誌   | `journalctl --user -u openclaw.service -f` |

編輯 Quadlet 檔案後：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

若要在 SSH/無頭主機上開機後持續執行，請為目前使用者啟用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

產生的 Quadlet 服務會維持固定且強化的預設形態：發布於 `127.0.0.1` 的連接埠（`18789` 閘道、`18790` bridge）、容器內的 `--bind lan`、`keep-id` 使用者命名空間、`OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 與 `TimeoutStartSec=300`。它會將 `~/.openclaw/.env` 作為執行時期 `EnvironmentFile` 讀取，例如 `OPENCLAW_GATEWAY_TOKEN` 等值，但不會使用手動啟動器的 Podman 特定覆寫允許清單。若要自訂發布連接埠、發布主機或其他容器執行旗標，請改用手動啟動器，或直接編輯 `~/.config/containers/systemd/openclaw.container`，然後重新載入並重新啟動服務。

## 設定、環境與儲存

- **設定目錄：** `~/.openclaw`
- **工作區目錄：** `~/.openclaw/workspace`
- **權杖檔案：** `~/.openclaw/.env`
- **啟動輔助程式：** `./scripts/run-openclaw-podman.sh`

啟動指令碼與 Quadlet 會將主機狀態 bind-mount 到容器中：`OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`，`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`。預設這些是主機目錄，而不是匿名容器狀態，因此 `openclaw.json`、每個代理程式的 `auth-profiles.json`、頻道/提供者狀態、工作階段與工作區都會在替換容器後保留下來。設定流程也會為發布的閘道連接埠植入適用於 `127.0.0.1` 與 `localhost` 的 `gateway.controlUi.allowedOrigins`，讓本機儀表板可搭配容器的非 loopback 綁定使用。

手動啟動器可用的環境變數（將這些保存在 `~/.openclaw/.env`；啟動器會在最終確定容器/映像預設值前讀取該檔案）：

| 變數                                        | 預設值          | 效果                                 |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | 容器名稱                         |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 要執行的映像                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | 對應至容器 `18789` 的主機連接埠  |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | 對應至容器 `18790` 的主機連接埠  |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 發布連接埠使用的主機介面     |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | 容器內的閘道綁定模式 |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`、`auto` 或 `host`           |

如果你使用非預設的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，請為 `./scripts/podman/setup.sh` 與後續的 `./scripts/run-openclaw-podman.sh launch` 命令設定相同變數；repo 本機啟動器不會跨 shell 保留自訂路徑覆寫。

## 實用命令

- **容器日誌：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **從主機命令列介面開啟儀表板 URL：** `openclaw dashboard --no-open`
- **透過主機命令列介面查看健康狀態/狀態：** `openclaw gateway status --deep`（RPC 探測 + 額外服務掃描）

## 疑難排解

- **設定或工作區出現權限被拒（EACCES）：** 容器預設使用 `--userns=keep-id` 與 `--user <your uid>:<your gid>` 執行。請確認主機設定/工作區路徑的擁有者是你目前的使用者。
- **閘道啟動遭封鎖（缺少 `gateway.mode=local`）：** 請確認 `~/.openclaw/openclaw.json` 存在，且設定 `gateway.mode="local"`。`scripts/podman/setup.sh` 會在缺少時建立它。
- **容器命令列介面命令打到錯誤目標：** 明確使用 `openclaw --container <name> ...`，或在 shell 中匯出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 搭配 `--container` 失敗：** 這是預期行為。請重新建置/拉取映像，然後重新啟動容器或 Quadlet 服務。
- **Quadlet 服務無法啟動：** 執行 `systemctl --user daemon-reload`，然後執行 `systemctl --user start openclaw.service`。在無頭系統上，你可能也需要執行 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 封鎖 bind mount：** 保持預設掛載行為不變；當 Linux 上 SELinux 處於 enforcing 或 permissive 時，啟動器會自動加上 `:Z`。

## 相關

- [Docker](/zh-TW/install/docker)
- [閘道背景程序](/zh-TW/gateway/background-process)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
