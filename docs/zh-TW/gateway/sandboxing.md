---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱機制的運作方式：模式、範圍、工作區存取權限與映像檔
title: 沙箱隔離
x-i18n:
    generated_at: "2026-07-11T21:22:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可在沙箱後端中執行工具，以縮小影響範圍。沙箱預設為關閉，並由 `agents.defaults.sandbox`（全域）或 `agents.list[].sandbox`（個別代理程式）控制。閘道程序一律留在主機上；啟用沙箱後，只有工具執行會移入沙箱。

<Note>
這並非完美的安全邊界，但當模型做出不當操作時，它能實質限制檔案系統與程序的存取。
</Note>

## 哪些項目會進入沙箱

- 工具執行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等。
- 選用的沙箱瀏覽器（`agents.defaults.sandbox.browser`）。

不會進入沙箱的項目：

- 閘道程序本身。
- 透過 `tools.elevated` 明確允許在沙箱外執行的任何工具。提升權限的 exec 會略過沙箱，並在設定的逸出路徑上執行（預設為 `gateway`；當 exec 目標為 `node` 時則為 `node`）。若沙箱已關閉，`tools.elevated` 不會造成任何變化，因為 exec 本來就已在主機上執行。請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 模式、範圍與後端

三項互相獨立的設定控制沙箱行為：

| 設定 | 鍵                                | 值                           | 預設值   |
| ---- | --------------------------------- | ---------------------------- | -------- |
| 模式 | `agents.defaults.sandbox.mode`    | `off`、`non-main`、`all`     | `off`    |
| 範圍 | `agents.defaults.sandbox.scope`   | `agent`、`session`、`shared` | `agent`  |
| 後端 | `agents.defaults.sandbox.backend` | `docker`、`ssh`、`openshell` | `docker` |

**模式**控制何時套用沙箱：

- `off`：不使用沙箱。
- `non-main`：除代理程式主要工作階段外，所有工作階段都使用沙箱。主要工作階段鍵一律為 `agent:<agentId>:main`（當 `session.scope` 為 `"global"` 時則為 `global`），且無法設定。群組／頻道工作階段使用各自的鍵，因此一律視為非主要工作階段並使用沙箱。
- `all`：每個工作階段都在沙箱中執行。

**範圍**控制建立多少個容器／環境：

- `agent`：每個代理程式使用一個容器。
- `session`：每個工作階段使用一個容器。
- `shared`：所有使用沙箱的工作階段共用一個容器（在此範圍下，會忽略個別代理程式的 `docker`／`ssh`／`browser` 覆寫設定）。

**後端**控制由哪個執行環境執行沙箱工具。SSH 專用設定位於 `agents.defaults.sandbox.ssh`；OpenShell 專用設定位於 `plugins.entries.openshell.config`。

|                    | Docker                           | SSH                          | OpenShell                                  |
| ------------------ | -------------------------------- | ---------------------------- | ------------------------------------------ |
| **執行位置**       | 本機容器                         | 任何可透過 SSH 存取的主機    | 由 OpenShell 管理的沙箱                    |
| **設定方式**       | `scripts/sandbox-setup.sh`       | SSH 金鑰與目標主機           | 啟用 OpenShell 外掛                        |
| **工作區模型**     | 繫結掛載或複製                   | 遠端為準（僅植入一次）       | `mirror` 或 `remote`                       |
| **網路控制**       | `docker.network`（預設：無網路） | 取決於遠端主機               | 取決於 OpenShell                           |
| **瀏覽器沙箱**     | 支援                             | 不支援                       | 尚未支援                                   |
| **繫結掛載**       | `docker.binds`                   | 不適用                       | 不適用                                     |
| **最適合的用途**   | 本機開發、完整隔離               | 將工作卸載至遠端機器         | 具選用雙向同步功能的受管理遠端沙箱         |

## Docker 後端

啟用沙箱後，Docker 是預設後端。它透過 Docker 常駐程式通訊端（`/var/run/docker.sock`）在本機執行工具與沙箱瀏覽器；隔離能力來自 Docker 命名空間。

預設值：`network: "none"`（無對外連線）、`readOnlyRoot: true`、`capDrop: ["ALL"]`，映像為 `openclaw-sandbox:bookworm-slim`。

若要將主機 GPU 提供給沙箱，請將 `agents.defaults.sandbox.docker.gpus`（或個別代理程式的覆寫設定）設為類似 `"all"` 或 `"device=GPU-uuid"` 的值。此值會傳遞至 Docker 的 `--gpus` 旗標，且需要相容的主機執行環境，例如 NVIDIA Container Toolkit。

<Warning>
**Docker 外部控制 Docker（DooD）的限制**

若您將 OpenClaw 閘道本身部署為 Docker 容器，它會使用主機的 Docker 通訊端協調同層級的沙箱容器（DooD）。這會帶來路徑對應限制：

- **設定必須使用主機路徑**：`openclaw.json` 的 `workspace` 必須包含**主機的絕對路徑**（例如 `/home/user/.openclaw/workspaces`），而非閘道容器內部路徑。Docker 常駐程式會相對於主機作業系統的命名空間解析路徑，而非閘道本身的命名空間。
- **必須使用相同的磁碟區對應**：閘道程序也會將心跳偵測與橋接檔案寫入該 `workspace` 路徑。請為閘道容器提供完全相同的磁碟區對應（`-v /home/user/.openclaw:/home/user/.openclaw`），使相同的主機路徑也能在閘道容器內正確解析。對應不一致時，閘道嘗試寫入心跳偵測時會出現 `EACCES`。
- **Codex 程式碼模式**：當 OpenClaw 沙箱啟用時，OpenClaw 會在該回合停用 Codex app-server 原生程式碼模式、使用者 MCP 伺服器，以及由應用程式支援的外掛執行（這些功能是從閘道主機上的 app-server 程序執行，而非 OpenClaw 沙箱後端），除非沙箱工具政策公開所需工具，且您選擇啟用實驗性的沙箱 exec-server 路徑。之後，Shell 存取會透過由 OpenClaw 沙箱支援的工具路由，例如 `sandbox_exec` 與 `sandbox_process`。請勿將主機 Docker 通訊端掛載至代理程式沙箱容器或自訂 Codex 沙箱。完整行為請參閱 [Codex Harness](/zh-TW/plugins/codex-harness)。

在已啟用 Docker 沙箱模式的 Ubuntu／AppArmor 主機上，Codex app-server 的 `workspace-write` Shell 執行需要沙箱容器內的非特權使用者命名空間；當服務使用者無法建立這些命名空間時，可能會在 Shell 啟動前失敗。若已停用 Docker 沙箱對外連線（預設的 `network: "none"`），還需要非特權網路命名空間。常見症狀包括：`bwrap: setting up uid map: Permission denied` 與 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。請執行 `openclaw doctor`；若它回報 Codex bwrap 命名空間探測失敗，建議優先使用允許 OpenClaw 服務程序建立所需命名空間的 AppArmor 設定檔。`kernel.apparmor_restrict_unprivileged_userns=0` 是影響整台主機且具有安全取捨的備用方案；只有在該主機的安全態勢可接受時才使用。
</Warning>

### 沙箱瀏覽器

- 當瀏覽器工具需要沙箱瀏覽器時，它會自動啟動（確保可連線至 CDP）。可透過 `agents.defaults.sandbox.browser.autoStart`（預設為 `true`）與 `autoStartTimeoutMs`（預設為 12 秒）設定。
- 沙箱瀏覽器容器使用專用 Docker 網路（`openclaw-sandbox-browser`），而非全域 `bridge` 網路。可透過 `agents.defaults.sandbox.browser.network` 設定。
- `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允許清單限制容器邊界的 CDP 輸入流量（例如 `172.21.0.1/32`）。
- noVNC 觀察者存取預設受密碼保護；OpenClaw 會產生短效權杖網址，用於提供本機啟動頁面，並以網址片段中的密碼開啟 noVNC（不會放在查詢字串或標頭記錄中）。
- `agents.defaults.sandbox.browser.allowHostControl`（預設為 `false`）允許沙箱工作階段明確指定主機瀏覽器。
- 選用的允許清單會限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

## SSH 後端

使用 `backend: "ssh"`，可在任何能透過 SSH 存取的機器上，對 `exec`、檔案工具及媒體讀取作業進行沙箱隔離。

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
          // 或使用 SecretRefs／行內內容，而非本機檔案：
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

- **生命週期**：OpenClaw 會在 `sandbox.ssh.workspaceRoot` 下建立各範圍專用的遠端根目錄。建立或重新建立後首次使用時，它會從本機工作區將內容植入該遠端工作區一次。此後，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒體讀取及輸入媒體暫存作業，都會透過 SSH 直接操作遠端工作區。OpenClaw 不會自動將遠端變更同步回本機工作區。
- **驗證資料**：`identityFile`／`certificateFile`／`knownHostsFile` 參照現有的本機檔案。`identityData`／`certificateData`／`knownHostsData` 可接受行內字串或 SecretRefs，經由一般的祕密執行環境快照解析後，會以 `0600` 模式寫入暫存檔案，並於 SSH 工作階段結束時刪除。若同一項目同時設定 `*File` 與 `*Data` 變體，則該工作階段以 `*Data` 為準。
- **以遠端為準的影響**：完成初始植入後，遠端 SSH 工作區會成為實際的沙箱狀態。在植入步驟完成後，於 OpenClaw 外部進行的主機本機編輯，在重新建立沙箱前都不會顯示於遠端。`openclaw sandbox recreate` 會刪除各範圍專用的遠端根目錄，並在下次使用時再次從本機植入。此後端不支援瀏覽器沙箱，且 `sandbox.docker.*` 設定不適用。

## OpenShell 後端

使用 `backend: "openshell"`，可在 OpenShell 管理的遠端環境中隔離工具。OpenShell 會重複使用與一般 SSH 後端相同的 SSH 傳輸與遠端檔案系統橋接，並加入 OpenShell 生命週期（`sandbox create/get/delete/ssh-config`）及選用的 `mirror` 工作區同步模式。

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

`mode: "mirror"`（預設）以本機工作區為準：OpenClaw 會在執行 `exec` 前將本機內容同步至沙箱，並於執行後同步回本機。`mode: "remote"` 會從本機將內容植入遠端工作區一次，之後直接對遠端工作區執行 `exec`／`read`／`write`／`edit`／`apply_patch`，而不會同步回本機；植入後的本機編輯在執行 `openclaw sandbox recreate` 前都不會顯示。使用 `scope: "agent"` 或 `scope: "shared"` 時，該遠端工作區會在相同範圍內共用。目前的限制：尚不支援沙箱瀏覽器，且 `sandbox.docker.binds` 不適用於此後端。

`openclaw sandbox list`／`recreate`／prune 對 OpenShell 執行環境與 Docker 執行環境採用相同處理方式；清理邏輯會辨識後端。

如需完整的先決條件、設定參考、工作區模式比較與生命週期詳細資訊，請參閱 [OpenShell](/zh-TW/gateway/openshell)。

## 工作區存取權限

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可查看的內容：

| 值               | 行為                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `none`（預設）   | 工具會看到位於 `~/.openclaw/sandboxes` 下的隔離沙箱工作區。                                  |
| `ro`             | 將代理程式工作區以唯讀方式掛載至 `/agent`（停用 `write`/`edit`/`apply_patch`）。              |
| `rw`             | 將代理程式工作區以可讀寫方式掛載至 `/workspace`。                                            |

使用 OpenShell 後端時，`mirror` 模式仍會在各次執行之間使用本機工作區作為標準來源；`remote` 模式則會在初始植入資料後，使用遠端 OpenShell 工作區作為標準來源；而 `workspaceAccess: "ro"`/`"none"` 仍會以相同方式限制寫入行為。

傳入媒體會複製到使用中的沙箱工作區（`media/inbound/*`）。

<Note>
**Skills**：`read` 工具以沙箱根目錄為基準。當 `workspaceAccess: "none"` 時，OpenClaw 會將符合條件的 Skills 鏡像到沙箱工作區（`.../skills`），以便讀取。使用 `"rw"` 時，可從 `/workspace/skills` 讀取工作區 Skills，而符合條件的受管理、內建或外掛 Skills 則會具體化至產生的唯讀路徑 `/workspace/.openclaw/sandbox-skills/skills`。
</Note>

## 自訂繫結掛載

`agents.defaults.sandbox.docker.binds` 會將額外的主機目錄掛載到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全域與各代理程式的繫結會合併（而非取代）。在 `scope: "shared"` 下，各代理程式的繫結會被忽略。

`agents.defaults.sandbox.browser.binds` 只會將額外的主機目錄掛載到**沙箱瀏覽器**容器。設定時（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`；省略時，瀏覽器容器會退回使用 `docker.binds`。

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

- 繫結會繞過沙箱檔案系統：它們會依照你設定的模式（`:ro` 或 `:rw`）公開主機路徑。
- OpenClaw 預設會封鎖危險的繫結來源：系統路徑（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker 通訊端目錄（`/run`、`/var/run` 及其 `docker.sock` 變體），以及常見的家目錄憑證根目錄（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）。
- 驗證會先正規化來源路徑，再透過最深層的現有祖先重新解析，然後再次檢查封鎖路徑與允許的根目錄；因此，即使最終葉節點尚不存在，透過符號連結父目錄逸出的情況也會以封閉方式失敗（例如，若 `run-link` 指向 `/var/run`，`/workspace/run-link/new-file` 仍會解析為 `/var/run/...`）。
- 預設也會封鎖遮蔽容器保留掛載點（`/workspace`、`/agent`）的繫結目標；可使用 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` 覆寫。
- 預設會封鎖工作區／代理程式工作區允許清單根目錄以外的繫結來源；可使用 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` 覆寫。允許的根目錄也會以相同方式標準化，因此在解析符號連結前看似位於允許清單內的路徑，若解析後位於允許根目錄之外，仍會被拒絕。
- 敏感掛載（秘密、SSH 金鑰、服務憑證）除非絕對必要，否則應使用 `:ro`。
- 如果你只需要工作區的讀取權限，請搭配 `workspaceAccess: "ro"`；繫結模式仍彼此獨立。
- 關於繫結如何與工具政策及提升權限執行互動，請參閱[沙箱與工具政策及提升權限執行的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)。

</Warning>

## 映像與設定

預設 Docker 映像：`openclaw-sandbox:bookworm-slim`

<Note>
**原始碼簽出與 npm 安裝的比較**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 輔助指令碼僅能在[原始碼簽出](https://github.com/openclaw/openclaw)中執行時使用。npm 套件不包含這些指令碼。

如果你透過 `npm install -g openclaw` 安裝 OpenClaw，請改用下方所示的行內 `docker build` 命令。
</Note>

<Steps>
  <Step title="建置預設映像">
    從原始碼簽出：

    ```bash
    scripts/sandbox-setup.sh
    ```

    從 npm 安裝（不需要原始碼簽出）：

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

    預設映像**不**包含 Node。如果某個 Skill 需要 Node（或其他執行環境），請建置自訂映像，或透過 `sandbox.docker.setupCommand` 安裝（需要網路輸出連線、可寫入的根檔案系統及 root 使用者）。

    當缺少 `openclaw-sandbox:bookworm-slim` 時，OpenClaw 不會悄悄改用一般的 `debian:bookworm-slim`。以預設映像為目標的沙箱執行會立即失敗並顯示建置指示，直到你建置該映像為止，因為內建映像包含沙箱 `write`/`edit` 輔助工具所需的 `python3`。

  </Step>
  <Step title="選用：建置通用映像">
    若需要具備常用工具（例如 `curl`、`jq`、Node 24、pnpm、`python3` 和 `git`）且功能更完整的沙箱映像：

    從原始碼簽出：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    從 npm 安裝時，請先建置預設映像（見上文），接著使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common)，在預設映像上建置通用映像。

    然後將 `agents.defaults.sandbox.docker.image` 設為 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="選用：建置沙箱瀏覽器映像">
    從原始碼簽出：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    從 npm 安裝時，請使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) 進行建置。

  </Step>
</Steps>

Docker 沙箱容器預設在**無網路**的情況下執行。可使用 `agents.defaults.sandbox.docker.network` 覆寫。

<AccordionGroup>
  <Accordion title="沙箱瀏覽器的 Chromium 預設值">
    內建沙箱瀏覽器映像會針對容器化工作負載套用保守的 Chromium 啟動旗標：

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
    - 預設使用 `--disable-extensions`；依賴擴充功能的流程請設定 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`。
    - 預設使用 `--renderer-process-limit=2`；由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 會保留 Chromium 的預設值。

    如果需要不同的執行環境設定檔，請使用自訂瀏覽器映像並提供你自己的進入點。對於本機（非容器）Chromium 設定檔，請使用 `browser.extraArgs` 附加額外的啟動旗標。

  </Accordion>
  <Accordion title="網路安全預設值">
    - `network: "host"` 會被封鎖。
    - 預設會封鎖 `network: "container:<id>"`（存在加入命名空間以繞過限制的風險）。
    - 緊急覆寫：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安裝與容器化閘道的資訊位於：[Docker](/zh-TW/install/docker)

對於 Docker 閘道部署，`scripts/docker/setup.sh` 可以啟動沙箱設定。將 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）設為啟用該路徑。可使用 `OPENCLAW_DOCKER_SOCKET` 覆寫通訊端位置。完整設定與環境變數參考：[Docker](/zh-TW/install/docker#agent-sandbox)。

## setupCommand（單次容器設定）

`setupCommand` 會在建立沙箱容器後執行**一次**（並非每次執行時）。它會透過 `sh -lc` 在容器內執行。

路徑：

- 全域：`agents.defaults.sandbox.docker.setupCommand`
- 各代理程式：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常見陷阱">
    - `docker.network` 的預設值為 `"none"`（無輸出連線），因此套件安裝會失敗。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且僅限緊急情況使用。
    - `readOnlyRoot: true` 會阻止寫入；請設定 `readOnlyRoot: false` 或建置自訂映像。
    - 安裝套件時，`user` 必須是 root（省略 `user`，或設定 `user: "0:0"`）。
    - 沙箱 `exec` **不會**繼承主機的 `process.env`。請使用 `agents.defaults.sandbox.docker.env`（或自訂映像）提供 Skill API 金鑰。
    - `agents.defaults.sandbox.docker.env` 中的值會以明確的 Docker 容器環境變數形式傳遞。任何具有 Docker 常駐程式存取權限的人，都可以透過 `docker inspect` 等 Docker 中繼資料命令檢視這些值。如果無法接受這種中繼資料暴露，請使用自訂映像、掛載的秘密檔案或其他秘密傳遞途徑。

  </Accordion>
</AccordionGroup>

## 工具政策與逃生機制

工具允許／拒絕政策仍會先於沙箱規則套用。如果工具在全域或各代理程式層級遭拒絕，沙箱機制不會讓它恢復可用。

`tools.elevated` 是明確的逃生機制，可在沙箱外執行 `exec`（預設為 `gateway`；當執行目標為 `node` 時則為 `node`）。`/exec` 指示僅適用於已授權的傳送者，並會在各工作階段中持續生效；若要徹底停用 `exec`，請使用工具政策拒絕（請參閱[沙箱與工具政策及提升權限執行的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)）。

偵錯：

- `openclaw sandbox list` 會顯示沙箱容器、狀態、映像相符情況、存續時間、閒置時間及相關工作階段／代理程式。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` 會檢查有效的沙箱模式、主機工作區、執行環境工作目錄、Docker 掛載、工具政策及修正用設定鍵。其 `workspaceRoot` 欄位會維持為設定的沙箱根目錄；`effectiveHostWorkspaceRoot` 則會顯示使用中的工作區實際所在位置。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` 會移除容器／環境，使其在下次使用時依照目前設定重新建立。
- 如需理解「為何這會被封鎖？」的思考模型，請參閱[沙箱與工具政策及提升權限執行的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)。

## 多代理程式覆寫

每個代理程式都可以覆寫沙箱與工具：`agents.list[].sandbox` 和 `agents.list[].tools`（另加沙箱工具政策的 `agents.list[].tools.sandbox.tools`）。如需優先順序，請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

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

## 相關內容

- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 各代理程式的覆寫設定與優先順序
- [OpenShell](/zh-TW/gateway/openshell) -- 受管理沙箱後端設定、工作區模式與設定參考
- [沙箱設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙箱與工具政策及提升權限的差異](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) -- 偵錯「為什麼這會被封鎖？」
- [安全性](/zh-TW/gateway/security)
