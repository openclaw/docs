---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙盒機制的運作方式：模式、範圍、工作區存取權與映像檔
title: 沙箱化
x-i18n:
    generated_at: "2026-05-02T02:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在**沙箱後端內執行工具**，以降低影響範圍。這是**選用**功能，並由設定控制（`agents.defaults.sandbox` 或 `agents.list[].sandbox`）。如果沙箱關閉，工具會在主機上執行。Gateway 會留在主機上；啟用時，工具執行會在隔離沙箱中執行。

<Note>
這不是完美的安全邊界，但當模型做出不明智的操作時，它能實質限制檔案系統與程序存取。
</Note>

## 會被沙箱化的項目

- 工具執行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 選用的沙箱化瀏覽器（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="沙箱化瀏覽器詳細資訊">
    - 預設情況下，當瀏覽器工具需要時，沙箱瀏覽器會自動啟動（確保 CDP 可連線）。透過 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 設定。
    - 預設情況下，沙箱瀏覽器容器會使用專用 Docker 網路（`openclaw-sandbox-browser`），而不是全域 `bridge` 網路。使用 `agents.defaults.sandbox.browser.network` 設定。
    - 選用的 `agents.defaults.sandbox.browser.cdpSourceRange` 會透過 CIDR 允許清單限制容器邊界的 CDP 輸入（例如 `172.21.0.1/32`）。
    - noVNC 觀察者存取預設受密碼保護；OpenClaw 會發出短效權杖 URL，提供本機啟動頁面，並以 URL 片段中的密碼開啟 noVNC（不是查詢參數或標頭記錄）。
    - `agents.defaults.sandbox.browser.allowHostControl` 可讓沙箱化工作階段明確指定主機瀏覽器。
    - 選用允許清單會管控 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

  </Accordion>
</AccordionGroup>

不會被沙箱化：

- Gateway 程序本身。
- 任何明確允許在沙箱外執行的工具（例如 `tools.elevated`）。
  - **提升權限的 exec 會繞過沙箱化，並使用設定的逃逸路徑（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。**
  - 如果沙箱關閉，`tools.elevated` 不會改變執行方式（已經在主機上）。請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何時**使用沙箱化：

<Tabs>
  <Tab title="off">
    不使用沙箱化。
  </Tab>
  <Tab title="non-main">
    只沙箱化**非主要**工作階段（如果你想讓一般聊天在主機上執行，這是預設）。

    `"non-main"` 是根據 `session.mainKey`（預設為 `"main"`），而不是代理程式 ID。群組/頻道工作階段使用自己的鍵，因此會被視為非主要並進行沙箱化。

  </Tab>
  <Tab title="all">
    每個工作階段都在沙箱中執行。
  </Tab>
</Tabs>

## 範圍

`agents.defaults.sandbox.scope` 控制**建立多少容器**：

- `"agent"`（預設）：每個代理程式一個容器。
- `"session"`：每個工作階段一個容器。
- `"shared"`：所有沙箱化工作階段共用一個容器。

## 後端

`agents.defaults.sandbox.backend` 控制**哪個執行環境**提供沙箱：

- `"docker"`（啟用沙箱化時的預設）：本機 Docker 支援的沙箱執行環境。
- `"ssh"`：通用 SSH 支援的遠端沙箱執行環境。
- `"openshell"`：OpenShell 支援的沙箱執行環境。

SSH 專屬設定位於 `agents.defaults.sandbox.ssh`。OpenShell 專屬設定位於 `plugins.entries.openshell.config`。

### 選擇後端

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **執行位置**        | 本機容器                         | 任何可透過 SSH 存取的主機      | OpenShell 管理的沙箱                                |
| **設定**            | `scripts/sandbox-setup.sh`       | SSH 金鑰 + 目標主機            | 已啟用 OpenShell plugin                             |
| **工作區模型**      | 繫結掛載或複製                   | 遠端標準（播種一次）           | `mirror` 或 `remote`                                |
| **網路控制**        | `docker.network`（預設：無）     | 取決於遠端主機                 | 取決於 OpenShell                                    |
| **瀏覽器沙箱**      | 支援                             | 不支援                         | 尚不支援                                            |
| **繫結掛載**        | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適合**          | 本機開發、完整隔離               | 卸載到遠端機器                 | 具選用雙向同步的受管理遠端沙箱                      |

### Docker 後端

沙箱化預設為關閉。如果你啟用沙箱化且未選擇後端，OpenClaw 會使用 Docker 後端。它會透過 Docker daemon socket（`/var/run/docker.sock`）在本機執行工具與沙箱瀏覽器。沙箱容器隔離由 Docker 命名空間決定。

若要將主機 GPU 暴露給 Docker 沙箱，請設定 `agents.defaults.sandbox.docker.gpus` 或每個代理程式的 `agents.list[].sandbox.docker.gpus` 覆寫值。該值會作為獨立引數傳遞給 Docker 的 `--gpus` 旗標，例如 `"all"` 或 `"device=GPU-uuid"`，並需要相容的主機執行環境，例如 NVIDIA Container Toolkit。

<Warning>
**Docker-out-of-Docker（DooD）限制**

如果你將 OpenClaw Gateway 本身部署為 Docker 容器，它會使用主機的 Docker socket（DooD）協調同層沙箱容器。這會帶來特定的路徑對應限制：

- **設定需要主機路徑**：`openclaw.json` 的 `workspace` 設定必須包含**主機的絕對路徑**（例如 `/home/user/.openclaw/workspaces`），而不是 Gateway 容器內部路徑。當 OpenClaw 要求 Docker daemon 產生沙箱時，daemon 會相對於主機作業系統命名空間評估路徑，而不是 Gateway 命名空間。
- **FS 橋接一致性（相同的 volume map）**：OpenClaw Gateway 原生程序也會將 Heartbeat 和橋接檔案寫入 `workspace` 目錄。因為 Gateway 會在自己的容器化環境中評估完全相同的字串（主機路徑），Gateway 部署必須包含相同的 volume map，以原生方式連結主機命名空間（`-v /home/user/.openclaw:/home/user/.openclaw`）。

如果你在內部對應路徑而沒有絕對主機一致性，OpenClaw 原生會在嘗試於容器環境內寫入 Heartbeat 時拋出 `EACCES` 權限錯誤，因為完整限定路徑字串在原生環境中不存在。
</Warning>

### SSH 後端

當你希望 OpenClaw 在任意可透過 SSH 存取的機器上沙箱化 `exec`、檔案工具和媒體讀取時，請使用 `backend: "ssh"`。

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

<AccordionGroup>
  <Accordion title="運作方式">
    - OpenClaw 會在 `sandbox.ssh.workspaceRoot` 下建立每個範圍各自的遠端根目錄。
    - 建立或重新建立後首次使用時，OpenClaw 會從本機工作區播種一次到該遠端工作區。
    - 之後，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒體讀取和傳入媒體暫存都會透過 SSH 直接針對遠端工作區執行。
    - OpenClaw 不會自動將遠端變更同步回本機工作區。

  </Accordion>
  <Accordion title="驗證材料">
    - `identityFile`、`certificateFile`、`knownHostsFile`：使用現有本機檔案，並透過 OpenSSH 設定傳遞。
    - `identityData`、`certificateData`、`knownHostsData`：使用內嵌字串或 SecretRefs。OpenClaw 會透過一般 secrets 執行環境快照解析它們，將它們寫入權限為 `0600` 的暫存檔，並在 SSH 工作階段結束時刪除。
    - 如果同一項目同時設定 `*File` 和 `*Data`，該 SSH 工作階段會以 `*Data` 優先。

  </Accordion>
  <Accordion title="遠端標準的後果">
    這是**遠端標準**模型。初始播種後，遠端 SSH 工作區會成為真正的沙箱狀態。

    - 播種步驟後在 OpenClaw 外部進行的主機本機編輯，在重新建立沙箱之前不會於遠端可見。
    - `openclaw sandbox recreate` 會刪除每個範圍的遠端根目錄，並在下次使用時再次從本機播種。
    - SSH 後端不支援瀏覽器沙箱化。
    - `sandbox.docker.*` 設定不適用於 SSH 後端。

  </Accordion>
</AccordionGroup>

### OpenShell 後端

當你希望 OpenClaw 在 OpenShell 管理的遠端環境中沙箱化工具時，請使用 `backend: "openshell"`。完整設定指南、設定參考與工作區模式比較，請參閱專屬的 [OpenShell 頁面](/zh-TW/gateway/openshell)。

OpenShell 重用與通用 SSH 後端相同的核心 SSH 傳輸和遠端檔案系統橋接，並加入 OpenShell 專屬生命週期（`sandbox create/get/delete`、`sandbox ssh-config`）以及選用的 `mirror` 工作區模式。

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
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell 模式：

- `mirror`（預設）：本機工作區維持標準狀態。OpenClaw 會在 exec 前將本機檔案同步到 OpenShell，並在 exec 後將遠端工作區同步回來。
- `remote`：沙箱建立後，OpenShell 工作區即為標準狀態。OpenClaw 會從本機工作區播種一次到遠端工作區，之後檔案工具和 exec 會直接針對遠端沙箱執行，而不會同步變更回來。

<AccordionGroup>
  <Accordion title="遠端傳輸詳細資訊">
    - OpenClaw 會透過 `openshell sandbox ssh-config <name>` 向 OpenShell 要求沙箱專屬 SSH 設定。
    - 核心會將該 SSH 設定寫入暫存檔，開啟 SSH 工作階段，並重用 `backend: "ssh"` 使用的同一個遠端檔案系統橋接。
    - 僅在 `mirror` 模式下，生命週期有所不同：exec 前先將本機同步到遠端，然後在 exec 後同步回來。

  </Accordion>
  <Accordion title="目前的 OpenShell 限制">
    - 尚不支援沙箱瀏覽器
    - OpenShell 後端不支援 `sandbox.docker.binds`
    - `sandbox.docker.*` 下的 Docker 專屬執行環境旋鈕仍只適用於 Docker 後端

  </Accordion>
</AccordionGroup>

#### 工作區模式

OpenShell 有兩種工作區模型。這是在實務上最重要的部分。

<Tabs>
  <Tab title="mirror（本機標準）">
    當你希望**本機工作區維持標準狀態**時，請使用 `plugins.entries.openshell.config.mode: "mirror"`。

    行為：

    - 在 `exec` 之前，OpenClaw 會將本機工作區同步到 OpenShell 沙箱。
    - 在 `exec` 之後，OpenClaw 會將遠端工作區同步回本機工作區。
    - 檔案工具仍會透過沙箱橋接運作，但本機工作區在回合之間仍是事實來源。

    使用時機：

    - 你在 OpenClaw 之外於本機編輯檔案，並希望這些變更自動出現在沙盒中
    - 你希望 OpenShell 沙盒的行為盡可能接近 Docker 後端
    - 你希望每次 exec 回合後，主機工作區能反映沙盒寫入

    取捨：exec 前後會有額外同步成本。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    當你希望 **OpenShell 工作區成為權威來源**時，使用 `plugins.entries.openshell.config.mode: "remote"`。

    行為：

    - 沙盒首次建立時，OpenClaw 會從本機工作區一次性植入遠端工作區。
    - 之後，`exec`、`read`、`write`、`edit` 和 `apply_patch` 會直接針對遠端 OpenShell 工作區操作。
    - OpenClaw 不會在 exec 後將遠端變更同步回本機工作區。
    - 提示期間的媒體讀取仍可運作，因為檔案與媒體工具會透過沙盒橋接讀取，而不是假設存在本機主機路徑。
    - 傳輸方式是 SSH 進入由 `openshell sandbox ssh-config` 傳回的 OpenShell 沙盒。

    重要影響：

    - 如果你在植入步驟後於 OpenClaw 之外的主機上編輯檔案，遠端沙盒**不會**自動看到那些變更。
    - 如果沙盒被重新建立，遠端工作區會再次從本機工作區植入。
    - 使用 `scope: "agent"` 或 `scope: "shared"` 時，該遠端工作區會在相同範圍內共享。

    適用情境：

    - 沙盒應主要存在於遠端 OpenShell 端
    - 你希望降低每回合的同步開銷
    - 你不希望主機本機編輯默默覆寫遠端沙盒狀態

  </Tab>
</Tabs>

如果你把沙盒視為暫時的執行環境，請選擇 `mirror`。如果你把沙盒視為真正的工作區，請選擇 `remote`。

#### OpenShell 生命週期

OpenShell 沙盒仍透過一般沙盒生命週期管理：

- `openclaw sandbox list` 會顯示 OpenShell 執行環境以及 Docker 執行環境
- `openclaw sandbox recreate` 會刪除目前執行環境，並讓 OpenClaw 在下次使用時重新建立它
- 修剪邏輯也會感知後端

對於 `remote` 模式，重新建立特別重要：

- 重新建立會刪除該範圍的權威遠端工作區
- 下次使用時，會從本機工作區植入全新的遠端工作區

對於 `mirror` 模式，重新建立主要是重設遠端執行環境，因為本機工作區無論如何仍是權威來源。

## 工作區存取

`agents.defaults.sandbox.workspaceAccess` 控制**沙盒能看到什麼**：

<Tabs>
  <Tab title="none (default)">
    工具會看到 `~/.openclaw/sandboxes` 下的沙盒工作區。
  </Tab>
  <Tab title="ro">
    將代理工作區以唯讀方式掛載到 `/agent`（停用 `write`/`edit`/`apply_patch`）。
  </Tab>
  <Tab title="rw">
    將代理工作區以讀寫方式掛載到 `/workspace`。
  </Tab>
</Tabs>

使用 OpenShell 後端時：

- `mirror` 模式仍在 exec 回合之間使用本機工作區作為權威來源
- `remote` 模式在初始植入後，使用遠端 OpenShell 工作區作為權威來源
- `workspaceAccess: "ro"` 和 `"none"` 仍會以相同方式限制寫入行為

傳入媒體會複製到作用中的沙盒工作區（`media/inbound/*`）。

<Note>
**Skills 注意事項：**`read` 工具以沙盒根目錄為基準。使用 `workspaceAccess: "none"` 時，OpenClaw 會將符合資格的 Skills 鏡像到沙盒工作區（`.../skills`），使其可被讀取。使用 `"rw"` 時，可從 `/workspace/skills` 讀取工作區 Skills。
</Note>

## 自訂繫結掛載

`agents.defaults.sandbox.docker.binds` 會將額外主機目錄掛載到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全域與每代理繫結會**合併**（不會取代）。在 `scope: "shared"` 下，會忽略每代理繫結。

`agents.defaults.sandbox.browser.binds` 只會將額外主機目錄掛載到**沙盒瀏覽器**容器中。

- 設定時（包括 `[]`），它會取代瀏覽器容器的 `agents.defaults.sandbox.docker.binds`。
- 省略時，瀏覽器容器會回退使用 `agents.defaults.sandbox.docker.binds`（向後相容）。

範例（唯讀原始碼 + 額外資料目錄）：

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

- 繫結會繞過沙盒檔案系統：它們會以你設定的模式（`:ro` 或 `:rw`）暴露主機路徑。
- OpenClaw 會封鎖危險的繫結來源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`，以及會暴露它們的父掛載）。
- OpenClaw 也會封鎖常見的家目錄憑證根目錄，例如 `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm` 和 `~/.ssh`。
- 繫結驗證不只是字串比對。OpenClaw 會正規化來源路徑，然後透過最深的現有祖先再次解析，再重新檢查封鎖路徑與允許的根目錄。
- 這表示即使最終葉節點尚不存在，符號連結父層逸出仍會封閉失敗。範例：如果 `run-link` 指向該處，`/workspace/run-link/new-file` 仍會解析為 `/var/run/...`。
- 允許的來源根目錄也會以相同方式正規化，因此在符號連結解析前看似位於允許清單內的路徑，仍會因 `outside allowed roots` 被拒絕。
- 敏感掛載（密碼、SSH 金鑰、服務憑證）除非絕對必要，否則應使用 `:ro`。
- 如果你只需要對工作區的讀取存取，請搭配 `workspaceAccess: "ro"`；繫結模式仍保持獨立。
- 請參閱 [沙盒與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)，了解繫結如何與工具政策和提升權限 exec 互動。

</Warning>

## 映像與設定

預設 Docker 映像：`openclaw-sandbox:bookworm-slim`

<Note>
**原始碼簽出與 npm 安裝**

`scripts/sandbox-setup.sh`、`scripts/sandbox-common-setup.sh` 和 `scripts/sandbox-browser-setup.sh` 輔助指令碼只有在從[原始碼簽出](https://github.com/openclaw/openclaw)執行時可用。它們不包含在 npm 套件中。

如果你透過 `npm install -g openclaw` 安裝 OpenClaw，請改用下方顯示的內嵌 `docker build` 命令。
</Note>

<Steps>
  <Step title="Build the default image">
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

    預設映像**不**包含 Node。如果某個 skill 需要 Node（或其他執行環境），請烘焙自訂映像，或透過 `sandbox.docker.setupCommand` 安裝（需要網路出口 + 可寫入根目錄 + root 使用者）。

    當缺少 `openclaw-sandbox:bookworm-slim` 時，OpenClaw 不會默默替換成普通的 `debian:bookworm-slim`。目標為預設映像的沙盒執行會快速失敗並顯示建置指示，直到你建置它為止，因為隨附映像包含沙盒寫入/編輯輔助工具所需的 `python3`。

  </Step>
  <Step title="Optional: build the common image">
    如需具備常見工具（例如 `curl`、`jq`、`nodejs`、`python3`、`git`）且功能更完整的沙盒映像：

    從原始碼簽出：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    從 npm 安裝時，請先建置預設映像（見上方），然後使用儲存庫中的 [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) 在其上建置 common 映像。

    然後將 `agents.defaults.sandbox.docker.image` 設為 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="Optional: build the sandbox browser image">
    從原始碼簽出：

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    從 npm 安裝時，請使用儲存庫中的 [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) 建置。

  </Step>
</Steps>

預設情況下，Docker 沙盒容器會以**無網路**執行。可用 `agents.defaults.sandbox.docker.network` 覆寫。

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    隨附的沙盒瀏覽器映像也會套用保守的 Chromium 啟動預設值，以支援容器化工作負載。目前的容器預設值包括：

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - 啟用 `noSandbox` 時使用 `--no-sandbox`。
    - 三個圖形強化旗標（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）是選用的，並且在容器缺少 GPU 支援時很有用。如果你的工作負載需要 WebGL 或其他 3D/瀏覽器功能，請設定 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - `--disable-extensions` 預設啟用；對於依賴擴充功能的流程，可使用 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 停用。
    - `--renderer-process-limit=2` 由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 會保留 Chromium 的預設值。

    如果你需要不同的執行環境設定檔，請使用自訂瀏覽器映像，並提供自己的進入點。對於本機（非容器）Chromium 設定檔，請使用 `browser.extraArgs` 附加額外啟動旗標。

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` 會被封鎖。
    - 預設會封鎖 `network: "container:<id>"`（命名空間加入繞過風險）。
    - 緊急覆寫：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安裝與容器化 Gateway 位於此處：[Docker](/zh-TW/install/docker)

對於 Docker Gateway 部署，`scripts/docker/setup.sh` 可以啟動沙盒設定。設定 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）以啟用該路徑。你可以用 `OPENCLAW_DOCKER_SOCKET` 覆寫 socket 位置。完整設定與環境參考：[Docker](/zh-TW/install/docker#agent-sandbox)。

## setupCommand（一次性容器設定）

`setupCommand` 會在沙盒容器建立後**執行一次**（不是每次執行都會執行）。它會透過 `sh -lc` 在容器內執行。

路徑：

- 全域：`agents.defaults.sandbox.docker.setupCommand`
- 每代理：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - 預設 `docker.network` 是 `"none"`（無出口），因此套件安裝會失敗。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且僅供緊急情況使用。
    - `readOnlyRoot: true` 會防止寫入；請設定 `readOnlyRoot: false` 或烘焙自訂映像。
    - `user` 必須是 root 才能安裝套件（省略 `user` 或設定 `user: "0:0"`）。
    - 沙盒 exec **不會**繼承主機 `process.env`。請使用 `agents.defaults.sandbox.docker.env`（或自訂映像）提供 skill API 金鑰。

  </Accordion>
</AccordionGroup>

## 工具政策與繞過機制

工具允許/拒絕政策仍會先於沙箱規則套用。如果某個工具在全域或每個代理程式層級被拒絕，沙箱不會讓它恢復可用。

`tools.elevated` 是明確的繞過機制，會在沙箱外執行 `exec`（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。`/exec` 指令只會套用於已授權的傳送者，並在每個工作階段中持續有效；若要強制停用 `exec`，請使用工具政策拒絕（請參閱 [沙箱與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)）。

偵錯：

- 使用 `openclaw sandbox explain` 檢查實際生效的沙箱模式、工具政策和修復用設定鍵。
- 如需「為什麼這被封鎖？」的思維模型，請參閱 [沙箱與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)。

保持嚴格鎖定。

## 多代理程式覆寫

每個代理程式都可以覆寫沙箱 + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（以及用於沙箱工具政策的 `agents.list[].tools.sandbox.tools`）。如需優先順序，請參閱 [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools)。

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

- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) — 每個代理程式覆寫與優先順序
- [OpenShell](/zh-TW/gateway/openshell) — 受管理的沙箱後端設定、工作區模式和設定參考
- [沙箱設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙箱與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) — 偵錯「為什麼這被封鎖？」
- [安全性](/zh-TW/gateway/security)
