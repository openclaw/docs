---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱化運作方式：模式、範圍、工作區存取和映像
title: 沙盒化
x-i18n:
    generated_at: "2026-07-05T11:20:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c12441ddcecc6bbd2ed6dfa28af843c1492ab39621cc7ead25d51e0a7bacba6a
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在沙箱後端內執行工具，以降低影響範圍。沙箱預設為關閉，並由 `agents.defaults.sandbox`（全域）或 `agents.list[].sandbox`（逐代理）控制。閘道程序一律留在主機上；啟用時，只有工具執行會移入沙箱。

<Note>
這不是完美的安全邊界，但當模型做出不當操作時，它能實質限制檔案系統與程序存取。
</Note>

## 會被沙箱化的內容

- 工具執行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等。
- 選用的沙箱化瀏覽器（`agents.defaults.sandbox.browser`）。

不會被沙箱化：

- 閘道程序本身。
- 任何透過 `tools.elevated` 明確允許在沙箱外執行的工具。提升權限的 exec 會繞過沙箱，並在設定的逃逸路徑上執行（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。如果沙箱已關閉，`tools.elevated` 不會改變任何事，因為 exec 已經在主機上執行。請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 模式、範圍與後端

三個獨立設定控制沙箱行為：

| 設定 | 鍵                                | 值                           | 預設值   |
| ---- | --------------------------------- | ---------------------------- | -------- |
| 模式 | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| 範圍 | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| 後端 | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

**模式**控制沙箱何時套用：

- `off`：不使用沙箱。
- `non-main`：除了代理的主要工作階段以外，每個工作階段都使用沙箱。主要工作階段鍵一律是 `agent:<agentId>:main`（或當 `session.scope` 是 `"global"` 時為 `global`）；它不可設定。群組/頻道工作階段會使用自己的鍵，因此一律視為非主要工作階段並被沙箱化。
- `all`：每個工作階段都在沙箱中執行。

**範圍**控制建立多少容器/環境：

- `agent`：每個代理一個容器。
- `session`：每個工作階段一個容器。
- `shared`：所有被沙箱化的工作階段共用一個容器（在此範圍下會忽略逐代理的 `docker`/`ssh`/`browser` 覆寫）。

**後端**控制哪個執行階段會執行沙箱化工具。SSH 專用設定位於 `agents.defaults.sandbox.ssh`；OpenShell 專用設定位於 `plugins.entries.openshell.config`。

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **執行位置**        | 本機容器                         | 任何可透過 SSH 存取的主機      | OpenShell 管理的沙箱                                |
| **設定**            | `scripts/sandbox-setup.sh`       | SSH 金鑰 + 目標主機            | 已啟用 OpenShell 外掛                               |
| **工作區模型**      | bind-mount 或複製                | 遠端為準（播種一次）           | `mirror` 或 `remote`                                |
| **網路控制**        | `docker.network`（預設：無）     | 取決於遠端主機                 | 取決於 OpenShell                                    |
| **瀏覽器沙箱**      | 支援                             | 不支援                         | 尚不支援                                            |
| **Bind mounts**     | `docker.binds`                   | 不適用                         | 不適用                                              |
| **最適合**          | 本機開發、完整隔離               | 卸載到遠端機器                 | 具選用雙向同步的受管遠端沙箱                        |

## Docker 後端

啟用沙箱後，Docker 是預設後端。它透過 Docker daemon socket（`/var/run/docker.sock`）在本機執行工具與沙箱瀏覽器；隔離來自 Docker 命名空間。

預設值：`network: "none"`（無對外連線）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、映像檔 `openclaw-sandbox:bookworm-slim`。

若要公開主機 GPU，請將 `agents.defaults.sandbox.docker.gpus`（或逐代理覆寫）設為類似 `"all"` 或 `"device=GPU-uuid"` 的值。這會傳給 Docker 的 `--gpus` 旗標，並需要相容的主機執行階段，例如 NVIDIA Container Toolkit。

<Warning>
**Docker-out-of-Docker (DooD) 限制**

如果你將 OpenClaw 閘道本身部署為 Docker 容器，它會使用主機的 Docker socket（DooD）協調同層級的沙箱容器。這會引入路徑對應限制：

- **設定需要主機路徑**：`openclaw.json` 的 `workspace` 必須包含**主機的絕對路徑**（例如 `/home/user/.openclaw/workspaces`），而不是閘道容器內部路徑。Docker daemon 會相對於主機作業系統命名空間評估路徑，而不是閘道自己的命名空間。
- **需要相符的 volume 對應**：閘道程序也會將心跳偵測與 bridge 檔案寫入該 `workspace` 路徑。請給閘道容器相同的 volume 對應（`-v /home/user/.openclaw:/home/user/.openclaw`），讓相同主機路徑也能從閘道容器內正確解析。對應不一致會在閘道嘗試寫入心跳偵測時顯示為 `EACCES`。
- **Codex 程式碼模式**：當 OpenClaw 沙箱啟用時，OpenClaw 會在該回合停用 Codex app-server 原生程式碼模式、使用者 MCP 伺服器，以及由應用程式支援的外掛執行（這些會從閘道主機的 app-server 程序執行，而不是 OpenClaw 沙箱後端），除非沙箱工具政策公開必要工具，且你選擇加入實驗性的沙箱 exec-server 路徑。Shell 存取接著會透過 OpenClaw 沙箱支援的工具路由，例如 `sandbox_exec` 和 `sandbox_process`。請勿將主機 Docker socket 掛載進代理沙箱容器或自訂 Codex 沙箱。完整行為請參閱 [Codex Harness](/zh-TW/plugins/codex-harness)。

在啟用 Docker 沙箱模式的 Ubuntu/AppArmor 主機上，Codex app-server 的 `workspace-write` shell 執行需要沙箱容器內的非特權使用者命名空間；當服務使用者無法建立它們時，可能在 shell 啟動前失敗。當 Docker 沙箱對外連線停用（`network: "none"`，預設值）時，這也需要非特權網路命名空間。常見症狀：`bwrap: setting up uid map: Permission denied` 和 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。執行 `openclaw doctor`；如果它回報 Codex bwrap 命名空間探測失敗，請優先使用授予 OpenClaw 服務程序必要命名空間的 AppArmor profile。`kernel.apparmor_restrict_unprivileged_userns=0` 是主機範圍的備用方案，具有安全取捨；只有在該主機的安全姿態可接受時才使用。
</Warning>

### 沙箱化瀏覽器

- 當瀏覽器工具需要時，沙箱瀏覽器會自動啟動（確保 CDP 可連線）。透過 `agents.defaults.sandbox.browser.autoStart`（預設 `true`）和 `autoStartTimeoutMs`（預設 12 秒）設定。
- 沙箱瀏覽器容器使用專用 Docker 網路（`openclaw-sandbox-browser`），而不是全域 `bridge` 網路。透過 `agents.defaults.sandbox.browser.network` 設定。
- `agents.defaults.sandbox.browser.cdpSourceRange` 會用 CIDR allowlist 限制容器邊界的 CDP 入口（例如 `172.21.0.1/32`）。
- noVNC 觀察者存取預設受密碼保護；OpenClaw 會發出短效 token URL，提供本機 bootstrap 頁面，並用 URL fragment（不是 query string 或 header logs）中的密碼開啟 noVNC。
- `agents.defaults.sandbox.browser.allowHostControl`（預設 `false`）允許沙箱化工作階段明確指定主機瀏覽器。
- 選用 allowlist 會限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

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

- **生命週期**：OpenClaw 會在 `sandbox.ssh.workspaceRoot` 下建立逐範圍的遠端 root。建立或重新建立後首次使用時，它會從本機工作區將該遠端工作區播種一次。之後，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒體讀取，以及傳入媒體暫存都會透過 SSH 直接針對遠端工作區執行。OpenClaw 不會自動將遠端變更同步回本機工作區。
- **驗證材料**：`identityFile`/`certificateFile`/`knownHostsFile` 參照現有本機檔案。`identityData`/`certificateData`/`knownHostsData` 接受 inline 字串或 SecretRefs，透過一般 secrets 執行階段快照解析，寫入模式為 `0600` 的暫存檔案，並在 SSH 工作階段結束時刪除。如果同一項目同時設定 `*File` 和 `*Data` 變體，該工作階段會以 `*Data` 優先。
- **遠端為準的後果**：初始播種後，遠端 SSH 工作區會成為真正的沙箱狀態。在播種步驟後於 OpenClaw 外部進行的主機本機編輯，在你重新建立沙箱前不會在遠端可見。`openclaw sandbox recreate` 會刪除逐範圍的遠端 root，並在下次使用時再次從本機播種。此後端不支援瀏覽器沙箱化，且 `sandbox.docker.*` 設定不適用於它。

## OpenShell 後端

使用 `backend: "openshell"` 可在 OpenShell 管理的遠端環境中沙箱化工具。OpenShell 重用與通用 SSH 後端相同的 SSH 傳輸與遠端檔案系統 bridge，並加入 OpenShell 生命週期（`sandbox create/get/delete/ssh-config`）以及選用的 `mirror` 工作區同步模式。

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

`mode: "mirror"`（預設）會讓本機工作區成為準則：OpenClaw 會在 `exec` 前將本機同步進沙箱，並在之後同步回來。`mode: "remote"` 會從本機將遠端工作區播種一次，接著直接針對遠端工作區執行 `exec`/`read`/`write`/`edit`/`apply_patch`，且不會同步回來；播種後的本機編輯在你執行 `openclaw sandbox recreate` 前不可見。在 `scope: "agent"` 或 `scope: "shared"` 下，該遠端工作區會在相同範圍內共用。目前限制：尚不支援沙箱瀏覽器，且 `sandbox.docker.binds` 不適用於此後端。

`openclaw sandbox list`/`recreate`/prune all 都會以與 Docker 執行階段相同的方式處理 OpenShell 執行階段；prune 邏輯會感知後端。

完整的先決條件、設定參考、工作區模式比較與生命週期細節，請參閱 [OpenShell](/zh-TW/gateway/openshell)。

## 工作區存取

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可以看到什麼：

| 值               | 行為                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none`（預設）   | 工具會看到位於 `~/.openclaw/sandboxes` 下的隔離沙箱工作區。                               |
| `ro`             | 以唯讀方式將代理工作區掛載到 `/agent`（停用 `write`/`edit`/`apply_patch`）。              |
| `rw`             | 以讀寫方式將代理工作區掛載到 `/workspace`。                                               |

使用 OpenShell 後端時，`mirror` 模式仍會在 exec 回合之間使用本機工作區作為標準來源，`remote` 模式會在初始種子之後使用遠端 OpenShell 工作區作為標準來源，而 `workspaceAccess: "ro"`/`"none"` 仍會以相同方式限制寫入行為。

傳入媒體會複製到作用中的沙箱工作區（`media/inbound/*`）。

<Note>
**Skills**：`read` 工具以沙箱根目錄為根。使用 `workspaceAccess: "none"` 時，OpenClaw 會將符合資格的 skills 鏡像到沙箱工作區（`.../skills`），以便讀取。使用 `"rw"` 時，可從 `/workspace/skills` 讀取工作區 skills，而符合資格的受管理、內建或外掛 skills 會實體化到產生的唯讀路徑 `/workspace/.openclaw/sandbox-skills/skills`。
</Note>

## 自訂繫結掛載

`agents.defaults.sandbox.docker.binds` 會將額外的主機目錄掛載到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全域與個別代理的繫結會合併（不會取代）。在 `scope: "shared"` 下，個別代理的繫結會被忽略。

`agents.defaults.sandbox.browser.binds` 只會將額外的主機目錄掛載到**沙箱瀏覽器**容器中。設定後（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`；省略時，瀏覽器容器會回退使用 `docker.binds`。

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

- 繫結會繞過沙箱檔案系統：它們會以你設定的模式（`:ro` 或 `:rw`）暴露主機路徑。
- OpenClaw 預設會封鎖危險的繫結來源：系統路徑（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker socket 目錄（`/run`、`/var/run` 及其 `docker.sock` 變體），以及常見的家目錄憑證根目錄（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）。
- 驗證會先正規化來源路徑，然後透過最深的既有祖先再次解析，再重新檢查封鎖路徑與允許根目錄，因此即使最終葉節點尚不存在，符號連結父目錄逃逸也會失敗關閉（例如，如果 `run-link` 指向該處，`/workspace/run-link/new-file` 仍會解析為 `/var/run/...`）。
- 預設也會封鎖遮蔽保留容器掛載點（`/workspace`、`/agent`）的繫結目標；可用 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` 覆寫。
- 預設會封鎖位於工作區/代理工作區允許清單根目錄之外的繫結來源；可用 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` 覆寫。允許根目錄也會以相同方式標準化，因此在符號連結解析前看似位於允許清單內的路徑，仍會因為位於允許根目錄之外而被拒絕。
- 敏感掛載（秘密、SSH 金鑰、服務憑證）除非絕對必要，否則應為 `:ro`。
- 如果只需要工作區的讀取存取，請搭配 `workspaceAccess: "ro"`；繫結模式仍保持獨立。
- 請參閱 [沙箱與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)，了解繫結如何與工具政策和提升權限 exec 互動。

</Warning>

## 映像與設定

預設 Docker 映像：`openclaw-sandbox:bookworm-slim`

<Note>
**來源 checkout 與 npm install**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 輔助腳本只在從[來源 checkout](https://github.com/openclaw/openclaw) 執行時可用。它們不包含在 npm 套件中。

如果你透過 `npm install -g openclaw` 安裝 OpenClaw，請改用下方顯示的內嵌 `docker build` 命令。
</Note>

<Steps>
  <Step title="建置預設映像">
    從來源 checkout：

    ```bash
    scripts/sandbox-setup.sh
    ```

    從 npm install（不需要來源 checkout）：

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

    預設映像**不**包含節點。如果 skill 需要節點（或其他執行階段），請烘焙自訂映像，或透過 `sandbox.docker.setupCommand` 安裝（需要網路出口 + 可寫入根目錄 + root 使用者）。

    當 `openclaw-sandbox:bookworm-slim` 缺失時，OpenClaw 不會默默替換成一般的 `debian:bookworm-slim`。目標為預設映像的沙箱執行會快速失敗並顯示建置指示，直到你建置它為止，因為內建映像攜帶了沙箱 write/edit 輔助工具所需的 `python3`。

  </Step>
  <Step title="選用：建置通用映像">
    若要取得包含常用工具的功能更完整沙箱映像（例如 `curl`、`jq`、節點 24、pnpm、`python3` 和 `git`）：

    從來源 checkout：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    從 npm install，先建置預設映像（見上方），再使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) 在其上建置通用映像。

    接著將 `agents.defaults.sandbox.docker.image` 設為 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="選用：建置沙箱瀏覽器映像">
    從來源 checkout：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    從 npm install，使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) 建置。

  </Step>
</Steps>

預設情況下，Docker 沙箱容器會以**無網路**執行。可用 `agents.defaults.sandbox.docker.network` 覆寫。

<AccordionGroup>
  <Accordion title="沙箱瀏覽器 Chromium 預設值">
    內建沙箱瀏覽器映像會為容器化工作負載套用保守的 Chromium 啟動旗標：

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
    - 預設使用 `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer`；這些圖形強化旗標有助於沒有 GPU 支援的容器。如果你的工作負載需要 WebGL 或其他 3D 功能，請設定 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - 預設使用 `--disable-extensions`；若流程依賴擴充功能，請設定 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`。
    - 預設使用 `--renderer-process-limit=2`；由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 會保留 Chromium 的預設值。

    如果需要不同的執行階段設定檔，請使用自訂瀏覽器映像並提供自己的進入點。對於本機（非容器）Chromium 設定檔，請使用 `browser.extraArgs` 附加其他啟動旗標。

  </Accordion>
  <Accordion title="網路安全性預設值">
    - `network: "host"` 會被封鎖。
    - 預設會封鎖 `network: "container:<id>"`（命名空間加入繞過風險）。
    - 緊急覆寫：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安裝與容器化閘道位於此處：[Docker](/zh-TW/install/docker)

對於 Docker 閘道部署，`scripts/docker/setup.sh` 可以啟動沙箱設定。設定 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）以啟用該路徑。可用 `OPENCLAW_DOCKER_SOCKET` 覆寫 socket 位置。完整設定與環境參考：[Docker](/zh-TW/install/docker#agent-sandbox)。

## setupCommand（一次性容器設定）

`setupCommand` 會在沙箱容器建立後**執行一次**（不是每次執行都執行）。它會透過 `sh -lc` 在容器內執行。

路徑：

- 全域：`agents.defaults.sandbox.docker.setupCommand`
- 個別代理：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常見陷阱">
    - 預設 `docker.network` 是 `"none"`（無出口），因此套件安裝會失敗。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且僅供緊急使用。
    - `readOnlyRoot: true` 會阻止寫入；請設定 `readOnlyRoot: false` 或烘焙自訂映像。
    - `user` 必須是 root 才能安裝套件（省略 `user` 或設定 `user: "0:0"`）。
    - 沙箱 exec **不會**繼承主機 `process.env`。請使用 `agents.defaults.sandbox.docker.env`（或自訂映像）提供 skill API 金鑰。
    - `agents.defaults.sandbox.docker.env` 中的值會作為明確的 Docker 容器環境變數傳遞。任何擁有 Docker daemon 存取權的人都可以使用 `docker inspect` 等 Docker 中繼資料命令檢查它們。如果無法接受這種中繼資料暴露，請使用自訂映像、掛載的秘密檔案，或其他秘密傳遞路徑。

  </Accordion>
</AccordionGroup>

## 工具政策與逃生口

工具允許/拒絕政策仍會先於沙箱規則套用。如果某個工具在全域或個別代理層級遭拒絕，沙箱不會把它帶回來。

`tools.elevated` 是明確的逃生口，會在沙箱外執行 `exec`（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。`/exec` 指令只適用於已授權的傳送者，並會在每個工作階段中持續存在；若要硬性停用 `exec`，請使用工具政策拒絕（請參閱[沙箱與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)）。

偵錯：

- `openclaw sandbox list` 會顯示沙箱容器、狀態、映像是否相符、存留時間、閒置時間，以及關聯的工作階段/代理。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` 會檢查有效的沙箱模式、工具政策，以及修復設定鍵。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` 會移除容器/環境，讓它們在下次使用時以目前設定重新建立。
- 請參閱[沙箱與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)，了解「為什麼這被封鎖？」的心智模型。

## 多代理覆寫

每個代理都可以覆寫沙箱 + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（以及用於沙箱工具政策的 `agents.list[].tools.sandbox.tools`）。請參閱[多代理沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)了解優先順序。

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
- [沙箱 vs 工具政策 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) -- 偵錯「為什麼這被封鎖？」
- [安全性](/zh-TW/gateway/security)
