---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙盒機制的運作方式：模式、範圍、工作區存取與映像檔
title: 沙盒化
x-i18n:
    generated_at: "2026-07-06T10:48:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在沙箱後端內執行工具，以降低影響範圍。沙箱預設為關閉，並由 `agents.defaults.sandbox`（全域）或 `agents.list[].sandbox`（每個代理）控制。閘道程序一律留在主機上；啟用時，只有工具執行會移入沙箱。

<Note>
這不是完美的安全邊界，但當模型做出不明智的操作時，它能實質限制檔案系統與程序存取。
</Note>

## 會被沙箱化的項目

- 工具執行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等。
- 選用的沙箱瀏覽器（`agents.defaults.sandbox.browser`）。

不會被沙箱化：

- 閘道程序本身。
- 任何透過 `tools.elevated` 明確允許在沙箱外執行的工具。提升權限的 exec 會繞過沙箱，並在設定的逸出路徑上執行（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。如果沙箱已關閉，`tools.elevated` 不會改變任何行為，因為 exec 原本就已在主機上執行。請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 模式、範圍與後端

三個獨立設定控制沙箱行為：

| 設定 | 鍵                                | 值                           | 預設值   |
| ---- | --------------------------------- | ---------------------------- | -------- |
| 模式 | `agents.defaults.sandbox.mode`    | `off`、`non-main`、`all`     | `off`    |
| 範圍 | `agents.defaults.sandbox.scope`   | `agent`、`session`、`shared` | `agent`  |
| 後端 | `agents.defaults.sandbox.backend` | `docker`、`ssh`、`openshell` | `docker` |

**模式**控制沙箱何時套用：

- `off`：不使用沙箱。
- `non-main`：除了代理的主工作階段之外，每個工作階段都使用沙箱。主工作階段鍵一律為 `agent:<agentId>:main`（或當 `session.scope` 為 `"global"` 時為 `global`）；它不可設定。群組/頻道工作階段使用自己的鍵，因此一律視為非主要工作階段並會被沙箱化。
- `all`：每個工作階段都在沙箱中執行。

**範圍**控制會建立多少個容器/環境：

- `agent`：每個代理一個容器。
- `session`：每個工作階段一個容器。
- `shared`：所有沙箱化工作階段共用一個容器（在此範圍下會忽略每個代理的 `docker`/`ssh`/`browser` 覆寫）。

**後端**控制哪個執行階段執行沙箱化工具。SSH 專用設定位於 `agents.defaults.sandbox.ssh`；OpenShell 專用設定位於 `plugins.entries.openshell.config`。

|                      | Docker                           | SSH                      | OpenShell                                  |
| -------------------- | -------------------------------- | ------------------------ | ------------------------------------------ |
| **執行位置**         | 本機容器                         | 任何可透過 SSH 存取的主機 | OpenShell 管理的沙箱                       |
| **設定**             | `scripts/sandbox-setup.sh`       | SSH 金鑰 + 目標主機      | 已啟用 OpenShell 外掛                      |
| **工作區模型**       | 繫結掛載或複製                   | 遠端為準（種子一次）     | `mirror` 或 `remote`                       |
| **網路控制**         | `docker.network`（預設：無）     | 取決於遠端主機           | 取決於 OpenShell                           |
| **瀏覽器沙箱**       | 支援                             | 不支援                   | 尚未支援                                   |
| **繫結掛載**         | `docker.binds`                   | N/A                      | N/A                                        |
| **最適合**           | 本機開發、完整隔離               | 卸載到遠端機器           | 具選用雙向同步的受管理遠端沙箱             |

## Docker 後端

一旦啟用沙箱，Docker 就是預設後端。它會透過 Docker daemon socket（`/var/run/docker.sock`）在本機執行工具與沙箱瀏覽器；隔離來自 Docker 命名空間。

預設值：`network: "none"`（無對外連線）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、映像檔 `openclaw-sandbox:bookworm-slim`。

若要公開主機 GPU，請將 `agents.defaults.sandbox.docker.gpus`（或每個代理的覆寫）設定為像 `"all"` 或 `"device=GPU-uuid"` 的值。這會傳遞給 Docker 的 `--gpus` 旗標，並需要相容的主機執行階段，例如 NVIDIA Container Toolkit。

<Warning>
**Docker-out-of-Docker (DooD) 限制**

如果你將 OpenClaw 閘道本身部署為 Docker 容器，它會使用主機的 Docker socket 編排同層沙箱容器（DooD）。這會引入路徑對應限制：

- **設定需要主機路徑**：`openclaw.json` 的 `workspace` 必須包含**主機的絕對路徑**（例如 `/home/user/.openclaw/workspaces`），而不是閘道容器內部路徑。Docker daemon 會相對於主機作業系統命名空間評估路徑，而不是閘道自己的命名空間。
- **需要相符的 volume 對應**：閘道程序也會將心跳偵測與橋接檔案寫入該 `workspace` 路徑。請為閘道容器提供相同的 volume 對應（`-v /home/user/.openclaw:/home/user/.openclaw`），讓相同主機路徑在閘道容器內也能正確解析。對應不一致時，閘道嘗試寫入心跳偵測會出現 `EACCES`。
- **Codex 程式碼模式**：當 OpenClaw 沙箱啟用時，OpenClaw 會在該回合停用 Codex app-server 原生程式碼模式、使用者 MCP 伺服器，以及由應用程式支援的外掛執行（這些會從閘道主機上的 app-server 程序執行，而不是 OpenClaw 沙箱後端），除非沙箱工具政策公開所需工具，且你選擇加入實驗性的沙箱 exec-server 路徑。Shell 存取接著會透過 OpenClaw 沙箱支援的工具路由，例如 `sandbox_exec` 和 `sandbox_process`。請勿將主機 Docker socket 掛載到代理沙箱容器或自訂 Codex 沙箱中。完整行為請參閱 [Codex Harness](/zh-TW/plugins/codex-harness)。

在啟用 Docker 沙箱模式的 Ubuntu/AppArmor 主機上，Codex app-server 的 `workspace-write` shell 執行需要沙箱容器內的非特權使用者命名空間，而當服務使用者無法建立它們時，這可能會在 shell 啟動前失敗。當 Docker 沙箱對外連線停用時（`network: "none"`，預設值），也需要非特權網路命名空間。常見症狀：`bwrap: setting up uid map: Permission denied` 和 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。執行 `openclaw doctor`；如果它回報 Codex bwrap 命名空間探測失敗，建議使用授予 OpenClaw 服務程序所需命名空間的 AppArmor 設定檔。`kernel.apparmor_restrict_unprivileged_userns=0` 是主機範圍的備用方案，具有安全性取捨；只有在該主機姿態可接受時才使用。
</Warning>

### 沙箱瀏覽器

- 當瀏覽器工具需要時，沙箱瀏覽器會自動啟動（確保可連線到 CDP）。透過 `agents.defaults.sandbox.browser.autoStart`（預設 `true`）和 `autoStartTimeoutMs`（預設 12 秒）設定。
- 沙箱瀏覽器容器使用專用 Docker 網路（`openclaw-sandbox-browser`），而不是全域 `bridge` 網路。透過 `agents.defaults.sandbox.browser.network` 設定。
- `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允許清單限制容器邊界的 CDP 輸入（例如 `172.21.0.1/32`）。
- noVNC 觀察者存取預設受密碼保護；OpenClaw 會發出短效 token URL，提供本機啟動頁面，並以 URL fragment（不是 query string 或 header 記錄）中的密碼開啟 noVNC。
- `agents.defaults.sandbox.browser.allowHostControl`（預設 `false`）允許沙箱化工作階段明確指定主機瀏覽器。
- 選用允許清單會控管 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

## SSH 後端

使用 `backend: "ssh"` 可在任意可透過 SSH 存取的機器上沙箱化 `exec`、檔案工具與媒體讀取。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

預設值：`command: "ssh"`、`workspaceRoot: "/tmp/openclaw-sandboxes"`、`strictHostKeyChecking: true`、`updateHostKeys: true`。

- **生命週期**：OpenClaw 會在 `sandbox.ssh.workspaceRoot` 下建立每個範圍的遠端根目錄。建立或重建後第一次使用時，它會從本機工作區將該遠端工作區種子化一次。之後，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒體讀取，以及輸入媒體暫存都會透過 SSH 直接對遠端工作區執行。OpenClaw 不會自動將遠端變更同步回本機工作區。
- **驗證材料**：`identityFile`/`certificateFile`/`knownHostsFile` 參照既有本機檔案。`identityData`/`certificateData`/`knownHostsData` 接受內嵌字串或 SecretRefs，會透過一般 secrets 執行階段快照解析，寫入模式為 `0600` 的暫存檔，並在 SSH 工作階段結束時刪除。如果同一項目同時設定 `*File` 和 `*Data` 變體，該工作階段會以 `*Data` 為準。
- **遠端為準的後果**：初始種子化後，遠端 SSH 工作區會成為實際的沙箱狀態。種子步驟之後在 OpenClaw 外部進行的主機本機編輯，直到你重建沙箱前都不會在遠端可見。`openclaw sandbox recreate` 會刪除每個範圍的遠端根目錄，並在下次使用時再次從本機種子化。此後端不支援瀏覽器沙箱，且 `sandbox.docker.*` 設定不適用。

## OpenShell 後端

使用 `backend: "openshell"` 可在 OpenShell 管理的遠端環境中沙箱化工具。OpenShell 會重用與通用 SSH 後端相同的 SSH 傳輸與遠端檔案系統橋接，並加入 OpenShell 生命週期（`sandbox create/get/delete/ssh-config`）以及選用的 `mirror` 工作區同步模式。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
        },
      },
    },
  },
}
```

`mode: "mirror"`（預設）會讓本機工作區成為準則：OpenClaw 會在 `exec` 前將本機同步到沙箱，並在之後同步回來。`mode: "remote"` 會從本機將遠端工作區種子化一次，接著直接對遠端工作區執行 `exec`/`read`/`write`/`edit`/`apply_patch`，且不會同步回來；種子化之後的本機編輯，直到你執行 `openclaw sandbox recreate` 前都不可見。在 `scope: "agent"` 或 `scope: "shared"` 下，該遠端工作區會在相同範圍內共用。目前限制：尚不支援沙箱瀏覽器，且 `sandbox.docker.binds` 不適用於此後端。

`openclaw sandbox list`/`recreate`/prune all 會將 OpenShell 執行階段視為與 Docker 執行階段相同；prune 邏輯會感知後端。

完整先決條件、設定參考、工作區模式比較與生命週期詳細資訊，請參閱 [OpenShell](/zh-TW/gateway/openshell)。

## 工作區存取

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可看見的內容：

| 值               | 行為                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none`（預設）   | 工具會看到位於 `~/.openclaw/sandboxes` 下的隔離沙盒工作區。                               |
| `ro`             | 以唯讀方式將代理工作區掛載到 `/agent`（停用 `write`/`edit`/`apply_patch`）。              |
| `rw`             | 以讀寫方式將代理工作區掛載到 `/workspace`。                                               |

使用 OpenShell 後端時，`mirror` 模式仍會在 exec 回合之間使用本機工作區作為權威來源，`remote` 模式則會在初始種子之後使用遠端 OpenShell 工作區作為權威來源，而 `workspaceAccess: "ro"`/`"none"` 仍會以相同方式限制寫入行為。

傳入媒體會複製到作用中的沙盒工作區（`media/inbound/*`）。

<Note>
**Skills**：`read` 工具以沙盒根目錄為根。使用 `workspaceAccess: "none"` 時，OpenClaw 會將符合資格的 skills 鏡像到沙盒工作區（`.../skills`），讓它們可被讀取。使用 `"rw"` 時，工作區 skills 可從 `/workspace/skills` 讀取，且符合資格的受管、內建或外掛 skills 會實體化到產生的唯讀路徑 `/workspace/.openclaw/sandbox-skills/skills`。
</Note>

## 自訂繫結掛載

`agents.defaults.sandbox.docker.binds` 會將額外的主機目錄掛載到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全域與個別代理的繫結會合併（不會取代）。在 `scope: "shared"` 下，個別代理的繫結會被忽略。

`agents.defaults.sandbox.browser.binds` 只會將額外的主機目錄掛載到**沙盒瀏覽器**容器。設定時（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`；省略時，瀏覽器容器會退回使用 `docker.binds`。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**繫結安全性**

- 繫結會繞過沙盒檔案系統：它們會以你設定的模式（`:ro` 或 `:rw`）公開主機路徑。
- OpenClaw 預設會封鎖危險的繫結來源：系統路徑（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker socket 目錄（`/run`、`/var/run` 及其 `docker.sock` 變體），以及常見的家目錄認證根目錄（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）。
- 驗證會正規化來源路徑，然後透過最深層的既有祖先再次解析，再重新檢查封鎖路徑與允許的根目錄，因此即使最終葉節點尚不存在，符號連結父目錄逸出也會失敗關閉（例如，如果 `run-link` 指向該處，`/workspace/run-link/new-file` 仍會解析為 `/var/run/...`）。
- 會遮蔽保留容器掛載點（`/workspace`、`/agent`）的繫結目標也會預設被封鎖；可用 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` 覆寫。
- 位於工作區/代理工作區允許清單根目錄之外的繫結來源會預設被封鎖；可用 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` 覆寫。允許的根目錄會以相同方式正規化，因此在符號連結解析前看似位於允許清單內的路徑，仍會因位於允許根目錄之外而遭拒。
- 敏感掛載（秘密、SSH 金鑰、服務認證）除非絕對必要，否則應為 `:ro`。
- 如果你只需要對工作區的讀取存取，請搭配 `workspaceAccess: "ro"`；繫結模式仍彼此獨立。
- 請參閱 [沙盒 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)，了解繫結如何與工具政策和提權 exec 互動。

</Warning>

## 映像與設定

預設 Docker 映像：`openclaw-sandbox:bookworm-slim`

<Note>
**來源 checkout vs npm 安裝**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 輔助腳本只有在從[來源 checkout](https://github.com/openclaw/openclaw) 執行時可用。它們不包含在 npm 套件中。

如果你是透過 `npm install -g openclaw` 安裝 OpenClaw，請改用下方顯示的內嵌 `docker build` 命令。
</Note>

<Steps>
  <Step title="建置預設映像">
    從來源 checkout：

    ```bash
    scripts/sandbox-setup.sh
    ```

    從 npm 安裝（不需要來源 checkout）：

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    預設映像**不**包含 節點。如果某個 skill 需要 節點（或其他執行階段），請烘焙自訂映像，或透過 `sandbox.docker.setupCommand` 安裝（需要網路輸出 + 可寫根目錄 + root 使用者）。

    當缺少 `openclaw-sandbox:bookworm-slim` 時，OpenClaw 不會悄悄替換成純 `debian:bookworm-slim`。以預設映像為目標的沙盒執行會快速失敗並顯示建置指示，直到你建置它為止，因為內建映像會攜帶供沙盒 write/edit 輔助工具使用的 `python3`。

  </Step>
  <Step title="選用：建置通用映像">
    若要更具功能性的沙盒映像並包含常用工具（例如 `curl`、`jq`、節點 24、pnpm、`python3` 和 `git`）：

    從來源 checkout：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    從 npm 安裝時，請先建置預設映像（見上方），再使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) 在其上建置通用映像。

    接著將 `agents.defaults.sandbox.docker.image` 設為 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="選用：建置沙盒瀏覽器映像">
    從來源 checkout：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    從 npm 安裝時，請使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) 建置。

  </Step>
</Steps>

預設情況下，Docker 沙盒容器會以**無網路**方式執行。可用 `agents.defaults.sandbox.docker.network` 覆寫。

<AccordionGroup>
  <Accordion title="沙盒瀏覽器 Chromium 預設值">
    內建沙盒瀏覽器映像會為容器化工作負載套用保守的 Chromium 啟動旗標：

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - 啟用 `browser.headless` 時使用 `--headless=new`。
    - 啟用 `browser.noSandbox` 時使用 `--no-sandbox --disable-setuid-sandbox`。
    - 預設使用 `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer`；這些圖形強化旗標可協助沒有 GPU 支援的容器。如果你的工作負載需要 WebGL 或其他 3D 功能，請設定 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - 預設使用 `--disable-extensions`；若流程依賴擴充功能，請設定 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`。
    - 預設使用 `--renderer-process-limit=2`；由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 會保留 Chromium 的預設值。

    如果你需要不同的執行階段設定檔，請使用自訂瀏覽器映像並提供你自己的 entrypoint。對於本機（非容器）Chromium 設定檔，請使用 `browser.extraArgs` 附加額外啟動旗標。

  </Accordion>
  <Accordion title="網路安全性預設值">
    - `network: "host"` 會被封鎖。
    - `network: "container:<id>"` 預設會被封鎖（命名空間加入繞過風險）。
    - 破窗覆寫：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安裝與容器化閘道位於此處：[Docker](/zh-TW/install/docker)

對於 Docker 閘道部署，`scripts/docker/setup.sh` 可以引導沙盒設定。設定 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）即可啟用該路徑。可用 `OPENCLAW_DOCKER_SOCKET` 覆寫 socket 位置。完整設定與 env 參考：[Docker](/zh-TW/install/docker#agent-sandbox)。

## setupCommand（一次性容器設定）

`setupCommand` 會在沙盒容器建立後執行**一次**（不是每次執行都執行）。它會透過 `sh -lc` 在容器內執行。

路徑：

- 全域：`agents.defaults.sandbox.docker.setupCommand`
- 個別代理：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常見陷阱">
    - 預設 `docker.network` 是 `"none"`（無輸出），因此套件安裝會失敗。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且僅作為破窗用途。
    - `readOnlyRoot: true` 會防止寫入；請設定 `readOnlyRoot: false` 或烘焙自訂映像。
    - `user` 必須是 root 才能安裝套件（省略 `user` 或設定 `user: "0:0"`）。
    - 沙盒 exec **不會**繼承主機的 `process.env`。請使用 `agents.defaults.sandbox.docker.env`（或自訂映像）提供 skill API 金鑰。
    - `agents.defaults.sandbox.docker.env` 中的值會作為明確的 Docker 容器環境變數傳遞。任何具有 Docker daemon 存取權的人都能使用 `docker inspect` 等 Docker 中繼資料命令檢查它們。如果無法接受這種中繼資料暴露，請使用自訂映像、掛載的秘密檔案或其他秘密傳遞路徑。

  </Accordion>
</AccordionGroup>

## 工具政策與逃生口

工具允許/拒絕政策仍會先於沙盒規則套用。如果某個工具在全域或個別代理層級被拒絕，沙盒化不會把它帶回來。

`tools.elevated` 是明確的逃生口，會在沙盒外執行 `exec`（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。`/exec` 指令只會套用於授權寄件者並按工作階段保存；若要硬性停用 `exec`，請使用工具政策拒絕（請參閱 [沙盒 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)）。

偵錯：

- `openclaw sandbox list` 會顯示沙盒容器、狀態、映像符合情況、存在時間、閒置時間，以及相關工作階段/代理。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` 會檢查有效沙盒模式、主機工作區、執行階段工作目錄、Docker 掛載、工具政策，以及修復設定鍵。其 `workspaceRoot` 欄位仍是已設定的沙盒根目錄；`effectiveHostWorkspaceRoot` 會顯示作用中工作區實際所在位置。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` 會移除容器/環境，讓它們在下次使用時以目前設定重新建立。
- 請參閱 [沙盒 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)，了解「為什麼這會被封鎖？」的思考模型。

## 多代理覆寫

每個代理都可以覆寫沙盒 + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（另有 `agents.list[].tools.sandbox.tools` 用於沙盒工具政策）。請參閱[多代理沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools)了解優先順序。

## 最小啟用範例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 相關

- [多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理的覆寫與優先順序
- [OpenShell](/zh-TW/gateway/openshell) -- 受管理的沙箱後端設定、工作區模式與設定參考
- [沙箱設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙箱 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) -- 偵錯「為什麼這被封鎖了？」
- [安全性](/zh-TW/gateway/security)
