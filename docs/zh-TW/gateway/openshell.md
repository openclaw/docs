---
read_when:
    - 你想要雲端管理的沙盒，而不是本機 Docker
    - 你正在設定 OpenShell 外掛
    - 你需要在鏡像與遠端工作區模式之間選擇
summary: 使用 OpenShell 作為 OpenClaw agent 的受管理沙箱後端
title: OpenShell
x-i18n:
    generated_at: "2026-07-05T11:19:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell 是受管理的沙箱後端：OpenClaw 不在本機執行 Docker 容器，而是將沙箱生命週期委派給 `openshell` 命令列介面，由它佈建遠端環境並透過 SSH 執行命令。

此外掛會重用與通用 [SSH 後端](/zh-TW/gateway/sandboxing#ssh-backend) 相同的 SSH 傳輸與遠端檔案系統橋接，並加入 OpenShell 生命週期（`sandbox create/get/delete/ssh-config`）以及選用的 `mirror` 工作區同步模式。

## 先決條件

- 已安裝 OpenShell 外掛（`openclaw plugins install @openclaw/openshell-sandbox`）
- `openshell` 命令列介面位於 `PATH` 上（或透過
  `plugins.entries.openshell.config.command` 指定自訂路徑）
- 具備沙箱存取權的 OpenShell 帳戶
- OpenClaw 閘道正在主機上執行

## 快速開始

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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
          mode: "remote",
        },
      },
    },
  },
}
```

重新啟動閘道。在下一次代理程式回合中，OpenClaw 會建立 OpenShell 沙箱，並透過它路由工具執行。使用以下命令驗證：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作區模式

這是最重要的 OpenShell 決策。

### mirror（預設）

`plugins.entries.openshell.config.mode: "mirror"` 會讓**本機工作區成為標準來源**：

- 在 `exec` 之前，OpenClaw 會將本機工作區同步到沙箱。
- 在 `exec` 之後，OpenClaw 會將遠端工作區同步回本機。
- 檔案工具會經由沙箱橋接，但在各回合之間，本機仍是真實來源。

最適合開發工作流程：OpenClaw 之外的本機編輯會在下一次 exec 顯示，而沙箱的行為接近 Docker 後端。

取捨：每個 exec 回合都有上傳與下載成本。

### remote

`mode: "remote"` 會讓 **OpenShell 工作區成為標準來源**：

- 首次建立沙箱時，OpenClaw 會從本機對遠端工作區進行一次初始填入。
- 之後，`exec`、`read`、`write`、`edit` 和 `apply_patch` 都會直接在遠端工作區上運作。OpenClaw **不會** 將遠端變更同步回本機。
- 提示詞階段的媒體讀取仍可運作（檔案／媒體工具會透過沙箱橋接讀取）。

最適合長時間執行的代理程式與 CI：每回合開銷較低，而且主機本機編輯不會悄悄覆蓋遠端狀態。

<Warning>
初始填入後，在 OpenClaw 之外於主機上編輯檔案，遠端沙箱將無法看見。請執行 `openclaw sandbox recreate` 以重新填入。
</Warning>

### 選擇模式

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **標準工作區**           | 本機主機                   | 遠端 OpenShell            |
| **同步方向**             | 雙向（每次 exec）          | 一次性初始填入            |
| **每回合開銷**           | 較高（上傳 + 下載）        | 較低（直接遠端操作）      |
| **本機編輯可見？**       | 是，在下一次 exec          | 否，直到重新建立          |
| **最適合**               | 開發工作流程               | 長時間執行的代理程式、CI  |

## 設定參考

所有 OpenShell 設定都位於 `plugins.entries.openshell.config` 下：

| 鍵                       | 類型                     | 預設值       | 說明                                                                            |
| ------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作區同步模式                                                                    |
| `command`                 | `string`                 | `"openshell"` | `openshell` 命令列介面的路徑或名稱                                                    |
| `from`                    | `string`                 | `"openclaw"`  | 首次建立時的沙盒來源                                                   |
| `gateway`                 | `string`                 | 未設定         | OpenShell 閘道名稱（頂層 `--gateway`）                                         |
| `gatewayEndpoint`         | `string`                 | 未設定         | OpenShell 閘道端點（頂層 `--gateway-endpoint`）                            |
| `policy`                  | `string`                 | 未設定         | 用於建立沙盒的 OpenShell 政策 ID                                               |
| `providers`               | `string[]`               | `[]`          | 建立沙盒時附加的提供者名稱（已去重，每個項目一個 `--provider` 旗標） |
| `gpu`                     | `boolean`                | `false`       | 要求 GPU 資源（`--gpu`）                                                        |
| `autoProviders`           | `boolean`                | `true`        | 建立期間傳遞 `--auto-providers`（或為 false 時傳遞 `--no-auto-providers`）            |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙盒內的主要可寫入工作區                                          |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 代理工作區掛載路徑（當工作區存取不是 `rw` 時為唯讀）               |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` 命令列介面操作的逾時時間                                                 |

`remoteWorkspaceDir` 和 `remoteAgentWorkspaceDir` 必須是絕對路徑，且
必須位於受管理根目錄 `/sandbox` 或 `/agent` 之下；其他絕對路徑會被
拒絕。

沙盒層級設定（`mode`、`scope`、`workspaceAccess`）和任何後端一樣位於
`agents.defaults.sandbox` 下。完整矩陣請參閱
[沙盒化](/zh-TW/gateway/sandboxing)。

## 範例

### 最小遠端設定

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### 使用 GPU 的鏡像模式

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
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
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### 使用自訂閘道的逐代理 OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## 生命週期管理

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

對於 `remote` 模式，重新建立尤其重要：它會刪除該範圍的標準
遠端工作區，下一次使用時會從本機植入新的工作區。
對於 `mirror` 模式，由於本機仍是標準來源，重新建立主要是重設遠端執行
環境。

變更以下任何項目後請重新建立：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## 安全強化

鏡像模式檔案系統橋接會固定本機工作區根目錄，並在每次讀取、寫入、mkdir、移除和
重新命名前重新檢查標準路徑（透過 realpath），拒絕路徑中間的符號連結。
符號連結置換或重新掛載的工作區無法將檔案存取重新導向到鏡像樹之外。

## 目前限制

- OpenShell 後端不支援沙盒瀏覽器。
- `sandbox.docker.binds` 不適用於 OpenShell；如果設定了 binds，沙盒建立會失敗。
- `sandbox.docker.*` 下的 Docker 專屬執行階段旋鈕（`env` 除外）
  僅適用於 Docker 後端。

## 運作方式

1. OpenClaw 針對沙盒名稱執行 `sandbox get`（搭配任何已設定的
   `--gateway`/`--gateway-endpoint`）；如果失敗，則使用
   `sandbox create` 建立沙盒，並在設定時傳遞 `--name`、`--from`、`--policy`，啟用時傳遞 `--gpu`，
   傳遞 `--auto-providers`/`--no-auto-providers`，以及每個已設定提供者各一個
   `--provider` 旗標。
2. OpenClaw 針對沙盒名稱執行 `sandbox ssh-config`，以擷取 SSH
   連線詳細資料。
3. 核心會將 SSH 設定寫入暫存檔，並透過與通用 SSH 後端相同的遠端檔案系統橋接
   開啟 SSH 工作階段。
4. 在 `mirror` 模式中：執行前將本機同步到遠端，執行，然後再同步回來。
5. 在 `remote` 模式中：建立時植入一次，之後直接在遠端
   工作區上操作。

## 相關內容

- [沙盒化](/zh-TW/gateway/sandboxing) - 模式、範圍與後端比較
- [沙盒與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) - 偵錯被封鎖的工具
- [多代理沙盒與工具](/zh-TW/tools/multi-agent-sandbox-tools) - 逐代理覆寫
- [沙盒命令列介面](/zh-TW/cli/sandbox) - `openclaw sandbox` 命令
