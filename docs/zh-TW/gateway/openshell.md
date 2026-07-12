---
read_when:
    - 您想使用雲端管理的沙箱，而非本機 Docker
    - 您正在設定 OpenShell 外掛
    - 您需要在鏡像與遠端工作區模式之間做選擇
summary: 使用 OpenShell 作為 OpenClaw 代理程式的受管理沙箱後端
title: OpenShell
x-i18n:
    generated_at: "2026-07-11T21:23:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell 是受管理的沙箱後端：OpenClaw 不在本機執行 Docker 容器，
而是將沙箱生命週期委派給 `openshell` 命令列介面，由其佈建遠端環境並透過 SSH 執行命令。

此外掛重複使用與通用 [SSH 後端](/zh-TW/gateway/sandboxing#ssh-backend) 相同的 SSH 傳輸與遠端檔案系統橋接器，並加入 OpenShell
生命週期管理（`sandbox create/get/delete/ssh-config`），以及可選的 `mirror`
工作區同步模式。

## 先決條件

- 已安裝 OpenShell 外掛（`openclaw plugins install @openclaw/openshell-sandbox`）
- `PATH` 中有 `openshell` 命令列介面（或透過
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

重新啟動閘道。在下一次代理程式回合中，OpenClaw 會建立 OpenShell
沙箱，並透過該沙箱路由工具執行。使用以下命令驗證：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作區模式

這是使用 OpenShell 時最重要的決策。

### mirror（預設）

`plugins.entries.openshell.config.mode: "mirror"` 會將**本機工作區設為標準來源**：

- 執行 `exec` 前，OpenClaw 會將本機工作區同步至沙箱。
- 執行 `exec` 後，OpenClaw 會將遠端工作區同步回本機。
- 檔案工具會經由沙箱橋接器運作，但在回合之間，本機仍是資料的標準來源。

最適合開發工作流程：在 OpenClaw 外部進行的本機編輯會在下一次執行時出現，而且沙箱的行為與 Docker 後端相近。

取捨：每次執行回合都會產生上傳與下載成本。

### remote

`mode: "remote"` 會將**OpenShell 工作區設為標準來源**：

- 首次建立沙箱時，OpenClaw 只會從本機植入遠端工作區一次。
- 此後，`exec`、`read`、`write`、`edit` 和 `apply_patch` 會直接在遠端工作區上運作。OpenClaw **不會**將遠端變更同步回本機。
- 提示詞處理期間的媒體讀取仍可運作（檔案／媒體工具會透過沙箱橋接器讀取）。

最適合長時間執行的代理程式與 CI：每回合的額外負擔較低，而且主機上的本機編輯不會在未察覺的情況下覆寫遠端狀態。

<Warning>
初始植入後，在 OpenClaw 外部編輯主機上的檔案，遠端沙箱將無法看見這些變更。請執行 `openclaw sandbox recreate` 以重新植入。
</Warning>

### 選擇模式

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **標準工作區**           | 本機主機                   | 遠端 OpenShell            |
| **同步方向**             | 雙向（每次執行）           | 一次性植入                |
| **每回合額外負擔**       | 較高（上傳與下載）         | 較低（直接遠端操作）      |
| **可看見本機編輯嗎？**   | 可以，下一次執行時         | 不行，直到重新建立        |
| **最適合**               | 開發工作流程               | 長時間執行的代理程式、CI  |

## 設定參考

所有 OpenShell 設定都位於 `plugins.entries.openshell.config`：

| 鍵                        | 類型                     | 預設值        | 說明                                                                                   |
| ------------------------- | ------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作區同步模式                                                                         |
| `command`                 | `string`                 | `"openshell"` | `openshell` 命令列介面的路徑或名稱                                                     |
| `from`                    | `string`                 | `"openclaw"`  | 首次建立時使用的沙箱來源                                                               |
| `gateway`                 | `string`                 | 未設定        | OpenShell 閘道名稱（頂層 `--gateway`）                                                  |
| `gatewayEndpoint`         | `string`                 | 未設定        | OpenShell 閘道端點（頂層 `--gateway-endpoint`）                                         |
| `policy`                  | `string`                 | 未設定        | 建立沙箱時使用的 OpenShell 原則 ID                                                      |
| `providers`               | `string[]`               | `[]`          | 建立沙箱時附加的提供者名稱（去除重複項目，每個項目使用一個 `--provider` 旗標）          |
| `gpu`                     | `boolean`                | `false`       | 請求 GPU 資源（`--gpu`）                                                               |
| `autoProviders`           | `boolean`                | `true`        | 建立期間傳入 `--auto-providers`（設為 false 時傳入 `--no-auto-providers`）              |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙箱內主要的可寫入工作區                                                               |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | 代理程式工作區掛載路徑（工作區存取權不是 `rw` 時為唯讀）                               |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` 命令列介面操作的逾時時間                                                    |

`remoteWorkspaceDir` 和 `remoteAgentWorkspaceDir` 必須是絕對路徑，且
位於受管理的根目錄 `/sandbox` 或 `/agent` 之下；其他絕對路徑會遭到拒絕。

沙箱層級的設定（`mode`、`scope`、`workspaceAccess`）與任何後端一樣，位於
`agents.defaults.sandbox` 下。完整對照表請參閱
[沙箱化](/zh-TW/gateway/sandboxing)。

## 範例

### 最小化遠端設定

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

### 使用 GPU 的 mirror 模式

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

### 使用自訂閘道的個別代理程式 OpenShell

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
# 列出所有沙箱執行環境（Docker + OpenShell）
openclaw sandbox list

# 檢查生效中的原則
openclaw sandbox explain

# 重新建立（刪除遠端工作區，並在下次使用時重新植入）
openclaw sandbox recreate --all
```

對於 `remote` 模式，重新建立尤其重要：它會刪除該範圍的標準遠端工作區，而下次使用時會從本機植入新的工作區。對於 `mirror` 模式，由於本機仍是標準來源，重新建立主要是重設遠端執行環境。

變更以下任何設定後，請重新建立：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## 安全性強化

mirror 模式的檔案系統橋接器會固定本機工作區根目錄，並在每次讀取、寫入、建立目錄、移除及重新命名前，重新檢查標準路徑（透過 realpath），拒絕路徑中途出現的符號連結。符號連結置換或重新掛載的工作區無法將檔案存取重新導向至鏡像樹狀結構之外。

## 目前限制

- OpenShell 後端不支援沙箱瀏覽器。
- `sandbox.docker.binds` 不適用於 OpenShell；若設定了繫結，沙箱建立會失敗。
- `sandbox.docker.*` 下的 Docker 專用執行環境選項（`env` 除外）僅適用於 Docker 後端。

## 運作方式

1. OpenClaw 針對沙箱名稱執行 `sandbox get`（並包含任何已設定的
   `--gateway`／`--gateway-endpoint`）；若失敗，則使用 `sandbox create`
   建立沙箱，傳入 `--name`、`--from`、已設定時的 `--policy`、啟用時的 `--gpu`、
   `--auto-providers`／`--no-auto-providers`，以及每個已設定提供者各一個
   `--provider` 旗標。
2. OpenClaw 針對沙箱名稱執行 `sandbox ssh-config`，以取得 SSH
   連線詳細資料。
3. 核心會將 SSH 設定寫入暫存檔，並透過與通用 SSH 後端相同的遠端檔案系統橋接器開啟 SSH 工作階段。
4. 在 `mirror` 模式中：執行前將本機同步至遠端，執行後再同步回本機。
5. 在 `remote` 模式中：建立時植入一次，之後直接在遠端工作區上操作。

## 相關內容

- [沙箱化](/zh-TW/gateway/sandboxing) - 模式、範圍與後端比較
- [沙箱、工具原則與提高權限的比較](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) - 偵錯遭封鎖的工具
- [多代理程式沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) - 個別代理程式覆寫
- [沙箱命令列介面](/zh-TW/cli/sandbox) - `openclaw sandbox` 命令
