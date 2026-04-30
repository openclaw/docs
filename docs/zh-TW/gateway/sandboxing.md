---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: OpenClaw 沙盒機制的運作方式：模式、範圍、工作區存取權與映像檔
title: 沙盒化
x-i18n:
    generated_at: "2026-04-30T03:09:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw 可以在**沙盒後端內執行工具**，以降低影響範圍。這是**選用**功能，並由設定控制（`agents.defaults.sandbox` 或 `agents.list[].sandbox`）。如果沙盒功能關閉，工具會在主機上執行。Gateway 會留在主機上；啟用時，工具執行會在隔離的沙盒中進行。

<Note>
這不是完美的安全邊界，但當模型做出不當操作時，它會實質限制檔案系統與程序存取。
</Note>

## 哪些項目會被沙盒化

- 工具執行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 選用的沙盒瀏覽器（`agents.defaults.sandbox.browser`）。

<AccordionGroup>
  <Accordion title="沙盒瀏覽器詳細資料">
    - 預設情況下，當瀏覽器工具需要時，沙盒瀏覽器會自動啟動（確保 CDP 可連線）。透過 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 設定。
    - 預設情況下，沙盒瀏覽器容器會使用專用 Docker 網路（`openclaw-sandbox-browser`），而不是全域 `bridge` 網路。透過 `agents.defaults.sandbox.browser.network` 設定。
    - 選用的 `agents.defaults.sandbox.browser.cdpSourceRange` 會使用 CIDR 允許清單限制容器邊界的 CDP 輸入流量（例如 `172.21.0.1/32`）。
    - noVNC 觀察者存取預設受密碼保護；OpenClaw 會發出短期有效的權杖 URL，提供本機啟動頁面，並在 URL 片段中以密碼開啟 noVNC（不會出現在查詢字串或標頭記錄中）。
    - `agents.defaults.sandbox.browser.allowHostControl` 可讓沙盒化工作階段明確指定主機瀏覽器為目標。
    - 選用允許清單會控管 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

  </Accordion>
</AccordionGroup>

不會被沙盒化：

- Gateway 程序本身。
- 任何明確允許在沙盒外執行的工具（例如 `tools.elevated`）。
  - **提升權限的 exec 會繞過沙盒功能，並使用設定的逃逸路徑（預設為 `gateway`，或當 exec 目標為 `node` 時使用 `node`）。**
  - 如果沙盒功能關閉，`tools.elevated` 不會改變執行方式（已在主機上）。請參閱[提升權限模式](/zh-TW/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制沙盒功能**何時**使用：

<Tabs>
  <Tab title="off">
    不使用沙盒功能。
  </Tab>
  <Tab title="non-main">
    只對**非 main** 工作階段使用沙盒（如果你希望一般聊天在主機上執行，這是預設值）。

    `"non-main"` 是根據 `session.mainKey`（預設 `"main"`）判定，而不是代理 ID。群組/頻道工作階段使用自己的鍵，因此會被視為非 main 並被沙盒化。

  </Tab>
  <Tab title="all">
    每個工作階段都在沙盒中執行。
  </Tab>
</Tabs>

## 範圍

`agents.defaults.sandbox.scope` 控制會建立**多少容器**：

- `"agent"`（預設）：每個代理一個容器。
- `"session"`：每個工作階段一個容器。
- `"shared"`：所有沙盒化工作階段共用一個容器。

## 後端

`agents.defaults.sandbox.backend` 控制由**哪個執行階段**提供沙盒：

- `"docker"`（啟用沙盒時的預設值）：本機 Docker 支援的沙盒執行階段。
- `"ssh"`：通用 SSH 支援的遠端沙盒執行階段。
- `"openshell"`：OpenShell 支援的沙盒執行階段。

SSH 專用設定位於 `agents.defaults.sandbox.ssh` 下。OpenShell 專用設定位於 `plugins.entries.openshell.config` 下。

### 選擇後端

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **執行位置**   | 本機容器                  | 任何可透過 SSH 存取的主機        | OpenShell 管理的沙盒                           |
| **設定**           | `scripts/sandbox-setup.sh`       | SSH 金鑰 + 目標主機          | 已啟用 OpenShell Plugin                            |
| **工作區模型** | 繫結掛載或複製               | 遠端為準（播種一次）   | `mirror` 或 `remote`                                |
| **網路控制** | `docker.network`（預設：無） | 取決於遠端主機         | 取決於 OpenShell                                |
| **瀏覽器沙盒** | 支援                        | 不支援                  | 尚未支援                                   |
| **繫結掛載**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **最適合**        | 本機開發、完整隔離        | 卸載到遠端機器 | 具選用雙向同步的受管理遠端沙盒 |

### Docker 後端

沙盒功能預設關閉。如果你啟用沙盒功能但未選擇後端，OpenClaw 會使用 Docker 後端。它會透過 Docker daemon socket（`/var/run/docker.sock`）在本機執行工具與沙盒瀏覽器。沙盒容器隔離由 Docker namespace 決定。

若要將主機 GPU 暴露給 Docker 沙盒，請設定 `agents.defaults.sandbox.docker.gpus`，或設定每個代理的 `agents.list[].sandbox.docker.gpus` 覆寫值。該值會作為獨立引數傳遞給 Docker 的 `--gpus` 旗標，例如 `"all"` 或 `"device=GPU-uuid"`，並需要相容的主機執行階段，例如 NVIDIA Container Toolkit。

<Warning>
**Docker-out-of-Docker (DooD) 限制**

如果你將 OpenClaw Gateway 本身部署為 Docker 容器，它會使用主機的 Docker socket 編排同層沙盒容器（DooD）。這會引入特定的路徑對應限制：

- **設定需要主機路徑**：`openclaw.json` 的 `workspace` 設定必須包含**主機的絕對路徑**（例如 `/home/user/.openclaw/workspaces`），而不是 Gateway 容器內部路徑。當 OpenClaw 要求 Docker daemon 產生沙盒時，daemon 會相對於主機作業系統 namespace 評估路徑，而不是 Gateway namespace。
- **檔案系統橋接一致性（相同磁碟區對應）**：OpenClaw Gateway 原生程序也會將 Heartbeat 和橋接檔案寫入 `workspace` 目錄。因為 Gateway 會從自己的容器化環境內評估完全相同的字串（主機路徑），所以 Gateway 部署必須包含相同的磁碟區對應，以原生方式連結主機 namespace（`-v /home/user/.openclaw:/home/user/.openclaw`）。

如果你在內部對應路徑而沒有絕對主機一致性，OpenClaw 會在容器環境內嘗試寫入其 Heartbeat 時原生拋出 `EACCES` 權限錯誤，因為完整限定路徑字串在原生環境中不存在。
</Warning>

### SSH 後端

當你希望 OpenClaw 在任何可透過 SSH 存取的機器上沙盒化 `exec`、檔案工具和媒體讀取時，請使用 `backend: "ssh"`。

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
    - OpenClaw 會在 `sandbox.ssh.workspaceRoot` 下建立每個範圍的遠端根目錄。
    - 在建立或重新建立後首次使用時，OpenClaw 會從本機工作區將該遠端工作區播種一次。
    - 之後，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒體讀取，以及傳入媒體暫存都會直接透過 SSH 對遠端工作區執行。
    - OpenClaw 不會自動將遠端變更同步回本機工作區。

  </Accordion>
  <Accordion title="驗證材料">
    - `identityFile`、`certificateFile`、`knownHostsFile`：使用既有本機檔案，並透過 OpenSSH 設定傳遞。
    - `identityData`、`certificateData`、`knownHostsData`：使用行內字串或 SecretRefs。OpenClaw 會透過一般秘密執行階段快照解析它們，將其以 `0600` 寫入暫存檔，並在 SSH 工作階段結束時刪除。
    - 如果同一項目同時設定 `*File` 和 `*Data`，該 SSH 工作階段會以 `*Data` 優先。

  </Accordion>
  <Accordion title="遠端為準的後果">
    這是**遠端為準**模型。初始播種後，遠端 SSH 工作區會成為實際的沙盒狀態。

    - 播種步驟之後，在 OpenClaw 外部進行的主機本機編輯，直到重新建立沙盒前都不會在遠端可見。
    - `openclaw sandbox recreate` 會刪除每個範圍的遠端根目錄，並在下次使用時再次從本機播種。
    - SSH 後端不支援瀏覽器沙盒化。
    - `sandbox.docker.*` 設定不適用於 SSH 後端。

  </Accordion>
</AccordionGroup>

### OpenShell 後端

當你希望 OpenClaw 在 OpenShell 管理的遠端環境中沙盒化工具時，請使用 `backend: "openshell"`。完整設定指南、設定參考與工作區模式比較，請參閱專門的 [OpenShell 頁面](/zh-TW/gateway/openshell)。

OpenShell 會重用與通用 SSH 後端相同的核心 SSH 傳輸與遠端檔案系統橋接，並加入 OpenShell 專用生命週期（`sandbox create/get/delete`、`sandbox ssh-config`）以及選用的 `mirror` 工作區模式。

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

- `mirror`（預設）：本機工作區維持為準。OpenClaw 會在 exec 前將本機檔案同步到 OpenShell，並在 exec 後將遠端工作區同步回來。
- `remote`：沙盒建立後，OpenShell 工作區即為準。OpenClaw 會從本機工作區將遠端工作區播種一次，然後檔案工具和 exec 會直接對遠端沙盒執行，而不會將變更同步回來。

<AccordionGroup>
  <Accordion title="遠端傳輸詳細資料">
    - OpenClaw 會透過 `openshell sandbox ssh-config <name>` 向 OpenShell 要求沙盒專用 SSH 設定。
    - 核心會將該 SSH 設定寫入暫存檔、開啟 SSH 工作階段，並重用 `backend: "ssh"` 所使用的相同遠端檔案系統橋接。
    - 僅在 `mirror` 模式中，生命週期有所不同：在 exec 前將本機同步到遠端，然後在 exec 後同步回來。

  </Accordion>
  <Accordion title="目前 OpenShell 限制">
    - 尚未支援沙盒瀏覽器
    - OpenShell 後端不支援 `sandbox.docker.binds`
    - `sandbox.docker.*` 下的 Docker 專用執行階段調整項目仍僅適用於 Docker 後端

  </Accordion>
</AccordionGroup>

#### 工作區模式

OpenShell 有兩種工作區模型。這是在實務上最重要的部分。

<Tabs>
  <Tab title="mirror（本機為準）">
    當你希望**本機工作區維持為準**時，請使用 `plugins.entries.openshell.config.mode: "mirror"`。

    行為：

    - 在 `exec` 前，OpenClaw 會將本機工作區同步到 OpenShell 沙盒。
    - 在 `exec` 後，OpenClaw 會將遠端工作區同步回本機工作區。
    - 檔案工具仍會透過沙盒橋接運作，但本機工作區會在各回合之間維持為資料來源。

    適用情境：

    - 你在 OpenClaw 外部本機編輯檔案，並希望那些變更自動出現在沙盒中
    - 你希望 OpenShell 沙盒的行為盡可能接近 Docker 後端
    - 你希望主機工作區在每次 exec 回合後反映沙盒寫入

    取捨：exec 前後會有額外的同步成本。

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    當你希望 **OpenShell 工作區成為標準來源**時，使用 `plugins.entries.openshell.config.mode: "remote"`。

    行為：

    - 首次建立沙盒時，OpenClaw 會從本機工作區將遠端工作區初始化一次。
    - 之後，`exec`、`read`、`write`、`edit` 和 `apply_patch` 會直接對遠端 OpenShell 工作區操作。
    - OpenClaw 不會在 exec 後將遠端變更同步回本機工作區。
    - 提示期間的媒體讀取仍可運作，因為檔案和媒體工具會透過沙盒橋接讀取，而不是假設本機主機路徑。
    - 傳輸方式是透過 SSH 進入 `openshell sandbox ssh-config` 回傳的 OpenShell 沙盒。

    重要影響：

    - 如果你在初始化步驟後，在 OpenClaw 外部的主機上編輯檔案，遠端沙盒**不會**自動看到那些變更。
    - 如果重新建立沙盒，遠端工作區會再次從本機工作區初始化。
    - 使用 `scope: "agent"` 或 `scope: "shared"` 時，該遠端工作區會在相同範圍內共用。

    適用情境：

    - 沙盒應主要位於遠端 OpenShell 端
    - 你希望降低每回合的同步開銷
    - 你不希望主機本機編輯靜默覆寫遠端沙盒狀態

  </Tab>
</Tabs>

如果你把沙盒視為暫時的執行環境，請選擇 `mirror`。如果你把沙盒視為真正的工作區，請選擇 `remote`。

#### OpenShell 生命週期

OpenShell 沙盒仍透過一般沙盒生命週期管理：

- `openclaw sandbox list` 會顯示 OpenShell runtime 以及 Docker runtime
- `openclaw sandbox recreate` 會刪除目前的 runtime，並讓 OpenClaw 在下次使用時重新建立
- prune 邏輯也能感知後端

對於 `remote` 模式，重新建立尤其重要：

- recreate 會刪除該範圍的標準遠端工作區
- 下一次使用時，會從本機工作區初始化新的遠端工作區

對於 `mirror` 模式，recreate 主要是重設遠端執行環境，因為本機工作區無論如何仍是標準來源。

## 工作區存取

`agents.defaults.sandbox.workspaceAccess` 控制**沙盒可以看到什麼**：

<Tabs>
  <Tab title="none (default)">
    工具會看到位於 `~/.openclaw/sandboxes` 下的沙盒工作區。
  </Tab>
  <Tab title="ro">
    以唯讀方式將代理工作區掛載到 `/agent`（停用 `write`/`edit`/`apply_patch`）。
  </Tab>
  <Tab title="rw">
    以讀寫方式將代理工作區掛載到 `/workspace`。
  </Tab>
</Tabs>

使用 OpenShell 後端時：

- `mirror` 模式仍在 exec 回合之間使用本機工作區作為標準來源
- `remote` 模式在初始初始化後，使用遠端 OpenShell 工作區作為標準來源
- `workspaceAccess: "ro"` 和 `"none"` 仍以相同方式限制寫入行為

傳入媒體會複製到作用中的沙盒工作區（`media/inbound/*`）。

<Note>
**Skills 注意事項：**`read` 工具以沙盒根目錄為基準。使用 `workspaceAccess: "none"` 時，OpenClaw 會將符合條件的 skills 鏡像到沙盒工作區（`.../skills`），以便讀取。使用 `"rw"` 時，可從 `/workspace/skills` 讀取工作區 skills。
</Note>

## 自訂繫結掛載

`agents.defaults.sandbox.docker.binds` 會將額外的主機目錄掛載到容器中。格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全域和每代理的 binds 會**合併**（而不是取代）。在 `scope: "shared"` 下，每代理 binds 會被忽略。

`agents.defaults.sandbox.browser.binds` 只會將額外的主機目錄掛載到**沙盒瀏覽器**容器中。

- 設定時（包括 `[]`），它會取代瀏覽器容器的 `agents.defaults.sandbox.docker.binds`。
- 省略時，瀏覽器容器會退回使用 `agents.defaults.sandbox.docker.binds`（向後相容）。

範例（唯讀來源 + 額外資料目錄）：

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
**Bind 安全性**

- Binds 會繞過沙盒檔案系統：它們會以你設定的模式（`:ro` 或 `:rw`）暴露主機路徑。
- OpenClaw 會封鎖危險的 bind 來源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`，以及會暴露它們的父掛載）。
- OpenClaw 也會封鎖常見的家目錄憑證根目錄，例如 `~/.aws`、`~/.cargo`、`~/.config`、`~/.docker`、`~/.gnupg`、`~/.netrc`、`~/.npm` 和 `~/.ssh`。
- Bind 驗證不只是字串比對。OpenClaw 會正規化來源路徑，然後透過最深的既有祖先再次解析它，再重新檢查被封鎖的路徑和允許的根目錄。
- 這表示即使最終葉節點尚不存在，符號連結父層逸出仍會安全失敗。例如：如果 `run-link` 指向 `/var/run/...`，`/workspace/run-link/new-file` 仍會解析為 `/var/run/...`。
- 允許的來源根目錄也會以相同方式標準化，因此即使某個路徑在符號連結解析前看似位於允許清單內，仍會因 `outside allowed roots` 被拒絕。
- 敏感掛載（秘密、SSH 金鑰、服務憑證）除非絕對必要，否則應使用 `:ro`。
- 如果你只需要工作區的讀取存取權，請搭配 `workspaceAccess: "ro"`；bind 模式仍是獨立的。
- 請參閱 [Sandbox vs Tool Policy vs Elevated](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)，了解 binds 如何與工具政策和提升權限 exec 互動。

</Warning>

## 映像檔與設定

預設 Docker 映像檔：`openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Build the default image">
    ```bash
    scripts/sandbox-setup.sh
    ```

    預設映像檔不包含 Node。如果某個 skill 需要 Node（或其他 runtime），請建立自訂映像檔，或透過 `sandbox.docker.setupCommand` 安裝（需要網路輸出 + 可寫入根目錄 + root 使用者）。

    當 `openclaw-sandbox:bookworm-slim` 遺失時，OpenClaw 不會靜默替換成純 `debian:bookworm-slim`。以預設映像檔為目標的沙盒執行會快速失敗並顯示建置指示，直到你執行 `scripts/sandbox-setup.sh`，因為內建映像檔帶有供沙盒 write/edit 輔助程式使用的 `python3`。

  </Step>
  <Step title="Optional: build the common image">
    如需包含常用工具（例如 `curl`、`jq`、`nodejs`、`python3`、`git`）且功能較完整的沙盒映像檔：

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    然後將 `agents.defaults.sandbox.docker.image` 設為 `openclaw-sandbox-common:bookworm-slim`。

  </Step>
  <Step title="Optional: build the sandbox browser image">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

預設情況下，Docker 沙盒容器執行時**沒有網路**。可使用 `agents.defaults.sandbox.docker.network` 覆寫。

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    內建沙盒瀏覽器映像檔也會對容器化工作負載套用保守的 Chromium 啟動預設值。目前容器預設值包括：

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
    - 三個圖形強化旗標（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）是可選的，當容器缺少 GPU 支援時很有用。如果你的工作負載需要 WebGL 或其他 3D/瀏覽器功能，請設定 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
    - `--disable-extensions` 預設啟用；對於依賴擴充功能的流程，可使用 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 停用。
    - `--renderer-process-limit=2` 由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 會保留 Chromium 的預設值。

    如果你需要不同的 runtime 設定檔，請使用自訂瀏覽器映像檔並提供自己的進入點。對於本機（非容器）Chromium 設定檔，請使用 `browser.extraArgs` 附加額外啟動旗標。

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` 會被封鎖。
    - `network: "container:<id>"` 預設會被封鎖（命名空間加入繞過風險）。
    - 緊急覆寫：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

  </Accordion>
</AccordionGroup>

Docker 安裝和容器化 Gateway 位於此處：[Docker](/zh-TW/install/docker)

對於 Docker Gateway 部署，`scripts/docker/setup.sh` 可以啟動沙盒設定。設定 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）以啟用該路徑。你可以使用 `OPENCLAW_DOCKER_SOCKET` 覆寫 socket 位置。完整設定與環境參考：[Docker](/zh-TW/install/docker#agent-sandbox)。

## setupCommand（一次性容器設定）

`setupCommand` 會在建立沙盒容器後**執行一次**（不是每次執行都執行）。它會透過 `sh -lc` 在容器內執行。

路徑：

- 全域：`agents.defaults.sandbox.docker.setupCommand`
- 每代理：`agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Common pitfalls">
    - 預設 `docker.network` 是 `"none"`（無輸出），因此套件安裝會失敗。
    - `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，且僅限緊急使用。
    - `readOnlyRoot: true` 會阻止寫入；請設定 `readOnlyRoot: false` 或建立自訂映像檔。
    - 套件安裝的 `user` 必須是 root（省略 `user` 或設定 `user: "0:0"`）。
    - 沙盒 exec 不會繼承主機 `process.env`。請為 skill API 金鑰使用 `agents.defaults.sandbox.docker.env`（或自訂映像檔）。

  </Accordion>
</AccordionGroup>

## 工具政策與逃生通道

工具允許/拒絕政策仍會先於沙盒規則套用。如果某個工具在全域或每代理層級被拒絕，沙盒化不會將它帶回來。

`tools.elevated` 是明確的逃生通道，會在沙盒外執行 `exec`（預設為 `gateway`，或當 exec 目標是 `node` 時為 `node`）。`/exec` 指令只會套用於已授權的傳送者，並在每個工作階段中持續存在；若要硬性停用 `exec`，請使用工具政策拒絕（請參閱 [Sandbox vs Tool Policy vs Elevated](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)）。

除錯：

- 使用 `openclaw sandbox explain` 檢查有效的沙盒模式、工具政策和修復設定鍵。
- 請參閱 [Sandbox vs Tool Policy vs Elevated](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated)，了解「為什麼這被封鎖？」的思考模型。

保持鎖定。

## 多代理覆寫

每個代理都可以覆寫沙盒 + 工具：`agents.list[].sandbox` 和 `agents.list[].tools`（加上用於沙盒工具政策的 `agents.list[].tools.sandbox.tools`）。請參閱 [Multi-Agent Sandbox & Tools](/zh-TW/tools/multi-agent-sandbox-tools) 了解優先順序。

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

- [多代理沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools) — 每個代理的覆寫與優先順序
- [OpenShell](/zh-TW/gateway/openshell) — 受管理的沙盒後端設定、工作區模式與設定參考
- [沙盒設定](/zh-TW/gateway/config-agents#agentsdefaultssandbox)
- [沙盒與工具政策與提權的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) — 偵錯「為什麼這被封鎖？」
- [安全性](/zh-TW/gateway/security)
