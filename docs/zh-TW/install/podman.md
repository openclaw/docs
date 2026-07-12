---
read_when:
    - 你想使用 Podman 而非 Docker 建立容器化閘道
summary: 在無 root 權限的 Podman 容器中執行 OpenClaw
title: Podman
x-i18n:
    generated_at: "2026-07-12T14:35:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

在由目前的非 root 使用者管理的無 root Podman 容器中執行 OpenClaw 閘道。

運作模式：

- Podman 執行閘道容器。
- 主機上的 `openclaw` 命令列介面作為控制平面。
- 持久狀態預設儲存在主機的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或個別的服務使用者。

## 先決條件

- 以無 root 模式執行的 **Podman**
- 主機上已安裝 **OpenClaw 命令列介面**
- **選用：**若要使用 Quadlet 管理自動啟動，需有 `systemd --user`
- **選用：**只有在無介面主機上要使用 `loginctl enable-linger "$(whoami)"` 讓服務於開機後持續執行時，才需要 `sudo`

## 快速開始

<Steps>
  <Step title="一次性設定">
    從儲存庫根目錄執行 `./scripts/podman/setup.sh`。

    此命令會在你的無 root Podman 儲存區中建置 `openclaw:local`（若已設定 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，則改為拉取該映像檔）；如果缺少 `~/.openclaw/openclaw.json`，會建立該檔案並設定 `gateway.mode: "local"`；如果缺少 `~/.openclaw/.env`，則會建立該檔案並產生 `OPENCLAW_GATEWAY_TOKEN`。

    選用的建置階段環境變數：

    | 變數 | 效果 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | 使用現有或已拉取的映像檔，而不是建置 `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | 在建置映像檔期間安裝額外的 apt 套件（也接受舊版的 `OPENCLAW_DOCKER_APT_PACKAGES`） |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | 在建置映像檔期間安裝額外的 Python 套件；請鎖定版本，且僅使用你信任的套件索引 |
    | `OPENCLAW_EXTENSIONS` | 編譯並封裝所選且受支援的外掛，並安裝其執行階段相依套件 |
    | `OPENCLAW_INSTALL_BROWSER` | 預先安裝 Chromium 和 Xvfb 以進行瀏覽器自動化（設為 `1`） |

    若要改用 Quadlet 管理的設定（僅適用於 Linux + systemd 使用者服務）：

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    或設定 `OPENCLAW_PODMAN_QUADLET=1`。

  </Step>

  <Step title="啟動閘道容器">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    使用 `--userns=keep-id`，以你目前的 uid/gid 啟動容器，並將你的 OpenClaw 狀態以繫結掛載方式掛載至容器中。

  </Step>

  <Step title="在容器內執行初始設定">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    接著開啟 `http://127.0.0.1:18789/`，並使用 `~/.openclaw/.env` 中的權杖。

    模型驗證：在設定期間使用由 OpenClaw 管理的驗證（Anthropic API 金鑰，或針對由 Codex 支援的 OpenAI，使用 OpenAI Codex 瀏覽器 OAuth／裝置代碼驗證）。Podman 啟動程式不會將 `~/.claude` 或 `~/.codex` 等主機命令列介面認證資訊目錄掛載至設定或閘道容器中。主機上現有的命令列介面登入僅是同一主機上的便利途徑；若使用容器安裝，請將供應商驗證資訊保存在設定流程所管理、已掛載的 `~/.openclaw` 狀態中。

  </Step>

  <Step title="從主機命令列介面管理執行中的容器">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    接著，一般的 `openclaw` 命令會自動在該容器中執行：

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # 包含額外的服務掃描
    openclaw doctor
    openclaw channels login
    ```

    在 macOS 上，Podman machine 可能會讓瀏覽器在閘道看來並非來自本機。如果啟動後控制介面回報裝置驗證錯誤，請依照 [Podman 與 Tailscale](#podman-and-tailscale) 中的 Tailscale 指引操作。

  </Step>
</Steps>

手動啟動程式只會從 `~/.openclaw/.env` 讀取少量允許的 Podman 相關鍵，並將明確的執行階段環境變數傳給容器；它不會將完整的環境變數檔案交給 Podman。

<a id="podman-and-tailscale"></a>

## Podman 與 Tailscale

若要透過 HTTPS 或遠端瀏覽器存取，請依照主要的 Tailscale 文件操作。

Podman 特定注意事項：

- 將 Podman 的發布主機維持為 `127.0.0.1`。
- 優先使用由主機管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本機瀏覽器的裝置驗證環境不可靠，請使用 Tailscale 存取，而不要採用臨時的本機通道因應方式。

請參閱 [Tailscale](/zh-TW/gateway/tailscale) 和[控制介面](/zh-TW/web/control-ui)。

## Systemd（Quadlet，選用）

如果你執行了 `./scripts/podman/setup.sh --quadlet`，設定程式會在 `~/.config/containers/systemd/openclaw.container` 安裝 Quadlet 檔案。

| 動作 | 命令                                       |
| ---- | ------------------------------------------ |
| 啟動 | `systemctl --user start openclaw.service`  |
| 停止 | `systemctl --user stop openclaw.service`   |
| 狀態 | `systemctl --user status openclaw.service` |
| 日誌 | `journalctl --user -u openclaw.service -f` |

編輯 Quadlet 檔案後：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

若要讓服務在 SSH／無介面主機開機後持續執行，請為目前的使用者啟用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

產生的 Quadlet 服務會維持固定且強化的預設配置：發布在 `127.0.0.1` 的連接埠（`18789` 閘道、`18790` 橋接）、容器內使用 `--bind lan`、`keep-id` 使用者命名空間、`OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure`，以及 `TimeoutStartSec=300`。它會將 `~/.openclaw/.env` 讀取為執行階段 `EnvironmentFile`，以取得 `OPENCLAW_GATEWAY_TOKEN` 等值，但不會使用手動啟動程式的 Podman 特定覆寫允許清單。若要自訂發布連接埠、發布主機或其他容器執行旗標，請改用手動啟動程式，或直接編輯 `~/.config/containers/systemd/openclaw.container`，然後重新載入並重新啟動服務。

## 設定、環境變數與儲存空間

- **設定目錄：**`~/.openclaw`
- **工作區目錄：**`~/.openclaw/workspace`
- **權杖檔案：**`~/.openclaw/.env`
- **啟動輔助程式：**`./scripts/run-openclaw-podman.sh`

啟動指令碼和 Quadlet 會將主機狀態以繫結掛載方式掛載至容器：`OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`、`OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`。這些位置預設是主機目錄，而不是匿名容器狀態，因此在更換容器後，`openclaw.json`、各代理程式的 `auth-profiles.json`、頻道／供應商狀態、工作階段及工作區仍會保留。設定流程也會在發布的閘道連接埠上，為 `127.0.0.1` 和 `localhost` 預先設定 `gateway.controlUi.allowedOrigins`，讓本機儀表板能配合容器的非回送位址繫結正常運作。

手動啟動程式可用的環境變數（請將這些變數保存在 `~/.openclaw/.env`；啟動程式會在確定最終容器／映像檔預設值之前讀取該檔案）：

| 變數                                       | 預設值           | 效果                                   |
| ------------------------------------------ | ---------------- | -------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | 容器名稱                               |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 要執行的映像檔                         |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | 對應至容器 `18789` 的主機連接埠        |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | 對應至容器 `18790` 的主機連接埠        |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 發布連接埠使用的主機介面               |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | 容器內的閘道繫結模式                   |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`、`auto` 或 `host`            |

如果使用非預設的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，請在執行 `./scripts/podman/setup.sh` 與後續的 `./scripts/run-openclaw-podman.sh launch` 命令時設定相同的變數；儲存庫內的啟動程式不會跨 shell 保留自訂路徑覆寫。

## 升級映像檔

重新建置或拉取新映像檔後，請重新啟動容器或 Quadlet 服務。
新的 OpenClaw 版本首次啟動時，閘道會先執行安全的狀態與
外掛修復，再回報已就緒。

如果閘道直接結束而未進入就緒狀態，請針對相同的已掛載狀態／設定，
使用相同映像檔執行一次 `openclaw doctor --fix`，然後再以一般方式重新啟動
閘道：

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

在 SELinux 主機上，如果 Podman 封鎖對已掛載狀態的存取，請在兩個繫結掛載後加上 `,Z`。

## 實用命令

- **容器日誌：**`podman logs -f openclaw`
- **停止容器：**`podman stop openclaw`
- **移除容器：**`podman rm -f openclaw`
- **從主機命令列介面開啟儀表板 URL：**`openclaw dashboard --no-open`
- **透過主機命令列介面檢查健康狀態／狀態：**`openclaw gateway status --deep`（RPC 探測 + 額外服務掃描）

## 疑難排解

- **設定或工作區發生權限遭拒（EACCES）：**容器預設使用 `--userns=keep-id` 和 `--user <your uid>:<your gid>` 執行。請確認主機上的設定／工作區路徑由目前的使用者擁有。
- **閘道啟動遭封鎖（缺少 `gateway.mode=local`）：**請確認 `~/.openclaw/openclaw.json` 存在，且已設定 `gateway.mode="local"`。如果缺少此設定，`scripts/podman/setup.sh` 會建立它。
- **映像檔更新後容器反覆重新啟動：**執行[升級映像檔](#upgrading-images)中的一次性 `openclaw doctor --fix` 命令，然後再次啟動閘道。
- **容器命令列介面命令連到錯誤的目標：**明確使用 `openclaw --container <name> ...`，或在 shell 中匯出 `OPENCLAW_CONTAINER=<name>`。
- **使用 `--container` 時 `openclaw update` 失敗：**這是預期行為。請重新建置／拉取映像檔，然後重新啟動容器或 Quadlet 服務。
- **Quadlet 服務未啟動：**執行 `systemctl --user daemon-reload`，接著執行 `systemctl --user start openclaw.service`。在無介面系統上，你可能還需要執行 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 封鎖繫結掛載：**請維持預設掛載行為；當 Linux 上的 SELinux 處於強制或寬容模式時，啟動程式會自動加上 `:Z`。

## 相關內容

- [Docker](/zh-TW/install/docker)
- [閘道背景處理程序](/zh-TW/gateway/background-process)
- [閘道疑難排解](/zh-TW/gateway/troubleshooting)
