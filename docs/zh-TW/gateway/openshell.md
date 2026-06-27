---
read_when:
    - 你想要雲端託管的沙盒，而不是本機 Docker
    - 你正在設定 OpenShell 外掛
    - 你需要在鏡像與遠端工作區模式之間選擇
summary: 使用 OpenShell 作為 OpenClaw 代理的受管理沙盒後端
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T19:20:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell 是 OpenClaw 的受管理沙箱後端。OpenClaw 不在本機執行 Docker
容器，而是將沙箱生命週期委派給 `openshell` 命令列介面，
由它佈建遠端環境，並透過 SSH 執行命令。

OpenShell 外掛重用與通用 [SSH 後端](/zh-TW/gateway/sandboxing#ssh-backend)相同的核心 SSH 傳輸與遠端檔案系統
橋接。它加入 OpenShell 專屬生命週期（`sandbox create/get/delete`、`sandbox ssh-config`）
以及選用的 `mirror` 工作區模式。

## 先決條件

- 已安裝 OpenShell 外掛（`openclaw plugins install @openclaw/openshell-sandbox`）
- 已安裝 `openshell` 命令列介面且位於 `PATH`（或透過
  `plugins.entries.openshell.config.command` 設定自訂路徑）
- 具備沙箱存取權的 OpenShell 帳戶
- OpenClaw 閘道正在主機上執行

## 快速開始

1. 安裝並啟用外掛，然後設定沙箱後端：

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

2. 重新啟動閘道。下一次 agent 回合時，OpenClaw 會建立 OpenShell
   沙箱，並透過它路由工具執行。

3. 驗證：

```bash
openclaw sandbox list
openclaw sandbox explain
```

## 工作區模式

這是使用 OpenShell 時最重要的決策。

### `mirror`

當你希望**本機工作區保持權威來源**時，使用 `plugins.entries.openshell.config.mode: "mirror"`。

行為：

- 在 `exec` 之前，OpenClaw 會將本機工作區同步到 OpenShell 沙箱。
- 在 `exec` 之後，OpenClaw 會將遠端工作區同步回本機工作區。
- 檔案工具仍透過沙箱橋接運作，但本機工作區在各回合之間
  仍是事實來源。

最適合：

- 你在 OpenClaw 之外於本機編輯檔案，並希望這些變更自動出現在
  沙箱中。
- 你希望 OpenShell 沙箱的行為盡可能接近 Docker 後端。
- 你希望主機工作區在每次 exec 回合後反映沙箱寫入。

取捨：每次 exec 前後都有額外同步成本。

### `remote`

當你希望 **OpenShell 工作區成為權威來源**時，使用 `plugins.entries.openshell.config.mode: "remote"`。

行為：

- 沙箱首次建立時，OpenClaw 會從本機工作區一次性植入遠端工作區。
- 之後，`exec`、`read`、`write`、`edit` 和 `apply_patch` 會
  直接針對遠端 OpenShell 工作區操作。
- OpenClaw **不會**將遠端變更同步回本機工作區。
- 提示期間的媒體讀取仍可運作，因為檔案與媒體工具會透過
  沙箱橋接讀取。

最適合：

- 沙箱應主要存在於遠端端。
- 你希望降低每回合的同步開銷。
- 你不希望主機本機編輯悄悄覆寫遠端沙箱狀態。

<Warning>
若你在初始植入後於 OpenClaw 之外的主機上編輯檔案，遠端沙箱**不會**看到那些變更。使用 `openclaw sandbox recreate` 重新植入。
</Warning>

### 選擇模式

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **權威工作區**  | 本機主機                 | 遠端 OpenShell          |
| **同步方向**       | 雙向（每次 exec）  | 一次性植入             |
| **每回合開銷**    | 較高（上傳 + 下載） | 較低（直接遠端操作） |
| **本機編輯可見？** | 是，下一次 exec          | 否，直到重新建立        |
| **最適合**             | 開發工作流程      | 長時間執行的 agent、CI   |

## 設定參考

所有 OpenShell 設定都位於 `plugins.entries.openshell.config` 之下：

| 鍵                       | 類型                     | 預設值       | 說明                                           |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`    | 工作區同步模式                                   |
| `command`                 | `string`                 | `"openshell"` | `openshell` 命令列介面的路徑或名稱                   |
| `from`                    | `string`                 | `"openclaw"`  | 首次建立時的沙箱來源                  |
| `gateway`                 | `string`                 | —             | OpenShell 閘道名稱（`--gateway`）                  |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell 閘道端點 URL（`--gateway-endpoint`） |
| `policy`                  | `string`                 | —             | 用於建立沙箱的 OpenShell 政策 ID              |
| `providers`               | `string[]`               | `[]`          | 建立沙箱時要附加的提供者名稱      |
| `gpu`                     | `boolean`                | `false`       | 要求 GPU 資源                                 |
| `autoProviders`           | `boolean`                | `true`        | 建立沙箱時傳遞 `--auto-providers`         |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | 沙箱內的主要可寫工作區         |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Agent 工作區掛載路徑（供唯讀存取）     |
| `timeoutSeconds`          | `number`                 | `120`         | `openshell` 命令列介面操作逾時                |

沙箱層級設定（`mode`、`scope`、`workspaceAccess`）與任何後端一樣，在
`agents.defaults.sandbox` 之下設定。完整矩陣請參閱
[沙箱](/zh-TW/gateway/sandboxing)。

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

### 搭配 GPU 的 mirror 模式

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

### 搭配自訂閘道的每 agent OpenShell

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

OpenShell 沙箱透過一般沙箱命令列介面管理：

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

對 `remote` 模式而言，**重新建立尤其重要**：它會刪除該範圍的權威
遠端工作區。下一次使用時會從本機工作區植入新的遠端工作區。

對 `mirror` 模式而言，重新建立主要是重設遠端執行環境，因為
本機工作區仍是權威來源。

### 何時重新建立

變更下列任一項後請重新建立：

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 安全性強化

OpenShell 會固定工作區根 fd，並在每次
讀取前重新檢查沙箱身分，因此符號連結置換或重新掛載的工作區無法將讀取重新導向到
預期遠端工作區之外。

## 目前限制

- OpenShell 後端不支援沙箱瀏覽器。
- `sandbox.docker.binds` 不適用於 OpenShell。
- `sandbox.docker.*` 之下的 Docker 專屬執行階段旋鈕只適用於 Docker
  後端。

## 運作方式

1. OpenClaw 會呼叫 `openshell sandbox create`（依設定帶入 `--from`、`--gateway`、
   `--policy`、`--providers`、`--gpu` 旗標）。
2. OpenClaw 會呼叫 `openshell sandbox ssh-config <name>` 以取得沙箱的 SSH 連線
   詳細資料。
3. 核心會將 SSH 設定寫入暫存檔，並使用與通用 SSH 後端相同的
   遠端檔案系統橋接開啟 SSH 工作階段。
4. 在 `mirror` 模式：exec 前先將本機同步到遠端，執行，exec 後再同步回來。
5. 在 `remote` 模式：建立時植入一次，之後直接在遠端
   工作區上操作。

## 相關

- [沙箱](/zh-TW/gateway/sandboxing) -- 模式、範圍與後端比較
- [沙箱與工具政策與提升權限](/zh-TW/gateway/sandbox-vs-tool-policy-vs-elevated) -- 除錯被封鎖的工具
- [多 Agent 沙箱與工具](/zh-TW/tools/multi-agent-sandbox-tools) -- 每 agent 覆寫
- [沙箱命令列介面](/zh-TW/cli/sandbox) -- `openclaw sandbox` 命令
