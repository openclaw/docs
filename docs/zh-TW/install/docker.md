---
read_when:
    - 你想要使用容器化 Gateway，而不是本機安裝
    - 您正在驗證 Docker 流程
summary: OpenClaw 的選用 Docker 型設定與入門導引
title: Docker
x-i18n:
    generated_at: "2026-05-12T12:50:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 241db808dcdaa91df67a88b93d94de61cb4c2265de0e84a3b7f031166c94ee77
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。只有在你想使用容器化 Gateway，或想驗證 Docker 流程時才需要使用。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的 Gateway 環境，或想在沒有本機安裝的主機上執行 OpenClaw。
- **否**：你是在自己的電腦上執行，且只想要最快的開發迴圈。請改用一般安裝流程。
- **沙盒注意事項**：啟用沙盒時，預設沙盒後端會使用 Docker，但沙盒預設為關閉，且**不**需要讓完整 Gateway 在 Docker 中執行。SSH 和 OpenShell 沙盒後端也可使用。請參閱[沙盒](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用於映像檔建置（在 1 GB 主機上，`pnpm install` 可能因記憶體不足而被終止，並以 137 結束）
- 足夠的磁碟空間用於映像檔和記錄
- 如果在 VPS/公開主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  特別是 Docker `DOCKER-USER` 防火牆政策。

## 容器化 Gateway

<Steps>
  <Step title="建置映像檔">
    從 repo 根目錄執行設定腳本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機建置 Gateway 映像檔。若要改用預先建置的映像檔：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像檔發布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常見標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成 onboarding">
    設定腳本會自動執行 onboarding。它會：

    - 提示輸入提供者 API 金鑰
    - 產生 Gateway token 並寫入 `.env`
    - 建立 auth-profile 秘密金鑰目錄
    - 透過 Docker Compose 啟動 Gateway

    在設定期間，啟動前 onboarding 和設定寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 用於 Gateway 容器已存在後
    你要執行的命令。

  </Step>

  <Step title="開啟控制 UI">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將設定好的
    共用秘密貼到設定中。設定腳本預設會將 token 寫入 `.env`；如果你將容器設定切換為密碼驗證，請改用該密碼。

    需要再次取得 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="設定通道（選用）">
    使用 CLI 容器新增訊息通道：

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    文件：[WhatsApp](/zh-TW/channels/whatsapp)、[Telegram](/zh-TW/channels/telegram)、[Discord](/zh-TW/channels/discord)

  </Step>
</Steps>

### 手動流程

如果你偏好自行執行每個步驟，而不是使用設定腳本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
從 repo 根目錄執行 `docker compose`。如果你啟用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，設定腳本會寫入 `docker-compose.extra.yml`；
請用 `-f docker-compose.yml -f docker-compose.extra.yml` 包含它。
</Note>

<Note>
因為 `openclaw-cli` 共用 `openclaw-gateway` 的網路命名空間，所以它是
啟動後工具。在執行 `docker compose up -d openclaw-gateway` 之前，請透過
`openclaw-gateway` 搭配 `--no-deps --entrypoint node` 執行 onboarding
和設定時期的設定寫入。
</Note>

### 環境變數

設定腳本接受以下選用環境變數：

| 變數                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用遠端映像檔，而非在本機建置                                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 在建置期間安裝額外 apt 套件（以空格分隔）                       |
| `OPENCLAW_EXTENSIONS`                      | 在建置時包含選定的內建 plugin helper                           |
| `OPENCLAW_EXTRA_MOUNTS`                    | 額外主機 bind mount（以逗號分隔的 `source:target[:opts]`）      |
| `OPENCLAW_HOME_VOLUME`                     | 將 `/home/node` 保留在具名 Docker volume 中                     |
| `OPENCLAW_SANDBOX`                         | 選擇加入沙盒啟動程序（`1`、`true`、`yes`、`on`）                |
| `OPENCLAW_SKIP_ONBOARDING`                 | 略過互動式 onboarding 步驟（`1`、`true`、`yes`、`on`）          |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆寫 Docker socket 路徑                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 停用 Bonjour/mDNS 廣告（Docker 預設為 `1`）                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 停用內建 plugin 來源 bind-mount overlay                         |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 匯出的共用 OTLP/HTTP collector endpoint           |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | traces、metrics 或 logs 的特定訊號 OTLP endpoint                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 協定覆寫。目前只支援 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry resources 使用的服務名稱                          |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 選擇加入最新實驗性 GenAI 語意屬性                               |
| `OPENCLAW_OTEL_PRELOADED`                  | 當已有預先載入的 OpenTelemetry SDK 時，略過啟動第二個 SDK       |

維護者可以透過掛載一個 plugin 來源目錄到其封裝來源路徑上，針對封裝映像檔測試內建 plugin 來源，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該掛載的來源目錄會覆寫相同 plugin id 對應的已編譯
`/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出是從 Gateway 容器對你的 OTLP collector 的出站連線。
它不需要發布 Docker port。如果你在本機建置映像檔，並想讓內建的 OpenTelemetry 匯出器可在映像檔內使用，請包含其執行階段相依項：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在封裝的 Docker 安裝中，請先從 ClawHub 安裝官方
`@openclaw/diagnostics-otel` plugin，再啟用匯出。自訂 source-built 映像檔仍可透過
`OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本機 plugin 來源。若要啟用匯出，請在設定中允許並啟用
`diagnostics-otel` plugin，然後設定
`diagnostics.otel.enabled=true`，或使用 [OpenTelemetry
匯出](/zh-TW/gateway/opentelemetry)中的設定範例。Collector 驗證標頭是透過
`diagnostics.otel.headers` 設定，而不是透過 Docker 環境變數。

Prometheus metrics 使用已發布的 Gateway port。安裝
`clawhub:@openclaw/diagnostics-prometheus`、啟用
`diagnostics-prometheus` plugin，然後 scrape：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

該 route 受到 Gateway 驗證保護。不要暴露獨立的公開
`/metrics` port 或未經驗證的 reverse-proxy 路徑。請參閱
[Prometheus metrics](/zh-TW/gateway/prometheus)。

### 健康檢查

容器探測 endpoint（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 映像檔包含內建 `HEALTHCHECK`，會 ping `/healthz`。
如果檢查持續失敗，Docker 會將容器標記為 `unhealthy`，而
orchestration 系統可以重新啟動或替換它。

經驗證的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此透過 Docker port 發布時，主機可存取
`http://127.0.0.1:18789`。

- `lan`（預設）：主機瀏覽器和主機 CLI 可以連到已發布的 Gateway port。
- `loopback`：只有容器網路命名空間內的程序可以直接連到 Gateway。

<Note>
在 `gateway.bind` 中使用 bind mode 值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用像 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機提供者

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器本身，
不是你的主機。對於在主機上執行的 AI 提供者，請使用 `host.docker.internal`：

| 提供者    | 主機預設 URL            | Docker 設定 URL                     |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

內建 Docker 設定會將這些主機 URL 用作 LM Studio 和 Ollama
onboarding 預設值，而 `docker-compose.yml` 會將 `host.docker.internal` 對應到
Linux Docker Engine 的 Docker 主機 Gateway。Docker Desktop 在 macOS 和 Windows 上已提供相同 hostname。

主機服務也必須監聽 Docker 可連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 命令，請自行新增相同的主機對應，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge networking 通常無法可靠轉送 Bonjour/mDNS multicast
（`224.0.0.251:5353`）。因此，內建 Compose 設定預設為
`OPENCLAW_DISABLE_BONJOUR=1`，使 Gateway 不會在 bridge 丟棄 multicast 流量時 crash-loop 或反覆重新啟動廣告。

請對 Docker 主機使用已發布的 Gateway URL、Tailscale 或 wide-area DNS-SD。
只有在使用 host networking、macvlan，或另一個已知 mDNS multicast 可運作的網路時，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。

常見陷阱與疑難排解請參閱 [Bonjour discovery](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` bind-mount 到 `/home/node/.openclaw`，
將 `OPENCLAW_WORKSPACE_DIR` bind-mount 到 `/home/node/.openclaw/workspace`，並將
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` bind-mount 到 `/home/node/.config/openclaw`，因此這些
路徑會在容器替換後保留下來。當任何變數未設定時，內建
`docker-compose.yml` 會 fallback 到 `${HOME}` 底下；如果 `HOME` 本身也缺失，則 fallback 到
`/tmp`。這可避免 `docker compose up` 在裸環境中發出空來源
volume 規格。

該掛載的設定目錄是 OpenClaw 存放以下內容的位置：

- `openclaw.json`：行為設定
- `agents/<agentId>/agent/auth-profiles.json`：已儲存的提供者 OAuth/API-key 驗證
- `.env`：env-backed 執行階段秘密，例如 `OPENCLAW_GATEWAY_TOKEN`

auth-profile 秘密金鑰目錄會儲存用於
OAuth-backed auth profile token material 的本機加密金鑰。請將它與你的 Docker 主機狀態一起保留，
但與 `OPENCLAW_CONFIG_DIR` 分開。

已安裝的可下載 Plugin 會將其套件狀態儲存在掛載的
OpenClaw home 底下，因此 Plugin 安裝記錄與套件根目錄會在容器
替換後保留下來。Gateway 啟動時不會產生內建 Plugin 的依賴樹。

如需 VM 部署的完整持久化詳細資訊，請參閱
[Docker VM 執行階段 - 哪些內容持久保存在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：**監看 `media/`、工作階段 JSONL 檔案、
`cron/runs/*.jsonl`、已安裝 Plugin 套件根目錄，以及
`/tmp/openclaw/` 底下的滾動檔案日誌。

### Shell 輔助工具（選用）

為了讓日常 Docker 管理更容易，請安裝 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你先前是從較舊的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路徑安裝 ClawDock，請重新執行上方的安裝命令，讓本機輔助工具檔案追蹤新位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。執行
`clawdock-help` 查看所有命令。
完整輔助工具指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="啟用 Docker gateway 的代理沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自訂 socket 路徑（例如 rootless Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    此腳本只會在沙箱必要條件通過後掛載 `docker.sock`。如果
    沙箱設定無法完成，腳本會將 `agents.defaults.sandbox.mode`
    重設為 `off`。在 OpenClaw 沙箱啟用時，Codex 程式碼模式回合仍會受限於 Codex
    `workspace-write`；請勿將
    主機 Docker socket 掛載到代理沙箱容器中。

  </Accordion>

  <Accordion title="自動化 / CI（非互動式）">
    使用 `-T` 停用 Compose pseudo-TTY 配置：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共用網路安全性注意事項">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI
    命令可以透過 `127.0.0.1` 連到 gateway。請將這視為共用的
    信任邊界。Compose 設定會在 `openclaw-gateway` 與 `openclaw-cli`
    上停用 `NET_RAW`/`NET_ADMIN`，並啟用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 失敗">
    某些 Docker Desktop 設定在停用 `NET_RAW` 後，會讓共用網路
    `openclaw-cli` sidecar 的 DNS 查詢失敗，表現為
    npm 支援命令（例如 `openclaw plugins install`）期間出現 `EAI_AGAIN`。
    一般 gateway 操作請保留預設的強化 Compose 檔案。下方的
    本機覆寫會透過還原 Docker 預設 capabilities 放寬 CLI 容器的安全態勢，
    因此只應用於需要套件 registry 存取的一次性 CLI
    命令，而不要作為預設 Compose
    呼叫：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已建立長時間執行的 `openclaw-cli` 容器，請使用相同覆寫重新建立它。
    `docker compose exec` 和 `docker exec` 無法
    變更已建立容器的 Linux capabilities。

  </Accordion>

  <Accordion title="權限與 EACCES">
    映像以 `node`（uid 1000）執行。如果你在
    `/home/node/.openclaw` 看到權限錯誤，請確認你的主機 bind mount 由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    相同的不相符狀況可能顯示為 Plugin 警告，例如
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    後接 `plugin present but blocked`。這表示程序 uid 與
    掛載的 Plugin 目錄擁有者不一致。建議以
    預設 uid 1000 執行容器並修正 bind mount 擁有權。只有在你有意長期以 root 執行
    OpenClaw 時，才將
    `/path/to/openclaw-config/npm` chown 為 `root:root`。

  </Accordion>

  <Accordion title="更快的重建">
    排列 Dockerfile，讓依賴層可被快取。這可避免在 lockfile 未變更時重新執行
    `pnpm install`：

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="進階使用者容器選項">
    預設映像以安全性優先，並以非 root `node` 執行。若要使用功能更完整的容器：

    1. **持久保存 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **烘焙系統依賴**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **烘焙 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`
    4. **或將 Playwright 瀏覽器安裝到持久化 volume**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **持久保存瀏覽器下載項目**：使用 `OPENCLAW_HOME_VOLUME` 或
       `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 會在 Linux 上自動偵測 Docker 映像中由
       Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（無頭 Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟瀏覽器 URL。在
    Docker 或無頭設定中，請複製你最後到達的完整重新導向 URL，並貼回
    精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像中繼資料">
    主要 Docker 執行階段映像使用 `node:24-bookworm-slim`，並包含 `tini` 作為進入點 init 程序（PID 1），以確保在長時間執行的容器中能正確回收殭屍程序並處理信號。它會發布 OCI 基礎映像 annotations，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。Node 基礎 digest 會
    透過 Dependabot Docker 基礎映像 PR 重新整理；release 建置不會執行
    distro 升級層。請參閱
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner (Docker VPS)](/zh-TW/install/hetzner) 和
[Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)，了解共用 VM 部署步驟，
包括 binary 烘焙、持久化與更新。

## 代理沙箱

當 `agents.defaults.sandbox` 以 Docker 後端啟用時，gateway
會在隔離的 Docker 容器中執行代理工具執行（shell、檔案讀取/寫入等），而 gateway 本身仍留在主機上。這會在不將整個
gateway 容器化的情況下，為不受信任或多租戶代理工作階段提供硬隔離。

沙箱範圍可以是每個代理（預設）、每個工作階段或共用。每個範圍
都有自己的工作區掛載在 `/workspace`。你也可以設定
允許/拒絕工具政策、網路隔離、資源限制，以及瀏覽器
容器。

如需完整設定、映像、安全性注意事項與多代理設定檔，請參閱：

- [沙箱化](/zh-TW/gateway/sandboxing) -- 完整沙箱參考
- [OpenShell](/zh-TW/gateway/openshell) -- 對沙箱容器的互動式 shell 存取
- [多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理的覆寫

### 快速啟用

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

建置預設沙箱映像（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh
```

若是沒有原始碼 checkout 的 npm 安裝，請參閱 [沙箱化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得行內 `docker build` 命令。

## 疑難排解

<AccordionGroup>
  <Accordion title="缺少映像或沙箱容器未啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （原始碼 checkout）或 [沙箱化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的行內 `docker build` 命令（npm install）建置沙箱映像，
    或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像。
    容器會依需求為每個工作階段自動建立。
  </Accordion>

  <Accordion title="沙箱中的權限錯誤">
    將 `docker.user` 設為符合你掛載工作區擁有權的 UID:GID，
    或 chown 工作區資料夾。
  </Accordion>

  <Accordion title="沙箱中找不到自訂工具">
    OpenClaw 會使用 `sh -lc`（login shell）執行命令，這會載入
    `/etc/profile`，且可能重設 PATH。將 `docker.env.PATH` 設為在前方加入你的
    自訂工具路徑，或在你的 Dockerfile 中於 `/etc/profile.d/` 底下新增腳本。
  </Accordion>

  <Accordion title="映像建置期間因 OOM 被終止（exit 137）">
    VM 至少需要 2 GB RAM。請使用更大的機器類型後重試。
  </Accordion>

  <Accordion title="Control UI 中未授權或需要配對">
    擷取新的 dashboard 連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多詳細資訊：[Dashboard](/zh-TW/web/dashboard)、[Devices](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目標顯示 ws://172.x.x.x 或 Docker CLI 發生配對錯誤">
    重設 gateway 模式與 bind：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相關

- [安裝總覽](/zh-TW/install) — 所有安裝方法
- [Podman](/zh-TW/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-TW/install/clawdock) — Docker Compose 社群設定
- [更新](/zh-TW/install/updating) — 讓 OpenClaw 保持最新
- [設定](/zh-TW/gateway/configuration) — 安裝後的 gateway 設定
