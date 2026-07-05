---
read_when:
    - 你想要容器化的閘道，而不是本機安裝
    - 你正在驗證 Docker 流程
summary: OpenClaw 的選用 Docker 架構設定與入門流程
title: Docker
x-i18n:
    generated_at: "2026-07-05T11:29:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7666fabb7e4815cd541d23487a16f973183c5239a7be9a9b7b2ed2d82e640a47
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用**的。可用於隔離、可丟棄的閘道環境，或沒有本機安裝項目的主機。如果你已經在自己的機器上開發，請改用一般安裝流程。

啟用 `agents.defaults.sandbox` 時，預設沙箱後端會使用 Docker，但沙箱預設為關閉，且不需要閘道本身在 Docker 中執行。也可使用 SSH 和 OpenShell 沙箱後端；請參閱[沙箱](/zh-TW/gateway/sandboxing)。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 映像建置至少需要 2 GB RAM（在 1 GB 主機上，`pnpm install` 可能因 OOM 被終止並以 137 結束）
- 足夠的磁碟空間用於映像和日誌
- 在 VPS/公開主機上，請檢閱[網路暴露的安全強化](/zh-TW/gateway/security)，尤其是 Docker `DOCKER-USER` 防火牆鏈

## 容器化閘道

<Steps>
  <Step title="建置映像">
    從儲存庫根目錄：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機將閘道映像建置為 `openclaw:local`。若要改用預先建置的映像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像會先發布到 [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。GHCR 是發布自動化、固定部署和來源檢查的主要登錄檔。同一個版本也會在 Docker Hub 發布鏡像 `openclaw/openclaw`：

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    使用 `ghcr.io/openclaw/openclaw` 或 `openclaw/openclaw`，並避免使用非官方鏡像，因為它們不共享 OpenClaw 的發布時間或保留政策。官方標籤：`main`、`latest`、`<version>`（例如 `2026.2.26`），以及像 `2026.2.26-beta.1` 這類 beta 標籤（beta 絕不會移動 `latest`/`main`）。預設的 `main`/`latest`/`<version>` 映像會內建 `codex` 和 `diagnostics-otel` 外掛。`-browser` 變體（例如 `latest-browser`）也會內建 Chromium，對於[沙箱化瀏覽器](/zh-TW/gateway/sandboxing#sandboxed-browser)工具很有用，無需首次執行 Playwright 安裝。

  </Step>

  <Step title="Airgapped 重新執行">
    在離線主機上，請先傳輸並載入映像：

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` 會確認 `OPENCLAW_IMAGE` 已在本機存在、停用隱式 Compose 拉取/建置，然後執行一般流程：`.env` 同步、權限修正、入門設定、閘道設定同步、Compose 啟動。

    如果 `OPENCLAW_SANDBOX=1`，離線設定也會檢查 `OPENCLAW_DOCKER_SOCKET` 後方 daemon 上已設定的預設與各代理沙箱映像，包括 Docker 後端瀏覽器映像上的瀏覽器合約標籤。如果必要映像缺失或過舊，設定會在不變更沙箱設定的情況下結束，而不是回報損壞的成功狀態。

  </Step>

  <Step title="完成入門設定">
    設定指令碼會自動執行入門設定：

    - 提示輸入供應商 API 金鑰
    - 產生閘道權杖並將其寫入 `.env`
    - 建立驗證設定檔秘密金鑰目錄
    - 透過 Docker Compose 啟動閘道

    啟動前的入門設定與設定寫入會直接透過 `openclaw-gateway` 執行（搭配 `--no-deps --entrypoint node`），因為 `openclaw-cli` 共享閘道的網路命名空間，且只有在閘道容器存在後才可運作。

  </Step>

  <Step title="開啟控制 UI">
    開啟 `http://127.0.0.1:18789/`，並將寫入 `.env` 的權杖貼到設定中。如果你已將容器切換為密碼驗證，請改用該密碼。

    還需要再次取得 URL 嗎？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="設定頻道（選用）">
    ```bash
    # WhatsApp（QR）
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

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
請從儲存庫根目錄執行 `docker compose`。如果你啟用了 `OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，設定指令碼會寫入 `docker-compose.extra.yml`；請將它包含在你自行維護的任何 `docker-compose.override.yml` 之後，例如 `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

### 環境變數

`scripts/docker/setup.sh` 接受的選用變數（對閘道容器而言，也可直接由 `docker-compose.yml` 接受）：

| 變數                                            | 用途                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | 使用遠端映像，而不是在本機建置                                                                          |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | 建置期間安裝額外 apt 套件（以空格分隔）。舊版別名：`OPENCLAW_DOCKER_APT_PACKAGES`                      |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | 建置期間安裝額外 Python 套件（以空格分隔）                                                             |
| `OPENCLAW_EXTENSIONS`                           | 在建置時預先安裝外掛依賴項（以逗號或空格分隔的 id）                                                    |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | 覆寫本機原始碼建置的節點選項（預設 `--max-old-space-size=8192`）                                        |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | 覆寫本機原始碼建置的 tsdown 堆積，單位為 MB                                                            |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | 在僅執行階段的本機映像建置期間略過宣告輸出（預設 `1`）                                                 |
| `OPENCLAW_INSTALL_BROWSER`                      | 在建置時將 Chromium + Xvfb 烘焙進映像                                                                   |
| `OPENCLAW_EXTRA_MOUNTS`                         | 額外主機繫結掛載（以逗號分隔的 `source:target[:opts]`）                                                |
| `OPENCLAW_HOME_VOLUME`                          | 將 `/home/node` 持久化到具名 Docker volume                                                              |
| `OPENCLAW_SANDBOX`                              | 選擇加入沙箱啟動程序（`1`、`true`、`yes`、`on`）                                                       |
| `OPENCLAW_SKIP_ONBOARDING`                      | 略過互動式入門設定步驟（`1`、`true`、`yes`、`on`）                                                     |
| `OPENCLAW_DOCKER_SOCKET`                        | 覆寫 Docker socket 路徑                                                                                 |
| `OPENCLAW_DISABLE_BONJOUR`                      | 強制 Bonjour/mDNS 廣播開啟（`0`）或關閉（`1`）；請參閱 [Bonjour / mDNS](#bonjour--mdns)                 |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 停用內建外掛原始碼繫結掛載覆蓋                                                                          |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | OpenTelemetry 匯出的共用 OTLP/HTTP 收集器端點                                                          |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | traces、metrics 或 logs 的訊號特定 OTLP 端點                                                           |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | OTLP 通訊協定覆寫。目前僅支援 `http/protobuf`                                                           |
| `OTEL_SERVICE_NAME`                             | OpenTelemetry resources 使用的服務名稱                                                                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 選擇加入最新實驗性 GenAI semantic attributes                                                            |
| `OPENCLAW_OTEL_PRELOADED`                       | 若已預先載入 OpenTelemetry SDK，則略過啟動第二個                                                        |

官方映像不內建 Homebrew。在入門設定期間，OpenClaw 會在沒有 `brew` 的 Linux 容器中隱藏僅支援 brew 的 skill 依賴安裝器；請透過自訂映像提供這些依賴項，或手動安裝。Debian 套件依賴項請使用 `OPENCLAW_IMAGE_APT_PACKAGES`，Python 依賴項請使用 `OPENCLAW_IMAGE_PIP_PACKAGES`（建置時會執行 `python3 -m pip install --break-system-packages`，因此請固定版本，且只使用你信任的索引）。

如果 Docker 回報 `ResourceExhausted`、`cannot allocate memory`，或在 `tsdown` 期間中止，請增加 Docker builder 記憶體限制，或使用較小的明確堆積重試：

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

若要針對已封裝映像測試內建外掛原始碼，請將一個外掛原始碼目錄掛載到其已封裝原始碼路徑上，例如 `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。這會針對相同外掛 id，覆寫相符的已編譯 `/app/dist/extensions/synology-chat` bundle。

### 可觀測性

OpenTelemetry 匯出是從閘道容器向外連到你的 OTLP 收集器；不需要發布 Docker 連接埠。若要在本機建置映像中包含內建匯出器：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方預先建置映像已內建 `diagnostics-otel`；只有在你移除它時，才需要自行安裝 `clawhub:@openclaw/diagnostics-otel`。若要啟用匯出，請在設定中允許並啟用 `diagnostics-otel` 外掛，然後設定 `diagnostics.otel.enabled=true`（請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)中的完整範例）。收集器驗證標頭會透過 `diagnostics.otel.headers`，而不是 Docker 環境變數。

Prometheus 指標會重用已發布的閘道連接埠。安裝 `clawhub:@openclaw/diagnostics-prometheus`、啟用 `diagnostics-prometheus` 外掛，然後擷取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

該路由受閘道驗證保護；不要暴露獨立公開的 `/metrics` 連接埠或未驗證的反向代理路徑。請參閱 [Prometheus 指標](/zh-TW/gateway/prometheus)。

### 健康檢查

容器探測端點（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活狀態
curl -fsS http://127.0.0.1:18789/readyz     # 就緒狀態
```

映像內建的 `HEALTHCHECK` 會 ping `/healthz`；重複失敗會將容器標記為 `unhealthy`，讓編排器可以重新啟動或替換它。

已驗證的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 與 loopback

`scripts/docker/setup.sh` 預設 `OPENCLAW_GATEWAY_BIND=lan`，因此主機上的 `http://127.0.0.1:18789` 可與 Docker 連接埠發布搭配運作。

- `lan`（預設）：主機瀏覽器和主機命令列介面可以連到已發布的閘道連接埠。
- `loopback`：只有容器網路命名空間內的處理程序可以直接連到閘道。

<Note>
在 `gateway.bind` 中使用繫結模式值（`lan` / `loopback` / `custom` / `tailnet` / `auto`），不要使用像 `0.0.0.0` 或 `127.0.0.1` 這樣的主機別名。
</Note>

### 主機本機提供者

在容器內，`127.0.0.1` 是容器本身，不是主機。對於在主機上執行的提供者，請使用 `host.docker.internal`：

| 提供者   | 主機預設 URL             | Docker 設定 URL                    |
| -------- | ------------------------ | ---------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234` |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

內建設定會將這些 URL 作為 LM Studio/Ollama 入門設定預設值，而 `docker-compose.yml` 會在 Linux Docker Engine 上將 `host.docker.internal` 對應到主機閘道（Docker Desktop 在 macOS/Windows 上提供相同別名）。主機服務必須監聽 Docker 可連到的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

使用你自己的 Compose 檔案或 `docker run`？請自行加入相同對應，例如 `--add-host=host.docker.internal:host-gateway`。

### Docker 中的 Claude 命令列介面後端

官方映像檔未預先安裝 Claude Code。請在容器的 `node` 使用者內安裝並登入，然後持久保存該容器家目錄，這樣映像檔升級才不會清除二進位檔或驗證狀態。

若是全新安裝，請在執行設定前啟用持久化的 `/home/node` volume：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

若是既有安裝，請先停止 stack 並重新載入目前的 `.env` 值 — 設定腳本一律會從目前 shell 和預設值重寫 `.env`，不會自行讀取該檔案：

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

如果 `.env` 包含你的 shell 無法 source 的值，請先手動重新 export 你依賴的項目（`OPENCLAW_IMAGE`、連接埠、繫結模式、自訂路徑、`OPENCLAW_EXTRA_MOUNTS`、sandbox、skip-onboarding）。產生的 overlay 會同時為 `openclaw-gateway` 和 `openclaw-cli` 掛載家目錄 volume；請使用該 overlay 執行其餘命令（如果你使用 `docker-compose.override.yml`，也請先放入它）：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

原生安裝程式會將 `claude` 寫入 `/home/node/.local/bin/claude`。將 OpenClaw 指向該路徑：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

從同一個持久化家目錄登入並驗證：

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

接著使用內建的 `claude-cli` 後端：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` 會持久保存 `/home/node/.local/bin` 和 `/home/node/.local/share/claude` 下的原生安裝，以及 `/home/node/.claude` 和 `/home/node/.claude.json` 下的 Claude Code 設定/驗證。只持久保存 `/home/node/.openclaw` 並不足夠；如果你使用 `OPENCLAW_EXTRA_MOUNTS` 而不是家目錄 volume，請將所有這些 Claude 路徑掛載到兩個服務中。

<Note>
對於共享的生產自動化或可預測的 Anthropic 計費，建議優先使用 Anthropic API key 路徑。Claude 命令列介面重用會遵循 Claude Code 的已安裝版本、帳號登入、計費和更新行為。
</Note>

### Bonjour / mDNS

Docker bridge 網路通常無法可靠轉送 Bonjour/mDNS multicast（`224.0.0.251:5353`）。當 `OPENCLAW_DISABLE_BONJOUR` 未設定時，內建 Bonjour 外掛一偵測到自己正在容器中執行，就會自動停用區域網路廣播，因此不會因 bridge 丟棄 multicast 而陷入崩潰重試迴圈。設定 `OPENCLAW_DISABLE_BONJOUR=1` 可強制關閉，不論偵測結果為何；或設定 `0` 可強制開啟（僅限 host networking、macvlan，或另一個已知 mDNS multicast 可運作的網路）。

否則，請對 Docker 主機使用已發布的閘道 URL、Tailscale，或 wide-area DNS-SD。請參閱 [Bonjour 探索](/zh-TW/gateway/bonjour) 了解注意事項與疑難排解。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` bind-mount 到 `/home/node/.openclaw`、`OPENCLAW_WORKSPACE_DIR` 到 `/home/node/.openclaw/workspace`，以及 `OPENCLAW_AUTH_PROFILE_SECRET_DIR` 到 `/home/node/.config/openclaw`，因此這些路徑會在容器替換後保留下來。當變數未設定時，`docker-compose.yml` 會 fallback 到 `${HOME}` 底下；如果 `HOME` 本身也缺少，則 fallback 到 `/tmp`，因此 `docker compose up` 在裸環境中絕不會產生空來源 volume spec。

該掛載的設定目錄包含：

- `openclaw.json`，用於行為設定
- `agents/<agentId>/agent/auth-profiles.json`，用於儲存的提供者 OAuth/API key 驗證
- `.env`，用於以環境變數支援的執行階段祕密，例如 `OPENCLAW_GATEWAY_TOKEN`

  auth-profile 祕密目錄會儲存 OAuth 支援的 auth profile 權杖資料本機加密金鑰。請將它與 Docker 主機狀態保存在一起，但與 `OPENCLAW_CONFIG_DIR` 分開。

  已安裝的可下載外掛會將套件狀態儲存在掛載的 OpenClaw home 底下，因此安裝記錄和套件根目錄會在容器替換後保留下來；閘道啟動不會重新產生內建外掛的依賴樹。

  如需完整的 VM 持久化詳細資訊，請參閱 [Docker VM Runtime - 哪些內容會持久化在哪裡](/zh-TW/install/docker-vm-runtime#what-persists-where)。

  **磁碟成長熱點：** `media/`、session JSONL 檔案、共用 SQLite 狀態資料庫、已安裝外掛套件根目錄，以及 `/tmp/openclaw/` 底下的輪替檔案日誌。

  ### Shell 輔助工具（選用）

  若要縮短日常命令，請安裝 [ClawDock](/zh-TW/install/clawdock)：

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  如果你是從較舊的 `scripts/shell-helpers/clawdock-helpers.sh` 路徑安裝，請重新執行上方命令，讓你的本機輔助工具追蹤目前位置。接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令（執行 `clawdock-help` 可查看完整清單）。

  <AccordionGroup>
  <Accordion title="啟用 Docker 閘道的代理沙箱">
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

    該腳本只會在沙箱先決條件通過後掛載 `docker.sock`。如果沙箱設定無法完成，它會將 `agents.defaults.sandbox.mode` 重設為 `off`。在 OpenClaw 沙箱啟用的回合中，Codex 程式碼模式會停用（請參閱 [沙箱化 § Docker 後端](/zh-TW/gateway/sandboxing#docker-backend)）；切勿將主機 Docker socket 掛載到代理沙箱容器中。

  </Accordion>

  <Accordion title="自動化 / CI（非互動式）">
    使用 `-T` 停用 Compose pseudo-TTY 配置：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共用網路安全注意事項">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，讓命令列介面命令能透過 `127.0.0.1` 連到閘道。請將此視為共用信任邊界。compose 設定會在 `openclaw-gateway` 和 `openclaw-cli` 上移除 `NET_RAW`/`NET_ADMIN`，並啟用 `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 失敗">
    某些 Docker Desktop 設定在移除 `NET_RAW` 後，會讓共用網路 `openclaw-cli` sidecar 的 DNS 查詢失敗，並在 npm 支援的命令（例如 `openclaw plugins install`）期間顯示為 `EAI_AGAIN`。一般操作請保留預設的強化 compose 檔案。下方覆寫只會還原 `openclaw-cli` 容器的預設 capabilities，請只在需要 registry 存取的一次性命令中使用，不要作為你的預設呼叫方式：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已經建立長時間執行的 `openclaw-cli` 容器，請使用相同覆寫重新建立它；`docker compose exec`/`docker exec` 無法變更已建立容器上的 Linux capabilities。

  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）身分執行。如果你在 `/home/node/.openclaw` 看到權限錯誤，請確認你的主機 bind mounts 由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    相同的不一致也可能顯示為 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`，後面接著 `plugin present but blocked`，這表示程序 uid 與掛載的外掛目錄擁有者不一致。建議以預設 uid 1000 執行，並修正 bind mount 擁有權。只有在你有意長期以 root 執行 OpenClaw 時，才將 `/path/to/openclaw-config/npm` chown 為 `root:root`。

  </Accordion>

  <Accordion title="更快重新建置">
    排列你的 Dockerfile，讓依賴層可被快取，避免除非 lockfiles 變更，否則重新執行 `pnpm install`：

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

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **預先內建系統 deps**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **預先內建 Python deps**：`export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **預先內建 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`，或使用官方 `-browser` 映像標籤
    5. **或將 Playwright browsers 安裝到持久化 volume 中**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **持久化瀏覽器下載項目**：使用 `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 會在 Linux 上自動偵測映像檔的 Playwright 管理 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（無頭 Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，它會開啟一個瀏覽器 URL。在 Docker 或無頭設定中，請複製你抵達的完整重新導向 URL，並貼回精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像中繼資料">
    執行階段映像使用 `node:24-bookworm-slim`，並以 PID 1 執行 `tini`，讓長時間執行的容器能正確回收殭屍行程並處理訊號。它會發布 OCI 基礎映像註解，包括 `org.opencontainers.image.base.name` 和 `org.opencontainers.image.source`。Dependabot 會更新釘選的節點基礎摘要；發行建置不會另外執行發行版升級層。請參閱 [OCI 映像註解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner) 和 [Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)，了解共享 VM 部署步驟，包括二進位檔烘焙、持久化和更新。

## 代理沙箱

當 `agents.defaults.sandbox` 搭配 Docker 後端啟用時，閘道會在隔離的 Docker 容器內執行代理工具（shell、檔案讀取/寫入等），而閘道本身仍留在主機上 — 這會在不將整個閘道容器化的情況下，為不受信任或多租戶代理工作階段建立一道堅實隔離牆。

沙箱範圍可以是每個代理（預設）、每個工作階段或共享；每個範圍都會取得掛載於 `/workspace` 的專屬工作區。你也可以設定允許/拒絕工具政策、網路隔離、資源限制和瀏覽器容器。

完整設定、映像、安全注意事項和多代理設定檔：

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

若是在沒有原始碼 checkout 的情況下進行 npm 安裝，請參閱 [沙箱化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌的 `docker build` 指令。

## 疑難排解

<AccordionGroup>
  <Accordion title="映像遺失或沙箱容器未啟動">
    使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)（原始碼 checkout）或 [沙箱化 § 映像與設定](/zh-TW/gateway/sandboxing#images-and-setup) 中的內嵌 `docker build` 指令（npm 安裝）來建置沙箱映像，或將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像。容器會依需求為每個工作階段自動建立。
  </Accordion>

  <Accordion title="沙箱中的權限錯誤">
    將 `docker.user` 設為與已掛載工作區擁有權相符的 UID:GID，或 chown 工作區資料夾。
  </Accordion>

  <Accordion title="沙箱中找不到自訂工具">
    OpenClaw 會使用 `sh -lc`（登入 shell）執行指令，這會載入 `/etc/profile`，且可能重設 PATH。請設定 `docker.env.PATH` 以前置你的自訂工具路徑，或在 Dockerfile 的 `/etc/profile.d/` 下新增腳本。
  </Accordion>

  <Accordion title="映像建置期間因 OOM 被終止（結束 137）">
    VM 至少需要 2 GB RAM。請使用較大的機器類別後重試。
  </Accordion>

  <Accordion title="Control UI 中未授權或需要配對">
    擷取新的儀表板連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多細節：[儀表板](/zh-TW/web/dashboard)、[裝置](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="閘道目標顯示 ws://172.x.x.x，或 Docker 命令列介面出現配對錯誤">
    重設閘道模式和繫結：

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
- [設定](/zh-TW/gateway/configuration) — 安裝後的閘道設定
