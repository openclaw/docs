---
read_when:
    - 你想要容器化閘道，而不是本機安裝
    - 你正在驗證 Docker 流程
summary: 選用的 Docker 型設定與 OpenClaw 入門導引
title: Docker
x-i18n:
    generated_at: "2026-07-01T12:47:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5dac26b3e9c31cf563610b2c419872233ad0ac79d28052125a33c0ee6d3b7bc
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。只有在你想要容器化閘道，或想驗證 Docker 流程時才使用。

## Docker 適合我嗎？

- **是**：你想要隔離、可拋棄的閘道環境，或想在沒有本機安裝項目的主機上執行 OpenClaw。
- **否**：你正在自己的機器上執行，只想要最快的開發迴圈。請改用一般安裝流程。
- **沙箱注意事項**：啟用沙箱時，預設沙箱後端會使用 Docker，但沙箱預設為關閉，且**不**需要讓完整閘道在 Docker 中執行。SSH 和 OpenShell 沙箱後端也可使用。請參閱[沙箱](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用於映像建置（在 1 GB 主機上，`pnpm install` 可能因 OOM 被終止並以 137 結束）
- 足夠的磁碟空間存放映像和記錄
- 如果在 VPS/公開主機上執行，請檢閱
  [網路暴露的安全強化](/zh-TW/gateway/security)，
  特別是 Docker `DOCKER-USER` 防火牆政策。

## 容器化閘道

<Steps>
  <Step title="建置映像">
    從 repo 根目錄執行設定指令碼：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機建置閘道映像。若要改用預先建置的映像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像會先發布到
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    GHCR 是發布自動化、釘選部署和來源驗證的主要 registry。
    相同的發布工作流程也會在 Docker Hub 發布官方鏡像 `openclaw/openclaw`，
    供偏好 Docker Hub 的主機使用：

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    使用 `ghcr.io/openclaw/openclaw` 或 `openclaw/openclaw`。避免使用社群
    Docker Hub 鏡像，因為 OpenClaw 無法控制其發布時程、重新建置或保留政策。
    常見官方標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`），以及
    `2026.2.26-beta.1` 等 beta 版本。Beta 標籤不會移動 `latest` 或 `main`。

  </Step>

  <Step title="Airgapped 重新執行">
    在離線主機上，請先傳輸並載入映像：

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` 會驗證 `OPENCLAW_IMAGE` 已存在於本機、停用隱含的 Compose 拉取與建置，
    然後執行一般設定流程，例如 `.env` 同步、權限修正、onboarding、閘道設定同步，
    以及 Compose 啟動。

    如果 `OPENCLAW_SANDBOX=1`，離線設定也會檢查
    `OPENCLAW_DOCKER_SOCKET` 背後 daemon 上已設定的預設沙箱映像，
    以及各 agent 作用中的沙箱映像。Docker 支援的瀏覽器映像也必須帶有目前的
    OpenClaw 瀏覽器合約標籤。當必要映像缺少或不相容時，設定會直接結束且不變更沙箱設定，
    而不是回報成功但留下無法使用的沙箱。

  </Step>

  <Step title="完成 onboarding">
    設定指令碼會自動執行 onboarding。它會：

    - 提示輸入 provider API keys
    - 產生閘道 token 並寫入 `.env`
    - 建立 auth-profile secret key 目錄
    - 透過 Docker Compose 啟動閘道

    設定期間，啟動前 onboarding 和設定寫入會直接透過
    `openclaw-gateway` 執行。`openclaw-cli` 則用於閘道容器已存在後你要執行的命令。

  </Step>

  <Step title="開啟控制介面">
    在瀏覽器中開啟 `http://127.0.0.1:18789/`，並將已設定的共享密鑰貼到 Settings。
    設定指令碼預設會將 token 寫入 `.env`；如果你將容器設定切換為密碼驗證，
    請改用該密碼。

    需要再次取得 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="設定 channels（選用）">
    使用命令列介面容器新增訊息 channels：

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
請在任何標準 override 檔案之後包含它，例如當兩個 override 檔案都存在時使用
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

<Note>
因為 `openclaw-cli` 共享 `openclaw-gateway` 的網路命名空間，所以它是啟動後工具。
在 `docker compose up -d openclaw-gateway` 之前，請透過
`openclaw-gateway` 搭配 `--no-deps --entrypoint node` 執行 onboarding
和設定期間的設定寫入。
</Note>

### 環境變數

設定指令碼接受下列選用環境變數：

| 變數                                            | 用途                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | 使用遠端映像，而不是在本機建置                                      |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | 建置期間安裝額外 apt 套件（以空格分隔）                              |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | 建置期間安裝額外 Python 套件（以空格分隔）                           |
| `OPENCLAW_EXTENSIONS`                           | 在建置期間預先安裝外掛相依項（以空格分隔的名稱）                    |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | 覆寫本機原始碼建置的節點選項                                        |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | 覆寫本機原始碼建置的 tsdown heap，單位為 MB                          |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | 在僅執行階段的本機映像建置期間跳過 declaration 輸出                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | 額外的主機 bind mounts（逗號分隔的 `source:target[:opts]`）           |
| `OPENCLAW_HOME_VOLUME`                          | 將 `/home/node` 持久化到具名 Docker volume                           |
| `OPENCLAW_SANDBOX`                              | 選擇啟用沙箱 bootstrap（`1`、`true`、`yes`、`on`）                   |
| `OPENCLAW_SKIP_ONBOARDING`                      | 跳過互動式 onboarding 步驟（`1`、`true`、`yes`、`on`）               |
| `OPENCLAW_DOCKER_SOCKET`                        | 覆寫 Docker socket 路徑                                               |
| `OPENCLAW_DISABLE_BONJOUR`                      | 停用 Bonjour/mDNS 廣告（Docker 預設為 `1`）                           |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 停用 bundled 外掛原始碼 bind-mount overlays                          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry 匯出的共享 OTLP/HTTP collector endpoint                |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | traces、metrics 或 logs 的 signal-specific OTLP endpoints            |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP protocol 覆寫。目前僅支援 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry resources 使用的服務名稱                               |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 選擇啟用最新實驗性 GenAI semantic attributes                         |
| `OPENCLAW_OTEL_PRELOADED`                       | 已預載 SDK 時，跳過啟動第二個 OpenTelemetry SDK                     |

官方 Docker 映像不隨附 Homebrew。Onboarding 期間，當 OpenClaw 在沒有 `brew`
的 Linux 容器中執行時，會隱藏僅支援 brew 的 skill 相依安裝器；這些相依項必須由自訂映像提供，
或手動安裝。對於 Debian 套件提供的相依項，請在映像建置期間使用
`OPENCLAW_IMAGE_APT_PACKAGES`。舊版 `OPENCLAW_DOCKER_APT_PACKAGES` 名稱仍可接受。
對於 Python 相依項，請使用 `OPENCLAW_IMAGE_PIP_PACKAGES`。這會在映像建置期間執行
`python3 -m pip install --break-system-packages`，因此請釘選套件版本，並只使用你信任的套件索引。
原始碼建置會將 `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS` 預設為
`--max-old-space-size=8192`，並讓 `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB`
保持未設定，讓 tsdown wrapper 可以遵守容器記憶體限制。它們也會預設
`OPENCLAW_DOCKER_BUILD_SKIP_DTS=1`，因為 runtime 映像會在建置後修剪 declaration
檔案。如果 Docker 回報 `ResourceExhausted`、`cannot allocate memory`，或在
`tsdown` 期間中止，請增加 Docker builder 記憶體限制，或使用較小的明確 heap 重試，例如
`OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096`。

維護者可以透過將一個外掛原始碼目錄掛載到其 packaged source path 上，針對 packaged image
測試 bundled 外掛原始碼，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
該掛載的原始碼目錄會覆寫相同外掛 id 對應的已編譯
`/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出是從閘道容器對你的 OTLP collector 進行 outbound。
它不需要發布 Docker port。如果你在本機建置映像，並希望 bundled OpenTelemetry exporter
可在映像內使用，請包含它的 runtime 相依項：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在 packaged Docker 安裝中，請先從 ClawHub 安裝官方
`@openclaw/diagnostics-otel` 外掛，再啟用匯出。自訂原始碼建置映像仍可使用
`OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本機外掛原始碼。若要啟用匯出，
請在設定中允許並啟用 `diagnostics-otel` 外掛，然後設定
`diagnostics.otel.enabled=true`，或使用 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)
中的設定範例。Collector auth headers 透過 `diagnostics.otel.headers` 設定，
而不是透過 Docker 環境變數。

Prometheus metrics 使用已發布的閘道 port。安裝
`clawhub:@openclaw/diagnostics-prometheus`、啟用
`diagnostics-prometheus` 外掛，然後 scrape：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

此 route 受閘道驗證保護。請勿暴露獨立的公開 `/metrics` port
或未驗證的 reverse-proxy path。請參閱 [Prometheus metrics](/zh-TW/gateway/prometheus)。

### 健康檢查

容器 probe endpoints（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

Docker 映像檔包含內建的 `HEALTHCHECK`，會 ping `/healthz`。
如果檢查持續失敗，Docker 會將容器標記為 `unhealthy`，而
編排系統可以重新啟動或取代它。

已驗證的深度健康狀態快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 與 loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此主機可透過 Docker 連接埠發布存取
`http://127.0.0.1:18789`。

- `lan`（預設）：主機瀏覽器與主機命令列介面可以連到已發布的閘道連接埠。
- `loopback`：只有容器網路命名空間內的程序可以直接連到
  閘道。

<Note>
請在 `gateway.bind` 中使用綁定位模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），不要使用像 `0.0.0.0` 或 `127.0.0.1` 這類主機別名。
</Note>

### 主機本機供應器

當 OpenClaw 在 Docker 中執行時，容器內的 `127.0.0.1` 是容器
本身，不是你的主機。請針對在主機上執行的 AI 供應器使用 `host.docker.internal`：

| 供應器    | 主機預設 URL           | Docker 設定 URL                    |
| --------- | ---------------------- | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234` | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

隨附的 Docker 設定會使用這些主機 URL 作為 LM Studio 與 Ollama
入門設定預設值，而 `docker-compose.yml` 會在 Linux Docker Engine 上將 `host.docker.internal` 對應到
Docker 的主機閘道。Docker Desktop 已在 macOS 與 Windows 上提供
相同的主機名稱。

主機服務也必須監聽 Docker 可連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 檔案或 `docker run` 命令，請自行加入相同的主機
對應，例如
`--add-host=host.docker.internal:host-gateway`。

### Docker 中的 Claude 命令列介面後端

官方 OpenClaw Docker 映像檔不會預先安裝 Claude Code。請在執行 OpenClaw 的容器使用者內安裝並
登入 Claude Code，然後持久化該容器 home，讓映像檔升級不會清除二進位檔或 Claude 驗證
狀態。

對於新的 Docker 安裝，請先啟用持久化 `/home/node` volume，再執行
設定：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

對於既有 Docker 安裝，請先停止 stack，並在重新執行 setup 前重新載入目前的
Docker `.env` 值。setup 指令碼不會自行讀取
`.env`；它會依據目前 shell 與預設值重寫 `.env`。對於
產生的 `.env`，請執行：

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

如果你的 `.env` 包含 shell 無法 source 的值，請先手動重新 export 你仰賴的
既有值，例如 `OPENCLAW_IMAGE`、連接埠、綁定位模式、
自訂路徑、`OPENCLAW_EXTRA_MOUNTS`、sandbox，以及略過入門設定。
產生的 overlay 會同時為 `openclaw-gateway` 與
`openclaw-cli` 掛載 home volume。

請使用產生的 Compose overlay 執行其餘命令，讓兩個服務都
掛載持久化 home。如果你的設定也使用 `docker-compose.override.yml`，
請在 `docker-compose.extra.yml` 前包含它。

在該持久化 home 中安裝 Claude Code：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

原生安裝程式會將 `claude` 二進位檔寫入
`/home/node/.local/bin/claude`。請告訴 OpenClaw 使用該容器路徑：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

從相同的持久化容器 home 內登入並驗證：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

之後，你可以使用隨附的 `claude-cli` 後端：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` 會持久化位於
`/home/node/.local/bin` 與 `/home/node/.local/share/claude` 下的原生 Claude Code 安裝，加上位於 `/home/node/.claude` 與 `/home/node/.claude.json` 下的 Claude Code
設定與驗證狀態。
只持久化 `/home/node/.openclaw` 不足以重複使用 Claude 命令列介面。如果
你使用 `OPENCLAW_EXTRA_MOUNTS` 而不是 home volume，請將所有這些
Claude 路徑掛載到兩個 Docker 服務中。

<Note>
對於共享的生產自動化或可預測的 Anthropic 帳單，請優先使用
Anthropic API 金鑰路徑。Claude 命令列介面重複使用會遵循 Claude Code 已安裝的
版本、帳戶登入、帳單與更新行為。
</Note>

### Bonjour / mDNS

Docker bridge 網路通常無法可靠轉送 Bonjour/mDNS multicast
(`224.0.0.251:5353`)。因此隨附的 Compose 設定預設
`OPENCLAW_DISABLE_BONJOUR=1`，讓閘道在 bridge 丟棄 multicast 流量時不會 crash-loop 或反覆
重新開始公告。

請對 Docker 主機使用已發布的閘道 URL、Tailscale，或 wide-area DNS-SD。
只有在使用 host networking、macvlan，或其他已知 mDNS multicast 可運作的網路時，才設定 `OPENCLAW_DISABLE_BONJOUR=0`。

如需注意事項與疑難排解，請參閱 [Bonjour 探索](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` bind-mount 到 `/home/node/.openclaw`，
將 `OPENCLAW_WORKSPACE_DIR` bind-mount 到 `/home/node/.openclaw/workspace`，並將
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` bind-mount 到 `/home/node/.config/openclaw`，因此這些
路徑會在容器被取代後保留下來。當任何變數未設定時，隨附的
`docker-compose.yml` 會 fallback 到 `${HOME}` 之下，或在 `HOME` 本身也
缺失時 fallback 到 `/tmp`。這可避免 `docker compose up` 在裸環境中輸出空來源
volume 規格。

該已掛載的 config 目錄是 OpenClaw 儲存下列內容的位置：

- `openclaw.json`，用於行為 config
- `agents/<agentId>/agent/auth-profiles.json`，用於儲存的供應器 OAuth/API 金鑰驗證
- `.env`，用於 env-backed runtime secrets，例如 `OPENCLAW_GATEWAY_TOKEN`

auth-profile secret key 目錄會儲存用於
OAuth-backed auth profile token material 的本機加密金鑰。請將它與你的 Docker 主機狀態保存在一起，
但與 `OPENCLAW_CONFIG_DIR` 分開。

已安裝的可下載外掛會將其套件狀態儲存在已掛載的
OpenClaw home 之下，因此外掛安裝記錄與套件根目錄會在容器
取代後保留下來。閘道啟動不會產生 bundled-plugin dependency trees。

如需 VM 部署的完整持久化詳細資訊，請參閱
[Docker VM Runtime - 內容持久化位置](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟成長熱點：**請留意 `media/`、session JSONL 檔案、共享
SQLite state database、已安裝外掛套件根目錄，以及
`/tmp/openclaw/` 下的 rolling file logs。

### Shell helper（選用）

若要更輕鬆地進行日常 Docker 管理，請安裝 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是從較舊的 `scripts/shell-helpers/clawdock-helpers.sh` raw path 安裝 ClawDock，請重新執行上面的安裝命令，讓你的本機 helper 檔案追蹤新的位置。

接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。執行
`clawdock-help` 查看所有命令。
完整 helper 指南請參閱 [ClawDock](/zh-TW/install/clawdock)。

<AccordionGroup>
  <Accordion title="啟用 Docker 閘道的代理 sandbox">
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

    指令碼只會在 sandbox prerequisites 通過後掛載 `docker.sock`。如果
    sandbox 設定無法完成，指令碼會將 `agents.defaults.sandbox.mode`
    重設為 `off`。在 OpenClaw sandbox 啟用時，Codex code-mode turn 仍受限於 Codex
    `workspace-write`；不要將
    host Docker socket 掛載到 agent sandbox 容器中。

  </Accordion>

  <Accordion title="自動化 / CI（非互動式）">
    使用 `-T` 停用 Compose pseudo-TTY 配置：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network 安全性注意事項">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，讓命令列介面
    命令可以透過 `127.0.0.1` 連到閘道。請將此視為共享的
    信任邊界。compose config 會在 `openclaw-gateway` 與 `openclaw-cli` 上 drop `NET_RAW`/`NET_ADMIN`，並啟用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 失敗">
    某些 Docker Desktop 設定在 drop `NET_RAW` 後，會讓 shared-network
    `openclaw-cli` sidecar 的 DNS lookup 失敗，這會在
    npm-backed 命令（例如 `openclaw plugins install`）期間顯示為
    `EAI_AGAIN`。
    一般閘道操作請保留預設的強化 compose 檔案。下面的
    本機 override 會透過還原 Docker 預設 capabilities 來放寬命令列介面容器的安全態勢，因此只應用於需要套件 registry 存取的一次性命令列介面
    命令，而不要作為你的預設 Compose
    invocation：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已經建立長時間執行的 `openclaw-cli` 容器，請使用相同的 override 重新建立它。`docker compose exec` 與 `docker exec` 無法
    變更已建立容器上的 Linux capabilities。

  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）執行。如果你在
    `/home/node/.openclaw` 看到權限錯誤，請確保你的主機 bind mounts 由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    相同的不匹配可能會以外掛警告顯示，例如
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    後面接著 `plugin present but blocked`。這表示程序 uid 與
    已掛載外掛目錄擁有者不一致。建議以
    預設 uid 1000 執行容器，並修正 bind mount ownership。只有在你有意長期以 root 執行
    OpenClaw 時，才將
    `/path/to/openclaw-config/npm` chown 為 `root:root`。

  </Accordion>

  <Accordion title="更快速重建">
    請安排 Dockerfile 順序，讓依賴層可被快取。這可避免除非 lockfiles 變更才重新執行
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
    預設映像以安全性優先，並以非 root 的 `node` 執行。若需要功能更完整的容器：

    1. **保留 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **預先封裝系統相依套件**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **預先封裝 Python 相依套件**：`export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **預先封裝 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`
    5. **或將 Playwright 瀏覽器安裝到持久化磁碟區**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **保留瀏覽器下載內容**：使用 `OPENCLAW_HOME_VOLUME` 或
       `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 會在 Linux 上自動偵測 Docker 映像中由
       Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（無頭 Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟瀏覽器網址。在
    Docker 或無頭設定中，請複製你最後到達的完整重新導向網址，並貼回
    精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像中繼資料">
    主要 Docker 執行階段映像使用 `node:24-bookworm-slim`，並包含 `tini` 作為進入點初始化程序（PID 1），以確保長時間執行的容器能正確回收殭屍程序並處理訊號。它會發布 OCI 基礎映像註解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。節點基礎摘要會透過 Dependabot Docker 基礎映像 PR 更新；發行建置不會執行
    發行版升級層。請參閱
    [OCI 映像註解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 和
[Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)，了解共享 VM 部署步驟，
包括二進位封裝、持久化與更新。

## 代理沙盒

當 `agents.defaults.sandbox` 啟用 Docker 後端時，閘道會在隔離的 Docker
容器內執行代理工具（殼層、檔案讀取/寫入等），而閘道本身仍留在主機上。這會在不需將整個
閘道容器化的情況下，為不受信任或多租戶代理工作階段建立硬性隔離。

沙盒範圍可以是每個代理（預設）、每個工作階段，或共享。每個範圍
都有自己的工作區掛載在 `/workspace`。你也可以設定
允許/拒絕工具政策、網路隔離、資源限制與瀏覽器
容器。

完整設定、映像、安全注意事項與多代理設定檔，請參閱：

- [沙盒化](/zh-TW/gateway/sandboxing) -- 完整沙盒參考
- [OpenShell](/zh-TW/gateway/openshell) -- 對沙盒容器的互動式殼層存取
- [多代理沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每代理覆寫

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

建置預設沙盒映像（從原始碼 checkout）：

```bash
scripts/sandbox-setup.sh
```

若 npm 安裝沒有原始碼 checkout，請參閱 [沙盒化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，了解內嵌 `docker build` 命令。

## 疑難排解

<AccordionGroup>
  <Accordion title="映像遺失或沙盒容器無法啟動">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （原始碼 checkout）或 [沙盒化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的內嵌 `docker build` 命令（npm 安裝）
    來建置沙盒映像，
    或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像。
    容器會依需求為每個工作階段自動建立。
  </Accordion>

  <Accordion title="沙盒中的權限錯誤">
    將 `docker.user` 設為符合你掛載工作區擁有權的 UID:GID，
    或對工作區資料夾執行 chown。
  </Accordion>

  <Accordion title="在沙盒中找不到自訂工具">
    OpenClaw 會以 `sh -lc`（登入殼層）執行命令，這會載入
    `/etc/profile`，且可能重設 PATH。設定 `docker.env.PATH` 以預先加入你的
    自訂工具路徑，或在 Dockerfile 的 `/etc/profile.d/` 下新增指令碼。
  </Accordion>

  <Accordion title="映像建置期間因 OOM 被終止（結束碼 137）">
    VM 至少需要 2 GB RAM。請使用較大的機器類型並重試。
  </Accordion>

  <Accordion title="Control UI 中顯示未授權或需要配對">
    擷取新的儀表板連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多詳細資訊：[儀表板](/zh-TW/web/dashboard)、[裝置](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="閘道目標顯示 ws://172.x.x.x，或 Docker 命令列介面出現配對錯誤">
    重設閘道模式與繫結：

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
- [設定](/zh-TW/gateway/configuration) — 安裝後的閘道設定
