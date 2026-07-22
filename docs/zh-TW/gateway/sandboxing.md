---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙箱機制的運作方式：模式、範圍、工作區存取與映像檔
title: 沙箱隔離
x-i18n:
    generated_at: "2026-07-22T10:36:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a3668dc512a8ff30732290ee68e9dd29a3a2e9c106e6e39077a97bfbd90098f7
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可在沙箱後端內執行工具，以縮小影響範圍。沙箱預設關閉，並由 `agents.defaults.sandbox`（全域）或 `agents.entries.*.sandbox`（個別代理程式）控制。閘道程序一律留在主機上；啟用沙箱時，只有工具執行會移至沙箱內。

<Note>
這並非完美的安全邊界，但當模型做出愚蠢行為時，確實能大幅限制檔案系統與程序的存取範圍。
</Note>

## 哪些項目會在沙箱中執行

- 工具執行：`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等。
- 選用的沙箱瀏覽器（`agents.defaults.sandbox.browser`）。

不在沙箱中執行：

- 閘道程序本身。
- 任何透過 `tools.elevated` 明確允許在沙箱外執行的工具。提升權限的執行會繞過沙箱，並在設定的逸出路徑上執行（預設為 `gateway`；當執行目標為 `node` 時則為 `node`）。若沙箱已關閉，`tools.elevated` 不會改變任何行為，因為執行原本就在主機上進行。請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 模式、範圍與後端

三項獨立設定控制沙箱行為：

| 設定 | 鍵                                | 值                           | 預設值   |
| ------- | --------------------------------- | ---------------------------- | -------- |
| 模式    | `agents.defaults.sandbox.mode`    | `off`、`non-main`、`all`     | `off`    |
| 範圍    | `agents.defaults.sandbox.scope`   | `agent`、`session`、`shared` | `agent`  |
| 後端 | `agents.defaults.sandbox.backend` | `docker`、`ssh`、`openshell` | `docker` |

**模式**控制何時套用沙箱：

- `off`：不使用沙箱。
- `non-main`：除代理程式的主要工作階段外，所有工作階段都使用沙箱。主要工作階段鍵一律為 `agent:<agentId>:main`（當 `session.scope` 為 `"global"` 時則為 `global`）；此值無法設定。群組／頻道工作階段使用各自的鍵，因此一律視為非主要工作階段並使用沙箱。
- `all`：每個工作階段都在沙箱中執行。

**範圍**控制建立多少個容器／環境：

- `agent`：每個代理程式使用一個容器。
- `session`：每個工作階段使用一個容器。
- `shared`：所有使用沙箱的工作階段共用一個容器（在此範圍下，個別代理程式的 `docker`／`ssh`／`browser` 覆寫會被忽略）。

**後端**控制由哪個執行階段執行沙箱工具。SSH 專用設定位於 `agents.defaults.sandbox.ssh` 下；OpenShell 專用設定位於 `plugins.entries.openshell.config` 下。

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **執行位置**   | 本機容器                  | 任何可透過 SSH 存取的主機        | OpenShell 管理的沙箱                           |
| **設定**           | `scripts/sandbox-setup.sh`       | SSH 金鑰 + 目標主機          | 已啟用 OpenShell 外掛                            |
| **工作區模型** | 繫結掛載或複製               | 遠端為準（植入一次）   | `mirror` 或 `remote`                                |
| **網路控制** | `docker.network`（預設：無） | 取決於遠端主機         | 取決於 OpenShell                                |
| **瀏覽器沙箱** | 支援                        | 不支援                  | 尚未支援                                   |
| **繫結掛載**     | `docker.binds`                   | 不適用                            | 不適用                                                 |
| **最適合**        | 本機開發、完整隔離        | 將工作卸載至遠端機器 | 具有選用雙向同步功能的受管理遠端沙箱 |

## Docker 後端

啟用沙箱後，Docker 是預設後端。它會透過 Docker 常駐程式通訊端（`/var/run/docker.sock`），在本機執行工具與沙箱瀏覽器；隔離功能由 Docker 命名空間提供。

預設值：`network: "none"`（無對外連線）、`readOnlyRoot: true`、`capDrop: ["ALL"]`、映像檔 `openclaw-sandbox:bookworm-slim`。

若要公開主機 GPU，請將 `agents.defaults.sandbox.docker.gpus`（或個別代理程式的覆寫值）設為 `"all"` 或 `"device=GPU-uuid"` 之類的值。此值會傳遞給 Docker 的 `--gpus` 旗標，且需要相容的主機執行階段，例如 NVIDIA Container Toolkit。

<Warning>
**Docker 外執行 Docker（DooD）的限制**

若將 OpenClaw 閘道本身部署為 Docker 容器，它會使用主機的 Docker 通訊端協調同層級的沙箱容器（DooD）。這會引入路徑對應限制：

- **設定需要主機路徑**：`openclaw.json` `workspace` 必須包含**主機的絕對路徑**（例如 `/home/user/.openclaw/workspaces`），而非閘道容器內部的路徑。Docker 常駐程式會相對於主機作業系統的命名空間評估路徑，而非閘道本身的命名空間。
- **需要相符的磁碟區對應**：閘道程序也會將心跳偵測與橋接檔案寫入該 `workspace` 路徑。請為閘道容器提供相同的磁碟區對應（`-v /home/user/.openclaw:/home/user/.openclaw`），讓同一主機路徑也能從閘道容器內部正確解析。若對應不一致，閘道嘗試寫入心跳偵測時會顯示 `EACCES`。
- **Codex 程式碼模式**：當 OpenClaw 沙箱啟用時，OpenClaw 會在該次操作中停用 Codex app-server 原生程式碼模式、使用者 MCP 伺服器，以及由應用程式支援的外掛執行（這些項目從閘道主機的 app-server 程序執行，而非 OpenClaw 沙箱後端），除非沙箱工具原則公開所需工具，且你選擇啟用實驗性的沙箱執行伺服器路徑。此時，Shell 存取會透過 OpenClaw 沙箱後端工具路由，例如 `sandbox_exec` 與 `sandbox_process`。請勿將主機 Docker 通訊端掛載至代理程式沙箱容器或自訂 Codex 沙箱。完整行為請參閱 [Codex Harness](/zh-TW/plugins/codex-harness)。

在啟用 Docker 沙箱模式的 Ubuntu／AppArmor 主機上，Codex app-server 的 `workspace-write` Shell 執行需要沙箱容器內具備非特權使用者命名空間；若服務使用者無法建立該命名空間，可能會在 Shell 啟動前失敗。當 Docker 沙箱的對外連線停用（`network: "none"`，預設值）時，也需要非特權網路命名空間。常見症狀包括：`bwrap: setting up uid map: Permission denied` 與 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`。請執行 `openclaw doctor`；若回報 Codex bwrap 命名空間探測失敗，建議使用允許 OpenClaw 服務程序建立所需命名空間的 AppArmor 設定檔。`kernel.apparmor_restrict_unprivileged_userns=0` 是會影響整台主機且具有安全性取捨的備援方案；僅在該主機的安全態勢可接受時使用。
</Warning>

### 沙箱瀏覽器

- 當瀏覽器工具需要沙箱瀏覽器時，它會自動啟動（確保可連線至 CDP）。可透過 `agents.defaults.sandbox.browser.autoStart`（預設為 `true`）與 `autoStartTimeoutMs`（預設為 12 秒）設定。
- 沙箱瀏覽器容器使用專用 Docker 網路（`openclaw-sandbox-browser`），而非全域 `bridge` 網路。可透過 `agents.defaults.sandbox.browser.network` 設定。
- `agents.defaults.sandbox.browser.cdpSourceRange` 透過 CIDR 允許清單限制容器邊界的 CDP 傳入連線（例如 `172.21.0.1/32`）。
- noVNC 觀察者存取預設受密碼保護；OpenClaw 會產生短效權杖 URL，用來提供本機啟動頁面，並開啟 noVNC，密碼位於 URL 片段中（不在查詢字串或標頭記錄中）。
- `agents.defaults.sandbox.browser.allowHostControl`（預設為 `false`）允許使用沙箱的工作階段明確以主機瀏覽器為目標。
- 選用的允許清單會管控 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

## SSH 後端

使用 `backend: "ssh"`，可在任何能透過 SSH 存取的機器上，將 `exec`、檔案工具與媒體讀取作業置於沙箱中。

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

- **生命週期**：OpenClaw 會在 `sandbox.ssh.workspaceRoot` 下建立每個範圍各自的遠端根目錄。建立或重建後首次使用時，它會從本機工作區將內容植入該遠端工作區一次。此後，`exec`、`read`、`write`、`edit`、`apply_patch`、提示詞媒體讀取，以及傳入媒體暫存作業，都會透過 SSH 直接在遠端工作區上執行。OpenClaw 不會自動將遠端變更同步回本機工作區。
- **驗證資料**：`identityFile`／`certificateFile`／`knownHostsFile` 參照現有的本機檔案。`identityData`／`certificateData`／`knownHostsData` 接受行內字串或 SecretRefs，透過一般的密鑰執行階段快照解析，寫入模式為 `0600` 的暫存檔案，並在 SSH 工作階段結束時刪除。若同一項目同時設定 `*File` 與 `*Data` 變體，該工作階段會以 `*Data` 為準。
- **遠端為準的影響**：初始植入後，遠端 SSH 工作區會成為真正的沙箱狀態。植入步驟完成後，在 OpenClaw 外部對主機本機所做的編輯不會顯示於遠端，直到重建沙箱為止。`openclaw sandbox recreate` 會刪除每個範圍各自的遠端根目錄，並在下次使用時再次從本機植入內容。此後端不支援瀏覽器沙箱，且 `sandbox.docker.*` 設定不適用於此後端。

## OpenShell 後端

使用 `backend: "openshell"`，可在 OpenShell 管理的遠端環境中將工具置於沙箱內。OpenShell 會重複使用與一般 SSH 後端相同的 SSH 傳輸和遠端檔案系統橋接，並加入 OpenShell 生命週期（`sandbox create/get/delete/ssh-config`）以及選用的 `mirror` 工作區同步模式。

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
          mode: "remote", // 鏡像 | 遠端
        },
      },
    },
  },
}
```

`mode: "mirror"`（預設）會將本機工作區維持為標準來源：OpenClaw 會在 `exec` 之前將本機內容同步至沙箱，並在之後同步回來。`mode: "remote"` 會從本機對遠端工作區進行一次初始植入，接著直接針對遠端工作區執行 `exec`/`read`/`write`/`edit`/`apply_patch`，且不會同步回來；初始植入後的本機編輯在你執行 `openclaw sandbox recreate` 前都不會反映出來。在 `scope: "agent"` 或 `scope: "shared"` 下，該遠端工作區會在相同範圍內共用。目前限制：尚不支援沙箱瀏覽器，且 `sandbox.docker.binds` 不適用於此後端。

`openclaw sandbox list`/`recreate`/清理全都以處理 Docker 執行環境的相同方式處理 OpenShell 執行環境；清理邏輯可辨識後端。

如需完整的先決條件、設定參考、工作區模式比較和生命週期詳細資訊，請參閱 [OpenShell](/zh-TW/gateway/openshell)。

## 工作區存取權限

`agents.defaults.sandbox.workspaceAccess` 控制沙箱可看見的內容：

| 值            | 行為                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none`（預設） | 工具會看見 `~/.openclaw/sandboxes` 下的隔離沙箱工作區。                    |
| `ro`             | 將代理程式工作區以唯讀方式掛載於 `/agent`（停用 `write`/`edit`/`apply_patch`）。 |
| `rw`             | 將代理程式工作區以讀寫方式掛載於 `/workspace`。                                    |

使用 OpenShell 後端時，`mirror` 模式仍會在每次 exec 執行之間以本機工作區作為標準來源；`remote` 模式則會在初始植入後以遠端 OpenShell 工作區作為標準來源，而 `workspaceAccess: "ro"`/`"none"` 仍會以相同方式限制寫入行為。

傳入媒體會複製到目前使用中的沙箱工作區（`media/inbound/*`）。

<Note>
**Skills**：`read` 工具以沙箱根目錄為基準。使用 `workspaceAccess: "none"` 時，OpenClaw 會將符合條件的 Skills 鏡像到沙箱工作區（`.../skills`），以便讀取。使用 `"rw"` 時，可從 `/workspace/skills` 讀取工作區 Skills，而符合條件的受管理、隨附或外掛 Skills 則會實體化至產生的唯讀路徑 `/workspace/.openclaw/sandbox-skills/skills`。
</Note>

## 一個代理程式使用多個資料夾

當一個沙箱化代理程式需要存取主要工作區以外的資料夾時，請使用 Docker 繫結掛載。每個項目會將主機資料夾對應至容器路徑，並明確指定存取模式：

```text
host-directory:container-directory:ro
host-directory:container-directory:rw
```

- `ro` 會使掛載的資料夾在沙箱內成為唯讀。
- `rw` 允許沙箱化的工具和程序變更主機資料夾。
- 容器路徑是代理程式使用的路徑。主機路徑不會自動公開。

此範例為 `research` 代理程式提供可寫入的主要工作區、位於 `/reference` 的唯讀參考資料，以及位於 `/drafts` 的獨立可寫入輸出資料夾：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        scope: "agent",
      },
    },
    list: [
      {
        id: "research",
        workspace: "/srv/openclaw/research-workspace",
        sandbox: {
          workspaceAccess: "rw",
          docker: {
            binds: ["/srv/shared/reference:/reference:ro", "/srv/shared/drafts:/drafts:rw"],
            // 必須設定，因為這些來源位於代理程式工作區之外。
            dangerouslyAllowExternalBindSources: true,
          },
        },
      },
    ],
  },
}
```

`workspaceAccess` 與繫結模式彼此獨立：

| 設定                          | 控制內容                                                                    |
| -------------------------------- | --------------------------------------------------------------------------- |
| `workspaceAccess: "none"`        | 使用隔離的沙箱工作區；不公開代理程式工作區。    |
| `workspaceAccess: "ro"`          | 將代理程式工作區以唯讀方式掛載於 `/agent`。                           |
| `workspaceAccess: "rw"`          | 將代理程式工作區以讀寫方式掛載於 `/workspace`。                      |
| `docker.binds` 項目的 `:ro`/`:rw` | 僅控制該額外主機資料夾在其所設定容器路徑上的存取權限。 |

變更 `workspaceAccess` 不會將額外繫結從 `ro` 改為 `rw`，反之亦然。全域與各代理程式的 `docker.binds` 會合併。每個代理程式的繫結請使用 `scope: "agent"` 或 `"session"`；`scope: "shared"` 會忽略所有各代理程式的 Docker 覆寫，並僅使用全域繫結。

繫結掛載是受支援的多資料夾界線，因為 Docker 會透過掛載隔離來建立容器的檔案系統視圖，且 `ro`/`rw` 模式會套用至沙箱中的每個程序。此界線涵蓋 `exec`、檔案系統工具、子程序與程式庫，無須在每個 OpenClaw 程式碼路徑中重複進行路徑授權檢查。如果允許的 shell 或相依套件可直接存取檔案，主機端路徑允許清單就無法提供同樣完整的界線。

選擇啟用的 `dangerouslyAllowExternalBindSources` 僅允許使用工作區根目錄以外的來源。它不會停用 OpenClaw 對遭封鎖之系統路徑、認證資訊、Docker 通訊端、符號連結父路徑或保留目標的檢查。請優先選用範圍最小的資料夾，除非必須寫入，否則請使用 `ro`，並在變更掛載後重新建立沙箱：

```bash
openclaw sandbox recreate --agent research
```

### 其他繫結行為

`agents.defaults.sandbox.docker.binds` 設定全域掛載。格式為相同的 `host:container:mode` 形式（例如 `"/home/user/source:/source:rw"`）。

`agents.defaults.sandbox.browser.binds` 僅將額外的主機目錄掛載至**沙箱瀏覽器**容器。設定此項目時（包括 `[]`），它會取代瀏覽器容器的 `docker.binds`；省略時，瀏覽器容器會回退使用 `docker.binds`。

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

- 繫結會繞過沙箱檔案系統：它們會依你設定的模式（`:ro` 或 `:rw`）公開主機路徑。
- OpenClaw 預設會封鎖危險的繫結來源：系統路徑（`/etc`、`/proc`、`/sys`、`/dev`、`/root`、`/boot`）、Docker 通訊端目錄（`/run`、`/var/run` 及其 `docker.sock` 變體），以及常見的家目錄認證資訊根目錄（`~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm`、`~/.ssh`）。
- 驗證會先正規化來源路徑，然後透過最深層且現存的祖先目錄再次解析，再重新檢查遭封鎖的路徑與允許的根目錄。因此，即使最終葉節點尚不存在，透過符號連結父路徑逸出的嘗試仍會以封閉方式失敗（例如，如果 `run-link` 指向該處，`/workspace/run-link/new-file` 仍會解析為 `/var/run/...`）。
- 遮蔽保留容器掛載點（`/workspace`、`/agent`）的繫結目標，預設也會遭到封鎖；可使用 `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` 覆寫。
- 工作區／代理程式工作區允許清單根目錄以外的繫結來源，預設會遭到封鎖；可使用 `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` 覆寫。允許的根目錄會以相同方式標準化，因此，符號連結解析前看似位於允許清單內的路徑，若解析後位於允許根目錄之外，仍會遭到拒絕。
- 敏感掛載（祕密、SSH 金鑰、服務認證資訊）除非絕對必要，否則應使用 `:ro`。
- 如果你只需要工作區的讀取權限，請搭配 `workspaceAccess: "ro"` 使用；繫結模式仍彼此獨立。
- 如需瞭解繫結如何與工具原則及提升權限的 exec 互動，請參閱[沙箱、工具原則與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)。

</Warning>

## 映像檔與設定

預設 Docker 映像檔：`openclaw-sandbox:bookworm-slim`

<Note>
**原始碼簽出與 npm 安裝的比較**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 輔助指令碼僅能在[原始碼簽出](https://github.com/openclaw/openclaw)中執行時使用。npm 套件不包含這些指令碼。

如果你透過 `npm install -g openclaw` 安裝 OpenClaw，請改用下方顯示的內嵌 `docker build` 命令。
</Note>

<Steps>
  <Step title="建置預設映像檔">
    從原始碼簽出建置：

    ```bash
    scripts/sandbox-setup.sh
    ```

    從 npm 安裝建置（不需要原始碼簽出）：

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

    預設映像檔**不**包含 Node。如果某個 Skill 需要 Node（或其他執行環境），請建置自訂映像檔，或透過 `sandbox.docker.setupCommand` 安裝（需要網路對外連線、可寫入的根目錄和 root 使用者）。

    當 `openclaw-sandbox:bookworm-slim` 缺失時，OpenClaw 不會默默改用一般的 `debian:bookworm-slim`。以預設映像檔為目標的沙箱執行會快速失敗，並顯示建置指示，直到你完成建置為止，因為隨附映像檔包含沙箱寫入／編輯輔助工具所需的 `python3`。

  </Step>
  <Step title="選用：建置通用映像檔">
    如需包含常用工具、功能更完整的沙箱映像檔（例如 `curl`、`jq`、Node 24、pnpm、`python3` 和 `git`）：

    從原始碼簽出建置：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    從 npm 安裝建置時，請先建置預設映像檔（請參閱上方），接著使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common)，在其上建置通用映像檔。

    接著將 `agents.defaults.sandbox.docker.image` 設為 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="選用：建置沙箱瀏覽器映像檔">
    從原始碼簽出建置：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    從 npm 安裝建置時，請使用儲存庫中的 [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) 進行建置。

  </Step>
</Steps>

Docker 沙箱容器預設在**無網路**環境下執行。可使用 `agents.defaults.sandbox.docker.network` 覆寫。

<AccordionGroup>
  <Accordion title="沙箱瀏覽器 Chromium 預設值">
    隨附的沙箱瀏覽器映像檔會為容器化工作負載套用保守的 Chromium 啟動旗標：

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
    - `--headless=new`（當 `browser.headless` 啟用時）。
    - `--no-sandbox --disable-setuid-sandbox`（當 `browser.noSandbox` 啟用時）。
    - 預設為 `--disable-3d-apis`、`--disable-gpu`、`--disable-software-rasterizer`；這些圖形強化旗標有助於不支援 GPU 的容器。如果你的工作負載需要 WebGL 或其他 3D 功能，請設定 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - 預設為 `--disable-extensions`；依賴擴充功能的流程請設定 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`。
    - 預設為 `--renderer-process-limit=2`；由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 會保留 Chromium 的預設值。

    如果需要不同的執行階段設定檔，請使用自訂瀏覽器映像，並提供你自己的進入點。對於本機（非容器）Chromium 設定檔，請使用 `browser.extraArgs` 附加其他啟動旗標。

  </Accordion>
  <Accordion title="網路安全性預設值">
    - `network: "host"` 已封鎖。
    - `network: "container:<id>"` 預設已封鎖（存在加入命名空間而繞過限制的風險）。
    - 緊急覆寫：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安裝與容器化閘道位於此處：[Docker](/zh-TW/install/docker)

對於 Docker 閘道部署，`scripts/docker/setup.sh` 可以啟動沙箱設定。設定 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）以啟用此路徑。使用 `OPENCLAW_DOCKER_SOCKET` 覆寫通訊端位置。完整設定與環境變數參考：[Docker](/zh-TW/install/docker#agent-sandbox)。

## setupCommand（一次性容器設定）

`setupCommand` 會在沙箱容器建立後執行 **一次**（並非每次執行時都執行）。它會透過 `sh -lc` 在容器內執行。

路徑：

- 全域：`agents.defaults.sandbox.docker.setupCommand`
- 每個代理程式：`agents.entries.*.sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="常見陷阱">
    - 預設的 `docker.network` 是 `"none"`（無法向外連線），因此套件安裝將會失敗。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且僅供緊急使用。
    - `readOnlyRoot: true` 會阻止寫入；請設定 `readOnlyRoot: false` 或建置自訂映像。
    - 若要安裝套件，`user` 必須是 root（省略 `user` 或設定 `user: "0:0"`）。
    - 沙箱執行環境**不會**繼承主機的 `process.env`。請使用 `agents.defaults.sandbox.docker.env`（或自訂映像）提供 Skill API 金鑰。
    - `agents.defaults.sandbox.docker.env` 中的值會以明確的 Docker 容器環境變數傳遞。任何具有 Docker 常駐程式存取權限的人，都能使用 `docker inspect` 等 Docker 中繼資料命令檢視這些值。如果無法接受這類中繼資料暴露，請使用自訂映像、掛載的祕密檔案或其他祕密傳遞路徑。

  </Accordion>
</AccordionGroup>

## 工具政策與逃生機制

在套用沙箱規則之前，工具允許／拒絕政策仍然有效。如果某項工具遭到全域或每個代理程式拒絕，沙箱化並不會使其恢復可用。

`tools.elevated` 是明確的逃生機制，會在沙箱外執行 `exec`（預設為 `gateway`；當執行目標為 `node` 時則為 `node`）。`/exec` 指令僅適用於已授權的傳送者，並會在每個工作階段中持續有效；若要強制停用 `exec`，請使用工具政策拒絕（請參閱[沙箱、工具政策與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)）。

偵錯：

- `openclaw sandbox list` 會顯示沙箱容器、狀態、映像相符情況、存續時間、閒置時間，以及相關聯的工作階段／代理程式。
- `openclaw sandbox explain [--session <key>] [--agent <id>]` 會檢查實際生效的沙箱模式、主機工作區、執行階段工作目錄、Docker 掛載、工具政策，以及修正設定鍵。其 `workspaceRoot` 欄位仍為已設定的沙箱根目錄；`effectiveHostWorkspaceRoot` 則顯示作用中工作區的實際位置。
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` 會移除容器／環境，以便在下次使用時依照目前設定重新建立。
- 若要瞭解“為什麼這會被封鎖？”的思考模型，請參閱[沙箱、工具政策與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)。

## 多代理程式覆寫

每個代理程式都可以覆寫沙箱與工具：`agents.entries.*.sandbox` 和 `agents.entries.*.tools`（以及用於沙箱工具政策的 `agents.entries.*.tools.sandbox.tools`）。如需瞭解優先順序，請參閱[多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

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

- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每個代理程式的覆寫與優先順序
- [OpenShell](/zh-TW/gateway/openshell) -- 受管理的沙箱後端設定、工作區模式與設定參考
- [沙箱設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙箱、工具政策與提升權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) -- 偵錯“為什麼這會被封鎖？”
- [安全性](/zh-TW/gateway/security)
