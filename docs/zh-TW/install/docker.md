---
read_when:
    - 你想要容器化的 Gateway，而不是本機安裝
    - 你正在驗證 Docker 流程
summary: OpenClaw 的選用 Docker 架構設定與入門導覽
title: Docker
x-i18n:
    generated_at: "2026-05-11T20:31:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73e7f028708f6455b21aa38adf9dcd833bf6bc169d5405d32faa42641186b4a0
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。只有在你想要容器化 Gateway，或要驗證 Docker 流程時才使用。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的 Gateway 環境，或想在沒有本機安裝項目的主機上執行 OpenClaw。
- **否**：你是在自己的機器上執行，而且只想要最快的開發迴圈。請改用一般安裝流程。
- **沙箱化注意事項**：啟用沙箱化時，預設沙箱後端會使用 Docker，但沙箱化預設關閉，而且**不**需要讓完整 Gateway 在 Docker 中執行。SSH 和 OpenShell 沙箱後端也可使用。請參閱[沙箱化](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 映像檔建置至少需要 2 GB RAM（在 1 GB 主機上，`pnpm install` 可能會因 OOM 而以結束碼 137 被終止）
- 足夠的磁碟空間供映像檔和記錄使用
- 如果在 VPS/公開主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  尤其是 Docker `DOCKER-USER` 防火牆政策。

## 容器化 Gateway

<Steps>
  <Step title="建置映像檔">
    從儲存庫根目錄執行設定指令碼：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機建置 Gateway 映像檔。若要改用預先建置的映像檔：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像檔發布於
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常見標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成入門設定">
    設定指令碼會自動執行入門設定。它會：

    - 提示輸入供應商 API 金鑰
    - 產生 Gateway 權杖並寫入 `.env`
    - 透過 Docker Compose 啟動 Gateway

    在設定期間，啟動前入門設定與設定寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 是供你在
    Gateway 容器已存在之後執行的命令使用。

  </Step>

  <Step title="開啟控制 UI">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將已設定的
    共用密鑰貼到設定中。設定指令碼預設會將權杖寫入 `.env`；
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
從儲存庫根目錄執行 `docker compose`。如果你啟用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，設定指令碼會寫入 `docker-compose.extra.yml`；
請使用 `-f docker-compose.yml -f docker-compose.extra.yml` 將它納入。
</Note>

<Note>
因為 `openclaw-cli` 共享 `openclaw-gateway` 的網路命名空間，所以它是
啟動後工具。在 `docker compose up -d openclaw-gateway` 之前，請透過
`openclaw-gateway` 搭配 `--no-deps --entrypoint node` 執行入門設定與
設定期間的設定寫入。
</Note>

### 環境變數

設定指令碼接受下列選用環境變數：

| 變數                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用遠端映像檔，而不是在本機建置                                |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 建置期間安裝額外 apt 套件（以空格分隔）                         |
| `OPENCLAW_EXTENSIONS`                      | 建置期間包含所選的內建 Plugin 輔助程式                          |
| `OPENCLAW_EXTRA_MOUNTS`                    | 額外主機繫結掛載（以逗號分隔的 `source:target[:opts]`）         |
| `OPENCLAW_HOME_VOLUME`                     | 在具名 Docker 磁碟區中持久化 `/home/node`                       |
| `OPENCLAW_SANDBOX`                         | 選擇啟用沙箱啟動程序（`1`、`true`、`yes`、`on`）                |
| `OPENCLAW_SKIP_ONBOARDING`                 | 略過互動式入門設定步驟（`1`、`true`、`yes`、`on`）              |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆寫 Docker socket 路徑                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 停用 Bonjour/mDNS 廣播（Docker 預設為 `1`）                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 停用內建 Plugin 原始碼繫結掛載覆蓋層                            |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 匯出的共用 OTLP/HTTP 收集器端點                  |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 追蹤、指標或記錄的訊號專屬 OTLP 端點                            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 通訊協定覆寫。今日僅支援 `http/protobuf`                  |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry 資源使用的服務名稱                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 選擇啟用最新實驗性 GenAI 語意屬性                               |
| `OPENCLAW_OTEL_PRELOADED`                  | 已預載一個 OpenTelemetry SDK 時，略過啟動第二個 SDK             |

維護者可以將一個 Plugin 原始碼目錄掛載到其封裝原始碼路徑上，以測試內建
Plugin 原始碼搭配封裝映像檔，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該掛載的原始碼目錄會針對相同 Plugin id 覆寫相符的已編譯
`/app/dist/extensions/synology-chat` 套件。

### 可觀測性

OpenTelemetry 匯出會從 Gateway 容器向外送到你的 OTLP 收集器。它不需要
發布 Docker 連接埠。如果你在本機建置映像檔，並希望內建 OpenTelemetry
匯出器可在映像檔內使用，請包含其執行階段相依項：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在封裝的 Docker 安裝中，請先從 ClawHub 安裝官方
`@openclaw/diagnostics-otel` Plugin，再啟用匯出。自訂從原始碼建置的映像檔
仍可透過 `OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本機 Plugin 原始碼。
若要啟用匯出，請在設定中允許並啟用 `diagnostics-otel` Plugin，然後設定
`diagnostics.otel.enabled=true`，或使用 [OpenTelemetry
匯出](/zh-TW/gateway/opentelemetry)中的設定範例。收集器驗證標頭透過
`diagnostics.otel.headers` 設定，而不是透過 Docker 環境變數。

Prometheus 指標使用已發布的 Gateway 連接埠。安裝
`clawhub:@openclaw/diagnostics-prometheus`，啟用
`diagnostics-prometheus` Plugin，然後抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

該路由受 Gateway 驗證保護。不要暴露獨立的公開 `/metrics` 連接埠或未驗證的
反向代理路徑。請參閱 [Prometheus 指標](/zh-TW/gateway/prometheus)。

### 健康檢查

容器探測端點（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 映像檔包含內建 `HEALTHCHECK`，會 ping `/healthz`。
如果檢查持續失敗，Docker 會將容器標記為 `unhealthy`，而
編排系統可以重新啟動或取代它。

已驗證的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 與 loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此主機可透過
Docker 連接埠發布存取 `http://127.0.0.1:18789`。

- `lan`（預設）：主機瀏覽器和主機 CLI 可以連到已發布的 Gateway 連接埠。
- `loopback`：只有容器網路命名空間內的程序可以直接連到 Gateway。

<Note>
請在 `gateway.bind` 使用繫結模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用像 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機供應商

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器本身，
不是你的主機。對於在主機上執行的 AI 供應商，請使用
`host.docker.internal`：

| 供應商    | 主機預設 URL             | Docker 設定 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

內建 Docker 設定會將這些主機 URL 作為 LM Studio 和 Ollama 的入門設定預設值，
而 `docker-compose.yml` 會將 `host.docker.internal` 對應到 Linux
Docker Engine 的 Docker 主機 Gateway。Docker Desktop 已在 macOS 和 Windows
提供相同主機名稱。

主機服務也必須監聽可從 Docker 連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 命令，請自行加入相同主機對應，
例如 `--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker 橋接網路通常無法可靠轉送 Bonjour/mDNS 多播
（`224.0.0.251:5353`）。因此，內建 Compose 設定預設
`OPENCLAW_DISABLE_BONJOUR=1`，讓 Gateway 不會在橋接網路丟棄多播流量時
陷入當機循環或反覆重新啟動廣播。

Docker 主機請使用已發布的 Gateway URL、Tailscale 或廣域 DNS-SD。
只有在使用主機網路、macvlan 或其他已知 mDNS 多播可運作的網路時，才設定
`OPENCLAW_DISABLE_BONJOUR=0`。

如需注意事項與疑難排解，請參閱 [Bonjour 探索](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` 繫結掛載到 `/home/node/.openclaw`，
並將 `OPENCLAW_WORKSPACE_DIR` 繫結掛載到 `/home/node/.openclaw/workspace`，
因此這些路徑會在容器取代後保留。任一變數未設定時，內建
`docker-compose.yml` 會退回使用 `${HOME}/.openclaw`（工作區掛載則為
`${HOME}/.openclaw/workspace`），或在 `HOME` 本身也缺失時使用
`/tmp/.openclaw`。這可避免 `docker compose up` 在裸環境中發出空來源
磁碟區規格。

該掛載的設定目錄是 OpenClaw 保存下列內容的位置：

- 用於行為設定的 `openclaw.json`
- 用於已儲存供應商 OAuth/API 金鑰驗證的 `agents/<agentId>/agent/auth-profiles.json`
- 用於環境支援執行階段密鑰（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

已安裝的可下載 Plugin 會將其套件狀態儲存在掛載的 OpenClaw home 下，因此
Plugin 安裝記錄和套件根目錄會在容器取代後保留。Gateway 啟動不會產生
內建 Plugin 相依性樹。

如需 VM 部署的完整持久化詳細資訊，請參閱
[Docker VM 執行階段 - 持久化內容的位置](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：**留意 `media/`、工作階段 JSONL 檔案、
`cron/runs/*.jsonl`、已安裝的 plugin 套件根目錄，以及
`/tmp/openclaw/` 下的輪替檔案日誌。

### Shell 輔助工具（選用）

為了更輕鬆地進行日常 Docker 管理，請安裝 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是從舊的 `scripts/shell-helpers/clawdock-helpers.sh` raw 路徑安裝 ClawDock，請重新執行上方的安裝命令，讓你的本機輔助工具檔案追蹤新的位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。執行
`clawdock-help` 查看所有命令。
完整的輔助工具指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="啟用 Docker gateway 的代理 sandbox">
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

    該指令碼只會在 sandbox 前置需求通過後掛載 `docker.sock`。如果
    sandbox 設定無法完成，指令碼會將 `agents.defaults.sandbox.mode`
    重設為 `off`。當 OpenClaw sandbox 啟用時，Codex 程式碼模式回合仍會受限於 Codex
    `workspace-write`；請勿將主機 Docker socket 掛載到代理 sandbox 容器中。

  </Accordion>

  <Accordion title="自動化 / CI（非互動式）">
    使用 `-T` 停用 Compose pseudo-TTY 配置：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享網路安全注意事項">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI
    命令可以透過 `127.0.0.1` 連到 gateway。請將此視為共享的信任邊界。
    compose 設定會在 `openclaw-gateway` 和 `openclaw-cli` 上移除
    `NET_RAW`/`NET_ADMIN`，並啟用 `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 失敗">
    某些 Docker Desktop 設定在移除 `NET_RAW` 後，會讓共享網路的
    `openclaw-cli` sidecar 發生 DNS 查詢失敗，這會在
    `openclaw plugins install` 等由 npm 支援的命令期間顯示為
    `EAI_AGAIN`。一般 gateway 操作請保留預設的強化 compose 檔。下方的
    本機 override 會透過還原 Docker 的預設 capabilities 來放寬 CLI 容器的安全態勢，
    因此只應用於需要套件 registry 存取的一次性 CLI 命令，不要作為預設的 Compose
    呼叫方式：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已經建立長時間執行的 `openclaw-cli` 容器，請使用相同 override 重新建立它。
    `docker compose exec` 和 `docker exec` 無法變更已建立容器上的 Linux capabilities。

  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）執行。如果你在
    `/home/node/.openclaw` 看到權限錯誤，請確認主機 bind mount 的擁有者是 uid 1000：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    相同的不一致也可能顯示為 plugin 警告，例如
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    後面接著 `plugin present but blocked`。這表示程序 uid 與掛載的 plugin 目錄擁有者不一致。
    建議以預設 uid 1000 執行容器，並修正 bind mount 擁有權。只有在你刻意長期以 root
    執行 OpenClaw 時，才將 `/path/to/openclaw-config/npm` chown 為 `root:root`。

  </Accordion>

  <Accordion title="更快的重新建置">
    排列 Dockerfile，讓相依性層可被快取。這可避免除非 lockfile 變更，否則重新執行
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
    預設映像檔以安全優先，並以非 root 的 `node` 執行。若要功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **內建系統相依套件**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **內建 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`
    4. **或將 Playwright 瀏覽器安裝到持久化 volume**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **持久化瀏覽器下載**：使用 `OPENCLAW_HOME_VOLUME` 或
       `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 會在 Linux 上自動偵測 Docker 映像檔中由
       Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（headless Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟一個瀏覽器 URL。在
    Docker 或 headless 設定中，請複製你最後抵達的完整 redirect URL，並將它貼回
    精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像檔中繼資料">
    主要 Docker runtime 映像檔使用 `node:24-bookworm-slim`，並包含 `tini` 作為 entrypoint init process（PID 1），以確保在長時間執行的容器中能回收 zombie processes 並正確處理 signals。它會發布 OCI 基礎映像檔 annotations，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 及其他項目。Node 基礎 digest 會
    透過 Dependabot Docker base-image PRs 更新；release builds 不會執行
    distro upgrade layer。請參閱
    [OCI image annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 和
[Docker VM Runtime](/zh-TW/install/docker-vm-runtime)，了解共享 VM 部署步驟，
包括 binary baking、持久化與更新。

## 代理 sandbox

當 `agents.defaults.sandbox` 以 Docker backend 啟用時，gateway
會在隔離的 Docker 容器中執行代理工具執行（shell、檔案讀寫等），
而 gateway 本身仍留在主機上。這讓你能在不將整個
gateway 容器化的情況下，為不受信任或多租戶代理工作階段建立硬隔離牆。

Sandbox scope 可以是每個代理（預設）、每個工作階段，或共享。每個 scope
都有自己的工作區掛載在 `/workspace`。你也可以設定
允許/拒絕工具政策、網路隔離、資源限制與瀏覽器
容器。

完整設定、映像檔、安全注意事項與多代理設定檔，請參閱：

- [Sandboxing](/zh-TW/gateway/sandboxing) -- 完整 sandbox 參考
- [OpenShell](/zh-TW/gateway/openshell) -- 互動式 shell 存取 sandbox 容器
- [Multi-Agent Sandbox and Tools](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理的 override

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

若是沒有原始碼 checkout 的 npm 安裝，請參閱 [Sandboxing § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌的 `docker build` 命令。

## 疑難排解

<AccordionGroup>
  <Accordion title="映像檔遺失或 sandbox 容器未啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （原始碼 checkout）或 [Sandboxing § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的內嵌 `docker build` 命令（npm install）
    建置 sandbox 映像檔，
    或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像檔。
    容器會依需求為每個工作階段自動建立。
  </Accordion>

  <Accordion title="sandbox 中的權限錯誤">
    將 `docker.user` 設為符合掛載工作區擁有權的 UID:GID，
    或 chown 工作區資料夾。
  </Accordion>

  <Accordion title="sandbox 中找不到自訂工具">
    OpenClaw 使用 `sh -lc`（login shell）執行命令，這會 source
    `/etc/profile` 且可能重設 PATH。設定 `docker.env.PATH` 來前置你的
    自訂工具路徑，或在 Dockerfile 中於 `/etc/profile.d/` 下加入指令碼。
  </Accordion>

  <Accordion title="映像檔建置期間因 OOM 被終止（exit 137）">
    VM 至少需要 2 GB RAM。使用較大的機器等級後重試。
  </Accordion>

  <Accordion title="Control UI 中未授權或需要配對">
    取得新的 dashboard 連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多詳細資訊：[Dashboard](/zh-TW/web/dashboard)、[Devices](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="Gateway target 顯示 ws://172.x.x.x 或 Docker CLI 出現配對錯誤">
    重設 gateway 模式與 bind：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相關

- [安裝概觀](/zh-TW/install) — 所有安裝方法
- [Podman](/zh-TW/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-TW/install/clawdock) — Docker Compose 社群設定
- [更新](/zh-TW/install/updating) — 讓 OpenClaw 保持最新
- [設定](/zh-TW/gateway/configuration) — 安裝後的 gateway 設定
