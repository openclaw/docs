---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: 管理沙盒執行環境並檢查實際生效的沙盒政策
title: 沙盒 CLI
x-i18n:
    generated_at: "2026-04-30T02:55:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

管理用於隔離代理程式執行的沙盒執行環境。

## 概覽

OpenClaw 可以在隔離的沙盒執行環境中執行代理程式，以提升安全性。`sandbox` 命令可協助你在更新或設定變更後檢查並重新建立這些執行環境。

目前通常是指：

- Docker 沙盒容器
- 當 `agents.defaults.sandbox.backend = "ssh"` 時的 SSH 沙盒執行環境
- 當 `agents.defaults.sandbox.backend = "openshell"` 時的 OpenShell 沙盒執行環境

對於 `ssh` 和 OpenShell `remote`，重新建立比 Docker 更重要：

- 初始種子建立後，遠端工作區就是權威來源
- `openclaw sandbox recreate` 會刪除所選範圍的權威遠端工作區
- 下次使用時會從目前的本機工作區再次建立種子

## 命令

### `openclaw sandbox explain`

檢查**有效的**沙盒模式／範圍／工作區存取、沙盒工具政策，以及提升權限閘門（含修正用設定鍵路徑）。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

列出所有沙盒執行環境及其狀態和設定。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**輸出包含：**

- 執行環境名稱和狀態
- 後端（`docker`、`openshell` 等）
- 設定標籤，以及它是否符合目前設定
- 年齡（自建立以來的時間）
- 閒置時間（自上次使用以來的時間）
- 關聯的工作階段／代理程式

### `openclaw sandbox recreate`

移除沙盒執行環境，以強制使用更新後的設定重新建立。

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**選項：**

- `--all`：重新建立所有沙盒容器
- `--session <key>`：重新建立特定工作階段的容器
- `--agent <id>`：重新建立特定代理程式的容器
- `--browser`：只重新建立瀏覽器容器
- `--force`：略過確認提示

<Note>
執行環境會在代理程式下次使用時自動重新建立。
</Note>

## 使用情境

### 更新 Docker 映像後

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### 變更沙盒設定後

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### 變更 SSH 目標或 SSH 驗證資料後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

對於核心 `ssh` 後端，重新建立會刪除 SSH 目標上每個範圍的遠端工作區根目錄。下一次執行會從本機工作區再次建立種子。

### 變更 OpenShell 來源、政策或模式後

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

對於 OpenShell `remote` 模式，重新建立會刪除該範圍的權威遠端工作區。下一次執行會從本機工作區再次建立種子。

### 變更 setupCommand 後

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### 僅針對特定代理程式

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## 為什麼需要這個功能

當你更新沙盒設定時：

- 現有執行環境會繼續以舊設定執行。
- 執行環境只會在閒置 24 小時後被清除。
- 經常使用的代理程式會讓舊執行環境無限期維持存活。

使用 `openclaw sandbox recreate` 強制移除舊執行環境。下次需要時，它們會使用目前設定自動重新建立。

<Tip>
建議使用 `openclaw sandbox recreate`，而不是手動執行特定後端的清理。它會使用 Gateway 的執行環境登錄檔，並避免在範圍或工作階段鍵變更時發生不一致。
</Tip>

## 設定

沙盒設定位於 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 底下（每個代理程式的覆寫設定放在 `agents.list[].sandbox`）：

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## 相關

- [CLI 參考](/zh-TW/cli)
- [沙盒化](/zh-TW/gateway/sandboxing)
- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [Doctor](/zh-TW/gateway/doctor)：檢查沙盒設定。
