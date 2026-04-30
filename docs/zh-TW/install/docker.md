---
read_when:
    - 你想要容器化 Gateway，而不是本機安裝
    - 你正在驗證 Docker 流程
summary: 基於 Docker 的 OpenClaw 可選設定與入門導覽
title: Docker
x-i18n:
    generated_at: "2026-04-30T03:14:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。只有在你想使用容器化 Gateway，或驗證 Docker 流程時才需要使用。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的 Gateway 環境，或想在沒有本機安裝項目的主機上執行 OpenClaw。
- **否**：你正在自己的機器上執行，而且只想要最快的開發迴圈。請改用一般安裝流程。
- **沙盒化注意事項**：啟用沙盒化時，預設沙盒後端會使用 Docker，但沙盒化預設為關閉，且**不**要求完整 Gateway 在 Docker 中執行。SSH 和 OpenShell 沙盒後端也可使用。請參閱[沙盒化](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 映像建置至少需要 2 GB RAM（`pnpm install` 在 1 GB 主機上可能因 OOM 被終止，結束碼為 137）
- 足夠的磁碟空間用於映像和日誌
- 如果在 VPS/公開主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  尤其是 Docker `DOCKER-USER` 防火牆政策。

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
    常見標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成 onboarding">
    設定指令碼會自動執行 onboarding。它會：

    - 提示輸入供應商 API 金鑰
    - 產生 Gateway 權杖並寫入 `.env`
    - 透過 Docker Compose 啟動 Gateway

    設定期間，啟動前 onboarding 和設定寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 用於 Gateway 容器已存在後
    你執行的指令。

  </Step>

  <Step title="開啟控制 UI">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將已設定的
    共用密鑰貼到設定中。設定指令碼預設會將權杖寫入 `.env`；如果你將容器設定切換為密碼驗證，請改用該密碼。

    需要再次取得 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="設定頻道（選用）">
    使用 CLI 容器新增訊息頻道：

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
從 repo 根目錄執行 `docker compose`。如果你啟用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，設定指令碼會寫入 `docker-compose.extra.yml`；
請用 `-f docker-compose.yml -f docker-compose.extra.yml` 包含它。
</Note>

<Note>
因為 `openclaw-cli` 共享 `openclaw-gateway` 的網路命名空間，所以它是
啟動後工具。在 `docker compose up -d openclaw-gateway` 之前，請透過
`openclaw-gateway` 搭配 `--no-deps --entrypoint node` 執行 onboarding
和設定期間的設定寫入。
</Note>

### 環境變數

設定指令碼接受以下選用環境變數：

| 變數                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用遠端映像，而不是在本機建置                                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 建置期間安裝額外 apt 套件（以空格分隔）                         |
| `OPENCLAW_EXTENSIONS`                      | 建置時預先安裝 Plugin 相依項（以空格分隔的名稱）                |
| `OPENCLAW_EXTRA_MOUNTS`                    | 額外的主機 bind mount（逗號分隔的 `source:target[:opts]`）       |
| `OPENCLAW_HOME_VOLUME`                     | 在具名 Docker volume 中持久保存 `/home/node`                    |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | 產生的 bundled Plugin 相依項和鏡像的容器路徑                    |
| `OPENCLAW_SANDBOX`                         | 選擇加入沙盒啟動程序（`1`、`true`、`yes`、`on`）                 |
| `OPENCLAW_SKIP_ONBOARDING`                 | 略過互動式 onboarding 步驟（`1`、`true`、`yes`、`on`）           |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆寫 Docker socket 路徑                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 停用 Bonjour/mDNS 廣告（Docker 預設為 `1`）                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 停用 bundled Plugin 原始碼 bind-mount overlay                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 匯出的共用 OTLP/HTTP collector endpoint           |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | traces、metrics 或 logs 的訊號特定 OTLP endpoint                |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 協定覆寫。今天僅支援 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry 資源使用的服務名稱                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 選擇加入最新實驗性 GenAI 語意屬性                               |
| `OPENCLAW_OTEL_PRELOADED`                  | 當已預載 OpenTelemetry SDK 時，略過啟動第二個 SDK               |

維護者可以將一個 Plugin 原始碼目錄掛載到其封裝原始碼路徑上，來用已封裝映像測試 bundled Plugin 原始碼，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該掛載的原始碼目錄會覆寫相同 Plugin id 對應的已編譯
`/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出是從 Gateway 容器向外連到你的 OTLP
collector。它不需要發布 Docker 連接埠。如果你在本機建置映像，且希望 bundled OpenTelemetry exporter 可在映像內使用，請包含其執行階段相依項：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方 OpenClaw Docker 發布映像包含 bundled
`diagnostics-otel` Plugin 原始碼。視映像和快取狀態而定，Gateway
在首次啟用 Plugin 時仍可能暫存 Plugin 本機的 OpenTelemetry 執行階段相依項，因此請允許首次啟動連到套件 registry，或在你的發布 lane 中預熱映像。若要啟用匯出，請在設定中允許並啟用 `diagnostics-otel` Plugin，然後設定
`diagnostics.otel.enabled=true`，或使用
[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)中的設定範例。Collector 驗證標頭是透過
`diagnostics.otel.headers` 設定，而不是透過 Docker 環境變數。

Prometheus metrics 使用已發布的 Gateway 連接埠。啟用
`diagnostics-prometheus` Plugin，然後抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

此路由受 Gateway 驗證保護。請勿暴露個別公開的
`/metrics` 連接埠或未驗證的反向代理路徑。請參閱
[Prometheus metrics](/zh-TW/gateway/prometheus)。

### 健康檢查

容器探測 endpoint（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 映像包含內建的 `HEALTHCHECK`，會 ping `/healthz`。
如果檢查持續失敗，Docker 會將容器標記為 `unhealthy`，而編排系統可以重新啟動或取代它。

已驗證的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 與 loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此主機可透過 Docker 連接埠發布存取
`http://127.0.0.1:18789`。

- `lan`（預設）：主機瀏覽器和主機 CLI 可以連到已發布的 Gateway 連接埠。
- `loopback`：只有容器網路命名空間內的程序可以直接連到
  Gateway。

<Note>
請使用 `gateway.bind` 中的 bind mode 值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），而不是像 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機供應商

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器本身，而不是你的主機。對於在主機上執行的 AI 供應商，請使用 `host.docker.internal`：

| 供應商    | 主機預設 URL             | Docker 設定 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

bundled Docker 設定會將這些主機 URL 作為 LM Studio 和 Ollama
onboarding 預設值，而 `docker-compose.yml` 會將 `host.docker.internal` 對應到
Linux Docker Engine 的 Docker 主機 Gateway。Docker Desktop 在 macOS 和 Windows 上已提供相同主機名稱。

主機服務也必須監聽 Docker 可連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 指令，請自行加入相同的主機對應，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge networking 通常無法可靠轉送 Bonjour/mDNS multicast
（`224.0.0.251:5353`）。因此 bundled Compose 設定預設
`OPENCLAW_DISABLE_BONJOUR=1`，避免 Gateway 在 bridge 丟棄 multicast 流量時 crash-loop 或反覆重新啟動廣告。

對 Docker 主機，請使用已發布的 Gateway URL、Tailscale 或 wide-area DNS-SD。
只有在使用 host networking、macvlan，或其他已知 mDNS multicast 可正常運作的網路時，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。

如需注意事項和疑難排解，請參閱 [Bonjour discovery](/zh-TW/gateway/bonjour)。

### 儲存與持久性

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` bind-mount 到 `/home/node/.openclaw`，並將
`OPENCLAW_WORKSPACE_DIR` bind-mount 到 `/home/node/.openclaw/workspace`，因此這些路徑會在容器取代後保留下來。當任一變數未設定時，bundled
`docker-compose.yml` 會回退到 `${HOME}/.openclaw`（workspace mount 則回退到
`${HOME}/.openclaw/workspace`），或在 `HOME` 本身也不存在時回退到 `/tmp/.openclaw`。
這可避免 `docker compose up` 在裸環境中發出空來源 volume 規格。

該掛載的設定目錄是 OpenClaw 保存下列項目的位置：

- 用於行為設定的 `openclaw.json`
- 用於儲存的供應商 OAuth/API-key 驗證的 `agents/<agentId>/agent/auth-profiles.json`
- 用於 env-backed 執行階段密鑰（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

隨附 Plugin 執行階段相依性與鏡像的執行階段檔案是產生出的狀態，
不是使用者設定。Compose 會將它們儲存在名為
`openclaw-plugin-runtime-deps` 的 Docker volume 中，並掛載到
`/var/lib/openclaw/plugin-runtime-deps`。將這個變動頻繁的樹狀目錄排除在
主機設定 bind mount 之外，可避免 Docker Desktop/WSL 檔案操作緩慢，以及
冷啟動 Gateway 時發生過期的 Windows handle。

預設 Compose 檔案會將 `OPENCLAW_PLUGIN_STAGE_DIR` 設為該路徑，並套用於
`openclaw-gateway` 和 `openclaw-cli`，因此 `openclaw doctor --fix`、頻道
登入/設定指令，以及 Gateway 啟動都會使用同一個產生出的執行階段
volume。

如需 VM 部署的完整持久化細節，請參閱
[Docker VM 執行階段 - 哪些內容會持久保存在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：** 留意 `media/`、session JSONL 檔案、`cron/runs/*.jsonl`、
`openclaw-plugin-runtime-deps` Docker volume，以及
`/tmp/openclaw/` 底下的輪替檔案日誌。

### Shell 輔助工具（選用）

為了更輕鬆地進行日常 Docker 管理，請安裝 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你先前是從較舊的 `scripts/shell-helpers/clawdock-helpers.sh` raw 路徑安裝 ClawDock，請重新執行上方的安裝指令，讓本機輔助工具檔案追蹤新的位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等指令。
執行 `clawdock-help` 查看所有指令。
完整輔助工具指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="為 Docker gateway 啟用 agent sandbox">
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

    腳本只會在 sandbox 先決條件通過後掛載 `docker.sock`。如果
    sandbox 設定無法完成，腳本會將 `agents.defaults.sandbox.mode`
    重設為 `off`。

  </Accordion>

  <Accordion title="自動化 / CI（非互動式）">
    使用 `-T` 停用 Compose pseudo-TTY 配置：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共用網路安全注意事項">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，讓 CLI
    指令可以透過 `127.0.0.1` 連到 gateway。請將此視為共用的
    信任邊界。compose 設定會移除 `NET_RAW`/`NET_ADMIN`，並在
    `openclaw-cli` 上啟用 `no-new-privileges`。
  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）身分執行。如果你在
    `/home/node/.openclaw` 看到權限錯誤，請確認主機 bind mount
    是由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重建">
    排列 Dockerfile，讓相依性 layers 可被快取。這可避免在 lockfile
    未變更時重新執行 `pnpm install`：

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

  <Accordion title="進階使用者 container 選項">
    預設映像檔以安全性優先，並以非 root 的 `node` 身分執行。若要使用
    功能更完整的 container：

    1. **持久保存 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **內建系統相依性**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安裝 Playwright browsers**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久保存 browser 下載內容**：設定
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`，並使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（headless Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟一個瀏覽器 URL。在
    Docker 或 headless 設定中，複製你最後抵達的完整 redirect URL，並貼回
    精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像檔 metadata">
    主要 Docker 執行階段映像檔使用 `node:24-bookworm-slim`，並發布 OCI
    base-image annotations，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。Node base digest 會透過
    Dependabot Docker base-image PR 更新；release build 不會執行
    distro upgrade layer。請參閱
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 和
[Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)，了解共用 VM 部署步驟，
包括 binary baking、持久化與更新。

## Agent sandbox

當使用 Docker backend 啟用 `agents.defaults.sandbox` 時，gateway
會在隔離的 Docker container 內執行 agent tool execution（shell、檔案讀取/寫入等），
而 gateway 本身仍留在主機上。這能在不將整個 gateway container 化的情況下，
為不受信任或多租戶的 agent session 建立一道硬性隔離牆。

Sandbox scope 可以是 per-agent（預設）、per-session 或 shared。每個 scope
都會取得自己的 workspace，並掛載在 `/workspace`。你也可以設定
allow/deny tool policies、網路隔離、資源限制和 browser containers。

如需完整設定、映像檔、安全注意事項和 multi-agent profiles，請參閱：

- [Sandboxing](/zh-TW/gateway/sandboxing) -- 完整 sandbox 參考
- [OpenShell](/zh-TW/gateway/openshell) -- 對 sandbox containers 的互動式 shell 存取
- [Multi-Agent Sandbox and Tools](/zh-TW/tools/multi-agent-sandbox-tools) -- per-agent overrides

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

建置預設 sandbox 映像檔：

```bash
scripts/sandbox-setup.sh
```

## 疑難排解

<AccordionGroup>
  <Accordion title="映像檔遺失或 sandbox container 無法啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    建置 sandbox 映像檔，或將 `agents.defaults.sandbox.docker.image`
    設為你的自訂映像檔。Containers 會依需求為每個 session 自動建立。
  </Accordion>

  <Accordion title="Sandbox 中的權限錯誤">
    將 `docker.user` 設為與已掛載 workspace 擁有權相符的 UID:GID，
    或對 workspace 資料夾執行 chown。
  </Accordion>

  <Accordion title="Sandbox 中找不到自訂工具">
    OpenClaw 使用 `sh -lc`（login shell）執行指令，這會載入
    `/etc/profile` 並可能重設 PATH。設定 `docker.env.PATH` 以在前方加入
    自訂工具路徑，或在你的 Dockerfile 中於 `/etc/profile.d/` 底下新增腳本。
  </Accordion>

  <Accordion title="映像檔建置期間因 OOM 被終止（exit 137）">
    VM 至少需要 2 GB RAM。使用更大的機器類別後重試。
  </Accordion>

  <Accordion title="Control UI 中顯示未授權或需要 pairing">
    擷取新的 dashboard 連結並核准 browser device：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多細節：[Dashboard](/zh-TW/web/dashboard)、[Devices](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目標顯示 ws://172.x.x.x，或 Docker CLI 出現 pairing 錯誤">
    重設 gateway mode 和 bind：

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
- [設定](/zh-TW/gateway/configuration) — 安裝後的 gateway 設定
