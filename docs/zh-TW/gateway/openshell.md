---
read_when:
    - 您想要使用雲端代管的沙盒，而不是本機 Docker
    - 您正在設定 OpenShell Plugin
    - 你需要選擇鏡像模式或遠端工作區模式
summary: 使用 OpenShell 作為 OpenClaw 代理的受管理沙盒後端
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T03:08:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell 是 OpenClaw 的受管沙盒後端。OpenClaw 不在本機執行 Docker
容器，而是將沙盒生命週期委派給 `openshell` CLI，由它透過 SSH 型命令執行佈建遠端環境。

OpenShell Plugin 重複使用與通用 [SSH 後端](/zh-TW/gateway/sandboxing#ssh-backend)相同的核心 SSH 傳輸和遠端檔案系統橋接。它新增了
OpenShell 專屬生命週期（`sandbox create/get/delete`、`sandbox ssh-config`）
以及可選的 `mirror` 工作區模式。

## 先決條件

- 已安裝 `openshell` CLI 並位於 `PATH` 上（或透過
  `plugins.entries.openshell.config.command` 設定自訂路徑）
- 具備沙盒存取權的 OpenShell 帳戶
- OpenClaw Gateway 在主機上執行中

## 快速開始

1. 啟用 Plugin 並設定沙盒後端：

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

2. 重新啟動 Gateway。在下一次 agent 回合中，OpenClaw 會建立 OpenShell
   沙盒，並透過它路由工具執行。

3. 驗證：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作區模式

這是使用 OpenShell 時最重要的決策。

### `mirror`

當你想讓**本機工作區保持為標準來源**時，請使用
`plugins.entries.openshell.config.mode: "mirror"`。

行為：

- 在 `exec` 之前，OpenClaw 會將本機工作區同步到 OpenShell 沙盒。
- 在 `exec` 之後，OpenClaw 會將遠端工作區同步回本機工作區。
- 檔案工具仍會透過沙盒橋接運作，但本機工作區在回合之間仍是事實來源。

最適合：

- 你在 OpenClaw 外部於本機編輯檔案，並希望這些變更自動出現在沙盒中。
- 你希望 OpenShell 沙盒的行為盡可能接近 Docker 後端。
- 你希望主機工作區在每個 exec 回合後反映沙盒寫入。

取捨：每次 exec 前後都會有額外同步成本。

### `remote`

當你想讓 **OpenShell 工作區成為標準來源**時，請使用
`plugins.entries.openshell.config.mode: "remote"`。

行為：

- 第一次建立沙盒時，OpenClaw 會從本機工作區一次性植入遠端工作區。
- 之後，`exec`、`read`、`write`、`edit` 和 `apply_patch` 會直接對遠端 OpenShell 工作區運作。
- OpenClaw **不會**將遠端變更同步回本機工作區。
- 提示時的媒體讀取仍可運作，因為檔案和媒體工具會透過沙盒橋接讀取。

最適合：

- 沙盒應主要存在於遠端端。
- 你想降低每回合的同步開銷。
- 你不希望主機本機編輯在未明示的情況下覆寫遠端沙盒狀態。

<Warning>
如果你在初始植入後於 OpenClaw 外部在主機上編輯檔案，遠端沙盒**不會**看到那些變更。請使用 `openclaw sandbox recreate` 重新植入。
</Warning>

### 選擇模式

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **標準工作區**           | 本機主機                   | 遠端 OpenShell            |
| **同步方向**             | 雙向（每次 exec）          | 一次性植入                |
| **每回合開銷**           | 較高（上傳 + 下載）        | 較低（直接遠端操作）      |
| **本機編輯可見嗎？**     | 是，下一次 exec 時         | 否，直到重新建立          |
| **最適合**               | 開發工作流程               | 長時間執行的 agent、CI    |

## 設定參考

所有 OpenShell 設定都位於 `plugins.entries.openshell.config` 下：

| 鍵                        | 類型                     | 預設值        | 說明                                                  |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作區同步模式                                        |
| `command`                 | `string`                 | `"openshell"` | `openshell` CLI 的路徑或名稱                          |
| `from`                    | `string`                 | `"openclaw"`  | 首次建立時的沙盒來源                                  |
| `gateway`                 | `string`                 | —             | OpenShell gateway 名稱（`--gateway`）                 |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell gateway 端點 URL（`--gateway-endpoint`）    |
| `policy`                  | `string`                 | —             | 用於建立沙盒的 OpenShell 原則 ID                      |
| `providers`               | `string[]`               | `[]`          | 建立沙盒時要附加的提供者名稱                          |
| `gpu`                     | `boolean`                | `false`       | 要求 GPU 資源                                         |
| `autoProviders`           | `boolean`                | `true`        | 建立沙盒時傳遞 `--auto-providers`                     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙盒內主要可寫工作區                                  |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Agent 工作區掛載路徑（用於唯讀存取）                  |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` CLI 操作的逾時時間                        |

沙盒層級設定（`mode`、`scope`、`workspaceAccess`）和任何後端一樣，在
`agents.defaults.sandbox` 下設定。完整矩陣請參閱
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

### 搭配 GPU 的 Mirror 模式

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

### 使用自訂 Gateway 的每 agent OpenShell

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

OpenShell 沙盒透過一般沙盒 CLI 管理：

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

對於 `remote` 模式，**重新建立尤其重要**：它會刪除該範圍的標準遠端工作區。下一次使用時，會從本機工作區植入全新的遠端工作區。

對於 `mirror` 模式，重新建立主要是重設遠端執行環境，因為本機工作區仍是標準來源。

### 何時重新建立

變更下列任何項目後請重新建立：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 安全強化

OpenShell 會固定工作區根 fd，並在每次讀取前重新檢查沙盒身分，因此符號連結替換或重新掛載的工作區無法將讀取重新導向到預期遠端工作區之外。

## 目前限制

- OpenShell 後端不支援沙盒瀏覽器。
- `sandbox.docker.binds` 不適用於 OpenShell。
- `sandbox.docker.*` 下的 Docker 專屬執行階段旋鈕只適用於 Docker
  後端。

## 運作方式

1. OpenClaw 呼叫 `openshell sandbox create`（依設定使用 `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` 旗標）。
2. OpenClaw 呼叫 `openshell sandbox ssh-config <name>` 取得沙盒的 SSH 連線詳細資訊。
3. Core 將 SSH 設定寫入暫存檔，並使用與通用 SSH 後端相同的遠端檔案系統橋接開啟 SSH 工作階段。
4. 在 `mirror` 模式中：exec 前從本機同步到遠端，執行，exec 後同步回來。
5. 在 `remote` 模式中：建立時植入一次，然後直接在遠端工作區上操作。

## 相關

- [沙盒化](/zh-TW/gateway/sandboxing) -- 模式、範圍與後端比較
- [沙盒 vs 工具原則 vs 提權](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) -- 偵錯被封鎖的工具
- [多 Agent 沙盒和工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每 agent 覆寫
- [沙盒 CLI](/zh-TW/cli/sandbox) -- `openclaw sandbox` 命令
