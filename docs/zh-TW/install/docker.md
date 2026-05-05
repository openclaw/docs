---
read_when:
    - 你想要容器化的 Gateway，而不是本機安裝
    - 你正在驗證 Docker 流程
summary: OpenClaw 的選用 Docker 型設定與入門導覽
title: Docker
x-i18n:
    generated_at: "2026-05-05T08:26:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f57db2ec12f1a1fd681ec90cc43b2c945755a9240f571de46688777e957f1b8e
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。只有在你想要容器化的 Gateway，或想驗證 Docker 流程時才使用它。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的 Gateway 環境，或想在沒有本機安裝的主機上執行 OpenClaw。
- **否**：你正在自己的機器上執行，而且只想要最快的開發迴圈。請改用一般安裝流程。
- **沙箱注意事項**：啟用沙箱時，預設沙箱後端會使用 Docker，但沙箱預設為關閉，而且**不**需要讓完整 Gateway 在 Docker 中執行。也可以使用 SSH 和 OpenShell 沙箱後端。請參閱[沙箱](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 映像建置至少需要 2 GB RAM（在 1 GB 主機上，`pnpm install` 可能會因記憶體不足被終止並以 137 結束）
- 足夠存放映像和記錄的磁碟空間
- 如果在 VPS/公開主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  特別是 Docker `DOCKER-USER` 防火牆原則。

## 容器化 Gateway

<Steps>
  <Step title="Build the image">
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

  <Step title="Complete onboarding">
    設定指令碼會自動執行 onboarding。它會：

    - 提示輸入提供者 API 金鑰
    - 產生 Gateway token，並寫入 `.env`
    - 透過 Docker Compose 啟動 Gateway

    在設定期間，啟動前的 onboarding 和設定寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 則用於 Gateway 容器已經存在之後執行的命令。

  </Step>

  <Step title="Open the Control UI">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將已設定的共享密鑰貼到設定中。設定指令碼預設會將 token 寫入 `.env`；如果你將容器設定切換為密碼驗證，請改用該密碼。

    需要再次取得 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
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
請用 `-f docker-compose.yml -f docker-compose.extra.yml` 將它包含進來。
</Note>

<Note>
因為 `openclaw-cli` 會共享 `openclaw-gateway` 的網路命名空間，所以它是啟動後工具。在執行 `docker compose up -d openclaw-gateway` 之前，請透過 `openclaw-gateway` 搭配
`--no-deps --entrypoint node` 來執行 onboarding 和設定期間的設定寫入。
</Note>

### 環境變數

設定指令碼接受以下選用環境變數：

| 變數                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用遠端映像，而不是在本機建置                                |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 在建置期間安裝額外的 apt 套件（以空格分隔）                   |
| `OPENCLAW_EXTENSIONS`                      | 在建置時包含選定的 bundled plugin 輔助工具                     |
| `OPENCLAW_EXTRA_MOUNTS`                    | 額外的主機 bind mount（以逗號分隔的 `source:target[:opts]`）   |
| `OPENCLAW_HOME_VOLUME`                     | 將 `/home/node` 持久化到具名 Docker volume                     |
| `OPENCLAW_SANDBOX`                         | 選擇加入沙箱 bootstrap（`1`、`true`、`yes`、`on`）              |
| `OPENCLAW_SKIP_ONBOARDING`                 | 略過互動式 onboarding 步驟（`1`、`true`、`yes`、`on`）          |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆寫 Docker socket 路徑                                        |
| `OPENCLAW_DISABLE_BONJOUR`                 | 停用 Bonjour/mDNS 廣播（Docker 預設為 `1`）                    |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 停用 bundled plugin 原始碼 bind-mount overlay                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 匯出的共享 OTLP/HTTP collector endpoint          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | traces、metrics 或 logs 的訊號專屬 OTLP endpoints              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP protocol 覆寫。目前只支援 `http/protobuf`                 |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry resources 使用的服務名稱                         |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 選擇加入最新的實驗性 GenAI 語意屬性                            |
| `OPENCLAW_OTEL_PRELOADED`                  | 若已預載一個 OpenTelemetry SDK，則略過啟動第二個               |

維護者可以將單一 plugin 原始碼目錄掛載到其打包後的原始碼路徑上，以測試 bundled plugin 原始碼對打包映像的行為，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該掛載的原始碼目錄會針對相同 plugin id 覆寫相符的已編譯
`/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出會從 Gateway 容器向外傳送到你的 OTLP collector。它不需要發布 Docker port。如果你在本機建置映像，並希望 bundled OpenTelemetry exporter 可在映像內使用，請包含其執行階段依賴：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在打包的 Docker 安裝中，請先從 ClawHub 安裝官方
`@openclaw/diagnostics-otel` plugin，再啟用匯出。自訂原始碼建置的映像仍可用
`OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本機 plugin 原始碼。若要啟用匯出，請在設定中允許並啟用
`diagnostics-otel` plugin，接著設定 `diagnostics.otel.enabled=true`，或使用 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)中的設定範例。Collector 驗證標頭透過
`diagnostics.otel.headers` 設定，而不是透過 Docker 環境變數設定。

Prometheus metrics 使用已發布的 Gateway port。安裝
`clawhub:@openclaw/diagnostics-prometheus`，啟用
`diagnostics-prometheus` plugin，然後 scrape：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

該路由受 Gateway 驗證保護。請勿暴露獨立的公開
`/metrics` port 或未驗證的 reverse-proxy path。請參閱
[Prometheus metrics](/zh-TW/gateway/prometheus)。

### 健康檢查

容器 probe endpoints（不需要驗證）：

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

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此主機可透過 Docker port publishing 存取
`http://127.0.0.1:18789`。

- `lan`（預設）：主機瀏覽器和主機 CLI 可以連到已發布的 Gateway port。
- `loopback`：只有容器網路命名空間內的程序能直接連到 Gateway。

<Note>
請在 `gateway.bind` 中使用 bind mode 值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），而不是 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機提供者

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器本身，而不是你的主機。對於在主機上執行的 AI 提供者，請使用 `host.docker.internal`：

| 提供者    | 主機預設 URL            | Docker 設定 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

bundled Docker 設定會使用這些主機 URL 作為 LM Studio 和 Ollama 的 onboarding 預設值，而 `docker-compose.yml` 會將 `host.docker.internal` 對應到 Linux Docker Engine 的 Docker host gateway。Docker Desktop 已在 macOS 和 Windows 上提供相同主機名稱。

主機服務也必須 listen 在 Docker 可連到的位址上：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 命令，請自行加入相同的主機對應，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge networking 通常無法可靠轉送 Bonjour/mDNS multicast
（`224.0.0.251:5353`）。因此 bundled Compose 設定預設
`OPENCLAW_DISABLE_BONJOUR=1`，避免 Gateway 在 bridge 丟棄 multicast traffic 時 crash-loop 或反覆重新啟動廣播。

請對 Docker 主機使用已發布的 Gateway URL、Tailscale 或 wide-area DNS-SD。
只有在使用 host networking、macvlan，或其他已知 mDNS multicast 可運作的網路時，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。

關於常見問題和疑難排解，請參閱 [Bonjour discovery](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` bind-mount 到 `/home/node/.openclaw`，並將
`OPENCLAW_WORKSPACE_DIR` bind-mount 到 `/home/node/.openclaw/workspace`，因此這些路徑會在容器替換後保留下來。當任一變數未設定時，bundled
`docker-compose.yml` 會退回使用 `${HOME}/.openclaw`（workspace mount 則使用
`${HOME}/.openclaw/workspace`），若 `HOME` 本身也缺失，則使用 `/tmp/.openclaw`。
這能避免 `docker compose up` 在裸環境中輸出空 source volume spec。

該掛載的設定目錄是 OpenClaw 保存以下項目的位置：

- `openclaw.json`：行為設定
- `agents/<agentId>/agent/auth-profiles.json`：已儲存的提供者 OAuth/API-key 驗證
- `.env`：以環境變數支援的執行階段密鑰，例如 `OPENCLAW_GATEWAY_TOKEN`

已安裝的可下載 plugins 會將其套件狀態儲存在掛載的 OpenClaw home 下，因此 plugin 安裝記錄和套件根目錄會在容器替換後保留下來。Gateway 啟動不會產生 bundled-plugin dependency trees。

如需 VM 部署的完整持久化詳細資訊，請參閱
[Docker VM Runtime - What persists where](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：**留意 `media/`、工作階段 JSONL 檔案、
`cron/runs/*.jsonl`、已安裝的 Plugin 套件根目錄，以及
`/tmp/openclaw/` 底下的輪替檔案記錄。

### Shell 輔助工具（選用）

為了讓日常 Docker 管理更簡單，請安裝 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是從較舊的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路徑安裝 ClawDock，請重新執行上方的安裝命令，讓你的本機輔助工具檔案追蹤新的位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。執行
`clawdock-help` 查看所有命令。
完整輔助工具指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="為 Docker gateway 啟用代理程式沙箱">
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

    這個指令碼只會在沙箱先決條件通過後掛載 `docker.sock`。如果
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
    命令可以透過 `127.0.0.1` 連到 gateway。請將其視為共用的
    信任邊界。compose 設定會移除 `NET_RAW`/`NET_ADMIN`，並在
    `openclaw-gateway` 和 `openclaw-cli` 上啟用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）執行。如果你在
    `/home/node/.openclaw` 看到權限錯誤，請確認你的主機 bind mounts 由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快重建">
    排列你的 Dockerfile，讓相依層能被快取。這可避免在 lockfile 沒有變更時
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
    預設映像檔以安全性優先，並以非 root 的 `node` 執行。若要使用功能更完整的
    容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **內建系統相依套件**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安裝 Playwright 瀏覽器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化瀏覽器下載項目**：設定
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`，並使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（無頭 Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟一個瀏覽器 URL。在
    Docker 或無頭環境中，請複製你抵達頁面的完整重新導向 URL，並貼回
    精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像檔中繼資料">
    主要 Docker 執行階段映像檔使用 `node:24-bookworm-slim`，並發布 OCI
    基礎映像檔註解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。Node 基礎 digest 會透過
    Dependabot Docker 基礎映像檔 PR 更新；發行建置不會執行
    發行版升級層。請參閱
    [OCI 映像檔註解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 和
[Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)，了解共用 VM 部署步驟，
包括二進位檔烘焙、持久化與更新。

## 代理程式沙箱

當 `agents.defaults.sandbox` 以 Docker 後端啟用時，gateway
會在隔離的 Docker 容器內執行代理程式工具（shell、檔案讀取/寫入等），
而 gateway 本身仍留在主機上。這會在不受信任或多租戶代理程式工作階段周圍
提供一道硬邊界，而不需要將整個 gateway 容器化。

沙箱範圍可以是每個代理程式（預設）、每個工作階段，或共用。每個範圍都會
取得自己的工作區，掛載於 `/workspace`。你也可以設定
允許/拒絕工具政策、網路隔離、資源限制，以及瀏覽器容器。

完整設定、映像檔、安全注意事項，以及多代理程式設定檔，請參閱：

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

若 npm 安裝沒有原始碼 checkout，請參閱 [沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌 `docker build` 命令。

## 疑難排解

<AccordionGroup>
  <Accordion title="映像檔遺失或沙箱容器未啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （原始碼 checkout）或 [沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的內嵌 `docker build` 命令（npm 安裝）
    建置沙箱映像檔，
    或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像檔。
    容器會依需求為每個工作階段自動建立。
  </Accordion>

  <Accordion title="沙箱中的權限錯誤">
    將 `docker.user` 設為符合你掛載工作區擁有權的 UID:GID，
    或對工作區資料夾執行 chown。
  </Accordion>

  <Accordion title="沙箱中找不到自訂工具">
    OpenClaw 會使用 `sh -lc`（login shell）執行命令，這會載入
    `/etc/profile`，並可能重設 PATH。設定 `docker.env.PATH` 來前置你的
    自訂工具路徑，或在 Dockerfile 中的 `/etc/profile.d/` 底下新增指令碼。
  </Accordion>

  <Accordion title="映像檔建置期間因 OOM 被終止（exit 137）">
    VM 至少需要 2 GB RAM。請使用較大的機器類型後重試。
  </Accordion>

  <Accordion title="Control UI 中未授權或需要配對">
    擷取新的儀表板連結，並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多細節：[儀表板](/zh-TW/web/dashboard)、[裝置](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目標顯示 ws://172.x.x.x，或 Docker CLI 出現配對錯誤">
    重設 gateway 模式與 bind：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相關

- [安裝概覽](/zh-TW/install) — 所有安裝方法
- [Podman](/zh-TW/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-TW/install/clawdock) — Docker Compose 社群設定
- [更新](/zh-TW/install/updating) — 讓 OpenClaw 保持最新
- [設定](/zh-TW/gateway/configuration) — 安裝後的 gateway 設定
