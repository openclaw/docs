---
read_when:
    - 你想要使用容器化 Gateway，而不是本機安裝
    - 您正在驗證 Docker 流程
summary: OpenClaw 可選的 Docker 型設定與入門導覽
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:39:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。只有在你想要容器化 Gateway，或想驗證 Docker 流程時才使用。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的 Gateway 環境，或想在沒有本機安裝的主機上執行 OpenClaw。
- **否**：你是在自己的機器上執行，只想要最快的開發迴圈。請改用一般安裝流程。
- **沙箱注意事項**：啟用沙箱時，預設沙箱後端會使用 Docker，但沙箱預設為關閉，且**不**需要讓完整 Gateway 在 Docker 中執行。也可使用 SSH 和 OpenShell 沙箱後端。請參閱[沙箱](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 映像建置至少需要 2 GB RAM（`pnpm install` 在 1 GB 主機上可能會因 OOM 被終止，結束碼為 137）
- 足夠的磁碟空間存放映像和記錄
- 如果在 VPS/公開主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  特別是 Docker `DOCKER-USER` 防火牆政策。

## 容器化 Gateway

<Steps>
  <Step title="建置映像">
    從 repo 根目錄執行設定腳本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機建置 Gateway 映像。若要改用預先建置的映像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像發布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常用標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成上手設定">
    設定腳本會自動執行上手設定。它會：

    - 提示輸入提供者 API 金鑰
    - 產生 Gateway token 並寫入 `.env`
    - 透過 Docker Compose 啟動 Gateway

    在設定期間，啟動前的上手設定和 config 寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 是給你在
    Gateway 容器已存在後執行命令時使用的。

  </Step>

  <Step title="開啟控制 UI">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將已設定的
    共用密鑰貼到 Settings。設定腳本預設會將 token 寫入 `.env`；
    如果你將容器 config 切換為密碼驗證，請改用該密碼。

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
請從 repo 根目錄執行 `docker compose`。如果你啟用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，設定腳本會寫入 `docker-compose.extra.yml`；
請使用 `-f docker-compose.yml -f docker-compose.extra.yml` 一併包含它。
</Note>

<Note>
因為 `openclaw-cli` 共用 `openclaw-gateway` 的網路命名空間，所以它是
啟動後工具。在執行 `docker compose up -d openclaw-gateway` 之前，請透過
`openclaw-gateway` 搭配 `--no-deps --entrypoint node` 執行上手設定
和設定期間的 config 寫入。
</Note>

### 環境變數

設定腳本接受以下選用環境變數：

| 變數                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用遠端映像，而不是在本機建置                                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | 建置期間安裝額外 apt 套件（以空格分隔）                         |
| `OPENCLAW_EXTENSIONS`                      | 在建置期間包含選定的內建 Plugin 輔助工具                        |
| `OPENCLAW_EXTRA_MOUNTS`                    | 額外主機繫結掛載（以逗號分隔的 `source:target[:opts]`）          |
| `OPENCLAW_HOME_VOLUME`                     | 將 `/home/node` 持久化到具名 Docker volume                      |
| `OPENCLAW_SANDBOX`                         | 選擇啟用沙箱 bootstrap（`1`、`true`、`yes`、`on`）               |
| `OPENCLAW_SKIP_ONBOARDING`                 | 略過互動式上手設定步驟（`1`、`true`、`yes`、`on`）               |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆寫 Docker socket 路徑                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 停用 Bonjour/mDNS 廣告（Docker 預設為 `1`）                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 停用內建 Plugin 原始碼繫結掛載 overlay                          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | 用於 OpenTelemetry 匯出的共用 OTLP/HTTP collector endpoint      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 針對 traces、metrics 或 logs 的訊號特定 OTLP endpoint           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 協定覆寫。目前僅支援 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry resource 使用的服務名稱                           |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 選擇啟用最新實驗性 GenAI 語意屬性                               |
| `OPENCLAW_OTEL_PRELOADED`                  | 若已預先載入一個 OpenTelemetry SDK，則略過啟動第二個             |

維護者可以透過將一個 Plugin 原始碼目錄掛載到其封裝後原始碼路徑上，
來針對封裝映像測試內建 Plugin 原始碼，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該掛載的原始碼目錄會針對相同 Plugin id 覆寫相符的已編譯
`/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出是從 Gateway 容器對外送到你的 OTLP
collector。它不需要發布 Docker port。如果你在本機建置映像，
並希望映像內可使用內建 OpenTelemetry exporter，請包含其 runtime 相依項：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在封裝式 Docker 安裝中，請先從 ClawHub 安裝官方
`@openclaw/diagnostics-otel` Plugin，再啟用匯出。自訂從原始碼建置的映像
仍可使用 `OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本機 Plugin 原始碼。
若要啟用匯出，請在 config 中允許並啟用 `diagnostics-otel` Plugin，
然後設定 `diagnostics.otel.enabled=true`，或使用
[OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)中的 config 範例。
Collector auth headers 透過 `diagnostics.otel.headers` 設定，
不是透過 Docker 環境變數。

Prometheus metrics 使用已發布的 Gateway port。安裝
`clawhub:@openclaw/diagnostics-prometheus`，啟用
`diagnostics-prometheus` Plugin，然後 scrape：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

此路由受 Gateway 驗證保護。不要暴露獨立的公開 `/metrics` port
或未經驗證的反向代理路徑。請參閱
[Prometheus metrics](/zh-TW/gateway/prometheus)。

### 健康檢查

容器探測 endpoint（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 映像包含內建 `HEALTHCHECK`，會 ping `/healthz`。
如果檢查持續失敗，Docker 會將容器標記為 `unhealthy`，而
orchestration 系統可以重新啟動或替換它。

已驗證的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 與 loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此主機可透過
Docker port 發布存取 `http://127.0.0.1:18789`。

- `lan`（預設）：主機瀏覽器和主機 CLI 可連到已發布的 Gateway port。
- `loopback`：只有容器網路命名空間內的程序可直接連到
  Gateway。

<Note>
請使用 `gateway.bind` 中的 bind mode 值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用像 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機提供者

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器
本身，不是你的主機。對於在主機上執行的 AI 提供者，請使用
`host.docker.internal`：

| 提供者    | 主機預設 URL            | Docker 設定 URL                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

內建 Docker 設定會將這些主機 URL 作為 LM Studio 和 Ollama
上手設定預設值，且 `docker-compose.yml` 會在 Linux Docker Engine 上將
`host.docker.internal` 對應到 Docker 的 host gateway。Docker Desktop
在 macOS 和 Windows 上已提供相同 hostname。

主機服務也必須監聽 Docker 可連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 命令，請自行新增相同的
主機對應，例如 `--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker bridge networking 通常無法可靠轉送 Bonjour/mDNS multicast
（`224.0.0.251:5353`）。因此內建 Compose 設定預設
`OPENCLAW_DISABLE_BONJOUR=1`，讓 Gateway 不會在 bridge 丟棄 multicast
流量時 crash-loop 或反覆重新啟動廣告。

Docker 主機請使用已發布的 Gateway URL、Tailscale，或 wide-area DNS-SD。
只有在使用 host networking、macvlan，或其他已知 mDNS multicast 可運作的網路時，
才設定 `OPENCLAW_DISABLE_BONJOUR=0`。

如需注意事項與疑難排解，請參閱 [Bonjour 探索](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` 繫結掛載到 `/home/node/.openclaw`，
並將 `OPENCLAW_WORKSPACE_DIR` 繫結掛載到 `/home/node/.openclaw/workspace`，
因此這些路徑會在容器替換後保留。當任一變數未設定時，內建
`docker-compose.yml` 會 fallback 到 `${HOME}/.openclaw`（workspace 掛載則為
`${HOME}/.openclaw/workspace`），若 `HOME` 本身也不存在，則 fallback 到
`/tmp/.openclaw`。這可避免 `docker compose up` 在裸環境中輸出空來源 volume spec。

該掛載的 config 目錄是 OpenClaw 保存以下項目的位置：

- 用於行為 config 的 `openclaw.json`
- 用於已儲存提供者 OAuth/API-key auth 的 `agents/<agentId>/agent/auth-profiles.json`
- 用於 env-backed runtime secret（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

已安裝的可下載 Plugin 會將其 package 狀態儲存在已掛載的
OpenClaw home 下，因此 Plugin 安裝記錄和 package root 會在容器替換後保留。
Gateway 啟動不會產生內建 Plugin 相依樹。

如需 VM 部署的完整持久化詳細資訊，請參閱
[Docker VM Runtime - 內容會持久保存在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：**留意 `media/`、工作階段 JSONL 檔案、
`cron/runs/*.jsonl`、已安裝 Plugin 套件根目錄，以及
`/tmp/openclaw/` 底下的輪替檔案日誌。

### Shell 輔助工具（選用）

為了讓日常 Docker 管理更簡單，請安裝 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是從較舊的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路徑安裝 ClawDock，請重新執行上方的安裝命令，讓你的本機輔助檔案追蹤新的位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。執行
`clawdock-help` 可查看所有命令。
完整輔助工具指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="啟用 Docker Gateway 的代理沙箱">
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

    指令碼只會在沙箱先決條件通過後掛載 `docker.sock`。如果
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
    命令可以透過 `127.0.0.1` 存取 Gateway。請將此視為共用的
    信任邊界。Compose 設定會移除 `openclaw-gateway` 和 `openclaw-cli`
    上的 `NET_RAW`/`NET_ADMIN`，並啟用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 失敗">
    有些 Docker Desktop 設定在移除 `NET_RAW` 後，會讓共用網路的
    `openclaw-cli` sidecar DNS 查詢失敗，這會在 npm 支援的命令中顯示為
    `EAI_AGAIN`，例如 `openclaw plugins install`。
    一般 Gateway 操作請保留預設強化過的 Compose 檔案。下方的
    本機覆寫會透過還原 Docker 預設能力來放寬 CLI 容器的安全態勢，
    因此只應用於需要套件登錄檔存取的一次性 CLI
    命令，不要作為預設 Compose
    呼叫方式：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已經建立長時間執行的 `openclaw-cli` 容器，請使用相同覆寫重新建立它。
    `docker compose exec` 和 `docker exec` 無法
    變更已建立容器上的 Linux 能力。

  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）執行。如果你在
    `/home/node/.openclaw` 上看到權限錯誤，請確認主機 bind mount 由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同樣的不匹配也可能顯示為 Plugin 警告，例如
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    接著是 `plugin present but blocked`。這表示程序 uid 與
    已掛載 Plugin 目錄的擁有者不一致。建議以預設 uid 1000
    執行容器並修正 bind mount 擁有權。只有在你打算長期以 root
    執行 OpenClaw 時，才將 `/path/to/openclaw-config/npm` chown
    為 `root:root`。

  </Accordion>

  <Accordion title="更快重建">
    排列 Dockerfile，讓依賴層可以被快取。這可避免在 lockfile 沒有變更時重新執行
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
    預設映像檔以安全優先，並以非 root 的 `node` 執行。如需功能更完整的容器：

    1. **持久保存 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **內建系統依賴**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安裝 Playwright 瀏覽器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久保存瀏覽器下載**：使用 `OPENCLAW_HOME_VOLUME` 或
       `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 會在 Linux 上自動偵測 Docker 映像檔中
       由 Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（無頭 Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟瀏覽器 URL。在
    Docker 或無頭設定中，複製你抵達的完整重新導向 URL，並將它貼回
    精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像檔中繼資料">
    主要 Docker 執行階段映像檔使用 `node:24-bookworm-slim`，並包含 `tini` 作為 entrypoint init 程序（PID 1），以確保在長時間執行的容器中能回收 zombie 程序並正確處理訊號。它發布 OCI 基礎映像檔註解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。Node 基礎 digest
    會透過 Dependabot Docker 基礎映像檔 PR 更新；發行版本建置不會執行
    發行版升級層。請參閱
    [OCI 映像檔註解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 和
[Docker VM Runtime](/zh-TW/install/docker-vm-runtime)，了解共用 VM 部署步驟，
包括二進位檔內建、持久化和更新。

## 代理沙箱

當使用 Docker 後端啟用 `agents.defaults.sandbox` 時，Gateway
會在隔離的 Docker 容器內執行代理工具執行（shell、檔案讀取/寫入等），而 Gateway 本身會留在主機上。這會在不受信任或多租戶代理工作階段周圍提供硬隔離，
且不需要將整個 Gateway 容器化。

沙箱範圍可以是每個代理（預設）、每個工作階段或共用。每個範圍
都有自己的工作區，並掛載於 `/workspace`。你也可以設定
允許/拒絕工具政策、網路隔離、資源限制和瀏覽器
容器。

如需完整設定、映像檔、安全注意事項和多代理設定檔，請參閱：

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

建置預設沙箱映像檔（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh
```

若是沒有原始碼 checkout 的 npm 安裝，請參閱 [沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，了解行內 `docker build` 命令。

## 疑難排解

<AccordionGroup>
  <Accordion title="映像檔遺失或沙箱容器未啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （原始碼 checkout）或 [沙箱化 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的行內 `docker build` 命令（npm 安裝）
    來建置沙箱映像檔，
    或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像檔。
    容器會依需求為每個工作階段自動建立。
  </Accordion>

  <Accordion title="沙箱中的權限錯誤">
    將 `docker.user` 設為符合已掛載工作區擁有權的 UID:GID，
    或 chown 工作區資料夾。
  </Accordion>

  <Accordion title="在沙箱中找不到自訂工具">
    OpenClaw 會使用 `sh -lc`（login shell）執行命令，這會來源載入
    `/etc/profile` 並可能重設 PATH。設定 `docker.env.PATH` 以在前方加入你的
    自訂工具路徑，或在 Dockerfile 中於 `/etc/profile.d/` 下新增指令碼。
  </Accordion>

  <Accordion title="映像檔建置期間因 OOM 被終止（exit 137）">
    VM 需要至少 2 GB RAM。使用較大的機器類別後重試。
  </Accordion>

  <Accordion title="Control UI 中未授權或需要配對">
    取得新的儀表板連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多詳細資訊：[儀表板](/zh-TW/web/dashboard)、[裝置](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目標顯示 ws://172.x.x.x 或 Docker CLI 出現配對錯誤">
    重設 Gateway 模式和 bind：

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
- [設定](/zh-TW/gateway/configuration) — 安裝後的 Gateway 設定
