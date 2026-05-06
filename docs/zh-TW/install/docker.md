---
read_when:
    - 你想要容器化 Gateway，而非本機安裝
    - 你正在驗證 Docker 流程
summary: 以 Docker 為基礎的 OpenClaw 選用設定與入門導覽
title: Docker
x-i18n:
    generated_at: "2026-05-06T09:12:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85ef98f0524c018dad280788dc83c7afaadc077ebe4509ae2c0b8b3bea1474df
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**項目。只有在你想要容器化的 Gateway，或想驗證 Docker 流程時才使用它。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的 Gateway 環境，或想在沒有本機安裝項目的主機上執行 OpenClaw。
- **否**：你正在自己的機器上執行，而且只想要最快的開發迴圈。請改用一般安裝流程。
- **沙箱化注意事項**：啟用沙箱化時，預設沙箱後端會使用 Docker，但沙箱化預設為關閉，且**不**需要讓完整 Gateway 在 Docker 中執行。也可使用 SSH 與 OpenShell 沙箱後端。請參閱[沙箱化](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用於映像建置（在 1 GB 主機上，`pnpm install` 可能會因 OOM 被終止並以 137 結束）
- 足夠的磁碟空間存放映像與日誌
- 如果在 VPS/公開主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  特別是 Docker `DOCKER-USER` 防火牆政策。

## 容器化 Gateway

<Steps>
  <Step title="建置映像">
    從 repo 根目錄執行設定指令碼：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機建置 Gateway 映像。若要改用預先建置的映像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像會發布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常用標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成上線設定">
    設定指令碼會自動執行上線設定。它會：

    - 提示輸入提供者 API 金鑰
    - 產生 Gateway 權杖並寫入 `.env`
    - 透過 Docker Compose 啟動 Gateway

    設定期間，啟動前上線設定與設定檔寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 則用於 Gateway 容器已存在後
    你要執行的命令。

  </Step>

  <Step title="開啟控制 UI">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將設定好的
    共用祕密貼到設定中。設定指令碼預設會將權杖寫入 `.env`；
    如果你將容器設定切換為密碼驗證，請改用該密碼。

    需要再次取得 URL 嗎？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="設定頻道（選用）">
    使用 CLI 容器加入訊息頻道：

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

如果你偏好自行執行每個步驟，而不是使用設定指令碼：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
請從 repo 根目錄執行 `docker compose`。如果你啟用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，設定指令碼會寫入 `docker-compose.extra.yml`；
請搭配 `-f docker-compose.yml -f docker-compose.extra.yml` 納入它。
</Note>

<Note>
由於 `openclaw-cli` 共享 `openclaw-gateway` 的網路命名空間，因此它是
啟動後工具。在執行 `docker compose up -d openclaw-gateway` 之前，請透過
`openclaw-gateway` 搭配 `--no-deps --entrypoint node` 執行上線設定
與設定期間的設定檔寫入。
</Note>

### 環境變數

設定指令碼接受下列選用環境變數：

| 變數                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用遠端映像，而不是在本機建置                                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 建置期間安裝額外 apt 套件（以空格分隔）                         |
| `OPENCLAW_EXTENSIONS`                      | 建置期間包含選定的隨附 Plugin 輔助項目                          |
| `OPENCLAW_EXTRA_MOUNTS`                    | 額外主機繫結掛載（以逗號分隔的 `source:target[:opts]`）         |
| `OPENCLAW_HOME_VOLUME`                     | 將 `/home/node` 持久化到具名 Docker volume                      |
| `OPENCLAW_SANDBOX`                         | 選擇加入沙箱啟動程序（`1`、`true`、`yes`、`on`）                |
| `OPENCLAW_SKIP_ONBOARDING`                 | 略過互動式上線設定步驟（`1`、`true`、`yes`、`on`）              |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆寫 Docker socket 路徑                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 停用 Bonjour/mDNS 廣播（Docker 預設為 `1`）                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 停用隨附 Plugin 原始碼 bind-mount overlay                       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 匯出的共用 OTLP/HTTP 收集器端點                   |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 追蹤、指標或日誌的訊號專用 OTLP 端點                            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 通訊協定覆寫。目前僅支援 `http/protobuf`                   |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry 資源使用的服務名稱                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 選擇加入最新實驗性 GenAI 語意屬性                               |
| `OPENCLAW_OTEL_PRELOADED`                  | 已預先載入一個 OpenTelemetry SDK 時，略過啟動第二個 SDK         |

維護者可以透過將某個 Plugin 原始碼目錄掛載到其封裝原始碼路徑之上，
測試隨附 Plugin 原始碼與封裝映像的搭配，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該已掛載的原始碼目錄會針對相同 Plugin id 覆寫相符的已編譯
`/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出會從 Gateway 容器向外連到你的 OTLP
收集器。它不需要發布 Docker 連接埠。如果你在本機建置映像，並希望映像內可使用隨附的 OpenTelemetry 匯出器，請包含其執行階段相依項：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在封裝式 Docker 安裝中，請先從 ClawHub 安裝官方
`@openclaw/diagnostics-otel` Plugin，再啟用匯出。自訂原始碼建置映像仍可透過
`OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本機 Plugin 原始碼。
若要啟用匯出，請在設定中允許並啟用 `diagnostics-otel` Plugin，然後設定
`diagnostics.otel.enabled=true`，或使用 [OpenTelemetry
匯出](/zh-TW/gateway/opentelemetry)中的設定範例。收集器驗證標頭透過
`diagnostics.otel.headers` 設定，而不是透過 Docker 環境變數。

Prometheus 指標使用已發布的 Gateway 連接埠。安裝
`clawhub:@openclaw/diagnostics-prometheus`、啟用
`diagnostics-prometheus` Plugin，然後抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

該路由受 Gateway 驗證保護。請勿暴露單獨的公開
`/metrics` 連接埠或未驗證的反向代理路徑。請參閱
[Prometheus 指標](/zh-TW/gateway/prometheus)。

### 健康檢查

容器探測端點（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 映像包含內建 `HEALTHCHECK`，會 ping `/healthz`。
如果檢查持續失敗，Docker 會將容器標示為 `unhealthy`，
而編排系統可以重新啟動或取代它。

經驗證的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 與 loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此透過 Docker 連接埠發布時，主機可存取
`http://127.0.0.1:18789`。

- `lan`（預設）：主機瀏覽器與主機 CLI 可以連到已發布的 Gateway 連接埠。
- `loopback`：只有容器網路命名空間內的行程可以直接連到
  Gateway。

<Note>
請在 `gateway.bind` 中使用 bind mode 值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），而不是 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機提供者

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器本身，
不是你的主機。對在主機上執行的 AI 提供者，請使用 `host.docker.internal`：

| 提供者    | 主機預設 URL            | Docker 設定 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

隨附的 Docker 設定會將這些主機 URL 作為 LM Studio 與 Ollama
上線設定預設值，且 `docker-compose.yml` 會在 Linux Docker Engine 上將
`host.docker.internal` 對應到 Docker 的主機 Gateway。Docker Desktop 已在
macOS 與 Windows 提供相同主機名稱。

主機服務也必須監聽 Docker 可連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 命令，請自行加入相同的主機對應，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge networking 通常無法可靠轉送 Bonjour/mDNS multicast
（`224.0.0.251:5353`）。因此，隨附的 Compose 設定預設
`OPENCLAW_DISABLE_BONJOUR=1`，避免 Gateway 在橋接網路丟棄 multicast 流量時崩潰循環或反覆重新啟動廣播。

Docker 主機請使用已發布的 Gateway URL、Tailscale，或廣域 DNS-SD。
只有在使用 host networking、macvlan，或其他已知 mDNS multicast 可正常運作的網路時，才設定
`OPENCLAW_DISABLE_BONJOUR=0`。

如需注意事項與疑難排解，請參閱 [Bonjour 探索](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` bind-mount 到 `/home/node/.openclaw`，並將
`OPENCLAW_WORKSPACE_DIR` bind-mount 到 `/home/node/.openclaw/workspace`，因此這些路徑會在容器取代後保留下來。當任一變數未設定時，隨附的
`docker-compose.yml` 會回退到 `${HOME}/.openclaw`（工作區掛載則為
`${HOME}/.openclaw/workspace`），或在 `HOME` 本身也缺少時回退到 `/tmp/.openclaw`。
這可避免 `docker compose up` 在空白環境中發出空來源 volume 規格。

該已掛載的設定目錄是 OpenClaw 存放下列項目的位置：

- 用於行為設定的 `openclaw.json`
- 用於已儲存提供者 OAuth/API-key 驗證的 `agents/<agentId>/agent/auth-profiles.json`
- 用於 env 支援的執行階段祕密（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

已安裝的可下載 Plugin 會將其套件狀態儲存在已掛載的 OpenClaw home 下，因此 Plugin 安裝記錄與套件根目錄會在容器取代後保留下來。Gateway 啟動不會產生隨附 Plugin 的相依性樹。

如需 VM 部署的完整持久化詳細資訊，請參閱
[Docker VM 執行階段 - 哪些項目持久化在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：** 留意 `media/`、工作階段 JSONL 檔案、
`cron/runs/*.jsonl`、已安裝 Plugin 套件根目錄，以及
`/tmp/openclaw/` 底下的輪替檔案記錄。

### Shell 輔助工具（選用）

若要讓日常 Docker 管理更輕鬆，請安裝 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是從舊的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路徑安裝 ClawDock，請重新執行上方安裝指令，讓你的本機輔助檔案追蹤新位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。執行
`clawdock-help` 查看所有指令。
完整輔助工具指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="啟用 Docker Gateway 的代理程式沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自訂通訊端路徑（例如 rootless Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    指令碼只會在沙箱前置條件通過後掛載 `docker.sock`。如果
    沙箱設定無法完成，指令碼會將 `agents.defaults.sandbox.mode`
    重設為 `off`。

  </Accordion>

  <Accordion title="自動化 / CI（非互動式）">
    使用 `-T` 停用 Compose 偽 TTY 配置：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共用網路安全注意事項">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，讓 CLI
    指令可透過 `127.0.0.1` 連到 Gateway。請將此視為共用的
    信任邊界。Compose 設定會移除 `NET_RAW`/`NET_ADMIN`，並在
    `openclaw-gateway` 與 `openclaw-cli` 上啟用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔以 `node`（uid 1000）執行。如果你在
    `/home/node/.openclaw` 看到權限錯誤，請確認主機繫結掛載由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同樣的不一致也可能顯示為 Plugin 警告，例如
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    後面接著 `plugin present but blocked`。這表示程序 uid 與
    掛載的 Plugin 目錄擁有者不一致。建議以預設 uid 1000 執行容器，並修正繫結掛載的擁有權。只有在你打算長期以 root 執行
    OpenClaw 時，才將
    `/path/to/openclaw-config/npm` chown 為 `root:root`。

  </Accordion>

  <Accordion title="更快的重建">
    排列 Dockerfile，讓依賴層能被快取。這可避免在 lockfile 未變更時重新執行
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
    預設映像檔以安全優先，並以非 root 的 `node` 執行。若要使用功能更完整的容器：

    1. **保留 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **預先內建系統依賴**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安裝 Playwright 瀏覽器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **保留瀏覽器下載項目**：設定
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`，並使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（無頭 Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟瀏覽器 URL。在
    Docker 或無頭設定中，請複製你抵達的完整重新導向 URL，並將它貼回精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像檔中繼資料">
    主要 Docker 執行階段映像檔使用 `node:24-bookworm-slim`，並發布 OCI
    基礎映像檔註解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 及其他項目。Node 基礎摘要會透過 Dependabot Docker 基礎映像檔 PR 重新整理；發行版本組建不會執行
    發行版升級層。請參閱
    [OCI 映像檔註解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 與
[Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)，了解共用 VM 部署步驟，
包括二進位檔內建、持久化與更新。

## 代理程式沙箱

當 `agents.defaults.sandbox` 啟用 Docker 後端時，Gateway
會在隔離的 Docker
容器內執行代理程式工具（shell、檔案讀取/寫入等），而 Gateway 本身仍留在主機上。這能在不將整個
Gateway 容器化的情況下，為不受信任或多租戶代理程式工作階段建立硬性隔離牆。

沙箱範圍可以是每個代理程式（預設）、每個工作階段，或共用。每個範圍都會取得掛載於 `/workspace` 的專屬工作區。你也可以設定
允許/拒絕工具政策、網路隔離、資源限制與瀏覽器容器。

完整設定、映像檔、安全注意事項與多代理程式設定檔，請參閱：

- [沙箱化](/zh-TW/gateway/sandboxing) -- 完整沙箱參考
- [OpenShell](/zh-TW/gateway/openshell) -- 對沙箱容器的互動式 shell 存取
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理程式覆寫

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

建置預設沙箱映像檔（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh
```

若是沒有原始碼 checkout 的 npm 安裝，請參閱 [沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌 `docker build` 指令。

## 疑難排解

<AccordionGroup>
  <Accordion title="映像檔遺失或沙箱容器未啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    建置沙箱映像檔（原始碼 checkout），或使用 [沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的內嵌 `docker build` 指令（npm 安裝），
    或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像檔。
    容器會在需要時依工作階段自動建立。
  </Accordion>

  <Accordion title="沙箱中的權限錯誤">
    將 `docker.user` 設為符合已掛載工作區擁有權的 UID:GID，
    或 chown 該工作區資料夾。
  </Accordion>

  <Accordion title="在沙箱中找不到自訂工具">
    OpenClaw 會使用 `sh -lc`（登入 shell）執行指令，這會載入
    `/etc/profile`，並可能重設 PATH。請設定 `docker.env.PATH` 以前置加入你的
    自訂工具路徑，或在 Dockerfile 中的 `/etc/profile.d/` 底下加入指令碼。
  </Accordion>

  <Accordion title="映像檔建置期間因 OOM 被終止（exit 137）">
    VM 至少需要 2 GB RAM。請使用較大的機器等級並重試。
  </Accordion>

  <Accordion title="Control UI 中顯示未授權或需要配對">
    擷取新的儀表板連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多細節：[儀表板](/zh-TW/web/dashboard)、[裝置](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目標顯示 ws://172.x.x.x，或 Docker CLI 出現配對錯誤">
    重設 Gateway 模式與繫結：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相關內容

- [安裝總覽](/zh-TW/install) — 所有安裝方法
- [Podman](/zh-TW/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-TW/install/clawdock) — Docker Compose 社群設定
- [更新](/zh-TW/install/updating) — 讓 OpenClaw 保持最新
- [設定](/zh-TW/gateway/configuration) — 安裝後的 Gateway 設定
