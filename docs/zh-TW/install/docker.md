---
read_when:
    - 你想要使用容器化 Gateway，而不是本機安裝
    - 您正在驗證 Docker 流程
summary: OpenClaw 的選用 Docker 型設定與入門導覽
title: Docker
x-i18n:
    generated_at: "2026-05-02T02:53:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2647caae7debfe0647842249a3a6000bfa73b191b1aa1d7ced1e9c0eb22228db
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。只有在你想使用容器化 Gateway，或驗證 Docker 流程時才使用。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的 Gateway 環境，或想在沒有本機安裝項目的主機上執行 OpenClaw。
- **否**：你正在自己的機器上執行，而且只想要最快的開發迴圈。請改用一般安裝流程。
- **沙箱注意事項**：啟用沙箱時，預設沙箱後端會使用 Docker，但沙箱預設為關閉，且**不**需要讓完整 Gateway 在 Docker 中執行。SSH 和 OpenShell 沙箱後端也可使用。請參閱 [沙箱](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 映像檔建置至少需要 2 GB RAM（`pnpm install` 在 1 GB 主機上可能因 OOM 被終止並以 137 結束）
- 足夠的磁碟空間存放映像檔與日誌
- 如果在 VPS/公用主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  特別是 Docker `DOCKER-USER` 防火牆政策。

## 容器化 Gateway

<Steps>
  <Step title="建置映像檔">
    從儲存庫根目錄執行設定指令碼：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機建置 Gateway 映像檔。如要改用預先建置的映像檔：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像檔會發布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常見標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成上線設定">
    設定指令碼會自動執行上線設定。它會：

    - 提示輸入提供者 API 金鑰
    - 產生 Gateway 權杖並寫入 `.env`
    - 透過 Docker Compose 啟動 Gateway

    設定期間，啟動前的上線設定與設定檔寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 用於 Gateway 容器已存在之後
    你要執行的命令。

  </Step>

  <Step title="開啟 Control UI">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將已設定的
    共享密鑰貼到設定中。設定指令碼預設會將權杖寫入 `.env`；
    如果你將容器設定切換為密碼驗證，請改用該密碼。

    需要再次取得 URL 嗎？

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
請從儲存庫根目錄執行 `docker compose`。如果你啟用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，設定指令碼會寫入 `docker-compose.extra.yml`；
請使用 `-f docker-compose.yml -f docker-compose.extra.yml` 將它包含進來。
</Note>

<Note>
因為 `openclaw-cli` 共享 `openclaw-gateway` 的網路命名空間，所以它是
啟動後工具。在 `docker compose up -d openclaw-gateway` 之前，請透過
`openclaw-gateway` 搭配 `--no-deps --entrypoint node` 執行上線設定
與設定階段的設定檔寫入。
</Note>

### 環境變數

設定指令碼接受這些選用環境變數：

| 變數                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用遠端映像檔，而不是在本機建置                              |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 建置期間安裝額外 apt 套件（以空格分隔）                        |
| `OPENCLAW_EXTENSIONS`                      | 建置時包含選取的內建 Plugin 輔助工具                           |
| `OPENCLAW_EXTRA_MOUNTS`                    | 額外主機繫結掛載（以逗號分隔的 `source:target[:opts]`）         |
| `OPENCLAW_HOME_VOLUME`                     | 在具名 Docker volume 中持久保存 `/home/node`                    |
| `OPENCLAW_SANDBOX`                         | 選擇加入沙箱啟動程序（`1`、`true`、`yes`、`on`）                |
| `OPENCLAW_SKIP_ONBOARDING`                 | 略過互動式上線設定步驟（`1`、`true`、`yes`、`on`）              |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆寫 Docker socket 路徑                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 停用 Bonjour/mDNS 廣播（Docker 預設為 `1`）                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 停用內建 Plugin 原始碼繫結掛載覆蓋層                           |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 匯出的共享 OTLP/HTTP 收集器端點                  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | traces、metrics 或 logs 的特定訊號 OTLP 端點                    |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 協定覆寫。目前只支援 `http/protobuf`                      |
| `OTEL_SERVICE_NAME`                        | 用於 OpenTelemetry 資源的服務名稱                              |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 選擇加入最新的實驗性 GenAI 語意屬性                            |
| `OPENCLAW_OTEL_PRELOADED`                  | 已預先載入時，略過啟動第二個 OpenTelemetry SDK                 |

維護者可以透過將某個 Plugin 原始碼目錄掛載到其封裝原始碼路徑上，
來測試內建 Plugin 原始碼與封裝映像檔的搭配，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該掛載的原始碼目錄會針對相同 Plugin id 覆寫相符的已編譯
`/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出會從 Gateway 容器向外傳送到你的 OTLP
收集器。它不需要發布 Docker port。如果你在本機建置映像檔，
並希望映像檔內可使用內建 OpenTelemetry 匯出器，請包含其執行階段相依項：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方 OpenClaw Docker 發布映像檔包含內建的
`diagnostics-otel` Plugin 原始碼。若要啟用匯出，請在設定中允許並啟用
`diagnostics-otel` Plugin，然後設定
`diagnostics.otel.enabled=true`，或使用
[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)中的設定範例。收集器驗證標頭是
透過 `diagnostics.otel.headers` 設定，而不是透過 Docker 環境變數。

Prometheus metrics 使用已發布的 Gateway port。啟用
`diagnostics-prometheus` Plugin，然後進行擷取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

該路由受 Gateway 驗證保護。不要暴露獨立的公用
`/metrics` port，或未驗證的反向代理路徑。請參閱
[Prometheus metrics](/zh-TW/gateway/prometheus)。

### 健全狀態檢查

容器探測端點（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 映像檔包含內建 `HEALTHCHECK`，會 ping `/healthz`。
如果檢查持續失敗，Docker 會將容器標記為 `unhealthy`，
協調系統可以重新啟動或替換它。

已驗證的深度健全狀態快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 與 loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此主機可透過
`http://127.0.0.1:18789` 搭配 Docker port 發布存取。

- `lan`（預設）：主機瀏覽器與主機 CLI 可以連到已發布的 Gateway port。
- `loopback`：只有容器網路命名空間內的程序可以直接連到
  Gateway。

<Note>
請在 `gateway.bind` 中使用 bind mode 值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用像 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機提供者

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器
本身，不是你的主機機器。對於在主機上執行的 AI 提供者，請使用
`host.docker.internal`：

| 提供者    | 主機預設 URL             | Docker 設定 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

內建 Docker 設定會將這些主機 URL 作為 LM Studio 與 Ollama
上線設定的預設值，而 `docker-compose.yml` 會將 `host.docker.internal` 對應到
Linux Docker Engine 的 Docker 主機 Gateway。Docker Desktop 在 macOS
和 Windows 上已提供相同主機名稱。

主機服務也必須監聽 Docker 可連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 命令，請自行加入相同的主機
對應，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge 網路通常無法可靠地轉送 Bonjour/mDNS multicast
（`224.0.0.251:5353`）。因此，內建 Compose 設定預設
`OPENCLAW_DISABLE_BONJOUR=1`，避免 Gateway 在 bridge 丟棄 multicast 流量時
發生 crash-loop 或反覆重新啟動廣播。

請針對 Docker 主機使用已發布的 Gateway URL、Tailscale 或廣域 DNS-SD。
只有在使用 host networking、macvlan，或其他已知 mDNS multicast 可正常運作的網路時，
才設定 `OPENCLAW_DISABLE_BONJOUR=0`。

如需注意事項與疑難排解，請參閱 [Bonjour 探索](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` bind-mount 到 `/home/node/.openclaw`，
並將 `OPENCLAW_WORKSPACE_DIR` bind-mount 到 `/home/node/.openclaw/workspace`，
因此這些路徑會在容器替換後保留下來。當任一變數未設定時，內建
`docker-compose.yml` 會退回到 `${HOME}/.openclaw`（workspace 掛載則為
`${HOME}/.openclaw/workspace`），如果 `HOME` 本身也缺失，則使用 `/tmp/.openclaw`。
這可避免 `docker compose up` 在裸環境中輸出空來源 volume 規格。

該掛載的設定目錄是 OpenClaw 保存下列內容的位置：

- 用於行為設定的 `openclaw.json`
- 用於已儲存提供者 OAuth/API-key 驗證的 `agents/<agentId>/agent/auth-profiles.json`
- 用於環境變數支援的執行階段密鑰（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

已安裝的可下載 Plugin 會將其套件狀態儲存在已掛載的
OpenClaw home 下，因此 Plugin 安裝紀錄與套件根目錄會在容器
替換後保留下來。Gateway 啟動不會產生內建 Plugin 相依性樹。

如需 VM 部署上的完整持久化詳細資訊，請參閱
[Docker VM Runtime - 哪些內容持久保存在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：**請留意 `media/`、session JSONL 檔案、
`cron/runs/*.jsonl`、已安裝的 Plugin 套件根目錄，以及
`/tmp/openclaw/` 下的輪替檔案日誌。

### Shell 輔助工具（選用）

為了更輕鬆地進行日常 Docker 管理，請安裝 `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是從舊的 `scripts/shell-helpers/clawdock-helpers.sh` raw 路徑安裝 ClawDock，請重新執行上方的安裝指令，讓你的本機 helper 檔案追蹤新位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。執行
`clawdock-help` 查看所有指令。
完整 helper 指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="啟用 Docker Gateway 的 agent sandbox">
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

    只有在 sandbox 前置需求通過後，腳本才會掛載 `docker.sock`。如果
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

  <Accordion title="共享網路安全性說明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI
    指令可以透過 `127.0.0.1` 連到 Gateway。請將這視為共享的
    信任邊界。compose 設定會移除 `NET_RAW`/`NET_ADMIN`，並在
    `openclaw-cli` 上啟用 `no-new-privileges`。
  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）執行。如果你在
    `/home/node/.openclaw` 看到權限錯誤，請確認主機 bind mount 是由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重建">
    調整 Dockerfile 的順序，讓相依性 layer 可以被快取。這可以避免在 lockfile 未變更時
    重新執行 `pnpm install`：

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
    預設映像檔以安全優先，並以非 root 的 `node` 執行。若要功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **內建系統相依套件**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安裝 Playwright 瀏覽器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化瀏覽器下載內容**：設定
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`，並使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（headless Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟瀏覽器 URL。在
    Docker 或 headless 設定中，請複製你抵達頁面的完整重新導向 URL，並將
    它貼回精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像檔 metadata">
    主要 Docker runtime 映像檔使用 `node:24-bookworm-slim`，並發布 OCI
    基礎映像檔註解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 以及其他項目。Node 基礎 digest 會
    透過 Dependabot Docker 基礎映像檔 PR 更新；release build 不會執行
    distro upgrade layer。請參閱
    [OCI 映像檔註解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 和
[Docker VM Runtime](/zh-TW/install/docker-vm-runtime)，了解共享 VM 部署步驟，
包括 binary baking、持久化和更新。

## Agent sandbox

當以 Docker 後端啟用 `agents.defaults.sandbox` 時，Gateway
會在隔離的 Docker 容器內執行 agent 工具（shell、檔案讀取/寫入等），而 Gateway
本身會留在主機上。這能在不將整個
Gateway 容器化的情況下，為不受信任或多租戶的 agent session 建立堅實隔離牆。

Sandbox 範圍可以是每個 agent（預設）、每個 session 或共享。每個範圍
都會取得掛載於 `/workspace` 的專屬 workspace。你也可以設定
允許/拒絕工具政策、網路隔離、資源限制和瀏覽器容器。

完整設定、映像檔、安全性說明和多 agent profile，請參閱：

- [Sandboxing](/zh-TW/gateway/sandboxing) -- 完整 sandbox 參考
- [OpenShell](/zh-TW/gateway/openshell) -- 對 sandbox 容器的互動式 shell 存取
- [多 Agent Sandbox 與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個 agent 的覆寫設定

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

建置預設 sandbox 映像檔（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh
```

對於沒有原始碼 checkout 的 npm 安裝，請參閱 [Sandboxing § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的 inline `docker build` 指令。

## 疑難排解

<AccordionGroup>
  <Accordion title="映像檔遺失或 sandbox 容器未啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （原始碼 checkout）建置 sandbox 映像檔，或使用 [Sandboxing § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)（npm install）中的 inline `docker build` 指令，
    或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像檔。
    容器會依需求為每個 session 自動建立。
  </Accordion>

  <Accordion title="Sandbox 中的權限錯誤">
    將 `docker.user` 設為符合已掛載 workspace 擁有權的 UID:GID，
    或 chown workspace 資料夾。
  </Accordion>

  <Accordion title="Sandbox 中找不到自訂工具">
    OpenClaw 會使用 `sh -lc`（login shell）執行指令，這會 source
    `/etc/profile` 且可能重設 PATH。請設定 `docker.env.PATH` 以 prepend 你的
    自訂工具路徑，或在 Dockerfile 中於 `/etc/profile.d/` 下新增腳本。
  </Accordion>

  <Accordion title="映像檔建置期間因 OOM 被終止（exit 137）">
    VM 至少需要 2 GB RAM。請使用較大的機器類型後重試。
  </Accordion>

  <Accordion title="Control UI 中顯示未授權或需要 pairing">
    擷取新的 dashboard 連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多詳細資訊：[Dashboard](/zh-TW/web/dashboard)、[Devices](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target 顯示 ws://172.x.x.x，或 Docker CLI 出現 pairing 錯誤">
    重設 Gateway mode 和 bind：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相關

- [安裝總覽](/zh-TW/install) — 所有安裝方式
- [Podman](/zh-TW/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-TW/install/clawdock) — Docker Compose 社群設定
- [更新](/zh-TW/install/updating) — 讓 OpenClaw 保持最新狀態
- [設定](/zh-TW/gateway/configuration) — 安裝後的 Gateway 設定
