---
read_when:
    - 你想要容器化的閘道，而不是安裝在本機
    - 你正在驗證 Docker 流程
summary: OpenClaw 的選用 Docker 架設與新手引導
title: Docker
x-i18n:
    generated_at: "2026-07-12T14:34:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker 是**選用的**。你可以用它建立隔離、用完即棄的閘道環境，或用於未在本機安裝所需項目的主機。如果你已在自己的機器上進行開發，請改用一般安裝流程。

啟用 `agents.defaults.sandbox` 時，預設沙箱後端會使用 Docker，但沙箱預設為停用，且閘道本身不需要在 Docker 中執行。也可使用 SSH 與 OpenShell 沙箱後端；請參閱[沙箱](/zh-TW/gateway/sandboxing)。

要託管多位使用者嗎？請參閱[多租戶託管](/gateway/multi-tenant-hosting)，以瞭解每個租戶各自使用一個單元的模型。

## 先決條件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 建置映像至少需要 2 GB RAM（在 1 GB 主機上執行 `pnpm install` 可能會因記憶體不足而遭終止，並以結束碼 137 離開）
- 足夠儲存映像與日誌的磁碟空間
- 在 VPS／公用主機上，請檢閱[網路公開存取的安全強化](/zh-TW/gateway/security)，尤其是 Docker 的 `DOCKER-USER` 防火牆鏈

## 容器化閘道

<Steps>
  <Step title="建置映像">
    從儲存庫根目錄執行：

    ```bash
    ./scripts/docker/setup.sh
    ```

    這會在本機將閘道映像建置為 `openclaw:local`。若要改用預先建置的映像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    預先建置的映像會優先發布至 [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。GHCR 是發布自動化、固定版本部署與來源驗證的主要登錄檔。同一版本也會將 Docker Hub 鏡像發布至 `openclaw/openclaw`：

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    請使用 `ghcr.io/openclaw/openclaw` 或 `openclaw/openclaw`，並避免使用非官方鏡像，因為它們不採用 OpenClaw 的發布時程或保留政策。官方標籤包括：`main`、`latest`、`<version>`（例如 `2026.2.26`），以及 `2026.2.26-beta.1` 之類的 beta 標籤（beta 絕不會變更 `latest`／`main`）。預設的 `main`／`latest`／`<version>` 映像包含 `codex` 和 `diagnostics-otel` 外掛。`-browser` 變體（例如 `latest-browser`）也內建 Chromium，適合搭配[沙箱化瀏覽器](/zh-TW/gateway/sandboxing#sandboxed-browser)工具使用，首次執行時無須安裝 Playwright。

  </Step>

  <Step title="在隔離網路環境中重新執行">
    在離線主機上，請先傳輸並載入映像：

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` 會驗證 `OPENCLAW_IMAGE` 已存在於本機、停用 Compose 隱含的拉取／建置作業，然後執行一般流程：同步 `.env`、修正權限、初始設定、同步閘道設定，以及啟動 Compose。

    如果 `OPENCLAW_SANDBOX=1`，離線設定也會檢查 `OPENCLAW_DOCKER_SOCKET` 所指定常駐程式上的預設及各代理程式沙箱映像，包括 Docker 後端瀏覽器映像上的瀏覽器合約標籤。如果必要映像遺失或過時，設定程序會直接結束且不變更沙箱設定，而不會回報實際上無法運作的成功結果。

  </Step>

  <Step title="完成初始設定">
    設定指令碼會自動執行初始設定：

    - 提示輸入供應商 API 金鑰
    - 產生閘道權杖並寫入 `.env`
    - 建立驗證設定檔密鑰目錄
    - 透過 Docker Compose 啟動閘道

    啟動前的初始設定與組態寫入作業會直接透過 `openclaw-gateway` 執行（使用 `--no-deps --entrypoint node`），因為 `openclaw-cli` 與閘道共用網路命名空間，只有在閘道容器存在後才能運作。

  </Step>

  <Step title="開啟控制介面">
    開啟 `http://127.0.0.1:18789/`，並將寫入 `.env` 的權杖貼到 Settings。如果你已將容器切換為密碼驗證，請改用該密碼。

    需要再次取得網址嗎？

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
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Docker 建置內容不包含 `.git`。請如上所示將原始碼識別資訊以建置引數傳入，讓映像的「關於」畫面顯示目前簽出的提交與單一建置時間戳記。`scripts/docker/setup.sh` 會自動解析並傳入這兩個值。

<Note>
請從儲存庫根目錄執行 `docker compose`。如果你已啟用 `OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，設定指令碼會寫入 `docker-compose.extra.yml`；請將它放在你自行維護的任何 `docker-compose.override.yml` 之後，例如 `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`。
</Note>

### 升級容器映像

當你替換 OpenClaw 映像，但保留相同的掛載狀態／組態時，新閘道會在進入就緒狀態前，執行可安全啟動的升級遷移與外掛收斂作業。例行映像升級應不需要另外執行一次 `openclaw doctor --fix`。

如果啟動程序無法安全完成這些修復，閘道會結束，而不會回報為健康狀態。若設有重新啟動政策，Docker、Podman 或 Kubernetes 可能會顯示閘道容器持續重新啟動。請保留掛載的狀態磁碟區，然後使用相同映像執行一次 `openclaw doctor --fix` 作為容器命令，並使用閘道所用的相同狀態／組態掛載：

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

doctor 完成後，請使用預設命令重新啟動閘道容器。在 Kubernetes 中，請在掛載至相同 PVC 的一次性 Job 或偵錯 Pod 中執行相同命令，然後重新啟動 Deployment 或 StatefulSet。

### 環境變數

`scripts/docker/setup.sh` 接受的選用變數（閘道容器也可直接透過 `docker-compose.yml` 接受）：

| 變數                                            | 用途                                                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | 使用遠端映像，而非在本機建置                                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | 在建置期間安裝額外的 apt 套件（以空格分隔）。舊版別名：`OPENCLAW_DOCKER_APT_PACKAGES`                             |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | 在建置期間安裝額外的 Python 套件（以空格分隔）                                                                   |
| `OPENCLAW_EXTENSIONS`                           | 編譯／封裝所選且支援的外掛，並安裝其執行階段相依套件（以逗號或空格分隔的 ID）                                    |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | 覆寫本機原始碼建置的 Node 選項（預設為 `--max-old-space-size=8192`）                                              |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | 覆寫本機原始碼建置的 tsdown 堆積記憶體大小（單位為 MB）                                                          |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | 在僅執行階段的本機映像建置期間略過宣告輸出（預設為 `1`）                                                         |
| `OPENCLAW_INSTALL_BROWSER`                      | 在建置時將 Chromium + Xvfb 內建至映像                                                                            |
| `OPENCLAW_EXTRA_MOUNTS`                         | 額外的主機繫結掛載（以逗號分隔的 `source:target[:opts]`）                                                        |
| `OPENCLAW_HOME_VOLUME`                          | 將 `/home/node` 持久儲存在具名 Docker 磁碟區中                                                                    |
| `OPENCLAW_SANDBOX`                              | 選擇啟用沙箱啟動程序（`1`、`true`、`yes`、`on`）                                                                |
| `OPENCLAW_SKIP_ONBOARDING`                      | 略過互動式初始設定步驟（`1`、`true`、`yes`、`on`）                                                              |
| `OPENCLAW_DOCKER_SOCKET`                        | 覆寫 Docker 通訊端路徑                                                                                           |
| `OPENCLAW_DISABLE_BONJOUR`                      | 強制開啟（`0`）或關閉（`1`）Bonjour／mDNS 公告；請參閱 [Bonjour／mDNS](#bonjour--mdns)                           |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | 停用內建外掛原始碼繫結掛載覆蓋層                                                                                |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | 用於 OpenTelemetry 匯出的共用 OTLP／HTTP 收集器端點                                                             |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | 用於追蹤、指標或日誌的訊號專用 OTLP 端點                                                                         |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | 覆寫 OTLP 通訊協定。目前僅支援 `http/protobuf`                                                                   |
| `OTEL_SERVICE_NAME`                             | 用於 OpenTelemetry 資源的服務名稱                                                                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | 選擇啟用最新的實驗性 GenAI 語意屬性                                                                              |
| `OPENCLAW_OTEL_PRELOADED`                       | 預先載入 OpenTelemetry SDK 時，略過啟動第二個 SDK                                                                |

官方映像未隨附 Homebrew。在初始設定期間，如果 Linux 容器中沒有 `brew`，OpenClaw 會隱藏僅支援 brew 的 Skills 相依套件安裝程式；請透過自訂映像提供這些相依套件，或手動安裝。針對 Debian 套件形式的相依套件，請使用 `OPENCLAW_IMAGE_APT_PACKAGES`；針對 Python 相依套件，請使用 `OPENCLAW_IMAGE_PIP_PACKAGES`（建置時會執行 `python3 -m pip install --break-system-packages`，因此請固定版本，且僅使用你信任的套件索引）。

如果 Docker 回報 `ResourceExhausted`、`cannot allocate memory`，或在執行 `tsdown` 期間中止，請提高 Docker 建置器的記憶體限制，或使用較小且明確指定的堆積記憶體大小重試：

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### 包含所選外掛、從原始碼建置的映像

`OPENCLAW_EXTENSIONS` 會從原始碼簽出中選取外掛資訊清單 ID；
當現有的原始碼目錄名稱與其不同時，也接受這些名稱。Docker
建置會將選取項目一次解析為原始碼目錄、安裝正式環境
相依套件，並在選取的外掛以
`openclaw.build.bundledDist: false` 單獨發布時，將其執行階段編譯至根目錄的綑綁
dist。這項僅限 Docker 的封裝不會變更外掛的 npm 或 ClawHub
成品合約。未知、無效或不明確的 ID 會導致映像檔建置失敗。
已知的僅相依套件／原始碼 ID 會維持現有的原始碼與相依套件
暫存方式，而不會新增已編譯的根目錄 dist 項目。具有
統一建置進入點的所選外掛必須成功編譯；未選取的外部外掛
原始碼與執行階段輸出則會被移除。

例如，下列命令會分別建置多架構、獨立運作的
FakeCo ClickClack、Slack 與 Microsoft Teams 閘道映像檔。ClawRouter
已是 OpenClaw 根執行階段的一部分，因此 ClickClack 映像檔只選取
`clickclack`。明確傳入空白的瀏覽器引數，可讓預設映像檔不包含
Chromium：

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

若要進行單一原生本機建置，請使用 `--platform linux/arm64 --load` 或
`--platform linux/amd64 --load`。多平台輸出及附加的 SBOM／來源證明
需要登錄檔，或其他能保留證明資料的 Buildx 輸出。推送後，
請檢查資訊清單並部署不可變的摘要，而非
可變的原始碼 SHA 標籤：

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# 部署：registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

這些映像檔供獨立的 OCI 型閘道與一般 Docker 使用者使用。
由 Crabhelm 管理的閘道不會使用它們：該交付路徑會建置
獨立的 x86_64 裝置封存檔，其中包含 OpenClaw npm tarball，並固定
Node、封存檔與資訊清單摘要。請從相同的已落地 OpenClaw 原始碼
獨立建置該裝置。

若要針對已封裝的映像檔測試綑綁外掛原始碼，請將一個外掛原始碼目錄掛載至其封裝後的原始碼路徑，例如 `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。這會覆寫相同外掛 ID 對應的已編譯 `/app/dist/extensions/synology-chat` 綑綁套件。

### 可觀測性

OpenTelemetry 匯出會從閘道容器向外傳送至你的 OTLP 收集器；不需要發布任何 Docker 連接埠。若要在本機建置的映像檔中包含綑綁的匯出器：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方預建映像檔已綑綁 `diagnostics-otel`；只有在你已移除它時，才需要自行安裝 `clawhub:@openclaw/diagnostics-otel`。若要啟用匯出，請在設定中允許並啟用 `diagnostics-otel` 外掛，然後設定 `diagnostics.otel.enabled=true`（完整範例請參閱 [OpenTelemetry 匯出](/zh-TW/gateway/opentelemetry)）。收集器驗證標頭應透過 `diagnostics.otel.headers` 傳遞，而非 Docker 環境變數。

Prometheus 指標會重複使用已發布的閘道連接埠。安裝 `clawhub:@openclaw/diagnostics-prometheus`、啟用 `diagnostics-prometheus` 外掛，然後抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

此路由受閘道驗證保護；請勿公開獨立的公用 `/metrics` 連接埠或未經驗證的反向代理路徑。請參閱 [Prometheus 指標](/zh-TW/gateway/prometheus)。

### 健康狀態檢查

容器探查端點（不需要驗證）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活狀態
curl -fsS http://127.0.0.1:18789/readyz     # 就緒狀態
```

映像檔內建的 `HEALTHCHECK` 會偵測 `/healthz`；重複失敗會將容器標記為 `unhealthy`，讓協調器可以重新啟動或替換它。

經過驗證的深度健康狀態快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### 區域網路與回送介面

`scripts/docker/setup.sh` 預設使用 `OPENCLAW_GATEWAY_BIND=lan`，因此主機上的 `http://127.0.0.1:18789` 可透過 Docker 連接埠發布運作。

- `lan`（預設）：主機瀏覽器與主機命令列介面可以連線至已發布的閘道連接埠。
- `loopback`：只有容器網路命名空間內的程序可以直接連線至閘道。

<Note>
請在 `gateway.bind` 中使用繫結模式值（`lan` / `loopback` / `custom` / `tailnet` / `auto`），不要使用 `0.0.0.0` 或 `127.0.0.1` 等主機別名。
</Note>

### 主機本機供應商

在容器內，`127.0.0.1` 指的是容器本身，而不是主機。對於在主機上執行的供應商，請使用 `host.docker.internal`：

| 供應商    | 主機預設 URL             | Docker 設定 URL                     |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

綑綁的設定流程會使用這些 URL 作為 LM Studio／Ollama 的導入預設值，而 `docker-compose.yml` 會在 Linux Docker Engine 上將 `host.docker.internal` 對應至主機閘道（Docker Desktop 在 macOS／Windows 上提供相同別名）。主機服務必須監聽 Docker 可以連線的位址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

使用你自己的 Compose 檔案或 `docker run`？請自行新增相同的對應，例如 `--add-host=host.docker.internal:host-gateway`。

### Docker 中的 Claude 命令列介面後端

官方映像檔不會預先安裝 Claude Code。請以容器內的 `node` 使用者進行安裝並登入，然後保存該容器的家目錄，避免映像檔升級清除二進位檔或驗證狀態。

若為全新安裝，請先啟用持久化的 `/home/node` 磁碟區，再執行設定：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

若為現有安裝，請先停止堆疊並重新載入目前的 `.env` 值——設定指令碼一律會根據目前的 shell 與預設值重寫 `.env`，不會自行讀取該檔案：

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

如果 `.env` 包含 shell 無法載入的值，請先手動重新匯出你依賴的項目（`OPENCLAW_IMAGE`、連接埠、繫結模式、自訂路徑、`OPENCLAW_EXTRA_MOUNTS`、沙箱、略過導入）。產生的疊加檔會為 `openclaw-gateway` 與 `openclaw-cli` 掛載家目錄磁碟區；請使用該疊加檔執行其餘命令（若你使用 `docker-compose.override.yml`，請先加入它）：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

原生安裝程式會將 `claude` 寫入 `/home/node/.local/bin/claude`。請將 OpenClaw 指向該路徑：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

請從同一個持久化家目錄登入並驗證：

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

接著使用綑綁的 `claude-cli` 後端：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "從 Docker Claude 命令列介面打聲招呼"
```

`OPENCLAW_HOME_VOLUME` 會保存 `/home/node/.local/bin` 與 `/home/node/.local/share/claude` 下的原生安裝，以及 `/home/node/.claude` 和 `/home/node/.claude.json` 下的 Claude Code 設定／驗證狀態。只保存 `/home/node/.openclaw` 並不足夠；如果你使用 `OPENCLAW_EXTRA_MOUNTS` 而非家目錄磁碟區，請將所有這些 Claude 路徑掛載至兩個服務。

<Note>
對於共用的正式環境自動化或可預期的 Anthropic 計費，建議使用 Anthropic API 金鑰路徑。重複使用 Claude 命令列介面時，會遵循 Claude Code 已安裝版本、帳號登入、計費與更新行為。
</Note>

### Bonjour／mDNS

Docker 橋接網路通常無法可靠地轉送 Bonjour／mDNS 多點傳送（`224.0.0.251:5353`）。當未設定 `OPENCLAW_DISABLE_BONJOUR` 時，綑綁的 Bonjour 外掛偵測到自身在容器中執行後，會自動停用區域網路廣播，因此不會因持續重試橋接網路所丟棄的多點傳送而陷入當機循環。設定 `OPENCLAW_DISABLE_BONJOUR=1` 可不論偵測結果都強制停用，設定為 `0` 則強制啟用（僅適用於主機網路、macvlan，或其他已知 mDNS 多點傳送可正常運作的網路）。

否則，Docker 主機請使用已發布的閘道 URL、Tailscale 或廣域 DNS-SD。注意事項與疑難排解請參閱 [Bonjour 探索](/zh-TW/gateway/bonjour)。

### 儲存與持久化

Docker Compose 會將 `OPENCLAW_CONFIG_DIR` 繫結掛載至 `/home/node/.openclaw`、將 `OPENCLAW_WORKSPACE_DIR` 繫結掛載至 `/home/node/.openclaw/workspace`，並將 `OPENCLAW_AUTH_PROFILE_SECRET_DIR` 繫結掛載至 `/home/node/.config/openclaw`，因此替換容器後這些路徑仍會保留。當變數未設定時，`docker-compose.yml` 會回退至 `${HOME}` 下的路徑；若連 `HOME` 本身都不存在，則回退至 `/tmp`，因此在最小環境中執行 `docker compose up` 時，絕不會產生來源為空的磁碟區規格。

該掛載的設定目錄包含：

- 用於行為設定的 `openclaw.json`
- 用於儲存供應商 OAuth／API 金鑰驗證資訊的 `agents/<agentId>/agent/auth-profiles.json`
- 用於以環境變數提供之執行階段祕密（例如 `OPENCLAW_GATEWAY_TOKEN`）的 `.env`

驗證設定檔祕密目錄會儲存用於加密 OAuth 型驗證設定檔權杖資料的本機加密金鑰。請將其與 Docker 主機狀態一同保存，但應與 `OPENCLAW_CONFIG_DIR` 分開。

已安裝的可下載外掛會將套件狀態儲存在已掛載的 OpenClaw 家目錄下，因此替換容器後，安裝記錄與套件根目錄仍會保留；閘道啟動時不會重新產生綑綁外掛的相依套件樹。

完整的 VM 持久化詳細資訊，請參閱 [Docker VM 執行階段－各項資料的持久化位置](/zh-TW/install/docker-vm-runtime#what-persists-where)。

**磁碟用量成長熱點：** `media/`、各代理程式的 SQLite 資料庫、舊版工作階段 JSONL 逐字記錄、共用 SQLite 狀態資料庫、已安裝的外掛套件根目錄，以及 `/tmp/openclaw/` 下的輪替檔案記錄。

### Shell 輔助工具（選用）

若要簡化日常命令，請安裝 [ClawDock](/zh-TW/install/clawdock)：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你是從較舊的 `scripts/shell-helpers/clawdock-helpers.sh` 路徑安裝，請重新執行上方命令，讓本機輔助工具指向目前的位置。接著使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令（執行 `clawdock-help` 可查看完整清單）。

<AccordionGroup>
  <Accordion title="為 Docker 閘道啟用代理程式沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自訂通訊端路徑（例如無 root 權限的 Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    指令碼只會在沙箱先決條件檢查通過後掛載 `docker.sock`。如果無法完成沙箱設定，指令碼會將 `agents.defaults.sandbox.mode` 重設為 `off`。當 OpenClaw 沙箱啟用時，該回合會停用 Codex 程式碼模式（請參閱[沙箱機制 § Docker 後端](/zh-TW/gateway/sandboxing#docker-backend)）；絕對不要將主機的 Docker 通訊端掛載至代理程式沙箱容器中。

  </Accordion>

  <Accordion title="自動化 / CI（非互動式）">
    使用 `-T` 停用 Compose 虛擬 TTY 配置：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共用網路安全性注意事項">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，讓命令列介面命令能透過 `127.0.0.1` 連線至閘道。請將此視為共用的信任邊界。Compose 設定會在 `openclaw-gateway` 和 `openclaw-cli` 上移除 `NET_RAW`/`NET_ADMIN`，並啟用 `no-new-privileges`。
  </Accordion>

  <Accordion title="openclaw-cli 中的 Docker Desktop DNS 失敗">
    某些 Docker Desktop 設定在移除 `NET_RAW` 後，會使共用網路中的 `openclaw-cli` 輔助容器無法進行 DNS 查詢，並在 `openclaw plugins install` 等由 npm 支援的命令中顯示 `EAI_AGAIN`。一般操作請保留預設的強化版 Compose 檔案。下方覆寫只會為 `openclaw-cli` 容器還原預設能力——請僅將其用於需要存取套件登錄檔的一次性命令，不要作為預設的呼叫方式：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已建立長時間執行的 `openclaw-cli` 容器，請使用相同的覆寫重新建立容器——`docker compose exec`/`docker exec` 無法變更已建立容器的 Linux 能力。

  </Accordion>

  <Accordion title="權限與 EACCES">
    映像檔會以 `node`（uid 1000）執行。如果你在 `/home/node/.openclaw` 看到權限錯誤，請確認主機上的繫結掛載由 uid 1000 擁有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    相同的不一致也可能顯示為 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`，接著出現 `plugin present but blocked`——這表示程序 uid 與掛載之外掛目錄擁有者不一致。建議使用預設的 uid 1000 執行，並修正繫結掛載的擁有權。只有在你打算長期以 root 執行 OpenClaw 時，才將 `/path/to/openclaw-config/npm` 的擁有權變更為 `root:root`。

  </Accordion>

  <Accordion title="加快重新建置">
    調整 Dockerfile 的順序以快取相依性層，除非鎖定檔案有所變更，否則避免重新執行 `pnpm install`：

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
    預設映像檔以安全性為優先，並以非 root 的 `node` 身分執行。若需要功能更完整的容器：

    1. **持久保存 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **內建系統相依套件**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **內建 Python 相依套件**：`export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **內建 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`，或使用官方的 `-browser` 映像檔標籤
    5. **或將 Playwright 瀏覽器安裝至持久化磁碟區**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **持久保存瀏覽器下載項目**：使用 `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 會在 Linux 上自動偵測映像檔中由 Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（無頭 Docker）">
    如果你在精靈中選擇 OpenAI Codex OAuth，系統會開啟瀏覽器 URL。在 Docker 或無頭環境中，請複製最終抵達頁面的完整重新導向 URL，並將其貼回精靈以完成驗證。
  </Accordion>

  <Accordion title="基礎映像檔中繼資料">
    執行階段映像檔使用 `node:24-bookworm-slim`，並以 `tini` 作為 PID 1 執行，確保長時間執行的容器能回收殭屍程序並正確處理訊號。它會發布 OCI 基礎映像檔註解，包括 `org.opencontainers.image.base.name` 和 `org.opencontainers.image.source`。Dependabot 會更新固定的 Node 基礎映像檔摘要；發行版本建置不會執行獨立的發行版升級層。請參閱 [OCI 映像檔註解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上執行？

請參閱 [Hetzner（Docker VPS）](/zh-TW/install/hetzner)和 [Docker VM 執行階段](/zh-TW/install/docker-vm-runtime)，瞭解共用 VM 部署步驟，包括內建二進位檔、持久化和更新。

## 代理程式沙箱

使用 Docker 後端啟用 `agents.defaults.sandbox` 時，閘道會在隔離的 Docker 容器中執行代理程式工具（Shell、檔案讀寫等），而閘道本身仍留在主機上——這會在不將整個閘道容器化的情況下，為不受信任或多租戶代理程式工作階段建立一道堅固的隔離牆。

沙箱範圍可以是每個代理程式（預設）、每個工作階段或共用；每個範圍都有各自掛載於 `/workspace` 的工作區。你也可以設定工具允許/拒絕政策、網路隔離、資源限制和瀏覽器容器。

如需完整設定、映像檔、安全性注意事項和多代理程式設定檔，請參閱：

- [沙箱機制](/zh-TW/gateway/sandboxing) -- 完整的沙箱參考資料
- [OpenShell](/zh-TW/gateway/openshell) -- 以互動式 Shell 存取沙箱容器
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理程式的覆寫設定

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

建置預設沙箱映像檔（從原始碼簽出目錄）：

```bash
scripts/sandbox-setup.sh
```

如果透過 npm 安裝且沒有原始碼簽出目錄，請參閱[沙箱機制 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)，取得內嵌的 `docker build` 命令。

## 疑難排解

<AccordionGroup>
  <Accordion title="缺少映像檔或沙箱容器未啟動">
    使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) 建置沙箱映像檔（原始碼簽出），或使用[沙箱機制 § 映像檔與設定](/zh-TW/gateway/sandboxing#images-and-setup)中的內嵌 `docker build` 命令（npm 安裝），也可以將 `agents.defaults.sandbox.docker.image` 設為你的自訂映像檔。容器會在需要時自動為每個工作階段建立。
  </Accordion>

  <Accordion title="沙箱中的權限錯誤">
    將 `docker.user` 設為符合已掛載工作區擁有權的 UID:GID，或變更工作區資料夾的擁有權。
  </Accordion>

  <Accordion title="在沙箱中找不到自訂工具">
    OpenClaw 使用 `sh -lc`（登入 Shell）執行命令，這會載入 `/etc/profile`，並可能重設 PATH。請設定 `docker.env.PATH`，將自訂工具路徑加到最前面，或在 Dockerfile 的 `/etc/profile.d/` 下加入指令碼。
  </Accordion>

  <Accordion title="映像檔建置期間因 OOM 遭終止（結束碼 137）">
    VM 至少需要 2 GB RAM。請改用更大的機器類別後重試。
  </Accordion>

  <Accordion title="控制介面中顯示未授權或需要配對">
    取得新的儀表板連結並核准瀏覽器裝置：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多詳細資訊：[儀表板](/zh-TW/web/dashboard)、[裝置](/zh-TW/cli/devices)。

  </Accordion>

  <Accordion title="閘道目標顯示 ws://172.x.x.x，或 Docker 命令列介面出現配對錯誤">
    重設閘道模式和繫結：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相關內容

- [安裝概覽](/zh-TW/install) — 所有安裝方式
- [Podman](/zh-TW/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/zh-TW/install/clawdock) — Docker Compose 社群設定
- [更新](/zh-TW/install/updating) — 讓 OpenClaw 保持最新狀態
- [設定](/zh-TW/gateway/configuration) — 安裝後的閘道設定
